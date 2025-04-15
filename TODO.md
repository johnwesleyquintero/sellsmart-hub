# Portfolio - Development Roadmap (ScaleWithWesley)

## Reproduce

`.\run_tasks.bat`

`npm run cq`

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

- [x] **ID 33 (Docs / Critical):** BLOCKER: Resolve `npm`/`npm` inconsistency across ALL docs. _Update `.rules.md`, `README.md`, `CONTRIBUTING.md`_ <!-- Note: README still needs update from `npm run install` to `npm install` -->
- [x] **ID 34 (Docs / Critical):** Align `README.md` "Tools Documentation" table with actual `TODO.md` status. _Reflect reality, don't overstate features_ <!-- Note: Further README updates needed based on analysis below -->
- [ ] **ID 26 (UI / Critical):** Consolidate duplicate UI components in `amazon-seller-tools`. _Code Cleanup_
- [ ] **ID 27 (Code Quality / Critical):** Remove unused utility functions from `lib` directory. _Code Cleanup_
- [ ] **ID 30 (Code Quality / Critical):** Improve readability and maintainability of seller tools code. _Code Cleanup_
- [ ] **ID 10 (Performance / Critical):** Optimize image loading and rendering (Initial pass). _Foundational performance_

---

## Phase 1: Core Branding & Foundational Content

- [ ] **ID 53 (Deps / High):** Update `next-themes` to support React 19 and remove `--legacy-peer-deps` workaround. _Resolve peer dependency conflict documented in WORKAROUND.md_
- [ ] **ID 35 (Brand / High):** Implement `ScaleWithWesley` Branding (Logo, Favicon, Theme). _Integrate visual identity_
- [ ] **ID 36 (Config / High):** Configure Domain/Hosting for `scalewithwesley.com`. _Ensure Vercel setup is correct_
- [ ] **ID 37 (Blog / High):** Rebrand/Enhance existing Blog component & styling. _Align with brand, ensure MDX features robust_
- [ ] **ID 38 (Newsletter / High):** Setup Newsletter Platform & Frontend Signup Form Component. _Choose provider (Substack, etc.), build UI_
- [ ] **ID 39 (API / High):** Implement `POST /api/newsletter/subscribe` Endpoint. _Backend for newsletter signup_
- [ ] **ID 40 (Content / High):** Create initial Blog Posts for _functional_ Seller Tools. _Explain value/usage of ready tools_
- [ ] **ID 19 (Documentation / High):** Add initial User Guides for functional Amazon seller tools. _Basic "how-to" for users_
- [ ] **ID 11 (Documentation / High):** Create API documentation for `/api/newsletter/subscribe`. _Document the first API endpoint_
- [ ] **ID 5 (Amazon Tools / High):** Implement core PPC Campaign Auditor functionality (optimization features). _Needed for content/core value. Aligns README status._
- [ ] **ID 6 (Amazon Tools / High):** Enhance Keyword Analyzer with trend data (core functionality). _Needed for content/core value. Aligns README status._ <!-- Decision Point: Confirm if this includes separate "Keyword Trend Analyzer" tool or just enhances Keyword Analyzer -->
- [ ] **ID 24 (Amazon Tools / Critical):** Improve calculation algorithms for keyword analysis. _Ensure core tool logic is sound. Aligns README status._
- [ ] **ID 54 (Amazon Tools / High):** Implement pending Competitor Analyzer features (e.g., pricing analysis improvements). <!-- New Task: Explicitly track Competitor Analyzer enhancements mentioned in README if ID 24 scope is only keywords -->
- [ ] **ID 8 (Testing / High):** Add initial Unit Tests for core Seller Tool logic. _Start building test coverage_
- [ ] **ID 41 (UI / Medium):** Add Links to Social Media/Newsletter Signup (Footer, etc.). _Promote channels_
- [ ] **ID 12 (UI / Medium):** Implement consistent Dark Mode support across site. _Part of branding/UI polish_
- [ ] **ID 42 (Brand / Medium):** Create core `ScaleWithWesley` Social Media Profiles (LinkedIn). _Establish online presence_

---

