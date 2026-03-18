/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GeminiNextGenAPIClientAdapter {
  isVertexAI: () => boolean;
  getProject: () => string | undefined;
  getLocation: () => string | undefined;
  getAuthHeaders: () => Headers | Promise<Headers>;
}
