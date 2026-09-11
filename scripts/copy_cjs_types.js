/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Emit CJS declaration companions (`.d.cts`) next to each public `.d.ts` rollup.
 *
 * With `"type": "module"`, TypeScript treats `.d.ts` as ESM. CommonJS consumers
 * that `require()` the matching `.cjs` entry therefore get TS1479 unless a
 * `.d.cts` types entry is selected under the `require` condition.
 */

import * as fs from 'fs';
import * as path from 'path';

const dtsSources = [
  'dist/genai.d.ts',
  'dist/node/node.d.ts',
  'dist/tokenizer/node.d.ts',
  'dist/vertex_internal/index.d.ts',
];

const rootDir = path.resolve(import.meta.dirname, '..');

for (const rel of dtsSources) {
  const src = path.resolve(rootDir, rel);
  const dest = src.replace(/\.d\.ts$/, '.d.cts');
  if (!fs.existsSync(src)) {
    console.warn(`copy_cjs_types: missing ${rel}, skipping`);
    continue;
  }
  fs.copyFileSync(src, dest);
  console.log(`copy_cjs_types: wrote ${path.relative(rootDir, dest)}`);
}
