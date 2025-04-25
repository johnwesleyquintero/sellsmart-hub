#!/usr/bin/env node
// Package Management Script for WEScore
// Handles dependency updates, security audits, and version conflicts/duplicates

import chalk from 'chalk';
import { exec } from 'child_process';
import fs from 'fs';
import ora from 'ora';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// --- Configuration ---
const CONFIG = {
  // Check if dependencies in package.json use specific versions (no ^, ~)
  strictVersionPinning: false, // Set to true to enforce exact versions
  // Minimum audit level to report/fail on ('low', 'moderate', 'high', 'critical')
  auditLevel: 'high',
  // Generate a JSON report
  generateReport: true,
  // Report path
  reportPath: path.join(
    process.cwd(),
    '.wescore',
    'reports',
    'package-report.json',
  ),
  // Exclude devDependencies from outdated check (npm outdated --omit=dev)
  excludeDevDependenciesOutdated: false,
  // Exclude devDependencies from audit check (npm audit --omit=dev)
  excludeDevDependenciesAudit: false,
};

// --- Helper Functions ---

/**
 * Runs a shell command asynchronously.
 * Handles errors and potential non-zero exit codes that might still produce useful output (like npm audit/ls).
 * @param {string} command - The command to execute.
 * @param {string} description - Description for spinner.
 * @param {boolean} ignoreExitCode - If true, resolve even if exit code is non-zero (useful for audit/ls).
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function runCommand(command, description, ignoreExitCode = false) {
  const spinner = ora(description).start();
  try {
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 1024 * 1024 * 10, // Increase buffer size for potentially large output (like npm ls)
    });
    spinner.succeed(chalk.green(`${description} - Success`));
    return { stdout, stderr };
  } catch (error) {
    // 'error' here includes stdout and stderr if the process exited non-zero
    if (ignoreExitCode && error.stdout) {
      spinner.warn(
        chalk.yellow(
          `${description} - Completed with issues (exit code ${error.code})`,
        ),
      );
      // Return stdout even on error if ignoreExitCode is true
      return { stdout: error.stdout, stderr: error.stderr };
    } else {
      spinner.fail(chalk.red(`${description} - Failed`));
      console.error(chalk.red(`Error executing: ${command}`));
      console.error(chalk.red(`Exit Code: ${error.code}`));
      console.error(chalk.gray(`Stderr: ${error.stderr || 'N/A'}`));
      console.error(chalk.gray(`Stdout: ${error.stdout || 'N/A'}`));
      throw new Error(`Command failed: ${command}`); // Re-throw to stop execution
    }
  }
}

/**
 * Safely parses JSON, returning null on error.
 * @param {string} jsonString - The JSON string to parse.
 * @param {string} context - Description for error messages.
 * @returns {object | null} Parsed object or null.
 */
function safeJsonParse(jsonString, context) {
  try {
    return JSON.parse(jsonString || '{}');
  } catch (error) {
    console.error(
      chalk.red(`Error parsing JSON for ${context}: ${error.message}`),
    );
    console.error(chalk.gray(`Received: ${jsonString.substring(0, 200)}...`));
    return null; // Indicate parsing failure
  }
}

// --- Check Functions ---

/**
 * Checks for outdated packages using `npm outdated`.
 */
async function checkOutdatedPackages() {
  const flags = ['--json', '--long'];
  if (CONFIG.excludeDevDependenciesOutdated) {
    flags.push('--omit=dev');
  } else {
    flags.push('--all'); // Ensure devDeps are included if not omitted
  }
  const command = `npm outdated ${flags.join(' ')}`;
  const description = 'Checking for outdated packages';

  // npm outdated exits with 1 if outdated packages are found, but still outputs valid JSON
  const { stdout } = await runCommand(command, description, true); // Ignore exit code 1
  const outdatedData = safeJsonParse(stdout, description);

  if (!outdatedData) {
    console.log(chalk.yellow('Could not parse outdated package data.'));
    return { error: 'Parsing failed', count: 0, packages: {} };
  }

  const count = Object.keys(outdatedData).length;
  if (count > 0) {
    console.log(chalk.yellow(`Found ${count} outdated package(s).`));
  } else {
    console.log(chalk.green('All packages are up-to-date.'));
  }
  return { count, packages: outdatedData };
}

/**
 * Runs security audit using `npm audit`.
 */
