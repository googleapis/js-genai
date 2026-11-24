/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Checks that the web bundle loads standalone without a bundler or
// node_modules by importing a copy from an empty temporary directory and
// verifying that it exports GoogleGenAI.
//
// Usage: node test/packaging/check_web_bundle.mjs [path/to/bundle.mjs]

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {pathToFileURL} from 'url';

const bundlePath = path.resolve(process.argv[2] ?? 'dist/web/index.mjs');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'genai-web-bundle-'));
let bundle;
try {
  const copyPath = path.join(tmpDir, 'index.mjs');
  fs.copyFileSync(bundlePath, copyPath);
  bundle = await import(pathToFileURL(copyPath).href);
} finally {
  fs.rmSync(tmpDir, {recursive: true, force: true});
}
if (typeof bundle.GoogleGenAI !== 'function') {
  console.error(`${bundlePath} does not export GoogleGenAI`);
  process.exit(1);
}

console.log(`${bundlePath} loads standalone and exports GoogleGenAI.`);
