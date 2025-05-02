#!/usr/bin/env node
import archiver from 'archiver';
import chalk from 'chalk';
import { exec, spawn } from 'child_process';
import dotenv from 'dotenv';
import { createWriteStream } from 'fs';
import { access, appendFile, readFile, rm, unlink } from 'fs/promises';
import { glob } from 'glob';
import inquirer from 'inquirer';
import { dirname, join } from 'path';
import semver from 'semver';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Add after imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(dirname(__dirname));

// --- Configuration ---
const LOG_FILE = 'project-cli.log';
const REQUIRED_NPM_VERSION = process.env.REQUIRED_NPM_VERSION || '9.0.0'; // Configurable via environment variable
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

const DEBUG_MODE = process.env.DEBUG === 'true';

function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log(chalk.gray('[DEBUG]'), ...args);
  }
}

// --- Helper Functions ---

async function writeLog(message, level = 'INFO') {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logMessage = `${timestamp} - [${level}] ${message}\n`;
  const logPath = join(PROJECT_ROOT, 'project-cli.log');

  try {
    await appendFile(logPath, logMessage);
  } catch (error) {
    console.error(
      chalk.red(`Failed to write to log file ${logPath}: ${error.message}`),
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

// --- Custom Error Class ---
class CLIError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = 'CLIError';
    this.context = context;
    this.timestamp = new Date().toISOString();
  }

  toString() {
    return `${this.name}: ${this.message}\nContext: ${JSON.stringify(this.context, null, 2)}`;
  }
}

// --- Command Queue Class ---
class CommandQueue {
  constructor() {
    this.queue = [];
  }

  add(name, operation) {
    this.queue.push({ name, operation });
  }

  async execute() {
    let results = [];
    for (const item of this.queue) {
      try {
        const result = await trackCommandDuration(item.name, item.operation);
        results.push({ name: item.name, success: true, result });
      } catch (error) {
        results.push({ name: item.name, success: false, error });
        break;
      }
    }
    return results;
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
      reject(
        new CLIError(`Command execution failed: ${err.message}`, {
          command,
          args,
          options,
          originalError: err.message,
        }),
      );
    });

    proc.on('close', (code) => {
      if (code === 0) {
        writeLog(`Command "${command}" completed successfully`, 'SUCCESS');
        resolve({ code, output });
      } else {
        const error = new CLIError(
          `Command "${command} ${args.join(' ')}" failed with exit code ${code}\n${output}\nCommand: ${command}`,
          {
            command,
            args,
            options,
            output,
            exitCode: code,
          },
        );
        reject(error);
      }
    });
  });
}

async function trackCommandDuration(command, operation) {
  const startTime = Date.now();
  try {
    const result = await operation();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    writeLog(`Command '${command}' completed in ${duration}s`, 'SUCCESS');
    return result;
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    writeLog(`Command '${command}' failed after ${duration}s`, 'ERROR');
    throw error;
  }
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
    }
    return null;
  }
}

