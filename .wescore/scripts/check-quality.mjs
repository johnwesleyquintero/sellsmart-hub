#!/usr/bin/env node
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from '../config/loader.mjs';
import { runCommand } from '../src/runner/commandRunner.mjs';
import { generateHeader } from '../src/utils/header.mjs'; // Use the generator

// --- Configuration & Setup ---
const SCRIPT_NAME = 'check-quality.mjs'; // Define for context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logfilePath = path.join(process.cwd(), '.task_tracker.log');

// --- Simple In-Memory Logger for Buffering ---
let logBuffer = [];
const bufferLog = (level, message, logToConsole = true) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  logBuffer.push(logEntry);
  if (logToConsole) {
    // Use appendToLog's coloring logic for console consistency if desired,
    // or keep simple console logging here.
    if (level === 'error') console.error(chalk.red(message));
    else if (level === 'warn') console.warn(chalk.yellow(message));
    else if (level === 'info') console.log(chalk.blue(message));
    else if (level === 'debug') console.log(chalk.gray(message));
    else console.log(message);
  }
};
// --- End Simple Logger ---

// --- Process Monitoring ---
const getProcessStats = () => {
  const memoryUsage = process.memoryUsage();
  return {
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024),
  };
};
const logProcessStats = (phase) => {
  const stats = getProcessStats();
  // Use bufferLog instead of appendToLog directly
  bufferLog(
    'debug',
    `[Process Stats - ${phase}] Heap Used: ${stats.heapUsed}MB | Heap Total: ${stats.heapTotal}MB | External: ${stats.external}MB`,
    false,
  );
};

