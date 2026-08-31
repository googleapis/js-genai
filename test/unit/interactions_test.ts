/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GeminiNextGenInteractions,
  GoogleGenAIParentClient,
} from '../../src/gaos/google-genai.js';

describe('Interactions resource', () => {
  let parentClient: jasmine.SpyObj<GoogleGenAIParentClient>;
  let interactions: GeminiNextGenInteractions;
  let fetchSpy: jasmine.Spy;

  const mockJsonResponse = (status = 200, headers: HeadersInit = []) => {
    const h = new Headers(headers);
    if (!h.has('Content-Type')) {
      h.set('Content-Type', 'application/json');
    }
    return new Response('{}', {status, headers: h});
  };

  const flushPromises = async () => {
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }
  };

  beforeEach(() => {
    parentClient = jasmine.createSpyObj<GoogleGenAIParentClient>([
      'isVertexAI',
      'getProject',
      'getLocation',
      'getBaseUrl',
      'getApiVersion',
      'getAuthHeaders',
    ]);
    parentClient.isVertexAI.and.returnValue(false);
    parentClient.getProject.and.returnValue('my-project');
    parentClient.getLocation.and.returnValue('my-location');
    parentClient.getBaseUrl.and.returnValue('https://my.base.host');
    parentClient.getApiVersion.and.returnValue('somev1');
    parentClient.getAuthHeaders.and.callFake(() =>
      Promise.resolve(new Headers()),
    );

    interactions = new GeminiNextGenInteractions(parentClient);

    fetchSpy = spyOn(globalThis, 'fetch').and.callFake(() =>
      Promise.resolve(mockJsonResponse()),
    );
  });

  afterEach(() => {
    try {
      jasmine.clock().uninstall();
    } catch (e) {
      console.warn('Failed to uninstall jasmine clock', e);
    }
  });

  describe('routed to Gemini', () => {
    beforeEach(() => {
      parentClient.isVertexAI.and.returnValue(false);
    });

    it('should send requests to existing paths invoking client auth headers', async () => {
      await interactions.create({
        agent: 'some-agent',
        input: 'some input',
      });

      expect(fetchSpy).toHaveBeenCalled();
      const [request] = fetchSpy.calls.first().args as [Request];
      expect(request.url).toBe('https://my.base.host/somev1/interactions');
      expect(request.method.toLowerCase()).toEqual('post');
      expect(parentClient.getAuthHeaders).toHaveBeenCalled();
    });

    it('should retry the call', async () => {
      jasmine.clock().install();
      jasmine.clock().mockDate();
      let callCount = 0;
      fetchSpy.and.callFake(() => {
        callCount++;
        return Promise.resolve(mockJsonResponse(500, [['retry-after', '1']]));
      });
      const promise = interactions.create(
        {agent: 'some-agent', input: 'some input'},
        {
          retries: {
            strategy: 'backoff',
            backoff: {
              initialInterval: 1000,
              maxInterval: 1000,
              exponent: 1,
              maxElapsedTime: 3500,
            },
          },
        },
      );

      await flushPromises();
      for (let i = 0; i < 5; i++) {
        jasmine.clock().tick(1000);
        await flushPromises();
      }

      await expectAsync(promise).toBeRejected();
      expect(callCount).toBe(5);
    });

    it('should throw error on timeout', async () => {
      fetchSpy.and.rejectWith(new Error('timeout'));

      await expectAsync(
        interactions.create(
          {
            agent: 'some-agent',
            input: 'some input',
          },
          {maxRetries: 0, timeout: 1},
        ),
      ).toBeRejected();
    });

    it('should not invoke client auth headers if manually given', async () => {
      await interactions.create(
        {
          agent: 'some-agent',
          input: 'some input',
        },
        {headers: {Authorization: 'Bearer some-manual-token'}},
      );

      expect(parentClient.getAuthHeaders).not.toHaveBeenCalled();
      const [request] = fetchSpy.calls.first().args as [Request];
      expect(request.headers.get('Authorization')).toBe(
        'Bearer some-manual-token',
      );
      expect(request.headers.has('x-goog-api-key')).toBeFalse();

      fetchSpy.calls.reset();
      parentClient.getAuthHeaders.calls.reset();
      await interactions.create(
        {
          agent: 'some-agent',
          input: 'some input',
        },
        {headers: {'x-goog-api-key': 'some-manual-key'}},
      );

      expect(parentClient.getAuthHeaders).not.toHaveBeenCalled();
      const [request2] = fetchSpy.calls.first().args as [Request];
      expect(request2.headers.get('x-goog-api-key')).toBe('some-manual-key');
      expect(request2.headers.has('Authorization')).toBeFalse();
    });
  });

  describe('routed to Vertex', () => {
    beforeEach(() => {
      parentClient.isVertexAI.and.returnValue(true);
      parentClient.getAuthHeaders.and.callFake(
        () => new Headers([['Authorization', 'Bearer some-token']]),
      );
    });

    it('should send requests to new paths with client auth headers', async () => {
      parentClient.getAuthHeaders.and.callFake(
        () => new Headers([['Authorization', 'Bearer my-access-token']]),
      );
      await interactions.create({
        agent: 'some-agent',
        input: 'some input',
      });

      expect(fetchSpy).toHaveBeenCalled();
      const [request] = fetchSpy.calls.first().args as [Request];
      expect(request.url).toBe(
        'https://my.base.host/somev1/projects/my-project/locations/my-location/interactions',
      );
      expect(request.method.toLowerCase()).toEqual('post');
      expect(parentClient.getAuthHeaders).toHaveBeenCalled();
      expect(request.headers.get('Authorization')).toBe(
        'Bearer my-access-token',
      );
    });

    it('should retry the call', async () => {
      jasmine.clock().install();
      jasmine.clock().mockDate();
      let callCount = 0;
      fetchSpy.and.callFake(() => {
        callCount++;
        return Promise.resolve(mockJsonResponse(500, [['retry-after', '1']]));
      });
      const promise = interactions.create(
        {agent: 'some-agent', input: 'some input'},
        {
          retries: {
            strategy: 'backoff',
            backoff: {
              initialInterval: 1000,
              maxInterval: 1000,
              exponent: 1,
              maxElapsedTime: 3500,
            },
          },
        },
      );

      await flushPromises();
      for (let i = 0; i < 5; i++) {
        jasmine.clock().tick(1000);
        await flushPromises();
      }

      await expectAsync(promise).toBeRejected();
      expect(callCount).toBe(5);
      expect(parentClient.getAuthHeaders).toHaveBeenCalledTimes(5);
    });

    it('should not invoke client auth headers if manually given', async () => {
      await interactions.create(
        {
          agent: 'some-agent',
          input: 'some input',
        },
        {headers: {Authorization: 'Bearer some-manual-token'}},
      );

      expect(parentClient.getAuthHeaders).not.toHaveBeenCalled();
      const [request] = fetchSpy.calls.first().args as [Request];
      expect(request.headers.get('Authorization')).toBe(
        'Bearer some-manual-token',
      );

      fetchSpy.calls.reset();
      parentClient.getAuthHeaders.calls.reset();
      await interactions.create(
        {
          agent: 'some-agent',
          input: 'some input',
        },
        {headers: {'x-goog-api-key': 'some-manual-key'}},
      );

      expect(parentClient.getAuthHeaders).not.toHaveBeenCalled();
      const [request2] = fetchSpy.calls.first().args as [Request];
      expect(request2.headers.get('x-goog-api-key')).toBe('some-manual-key');
    });
  });

  describe('streaming regression', () => {
    it('should handle large fragmented SSE payloads correctly', async () => {
      const largeData = 'A'.repeat(10 * 1024);
      const mockSSE =
        `data: {"event_type": "step.delta", "delta": {"type": "text", "text": "${
          largeData
        }"}, "index": 0}\n\n` + `data: [DONE]\n\n`;
      const sseBytes = new TextEncoder().encode(mockSSE);

      const readableStream = new ReadableStream({
        start(controller) {
          const chunkSize = 1024;
          for (let i = 0; i < sseBytes.length; i += chunkSize) {
            controller.enqueue(sseBytes.subarray(i, i + chunkSize));
          }
          controller.close();
        },
      });

      fetchSpy.and.resolveTo(
        new Response(readableStream, {
          headers: new Headers([['Content-Type', 'text/event-stream']]),
        }),
      );

      const stream = await interactions.create({
        agent: 'some-agent',
        input: 'test',
        stream: true,
      });

      let received = '';
      for await (const event of stream) {
        if (event.event_type === 'step.delta' && event.delta?.type === 'text') {
          received += event.delta.text;
        }
      }
      expect(received).toBe(largeData);
    });
  });
});
