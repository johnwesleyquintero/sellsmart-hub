#!/usr/bin/env node
import chalk from 'chalk';
import { loadConfig } from './config/loader.js';
import { runCommand } from './runner/commandRunner.js';
import { Reporter } from './reporting/reporter.js';

async function main() {
  try {
    const config = await loadConfig();
    const reporter = new Reporter(config);
    reporter.startRun();

    if (config.runInParallel) {
      const results = await Promise.all(
        config.checks.map(check =>
          runCommand(check, config.commandTimeout)
            .then(result => ({ check, result }))
            .catch(error => ({
              check,
              result: {
                success: false,
                output: `Internal error: ${error.message}`,
                duration: 0,
                exitCode: null,
                signal: null,
                timedOut: false,
              },
            }))
        )
      );

      results.forEach(({ check, result }) => {
        result.success
          ? reporter.commandSuccess(check, result)
          : reporter.commandFailure(check, result);
      });
    } else {
      for (const [index, check] of config.checks.entries()) {
        reporter.startCommand(check, index);
        const result = await runCommand(check, config.commandTimeout);
        result.success
          ? reporter.commandSuccess(check, result)
          : reporter.commandFailure(check, result);

        if (!result.success && config.stopOnFail) break;
      }
    }

    process.exit(reporter.finalize() ? 0 : 1);
  } catch (error) {
    console.error(chalk.red.bold('\nCritical error:'), error.message);
    process.exit(1);
  }
}

main();
