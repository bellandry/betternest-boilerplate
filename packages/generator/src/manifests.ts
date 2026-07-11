import fs from 'node:fs';
import path from 'node:path';
import { createJiti } from 'jiti';
import type { DbManifest, ProviderManifest } from './types';

// The generator authors manifests as .ts files. Under `tsx` (dev scripts) a
// native dynamic import works, but a plain-node CLI bundle cannot import .ts.
// jiti loads/transpiles .ts on the fly in any runtime, so this is the single
// place every manifest is loaded. `import type` lines in manifests are erased
// by jiti, so their relative type paths don't need to resolve at runtime.
const jiti = createJiti(__filename, { moduleCache: true });

// Default templates root: repo layout relative to this file
// (packages/generator/src/manifests.ts -> ../../../templates). Kept so the
// Phase-1 scripts keep working with no argument. The CLI passes its own path
// (templates copied next to the bundle).
export const DEFAULT_TEMPLATES_DIR = path.resolve(__dirname, '..', '..', '..', 'templates');

export async function loadManifest<T>(manifestFile: string): Promise<T> {
  const mod = await jiti.import<{ default: T }>(manifestFile);
  return mod.default;
}

export function loadDbManifest(templatesDir: string, id: string): Promise<DbManifest> {
  return loadManifest<DbManifest>(path.join(templatesDir, 'db', id, 'manifest.ts'));
}

export function loadProviderManifest(templatesDir: string, id: string): Promise<ProviderManifest> {
  return loadManifest<ProviderManifest>(
    path.join(templatesDir, 'auth-providers', id, 'manifest.ts'),
  );
}

// Directory ids under a templates subfolder (skips files, keeps folders).
export function listTemplateIds(templatesDir: string, sub: string): string[] {
  const dir = path.join(templatesDir, sub);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}
