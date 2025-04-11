# Project Structure

**Document Version:** 1.1
**Last Updated:** ${new Date().toISOString()}

---

## 1. Overview

This document provides a high-level overview of the project's directory structure and key file organization principles. It reflects the setup for a Next.js 14 application using the App Router, TypeScript, Tailwind CSS, and Bun.

---

## 2. Core Directory Structure

portfolio/
├── .github/ # GitHub specific files (e.g., workflows, issue templates)
│ └── workflows/ # CI/CD workflows (e.g., deploy.yml)
├── .husky/ # Git hooks configuration (e.g., pre-commit)
├── .vscode/ # VS Code editor settings (e.g., settings.json, extensions.json)
├── app/ # Next.js App Router: Routes, Pages, Layouts, API endpoints
│ ├── (main)/ # Route group for main application pages (e.g., Home, About)
│ │ ├── layout.tsx # Main layout for this group
│ │ └── page.tsx # Home page component
│ │ └── ... # Other main pages (e.g., about/, projects/)
│ ├── api/ # API Route Handlers
│ │ └── ... # Specific API endpoints (e.g., resume/route.ts)
│ ├── blog/ # Blog related routes and components
│ │ ├── [slug]/ # Dynamic route for individual blog posts
│ │ │ └── page.tsx # Component rendering a single blog post
│ │ └── page.tsx # Blog listing page component
│ ├── components/ # Reusable React components (Client & Server)
│ │ ├── amazon-seller-tools/ # Components specifically built for the Seller Tools suite
│ │ │ ├── acos-calculator.tsx
│ │ │ ├── competitor-analyzer.tsx
│ │ │ ├── description-editor.tsx
│ │ │ ├── fba-calculator.tsx
│ │ │ ├── keyword-analyzer.tsx
│ │ │ ├── keyword-deduplicator.tsx
│ │ │ ├── keyword-trend-analyzer.tsx
│ │ │ ├── listing-quality-checker.tsx
│ │ │ ├── ppc-campaign-auditor.tsx
│ │ │ ├── profit-margin-calculator.tsx
│ │ │ ├── sales-estimator.tsx
│ │ │ └── sample-csv-button.tsx # Utility component within tools
│ │ ├── ui/ # Shared, primitive UI components (often from shadcn/ui or similar)
│ │ │ ├── button.tsx
│ │ │ ├── card.tsx
│ │ │ └── ... # Other base UI elements
│ │ └── shared/ # Other shared components used across different features
│ │ ├── header.tsx
│ │ ├── footer.tsx
│ │ └── theme-toggle.tsx
│ ├── content/ # Static content and MDX files
│ │ └── blog/ # Blog content (e.g., MDX files)
│ ├── css/ # Additional CSS modules and styles
│ ├── data/ # Static data, content sources, sample files
│ │ ├── amazon-tools-sample-data/ # Sample data for Amazon tools
│ │ ├── portfolio-data/ # Portfolio-related static data
│ │ └── prohibited-keywords/ # Keywords data
│ ├── hooks/ # Custom React hooks
│ │ ├── use-mobile.tsx
│ │ └── use-toast.ts
│ ├── lib/ # Utility functions, helpers, constants, types
│ │ ├── calculations/ # Business logic specific to Seller Tools calculations
│ │ ├── utils/ # General utility functions
│ │ ├── amazon-types.ts # Shared TypeScript definitions for Amazon data structures
│ │ └── constants.ts # Project-wide constants
│ ├── styles/ # Global styles and CSS modules
│ │ └── globals.css # Global styles
│ ├── tools/ # Route group for Amazon Seller Tools pages
│ │ ├── layout.tsx # Layout specific to the tools section
│ │ └── ... # Sub-routes for each tool (e.g., acos-calculator/page.tsx)
│ ├── layout.tsx # Root layout for the entire application
│ ├── page.tsx # Root page (often redirects or serves as home)
│ ├── loading.tsx # Optional root loading UI
│ ├── error.tsx # Optional root error boundary UI
│ └── not-found.tsx # Optional root 404 page UI
├── public/ # Static assets served directly (images, fonts, favicons)
│ ├── images/
│ │ ├── blog/ # Blog-related images
│ │ └── projects/ # Project-related images
│ ├── profile/ # Profile documents (Resume, Cover Letter)
│ ├── portfolio-preview.svg # Preview image used in README
│ └── favicon.svg # Site favicon
├── .env # Local environment variables (Ignored by Git)
├── .env.example # Template for environment variables (Committed)
├── .gitignore # Specifies intentionally untracked files by Git
├── bun.lockb # Bun lockfile (deterministic dependencies)
├── next.config.mjs # Next.js configuration file
├── package.json # Project metadata, dependencies, and scripts
├── postcss.config.js # PostCSS configuration (often for Tailwind)
├── tailwind.config.ts # Tailwind CSS configuration file
├── tsconfig.json # TypeScript configuration file
├── README.md # Project overview, setup, and usage instructions
├── CONTRIBUTING.md # Guidelines for contributors
├── CODE_OF_CONDUCT.md # Code of Conduct for the community
├── CHANGELOG.md # Log of notable changes to the project
├── TODO.md # Development roadmap and task tracking
├── .rules.md # Project Development Guidelines & Standards
└── PROJECT_STRUCTURE.md # This file: Overview of the project structure

