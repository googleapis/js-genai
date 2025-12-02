/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as NodeWs from 'ws';
export class NodeWebSocketFactory {
    create(url, headers, callbacks) {
        return new NodeWebSocket(url, headers, callbacks);
    }
}
export class NodeWebSocket {
    constructor(url, headers, callbacks) {
        this.url = url;
        this.headers = headers;
        this.callbacks = callbacks;
    }
    connect() {
        this.ws = new NodeWs.WebSocket(this.url, { headers: this.headers });
        this.ws.onopen = this.callbacks.onopen;
        this.ws.onerror = this.callbacks.onerror;
        this.ws.onclose = this.callbacks.onclose;
        this.ws.onmessage = this.callbacks.onmessage;
    }
    send(message) {
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
}
