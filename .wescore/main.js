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
𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆: 𝐖𝐞𝐬𝐜𝐨𝐫𝐞 𝐂𝐨𝐝𝐞𝐛𝐚𝐬𝐞 𝐐𝐮𝐚𝐥𝐢𝐭𝐲 𝐅𝐫𝐚𝐦𝐞𝐰𝐨𝐫𝐤

𝐂𝐨𝐝𝐞𝐛𝐚𝐬𝐞:
- 𝐍𝐞𝐱𝐭.𝐣𝐬 𝟏𝟒 (𝐀𝐩𝐩 𝐑𝐨𝐮𝐭𝐞𝐫)
- 𝐑𝐞𝐚𝐜𝐭 𝟏𝟖
- 𝐓𝐲𝐩𝐞𝐒𝐜𝐫𝐢𝐩𝐭
- 𝐓𝐚𝐢𝐥𝐰𝐢𝐧𝐝 𝐂𝐒𝐒
- 𝐒𝐡𝐚𝐝𝐜𝐧/𝐔𝐈 𝐂𝐨𝐦𝐩𝐨𝐧𝐞𝐧𝐭𝐬
- 𝐌𝐃𝐗 𝐟𝐨𝐫 𝐁𝐥𝐨𝐠 𝐂𝐨𝐧𝐭𝐞𝐧𝐭
- 𝐋𝐮𝐜𝐢𝐝𝐞 𝐑𝐞𝐚𝐜𝐭 𝐈𝐜𝐨𝐧𝐬
- 𝐕𝐞𝐫𝐜𝐞𝐥 𝐇𝐨𝐬𝐭𝐢𝐧𝐠

𝐎𝐛𝐣𝐞𝐜𝐭𝐢𝐯𝐞:
- 𝐏𝐫𝐨𝐯𝐢𝐝𝐞 𝐚𝐬𝐬𝐢𝐬𝐭𝐚𝐧𝐜𝐞 𝐢𝐧 𝐢𝐦𝐩𝐥𝐞𝐦𝐞𝐧𝐭𝐢𝐧𝐠 𝐢𝐦𝐩𝐫𝐨𝐯𝐞𝐦𝐞𝐧𝐭𝐬 𝐚𝐧𝐝 𝐟𝐢𝐱𝐞𝐬 𝐬𝐲𝐬𝐭𝐞𝐦𝐚𝐭𝐢𝐜𝐚𝐥𝐥𝐲.
- 𝐔𝐩𝐝𝐚𝐭𝐞 𝐭𝐡𝐞 𝐢𝐧𝐜𝐨𝐫𝐫𝐞𝐜𝐭 𝐢𝐦𝐩𝐨𝐫𝐭 𝐩𝐚𝐭𝐡 𝐭𝐨 𝐫𝐞𝐟𝐞𝐫𝐞𝐧𝐜𝐞 𝐭𝐡𝐞 𝐜𝐨𝐫𝐫𝐞𝐜𝐭 𝐟𝐢𝐥𝐞 𝐥𝐨𝐜𝐚𝐭𝐢𝐨𝐧.
- 𝐅𝐢𝐱 𝐚𝐧𝐲 𝐬𝐲𝐧𝐭𝐚𝐱 𝐢𝐬𝐬𝐮𝐞𝐬, 𝐭𝐲𝐩𝐞 𝐦𝐢𝐬𝐦𝐚𝐭𝐜𝐡𝐞𝐬, 𝐚𝐧𝐝 𝐫𝐞𝐦𝐨𝐯𝐞/𝐢𝐦𝐩𝐥𝐞𝐦𝐞𝐧𝐭 𝐮𝐧𝐮𝐬𝐞𝐝 𝐯𝐚𝐫𝐢𝐚𝐛𝐥𝐞𝐬 𝐰𝐡𝐢𝐥𝐞 𝐞𝐧𝐬𝐮𝐫𝐢𝐧𝐠 𝐭𝐡𝐚𝐭 𝐭𝐡𝐞 𝐞𝐱𝐢𝐬𝐭𝐢𝐧𝐠 𝐟𝐮𝐧𝐜𝐭𝐢𝐨𝐧𝐚𝐥𝐢𝐭𝐲 𝐫𝐞𝐦𝐚𝐢𝐧𝐬 𝐢𝐧𝐭𝐚𝐜𝐭.

