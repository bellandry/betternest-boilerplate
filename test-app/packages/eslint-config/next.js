import globals from 'globals';
import nextPlugin from '@next/eslint-plugin-next';
import base from './base.js';

/** ESLint flat config for Next.js apps (no FlatCompat — avoids the ESLint 9
 * circular-config crash in eslint-config-next). */
export default [
  ...base,
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
];
