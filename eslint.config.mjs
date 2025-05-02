import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import typescript from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';

export default [
  // Top-level ignore patterns
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.config.*',
      '**/.*',
      '**/*.d.ts',
      '**/__tests__/**',
      '**/__mocks__/**',
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',

      '!.next/types/**/*.ts', // Keep type checking for Next.js types
    ],
  },

  js.configs.recommended,
  {
    ...nextPlugin.configs.recommended,
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      '@next/next/no-html-link-for-pages': 'off',
    },
  },

  // Source files config
  {
    files: ['src/**/*.{js,jsx,ts,tsx,mjs}', '.wescore/scripts/**/*.mjs', 'jest.setup.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: ['./tsconfig.json'],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        ...globals.jest,
        React: 'readonly',
        window: 'readonly',
        global: 'readonly',
      },
    },
    plugins: {
      next: nextPlugin,
      '@typescript-eslint': typescript,
      sonarjs: sonarjs,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/no-explicit-any': 'warn',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/cognitive-complexity': ['error', 20],
      'react/react-in-jsx-scope': 'off',
    },
  },
];
