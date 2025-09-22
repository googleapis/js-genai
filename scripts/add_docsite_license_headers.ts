/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';

const header = `/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

`;

function addHeader(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.startsWith(header)) {
    return;
  }
  fs.writeFileSync(filePath, header + content);
}

function processDirectory(directory: string) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (filePath.endsWith('.js')) {
      addHeader(filePath);
    }
  }
}

const main = () => {
  const targetDirName: string = process.argv[2] || 'docs';
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const docsDir = path.join(__dirname, '..', targetDirName);
  processDirectory(docsDir);
};

main();
