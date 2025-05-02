# Project Development Rules & Guidelines

**Last Updated:** 2024-07-26

This document outlines the essential rules and guidelines for developing the Amazon Seller Tools project. Adhering to these rules ensures code quality, consistency, maintainability, and effective collaboration.

## 1. Technology Stack & Versions

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (Strict Mode Enabled)
- **UI Library:** shadcn/ui built upon React 18 and Tailwind CSS
- **Styling:** Tailwind CSS (Utility-first approach)
- **Content:** MDX for blog posts and potentially documentation
- **Icons:** Lucide React
- **State Management:** React Context API, Zustand (or specify if another library is used/preferred)
- **Data Fetching:** React Server Components, Server Actions, SWR/React Query (specify preferred client-side method if any)
- **Database:** MongoDB (via Mongoose or preferred ODM)
- **Key-Value Store:** Upstash Redis (for Rate Limiting, Caching, etc.)
- **Deployment:** Vercel

**Rule:** Use the established technology stack. Propose and discuss any new core dependencies with the team before integration. Ensure compatibility with Next.js 14 and React 18 features (Server Components, Actions, etc.).

## 2. Code Quality & Style

- **Formatting:** All code _must_ be formatted using Prettier before committing. Run `npm run format`.
- **Linting:** All code _must_ pass ESLint checks before committing. Run `npm run lint`. Address all errors and critical warnings.
- **Type Safety:**
  - Write strongly-typed TypeScript code. Avoid `any` wherever possible; use specific types or `unknown`.
  - Address all type errors reported by `npm run typecheck`.
  - Mark component props as `readonly` where applicable (see `project-tracker.mdx` for examples).
- **Code Smells:** Regularly check for code smells using `npm run lint:smells` and address identified issues.
- **Quality Checks:** Before creating a Pull Request, run the full quality suite: `npm run cq`. Address all reported issues.
- **Naming Conventions:** Follow standard TypeScript/React naming conventions (e.g., `PascalCase` for components and types, `camelCase` for variables and functions).
- **Simplicity & Readability:** Write clear, concise, and well-commented code, especially for complex logic.

**Rule:** Code must pass all formatting, linting, type-checking, and code smell checks before being merged. Prioritize fixing issues identified in the `project-tracker.mdx` under "Current Linting Issues" and "Code Quality".

## 3. Development Workflow

- **Branching:**
  - Create branches from the `main` branch.
  - Use descriptive branch names, prefixed appropriately (e.g., `feature/add-tool-xyz`, `fix/resolve-bug-123`, `chore/update-deps`).
- **Commits:**
  - Write clear, concise commit messages explaining the _what_ and _why_ of the change. Consider using Conventional Commits format for consistency.
  - Commit small, logical units of work.
- **Pull Requests (PRs):**
  - Create PRs targeting the `main` branch.
  - Link PRs to relevant issues or tasks in `project-tracker.mdx`.
  - Ensure all automated checks (CI/CD, Vercel deployments) pass.
  - Require at least one code review approval before merging (if applicable to team structure).
  - Clearly describe the changes made in the PR description.

**Rule:** Follow the defined branching, commit, and PR process to maintain a clean and understandable project history.

## 4. Testing

- **Framework:** [Specify Testing Framework - e.g., Jest, React Testing Library, Playwright/Cypress]. The `npm run test` script executes these tests.
- **Unit Tests:** Write unit tests for critical functions, utilities, algorithms (e.g., calculation logic, data transformations), and complex components.
- **Integration Tests:** Add integration tests for key user workflows and interactions between components/modules.
- **End-to-End (E2E) Tests:** [Optional but Recommended] Implement E2E tests for critical user paths (e.g., submitting a form, navigating between tools).
- **Test Coverage:** Aim for reasonable test coverage, focusing on critical and complex parts of the application. [Optional: Specify a target percentage if desired].

**Rule:** All tests _must_ pass (`npm run test`) before merging code. New features should include corresponding tests. Bug fixes should ideally include regression tests.

## 5. Dependency Management

- **Adding Dependencies:** Discuss the need for new dependencies with the team. Prefer well-maintained and reputable libraries.
- **Updating Dependencies:** Regularly review and update dependencies to patch security vulnerabilities and benefit from improvements. Coordinate updates to avoid conflicts (e.g., the `@upstash/redis` and `@upstash/ratelimit` version alignment mentioned in the tracker).
- **Unused Dependencies:** Periodically check for and remove unused dependencies.

