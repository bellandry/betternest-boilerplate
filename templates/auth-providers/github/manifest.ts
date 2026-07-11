import type { ProviderManifest } from '../../../packages/generator/src/types';

const manifest: ProviderManifest = {
  id: 'github',
  label: 'GitHub',
  kind: 'oauth',
  requiredEnvVars: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'],
  serverConfigFragmentPath: 'server-config.fragment.ts',
  clientUiFragmentPath: 'client-ui.fragment.tsx',
  clientUiTargetPath: 'apps/web/components/auth/github-button.tsx',
  clientUiImport: "import { GithubButton } from '@/components/auth/github-button';",
  oauthButtonSlot: '<GithubButton />',
  envFragmentPath: 'env.fragment.txt',
  readmeSetupPath: 'readme-setup.fragment.md',
};

export default manifest;
