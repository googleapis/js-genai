import json from '@rollup/plugin-json';
import {readFileSync} from 'fs';
import typescript from 'rollup-plugin-typescript2';

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
);

const rollupPlugins = [
  typescript({
    tsconfigOverride: {
      exclude: ['test/**', 'src/private/**'],
    },
  }),
  json({
    preferConst: true,
  }),
];

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

export default [
  // Cross ES module (dist/index.mjs)
  {
    input: 'src/index.ts',
    output: {
      file: pkg.exports['.']['import'],
      format: 'es',
      sourcemap: true,
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
      sourcemap: true,
    },
    plugins: rollupPlugins,
    external: externalDeps,
  },

  // The `tokenizer/node` ES module (dist/tokenizer/node.mjs)
  {
    input: 'src/tokenizer/node.ts',
    output: {
      file: 'dist/tokenizer/node.mjs',
      format: 'es',
      sourcemap: true,
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
    },
    plugins: rollupPlugins,
    external: externalDeps,
  },
];
