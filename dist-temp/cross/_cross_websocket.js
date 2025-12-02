/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { crossError } from './_cross_error.js';
export class CrossWebSocketFactory {
    create(_url, _headers, _callbacks) {
        throw crossError();
    }
}
