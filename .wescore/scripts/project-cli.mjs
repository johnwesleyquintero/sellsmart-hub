#!/usr/bin/env node
import archiver from 'archiver';
import chalk from 'chalk';
import { exec, spawn } from 'child_process';
import { Spinner } from 'cli-spinner';
import dotenv from 'dotenv';
import fse from 'fs-extra';
import fs from 'fs/promises';
import { glob } from 'glob';
import inquirer from 'inquirer';
import semver from 'semver';
import { promisify } from 'util';

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

// --- Enhanced Progress Indicator Configuration ---
const SPINNER_STYLES = {
  default: '|/-\\',
  dots: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
  arrows: '←↖↑↗→↘↓↙',
  progress: '⣾⣽⣻⢿⡿⣟⣯⣷',
};

const SPINNER_COLORS = {
  info: chalk.blue,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
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
  } finally {
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
}

// Update the runCommand function to use the enhanced progress indicator
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    writeLog(`Executing: ${command} ${args.join(' ')}`, 'INFO');

    const proc = spawn(command, args, {
      stdio: options.stdio || 'pipe', // Changed to pipe to capture output
      shell: true,
      ...options,
    });

    let output = '';

    if (proc.stdout) {
      proc.stdout.on('data', (data) => {
        output += data.toString();
      });
    }

    if (proc.stderr) {
      proc.stderr.on('data', (data) => {
        output += data.toString();
      });
    }

    proc.on('error', (err) => {
      writeLog(`Execution error for "${command}": ${err.message}`, 'ERROR');
      reject(err);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        writeLog(`Command "${command}" completed successfully`, 'SUCCESS');
        resolve({ code, output });
      } else {
        const error = new Error(
          `Command "${command} ${args.join(' ')}" failed with exit code ${code}\n${output}`,
        );
        error.code = code;
        error.output = output;
        reject(error);
      }
    });
  });
}

