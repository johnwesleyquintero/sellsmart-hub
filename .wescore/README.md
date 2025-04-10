# Wescore | Code Quality Framework

## Overview

The Code Quality Framework provides a comprehensive solution for maintaining high standards in your codebase through automated checks and reporting. It's designed to be flexible enough to adapt to various project types while providing consistent quality enforcement.

The framework automates essential code quality checks within your project, ensuring adherence to formatting standards, linting rules, type safety, and successful builds. It provides a unified script (`npm run cq`) to run these checks either sequentially or in parallel. The framework intelligently captures output from failed checks, categorizes errors based on configurable patterns, and presents a consolidated summary for easier debugging and resolution.

## Key Features

- **Automated Checks:** Runs formatter, linter, type checker, and build commands
- **Flexible Execution:** Supports both sequential and parallel execution of checks
- **Consolidated Reporting:** Provides a clear summary of failed checks and their output
- **Error Categorization:** Groups errors based on configurable patterns with custom suggestions
- **Easy Integration:** Designed for simple setup and use in local development and CI pipelines
- **Configurable:** Uses an optional `.wescore.json` file for advanced customization
- **Modular Architecture:** Organized into logical units for better maintainability and testing
- **Robust Process Management:** Uses Node.js spawn for reliable command execution
- **Type Safety:** Implements configuration validation using Zod schema

## Prerequisites

Before implementing the framework, ensure your development environment meets these requirements:

- **Node.js:** Required to run the script and associated tools
- **Package Manager:** npm, yarn, pnpm, or bun
- **Project-Specific Tools:** Your project must have its own chosen tools installed and configured for:
  - Formatting (e.g., Prettier)
  - Linting (e.g., ESLint)
  - Type Checking (e.g., TypeScript's `tsc`)
  - Building (e.g., Vite, Webpack, `tsc`)

## Installation

1. Install required dependencies:

```bash
npm install --save-dev chalk zod
# or
yarn add --dev chalk zod
# or
pnpm add --save-dev chalk zod
# or
bun add --dev chalk zod
```

2. Ensure your project's formatter, linter, type checker, and build tool are installed as development dependencies.

## Project Structure

The framework is organized into the following modules:

```
.wescore/
├── config/
│   ├── loader.js     # Configuration loading and validation
│   └── schema.js     # Zod schema definitions
├── runner/
│   └── commandRunner.js  # Command execution logic
├── reporting/
│   └── reporter.js   # Output formatting and reporting
├── utils/
│   └── errorCategorizer.js  # Error pattern matching
└── main.js  # Main orchestrator
```

## Configuration

Create a `.wescore.json` file in your project root for customization:

```json
{
  "parallel": true,
  "stopOnFail": false,
  "commandTimeout": 300000,
  "checks": [
    {
      "id": "format",
      "name": "Formatting (Prettier)",
      "command": "npm run format"
    },
    {
      "id": "lint",
      "name": "Linting (ESLint)",
      "command": "npm run lint"
    },
    {
      "id": "typecheck",
      "name": "Type Checking",
      "command": "npx tsc --noEmit"
    },
    {
      "id": "build",
      "name": "Build Project",
      "command": "npm run build"
    }
  ],
  "errorCategories": {
    "style": {
      "patterns": ["eslint", "prettier", "[Ss]tyle.*rule"],
      "suggestion": "Review code style guidelines and run formatting/linting tools."
    },
    "types": {
      "patterns": ["TS\\d+", "[Tt]ype.*error"],
      "suggestion": "Fix type inconsistencies and check annotations."
    },
    "build": {
      "patterns": ["build.*failed", "webpack", "vite"],
      "suggestion": "Review build configuration and resolve compilation errors."
    }
  }
}
```

## Usage

1. Add the following scripts to your `package.json`:

```json
{
  "scripts": {
    "format": "prettier --write .",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "build": "vite build",
    "cq": "node .wescore/main.js"
  }
}
```

2. Run the quality checks:

```bash
npm run cq
# or
yarn cq
# or
pnpm cq
# or
bun cq
```

## CI Integration

Example GitHub Actions workflow:

```yaml
name: Code Quality Check

on: [push, pull_request]

jobs:
  quality-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install Dependencies
        run: npm install

      - name: Run Code Quality Checks
        run: npm run cq
```

## Best Practices

- **Command Configuration:** Use appropriate flags for strict checking (e.g., `--max-warnings=0` for ESLint)
- **Parallel Execution:** Enable in CI environments for speed, use sequential locally for clearer output
- **Error Categories:** Define specific categories relevant to your project with actionable suggestions
- **Timeout Management:** Adjust command timeouts based on your build complexity
- **Process Management:** The framework uses `spawn` instead of `exec` for better process control and output handling

## Troubleshooting

### Common Issues and Solutions

#### Command Execution

- **Command Not Found**
  - Verify tool installation in package.json
  - Check if scripts are correctly defined
  - Ensure PATH environment is properly set
  - Example fix:
    ```json
    {
      "scripts": {
        "format": "prettier --write .",
        "lint": "eslint .",
        "cq": "node .wescore/main.js"
      }
    }
    ```

#### Performance Issues

- **Parallel Execution Problems**
  - Switch to sequential mode by setting `"parallel": false`
  - Monitor system resources during execution
  - Adjust command timeouts based on project size:
    ```json
    {
      "parallel": false,
      "commandTimeout": 600000
    }
    ```

#### Configuration Issues

- **Regex Pattern Errors**
  - Test patterns using regex validators
  - Use escaped characters properly
  - Example pattern fix:
    ```json
    {
      "errorCategories": {
        "style": {
          "patterns": ["eslint", "prettier", "\\[Ss\\]tyle.*rule"]
        }
      }
    }
    ```

#### Output and Reporting

- **Missing or Incomplete Output**
  - Check stdout/stderr handling in commandRunner
  - Verify file permissions
  - Enable debug mode for detailed logs

## API Reference

### Configuration Options

#### Core Settings

```json
{
  "parallel": boolean,      // Enable/disable parallel execution
  "stopOnFail": boolean,   // Stop all checks if one fails
  "commandTimeout": number // Timeout in milliseconds
}
```

#### Check Configuration

```json
{
  "checks": [{
    "id": string,           // Unique identifier
    "name": string,         // Display name
    "command": string,      // Command to execute
    "timeout": number      // Optional per-check timeout
  }]
}
```

#### Error Categories

```json
{
  "errorCategories": {
    "categoryName": {
      "patterns": string[],  // Regex patterns
      "suggestion": string   // Help message
    }
  }
}
```

### Integration Examples

#### Jenkins Pipeline

```groovy
pipeline {
  agent any
  stages {
    stage('Quality Check') {
      steps {
        sh 'npm install'
        sh 'npm run cq'
      }
    }
  }
}
```

#### GitLab CI

```yaml
quality_check:
  script:
    - npm install
    - npm run cq
  artifacts:
    reports:
      junit: test-results.xml
```

#### Azure Pipelines

```yaml
steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '18.x'
  - script: |
      npm install
      npm run cq
    displayName: 'Run Quality Checks'
```

## Performance Optimization

### Best Practices

- Use `.wesignore` to exclude unnecessary files
- Implement caching for repeated checks
- Configure appropriate timeouts per command
- Optimize regex patterns for faster matching

### Resource Management

- Monitor memory usage in parallel mode
- Implement graceful degradation
- Use worker threads for CPU-intensive tasks
- Implement proper cleanup on process termination

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests for any improvements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
