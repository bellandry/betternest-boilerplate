import type { DbManifest } from '../../../packages/generator/src/types';

const manifest: DbManifest = {
  id: 'drizzle-mysql',
  label: 'Drizzle + MySQL',
  database: 'MySQL',
  ormName: 'Drizzle',
  filesDir: 'files',
  packageJsonFragmentPath: 'package.json.fragment.json',
  envFragmentPath: 'env.fragment.txt',
  adapterImportFragmentPath: 'adapter-import.fragment.ts',
  adapterConfigFragmentPath: 'adapter-config.fragment.ts',
  readmeFragmentPath: 'readme-fragment.md',
};

export default manifest;
