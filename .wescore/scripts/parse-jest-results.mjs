/* eslint-env node */
/* global process console */
import fs from 'fs';
import path from 'path';
import {
  ISSUE_CATEGORIES,
  issueLogger,
} from '../src/reporting/error-logger.mjs';

const resultsFilePath = path.join(process.cwd(), 'jest-results.json');
const reportFilePath = path.join(process.cwd(), 'jest-failure-report.log');

console.log('Parsing Jest results...');

// Helper function to format error messages
function formatErrorMessage(message) {
  if (!message) return '';
  // Clean up Jest's error stack format
  return message
    .replace(/^\s*at.*?:\d+:\d+\)?$/gm, '') // Remove stack trace lines
    .replace(/\n\s*\n/g, '\n') // Remove extra newlines
    .trim();
}

// Helper to format duration
function formatDuration(ms) {
  if (typeof ms !== 'number' || isNaN(ms)) return 'N/A';
  return `${(ms / 1000).toFixed(3)}s`;
}

if (!fs.existsSync(resultsFilePath)) {
  const errorMsg = `Jest results file not found: ${resultsFilePath}`;
  issueLogger.logInternalError(new Error(errorMsg), {
    category: ISSUE_CATEGORIES.FILESYSTEM,
    context: { action: 'parse-jest-results' },
  });
  fs.writeFileSync(
    reportFilePath,
    `${errorMsg}\nDid Jest run correctly and output the JSON file?`,
  );
  process.exit(1);
}

try {
  const rawData = fs.readFileSync(resultsFilePath, 'utf8');
  const results = JSON.parse(rawData);
  const now = new Date();

  // Format date for report header
  const formattedDate = now.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  // Calculate statistics
  const totalDuration = results.testResults.reduce(
    (sum, suite) => sum + (suite.endTime - suite.startTime),
    0,
  );
  const passRate = results.numTotalTests
    ? ((results.numPassedTests / results.numTotalTests) * 100).toFixed(2)
    : '0.00';

  // Generate report header
  let failureReport = [
    `JEST TEST REPORT - ${formattedDate}`,
    '='.repeat(50),
    'TEST SUMMARY',
    '='.repeat(50),
    `Total Test Suites:  ${results.numTotalTestSuites}`,
    `Total Tests:        ${results.numTotalTests}`,
    `Passed:             ${results.numPassedTests} (${passRate}%)`,
    `Failed:             ${results.numFailedTests}`,
    `Skipped:            ${results.numPendingTests}`,
    `Duration:           ${formatDuration(totalDuration)}`,
    '='.repeat(50),
    '',
  ].join('\n');

  let failedCount = 0;
  let hasTestSuiteErrors = false;

  // Process test suite results
  if (results.numFailedTests > 0 || results.numFailedTestSuites > 0) {
    results.testResults.forEach((testSuite) => {
      // Handle suite-level errors first
      if (testSuite.testExecError) {
        hasTestSuiteErrors = true;
        failureReport += [
          `❌ TEST SUITE ERROR: ${path.relative(process.cwd(), testSuite.name)}`,
          `Duration: ${formatDuration(testSuite.endTime - testSuite.startTime)}`,
          'Error:',
          formatErrorMessage(testSuite.testExecError.message),
          '-'.repeat(50),
          '',
        ].join('\n');
      }

      // Process individual test failures
      if (testSuite.status === 'failed') {
        testSuite.assertionResults.forEach((test) => {
          if (test.status === 'failed') {
            failedCount++;
            const relativePath = path.relative(process.cwd(), testSuite.name);
            failureReport += [
              `❌ FAILED: ${test.ancestorTitles.join(' → ')} → ${test.title}`,
              `File:     ${relativePath}`,
              `Duration: ${formatDuration(testSuite.endTime - testSuite.startTime)}`,
              '',
              'Error Details:',
              test.failureMessages
                .map((msg) => formatErrorMessage(msg))
                .map((msg) =>
                  msg
                    .split('\n')
                    .map((line) => `    ${line}`)
                    .join('\n'),
                )
                .join('\n\n'),
              '-'.repeat(50),
              '',
            ].join('\n');

            // Log each test failure to the issue logger
            issueLogger.logInternalError(new Error(test.failureMessages[0]), {
              category: ISSUE_CATEGORIES.VALIDATION,
              context: {
                testName: `${test.ancestorTitles.join(' → ')} → ${test.title}`,
                file: relativePath,
                type: 'test-failure',
              },
            });
          }
        });
      }
    });
  }

  // Handle edge cases and summary
  if (failedCount === 0 && !results.success) {
    const generalError = [
      `❌ Test Run Failed (No specific test failures found)`,
      `Check Jest's console output or logs for global errors.`,
      results.failureMessage
        ? '\nOverall Failure Message:\n' +
          formatErrorMessage(results.failureMessage)
            .split('\n')
            .map((line) => `    ${line}`)
            .join('\n')
        : '',
      '-'.repeat(50),
      '',
    ].join('\n');

    failureReport += generalError;
    issueLogger.logInternalError(
      new Error(results.failureMessage || 'Unknown test failure'),
      {
        category: ISSUE_CATEGORIES.VALIDATION,
        context: { type: 'test-run-failure' },
      },
    );
  } else if (failedCount === 0 && results.success) {
    failureReport += `✅ All tests passed!\n`;
  }

  // Add summary footer for failed tests
  if (failedCount > 0 || hasTestSuiteErrors) {
    failureReport += [
      '='.repeat(50),
      `FAILURE SUMMARY`,
      `Total Failed Tests: ${failedCount}`,
      `Suite-Level Errors: ${hasTestSuiteErrors ? 'Yes' : 'No'}`,
      'Review the detailed error messages above for more information.',
      '='.repeat(50),
      '',
    ].join('\n');
  }

  fs.writeFileSync(reportFilePath, failureReport);
  console.log(`Jest failure report generated: ${reportFilePath}`);

  if (failedCount > 0 || !results.success) {
    process.exit(1);
  } else {
    process.exit(0);
  }
} catch (error) {
  const errorMsg = `Error parsing Jest results: ${error.message}`;
  console.error(errorMsg);

  issueLogger.logInternalError(error, {
    category: ISSUE_CATEGORIES.INTERNAL,
    context: {
      action: 'parse-jest-results',
      file: resultsFilePath,
    },
  });

  fs.writeFileSync(
    reportFilePath,
    `${errorMsg}\n\nStack Trace:\n${error.stack}`,
  );
  process.exit(1);
}
