import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'tsup';

// Bundles src/index.ts (+ the inlined generator) into a single CJS file with a
// shebang, then copies the templates/ tree next to the bundle so the published
// package is self-contained (the CLI reads templates from dist/templates).
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  minify: false,
  banner: { js: '#!/usr/bin/env node' },
  // Inline the workspace generator so the published package needs no monorepo.
  noExternal: ['@repo/generator'],
  onSuccess: async () => {
    const src = path.resolve(__dirname, '..', '..', 'templates');
    const dest = path.resolve(__dirname, 'dist', 'templates');
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(src, dest, { recursive: true });
    // eslint-disable-next-line no-console
    console.log('[tsup] copied templates -> dist/templates');
  },
});
