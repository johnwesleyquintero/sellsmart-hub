#!/usr/bin/env node
import fs from 'fs/promises';
import fse from 'fs-extra'; // Using fs-extra for easier recursive copy/remove if needed, though fs.rm works now
import path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import semver from 'semver';
import inquirer from 'inquirer';
import archiver from 'archiver';
import { glob } from 'glob';
import os from 'os';

const execPromise = promisify(exec);

// --- Configuration ---
const LOG_FILE = 'project-cli.log';
const REQUIRED_NPM_VERSION = '9.0.0'; // Consider making this configurable too
const REQUIRED_GLOBAL_PACKAGES = ['npm-run-all', 'cross-env', 'ts-node'];
const BUILD_ARTIFACTS = [
  '.next',
  '.vercel',
  'node_modules',
  'package-lock.json',
  'coverage',
  '.nyc_output',
  'storybook-static',
];
const LOG_PATTERNS = ['*.log', '*.tmp', '*.temp', '*.bak', '*.cache'];
const REQUIRED_PROJECT_FILES = [
  'package.json',
  'tsconfig.json',
  'next.config.js',
]; // Adjust as needed

const COMMANDS = {
  reset:
    'Reset the project environment (clean build artifacts and node_modules, then reinstall)',
  setup: 'Initial project setup including dependencies',
  check: 'Run all checks (lint, type check, tests via npm script)',
  build: 'Build the project',
  dev: 'Start development server',
  test: 'Run tests',
  clean: 'Clean build artifacts and node_modules',
  update: 'Update dependencies',
  info: 'Display project information',
  'clean-logs': 'Clear project and system temporary log files',
  audit: 'Run security audit for dependencies',
  docs: 'Generate project documentation (runs `npm run docs`)',
  stats: 'Show project statistics (lines of code, file count)',
  backup: 'Create project backup zip file',
  validate: 'Validate project structure (check for required files)',
};

// --- Helper Functions ---

async function writeLog(message, level = 'INFO') {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logMessage = `${timestamp} - [${level}] ${message}\n`;

  try {
    await fs.appendFile(LOG_FILE, logMessage);
  } catch (err) {
    console.error(
      chalk.red(`Failed to write to log file ${LOG_FILE}: ${err.message}`),
    );
  }

  switch (level) {
    case 'ERROR':
      console.error(chalk.red(message));
      break;
    case 'WARN':
      console.warn(chalk.yellow(message));
      break;
    case 'SUCCESS':
      console.log(chalk.green(message));
      break;
    default:
      console.log(message);
  }
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    writeLog(`Executing: ${command} ${args.join(' ')}`, 'INFO');
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });

    proc.on('error', (err) => {
      writeLog(`Execution error for "${command}": ${err.message}`, 'ERROR');
      reject(err);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        writeLog(`Command "${command}" completed successfully`, 'SUCCESS');
        resolve(code);
      } else {
        writeLog(`Command "${command}" failed with exit code ${code}`, 'ERROR');
        reject(
          new Error(
            `Command "${command} ${args.join(' ')}" failed with exit code ${code}`,
          ),
        );
      }
    });
  });
}

async function getCommandVersion(command) {
  try {
    const { stdout } = await execPromise(`${command} --version`);
    return stdout.trim().replace(/^v/, '');
  } catch (error) {
    writeLog(
      `Could not get version for command: ${command}. Error: ${error.message}`,
      'WARN',
    );
    return null; // Command likely not found or doesn't support --version
  }
}