async function getCommandVersion(command) {
  try {
    const { stdout } = await execPromise(`${command} --version`);
    return stdout.trim().replace(/^v/, '');
  } catch (error) {
    if (error.code === 'ENOENT') {
      writeLog(
        `Command not found: ${command}. Ensure it is installed and in your PATH.`,
        'WARN',
      );
    } else {
      writeLog(
        `Could not get version for command: ${command}. Error: ${error.message}`,
        'WARN',
      );
    }
    return null;
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

// --- Additional Helper Functions ---

async function cleanDirectories(directories) {
  writeLog('Cleaning directories...', 'INFO');
  try {
    for (const dir of directories) {
      try {
        await fse.remove(dir);
        writeLog(`Successfully removed ${dir}`, 'SUCCESS');
      } catch (error) {
        writeLog(`Failed to remove ${dir}: ${error.message}`, 'WARN');
      }
    }
    return true;
  } catch (error) {
    writeLog(`Directory cleanup failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function cleanLogsAndTemp() {
  writeLog('Cleaning log and temporary files...', 'INFO');
  try {
    const files = await glob(LOG_PATTERNS, {
      ignore: ['node_modules/**'],
      dot: true,
    });

    for (const file of files) {
      try {
        await fs.unlink(file);
        writeLog(`Removed: ${file}`, 'SUCCESS');
      } catch (error) {
        writeLog(`Failed to remove ${file}: ${error.message}`, 'WARN');
      }
    }
    return true;
  } catch (error) {
    writeLog(`Log cleanup failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function projectInfo() {
  writeLog('Gathering project information...', 'INFO');
  try {
    // Read package.json
    const pkgContent = await fs.readFile('package.json', 'utf-8');
    const pkg = JSON.parse(pkgContent);

    // Git info
    const gitBranch = await execPromise('git rev-parse --abbrev-ref HEAD').then(
      ({ stdout }) => stdout.trim(),
      () => 'Not a git repository',
    );

    const gitStatus = await execPromise('git status --porcelain').then(
      ({ stdout }) => (stdout.trim() ? 'Has uncommitted changes' : 'Clean'),
      () => 'Not a git repository',
    );

    // Environment check
    const envFiles = ['.env', '.env.local', '.env.development'];
    const envStatus = await Promise.all(
      envFiles.map(async (file) => {
        try {
          await fs.access(file);
          return file;
        } catch {
          return null;
        }
      }),
    );
    const presentEnvFiles = envStatus.filter(Boolean);

    console.log(chalk.cyan('\nProject Information:\n'));
    console.log(`Name: ${chalk.green(pkg.name)}`);
    console.log(`Version: ${chalk.green(pkg.version)}`);
    console.log(
      `Node Version Required: ${chalk.green(pkg.engines?.node || 'Not specified')}`,
    );
    console.log(`Git Branch: ${chalk.green(gitBranch)}`);
    console.log(`Git Status: ${chalk.green(gitStatus)}`);
    console.log(
      `Environment Files: ${chalk.green(presentEnvFiles.length ? presentEnvFiles.join(', ') : 'None found')}`,
    );
    console.log('\nDependencies:');
    console.log(
      chalk.yellow('  Production:'),
      Object.keys(pkg.dependencies || {}).length,
    );
    console.log(
      chalk.yellow('  Development:'),
      Object.keys(pkg.devDependencies || {}).length,
    );
    console.log('');

    writeLog('Project information displayed successfully.', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog(`Failed to gather project information: ${error.message}`, 'ERROR');
    return false;
  }
}

async function projectDev() {
  writeLog('Starting development server...', 'INFO');
  try {
    // Check if the port is available
    const isPortAvailable = await checkPort(3000);
    if (!isPortAvailable) {
      writeLog(
        'Port 3000 is already in use. Please free up the port first.',
        'ERROR',
      );
      return false;
    }

    // Validate environment
    const hasEnvFile = await validateEnvironment();
    if (!hasEnvFile) {
      writeLog(
        'Warning: No .env file found. Server might not work as expected.',
        'WARN',
      );
    }

    // Start the dev server with progress indicator
    await showProgressIndicator(
      () => runCommand('npm', ['run', 'dev'], { isBackground: true }),
      'Starting development server',
    );

    writeLog('Development server started successfully.', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog(`Failed to start development server: ${error.message}`, 'ERROR');
    return false;
  }
}

async function checkPort(port) {
  try {
    const { stdout } = await execPromise(`netstat -ano | findstr :${port}`);
    return !stdout.trim();
  } catch {
    return true; // If the command fails, assume port is available
  }
}

async function validateEnvironment() {
  try {
    await fs.access('.env');
    const envConfig = dotenv.parse(await fs.readFile('.env'));
    const missingVars = Object.keys(envConfig).filter(
      (key) => !process.env[key],
    );

    if (missingVars.length > 0) {
      writeLog(
        `Warning: Missing environment variables: ${missingVars.join(', ')}`,
        'WARN',
      );
    }
    return true;
  } catch {
    return false;
  }
}

function showHelp() {
  console.log(chalk.cyan('\nAvailable Commands:\n'));
  Object.entries(COMMANDS).forEach(([key, description]) => {
    console.log(`  ${chalk.yellow(key.padEnd(15))} ${description}`);
  });
  console.log('\n');
}

// --- Enhanced Error Handling ---
process.on('unhandledRejection', (reason, promise) => {
  writeLog(`Unhandled Rejection: ${reason}`, 'ERROR');
  console.error(chalk.red(`Unhandled Rejection: ${reason}`));
});

process.on('uncaughtException', (error) => {
  writeLog(`Uncaught Exception: ${error.message}\n${error.stack}`, 'ERROR');
  console.error(chalk.red(`Uncaught Exception: ${error.message}`));
  process.exit(1); // Exit to prevent undefined behavior
});

// --- Utility Function for Retry Logic ---
async function retryOperation(operation, retries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      writeLog(`Attempt ${attempt} failed: ${error.message}`, 'WARN');
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw error; // Rethrow after exhausting retries
      }
    }
  }
}

// --- Enhanced Interactive Menu ---
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

  try {
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
  } catch (error) {
    writeLog(`Interactive menu failed: ${error.message}`, 'ERROR');
    console.error(chalk.red('Failed to display the interactive menu.'));
    return null;
  }
}

// --- Confirmation Prompt for Destructive Actions ---
async function confirmAction(message) {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: message,
      default: false,
    },
  ]);
  return confirmed;
}