async function runSecurityAudit() {
  const flags = ['--json'];
  if (CONFIG.excludeDevDependenciesAudit) {
    flags.push('--omit=dev');
  }
  const command = `npm audit ${flags.join(
    ' ',
  )} --audit-level=${CONFIG.auditLevel}`;
  const description = `Running security audit (level: ${CONFIG.auditLevel})`;

  // npm audit exits non-zero if vulnerabilities are found. We still want the JSON.
  const { stdout } = await runCommand(command, description, true); // Ignore exit code
  const auditData = safeJsonParse(stdout, description);

  if (!auditData) {
    console.log(chalk.yellow('Could not parse audit data.'));
    return { error: 'Parsing failed', summary: {}, vulnerabilities: {} };
  }

  const summary = auditData.metadata?.vulnerabilities || {
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
    total: 0,
  };
  const totalVulns =
    summary.total || Object.keys(auditData.vulnerabilities || {}).length; // Fallback count

  if (totalVulns > 0) {
    console.log(
      chalk.red(
        `Found ${totalVulns} vulnerabilit(ies) at or above '${CONFIG.auditLevel}' level:`,
      ),
    );
    console.log(
      chalk.red(
        `  Critical: ${summary.critical}, High: ${summary.high}, Moderate: ${summary.moderate}, Low: ${summary.low}`,
      ),
    );
  } else {
    console.log(
      chalk.green(
        `No vulnerabilities found at or above '${CONFIG.auditLevel}' level.`,
      ),
    );
  }
  // Return the full audit structure for the report
  return { summary, vulnerabilities: auditData.vulnerabilities || {} };
}

/**
 * Checks for multiple versions of the same package in the dependency tree using `npm ls`.
 */
async function checkVersionConflicts() {
  const command = 'npm ls --json --all';
  const description = 'Analyzing dependency tree for duplicates/conflicts';

  // npm ls exits non-zero if duplicates are found. We still want the JSON.
  const { stdout } = await runCommand(command, description, true); // Ignore exit code
  const lsData = safeJsonParse(stdout, description);

  if (!lsData || !lsData.dependencies) {
    console.log(
      chalk.yellow(
        'Could not parse dependency tree data or no dependencies found.',
      ),
    );
    return { error: 'Parsing failed or no dependencies', conflicts: {} };
  }

  const versionsFound = {}; // { packageName: Set<version> }
  const conflicts = {}; // { packageName: { versions: string[], paths: string[] } }

  function traverse(node, path) {
    if (!node || !node.dependencies) return;

    for (const [name, details] of Object.entries(node.dependencies)) {
      // Skip optional dependencies that weren't installed
      if (details.missing && details.optional) continue;

      const currentVersion = details.version;
      const currentPath = `${path} > ${name}@${currentVersion}`;

      if (!versionsFound[name]) {
        versionsFound[name] = new Set();
      }
      versionsFound[name].add(currentVersion);

      if (versionsFound[name].size > 1) {
        if (!conflicts[name]) {
          conflicts[name] = { versions: [], paths: [] }; // Initialize if first conflict found
        }
        // Update versions list (convert Set to Array for JSON)
        conflicts[name].versions = Array.from(versionsFound[name]).sort();
        // Add the path leading to this specific version instance
        // Note: This path tracking can become complex; keeping it simple for now.
        // A full path list might require storing paths per version.
        if (!conflicts[name].paths.includes(currentPath)) {
          conflicts[name].paths.push(currentPath); // Add path for context
        }
      }

      // Recurse
      if (details.dependencies) {
        traverse(details, currentPath);
      }
    }
  }

  traverse(lsData, lsData.name || 'root'); // Start traversal

  const conflictCount = Object.keys(conflicts).length;
  if (conflictCount > 0) {
    console.log(
      chalk.yellow(
        `Found ${conflictCount} package(s) with multiple resolved versions:`,
      ),
    );
    Object.entries(conflicts).forEach(([name, data]) => {
      console.log(
        chalk.yellow(`  - ${name}: Versions [${data.versions.join(', ')}]`),
      );
      // Optionally log paths if needed for debugging (can be verbose)
      // data.paths.forEach(p => console.log(chalk.gray(`    ${p}`)));
    });
  } else {
    console.log(
      chalk.green(
        'No duplicate package versions found in the dependency tree.',
      ),
    );
  }

  return { count: conflictCount, conflicts };
}

/**
 * Checks package.json for non-pinned dependency versions if strict pinning is enabled.
 */
