# Workaround: Peer Dependency Conflict (React 19 & next-themes)

**Date Implemented:** 2025-04-13

**Status:** ACTIVE (Temporary)

---

## 1. Issue Description

When attempting to install project dependencies using `pnpm install` after upgrading to `react@^19.1.0`, the installation fails with an `ERESOLVE` error.

**Error Snippet:**

```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE could not resolve ...
npm ERR!
npm ERR! Could not resolve dependency:
npm ERR! peer react@"^16.8 || ^17 || ^18" from next-themes@0.3.0
npm ERR! node_modules/next-themes
npm ERR!   next-themes@"^0.3.0" from the root project
npm ERR!
npm ERR! Conflicting peer dependency: react@18.3.1 (or similar React 19 version)
npm ERR! node_modules/react
npm ERR!   react@"^19.1.0" from the root project
npm ERR!
npm ERR! Fix the upstream dependency conflict, or retry
npm ERR! this command with --force or --legacy-peer-deps
```

**Root Cause:** The version of `next-themes` currently specified in `package.json` (`0.3.0`) declares a peer dependency requirement for React versions `^16.8 || ^17 || ^18`. This is incompatible with the project's use of `react@^19.1.0`.

## 2. Implemented Workaround

To allow development to proceed despite this incompatibility, the following command is being used to install dependencies:

```bash
pnpm install --legacy-peer-deps
```

**Explanation:** The `--legacy-peer-deps` flag instructs pnpm (and npm) to ignore peer dependency conflicts during installation, reverting to an older behavior where these conflicts did not automatically fail the install process.

## 3. Risks and Implications

Using `--legacy-peer-deps` is not the ideal long-term solution and carries risks:

*   Potential Instability: `next-themes@0.3.0` was not designed or tested for React 19. Using it may lead to unexpected runtime errors, subtle bugs, or incorrect behavior related to theme switching or context usage.
*   Hidden Bugs: Issues caused by this incompatibility might not be immediately obvious and could surface later during development or in production.
*   Technical Debt: This workaround introduces technical debt. We are knowingly using potentially incompatible package versions.
*   Masking the Problem: It hides the underlying version mismatch rather than resolving it correctly.

## 4. Long-Term Solution

The correct and sustainable solution is to resolve the peer dependency conflict directly:

1.  **Update next-themes:** Upgrade next-themes to a version that officially supports React 19. This can typically be done via:

    ```bash
    pnpm up next-themes
    # or
    pnpm add next-themes@latest
    ```
2.  **Remove Workaround:** Once next-themes is updated, remove the need for the `--legacy-peer-deps` flag and perform a clean install:

    ```bash
    # (Optional but recommended: rm -rf node_modules pnpm-lock.yaml)
    pnpm install
    ```

## 5. Action Plan & Tracking

This workaround should be removed as soon as next-themes is updated to a compatible version.

1.  Create a new task in `TODO.md` specifically for updating next-themes and removing this workaround. Assign it an appropriate priority (likely High). Example:

    ```markdown
    *   [ ] **ID XX (Deps / High):** Update `next-themes` to support React 19 and remove `--legacy-peer-deps` workaround. *Resolve peer dependency conflict documented in WORKAROUND.md*
    ```
2.  Reference this `WORKAROUND.md` file in the new `TODO.md` task.


---

# Workaround: CI Jobs Failing Due to Billing Issue

**Date Implemented:** [INSERT DATE - e.g., 2024-08-01]

**Status:** ACTIVE (Temporary)

---

## 1. Issue Description
Continuous Integration (CI) jobs, likely running on GitHub Actions, are not being initiated or executed.

Error Message Encountered:

"The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings."

Root Cause: There is an active billing problem associated with the GitHub account hosting the repository. This could be due to failed payments, expired payment methods, or exceeding a configured spending limit for GitHub Actions minutes/storage.

## 2. Implemented Workaround
Currently, there is no direct technical workaround within the codebase. Development and merging of pull requests may proceed without the automated checks, builds, and tests usually performed by the CI pipeline.

Explanation: The CI system itself is blocked at the account/billing level, preventing jobs from running. Manual checks and testing by developers before merging become critically important.

## 3. Risks and Implications
Operating without automated CI checks introduces significant risks:

*   Reduced Code Quality: Linting errors, formatting inconsistencies, or type errors might be missed and merged into the main branch.
*   Increased Bug Potential: Automated tests (unit, integration, E2E) are not running, increasing the likelihood of regressions or new bugs being introduced.
*   Inconsistent Builds: Automated build processes are not verified, potentially leading to issues during manual deployment.
*   Slower Feedback Loop: Developers do not get immediate feedback on the impact of their changes from the CI system.
*   Violation of Standards: May bypass quality gates defined in CONTRIBUTING.md or .rules.md that rely on CI checks passing.

## 4. Long-Term Solution
The only effective solution is to resolve the underlying billing issue with the CI provider (GitHub):

*   Access Billing Settings: Navigate to the GitHub account's "Billing & plans" section.
*   Identify & Fix Problem: Determine the specific cause (failed payment, spending limit reached, expired card) and rectify it. This may involve updating payment information or increasing the spending limit for Actions.
*   Verify CI Resumption: After resolving the billing issue, trigger a CI run (e.g., by pushing a commit or manually re-running a workflow) to confirm that jobs are starting and executing correctly.

## 5. Action Plan & Tracking
This situation requires immediate attention at the account level.

Notify Account Owner: Ensure the owner of the GitHub account/organization is aware of the billing issue and the blocked CI jobs.

Track Resolution: Create a high-priority task in TODO.md to track the resolution of the billing issue. Example:

```markdown
*   [ ] **ID XX (Infra / Critical):** BLOCKER: Resolve GitHub Actions billing issue preventing CI jobs from running. *See WORKAROUND.md for details.*
```
Reference this section of WORKAROUND.md in the TODO.md task.

This document should be updated once the billing issue is resolved and CI is functional again.

This document should be removed or updated once the underlying issue is resolved.