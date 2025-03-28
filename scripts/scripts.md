# Custom Scripts Documentation

## Overview
This document describes the custom scripts used in this project, their purposes, and how to use them.

## Scripts
- `cleanup.js`: Performs cleanup operations (more details below)
- `seo-validator.js`: Validates SEO requirements in page files
- `component-template-generator.js`: Generates new UI components with test templates

## Usage

### Automation Scripts
```bash
pnpm run generate:component [name] # Create new UI component
pnpm run validate:seo # Check SEO requirements
pnpm run clean # Standard cleanup
pnpm run clean:all # Full cleanup (including temporary files)
```

## Parameters
- `--dry-run`: Preview cleanup actions without deletion
- `--verbose`: Show detailed deletion logs

## Error Handling
- Missing directories will be logged as warnings
- File permission errors will stop execution and return exit code 1
- Use `NODE_ENV=development` for extended error details

## Best Practices
1. Run cleanup before deployments
2. Add `--dry-run` flag for first-time use
3. Commit working changes before destructive operations
