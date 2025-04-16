// ===================================================================
// Wescore Codebase Quality Framework - Static Package Builder
// ===================================================================
// Project Stack:
// - Next.js 14 (App Router)
// - React 18
// - TypeScript
// - Tailwind CSS
// - Shadcn/UI Components
// - MDX for Blog Content
// - Lucide React Icons
// - Vercel Hosting
//
// Purpose:
// - Systematically build and package static site exports
// - Ensure proper cleanup of build artifacts
// - Handle process termination and file locking
// - Provide detailed logging for debugging
// ===================================================================

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';
// Import the singleton error logger
import { errorLogger } from '../src/reporting/error-logger.mjs';
// Import the standardized command runner
import { runCommand } from '../src/runner/commandRunner.mjs';
// Import utility functions (assuming index.mjs exports them)
import * as utils from '../src/utils/index.mjs';
// Import the dynamic header generator
import { generateHeader } from '../src/utils/header.mjs';
// Correctly import archiver functions (assuming index.mjs exports them)
import * as archiverUtils from '../src/archiver/index.mjs';

const { createZipFromDirectory } = archiverUtils;
const { cleanTarget, formatDate, getProjectInfo } = utils;

// --- Configuration ---
const SCRIPT_NAME = 'package-static.mjs'; // Define for context
const EXPORT_OUTPUT_DIR = 'out'; // Default Next.js static export directory
const NEXT_DIR = '.next'; // Default Next.js build cache directory
const RELEASES_DIR = 'releases'; // Directory to store the final zip files
const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);
// Standardize log file path
const logfilePath = path.join(process.cwd(), '.task_tracker.log');

// Assumes this script is in '.wescore/scripts', so project root is two levels up
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..', '..');

// --- Environment Variable Flags ---
const USE_LEGACY_PEER_DEPS = process.env.LEGACY_PEER_DEPS === 'true';
const USE_FORCE_INSTALL = process.env.FORCE_INSTALL === 'true';
// --- End Configuration ---

// --- Helper Functions ---

/**
 * Logs a message with a timestamp to console and appends to the log file.
 * NOTE: This function NO LONGER calls errorLogger directly. Call errorLogger from catch blocks.
 * @param {string} level - Log level (e.g., 'INFO', 'WARN', 'ERROR', 'SUCCESS')
 * @param {string} message - The message to log
 */
function log(level, message) {
  const timestamp = new Date().toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  let color = (text) => text; // Default: no color
  switch (level.toUpperCase()) {
    case 'INFO':
      color = (text) => `\x1b[34m${text}\x1b[0m`; // Blue
      break;
    case 'WARN':
      color = (text) => `\x1b[33m${text}\x1b[0m`; // Yellow
      break;
    case 'ERROR':
      color = (text) => `\x1b[31m${text}\x1b[0m`; // Red
      break;
    case 'SUCCESS':
      color = (text) => `\x1b[32m${text}\x1b[0m`; // Green
      break;
  }
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(color(logMessage));

  // Always APPEND to the log file (header should already be written)
  try {
    // Ensure log file path uses the standardized variable
    fs.appendFileSync(logfilePath, logMessage + '\n');
  } catch (appendError) {
    // Log append errors to console only, as writing to the file failed
    console.error(
      `\x1b[31m[LogAppendError] Failed to append to log file ${logfilePath}: ${appendError.message}\x1b[0m`,
    );
    // Log this failure using the dedicated error logger
    errorLogger.logError(appendError, {
      script: SCRIPT_NAME,
      phase: 'logAppend',
      originalLevel: level,
      originalMessage: message,
    });
  }
}

