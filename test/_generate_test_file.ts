/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export async function createZeroFilledTempFile(size: number): Promise<string> {
  if (size < 0) {
    throw new Error('Size must be non-negative.');
  }

  const tempFilePath = path.join(os.tmpdir(), `temp-${Math.random()}.txt`);
  const chunkSize = Math.min(size, 1024 * 1024); // 1MB chunk size

  const fileHandle = await fs.promises.open(tempFilePath, 'w');

  try {
    const buffer = new Uint8Array(chunkSize);
    let remainingSize = size;

    while (remainingSize > 0) {
      const writeSize = Math.min(remainingSize, chunkSize);
      await fileHandle.write(buffer, 0, writeSize);
      remainingSize -= writeSize;
    }

    return tempFilePath;
  } finally {
    await fileHandle.close();
  }
}
