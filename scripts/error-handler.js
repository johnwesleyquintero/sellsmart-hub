const fs = require("fs");
const { readFile } = require('fs/promises');
const chalk = require('chalk');
const { EOL } = require('os');

const ERROR_CATEGORIES = {
  CONFIG: "Incorrect TypeScript configuration",
  TYPES: "Missing type definitions",
  IMPORTS: "Import issues",
  DEPS: "Outdated dependencies",
  SYNTAX: "TypeScript syntax errors",
  PATH: "Path resolution issues",
  LIBS: "Library compatibility issues",
};

const TROUBLESHOOTING_STEPS = {
  [ERROR_CATEGORIES.CONFIG]: [
    "Verify tsconfig.json compilerOptions",
    "Check file includes/excludes in config",
    "Ensure target and module settings are compatible",
  ],
  [ERROR_CATEGORIES.TYPES]: [
    "Install @types packages for dependencies",
    "Check type declaration files",
    "Verify type exports in package.json",
  ],
  [ERROR_CATEGORIES.IMPORTS]: [
    "Verify import paths and aliases",
    "Check module resolution settings",
    "Ensure file extensions are correct",
  ],
  [ERROR_CATEGORIES.DEPS]: [
    "Update TypeScript and related packages",
    "Run pnpm install --latest",
    "Check for peer dependency conflicts",
  ],
  [ERROR_CATEGORIES.SYNTAX]: [
    "Check for missing semicolons or brackets",
    "Verify proper type annotations",
    "Ensure proper use of TypeScript keywords",
  ],
  [ERROR_CATEGORIES.PATH]: [
    "Check baseUrl and paths in tsconfig.json",
    "Verify file exists at specified path",
    "Ensure import path case sensitivity matches",
  ],
  [ERROR_CATEGORIES.LIBS]: [
    "Verify library version compatibility",
    "Check for breaking changes in recent updates",
    "Ensure all required peer dependencies are installed",
  ],
};

const ERROR_SEVERITY = {
  WARNING: chalk.yellow,
  ERROR: chalk.red,
  INFO: chalk.cyan,
};

/**
 * Enhanced error analysis with code frame detection
 */
async function analyzeErrors(errorOutput) {
function detectErrorCategory(errorText, errorCode) {
  if (errorText.includes('Cannot find module')) return ERROR_CATEGORIES.IMPORTS;
  if (errorText.includes('is not assignable')) return ERROR_CATEGORIES.TYPES;
  if (errorCode === '2307') return ERROR_CATEGORIES.IMPORTS;
  if (errorCode === '2322') return ERROR_CATEGORIES.TYPES;
  if (errorCode === '7016') return ERROR_CATEGORIES.CONFIG;
  return ERROR_CATEGORIES.SYNTAX;
}

function extractCodeFrame(errorText) {
  const frameMatch = errorText.match(/(\d+):(\d+)[\s\S]*?\n([\s\S]*?\n)\s*(~+)/);
  return frameMatch ? {
    file: frameMatch.input.match(/([^\/]+\.[tj]sx?):/)?.[1] || 'unknown',
    line: parseInt(frameMatch[1]),
    column: parseInt(frameMatch[2]),
    code: frameMatch[3].trim(),
    underline: frameMatch[4]
  } : null;
}

function highlightCodeFrame(frame) {
  return `${chalk.dim(`${frame.line}:${frame.column}`)}  ${frame.code}\n${' '.repeat(frame.column + 3)}${chalk.red(frame.underline)}`;
}


  try {
    const errors = errorOutput.split(/error TS\d+/);
    const errorStats = {
      total: errors.length - 1,
      categories: new Map(),
      codeFrames: []
    };

    for (const error of errors) {
      const errorCodeMatch = error.match(/TS(\d+)/);
      const errorCode = errorCodeMatch?.[1] || 'unknown';
      
      // Analyze error type using multiple criteria
      const category = detectErrorCategory(error, errorCode);
      errorStats.categories.set(category, (errorStats.categories.get(category) || 0) + 1);

      // Extract code frames
      const codeFrame = extractCodeFrame(error);
      if (codeFrame) {
        errorStats.codeFrames.push({
          file: codeFrame.file,
          snippet: highlightCodeFrame(codeFrame)
        });
      }
    }

    return errorStats;
  } catch (err) {
    console.error(chalk.red('Error analysis failed:'));
    console.error(err);
    process.exit(1);
  }
}

function formatOutput(errorStats) {
  let output = chalk.bold(`\n${errorStats.total} TypeScript errors found:\n`);
  
  // Categorized error display
  errorStats.categories.forEach((count, category) => {
    output += `\n${ERROR_SEVERITY.ERROR('▶')} ${chalk.bold(category)}: ${count} errors`;
  });

  // Code frame display
  if (errorStats.codeFrames.length > 0) {
    output += '\n\n' + chalk.underline('Relevant Code Frames:') + '\n';
    errorStats.codeFrames.forEach((frame, index) => {
      output += `\n${chalk.dim(`#${index + 1}`)} ${frame.file}\n${frame.snippet}\n`;
    });
  }

  return output;
}

// Read TypeScript output from stdin
let tsOutput = "";
process.stdin.resume();
process.stdin.on("data", (data) => (tsOutput += data));
process.stdin.on("end", async () => {
  const errorStats = await analyzeErrors(tsOutput);
  console.log(formatOutput(errorStats));

  console.log("\n\x1b[31mType Check Failed\x1b[0m");
  console.log("\n\x1b[33mPotential Causes:\x1b[0m");
  errorStats.categories.forEach((count, cause) => console.log(`  ${chalk.yellow('▶')} ${cause}`));

  console.log("\n\x1b[36mTroubleshooting Steps:\x1b[0m");
  errorStats.categories.forEach((count, cause) => {
    TROUBLESHOOTING_STEPS[cause].forEach((step, i) =>
      console.log(`  › ${step}`),
    );
  });

  process.exit(1);
});
