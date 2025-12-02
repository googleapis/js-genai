/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleAuth, GoogleAuthOptions} from 'google-auth-library';

import {GOOGLE_API_KEY_HEADER, NodeAuth} from '../../../src/node/_node_auth.js';

const REQUIRED_VERTEX_AI_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform';

const AUTHORIZATION_HEADER = 'Authorization';

describe('NodeAuth', () => {
  it('should throw an error if the scopes do not include the required scope when custom scopes are provided', () => {
    const customScope = 'https://www.googleapis.com/auth/other-scope';
    const authOptions: GoogleAuthOptions = {scopes: [customScope]};
    expect(() => new NodeAuth({googleAuthOptions: authOptions})).toThrowError(
      `Invalid auth scopes. Scopes must include: ${REQUIRED_VERTEX_AI_SCOPE}`,
    );
  });
});

interface NodeAuthWithGoogleAuth {
  googleAuth: jasmine.SpyObj<GoogleAuth>;
}

describe('addAuthHeaders', () => {
  let googleAuthMock: jasmine.SpyObj<GoogleAuth>;
  const mockUrl = 'https://www.googleapis.com/';

  beforeEach(() => {
    googleAuthMock = jasmine.createSpyObj('GoogleAuth', ['getRequestHeaders']);
  });

  it('should add an auth request headers if it does not already exist', async () => {
    const nodeAuth = new NodeAuth({});
    (nodeAuth as unknown as NodeAuthWithGoogleAuth).googleAuth = googleAuthMock; // Inject the mock
    // google-auth-library returns an iterable (Map or Headers-like object)
    const mockHeaders = new Map([
      ['foo', '1'],
      ['bar', '2'],
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    googleAuthMock.getRequestHeaders.and.resolveTo(mockHeaders as any);
    const headers = new Headers();

    await nodeAuth.addAuthHeaders(headers, mockUrl);

    expect(headers.get('foo')).toBe('1');
    expect(headers.get('bar')).toBe('2');
    expect(googleAuthMock.getRequestHeaders).toHaveBeenCalledWith(mockUrl);
  });

  it('should not add an Authorization header if it already exists', async () => {
    const nodeAuth = new NodeAuth({});
    (nodeAuth as unknown as NodeAuthWithGoogleAuth).googleAuth = googleAuthMock; // Inject the mock
    // google-auth-library returns an iterable (Map or Headers-like object)
    const mockHeaders = new Map();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    googleAuthMock.getRequestHeaders.and.resolveTo(mockHeaders as any);
    const headers = new Headers();
    headers.append(AUTHORIZATION_HEADER, 'Existing Token');

    await nodeAuth.addAuthHeaders(headers, mockUrl);

    expect(headers.get(AUTHORIZATION_HEADER)).toBe('Existing Token');
  });

  it('should add an x-goog-api-key header if apiKey is provided', async () => {
    const apiKey = 'test-api-key';
    const nodeAuth = new NodeAuth({apiKey: apiKey});
    (nodeAuth as unknown as NodeAuthWithGoogleAuth).googleAuth = googleAuthMock; // Inject the mock
    // google-auth-library returns an iterable (Map or Headers-like object)
    const mockHeaders = new Map([['foo', '1']]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    googleAuthMock.getRequestHeaders.and.resolveTo(mockHeaders as any);
    const headers = new Headers();

    await nodeAuth.addAuthHeaders(headers, mockUrl);

    expect(headers.get(GOOGLE_API_KEY_HEADER)).toBe(apiKey);
  });

  it('should not add an x-goog-api-key header if it already exists', async () => {
    const apiKey = 'test-api-key';
    const nodeAuth = new NodeAuth({apiKey: apiKey});
    (nodeAuth as unknown as NodeAuthWithGoogleAuth).googleAuth = googleAuthMock; // Inject the mock
    // google-auth-library returns an iterable (Map or Headers-like object)
    const mockHeaders = new Map([['foo', '1']]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    googleAuthMock.getRequestHeaders.and.resolveTo(mockHeaders as any);
    const headers = new Headers();
    headers.append(GOOGLE_API_KEY_HEADER, 'Existing Key');

    await nodeAuth.addAuthHeaders(headers, mockUrl);

    expect(headers.get(GOOGLE_API_KEY_HEADER)).toBe('Existing Key');
  });

  it('should not call googleAuth.getRequestHeaders if apiKey is provided', async () => {
    const apiKey = 'test-api-key';
    const nodeAuth = new NodeAuth({apiKey: apiKey});
    (nodeAuth as unknown as NodeAuthWithGoogleAuth).googleAuth = googleAuthMock; // Inject the mock
    const headers = new Headers();

    await nodeAuth.addAuthHeaders(headers, mockUrl);

    expect(googleAuthMock.getRequestHeaders).not.toHaveBeenCalled();
  });

  it('should not add any auth headers when skipAuth is true', async () => {
    const nodeAuth = new NodeAuth({skipAuth: true});
    const headers = new Headers();
    headers.append('Authorization', 'Bearer custom-token');

    await nodeAuth.addAuthHeaders(headers, mockUrl);

    // Custom header should remain unchanged, no Google auth headers added
    expect(headers.get('Authorization')).toBe('Bearer custom-token');
    expect(headers.get(GOOGLE_API_KEY_HEADER)).toBeNull();
  });

  it('should not initialize googleAuth when skipAuth is true', () => {
    const nodeAuth = new NodeAuth({skipAuth: true});
    expect((nodeAuth as unknown as NodeAuthWithGoogleAuth).googleAuth).toBeUndefined();
  });

  it('should not throw when skipAuth is true even without credentials', async () => {
    const nodeAuth = new NodeAuth({skipAuth: true});
    const headers = new Headers();

    // This should not throw because skipAuth skips all auth logic
    await expectAsync(nodeAuth.addAuthHeaders(headers, mockUrl)).toBeResolved();
  });
});
