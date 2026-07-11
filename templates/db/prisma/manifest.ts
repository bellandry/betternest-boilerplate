import type { DbManifest } from '../../../packages/generator/src/types';

const manifest: DbManifest = {
  id: 'prisma',
  label: 'Prisma + PostgreSQL',
  filesDir: 'files',
  packageJsonFragmentPath: 'package.json.fragment.json',
  envFragmentPath: 'env.fragment.txt',
  adapterImportFragmentPath: 'adapter-import.fragment.ts',
  adapterConfigFragmentPath: 'adapter-config.fragment.ts',
};

export default manifest;
