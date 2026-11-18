/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {once} from 'node:events';
import {createServer, IncomingMessage, Server} from 'node:http';
import * as NodeWs from 'ws';

import {ApiClient} from '../../src/_api_client.js';
import type {Auth} from '../../src/_auth.js';
import {
  APIConnectionError,
  APIError,
  APIWebRTCError,
  APIWebSocketError,
} from '../../src/_interactions_errors.js';
import {
  InteractionWebRTCTransport,
  type InteractionWebRTCTransportOptions,
} from '../../src/_interactions_webrtc.js';
import {resetLiveInteractionsExperimentalWarningForTesting} from '../../src/_interactions_websocket.js';
import type {
  WebSocket,
  WebSocketCallbacks,
  WebSocketFactory,
} from '../../src/_websocket.js';
import {GoogleGenAI} from '../../src/client.js';
import {CrossDownloader} from '../../src/cross/_cross_downloader.js';
import {crossError} from '../../src/cross/_cross_error.js';
import {CrossUploader} from '../../src/cross/_cross_uploader.js';
import {
  type ClientEvent,
  connectWebRTCInteraction,
  connectWebSocketInteraction,
  GeminiNextGenInteractionAuthTokens,
  GeminiNextGenInteractions,
  InteractionWebRTCConnection,
  InteractionWebSocketConnection,
} from '../../src/gaos/google-genai.js';
import * as PublicIndex from '../../src/index.js';
import {BrowserWebSocketFactory} from '../../src/web/_browser_websocket.js';
import * as WebIndex from '../../src/web/index.js';

type WsClientInstance = {
  onopen: (() => void) | null;
  onerror: ((err: unknown) => void) | null;
  onclose: ((ev: {code?: number}) => void) | null;
  onmessage: ((ev: {data: unknown}) => void) | null;
  send(data: string): void;
  close(): void;
};

type WsServerInstance = {
  clients: Set<{terminate(): void}>;
  on(
    event: 'connection',
    listener: (
      ws: {
        on(event: 'message', cb: (raw: unknown) => void): void;
        send(data: string): void;
      },
      req: IncomingMessage,
    ) => void,
  ): void;
  close(): void;
};

const WsClientCtor = ((NodeWs as unknown as {WebSocket?: unknown}).WebSocket ??
  (NodeWs as unknown as {default?: unknown}).default ??
  NodeWs) as new (
  url: string,
  options?: {headers?: Record<string, string>},
) => WsClientInstance;

const WsServerCtor = ((
  NodeWs as unknown as {WebSocketServer?: unknown; Server?: unknown}
).WebSocketServer ??
  (NodeWs as unknown as {Server?: unknown}).Server ??
  (NodeWs as unknown as {default?: {Server?: unknown}}).default
    ?.Server) as new (options: {server: Server}) => WsServerInstance;

function castPC(pc: unknown): RTCPeerConnection {
  return pc as RTCPeerConnection;
}

function castStream(stream: unknown): MediaStream {
  return stream as MediaStream;
}

function castVideo(el: unknown): HTMLVideoElement {
  return el as HTMLVideoElement;
}

function castAudio(el: unknown): HTMLAudioElement {
  return el as HTMLAudioElement;
}

interface FakeMediaElement {
  srcObject?: unknown;
  play?: jasmine.Spy<jasmine.Func>;
}

const LIVE_CONTRACT_FIXTURES: {valid: unknown[]; invalid: unknown[]} = {
  valid: [
    {
      event_type: 'input',
      content: [{type: 'text', text: 'hello'}],
    },
    {
      event_type: 'interaction.complete',
    },
    {
      event_type: 'interaction.cancel',
    },
    {
      event_type: 'interaction.connect',
      id: 'int_test',
    },
    {
      event_type: 'interaction.disconnect',
    },
    {
      event_type: 'input.audio.end',
    },
  ],
  invalid: [null, undefined, 123, true],
};

class FakeWebSocket implements WebSocket {
  readonly sent: string[] = [];
  closed = false;
  closeCalls = 0;

  constructor(private readonly callbacks: WebSocketCallbacks) {}

  connect(): void {
    this.callbacks.onopen();
  }

  send(message: string): void {
    this.sent.push(message);
  }

  close(): void {
    this.closed = true;
    this.closeCalls += 1;
    this.callbacks.onclose({code: 1000});
  }

  serverEvent(event: unknown): void {
    this.callbacks.onmessage({data: JSON.stringify(event)});
  }

  serverRaw(data: unknown): void {
    this.callbacks.onmessage({data});
  }

  serverClose(code: number): void {
    this.callbacks.onclose({code});
  }

  serverError(): void {
    this.callbacks.onerror(new Error('transport error'));
  }
}

class FakeWebSocketFactory implements WebSocketFactory {
  supportsHeaders?: boolean;
  url?: string;
  headers?: Record<string, string>;
  socket?: FakeWebSocket;

  create(
    url: string,
    headers: Record<string, string>,
    callbacks: WebSocketCallbacks,
  ): WebSocket {
    this.url = url;
    this.headers = headers;
    this.socket = new FakeWebSocket(callbacks);
    return this.socket;
  }
}

function parentClient() {
  const baseUrl = 'https://generativelanguage.googleapis.com/root/';
  return {
    isVertexAI: () => false,
    getProject: () => undefined,
    getLocation: () => undefined,
    getBaseUrl: () => baseUrl,
    getWebsocketBaseUrl: () => {
      const urlParts = new URL(baseUrl);
      urlParts.protocol = urlParts.protocol === 'http:' ? 'ws:' : 'wss:';
      return urlParts.toString();
    },
    getApiVersion: () => 'v1beta',
    getApiKey: (): string | undefined => 'project-key',
    getDefaultHeaders: () => ({'x-goog-api-client': 'test-client'}),
    getAuthHeaders: jasmine
      .createSpy('getAuthHeaders')
      .and.resolveTo(new Headers()),
  };
}

class StaticBearerAuth implements Auth {
  constructor(private readonly token: string) {}

  async addAuthHeaders(headers: Headers): Promise<void> {
    headers.set('Authorization', `Bearer ${this.token}`);
  }
}

function readRequestBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    request.setEncoding('utf8');
    let body = '';
    request.on('data', (chunk: string) => {
      body += chunk;
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

describe('Live Interactions WebSocket transport', () => {
  it('supports connect and authTokens (without snake_case auth_tokens) on GeminiNextGenInteractions', async () => {
    const factory = new FakeWebSocketFactory();
    const p = parentClient();
    (p as unknown as {getApiKey: () => string | undefined}).getApiKey = () =>
      'auth_tokens/tok-123';
    const interactions = new GeminiNextGenInteractions(p, factory);

    expect(interactions.authTokens).toBeInstanceOf(
      GeminiNextGenInteractionAuthTokens,
    );
    expect(
      (interactions as unknown as Record<string, unknown>)['auth_tokens'],
    ).toBeUndefined();
    expect(typeof interactions.authTokens.create).toBe('function');
    expect(typeof interactions.authTokens.delete).toBe('function');

    const connected = await interactions.connect('interaction-2');
    expect(connected).toBeInstanceOf(InteractionWebSocketConnection);
    expect(connected.id).toBe('interaction-2');
    connected.detach();
  });

  it('encodes text, typed client events, and client event batches via send()', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'interaction-1',
    );
    await connection.send('Hello');
    await connection.send({
      event_type: 'input',
      content: [{type: 'text', text: 'Interrupt'}],
    });
    await connection.send([
      {event_type: 'input', content: [{type: 'text', text: 'one'}]},
      {event_type: 'input', content: [{type: 'text', text: 'two'}]},
    ]);
    expect(
      factory.socket!.sent.slice(1).map((value) => JSON.parse(value)),
    ).toEqual([
      {event_type: 'input', content: [{type: 'text', text: 'Hello'}]},
      {
        event_type: 'input',
        content: [{type: 'text', text: 'Interrupt'}],
      },
      {
        events: [
          {event_type: 'input', content: [{type: 'text', text: 'one'}]},
          {event_type: 'input', content: [{type: 'text', text: 'two'}]},
        ],
      },
    ]);
    connection.detach();
  });

  it('derives the URL and sends the connect frame with API-key auth', async () => {
    const parent = parentClient();
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parent,
      factory,
      'interaction-1',
    );

    expect(factory.url).toBe(
      'wss://generativelanguage.googleapis.com/root/v1beta/interactions/live',
    );
    expect(factory.headers?.['x-goog-api-key']).toBe('project-key');
    expect(factory.headers?.['api-revision']).toBe('2026-05-20');
    expect(parent.getAuthHeaders).not.toHaveBeenCalled();
    expect(JSON.parse(factory.socket!.sent[0]!)).toEqual({
      event_type: 'interaction.connect',
      id: 'interaction-1',
    });
    expect(connection.id).toBe('interaction-1');
    connection.detach();
  });

  it('uses getAuthHeaders OAuth headers when no API key is set and supports api_version overrides', async () => {
    const authHeaders = new Headers({'Authorization': 'Bearer oauth-token-1'});
    const parent = {
      ...parentClient(),
      getApiKey: () => undefined,
      getAuthHeaders: jasmine
        .createSpy('getAuthHeaders')
        .and.resolveTo(authHeaders),
    };
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parent,
      factory,
      'interaction-1',
      {api_version: 'v1alpha'},
    );

    expect(factory.url).toBe(
      'wss://generativelanguage.googleapis.com/root/v1alpha/interactions/live',
    );
    expect(parent.getAuthHeaders).toHaveBeenCalledWith(factory.url);
    expect(factory.headers?.['authorization']).toBe('Bearer oauth-token-1');
    expect(factory.headers?.['x-goog-api-key']).toBeUndefined();
    connection.detach();
  });

  it('rejects Vertex AI clients on WebSocket connect', async () => {
    const regionalClient = new ApiClient({
      auth: new StaticBearerAuth('vertex-oauth'),
      vertexai: true,
      project: 'my-proj',
      location: 'us-central1',
      apiVersion: 'v1beta1',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    await expectAsync(
      connectWebSocketInteraction(
        regionalClient,
        new FakeWebSocketFactory(),
        'int_vertex_1',
      ),
    ).toBeRejectedWithError(
      Error,
      'Live Interactions is currently Gemini API only.',
    );
  });

  it('builds WebSocket URLs from getWebsocketBaseUrl and rejects missing base URL', async () => {
    const wsParent = {
      ...parentClient(),
      getWebsocketBaseUrl: () => 'ws://localhost:8080/proxy?token=abc',
    };
    const wsFactory = new FakeWebSocketFactory();
    (wsParent as unknown as {getApiKey: () => string | undefined}).getApiKey =
      () => 'auth_tokens/tok-123';
    const wsConn = await connectWebSocketInteraction(
      wsParent,
      wsFactory,
      'interaction-1',
      {},
    );
    expect(wsFactory.url).toBe(
      'ws://localhost:8080/proxy/v1beta/interactions/live?token=abc',
    );
    expect(wsFactory.headers?.['x-goog-api-key']).toBe('auth_tokens/tok-123');
    wsConn.detach();

    const wssParent = {
      ...parentClient(),
      getWebsocketBaseUrl: () => 'wss://my-gateway.example.com/genai',
    };
    const wssFactory = new FakeWebSocketFactory();
    const wssConn = await connectWebSocketInteraction(
      wssParent,
      wssFactory,
      'interaction-1',
    );
    expect(wssFactory.url).toBe(
      'wss://my-gateway.example.com/genai/v1beta/interactions/live',
    );
    wssConn.detach();

    const missingWsParent = {
      ...parentClient(),
      getWebsocketBaseUrl: undefined,
    };
    await expectAsync(
      connectWebSocketInteraction(
        missingWsParent,
        new FakeWebSocketFactory(),
        'interaction-1',
      ),
    ).toBeRejectedWithError(Error, 'WebSocket base URL is required.');
  });

  it('sends auth_tokens/ in x-goog-api-key header when headers are supported and strips configured Authorization header', async () => {
    const parent = parentClient();
    const factory = new FakeWebSocketFactory();
    (parent as unknown as {getApiKey: () => string | undefined}).getApiKey =
      () => 'auth_tokens/ephemeral-short-lived';
    const connection = await connectWebSocketInteraction(
      parent,
      factory,
      'interaction-1',
      {},
      {
        headers: {
          Authorization: 'Bearer must-not-escape',
          'X-Goog-Api-Key': 'must-not-escape',
        },
      },
    );

    expect(factory.url).toBe(
      'wss://generativelanguage.googleapis.com/root/v1beta/interactions/live',
    );
    expect(factory.headers?.['x-goog-api-key']).toBe(
      'auth_tokens/ephemeral-short-lived',
    );
    expect(factory.headers?.['X-Goog-Api-Key']).toBeUndefined();
    expect(factory.headers?.['Authorization']).toBeUndefined();
    expect(parent.getAuthHeaders).not.toHaveBeenCalled();
    expect(JSON.parse(factory.socket!.sent[0]!)).toEqual({
      event_type: 'interaction.connect',
      id: 'interaction-1',
    });
    connection.detach();
  });

  it('streams server events continuously across steps and transcripts until interaction.completed or detach()', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'interaction-1',
    );
    await connection.send({event_type: 'input.audio.end'});
    factory.socket!.serverEvent({
      events: [
        {event_type: 'step.start', index: 0, step: {type: 'thought'}},
        {event_type: 'step.delta', index: 0, delta: {thought: 'planning'}},
        {event_type: 'step.stop', index: 0},
        {
          event_type: 'step.start',
          index: 1,
          step: {type: 'transcription', role: 'user'},
        },
        {event_type: 'step.stop', index: 1},
        {
          event_type: 'step.start',
          index: 2,
          step: {type: 'content', role: 'model'},
        },
        {event_type: 'step.delta', index: 2, delta: {transcript: 'Rainy'}},
        {event_type: 'step.stop', index: 2},
        {event_type: 'step.start', index: 3, step: {type: 'model_output'}},
        {
          event_type: 'step.delta',
          index: 3,
          delta: {text: 'Bring an umbrella.'},
        },
        {event_type: 'step.stop', index: 3},
        {event_type: 'interaction.completed'},
      ],
    });

    const streamed: string[] = [];
    for await (const event of connection.receive()) {
      streamed.push(
        `${event.event_type}:${'index' in event ? event.index : ''}`,
      );
    }
    expect(streamed).toEqual([
      'step.start:0',
      'step.delta:0',
      'step.stop:0',
      'step.start:1',
      'step.stop:1',
      'step.start:2',
      'step.delta:2',
      'step.stop:2',
      'step.start:3',
      'step.delta:3',
      'step.stop:3',
      'interaction.completed:',
    ]);
    expect(factory.socket!.closed).toBeTrue();
    expect(factory.socket!.closeCalls).toBe(1);
    const sentBeforeDetach = factory.socket!.sent.length;
    connection.detach();
    expect(factory.socket!.closeCalls).toBe(1);
    expect(factory.socket!.sent.length).toBe(sentBeforeDetach);
  });

  it('preserves remaining queued events when breaking out of receive() early', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'interaction-1',
    );
    factory.socket!.serverEvent({
      events: [
        {event_type: 'step.start', index: 0, step: {type: 'model_output'}},
        {event_type: 'step.delta', index: 0, delta: {text: 'part 1'}},
        {event_type: 'step.stop', index: 0},
        {event_type: 'step.start', index: 1, step: {type: 'model_output'}},
        {event_type: 'step.delta', index: 1, delta: {text: 'part 2'}},
        {event_type: 'step.stop', index: 1},
      ],
    });

    const firstSlice: Array<{event_type: string; index?: number}> = [];
    for await (const event of connection.receive()) {
      firstSlice.push({
        event_type: event.event_type,
        index: 'index' in event ? event.index : undefined,
      });
      if (event.event_type === 'step.stop') break;
    }
    expect(firstSlice).toEqual([
      {event_type: 'step.start', index: 0},
      {event_type: 'step.delta', index: 0},
      {event_type: 'step.stop', index: 0},
    ]);

    const secondSlice: Array<{event_type: string; index?: number}> = [];
    for await (const event of connection.receive()) {
      secondSlice.push({
        event_type: event.event_type,
        index: 'index' in event ? event.index : undefined,
      });
      if (event.event_type === 'step.stop') break;
    }
    expect(secondSlice).toEqual([
      {event_type: 'step.start', index: 1},
      {event_type: 'step.delta', index: 1},
      {event_type: 'step.stop', index: 1},
    ]);
    connection.detach();
  });

  it('clears unread buffered events when detach() is called mid-batch', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'interaction-1',
    );
    factory.socket!.serverEvent({
      events: [
        {event_type: 'step.start', index: 0, step: {type: 'model_output'}},
        {event_type: 'step.delta', index: 0, delta: {text: 'dropped'}},
        {event_type: 'step.stop', index: 0},
      ],
    });

    const received: string[] = [];
    for await (const event of connection.receive()) {
      received.push(event.event_type);
      connection.detach();
    }
    expect(received).toEqual(['step.start']);

    const remaining: string[] = [];
    for await (const event of connection.receive()) {
      remaining.push(event.event_type);
    }
    expect(remaining).toEqual([]);
  });

  it('sends complete() and cancel() lifecycle events and stops sending once terminal', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'interaction-1',
    );
    await connection.complete();
    expect(JSON.parse(factory.socket!.sent.at(-1)!)).toEqual({
      event_type: 'interaction.complete',
    });

    factory.socket!.serverEvent({event_type: 'interaction.completed'});
    const sentBeforeTerminalCalls = factory.socket!.sent.length;
    await connection.complete();
    await connection.cancel();
    expect(factory.socket!.sent.length).toBe(sentBeforeTerminalCalls);
    await expectAsync(connection.send('after terminal')).toBeRejectedWithError(
      Error,
      'This live interaction is already terminal.',
    );

    const cancelFactory = new FakeWebSocketFactory();
    const cancelConn = await connectWebSocketInteraction(
      parentClient(),
      cancelFactory,
      'interaction-2',
    );
    await cancelConn.cancel();
    expect(JSON.parse(cancelFactory.socket!.sent.at(-1)!)).toEqual({
      event_type: 'interaction.cancel',
    });
    const sentAfterCancel = cancelFactory.socket!.sent.length;
    await cancelConn.complete();
    await cancelConn.cancel();
    await expectAsync(cancelConn.send('after cancel')).toBeRejectedWithError(
      Error,
      'This live interaction is already terminal.',
    );
    cancelConn.detach();
    expect(cancelFactory.socket!.sent.length).toBe(sentAfterCancel);
  });

  it('fails closed with APIWebSocketError when socket.send throws mid-session', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'interaction-1',
    );
    const pendingReceive = connection.receive().next();
    factory.socket!.send = () => {
      throw new Error('Authorization: Bearer secret-in-socket-error');
    };

    let sendError: unknown;
    try {
      await connection.send('hello');
    } catch (caught) {
      sendError = caught;
    }
    expect(sendError).toBeInstanceOf(APIWebSocketError);
    expect((sendError as APIWebSocketError).closeCode).toBe(1006);
    expect((sendError as Error).message).not.toContain('secret');
    await expectAsync(pendingReceive).toBeRejectedWithError(APIWebSocketError);
    expect(factory.socket!.closed).toBeTrue();
  });

  it('reports every unexpected close as one redacted APIWebSocketError', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'interaction-1',
    );
    const event = connection.receive().next();
    factory.socket!.serverClose(1008);

    let error: unknown;
    try {
      await event;
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(APIWebSocketError);
    expect((error as APIWebSocketError).closeCode).toBe(1008);
    try {
      await connection.send('hello');
      fail('Expected send() to preserve the connection error.');
    } catch (sendError) {
      expect(sendError).toBeInstanceOf(APIWebSocketError);
      expect((sendError as APIWebSocketError).closeCode).toBe(1008);
    }
    expect(factory.socket!.closed).toBeTrue();

    const errFactory = new FakeWebSocketFactory();
    const errConn = await connectWebSocketInteraction(
      parentClient(),
      errFactory,
      'interaction-transport-error',
    );
    errFactory.socket!.serverError();
    expect(errFactory.socket!.closed).toBeTrue();
    await expectAsync(errConn.receive().next()).toBeRejectedWithError(
      APIWebSocketError,
    );
  });

  it('redacts synchronous WebSocket connect() failures', async () => {
    const factory: WebSocketFactory = {
      create: () => ({
        connect: () => {
          throw new Error('Authorization: Bearer secret');
        },
        send: () => {},
        close: () => {},
      }),
    };

    let error: unknown;
    try {
      await connectWebSocketInteraction(
        parentClient(),
        factory,
        'interaction-1',
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(APIWebSocketError);
    expect((error as Error).message).not.toContain('secret');
    expect((error as Error & {cause?: unknown}).cause).toBeUndefined();
  });

  it('surfaces synchronous WebSocket factory create() errors unmasked', async () => {
    const factory: WebSocketFactory = {
      create: () => {
        throw new Error('Unsupported WebSocket environment');
      },
    };

    await expectAsync(
      connectWebSocketInteraction(parentClient(), factory, 'interaction-1'),
    ).toBeRejectedWithError('Unsupported WebSocket environment');
  });

  it('honors timeout_ms when the socket never opens', async () => {
    const factory: WebSocketFactory = {
      create: () => ({
        connect: () => {},
        send: () => {},
        close: () => {},
      }),
    };

    await expectAsync(
      connectWebSocketInteraction(
        parentClient(),
        factory,
        'interaction-1',
        {},
        {timeout_ms: 10},
      ),
    ).toBeRejectedWithError(APIWebSocketError);
  });

  it('detaches by sending interaction.disconnect and closing the socket once', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'interaction-1',
    );
    connection.detach();

    expect(factory.socket!.sent.map((frame) => JSON.parse(frame))).toEqual([
      {event_type: 'interaction.connect', id: 'interaction-1'},
      {event_type: 'interaction.disconnect'},
    ]);
    connection.detach();
    expect(factory.socket!.sent.length).toBe(2);
  });

  it('does not send a disconnect frame after a terminal event', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'interaction-1',
    );
    factory.socket!.serverEvent({event_type: 'interaction.completed'});
    connection.detach();

    expect(factory.socket!.sent.length).toBe(1);
  });

  it('does not send a disconnect frame after a connection error', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'interaction-1',
    );
    factory.socket!.serverClose(1008);
    connection.detach();

    expect(factory.socket!.sent.length).toBe(1);
  });

  it('keeps detach() non-throwing when disconnect send or socket close throws', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'interaction-1',
    );
    factory.socket!.send = () => {
      throw new Error('socket already closing');
    };
    factory.socket!.close = () => {
      throw new Error('teardown failed');
    };

    expect(() => connection.detach()).not.toThrow();
  });

  it('does not send interaction.disconnect after a transport error', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'interaction-1',
    );
    factory.socket!.serverError();

    expect(() => connection.detach()).not.toThrow();
    const frames = factory.socket!.sent.map((frame) => JSON.parse(frame));
    expect(frames).not.toContain(
      jasmine.objectContaining({event_type: 'interaction.disconnect'}),
    );
  });

  it('redacts a failed initial send and closes the acquired socket', async () => {
    const close = jasmine.createSpy('close');
    const factory: WebSocketFactory = {
      create: (_url, _headers, callbacks) => ({
        connect: () => callbacks.onopen(),
        send: () => {
          throw new Error('Authorization: Bearer test-secret');
        },
        close,
      }),
    };
    await expectAsync(
      connectWebSocketInteraction(parentClient(), factory, 'interaction-1'),
    ).toBeRejectedWithError(APIWebSocketError);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('fails closed after malformed frames instead of allowing further writes', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'interaction-1',
    );
    factory.socket!.serverRaw('{not json');
    await expectAsync(connection.receive().next()).toBeRejectedWithError(
      APIWebSocketError,
    );
    await expectAsync(connection.send('hello')).toBeRejectedWithError(
      APIWebSocketError,
    );
    expect(factory.socket!.sent.length).toBe(1);
    connection.detach();
  });
});

