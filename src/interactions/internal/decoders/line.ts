/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { encodeUTF8 } from '../utils/bytes.js';

export type Bytes = string | ArrayBuffer | Uint8Array | null | undefined;

/**
 * A re-implementation of httpx's `LineDecoder` in Python that handles incrementally
 * reading lines from text.
 *
 * https://github.com/encode/httpx/blob/920333ea98118e9cf617f246905d7b202510941c/httpx/_decoders.py#L258
 */
export class LineDecoder {
  private decoder = new TextDecoder();
  private chunks: Uint8Array[] = [];
  private totalLength: number = 0;
  private pendingLine: string | null = null;

  constructor() {}

  decode(chunk: Bytes): string[] {
    if (chunk == null) {
      return [];
    }

    const binaryChunk =
      chunk instanceof Uint8Array ? chunk
      : chunk instanceof ArrayBuffer ? new Uint8Array(chunk)
      : typeof chunk === 'string' ? encodeUTF8(chunk)
      : chunk;

    const lines: string[] = [];
    let chunkOffset = 0;

    if (this.pendingLine !== null) {
      if (binaryChunk.length > 0) {
        if (binaryChunk[0] === 0x0a) {
          chunkOffset = 1;
        }
        lines.push(this.pendingLine);
        this.pendingLine = null;
      }
    }

    while (chunkOffset < binaryChunk.length) {
      const newlineIndex = binaryChunk.indexOf(0x0a, chunkOffset); // \n
      const carriageIndex = binaryChunk.indexOf(0x0d, chunkOffset); // \r

      let index = -1;
      let skip = 1;
      let isTrailingCR = false;

      if (newlineIndex !== -1 && (carriageIndex === -1 || newlineIndex < carriageIndex)) {
        index = newlineIndex;
      } else if (carriageIndex !== -1) {
        index = carriageIndex;
        if (index + 1 < binaryChunk.length) {
          if (binaryChunk[index + 1] === 0x0a) {
            skip = 2;
          }
        } else {
          isTrailingCR = true;
        }
      }

      if (index === -1) {
        // No more newlines in this chunk
        const remaining = binaryChunk.subarray(chunkOffset);
        this.chunks.push(remaining);
        this.totalLength += remaining.length;
        break;
      }

      // Found a line end
      const part = binaryChunk.subarray(chunkOffset, index);
      let line: string;
      if (this.chunks.length === 0) {
        line = this.decoder.decode(part, { stream: true });
      } else {
        const fullLine = new Uint8Array(this.totalLength + part.length);
        let offset = 0;
        for (const c of this.chunks) {
          fullLine.set(c, offset);
          offset += c.length;
        }
        fullLine.set(part, offset);
        line = this.decoder.decode(fullLine, { stream: true });
        this.chunks = [];
        this.totalLength = 0;
      }

      if (isTrailingCR) {
        this.pendingLine = line;
      } else {
        lines.push(line);
      }
      chunkOffset = index + skip;
    }

    return lines;
  }

  flush(): string[] {
    const lines: string[] = [];
    if (this.pendingLine !== null) {
      lines.push(this.pendingLine);
      this.pendingLine = null;
    }
    if (this.totalLength === 0) {
      return lines;
    }
    const fullLine = new Uint8Array(this.totalLength);
    let offset = 0;
    for (const c of this.chunks) {
      fullLine.set(c, offset);
      offset += c.length;
    }
    const line = this.decoder.decode(fullLine);
    this.chunks = [];
    this.totalLength = 0;
    lines.push(line);
    return lines;
  }
}

export function findDoubleNewlineIndex(buffer: Uint8Array, startIndex: number = 0): number {
  // This function searches the buffer for the end patterns (\r\r, \n\n, \r\n\r\n)
  // and returns the index right after the first occurrence of any pattern,
  // or -1 if none of the patterns are found.
  const newline = 0x0a; // \n
  const carriage = 0x0d; // \r

  let i = startIndex;
  while (i < buffer.length - 1) {
    const nextNewline = buffer.indexOf(newline, i);
    const nextCarriage = buffer.indexOf(carriage, i);

    if (nextNewline === -1 && nextCarriage === -1) {
      return -1;
    }

    let index: number;
    if (nextNewline !== -1 && nextCarriage !== -1) {
      index = Math.min(nextNewline, nextCarriage);
    } else {
      index = nextNewline !== -1 ? nextNewline : nextCarriage;
    }

    if (index >= buffer.length - 1) {
      return -1;
    }

    if (buffer[index] === newline && buffer[index + 1] === newline) {
      // \n\n
      return index + 2;
    }
    if (buffer[index] === carriage && buffer[index + 1] === carriage) {
      // \r\r
      return index + 2;
    }
    if (
      buffer[index] === carriage &&
      buffer[index + 1] === newline &&
      index + 3 < buffer.length &&
      buffer[index + 2] === carriage &&
      buffer[index + 3] === newline
    ) {
      // \r\n\r\n
      return index + 4;
    }
    i = index + 1;
  }

  return -1;
}
