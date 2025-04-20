// .wescore/scripts/check-quality.cjs

import { execa } from 'execa';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { generateHeader } from '../src/utils/header.mjs';

// --- Configuration Loading ---
const CONFIG_PATH = path.resolve(process.cwd(), '.wescore.json');
let config = {
  // Default config in case file is missing/invalid
  config: {
    runMode: 'sequential', // Default run mode
    failFast: false, // Default fail fast behavior
    commandTimeout: 300000, // Default 5 mins timeout per command
  },
  checks: [], // Default empty checks array
};
let allChecks = []; // Will hold the enabled checks loaded from config

async function loadConfig() {
  try {
    log('INFO', `Loading configuration from ${CONFIG_PATH}...`);
    const configFileContent = await fs.readFile(CONFIG_PATH, 'utf-8');
    config = JSON.parse(configFileContent);

    // Ensure config object and checks array exist after parsing
    config.config = config.config || {
      runMode: 'sequential',
      failFast: false,
      commandTimeout: 300000,
    };
    config.checks = config.checks || [];

    // Validate check objects
    config.checks.forEach((check, index) => {
      if (!check.name || typeof check.name !== 'string') {
        throw new Error(`Check at index ${index} is missing a valid 'name'`);
      }
      if (!check.command || typeof check.command !== 'string') {
        throw new Error(`Check "${check.name}" is missing a valid 'command'`);
      }
    });

    allChecks = config.checks.filter((check) => check.enabled !== false); // Filter enabled checks
    log(
      'INFO',
      `Configuration loaded. Found ${allChecks.length} enabled checks.`,
    );
    log(
      'DEBUG',
      `Run Mode: ${config.config.runMode}, Fail Fast: ${config.config.failFast}, Timeout: ${config.config.commandTimeout}ms`,
    );
  } catch (error) {
    log(
      'WARN',
      `Could not load or parse ${CONFIG_PATH}. No checks will be run. Error: ${error.message}`,
    );
    allChecks = []; // Ensure checks array is empty on error
  }
}

// --- Logger ---
const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
let currentLogLevel = LOG_LEVELS.INFO; // Default log level

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  grey: '\x1b[90m',
};

function log(level, message) {
  if (LOG_LEVELS[level] === undefined || LOG_LEVELS[level] < currentLogLevel) {
    return;
  }
  const timestamp = new Date().toISOString();
  let color = colors.reset;
  switch (level) {
    case 'ERROR':
      color = colors.red;
      break;
    case 'WARN':
      color = colors.yellow;
      break;
    case 'INFO':
      color = colors.reset;
      break;
    case 'DEBUG':
      color = colors.grey;
      break;
  }
  // Indent multi-line messages consistently after the prefix
  const prefix = `${colors.grey}[${timestamp}]${colors.reset} [${color}${level.padEnd(5)}${colors.reset}] `;
  const indentedMessage = message
    .split('\n')
    .map((line, index) => (index === 0 ? line : `  ${line}`))
    .join('\n');
  console.log(prefix + indentedMessage);
}

// --- Helper Functions ---
function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

function truncateOutput(output, maxLines = 10) {
  // Default maxLines
  if (!output) return '';
  const lines = output.trim().split('\n');
  if (lines.length <= maxLines) {
    return output.trim();
  }
  return lines.slice(0, maxLines).join('\n') + `\n... (output truncated)`;
}

async function getGitCommitHash() {
  try {
    // Use execa to run git command
    const { stdout } = await execa('git', ['rev-parse', '--short', 'HEAD'], {
      reject: false, // Don't throw if not a git repo or no commits
      stderr: 'ignore', // Ignore stderr for this command
    });
    return stdout.trim() || null; // Return hash or null
  } catch (error) {
    log('DEBUG', `Could not get Git commit hash: ${error.message}`);
    return null;
  }
}

