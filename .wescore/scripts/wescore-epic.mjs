// WESCORE v3.14 - "BRO-EDITION EXTREME - PI DAY EDITION"
// NOW WITH MORE NEON, MORE MEMES, AND QUESTIONABLE SOUND EFFECTS!

// ==================================================================
// == SECTION 1: THE IMPORTS - GATHERING THE DIGITAL WAR PAINT ======
// ==================================================================
import boxen from 'boxen'; // For making things look "official"
import chalk from 'chalk'; // Gotta have those neon colors, bruh
import { Spinner } from 'cli-spinner'; // Make it look like it's actually *doing* something
import { execa } from 'execa'; // The engine that runs the checks
import figlet from 'figlet'; // BIG ASCII TEXT! YEAH!
import { promises as fs } from 'node:fs'; // Gotta read that config file
import os from 'node:os'; // Need system info for the brag sheet
import path from 'node:path'; // File paths, boring but necessary
import { performance } from 'node:perf_hooks'; // Gotta time those runs for bragging rights
import sound from 'sound-play'; // BRING THE NOISE!

// ==================================================================
// == SECTION 2: CONFIGURATION STATION - DIAL IT UP! ===============
// ==================================================================
const BRO_CONFIG = {
  strictMode: true, // No mercy!
  failFast: false, // Let all the errors roll in? Or bail early?
  timeout: 300000, // Don't wait forever, dude. 5 mins max.
  memeDensity: 9001, // IT'S OVER 9000! (Not actually used, but mandatory)
  leetMode: true, // Engage 1337 speak? Oh yeah.
  soundEffects: {
    // IMPORTANT: User needs to provide these sound files!
    startup: 'sounds/modem-dialup.mp3', // Placeholder path
    error: 'sounds/windows-xp-error.mp3', // Placeholder path
    successSingle: 'sounds/zelda-secret.mp3', // Placeholder path
    successAll: 'sounds/final-fantasy-victory.mp3', // Placeholder path
    failReport: 'sounds/metal-gear-alert.mp3', // Placeholder path
  },
  colors: {
    // Like a cyberpunk rave in your terminal
    error: (text) => chalk.hex('#ff0000')(text), // Fiery red
    warn: (text) => chalk.hex('#ffd700')(text), // Electric gold
    success: (text) => chalk.hex('#32cd32')(text), // Vibrant green
    info: (text) => chalk.hex('#00bfff')(text), // Cool blue
    debug: (text) => chalk.gray(text), // Keep debug subtle, gotta see the real errors
    header: (text) => chalk.hex('#ff1493')(text), // Radical Pink
    border: chalk.yellow, // Keep borders simple but bright
    checkName: chalk.cyan.bold,
    duration: chalk.magenta,
    timestamp: chalk.gray,
    asciiArt: chalk.greenBright, // Classic hacker green
  },
  spinners: [
    // Gotta keep 'em guessing
    '|/-\\|',
    '◐◓◑◒',
    '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
    '←↖↑↗→↘↓↙',
    '🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛',
    '🍔🍟🍕🌭🍿', // Why not?
  ],
};

// ==================================================================
// == SECTION 3: MEME ARSENAL - PREPARE FOR LAUNCH ===============
// ==================================================================
const MEME_RESPONSES_FAIL = [
  'BRUH. FIX THIS →',
  'CODE SMELLS LIKE TEEN SPIRIT 🎸',
  'THIS ERROR JUST DABBED ON YOU 💃',
  "EVEN PHP WOULDN'T DO THIS",
  'DID YOUR CAT WALK ON THE KEYBOARD? 🐈',
  "THIS IS WHY WE CAN'T HAVE NICE THINGS",
  'ERROR 404: SKILL NOT FOUND',
  'YOU HAVE DIED OF DYSENTERY (Code Edition)',
  'ALL YOUR BASE ARE BELONG TO ERROR',
  'LEEEEROOOOY JENKINS!',
  'FAIL: Task failed successfully.',
  'COMPUTER SAYS NO.',
  'RTFM!',
];

const MEME_RESPONSES_SUCCESS = [
  'NAILED IT! 🔨',
  'HIGH FIVE! 🙏',
  'CRUSHED IT LIKE A SODA CAN!',
  'TOO EASY! 😎',
  'FLAWLESS VICTORY!',
  'CHECK PASSED! GET REKT, BUGS!',
  "LOOKIN' SHARP! ✨",
  'SMOOTH OPERATOR',
  'GG EZ',
  'LEVEL UP! 🍄',
];