async function checkProjectStructure() {
  writeLog('Validating project structure...', 'INFO');
  try {
    return await retryOperation(
      async () => {
        const missingFiles = [];
        for (const file of REQUIRED_PROJECT_FILES) {
          try {
            await access(file);
          } catch (error) {
            missingFiles.push(file);
            writeLog(`fs.access failed for ${file}: ${error.message}`, 'WARN');
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
      },
      3,
      1000,
      'checkProjectStructure',
    );
  } catch (error) {
    writeLog(`Project structure validation failed: ${error.message}`, 'ERROR');
    return false;
  }
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
        writeLog(
          `Missing required global package: ${pkg} during global package check`,
          'WARN',
        );
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
        await rm(dir, { recursive: true, force: true });
        writeLog(`Successfully removed ${dir}`, 'SUCCESS');
      } catch (error) {
        if (error.code === 'EACCES') {
          writeLog(`Failed to remove ${dir}: Permission denied.`, 'WARN');
        } else if (error.code === 'ENOENT') {
          writeLog(`Failed to remove ${dir}: Directory not found.`, 'WARN');
        } else {
          writeLog(`Failed to remove ${dir}: ${error.message}`, 'WARN');
        }
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
        await unlink(file);
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
    let pkgContent;
    try {
      pkgContent = await readFile('package.json', 'utf-8');
    } catch (readError) {
      writeLog(`Failed to read package.json: ${readError.message}`, 'ERROR');
      // Re-throw to be caught by the outer catch block
      throw new Error(`Failed to read package.json: ${readError.message}`);
    }

    let pkg;
    try {
      pkg = JSON.parse(pkgContent);
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        writeLog(
          `Failed to parse package.json: SyntaxError - ${parseError.message}`,
          'ERROR',
        );
        throw new Error(`Failed to parse package.json: ${parseError.message}`);
      } else {
        throw error;
      }
    }

    // Git info
    const gitBranch = await execPromise('git rev-parse --abbrev-ref HEAD').then(
      ({ stdout }) => stdout.trim(),
    );
    // Removed error handler here, let outer catch handle execPromise errors if needed

    const gitStatus = await execPromise('git status --porcelain').then(
      ({ stdout }) => (stdout.trim() ? 'Has uncommitted changes' : 'Clean'), // Success handler
      () => 'Not a git repository', // Error handler (second argument)
    );

    // Environment check
    const envFiles = ['.env', '.env.local', '.env.development'];
    const envStatus = await Promise.all(
      envFiles.map(async (file) => {
        try {
          await access(file);
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
    const isPortAvailable = await retryOperation(
      () => checkPort(3000),
      3,
      1000,
      'checkPort',
    );
    if (!isPortAvailable) {
      writeLog('Port 3000 is already in use. Please free up the port first.');
      return false;
    }
  } catch (error) {
    writeLog(`Failed to start development server: ${error.message}`, 'ERROR');
    return false;
  }

  // Validate environment
  const hasEnvFile = await retryOperation(
    () => validateEnvironment(),
    3,
    1000,
    'validateEnvironment',
  );
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
}

async function checkPort(port) {
  try {
    const { stdout } = await execPromise(`netstat -ano | findstr :${port}`);
    return !stdout.trim();
  } catch (error) {
    return true; // If the command fails, assume port is available
  }
}

async function validateEnvironment() {
  try {
    await access('.env');
    const envConfig = dotenv.parse(await readFile('.env'));
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

async function showProgressIndicator(operation, message, options = {}) {
  const frames = options.frames || [
    '⠋',
    '⠙',
    '⠹',
    '⠸',
    '⠼',
    '⠴',
    '⠦',
    '⠧',
    '⠇',
    '⠏',
  ];
  let i = 0;

  const spinner = setInterval(() => {
    process.stdout.write(
      `\r${chalk.cyan(frames[(i = ++i % frames.length)])} ${message}...`,
    );
  }, 80);

  try {
    const result = await operation();
    clearInterval(spinner);
    process.stdout.write(`\r${chalk.green('✓')} ${message}\n`);
    return result;
  } catch (error) {
    clearInterval(spinner);
    process.stdout.write(`\r${chalk.red('✗')} ${message}\n`);
    throw error;
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
  if (DEBUG_MODE) {
    console.error(chalk.red('Stack trace:'), reason.stack);
    debugLog('Promise:', promise);
  }
  writeLog(`Unhandled Rejection: ${reason}, Promise: ${promise}`, 'ERROR');
  console.error(
    chalk.red(`Unhandled Rejection: ${reason}, Promise: ${promise}`),
  );
});

process.on('uncaughtException', (error) => {
  writeLog(`Uncaught Exception: ${error.message}\n${error.stack}`, 'ERROR');
  console.error(
    chalk.red(`Uncaught Exception: ${error.message}\n${error.stack}`),
  );
  process.exit(1);
});

// --- Utility Function for Retry Logic ---
async function retryOperation(
  operation,
  retries = 3,
  delayMs = 1000,
  context = '',
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const contextMessage = context ? ` in ${context}` : '';
      writeLog(
        `Attempt ${attempt} failed${contextMessage}: ${error.message}`,
        'WARN',
      );
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw error;
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

  const { command } = await inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'Choose a command:',
      choices: choices,
    },
  ]);

  switch (command) {
    case 'reset':
      await resetProject();
      break;
    case 'setup':
      await setupProject();
      break;
    case 'check':
      await checkProject();
      break;
    case 'build':
      await buildProject();
      break;
    case 'dev':
      await projectDev();
      break;
    case 'test':
      await testProject();
      break;
    case 'clean':
      await cleanProject();
      break;
    case 'update':
      await updateDependencies();
      break;
    case 'info':
      await projectInfo();
      break;
    case 'clean-logs':
      await cleanLogsAndTemp();
      break;
    case 'audit':
      await auditDependencies();
      break;
    case 'docs':
      await generateDocs();
      break;
    case 'stats':
      await showStats();
      break;
    case 'backup':
      await backupProject();
      break;
    case 'validate':
      await validateProject();
      break;
    default:
      console.log(chalk.red('Invalid command.'));
  }
}

// --- Project Management Functions ---
async function confirmAction(message) {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: chalk.yellow(`⚠️  ${message}`),
      default: false,
    },
  ]);
  return confirmed;
}