// --- Main Execution Logic ---
async function main() {
  const overallStartTime = new Date();
  let config;
  let allResults = [];
  let overallSuccess = true;
  logBuffer = []; // Clear buffer

  // Initial log message (will be buffered)
  bufferLog('info', 'Starting Wescore quality checks...');

  try {
    logProcessStats('Start');

    // 1. Load Config - Use try/catch and issueLogger
    bufferLog('info', 'Loading configuration...');
    const configStartTime = Date.now();
    try {
      config = await loadConfig();
      bufferLog(
        'debug',
        `Config loaded in ${Date.now() - configStartTime}ms`,
        false,
      );
      bufferLog(
        'info',
        `Configuration loaded. Found ${config.checks.length} checks.`,
      );
      bufferLog('debug', `Command Timeout: ${config.commandTimeout}ms`);
    } catch (configError) {
      // Log internal config loading error
      issueLogger.logError(configError, {
        script: SCRIPT_NAME,
        phase: 'loadConfig',
      });
      bufferLog(
        'error',
        `FATAL: Failed to load configuration: ${configError.message}`,
      );
      // Write buffer before exiting
      writeLogFile(overallStartTime, [], 0, 0, 0, duration, true); // Indicate fatal error
      process.exit(1);
    }

    const totalChecks = config.checks.length;

    // 2. Run Checks (Parallel or Sequential)
    //    Modify the logging inside the loops to use `bufferLog`
    //    Keep the .catch() for runCommand to handle *runner* errors,
    //    but consider logging them with issueLogger too.

    if (config.runInParallel) {
      bufferLog('info', `⚡ Running ${totalChecks} checks in parallel mode`);
      const promises = config.checks.map((check, index) =>
        runCommand(check, config.commandTimeout, config.logLevel || 'info')
          .then((result) => ({ check, result, index }))
          .catch((runnerError) => {
            // Log internal runner error
            issueLogger.logError(runnerError, {
              script: SCRIPT_NAME,
              phase: 'runCommandParallel',
              check: check.name,
            });
            return {
              // Return a structured failure object
              check,
              index,
              result: {
                success: false,
                output: `Internal runner error: ${runnerError.message}`,
                stdout: '',
                stderr: runnerError.stack || '',
                duration: 0,
                exitCode: null,
                signal: null,
                timedOut: false,
                internalError: true, // Flag this as an internal failure
              },
            };
          }),
      );
      const settledResults = await Promise.allSettled(promises);

      settledResults.forEach((settledResult) => {
        if (settledResult.status === 'fulfilled') {
          const { check, result, index } = settledResult.value;
          allResults.push({ ...result, name: check.name, id: check.id });
          const checkNum = index + 1;
          const checkPrefix = `[${checkNum}/${totalChecks}]`;
          const commandDisplay = `(${check.command})`;

          if (result.success) {
            bufferLog(
              'info',
              `${checkPrefix} ✅ Success: ${check.name} ${commandDisplay}`,
            );
          } else {
            overallSuccess = false;
            const failureReason = result.internalError
              ? 'Internal Runner Error'
              : result.timedOut
                ? 'Timeout'
                : `Exit Code ${result.exitCode}`;
            bufferLog(
              'error',
              `${checkPrefix} ❌ Failed (${failureReason}): ${check.name} ${commandDisplay}`,
            );

            // ... (rest of failure logging using bufferLog) ...
            // ... (V6 Debugging logic using console.log and bufferLog) ...
          }
        } else {
          // Handle critical promise errors (less likely with catch above, but possible)
          overallSuccess = false;
          const reason = settledResult.reason;
          const checkIndex = allResults.length; // Estimate index
          const checkInfo = config.checks[checkIndex] || {
            name: 'Unknown Check',
          };
          // Log critical internal error
          const errorToLog =
            reason instanceof Error
              ? reason
              : new Error(`Critical promise rejection: ${reason}`);
          issueLogger.logError(errorToLog, {
            script: SCRIPT_NAME,
            phase: 'promiseSettled',
            checkIndex,
          });
          bufferLog(
            'error',
            `[${checkIndex + 1}/${totalChecks}] 💥 Critical failure executing check ${checkInfo.name}: ${errorToLog.message}`,
          );
          allResults.push({
            name: checkInfo.name,
            success: false,
            output: `Critical failure: ${errorToLog.message}`,
            internalError: true,
          });
        }
      });
    } else {
      // Sequential Execution (similar logic with bufferLog and issueLogger in catch)
      bufferLog('info', `⚡ Running ${totalChecks} checks in sequential mode`);
      for (const [index, check] of config.checks.entries()) {
        const checkNum = index + 1;
        const checkPrefix = `[${checkNum}/${totalChecks}]`;
        const commandDisplay = `(${check.command})`;
        bufferLog(
          'info',
          `\n${checkPrefix} ▶ Running: ${check.name} ${commandDisplay}`,
        );

        try {
          const result = await runCommand(
            check,
            config.commandTimeout,
            config.logLevel || 'info',
          );
          allResults.push({ ...result, name: check.name, id: check.id });

          if (result.success) {
            bufferLog('info', `${checkPrefix} ✅ Success: ${check.name}`);
          } else {
            overallSuccess = false;
            const failureReason = result.timedOut
              ? 'Timeout'
              : `Exit Code ${result.exitCode}`;
            bufferLog(
              'error',
              `${checkPrefix} ❌ Failed (${failureReason}): ${check.name}`,
            );
            // ... (failure logging using bufferLog) ...
            // ... (V6 Debugging logic using console.log and bufferLog) ...
          }
        } catch (runnerError) {
          // Log internal runner error
          issueLogger.logError(runnerError, {
            script: SCRIPT_NAME,
            phase: 'runCommandSequential',
            check: check.name,
          });
          overallSuccess = false;
          bufferLog(
            'error',
            `${checkPrefix} ❌ Failed (Internal Runner Error): ${check.name}`,
          );
          bufferLog('error', `   Error: ${runnerError.message}`); // Log basic error message
          allResults.push({
            name: check.name,
            id: check.id,
            success: false,
            output: `Internal runner error: ${runnerError.message}`,
            stdout: '',
            stderr: runnerError.stack || '',
            duration: 0,
            exitCode: null,
            signal: null,
            timedOut: false,
            internalError: true,
          });
        }
      }
    }

    // 3. Final Summary Calculation
    const overallEndTime = new Date();
    const duration =
      (overallEndTime.getTime() - overallStartTime.getTime()) / 1000;
    const failedChecks = allResults.filter((r) => !r.success);
    const passedChecksCount = allResults.length - failedChecks.length;

    logProcessStats('End');

    bufferLog('info', '\n--- Checks Complete ---');
    bufferLog(
      'info',
      `Ran ${allResults.length}/${totalChecks} checks in ${duration.toFixed(2)}s`,
    );

    if (failedChecks.length > 0) {
      bufferLog('error', `\n${failedChecks.length} check(s) failed:`);
      failedChecks.forEach((check) => {
        bufferLog('error', `  ▼ ${check.name}`);
      });
    } else {
      bufferLog('info', '\n✅ All checks passed!');
    }

    // 4. Write Log File (Header + Buffer)
    writeLogFile(
      overallStartTime,
      allResults,
      totalChecks,
      passedChecksCount,
      failedChecks.length,
      duration,
    );

    process.exit(overallSuccess ? 0 : 1);
  } catch (error) {
    // Catch unexpected errors during the main execution flow
    console.error(
      chalk.red.bold('\nCritical error during script execution:'),
      error,
    );
    // Log the critical internal error
    issueLogger.logError(error, {
      script: SCRIPT_NAME,
      phase: 'mainExecution',
    });
    // Add error details to buffer if possible
    bufferLog('error', 'CRITICAL ERROR DURING SCRIPT EXECUTION:');
    bufferLog('error', error.message);
    if (error.stack) {
      bufferLog('error', error.stack);
    }
    // Attempt to write the (potentially incomplete) log buffer even on critical error
    // writeLogFile now returns recommendations, but we don't need them here
    writeLogFile(overallStartTime, allResults, -1, -1, -1, -1, true); // Indicate fatal error

    process.exit(1);
  }
}