// ==================================================================
// == SECTION 4: HACKER TERMINAL - VISUAL ENHANCEMENTS ============
// ==================================================================
// Utility to pick random stuff
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Play sound safely
async function playSound(soundType) {
  const soundPath = BRO_CONFIG.soundEffects[soundType];
  if (soundPath) {
    try {
      // Check if file exists before trying to play
      await fs.access(soundPath);
      await sound.play(soundPath);
    } catch (err) {
      // Don't crash if sound fails, just log subtly
      if (err.code === 'ENOENT') {
        log(
          'DEBUG',
          `Sound file not found: ${soundPath}. Cannot play '${soundType}' sound.`,
        );
      } else {
        log(
          'DEBUG',
          `Failed to play sound '${soundType}' from ${soundPath}: ${err.message}`,
        );
      }
    }
  }
}

// Generate epic ASCII headers
function renderFiglet(text, font = 'Standard', colorFn = chalk.white) {
  try {
    const rendered = figlet.textSync(text, { font });
    console.log(colorFn(rendered));
  } catch (error) {
    // Fallback if figlet fails or font not found
    console.log(colorFn.bold(`\n=== ${text} ===\n`));
    log('DEBUG', `Figlet rendering failed: ${error.message}`);
  }
}

function showHackerHeader() {
  renderFiglet('WESCORE', 'Cybermedium', BRO_CONFIG.colors.header);
  console.log(
    BRO_CONFIG.colors.header('<<< BRO-EDITION EXTREME - v3.14 - ENGAGE! >>>'),
  );
  console.log(
    BRO_CONFIG.colors.asciiArt(`
  .--.      .--.      .--.      .--.      .--.      .--.      .--.
:::::.\\::::::::.\\::::::::.\\::::::::.\\::::::::.\\::::::::.\\::::::::.\\
       '--'      '--'      '--'      '--'      '--'      '--'      '--'
`),
  );
  playSound('startup');
}

// ==================================================================
// == SECTION 5: HYPER LOG - MORE INFO, MORE COLOR ===============
// ==================================================================
function log(level, message, checkName = '') {
  const timestamp = new Date().toISOString();
  let colorFn = chalk.white;
  let prefixIcon = 'ℹ️';

  switch (level.toUpperCase()) {
    case 'ERROR':
      colorFn = BRO_CONFIG.colors.error;
      prefixIcon = '💀';
      break;
    case 'WARN':
      colorFn = BRO_CONFIG.colors.warn;
      prefixIcon = '⚠️';
      break;
    case 'SUCCESS':
      colorFn = BRO_CONFIG.colors.success;
      prefixIcon = '✅';
      break;
    case 'INFO':
      colorFn = BRO_CONFIG.colors.info;
      prefixIcon = '➡️';
      break;
    case 'DEBUG':
      colorFn = BRO_CONFIG.colors.debug;
      prefixIcon = '⚙️';
      break;
  }

  // 1337 Speak transformation
  const transformToLeet = (str) => {
    if (!BRO_CONFIG.leetMode) return str;
    return str
      .replace(/e/gi, '3')
      .replace(/a/gi, '4')
      .replace(/o/gi, '0')
      .replace(/l/gi, '1')
      .replace(/t/gi, '7')
      .replace(/s/gi, '5');
  };

  const prefix = `${BRO_CONFIG.colors.timestamp(`[${timestamp}]`)} ${prefixIcon} ${chalk.bold(colorFn(`[${transformToLeet(level.toUpperCase())}]`))}`;
  const checkTag = checkName
    ? BRO_CONFIG.colors.checkName(`[${checkName}]`)
    : '';

  // Handle multi-line messages with proper indentation
  const messageLines = String(message).split('\n');
  const formattedMessage = messageLines
    .map((line, i) => {
      const indent = i === 0 ? '' : ' '.repeat(chalk.reset(prefix).length + 1); // Calculate length without ANSI codes
      return `${indent}${colorFn(transformToLeet(line))}`;
    })
    .join('\n');

  console.log(`${prefix} ${checkTag} ${formattedMessage}`);
}

