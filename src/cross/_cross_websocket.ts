/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  WebSocketCallbacks,
  WebSocketFactory,
  WebSocket as Ws,
} from '../_websocket.js';
import {crossError} from './_cross_error.js';

export class CrossWebSocketFactory implements WebSocketFactory {
  create(
    _url: string,
    _headers: Record<string, string>,
    _callbacks: WebSocketCallbacks,
  ): Ws {
    throw crossError();
  }
}
