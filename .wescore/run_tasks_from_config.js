// .wescore/run_tasks_from_config.js
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import util from 'util';

// --- Helper Functions ---
/**
 * Analyzes log data (stdout/stderr) to categorize messages.
 * @param {string} logData - The combined stdout and stderr output of a task.
 * @returns {{errors: number, warnings: number, others: number, errorLines: string[], warningLines: string[]}} - Counts and specific lines for each category.
 */
function categorizeLogOutput(logData) {
  const lines = logData.split('\n');
  let errors = 0;
  let warnings = 0;
  let others = 0;
  const errorLines = [];
  const warningLines = [];

  // Define patterns (case-insensitive)
  // Prioritize error patterns over warning patterns
  const errorPatterns = [
    /failed to compile/i, // Build errors
    /module not found/i, // Build errors
    /error TS\d+:/i, // TypeScript errors
    /\berror\b/i, // General 'error' word
    /\[error\]/i, // [error] tag
    /\bfail(ed)?\b/i, // 'fail' or 'failed'
    /exception/i, // 'exception'
    // Add more specific error patterns relevant to your tools
  ];

  const warningPatterns = [
    /\bwarn(ing)?\b/i, // 'warn' or 'warning'
    /\[warn\]/i, // [warn] tag
    /deprecated/i, // 'deprecated'
    /⚠/, // Warning symbol
    // Add more specific warning patterns
  ];

  lines.forEach((line) => {
    if (!line.trim()) return; // Skip empty lines

    let isError = false;
    try {
      for (const pattern of errorPatterns) {
        if (pattern.test(line)) {
          errors++;
          errorLines.push(line);
          isError = true;
          break; // Categorized as error, stop checking patterns for this line
        }
      }
    } catch (error) {
      console.error('Error processing pattern:', error);
      // Continue processing other lines even if one fails
      return;
    }

    if (!isError) {
      let isWarning = false;
      for (const pattern of warningPatterns) {
        if (pattern.test(line)) {
          warnings++;
          warningLines.push(line);
          isWarning = true;
          break; // Categorized as warning, stop checking
        }
      }
      if (!isWarning) {
        others++; // Count lines that are neither error nor warning
      }
    }
  });

  return { errors, warnings, others, errorLines, warningLines };
}

// Promisify exec for easier async/await usage
const execPromise = util.promisify(exec);

// --- Configuration ---
const configPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '.wescore.json',
);
const logfilePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'run_tasks.log',
); // Log file in the root directory

const headerMessage = `

===========================================================
𝐑𝐞𝐪𝐮𝐞𝐬𝐭 𝐟𝐨𝐫 𝐒𝐲𝐬𝐭𝐞𝐦𝐚𝐭𝐢𝐜 𝐈𝐦𝐩𝐥𝐞𝐦𝐞𝐧𝐭𝐚𝐭𝐢𝐨𝐧 𝐨𝐟 𝐈𝐦𝐩𝐫𝐨𝐯𝐞𝐦𝐞𝐧𝐭𝐬 𝐚𝐧𝐝 𝐅𝐢𝐱𝐞𝐬
===========================================================
𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆: 𝗦𝗰𝗮𝗹𝗲𝗪𝗶𝘁𝗵𝗪𝗲𝘀𝗹𝗲𝘆 𝗫 𝗪𝗘𝗦𝗖𝗢𝗥𝗘|𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗺𝗲𝗻𝘁 𝗧𝗮𝘀𝗸 𝗥𝘂𝗻𝗻𝗲𝗿

Objective:
- I need your assistance in implementing improvements and fixes systematically.
- Update the incorrect import path to reference the correct file location.
- Fix any syntax issues, type mismatches, and remove/implement unused variables while ensuring that the existing functionality remains intact.

Details:
1. Log File: Please refer to the full log trace provided in \`run_tasks.log\` for any relevant information.
2. Command Used: The command executed was \`npm run cq\`.

Tasks:
1. Review Logs: Analyze the \`run_tasks.log\` file to identify any errors, warnings, or areas that need improvement.
2. Implement Fixes: Address the identified issues systematically, ensuring that each fix is thoroughly tested.
3. Maintain Functionality: Ensure that all existing functionality remains operational and unaffected by the changes.
4. Documentation: Document all changes made, including the rationale behind each fix and any testing procedures used.

Expected Outcome:
- A stable system with improved performance and fixed issues.
- Detailed documentation of all changes and testing results.
- Smooth code-quality check results using \`npm run cq\`.

========================================
Starting Task Runner Log from Config
Timestamp: ${new Date().toISOString()}
========================================
`;

