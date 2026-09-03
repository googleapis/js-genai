/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {readdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

/**
 * This script adds '// @ts-ignore' before the `@modelcontextprotocol/sdk` type imports
 * in the emitted .d.ts files.
 *
 * As the `@modelcontextprotocol/sdk` is an optional peer dependency, it may not be
 * available when the project is built or executed.
 *
 * As we only do type imports from the mcp pacakge, this is not an issue for the
 * javascript code. However typescript packages using @google/genai without
 * the mcp package may hit a compile if error the package imported from our .d.ts
 * file cannot be resolved. We ignore that error, resulting in the imported type
 * being any.
 *
 * If our user is calling `mcpToTool` and providing us with an McpClient, it should
 * mean they had a way to instantiate it, which means they depend on the mcp package.
 *
 * If our users don't depend on the mcp package they shouldn't be able to create an McpClient
 * object, and therefore they shouldn't have a reason to invoke `mcpToTool`.
 *
 * We are giving up on some type safety in the case the mcp package isn't used, if a
 * user invokes `mcpToTool` without installing the mcp package, they may run into a
 * runtime error.
 */

const declarationRoots = ['dist/esm', 'dist/commonjs'];
// Produced by tooling outside this repository (Google-internal builds);
// annotated when present, skipped otherwise, and excluded from the count
// invariant below.
const externalDeclarations = ['dist-private/index.d.ts'];
// Two imports survive in each format tree: one in _transformers.d.ts and one
// in mcp/_mcp.d.ts. The source-only Tool import in _mcp.ts is elided because
// it does not appear in that module's declaration surface.
const expectedImportCount = 4;
const optionalPeerImport =
  /^(import type .* from ['"]@modelcontextprotocol\/sdk(?:\/[^'"]+)?['"];?)$/gm;
const ignoreComment =
  '// @ts-ignore -- @modelcontextprotocol/sdk is an optional peer dependency';

async function listDeclarations(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  const declarations = [];

  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      declarations.push(...(await listDeclarations(path)));
    } else if (entry.name.endsWith('.d.ts')) {
      declarations.push(path);
    }
  }

  return declarations;
}

async function annotate(path) {
  const declaration = await readFile(path, 'utf8');
  const imports = declaration.match(optionalPeerImport) ?? [];

  if (imports.length > 0) {
    const updatedDeclaration = declaration.replace(
      optionalPeerImport,
      `${ignoreComment}\n$1`,
    );
    await writeFile(path, updatedDeclaration);
  }

  return imports.length;
}

let importCount = 0;

for (const root of declarationRoots) {
  for (const path of await listDeclarations(resolve(root))) {
    importCount += await annotate(path);
  }
}

for (const externalPath of externalDeclarations) {
  try {
    await annotate(resolve(externalPath));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    console.warn(`File not found: ${externalPath}. Skipping.`);
  }
}

if (importCount !== expectedImportCount) {
  throw new Error(
    `Expected ${expectedImportCount} optional MCP type imports, found ${importCount}. ` +
      'Review the emitted declarations and update this invariant deliberately.',
  );
}

console.log(`Annotated ${importCount} optional MCP type imports.`);
