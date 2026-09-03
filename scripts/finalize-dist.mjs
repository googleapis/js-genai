/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Completes artifacts that the two plain `tsc` passes do not emit: per-tree
 * module-format markers and the generated SentencePiece JavaScript/declaration
 * pair, including a CommonJS-transpiled copy of the generated JavaScript.
 */

import {copyFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import ts from 'typescript';

const formatTrees = [
  {directory: 'dist/esm', type: 'module', transpileGeneratedJs: false},
  {
    directory: 'dist/commonjs',
    type: 'commonjs',
    transpileGeneratedJs: true,
  },
];

const generatedJavaScript = 'sentencepiece_model.pb.js';
const generatedDeclaration = 'sentencepiece_model.pb.d.ts';

for (const {directory, type, transpileGeneratedJs} of formatTrees) {
  await writeFile(
    resolve(directory, 'package.json'),
    `${JSON.stringify({type}, null, 2)}\n`,
  );

  for (const filename of [generatedJavaScript, generatedDeclaration]) {
    const source = resolve('src/cross/sentencepiece', filename);
    const destination = resolve(directory, 'cross/sentencepiece', filename);
    await mkdir(dirname(destination), {recursive: true});

    if (filename === generatedJavaScript && transpileGeneratedJs) {
      const sourceText = await readFile(source, 'utf8');
      const result = ts.transpileModule(sourceText, {
        fileName: filename,
        compilerOptions: {
          esModuleInterop: true,
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2017,
        },
        reportDiagnostics: true,
      });

      if (result.diagnostics?.length) {
        throw new Error(
          ts.formatDiagnosticsWithColorAndContext(result.diagnostics, {
            getCanonicalFileName: (name) => name,
            getCurrentDirectory: () => process.cwd(),
            getNewLine: () => '\n',
          }),
        );
      }

      await writeFile(destination, result.outputText);
    } else {
      await copyFile(source, destination);
    }
  }
}
