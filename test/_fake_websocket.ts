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
  setupCompleteResponse?: Record<string, unknown>;

  constructor(
    _url: string,
    _headers: Record<string, string>,
    private callbacks: WebSocketCallbacks,
  ) {}

  connect(): void {
    this.callbacks.onopen();
  }
  send(message: string): void {
    try {
      const parsed = JSON.parse(message) as Record<string, unknown>;
      if (parsed && parsed['setup']) {
        this.callbacks.onmessage({
          data: JSON.stringify({
            setupComplete: this.setupCompleteResponse ?? {},
          }),
        } as MessageEvent);
        return;
      }
    } catch {
      // Ignore parse errors, fallback to echo
    }
    this.callbacks.onmessage({data: message});
  }
  close(): void {
    this.callbacks.onclose('');
  }
}
