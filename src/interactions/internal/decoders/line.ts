/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { concatBytes, decodeUTF8, encodeUTF8 } from '../utils/bytes.js';

export type Bytes = string | ArrayBuffer | Uint8Array | null | undefined;

/**
 * A re-implementation of httpx's `LineDecoder` in Python that handles incrementally
 * reading lines from text.
 *
 * https://github.com/encode/httpx/blob/920333ea98118e9cf617f246905d7b202510941c/httpx/_decoders.py#L258
 */
export class LineDecoder {
  private decoder: TextDecoder = new TextDecoder();
  private chunks: Uint8Array[] = [];
  private totalLength: number = 0;

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

    while (chunkOffset < binaryChunk.length) {
      const newlineIndex = binaryChunk.indexOf(0x0a, chunkOffset); // \n
      const carriageIndex = binaryChunk.indexOf(0x0d, chunkOffset); // \r
      
      let index = -1;
      let skip = 1;

      if (newlineIndex !== -1 && (carriageIndex === -1 || newlineIndex < carriageIndex)) {
        index = newlineIndex;
      } else if (carriageIndex !== -1) {
        index = carriageIndex;
        // Check if this is \r\n
        if (index + 1 < binaryChunk.length) {
          if (binaryChunk[index + 1] === 0x0a) {
            skip = 2;
          }
        } else {
          // \r at the very end of the chunk. 
          // We must wait for the next chunk to see if it's followed by \n.
          // For simplicity in this O(N) path, we'll just treat it as a line end
          // and the next \n (if any) will be an empty line.
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
      lines.push(line);
      chunkOffset = index + skip;
    }

    return lines;
  }

  flush(): string[] {
    if (this.totalLength === 0) {
      return [];
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
    return [line];
  }
}

/**
 * This function searches the buffer for the end patterns, (\r or \n)
 * and returns an object with the index preceding the matched newline and the
 * index after the newline char. `null` is returned if no new line is found.
 *
 * ```ts
 * findNewLineIndex('abc\ndef') -> { preceding: 2, index: 3 }
 * ```
 */
function findNewlineIndex(
  buffer: Uint8Array,
  startIndex: number | null,
): { preceding: number; index: number; carriage: boolean } | null {
  const newline = 0x0a; // \n
  const carriage = 0x0d; // \r

  const start = startIndex ?? 0;
  const nextNewline = buffer.indexOf(newline, start);
  const nextCarriage = buffer.indexOf(carriage, start);

  if (nextNewline === -1 && nextCarriage === -1) {
    return null;
  }

  let i: number;
  if (nextNewline !== -1 && nextCarriage !== -1) {
    i = Math.min(nextNewline, nextCarriage);
  } else {
    i = nextNewline !== -1 ? nextNewline : nextCarriage;
  }

  if (buffer[i] === newline) {
    return { preceding: i, index: i + 1, carriage: false };
  }

  return { preceding: i, index: i + 1, carriage: true };
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