async function checkProjectStructure() {
  writeLog('Validating project structure...', 'INFO');
  const missingFiles = [];
  for (const file of REQUIRED_PROJECT_FILES) {
    try {
      await fs.access(file);
    } catch {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    writeLog(
      `Missing required project files: ${missingFiles.join(', ')}`,
      'ERROR',
    );
    return false;
  }
  writeLog('Project structure validation passed', 'SUCCESS');
  return true;
}

async function checkNodeVersion(requiredVersion) {
  const nodeVersion = process.version.replace(/^v/, '');
  if (!semver.satisfies(nodeVersion, requiredVersion)) {
    writeLog(
      `Node.js version check failed. Current: ${nodeVersion}, Required: ${requiredVersion}`,
      'ERROR',
    );
    return false;
  }
  writeLog(`Node.js version check passed: ${nodeVersion}`, 'INFO');
  return true;
}

async function checkNpmVersion(requiredVersion) {
  const npmVersion = await getCommandVersion('npm');
  if (!npmVersion || !semver.gte(npmVersion, requiredVersion)) {
    writeLog(
      `npm version check failed. Current: ${npmVersion || 'Not Found'}, Required: >=${requiredVersion}`,
      'ERROR',
    );
    return false;
  }
  writeLog(`npm version check passed: ${npmVersion}`, 'INFO');
  return true;
}

async function checkGlobalPackages() {
  writeLog('Checking for required global npm packages...', 'INFO');
  const missingPackages = [];
  for (const pkg of REQUIRED_GLOBAL_PACKAGES) {
    try {
      // npm list -g exits with 1 if package not found, even with --depth=0
      await execPromise(`npm list -g ${pkg} --depth=0`);
      writeLog(`Found global package: ${pkg}`, 'INFO');
    } catch (error) {
      // Check if error is because package is not found
      if (
        (error.stderr && error.stderr.includes('empty')) ||
        (error.stdout && error.stdout.includes('empty'))
      ) {
        missingPackages.push(pkg);
        writeLog(`Missing required global package: ${pkg}`, 'WARN');
      } else {
        // Log other errors
        writeLog(
          `Error checking global package ${pkg}: ${error.message}`,
          'ERROR',
        );
        // Decide if this should be fatal - for now, let's assume it might be an npm issue and continue checking others
      }
    }
  }

  if (missingPackages.length > 0) {
    writeLog(
      `Missing required global packages: ${missingPackages.join(', ')}`,
      'ERROR',
    );
    console.log(chalk.yellow(`\nTo install missing packages, run:`));
    console.log(chalk.cyan(`npm install -g ${missingPackages.join(' ')}`));
    console.log('');
    return false;
  }
  writeLog('All required global packages are installed.', 'SUCCESS');
  return true;
}

async function showInteractiveMenu() {
  console.clear();
  console.log(chalk.cyan('\nPROJECT MANAGEMENT CLI\n'));
  console.log(chalk.yellow('Select an option:\n'));

  const choices = Object.entries(COMMANDS).map(([key, value]) => ({
    name: `${key.padEnd(15)} ${value}`,
    value: key,
  }));

  choices.push(new inquirer.Separator());
  choices.push({ name: 'Quit', value: 'quit' });

  const { selection } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selection',
      message: 'Choose a command:',
      choices: choices,
      pageSize: choices.length, // Show all options
    },
  ]);

  return selection === 'quit' ? null : selection;
}

function showHelp() {
  console.log(chalk.cyan('\nProject Management CLI\n'));
  console.log(chalk.yellow('Available Commands:'));
  for (const [key, value] of Object.entries(COMMANDS)) {
    console.log(`  ${chalk.green(key.padEnd(15))} ${value}`);
  }
  const scriptName = path.basename(process.argv[1]);
  console.log(chalk.yellow(`\nUsage: node ${scriptName} [command]\n`));
}

async function cleanDirectories(dirs) {
  writeLog(`Starting cleanup process for: ${dirs.join(', ')}`, 'INFO');
  let success = true;
  for (const dir of dirs) {
    try {
      if (await fse.pathExists(dir)) {
        await fs.rm(dir, { recursive: true, force: true });
        writeLog(`Removed ${dir}`, 'SUCCESS');
      } else {
        writeLog(`Directory/File not found, skipping: ${dir}`, 'INFO');
      }
    } catch (error) {
      writeLog(`Failed to remove ${dir}: ${error.message}`, 'ERROR');
      success = false; // Continue cleaning other dirs
    }
  }
  return success;
}

