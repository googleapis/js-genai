/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Checks that the web bundle loads in a browser without a bundler: every
// static import must be relative, absolute or a URL, and the file must load
// from a directory that has no node_modules.
//
// Usage: node test/packaging/check_web_bundle.mjs [path/to/bundle.mjs]

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {pathToFileURL} from 'url';

const bundlePath = path.resolve(process.argv[2] ?? 'dist/web/index.mjs');

// Anchored to line start so that doc comment examples do not match.
const STATIC_IMPORT =
  /^(?:import|export)\b[^'"]*?\bfrom\s*(['"])([^'"]+)\1|^import\s*(['"])([^'"]+)\3/gm;
const BROWSER_RESOLVABLE = /^(?:\.{0,2}\/|[a-z][a-z0-9+.-]*:\/\/)/i;

const source = fs.readFileSync(bundlePath, 'utf8');
const bareSpecifiers = new Set();
for (const match of source.matchAll(STATIC_IMPORT)) {
  const specifier = match[2] ?? match[4];
  if (!BROWSER_RESOLVABLE.test(specifier)) {
    bareSpecifiers.add(specifier);
  }
}
if (bareSpecifiers.size > 0) {
  console.error(
    `${bundlePath} imports bare module specifiers that browsers cannot ` +
      `resolve: ${[...bareSpecifiers].join(', ')}`,
  );
  process.exit(1);
}

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

console.log(`${bundlePath} has no bare imports and loads standalone.`);
