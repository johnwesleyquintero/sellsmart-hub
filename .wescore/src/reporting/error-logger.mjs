// ===================================================================
// Wescore Internal Error Logging Module
// ===================================================================
// Purpose:
// - Log internal errors encountered *within* the Wescore tooling itself
//   (e.g., file system issues, config loading errors, command runner failures).
// - This is distinct from the main '.task_tracker.log' which records the
//   *results* of the quality checks being run.
// - Provides structured error logging to 'logs/error-report.log'.
// - Categorizes errors based on patterns.
// - Maintains a summary of errors in 'logs/error-summary.json'.
// ===================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
// Place logs directory within the .wescore folder for better organization
const DEFAULT_LOG_DIR = path.resolve(__filename, '..', '..', 'logs'); // .wescore/logs/

// Error Categories (Keep as is)
const ERROR_CATEGORIES = {
  BUILD: 'BUILD', // Errors during Next.js build step if wrapped
  DEPENDENCY: 'DEPENDENCY', // npm/yarn/pnpm errors if wrapped
  CONFIGURATION: 'CONFIGURATION', // Errors loading/parsing .wescore.json or other configs
  EXPORT: 'EXPORT', // Errors during Next.js export step if wrapped
  FILESYSTEM: 'FILESYSTEM', // fs errors (permissions, not found etc.)
  PROCESS: 'PROCESS', // Errors related to child process execution (signals, non-zero exits not caught by runner)
  NETWORK: 'NETWORK', // Network errors if tool makes external calls
  VALIDATION: 'VALIDATION', // Errors validating config or input
  INTERNAL: 'INTERNAL', // General unexpected errors within Wescore logic
  UNKNOWN: 'UNKNOWN', // Errors that don't match other patterns
};

// Refined Error Patterns for categorization of *internal* tool errors
const ERROR_PATTERNS = [
  // Dependency/Install Errors
  {
    pattern:
      /(npm ERR!|yarn error|pnpm error|Cannot find module|Module not found)/i,
    category: ERROR_CATEGORIES.DEPENDENCY,
  },
  // Filesystem Errors
  {
    pattern:
      /(ENOENT|EPERM|EACCES|Failed to read|Failed to write|Cannot write to log file)/i,
    category: ERROR_CATEGORIES.FILESYSTEM,
  },
  // Configuration Errors
  {
    pattern:
      /(next\.config\.js|wescore\.json|Invalid configuration|Failed to load config)/i,
    category: ERROR_CATEGORIES.CONFIGURATION,
  },
  // Build/Export Errors (if build/export commands are wrapped)
  { pattern: /(next build|build failed)/i, category: ERROR_CATEGORIES.BUILD },
  {
    pattern: /(export failed|static export)/i,
    category: ERROR_CATEGORIES.EXPORT,
  },
  // Process Execution Errors (less common if using runner, but possible)
  {
    pattern: /(SIGTERM|SIGINT|command failed|runner error)/i,
    category: ERROR_CATEGORIES.PROCESS,
  },
  // Network Errors (if applicable)
  {
    pattern: /(ETIMEDOUT|ECONNREFUSED|fetch failed)/i,
    category: ERROR_CATEGORIES.NETWORK,
  },
  // Add more specific internal patterns as needed
];

class ErrorLogger {
  /**
   * @param {string} [logDir] - Directory to store log files. Defaults to '.wescore/logs'.
   */
  constructor(logDir = DEFAULT_LOG_DIR) {
    this.logDir = logDir;
    this.errorLogPath = path.join(this.logDir, 'error-report.log');
    this.summaryPath = path.join(this.logDir, 'error-summary.json');
    this.errorStats = {
      totalErrors: 0,
      categoryCounts: {},
      recentErrors: [], // Stores { timestamp, category, message, stack, context }
    };
    this.isInitialized = false;
    this._initializeLogger(); // Use underscore convention for internal init method
  }

  _initializeLogger() {
    if (this.isInitialized) return;
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
        console.log(`[ErrorLogger] Created log directory: ${this.logDir}`);
      }
      // Initialize error log file with a header if it doesn't exist
      if (!fs.existsSync(this.errorLogPath)) {
        fs.writeFileSync(
          this.errorLogPath,
          `========================================\nWescore Internal Error Log\nStarted: ${new Date().toISOString()}\n========================================\n\n`,
          'utf8',
        );
      }

