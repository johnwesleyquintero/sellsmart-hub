#!/usr/bin/env node
import chalk from 'chalk';
import fs from 'fs'; // Import fs for file operations
import path from 'path'; // Import path for file path manipulation
import { fileURLToPath } from 'url'; // To get the current directory
import { loadConfig } from './config/loader.js';
// Assuming runCommand returns { success, output, stdout, stderr, duration, exitCode, signal, timedOut }
import { runCommand } from './runner/commandRunner.js';

// --- Configuration & Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logfilePath = path.join(__dirname, '..', 'run_tasks.log'); // Log file in the project root

const headerMessage = `
===========================================================
𝐑𝐞𝐪𝐮𝐞𝐬𝐭 𝐟𝐨𝐫 𝐒𝐲𝐬𝐭𝐞𝐦𝐚𝐭𝐢𝐜 𝐈𝐦𝐩𝐥𝐞𝐦𝐞𝐧𝐭𝐚𝐭𝐢𝐨𝐧 𝐨𝐟 𝐈𝐦𝐩𝐫𝐨𝐯𝐞𝐦𝐞𝐧𝐭𝐬 𝐚𝐧𝐝 𝐅𝐢𝐱𝐞𝐬
===========================================================
𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆: 𝗦𝗰𝗮𝗹𝗲𝗪𝗶𝘁𝗵𝗪𝗲𝘀𝗹𝗲𝘆 𝗫 𝗪𝗘𝗦𝗖𝗢𝗥𝗘|𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗺𝗲𝗻𝘁 𝗧𝗮𝘀𝗸 𝗥𝘂𝗻𝗻𝗲𝗿

Objective:
- Provide assistance in implementing improvements and fixes systematically.
- Update the incorrect import path to reference the correct file location.
- Fix any syntax issues, type mismatches, and remove/implement unused variables while ensuring that the existing functionality remains intact.

Details:
1. Log File: Please refer to the full log trace provided in \`run_tasks.log\` for any relevant information.
2. Command Used: The command executed was \`npm run cq\` (or similar, based on how this script is invoked).

Tasks:
1. Review Logs: Analyze the \`run_tasks.log\` file to identify any errors, warnings, or areas that need improvement.
2. Implement Fixes: Address the identified issues systematically, ensuring that each fix is thoroughly tested.
3. Maintain Functionality: Ensure that all existing functionality remains operational and unaffected by the changes.
4. Documentation: Document all changes made, including the rationale behind each fix and any testing procedures used.

Expected Outcome:
- A stable system with improved performance and fixed issues.
- Detailed documentation of all changes and testing results.
- Smooth code-quality check results using the executed command.

========================================
Starting Task Runner Log
Timestamp: ${new Date().toISOString()}
========================================
`;

// --- Helper Functions ---

/**
 * Appends a message to the log file and optionally logs to console.
 * @param {string} message - The message to log.
 * @param {('info'|'error'|'warn'|'debug'|'raw')} type - Log type.
 * @param {boolean} [logToConsole=true] - Whether to also log to console.
 */
