import globals from 'globals';
import base from './base.js';

/** ESLint config for NestJS apps. */
export default [
  ...base,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
    },
  },
];
