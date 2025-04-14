# New Project Structure

Goal:
to easily maintain the project structure in src folder and potentially add more features in the future.

## Project Structure

```
portfolio/
├── .env             # Local environment variables (ignored by Git)
├── .env.example     # Example environment variables
├── .eslintrc.json   # ESLint configuration
├── .gitignore       # Git ignore rules
├── .prettierrc.json # Prettier configuration
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── FEEDBACK.md
├── NEW IDEA.MD
├── NEW_STRUCTURE.md # (This file)
├── README.md
├── TODO.md
├── WORKAROUND.md
├── .rules.md        # Your project guidelines (NEEDS UPDATE if you choose this)
├── next.config.mjs  # Next.js configuration (MAY NEED UPDATE)
├── package.json     # Project manifest
├── npm-lock.yaml   # npm lockfile (CRITICAL - commit this)
├── tsconfig.json    # TypeScript configuration (NEEDS UPDATE)
│
├── public/          # Static assets (images, fonts, svgs) - Stays at root
│   ├── logo.svg
│   ├── portfolio-preview.svg
│   └── ...
│
└── src/             # Source code directory
    ├── app/         # Next.js App Router directory
    │   ├── (pages)/
    │   │   ├── blog/
    │   │   │   └── ...
    │   │   ├── tools/
    │   │   │   └── ...
    │   │   └── layout.tsx
    │   ├── api/
    │   │   └── newsletter/
    │   │       └── subscribe/
    │   │           └── route.ts
    │   ├── favicon.ico
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    │
    ├── components/  # Reusable React components
    │   ├── ui/
    │   │   └── ...
    │   ├── shared/
    │   │   └── ...
    │   └── feature/
    │       ├── blog/
    │       │   └── ...
    │       ├── tools/
    │       │   └── ...
    │       └── newsletter/
    │           └── ...
    │
    ├── content/     # Blog posts and other MDX content (Can be here or root)
    │   └── my-first-post.mdx
    │   └── ...
    │
    ├── lib/         # Utility functions, helpers, constants, hooks, types
    │   ├── utils.ts
    │   ├── hooks/
    │   ├── constants.ts
    │   └── types/
    │       └── index.ts
    │
    └── styles/      # Global styles, Tailwind base/plugins
        └── globals.css # (Often imported in src/app/layout.tsx)


```

## Workaround

Priority: Please update the import configurations and import reference files.

(src layout):
Update tsconfig.json: You MUST update the baseUrl and potentially paths in your tsconfig.json to correctly resolve modules within the src directory. Typically, you'd set "baseUrl": "./src" or adjust paths like "@/components/_": ["components/_"] to "@/components/_": ["src/components/_"] (depending on your current setup).
Check next.config.mjs: Ensure Next.js knows to look for pages/app inside src. This is often automatic if src/app or src/pages exists, but double-check.
Update .rules.md: Modify Section 3.1 (Directory Structure) in your .rules.md file to reflect the new src layout. This keeps your documentation consistent with your code.
Update Imports: You will need to go through your codebase and update all relative and absolute import paths to work correctly with the new src structure.
Move Files: Physically move the app, components, lib, styles, and potentially content directories into the newly created src folder.
Consistency: Whichever structure you choose, ensure it's applied consistently. The detailed breakdown within components (ui, shared, feature) from your .rules.md is a good pattern to maintain.
Review .rules.md: Ensure the rest of your .rules.md (like file naming conventions) still aligns with your chosen structure.
Based on your request to use src, Option 2 is the direct answer, but be prepared for the necessary configuration and import path updates.
