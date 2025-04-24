import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';

import next from 'eslint-plugin-next';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      next: next,
    },
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        React: 'readonly',
      },
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      sonarjs: sonarjs,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/no-explicit-any': 'warn',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/cognitive-complexity': ['error', 15],
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '**/__tests__/**',
      '**/__mocks__/**', // Added this line
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
      'eslint.config.js',
      'postcss.config.js',
      'tailwind.config.js',
      'tsconfig.json',
      'next-env.d.ts',
      'next.config.js',
      'next.config.mjs',
      'jest.config.js',
      'jest.config.mjs',
      'jest.setup.js',
      'jest.setup.mjs',
      'jest.env.js',
      'jest.env.mjs',
      'jest.preset.js',
      '.wescore/**',
    ],
  },
];
