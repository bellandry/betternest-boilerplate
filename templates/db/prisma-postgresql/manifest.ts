import type { DbManifest } from '../../../packages/generator/src/types';

const manifest: DbManifest = {
  id: 'prisma-postgresql',
  label: 'Prisma + PostgreSQL',
  database: 'PostgreSQL',
  ormName: 'Prisma',
  filesDir: 'files',
  packageJsonFragmentPath: 'package.json.fragment.json',
  envFragmentPath: 'env.fragment.txt',
  adapterImportFragmentPath: 'adapter-import.fragment.ts',
  adapterConfigFragmentPath: 'adapter-config.fragment.ts',
  readmeFragmentPath: 'readme-fragment.md',
};

export default manifest;
