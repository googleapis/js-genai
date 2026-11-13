/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Stream } from '../../src/interactions/core/streaming.js';

describe('TypeScript compat: Streaming', () => {
  it('imports Stream from interactions/core/streaming.js', () => {
    // In the Stainless SDK, Stream is importable from interactions/core/streaming.js
    // In the Speakeasy SDK, this path may not exist — EventStream is the replacement.
    expect(Stream).toBeDefined();
  });

  it('Stream has .tee() and .toReadableStream() methods', () => {
    // Stainless Stream has: .tee() -> [Stream, Stream] and .toReadableStream() -> ReadableStream
    // Speakeasy EventStream (extends ReadableStream) does NOT have these.
    expect(typeof Stream.prototype.tee).toBe('function');
    expect(typeof Stream.prototype.toReadableStream).toBe('function');
  });
});
