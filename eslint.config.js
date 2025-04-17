import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import sonarjs from 'eslint-plugin-sonarjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

const nextCoreWebVitals = compat.extends('next/core-web-vitals');
const nextTypescript = compat.extends('next/typescript');

export default [
  { ignores: ['node_modules/', '.next/'] },
  js.configs.recommended,
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    plugins: {
      sonarjs: sonarjs,
    },
    rules: {
      'sonarjs/cognitive-complexity': 'warn',
      'sonarjs/no-duplicate-string': 'warn',
      'sonarjs/no-identical-functions': 'warn',
    },
  },
];