// --- Enhanced Command Execution with Confirmation ---
async function projectReset() {
  if (!(await confirmAction('Are you sure you want to reset the project?'))) {
    writeLog('Reset operation canceled by the user.', 'INFO');
    return false;
  }

  writeLog('Starting reset process', 'INFO');
  const cleanSuccess = await cleanDirectories(BUILD_ARTIFACTS);
  if (!cleanSuccess) {
    writeLog('Cleanup part of reset failed. Aborting install.', 'ERROR');
    return false;
  }

  writeLog('Cleanup complete. Reinstalling dependencies...', 'INFO');
  try {
    await retryOperation(() => runCommand('npm', ['install']), 3, 2000);
    writeLog('Dependencies reinstalled successfully.', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog('Failed to reinstall dependencies during reset.', 'ERROR');
    return false;
  }
}

// --- Progress Indicator for Long-Running Tasks ---
async function showProgressIndicator(task, message, options = {}) {
  const {
    spinnerStyle = SPINNER_STYLES.dots,
    color = SPINNER_COLORS.info,
    showTiming = true,
  } = options;

  const spinner = new Spinner({
    text: `${color(message)} %s${showTiming ? ' (0s)' : ''}`,
    spinner: spinnerStyle,
  });

  const startTime = Date.now();
  spinner.setSpinnerString(spinnerStyle);
  spinner.start();

  let updateInterval;
  if (showTiming) {
    updateInterval = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      spinner.text = `${color(message)} %s (${elapsed}s)`;
    }, 100);
  }

  try {
    const result = await task();
    if (updateInterval) clearInterval(updateInterval);
    spinner.stop(true);
    return result;
  } catch (error) {
    if (updateInterval) clearInterval(updateInterval);
    spinner.stop(true);
    throw error;
  }
}

// Example Usage of Progress Indicator in Commands
async function projectBuild() {
  writeLog('Starting project build (npm run build)...', 'INFO');
  try {
    await showProgressIndicator(
      () => runCommand('npm', ['run', 'build']),
      'Building project',
    );
    return true;
  } catch (error) {
    writeLog('Build failed.', 'ERROR');
    return false;
  }
}

// --- Helper Function to Prompt for Main Menu or Exit ---
async function promptMainMenuOrExit() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do next?',
      choices: [
        { name: 'Return to Main Menu', value: 'menu' },
        { name: 'Exit', value: 'exit' },
      ],
    },
  ]);
  return action;
}

// --- Command Functions ---

async function projectSetup() {
  writeLog('Starting project setup...', 'INFO');
  if (!(await checkProjectStructure())) {
    writeLog('Project structure validation failed. Setup aborted.', 'ERROR');
    return false;
  }

  try {
    return await showProgressIndicator(
      () => runCommand('npm', ['install']),
      'Installing project dependencies',
      { spinnerStyle: SPINNER_STYLES.dots },
    );
  } catch (error) {
    writeLog(`Failed to install dependencies: ${error.message}`, 'ERROR');
    return false;
  }
}

async function projectCheck() {
  writeLog('Running project checks...', 'INFO');
  try {
    return await showProgressIndicator(
      () => runCommand('npm', ['run', 'check']),
      'Running project checks (lint, type check, tests)',
      { spinnerStyle: SPINNER_STYLES.arrows },
    );
  } catch (error) {
    writeLog('Project checks failed.', 'ERROR');
    return false;
  }
}

async function projectValidate() {
  writeLog('Validating project structure...', 'INFO');
  const isValid = await checkProjectStructure();
  if (isValid) {
    writeLog('Project structure is valid.', 'SUCCESS');
  } else {
    writeLog('Project structure validation failed.', 'ERROR');
  }
  return isValid;
}

async function projectTest() {
  writeLog('Running tests...', 'INFO');
  try {
    return await showProgressIndicator(
      () => runCommand('npm', ['run', 'test']),
      'Running test suite',
      { spinnerStyle: SPINNER_STYLES.dots },
    );
  } catch (error) {
    writeLog('Tests failed.', 'ERROR');
    return false;
  }
}

async function projectClean() {
  writeLog('Cleaning project...', 'INFO');
  return await showProgressIndicator(
    () => cleanDirectories(BUILD_ARTIFACTS),
    'Cleaning build artifacts and dependencies',
    { spinnerStyle: SPINNER_STYLES.default },
  );
}

async function projectUpdate() {
  writeLog('Updating dependencies...', 'INFO');
  try {
    return await showProgressIndicator(
      () => runCommand('npm', ['update']),
      'Updating project dependencies',
      { spinnerStyle: SPINNER_STYLES.dots },
    );
  } catch (error) {
    writeLog('Failed to update dependencies.', 'ERROR');
    return false;
  }
}

async function projectAudit() {
  writeLog('Running security audit...', 'INFO');
  try {
    return await showProgressIndicator(
      () => runCommand('npm', ['audit']),
      'Running security audit',
      { spinnerStyle: SPINNER_STYLES.progress },
    );
  } catch (error) {
    writeLog('Security audit failed.', 'ERROR');
    return false;
  }
}

