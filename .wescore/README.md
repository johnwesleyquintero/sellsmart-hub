

<div align="center">
  <img src="assets/logo.svg" alt="Wescore Logo" width="200">

  [![Netlify Status](https://api.netlify.com/api/v1/badges/2948d7bc-c617-4620-8b04-c8342ff54b33/deploy-status)](https://app.netlify.com/sites/wescore/deploys)


# Wescore | Code Quality Framework

**Version:** 1.1.0</div>

## Overview

Wescore provides a streamlined solution for maintaining high code quality standards through automated checks and intelligent reporting. It runs your project's existing formatter, linter, type checker, and build commands, consolidating their output into a clear, actionable log file.

The framework executes configured checks sequentially or in parallel. When checks fail, it captures the full `stdout` and `stderr`, intelligently parses this output using configurable regular expressions defined in `.wescore.json`, and generates a concise summary of detected errors along with potential suggestions. This significantly speeds up identifying and fixing code quality issues before committing code or running CI pipelines.

## Key Features

-   **Automated Checks:** Runs configured commands for formatting, linting, type checking, building, etc.
-   **Flexible Execution:** Supports both sequential (default) and parallel execution of checks.
-   **Detailed File Logging:** Creates a comprehensive `run_tasks.log` file in the project root with timestamps, check status, full command output on failure, and a summarized error report.
-   **Intelligent Error Parsing:** Extracts specific error lines from `stdout`/`stderr` based on configurable regex patterns defined in `.wescore.json`.
-   **Actionable Error Summary:** Presents a clear "Detected Errors" section in the log for failed checks, listing only the relevant error lines.
-   **Configurable Suggestions:** Displays custom troubleshooting suggestions alongside detected errors, configured per error category.
-   **Easy Integration:** Designed for simple setup via `npm scripts` for local development and CI/CD pipelines.
-   **Configurable:** Uses an optional `.wescore.json` file for defining checks, execution behavior, error patterns, and suggestions.
-   **Robust Process Management:** Uses Node.js `spawn` for reliable command execution and output capturing.
-   **Type Safety:** Implements configuration validation using Zod schema.

## Prerequisites

-   **Node.js:** Version 18 or higher recommended.
-   **Package Manager:** `npm` is recommended and used in examples (aligns with project standards).
-   **Project Tools:** Your project must have its own tools installed and configured (via `package.json` scripts or executables) for:
    -   Formatting (e.g., Prettier)
    -   Linting (e.g., ESLint)
    -   Type Checking (e.g., TypeScript's `tsc`)
    -   Building (e.g., Next.js build, `tsc`, Vite, Webpack)

## Installation

1.  Place the `.wescore` directory in your project root.
2.  Install required dependencies:

    ```bash
    npm install --save-dev chalk zod
    ```

3.  Ensure your project's formatter, linter, type checker, and build tools are installed as development dependencies.

## Project Structure

The framework resides within the `.wescore` directory:
 ```
.wescore/
├── config/
│   ├── loader.js  # Configuration loading and validation logic
│   └── schema.js  # Zod schema for .wescore.json structure
├── runner/
│   └── commandRunner.js  # Executes commands using spawn
├── reporting/ # (Potentially removed/refactored if reporter.js is unused)
│   └── reporter.js  # (Legacy reporting, main logic now in main.js)
├── utils/ # (Potentially removed/refactored if errorCategorizer.js is unused)
│   └── errorCategorizer.js  # (Legacy categorization, main logic now in main.js)
└── main.js  # Main script: orchestrates checks, logging, and error parsing
 ```
## Scripts
-   **`npm run cq`**: Runs the Wescore script.
-   **`npm run format`**: Runs Prettier for code formatting.
-   **`npm run lint`**: Runs ESLint for linting.
-   **`npm run typecheck`**: Runs TypeScript's type checker.
-   **`npm run build`**: Runs the project's build command (e.g., Next.js build).

*(Note: Review if `reporting/reporter.js` and `utils/errorCategorizer.js` are still used or if their logic is fully integrated into `main.js`. Update structure if needed.)*

## Configuration (`.wescore.json`)

Create a `.wescore.json` file in your project root to customize behavior (optional, defaults are used otherwise).

**Example `.wescore.json`:**

```json
{
  "commandTimeout": 300000, // Optional: Global timeout for commands in ms (default: 300000)
  "runInParallel": false,  // Optional: Run checks in parallel (default: false)
  "stopOnFail": false,     // Optional: Stop all checks if one fails (default: false)
  "logLevel": "info",      // Optional: Logging level (e.g., 'debug', 'info', 'warn', 'error')
  "checks": [
    {
      "id": "format",      // *** Unique ID, MUST match a key in errorCategories ***
      "name": "Formatting (Prettier)", // Display name
      "command": "npm run format",     // The command to execute
      "description": "Formats code using Prettier." // Optional description
    },
    {
      "id": "lint",        // *** Unique ID, MUST match a key in errorCategories ***
      "name": "Linting (ESLint)",
      "command": "npm run lint",
      "description": "Lints code using ESLint."
    },
    {
      "id": "typecheck",   // *** Unique ID, MUST match a key in errorCategories ***
      "name": "Type Checking (TSC)",
      "command": "npx tsc --noEmit", // Use npx if tsc is not a direct script
      "description": "Performs static type checking."
    },
    {
      "id": "build",       // *** Unique ID, MUST match a key in errorCategories ***
      "name": "Build Project",
      "command": "npm run build",
      "description": "Builds the project for production."
    }
  ],
  "errorCategories": {
    "format": { // <<< Key MUST match a check "id"
      "patterns": [
        // Regex patterns to identify specific error lines for this check
        "SyntaxError:", // Match Prettier syntax errors
        "\\[error\\]"   // Match lines starting with [error] (escape brackets in JSON)
      ],
      "suggestion": "Run 'npm run format' to fix Prettier issues or check the indicated file for syntax errors." // Optional suggestion
    },
    "lint": { // <<< Key MUST match a check "id"
      "patterns": [
        "^\\s*\\d+:\\d+\\s+Error:", // Match ESLint 'L:C Error:' lines
        "^\\./.*?:$",             // Match ESLint lines starting with './path/file.ts:'
        "Parsing error:"          // Match ESLint parsing errors
      ],
      "suggestion": "Run 'npm run lint -- --fix' to potentially auto-fix, or review the reported ESLint errors."
    },
    "typecheck": { // <<< Key MUST match a check "id"
      "patterns": [
        // Match full TypeScript error lines: path/file.ts(L,C): error TSxxxx: Message.
        "^.*?\\.tsx?\\(\\d+,\\d+\\): error TS\\d+:.*$"
      ],
      "suggestion": "Review the TypeScript errors reported by 'npx tsc --noEmit'. Check types and syntax in the specified files."
    },
    "build": { // <<< Key MUST match a check "id"
      "patterns": [
        "Failed to compile",
        "Build failed",
        "Syntax Error",          // Match general syntax errors during build
        "Error:.*?Expected",     // Match SWC/Webpack errors like 'Error: x Expected...'
        "error TS\\d+:"          // Catch TS errors reported during build
      ],
      "suggestion": "Check the build output above for compilation errors. Often related to syntax errors, type issues, or configuration problems."
    }
    // Add more categories matching check IDs as needed
  }
}
Key Configuration Points:

-   `checks[].id`: Must be unique and must exactly match a key in the `errorCategories` object for error parsing to work for that check.
-   `errorCategories.{id}.patterns`: An array of strings, each representing a regular expression (case-insensitive). These patterns are tested against each line of the failed command's `stdout`/`stderr` (after stripping ANSI codes). Remember to escape backslashes (`\`) in JSON strings (e.g., `\\d` instead of `\d`).
-   `errorCategories.{id}.suggestion`: An optional string displayed in the log if errors matching the patterns are found for that category.

## Usage

Add the necessary scripts for formatting, linting, etc., to your `package.json`.

Add the main Wescore script to your `package.json`:

```json
{
  "scripts": {
    // Your project's specific scripts:
    "format": "prettier --write .",
    "lint": "eslint . --ext .ts,.tsx --max-warnings=0", // Example ESLint
    "typecheck": "tsc --noEmit",
    "build": "next build", // Example Next.js build

    // Wescore script:
    "cq": "node .wescore/main.js"  // cq = Code Quality
  }
}
```

Run the quality checks from your terminal:

```bash
npm run cq
```

Review the console output for a quick summary and check the `run_tasks.log` file in your project root for detailed results, including the "Detected Errors" sections for failed checks.

## CI Integration

Integrate Wescore into your CI/CD pipeline (e.g., GitHub Actions) to enforce quality checks automatically.

```yaml
name: Code Quality Check

on: [push, pull_request]

jobs:
  quality-checks:
    runs-on: ubuntu-latest  # Or your preferred runner
    steps:
      - uses: actions/checkout@v4  # Use latest checkout action

      - name: Set up Node.js
        uses: actions/setup-node@v4  # Use latest setup-node action
        with:
          node-version: '18'  # Or your project's required Node version
          cache: 'npm'  # Enable npm caching

      - name: Install Dependencies
        run: npm ci  # Use 'ci' for faster, deterministic installs in CI

      - name: Run Code Quality Checks (Wescore)
        run: npm run cq  # Execute the Wescore script

      # Optional: Upload log file as artifact on failure
      - name: Upload Wescore Log on Failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: wescore-log
          path: run_tasks.log
```

## Best Practices

-   **Accurate `check.id`:** Ensure the `id` in the `checks` array exactly matches the corresponding key in `errorCategories`.
-   **Effective Regex Patterns:** Write specific regex patterns in `.wescore.json` to accurately capture the error lines you care about for each tool. Test your regex patterns.
-   **Strict Commands:** Configure your underlying tools (ESLint, TSC) to be strict (e.g., `--max-warnings=0`) so they exit with non-zero codes on issues, allowing Wescore to detect failures.
-   **Sequential Locally:** Use sequential mode (`"runInParallel": false`) for local development for clearer, easier-to-read output.
-   **Parallel in CI:** Consider enabling parallel mode (`"runInParallel": true`) in CI for potentially faster feedback, if resource contention is not an issue.
-   **Timeout:** Adjust `commandTimeout` if your checks (especially build) take longer than the default 5 minutes.

## Troubleshooting

-   **"Detected Errors" section is empty or incorrect:**
    -   Verify that the `id` for the failed check in the `checks` array exactly matches a key in the `errorCategories` object in `.wescore.json`.
    -   Check the `patterns` array for that category in `.wescore.json`. Are the regex strings correct? Do they accurately match the error lines shown in the raw `stdout`/`stderr` for the failed command? Remember to escape backslashes in the JSON file (e.g., `\\d` for `\d`, `\\[` for `[`).
    -   Ensure the underlying command (e.g., `npm run lint`) is actually outputting the errors you expect to `stdout` or `stderr`.
-   **Command Not Found:** Ensure the command specified in the `checks` array (e.g., `npm run lint`) exists in your `package.json` scripts or is a globally/locally installed executable accessible via `npx`.
-   **Check Times Out:** Increase the global `commandTimeout` in `.wescore.json` or add a specific `timeout` property to the individual check definition in the `checks` array.

## Contributing

Contributions to improve Wescore are welcome! Please follow standard Git workflow (fork, branch, commit, PR).

## License

MIT License.
