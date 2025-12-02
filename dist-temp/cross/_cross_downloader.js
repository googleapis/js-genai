/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { crossError } from './_cross_error.js';
export class CrossDownloader {
    async download(_params, _apiClient) {
        throw crossError();
    }
}
