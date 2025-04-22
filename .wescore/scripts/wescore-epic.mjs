// WESCORE v3.0 - "BRO-EDITION EXTREME"

// ========================
// 1. IMPORTS (WITH ATTITUDE)
// ========================
import boxen from 'boxen';
import chalk from 'chalk';
import { Spinner } from 'cli-spinner';
import { execa } from 'execa';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import sound from 'sound-play';

// ========================
// 2. CONFIG (EXTREME MODE)
// ========================
const BRO_CONFIG = {
  strictMode: true,
  soundtrack: 'never-gonna-give-you-up.mp3',
  memeDensity: 9001,
  failFast: false,
  timeout: 300000,
  colors: {
    error: '#FF5555',
    warn: '#FFAA33',
    success: '#55FF55',
    info: '#5555FF',
    debug: '#AAAAAA',
  },
};

// ========================
// 3. MEME ERROR RESPONSES
// ========================
const MEME_RESPONSES = [
  'BRUH. FIX THIS →',
  'CODE SMELLS LIKE TEEN SPIRIT 🎸',
  'THIS ERROR JUST DABBED ON YOU 💃',
  "EVEN PHP WOULDN'T DO THIS",
  'DID YOUR CAT WALK ON THE KEYBOARD?',
  "THIS IS WHY WE CAN'T HAVE NICE THINGS",
];

// ========================
// 4. HACKER UI COMPONENTS
// ========================
function showHackerHeader() {
  console.log(
    boxen(chalk.hex('#55FF55').bold('WESCORE BRO-EDITION'), {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: '#FF5555',
    }),
  );

  console.log(
    chalk.hex('#FFAA33')(`
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  `),
  );
}

// ========================
// 5. ENHANCED LOGGER
// ========================
function log(level, message, checkName = '') {
  const timestamp = new Date().toISOString();
  const color = BRO_CONFIG.colors[level.toLowerCase()] || '#FFFFFF';
  const prefix = `${chalk.gray(`[${timestamp}]`)} ${chalk.hex(color).bold(`[${level}]`)}`;

  const formattedMessage = message
    .split('\n')
    .map((line, i) => (i === 0 ? line : ' '.repeat(prefix.length + 1) + line))
    .join('\n');

  console.log(
    `${prefix} ${checkName ? chalk.cyan(`[${checkName}]`) : ''} ${formattedMessage}`,
  );
}

// ========================
// 6. MEME-POWERED ERROR HANDLER
// ========================
function handleError(error, check) {
  const randomMeme =
    MEME_RESPONSES[Math.floor(Math.random() * MEME_RESPONSES.length)];
  const errorBox = boxen(
    chalk.hex(BRO_CONFIG.colors.error)(`${randomMeme}\n\n${error.message}`),
    { padding: 1, borderColor: 'red' },
  );

  log('ERROR', errorBox, check.name);

  if (BRO_CONFIG.soundtrack) {
    sound.play(BRO_CONFIG.soundtrack).catch(() => {});
  }
}

// ========================
// 7. EPIC CHECK RUNNER
// ========================
async function runEpicCheck(check, index, total) {
  const spinner = new Spinner(`%s ${check.name}...`);
  spinner.setSpinnerString('|/-\\');
  spinner.start();

  try {
    const startTime = performance.now();
    const result = await execa(check.command, {
      shell: true,
      timeout: BRO_CONFIG.timeout,
      reject: false,
    });

    const duration = performance.now() - startTime;
    spinner.stop(true);

    if (result.exitCode === 0) {
      log('SUCCESS', `✅ Passed in ${formatDuration(duration)}`, check.name);
      return { ...check, status: 'passed', duration };
    } else {
      handleError(
        {
          message: `Exit Code ${result.exitCode}\n${result.stderr || result.stdout}`,
        },
        check,
      );
      return { ...check, status: 'failed', duration };
    }
  } catch (error) {
    spinner.stop(true);
    handleError(error, check);
    return { ...check, status: 'errored', duration: 0 };
  }
}

// ========================
// 8. MAIN EXECUTION FLOW
// ========================
async function runWescore() {
  showHackerHeader();

  try {
    const config = await loadConfig();
    const checks = config.checks.filter((c) => c.enabled !== false);

    log('INFO', `Running ${checks.length} checks in ${config.runMode} mode`);

    const results = [];
    let passed = 0;

    if (config.runMode === 'parallel') {
      const promises = checks.map((check, i) =>
        runEpicCheck(check, i + 1, checks.length).then((result) => {
          results.push(result);
          if (result.status === 'passed') passed++;
        }),
      );
      await Promise.all(promises);
    } else {
      for (let i = 0; i < checks.length; i++) {
        const result = await runEpicCheck(checks[i], i + 1, checks.length);
        results.push(result);
        if (result.status === 'passed') passed++;

        if (BRO_CONFIG.failFast && result.status !== 'passed') {
          log('WARN', 'Fail fast enabled - stopping checks');
          break;
        }
      }
    }

    showFinalReport(results, passed);
    process.exit(passed === checks.length ? 0 : 1);
  } catch (error) {
    handleError(error, { name: 'Wescore Runner' });
    process.exit(2);
  }
}

// ========================
// 9. FINAL REPORT (EXTREME STYLE)
// ========================
function showFinalReport(results, passed) {
  const total = results.length;
  const failed = total - passed;
  const duration = results.reduce((sum, r) => sum + r.duration, 0);

  const report = boxen(
    chalk.hex('#55FF55').bold(`WESCORE RESULTS\n\n`) +
      chalk.hex('#FFAA33')(`${passed}/${total} checks passed\n`) +
      chalk.hex(failed ? '#FF5555' : '#55FF55')(`${failed} checks failed\n\n`) +
      chalk.hex('#5555FF')(`Total duration: ${formatDuration(duration)}`),
    {
      padding: 1,
      borderStyle: 'round',
      borderColor: failed ? '#FF5555' : '#55FF55',
    },
  );

  console.log(report);

  if (failed > 0) {
    console.log(chalk.hex('#FF5555').bold('\nFAILED CHECKS:'));
    results
      .filter((r) => r.status !== 'passed')
      .forEach((check) => {
        console.log(chalk.hex('#FFAA33')(`› ${check.name}`));
      });
  }
}

// ========================
// 10. UTILITIES
// ========================
function formatDuration(ms) {
  return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

async function loadConfig() {
  const CONFIG_PATH = path.resolve(process.cwd(), '.wescore.json');

  try {
    const rawConfig = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(rawConfig);

    // CAT-PROOFING 🐾
    if (!config.checks || !Array.isArray(config.checks)) {
      throw new Error(
        "Config file is missing 'checks' array (or it's not an array)",
      );
    }

    return {
      runMode: config.runMode || 'sequential',
      failFast: config.failFast || false,
      checks: config.checks.filter((c) => c.enabled !== false), // Filter enabled checks
    };
  } catch (error) {
    // CAT-TO-TECHNICAL TRANSLATION 🐈➡️💻
    let errorMsg = error.message;
    if (error.code === 'ENOENT') {
      errorMsg = `${CONFIG_PATH} not found - Did your cat hide it?`;
    } else if (error instanceof SyntaxError) {
      errorMsg = `Invalid JSON in ${CONFIG_PATH} - Cat-induced syntax error?`;
    }

    throw new Error(`Config Error: ${errorMsg}`);
  }
}

// ========================
// RUN THAT BAD BOY
// ========================
runWescore().catch((e) => {
  handleError(e, { name: 'Wescore Runner' });
  process.exit(2);
});
