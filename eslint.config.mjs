// ESLint Flat Config
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import sonarjs from 'eslint-plugin-sonarjs';

export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**'],
    languageOptions: {
      parser: parser,
    },
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      sonarjs,
    },
    rules: {
      'sonarjs/no-duplicate-string': 'error',
      'sonarjs/no-identical-functions': 'error',
    },
  },
];
