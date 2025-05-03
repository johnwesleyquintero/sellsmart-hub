# Workflow Definitions & Project Context

This document outlines standardized workflows for common development tasks (like analysis and enhancement) and provides relevant project context.

- **Update** the `@/src/app/content/blog/project-tracker.mdx` for every latest changes you have completed. **DO NOT REMOVE ANYTHING FROM THIS FILE.**

- **Implement** all pending tasks and recommendations detailed in `@/src/app/content/blog/project-tracker.mdx`, prioritizing tasks based on impact and urgency as determined by the document's prioritization scheme. Ensure thorough testing and validation after each implementation to confirm functionality and prevent regressions. **DO NOT REMOVE ANYTHING FROM THIS FILE.**

## Workflow 1: Enhance Application Without Introducing New Errors

**Objective:**
Analyze the application to identify areas for improvement that enhance functionality, performance, or user experience without introducing new errors or issues.

**Instructions:**

1.  **Review and Understand:**

    - Thoroughly review the application's current state, including its architecture, features, and user interface.
    - Understand the existing functionality and user workflows.

2.  **Identify Improvements:**

    - Suggest enhancements that improve efficiency, usability, or performance.
    - Focus on changes that maintain the application's stability and do not alter its core functionality.

3.  **Maintain Stability:**

    - Ensure that all proposed changes are backward-compatible and do not disrupt current user experiences.
    - Prioritize improvements that offer clear benefits without adding complexity or risk.

4.  **Document Recommendations:**

    - Provide a detailed list of recommended improvements.
    - Include explanations for each suggestion, highlighting the benefits and potential impact on the application.

5.  **Verify Changes:**

    - Outline a plan for testing the proposed changes to ensure they do not introduce new errors.
    - Suggest automated tests or manual checks to validate the improvements.

6.  **Consider User Feedback:**

    - Review any available user feedback or analytics to identify pain points or areas where users have requested improvements.
    - Prioritize changes that address common user concerns or enhance frequently used features.

7.  **Performance Optimization:**

    - Analyze the application for performance bottlenecks and suggest optimizations.
    - Ensure that any performance improvements do not compromise the application's stability or functionality.

8.  **Security and Compliance:**
    - Review the application for potential security vulnerabilities or compliance issues.
    - Suggest improvements that enhance security without affecting usability.

**Output:**

- A list of actionable recommendations for improving the application.
- Clear explanations of the benefits and impact of each suggested change.
- A plan for verifying the improvements to ensure stability and performance.

---

## Workflow 2: Troubleshooting & Analysis (Tests/Issues/Errors)

**Objective:**
Analyze test reports, error logs, or reported issues to identify root causes, suggest fixes, and improve overall stability and test coverage. Focus on component rendering, data processing, and integration problems.

**Test Directory:**

- `@/src/__tests__`
- `@/src/__mocks__`

**Input:**

- Jest Test and Quality Check Report (Main Error Log) (`@/project-cli.error.log`)
- Quality Check Log (Optional) (`@/quality-check-report.log`)
- User-reported issues or other error descriptions.

**Desired Output:**
A structured analysis report including:

1.  Categorization of Failures:

    - Task: Group failures by component, integration, or utility function.
    - Implementation:
      - Parse the test report to identify and categorize each failure.
      - Use tags or labels to classify failures based on their type (e.g., rendering issue, data processing error, integration failure).

2.  Root Cause Analysis:

    - Task: Identify the underlying reasons for each failure, referencing specific error messages and code snippets.
    - Implementation:
      - Examine the error messages and stack traces in the test report.
      - Cross-reference the test report with the relevant codebase to pinpoint the source of errors.
      - Document the root cause for each failure, including code snippets and explanations.

3.  Suggested Code Fixes:

    - Task: Provide concrete code changes to address the identified root causes.
    - Implementation:
      - Propose specific code changes or refactors that resolve the identified issues.
      - Include code snippets or pseudocode to illustrate the suggested fixes.
      - Ensure the fixes align with best practices and coding standards.

4.  Test Coverage Improvements:

    - Task: Suggest new tests or modifications to existing tests to improve coverage and prevent future regressions.
    - Implementation:
      - Identify gaps in the current test coverage based on the failures and root cause analysis.
      - Propose additional test cases or modifications to existing tests to cover these gaps.
      - Ensure the suggested tests are comprehensive and cover edge cases.