describe('BrowserWebSocketFactory header capability enforcement', () => {
  it('fails fast without auth_token or when extra_headers is passed', async () => {
    const browserFactory = new BrowserWebSocketFactory();

    const parentNoKey = parentClient();
    (
      parentNoKey as unknown as {getApiKey: () => string | undefined}
    ).getApiKey = () => undefined;
    await expectAsync(
      connectWebSocketInteraction(parentNoKey, browserFactory, 'int_browser'),
    ).toBeRejectedWithError(
      Error,
      'Browser WebSocket connections cannot send authentication headers; pass an auth token as apiKey to the GoogleGenAI client.',
    );

    const parentPlain = parentClient();
    (
      parentPlain as unknown as {getApiKey: () => string | undefined}
    ).getApiKey = () => 'AIzaSyPlainKey';
    await expectAsync(
      connectWebSocketInteraction(parentPlain, browserFactory, 'int_browser'),
    ).toBeRejectedWithError(
      Error,
      'Browser WebSocket connections cannot send authentication headers; pass an auth token as apiKey to the GoogleGenAI client.',
    );

    const parentKey = parentClient();
    (parentKey as unknown as {getApiKey: () => string | undefined}).getApiKey =
      () => 'auth_tokens/ephemeral-tok';
    await expectAsync(
      connectWebSocketInteraction(
        parentKey,
        browserFactory,
        'int_browser',
        {},
        {
          headers: {'x-custom': '1'},
        },
      ),
    ).toBeRejectedWithError(
      Error,
      'Browser WebSocket connections cannot send extra_headers.',
    );
  });
  it('connects via BrowserWebSocketFactory when auth_token is provided', async () => {
    const globalWithWs = globalThis as unknown as {WebSocket?: unknown};
    const originalWebSocket = globalWithWs.WebSocket;
    let openedUrl: string | undefined;

    class MockBrowserDomWebSocket {
      binaryType: 'blob' | 'arraybuffer' = 'blob';
      onopen: (() => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onclose: ((e: {code?: number}) => void) | null = null;
      onmessage: ((e: {data: unknown}) => void) | null = null;

      constructor(url: string) {
        openedUrl = url;
        queueMicrotask(() => this.onopen?.());
      }

      send(message: string): void {
        const parsed = JSON.parse(message) as {
          event_type?: string;
          id?: string;
        };
        if (parsed.event_type === 'interaction.connect') {
          const bytes = new TextEncoder().encode(
            JSON.stringify({
              event_type: 'interaction.connected',
              interaction_id: parsed.id,
            }),
          );
          queueMicrotask(() =>
            this.onmessage?.({
              data:
                this.binaryType === 'arraybuffer'
                  ? bytes.buffer
                  : new Blob([bytes]),
            }),
          );
        }
      }

      close(): void {
        this.onclose?.({code: 1000});
      }
    }

    globalWithWs.WebSocket = MockBrowserDomWebSocket;
    try {
      const p = parentClient();
      (p as unknown as {getApiKey: () => string | undefined}).getApiKey = () =>
        'auth_tokens/ephemeral-tok';
      const connection = await connectWebSocketInteraction(
        p,
        new BrowserWebSocketFactory(),
        'int_browser',
        {},
      );
      expect(openedUrl).toBe(
        'wss://generativelanguage.googleapis.com/root/v1beta/interactions/live?auth_token=auth_tokens%2Fephemeral-tok',
      );
      expect(connection.id).toBe('int_browser');
      expect((await connection.receive().next()).value).toEqual({
        event_type: 'interaction.connected',
        interaction_id: 'int_browser',
      });
      connection.detach();
    } finally {
      globalWithWs.WebSocket = originalWebSocket;
    }
  });
});

describe('Real GoogleGenAI HTTP authTokens and WebSocket loopback wiring', () => {
  let server: Server;
  let wss: WsServerInstance;
  let ai: GoogleGenAI;
  const recordedHttpRequests: Array<{
    method?: string;
    url?: string;
    headers: IncomingMessage['headers'];
    body: string;
  }> = [];
  let lastUpgradeHeaders: IncomingMessage['headers'] | undefined;
  let lastUpgradeUrl: string | undefined;

  beforeAll(async () => {
    server = createServer(async (request, response) => {
      const body = await readRequestBody(request);
      recordedHttpRequests.push({
        method: request.method,
        url: request.url,
        headers: request.headers,
        body,
      });
      response.setHeader('content-type', 'application/json');
      if (request.method === 'POST' && request.url?.endsWith('/auth_tokens')) {
        response.end(
          JSON.stringify({
            auth_token: 'auth_tokens/tok_created_123',
            expires_at: '2026-10-23T17:00:00Z',
          }),
        );
        return;
      }
      if (
        request.method === 'DELETE' &&
        request.url?.endsWith('/auth_tokens/tok_created_123')
      ) {
        response.end(JSON.stringify({}));
        return;
      }
      response.statusCode = 404;
      response.end(JSON.stringify({error: {message: 'not found'}}));
    });

    wss = new WsServerCtor({server});
    wss.on('connection', (ws, req) => {
      lastUpgradeHeaders = req.headers;
      lastUpgradeUrl = req.url;
      ws.on('message', (raw) => {
        const event = JSON.parse(String(raw)) as {
          event_type?: string;
          id?: string;
        };
        if (event.event_type === 'interaction.connect') {
          ws.send(
            JSON.stringify({
              event_type: 'interaction.connected',
              interaction_id: event.id,
            }),
          );
        } else if (event.event_type === 'input') {
          ws.send(
            JSON.stringify({
              events: [
                {
                  event_type: 'step.start',
                  index: 0,
                  step: {type: 'model_output'},
                },
                {
                  event_type: 'step.delta',
                  index: 0,
                  delta: {type: 'text', text: 'pong'},
                },
                {event_type: 'step.stop', index: 0},
              ],
            }),
          );
        } else if (event.event_type === 'interaction.complete') {
          ws.send(JSON.stringify({event_type: 'interaction.completed'}));
        }
      });
    });

    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address !== 'object') {
      throw new Error('Server failed to bind.');
    }
    ai = new GoogleGenAI({
      apiKey: 'loopback-api-key',
      httpOptions: {
        apiVersion: 'v1beta',
        baseUrl: `http://127.0.0.1:${address.port}`,
      },
    });
  });

  afterAll(async () => {
    for (const client of wss.clients) {
      client.terminate();
    }
    wss.close();
    server.close();
    await once(server, 'close');
  });

  it('sends POST and DELETE requests for authTokens.create and authTokens.delete without leaking api_version into the body', async () => {
    recordedHttpRequests.length = 0;

    const created = await ai.interactions.authTokens.create('int_123', {
      api_version: 'v1alpha',
      expire_time: '2026-10-23T17:00:00Z',
    });
    expect(created.auth_token).toBe('auth_tokens/tok_created_123');
    expect(created.expires_at).toBe('2026-10-23T17:00:00Z');
    expect(created.sdkHttpResponse).toBeDefined();
    expect(recordedHttpRequests[0]?.method).toBe('POST');
    expect(recordedHttpRequests[0]?.url).toBe(
      '/v1alpha/interactions/int_123/auth_tokens',
    );
    expect(recordedHttpRequests[0]?.headers['x-goog-api-key']).toBe(
      'loopback-api-key',
    );
    expect(JSON.parse(recordedHttpRequests[0]!.body)).toEqual({
      expire_time: '2026-10-23T17:00:00Z',
    });

    await ai.interactions.authTokens.create('int_123');
    expect(recordedHttpRequests[1]?.method).toBe('POST');
    expect(recordedHttpRequests[1]?.url).toBe(
      '/v1beta/interactions/int_123/auth_tokens',
    );
    expect(JSON.parse(recordedHttpRequests[1]!.body)).toEqual({});

    const deleted = await ai.interactions.authTokens.delete(
      'int_123',
      created.auth_token!,
      {api_version: 'v1alpha'},
    );
    expect(deleted.sdkHttpResponse).toBeDefined();
    expect(recordedHttpRequests[2]?.method).toBe('DELETE');
    expect(recordedHttpRequests[2]?.url).toBe(
      '/v1alpha/interactions/int_123/auth_tokens/tok_created_123',
    );
    expect(recordedHttpRequests[2]?.body).toBe('');

    const deletedRaw = await ai.interactions.authTokens.delete(
      'int_123',
      'tok_created_123',
      {api_version: 'v1beta'},
    );
    expect(deletedRaw.sdkHttpResponse).toBeDefined();
    expect(recordedHttpRequests[3]?.method).toBe('DELETE');
    expect(recordedHttpRequests[3]?.url).toBe(
      '/v1beta/interactions/int_123/auth_tokens/tok_created_123',
    );

    const vertexAi = new GoogleGenAI({
      vertexai: true,
      apiKey: 'vertex-api-key',
    });
    await expectAsync(
      vertexAi.interactions.authTokens.create('int_123'),
    ).toBeRejectedWithError('Live Interactions is currently Gemini API only.');
    await expectAsync(
      vertexAi.interactions.authTokens.delete(
        'int_123',
        'auth_tokens/tok_created_123',
      ),
    ).toBeRejectedWithError('Live Interactions is currently Gemini API only.');
    expect(recordedHttpRequests.length).toBe(4);
  });

  it('connects end-to-end through real ApiClient + ws transport over loopback ws:// (and rejects CrossWebSocketFactory on cross client)', async () => {
    await expectAsync(
      ai.interactions.connect('int_cross_client'),
    ).toBeRejectedWithError(crossError().message);

    const address = server.address();
    if (!address || typeof address !== 'object') {
      throw new Error('Server address unavailable.');
    }
    const apiClient = new ApiClient({
      auth: new StaticBearerAuth('unused'),
      apiKey: 'loopback-api-key',
      vertexai: false,
      apiVersion: 'v1beta',
      httpOptions: {
        apiVersion: 'v1beta',
        baseUrl: `http://127.0.0.1:${address.port}`,
      },
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const wsFactory: WebSocketFactory = {
      create(url, headers, callbacks) {
        let ws: WsClientInstance | undefined;
        return {
          connect() {
            ws = new WsClientCtor(url, {headers});
            ws.onopen = callbacks.onopen;
            ws.onerror = callbacks.onerror;
            ws.onclose = callbacks.onclose;
            ws.onmessage = callbacks.onmessage;
          },
          send(message: string) {
            ws!.send(message);
          },
          close() {
            ws!.close();
          },
        };
      },
    };
    const interactions = new GeminiNextGenInteractions(apiClient, wsFactory);

    const connection = await interactions.connect('int_loopback');
    expect(connection.id).toBe('int_loopback');
    expect(lastUpgradeUrl).toBe('/v1beta/interactions/live');
    expect(lastUpgradeHeaders?.['x-goog-api-key']).toBe('loopback-api-key');
    expect(lastUpgradeHeaders?.['api-revision']).toBe('2026-05-20');

    await connection.send('ping');
    const turnEvents: string[] = [];
    for await (const event of connection.receive()) {
      turnEvents.push(event.event_type);
      if (event.event_type === 'step.stop') break;
    }
    expect(turnEvents).toEqual([
      'interaction.connected',
      'step.start',
      'step.delta',
      'step.stop',
    ]);

    await connection.complete();
    const completionEvents: string[] = [];
    for await (const event of connection.receive()) {
      completionEvents.push(event.event_type);
    }
    expect(completionEvents).toEqual(['interaction.completed']);
    connection.detach();
  });
});

describe('shared OpenAPI Live contract', () => {
  for (const group of ['valid', 'invalid'] as const) {
    for (const [index, event] of LIVE_CONTRACT_FIXTURES[group].entries()) {
      it(`${group} event ${index}`, async () => {
        const factory = new FakeWebSocketFactory();
        const connection = await connectWebSocketInteraction(
          parentClient(),
          factory,
          'interaction-1',
        );
        if (group === 'valid') {
          await expectAsync(
            connection.send(event as ClientEvent),
          ).toBeResolved();
        } else {
          await expectAsync(
            connection.send(event as ClientEvent),
          ).toBeRejected();
        }
        connection.detach();
      });
    }
  }
});

describe('Live interaction lifecycle and event streaming', () => {
  it('yields interaction.connected without overwriting id and ends on interaction.completed or interaction.canceled', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'original',
    );
    factory.socket!.serverEvent({
      events: [
        {event_type: 'interaction.connected', interaction_id: 'replacement'},
        {event_type: 'runtime_context_update'},
        {event_type: 'interaction.canceled'},
      ],
    });
    const events: string[] = [];
    for await (const event of connection.receive()) {
      events.push(event.event_type);
    }
    expect(events).toEqual([
      'interaction.connected',
      'runtime_context_update',
      'interaction.canceled',
    ]);
    expect(connection.id).toBe('original');
    await expectAsync(connection.send('after canceled')).toBeRejectedWithError(
      Error,
      'This live interaction is already terminal.',
    );
    connection.detach();
  });

  it('ends an established receiver on detach() without waiting for a transport close callback', async () => {
    const factory: WebSocketFactory = {
      create(_url, _headers, cb) {
        return {
          connect() {
            cb.onopen();
          },
          send() {},
          close() {},
        };
      },
    };
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'original',
    );
    const receiver = connection.receive();
    const pending = receiver.next();
    connection.detach();
    expect((await pending).done).toBeTrue();
  });
});

describe('Live timeout validation', () => {
  for (const timeout of [0, -1, NaN, Infinity]) {
    it(`rejects ${timeout} before authentication or socket creation`, async () => {
      const parent = parentClient();
      const factory = new FakeWebSocketFactory();
      await expectAsync(
        connectWebSocketInteraction(
          parent,
          factory,
          'int_test',
          {},
          {timeout_ms: timeout},
        ),
      ).toBeRejectedWithError(RangeError);
      expect(parent.getAuthHeaders).not.toHaveBeenCalled();
      expect(factory.socket).toBeUndefined();
    });
  }
});

// ============================================================================
// WebRTC Transport & React Bindings Test Doubles
// ============================================================================

interface RecordedRequest {
  method: string | undefined;
  url: string | undefined;
  headers: IncomingMessage['headers'];
  body: string;
}

