/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';

const header = `/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

`;

function addHeader(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
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

const docsDir = path.join(__dirname, '..', 'docs');
processDirectory(docsDir);
