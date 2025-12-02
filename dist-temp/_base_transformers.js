/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export function tBytes(fromBytes) {
    if (typeof fromBytes !== 'string') {
        throw new Error('fromImageBytes must be a string');
    }
    // TODO(b/389133914): Remove dummy bytes converter.
    return fromBytes;
}
