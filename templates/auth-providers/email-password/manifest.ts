import type { ProviderManifest } from '../../../packages/generator/src/types';

const manifest: ProviderManifest = {
  id: 'email-password',
  label: 'Email & Password',
  kind: 'credential',
  requiredEnvVars: ['RESEND_API_KEY', 'EMAIL_FROM'],
  serverConfigFragmentPath: 'server-config.fragment.ts',
  serverImportFragmentPath: 'server-import.fragment.ts',
  authPackageJsonFragmentPath: 'auth-package.json.fragment.json',
  filesDir: 'files',
  clientUiFragmentPath: 'client-ui.fragment.tsx',
  clientUiTargetPath: 'apps/web/components/auth/email-password-form.tsx',
  clientUiImport:
    "import { EmailPasswordSignInForm, EmailPasswordSignUpForm } from '@/components/auth/email-password-form';",
  signInSlot: '<EmailPasswordSignInForm />',
  signUpSlot: '<EmailPasswordSignUpForm />',
  envFragmentPath: 'env.fragment.txt',
  readmeSetupPath: 'readme-setup.fragment.md',
};

export default manifest;
