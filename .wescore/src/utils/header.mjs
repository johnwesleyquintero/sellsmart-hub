// .wescore/src/utils/header.mjs
import os from 'os';
import process from 'process';

/**
 * @typedef {object} HeaderData
 * @property {Date} [startTime] - The time the process started. Defaults to new Date().
 * @property {string} [logfilePath] - Path to the log file being generated. Defaults to '.task_tracker.log'.
 * @property {string} [commandExecuted] - The command that initiated the script (e.g., 'npm run cq'). Defaults to 'N/A'.
 * @property {number} [totalChecks] - Total number of checks planned or executed.
 * @property {number} [passedChecks] - Number of checks that passed.
 * @property {number} [failedChecks] - Number of checks that failed.
 * @property {string[]} [failedCheckNames] - An array of names for the checks that failed.
 * @property {number} [durationSeconds] - The total duration of the run in seconds.
 * @property {string} [gitCommitHash] - The current Git commit hash (if available).
 * @property {string} [nodeVersion] - The version of Node.js being used.
 * @property {string} [platform] - The operating system platform.
 */

/**
 * Generates a standardized header message for log files, incorporating dynamic run information.
 *
 * @param {HeaderData} [data={}] - An object containing dynamic data about the current run.
 * @returns {string} The formatted header string.
 */
export function generateHeader(data = {}) {
  const {
    startTime = new Date(),
    logfilePath = '.task_tracker.log', // Sensible default
    commandExecuted = process.argv.slice(2).join(' ') || 'N/A', // Attempt to get command
    totalChecks,
    passedChecks,
    failedChecks,
    failedCheckNames = [],
    durationSeconds,
    gitCommitHash, // You'll need logic in the calling script to get this
    nodeVersion = process.version,
    platform = `${os.platform()} ${os.release()}`,
  } = data;

  const formattedTimestamp = startTime.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  // --- Build Dynamic Run Summary Section ---
  let runSummary = `
========================================================
                        RUN SUMMARY
========================================================
Timestamp:         ${formattedTimestamp}
Platform:          ${platform}
Node Version:      ${nodeVersion}
Command Executed:  ${commandExecuted || 'N/A'}
Log File:          ${logfilePath}
`;

  if (gitCommitHash) {
    runSummary += `Git Commit:        ${gitCommitHash}\n`;
  }
  if (typeof durationSeconds === 'number') {
    runSummary += `Duration:          ${durationSeconds.toFixed(2)} seconds\n`;
  }
  if (typeof totalChecks === 'number') {
    runSummary += `Checks Run:        ${totalChecks}\n`;
  }
  if (typeof passedChecks === 'number') {
    runSummary += `Checks Passed:     ${passedChecks}\n`;
  }
  if (typeof failedChecks === 'number') {
    runSummary += `Checks Failed:     ${failedChecks}\n`;
  }

  if (failedCheckNames.length > 0) {
    runSummary += `\nFailed Checks Details:\n`;
    failedCheckNames.forEach((name) => {
      runSummary += `  - ${name}\n`;
    });
  } else if (
    typeof failedChecks === 'number' &&
    failedChecks === 0 &&
    typeof totalChecks === 'number' &&
    totalChecks > 0
  ) {
    runSummary += `\nResult:            ✅ All ${totalChecks} checks passed.\n`;
  } else if (typeof failedChecks === 'number' && failedChecks > 0) {
    runSummary += `\nResult:            ❌ ${failedChecks} check(s) failed.\n`;
  } else {
    runSummary += `\nResult:            Status N/A (check counts not provided).\n`;
  }

  // --- Static Context Section (Slightly more generic) ---
  const staticContext = `
========================================================
𝐄𝐗𝐄𝐂𝐔𝐓𝐈𝐕𝐄 𝐒𝐔𝐌𝐌𝐀𝐑𝐘: 𝐒𝐘𝐒𝐓𝐄𝐌𝐀𝐓𝐈𝐂 𝐈𝐌𝐏𝐑𝐎𝐕𝐄𝐌𝐄𝐍𝐓𝐒 𝐀𝐍𝐃 𝐅𝐈𝐗𝐄𝐒
========================================================

𝐂𝐎𝐃𝐄𝐁𝐀𝐒𝐄 𝐂𝐎𝐍𝐓𝐄𝐗𝐓:
- 𝐍𝐞𝐱𝐭.𝐣𝐬 𝟏𝟒 (𝐀𝐩𝐩 𝐑𝐨𝐮𝐭𝐞𝐫)
- 𝐑𝐞𝐚𝐜𝐭 𝟏𝟖
- 𝐓𝐲𝐩𝐞𝐒𝐜𝐫𝐢𝐩𝐭
- 𝐓𝐚𝐢𝐥𝐰𝐢𝐧𝐝 𝐂𝐒𝐒
- 𝐒𝐡𝐚𝐝𝐜𝐧/𝐔𝐈 𝐂𝐨𝐦𝐩𝐨𝐧𝐞𝐧𝐭𝐬
- 𝐌𝐃𝐗 𝐟𝐨𝐫 𝐁𝐥𝐨𝐠 𝐂𝐨𝐧𝐭𝐞𝐧𝐭
- 𝐋𝐮𝐜𝐢𝐝𝐞 𝐑𝐞𝐚𝐜𝐭 𝐈𝐜𝐨𝐧𝐬
- 𝐕𝐞𝐫𝐜𝐞𝐥 𝐇𝐨𝐬𝐭𝐢𝐧𝐠

𝐎𝐁𝐉𝐄𝐂𝐓𝐈𝐕𝐄 (General):
- Ensure code quality, consistency, and correctness through automated checks.
- Identify and report issues for systematic improvement and fixing.
- Provide clear context and results for each execution run.

𝐃𝐄𝐓𝐀𝐈𝐋𝐒:
𝟏. 𝐋𝐨𝐠 𝐅𝐢𝐥𝐞: See 'RUN SUMMARY' section above for the specific log file used in this run. Full details are within that file.
𝟐. 𝐂𝐨𝐦𝐦𝐚𝐧𝐝 𝐔𝐬𝐞𝐝: See 'RUN SUMMARY' section above.

𝐓𝐀𝐒𝐊𝐒 (General):
𝟏. 𝐑𝐞𝐯𝐢𝐞𝐰 𝐋𝐨𝐠𝐬: Analyze the generated log file for detailed output, errors, and warnings based on the RUN SUMMARY.
𝟐. 𝐈𝐦𝐩𝐥𝐞𝐦𝐞𝐧𝐭 𝐅𝐢𝐱𝐞𝐬: Address any identified issues based on the run results and log details.
𝟑. 𝐕𝐞𝐫𝐢𝐟𝐲: Re-run checks after fixes to ensure issues are resolved.

𝐄𝐗𝐏𝐄𝐂𝐓𝐄𝐃 𝐎𝐔𝐓𝐂𝐎𝐌𝐄:
- Clear reporting of check results (pass/fail).
- Identification of specific errors or areas needing attention.
- Contribution to a more stable and maintainable codebase.
`;

  // --- Final Assembly ---
  const finalHeader = `
${staticContext.trim()}
${runSummary.trim()}
===========================================
𝐒𝐓𝐀𝐑𝐓 𝐎𝐅 𝐂𝐎𝐃𝐄𝐁𝐀𝐒𝐄 𝐀𝐍𝐀𝐋𝐘𝐒𝐈𝐒 𝐅𝐑𝐀𝐌𝐄𝐖𝐎𝐑𝐊 𝐋𝐎𝐆
===========================================

`; // Add extra newline for separation

  return finalHeader;
}
