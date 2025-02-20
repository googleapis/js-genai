/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as NodeWs from 'ws';

import {WebSocket, WebSocketCallbacks, WebSocketFactory} from '../_websocket';

export class NodeWebSocketFactory implements WebSocketFactory {
  create(
    url: string,
    headers: Record<string, string>,
    callbacks: WebSocketCallbacks,
  ): WebSocket {
    return new NodeWebSocket(url, headers, callbacks);
  }
}

export class NodeWebSocket implements WebSocket {
  private ws?: NodeWs;

  constructor(
    private readonly url: string,
    private readonly headers: Record<string, string>,
    private readonly callbacks: WebSocketCallbacks,
  ) {}

  connect(): void {
    this.ws = new NodeWs(this.url, this.headers);

    this.ws.onopen = this.callbacks.onopen;
    this.ws.onerror = this.callbacks.onerror;
    this.ws.onclose = this.callbacks.onclose;
    this.ws.onmessage = this.callbacks.onmessage;
  }

  send(message: string) {
    if (this.ws === undefined) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(message);
  }

  close() {
    if (this.ws === undefined) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.close();
  }

  setOnMessageCallback(callback: (e: any) => void) {
    if (this.ws === undefined) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.onmessage = callback;
  }
}
