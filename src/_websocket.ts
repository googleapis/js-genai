/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WebSocketCallbacks {
  onopen: () => void;
  // Following eslint rules are disabled because the callback types depend on
  // the implementation of the websocket.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onerror: (e: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onmessage: (e: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onclose: (e: any) => void;
}

export interface WebSocket {
  /**
   * Connects the socket to the server.
   */
  connect(): void;
  /**
   * Sends a message to the server.
   */
  send(message: string): void;
  /**
   * Closes the socket connection.
   */
  close(): void;
}

export interface WebSocketFactory {
  /**
   * Whether the WebSocket transport forwards handshake HTTP headers.
   *
   * Browser WebSocket implementations ignore custom headers and set this to
   * `false`. When omitted, header support is assumed.
   */
  readonly supportsHeaders?: boolean;
  /**
   * Returns a new WebSocket instance.
   */
  create(
    url: string,
    headers: Record<string, string>,
    callbacks: WebSocketCallbacks,
  ): WebSocket;
}
