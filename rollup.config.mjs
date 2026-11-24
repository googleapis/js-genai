import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import {readFileSync} from 'fs';
import os from 'os';
import path from 'path';
import typescript from 'rollup-plugin-typescript2';

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
);

const rollupPlugins = [
  typescript({
    cacheRoot: path.join(os.tmpdir(), 'rpt2_cache'),
    tsconfigOverride: {
      exclude: ['test/**', 'src/private/**'],
    },
  }),
  json({
    preferConst: true,
  }),
];

// Every output below sets `sourcemapExcludeSources: true` alongside
// `sourcemap: true`. `mappings` is what resolves a stack frame back to the
// original file, line and column; `sourcesContent` only carries the source
// text for a debugger to display, and accounts for the vast majority of the
// published sourcemap size. Stack traces remain unaffected.

const externalDeps = [
  'google-auth-library',
  'ws',
  'fs/promises',
  'fs',
  'node:stream',
  'node:stream/promises',
  'zod',
  'zod-to-json-schema',
  '@modelcontextprotocol/sdk',
  '@modelcontextprotocol/sdk/client/index.js',
  '@modelcontextprotocol/sdk/types.js',
  'path',
  'crypto',
  'os',
  'protobufjs/minimal',
  'protobufjs/minimal.js',
  'p-retry',
];

// Browsers cannot resolve bare module specifiers, so the web build bundles its
// runtime npm dependencies. `p-retry` is CommonJS, hence `commonjs()`.
// `resolve()` must come before the TypeScript plugin. `resolveOnly` keeps any
// other bare import external, so test/packaging/check_web_bundle.mjs flags it
// instead of it being inlined silently.
const webBundledDeps = ['p-retry', 'retry'];
const webExternalDeps = externalDeps.filter(
  (dep) => !webBundledDeps.includes(dep),
);
const webRollupPlugins = [
  resolve({browser: true, preferBuiltins: false, resolveOnly: webBundledDeps}),
  commonjs(),
  ...rollupPlugins,
];

// Both bundled packages are MIT-licensed and require their notices in every copy.
const webLicenseBanner = `/**
 * @license
 * Bundles p-retry (MIT) and retry (MIT):
 *
 * p-retry:
 * Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
 *
 * retry:
 * Copyright (c) 2011:
 * Tim Koschützki (tim@debuggable.com)
 * Felix Geisendörfer (felix@debuggable.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */`;

export default [
  // Cross ES module (dist/index.mjs)
  {
    input: 'src/index.ts',
    output: {
      file: pkg.exports['.']['import'],
      format: 'es',
      sourcemap: true,
      sourcemapExcludeSources: true,
    },
    plugins: rollupPlugins,
    external: externalDeps,
  },

  // Cross CJS module (dist/index.cjs)
  {
    input: 'src/index.ts',
    output: {
      file: pkg.exports['.']['require'],
      format: 'cjs',
      sourcemap: true,
      sourcemapExcludeSources: true,
    },
    plugins: rollupPlugins,
    external: externalDeps,
  },

  // The `node/` ES module (dist/node/index.mjs)
  {
    input: 'src/node/index.ts',
    output: {
      file: pkg.exports['./node']['import'],
      format: 'es',
      sourcemap: true,
      sourcemapExcludeSources: true,
    },
    plugins: rollupPlugins,
    external: externalDeps,
  },

  // The `node/` CJS module (dist/node/index.cjs)
  {
    input: 'src/node/index.ts',
    output: {
      file: pkg.exports['.']['node']['require'],
      format: 'cjs',
      sourcemap: true,
      sourcemapExcludeSources: true,
    },
    plugins: rollupPlugins,
    external: externalDeps,
  },

  // The `web/` module, ES module only (dist/web/index.js)
  {
    input: 'src/web/index.ts',
    output: {
      file: pkg.exports['./web']['import'],
      format: 'es',
      banner: webLicenseBanner,
      sourcemap: true,
      sourcemapExcludeSources: true,
    },
    plugins: webRollupPlugins,
    external: webExternalDeps,
  },

  // The `tokenizer/node` ES module (dist/tokenizer/node.mjs)
  {
    input: 'src/tokenizer/node.ts',
    output: {
      file: 'dist/tokenizer/node.mjs',
      format: 'es',
      sourcemap: true,
      sourcemapExcludeSources: true,
    },
    plugins: rollupPlugins,
    external: externalDeps,
  },

  // The `tokenizer/node` CJS module (dist/tokenizer/node.cjs)
  {
    input: 'src/tokenizer/node.ts',
    output: {
      file: 'dist/tokenizer/node.cjs',
      format: 'cjs',
      sourcemap: true,
      sourcemapExcludeSources: true,
    },
    plugins: rollupPlugins,
    external: externalDeps,
  },

  // Internal module, only for use by Vertex SDK
  {
    input: 'src/vertex_internal/index.ts',
    output: {
      file: 'dist/vertex_internal/index.js',
      format: 'es',
      sourcemap: true,
      sourcemapExcludeSources: true,
    },
    plugins: rollupPlugins,
    external: externalDeps,
  },
  {
    input: 'src/vertex_internal/index.ts',
    output: {
      file: 'dist/vertex_internal/index.cjs',
      format: 'cjs',
      sourcemap: true,
      sourcemapExcludeSources: true,
    },
    plugins: rollupPlugins,
    external: externalDeps,
  },
];
