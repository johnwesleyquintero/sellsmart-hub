import { FlatCompat } from '@eslint/eslintrc';
import sonarjs from 'eslint-plugin-sonarjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

// Load the Next.js core configurations
// This usually includes TypeScript support already
const nextCoreWebVitalsConfigs = compat.extends('next/core-web-vitals');

// Define the final configuration array
const config = [
  // 1. Define ignores first (common practice)
  {
    ignores: [
      'dist/',
      '.next/',
      'node_modules/',
      '.wescore/',
      'coverage/',
      '.vercel/',
      'build/',
      '__tests__/',
      '*.lcov',
      'jest.config.js',
      'lighthouse-reports/',
      'docs/',
      'scripts/',
      '*.log',
      '*.md',
      '__mocks__/',
      // Add any other necessary ignores (e.g., build artifacts)
    ],
  },

  // 2. Spread the loaded Next.js configurations into the array
  ...nextCoreWebVitalsConfigs,

  // 3. Integrate SonarJS using the standard flat config pattern
  {
    plugins: {
      sonarjs: sonarjs,
    },
    rules: {
      ...sonarjs.configs.recommended.rules,
      // You can override specific SonarJS rules here if needed, e.g.:
      // 'sonarjs/cognitive-complexity': ['warn', 15],
    },
    // If sonarjs.configs.recommended included settings, languageOptions, etc.,
    // you might need to merge them here too, but start with plugins and rules.
  },

  // 4. (Optional) Add project-specific rules/overrides
  // Example:
  // {
  //   files: ['src/**/*.ts', 'src/**/*.tsx'], // Target specific files if needed
  //   rules: {
  //     'no-console': 'warn', // Example override
  //     // Add other custom rules here
  //   }
  // }
];

export default config;
