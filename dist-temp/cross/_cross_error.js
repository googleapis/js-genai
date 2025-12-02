/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export function crossError() {
    // TODO(b/399934880): this message needs a link to a help page explaining how to enable conditional exports
    return new Error(`This feature requires the web or Node specific @google/genai implementation, you can fix this by either:

*Enabling conditional exports for your project [recommended]*

*Using a platform specific import* - Make sure your code imports either '@google/genai/web' or '@google/genai/node' instead of '@google/genai'.
`);
}