𝐃𝐞𝐭𝐚𝐢𝐥𝐬:
𝟏. 𝐋𝐨𝐠 𝐅𝐢𝐥𝐞: 𝐏𝐥𝐞𝐚𝐬𝐞 𝐫𝐞𝐟𝐞𝐫 𝐭𝐨 𝐭𝐡𝐞 𝐟𝐮𝐥𝐥 𝐥𝐨𝐠 𝐭𝐫𝐚𝐜𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞𝐝 𝐢𝐧 \`𝐫𝐮𝐧_𝐭𝐚𝐬𝐤𝐬.𝐥𝐨𝐠\` 𝐟𝐨𝐫 𝐚𝐧𝐲 𝐫𝐞𝐥𝐞𝐯𝐚𝐧𝐭 𝐢𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧.
𝟐. 𝐂𝐨𝐦𝐦𝐚𝐧𝐝 𝐔𝐬𝐞𝐝: 𝐓𝐡𝐞 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐞𝐱𝐞𝐜𝐮𝐭𝐞𝐝 𝐰𝐚𝐬 \`𝐧𝐩𝐦 𝐫𝐮𝐧 𝐜𝐪\` (𝐨𝐫 𝐬𝐢𝐦𝐢𝐥𝐚𝐫, 𝐛𝐚𝐬𝐞𝐝 𝐨𝐧 𝐡𝐨𝐰 𝐭𝐡𝐢𝐬 𝐬𝐜𝐫𝐢𝐩𝐭 𝐢𝐬 𝐢𝐧𝐯𝐨𝐤𝐞𝐝).

𝐓𝐚𝐬𝐤𝐬:
𝟏. 𝐑𝐞𝐯𝐢𝐞𝐰 𝐋𝐨𝐠𝐬: 𝐀𝐧𝐚𝐥𝐲𝐳𝐞 𝐭𝐡𝐞 \`𝐫𝐮𝐧_𝐭𝐚𝐬𝐤𝐬.𝐥𝐨𝐠\` 𝐟𝐢𝐥𝐞 𝐭𝐨 𝐢𝐝𝐞𝐧𝐭𝐢𝐟𝐲 𝐚𝐧𝐲 𝐞𝐫𝐫𝐨𝐫𝐬, 𝐰𝐚𝐫𝐧𝐢𝐧𝐠𝐬, 𝐨𝐫 𝐚𝐫𝐞𝐚𝐬 𝐭𝐡𝐚𝐭 𝐧𝐞𝐞𝐝 𝐢𝐦𝐩𝐫𝐨𝐯𝐞𝐦𝐞𝐧𝐭.
𝟐. 𝐈𝐦𝐩𝐥𝐞𝐦𝐞𝐧𝐭 𝐅𝐢𝐱𝐞𝐬: 𝐀𝐝𝐝𝐫𝐞𝐬𝐬 𝐭𝐡𝐞 𝐢𝐝𝐞𝐧𝐭𝐢𝐟𝐢𝐞𝐝 𝐢𝐬𝐬𝐮𝐞𝐬 𝐬𝐲𝐬𝐭𝐞𝐦𝐚𝐭𝐢𝐜𝐚𝐥𝐥𝐲, 𝐞𝐧𝐬𝐮𝐫𝐢𝐧𝐠 𝐭𝐡𝐚𝐭 𝐞𝐚𝐜𝐡 𝐟𝐢𝐱 𝐢𝐬 𝐭𝐡𝐨𝐫𝐨𝐮𝐠𝐡𝐥𝐲 𝐭𝐞𝐬𝐭𝐞𝐝.
𝟑. 𝐌𝐚𝐢𝐧𝐭𝐚𝐢𝐧 𝐅𝐮𝐧𝐜𝐭𝐢𝐨𝐧𝐚𝐥𝐢𝐭𝐲: 𝐄𝐧𝐬𝐮𝐫𝐞 𝐭𝐡𝐚𝐭 𝐚𝐥𝐥 𝐞𝐱𝐢𝐬𝐭𝐢𝐧𝐠 𝐟𝐮𝐧𝐜𝐭𝐢𝐨𝐧𝐚𝐥𝐢𝐭𝐲 𝐫𝐞𝐦𝐚𝐢𝐧𝐬 𝐨𝐩𝐞𝐫𝐚𝐭𝐢𝐨𝐧𝐚𝐥 𝐚𝐧𝐝 𝐮𝐧𝐚𝐟𝐟𝐞𝐜𝐭𝐞𝐝 𝐛𝐲 𝐭𝐡𝐞 𝐜𝐡𝐚𝐧𝐠𝐞𝐬.
𝟒. 𝐃𝐨𝐜𝐮𝐦𝐞𝐧𝐭𝐚𝐭𝐢𝐨𝐧: 𝐃𝐨𝐜𝐮𝐦𝐞𝐧𝐭 𝐚𝐥𝐥 𝐜𝐡𝐚𝐧𝐠𝐞𝐬 𝐦𝐚𝐝𝐞, 𝐢𝐧𝐜𝐥𝐮𝐝𝐢𝐧𝐠 𝐭𝐡𝐞 𝐫𝐚𝐭𝐢𝐨𝐧𝐚𝐥𝐞 𝐛𝐞𝐡𝐢𝐧𝐝 𝐞𝐚𝐜𝐡 𝐟𝐢𝐱 𝐚𝐧𝐝 𝐚𝐧𝐲 𝐭𝐞𝐬𝐭𝐢𝐧𝐠 𝐩𝐫𝐨𝐜𝐞𝐝𝐮𝐫𝐞𝐬 𝐮𝐬𝐞𝐝.

𝐄𝐱𝐩𝐞𝐜𝐭𝐞𝐝 𝐎𝐮𝐭𝐜𝐨𝐦𝐞:
- 𝐀 𝐬𝐭𝐚𝐛𝐥𝐞 𝐬𝐲𝐬𝐭𝐞𝐦 𝐰𝐢𝐭𝐡 𝐢𝐦𝐩𝐫𝐨𝐯𝐞𝐝 𝐩𝐞𝐫𝐟𝐨𝐫𝐦𝐚𝐧𝐜𝐞 𝐚𝐧𝐝 𝐟𝐢𝐱𝐞𝐝 𝐢𝐬𝐬𝐮𝐞𝐬.
- 𝐃𝐞𝐭𝐚𝐢𝐥𝐞𝐝 𝐝𝐨𝐜𝐮𝐦𝐞𝐧𝐭𝐚𝐭𝐢𝐨𝐧 𝐨𝐟 𝐚𝐥𝐥 𝐜𝐡𝐚𝐧𝐠𝐞𝐬 𝐚𝐧𝐝 𝐭𝐞𝐬𝐭𝐢𝐧𝐠 𝐫𝐞𝐬𝐮𝐥𝐭𝐬.
- 𝐒𝐦𝐨𝐨𝐭𝐡 𝐜𝐨𝐝𝐞-𝐪𝐮𝐚𝐥𝐢𝐭𝐲 𝐜𝐡𝐞𝐜𝐤 𝐫𝐞𝐬𝐮𝐥𝐭𝐬 𝐮𝐬𝐢𝐧𝐠 𝐭𝐡𝐞 𝐞𝐱𝐞𝐜𝐮𝐭𝐞𝐝 𝐜𝐨𝐦𝐦𝐚𝐧𝐝.

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