// --- Command Functions ---

async function projectReset() {
  writeLog('Starting reset process', 'INFO');
  const cleanSuccess = await cleanDirectories(BUILD_ARTIFACTS);
  if (!cleanSuccess) {
    writeLog('Cleanup part of reset failed. Aborting install.', 'ERROR');
    return false;
  }
  writeLog('Cleanup complete. Reinstalling dependencies...', 'INFO');
  try {
    await runCommand('npm', ['install']);
    writeLog('Dependencies reinstalled successfully.', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog('Failed to reinstall dependencies during reset.', 'ERROR');
    return false;
  }
}

async function projectSetup() {
  writeLog('Starting project setup...', 'INFO');
  if (!(await checkProjectStructure())) {
    return false;
  }
  try {
    writeLog('Installing project dependencies...', 'INFO');
    await runCommand('npm', ['install']);
    writeLog('Dependencies installed successfully', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog(`Failed to install dependencies: ${error.message}`, 'ERROR');
    return false;
  }
}

async function projectCheck() {
  writeLog('Running project checks (npm run wes-cq)...', 'INFO');
  try {
    await runCommand('npm', ['run', 'wes-cq']); // Assuming 'wes-cq' is your check script
    return true;
  } catch (error) {
    writeLog('Project checks failed.', 'ERROR');
    return false;
  }
}

async function projectBuild() {
  writeLog('Starting project build (npm run build)...', 'INFO');
  try {
    await runCommand('npm', ['run', 'build']);
    return true;
  } catch (error) {
    writeLog('Build failed.', 'ERROR');
    return false;
  }
}

async function projectDev() {
  writeLog('Starting development server (npm run dev)...', 'INFO');
  try {
    // 'dev' usually runs indefinitely, so we just start it. Error handling is tricky here.
    await runCommand('npm', ['run', 'dev']);
    return true; // Technically, this line might not be reached if dev runs forever
  } catch (error) {
    // This catch might only trigger if the process fails to start
    writeLog('Failed to start development server.', 'ERROR');
    return false;
  }
}

async function projectTest() {
  writeLog('Running tests (npm run test)...', 'INFO');
  try {
    await runCommand('npm', ['run', 'test']);
    return true;
  } catch (error) {
    writeLog('Tests failed.', 'ERROR');
    return false;
  }
}

async function projectClean() {
  return cleanDirectories(BUILD_ARTIFACTS);
}

async function projectUpdate() {
  writeLog('Checking for dependency updates...', 'INFO');
  try {
    // Consider using `npm outdated --json` for more detailed info if needed
    await runCommand('npm', ['update']);
    writeLog(
      'Dependencies updated successfully (if any were outdated).',
      'SUCCESS',
    );
    // Add deprecated check if desired (parsing `npm ls --json` can be complex)
    return true;
  } catch (error) {
    writeLog('Failed to update dependencies.', 'ERROR');
    return false;
  }
}

async function projectInfo() {
  try {
    const pkgContent = await fs.readFile('package.json', 'utf-8');
    const pkg = JSON.parse(pkgContent);
    const requiredNodeVersion =
      pkg.engines?.node?.replace(/\^|>=|~/, '').split(' ')[0] ||
      'Not Specified';

    console.log(chalk.cyan('\nProject Information:\n'));
    console.log(`Name: ${chalk.green(pkg.name || 'N/A')}`);
    console.log(`Version: ${chalk.green(pkg.version || 'N/A')}`);
    console.log(
      `Node.js Version Required: ${chalk.green(requiredNodeVersion)}`,
    );
    console.log(`NPM Version Required: ${chalk.green(REQUIRED_NPM_VERSION)}`);
    console.log(chalk.yellow('\nAvailable Scripts (from package.json):'));
    if (pkg.scripts) {
      for (const [name, script] of Object.entries(pkg.scripts)) {
        console.log(`  ${chalk.blue(name.padEnd(20))} ${script}`);
      }
    } else {
      console.log('  No scripts found in package.json');
    }
    console.log('');
    return true;
  } catch (error) {
    writeLog(`Failed to read or parse package.json: ${error.message}`, 'ERROR');
    return false;
  }
}

async function cleanLogsAndTemp() {
  writeLog('Cleaning log and temporary files...', 'INFO');
  let success = true;
  const patterns = [...LOG_PATTERNS]; // Project-level patterns
  const tempDir = os.tmpdir();
  const tempPatterns = LOG_PATTERNS.map((p) => path.join(tempDir, p)); // System temp patterns

  const projectFiles = await glob(patterns, {
    cwd: '.',
    absolute: true,
    nodir: true,
  });
  const tempFiles = await glob(tempPatterns, { absolute: true, nodir: true });
  const allFiles = [...projectFiles, ...tempFiles];

  if (allFiles.length === 0) {
    writeLog('No log or temporary files found matching patterns.', 'INFO');
    return true;
  }

  writeLog(`Found files to clean: ${allFiles.join(', ')}`, 'INFO');

  for (const file of allFiles) {
    try {
      await fs.rm(file, { force: true });
      writeLog(`Removed ${file}`, 'SUCCESS');
    } catch (error) {
      writeLog(`Failed to remove ${file}: ${error.message}`, 'ERROR');
      success = false;
    }
  }
  return success;
}

async function projectAudit() {
  writeLog('Running security audit (npm audit)...', 'INFO');
  try {
    // npm audit can exit non-zero for vulnerabilities, which runCommand treats as failure.
    // We might want to capture the output or just let it print.
    // For now, let's run it and report success regardless of vulnerabilities found.
    await runCommand('npm', ['audit']);
    writeLog(
      'Security audit completed. Review output for vulnerabilities.',
      'INFO',
    ); // Changed level
    return true; // Report success as the command ran
  } catch (error) {
    // Check if error is due to vulnerabilities found (exit code > 0)
    if (error.message.includes('exit code')) {
      writeLog(
        'Security audit completed. Vulnerabilities found (review output).',
        'WARN',
      );
      return true; // Still consider the command execution successful
    }
    writeLog('Failed to run security audit.', 'ERROR');
    return false;
  }
}

async function projectDocs() {
  writeLog('Generating project documentation (npm run docs)...', 'INFO');
  try {
    await runCommand('npm', ['run', 'docs']);
    return true;
  } catch (error) {
    writeLog('Failed to generate documentation.', 'ERROR');
    return false;
  }
}

async function projectStats() {
  writeLog('Calculating project statistics...', 'INFO');
  try {
    const files = await glob(
      [
        '**/*.js',
        '**/*.ts',
        '**/*.jsx',
        '**/*.tsx',
        '**/*.css',
        '**/*.scss',
        '**/*.json',
      ],
      {
        ignore: ['node_modules/**', '**/.*/**', '**/dist/**', '**/build/**'], // Add other ignores as needed
        nodir: true,
        absolute: true,
      },
    );

    let totalLines = 0;
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        totalLines += content.split('\n').length;
      } catch (readError) {
        writeLog(
          `Could not read file for stats: ${file} - ${readError.message}`,
          'WARN',
        );
      }
    }

    console.log(chalk.cyan('\nProject Statistics:\n'));
    console.log(`Lines of Code (approx): ${chalk.green(totalLines)}`);
    console.log(`Files Count: ${chalk.green(files.length)}`);
    console.log('');
    writeLog('Project statistics displayed successfully', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog(`Failed to calculate statistics: ${error.message}`, 'ERROR');
    return false;
  }
}

async function projectBackup() {
  writeLog('Creating project backup...', 'INFO');
  const timestamp = new Date()
    .toISOString()
    .replace(/[:\-T]/g, '')
    .substring(0, 14);
  const backupFileName = `backup-${timestamp}.zip`;
  const output = fse.createWriteStream(backupFileName);
  const archive = archiver('zip', { zlib: { level: 9 } }); // Optimal compression

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      writeLog(
        `Project backup created successfully: ${backupFileName} (${archive.pointer()} total bytes)`,
        'SUCCESS',
      );
      resolve(true);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        writeLog(`Backup warning: ${err.message}`, 'WARN');
      } else {
        writeLog(`Backup error: ${err.message}`, 'ERROR');
        reject(false);
      }
    });

    archive.on('error', (err) => {
      writeLog(`Failed to create backup archive: ${err.message}`, 'ERROR');
      reject(false);
    });

    archive.pipe(output);
    // Add files/directories to archive. Globbing everything except node_modules and the backup itself.
    archive.glob('**', {
      cwd: '.',
      ignore: ['node_modules/**', backupFileName, LOG_FILE, '.*/**'], // Adjust ignores
      dot: true, // Include dotfiles (like .env, .gitignore) but ignore .git, .next etc via pattern
    });
    archive.finalize();
  });
}

