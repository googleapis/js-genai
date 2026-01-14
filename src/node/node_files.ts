/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleAuth} from 'google-auth-library';

import {Files} from '../files.js';
import * as types from '../types.js';

/**
 * Node-specific parameters for registerFiles, including GoogleAuth.
 */
export interface NodeRegisterFilesParameters extends
    types.RegisterFilesParameters {
  /** The authentication object. */
  auth: GoogleAuth;
}

export class NodeFiles extends Files {
  /**
   * Registers Google Cloud Storage files for use with the API.
   * This method is only available in Node.js environments.
   */
  async registerFiles(
      params: NodeRegisterFilesParameters,
      ): Promise<types.RegisterFilesResponse> {
    if (typeof process === 'undefined' || !process.versions ||
        !process.versions.node) {
      throw new Error(
          'registerFiles is only supported in Node.js environments.',
      );
    }
    const googleAuth = params.auth;

    const authHeaders = await googleAuth.getRequestHeaders();
    const config = params.config || {};
    const httpOptions = config.httpOptions || {};
    const headers: Record<string, string> = {
      ...(httpOptions.headers || {}),
    };

    if (authHeaders) {
      for (const [key, value] of authHeaders) {
        headers[key] = value;
      }
    }

    return this.registerFilesInternal({
      uris: params.uris,
      config: {
        ...config,
        httpOptions: {
          ...httpOptions,
          headers,
        },
      },
    });
  }
}
