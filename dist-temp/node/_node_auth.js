/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleAuth } from 'google-auth-library';
export const GOOGLE_API_KEY_HEADER = 'x-goog-api-key';
const REQUIRED_VERTEX_AI_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
export class NodeAuth {
    constructor(opts) {
        this.skipAuth = opts.skipAuth ?? false;
        // If skipping auth, don't initialize anything
        if (this.skipAuth) {
            return;
        }
        if (opts.apiKey !== undefined) {
            this.apiKey = opts.apiKey;
            return;
        }
        const vertexAuthOptions = buildGoogleAuthOptions(opts.googleAuthOptions);
        this.googleAuth = new GoogleAuth(vertexAuthOptions);
    }
    async addAuthHeaders(headers, url) {
        // If skipping auth, don't add any auth headers
        if (this.skipAuth) {
            return;
        }
        if (this.apiKey !== undefined) {
            if (this.apiKey.startsWith('auth_tokens/')) {
                throw new Error('Ephemeral tokens are only supported by the live API.');
            }
            this.addKeyHeader(headers);
            return;
        }
        return this.addGoogleAuthHeaders(headers, url);
    }
    addKeyHeader(headers) {
        if (headers.get(GOOGLE_API_KEY_HEADER) !== null) {
            return;
        }
        if (this.apiKey === undefined) {
            // This should never happen, this method is only called
            // when apiKey is set.
            throw new Error('Trying to set API key header but apiKey is not set');
        }
        headers.append(GOOGLE_API_KEY_HEADER, this.apiKey);
    }
    async addGoogleAuthHeaders(headers, url) {
        if (this.googleAuth === undefined) {
            // This should never happen, addGoogleAuthHeaders should only be
            // called when there is no apiKey set and in these cases googleAuth
            // is set.
            throw new Error('Trying to set google-auth headers but googleAuth is unset');
        }
        const authHeaders = await this.googleAuth.getRequestHeaders(url);
        for (const [key, value] of authHeaders) {
            if (headers.get(key) !== null) {
                continue;
            }
            headers.append(key, value);
        }
    }
}
function buildGoogleAuthOptions(googleAuthOptions) {
    let authOptions;
    if (!googleAuthOptions) {
        authOptions = {
            scopes: [REQUIRED_VERTEX_AI_SCOPE],
        };
        return authOptions;
    }
    else {
        authOptions = googleAuthOptions;
        if (!authOptions.scopes) {
            authOptions.scopes = [REQUIRED_VERTEX_AI_SCOPE];
            return authOptions;
        }
        else if ((typeof authOptions.scopes === 'string' &&
            authOptions.scopes !== REQUIRED_VERTEX_AI_SCOPE) ||
            (Array.isArray(authOptions.scopes) &&
                authOptions.scopes.indexOf(REQUIRED_VERTEX_AI_SCOPE) < 0)) {
            throw new Error(`Invalid auth scopes. Scopes must include: ${REQUIRED_VERTEX_AI_SCOPE}`);
        }
        return authOptions;
    }
}
