import chalk from 'chalk';
import { categorizeError } from '../utils/errorCategorizer.js';

const MAX_OUTPUT = 1000;

export class Reporter {
  constructor(config) {
    this.config = config;
    this.failedChecks = [];
    this.startTime = 0;
    this.checksCompleted = 0;
    this.totalChecks = config.checks.length;
  }

  startRun() {
    this.startTime = Date.now();
    console.log(chalk.cyan.bold('\n--- Starting Code Quality Checks ---'));
    const mode = this.config.runInParallel ? 'parallel' : 'sequential';
    console.log(chalk.cyan(`⚡ Running ${this.totalChecks} checks in ${mode} mode\n`));
  }

  startCommand(check, index) {
    const prefix = this.config.runInParallel ? '' : `[${index + 1}/${this.totalChecks}] `;
    console.log(chalk.blue(`${prefix}▶ ${check.name} (${chalk.gray(check.command)})`));
  }

  commandSuccess(check, result) {
    this.checksCompleted++;
    console.log(
      chalk.green(`✔ Success: ${check.name}`) +
        chalk.gray(` (${(result.duration / 1000).toFixed(2)}s)\n`)
    );
  }

  commandFailure(check, result) {
    this.checksCompleted++;
    const duration = (result.duration / 1000).toFixed(2);
    const reason = result.timedOut
      ? `Timeout after ${duration}s`
      : `Failed with code ${result.exitCode || 'N/A'}`;

    console.error(chalk.red(`✘ ${reason}: ${check.name}\n`));
    console.error(chalk.gray(`  Output snippet: ${result.output.slice(0, 300)}...\n`));

    const { category, suggestion } = categorizeError(result.output, this.config.errorCategories);
    this.failedChecks.push({ check, result, category, suggestion });
  }

  finalize() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log(chalk.cyan.bold('\n--- Checks Complete ---'));
    console.log(`Ran ${this.checksCompleted}/${this.totalChecks} checks in ${duration}s`);

    if (this.failedChecks.length > 0) {
      console.log(chalk.red.bold(`\n${this.failedChecks.length} checks failed:\n`));
      this.failedChecks.forEach(({ check, category, suggestion }) => {
        console.log(chalk.red(`▼ ${check.name}`));
        if (category) console.log(chalk.yellow(`  Category: ${category}`));
        if (suggestion) console.log(chalk.cyan(`  Suggestion: ${suggestion}`));
        console.log('');
      });
    }

    return this.failedChecks.length === 0;
  }
}