async function projectDocs() {
  writeLog('Generating documentation...', 'INFO');
  try {
    return await showProgressIndicator(
      () => runCommand('npm', ['run', 'docs']),
      'Generating project documentation',
      { spinnerStyle: SPINNER_STYLES.dots },
    );
  } catch (error) {
    writeLog('Failed to generate documentation.', 'ERROR');
    return false;
  }
}

async function projectStats() {
  writeLog('Calculating project statistics...', 'INFO');
  try {
    return await showProgressIndicator(
      async () => {
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
            ignore: [
              'node_modules/**',
              '**/.*/**',
              '**/dist/**',
              '**/build/**',
            ],
            nodir: true,
            absolute: true,
          },
        );

        let totalLines = 0;
        for (const file of files) {
          const content = await fs.readFile(file, 'utf-8');
          totalLines += content.split('\n').length;
        }

        console.log(chalk.cyan('\nProject Statistics:\n'));
        console.log(`Lines of Code (approx): ${chalk.green(totalLines)}`);
        console.log(`Files Count: ${chalk.green(files.length)}`);
        console.log('');
        return true;
      },
      'Analyzing project statistics',
      { spinnerStyle: SPINNER_STYLES.dots },
    );
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

  return await showProgressIndicator(
    () =>
      new Promise((resolve, reject) => {
        const output = fse.createWriteStream(backupFileName);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
          writeLog(
            `Backup created: ${backupFileName} (${archive.pointer()} bytes)`,
            'SUCCESS',
          );
          resolve(true);
        });

        archive.on('warning', (err) => {
          if (err.code === 'ENOENT') {
            writeLog(`Backup warning: ${err.message}`, 'WARN');
          } else {
            reject(err);
          }
        });

        archive.on('error', (err) => reject(err));

        archive.pipe(output);
        archive.glob('**', {
          cwd: '.',
          ignore: ['node_modules/**', backupFileName, LOG_FILE, '.*/**'],
          dot: true,
        });

        archive.finalize();
      }),
    'Creating project backup archive',
    { spinnerStyle: SPINNER_STYLES.dots },
  );
}

// --- Main Execution ---
const main = async () => {
  let running = true;

  while (running) {
    let command = process.argv[2];
    let success = false;

    // Read required Node version from package.json
    let requiredNodeVersion = '>=0.0.0'; // Default fallback
    try {
      const pkgContent = await fs.readFile('package.json', 'utf-8');
      const pkg = JSON.parse(pkgContent);
      if (pkg.engines?.node) {
        requiredNodeVersion = pkg.engines.node;
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
      console.error(chalk.red(`Unknown command: ${command}`));
      showHelp();
      process.exit(1);
    }

    // Dependency checks (skip for 'info', 'help', 'clean-logs')
    if (!['info', 'help', 'clean-logs'].includes(command)) {
      if (!(await checkNodeVersion(requiredNodeVersion))) process.exit(1);
      if (!(await checkNpmVersion(REQUIRED_NPM_VERSION))) process.exit(1);
      if (!(await checkGlobalPackages())) process.exit(1);
    }

    // Execute command with enhanced error handling
    writeLog(`Executing command: ${command}`, 'INFO');
    success = await retryOperation(async () => {
      switch (command) {
        case 'reset':
          return await projectReset();
        case 'setup':
          return await projectSetup();
        case 'check':
          return await projectCheck();
        case 'build':
          return await projectBuild();
        case 'dev':
          return await projectDev();
        case 'test':
          return await projectTest();
        case 'clean':
          return await projectClean();
        case 'update':
          return await projectUpdate();
        case 'info':
          return await projectInfo();
        case 'clean-logs':
          return await cleanLogsAndTemp();
        case 'audit':
          return await projectAudit();
        case 'docs':
          return await projectDocs();
        case 'stats':
          return await projectStats();
        case 'backup':
          return await projectBackup();
        case 'validate':
          return await projectValidate();
        default:
          throw new Error(`Command handler not implemented: ${command}`);
      }
    });

    if (!success) {
      writeLog(`Command '${command}' failed`, 'ERROR');
    } else {
      writeLog(`Command '${command}' completed successfully`, 'SUCCESS');
    }

    // Prompt user to return to main menu or exit
    const nextAction = await promptMainMenuOrExit();
    if (nextAction === 'exit') {
      running = false;
      console.log('Goodbye!');
    } else {
      command = null; // Reset command to show the main menu again
    }
  }
};

// Start the CLI with error handling
main().catch((error) => {
  writeLog(
    `Critical error during command execution: ${error.message}`,
    'ERROR',
  );
  console.error(chalk.red(`Critical error: ${error.message}`));
  process.exit(1);
});
