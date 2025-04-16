#!/usr/bin/env node

const { getStagedFiles, updateTimestamp } = require('../src/git/index.js');

// Main execution
try {
  const stagedFiles = getStagedFiles();
  stagedFiles.forEach((file) => {
    if (file) {
      const fullPath = path.join(process.cwd(), file);
      updateTimestamp(fullPath);
    }
  });
} catch (error) {
  console.error('Error updating markdown timestamps:', error);
  process.exit(1);
}
