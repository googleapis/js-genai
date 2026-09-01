/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Recreates the CitC-managed `dist` symlink after the output clean step. The
 * internal helper is absent from public checkouts, where this script is a
 * no-op and TypeScript writes to the ordinary local `dist` directory.
 */

import {execFileSync} from 'node:child_process';
import {access} from 'node:fs/promises';
import {resolve} from 'node:path';

const symlinkScript = resolve('scripts/google_ensure_citc_symlink.cjs');

try {
  await access(symlinkScript);
} catch (error) {
  if (error.code === 'ENOENT') {
    process.exit(0);
  }
  throw error;
}

console.log('> Ensuring CitC symlink for dist...');
execFileSync(process.execPath, [symlinkScript, 'dist'], {stdio: 'inherit'});
