import type { ProviderManifest } from '../../../packages/generator/src/types';

const manifest: ProviderManifest = {
  id: 'email-password',
  label: 'Email & Password',
  kind: 'credential',
  requiredEnvVars: [],
  serverConfigFragmentPath: 'server-config.fragment.ts',
  clientUiFragmentPath: 'client-ui.fragment.tsx',
  clientUiTargetPath: 'apps/web/components/auth/email-password-form.tsx',
  clientUiImport:
    "import { EmailPasswordSignInForm, EmailPasswordSignUpForm } from '@/components/auth/email-password-form';",
  signInSlot: '<EmailPasswordSignInForm />',
  signUpSlot: '<EmailPasswordSignUpForm />',
  readmeSetupPath: 'readme-setup.fragment.md',
};

export default manifest;