function checkStrictPinning() {
  if (!CONFIG.strictVersionPinning) {
    console.log(chalk.gray('Strict version pinning check skipped (disabled).'));
    return { enabled: false, violations: [], count: 0 };
  }

  console.log('\nChecking for non-pinned versions (strict pinning enabled)...');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red('Error: package.json not found.'));
    return {
      enabled: true,
      error: 'package.json not found',
      violations: [],
      count: 0,
    };
  }

  const violations = [];
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    const checkDeps = (deps, type) => {
      for (const [name, version] of Object.entries(deps)) {
        // Regex to check for ranges (^, ~, >, <, *, x) or lack of specific version number start
        if (/[\^~><*x]|(latest|next)/i.test(version) || !/^\d/.test(version)) {
          violations.push({ name, version, type });
        }
      }
    };

    checkDeps(dependencies, 'dependencies');
    checkDeps(devDependencies, 'devDependencies');

    if (violations.length > 0) {
      console.log(
        chalk.yellow(`Found ${violations.length} non-pinned dependenc(ies):`),
      );
      violations.forEach((v) =>
        console.log(chalk.yellow(`  - ${v.name}: "${v.version}" (${v.type})`)),
      );
    } else {
      console.log(
        chalk.green('All dependencies appear to be strictly pinned.'),
      );
    }
  } catch (error) {
    console.error(
      chalk.red(`Error reading or parsing package.json: ${error.message}`),
    );
    return {
      enabled: true,
      error: `Failed to process package.json: ${error.message}`,
      violations: [],
      count: 0,
    };
  }

  return { enabled: true, violations, count: violations.length };
}

// --- Reporting ---

/**
 * Generates a JSON report of the findings.
 */
function generateReport(data) {
  if (!CONFIG.generateReport) return;

  const reportDir = path.dirname(CONFIG.reportPath);
  try {
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG.reportPath, JSON.stringify(data, null, 2));
    console.log(chalk.cyan(`\nReport generated at: ${CONFIG.reportPath}`));
  } catch (error) {
    console.error(
      chalk.red(
        `\nFailed to write report to ${CONFIG.reportPath}: ${error.message}`,
      ),
    );
  }
}

// --- Main Execution ---

async function main() {
  console.log(chalk.bold.blue('\n=== WESCORE Package Management Check ==='));
  let overallStatus = 'success'; // Assume success initially
  const reportData = {};

  try {
    // 1. Check for outdated packages
    reportData.outdated = await checkOutdatedPackages();
    if (reportData.outdated.count > 0) {
      // Depending on policy, you might set overallStatus to 'warning' or 'failure' here
      // overallStatus = 'warning';
    }
    if (reportData.outdated.error) overallStatus = 'failure';

    // 2. Run security audit
    reportData.audit = await runSecurityAudit();
    if (reportData.audit.summary?.total > 0 || reportData.audit.error) {
      // Fail if vulnerabilities meeting the threshold are found
      overallStatus = 'failure';
    }

    // 3. Check for version conflicts/duplicates
    reportData.conflicts = await checkVersionConflicts();
    if (reportData.conflicts.count > 0 || reportData.conflicts.error) {
      // Duplicates often indicate potential issues
      overallStatus = 'failure';
    }

    // 4. Check for strict pinning (if enabled)
    reportData.strictPinning = checkStrictPinning(); // This one is synchronous
    if (
      CONFIG.strictVersionPinning &&
      (reportData.strictPinning.count > 0 || reportData.strictPinning.error)
    ) {
      overallStatus = 'failure';
    }

    // Generate Report
    generateReport(reportData);

    // Final Summary
    console.log(chalk.bold.blue('\n--- Check Summary ---'));
    if (overallStatus === 'success') {
      console.log(chalk.bold.green('✅ All package checks passed.'));
    } else if (overallStatus === 'warning') {
      console.log(
        chalk.bold.yellow(
          '⚠️ Package checks completed with warnings. Review output.',
        ),
      );
    } else {
      console.log(
        chalk.bold.red('❌ Package checks failed. Review output and report.'),
      );
      process.exitCode = 1; // Set exit code to indicate failure
    }
  } catch (error) {
    console.error(chalk.bold.red('\n--- Critical Error ---'));
    console.error(
      chalk.red(`Package management check failed: ${error.message}`),
    );
    // Log stack trace for debugging if available
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exitCode = 1; // Set exit code for script failure
  } finally {
    console.log(chalk.bold.blue('\n=== Check Complete ==='));
  }
}

// Execute
main();
