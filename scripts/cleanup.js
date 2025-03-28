const { rm, access } = require('fs/promises');
const { join } = require('path');
const chalk = require('chalk');

const dirs = ['.next', 'out', 'node_modules'];
const root = process.cwd();

async function clean() {
  for (const dir of dirs) {
    const path = join(root, dir);
    try {
      await access(path);
      await rm(path, { recursive: true, force: true });
      console.log(chalk.green(`✓ Successfully cleaned ${dir}`));
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log(chalk.yellow(`⚠️ ${dir} not found - skipping`));
      } else {
        console.error(chalk.red(`❌ Error cleaning ${dir}:`));
        console.error(chalk.red(err.message));
        process.exitCode = 1;
      }
    }
  }
}

clean().catch(err => {
  console.error(chalk.red('❌ Critical error during cleanup:'));
  console.error(chalk.red(err));
  process.exit(1);
});
