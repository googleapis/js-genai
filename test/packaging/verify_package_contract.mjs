/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Permanent package-contract test for published artifacts. It exercises the
 * packed tarball, not the repository's source tree or unpacked build output,
 * and must remain in CI after the packaging migration is complete.
 */

import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {realpathSync} from 'node:fs';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const temporaryRoot = await mkdtemp(
  join(tmpdir(), 'js-genai-package-contract-'),
);
const packageRoot = join(temporaryRoot, 'node_modules', '@google', 'genai');
const npmCache = join(temporaryRoot, 'npm-cache');

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: temporaryRoot,
    encoding: 'utf8',
    stdio: 'pipe',
    ...options,
  });
}

async function write(path, contents) {
  await mkdir(dirname(path), {recursive: true});
  await writeFile(path, contents);
}

async function linkDependency(name) {
  const source = resolve(repositoryRoot, 'node_modules', name);
  const destination = join(temporaryRoot, 'node_modules', name);
  await mkdir(dirname(destination), {recursive: true});
  await symlink(source, destination, 'junction');
}

function assertLegacyResolutions(containingFile) {
  const compilerOptions = {
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
  };
  const expectedResolutions = {
    '@google/genai': 'dist/esm/index.d.ts',
    '@google/genai/node': 'dist/commonjs/node/index.d.ts',
    '@google/genai/web': 'dist/commonjs/web/index.d.ts',
  };

  for (const [specifier, expectedPath] of Object.entries(expectedResolutions)) {
    const {resolvedModule} = ts.resolveModuleName(
      specifier,
      containingFile,
      compilerOptions,
      ts.sys,
    );
    assert.ok(resolvedModule, `Legacy resolver did not resolve ${specifier}`);
    assert.equal(
      realpathSync(resolve(resolvedModule.resolvedFileName)),
      realpathSync(join(packageRoot, expectedPath)),
      `Legacy resolver selected an unexpected declaration for ${specifier}`,
    );
  }
}

const allowedTarballEntries = [
  /^package\.json$/,
  /^README\.md$/,
  /^LICENSE$/,
  /^node\/package\.json$/,
  /^web\/package\.json$/,
  /^dist\/(esm|commonjs)\//,
];
const requiredTarballEntries = [
  'dist/esm/package.json',
  'dist/commonjs/package.json',
  'dist/esm/cross/sentencepiece/sentencepiece_model.pb.js',
  'dist/esm/cross/sentencepiece/sentencepiece_model.pb.d.ts',
  'dist/commonjs/cross/sentencepiece/sentencepiece_model.pb.js',
  'dist/commonjs/cross/sentencepiece/sentencepiece_model.pb.d.ts',
];

function assertTarballContents(packResult) {
  const paths = packResult.files.map((file) => file.path);
  const unexpected = paths.filter(
    (path) => !allowedTarballEntries.some((pattern) => pattern.test(path)),
  );
  if (unexpected.length > 0) {
    throw new Error(`Unexpected tarball entries:\n${unexpected.join('\n')}`);
  }
  const missing = requiredTarballEntries.filter(
    (entry) => !paths.includes(entry),
  );
  if (missing.length > 0) {
    throw new Error(`Missing tarball entries:\n${missing.join('\n')}`);
  }
}

