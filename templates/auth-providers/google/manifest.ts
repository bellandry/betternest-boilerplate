import type { ProviderManifest } from '../../../packages/generator/src/types';

const manifest: ProviderManifest = {
  id: 'google',
  label: 'Google',
  kind: 'oauth',
  requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  serverConfigFragmentPath: 'server-config.fragment.ts',
  clientUiFragmentPath: 'client-ui.fragment.tsx',
  clientUiTargetPath: 'apps/web/components/auth/google-button.tsx',
  clientUiImport: "import { GoogleButton } from '@/components/auth/google-button';",
  oauthButtonSlot: '<GoogleButton />',
  envFragmentPath: 'env.fragment.txt',
  readmeSetupPath: 'readme-setup.fragment.md',
};

export default manifest;