// ==================================================================
// == SECTION 6: EPIC FAIL HANDLER - MEMES & SOUNDS ===============
// ==================================================================
function handleError(error, check) {
  const randomMeme = getRandom(MEME_RESPONSES_FAIL);
  const errorDetails =
    error.stderr || error.stdout || error.message || 'Unknown Error';
  const exitCodeInfo = error.exitCode ? ` (Exit Code: ${error.exitCode})` : '';

  const errorBoxContent = `${chalk.red.bold(randomMeme)}${exitCodeInfo}\n\n${chalk.white(errorDetails)}`;

  const errorBox = boxen(errorBoxContent, {
    padding: 1,
    margin: { top: 1, bottom: 1 },
    title: `💥 EPIC FAIL: ${check.name} 💥`,
    titleAlignment: 'center',
    borderStyle: 'double',
    borderColor: 'red',
  });

  console.error(errorBox); // Use console.error for semantic correctness
  playSound('error');
}

// ==================================================================
// == SECTION 7: RAD SUCCESS HANDLER - MORE MEMES & SOUNDS ========
// ==================================================================
function handleSuccess(check, duration) {
  const randomMeme = getRandom(MEME_RESPONSES_SUCCESS);
  log(
    'SUCCESS',
    `${randomMeme} (${BRO_CONFIG.colors.duration(formatDuration(duration))})`,
    check.name,
  );
  playSound('successSingle');
}

// ==================================================================
// == SECTION 8: THE CHECK SHREDDER - RUNNING COMMANDS LIKE A BOSS =
// ==================================================================
async function runEpicCheck(check, index, total) {
  const spinner = new Spinner(
    `${chalk.yellow(`[${index}/${total}]`)} %s ${BRO_CONFIG.colors.checkName(check.name)}... ${chalk.gray('Engaging thrusters...')}`,
  );
  spinner.setSpinnerString(getRandom(BRO_CONFIG.spinners));
  spinner.start();

  const startTime = performance.now();
  let resultData = {
    ...check,
    status: 'pending',
    duration: 0,
    stdout: '',
    stderr: '',
    exitCode: null,
    error: null,
  };

  try {
    const result = await execa(check.command, {
      shell: true, // Use shell for complex commands
      timeout: BRO_CONFIG.timeout,
      reject: false, // Handle rejection manually based on exit code
      all: true, // Capture stdout and stderr interleaved in 'all' property
      env: { ...process.env, FORCE_COLOR: '1' }, // Try to force color output from commands
    });

    const duration = performance.now() - startTime;
    spinner.stop(true); // Clear the spinner line

    resultData = {
      ...resultData,
      duration,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.exitCode,
      // Use 'all' for combined output if needed, but separate is often better
    };

    if (result.exitCode === 0) {
      resultData.status = 'passed';
      handleSuccess(check, duration);
    } else {
      resultData.status = 'failed';
      // Construct an error-like object for handleError
      const failureError = new Error(
        `Command failed with exit code ${result.exitCode}`,
      );
      failureError.stdout = result.stdout;
      failureError.stderr = result.stderr;
      failureError.exitCode = result.exitCode;
      handleError(failureError, check);
    }
  } catch (error) {
    // Catch errors from execa itself (e.g., command not found, timeout)
    const duration = performance.now() - startTime;
    spinner.stop(true);
    resultData = {
      ...resultData,
      status: 'errored',
      duration,
      exitCode: error.exitCode ?? 1, // Assign a default exit code
      error: error, // Store the actual error object
    };
    handleError(error, check);
  }
  return resultData;
}

