# Implementation Plan: ACoS Calculator Bug Fixes

**Priority:** High (Task #2 from PRIORITY.txt)
**Date:** 2024-05-22
**Status:** Bugs Identified

## 1. Goal

Address and fix the known bugs reported for the ACoS Calculator:
1.  CSV parsing errors, especially with malformed data.
2.  Discrepancies in real-time performance metrics (potential data synchronization issues).

## 2. Requirements

*   **CSV Parsing Robustness:**
    *   Clearly define the **required** CSV format (headers, data types, order if relevant). Document this for the user (e.g., via tooltip or help text).
    *   Implement parsing logic (likely using Papa Parse) that validates headers and data types row-by-row.
    *   Handle errors gracefully:
        *   Malformed file (e.g., incorrect headers): Reject the file with a clear error message.
        *   Row-level errors (e.g., non-numeric 'Spend', missing required column): Skip the problematic row, log/collect the error details, and continue parsing valid rows.
    *   Provide clear user feedback on parsing outcome:
        *   Success message with number of rows processed.
        *   Error message detailing file-level issues.
        *   Summary of row-level issues (e.g., "Skipped 5 rows due to invalid data. [Show Details/Download Log]").
*   **Real-time Metric Accuracy:**
    *   Identify the root cause of the reported discrepancies in performance metrics.
    *   Ensure that calculations based on input data (manual or CSV) are performed correctly.
    *   Ensure that state updates reliably reflect the calculated metrics in the UI.

## 3. Proposed Solution/Approach

*   **CSV Parsing:**
    1.  **Define Format:** Specify the exact expected CSV headers (e.g., `Campaign Name`, `Spend`, `Sales`, `Orders`, `Clicks`, `Impressions`) and data types (string, number).
    2.  **Refactor Parsing Logic:**
        *   Use Papa Parse's `step` callback for row-by-row processing.
        *   Inside `step`, validate the row object against the expected structure and data types.
        *   Maintain state variables to collect valid data rows and error details (e.g., `skippedRowsInfo`).
        *   Use Papa Parse's `error` callback for file-level parsing errors.
        *   Use `header: true` and potentially `skipEmptyLines: true`.
    3.  **Implement User Feedback:**
        *   Use `shadcn/ui` `Alert` or `Toast` components to display success/error messages after parsing attempt.
        *   Optionally, provide a way to view details of skipped rows (e.g., in a dialog or downloadable text file).
        *   Add a `Tooltip` or `HoverCard` near the CSV upload button explaining the required format.
*   **Metric Discrepancies:**
    1.  **Debugging:** Add logging around data input, state updates, and calculation functions related to the metrics.
    2.  **Code Review:** Carefully review the state management (`useState`, `useEffect`) and calculation logic within `AcosCalculator.tsx` related to the potentially problematic metrics.
    3.  **Refactor (if needed):** Simplify state updates or calculation triggers if they are overly complex or prone to race conditions. Ensure calculations are triggered only when necessary and with the correct data.

## 4. Key Components/Files

*   `src/components/tools/AcosCalculator.tsx` (Modify)
*   CSV parsing utility/hook (if abstracted) (Modify)

## 5. UI/UX Considerations

*   Make CSV error messages clear, concise, and actionable.
*   Ensure metric displays update reliably and feel responsive.

## 6. Data Handling

*   Robust CSV validation and parsing.
*   Reliable state management for calculated metrics.

## 7. Error Handling

*   Specific error handling for different CSV parsing issues (bad headers, bad row data).
*   Logging for debugging metric discrepancies.

## 8. Testing Strategy

*   **CSV:** Create test CSV files: valid, missing headers, incorrect headers, rows with non-numeric data in numeric columns, rows with missing columns, empty file, very large file. Test upload and verify correct handling/feedback for each case.
*   **Metrics:** Manually input data or use valid CSVs and verify that displayed metrics match expected calculations. Test edge cases (e.g., zero spend, zero sales).

## 9. Definition of Done

*   CSV parsing handles malformed data gracefully according to the requirements, with clear user feedback.
*   The root cause of metric discrepancies is identified and fixed.
*   Metrics displayed in the UI are consistently accurate based on the input data.
*   Relevant tests pass.
*   Documentation (`amazon-seller-tools.mdx`) updated to remove bug mentions and potentially add CSV format info.

## 10. Open Questions/Decisions

*   Confirm the exact, mandatory CSV headers and data types.
*   Determine the preferred way to present row-level error details to the user (alert summary, dialog, download log?).