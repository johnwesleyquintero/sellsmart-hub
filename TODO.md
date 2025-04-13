# Portfolio - Development Roadmap (ScaleWithWesley)

---

## Overview

This document outlines the development roadmap for the **`ScaleWithWesley`** Portfolio project using a checklist format. It tracks tasks across different phases, categories, and priorities, providing a clear view of completed, ongoing, and planned work, aligned with the project's strategic objectives and branding initiative.

## Status Legend

- `[ ]` **Pending / In Progress**: Task planned or actively being worked on.
- `[x]` **Done**: Task completed and verified.

## Priority Levels

- **Critical**: Must be addressed immediately.
- **High**: Important for the current or next cycle.
- **Medium**: Important but can be scheduled flexibly.
- **Low**: Desirable improvement, not essential.

## Development Phases (Aligned with NEW IDEA.MD)

- **Phase 0: Foundational Fixes (Prerequisites):** Critical cleanup and consistency tasks that MUST be done first.
- **Phase 1: Core Branding & Foundational Content:** Establishing the `ScaleWithWesley` brand identity, core content channels, and initial functional tools.
- **Phase 2: Enhance Core Offering & Expand Content:** Building out tool functionality, creating more content, refining UI/UX.
- **Phase 3: Advanced Integrations & Future Growth:** Adding more sophisticated features, optimizations, and integrations based on clear needs.
- **Backlog:** Tasks identified but not yet assigned to a specific phase or priority.

---

## Phase 0: Foundational Fixes (Prerequisites - Execute FIRST)

*   [x] **ID 33 (Docs / Critical):** BLOCKER: Resolve `npm`/`pnpm` inconsistency across ALL docs. *Update `.rules.md`, `README.md`, `CONTRIBUTING.md`*
*   [x] **ID 34 (Docs / Critical):** Align `README.md` "Tools Documentation" table with actual `TODO.md` status. *Reflect reality, don't overstate features*
*   [ ] **ID 26 (UI / Critical):** Consolidate duplicate UI components in `amazon-seller-tools`. *Code Cleanup*
*   [ ] **ID 27 (Code Quality / Critical):** Remove unused utility functions from `lib` directory. *Code Cleanup*
*   [ ] **ID 30 (Code Quality / Critical):** Improve readability and maintainability of seller tools code. *Code Cleanup*
*   [ ] **ID 10 (Performance / Critical):** Optimize image loading and rendering (Initial pass). *Foundational performance*

---

## Phase 1: Core Branding & Foundational Content

*   [ ] **ID 53 (Deps / High):** Update `next-themes` to support React 19 and remove `--legacy-peer-deps` workaround. *Resolve peer dependency conflict documented in WORKAROUND.md*
*   [ ] **ID 35 (Brand / High):** Implement `ScaleWithWesley` Branding (Logo, Favicon, Theme). *Integrate visual identity*
*   [ ] **ID 36 (Config / High):** Configure Domain/Hosting for `scalewithwesley.com`. *Ensure Vercel setup is correct*
*   [ ] **ID 37 (Blog / High):** Rebrand/Enhance existing Blog component & styling. *Align with brand, ensure MDX features robust*
*   [ ] **ID 38 (Newsletter / High):** Setup Newsletter Platform & Frontend Signup Form Component. *Choose provider (Substack, etc.), build UI*
*   [ ] **ID 39 (API / High):** Implement `POST /api/newsletter/subscribe` Endpoint. *Backend for newsletter signup*
*   [ ] **ID 40 (Content / High):** Create initial Blog Posts for *functional* Seller Tools. *Explain value/usage of ready tools*
*   [ ] **ID 19 (Documentation / High):** Add initial User Guides for functional Amazon seller tools. *Basic "how-to" for users*
*   [ ] **ID 11 (Documentation / High):** Create API documentation for `/api/newsletter/subscribe`. *Document the first API endpoint*
*   [ ] **ID 5 (Amazon Tools / High):** Implement core PPC Campaign Auditor functionality. *Needed for content/core value*
*   [ ] **ID 6 (Amazon Tools / High):** Enhance Keyword Analyzer with trend data (core functionality). *Needed for content/core value*
*   [ ] **ID 24 (Amazon Tools / Critical):** Improve calculation algorithms for keyword analysis. *Ensure core tool logic is sound*
*   [ ] **ID 8 (Testing / High):** Add initial Unit Tests for core Seller Tool logic. *Start building test coverage*
*   [ ] **ID 41 (UI / Medium):** Add Links to Social Media/Newsletter Signup (Footer, etc.). *Promote channels*
*   [ ] **ID 12 (UI / Medium):** Implement consistent Dark Mode support across site. *Part of branding/UI polish*
*   [ ] **ID 42 (Brand / Medium):** Create core `ScaleWithWesley` Social Media Profiles (LinkedIn). *Establish online presence*

