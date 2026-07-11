import type { ProviderManifest } from '../../../packages/generator/src/types';

// EXTENSIBILITY PROOF — disabled by default (folder prefixed with `_`, and not
// listed in DEFAULT_SELECTION). Demonstrates that adding a provider requires
// ONLY a new folder here: no change to packages/generator. When ready, rename
// the folder to `discord` and add 'discord' to a Selection.
const manifest: ProviderManifest = {
  id: '_placeholder-discord',
  label: 'Discord',
  kind: 'oauth',
  status: 'coming-soon',
  requiredEnvVars: ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET'],
  serverConfigFragmentPath: 'server-config.fragment.ts',
  clientUiFragmentPath: 'client-ui.fragment.tsx',
  clientUiTargetPath: 'apps/web/components/auth/discord-button.tsx',
  clientUiImport: "import { DiscordButton } from '@/components/auth/discord-button';",
  oauthButtonSlot: '<DiscordButton />',
  envFragmentPath: 'env.fragment.txt',
  readmeSetupPath: 'readme-setup.fragment.md',
};

export default manifest;
