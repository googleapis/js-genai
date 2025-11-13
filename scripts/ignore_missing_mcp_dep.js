/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * This script adds '// @ts-ignore' before the `@modelcontextprotocol/sdk` type imports
 * in the rolled up .d.ts files.
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

/**
 * The list of .d.ts file paths to process.
 */
const dtsFilePaths = [
  'dist/node/node.d.ts',
  'dist/web/web.d.ts',
  'dist/genai.d.ts',
  'dist-private/index.d.ts',
];

const targetImportLine =
  "import type { Client } from '@modelcontextprotocol/sdk/client/index.js';";

/**
 * Modifies a single file adding ts-ignore before the mcp import.
 *
 * @param {string} filePath The path to the file to modify.
 */
const processFile = (filePath) => {
  console.log(`Processing file: ${filePath}`);

  try {
    const rootDir = path.resolve(import.meta.dirname, '..');
    const absolutePath = path.resolve(rootDir, filePath);

    if (!fs.existsSync(absolutePath)) {
      console.warn(`File not found: ${absolutePath}. Skipping.`);
      return;
    }

    const fileContent = fs.readFileSync(absolutePath, 'utf8');

    if (fileContent.includes(targetImportLine)) {
      const replacementString = `// @ts-ignore\n${targetImportLine}`;

      const newContent = fileContent.replace(
        targetImportLine,
        replacementString,
      );

      fs.writeFileSync(absolutePath, newContent, 'utf8');
      console.log(`Successfully modified ${filePath}`);
    } else {
      console.log(
        `Target import line not found in ${filePath}. No changes made.`,
      );
    }
  } catch (error) {
    console.error(`An error occurred while processing ${filePath}:`, error);
  }
};

/**
 * Main function to run the script.
 */
const main = () => {
  console.log('Editing rolled up .d.ts files for optional type dependency...');
  dtsFilePaths.forEach(processFile);
};

main();
