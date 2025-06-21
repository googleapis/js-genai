/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  WebSocket,
  WebSocketCallbacks,
  WebSocketFactory,
} from '../src/_websocket.js';

/**
 * A fake implementation of the WebSocketFactory interface for testing purposes.
 */
export class FakeWebSocketFactory implements WebSocketFactory {
  create(
    url: string,
    headers: Record<string, string>,
    callbacks: WebSocketCallbacks,
  ) {
    return new FakeWebSocket(url, headers, callbacks);
  }
}

/**
 * A fake implementation of the WebSocket interface for testing purposes.
 */
export class FakeWebSocket implements WebSocket {
  constructor(
    private readonly url: string,
    private readonly headers: Record<string, string>,
    private callbacks: WebSocketCallbacks,
  ) {}

  connect(): void {
    this.callbacks.onopen();
  }
  send(message: string): void {
    this.callbacks.onmessage({data: message});
  }
  close(): void {
    this.callbacks.onclose('');
  }
}