async function resetProject() {
  const confirmed = await confirmAction(
    'This will delete all build artifacts and node_modules. Continue?',
  );
  if (!confirmed) {
    writeLog('Project reset cancelled by user', 'INFO');
    return false;
  }
  writeLog('Resetting project...', 'INFO');
  try {
    const directories = BUILD_ARTIFACTS;
    const cleaned = await cleanDirectories(directories);
    if (!cleaned) {
      return false;
    }

    const installed = await installDependencies();
    if (!installed) {
      return false;
    }

    writeLog('Project reset successfully.', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog(
      `Project reset failed: ${error.message} - Original Error: ${error}`,
      'ERROR',
    );
    return false;
  }
}

async function setupProject() {
  writeLog('Setting up project...', 'INFO');
  try {
    const nodeVersionCheck = await checkNodeVersion('>=16.0.0');
    if (!nodeVersionCheck) {
      return false;
    }

    const npmVersionCheck = await checkNpmVersion(REQUIRED_NPM_VERSION);
    if (!npmVersionCheck) {
      return false;
    }

    const globalPackagesCheck = await checkGlobalPackages();
    if (!globalPackagesCheck) {
      return false;
    }

    const installed = await installDependencies();
    if (!installed) {
      return false;
    }

    writeLog('Project setup completed successfully.', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog(`Project setup failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function checkProject() {
  writeLog('Running project checks...', 'INFO');
  try {
    const linted = await runCommand('npm', ['run', 'lint']);
    if (linted.code !== 0) {
      writeLog('Linting failed.', 'ERROR');
      return false;
    }

    const typeChecked = await runCommand('npm', ['run', 'typecheck']);
    if (typeChecked.code !== 0) {
      writeLog('Type checking failed.', 'ERROR');
      return false;
    }

    const tested = await runCommand('npm', ['run', 'test']);
    if (tested.code !== 0) {
      writeLog('Tests failed.', 'ERROR');
      return false;
    }

    writeLog('All checks passed successfully.', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog(`Project checks failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function buildProject() {
  writeLog('Building project...', 'INFO');
  try {
    const result = await runCommand('npm', ['run', 'build']);
    if (result.code !== 0) {
      writeLog('Build failed.', 'ERROR');
      return false;
    }

    writeLog('Project built successfully.', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog(`Project build failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function testProject() {
  writeLog('Running tests...', 'INFO');
  try {
    const result = await runCommand('npm', ['run', 'test']);
    if (result.code !== 0) {
      writeLog('Tests failed.', 'ERROR');
      return false;
    }

    writeLog('Tests passed successfully.', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog(`Tests execution failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function cleanProject() {
  writeLog('Cleaning project...', 'INFO');
  try {
    const directories = BUILD_ARTIFACTS;
    const result = await cleanDirectories(directories);
    if (!result) {
      return false;
    }

    writeLog('Project cleaned successfully.', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog(`Project cleaning failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function installDependencies() {
  writeLog('Installing dependencies...', 'INFO');
  try {
    const result = await runCommand('npm', ['install']);
    if (result.code !== 0) {
      writeLog('Dependency installation failed.', 'ERROR');
      return false;
    }

    writeLog('Dependencies installed successfully.', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog(`Dependency installation failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function updateDependencies() {
  writeLog('Updating dependencies...', 'INFO');
  try {
    const result = await runCommand('npm', ['update']);
    if (result.code !== 0) {
      writeLog('Dependency update failed.', 'ERROR');
      return false;
    }

    writeLog('Dependencies updated successfully.', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog(`Dependency update failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function auditDependencies() {
  writeLog('Auditing dependencies...', 'INFO');
  try {
    const result = await runCommand('npm', ['audit']);
    if (result.code !== 0) {
      writeLog('Dependency audit found vulnerabilities.', 'WARN');
    }

    writeLog('Dependency audit completed.', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog(`Dependency audit failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function generateDocs() {
  writeLog('Generating documentation...', 'INFO');
  try {
    const result = await runCommand('npm', ['run', 'docs']);
    if (result.code !== 0) {
      writeLog('Documentation generation failed.', 'ERROR');
      return false;
    }

    writeLog('Documentation generated successfully.', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog(`Documentation generation failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function showStats() {
  writeLog('Showing project statistics...', 'INFO');
  try {
    const files = await glob('**/*.*', {
      ignore: ['node_modules/**', '.git/**'],
      nodir: true,
      cwd: PROJECT_ROOT,
    });

    // Initialize statistics
    const stats = {
      total: 0,
      byExtension: {},
    };

    // Process each file
    for (const file of files) {
      try {
        const content = await readFile(file, 'utf-8');
        const lines = content.split('\n').length;
        const ext = file.split('.').pop() || 'no-extension';

        stats.total += lines;
        stats.byExtension[ext] = (stats.byExtension[ext] || 0) + lines;
      } catch (err) {
        writeLog(`Failed to read file ${file}: ${err.message}`, 'WARN');
      }
    }

    // Display statistics
    console.log(chalk.cyan('\nProject Statistics:\n'));
    console.log(`Total files: ${chalk.yellow(files.length)}`);
    console.log(`Total lines of code: ${chalk.yellow(stats.total)}\n`);

    console.log(chalk.cyan('Lines by file type:'));
    Object.entries(stats.byExtension)
      .sort(([, a], [, b]) => b - a)
      .forEach(([ext, lines]) => {
        console.log(`  ${ext.padEnd(10)} ${chalk.yellow(lines)}`);
      });

    writeLog('Project statistics displayed successfully.', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog(`Failed to show project statistics: ${error.message}`, 'ERROR');
    return false;
  }
}

async function backupProject() {
  writeLog('Creating project backup...', 'INFO');
  try {
    const output = createWriteStream('project-backup.zip');
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Sets the compression level.
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);

    // Append all files and directories from the project directory
    archive.directory('.', false);

    await archive.finalize();

    writeLog('Project backup created successfully.', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog(`Project backup failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function validateProject() {
  writeLog('Validating project...', 'INFO');
  try {
    const structureCheck = await checkProjectStructure();
    if (!structureCheck) {
      return false;
    }

    // Add more validation checks here as needed

    writeLog('Project validation passed successfully.', 'SUCCESS');
    return true;
  } catch (error) {
    writeLog(`Project validation failed: ${error.message}`, 'ERROR');
    return false;
  }
}

// --- Autocomplete Setup ---
function setupAutocomplete() {
  // Register command autocompletion
  const commands = Object.keys(COMMANDS);
  process.env.NODE_COMPLETE = 'complete';

  if (process.argv[2] === 'completion') {
    const line = process.argv[3] || '';
    console.log(commands.filter((cmd) => cmd.startsWith(line)).join('\n'));
    process.exit(0);
  }
}

// --- Main Execution ---
async function main() {
  try {
    setupAutocomplete();

    // Check if a command is provided as an argument
    const command = process.argv[2];

    if (command) {
      if (COMMANDS[command]) {
        writeLog(`Executing command: ${command}`, 'INFO');
        switch (command) {
          case 'reset':
            await resetProject();
            break;
          case 'setup':
            await setupProject();
            break;
          case 'check':
            await checkProject();
            break;
          case 'build':
            await buildProject();
            break;
          case 'dev':
            await projectDev();
            break;
          case 'test':
            await testProject();
            break;
          case 'clean':
            await cleanProject();
            break;
          case 'update':
            await updateDependencies();
            break;
          case 'info':
            await projectInfo();
            break;
          case 'clean-logs':
            await cleanLogsAndTemp();
            break;
          case 'audit':
            await auditDependencies();
            break;
          case 'docs':
            await generateDocs();
            break;
          case 'stats':
            await showStats();
            break;
          case 'backup':
            await backupProject();
            break;
          case 'validate':
            await validateProject();
            break;
          default:
            console.log(chalk.red('Invalid command.'));
            showHelp();
        }
      } else if (command === 'help' || command === '--help') {
        showHelp();
      } else {
        console.log(chalk.red('Invalid command.'));
        showHelp();
      }
    } else {
      // If no command is provided, show the interactive menu
      await showInteractiveMenu();
    }
  } catch (error) {
    writeLog(`CLI execution failed: ${error.message}`, 'ERROR');
    console.error(chalk.red(`CLI execution failed: ${error.message}`));
    process.exit(1);
  }
}

// Execute the main function
main();
