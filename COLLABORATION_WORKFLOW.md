# Collaboration Workflow: Development & Review

**Last Updated:** YYYY-MM-DD _(Update as needed)_

**Purpose:** To define the process for developing, reviewing, validating, and documenting changes for the Amazon Seller Tools Suite, facilitating collaboration between the Developer (you) and the AI Assistant (me).

---

## Workflow Steps:

1.  **Task Selection (Developer):**

    - Identify the next task(s) to work on from `PROJECT_TRACKER.md`, prioritizing High, then Medium priority items.

2.  **Development & Local Testing (Developer):**

    - Implement the feature or fix the bug in the codebase.
    - Perform thorough local testing following the procedures outlined in `workflow.txt`:
      - Run `npm run cq` (Code Quality Checks)
      - Run `npm run build` (Production Build)
      - Run `npm run lint` (Linting)
      - Run `npm run typecheck` (Type Checking)
      - Run `npm run format` (Formatting)
      - Perform manual testing in the browser to ensure functionality.
    - Ensure all checks pass and the feature/fix works as expected locally.

3.  **Update Tracker (Developer):**

    - Mark the completed task(s) as done (`[x]`) in `PROJECT_TRACKER.md`.
    - Update the `Last Updated:` date in `PROJECT_TRACKER.md`.

4.  **Report & Request Review (Developer -> AI):**

    - Notify the AI Assistant about the completed task(s).
    - Provide a brief summary of the changes made (e.g., "Fixed ACoS CSV parsing by adding header validation").
    - Confirm the outcome of local testing (e.g., "All `npm run cq` checks passed, tested with valid/invalid CSVs").
    - _(Optional):_ Share specific code snippets or challenges encountered if seeking detailed feedback.

5.  **Conceptual Review & Validation (AI):**

    - Review the developer's summary against the task requirements in `PROJECT_TRACKER.md`.
    - Assess if the described solution logically addresses the task.
    - Ask clarifying questions if needed.
    - Provide feedback, suggest potential edge cases, or act as a sanity check based _only_ on the provided description (cannot execute code).

6.  **Documentation Update (AI & Developer):**

    - Once the task is deemed complete and conceptually validated:
      - The AI Assistant will draft the necessary updates for the public-facing documentation (`src/app/content/blog/amazon-seller-tools.mdx`). This includes updating statuses, versions, feature lists, and known issues.
      - The Developer will review the drafted documentation update for accuracy against the actual implemented changes.
      - Finalize and commit the documentation changes.

7.  **Iteration:**
    - Repeat the process starting from Step 1 for the next task.

---

**Key Files:**

- `PROJECT_TRACKER.md`: Master list of tasks and their status.
- `workflow.txt`: Defines local testing and quality check procedures.
- `src/app/content/blog/amazon-seller-tools.mdx`: Public-facing documentation to be kept updated.
- `COLLABORATION_WORKFLOW.md` (This file): Describes our working process.

---