      // Load existing stats if available
      if (fs.existsSync(this.summaryPath)) {
        const statsContent = fs.readFileSync(this.summaryPath, 'utf8');
        if (statsContent) {
          this.errorStats = JSON.parse(statsContent);
          // Ensure essential keys exist after loading
          this.errorStats.totalErrors = this.errorStats.totalErrors || 0;
          this.errorStats.categoryCounts = this.errorStats.categoryCounts || {};
          this.errorStats.recentErrors = this.errorStats.recentErrors || [];
        }
      }
      this.isInitialized = true;
    } catch (initError) {
      // Log initialization errors to console, as logging to file might fail
      console.error(
        '[ErrorLogger] CRITICAL: Failed to initialize error logger!',
        initError,
      );
      this.isInitialized = false; // Ensure it's marked as not ready
    }
  }

  /**
   * Categorizes an error based on predefined patterns.
   * @param {Error} error - The error object.
   * @returns {string} The determined error category (from ERROR_CATEGORIES).
   */
  categorizeError(error) {
    const message = error.message || error.toString();
    const stack = error.stack || '';
    const combined = `${message}\n${stack}`; // Check message and stack

    for (const { pattern, category } of ERROR_PATTERNS) {
      if (pattern.test(combined)) {
        return category;
      }
    }
    return ERROR_CATEGORIES.UNKNOWN;
  }

  /**
   * Formats an error into a log entry string and a structured detail object.
   * @param {Error} error - The error object.
   * @param {string} category - The determined error category.
   * @param {object} [context={}] - Optional additional context (e.g., { script: 'check-quality.mjs', phase: 'configLoad' }).
   * @returns {{logEntry: string, errorDetail: object}}
   */
  formatErrorEntry(error, category, context = {}) {
    const timestamp = new Date().toISOString();
    const errorDetail = {
      timestamp,
      category,
      message: error.message || error.toString(),
      stack: error.stack || 'No stack trace available',
      context: context || {}, // Store additional context
    };

    let contextString = '';
    if (Object.keys(errorDetail.context).length > 0) {
      contextString = ` | Context: ${JSON.stringify(errorDetail.context)}`;
    }

    const logEntry = `[${timestamp}] [${category}]${contextString}\nMessage: ${errorDetail.message}\nStack:\n${errorDetail.stack}\n----------------------------------------\n`;

    return {
      logEntry,
      errorDetail,
    };
  }

  /**
   * Logs an internal error to the dedicated error log file and updates the summary.
   * @param {Error} error - The error object to log.
   * @param {object} [context={}] - Optional additional context.
   * @returns {string} The category the error was assigned to.
   */
  logError(error, context = {}) {
    // Ensure initialization happened, attempt again if not (might fail)
    if (!this.isInitialized) {
      console.error(
        '[ErrorLogger] Warning: Logger not initialized, attempting recovery.',
      );
      this._initializeLogger();
      // If still not initialized, log to console and exit logging
      if (!this.isInitialized) {
        console.error(
          '[ErrorLogger] CRITICAL: Cannot log error, logger failed to initialize.',
        );
        console.error('[ErrorLogger] Error Details:', error, context);
        return ERROR_CATEGORIES.INTERNAL; // Indicate an internal logging failure
      }
    }

    const category = this.categorizeError(error);
    const { logEntry, errorDetail } = this.formatErrorEntry(
      error,
      category,
      context,
    );

    try {
      // Update stats
      this.errorStats.totalErrors++;
      this.errorStats.categoryCounts[category] =
        (this.errorStats.categoryCounts[category] || 0) + 1;
      // Add new error to the beginning and trim the array
      this.errorStats.recentErrors.unshift(errorDetail);
      this.errorStats.recentErrors = this.errorStats.recentErrors.slice(0, 100); // Keep last 100 errors

      // Write to log file (append)
      fs.appendFileSync(this.errorLogPath, logEntry, 'utf8');

      // Write summary file (overwrite)
      fs.writeFileSync(
        this.summaryPath,
        JSON.stringify(this.errorStats, null, 2), // Pretty print JSON
        'utf8',
      );
    } catch (logWriteError) {
      // If logging itself fails, report to console
      console.error(
        '[ErrorLogger] CRITICAL: Failed to write to error log or summary file!',
      );
      console.error('[ErrorLogger] Original Error:', error);
      console.error('[ErrorLogger] Logging Error:', logWriteError);
      // Optionally attempt to write a minimal crash report?
    }

    return category;
  }

  // --- Getter methods ---

  getErrorSummary() {
    // Ensure stats are loaded if accessed before initialization somehow
    if (!this.isInitialized) this._initializeLogger();
    return this.errorStats;
  }

  getRecentErrors(limit = 10) {
    if (!this.isInitialized) this._initializeLogger();
    return this.errorStats.recentErrors.slice(0, limit);
  }

  getCategoryStats() {
    if (!this.isInitialized) this._initializeLogger();
    return this.errorStats.categoryCounts;
  }
}

// Export a singleton instance for easy use across the tool
export const errorLogger = new ErrorLogger();
export { ERROR_CATEGORIES }; // Export categories for potential use elsewhere

/*
// --- Example Usage ---
import { errorLogger } from './error-logger.mjs';

try {
  // ... some operation that might fail ...
  throw new Error("Something went wrong during file processing");
} catch (error) {
  console.error("An internal error occurred:", error.message);
  errorLogger.logError(error, { script: 'my-script.mjs', phase: 'processing' });
}
*/
