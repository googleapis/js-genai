/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'node:child_process';
import process from 'node:process';
import * as fs from 'node:fs';

// Ensure symlink for dist if in CitC
const symlinkScript = 'scripts/google_ensure_citc_symlink.cjs';
if (fs.existsSync(symlinkScript)) {
  try {
    console.log('> Ensuring CitC symlink for dist...');
    execSync(`node ${symlinkScript} dist`, { stdio: 'inherit' });
  } catch (err) {
    console.log('Warning: Failed to ensure CitC symlink for dist.');
  }
}

const isCI = process.env.CI === 'true' || process.env.KOKORO_JOB_TYPE !== undefined;
const isLocal = process.env.USE_LOCAL_BUILD === 'true' || !isCI;
const command = isLocal ? 'npm run build' : 'npm run build-prod';

console.log(`> Executing: ${command}`);

try {
  execSync(`unset -f npm && ${command}`, { stdio: 'inherit', shell: '/bin/bash' });
} catch (err) {
  process.exit(1);
}
