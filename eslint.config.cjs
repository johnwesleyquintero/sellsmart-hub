async function getConfig() {
  const { defineConfig } = await import('eslint');

  return defineConfig([
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      env: {
        browser: true,
        es2021: true,
        node: true,
      },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:unicorn/recommended',
        'next/core-web-vitals',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      plugins: ['react-hooks', '@typescript-eslint', 'unicorn'],
      rules: {
        'no-unused-vars': 'warn',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'unicorn/filename-case': 'off',
        'unicorn/prevent-abbreviations': 'off',
        'unicorn/no-array-reduce': 'off',
        'no-console': 'warn',
      },
    },
  ]);
}

module.exports = getConfig();
