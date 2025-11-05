/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The Auth interface is used to authenticate with the API service.
 */
export interface Auth {
  /**
   * Sets the headers needed to authenticate with the API service.
   *
   * @param headers - The Headers object that will be updated with the authentication headers.
   * @param url - The URL of the request.
   */
  addAuthHeaders(headers: Headers, url?: string): Promise<void>;
}
