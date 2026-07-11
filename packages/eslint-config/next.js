import globals from 'globals';
import base from './base.js';

/** ESLint config for Next.js apps. */
export default [
  ...base,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
];
