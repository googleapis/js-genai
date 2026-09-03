/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Removes an allowlisted compiler-output tree before a package or test build.
 * This prevents stale files from entering the broad publication globs and
 * safely unlinks a CitC `dist` symlink so the build can recreate it afterward.
 */

import {rm} from 'node:fs/promises';
import {resolve} from 'node:path';

const allowedTargets = new Set([resolve('dist'), resolve('dist/test-build')]);

if (process.argv.length !== 3) {
  throw new Error('Usage: node scripts/clean_output.mjs <output-directory>');
}

const target = resolve(process.argv[2]);
if (!allowedTargets.has(target)) {
  throw new Error(`Refusing to clean unexpected output directory: ${target}`);
}

// Removing a symlink unlinks it without traversing and deleting its target.
// The build recreates the trusted CitC link after this clean step.
await rm(target, {recursive: true, force: true});
