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

// TODO((b/401271082): re-enable lint once CrossWebSocketFactory is implemented.
/*  eslint-disable @typescript-eslint/no-unused-vars */
export class CrossWebSocketFactory implements WebSocketFactory {
  create(
    url: string,
    headers: Record<string, string>,
    callbacks: WebSocketCallbacks,
  ): Ws {
    throw crossError();
  }
}