// --- Helper Functions ---
function appendToLog(message) {
  try {
    fs.appendFileSync(logfilePath, message + '\n');
    console.log(message); // Also log to console for real-time feedback
  } catch (error) {
    console.error(`Error appending to ${logfilePath}:`, error);
    console.error('Original message:', message); // Log original message if file write fails
  }
}

async function runCheck(check, timeout) {
  const startTime = Date.now();
  appendToLog(`\n[START] ${check.name} (${check.id})`);
  appendToLog(`  > ${check.command}`);
  try {
    // Execute the command. Timeout is in milliseconds.
    const { stdout, stderr } = await execPromise(check.command, { timeout });
    const duration = Date.now() - startTime;

    if (stdout) appendToLog(`  [stdout]\\n---\\n${stdout.trim()}\\n---`);
    if (stderr) appendToLog(`  [stderr]\\n---\\n${stderr.trim()}\\n---`); // Log stderr even on success (for warnings)

    appendToLog(
      `[END] ${check.name} - SUCCESS (Exit Code: 0, Duration: ${duration}ms)`,
    );
    return { ...check, success: true, exitCode: 0, stdout, stderr, duration };
  } catch (error) {
    // execPromise rejects on non-zero exit code or other errors (like timeout)
    const duration = Date.now() - startTime;
    const exitCode = error.code ?? 1; // Default to 1 if code is null/undefined
    const wasTimeout = error.signal === 'SIGTERM' && error.killed; // exec uses SIGTERM for timeout

    appendToLog(`  [stdout]\\n---\\n${error.stdout?.trim() ?? ''}\\n---`);
    appendToLog(`  [stderr]\\n---\\n${error.stderr?.trim() ?? ''}\\n---`);

    if (wasTimeout) {
      appendToLog(
        `[END] ${check.name} - FAILED (Timeout after ${timeout}ms, Exit Code: ${exitCode}, Signal: ${error.signal})`,
      );
    } else {
      appendToLog(
        `[END] ${check.name} - FAILED (Exit Code: ${exitCode}, Duration: ${duration}ms)`,
      );
    }
    // Include the error object itself for more details if needed later
    return {
      ...check,
      success: false,
      exitCode,
      stdout: error.stdout,
      stderr: error.stderr,
      error,
      duration,
      wasTimeout,
    };
  }
}

