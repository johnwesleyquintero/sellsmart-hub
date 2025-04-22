// ESLint configuration for Wescore tools
module.exports = {
  extends: ['eslint:recommended'],
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'no-console': 'warn',
    'consistent-return': 'error',
    'default-case': 'error',
  },
};
