/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export const GOOGLE_API_KEY_HEADER = 'x-goog-api-key';
// TODO(b/395122533): We need a secure client side authentication mechanism.
export class WebAuth {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async addAuthHeaders(headers, url) {
        if (headers.get(GOOGLE_API_KEY_HEADER) !== null) {
            return;
        }
        if (this.apiKey.startsWith('auth_tokens/')) {
            throw new Error('Ephemeral tokens are only supported by the live API.');
        }
        // Check if API key is empty or null
        if (!this.apiKey) {
            throw new Error('API key is missing. Please provide a valid API key.');
        }
        headers.append(GOOGLE_API_KEY_HEADER, this.apiKey);
    }
}
