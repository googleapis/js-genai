/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { execFileSync } from 'node:child_process';
import process from 'node:process';

// npm also invokes prepack while materializing Git dependencies. Keep that
// install path free of build-time shell execution; only explicit pack/publish
// commands build the distributable.
const npmCommand = process.env.npm_command;
if (npmCommand !== 'pack' && npmCommand !== 'publish') {
  console.log(`> Skipping package build for npm ${npmCommand || 'lifecycle'} context`);
  process.exit(0);
}

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  throw new Error('npm_execpath is required to run the package build');
}

console.log('> Building package before packing');
execFileSync(process.execPath, [npmCli, 'run', 'build'], {
  stdio: 'inherit',
  env: process.env,
});