// ==================================================================
// == SECTION 9: THE MAIN EVENT - LET'S GET READY TO RUMBLE! ======
// ==================================================================
async function runWescore() {
  const scriptStartTime = performance.now();
  showHackerHeader();
  log('INFO', 'Waking up the hamsters... 🐹');

  try {
    const config = await loadConfig(); // Load config first
    const checks = config.checks; // Already filtered in loadConfig

    if (checks.length === 0) {
      log(
        'WARN',
        'No checks enabled in .wescore.json. Nothing to do, I guess? 🤷',
      );
      process.exit(0); // Not an error, just nothing to run
    }

    log(
      'INFO',
      `Found ${chalk.magenta(checks.length)} checks. Mode: ${chalk.yellow(config.runMode)}. Fail Fast: ${chalk.yellow(config.failFast)}. Let's do this!`,
    );
    log('INFO', 'Initiating scan... BEEP BOOP BEEP...');

    const results = [];
    let passedCount = 0;
    const totalChecks = checks.length;

    const runPromises = async () => {
      if (config.runMode === 'parallel') {
        log('INFO', 'Going parallel! Like, multi-threading... kinda. 🔥');
        const promises = checks.map((check, i) =>
          runEpicCheck(check, i + 1, totalChecks),
        );
        const settledResults = await Promise.allSettled(promises);

        settledResults.forEach((settledResult) => {
          if (settledResult.status === 'fulfilled') {
            results.push(settledResult.value);
            if (settledResult.value.status === 'passed') passedCount++;
          } else {
            // This should ideally not happen if runEpicCheck catches errors, but belt-and-suspenders
            log('ERROR', `Unexpected runner error: ${settledResult.reason}`);
            // Create a dummy failed result
            results.push({
              name: 'Unknown Check',
              command: 'Error in runner',
              status: 'errored',
              duration: 0,
              error: settledResult.reason,
            });
          }
        });
      } else {
        // Sequential Mode
        log('INFO', 'Running checks one by one. Patience, young padawan.');
        for (let i = 0; i < totalChecks; i++) {
          const check = checks[i];
          const result = await runEpicCheck(check, i + 1, totalChecks);
          results.push(result);
          if (result.status === 'passed') {
            passedCount++;
          } else if (config.failFast) {
            log(
              'WARN',
              `🚨 FAIL FAST TRIGGERED! Check '${check.name}' failed. Aborting mission! 🚨`,
            );
            playSound('failReport'); // Play alert sound on fail fast
            break; // Exit the loop
          }
        }
      }
    };

    await runPromises();

    const scriptEndTime = performance.now();
    const totalDuration = scriptEndTime - scriptStartTime;

    showFinalReport(results, passedCount, totalChecks, totalDuration);

    // Determine exit code
    const failedCount = results.filter(
      (r) => r.status === 'failed' || r.status === 'errored',
    ).length;
    process.exit(failedCount > 0 ? 1 : 0);
  } catch (error) {
    // Catch errors during config loading or top-level issues
    log('ERROR', `FATAL WESCORE ERROR! The whole thing blew up! 💥`);
    console.error(error); // Log the raw error too
    playSound('error');
    process.exit(2); // Use a different exit code for script failures
  }
}

// ==================================================================
// == SECTION 10: THE SCOREBOARD - VICTORY OR DEFEAT? =============
// ==================================================================
function showFinalReport(results, passed, totalRun, totalDuration) {
  const failed = results.filter(
    (r) => r.status === 'failed' || r.status === 'errored',
  ).length;
  const success = passed === totalRun && failed === 0;

  console.log('\n' + '='.repeat(80));
  if (success) {
    renderFiglet('VICTORY!', 'Graffiti', BRO_CONFIG.colors.success);
    log('SUCCESS', 'ALL CHECKS PASSED! YOU ARE A CODE NINJA! 🥷');
    playSound('successAll');
  } else {
    renderFiglet('PWNED!', 'Bloody', BRO_CONFIG.colors.error);
    log('ERROR', `Mission Failed: ${failed} check(s) didn't make the cut.`);
    playSound('failReport');
  }
  console.log('='.repeat(80) + '\n');

  const summaryBox = boxen(
    [
      `${chalk.bold('Run Summary:')}`,
      ``,
      `Checks Executed: ${chalk.yellow(results.length)} / ${chalk.yellow(totalRun)}`,
      `Passed: ${BRO_CONFIG.colors.success(passed)}`,
      `Failed/Errored: ${failed > 0 ? BRO_CONFIG.colors.error(failed) : chalk.gray(0)}`,
      `Total Time: ${BRO_CONFIG.colors.duration(formatDuration(totalDuration))}`,
      ``,
      `System: ${chalk.blue(os.platform())} (${chalk.blue(os.arch())})`,
      `Node Version: ${chalk.green(process.version)}`,
    ].join('\n'),
    {
      padding: 1,
      margin: 1,
      borderStyle: success ? 'double' : 'classic',
      borderColor: success ? '#32cd32' : '#ff0000', // Use the actual hex codes
      title: '📊 FINAL SCORE 📊',
      titleAlignment: 'center',
    },
  );
  console.log(summaryBox);

  if (failed > 0) {
    log('WARN', 'Detailed Failure Report:');
    results
      .filter((r) => r.status !== 'passed')
      .forEach((check) => {
        const statusColor =
          check.status === 'errored'
            ? BRO_CONFIG.colors.error
            : BRO_CONFIG.colors.warn;
        const exitInfo = check.exitCode ? ` (Exit: ${check.exitCode})` : '';
        const errorMsg = check.error
          ? `: ${check.error.shortMessage || check.error.message}`
          : '';
        console.log(
          `  ${statusColor('✖')} ${BRO_CONFIG.colors.checkName(check.name)} ${statusColor(`[${check.status.toUpperCase()}]`)}${exitInfo}${errorMsg}`,
        );
        // Optionally log truncated stdout/stderr here if needed
        // if (check.stderr) console.log(chalk.gray(`    Stderr: ${truncateOutput(check.stderr)}`));
        // if (check.stdout) console.log(chalk.gray(`    Stdout: ${truncateOutput(check.stdout)}`));
      });
    log(
      'ERROR',
      "Scroll up to see the glorious details of each failure. Fix 'em, champ!",
    );
  }

  log(
    'INFO',
    `Wescore Bro-Edition signing off. ${success ? 'Stay frosty.' : 'Try harder, n00b.'}`,
  );
}

