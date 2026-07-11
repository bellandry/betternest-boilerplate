import type { DbManifest } from '../../../packages/generator/src/types';

// SKELETON ONLY — Drizzle is a documented fast-follow, not implemented in this
// phase. The structure exists so the generator can accept `db: 'drizzle'` once
// the files/ tree and fragments below are fleshed out. Do NOT add 'drizzle' to
// a real Selection yet: the fragments are placeholders.
const manifest: DbManifest = {
  id: 'drizzle',
  label: 'Drizzle + PostgreSQL (coming soon)',
  filesDir: 'files',
  adapterImportFragmentPath: 'adapter-import.fragment.ts',
  adapterConfigFragmentPath: 'adapter-config.fragment.ts',
};

export default manifest;