// --- Main Execution Logic ---
// eslint-disable-next-line sonarjs/cognitive-complexity
async function runChecks() {
  const scriptStartTime = performance.now(); // For overall script timing including config load
  log(
    'DEBUG',
    `ESLint config: ${JSON.stringify(config.checks.find((check) => check.name === 'Linting'))}`,
  );
  log(
    'DEBUG',
    `Files being linted: ${JSON.stringify(config.checks.find((check) => check.name === 'Linting')?.command)}`,
  );
  await loadConfig(); // Load config first

  if (allChecks.length === 0) {
    log(
      'ERROR',
      'No enabled checks found in configuration or configuration failed to load.',
    );
    process.exit(1); // Exit if no checks to run
  }

  const checksExecutionStart = performance.now(); // Start timing after config load
  log('INFO', 'Starting Wescore quality checks...');
  log(
    'DEBUG',
    `[Process Stats - Start] Heap Used: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
  );
  log(
    'INFO',
    `⚡ Running ${allChecks.length} checks in ${config.config.runMode} mode`,
  );

  const results = [];
  let checksPassed = 0;
  let checksFailed = 0;

  // --- Check Execution Loop ---
  // --- Parallel Execution ---
  if (config.config.runMode === 'parallel') {
    const checkPromises = allChecks.map(async (check, i) => {
      const checkIndex = i + 1;
      const totalChecks = allChecks.length;

      log(
        'INFO',
        `\n[${checkIndex}/${totalChecks}] ▶ Running: ${check.name} (${colors.cyan}${check.command}${colors.reset})`,
      );
      const checkStart = performance.now();
      let checkResult = {
        name: check.name,
        command: check.command,
        status: 'failed', // Default to failed
        durationMs: 0,
        exitCode: null,
        stdout: '',
        stderr: '',
      };

      try {
        // Execute the command using execa
        const result = await execa(check.command, {
          shell: true, // Use shell for complex commands / npm scripts
          timeout: config.config.commandTimeout, // Apply timeout from config
          cwd: check.cwd || process.cwd(), // Allow overriding cwd per check
          reject: false, // IMPORTANT: Don't throw on non-zero exit codes
          // Consider adding env vars if needed: env: { ...process.env, MY_VAR: 'value' }
        });

        const checkEnd = performance.now();
        checkResult.durationMs = checkEnd - checkStart;
        checkResult.stdout = result.stdout || '';
        checkResult.stderr = result.stderr || '';
        checkResult.exitCode = result.exitCode;

        // --- Handle Success ---
        if (result.exitCode === 0) {
          checkResult.status = 'success';
          checksPassed++;
          log(
            'INFO',
            `[${checkIndex}/${totalChecks}] ${colors.green}✅ Success:${colors.reset} ${check.name} (${formatDuration(checkResult.durationMs)})`,
          );
          // Log stderr warning only if it contains non-whitespace characters
          if (checkResult.stderr && checkResult.stderr.trim()) {
            log(
              'WARN',
              `  Stderr output detected on success:\n${truncateOutput(checkResult.stderr, 5)}`, // Correctly pass checkResult.stderr
            );
          }
        }
        // --- Handle Failure (Non-zero Exit Code) ---
        else {
          checkResult.status = 'failed';
          checksFailed++;
          log(
            'ERROR',
            `[${checkIndex}/${totalChecks}] ${colors.red}❌ Failed (Exit Code ${checkResult.exitCode}):${colors.reset} ${check.name} (${formatDuration(checkResult.durationMs)})`,
          );
          log(
            'ERROR',
            `  ${colors.red}Output:${colors.reset}\n--- Error Output Start ---`,
          );
          // Log stderr first as it often contains the primary error
          if (checkResult.stderr && checkResult.stderr.trim()) {
            log('ERROR', `  Stderr:\n${checkResult.stderr}`);
          }
          if (checkResult.stdout && checkResult.stdout.trim()) {
            log('ERROR', `  Stdout:\n${checkResult.stdout}`);
          }
          log('ERROR', `--- Error Output End ---`);
        }
      } catch (error) {
        // --- Handle Execution Errors (e.g., command not found, timeout) ---
        const checkEnd = performance.now();
        checkResult.durationMs = checkEnd - checkStart;
        checkResult.status = 'failed';
        // Attempt to get exit code from error, default to 1
        checkResult.exitCode = error.exitCode ?? error.code ?? 1;
        checkResult.stdout = error.stdout || '';
        // Use stderr if available, otherwise the error message itself
        checkResult.stderr = error.stderr || error.message;
        checksFailed++;

        log(
          'ERROR',
          `[${checkIndex}/${totalChecks}] ${colors.red}💥 Execution Error:${colors.reset} ${check.name} (${formatDuration(checkResult.durationMs)}) - ${error.shortMessage || error.message}`,
        );
        // Log output if available from the execution error
        if (checkResult.stderr && checkResult.stderr.trim()) {
          log('ERROR', `  Stderr:\n${checkResult.stderr}`);
        }
        if (checkResult.stdout && checkResult.stdout.trim()) {
          log('ERROR', `  Stdout:\n${checkResult.stdout}`);
        }
      }

      // Add the result of the current check to the results array
      results.push(checkResult);
      return checkResult;
    });

    await Promise.all(checkPromises);

    checksPassed = results.filter((r) => r.status === 'success').length;
    checksFailed = results.filter((r) => r.status === 'failed').length;
  } else {
    // --- Sequential Execution ---
    for (let i = 0; i < allChecks.length; i++) {
      const check = allChecks[i];
      const checkIndex = i + 1;
      const totalChecks = allChecks.length;

      log(
        'INFO',
        `\n[${checkIndex}/${totalChecks}] ▶ Running: ${check.name} (${colors.cyan}${check.command}${colors.reset})`,
      );
      const checkStart = performance.now();
      let checkResult = {
        name: check.name,
        command: check.command,
        status: 'failed', // Default to failed
        durationMs: 0,
        exitCode: null,
        stdout: '',
        stderr: '',
      };

      try {
        // Execute the command using execa
        const result = await execa(check.command, {
          shell: true, // Use shell for complex commands / npm scripts
          timeout: config.config.commandTimeout, // Apply timeout from config
          cwd: check.cwd || process.cwd(), // Allow overriding cwd per check
          reject: false, // IMPORTANT: Don't throw on non-zero exit codes
          // Consider adding env vars if needed: env: { ...process.env, MY_VAR: 'value' }
        });

        const checkEnd = performance.now();
        checkResult.durationMs = checkEnd - checkStart;
        checkResult.stdout = result.stdout || '';
        checkResult.stderr = result.stderr || '';
        checkResult.exitCode = result.exitCode;

        // --- Handle Success ---
        if (result.exitCode === 0) {
          checkResult.status = 'success';
          checksPassed++;
          log(
            'INFO',
            `[${checkIndex}/${totalChecks}] ${colors.green}✅ Success:${colors.reset} ${check.name} (${formatDuration(checkResult.durationMs)})`,
          );
          // Log stderr warning only if it contains non-whitespace characters
          if (checkResult.stderr && checkResult.stderr.trim()) {
            log(
              'WARN',
              `  Stderr output detected on success:\n${truncateOutput(checkResult.stderr, 5)}`, // Correctly pass checkResult.stderr
            );
          }
        }
        // --- Handle Failure (Non-zero Exit Code) ---
        else {
          checkResult.status = 'failed';
          checksFailed++;
          log(
            'ERROR',
            `[${checkIndex}/${totalChecks}] ${colors.red}❌ Failed (Exit Code ${checkResult.exitCode}):${colors.reset} ${check.name} (${formatDuration(checkResult.durationMs)})`,
          );
          log(
            'ERROR',
            `  ${colors.red}Output:${colors.reset}\n--- Error Output Start ---`,
          );
          // Log stderr first as it often contains the primary error
          if (checkResult.stderr && checkResult.stderr.trim()) {
            log('ERROR', `  Stderr:\n${checkResult.stderr}`);
          }
          if (checkResult.stdout && checkResult.stdout.trim()) {
            log('ERROR', `  Stdout:\n${checkResult.stdout}`);
          }
          log('ERROR', `--- Error Output End ---`);

          // Fail fast logic for non-zero exit
          if (config.config.failFast) {
            log(
              'WARN',
              `Check '${check.name}' failed. Stopping execution due to failFast=true.`,
            );
            results.push(checkResult); // Add the failed result before breaking
            break; // Exit the loop
          }
        }
      } catch (error) {
        // --- Handle Execution Errors (e.g., command not found, timeout) ---
        const checkEnd = performance.now();
        checkResult.durationMs = checkEnd - checkStart;
        checkResult.status = 'failed';
        // Attempt to get exit code from error, default to 1
        checkResult.exitCode = error.exitCode ?? error.code ?? 1;
        checkResult.stdout = error.stdout || '';
        // Use stderr if available, otherwise the error message itself
        checkResult.stderr = error.stderr || error.message;
        checksFailed++;

        log(
          'ERROR',
          `[${checkIndex}/${totalChecks}] ${colors.red}💥 Execution Error:${colors.reset} ${check.name} (${formatDuration(checkResult.durationMs)}) - ${error.shortMessage || error.message}`,
        );
        // Log output if available from the execution error
        if (checkResult.stderr && checkResult.stderr.trim()) {
          log('ERROR', `  Stderr:\n${checkResult.stderr}`);
        }
        if (checkResult.stdout && checkResult.stdout.trim()) {
          log('ERROR', `  Stdout:\n${checkResult.stdout}`);
        }

        // Fail fast logic for execution errors
        if (config.config.failFast) {
          log(
            'WARN',
            `Check '${check.name}' had execution error. Stopping execution due to failFast=true.`,
          );
          results.push(checkResult); // Add the failed result before breaking
          break; // Exit the loop
        }
      }

      // Add the result of the current check to the results array
      results.push(checkResult);

      // Removed the redundant failFast check here
    } // --- End of Check Execution Loop ---
  }

  const checksExecutionEnd = performance.now();
  const checksDurationMs = checksExecutionEnd - checksExecutionStart;
  const overallDurationMs = checksExecutionEnd - scriptStartTime; // Total time including config load

  log(
    'DEBUG',
    `[Process Stats - End] Heap Used: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
  );
  log('INFO', `\n--- Checks Complete ---`);
  log(
    'INFO',
    `Ran ${results.length}/${allChecks.length} checks in ${formatDuration(checksDurationMs)} (Total script time: ${formatDuration(overallDurationMs)})`,
  );

  // --- Generate and Print Summary ---
  const gitCommitHash = await getGitCommitHash();
  const failedChecksData = results.filter((r) => r.status === 'failed');
  const overallDurationSeconds = checksDurationMs / 1000; // Use checks duration for summary

  const headerData = {
    startTime: new Date(checksExecutionStart), // Use checks execution start time
    // logfilePath: 'YOUR_LOG_FILE_PATH', // Add if implementing file logging
    commandExecuted: `node ${path.relative(process.cwd(), process.argv[1])}`,
    totalChecks: allChecks.length,
    passedChecks: checksPassed,
    failedChecks: checksFailed,
    // Provide more detail in failed check names for the header
    failedCheckNames: failedChecksData.map(
      (check) => `${check.name} (Exit Code ${check.exitCode || 'N/A'})`,
    ),
    durationSeconds: overallDurationSeconds, // Correctly defined variable
    gitCommitHash: gitCommitHash,
    nodeVersion: process.version,
    platform: `${os.platform()} ${os.release()}`,
  };

  const summaryOutput = generateHeader(headerData);
  console.log(summaryOutput); // Print the generated summary block

  // --- Recommendations Section ---
  if (failedChecksData.length > 0) {
    log('ERROR', `\n${failedChecksData.length} check(s) failed:`);
    failedChecksData.forEach((check) => {
      log('ERROR', `  ▼ ${check.name}`);
    });

    // Print the recommendations header
    console.log(`\n========================================================
                    RECOMMENDATIONS
========================================================`);

    // Loop through failed checks to print specific recommendations
    failedChecksData.forEach((check) => {
      console.log(`\n• ${check.name}:`);
      const errorOutput = (
        check.stderr ||
        check.stdout ||
        'No specific output captured.'
      ).trim();
      console.log(
        `  Review the following output snippet for specific error messages:`,
      );
      console.log(`-------------------- SNIPPET START --------------------`);
      // Use truncateOutput for the snippet
      console.log(
        `  ${truncateOutput(errorOutput, 15).split('\n').join('\n  ')}`,
      ); // Indent snippet
      console.log(`--------------------- SNIPPET END ---------------------`);
      console.log(`  Command executed: ${check.command}`);
    });

    console.log(`
========================================================
          IMMEDIATE ACTIONS REQUIRED
========================================================

The Wescore code quality checks have identified one or more issues.

Instructions:
1. Analyze the provided WESCORE run summary, focusing on the failed checks.
2. Prioritize addressing the specific errors detailed in the output snippets for each failed check. 
   Pay close attention to:
    - File paths
    - Line numbers
    - Error messages

Post-Fix Actions:
1. After implementing fixes, re-run the code quality checks using the command: npm run cq
2. Verify that the identified issues have been resolved and that all checks now pass.
3. If failures persist, repeat the analysis and correction process until a successful run is achieved.

Documentation:
- Document the changes made.
- Commit the corrected code to the repository.

========================================================
`);
  } else {
    // Success message if all checks passed
    log(
      'INFO',
      `${colors.green}All checks passed successfully! ✨${colors.reset}`,
    );
  }

  // Exit with appropriate code for CI/CD pipelines
  process.exit(checksFailed > 0 ? 1 : 0);
}

// --- Script Entry Point ---
// Set log level based on environment variable or argument (optional)
if (
  process.env.LOG_LEVEL === 'DEBUG' ||
  process.argv.includes('--debug') ||
  process.argv.includes('-d')
) {
  currentLogLevel = LOG_LEVELS.DEBUG;
  log('DEBUG', 'Debug logging enabled.');
}

// Run the main function and catch top-level errors
runChecks().catch((error) => {
  log(
    'ERROR',
    `${colors.red}An unexpected fatal error occurred in the check runner:${colors.reset} ${error.message}`,
  );
  console.error(error.stack); // Print stack trace for fatal errors
  process.exit(2); // Use a different exit code for runner errors vs check failures
});