class FakeRTCDataChannel {
  binaryType: 'blob' | 'arraybuffer' = 'blob';
  readyState: 'connecting' | 'open' | 'closing' | 'closed' = 'connecting';
  onopen: ((event: unknown) => void) | null = null;
  onmessage: ((event: {data: unknown}) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onclose: ((event: unknown) => void) | null = null;

  readonly sentPayloads: string[] = [];

  constructor(readonly label: string) {}

  send(data: string): void {
    this.sentPayloads.push(data);
  }

  close(): void {
    if (this.readyState === 'closed') {
      return;
    }
    this.readyState = 'closed';
    this.onclose?.({code: 1000});
  }

  open(): void {
    this.readyState = 'open';
    this.onopen?.({});
  }

  receiveJson(payload: unknown): void {
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    this.onmessage?.({
      data:
        this.binaryType === 'arraybuffer' ? bytes.buffer : new Blob([bytes]),
    });
  }

  fail(message: string): void {
    this.onerror?.(new Error(message));
  }
}

interface TrackedFakeSender {
  track: FakeMediaTrack | null;
  readonly replacedTracks: Array<FakeMediaTrack | null>;
  replaceTrack?: (withTrack: FakeMediaTrack | null) => Promise<void>;
}

class FakeRTCPeerConnection {
  connectionState: RTCPeerConnectionState = 'new';
  iceConnectionState: RTCIceConnectionState = 'new';
  iceGatheringState: 'new' | 'gathering' | 'complete' = 'new';
  localDescription: RTCSessionDescriptionInit | null = null;
  remoteDescription: RTCSessionDescriptionInit | null = null;
  sctp?: {readonly maxMessageSize?: number} | null;
  ontrack: ((event: {track: FakeMediaTrack}) => void) | null = null;
  ondatachannel: ((event: {channel: FakeRTCDataChannel}) => void) | null = null;
  onicegatheringstatechange: (() => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  oniceconnectionstatechange: (() => void) | null = null;
  closed = false;

  readonly addedTracks: Array<{
    track: FakeMediaTrack;
    streams: FakeMediaStream[];
  }> = [];
  readonly senders: TrackedFakeSender[] = [];
  readonly addedTransceivers: Array<{
    trackOrKind: FakeMediaTrack | string;
    init?: RTCRtpTransceiverInit;
    sender: TrackedFakeSender;
  }> = [];
  readonly createdChannels: FakeRTCDataChannel[] = [];

  constructor(
    private readonly options: {
      offerSdp?: string;
      autoOpenDataChannelOnRemoteDescription?: boolean;
      sctp?: {readonly maxMessageSize?: number} | null;
    } = {},
  ) {
    this.sctp = options.sctp;
  }

  private createSender(initialTrack: FakeMediaTrack | null): TrackedFakeSender {
    const sender: TrackedFakeSender = {
      track: initialTrack,
      replacedTracks: [],
      replaceTrack: async (withTrack: FakeMediaTrack | null) => {
        sender.track = withTrack;
        sender.replacedTracks.push(withTrack);
      },
    };
    this.senders.push(sender);
    return sender;
  }

  addTrack(
    track: FakeMediaTrack,
    ...streams: FakeMediaStream[]
  ): TrackedFakeSender {
    this.addedTracks.push({track, streams});
    return this.createSender(track);
  }

  getSenders(): TrackedFakeSender[] {
    return this.senders;
  }

  private readonly listeners = new Map<
    string,
    Array<(event: unknown) => void>
  >();

  addEventListener(type: string, listener: (event: unknown) => void): void {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  removeEventListener(type: string, listener: (event: unknown) => void): void {
    const list = this.listeners.get(type);
    if (!list) return;
    this.listeners.set(
      type,
      list.filter((fn) => fn !== listener),
    );
  }

  private dispatchListeners(type: string, event: unknown): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      listener.call(this, event);
    }
  }

  setConnectionState(state: RTCPeerConnectionState): void {
    this.connectionState = state;
    this.dispatchListeners('connectionstatechange', {});
    this.onconnectionstatechange?.();
  }

  setIceConnectionState(state: RTCIceConnectionState): void {
    this.iceConnectionState = state;
    this.dispatchListeners('iceconnectionstatechange', {});
    this.oniceconnectionstatechange?.();
  }

  addTransceiver(
    trackOrKind: FakeMediaTrack | string,
    init?: RTCRtpTransceiverInit,
  ): {direction: string; sender: TrackedFakeSender} {
    const initialTrack =
      typeof trackOrKind === 'object' && trackOrKind !== null
        ? trackOrKind
        : null;
    const sender = this.createSender(initialTrack);
    const entry = {trackOrKind, init, sender};
    this.addedTransceivers.push(entry);
    return {
      direction: init?.direction ?? 'sendrecv',
      sender,
    };
  }

  createDataChannel(label: string): FakeRTCDataChannel {
    const channel = new FakeRTCDataChannel(label);
    this.createdChannels.push(channel);
    return channel;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    return {
      type: 'offer',
      sdp: this.options.offerSdp ?? 'v=0\r\no=- 1 1 IN IP4 127.0.0.1\r\n',
    };
  }

  async setLocalDescription(
    description?: RTCSessionDescriptionInit,
  ): Promise<void> {
    this.localDescription = description ?? null;
  }

  async setRemoteDescription(
    description: RTCSessionDescriptionInit,
  ): Promise<void> {
    this.remoteDescription = description;
    if (this.options.autoOpenDataChannelOnRemoteDescription !== false) {
      this.connectionState = 'connected';
      for (const channel of this.createdChannels) {
        channel.open();
      }
    }
  }

  emitTrack(track: FakeMediaTrack): void {
    const event = {track};
    this.dispatchListeners('track', event);
    this.ontrack?.(event);
  }

  emitDataChannel(channel: FakeRTCDataChannel): void {
    const event = {channel};
    this.dispatchListeners('datachannel', event);
    this.ondatachannel?.(event);
  }

  close(): void {
    this.closed = true;
    this.connectionState = 'closed';
  }
}

class FakeMediaTrack {
  stopped = false;
  enabled = true;

  constructor(
    readonly kind: 'audio' | 'video',
    readonly id = `${kind}-track-1`,
  ) {}

  stop(): void {
    this.stopped = true;
  }
}

class FakeMediaStream {
  private readonly tracks: FakeMediaTrack[];

  constructor(tracks: FakeMediaTrack[] = []) {
    this.tracks = [...tracks];
  }

  getTracks(): FakeMediaTrack[] {
    return [...this.tracks];
  }

  getAudioTracks(): FakeMediaTrack[] {
    return this.tracks.filter((track) => track.kind === 'audio');
  }

  getVideoTracks(): FakeMediaTrack[] {
    return this.tracks.filter((track) => track.kind === 'video');
  }

