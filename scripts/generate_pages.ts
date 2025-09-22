/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {execSync} from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const HEADER = `/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

`;

/**
 * Executes a shell command synchronously and inherits stdio.
 *
 * @param command The command string to execute.
 * @param cwd The working directory for the command (optional).
 */
function runCommand(command: string, cwd?: string): void {
  console.log(`Executing: ${command}`);
  try {
    execSync(command, {stdio: 'inherit', cwd});
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

function addHeader(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.startsWith(HEADER)) {
    return;
  }
  fs.writeFileSync(filePath, HEADER + content);
}

function addHeaders(directory: string) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      addHeaders(filePath);
    } else if (filePath.endsWith('.js')) {
      addHeader(filePath);
    }
  }
}

/**
 * Generates documentation using TypeDoc and adds license headers.
 *
 * @param targetDir The directory where documentation should be generated.
 * @param gitRevision The git revision (branch or tag) to use for TypeDoc.
 */
function generateDocs(targetDir: string, gitRevision: string): void {
  console.log(`--- Starting Documentation Generation for: ${targetDir} ---`);

  console.log(`[1/2] Generating documentation into '${targetDir}'...`);
  runCommand(`npx typedoc --out "${targetDir}" --gitRevision "${gitRevision}"`);

  console.log(`[2/2] Adding license headers to '${targetDir}'...`);
  addHeaders(targetDir);

  console.log(`--- Documentation Generation for ${targetDir} Complete ---`);
}

/**
 * Reads the release version from the manifest file.
 *
 * @returns The release version string.
 */
function getReleaseVersion(): string {
  const manifestPath = '.release-please-manifest.json';
  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifestData = JSON.parse(manifestContent);

    const version = manifestData['.'] || Object.values(manifestData)[0];

    if (typeof version === 'string') {
      return version;
    } else {
      console.error(
        `Error: Could not find a valid version string in ${manifestPath}`,
      );
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error reading or parsing ${manifestPath}:`);
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// --- Script Entry Point ---
function main() {
  const versionArg = process.argv[2] || 'main';

  console.log(`Selected version type: ${versionArg}`);

  switch (versionArg) {
    case 'main': {
      generateDocs('main_docs', 'main');
      break;
    }
    case 'release': {
      const releaseVersion = getReleaseVersion();
      console.log(`Current release version: ${releaseVersion}`);
      generateDocs('release_docs', `v${releaseVersion}`);
      break;
    }
    default: {
      console.error(
        `Error: Invalid version type '${versionArg}'. Please use 'main' or 'release'.`,
      );
      console.error(
        `Usage: ts-node ${path.basename(__filename)} [main|release]`,
      );
      process.exit(1);
    }
  }
}

try {
  main();
} catch (error) {
  console.error('An unexpected error occurred:');
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
}