// --- Main Script Execution ---
async function main() {
  const overallStartTime = new Date(); // Use Date object for header
  const perfStartTime = performance.now(); // For duration calculation

  // --- Initialize Log File with Header ---
  try {
    const headerData = {
      startTime: overallStartTime,
      logfilePath: logfilePath,
      commandExecuted: `node ${path.relative(PROJECT_ROOT, __filename)}`, // More specific command
      // Add other relevant fields if available/needed later
    };
    const headerContent = generateHeader(headerData);
    // Write header, overwriting the log file for this run
    fs.writeFileSync(logfilePath, headerContent, 'utf8');
    log('INFO', `Initialized log file: ${logfilePath}`); // Log initialization using the log function
  } catch (headerError) {
    console.error(
      `\x1b[31m[CRITICAL] Failed to write log header to ${logfilePath}: ${headerError.message}\x1b[0m`,
    );
    // Log this critical failure using the dedicated error logger
    errorLogger.logError(headerError, {
      script: SCRIPT_NAME,
      phase: 'writeLogHeader',
    });
    process.exit(1); // Exit if we can't even write the header
  }

  log('INFO', 'Starting Static Site Build and Packaging Process...');
  log('INFO', `Project Root: ${PROJECT_ROOT}`);
  log('INFO', `Export Output Dir: ${EXPORT_OUTPUT_DIR}`);
  log('INFO', `Releases Dir: ${RELEASES_DIR}`);
  log('INFO', '');

  // --- Step 0: Prerequisite Checks ---
  log('INFO', 'Step 0: Checking prerequisites...');
  try {
    // Use runCommand for consistency and better error details
    const nodeVersionResult = await runCommand(
      { command: 'node -v', name: 'Node Check' },
      30000,
    );
    const npmVersionResult = await runCommand(
      { command: 'npm -v', name: 'NPM Check' },
      30000,
    );

    if (!nodeVersionResult.success)
      throw new Error(
        `Node check failed: ${nodeVersionResult.stderr || nodeVersionResult.output}`,
      );
    if (!npmVersionResult.success)
      throw new Error(
        `NPM check failed: ${npmVersionResult.stderr || npmVersionResult.output}`,
      );

    log('INFO', `Node version: ${nodeVersionResult.stdout.trim()}`);
    log('INFO', `npm version: ${npmVersionResult.stdout.trim()}`);

    // Check next.config.js (keep existing logic)
    const nextConfigPath = path.join(PROJECT_ROOT, 'next.config.js'); // or .mjs
    if (fs.existsSync(nextConfigPath)) {
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');
      if (
        !configContent.includes('output') ||
        !configContent.includes('export')
      ) {
        log(
          'WARN',
          "next.config.js found, but doesn't explicitly mention 'output: export'. Ensure static export is configured. Double check next.config.js file.",
        );
      } else {
        log('INFO', 'next.config.js seems to be configured for static export.');
      }
    } else {
      log(
        'WARN',
        "next.config.js not found. Ensure your project is configured for static export ('output: export').",
      );
    }
    log('SUCCESS', 'Step 0: Prerequisites check passed.');
  } catch (error) {
    log('ERROR', `Prerequisite check failed: ${error.message}`);
    errorLogger.logError(error, {
      script: SCRIPT_NAME,
      phase: 'prerequisites',
    });
    process.exit(1);
  }
  log('INFO', '');

  // --- Step 1: Cleaning previous build artifacts ---
  log('INFO', 'Step 1: Cleaning previous build artifacts...');
  const exportDirFullPath = path.join(PROJECT_ROOT, EXPORT_OUTPUT_DIR);
  const nextDirFullPath = path.join(PROJECT_ROOT, NEXT_DIR);
  const releasesFullPath = path.join(PROJECT_ROOT, RELEASES_DIR);

  // --- Retry Cleanup Logic (Keep existing, ensure it uses `log`) ---
  const retryCleanup = async (
    targetPath,
    description,
    maxRetries = 5,
    initialDelay = 2000,
  ) => {
    let lastError = null;
    const cleanupStart = performance.now();
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Kill processes (Windows specific - add comments about risks/alternatives)
        if (process.platform === 'win32') {
          log(
            'INFO',
            `Attempting to terminate processes locking files (attempt ${attempt})...`,
          );
          // Consider making process killing less aggressive or configurable
          const processCommands = [
            'taskkill /F /FI "WINDOWTITLE eq next.js*" /FI "IMAGENAME eq node.exe"',
            'taskkill /F /FI "COMMANDLINE eq *next build*" /FI "IMAGENAME eq node.exe"',
            'taskkill /F /FI "COMMANDLINE eq *next export*" /FI "IMAGENAME eq node.exe"',
            // Maybe remove these more aggressive ones unless absolutely necessary
            // 'taskkill /F /FI "IMAGENAME eq node.exe" /FI "MEMUSAGE gt 500" /FI "CPUTIME gt 00:05:00"',
            // `taskkill /F /FI "IMAGENAME eq node.exe" /FI "WINDOWTITLE eq *${path.basename(PROJECT_ROOT)}*"`,
          ];
          for (const cmd of processCommands) {
            try {
              execSync(cmd, { stdio: 'ignore' }); // Use execSync here for simplicity of taskkill
              log('INFO', `Executed process cleanup command: ${cmd}`);
            } catch (e) {
              if (!e.message.includes('no tasks')) {
                log(
                  'WARN',
                  `Process cleanup command (${cmd}) warning: ${e.message}`,
                );
              }
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        // Use the imported cleanTarget utility
        cleanTarget(targetPath, description); // Assuming cleanTarget logs its own progress/errors
        const cleanupTime = ((performance.now() - cleanupStart) / 1000).toFixed(
          2,
        );
        log(
          'SUCCESS',
          `Successfully cleaned ${description} after ${attempt} attempt(s) in ${cleanupTime}s`,
        );
        return true; // Exit loop on success
      } catch (error) {
        lastError = error; // Store the error
        const delay = initialDelay * Math.pow(2, attempt - 1);
        log(
          'WARN',
          `Attempt ${attempt}/${maxRetries} to clean ${description} failed: ${error.message}`,
        );
        // Log the specific cleanup error to the error logger
        errorLogger.logError(error, {
          script: SCRIPT_NAME,
          phase: 'retryCleanup',
          attempt: attempt,
          target: description,
        });
        if (attempt < maxRetries) {
          log(
            'INFO',
            `Waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          log(
            'ERROR',
            `Failed to clean ${description} after ${maxRetries} attempts. Last error: ${lastError.message}`,
          );
          // Re-throw the last error to be caught by the outer try/catch
          throw new Error(
            `Cleanup failed for ${description} after ${maxRetries} attempts: ${lastError.message}`,
          );
        }
      }
    }
    return false; // Should not be reached if successful, indicates failure after retries
  };
  // --- End Retry Cleanup Logic ---

  try {
    await retryCleanup(exportDirFullPath, `'${EXPORT_OUTPUT_DIR}' directory`);
    await retryCleanup(nextDirFullPath, `'${NEXT_DIR}' directory`);
    await retryCleanup(releasesFullPath, `'${RELEASES_DIR}' directory`);
    log('SUCCESS', 'Step 1: Cleanup finished.');
  } catch (error) {
    // Error already logged by retryCleanup
    log(
      'ERROR',
      `Critical cleanup failure after all retries. Exiting. Error: ${error.message}`,
    );
    // errorLogger already logged the specific attempt failures
    process.exit(1); // Exit if cleanup is critical
  }
  log('INFO', '');

  // --- Step 2: Installing dependencies ---
  log('INFO', 'Step 2: Installing dependencies...');
  try {
    const installArgs = [];
    const hasPackageLock = fs.existsSync(
      path.join(PROJECT_ROOT, 'package-lock.json'),
    );
    const installCommand = hasPackageLock ? 'ci' : 'install';
    log('INFO', `Using command: npm ${installCommand}`);

    if (USE_LEGACY_PEER_DEPS) {
      installArgs.push('--legacy-peer-deps');
      log('INFO', "Using '--legacy-peer-deps' flag.");
    }
    if (USE_FORCE_INSTALL) {
      installArgs.push('--force');
      log('WARN', "Using '--force' flag. Use with caution.");
    }

    // Use runCommand for install step
    const installResult = await runCommand(
      {
        command: `npm ${installCommand} ${installArgs.join(' ')}`,
        name: 'Dependency Installation',
        cwd: PROJECT_ROOT, // Specify working directory
      },
      600000, // Long timeout for installs (10 minutes)
    );

    if (!installResult.success) {
      log(
        'ERROR',
        `Dependency installation failed (Exit Code: ${installResult.exitCode})`,
      );
      if (installResult.stdout) log('INFO', `stdout:\n${installResult.stdout}`);
      if (installResult.stderr)
        log('ERROR', `stderr:\n${installResult.stderr}`);
      throw new Error(`npm ${installCommand} failed. Check logs for details.`);
    }

    log('SUCCESS', 'Step 2: Dependencies installed successfully.');
  } catch (error) {
    log('ERROR', `Dependency installation step failed: ${error.message}`);
    errorLogger.logError(error, {
      script: SCRIPT_NAME,
      phase: 'dependencies',
    });
    process.exit(1);
  }
  log('INFO', '');

  // --- Step 3: Building the project ---
  log('INFO', 'Step 3: Building the project (npm run build)...');
  try {
    // Use runCommand for build step
    const buildResult = await runCommand(
      {
        command: 'npm run build',
        name: 'Project Build',
        cwd: PROJECT_ROOT,
      },
      1800000, // Long timeout for builds (30 minutes)
    );

    if (!buildResult.success) {
      log('ERROR', `Build process failed (Exit Code: ${buildResult.exitCode})`);
      if (buildResult.stdout) log('INFO', `stdout:\n${buildResult.stdout}`);
      if (buildResult.stderr) log('ERROR', `stderr:\n${buildResult.stderr}`);
      throw new Error('npm run build failed. Check logs for details.');
    }

    log('SUCCESS', 'Step 3: Build completed successfully.');
    // Log stdout/stderr from successful build if needed (can be verbose)
    // if (buildResult.stdout) log('INFO', `Build stdout:\n${buildResult.stdout}`);
    // if (buildResult.stderr) log('WARN', `Build stderr (warnings):\n${buildResult.stderr}`);
  } catch (error) {
    log('ERROR', `Build process step failed: ${error.message}`);
    errorLogger.logError(error, { script: SCRIPT_NAME, phase: 'build' });
    process.exit(1);
  }
  log('INFO', '');

  // --- Step 4: Exporting the static site (Implicit in Next.js build with output: 'export') ---
  // Next.js with `output: 'export'` places the static files directly in the EXPORT_OUTPUT_DIR ('out') during the build step.
  // There isn't a separate `npm run export` command needed in this configuration.
  log(
    'INFO',
    "Step 4: Static export (handled by 'npm run build' with 'output: export')...",
  );
  log('INFO', `Expecting static files in: ${exportDirFullPath}`);

  // --- Step 5: Verifying export directory ---
  log('INFO', `Step 5: Verifying export directory '${EXPORT_OUTPUT_DIR}'...`);
  try {
    if (!fs.existsSync(exportDirFullPath)) {
      throw new Error(
        `Export directory '${EXPORT_OUTPUT_DIR}' not found after build. Build might have failed silently or configuration is incorrect (missing 'output: export' in next.config.js?).`,
      );
    }
    const filesInOutDir = fs.readdirSync(exportDirFullPath);
    if (filesInOutDir.length === 0) {
      throw new Error(
        `Export directory '${EXPORT_OUTPUT_DIR}' exists but is empty. Export failed.`,
      );
    }
    // Add a check for a key file, e.g., index.html
    if (!fs.existsSync(path.join(exportDirFullPath, 'index.html'))) {
      log(
        'WARN',
        `Export directory verified, but 'index.html' is missing at the root. Check build output structure.`,
      );
    }

    log(
      'SUCCESS',
      `Step 5: Export directory '${EXPORT_OUTPUT_DIR}' verified and contains files.`,
    );
  } catch (error) {
    log('ERROR', `Export directory verification failed: ${error.message}`);
    errorLogger.logError(error, {
      script: SCRIPT_NAME,
      phase: 'verifyExport',
    });
    process.exit(1);
  }
  log('INFO', '');

  // --- Step 6: Zipping the export directory ---
  log(
    'INFO',
    `Step 6: Zipping '${EXPORT_OUTPUT_DIR}' contents using archiver...`,
  );
  try {
    const { name, version } = getProjectInfo(); // Assuming getProjectInfo works correctly
    const dateStr = formatDate(new Date()); // Assuming formatDate works correctly
    const zipFileName = `${name || 'project'}-v${version || '0.0.0'}-static-${dateStr}.zip`;
    const outputZipPath = path.join(PROJECT_ROOT, RELEASES_DIR, zipFileName);

    // Ensure releases directory exists
    if (!fs.existsSync(path.dirname(outputZipPath))) {
      fs.mkdirSync(path.dirname(outputZipPath), { recursive: true });
      log('INFO', `Created releases directory: ${path.dirname(outputZipPath)}`);
    }

    log('INFO', `Output zip path: ${outputZipPath}`);

    // Use the imported createZipFromDirectory utility
    await createZipFromDirectory(exportDirFullPath, outputZipPath);
    // createZipFromDirectory should log its own success/errors internally
    log('SUCCESS', `Step 6: Zip file created at ${outputZipPath}`);
  } catch (error) {
    log('ERROR', `Failed to create zip file: ${error.message}`);
    // Error details should have been logged by createZipFromDirectory or caught here
    errorLogger.logError(error, { script: SCRIPT_NAME, phase: 'zip' });
    process.exit(1);
  }
  log('INFO', '');

  // --- Final Success Message ---
  const duration = ((performance.now() - perfStartTime) / 1000).toFixed(2);
  log(
    'SUCCESS',
    `Static Site Build and Packaging Process Completed Successfully in ${duration}s.`,
  );
}

// Execute the main function and catch any top-level errors
main().catch((error) => {
  // Log the unexpected error using the log function
  log(
    'ERROR',
    `An unexpected critical error occurred in the main execution flow: ${error.message}`,
  );
  // Also log it to the dedicated error logger with stack trace
  errorLogger.logError(error, {
    script: SCRIPT_NAME,
    phase: 'mainCatchAll',
  });
  console.error(error.stack); // Print stack trace to console for immediate debugging
  process.exit(1);
});
