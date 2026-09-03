/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {execSync} from 'node:child_process';
import process from 'node:process';
const command = 'npm run build';

console.log(`> Executing: ${command}`);

try {
  execSync(`unset -f npm && ${command}`, {
    stdio: 'inherit',
    shell: '/bin/bash',
  });
} catch (err) {
  process.exit(1);
}
