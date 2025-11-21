/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'node:child_process';
import process from 'node:process';

const isLocal = process.env.USE_LOCAL_BUILD === 'true';
const command = isLocal ? 'npm run build' : 'npm run build-prod';

console.log(`> Executing: ${command}`);

try {
  execSync(command, { stdio: 'inherit' });
} catch (err) {
  process.exit(1);
}