  addTrack(track: FakeMediaTrack): void {
    if (!this.tracks.includes(track)) {
      this.tracks.push(track);
    }
  }
}

describe('Live Interactions WebRTC transport', () => {
  let server: Server;
  let baseUrl: string;
  let recordedRequests: RecordedRequest[];
  let nextResponse: {
    status?: number;
    headers?: Record<string, string>;
    body?: unknown;
  };
  let ai: GoogleGenAI;

  beforeAll(async () => {
    recordedRequests = [];
    nextResponse = {
      status: 200,
      body: {},
    };

    server = createServer((request, response) => {
      let body = '';
      request.setEncoding('utf8');
      request.on('data', (chunk: string) => {
        body += chunk;
      });
      request.on('end', () => {
        recordedRequests.push({
          method: request.method,
          url: request.url,
          headers: request.headers,
          body,
        });

        response.statusCode = nextResponse.status ?? 200;
        response.setHeader('content-type', 'application/json');
        for (const [key, value] of Object.entries(nextResponse.headers ?? {})) {
          response.setHeader(key, value);
        }
        response.end(JSON.stringify(nextResponse.body ?? {}));
      });
    });

    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address !== 'object') {
      throw new Error('Test HTTP server failed to bind.');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
    ai = new GoogleGenAI({
      apiKey: 'auth_tokens/ephemeral-webrtc-token',
      httpOptions: {
        apiVersion: 'v1beta',
        baseUrl,
      },
    });
  });

  beforeEach(() => {
    recordedRequests = [];
    nextResponse = {
      status: 200,
      body: {},
    };
  });

  afterAll(async () => {
    server.close();
    await once(server, 'close');
  });

  it('negotiates WebRTC via POST :webrtc with x-goog-api-key auth_tokens/ header, attaches remote tracks, and exchanges events over the "events" DataChannel', async () => {
    nextResponse = {
      status: 200,
      body: {
        answer_sdp: 'v=0\r\no=- 2 2 IN IP4 127.0.0.1\r\ns=GeminiAnswer\r\n',
      },
    };

    const localAudioTrack = new FakeMediaTrack('audio', 'local-mic');
    const localStream = new FakeMediaStream([localAudioTrack]);
    const audioElement: FakeMediaElement = {
      play: jasmine.createSpy('audioPlay').and.returnValue(Promise.resolve()),
    };
    const videoElement: FakeMediaElement = {
      play: jasmine.createSpy('videoPlay').and.returnValue(Promise.resolve()),
    };

    let fakePc: FakeRTCPeerConnection | undefined;
    const transport = new InteractionWebRTCTransport({
      mediaStream: castStream(localStream),
      audioElement: castAudio(audioElement),
      videoElement: castVideo(videoElement),
      peerConnectionFactory: () => {
        fakePc = new FakeRTCPeerConnection({
          offerSdp: 'v=0\r\no=- 1 1 IN IP4 127.0.0.1\r\ns=ClientOffer\r\n',
        });
        return castPC(fakePc);
      },
    });

    const session = await ai.interactions.connect('interaction-webrtc-1', {
      transport,
    });

    expect(session.transport).toBe(transport);
    expect(fakePc).toBeDefined();

    // Verify local audio track was added via addTrack and a recvonly video
    // transceiver was pre-negotiated for the missing video modality.
    expect(fakePc!.addedTracks.length).toBe(1);
    expect(fakePc!.addedTracks[0]!.track).toBe(localAudioTrack);
    expect(fakePc!.addedTransceivers.length).toBe(1);
    expect(fakePc!.addedTransceivers[0]!.trackOrKind).toBe('video');
    expect(fakePc!.addedTransceivers[0]!.init).toEqual({
      direction: 'recvonly',
    });

    // Verify SDP offer/answer HTTP POST to /v1beta/interactions/{id}:webrtc
    expect(recordedRequests.length).toBe(1);
    expect(recordedRequests[0]!.method).toBe('POST');
    expect(recordedRequests[0]!.url).toBe(
      '/v1beta/interactions/interaction-webrtc-1:webrtc',
    );
    expect(recordedRequests[0]!.headers['authorization']).toBeUndefined();
    expect(recordedRequests[0]!.headers['x-goog-api-key']).toBe(
      'auth_tokens/ephemeral-webrtc-token',
    );
    expect(recordedRequests[0]!.headers['content-type']).toBe(
      'application/json',
    );
    // Browsers cannot send `api-revision` to the API (CORS preflight).
    expect(recordedRequests[0]!.headers['api-revision']).toBeUndefined();
    expect(JSON.parse(recordedRequests[0]!.body)).toEqual({
      offer_sdp: 'v=0\r\no=- 1 1 IN IP4 127.0.0.1\r\ns=ClientOffer\r\n',
    });
    expect(fakePc!.remoteDescription).toEqual({
      type: 'answer',
      sdp: 'v=0\r\no=- 2 2 IN IP4 127.0.0.1\r\ns=GeminiAnswer\r\n',
    });

    // Simulate incoming remote audio and video tracks from the model
    const remoteAudioTrack = new FakeMediaTrack('audio', 'remote-audio-1');
    const remoteVideoTrack = new FakeMediaTrack('video', 'remote-video-1');
    fakePc!.emitTrack(remoteAudioTrack);
    fakePc!.emitTrack(remoteVideoTrack);

    expect(audioElement.srcObject).toBeDefined();
    expect(
      (audioElement.srcObject as unknown as FakeMediaStream).getTracks(),
    ).toEqual([remoteAudioTrack]);
    expect(videoElement.srcObject).toBeDefined();
    expect(
      (videoElement.srcObject as unknown as FakeMediaStream).getTracks(),
    ).toEqual([remoteVideoTrack]);
    expect(audioElement.play).toHaveBeenCalled();
    expect(videoElement.play).toHaveBeenCalled();

    // Verify sending string shorthand and generated client events over the
    // "events" RTCDataChannel
    await session.send('Hello! What can you see in my camera?');
    await session.send({
      event_type: 'input',
      content: [
        {
          type: 'image',
          data: 'base64-img',
          mime_type: 'image/jpeg',
        },
      ],
    });
    await session.send({
      event_type: 'world_setup',
      world_prompt: {
        text: 'A bioluminescent coral reef',
      },
      reference_image: {
        data: 'base64-img',
        mime_type: 'image/jpeg',
      },
    });
    await session.send({
      event_type: 'user_action',
      action: 'key_down',
      input: 'key_w',
    });

    const dataChannel = fakePc!.createdChannels[0]!;
    expect(dataChannel.label).toBe('events');
    expect(dataChannel.sentPayloads.map((p) => JSON.parse(p))).toEqual([
      {
        event_type: 'input',
        content: [
          {type: 'text', text: 'Hello! What can you see in my camera?'},
        ],
      },
      {
        event_type: 'input',
        content: [
          {
            type: 'image',
            data: 'base64-img',
            mime_type: 'image/jpeg',
          },
        ],
      },
      {
        event_type: 'world_setup',
        world_prompt: {
          text: 'A bioluminescent coral reef',
        },
        reference_image: {
          data: 'base64-img',
          mime_type: 'image/jpeg',
        },
      },
      {
        event_type: 'user_action',
        action: 'key_down',
        input: 'key_w',
      },
    ]);

    // Simulate server events arriving over the "events" RTCDataChannel
    dataChannel.receiveJson({
      event_type: 'step.start',
      index: 0,
      step: {type: 'model_output'},
    });
    dataChannel.receiveJson({
      event_type: 'step.delta',
      index: 0,
      delta: {
        type: 'text',
        text: 'Ahoy! I see your desk!',
      },
    });
    dataChannel.receiveJson({
      event_type: 'step.stop',
      index: 0,
    });

    const received = [];
    for await (const event of session.receive()) {
      received.push(event);
      if (received.length === 3) break;
    }
    expect(received.map((e) => e.event_type)).toEqual([
      'step.start',
      'step.delta',
      'step.stop',
    ]);

    // Verify closing the session sends interaction.disconnect and tears down
    // RTCPeerConnection and RTCDataChannel without stopping caller-owned local
    // MediaStream tracks.
    session.detach();
    expect(
      JSON.parse(
        dataChannel.sentPayloads[dataChannel.sentPayloads.length - 1]!,
      ),
    ).toEqual({
      event_type: 'interaction.disconnect',
    });
    expect(fakePc!.closed).toBeTrue();
    expect(localAudioTrack.stopped).toBeFalse();
    expect(audioElement.srcObject).toBeNull();
    expect(videoElement.srcObject).toBeNull();
  });

  it('sends an API key passed as auth_token unchanged on WebRTC signaling', async () => {
    nextResponse = {
      status: 200,
      body: {
        answer_sdp: 'v=0\r\no=- 5 5 IN IP4 127.0.0.1\r\n',
      },
    };

    const ai2 = new GoogleGenAI({
      apiKey: 'AQ.test-api-key',
      httpOptions: {baseUrl},
    });

    const session = await ai2.interactions.connect('interaction-api-key', {
      transport: new InteractionWebRTCTransport({
        peerConnectionFactory: () => castPC(new FakeRTCPeerConnection()),
      }),
    });

    expect(recordedRequests[0]!.headers['x-goog-api-key']).toBe(
      'AQ.test-api-key',
    );

    session.detach();
  });

  it('decodes ArrayBuffer, Uint8Array, and Node Buffer frames over the WebRTC DataChannel', async () => {
    nextResponse = {
      status: 200,
      body: {
        answer_sdp: 'v=0\r\no=- 4 4 IN IP4 127.0.0.1\r\n',
      },
    };

    let fakePc: FakeRTCPeerConnection | undefined;
    const transport = new InteractionWebRTCTransport({
      peerConnectionFactory: () => {
        fakePc = new FakeRTCPeerConnection();
        return castPC(fakePc);
      },
    });

    const session = await ai.interactions.connect('interaction-binary-frames', {
      transport,
    });
    const dataChannel = fakePc!.createdChannels[0]!;
    const encoder = new TextEncoder();

    // 1. Raw ArrayBuffer frame
    const startBytes = encoder.encode(
      JSON.stringify({
        event_type: 'step.start',
        index: 0,
        step: {
          type: 'model_output',
          content: [{type: 'function_call', name: 'lookup'}],
        },
      }),
    );
    dataChannel.onmessage?.({data: startBytes.buffer});

    // 2. Uint8Array slice with non-zero byteOffset
    const deltaJson = JSON.stringify({
      event_type: 'step.delta',
      index: 0,
      delta: {function_call: {name: 'lookup'}},
    });
    const padded = new Uint8Array(deltaJson.length + 8);
    padded.set(encoder.encode(deltaJson), 4);
    const slicedView = padded.subarray(4, 4 + deltaJson.length);
    dataChannel.onmessage?.({data: slicedView});

    // 3. Node.js Buffer instance (where ArrayBuffer.isView(buf) === true)
    const stopBuffer = Buffer.from(
      JSON.stringify({
        event_type: 'step.stop',
        index: 0,
      }),
      'utf8',
    );
    dataChannel.onmessage?.({data: stopBuffer});

    const events: string[] = [];
    for await (const event of session.receive()) {
      events.push(event.event_type);
      if (events.length === 3) break;
    }
    expect(events).toEqual(['step.start', 'step.delta', 'step.stop']);

    session.detach();
  });

  it('offers receive-only audio and video by default when there are no local tracks', async () => {
    nextResponse = {
      status: 200,
      body: {
        answer_sdp: 'v=0\r\no=- 4 4 IN IP4 127.0.0.1\r\n',
      },
    };

    let fakePc: FakeRTCPeerConnection | undefined;
    const transport = new InteractionWebRTCTransport({
      peerConnectionFactory: () => {
        fakePc = new FakeRTCPeerConnection();
        return castPC(fakePc);
      },
    });

    const session = await ai.interactions.connect('interaction-recvonly', {
      transport,
    });

    expect(
      fakePc!.addedTransceivers.map(({trackOrKind, init}) => ({
        trackOrKind,
        init,
      })),
    ).toEqual([
      {trackOrKind: 'audio', init: {direction: 'recvonly'}},
      {trackOrKind: 'video', init: {direction: 'recvonly'}},
    ]);

    session.detach();
  });

  it('isolates overlapping connect() attempts so a superseded attempt never tears down a newer connection', async () => {
    const peerConnections: FakeRTCPeerConnection[] = [];
    let fetchCallCount = 0;
    let rejectFirstFetch!: (error: Error) => void;

    const customFetch = (async () => {
      fetchCallCount += 1;
      if (fetchCallCount === 1) {
        return new Promise<Response>((_resolve, reject) => {
          rejectFirstFetch = reject;
        });
      }
      return new Response(
        JSON.stringify({
          answer_sdp: 'v=0\r\no=- 9 9 IN IP4 127.0.0.1\r\n',
        }),
        {
          status: 200,
          headers: {'content-type': 'application/json'},
        },
      );
    }) as unknown as typeof fetch;

    const testAi = new GoogleGenAI({
      apiKey: 'test',
      httpOptions: {fetch: customFetch},
    });

    const transport = new InteractionWebRTCTransport({
      peerConnectionFactory: () => {
        const pc = new FakeRTCPeerConnection();
        peerConnections.push(pc);
        return castPC(pc);
      },
    });

    // Start attempt #1 and wait until it is blocked inside customFetch
    const firstConnectPromise = testAi.interactions.connect(
      'interaction-race-1',
      {
        transport,
      },
    );
    const firstRejection =
      expectAsync(firstConnectPromise).toBeRejectedWithError(APIWebRTCError);
    for (let i = 0; i < 20 && fetchCallCount === 0; i++) {
      await Promise.resolve();
    }
    expect(peerConnections.length).toBe(1);
    expect(fetchCallCount).toBe(1);
    const pc1 = peerConnections[0]!;

    // Start attempt #2 on the same transport before attempt #1's fetch settles
    const secondSession = await testAi.interactions.connect(
      'interaction-race-2',
      {
        transport,
      },
    );
    expect(peerConnections.length).toBe(2);
    expect(fetchCallCount).toBe(2);
    const pc2 = peerConnections[1]!;
    expect(pc1.closed).toBeTrue();
    expect(pc2.closed).toBeFalse();
    expect(transport.peerConnection as unknown as FakeRTCPeerConnection).toBe(
      pc2,
    );
    expect(transport.peerConnection?.connectionState).toBe('connected');

    // Now reject attempt #1's in-flight fetch and verify pc2 remains untouched
    rejectFirstFetch(new Error('late network failure'));
    await firstRejection;
    expect(pc2.closed).toBeFalse();
    expect(transport.peerConnection as unknown as FakeRTCPeerConnection).toBe(
      pc2,
    );
    expect(transport.dataChannel as unknown as FakeRTCDataChannel).toBe(
      pc2.createdChannels[0]!,
    );
    expect(transport.peerConnection?.connectionState).toBe('connected');

    await secondSession.send('Still alive on attempt 2');
    expect(pc2.createdChannels[0]!.sentPayloads.length).toBe(1);

    secondSession.detach();
    expect(pc2.closed).toBeTrue();
  });

  it('reports missing RTCPeerConnection support instead of a generic setup failure', async () => {
    await expectAsync(
      ai.interactions.connect('interaction-no-webrtc', {transport: 'webrtc'}),
    ).toBeRejectedWithError(Error, /RTCPeerConnection/);
  });

  it('throws APIWebRTCError with httpStatus and serverCode when WebRTC HTTP signaling fails', async () => {
    nextResponse = {
      status: 403,
      body: {
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Invalid or expired auth token',
        },
      },
    };

    let fakePc: FakeRTCPeerConnection | undefined;
    const transport = new InteractionWebRTCTransport({
      peerConnectionFactory: () => {
        fakePc = new FakeRTCPeerConnection();
        return castPC(fakePc);
      },
    });

    let caughtError: unknown;
    try {
      await ai.interactions.connect('interaction-bad-auth', {
        transport,
      });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(APIWebRTCError);
    expect((caughtError as APIWebRTCError).httpStatus).toBe(403);
    expect((caughtError as APIWebRTCError).serverCode).toBe(
      'PERMISSION_DENIED',
    );
    expect((caughtError as APIWebRTCError).message).toContain(
      'Invalid or expired auth token',
    );
    expect(fakePc!.closed).toBeTrue();
  });

  it('supports server-initiated ondatachannel, asynchronous data channel opening after setRemoteDescription, and data channel open timeouts', async () => {
    nextResponse = {
      status: 200,
      body: {
        answer_sdp: 'v=0\r\no=- 20 20 IN IP4 127.0.0.1\r\n',
      },
    };

    // 1. Server-initiated "events" data channel via pc.ondatachannel when
    // client-created channel has not opened yet
    let serverInitiatedPc: FakeRTCPeerConnection | undefined;
    let userOnDataChannelSeen: string | undefined;
    const serverChannel = new FakeRTCDataChannel('events');
    const transport1 = new InteractionWebRTCTransport({
      onPeerConnection: (pc) => {
        pc.ondatachannel = (event) => {
          userOnDataChannelSeen = event.channel.label;
        };
      },
      peerConnectionFactory: () => {
        serverInitiatedPc = new FakeRTCPeerConnection({
          autoOpenDataChannelOnRemoteDescription: false,
        });
        return castPC(serverInitiatedPc);
      },
    });

    const connectPromise1 = ai.interactions.connect('interaction-server-dc', {
      transport: transport1,
    });
    for (
      let i = 0;
      i < 20 && serverInitiatedPc?.remoteDescription === null;
      i++
    ) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    serverInitiatedPc!.emitDataChannel(serverChannel);
    expect(userOnDataChannelSeen).toBe('events');
    serverChannel.open();
    const session1 = await connectPromise1;

    // Yield initial interaction.connected along with turn events in receive()
    serverChannel.receiveJson({
      event_type: 'interaction.connected',
      interaction_id: 'interaction-server-dc',
    });
    serverChannel.receiveJson({
      event_type: 'step.start',
      index: 0,
      step: {type: 'model_output'},
    });
    serverChannel.receiveJson({
      event_type: 'step.stop',
      index: 0,
    });
    const received1: string[] = [];
    for await (const ev of session1.receive()) {
      received1.push(ev.event_type);
      if (received1.length === 3) break;
    }
    expect(received1).toEqual([
      'interaction.connected',
      'step.start',
      'step.stop',
    ]);

    // Client-created channel closing while server channel remains open does not
    // drop the session
    serverInitiatedPc!.createdChannels[0]!.close();
    await session1.send('over server channel');
    expect(serverChannel.sentPayloads.length).toBe(1);
    session1.detach();

    // 2. Data channel open timeout when autoOpenDataChannelOnRemoteDescription is false
    const transportTimeout = new InteractionWebRTCTransport({
      peerConnectionFactory: () =>
        castPC(
          new FakeRTCPeerConnection({
            autoOpenDataChannelOnRemoteDescription: false,
          }),
        ),
    });
    await expectAsync(
      ai.interactions.connect(
        'interaction-dc-timeout',
        {transport: transportTimeout},
        {timeout_ms: 40},
      ),
    ).toBeRejectedWithError(APIWebRTCError, /Timed out/);
  });

  it('validates SCTP maxMessageSize, readyState, mismatched interaction.connected, and unexpected data channel / peer connection failures', async () => {
    nextResponse = {
      status: 200,
      body: {
        answer_sdp: 'v=0\r\no=- 21 21 IN IP4 127.0.0.1\r\n',
      },
    };

    let fakePc: FakeRTCPeerConnection | undefined;
    const transport = new InteractionWebRTCTransport({
      peerConnectionFactory: () => {
        fakePc = new FakeRTCPeerConnection({
          sctp: {maxMessageSize: 128},
        });
        return castPC(fakePc);
      },
    });

    const session = await ai.interactions.connect('interaction-sctp-limits', {
      transport,
    });
    const dc = fakePc!.createdChannels[0]!;

    // 1. Oversized message throws RangeError synchronously without closing session
    await expectAsync(session.send('X'.repeat(200))).toBeRejectedWithError(
      RangeError,
      /maxMessageSize/,
    );
    expect(fakePc!.closed).toBeFalse();

    // 2. Non-open data channel throws Error without closing session
    dc.readyState = 'connecting';
    await expectAsync(session.send('still connecting')).toBeRejectedWithError(
      Error,
      /not open/,
    );
    dc.readyState = 'open';
    await session.send('fits within 128 bytes');
    expect(dc.sentPayloads.length).toBe(1);

    // 3. Unexpected remote data channel close reports 1006, closes pc, and fails receive()
    dc.readyState = 'closed';
    dc.onclose?.({});
    expect(fakePc!.closed).toBeTrue();
    await expectAsync(session.receive().next()).toBeRejectedWithError(
      APIWebRTCError,
      /1006/,
    );

    // 4. PeerConnection transitioning to "failed" mid-session closes pc and fails receive() with 1006
    let failedPc: FakeRTCPeerConnection | undefined;
    const failedTransport = new InteractionWebRTCTransport({
      peerConnectionFactory: () => {
        failedPc = new FakeRTCPeerConnection();
        return castPC(failedPc);
      },
    });
    const failedSession = await ai.interactions.connect(
      'interaction-pc-failed',
      {
        transport: failedTransport,
      },
    );
    failedPc!.setConnectionState('failed');
    expect(failedPc!.closed).toBeTrue();
    expect(failedPc!.createdChannels[0]!.readyState).toBe('closed');
    await expectAsync(failedSession.receive().next()).toBeRejectedWithError(
      APIWebRTCError,
      /1006/,
    );

    // 5. Non-text / non-buffer WebRTC data channel message fails with APIWebRTCError
    let binaryPc: FakeRTCPeerConnection | undefined;
    const binarySession = await ai.interactions.connect(
      'interaction-webrtc-non-text',
      {
        transport: new InteractionWebRTCTransport({
          peerConnectionFactory: () => {
            binaryPc = new FakeRTCPeerConnection();
            return castPC(binaryPc);
          },
        }),
      },
    );
    binaryPc!.createdChannels[0]!.onmessage?.({data: {unexpected: true}});
    await expectAsync(binarySession.receive().next()).toBeRejectedWithError(
      APIWebRTCError,
      'Live interaction server frames must contain UTF-8 JSON text.',
    );
  });

  it('handles syncMediaElements stream reuse, rejected play() promises, audio-before-video separation', async () => {
    nextResponse = {
      status: 200,
      body: {
        answer_sdp: 'v=0\r\no=- 22 22 IN IP4 127.0.0.1\r\n',
      },
    };

    const audioElement: FakeMediaElement = {
      play: jasmine
        .createSpy('audioPlayReject')
        .and.callFake(() => Promise.reject(new Error('Autoplay blocked'))),
    };
    const videoElement: FakeMediaElement = {
      play: jasmine.createSpy('videoPlaySyncThrow').and.callFake(() => {
        throw new Error('Sync play error');
      }),
    };

    const preMutedMic = new FakeMediaTrack('audio', 'pre-muted-mic');
    preMutedMic.enabled = false;
    let fakePc: FakeRTCPeerConnection | undefined;
    const transport = new InteractionWebRTCTransport({
      mediaStream: castStream(new FakeMediaStream([preMutedMic])),
      audioElement: castAudio(audioElement),
      videoElement: castVideo(videoElement),
      peerConnectionFactory: () => {
        fakePc = new FakeRTCPeerConnection();
        return castPC(fakePc);
      },
    });

    const session = await ai.interactions.connect('interaction-media-sync', {
      transport,
    });
    // Caller-owned track's .enabled was not overwritten on connect()
    expect(preMutedMic.enabled).toBeFalse();

    // When audio arrives before video while both audioElement and videoElement
    // are attached, audioElement gets the audio stream and videoElement.srcObject
    // stays null until a video track arrives.
    const remoteAudio1 = new FakeMediaTrack('audio', 'ra-1');
    fakePc!.emitTrack(remoteAudio1);
    const firstAudioStream =
      audioElement.srcObject as unknown as FakeMediaStream;
    expect(firstAudioStream).toBeDefined();
    expect(videoElement.srcObject).toBeNull();

    // Emitting a second audio track reuses the same MediaStream instance
    const remoteAudio2 = new FakeMediaTrack('audio', 'ra-2');
    fakePc!.emitTrack(remoteAudio2);
    expect(audioElement.srcObject).toBe(firstAudioStream);
    expect(firstAudioStream.getTracks()).toEqual([remoteAudio1, remoteAudio2]);

    // Emitting a video track attaches only video to videoElement
    const remoteVideo1 = new FakeMediaTrack('video', 'rv-1');
    fakePc!.emitTrack(remoteVideo1);
    const firstVideoStream =
      videoElement.srcObject as unknown as FakeMediaStream;
    expect(firstVideoStream.getTracks()).toEqual([remoteVideo1]);

    session.detach();
  });

  it('preserves user handlers set in onPeerConnection alongside SDK handlers, passes rtcConfiguration, and preserves elements', async () => {
    nextResponse = {
      status: 200,
      body: {
        answer_sdp: 'v=0\r\no=- 99 99 IN IP4 127.0.0.1\r\n',
      },
    };

    let passedRtcConfig: RTCConfiguration | undefined;
    let fakePc: FakeRTCPeerConnection | undefined;
    let onTrackEventReceived: RTCTrackEvent | undefined;
    const onTrackThisValues: unknown[] = [];
    let onConnectionStateChangeCalls = 0;
    let onIceConnectionStateChangeCalls = 0;
    const onDataChannelLabels: string[] = [];

    const audioElement = castAudio({});
    const videoElement = castVideo({});
    const rtcConfig: RTCConfiguration = {
      iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
    };

    const transport = new InteractionWebRTCTransport({
      audioElement,
      videoElement,
      rtcConfiguration: rtcConfig,
      onPeerConnection: (pc) => {
        pc.ontrack = function (event) {
          onTrackThisValues.push(this);
          onTrackEventReceived = event;
        };
        pc.onconnectionstatechange = () => {
          onConnectionStateChangeCalls += 1;
        };
        pc.oniceconnectionstatechange = () => {
          onIceConnectionStateChangeCalls += 1;
        };
        pc.ondatachannel = (event) => {
          onDataChannelLabels.push(event.channel.label);
        };
      },
      peerConnectionFactory: (config) => {
        passedRtcConfig = config;
        fakePc = new FakeRTCPeerConnection();
        return castPC(fakePc);
      },
    });

    expect(transport.getAudioElement()).toBe(audioElement);
    expect(transport.getVideoElement()).toBe(videoElement);
    expect('connectionState' in transport).toBeFalse();

    const session = await ai.interactions.connect('interaction-config-test', {
      transport,
    });
    expect(passedRtcConfig).toBe(rtcConfig);
    expect(transport.peerConnection?.connectionState).toBe('connected');

    const remoteAudio = new FakeMediaTrack('audio', 'remote-audio');
    fakePc!.emitTrack(remoteAudio);
    expect(onTrackEventReceived?.track).toBe(
      remoteAudio as unknown as MediaStreamTrack,
    );
    expect(onTrackThisValues).toEqual([transport.peerConnection]);
    expect(transport.remoteMediaStream).toBeDefined();
    expect(audioElement.srcObject).toBeDefined();

    fakePc!.setConnectionState('disconnected');
    expect(onConnectionStateChangeCalls).toBe(1);
    expect(transport.peerConnection?.connectionState).toBe('disconnected');

    fakePc!.oniceconnectionstatechange?.();
    expect(onIceConnectionStateChangeCalls).toBe(1);

    const customChannel = new FakeRTCDataChannel('custom');
    fakePc!.emitDataChannel(customChannel);
    expect(onDataChannelLabels).toEqual(['custom']);

    // Assigning pc.onconnectionstatechange AFTER connect() must not wipe out
    // the SDK's internal failure listener registered via addEventListener.
    let postConnectHandlerCalled = false;
    session.transport.peerConnection!.onconnectionstatechange = () => {
      postConnectHandlerCalled = true;
    };
    fakePc!.setConnectionState('failed');
    expect(postConnectHandlerCalled).toBeTrue();
    await expectAsync(session.receive().next()).toBeRejectedWithError(
      APIWebRTCError,
    );

    session.detach();
    expect(transport.peerConnection).toBeUndefined();
  });

  it('type-checks real browser types for WebRTC inputs', () => {
    const makeMinimalPc = (): Pick<
      RTCPeerConnection,
      | 'addEventListener'
      | 'addTrack'
      | 'addTransceiver'
      | 'close'
      | 'connectionState'
      | 'createDataChannel'
      | 'createOffer'
      | 'iceConnectionState'
      | 'localDescription'
      | 'removeEventListener'
      | 'sctp'
      | 'setLocalDescription'
      | 'setRemoteDescription'
    > => {
      throw new Error('unused');
    };
    const transport = new InteractionWebRTCTransport({
      rtcConfiguration: {iceCandidatePoolSize: 4},
      peerConnectionFactory: makeMinimalPc,
    });
    transport.peerConnection?.getStats();
    expect(transport.peerConnection).toBeUndefined();
  });

  it('unexpected non-SDK exception during WebRTC setup surfaces as APIWebRTCError with generic message', async () => {
    const parent = parentClient();
    const mockFactory = jasmine.createSpy().and.throwError('secret');
    const transport = new InteractionWebRTCTransport({
      peerConnectionFactory:
        mockFactory as unknown as InteractionWebRTCTransportOptions['peerConnectionFactory'],
    });

    let caughtError: unknown;
    try {
      await connectWebRTCInteraction(parent, 'interaction-1', {
        transport,
      });
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeInstanceOf(APIWebRTCError);
    expect((caughtError as APIWebRTCError).message).toBe(
      'Failed to complete WebRTC live setup.',
    );
    expect((caughtError as Error).message).not.toContain('secret');
  });
});

describe('APIError hierarchy and exports', () => {
  it('APIWebSocketError inherits from APIConnectionError and APIError with options constructor', () => {
    const error = new APIWebSocketError({
      message: 'test',
      closeCode: 1000,
      httpStatus: 200,
      serverCode: 'OK',
    });
    expect(error).toBeInstanceOf(APIConnectionError);
    expect(error).toBeInstanceOf(APIError);
    expect(error.message).toBe('test');
    expect(error.closeCode).toBe(1000);
    expect(error.httpStatus).toBe(200);
    expect(error.serverCode).toBe('OK');

    const defaultError = new APIWebSocketError();
    expect(defaultError.message).toBe('WebSocket connection error.');
    expect(defaultError.closeCode).toBeUndefined();
    expect(defaultError.httpStatus).toBeUndefined();
    expect(defaultError.serverCode).toBeUndefined();
  });

  it('APIWebRTCError inherits from APIConnectionError and APIError with options constructor', () => {
    const error = new APIWebRTCError({
      message: 'test',
      closeCode: 1001,
      httpStatus: 500,
      serverCode: 'FAIL',
    });
    expect(error).toBeInstanceOf(APIConnectionError);
    expect(error).toBeInstanceOf(APIError);
    expect(error.message).toBe('test');
    expect(error.closeCode).toBe(1001);
    expect(error.httpStatus).toBe(500);
    expect(error.serverCode).toBe('FAIL');

    const defaultError = new APIWebRTCError();
    expect(defaultError.message).toBe('WebRTC connection error.');
    expect(defaultError.closeCode).toBeUndefined();
    expect(defaultError.httpStatus).toBeUndefined();
    expect(defaultError.serverCode).toBeUndefined();
  });

  it('extracts httpStatus on WebSocket upgrade HTTP rejection', async () => {
    const httpServer = createServer((_req, res) => {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({error: {message: 'secret-api-key-invalid'}}));
    });
    httpServer.listen(0, '127.0.0.1');
    await once(httpServer, 'listening');
    try {
      const address = httpServer.address();
      if (!address || typeof address !== 'object') {
        throw new Error('HTTP server address unavailable.');
      }
      const apiClient = new ApiClient({
        auth: new StaticBearerAuth('unused'),
        apiKey: 'bad-key',
        vertexai: false,
        apiVersion: 'v1beta',
        httpOptions: {
          apiVersion: 'v1beta',
          baseUrl: `http://127.0.0.1:${address.port}`,
        },
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const wsFactory: WebSocketFactory = {
        create(url, headers, callbacks) {
          let ws: WsClientInstance | undefined;
          return {
            connect() {
              ws = new WsClientCtor(url, {headers});
              ws.onopen = callbacks.onopen;
              ws.onerror = callbacks.onerror;
              ws.onclose = callbacks.onclose;
              ws.onmessage = callbacks.onmessage;
            },
            send(message: string) {
              ws!.send(message);
            },
            close() {
              ws?.close();
            },
          };
        },
      };

      let caughtError: unknown;
      try {
        await connectWebSocketInteraction(apiClient, wsFactory, 'int_401');
      } catch (err) {
        caughtError = err;
      }
      expect(caughtError).toBeInstanceOf(APIWebSocketError);
      expect((caughtError as APIWebSocketError).httpStatus).toBe(401);
      expect((caughtError as APIWebSocketError).closeCode).toBeUndefined();
      expect((caughtError as Error).message).not.toContain('secret');
    } finally {
      httpServer.close();
      await once(httpServer, 'close');
    }

    const structuredErrorFactory: WebSocketFactory = {
      create: (_url, _headers, callbacks) => ({
        connect: () => {
          callbacks.onerror({response: {statusCode: 403}});
        },
        send: () => {},
        close: () => {},
      }),
    };
    let structuredCaught: unknown;
    try {
      await connectWebSocketInteraction(
        parentClient(),
        structuredErrorFactory,
        'int_403',
      );
    } catch (err) {
      structuredCaught = err;
    }
    expect(structuredCaught).toBeInstanceOf(APIWebSocketError);
    expect((structuredCaught as APIWebSocketError).httpStatus).toBe(403);
    expect((structuredCaught as APIWebSocketError).closeCode).toBeUndefined();
  });

  it('local-misuse error is rethrown unchanged, is instanceof Error, and is not instanceof APIError', async () => {
    let caughtError: unknown;
    try {
      await connectWebSocketInteraction(parentClient(), undefined, '');
    } catch (e) {
      caughtError = e;
    }
    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError).not.toBeInstanceOf(APIError);
    expect(caughtError).not.toBeInstanceOf(APIConnectionError);
    expect((caughtError as Error).message).toBe(
      'A non-empty interaction ID is required to connect.',
    );
  });

  it('local-misuse Error is not an APIError', () => {
    const error = new Error('local misuse');
    expect(error).not.toBeInstanceOf(APIError);
    expect(error).not.toBeInstanceOf(APIConnectionError);
  });

  it('WebSocket authentication header failure throws APIWebSocketError', async () => {
    const parent = parentClient();
    parent.getApiKey = () => undefined;
    parent.getAuthHeaders = jasmine
      .createSpy('getAuthHeadersReject')
      .and.rejectWith(
        Object.assign(new Error('Bearer secret-token'), {status: 401}),
      );

    let caughtError: unknown;
    try {
      await connectWebSocketInteraction(
        parent,
        new FakeWebSocketFactory(),
        'interaction-ws-auth',
      );
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeInstanceOf(APIWebSocketError);
    expect((caughtError as APIWebSocketError).message).toBe(
      'Live authentication setup failed.',
    );
    expect((caughtError as APIWebSocketError).httpStatus).toBe(401);
    expect((caughtError as Error).message).not.toContain('secret-token');
  });

  it('WebRTC authentication header failure throws APIWebRTCError with httpStatus', async () => {
    const parent = parentClient();
    parent.getApiKey = () => undefined;
    parent.getAuthHeaders = jasmine
      .createSpy('getAuthHeadersRejectRtc')
      .and.rejectWith(
        Object.assign(new Error('Bearer secret-token'), {status: 401}),
      );
    const transport = new InteractionWebRTCTransport({
      peerConnectionFactory: () => castPC(new FakeRTCPeerConnection()),
    });

    let caughtError: unknown;
    try {
      await connectWebRTCInteraction(parent, 'interaction-rtc-auth', {
        transport,
      });
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeInstanceOf(APIWebRTCError);
    expect((caughtError as APIWebRTCError).message).toBe(
      'Live authentication setup failed.',
    );
    expect((caughtError as APIWebRTCError).httpStatus).toBe(401);
    expect((caughtError as Error).message).not.toContain('secret-token');
  });
});

describe('LiveConnect options parity, apiKey routing, and symmetric transports', () => {
  it('Node WebSocket sends x-goog-api-key for auth_tokens/xyz and AIzaSy123 without query param, while browser WebSocket sends ?auth_token=', async () => {
    const parentToken = parentClient();
    (
      parentToken as unknown as {getApiKey: () => string | undefined}
    ).getApiKey = () => 'auth_tokens/xyz';
    const factoryToken = new FakeWebSocketFactory();
    const pendingToken = connectWebSocketInteraction(
      parentToken,
      factoryToken,
      'int_node',
    );
    await pendingToken.catch(() => {});

    expect(factoryToken.url).toBe(
      'wss://generativelanguage.googleapis.com/root/v1beta/interactions/live',
    );
    expect(factoryToken.headers).toEqual({
      'x-goog-api-client': 'test-client',
      'x-goog-api-key': 'auth_tokens/xyz',
      'api-revision': '2026-05-20',
    });

    const browserLikeFactory = new FakeWebSocketFactory();
    browserLikeFactory.supportsHeaders = false;
    const pendingBrowserToken = connectWebSocketInteraction(
      parentToken,
      browserLikeFactory,
      'int_browser',
    );
    await pendingBrowserToken.catch(() => {});

    expect(browserLikeFactory.url).toBe(
      'wss://generativelanguage.googleapis.com/root/v1beta/interactions/live?auth_token=auth_tokens%2Fxyz',
    );
    expect(browserLikeFactory.headers).toEqual({
      'x-goog-api-client': 'test-client',
      'api-revision': '2026-05-20',
    });

    const parentKey = parentClient();
    (parentKey as unknown as {getApiKey: () => string | undefined}).getApiKey =
      () => 'AIzaSy123';
    const factoryKey = new FakeWebSocketFactory();
    const pendingKey = connectWebSocketInteraction(
      parentKey,
      factoryKey,
      'int_node',
    );
    await pendingKey.catch(() => {});

    expect(factoryKey.url).toBe(
      'wss://generativelanguage.googleapis.com/root/v1beta/interactions/live',
    );
    expect(factoryKey.headers).toEqual({
      'x-goog-api-client': 'test-client',
      'x-goog-api-key': 'AIzaSy123',
      'api-revision': '2026-05-20',
    });
  });

  it('forward api_version, timeout_ms, and headers on both WebSocket and WebRTC', async () => {
    const parent = parentClient();
    const wsFactory = new FakeWebSocketFactory();
    const wsPending = connectWebSocketInteraction(
      parent,
      wsFactory,
      'int_ws',
      {api_version: 'v1alpha', transport: 'websocket'},
      {timeout_ms: 50, headers: {'x-custom-ws': 'ws'}},
    );
    await wsPending.catch(() => {});

    expect(wsFactory.url).toBe(
      'wss://generativelanguage.googleapis.com/root/v1alpha/interactions/live',
    );
    expect(wsFactory.headers!['x-custom-ws']).toBe('ws');

    const webrtcTransport = new InteractionWebRTCTransport();
    spyOn(
      webrtcTransport as unknown as {connect: () => Promise<void>},
      'connect',
    ).and.rejectWith(new Error('Stop'));

    const rtcPending = connectWebRTCInteraction(
      parent,
      'int_rtc',
      {api_version: 'v1alpha', transport: webrtcTransport},
      {timeout_ms: 60, headers: {'x-custom-rtc': 'rtc'}},
    );
    await rtcPending.catch(() => {});

    expect(
      (webrtcTransport as unknown as {connect: () => Promise<void>}).connect,
    ).toHaveBeenCalled();
    const interactions = new GeminiNextGenInteractions(parent, wsFactory);
    await interactions
      .connect(
        'int_rtc_dispatch',
        {api_version: 'v1alpha', transport: webrtcTransport},
        {timeout_ms: 60, headers: {'x-custom-rtc': 'rtc'}},
      )
      .catch(() => {});
    expect(
      (webrtcTransport as unknown as {connect: () => Promise<void>}).connect,
    ).toHaveBeenCalledTimes(2);

    const parentWithClientTimeout = {
      ...parentClient(),
      getTimeout: () => 5,
    };
    const silentFactory: WebSocketFactory = {
      create: () => ({
        connect: () => {},
        send: () => {},
        close: () => {},
      }),
    };
    await expectAsync(
      connectWebSocketInteraction(
        parentWithClientTimeout,
        silentFactory,
        'int_client_timeout',
      ),
    ).toBeRejectedWithError(APIWebSocketError);
  });
});

describe('Live Interactions typing and exports', () => {
  it('exports InteractionWebSocketConnection and InteractionWebRTCConnection without LiveInteractionConnection', () => {
    expect(PublicIndex.InteractionWebSocketConnection).toBe(
      InteractionWebSocketConnection,
    );
    expect(PublicIndex.InteractionWebRTCConnection).toBe(
      InteractionWebRTCConnection,
    );
    // The Interactions APIError/APIConnectionError stay private; only the Live
    // transport errors are public.
    expect('APIConnectionError' in PublicIndex).toBeFalse();
    expect('APIError' in PublicIndex).toBeFalse();
    expect('GeminiNextGenAPIClientError' in PublicIndex).toBeFalse();
    expect(PublicIndex.APIWebSocketError).toBe(APIWebSocketError);
    expect(PublicIndex.APIWebRTCError).toBe(APIWebRTCError);
    expect(WebIndex.InteractionWebSocketConnection).toBe(
      InteractionWebSocketConnection,
    );
    expect(WebIndex.InteractionWebRTCConnection).toBe(
      InteractionWebRTCConnection,
    );
    expect(WebIndex.InteractionWebRTCTransport).toBe(
      InteractionWebRTCTransport,
    );
    expect(WebIndex.APIWebSocketError).toBe(APIWebSocketError);
    expect(WebIndex.APIWebRTCError).toBe(APIWebRTCError);
    expect('LiveInteractionConnection' in PublicIndex).toBeFalse();
    expect('InteractionBaseConnection' in PublicIndex).toBeFalse();
    expect('LocalUsageError' in PublicIndex).toBeFalse();

    const checkTypes = async (ai: GoogleGenAI) => {
      const wsConn: InteractionWebSocketConnection =
        await ai.interactions.connect('id');
      const rtcConn: InteractionWebRTCConnection =
        await ai.interactions.connect('id', {transport: 'webrtc'});
      const rtcCustomConn: InteractionWebRTCConnection =
        await ai.interactions.connect('id', {
          transport: new InteractionWebRTCTransport(),
        });
      const transport: InteractionWebRTCTransport = rtcConn.transport;
      return [wsConn, rtcConn, rtcCustomConn, transport];
    };
    expect(typeof checkTypes).toBe('function');
  });
});

describe('Live interaction edge cases and Python/TS alignment', () => {
  it('rejects send() after detach()', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'int_detached_send',
    );
    connection.detach();

    await expectAsync(connection.send('after detach')).toBeRejectedWithError(
      Error,
      'This live interaction is detached.',
    );
    await expectAsync(connection.complete()).toBeRejectedWithError(
      Error,
      'This live interaction is detached.',
    );
    await expectAsync(connection.cancel()).toBeRejectedWithError(
      Error,
      'This live interaction is detached.',
    );
    expect(factory.socket!.sent.map((frame) => JSON.parse(frame))).toEqual([
      {event_type: 'interaction.connect', id: 'int_detached_send'},
      {event_type: 'interaction.disconnect'},
    ]);
  });

  it('rejects valid JSON server events missing a string event_type', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'int_missing_event_type',
    );
    factory.socket!.serverEvent({index: 0, delta: {type: 'text', text: 'hi'}});

    await expectAsync(connection.receive().next()).toBeRejectedWithError(
      APIWebSocketError,
      'Live interaction server events must have an event_type.',
    );
    await expectAsync(
      connection.send('after protocol error'),
    ).toBeRejectedWithError(
      APIWebSocketError,
      'Live interaction server events must have an event_type.',
    );
  });

  it('yields error server events without throwing and continues streaming', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'int_error_event',
    );
    factory.socket!.serverEvent({
      events: [
        {
          event_type: 'error',
          error: {code: 'RATE_LIMIT_EXCEEDED', message: 'Slow down'},
        },
        {
          event_type: 'step.delta',
          index: 0,
          delta: {type: 'text', text: 'recovered'},
        },
        {event_type: 'interaction.completed'},
      ],
    });

    const received: Array<{event_type: string}> = [];
    for await (const event of connection.receive()) {
      received.push(event);
    }
    expect(received.map((e) => e.event_type)).toEqual([
      'error',
      'step.delta',
      'interaction.completed',
    ]);
  });

  it('treats interaction.cancelled (double-L) as terminal', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'int_cancelled_uk',
    );
    factory.socket!.serverEvent({event_type: 'interaction.cancelled'});

    const events: string[] = [];
    for await (const event of connection.receive()) {
      events.push(event.event_type);
    }
    expect(events).toEqual(['interaction.cancelled']);

    await expectAsync(connection.send('after cancelled')).toBeRejectedWithError(
      Error,
      'This live interaction is already terminal.',
    );
    connection.detach();
    expect(factory.socket!.sent.length).toBe(1);
  });

  it('handles empty event batches gracefully without terminating receive()', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'int_empty_batch',
    );
    factory.socket!.serverEvent({events: []});
    factory.socket!.serverEvent({
      events: [
        {
          event_type: 'interaction.connected',
          interaction_id: 'int_empty_batch',
        },
        {event_type: 'interaction.completed'},
      ],
    });

    const events: string[] = [];
    for await (const event of connection.receive()) {
      events.push(event.event_type);
    }
    expect(events).toEqual(['interaction.connected', 'interaction.completed']);
  });

  it('does not throw when transport closes after a terminal server event', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'int_post_terminal_close',
    );
    factory.socket!.serverEvent({event_type: 'interaction.completed'});
    factory.socket!.serverError();
    factory.socket!.serverClose(1006);

    const events: string[] = [];
    for await (const event of connection.receive()) {
      events.push(event.event_type);
    }
    expect(events).toEqual(['interaction.completed']);
  });

  it('resumes an existing interaction ID after detaching a previous connection', async () => {
    const firstFactory = new FakeWebSocketFactory();
    const firstConnection = await connectWebSocketInteraction(
      parentClient(),
      firstFactory,
      'int_resumable',
    );
    firstFactory.socket!.serverEvent({
      event_type: 'interaction.connected',
      interaction_id: 'int_resumable',
    });
    const firstEvent = await firstConnection.receive().next();
    expect(firstEvent).toEqual({
      done: false,
      value: jasmine.objectContaining({
        event_type: 'interaction.connected',
        interaction_id: 'int_resumable',
      }),
    });
    firstConnection.detach();
    expect(firstFactory.socket!.sent.map((frame) => JSON.parse(frame))).toEqual(
      [
        {event_type: 'interaction.connect', id: 'int_resumable'},
        {event_type: 'interaction.disconnect'},
      ],
    );

    const secondFactory = new FakeWebSocketFactory();
    const resumedConnection = await connectWebSocketInteraction(
      parentClient(),
      secondFactory,
      'int_resumable',
    );
    expect(
      secondFactory.socket!.sent.map((frame) => JSON.parse(frame)),
    ).toEqual([{event_type: 'interaction.connect', id: 'int_resumable'}]);
    secondFactory.socket!.serverEvent({
      events: [
        {event_type: 'interaction.connected', interaction_id: 'int_resumable'},
        {event_type: 'interaction.completed'},
      ],
    });
    const resumedEvents: string[] = [];
    for await (const event of resumedConnection.receive()) {
      resumedEvents.push(event.event_type);
    }
    expect(resumedEvents).toEqual([
      'interaction.connected',
      'interaction.completed',
    ]);
    resumedConnection.detach();
  });

  it('rejects a second concurrent receive() iterator while one is active and allows sequential receive().next() calls', async () => {
    const factory = new FakeWebSocketFactory();
    const connection = await connectWebSocketInteraction(
      parentClient(),
      factory,
      'int_concurrent_receive',
    );

    const pendingFirst = connection.receive().next();

    await expectAsync(connection.receive().next()).toBeRejectedWithError(
      Error,
      'Only one receive iterator may be active at a time.',
    );

    factory.socket!.serverEvent({event_type: 'interaction.connected'});
    const firstResult = await pendingFirst;
    expect(firstResult).toEqual({
      done: false,
      value: {event_type: 'interaction.connected'},
    });

    // Sequential receive().next() without manually closing the prior generator must succeed.
    await connection.send('Hello');
    factory.socket!.serverEvent({event_type: 'interaction.completed'});
    const secondResult = await connection.receive().next();
    expect(secondResult).toEqual({
      done: false,
      value: {event_type: 'interaction.completed'},
    });
    connection.detach();
  });

  it('ends an active waiting receive() loop when cancel() or send(interaction.cancel) is called', async () => {
    const actions: Array<
      (connection: InteractionWebSocketConnection) => Promise<void>
    > = [
      (connection) => connection.cancel(),
      (connection) => connection.send({event_type: 'interaction.cancel'}),
      (connection) =>
        connection.send([
          {
            event_type: 'input',
            content: [{type: 'text', text: 'before cancel'}],
          },
          {event_type: 'interaction.cancel'},
        ]),
    ];

    for (const triggerCancel of actions) {
      const factory = new FakeWebSocketFactory();
      const connection = await connectWebSocketInteraction(
        parentClient(),
        factory,
        'int_cancel_waiting_receive',
      );
      factory.socket!.serverEvent({
        event_type: 'step.start',
        index: 0,
        step: {type: 'model_output'},
      });

      const events: string[] = [];
      const consumePromise = (async () => {
        for await (const event of connection.receive()) {
          events.push(event.event_type);
        }
      })();

      await Promise.resolve();
      await triggerCancel(connection);
      await consumePromise;

      expect(events).toEqual(['step.start']);
      expect(factory.socket!.closed).toBeTrue();
      expect(await connection.receive().next()).toEqual({
        done: true,
        value: undefined,
      });
    }
  });

  it('drains already-buffered events and terminates receive() when cancel() or send(interaction.cancel) is called mid-stream', async () => {
    const actions: Array<
      (connection: InteractionWebSocketConnection) => Promise<void>
    > = [
      (connection) => connection.cancel(),
      (connection) => connection.send({event_type: 'interaction.cancel'}),
      (connection) =>
        connection.send([
          {
            event_type: 'input',
            content: [{type: 'text', text: 'before cancel'}],
          },
          {event_type: 'interaction.cancel'},
        ]),
    ];

    for (const triggerCancel of actions) {
      const factory = new FakeWebSocketFactory();
      const connection = await connectWebSocketInteraction(
        parentClient(),
        factory,
        'int_cancel_buffered_receive',
      );
      factory.socket!.serverEvent({
        events: [
          {
            event_type: 'step.start',
            index: 0,
            step: {type: 'model_output'},
          },
          {
            event_type: 'step.delta',
            index: 0,
            delta: {type: 'text', text: 'buffered before cancel'},
          },
          {event_type: 'step.stop', index: 0},
        ],
      });

      const events: string[] = [];
      for await (const event of connection.receive()) {
        events.push(event.event_type);
        if (event.event_type === 'step.start') {
          await triggerCancel(connection);
          // Frame arriving after cancel must be ignored while buffered events drain.
          factory.socket!.serverEvent({
            event_type: 'step.start',
            index: 1,
            step: {type: 'model_output'},
          });
        }
      }

      expect(events).toEqual(['step.start', 'step.delta', 'step.stop']);
    }
  });

  it('closes WebRTC in data-channel -> media -> peer-connection teardown order and flushes data channel on cancel()', async () => {
    const customFetch = (async () =>
      new Response(
        JSON.stringify({answer_sdp: 'v=0\r\no=- 77 77 IN IP4 127.0.0.1\r\n'}),
        {status: 200, headers: {'content-type': 'application/json'}},
      )) as unknown as typeof fetch;
    const testAi = new GoogleGenAI({
      apiKey: 'auth_tokens/tok-rtc',
      httpOptions: {fetch: customFetch},
    });
    const expectedOrder = [
      'dc.close',
      'videoElement.srcObject=null',
      'audioElement.srcObject=null',
      'pc.close',
    ];

    const runScenario = async (
      trigger: (
        session: InteractionWebRTCConnection,
        pc: FakeRTCPeerConnection,
        dc: FakeRTCDataChannel,
      ) => Promise<void> | void,
    ) => {
      const steps: string[] = [];
      const makeMediaEl = (name: string) => ({
        srcObject: undefined as unknown,
        play: () => Promise.resolve(),
        setSrc: (val: unknown) => {
          if (val === null) steps.push(`${name}.srcObject=null`);
        },
      });
      const wrapEl = (name: string) => {
        const inner = makeMediaEl(name);
        return {
          get srcObject() {
            return inner.srcObject;
          },
          set srcObject(val: unknown) {
            inner.srcObject = val;
            inner.setSrc(val);
          },
          play: inner.play,
        };
      };

      let pc!: FakeRTCPeerConnection;
      const transport = new InteractionWebRTCTransport({
        audioElement: castAudio(wrapEl('audioElement')),
        videoElement: castVideo(wrapEl('videoElement')),
        peerConnectionFactory: () => {
          pc = new FakeRTCPeerConnection();
          const origClose = pc.close.bind(pc);
          pc.close = () => {
            steps.push('pc.close');
            origClose();
          };
          return castPC(pc);
        },
      });

      const session = await testAi.interactions.connect('int-rtc-order', {
        transport,
      });
      const dc = pc.createdChannels[0]!;
      const origDcClose = dc.close.bind(dc);
      dc.close = () => {
        steps.push('dc.close');
        origDcClose();
      };

      pc.emitTrack(new FakeMediaTrack('audio', 'a1'));
      pc.emitTrack(new FakeMediaTrack('video', 'v1'));
      steps.length = 0;

      await trigger(session, pc, dc);
      return {session, pc, dc, steps};
    };

    // 1. Terminal server event closes WebRTC in order while preserving buffered events
    const completedRun = await runScenario((_session, _pc, dc) => {
      dc.receiveJson({
        events: [
          {
            event_type: 'step.delta',
            index: 0,
            delta: {type: 'text', text: 'hi'},
          },
          {event_type: 'interaction.completed'},
        ],
      });
    });
    expect(completedRun.pc.closed).toBeTrue();
    expect(completedRun.steps).toEqual(expectedOrder);
    const bufferedEvents: string[] = [];
    for await (const ev of completedRun.session.receive()) {
      bufferedEvents.push(ev.event_type);
    }
    expect(bufferedEvents).toEqual(['step.delta', 'interaction.completed']);

    // 2. cancel() waits for bufferedAmount to flush before closing WebRTC in order
    const cancelRun = await runScenario(async (session, pc, dc) => {
      const bufferedDc = dc as unknown as {
        bufferedAmount: number;
        send: (data: string) => void;
      };
      const origSend = bufferedDc.send.bind(dc);
      bufferedDc.bufferedAmount = 0;
      bufferedDc.send = (data: string) => {
        bufferedDc.bufferedAmount = data.length;
        origSend(data);
      };
      const cancelPromise = session.cancel();
      expect(pc.closed).toBeFalse();
      await new Promise((resolve) => setTimeout(resolve, 15));
      expect(pc.closed).toBeFalse();
      bufferedDc.bufferedAmount = 0;
      await cancelPromise;
      expect(JSON.parse(dc.sentPayloads[0]!)).toEqual({
        event_type: 'interaction.cancel',
      });
    });
    expect(cancelRun.pc.closed).toBeTrue();
    expect(cancelRun.steps).toEqual(expectedOrder);

    // 3. Remote data channel close and PeerConnection failure close in order
    const remoteCloseRun = await runScenario((_session, _pc, dc) => {
      dc.readyState = 'closed';
      dc.onclose?.({});
    });
    expect(remoteCloseRun.pc.closed).toBeTrue();
    expect(remoteCloseRun.steps).toEqual([
      'videoElement.srcObject=null',
      'audioElement.srcObject=null',
      'pc.close',
    ]);

    const failedPcRun = await runScenario((_session, pc) => {
      pc.setConnectionState('failed');
    });
    expect(failedPcRun.pc.closed).toBeTrue();
    expect(failedPcRun.steps).toEqual(expectedOrder);

    const failedIceRun = await runScenario((_session, pc) => {
      pc.connectionState = 'connected';
      pc.setIceConnectionState('failed');
    });
    expect(failedIceRun.pc.closed).toBeTrue();
    expect(failedIceRun.steps).toEqual(expectedOrder);

    const syncErrorOnCloseRun = await runScenario((session, _pc, dc) => {
      const origClose = dc.close.bind(dc);
      dc.close = () => {
        origClose();
        dc.onerror?.(new Error('synchronous close error'));
      };
      return session.cancel();
    });
    expect(syncErrorOnCloseRun.pc.closed).toBeTrue();
    const afterCancelEvents: string[] = [];
    for await (const ev of syncErrorOnCloseRun.session.receive()) {
      afterCancelEvents.push(ev.event_type);
    }
    expect(afterCancelEvents).toEqual([]);
  });

  it('emits an experimental warning once per process when a Live Interactions entry point is used', async () => {
    resetLiveInteractionsExperimentalWarningForTesting();
    const warnSpy = spyOn(console, 'warn');
    try {
      const factory = new FakeWebSocketFactory();
      const first = await connectWebSocketInteraction(
        parentClient(),
        factory,
        'int_exp_warn_1',
      );
      const second = await connectWebSocketInteraction(
        parentClient(),
        factory,
        'int_exp_warn_2',
      );
      expect(new InteractionWebRTCTransport()).toBeDefined();
      first.detach();
      second.detach();

      expect(warnSpy.calls.count()).toBe(1);
      expect(warnSpy.calls.argsFor(0)[0]).toContain('Live Interactions usage');
    } finally {
      resetLiveInteractionsExperimentalWarningForTesting();
    }
  });
});