---

## Phase 2: Enhance Core Offering & Expand Content

*   [ ] **ID 28 (UI / High):** Implement enhanced data visualization for seller tools. *Charts, graphs for better insights*
*   [ ] **ID 29 (UI / High):** Add robust data export functionality (CSV/Excel) for tools. *Core feature for tool usability*
*   [ ] **ID 16 (UI / High):** Enhance global error handling and user feedback mechanisms. *Improve UX, especially for tool errors*
*   [ ] **ID 25 (Amazon Tools / Critical):** Add robust input validation for all seller tools. *Prevent errors, ensure data integrity*
*   [ ] **ID 17 (Testing / High):** Add E2E tests for critical user flows (tool usage, signup). *Ensure key paths work reliably*
*   [ ] **ID 43 (Content / High):** Create blog posts for newly completed/enhanced Seller Tools. *Expand content library*
*   [ ] **ID 44 (Engagement / Medium):** Start regular Newsletter/Social Media activity. *Share content, engage audience*
*   [ ] **ID 47 (Deps / Medium):** Install Zod dependency for roadmap validation. *(Roadmap Display Feature)*
*   [ ] **ID 48 (Lib / Medium):** Define Zod schema (roadmapSchema.ts) for roadmap task structure. *(Roadmap Display Feature)*
*   [ ] **ID 49 (Core / Medium):** Adapt TODO.md data or create mechanism to provide roadmap data as JSON for display component. *(Roadmap Display Feature)*
*   [ ] **ID 50 (UI / High):** Create RoadmapDisplay React component (fetches, validates, groups, renders roadmap data). *(Roadmap Display Feature)*
*   [ ] **ID 51 (UI / Medium):** Add CSS styling for the RoadmapDisplay component. *(Roadmap Display Feature)*
*   [ ] **ID 52 (UI / High):** Integrate RoadmapDisplay component into a relevant page (e.g., /roadmap or /about). *(Roadmap Display Feature)*

---

## Phase 3: Advanced Integrations & Future Growth

*   [ ] **ID 9 (Core / Critical):** Implement Authentication & Authorization (if needed). *Enables user accounts, saved data, etc.*
*   [ ] **ID 45 (Integrations / Medium):** Define & Implement LinkedIn Integration (Purpose-Driven). *E.g., Display posts, Login (Requires Auth - ID 9)*
*   [ ] **ID 46 (API / Medium):** Define & Implement other APIs as needed (e.g., Contact Form). *Build APIs based on specific feature requirements*
*   [ ] **ID 13 (Analytics / Medium):** Implement usage tracking for tools. *Understand feature popularity*
*   [ ] **ID 20 (Monitoring / High):** Implement error tracking and reporting (e.g., Sentry). *Proactive issue detection*
*   [ ] **ID 15 (Performance / High):** Add Redis caching for API responses (if needed). *Optimize frequently accessed data*
*   [ ] **ID 23 (Security / Critical):** Add rate limiting for API endpoints. *Protect backend resources*
*   [ ] **ID 18 (Amazon Tools / Medium):** Add bulk processing capabilities for keyword analysis. *Advanced tool feature*
*   [ ] **ID 22 (UI / Low):** Implement progressive image loading / advanced optimizations. *Fine-tune performance*

---

## Backlog (Future Considerations)

*   [ ] **ID 31 (Amazon Tools / Medium):** Add support for multiple languages in seller tools. *Internationalization (i18n)*
*   [ ] **ID 32 (Amazon Tools / Medium):** Add support for multiple currencies in seller tools. *Localization (l10n)*

---

## Completed Tasks Summary

*   [x] **ID 1 (Setup / Critical):** Project structure and base configuration.
*   [x] **ID 2 (UI / Critical):** Basic component library setup.
*   [x] **ID 3 (Core / Critical):** Next.js app router implementation.
*   [x] **ID 4 (Amazon Tools / Critical):** Complete ACOS Calculator implementation.
*   [x] **ID 7 (UI / Critical):** Implement responsive design for all tools.
*   [x] **ID 14 (Security / Critical):** Implement API key rotation and management.

---

[//]: # (Roadmap last updated: 2024-08-01) <!-- Update Manually -->