---

## 3. Key Implementation Details & Conventions

- **Framework:** Next.js 14 (App Router) is used, leveraging Server Components by default. Client Components (`'use client'`) are used where interactivity or browser APIs are needed.
- **Language:** TypeScript (Strict Mode) is enforced for type safety. Shared types are often located in `lib/`.
- **Package Manager:** Bun is the primary package manager and runtime. Use `bun install`, `bun add`, `npm run`.
- **Styling:** Tailwind CSS is used for utility-first styling. Configuration is in `tailwind.config.ts`. `shadcn/ui` components form the base UI library, located in `components/ui/`. Dark mode is supported.
- **Components:** Reusable components are organized into `components/ui` (primitives), `components/shared` (cross-feature), and feature-specific directories like `components/amazon-seller-tools`.
- **Utilities:** Shared logic, hooks, types, and constants reside in the `lib/` directory.
- **Content:** Blog content uses MDX, potentially stored in `data/blog/` or fetched from a CMS.
- **Static Assets:** Images, fonts, and other static files are placed in the `public/` directory.
- **Naming Conventions:**
  - Components: `PascalCase.tsx`
  - Pages/Layouts: `kebab-case/page.tsx`, `kebab-case/layout.tsx`
  - Utilities/Types/Hooks: `camelCase.ts` or `kebab-case.ts`
  - Styles (if using CSS Modules): `kebab-case.module.css`
- **State Management:** Primarily React Hooks (`useState`, `useReducer`, `useContext`). Server-side data fetching is preferred.
- **Linting/Formatting:** ESLint and Prettier are configured to maintain code quality and consistency.

---

## 4. File Type Legend (Conceptual)

- 📁 Directory
- 📄 Configuration File (`.json`, `.js`, `.mjs`, `.ts`, `.md`, `.lockb`, `.env`, `.gitignore`)
- ⚛️ React Component (`.tsx`) / Next.js Page/Layout (`page.tsx`, `layout.tsx`)
- 📜 TypeScript File (`.ts`)
- 🎨 Styling File (`.css`, `tailwind.config.ts`)
- 📝 Markdown File (`.md`, `.mdx`)
- 🖼️ Image/SVG (`.svg`, `.png`, `.jpg`)
- 💾 Data File (`.json`, `.csv`)
- ⚙️ Script (Defined in `package.json`)
- 🪝 Git Hook Config (`.husky/`) / Workflow (`.github/workflows/`)

---

[//]: # (Documentation last updated: ${new Date().toISOString()})

Changes Made:

Added Common Top-Level Folders: Included .github/, .husky/, .vscode/ as these are common in professional projects.
Detailed app/ Structure: Showed standard App Router files (layout.tsx, page.tsx, loading.tsx, etc.) and common route groups like (main), api, blog, tools.
Refined components/: Clearly separated ui (shadcn), shared, and amazon-seller-tools.
Updated lib/: Aligned with the structure mentioned in .rules.md (calculations, hooks, utils, amazon-types.ts, constants.ts).
Specified data/: Included blog/ for potential MDX files and sample-data/.
Clarified public/: Added common subdirectories like images/, fonts/.
Listed Core Config Files: Ensured all essential config files (next.config.mjs, tailwind.config.ts, etc.) are present.
Included Project Docs: Added CHANGELOG.md, TODO.md, .rules.md, and PROJECT_STRUCTURE.md itself.
Expanded "Key Implementation Details": Summarized the core technologies and conventions based on your other documents (Bun, App Router, shadcn, MDX, etc.). Added Naming Conventions.
Improved "File Type Legend": Made it more conceptual and representative of the file types actually present.
Versioning: Added a version number and last updated timestamp.
This updated structure should provide a much clearer and more accurate picture of your project's organization.
