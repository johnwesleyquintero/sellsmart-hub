import chalk from 'chalk';
import { categorizeError } from '../utils/errorCategorizer.js';

// Define log levels (numeric for easy comparison)
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  // debug: 3 // Add if needed later
};

export class Reporter {
  constructor(config) {
    this.config = config;
    this.failedChecks = [];
    this.startTime = 0;
    this.checksCompleted = 0;
    this.totalChecks = config.checks.length; // Assuming checks are passed in config or loaded elsewhere

    const configuredLevel = config.logLevel?.toLowerCase() || 'info';
    this.effectiveLogLevel = LOG_LEVELS.hasOwnProperty(configuredLevel)
      ? LOG_LEVELS[configuredLevel]
      : LOG_LEVELS.info;
  }

  _shouldLog(level) {
    const messageLevel = LOG_LEVELS[level];
    return messageLevel <= this.effectiveLogLevel;
  }

  startRun() {
    this.startTime = Date.now();
    if (this._shouldLog('info')) {
      console.log(chalk.cyan.bold('\n--- Starting Code Quality Checks ---'));
      const mode = this.config.runInParallel ? 'parallel' : 'sequential';
      console.log(
        chalk.cyan(`⚡ Running ${this.totalChecks} checks in ${mode} mode\n`),
      );
    }
  }

  startCommand(check, index) {
    if (this._shouldLog('info')) {
      const prefix = this.config.runInParallel
        ? ''
        : `[${index + 1}/${this.totalChecks}] `;
      console.log(
        chalk.blue(`${prefix}▶ ${check.name} (${chalk.gray(check.command)})`),
      );
    }
  }

  commandSuccess(check, result) {
    this.checksCompleted++;
    if (this._shouldLog('info')) {
      console.log(
        chalk.green(`✔ Success: ${check.name}`) +
          chalk.gray(` (${(result.duration / 1000).toFixed(2)}s)`),
      );
      // --- NEW: Log stdout only on info level for success ---
      if (result.stdout) {
        console.log(chalk.gray(result.stdout)); // Log stdout if present
      }
      console.log(''); // Add newline after potential stdout
      // --- END NEW ---
    }
    // --- NEW: Log stderr on warn level even for success ---
    if (this._shouldLog('warn') && result.stderr) {
      console.warn(chalk.yellow(`[WARN] Output from ${check.name}:`));
      console.warn(chalk.yellow(result.stderr)); // Log stderr if present
      console.log(''); // Add newline
    }
    // --- END NEW ---
  }

  commandFailure(check, result) {
    this.checksCompleted++;
    const duration = (result.duration / 1000).toFixed(2);
    const reason = result.timedOut
      ? `Timeout after ${duration}s`
      : `Failed with code ${result.exitCode || 'N/A'}`;

    // Log failure message if level is error or higher
    if (this._shouldLog('error')) {
      console.error(chalk.red(`✘ ${reason}: ${check.name}\n`));

      // --- MODIFIED: Log stderr and stdout separately on failure ---
      if (result.stderr) {
        console.error(chalk.red('[stderr]'));
        console.error(chalk.red(result.stderr)); // Log stderr first
      }
      if (result.stdout) {
        console.error(chalk.gray('[stdout]')); // Use gray for stdout context
        console.error(chalk.gray(result.stdout)); // Log stdout if present
      }
      console.log(''); // Add spacing after output
      // --- END MODIFIED ---
    }

    // Storing failure details doesn't depend on log level
    const { category, suggestion } = categorizeError(
      result.output, // Use combined output for categorization for now
      this.config.errorCategories,
    );
    this.failedChecks.push({ check, result, category, suggestion });
  }

  finalize() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    if (this._shouldLog('info')) {
      console.log(chalk.cyan.bold('\n--- Checks Complete ---'));
      console.log(
        `Ran ${this.checksCompleted}/${this.totalChecks} checks in ${duration}s`,
      );
    }

    if (this.failedChecks.length > 0) {
      if (this._shouldLog('error')) {
        console.log(
          chalk.red.bold(`\n${this.failedChecks.length} checks failed:\n`),
        );
        this.failedChecks.forEach(({ check, category, suggestion, result }) => {
          console.log(chalk.red(`▼ ${check.name}`));
          if (category) console.log(chalk.yellow(`  Category: ${category}`));
          if (suggestion)
            console.log(chalk.cyan(`  Suggestion: ${suggestion}`));

          // --- MODIFIED: Removed analysis log here, as raw output is logged in commandFailure ---
          // if (result.categorizedLogs) { ... } // This part might be redundant now
          // --- END MODIFIED ---
          console.log(''); // Add spacing
        });
      }
    } else {
      if (this._shouldLog('info')) {
        console.log(chalk.green.bold('\nAll checks passed successfully! 🎉'));
      }
    }

    return this.failedChecks.length === 0;
  }
}
