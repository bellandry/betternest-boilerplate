import type { Selection } from './src/types';

// Hardcoded stub standing in for the Phase-2 interactive CLI. Generating with
// this selection must reproduce the Phase-0 monorepo, functionally.
export const DEFAULT_SELECTION: Selection = {
  projectName: 'my-app',
  db: 'prisma',
  authProviders: ['email-password', 'google', 'github'],
};
