import base from '@repo/eslint-config/nest';

export default [
  ...base,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
];