// --- Main Execution Logic ---
async function main() {
  // 1. Write header to log file (overwrite)
  try {
    fs.writeFileSync(logfilePath, headerMessage.trim() + '\\n\\n');
    console.log(`Log file initialized: ${logfilePath}`);
  } catch (error) {
    console.error(`FATAL: Error writing header to ${logfilePath}:`, error);
    process.exit(1); // Exit if we can't even write the log header
  }

  // 2. Read and parse config
  let config;
  try {
    appendToLog(`Loading configuration from: ${configPath}`);
    const configFileContent = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configFileContent);
    appendToLog(`Configuration loaded successfully.`);
  } catch (error) {
    appendToLog(
      `FATAL: Error reading or parsing ${configPath}: ${error.message}`,
    );
    process.exit(1);
  }

  // Destructure config with defaults
  const {
    checks = [],
    parallel = false,
    stopOnFail = false,
    commandTimeout = 300000, // Default 5 minutes
  } = config;

  if (!Array.isArray(checks) || checks.length === 0) {
    appendToLog('No checks found in configuration. Exiting.');
    process.exit(0);
  }

  appendToLog(`\\n--- Execution Settings ---`);
  appendToLog(`Parallel: ${parallel}`);
  appendToLog(`Stop on Fail: ${stopOnFail}`);
  appendToLog(`Command Timeout: ${commandTimeout}ms`);
  appendToLog(`--------------------------`);

  // 3. Execute checks
  const results = [];
  let overallSuccess = true;
  let stoppedEarly = false;

  async function runCheckWrapper(check) {
    const startTime = Date.now();
    appendToLog(`\n[START] ${check.name} (${check.id})`);
    appendToLog(`  > ${check.command}`);
    try {
      // Execute the command. Timeout is in milliseconds.
      const { stdout, stderr } = await execPromise(check.command, {
        timeout: commandTimeout,
      });
      const duration = Date.now() - startTime;

      // --- NEW: Call categorization ---
      const combinedOutput = `${stdout}\n${stderr}`; // Combine outputs for analysis
      const categorizedLogs = categorizeLogOutput(combinedOutput);
      // --- END NEW ---

      if (stdout) appendToLog(`  [stdout]\\n---\\n${stdout.trim()}\\n---`);
      if (stderr) appendToLog(`  [stderr]\\n---\\n${stderr.trim()}\\n---`); // Log stderr even on success (for warnings)

      // --- NEW: Optionally log categorization summary ---
      if (categorizedLogs.errors > 0 || categorizedLogs.warnings > 0) {
        appendToLog(
          `  [Analysis] Errors: ${categorizedLogs.errors}, Warnings: ${categorizedLogs.warnings}`,
        );
      }
      // --- END NEW ---

      appendToLog(
        `[END] ${check.name} - SUCCESS (Exit Code: 0, Duration: ${duration}ms)`,
      );
      return {
        ...check,
        success: true,
        exitCode: 0,
        stdout,
        stderr,
        duration,
        categorizedLogs,
      };
    } catch (error) {
      // execPromise rejects on non-zero exit code or other errors (like timeout)
      const duration = Date.now() - startTime;
      const exitCode = error.code ?? 1; // Default to 1 if code is null/undefined
      const wasTimeout = error.signal === 'SIGTERM' && error.killed; // exec uses SIGTERM for timeout

      // --- NEW: Analyze output even if runCommand threw an error (e.g., timeout) ---
      const outputSoFar = `${error.stdout || ''}\n${error.stderr || ''}`;
      const categorizedLogs = categorizeLogOutput(outputSoFar);
      // --- END NEW ---

      appendToLog(`  [stdout]\\n---\\n${error.stdout?.trim() ?? ''}\\n---`);
      appendToLog(`  [stderr]\\n---\\n${error.stderr?.trim() ?? ''}\\n---`);

      // --- NEW: Log categorization summary on catch ---
      appendToLog(
        `  [Analysis] Errors: ${categorizedLogs.errors}, Warnings: ${categorizedLogs.warnings}`,
      );
      // --- END NEW ---

      if (wasTimeout) {
        appendToLog(
          `[END] ${check.name} - FAILED (Timeout after ${commandTimeout}ms, Exit Code: ${exitCode}, Signal: ${error.signal})`,
        );
      } else {
        appendToLog(
          `[END] ${check.name} - FAILED (Exit Code: ${exitCode}, Duration: ${duration}ms)`,
        );
      }
      // Include the error object itself for more details if needed later
      return {
        ...check,
        success: false,
        exitCode,
        stdout: error.stdout,
        stderr: error.stderr,
        error,
        duration,
        wasTimeout,
        categorizedLogs,
      };
    }
  }

  if (parallel) {
    appendToLog('\\nRunning checks in parallel...');
    // Note: Simple parallel execution. stopOnFail is harder to implement reliably
    // here without more complex process management (cancelling ongoing processes).
    // This implementation runs all and checks results after.
    if (stopOnFail) {
      appendToLog(
        "Warning: 'stopOnFail: true' is less effective in parallel mode. All checks will start.",
      );
    }
    const promises = checks.map((check) => runCheckWrapper(check));
    // Use allSettled to ensure all promises complete, even if some fail
    const settledResults = await Promise.allSettled(promises);

    settledResults.forEach((result, index) => {
      const check = checks[index];
      if (result.status === 'fulfilled') {
        results.push(result.value); // result.value is the object returned by runCheck
        if (!result.value.success) {
          overallSuccess = false;
        }
      } else {
        // This indicates an unexpected error *before* runCheck could complete/catch
        const errorMsg = `Check "${check.name}" failed unexpectedly during execution setup: ${result.reason?.message || result.reason}`;
        appendToLog(errorMsg);
        results.push({
          ...check,
          success: false,
          exitCode: 1,
          error: result.reason,
        });
        overallSuccess = false;
      }
    });
  } else {
    appendToLog('\\nRunning checks sequentially...');
    for (const check of checks) {
      const result = await runCheckWrapper(check);
      results.push(result);

      if (!result.success) {
        overallSuccess = false;
        if (stopOnFail) {
          appendToLog(
            `\\nExecution stopped due to failure in "${check.name}" (stopOnFail=true).`,
          );
          stoppedEarly = true;
          break; // Exit the loop
        }
      }
    }
  }

  // 4. Final Summary
  appendToLog('\\n========================================');
  appendToLog('Task Execution Summary:');
  results.forEach((r) => {
    const status = r.success
      ? 'SUCCESS'
      : r.wasTimeout
        ? 'FAILED (Timeout)'
        : 'FAILED';
    appendToLog(`- ${r.name}: ${status} (Exit Code: ${r.exitCode ?? 'N/A'})`);
  });
  if (stoppedEarly) {
    appendToLog('\\nNote: Execution stopped early due to stopOnFail=true.');
  }
  appendToLog('========================================');

  // 5. Exit with appropriate code
  process.exit(overallSuccess ? 0 : 1);
}

// --- Run ---
main().catch((error) => {
  // Catch any top-level unexpected errors
  appendToLog(
    `\\nFATAL: Unhandled error during script execution: ${error.message}\\n${error.stack}`,
  );
  process.exit(1);
});
