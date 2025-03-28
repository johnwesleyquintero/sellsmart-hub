const fs = require("fs");

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

function analyzeErrors(errorOutput) {
  const errors = errorOutput.split("error TS");
  const categorized = new Set();
  const errorCounts = new Map();

  errors.forEach((error) => {
    let matched = false;

    // Syntax errors
    if (error.match(/expected|unexpected|missing|';'|'{'|'}'|'\('|'\)'/i)) {
      categorized.add(ERROR_CATEGORIES.SYNTAX);
      matched = true;
    }

    // Module and path errors
    if (
      error.includes("Cannot find module") ||
      error.includes("Cannot resolve module")
    ) {
      categorized.add(ERROR_CATEGORIES.PATH);
      matched = true;
    }

    // Type definition errors
    if (
      error.includes("could not find a declaration file") ||
      error.includes("requires types")
    ) {
      categorized.add(ERROR_CATEGORIES.TYPES);
      matched = true;
    }

    // Import and export errors
    if (
      error.includes("has no exported member") ||
      error.includes("Module not found")
    ) {
      categorized.add(ERROR_CATEGORIES.IMPORTS);
      matched = true;
    }

    // Configuration errors
    if (error.includes("compiler option") || error.includes("tsconfig")) {
      categorized.add(ERROR_CATEGORIES.CONFIG);
      matched = true;
    }

    // Library compatibility errors
    if (error.includes("version") || error.includes("compatibility")) {
      categorized.add(ERROR_CATEGORIES.LIBS);
      matched = true;
    }

    // Dependency errors
    if (
      error.includes("requires types") ||
      error.includes("peer dependencies")
    ) {
      categorized.add(ERROR_CATEGORIES.DEPS);
      matched = true;
    }

    // Track error frequency
    if (matched) {
      Array.from(categorized).forEach((category) => {
        errorCounts.set(category, (errorCounts.get(category) || 0) + 1);
      });
    }
  });

  // Sort categories by frequency
  return Array.from(categorized).sort(
    (a, b) => (errorCounts.get(b) || 0) - (errorCounts.get(a) || 0),
  );
}

// Read TypeScript output from stdin
let tsOutput = "";
process.stdin.resume();
process.stdin.on("data", (data) => (tsOutput += data));
process.stdin.on("end", () => {
  const categories = analyzeErrors(tsOutput);

  console.log("\n\x1b[31mType Check Failed\x1b[0m");
  console.log("\n\x1b[33mPotential Causes:\x1b[0m");
  categories.forEach((cause, i) => console.log(`  ${i + 1}. ${cause}`));

  console.log("\n\x1b[36mTroubleshooting Steps:\x1b[0m");
  categories.forEach((cause) => {
    TROUBLESHOOTING_STEPS[cause].forEach((step, i) =>
      console.log(`  › ${step}`),
    );
  });

  process.exit(1);
});
