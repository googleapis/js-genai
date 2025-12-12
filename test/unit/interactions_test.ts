/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GeminiNextGenAPIClientAdapter} from '../../src/interactions/client-adapter.js';
import {GeminiNextGenAPIClient} from '../../src/interactions/index.js';
import {Fetch} from '../../src/interactions/internal/builtin-types.js';

describe('Interactions resource', () => {
  let clientAdapter: jasmine.SpyObj<GeminiNextGenAPIClientAdapter>;

  beforeEach(() => {
    clientAdapter = {
      isVertexAI: jasmine.createSpy('isVertexAI').and.returnValue(false),
      getProject: jasmine.createSpy('getProject').and.returnValue('my-project'),
      getLocation: jasmine
        .createSpy('getLocation')
        .and.returnValue('my-location'),
      getAuthHeaders: jasmine
        .createSpy('getAuthHeaders')
        .and.callFake(() => Promise.resolve(new Headers())),
    };
  });

  describe('routed to Gemini', () => {
    let client: GeminiNextGenAPIClient;
    let fetchSpy: jasmine.Spy<Fetch>;

    beforeEach(() => {
      client = new GeminiNextGenAPIClient({
        clientAdapter,
        baseURL: 'https://my.base.host',
        apiKey: 'my-api-key',
        apiVersion: 'somev1',
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetchSpy = spyOn(client as any, 'fetch').and.resolveTo(
        new Response(),
      ) as jasmine.Spy<Fetch>;
    });

    it('should send requests to existing paths invoking client auth headers', async () => {
      await client.interactions.create({
        agent: 'some-agent',
        input: 'some input',
      });

      const [url, options] = fetchSpy.calls.first().args;
      expect(url).toBe('https://my.base.host/somev1/interactions');
      expect(options?.method?.toLowerCase()).toEqual('post');
      expect(clientAdapter.getAuthHeaders).not.toHaveBeenCalled();
    });

    it('should retry the call', async () => {
      fetchSpy.and.callFake(() => {
        return Promise.resolve(
          new Response(null, {
            status: 500,
            // speed up retries for testing
            headers: new Headers([['retry-after-ms', '1']]),
          }),
        );
      });
      await expectAsync(
        client.interactions.create(
          {agent: 'some-agent', input: 'some input'},
          {
            maxRetries: 4,
          },
        ),
      ).toBeRejected();
      expect(fetchSpy).toHaveBeenCalledTimes(5);
    });

    it('should not invoke client auth headers if manually given', async () => {
      await client.interactions.create(
        {
          agent: 'some-agent',
          input: 'some input',
        },
        {headers: [['Authorization', 'Bearer some-manual-token']]},
      );

      expect(clientAdapter.getAuthHeaders).not.toHaveBeenCalled();
      let headers = new Headers(fetchSpy.calls.allArgs()[0][1]?.headers);
      expect(headers.get('Authorization')).toBe('Bearer some-manual-token');
      expect(headers.has('x-goog-api-key')).toBeFalse();

      fetchSpy.calls.reset();
      clientAdapter.getAuthHeaders.calls.reset();
      await client.interactions.create(
        {
          agent: 'some-agent',
          input: 'some input',
        },
        {headers: [['x-goog-api-key', 'some-manual-key']]},
      );

      expect(clientAdapter.getAuthHeaders).not.toHaveBeenCalled();
      headers = new Headers(fetchSpy.calls.allArgs()[0][1]?.headers);
      expect(headers.get('x-goog-api-key')).toBe('some-manual-key');
      expect(headers.has('Authorization')).toBeFalse();
    });
  });

  describe('routed to Vertex', () => {
    let client: GeminiNextGenAPIClient;
    let fetchSpy: jasmine.Spy<Fetch>;

    beforeEach(() => {
      clientAdapter.isVertexAI.and.returnValue(true);
      clientAdapter.getAuthHeaders.and.callFake(
        () => new Headers([['Authorization', 'Bearer some-token']]),
      );
      client = new GeminiNextGenAPIClient({
        clientAdapter,

        baseURL: 'https://my.base.host',
        apiVersion: 'somev1',
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetchSpy = spyOn(client as any, 'fetch').and.resolveTo(
        new Response(),
      ) as jasmine.Spy<Fetch>;
    });

    it('should send requests to new paths with client auth headers', async () => {
      clientAdapter.getAuthHeaders.and.callFake(
        () => new Headers([['Authorization', 'Bearer my-access-token']]),
      );
      await client.interactions.create({
        agent: 'some-agent',
        input: 'some input',
      });

      const [url, options] = fetchSpy.calls.first().args;
      expect(url).toBe(
        'https://my.base.host/somev1/projects/my-project/locations/my-location/interactions',
      );
      expect(options?.method?.toLowerCase()).toEqual('post');
      expect(clientAdapter.getAuthHeaders).toHaveBeenCalled();
      const headers = new Headers(options?.headers);
      expect(headers.get('Authorization')).toBe('Bearer my-access-token');
    });

    it('should retry the call', async () => {
      fetchSpy.and.callFake(() => {
        return Promise.resolve(
          new Response(null, {
            status: 500,
            // speed up retries for testing
            headers: new Headers([['retry-after-ms', '1']]),
          }),
        );
      });
      await expectAsync(
        client.interactions.create(
          {agent: 'some-agent', input: 'some input'},
          {
            maxRetries: 4,
          },
        ),
      ).toBeRejected();
      expect(fetchSpy).toHaveBeenCalledTimes(5);
      expect(clientAdapter.getAuthHeaders).toHaveBeenCalledTimes(5);
    });

    it('should not invoke client auth headers if manually given', async () => {
      await client.interactions.create(
        {
          agent: 'some-agent',
          input: 'some input',
        },
        {headers: [['Authorization', 'Bearer some-manual-token']]},
      );

      expect(clientAdapter.getAuthHeaders).not.toHaveBeenCalled();
      let headers = new Headers(fetchSpy.calls.allArgs()[0][1]?.headers);
      expect(headers.get('Authorization')).toBe('Bearer some-manual-token');

      fetchSpy.calls.reset();
      clientAdapter.getAuthHeaders.calls.reset();
      await client.interactions.create(
        {
          agent: 'some-agent',
          input: 'some input',
        },
        {headers: [['x-goog-api-key', 'some-manual-key']]},
      );

      expect(clientAdapter.getAuthHeaders).not.toHaveBeenCalled();
      headers = new Headers(fetchSpy.calls.allArgs()[0][1]?.headers);
      expect(headers.get('x-goog-api-key')).toBe('some-manual-key');
    });
  });
});