// ==================================================================
// == SECTION 11: UTILITY BELT - HANDY HELPERS ====================
// ==================================================================
function formatDuration(ms) {
  if (ms < 0) return 'N/A';
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${(ms / 60000).toFixed(1)}m`;
}

// Enhanced Config Loader with more specific errors
async function loadConfig() {
  const CONFIG_PATH = path.resolve(process.cwd(), '.wescore.json');
  log('DEBUG', `Attempting to load config from: ${CONFIG_PATH}`);

  try {
    const rawConfig = await fs.readFile(CONFIG_PATH, 'utf-8');
    let config;
    try {
      config = JSON.parse(rawConfig);
    } catch (parseError) {
      throw new Error(
        `Syntax Error in ${CONFIG_PATH}! Looks like JSON got scrambled. Maybe a stray comma or a cat walked on the keyboard? 🐈\n  ${parseError.message}`,
      );
    }

    // Validate config structure
    if (!config || typeof config !== 'object') {
      throw new Error('Config file is empty or not a valid JSON object.');
    }
    if (!config.checks || !Array.isArray(config.checks)) {
      throw new Error(
        "Config file is missing the 'checks' array, or it's not an array. Did you forget it?",
      );
    }

    const enabledChecks = config.checks.filter((c, index) => {
      if (typeof c !== 'object' || c === null) {
        log('WARN', `Check at index ${index} is not an object. Skipping.`);
        return false;
      }
      if (!c.name || typeof c.name !== 'string') {
        log(
          'WARN',
          `Check at index ${index} is missing a 'name' (string). Skipping.`,
        );
        return false;
      }
      if (!c.command || typeof c.command !== 'string') {
        log(
          'WARN',
          `Check "${c.name}" is missing a 'command' (string). Skipping.`,
        );
        return false;
      }
      // Default to enabled if 'enabled' property is missing or not explicitly false
      return c.enabled !== false;
    });

    log('DEBUG', `Loaded ${enabledChecks.length} enabled checks.`);

    return {
      runMode: ['parallel', 'sequential'].includes(config.runMode)
        ? config.runMode
        : 'sequential', // Default to sequential
      failFast: config.failFast === true, // Explicitly check for true
      checks: enabledChecks,
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(
        `Config file not found at ${CONFIG_PATH}. Did it get beamed up by aliens? 👽 Create one!`,
      );
    }
    // Re-throw other errors (like parsing or validation errors)
    throw new Error(`Failed to load or validate config: ${error.message}`);
  }
}

// ==================================================================
// == SECTION 12: IGNITION SEQUENCE - FIRE IT UP! =================
// ==================================================================
runWescore().catch((e) => {
  // This catches truly unexpected errors not handled within runWescore's try/catch
  console.error(
    '\n' +
      chalk.bgRed.whiteBright.bold(
        '! C A T A S T R O P H I C   F A I L U R E !',
      ),
  );
  console.error(chalk.red('The Wescore runner itself crashed and burned! 🔥'));
  console.error(e);
  process.exit(3); // Even more distinct exit code
});
