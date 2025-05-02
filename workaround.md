## General Workaround Library

**Random Command Workarounds:**

- `Remove-Item -Recurse -Force node_modules; Remove-Item package-lock.json; npm cache clean --force; npm install`
- `npm install dotenv archiver chalk inquirer semver glob`
- `npm rebuild`
- `npm ci --prefer-offline`
- `npm run pmc`
- `npm run pmcjs`
- `npm run wes-cq`

## Available Scripts Reference Latest

**Package Scripts:**

```json
"scripts": {
    "build": "cross-env NODE_ENV=production next build",
    "build-storybook": "storybook build",
    "check": "npm-run-all --parallel lint typecheck test",
    "create-index": "ts-node --esm src/lib/mongodb/create-unique-index.ts",
    "dev": "next dev",
    "format": "prettier --write . --log-level warn",
    "generate": "ts-node src/lib/generate-sample-csv.ts",
    "lint": "eslint --config eslint.config.mjs .",
    "lint:fix": "eslint --fix --config eslint.config.mjs .",
    "prepare": "husky",
    "preview": "next start",
    "reinstall": "npm install",
    "systeminfo": "powershell .\\scripts\\system-info.ps1",
    "start": "cross-env NODE_ENV=production next start",
    "storybook": "storybook dev -p 6006",
    "test": "npm run test:json",
    "test:ci": "jest --ci --runInBand --coverage --collectCoverageFrom=\"**/*.{ts,tsx}\"",
    "test:update": "jest -u",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "typecheck": "tsc --noEmit",
    "test:json": "jest --json --outputFile=jest-results.json || true",
    "pmc": "powershell .\\scripts\\project-cli.ps1",
    "pmcjs": "node ./.wescore/scripts/project-cli.mjs",
    "wes-cq": "node ./.wescore/scripts/check-quality.mjs",
    "wes-cp": "node ./.wescore/scripts/wescore-cyberpunk.mjs"
```