async function projectValidate() {
  return checkProjectStructure();
}

// --- Main Execution ---

(async () => {
  let command = process.argv[2];
  let success = false;

  try {
    // Read required Node version from package.json
    let requiredNodeVersion = '>=0.0.0'; // Default fallback
    try {
      const pkgContent = await fs.readFile('package.json', 'utf-8');
      const pkg = JSON.parse(pkgContent);
      if (pkg.engines?.node) {
        requiredNodeVersion = pkg.engines.node; // Use the full range specified
      }
    } catch (err) {
      writeLog(
        'Could not read package.json to determine required Node version.',
        'WARN',
      );
    }

    if (!command) {
      command = await showInteractiveMenu();
      if (!command) {
        console.log('Exiting.');
        process.exit(0);
      }
    }

    if (command === 'help') {
      showHelp();
      process.exit(0);
    }

    if (!COMMANDS[command]) {
      writeLog(`Unknown command: ${command}`, 'ERROR');
      showHelp();
      process.exit(1);
    }

    // Dependency checks (skip for 'info', 'help', 'clean-logs')
    if (!['info', 'help', 'clean-logs'].includes(command)) {
      if (!(await checkNodeVersion(requiredNodeVersion))) process.exit(1);
      if (!(await checkNpmVersion(REQUIRED_NPM_VERSION))) process.exit(1);
      if (!(await checkGlobalPackages())) process.exit(1);
    }

    // Execute command
    writeLog(`Executing command: ${command}`, 'INFO');
    switch (command) {
      case 'reset':
        success = await projectReset();
        break;
      case 'setup':
        success = await projectSetup();
        break;
      case 'check':
        success = await projectCheck();
        break;
      case 'build':
        success = await projectBuild();
        break;
      case 'dev':
        success = await projectDev();
        break; // May not return
      case 'test':
        success = await projectTest();
        break;
      case 'clean':
        success = await projectClean();
        break;
      case 'update':
        success = await projectUpdate();
        break;
      case 'info':
        success = await projectInfo();
        break;
      case 'clean-logs':
        success = await cleanLogsAndTemp();
        break;
      case 'audit':
        success = await projectAudit();
        break;
      case 'docs':
        success = await projectDocs();
        break;
      case 'stats':
        success = await projectStats();
        break;
      case 'backup':
        success = await projectBackup();
        break;
      case 'validate':
        success = await projectValidate();
        break;
      default:
        writeLog(`Command handler not implemented: ${command}`, 'ERROR');
        success = false;
    }

    if (!success) {
      writeLog(`Command '${command}' failed`, 'ERROR');
      process.exit(1);
    } else {
      // Don't log success for 'dev' as it might still be running
      if (command !== 'dev') {
        writeLog(`Command '${command}' completed successfully`, 'SUCCESS');
      }
    }
    process.exit(0);
  } catch (error) {
    const criticalError = `CRITICAL ERROR: Command execution failed - ${error.message}\n${error.stack}`;
    writeLog(criticalError, 'ERROR');
    process.exit(1);
  }
})();
