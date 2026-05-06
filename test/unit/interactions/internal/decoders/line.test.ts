/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { findDoubleNewlineIndex, LineDecoder } from 'gemini-next-gen-api/internal/decoders/line';

function decodeChunks(chunks: string[], { flush }: { flush: boolean } = { flush: false }): string[] {
  const decoder = new LineDecoder();
  const lines: string[] = [];
  for (const chunk of chunks) {
    lines.push(...decoder.decode(chunk));
  }

  if (flush) {
    lines.push(...decoder.flush());
  }

  return lines;
}

describe('line decoder', () => {
  it('basic', () => {
    // baz is not included because the line hasn't ended yet
    expect(decodeChunks(['foo', ' bar\nbaz'])).toEqual(['foo bar']);
  });

  it('basic with \\r', () => {
    expect(decodeChunks(['foo', ' bar\r\nbaz'])).toEqual(['foo bar']);
    expect(decodeChunks(['foo', ' bar\r\nbaz'], { flush: true })).toEqual(['foo bar', 'baz']);
  });

  it('trailing new lines', () => {
    expect(decodeChunks(['foo', ' bar', 'baz\n', 'thing\n'])).toEqual(['foo barbaz', 'thing']);
  });

  it('trailing new lines with \\r', () => {
    expect(decodeChunks(['foo', ' bar', 'baz\r\n', 'thing\r\n'])).toEqual(['foo barbaz', 'thing']);
  });

  it('escaped new lines', () => {
    expect(decodeChunks(['foo', ' bar\\nbaz\n'])).toEqual(['foo bar\\nbaz']);
  });

  it('escaped new lines with \\r', () => {
    expect(decodeChunks(['foo', ' bar\\r\\nbaz\n'])).toEqual(['foo bar\\r\\nbaz']);
  });

  it('\\r & \\n split across multiple chunks', () => {
    expect(decodeChunks(['foo\r', '\n', 'bar'], { flush: true })).toEqual(['foo', 'bar']);
  });

  it('single \\r', () => {
    expect(decodeChunks(['foo\r', 'bar'], { flush: true })).toEqual(['foo', 'bar']);
  });

  it('double \\r', () => {
    expect(decodeChunks(['foo\r', 'bar\r'], { flush: true })).toEqual(['foo', 'bar']);
    expect(decodeChunks(['foo\r', '\r', 'bar'], { flush: true })).toEqual(['foo', '', 'bar']);
    // implementation detail that we don't yield the single \r line until a new \r or \n is encountered
    expect(decodeChunks(['foo\r', '\r', 'bar'], { flush: false })).toEqual(['foo']);
  });

  it('double \\r then \\r\\n', () => {
    expect(decodeChunks(['foo\r', '\r', '\r', '\n', 'bar', '\n'])).toEqual(['foo', '', '', 'bar']);
    expect(decodeChunks(['foo\n', '\n', '\n', 'bar', '\n'])).toEqual(['foo', '', '', 'bar']);
  });

  it('double newline', () => {
    expect(decodeChunks(['foo\n\nbar'], { flush: true })).toEqual(['foo', '', 'bar']);
    expect(decodeChunks(['foo', '\n', '\nbar'], { flush: true })).toEqual(['foo', '', 'bar']);
    expect(decodeChunks(['foo\n', '\n', 'bar'], { flush: true })).toEqual(['foo', '', 'bar']);
    expect(decodeChunks(['foo', '\n', '\n', 'bar'], { flush: true })).toEqual(['foo', '', 'bar']);
  });

  it('multi-byte characters across chunks', () => {
    const decoder = new LineDecoder();

    // bytes taken from the string 'известни' and arbitrarily split
    // so that some multi-byte characters span multiple chunks
    expect(decoder.decode(new Uint8Array([0xd0]))).toHaveLength(0);
    expect(decoder.decode(new Uint8Array([0xb8, 0xd0, 0xb7, 0xd0]))).toHaveLength(0);
    expect(
      decoder.decode(new Uint8Array([0xb2, 0xd0, 0xb5, 0xd1, 0x81, 0xd1, 0x82, 0xd0, 0xbd, 0xd0, 0xb8])),
    ).toHaveLength(0);

    const decoded = decoder.decode(new Uint8Array([0xa]));
    expect(decoded).toEqual(['известни']);
  });

  it('flushing trailing newlines', () => {
    expect(decodeChunks(['foo\n', '\nbar'], { flush: true })).toEqual(['foo', '', 'bar']);
  });

  it('flushing empty buffer', () => {
    expect(decodeChunks([], { flush: true })).toEqual([]);
  });
});

describe('findDoubleNewlineIndex', () => {
  it('finds \\n\\n', () => {
    expect(findDoubleNewlineIndex(new TextEncoder().encode('foo\n\nbar'))).toBe(5);
    expect(findDoubleNewlineIndex(new TextEncoder().encode('\n\nbar'))).toBe(2);
    expect(findDoubleNewlineIndex(new TextEncoder().encode('foo\n\n'))).toBe(5);
    expect(findDoubleNewlineIndex(new TextEncoder().encode('\n\n'))).toBe(2);
  });

  it('finds \\r\\r', () => {
    expect(findDoubleNewlineIndex(new TextEncoder().encode('foo\r\rbar'))).toBe(5);
    expect(findDoubleNewlineIndex(new TextEncoder().encode('\r\rbar'))).toBe(2);
    expect(findDoubleNewlineIndex(new TextEncoder().encode('foo\r\r'))).toBe(5);
    expect(findDoubleNewlineIndex(new TextEncoder().encode('\r\r'))).toBe(2);
  });

  it('finds \\r\\n\\r\\n', () => {
    expect(findDoubleNewlineIndex(new TextEncoder().encode('foo\r\n\r\nbar'))).toBe(7);
    expect(findDoubleNewlineIndex(new TextEncoder().encode('\r\n\r\nbar'))).toBe(4);
    expect(findDoubleNewlineIndex(new TextEncoder().encode('foo\r\n\r\n'))).toBe(7);
    expect(findDoubleNewlineIndex(new TextEncoder().encode('\r\n\r\n'))).toBe(4);
  });

  it('returns -1 when no double newline found', () => {
    expect(findDoubleNewlineIndex(new TextEncoder().encode('foo\nbar'))).toBe(-1);
    expect(findDoubleNewlineIndex(new TextEncoder().encode('foo\rbar'))).toBe(-1);
    expect(findDoubleNewlineIndex(new TextEncoder().encode('foo\r\nbar'))).toBe(-1);
    expect(findDoubleNewlineIndex(new TextEncoder().encode(''))).toBe(-1);
  });

  it('handles incomplete patterns', () => {
    expect(findDoubleNewlineIndex(new TextEncoder().encode('foo\r\n\r'))).toBe(-1);
    expect(findDoubleNewlineIndex(new TextEncoder().encode('foo\r\n'))).toBe(-1);
  });
});
