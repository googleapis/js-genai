/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIUserAbortError,
  ApiError,
  AuthenticationError,
  BadRequestError,
  ConflictError,
  GeminiNextGenAPIClientError,
  InteractionsAPIError,
  InternalServerError,
  NotFoundError,
  PermissionDeniedError,
  RateLimitError,
  UnprocessableEntityError,
} from '../../src/errors.js';
import * as compatErrors from '../../src/gaos/lib/compat-errors.js';
import {GoogleGenAiError} from '../../src/gaos/models/errors/index.js';
import * as rootIndex from '../../src/index.js';

describe('errors', () => {
  const headers = new Headers({'content-type': 'application/json'});

  describe('ApiError instanceof', () => {
    it('matches GAOS 4xx/5xx InteractionsAPIError instances', () => {
      const httpErrors: InteractionsAPIError[] = [
        new BadRequestError(400, undefined, 'bad', headers),
        new AuthenticationError(401, undefined, 'unauth', headers),
        new PermissionDeniedError(403, undefined, 'forbidden', headers),
        new NotFoundError(404, undefined, 'missing', headers),
        new ConflictError(409, undefined, 'conflict', headers),
        new UnprocessableEntityError(422, undefined, 'unprocessable', headers),
        new RateLimitError(429, undefined, 'rate limit', headers),
        new InternalServerError(503, undefined, 'unavailable', headers),
        new InteractionsAPIError(418, undefined, 'teapot', headers),
      ];
      for (const err of httpErrors) {
        expect(err instanceof ApiError)
          .withContext(`${err.name} (${err.status})`)
          .toBeTrue();
      }
    });

    it('does not match GAOS errors without an HTTP error status', () => {
      const nonHttpErrors: unknown[] = [
        new InteractionsAPIError(200, undefined, 'ok', headers),
        new InteractionsAPIError(302, undefined, 'redirect', headers),
        new APIConnectionError({message: 'offline'}),
        new APIConnectionTimeoutError(),
        new APIUserAbortError(),
        new GeminiNextGenAPIClientError('client'),
        new Error('plain'),
        undefined,
        null,
        {status: 400},
      ];
      for (const err of nonHttpErrors) {
        expect(err instanceof ApiError)
          .withContext(String(err))
          .toBeFalse();
      }
    });

    it('matches native ApiError instances, which are not InteractionsAPIError', () => {
      const nativeErr = new ApiError({message: 'native', status: 500});
      expect(nativeErr instanceof ApiError).toBeTrue();
      expect(nativeErr instanceof Error).toBeTrue();
      expect(nativeErr instanceof InteractionsAPIError).toBeFalse();
      expect(nativeErr.name).toBe('ApiError');
    });

    it('matches errors wrapped by wrapSDKError', () => {
      const body = '{"error":{"message":"invalid argument"}}';
      const sdkErr = new GoogleGenAiError('bad request', {
        request: new Request(
          'https://generativelanguage.googleapis.com/v1beta/triggers',
        ),
        response: new Response(body, {status: 400, headers}),
        body,
      });

      const wrapped = compatErrors.wrapSDKError(sdkErr);

      expect(wrapped instanceof BadRequestError).toBeTrue();
      expect(wrapped instanceof ApiError).toBeTrue();
    });

    it('installs Symbol.hasInstance as an own data property', () => {
      // Installed via Object.defineProperty (not a class static method) so
      // that the module also loads when compiled to ES5.
      const descriptor = Object.getOwnPropertyDescriptor(
        ApiError,
        Symbol.hasInstance,
      );
      expect(descriptor).toBeDefined();
      expect(typeof descriptor!.value).toBe('function');
      expect(descriptor!.writable).toBeTrue();
      expect(descriptor!.configurable).toBeTrue();
    });
  });

  describe('ApiError subclasses', () => {
    class SubApiError extends ApiError {
      describe(): string {
        return `SubApiError(${this.status})`;
      }
    }

    it('keep default prototype-chain instanceof semantics', () => {
      const sub = new SubApiError({message: 'sub', status: 400});
      expect(sub instanceof SubApiError).toBeTrue();
      expect(sub instanceof ApiError).toBeTrue();

      expect(
        new ApiError({message: 'native', status: 400}) instanceof SubApiError,
      ).toBeFalse();
      expect(
        new BadRequestError(400, undefined, 'bad', headers) instanceof
          SubApiError,
      ).toBeFalse();
    });

    it('keep methods defined on the subclass', () => {
      const sub = new SubApiError({message: 'sub', status: 404});
      expect(Object.getPrototypeOf(sub)).toBe(SubApiError.prototype);
      expect(sub.describe()).toBe('SubApiError(404)');
    });
  });

  describe('GAOS APIError matched as ApiError', () => {
    it('keeps its own name and non-JSON message', () => {
      const err: unknown = new BadRequestError(
        400,
        {error: {code: 400, message: 'Invalid argument'}},
        'Invalid argument',
        headers,
      );

      expect(err instanceof ApiError).toBeTrue();
      if (!(err instanceof ApiError)) return;
      expect(err.status).toBe(400);
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toBe('400 Invalid argument');
      expect(() => JSON.parse(err.message) as unknown).toThrow();
    });
  });

  describe('exports', () => {
    it('re-exports the shared classes from compat-errors', () => {
      expect(compatErrors.GeminiNextGenAPIClientError).toBe(
        GeminiNextGenAPIClientError,
      );
      expect(compatErrors.APIError).toBe(InteractionsAPIError);
      expect(compatErrors.BadRequestError).toBe(BadRequestError);
      expect(compatErrors.AuthenticationError).toBe(AuthenticationError);
      expect(compatErrors.PermissionDeniedError).toBe(PermissionDeniedError);
      expect(compatErrors.NotFoundError).toBe(NotFoundError);
      expect(compatErrors.ConflictError).toBe(ConflictError);
      expect(compatErrors.UnprocessableEntityError).toBe(
        UnprocessableEntityError,
      );
      expect(compatErrors.RateLimitError).toBe(RateLimitError);
      expect(compatErrors.InternalServerError).toBe(InternalServerError);
      expect(compatErrors.APIConnectionError).toBe(APIConnectionError);
      expect(compatErrors.APIConnectionTimeoutError).toBe(
        APIConnectionTimeoutError,
      );
      expect(compatErrors.APIUserAbortError).toBe(APIUserAbortError);
    });

    it('exports InteractionsAPIError (not APIError) from the package root', () => {
      expect(rootIndex.ApiError).toBe(ApiError);
      expect(rootIndex.GeminiNextGenAPIClientError).toBe(
        GeminiNextGenAPIClientError,
      );
      expect(rootIndex.InteractionsAPIError).toBe(InteractionsAPIError);
      expect('APIError' in rootIndex).toBeFalse();
      expect(InteractionsAPIError.name).toBe('APIError');
      expect(rootIndex.BadRequestError).toBe(BadRequestError);
      expect(rootIndex.AuthenticationError).toBe(AuthenticationError);
      expect(rootIndex.PermissionDeniedError).toBe(PermissionDeniedError);
      expect(rootIndex.NotFoundError).toBe(NotFoundError);
      expect(rootIndex.ConflictError).toBe(ConflictError);
      expect(rootIndex.UnprocessableEntityError).toBe(UnprocessableEntityError);
      expect(rootIndex.RateLimitError).toBe(RateLimitError);
      expect(rootIndex.InternalServerError).toBe(InternalServerError);
      expect(rootIndex.APIConnectionError).toBe(APIConnectionError);
      expect(rootIndex.APIConnectionTimeoutError).toBe(
        APIConnectionTimeoutError,
      );
      expect(rootIndex.APIUserAbortError).toBe(APIUserAbortError);
    });
  });
});