try {
  const packOutput = execFileSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', temporaryRoot],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: {...process.env, NPM_CONFIG_CACHE: npmCache},
    },
  );
  const [packResult] = JSON.parse(packOutput);
  const tarballPath = join(temporaryRoot, packResult.filename);

  assertTarballContents(packResult);

  await mkdir(packageRoot, {recursive: true});
  run('tar', ['-xzf', tarballPath, '-C', packageRoot, '--strip-components=1']);

  const packageJson = JSON.parse(
    await readFile(join(packageRoot, 'package.json'), 'utf8'),
  );
  for (const dependency of Object.keys(packageJson.dependencies ?? {})) {
    await linkDependency(dependency);
  }
  await linkDependency('@types/node');

  const binDirectory = resolve(repositoryRoot, 'node_modules/.bin');
  const npmEnvironment = {...process.env, NPM_CONFIG_CACHE: npmCache};
  run(join(binDirectory, 'publint'), [], {
    cwd: packageRoot,
    env: npmEnvironment,
  });
  run(join(binDirectory, 'attw'), [tarballPath, '--profile', 'node16'], {
    env: npmEnvironment,
  });

  await write(
    join(temporaryRoot, 'package.json'),
    `${JSON.stringify({private: true, type: 'module'}, null, 2)}\n`,
  );

  await write(
    join(temporaryRoot, 'runtime-esm.mjs'),
    `import assert from 'node:assert/strict';

const root = await import('@google/genai');
const node = await import('@google/genai/node');
const web = await import('@google/genai/web');
const tokenizer = await import('@google/genai/tokenizer');
const tokenizerNode = await import('@google/genai/tokenizer/node');
const vertex = await import('@google/genai/vertex_internal');

assert.equal(root.GoogleGenAI, node.GoogleGenAI);
assert.equal(typeof web.GoogleGenAI, 'function');
assert.equal(typeof tokenizer.LocalTokenizer, 'function');
assert.equal(tokenizer.LocalTokenizer, tokenizerNode.LocalTokenizer);
assert.ok(Object.keys(vertex).length > 0);
`,
  );

  await write(
    join(temporaryRoot, 'runtime-cjs.cjs'),
    `const assert = require('node:assert/strict');

const root = require('@google/genai');
const node = require('@google/genai/node');
const web = require('@google/genai/web');
const tokenizer = require('@google/genai/tokenizer');
const tokenizerNode = require('@google/genai/tokenizer/node');
const vertex = require('@google/genai/vertex_internal');

assert.equal(root.GoogleGenAI, node.GoogleGenAI);
assert.equal(typeof web.GoogleGenAI, 'function');
assert.equal(typeof tokenizer.LocalTokenizer, 'function');
assert.equal(tokenizer.LocalTokenizer, tokenizerNode.LocalTokenizer);
assert.ok(Object.keys(vertex).length > 0);
`,
  );

  await write(
    join(temporaryRoot, 'runtime-browser.mjs'),
    `import assert from 'node:assert/strict';
import {GoogleGenAI as RootGoogleGenAI} from '@google/genai';
import {GoogleGenAI as WebGoogleGenAI} from '@google/genai/web';

assert.equal(RootGoogleGenAI, WebGoogleGenAI);
`,
  );

  await write(
    join(temporaryRoot, 'runtime-browser.cjs'),
    `const assert = require('node:assert/strict');
const {GoogleGenAI: RootGoogleGenAI} = require('@google/genai');
const {GoogleGenAI: WebGoogleGenAI} = require('@google/genai/web');

assert.equal(RootGoogleGenAI, WebGoogleGenAI);
`,
  );

  await write(
    join(temporaryRoot, 'runtime-exports-boundary.mjs'),
    `import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);

await assert.rejects(
  () => import('@google/genai/dist/esm/models.js'),
  {code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'},
);
assert.throws(
  () => require('@google/genai/dist/commonjs/models.js'),
  {code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'},
);
`,
  );

  await write(
    join(temporaryRoot, 'tokenizer-registration.mjs'),
    `import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import protobuf from 'protobufjs/minimal.js';

const packageRoot = ${JSON.stringify(packageRoot)};
const generated = await import(pathToFileURL(
  packageRoot + '/dist/esm/cross/sentencepiece/sentencepiece_model.pb.js',
));
const processorModule = await import(pathToFileURL(
  packageRoot + '/dist/esm/cross/sentencepiece/_processor.js',
));

assert.equal(protobuf.roots.default.sentencepiece, generated.sentencepiece);

const model = generated.sentencepiece.ModelProto.create({
  pieces: [{piece: '<unk>', score: 0, type: 2}],
  trainerSpec: {modelType: 2, unkId: 0},
});
const bytes = generated.sentencepiece.ModelProto.encode(model).finish();
const processor = new processorModule.SentencePieceProcessor(bytes);
assert.ok(processor);
`,
  );

  const typeImports = `import {GoogleGenAI, mcpToTool} from '@google/genai';
import * as node from '@google/genai/node';
import * as web from '@google/genai/web';
import {LocalTokenizer} from '@google/genai/tokenizer';
import * as tokenizerNode from '@google/genai/tokenizer/node';
import * as vertex from '@google/genai/vertex_internal';

void GoogleGenAI;
void mcpToTool;
void node;
void web;
void LocalTokenizer;
void tokenizerNode;
void vertex;
`;

  await write(join(temporaryRoot, 'consumer.mts'), typeImports);
  await write(join(temporaryRoot, 'consumer.cts'), typeImports);
  await write(
    join(temporaryRoot, 'tsconfig.modern.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'es2022',
          module: 'nodenext',
          moduleResolution: 'nodenext',
          strict: true,
          // google-auth-library@10.5.0 has an independent NodeNext declaration
          // error where its CJS declarations import the ESM gtoken branch. This
          // check exercises our format routing without re-linting dependency
          // declarations; the no-peer and legacy checks below remain strict.
          skipLibCheck: true,
          noEmit: true,
          types: ['node'],
          lib: ['es2022', 'dom', 'dom.iterable'],
        },
        include: ['consumer.mts', 'consumer.cts'],
      },
      null,
      2,
    )}\n`,
  );

  // The no-peer consumer reuses the shared fixture so this harness and
  // test_packaging.sh verify the same contract.
  const noPeerFixture = resolve(
    repositoryRoot,
    'test/packaging/no-optional-deps',
  );
  const noPeerDirectory = join(temporaryRoot, 'no-peer');
  await mkdir(noPeerDirectory, {recursive: true});
  for (const filename of ['index.ts', 'tsconfig.json']) {
    await copyFile(
      join(noPeerFixture, filename),
      join(noPeerDirectory, filename),
    );
  }

  await write(
    join(temporaryRoot, 'legacy.ts'),
    `import {GoogleGenAI} from '@google/genai';
