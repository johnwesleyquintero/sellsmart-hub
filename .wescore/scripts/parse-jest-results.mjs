/* eslint-env node */
/* global process console */
import fs from 'fs';
import path from 'path';

const resultsFilePath = path.join(process.cwd(), 'jest-results.json');
const reportFilePath = path.join(process.cwd(), 'jest-failure-report.log');

console.log('Parsing Jest results...');

if (!fs.existsSync(resultsFilePath)) {
  console.error(`Error: Jest results file not found at ${resultsFilePath}`);
  fs.writeFileSync(
    reportFilePath,
    `Jest results file not found: ${resultsFilePath}\nDid Jest run correctly and output the JSON file?`,
  );
  process.exit(1);
}

try {
  const rawData = fs.readFileSync(resultsFilePath, 'utf8');
  const results = JSON.parse(rawData);
  const now = new Date();
  const formattedDate =
    now.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }) +
    ', ' +
    now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  let failureReport = `JEST TEST REPORT - ${formattedDate}\n`;
  failureReport += `===========================================\n`;
  failureReport += `TEST SUMMARY\n`;
  failureReport += `===========================================\n`;
  failureReport += `Total Tests:      ${results.numTotalTests}\n`;
  failureReport += `Passed:           ${results.numPassedTests} (${((results.numPassedTests / results.numTotalTests) * 100).toFixed(2)}%)\n`;
  failureReport += `Failed:           ${results.numFailedTests}\n`;
  failureReport += `Skipped:          ${results.numPendingTests}\n`;
  failureReport += `Duration:         ${results.numTotalTestSuites ? (results.testResults.reduce((sum, suite) => sum + (suite.endTime - suite.startTime), 0) / 1000).toFixed(3) : 'NaN'}s\n`;
  failureReport += `===========================================\n\n`;

  let failedCount = 0;

  if (results.numFailedTests > 0 || results.numFailedTestSuites > 0) {
    results.testResults.forEach((testSuite) => {
      if (testSuite.status === 'failed') {
        testSuite.assertionResults.forEach((test) => {
          if (test.status === 'failed') {
            failedCount++;
            failureReport += `✖ FAILED: ${test.ancestorTitles.join(' > ')} > ${test.title}\n`;
            failureReport += `  File:      ${path.relative(process.cwd(), testSuite.name)}\n`;
            failureReport += `  Duration:  ${(testSuite.endTime - testSuite.startTime) / 1000}s (suite)\n\n`;
            failureReport += `  Error Details:\n`;
            test.failureMessages.forEach((message) => {
              const indentedMessage = message
                .split('\n')
                .map((line) => `    ${line}`)
                .join('\n');
              failureReport += `${indentedMessage}\n\n`;
            });
            failureReport += `-------------------------------------------------------------------------------\n\n`;
          }
        });
      }
    });
  }

  if (failedCount === 0 && !results.success) {
    failureReport += `✖ Test Run Failed (No specific test failures reported in assertions)\n`;
    failureReport += `  Check Jest's console output or logs for global errors.\n`;
    if (results.failureMessage) {
      failureReport += `\n  Overall Failure Message:\n`;
      const indentedMessage = results.failureMessage
        .split('\n')
        .map((line) => `    ${line}`)
        .join('\n');
      failureReport += `${indentedMessage}\n`;
    }
    failureReport += `-------------------------------------------------------------------------------\n\n`;
  } else if (failedCount === 0 && results.success) {
    failureReport += `✔ All tests passed!\n`;
  }

  fs.writeFileSync(reportFilePath, failureReport);
  console.log(`Jest failure report generated: ${reportFilePath}`);

  if (failedCount > 0 || !results.success) {
    process.exit(1);
  } else {
    process.exit(0);
  }
} catch (error) {
  console.error('Error parsing Jest results:', error);
  fs.writeFileSync(
    reportFilePath,
    `Error parsing Jest results file: ${resultsFilePath}\n${error.stack}`,
  );
  process.exit(1);
}