**Rule:** Manage dependencies carefully. Document the reason for adding significant new dependencies. Ensure updates are tested thoroughly.

## 6. API Usage & Integration

- **External APIs:**
  - Do not add integrations with new external APIs without team discussion and approval.
  - Document the purpose, authentication method, and error handling patterns for each integrated external API.
  - Prioritize using official and stable API endpoints.
- **Internal APIs:** Follow established patterns for creating and consuming internal API routes (Next.js API Routes or Server Actions).
- **Error Handling:** Implement consistent and robust error handling for all API calls (both internal and external). Provide clear feedback to the user on failure.
- **Security:** Never expose API keys or sensitive credentials directly in frontend code. Use environment variables (`.env`) managed securely (e.g., via Vercel environment variables).

**Rule:** Handle all API integrations securely and consistently. Follow the project's established patterns for data fetching and error handling. Avoid using deprecated or undocumented APIs.

## 7. Documentation

- **Code Comments:** Add comments to explain complex logic, algorithms, or non-obvious code sections.
- **`README.md`:** Keep the main `README.md` updated with project setup, core technologies, and available scripts.
- **`project-tracker.mdx`:** Regularly update the status of tasks, add new findings, and modify priorities as needed. Update the "Last Updated" date.
- **Tool Documentation:** Maintain specific documentation for each tool (e.g., `amazon-seller-tools.mdx` or dedicated files referenced in the tracker) reflecting its current status, features, and known issues.
- **Architecture:** [Optional but Recommended] Maintain high-level diagrams or descriptions of the application architecture.

**Rule:** Documentation is a part of the development process. Keep all relevant documentation sources accurate and up-to-date with code changes and project status.

## 8. UI/UX Consistency

- **Component Library:** Primarily use components from `shadcn/ui` for consistency and accessibility.
- **Custom Components:** If custom components are necessary, ensure they follow the project's design language and accessibility standards.
- **Responsiveness:** Ensure all UI elements are fully responsive across common device sizes (desktop, tablet, mobile).
- **Dark/Light Mode:** Ensure components and styles work correctly in both dark and light modes.

**Rule:** Maintain a consistent look, feel, and behavior across the application by leveraging the chosen UI library and adhering to established design patterns.

## 9. Security

- **Input Validation:** Validate and sanitize all user inputs on both the client and server sides to prevent injection attacks (XSS, etc.).
- **Authentication/Authorization:** Implement and respect proper authentication and authorization checks for sensitive actions or data access.
- **Secrets Management:** Use environment variables for all secrets (API keys, database credentials, etc.) and configure them securely in Vercel. Do not commit secrets to the repository.
- **Dependencies:** Keep dependencies updated to patch known security vulnerabilities.

**Rule:** Security is paramount. Develop with security best practices in mind at all stages. Refer to tasks under "Enhance Security Protocols" in the tracker.

## 10. Performance

- **Optimization:** Write efficient code. Be mindful of React re-renders, bundle size, and data fetching strategies (use Server Components, Streaming, and caching where appropriate).
- **Image Optimization:** Use Next.js Image component or appropriate techniques for optimizing images.
- **Database Queries:** Optimize database queries for speed and efficiency. Use indexing where necessary (e.g., the `prohibited-keywords` index task).
- **Monitoring:** Monitor application performance using Vercel Analytics or other integrated tools.

**Rule:** Strive for optimal application performance. Address performance bottlenecks identified in testing or monitoring. Refer to performance-related tasks in the tracker.

## 11. Error Handling & Reporting

- **User Feedback:** Provide clear, user-friendly error messages when things go wrong.
- **Logging:** Implement consistent logging for errors and important events.
- **Error Reporting Service:** Utilize the integrated Sentry error tracking (or specified service) to capture and monitor runtime errors in staging/production environments.

**Rule:** Implement robust error handling and leverage the configured error reporting service for effective debugging and monitoring.

---

[//]: # (Documentation last updated: ${new Date().toISOString()})

_These rules are living guidelines and may be updated as the project evolves. Please ensure you are familiar with the latest version._
