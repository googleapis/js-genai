/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiError, ApiErrorInfo} from '../../src/errors.js';
import * as vertexInternal from '../../src/vertex_internal/index.js';

describe('ApiError', () => {
  it('should construct an ApiError with message, status, and Error inheritance', () => {
    const err = new ApiError({message: 'Service unavailable', status: 503});

    expect(err instanceof Error).toBeTrue();
    expect(err instanceof ApiError).toBeTrue();
    expect(err.name).toBe('ApiError');
    expect(err.message).toBe('Service unavailable');
    expect(err.status).toBe(503);
  });

  it('should recognize ApiError instances across independent class copies (ESM/CJS/bundles)', () => {
    const brandSymbol = Symbol.for('@google/genai.ApiError');

    class BundledCopyApiError extends Error {
      status: number;

      constructor(options: ApiErrorInfo) {
        super(options.message);
        this.name = 'ApiError';
        this.status = options.status;
        Object.defineProperty(this, brandSymbol, {
          value: true,
        });
        Object.setPrototypeOf(this, new.target.prototype);
      }

      static [Symbol.hasInstance](value: unknown): boolean {
        if (this !== BundledCopyApiError) {
          return Function.prototype[Symbol.hasInstance].call(this, value);
        }
        return (
          Function.prototype[Symbol.hasInstance].call(this, value) ||
          (typeof value === 'object' &&
            value !== null &&
            (value as Record<symbol, unknown>)[brandSymbol] === true)
        );
      }
    }

    const fromMain = new ApiError({message: 'from main', status: 429});
    const fromCopy = new BundledCopyApiError({
      message: 'from copy',
      status: 503,
    });

    expect(fromCopy instanceof ApiError).toBeTrue();
    expect(fromMain instanceof BundledCopyApiError).toBeTrue();
  });

  it('should return false for non-ApiError values and preserve subclass instanceof semantics', () => {
    class SubApiError extends ApiError {}

    const baseErr = new ApiError({message: 'base', status: 400});
    const subErr = new SubApiError({message: 'sub', status: 400});
    const plainErr = new Error('plain');

    expect(plainErr instanceof ApiError).toBeFalse();
    expect(
      ({name: 'ApiError', status: 500} as unknown) instanceof ApiError,
    ).toBeFalse();
    expect((null as unknown) instanceof ApiError).toBeFalse();
    expect((undefined as unknown) instanceof ApiError).toBeFalse();
    expect(('string' as unknown) instanceof ApiError).toBeFalse();

    expect(subErr instanceof ApiError).toBeTrue();
    expect(subErr instanceof SubApiError).toBeTrue();
    expect(baseErr instanceof SubApiError).toBeFalse();
  });

  it('should export ApiError from vertex_internal', () => {
    expect(vertexInternal.ApiError).toBe(ApiError);
  });
});
