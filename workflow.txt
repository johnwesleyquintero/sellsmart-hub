=========================================
TEST WORKFLOW
=========================================

Analyze the following Jest test report, identifying root causes for failures and suggesting specific code fixes. Focus on component rendering, data processing, and integration issues. Provide actionable insights for improving test coverage and stability.

Test Report Input:
@/jest-failure-report.log / User Chat Input

Desired Output:

A structured analysis of the test report, including:

1. Categorization of Failures:

   - Task: Group failures by component, integration, or utility function.
   - Implementation:
     - Parse the test report to identify and categorize each failure.
     - Use tags or labels to classify failures based on their type (e.g., rendering issue, data processing error, integration failure).

2. Root Cause Analysis:

   - Task: Identify the underlying reasons for each failure, referencing specific error messages and code snippets.
   - Implementation:
     - Examine the error messages and stack traces in the test report.
     - Cross-reference the test report with the relevant codebase to pinpoint the source of errors.
     - Document the root cause for each failure, including code snippets and explanations.

3. Suggested Code Fixes:

   - Task: Provide concrete code changes to address the identified root causes.
   - Implementation:
     - Propose specific code changes or refactors that resolve the identified issues.
     - Include code snippets or pseudocode to illustrate the suggested fixes.
     - Ensure the fixes align with best practices and coding standards.

4. Test Coverage Improvements:

   - Task: Suggest new tests or modifications to existing tests to improve coverage and prevent future regressions.
   - Implementation:
     - Identify gaps in the current test coverage based on the failures and root cause analysis.
     - Propose additional test cases or modifications to existing tests to cover these gaps.
     - Ensure the suggested tests are comprehensive and cover edge cases.

5. Performance Considerations:

   - Task: Note any tests with unusually long durations and suggest potential optimizations.
   - Implementation:
     - Identify tests that take significantly longer to execute than others.
     - Analyze the performance bottlenecks in these tests.
     - Suggest optimizations such as reducing test scope, improving data handling, or parallelizing test execution.

6. Prioritization:

   - Task: Rank the failures by severity and impact, guiding developers on which issues to address first.
   - Implementation:
     - Assess the impact of each failure on the overall system stability and user experience.
     - Prioritize failures that have a high impact on critical functionality or user-facing features.
     - Create a ranked list of failures with clear justifications for the prioritization.

7. Specific Questions:

   - Task: Pose targeted questions to the development team to clarify ambiguous error messages or gather additional context.
   - Implementation:
     - Identify any ambiguous or unclear error messages in the test report.
     - Formulate specific questions to seek clarification from the development team.
     - Document these questions to facilitate further investigation and resolution.

8. Environment Details:

   - Task: Assume a React/Next.js environment with Jest and Testing Library for testing.
   - Implementation:
     - Ensure all analyses and suggestions are tailored to the React/Next.js environment.
     - Consider the specific configurations and dependencies of the project when proposing fixes and improvements.

9. Resolve and Fix Issues:
   - Task: Implement the suggested code fixes and test coverage improvements.
   - Implementation:
     - Apply the proposed code changes to the codebase.
     - Run the updated tests to verify that the issues are resolved.
     - Ensure that the fixes do not introduce new issues or regressions.
     - Update the test suite with any new or modified tests as suggested.
     - Document the changes made and the outcomes of the tests.

=========================================
ISSUES/ERROR WORKFLOW
=========================================

Analyze the following issues/error report, identifying root causes for failures and suggesting specific code fixes. Focus on component rendering, data processing, and integration issues. Provide actionable insights for improving test coverage and stability.

Issue/Error Report Input:
@/issues.txt @/quality-check.log / User Chat Input

Desired Output:

A structured analysis of the issues report, including:

1. Categorization of Failures:

   - Task: Group failures by component, integration, or utility function.
   - Implementation:
     - Parse the issues report to identify and categorize each failure.
     - Use tags or labels to classify failures based on their type (e.g., rendering issue, data processing error, integration failure).

2. Root Cause Analysis:

   - Task: Identify the underlying reasons for each failure, referencing specific error messages and code snippets.
   - Implementation:
     - Examine the error messages and stack traces in the issues report.
     - Cross-reference the issues report with the relevant codebase to pinpoint the source of errors.
     - Document the root cause for each failure, including code snippets and explanations.

3. Suggested Code Fixes:

   - Task: Provide concrete code changes to address the identified root causes.
   - Implementation:
     - Propose specific code changes or refactors that resolve the identified issues.
     - Include code snippets or pseudocode to illustrate the suggested fixes.
     - Ensure the fixes align with best practices and coding standards.

4. Test Coverage Improvements:

   - Task: Suggest new tests or modifications to existing tests to improve coverage and prevent future regressions.
   - Implementation:
     - Identify gaps in the current test coverage based on the failures and root cause analysis.
     - Propose additional test cases or modifications to existing tests to cover these gaps.
     - Ensure the suggested tests are comprehensive and cover edge cases.

5. Performance Considerations:

   - Task: Note any tests with unusually long durations and suggest potential optimizations.
   - Implementation:
     - Identify tests that take significantly longer to execute than others.
     - Analyze the performance bottlenecks in these tests.
     - Suggest optimizations such as reducing test scope, improving data handling, or parallelizing test execution.

6. Prioritization:

   - Task: Rank the failures by severity and impact, guiding developers on which issues to address first.
   - Implementation:
     - Assess the impact of each failure on the overall system stability and user experience.
     - Prioritize failures that have a high impact on critical functionality or user-facing features.
     - Create a ranked list of failures with clear justifications for the prioritization.

7. Specific Questions:

   - Task: Pose targeted questions to the development team to clarify ambiguous error messages or gather additional context.
   - Implementation:
     - Identify any ambiguous or unclear error messages in the issues report.
     - Formulate specific questions to seek clarification from the development team.
     - Document these questions to facilitate further investigation and resolution.

8. Environment Details:

   - Task: Assume a React/Next.js environment with Jest and Testing Library for testing.
   - Implementation:
     - Ensure all analyses and suggestions are tailored to the React/Next.js environment.
     - Consider the specific configurations and dependencies of the project when proposing fixes and improvements.

9. Resolve and Fix Issues:
   - Task: Implement the suggested code fixes and test coverage improvements.
   - Implementation:
     - Apply the proposed code changes to the codebase.
     - Run the updated tests to verify that the issues are resolved.
     - Ensure that the fixes do not introduce new issues or regressions.
     - Update the test suite with any new or modified tests as suggested.
     - Document the changes made and the outcomes of the tests.