5.  Performance Considerations:

    - Task: Note any tests with unusually long durations and suggest potential optimizations.
    - Implementation:
      - Identify tests that take significantly longer to execute than others.
      - Analyze the performance bottlenecks in these tests.
      - Suggest optimizations such as reducing test scope, improving data handling, or parallelizing test execution.

6.  Prioritization:

    - Task: Rank the failures by severity and impact, guiding developers on which issues to address first.
    - Implementation:
      - Assess the impact of each failure on the overall system stability and user experience.
      - Prioritize failures that have a high impact on critical functionality or user-facing features.
      - Create a ranked list of failures with clear justifications for the prioritization.

7.  Specific Questions:

    - Task: Pose targeted questions to the development team to clarify ambiguous error messages or gather additional context.
    - Implementation:
      - Identify any ambiguous or unclear error messages in the test report.
      - Formulate specific questions to seek clarification from the development team.
      - Document these questions to facilitate further investigation and resolution.

8.  Environment Details:

    - Task: Assume a React/Next.js environment with Jest and Testing Library for testing.
    - Implementation:
      - Ensure all analyses and suggestions are tailored to the React/Next.js environment.
      - Consider the specific configurations and dependencies of the project when proposing fixes and improvements.

9.  Resolve and Fix Issues:
    - Task: Implement the suggested code fixes and test coverage improvements.
    - Implementation:
      - Apply the proposed code changes to the codebase.
      - Run the updated tests to verify that the issues are resolved.
      - Ensure that the fixes do not introduce new issues or regressions.
      - Update the test suite with any new or modified tests as suggested.
      - Document the changes made and the outcomes of the tests.

---

## Workflow 3: Codebase Scan and Update Project Tracker and Amazon Seller Tools Doc Blogs

**Objective:**
Scan the codebase to identify issues, optimize performance, and update the `project-tracker.mdx` and `amazon-seller-tools.mdx` file with detailed findings and actionable recommendations. This workflow should be executed regularly to ensure the project remains up-to-date and optimized.

**Document Directory:**

- `@/src/app/content/blog/project-tracker.mdx`
- `@/src/app/content/blog/amazon-seller-tools.mdx`

**Instructions:**

1. **Initial Scan:**

   - Perform an initial scan of the entire codebase.
   - Identify potential issues, outdated dependencies, and areas for optimization.
   - Flag potential issues and suggest areas for further investigation.

2. **Review and Analyze:**

   - Review `project-tracker.mdx` and `amazon-seller-tools.mdx` for existing errors, warnings, and pending tasks.
   - Identify root causes of issues and prioritize tasks based on severity and impact.
   - Categorize and prioritize issues, providing insights and suggestions for resolution.

3. **Dependency Check:**

   - Review all dependencies, including version numbers, and evaluate their impact.
   - Suggest updates and identify potential conflicts or vulnerabilities.

4. **Security Audit:**

   - Conduct a security audit to identify vulnerabilities.
   - Highlight potential security risks and suggest mitigation strategies.

5. **Performance Optimization:**

   - Analyze the codebase for performance bottlenecks.
   - Identify performance issues and suggest optimizations.

6. **Documentation Update:**

   - Update `project-tracker.mdx` and `amazon-seller-tools.mdx` to reflect the current state of the codebase.
   - Ensure the documentation includes:
     - New features with clear explanations.
     - Resolved issues with summaries.
     - Known bugs, including severity and workarounds.
     - Updated usage instructions and configuration changes.
     - Performance considerations and optimization suggestions.
   - Automatically generate documentation drafts and suggest improvements.

7. **Continuous Monitoring:**

   - Set up automated scans and alerts for ongoing codebase monitoring.
   - Provide regular updates and alerts on potential issues.

8. **Review and Feedback:**
   - Summarize feedback and suggest further improvements based on team reviews.

**Output:**

- A comprehensive update to `project-tracker.mdx` and `amazon-seller-tools.mdx` with detailed findings, actionable recommendations, and optimizations.
- A final report summarizing the changes made and any remaining issues.

---

## Project Context

Name: portfolio
Description: A portfolio website built with Next.js and TypeScript.
Version: 0.1.0
Node.js Version: 18.18.0
NPM Version: 9.0.0
