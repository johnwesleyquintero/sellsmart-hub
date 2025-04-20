# Implementation Plan: Product Score Calculation Tool

**Priority:** High (Task #1 from PRIORITY.txt)
**Date:** 2024-05-22
**Status:** Not Started

## 1. Goal

Develop and integrate the "Product Score Calculation" tool, which is currently marked as 'under development and not yet available' in the documentation. This tool should provide users with a quantitative score reflecting the quality and optimization level of an Amazon product listing based on various factors.

## 2. Requirements

- **Input Method:**
  - Initial Version (MVP): Manual input fields for key product listing attributes.
  - Future Enhancements: Consider ASIN input (requires scraping/API) or CSV upload for bulk analysis.
- **Scoring Factors (Initial Proposal - Needs Refinement):**
  - Title: Length, keyword presence (basic check).
  - Bullet Points: Number of points, average length.
  - Description: Length, basic formatting (HTML tags presence), keyword presence.
  - Images: Number of images.
  - Reviews: Average rating, number of reviews.
  - A+ Content: Boolean (Yes/No).
  - Fulfillment: FBA/FBM.
  - _(Decision Needed: Finalize the list of factors and their specific scoring criteria/ranges)._
- **Calculation Logic:**
  - Each factor receives a score (e.g., 0-10).
  - Define weights for each factor.
  - Calculate a final weighted score (e.g., out of 100).
  - _(Decision Needed: Define precise scoring logic and weighting for each factor)._
- **Output/Display:**
  - Display the final overall score prominently (e.g., using a Badge or Progress component).
  - Show a breakdown of scores for individual factors (e.g., using an Accordion or Card).
  - Provide basic, actionable suggestions for improvement based on low-scoring factors.
- **Technology:**
  - React functional component with TypeScript.
  - State management using React Hooks (`useState`, potentially `useReducer` if logic becomes complex).
  - UI components from `shadcn/ui`.

## 3. Proposed Solution/Approach

1.  **Create Component:** Develop a new component `src/components/tools/ProductScoreCalculator.tsx`.
2.  **Define State:** Use `useState` to manage input values for each factor and the calculated scores (individual and final).
3.  **Build UI:**
    - Use `shadcn/ui` `Input`, `Select`, `Checkbox`, `Label` for data entry.
    - Use `Card` to structure the tool.
    - Use `Button` to trigger calculation.
    - Use `Badge` or `Progress` to display the final score.
    - Use `Accordion` or separate `Card` sections for the score breakdown and suggestions.
4.  **Implement Logic:**
    - Create helper functions (potentially in `lib/scoringUtils.ts` or within the component) to calculate the score for each factor based on its input.
    - Implement the final weighted score calculation.
    - Map low scores to predefined suggestion strings.
5.  **Integration:** Add the new tool to the main application navigation/routing and update the main documentation (`amazon-seller-tools.mdx`) upon completion.

## 4. Key Components/Files

- `src/components/tools/ProductScoreCalculator.tsx` (New)
- Potentially `src/lib/scoringUtils.ts` (New)
- Routing/Navigation files (Update)
- `src/app/content/blog/amazon-seller-tools.mdx` (Update upon completion)

## 5. UI/UX Considerations

- Clear separation between input fields, score display, and suggestions.
- Intuitive layout.
- Use tooltips or placeholders to guide users on input formats if necessary.
- Ensure responsiveness.

## 6. Data Handling

- All data managed via component state for the initial manual input version.
- Input validation (e.g., ensure numeric inputs for review count/rating).

## 7. Error Handling

- Basic input validation messages.

## 8. Testing Strategy

- Manual testing of various input combinations to verify scoring logic.
- Component rendering tests.
- Unit tests for scoring functions if separated into utils.

## 9. Definition of Done

- Tool component created and functional.
- Manual input fields accept data for defined factors.
- Score calculation logic implemented based on agreed factors/weights.
- Final score, breakdown, and basic suggestions are displayed.
- Tool integrated into the application.
- Basic tests passed.

## 10. Open Questions/Decisions

- Finalize the list of scoring factors.
- Define the exact scoring scale, logic, and weighting for each factor.
- Confirm manual input as the MVP approach.
