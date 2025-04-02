#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get list of staged files
const getStagedFiles = () => {
  const output = execSync('git diff --cached --name-only').toString();
  return output.split('\n').filter((file) => file.endsWith('.md'));
};

// Update timestamp in markdown file
const updateTimestamp = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const timestamp = new Date().toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });

  // Check if file already has a timestamp section
  const timestampRegex =
    /\n---\n(?:Last Updated|\[\/\/\]: # \(Documentation last updated).*$/s;
  const newTimestamp = `\n---\nLast Updated: ${timestamp}\n`;

  const updatedContent = content.match(timestampRegex)
    ? content.replace(timestampRegex, newTimestamp)
    : content + newTimestamp;

  fs.writeFileSync(filePath, updatedContent, 'utf8');
  execSync(`git add ${filePath}`);
};

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