import * as node from '@google/genai/node';
import * as web from '@google/genai/web';

void GoogleGenAI;
void node;
void web;
`,
  );
  await write(
    join(temporaryRoot, 'tsconfig.legacy.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'es2020',
          module: 'commonjs',
          moduleResolution: 'node10',
          strict: true,
          skipLibCheck: false,
          noEmit: true,
          types: ['node'],
          lib: ['es2020', 'dom', 'dom.iterable'],
        },
        include: ['legacy.ts'],
      },
      null,
      2,
    )}\n`,
  );

  run(process.execPath, ['runtime-esm.mjs']);
  run(process.execPath, ['runtime-cjs.cjs']);
  run(process.execPath, ['--conditions=browser', 'runtime-browser.mjs']);
  run(process.execPath, ['--conditions=browser', 'runtime-browser.cjs']);
  run(process.execPath, ['runtime-exports-boundary.mjs']);
  run(process.execPath, ['tokenizer-registration.mjs']);

  const tsc = resolve(repositoryRoot, 'node_modules/.bin/tsc');
  run(tsc, ['-p', 'tsconfig.modern.json']);
  run(tsc, ['-p', join(noPeerDirectory, 'tsconfig.json')]);
  run(tsc, ['-p', 'tsconfig.legacy.json']);
  assertLegacyResolutions(join(temporaryRoot, 'legacy.ts'));

  console.log(
    JSON.stringify(
      {
        tarball: {
          entryCount: packResult.entryCount,
          packedBytes: packResult.size,
          unpackedBytes: packResult.unpackedSize,
        },
        checks: [
          'tarball contents: allowlisted and required entries',
          'publint on the extracted tarball',
          'attw (node16 profile) on the tarball',
          'ESM runtime: all six exports',
          'CommonJS runtime: all six exports',
          'browser condition: ESM and CommonJS',
          'closed exports map: ESM and CommonJS deep imports rejected',
          'format-specific TypeScript declarations without optional MCP peer',
          'legacy Node10-style root/node/web exact declaration targets',
          'packed SentencePiece registration and model decode',
        ],
      },
      null,
      2,
    ),
  );
} finally {
  await rm(temporaryRoot, {recursive: true, force: true});
}