## Phase 2: Enhance Core Offering & Expand Content

- [ ] **ID 28 (UI / High):** Implement enhanced data visualization for seller tools. _Charts, graphs for better insights_
- [ ] **ID 29 (UI / High):** Add robust data export functionality (CSV/Excel) for tools. _Core feature for tool usability_
- [ ] **ID 16 (UI / High):** Enhance global error handling and user feedback mechanisms. _Improve UX, especially for tool errors_
- [ ] **ID 25 (Amazon Tools / Critical):** Add robust input validation for all seller tools. _Prevent errors, ensure data integrity_
- [ ] **ID 17 (Testing / High):** Add E2E tests for critical user flows (tool usage, signup). _Ensure key paths work reliably_
- [ ] **ID 43 (Content / High):** Create blog posts for newly completed/enhanced Seller Tools. _Expand content library_
- [ ] **ID 44 (Engagement / Medium):** Start regular Newsletter/Social Media activity. _Share content, engage audience_
- [ ] **ID 47 (Deps / Medium):** Install Zod dependency for roadmap validation. _(Roadmap Display Feature)_
- [ ] **ID 48 (Lib / Medium):** Define Zod schema (roadmapSchema.ts) for roadmap task structure. _(Roadmap Display Feature)_
- [ ] **ID 49 (Core / Medium):** Adapt TODO.md data or create mechanism to provide roadmap data as JSON for display component. _(Roadmap Display Feature)_
- [ ] **ID 50 (UI / High):** Create RoadmapDisplay React component (fetches, validates, groups, renders roadmap data). _(Roadmap Display Feature)_
- [ ] **ID 51 (UI / Medium):** Add CSS styling for the RoadmapDisplay component. _(Roadmap Display Feature)_
- [ ] **ID 52 (UI / High):** Integrate RoadmapDisplay component into a relevant page (e.g., /roadmap or /about). _(Roadmap Display Feature)_

---

## Phase 3: Advanced Integrations & Future Growth

- [ ] **ID 9 (Core / Critical):** Implement Authentication & Authorization (if needed). _Enables user accounts, saved data, etc._
- [ ] **ID 45 (Integrations / Medium):** Define & Implement LinkedIn Integration (Purpose-Driven). _E.g., Display posts, Login (Requires Auth - ID 9)_
- [ ] **ID 46 (API / Medium):** Define & Implement other APIs as needed (e.g., Contact Form). _Build APIs based on specific feature requirements_
- [ ] **ID 13 (Analytics / Medium):** Implement usage tracking for tools. _Understand feature popularity_
- [ ] **ID 20 (Monitoring / High):** Implement error tracking and reporting (e.g., Sentry). _Proactive issue detection_
- [ ] **ID 15 (Performance / High):** Add Redis caching for API responses (if needed). _Optimize frequently accessed data_
- [ ] **ID 23 (Security / Critical):** Add rate limiting for API endpoints. _Protect backend resources_
- [ ] **ID 18 (Amazon Tools / Medium):** Add bulk processing capabilities for keyword analysis. _Advanced tool feature_
- [ ] **ID 22 (UI / Low):** Implement progressive image loading / advanced optimizations. _Fine-tune performance_

---

## Backlog (Future Considerations)

- [ ] **ID 31 (Amazon Tools / Medium):** Add support for multiple languages in seller tools. _Internationalization (i18n)_
- [ ] **ID 32 (Amazon Tools / Medium):** Add support for multiple currencies in seller tools. _Localization (l10n)_

---

## Completed Tasks Summary

- [x] **ID 1 (Setup / Critical):** Project structure and base configuration.
- [x] **ID 2 (UI / Critical):** Basic component library setup.
- [x] **ID 3 (Core / Critical):** Next.js app router implementation.
- [x] **ID 4 (Amazon Tools / Critical):** Complete ACOS Calculator implementation.
- [x] **ID 7 (UI / Critical):** Implement responsive design for all tools.
- [x] **ID 14 (Security / Critical):** Implement API key rotation and management.

---

[//]: # (Roadmap last updated: 2024-08-01) <!-- Update Manually -->