/**
 * Writes the final log file by combining the generated header and the buffered log messages.
 * Generates and includes actionable recommendations if checks failed.
 * Handles potential file writing errors.
 *
 * @param {Date} startTime - The Date object representing when the script started.
 * @param {Array<object>} results - Array containing the result objects for each check run. Should include at least `{ name: string, success: boolean }`.
 * @param {number} total - Total number of checks configured.
 * @param {number} passed - Number of checks that passed.
 * @param {number} failed - Number of checks that failed.
 * @param {number} durationSec - Total execution duration in seconds.
 * @param {boolean} [isFatal=false] - Flag indicating if a fatal error occurred before completion.
 * @returns {string} A string containing the generated recommendations, or an empty string if no checks failed or on fatal error.
 */
function writeLogFile(
  startTime,
  results,
  total,
  passed,
  failed,
  durationSec,
  isFatal = false,
) {
  let recommendations = ''; // Initialize recommendations string

  try {
    // Prepare data for the dynamic header
    const failedCheckDetails = isFatal
      ? []
      : results
          .filter((r) => !r.success)
          .map((c) => ({ name: c.name, id: c.id })); // Get names/ids of failed checks

    const headerData = {
      startTime: startTime,
      logfilePath: logfilePath,
      commandExecuted: `node ${path.relative(process.cwd(), __filename)} ${process.argv.slice(2).join(' ')}`,
      totalChecks: isFatal ? undefined : total,
      passedChecks: isFatal ? undefined : passed,
      failedChecks: isFatal ? undefined : failed,
      failedCheckNames: failedCheckDetails.map((c) => c.name), // Keep names for header summary
      durationSeconds: isFatal ? undefined : durationSec,
    };
    const headerContent = generateHeader(headerData);

    // --- Generate Actionable Recommendations ---
    if (!isFatal && failed > 0) {
      recommendations += '\n\n--- Actionable Recommendations ---\n\n'; // Add spacing
      failedCheckDetails.forEach((check) => {
        // Use check.id for more robust matching if available, otherwise fallback to name
        const checkIdentifier = check.id || check.name;
        switch (checkIdentifier) {
          case 'lint': // Assuming 'lint' is the ID for ESLint
          case 'Linting':
            recommendations += `• ${chalk.yellow(check.name)}: Run ${chalk.cyan('npm run lint -- --fix')} to attempt automatic fixes, or Enforce code style consistency by iteratively linting and correcting: Execute npm run lint, meticulously review the output for violations of established style guidelines, systematically address each reported issue, and repeat this process until the codebase achieves a clean linting report, ensuring adherence to coding standards and best practices.\n`;
            break;
          case 'format': // Assuming 'format' is the ID for Prettier
          case 'Formatting (Prettier)':
            // Usually Prettier passes or fails on check, fix is separate
            recommendations += `• ${chalk.yellow(check.name)}: Run ${chalk.cyan('npm run format')} to apply correct formatting. Thoroughly review the changes for unexpected modifications or introduced issues. Address any formatting discrepancies to guarantee optimal code readability and consistency. Finally, verify the entire codebase is uniformly formatted and ready for subsequent development tasks.\n`;
            break;
          case 'type-check': // Assuming 'type-check' is the ID for TSC
          case 'Type Checking (TSC)':
            recommendations += `• ${chalk.yellow(check.name)}: Review the TypeScript errors (e.g., ${chalk.red('error TSxxxx')}) reported by 'tsc' in the log details above, or Implement a rigorous type safety protocol: Execute npm run typecheck and meticulously analyze the output, prioritizing the immediate resolution of all identified type errors and inconsistencies. Iterate this process – type checking, analysis, and remediation – until the codebase achieves a state of complete type safety, free from any reported errors. Document all significant type-related changes and decisions made during the remediation process.\n`;
            break;
          case 'build': // Assuming 'build' is the ID for Build Project
          case 'Build Project':
            recommendations += `• ${chalk.yellow(check.name)}: Examine the build output (stdout/stderr) logged above for specific compilation or bundling errors.\n`;
            break;
          case 'test': // Example: Assuming 'test' is the ID for tests
          case 'Unit Tests (Jest)':
          case 'Integration Tests':
            recommendations += `• ${chalk.yellow(check.name)}: Review the test failure details logged above. Run tests individually or with ${chalk.cyan('--watch')} for focused debugging.\n`;
            break;
          // Add more cases for other specific checks based on their name or ID
          default:
            recommendations += `• ${chalk.yellow(check.name)}: Review the command output (stdout/stderr) logged above for specific error messages and failure details.\n`;
        }
      });
      recommendations +=
        '\nRemember to commit any fixes after resolving the issues.\n';
    }
    // --- End Recommendations ---

    // Combine header, buffered log messages, and recommendations
    const finalLogContent =
      headerContent + logBuffer.join('\n') + '\n' + recommendations; // Append recommendations

    // Write the complete log content to the file
    fs.writeFileSync(logfilePath, finalLogContent, { encoding: 'utf8' });
    console.log(chalk.blue(`\nLog file written: ${logfilePath}`));
    if (isFatal) {
      console.error(
        chalk.yellow(`Note: Log file may be incomplete due to fatal error.`),
      );
      return ''; // Return empty recommendations on fatal error
    }

    return recommendations; // Return the generated recommendations string
  } catch (writeError) {
    console.error(
      chalk.red.bold(`FATAL: Cannot write final log file ${logfilePath}.`),
      writeError,
    );
    issueLogger.logError(writeError, {
      script: SCRIPT_NAME,
      phase: 'writeLogFile',
    });
    console.error('\n--- Log Buffer (Failed to Write to File) ---');
    console.error(logBuffer.join('\n'));
    console.error('--- End Log Buffer ---');
    return ''; // Return empty string on write failure
  }
}

main();