function appendToLog(message, type = 'info', logToConsole = true) {
  const timestamp = new Date().toISOString();
  let logEntry = '';
  let consoleMessage = message; // Keep original message for console formatting

  // Format for log file
  if (type !== 'raw') {
    logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}\n`;
  } else {
    logEntry = message + '\n'; // Raw entry for direct output like stdout/stderr
  }

  try {
    fs.appendFileSync(logfilePath, logEntry);
  } catch (error) {
    console.error(
      chalk.red(`FATAL: Error writing to log file ${logfilePath}:`),
      error,
    );
    // Avoid exiting here, try to continue console logging if possible
  }

  // Format for console (optional, using chalk)
  if (logToConsole) {
    switch (type) {
      case 'error':
        console.error(chalk.red(consoleMessage));
        break;
      case 'warn':
        console.warn(chalk.yellow(consoleMessage));
        break;
      case 'info':
      case 'debug': // Treat debug as info for console unless specific handling needed
      default: // Includes 'raw' type, print as is
        console.log(consoleMessage);
        break;
    }
  }
}

/**
 * Removes ANSI escape codes from a string.
 * @param {string} str The string to clean.
 * @returns {string} The cleaned string.
 */
function stripAnsiCodes(str) {
  // Regular expression to match ANSI escape codes
  const ansiRegex =
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
  return str.replace(ansiRegex, '');
}

/**
 * Analyzes log data (stdout/stderr) to extract specific error/warning lines based on provided patterns.
 * Version 5: Uses patterns from config, keeps ANSI stripping.
 * @param {string} logData - The combined stdout and stderr output of a task.
 * @param {string} [taskId='unknown'] - The ID or type of the task (e.g., 'Format', 'Lint').
 * @param {string[]} [errorPatterns=[]] - Array of regex strings for errors.
 * @param {string[]} [warningPatterns=[]] - Array of regex strings for warnings.
 * @returns {{errors: number, errorLines: string[], warnings: number, warningLines[]}} - Counts and specific lines.
 */
function categorizeLogOutput(
  logData,
  taskId = 'unknown',
  errorPatterns = [],
  warningPatterns = [],
) {
  const lines = logData ? logData.split(/\r?\n/) : [];
  let errorCount = 0;
  let warningCount = 0;
  const errorLines = [];
  const warningLines = [];

  // Compile regex patterns once
  const compiledErrorPatterns = errorPatterns.map(
    (pattern) => new RegExp(pattern, 'i'),
  );
  const compiledWarningPatterns = warningPatterns.map(
    (pattern) => new RegExp(pattern, 'i'),
  );

  lines.forEach((line) => {
    const cleanedLine = stripAnsiCodes(line).trim();
    if (!cleanedLine) return; // Skip empty lines after cleaning

    let lineMatchedAsError = false;

    // Check for Errors using the *cleaned* line
    for (const pattern of compiledErrorPatterns) {
      if (pattern.test(cleanedLine)) {
        // Add the CLEANED line for consistency in the summary.
        errorLines.push(`[${taskId.toUpperCase()}] ${cleanedLine}`);
        errorCount++;
        lineMatchedAsError = true;
        break; // Stop checking error patterns for this line
      }
    }

    // If not matched as an error, check for Warnings using the *cleaned* line
    if (!lineMatchedAsError) {
      for (const pattern of compiledWarningPatterns) {
        if (pattern.test(cleanedLine)) {
          // Add the CLEANED line
          warningLines.push(`[${taskId.toUpperCase()}] ${cleanedLine}`);
          warningCount++;
          // Don't break here for warnings, a line might match multiple warnings?
          // Or break if only the first warning match is desired. Let's break for simplicity.
          break;
        }
      }
    }
  });

  return {
    errors: errorCount,
    errorLines,
    warnings: warningCount,
    warningLines,
  };
}

// --- Main Execution Logic ---
async function main() {
  // 1. Initialize Log File
  try {
    fs.writeFileSync(logfilePath, headerMessage.trim() + '\n\n');
    console.log(chalk.blue(`Log file initialized: ${logfilePath}`)); // Console only info
  } catch (error) {
    console.error(
      chalk.red.bold(
        `FATAL: Cannot write to log file ${logfilePath}. Exiting.`,
      ),
      error,
    );
    process.exit(1);
  }

  let config;
  let allResults = []; // Store results for summary
  let overallSuccess = true;
  const startTime = Date.now();

  try {
    // 2. Load Config
    appendToLog('Loading configuration...', 'info');
    config = await loadConfig();
    appendToLog(
      `Configuration loaded. Found ${config.checks.length} checks.`,
      'info',
    );
    appendToLog(`Command Timeout: ${config.commandTimeout}ms`, 'debug'); // Log timeout

    const totalChecks = config.checks.length;

    // 3. Run Checks
    if (config.runInParallel) {
      appendToLog(`⚡ Running ${totalChecks} checks in parallel mode`, 'info');
      const promises = config.checks.map((check, index) =>
        runCommand(check, config.commandTimeout, config.logLevel || 'info') // Pass logLevel if available
          .then((result) => ({ check, result, index }))
          .catch((error) => ({
            // Catch errors *within* runCommand execution itself
            check,
            index,
            result: {
              success: false,
              output: `Internal runner error: ${error.message}`,
              stdout: '',
              stderr: error.stack || '', // Include stack in stderr for internal errors
              duration: 0,
              exitCode: null, // Indicate internal failure
              signal: null,
              timedOut: false,
            },
          })),
      );

      const settledResults = await Promise.allSettled(promises);

      settledResults.forEach((settledResult) => {
        if (settledResult.status === 'fulfilled') {
          const { check, result, index } = settledResult.value;
          allResults.push({ ...result, name: check.name }); // Store result with name

          const checkNum = index + 1;
          const checkPrefix = `[${checkNum}/${totalChecks}]`;
          const commandDisplay = `(${check.command})`;

          if (result.success) {
            appendToLog(
              `${checkPrefix} ✅ Success: ${check.name} ${commandDisplay}`,
              'info',
            );
            // Optionally log stdout/stderr for success if needed (can be verbose)
            // if (result.stdout) appendToLog(`[stdout]\n${result.stdout.trim()}`, 'raw');
            // if (result.stderr) appendToLog(`[stderr]\n${result.stderr.trim()}`, 'raw'); // Log warnings from stderr
          } else {
            overallSuccess = false;
            const failureReason = result.timedOut
              ? 'Timeout'
              : `Exit Code ${result.exitCode}`;
            appendToLog(
              `${checkPrefix} ❌ Failed (${failureReason}): ${check.name} ${commandDisplay}`,
              'error',
            );

            // Log stdout/stderr for failures
            const isPrettierCheck = check.name === 'Formatting (Prettier)';

            // Log stdout for failures, *unless* it's the Prettier check causing the failure
            if (result.stdout && !isPrettierCheck) {
              appendToLog(`\n--- stdout for ${check.name} ---`, 'raw');
              appendToLog(result.stdout.trim() || '(empty)', 'raw');
              appendToLog(`--- end stdout for ${check.name} ---\n`, 'raw');
            } else if (result.stdout && isPrettierCheck) {
              // Optional: Log a note that stdout was suppressed for Prettier failure
              appendToLog(
                `[INFO] Suppressed verbose stdout for failed Prettier check. See stderr below for errors.`,
                'info',
                false,
              ); // Log to file only
            }
            if (result.stderr) {
              appendToLog(`\n--- stderr for ${check.name} ---`, 'error', false); // Log header to file only
              console.error(
                chalk.red.bold(`\n--- stderr for ${check.name} ---`),
              ); // Log header to console
              appendToLog(result.stderr.trim() || '(empty)', 'raw'); // Log content to file and console
              appendToLog(
                `--- end stderr for ${check.name} ---\n`,
                'raw',
                false,
              ); // Log footer to file only
            }

            // Analyze and log specific errors
            const combinedOutput = `${result.stdout || ''}\n${result.stderr || ''}`;

            // --- V6: Enhanced Debugging for Pattern Loading ---
            console.log(
              `\n--- DEBUG V6: Attempting pattern load for check.id: "${check.id}" ---`,
            ); // Log the ID being used

            // Check if errorCategories exists on the config object
            if (
              config.errorCategories &&
              typeof config.errorCategories === 'object'
            ) {
              console.log(
                '--- DEBUG V6: config.errorCategories object found:',
                JSON.stringify(config.errorCategories, null, 2),
              ); // Log the whole categories object

              // Attempt to access the specific category using check.id
              const categoryConfig = config.errorCategories[check.id];

              if (categoryConfig) {
                console.log(
                  `--- DEBUG V6: Found categoryConfig for "${check.id}":`,
                  JSON.stringify(categoryConfig, null, 2),
                ); // Log the specific category found
                const currentErrorPatterns = categoryConfig.patterns || []; // Get patterns
                const currentWarningPatterns =
                  categoryConfig.warningPatterns || []; // Get warning patterns (if any)

                // --- Call categorizeLogOutput WITH patterns ---
                console.log(
                  `--- DEBUG V6: Calling categorizeLogOutput with ${currentErrorPatterns.length} error patterns.`,
                );
                const { errorLines, errors, warnings, warningLines } =
                  categorizeLogOutput(
                    combinedOutput,
                    check.id || check.name,
                    currentErrorPatterns,
                    currentWarningPatterns,
                  );

                // --- Log Output from categorizeLogOutput ---
                console.log(
                  `\n--- DEBUG V6: Output from categorizeLogOutput (${check.name}) ---`,
                );
                console.log(`Errors found: ${errors}`);
                console.log('Error Lines Array:', errorLines);
                console.log(`Warnings found: ${warnings}`);
                console.log('Warning Lines Array:', warningLines);
                console.log(`--- END DEBUG V6 OUTPUT ---`);

                // --- Log Detected Errors to File ---
                if (errorLines.length > 0) {
                  appendToLog(
                    `\n  Detected Errors for ${check.name}:`,
                    'error',
                  );
                  errorLines.forEach((line) => {
                    appendToLog(`    ${line}`, 'error');
                  });
                  // Add suggestion from config if available
                  if (categoryConfig.suggestion) {
                    appendToLog(
                      `    💡 Suggestion: ${categoryConfig.suggestion}`,
                      'info',
                      false,
                    );
                    console.log(
                      chalk.cyan(
                        `    💡 Suggestion for ${check.name}: ${categoryConfig.suggestion}`,
                      ),
                    );
                  }
                  appendToLog('', 'raw');
                }
                // Add similar block for warnings if needed...
              } else {
                console.error(
                  `--- DEBUG V6 ERROR: No categoryConfig found for check.id "${check.id}" within config.errorCategories! ---`,
                );
                // Handle case where patterns for this ID are missing - log nothing or a generic message?
                appendToLog(
                  `\n  [WARN] No specific error patterns configured for check "${check.name}" (id: ${check.id}). Cannot extract specific errors.`,
                  'warn',
                );
              }
            } else {
              console.error(
                '--- DEBUG V6 ERROR: config.errorCategories object not found or not an object in the loaded config! ---',
              );
              appendToLog(
                `\n  [WARN] "errorCategories" section missing or invalid in .wescore.json. Cannot extract specific errors.`,
                'warn',
              );
            }
            // --- End V6 Debugging ---
          }
        } else {
          // Handle unexpected errors during the Promise execution itself (rare)
          overallSuccess = false;
          const reason = settledResult.reason;
          const checkInfo = config.checks[allResults.length] || {
            name: 'Unknown Check',
            command: '',
          }; // Try to get check info
          appendToLog(
            `[${allResults.length + 1}/${totalChecks}] 💥 Critical failure executing check ${checkInfo.name}: ${reason?.message || reason}`,
            'error',
          );
          allResults.push({
            name: checkInfo.name,
            success: false,
            output: `Critical failure: ${reason?.message}`,
          });
        }
      });
    } else {
      // Sequential Execution
      appendToLog(
        `⚡ Running ${totalChecks} checks in sequential mode`,
        'info',
      );
      for (const [index, check] of config.checks.entries()) {
        const checkNum = index + 1;
        const checkPrefix = `[${checkNum}/${totalChecks}]`;
        const commandDisplay = `(${check.command})`;

        appendToLog(
          `\n${checkPrefix} ▶ Running: ${check.name} ${commandDisplay}`,
          'info',
        );

        const result = await runCommand(
          check,
          config.commandTimeout,
          config.logLevel || 'info',
        ).catch((error) => ({
          // Catch errors *within* runCommand execution itself
          success: false,
          output: `Internal runner error: ${error.message}`,
          stdout: '',
          stderr: error.stack || '',
          duration: 0,
          exitCode: null,
          signal: null,
          timedOut: false,
        }));

        allResults.push({ ...result, name: check.name }); // Store result with name

        if (result.success) {
          appendToLog(`${checkPrefix} ✅ Success: ${check.name}`, 'info');
          // Optionally log stdout/stderr for success
          // if (result.stdout) appendToLog(`[stdout]\n${result.stdout.trim()}`, 'raw');
          // if (result.stderr) appendToLog(`[stderr]\n${result.stderr.trim()}`, 'raw');
        } else {
          overallSuccess = false;
          const failureReason = result.timedOut
            ? 'Timeout'
            : `Exit Code ${result.exitCode}`;
          appendToLog(
            `${checkPrefix} ❌ Failed (${failureReason}): ${check.name}`,
            'error',
          );

          // Log stdout/stderr for failures
          const isPrettierCheck = check.name === 'Formatting (Prettier)';

          // Log stdout for failures, *unless* it's the Prettier check causing the failure
          if (result.stdout && !isPrettierCheck) {
            appendToLog(`\n--- stdout for ${check.name} ---`, 'raw');
            appendToLog(result.stdout.trim() || '(empty)', 'raw');
            appendToLog(`--- end stdout for ${check.name} ---\n`, 'raw');
          } else if (result.stdout && isPrettierCheck) {
            // Optional: Log a note that stdout was suppressed for Prettier failure
            appendToLog(
              `[INFO] Suppressed verbose stdout for failed Prettier check. See stderr below for errors.`,
              'info',
              false,
            ); // Log to file only
          }
          if (result.stderr) {
            appendToLog(`\n--- stderr for ${check.name} ---`, 'error', false); // Log header to file only
            console.error(chalk.red.bold(`\n--- stderr for ${check.name} ---`)); // Log header to console
            appendToLog(result.stderr.trim() || '(empty)', 'raw'); // Log content to file and console
            appendToLog(`--- end stderr for ${check.name} ---\n`, 'raw', false); // Log footer to file only
          }

          // Analyze and log specific errors
          const combinedOutput = `${result.stdout || ''}\n${result.stderr || ''}`;

          // --- V6: Enhanced Debugging for Pattern Loading ---
          console.log(
            `\n--- DEBUG V6: Attempting pattern load for check.id: "${check.id}" ---`,
          ); // Log the ID being used

          // Check if errorCategories exists on the config object
          if (
            config.errorCategories &&
            typeof config.errorCategories === 'object'
          ) {
            console.log(
              '--- DEBUG V6: config.errorCategories object found:',
              JSON.stringify(config.errorCategories, null, 2),
            ); // Log the whole categories object

            // Attempt to access the specific category using check.id
            const categoryConfig = config.errorCategories[check.id];

            if (categoryConfig) {
              console.log(
                `--- DEBUG V6: Found categoryConfig for "${check.id}":`,
                JSON.stringify(categoryConfig, null, 2),
              ); // Log the specific category found
              const currentErrorPatterns = categoryConfig.patterns || []; // Get patterns
              const currentWarningPatterns =
                categoryConfig.warningPatterns || []; // Get warning patterns (if any)

              // --- Call categorizeLogOutput WITH patterns ---
              console.log(
                `--- DEBUG V6: Calling categorizeLogOutput with ${currentErrorPatterns.length} error patterns.`,
              );
              const { errorLines, errors, warnings, warningLines } =
                categorizeLogOutput(
                  combinedOutput,
                  check.id || check.name,
                  currentErrorPatterns,
                  currentWarningPatterns,
                );

              // --- Log Output from categorizeLogOutput ---
              console.log(
                `\n--- DEBUG V6: Output from categorizeLogOutput (${check.name}) ---`,
              );
              console.log(`Errors found: ${errors}`);
              console.log('Error Lines Array:', errorLines);
              console.log(`Warnings found: ${warnings}`);
              console.log('Warning Lines Array:', warningLines);
              console.log(`--- END DEBUG V6 OUTPUT ---`);

              // --- Log Detected Errors to File ---
              if (errorLines.length > 0) {
                appendToLog(`\n  Detected Errors for ${check.name}:`, 'error');
                errorLines.forEach((line) => {
                  appendToLog(`    ${line}`, 'error');
                });
                // Add suggestion from config if available
                if (categoryConfig.suggestion) {
                  appendToLog(
                    `    💡 Suggestion: ${categoryConfig.suggestion}`,
                    'info',
                    false,
                  );
                  console.log(
                    chalk.cyan(
                      `    💡 Suggestion for ${check.name}: ${categoryConfig.suggestion}`,
                    ),
                  );
                }
                appendToLog('', 'raw');
              }
              // Add similar block for warnings if needed...
            } else {
              console.error(
                `--- DEBUG V6 ERROR: No categoryConfig found for check.id "${check.id}" within config.errorCategories! ---`,
              );
              // Handle case where patterns for this ID are missing - log nothing or a generic message?
              appendToLog(
                `\n  [WARN] No specific error patterns configured for check "${check.name}" (id: ${check.id}). Cannot extract specific errors.`,
                'warn',
              );
            }
          } else {
            console.error(
              '--- DEBUG V6 ERROR: config.errorCategories object not found or not an object in the loaded config! ---',
            );
            appendToLog(
              `\n  [WARN] "errorCategories" section missing or invalid in .wescore.json. Cannot extract specific errors.`,
              'warn',
            );
          }
          // --- End V6 Debugging ---
        }
      }
    }

    // 4. Final Summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    const failedChecks = allResults.filter((r) => !r.success);

    appendToLog('\n--- Checks Complete ---', 'info');
    appendToLog(
      `Ran ${allResults.length}/${totalChecks} checks in ${duration}s`,
      'info',
    );

    if (failedChecks.length > 0) {
      appendToLog(`\n${failedChecks.length} check(s) failed:`, 'error');
      failedChecks.forEach((check) => {
        appendToLog(`  ▼ ${check.name}`, 'error');
      });
    } else {
      appendToLog('\n✅ All checks passed!', 'info');
    }

    process.exit(overallSuccess ? 0 : 1);
  } catch (error) {
    // Catch errors during config loading or other setup phases
    appendToLog(
      chalk.red.bold('\nCritical error during script execution:'),
      'error',
    );
    appendToLog(error.message, 'error');
    if (error.stack) {
      appendToLog(error.stack, 'error');
    }
    process.exit(1);
  }
}

main();
