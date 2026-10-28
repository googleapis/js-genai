/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiClient} from '../../src/_api_client.js';
import {WebSocketCallbacks} from '../../src/_websocket.js';
import {CrossDownloader} from '../../src/cross/_cross_downloader.js';
import {CrossUploader} from '../../src/cross/_cross_uploader.js';
import {Live} from '../../src/live.js';
import {FakeAuth} from '../_fake_auth.js';
import {FakeWebSocket, FakeWebSocketFactory} from '../_fake_websocket.js';

type SocketScript = (callbacks: WebSocketCallbacks) => void;

const CONNECT_DEADLINE_MS = 100;

/** Rejects if `promise` has not settled within CONNECT_DEADLINE_MS. */
function withDeadline<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error('connect() did not settle')),
      CONNECT_DEADLINE_MS,
    );
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

describe('Live.connect failure handling', () => {
  const model = 'models/gemini-live-2.5-flash-preview';
  let websocketFactory: FakeWebSocketFactory;
  let sockets: FakeWebSocket[];

  function createLive(apiKey = 'test-api-key'): Live {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey,
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    return new Live(apiClient, new FakeAuth(), websocketFactory);
  }

  function scriptSocket({
    onConnect,
    onSend,
  }: {
    onConnect?: SocketScript;
    onSend?: SocketScript;
  }): void {
    spyOn(websocketFactory, 'create').and.callFake(
      (
        url: string,
        headers: Record<string, string>,
        callbacks: WebSocketCallbacks,
      ) => {
        const socket = new FakeWebSocket(url, headers, callbacks);
        sockets.push(socket);
        if (onConnect) {
          spyOn(socket, 'connect').and.callFake(() => onConnect(callbacks));
        }
        if (onSend) {
          spyOn(socket, 'send').and.callFake(() => onSend(callbacks));
        }
        return socket;
      },
    );
  }

  const onmessage = () => {};

  beforeEach(() => {
    websocketFactory = new FakeWebSocketFactory();
    sockets = [];
    spyOn(console, 'warn');
  });

  afterEach(() => {
    for (const socket of sockets) {
      socket.close();
    }
  });

  // A failed handshake (for example HTTP 404) errors and closes the socket
  // without opening it; connect() must reject instead of hanging.
  it('rejects when the socket closes before it opens', async () => {
    scriptSocket({
      onConnect: (callbacks) => {
        callbacks.onerror({message: 'Unexpected server response: 404'});
        callbacks.onclose({code: 1006, reason: ''});
      },
    });
    const live = createLive('auth_tokens/test-token');

    await expectAsync(
      withDeadline(live.connect({model, callbacks: {onmessage}})),
    ).toBeRejectedWithError(/Unexpected server response: 404/);
  });

  // The server can read the setup message and then close the socket, for
  // example on a quota error, instead of replying with setupComplete.
  it('rejects when the socket closes after open but before setupComplete', async () => {
    scriptSocket({
      onSend: (callbacks) => {
        callbacks.onclose({
          code: 1011,
          reason: 'You exceeded your current quota.',
        });
      },
    });
    const live = createLive();

    await expectAsync(
      withDeadline(live.connect({model, callbacks: {onmessage}})),
    ).toBeRejectedWithError(/code 1011\): You exceeded your current quota\./);
  });

  it('rejects when the socket errors after open but before setupComplete', async () => {
    scriptSocket({
      onSend: (callbacks) => {
        callbacks.onerror({message: 'boom'});
      },
    });
    const live = createLive();

    await expectAsync(
      withDeadline(live.connect({model, callbacks: {onmessage}})),
    ).toBeRejectedWithError(/failed before setup completed: boom/);
  });

  it('rejects with a fallback message when the close event has no code', async () => {
    scriptSocket({
      onConnect: (callbacks) => {
        callbacks.onclose({});
      },
    });
    const live = createLive();

    await expectAsync(
      withDeadline(live.connect({model, callbacks: {onmessage}})),
    ).toBeRejectedWithError(/code 1006\): Abnormal closure\./);
  });

  // The rejection must not replace the user's own error and close callbacks.
  it('still calls the user onerror and onclose callbacks', async () => {
    const errorEvent = {message: 'Unexpected server response: 404'};
    const closeEvent = {code: 1006, reason: ''};
    scriptSocket({
      onConnect: (callbacks) => {
        callbacks.onerror(errorEvent);
        callbacks.onclose(closeEvent);
      },
    });
    const onerror = jasmine.createSpy('onerror');
    const onclose = jasmine.createSpy('onclose');
    const live = createLive();

    await expectAsync(
      withDeadline(
        live.connect({model, callbacks: {onmessage, onerror, onclose}}),
      ),
    ).toBeRejectedWithError(/Unexpected server response: 404/);
    expect(onerror).toHaveBeenCalledOnceWith(errorEvent);
    expect(onclose).toHaveBeenCalledOnceWith(closeEvent);
  });

  // A close after the session is established only reaches the user callback.
  it('does not reject after the session is established', async () => {
    const onclose = jasmine.createSpy('onclose');
    const live = createLive();

    const session = await live.connect({
      model,
      callbacks: {onmessage, onclose},
    });

    expect(() => session.close()).not.toThrow();
    expect(onclose).toHaveBeenCalledTimes(1);
  });
});
