import { FlatCompat } from '@eslint/eslintrc';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

  // 3. TypeScript configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },

  // 4. Grouped and streamlined rules configuration
  {
    plugins: {
      sonarjs,
      unicorn,
    },
    rules: {
      // DOM-related rules
      'unicorn/prefer-dom-node-append': 'error',
      'unicorn/prefer-dom-node-remove': 'error',
      'unicorn/prefer-query-selector': 'error',

      // Code quality rules
      'unicorn/consistent-function-scoping': 'error',
      'unicorn/no-abusive-eslint-disable': 'error',
      'unicorn/prefer-spread': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      'unicorn/no-null': 'error',

      // Node.js specific rules
      'unicorn/prefer-node-protocol': 'error',

      // Disabled rules
      'unicorn/prefer-module': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-array-reduce': ['error', { allowSimpleOperations: true }],

      // React/Next.js specific rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/jsx-key': 'error',
      'react/no-unescaped-entities': 'warn',
      'react/self-closing-comp': 'error',
      'react/jsx-curly-brace-presence': [
        'error',
        { props: 'never', children: 'never' },
      ],
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-pascal-case': 'error',

      // Performance optimizations
      'sonarjs/no-extra-arguments': 'error',
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-collapsible-if': 'error',

      // Security enhancements
      'sonarjs/no-inverted-boolean-check': 'error',
      'sonarjs/no-redundant-jump': 'error',
      'sonarjs/no-small-switch': 'error',

      // SonarJS rules with custom overrides
      ...sonarjs.configs.recommended.rules,
      'sonarjs/cognitive-complexity': ['warn', 15],
    },
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
