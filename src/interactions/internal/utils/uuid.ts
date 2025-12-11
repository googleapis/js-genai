/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

/**
 * https://stackoverflow.com/a/2117523
 */
let uuid4Internal = function (): string {
  const { crypto } = globalThis as any;
  if (crypto?.randomUUID) {
    uuid4Internal = crypto.randomUUID.bind(crypto);
    return crypto.randomUUID();
  }
  const u8 = new Uint8Array(1);
  const randomByte = crypto ? () => crypto.getRandomValues(u8)[0]! : () => (Math.random() * 0xff) & 0xff;
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (+c ^ (randomByte() & (15 >> (+c / 4)))).toString(16),
  );
};

export const uuid4 = (): string => uuid4Internal();
