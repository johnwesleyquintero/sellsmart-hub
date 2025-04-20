# Amazon Seller Tools - Project Tracker & TODO List

**Last Updated:** 2025-04-20 _(Please update this date when you make changes)_
**Last Code Review:** 2025-04-20 _(Please update this date when you make changes)_

**Instructions:** Mark items as complete by changing `[ ]` to `[x]`. Add notes or sub-tasks as needed.

---

## HIGH PRIORITY (Implement/Fix ASAP)

### 1. Implement Missing Core Tools

- **[x] Product Score Calculation Tool** (Complete, Manual Input Only)
  - [x] Design core logic and scoring algorithm
  - [x] Develop backend/calculation functions (if applicable)
  - [x] Build frontend UI component
  - [x] Integrate UI with logic
  - [x] Write unit/integration tests
  - [x] Document usage/features
  - _Ref: IMPLEMENTATION_ProductScoreCalc.md_
- **[x] Optimal Price Calculation Tool** (Basic Version Available)
  - [x] Define inputs (costs, competitor data, market data)
  - [x] Design pricing algorithm/model
  - [x] Develop backend/calculation functions (if applicable)
  - [x] Build frontend UI component
  - [x] Integrate UI with logic
  - [ ] Write unit/integration tests
  - [ ] Document usage/features
  - _Ref: IMPLEMENTATION_OptimalPriceCalc.md_

### 2. Fix ACoS Calculator Bugs

- **[x] Fix CSV Parsing Errors**
  - [ ] Implement robust validation for expected columns/data types
  - [ ] Add specific error handling for malformed rows/data
  - [ ] Provide clear user feedback on parsing errors (e.g., highlight bad rows/cells)
  - [ ] Test with various valid and invalid CSV files
  - _Ref: IMPLEMENTATION_AcosCalcFix.md_
- **[x] Resolve Real-time Metric Discrepancies**
  - [ ] Investigate data fetching/synchronization logic
  - [ ] Identify source of potential delays or inconsistencies
  - [ ] Implement fix (e.g., improve state management, optimize data flow)
  - [ ] Test real-time updates under various conditions
  - _Ref: IMPLEMENTATION_AcosCalcFix.md_

### 3. Resolve PPC Campaign Auditor Status & Stability

- **[ ] Clarify Official Status**
  - [ ] Decide: Is it Beta v0.9.0 or ready for Active v2.0.0? (Update documentation accordingly)
- **[ ] Stabilize for Production Release (if needed)**
  - [ ] Identify and fix any remaining critical bugs
  - [ ] Perform thorough testing with diverse campaign data
  - [ ] Refactor code for stability/performance if required
  - [ ] Ensure all documented features work reliably
  - _Ref: IMPLEMENTATION_PpcAuditorStabilization.md_

---

## MEDIUM PRIORITY (Important Enhancements & Validation)

### 4. Enhance ACoS Calculator Robustness & Clarity

- **[ ] Improve CSV Format Handling**
  - [ ] Allow for minor variations (e.g., column order if feasible) OR
  - [ ] Provide very clear documentation/template for the _exact_ required format
  - [ ] Improve error messages related to format issues
- **[ ] Refine Predictive Analysis**
  - [ ] Review current prediction algorithm/logic
  - [ ] Test accuracy with historical data
  - [ ] Document factors influencing prediction quality and limitations
  - [ ] Consider adding confidence intervals or explanations
- **[ ] Improve Low-Spend Campaign Handling**
  - [ ] Investigate how calculations/predictions behave with low spend/impression data
  - [ ] Implement specific logic or add notes/warnings for low-data scenarios

### 5. Validate and Refine AI/Smart Features

- **[ ] Listing Quality Checker AI Features**
  - [ ] Define objective criteria for "good" optimization (Title, Desc, Bullets)
  - [ ] Test AI suggestions against criteria and real-world examples
  - [ ] Refine prompts/models based on testing results
  - [ ] Validate SEO recommendations
- **[ ] Description Editor AI Features**
  - [ ] Test AI SEO optimization effectiveness
  - [ ] Validate automated score calculation logic
  - [ ] Refine prompts/models based on testing results
- **[ ] Keyword Deduplicator AI Features**
  - [ ] Test accuracy of AI duplicate detection (vs. simple string matching)
  - [ ] Evaluate usefulness/relevance of smart suggestions
  - [ ] Refine prompts/models based on testing results

---

## LOW PRIORITY (Maintenance & Documentation)

### 6. Documentation Update

- **[ ] Update `amazon-seller-tools.mdx`**
  - [ ] Reflect completed tasks from High/Medium priorities (update statuses, versions, remove fixed bugs from known issues)
  - [ ] Add details for newly implemented tools
  - [ ] Ensure consistency between table and detailed descriptions
  - _(Note: This should be done periodically after significant changes)_

### 7. Code Review & Refactoring

- **[ ] Conduct Ongoing Code Reviews**
  - [ ] Review major feature implementations/bug fixes
  - [ ] Check for adherence to React/TypeScript best practices
  - [ ] Ensure consistent use of UI libraries (shadcn/ui)
- **[ ] Perform Refactoring as Needed**
  - [ ] Address identified code smells or areas for improvement
  - [ ] Optimize components for performance/maintainability

---
