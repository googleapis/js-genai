/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {once} from 'node:events';
import {createServer, type IncomingHttpHeaders} from 'node:http';

import {GoogleGenAI} from '../../src/client.js';

describe('Environments Lifecycle', () => {
  it('routes through Google GenAI client', async () => {
    const captured: string[] = [];
    const capturedBodies: unknown[] = [];
    const server = createServer((request, response) => {
      captured.push(`${request.method} ${request.url}`);
      let body = '';
      request.on('data', (chunk) => {
        body += chunk;
      });
      request.on('end', () => {
        if (body) {
          try {
            capturedBodies.push(JSON.parse(body));
          } catch {
            capturedBodies.push(body);
          }
        }
        response.setHeader('content-type', 'application/json');
        response.end(
          JSON.stringify({
            id: 'env_abc_123',
            created: '2026-07-22T15:18:38Z',
            updated: '2026-07-22T15:18:38Z',
            status: 'active',
            sources: [
              {
                type: 'INLINE',
                content: 'print("hello")',
                target: 'main.py',
              },
            ],
          }),
        );
      });
    });

    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    const address = server.address();
    expect(address).toBeDefined();
    expect(typeof address).toBe('object');
    if (!address || typeof address !== 'object') {
      server.close();
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: 'test-api-key',
      httpOptions: {
        apiVersion: 'v1beta',
        baseUrl: `http://127.0.0.1:${address.port}`,
      },
    });

    try {
      const environment = await ai.environments.create({
        sources: [
          {
            type: 'INLINE',
            content: 'print("hello")',
            target: 'main.py',
          },
        ],
      });
      const copiedEnvironment = await ai.environments.create({
        from_environment: 'environments/env_abc_123',
      });
      await ai.environments.list();
      const fetched = await ai.environments.get('env_abc_123');
      await ai.environments.delete('env_abc_123');

      expect(environment.id).toBe('env_abc_123');
      expect(copiedEnvironment.id).toBe('env_abc_123');
      expect(fetched.id).toBe('env_abc_123');
      expect(captured).toEqual([
        'POST /v1beta/environments',
        'POST /v1beta/environments',
        'GET /v1beta/environments',
        'GET /v1beta/environments/env_abc_123',
        'DELETE /v1beta/environments/env_abc_123',
      ]);
      expect(capturedBodies[0]).toEqual({
        sources: [
          {
            type: 'INLINE',
            content: 'print("hello")',
            target: 'main.py',
          },
        ],
      });
      expect(capturedBodies[1]).toEqual({
        from_environment: 'environments/env_abc_123',
      });
    } finally {
      server.close();
      await once(server, 'close');
    }
  });

  it('routes environment files requests through Google GenAI client', async () => {
    const captured: string[] = [];
    const server = createServer((request, response) => {
      captured.push(`${request.method} ${request.url}`);
      response.setHeader('content-type', 'application/json');
      response.end(
        JSON.stringify({
          files: [
            {
              name: 'main.py',
              path: 'workspace/main.py',
              type: 'FILE',
              size_bytes: '123',
            },
          ],
        }),
      );
    });

    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    const address = server.address();
    expect(address).toBeDefined();
    expect(typeof address).toBe('object');
    if (!address || typeof address !== 'object') {
      server.close();
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: 'test-api-key',
      httpOptions: {
        apiVersion: 'v1beta',
        baseUrl: `http://127.0.0.1:${address.port}`,
      },
    });

    try {
      const res = await ai.environments.files.list({
        environment: 'env_abc_123',
        path: 'main.py',
      });
      expect(res.files?.[0]?.name).toBe('main.py');

      const listRes = await ai.environments.files.list({
        environment: 'env_abc_123',
        path: 'src/',
        recursive: true,
      });
      expect(listRes.files?.[0]?.name).toBe('main.py');

      expect(captured).toEqual([
        'GET /v1beta/environments/env_abc_123/files/main.py',
        'GET /v1beta/environments/env_abc_123/files/src%2F?recursive=true',
      ]);
    } finally {
      server.close();
      await once(server, 'close');
    }
  });

  it('downloads environment files through Google GenAI client', async () => {
    const captured: string[] = [];
    const server = createServer((request, response) => {
      captured.push(`${request.method} ${request.url}`);
      response.setHeader('content-type', 'application/octet-stream');
      response.end(Buffer.from('hello world content'));
    });

    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    const address = server.address();
    expect(address).toBeDefined();
    if (!address || typeof address !== 'object') {
      server.close();
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: 'test-api-key',
      httpOptions: {
        apiVersion: 'v1beta',
        baseUrl: `http://127.0.0.1:${address.port}`,
      },
    });

    try {
      const content = await ai.environments.files.download({
        environment: 'env_abc_123',
        path: 'main.py',
      });
      expect(new TextDecoder().decode(content)).toBe('hello world content');
      expect(captured).toEqual([
        'GET /v1beta/environments/env_abc_123/files/main.py?alt=media',
      ]);
    } finally {
      server.close();
      await once(server, 'close');
    }
  });

  it('uploads environment file via Scotty resumable upload', async () => {
    const capturedRequests: Array<{
      method: string;
      url: string;
      headers: IncomingHttpHeaders;
      body?: string;
    }> = [];
    let serverPort = 0;

    const server = createServer(async (request, response) => {
      request.setEncoding('utf8');
      let body = '';
      for await (const chunk of request) {
        body += chunk;
      }

      capturedRequests.push({
        method: request.method!,
        url: request.url!,
        headers: request.headers,
        body,
      });

      if (request.method === 'PUT') {
        response.setHeader(
          'x-goog-upload-url',
          `http://127.0.0.1:${serverPort}/upload_target`,
        );
        response.setHeader('x-goog-upload-status', 'active');
        response.end();
      } else if (
        request.method === 'POST' &&
        request.url === '/upload_target'
      ) {
        response.setHeader('content-type', 'application/json');
        response.setHeader('x-goog-upload-status', 'final');
        response.end(
          JSON.stringify({
            file: {
              name: 'test.txt',
              path: 'workspace/test.txt',
              size_bytes: '11',
            },
          }),
        );
      }
    });

    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    const address = server.address();
    expect(address).toBeDefined();
    if (!address || typeof address !== 'object') {
      server.close();
      return;
    }
    serverPort = address.port;

    const ai = new GoogleGenAI({
      apiKey: 'test-api-key',
      httpOptions: {
        apiVersion: 'v1beta',
        baseUrl: `http://127.0.0.1:${address.port}`,
      },
    });

    try {
      const fileBytes = new TextEncoder().encode('hello world');
      const res = await ai.environments.files.upload({
        environment: 'env_abc_123',
        path: 'test.txt',
        file: fileBytes,
        mimeType: 'text/plain',
        overwrite: true,
      });

      expect(res.name).toBe('test.txt');
      expect(res.path).toBe('workspace/test.txt');
      expect(capturedRequests.length).toBe(2);

      const handshake = capturedRequests[0];
      expect(handshake.method).toBe('PUT');
      expect(handshake.url).toBe(
        '/v1beta/environments/env_abc_123/files/test.txt?overwrite=true',
      );
      expect(handshake.headers['x-goog-upload-protocol']).toBe('resumable');
      expect(handshake.headers['x-goog-upload-command']).toBe('start');
      expect(handshake.headers['x-goog-upload-header-content-length']).toBe(
        '11',
      );
      expect(handshake.headers['x-goog-upload-header-content-type']).toBe(
        'text/plain',
      );

      const chunkPost = capturedRequests[1];
      expect(chunkPost.method).toBe('POST');
      expect(chunkPost.url).toBe('/upload_target');
      expect(chunkPost.headers['x-goog-upload-command']).toBe(
        'upload, finalize',
      );
      expect(chunkPost.headers['x-goog-upload-offset']).toBe('0');
      expect(chunkPost.body).toBe('hello world');
    } finally {
      server.close();
      await once(server, 'close');
    }
  });

  it('uploads archive file with extract: true', async () => {
    let serverPort = 0;

    const server = createServer(async (request, response) => {
      if (request.method === 'PUT') {
        response.setHeader(
          'x-goog-upload-url',
          `http://127.0.0.1:${serverPort}/upload_archive`,
        );
        response.setHeader('x-goog-upload-status', 'active');
        response.end();
      } else if (request.method === 'POST') {
        response.setHeader('content-type', 'application/json');
        response.setHeader('x-goog-upload-status', 'final');
        response.end(
          JSON.stringify({
            files: [
              {name: 'a.txt', path: 'workspace/a.txt'},
              {name: 'b.txt', path: 'workspace/b.txt'},
            ],
          }),
        );
      }
    });

    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    const address = server.address();
    expect(address).toBeDefined();
    if (!address || typeof address !== 'object') {
      server.close();
      return;
    }
    serverPort = address.port;

    const ai = new GoogleGenAI({
      apiKey: 'test-api-key',
      httpOptions: {
        apiVersion: 'v1beta',
        baseUrl: `http://127.0.0.1:${address.port}`,
      },
    });

    try {
      const res = await ai.environments.files.upload({
        environmentId: 'env_abc_123',
        path: 'archive.tar.gz',
        file: new Uint8Array([1, 2, 3, 4]),
        extract: true,
      });

      expect(res.files).toBeDefined();
      expect(res.files.length).toBe(2);
      expect(res.files[0].name).toBe('a.txt');
    } finally {
      server.close();
      await once(server, 'close');
    }
  });
});
