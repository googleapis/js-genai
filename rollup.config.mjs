import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import {readdirSync, readFileSync} from 'fs';
import {createRequire} from 'module';
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

// The inlined packages' licenses require their notices in every copy, so the
// web bundle starts with each package's license file.
function bundledLicensesBanner(deps) {
  const require = createRequire(import.meta.url);
  const notices = deps.map((dep) => {
    const dir = path.dirname(require.resolve(`${dep}/package.json`));
    const file = readdirSync(dir).find((name) =>
      /^licen[cs]e(\.(md|txt))?$/i.test(name),
    );
    if (!file) {
      throw new Error(`No license file found for bundled package ${dep}`);
    }
    return `${dep}\n\n${readFileSync(path.join(dir, file), 'utf8').trim()}`;
  });
  const text = ['This file includes the following third-party packages.']
    .concat(notices)
    .join('\n\n')
    .replaceAll('*/', '* /');
  const lines = text.split('\n').map((line) => ` * ${line}`.trimEnd());
  return ['/**', ' * @license', ...lines, ' */'].join('\n');
}

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
      banner: bundledLicensesBanner(webBundledDeps),
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
