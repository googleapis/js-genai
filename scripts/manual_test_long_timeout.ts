/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {strict as assert} from 'node:assert';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';

import {ApiClient} from '../src/_api_client.js';

const DEFAULT_DELAY_MS = 365_000;
const DEFAULT_TIMEOUT_MS = 420_000;

function readPositiveNumber(value: string | undefined, fallback: number) {
  const result = value === undefined ? fallback : Number(value);
  if (!Number.isFinite(result) || result <= 0) {
    throw new Error(`Expected a positive number, received: ${value}`);
  }
  return result;
}

const delayMs = readPositiveNumber(process.argv[2], DEFAULT_DELAY_MS);
const timeoutMs = readPositiveNumber(process.argv[3], DEFAULT_TIMEOUT_MS);

assert(
  timeoutMs > delayMs,
  `The request timeout (${timeoutMs}ms) must exceed the server delay (${delayMs}ms).`,
);

if (delayMs <= 300_000) {
  console.warn(
    "The selected delay does not cross Node fetch's five-minute timeout boundary.",
  );
}

const pendingTimers = new Set<ReturnType<typeof setTimeout>>();
const server = createServer((_request, response) => {
  // Do not send headers until the delay expires. This specifically exercises
  // Undici's headers timeout rather than merely delaying response-body chunks.
  const timer = setTimeout(() => {
    pendingTimers.delete(timer);
    response.writeHead(200, {'content-type': 'application/json'});
    response.end(JSON.stringify({ok: true}));
  }, delayMs);
  pendingTimers.add(timer);

  response.once('close', () => {
    if (!response.writableEnded) {
      clearTimeout(timer);
      pendingTimers.delete(timer);
    }
  });
});

await new Promise<void>((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});

const address = server.address();
assert(address && typeof address !== 'string');

const require = createRequire(import.meta.url);
const undiciVersion = (require('undici/package.json') as {version: string})
  .version;
const startedAt = Date.now();
const progress = setInterval(() => {
  const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
  console.log(`Still waiting: ${elapsedSeconds}s elapsed...`);
}, 30_000);

console.log(`Node: ${process.version}`);
console.log(`Bundled Undici: ${process.versions.undici ?? 'unknown'}`);
console.log(`Installed Undici: ${undiciVersion}`);
console.log(`Server delay: ${delayMs}ms`);
console.log(`SDK timeout: ${timeoutMs}ms`);

try {
  const client = new ApiClient({
    auth: {async addAuthHeaders() {}},
    apiKey: 'local-test-key',
    httpOptions: {
      baseUrl: `http://127.0.0.1:${address.port}`,
      apiVersion: '',
    },
    // Uploading and downloading are not involved in this transport test.
    uploader: {} as never,
    downloader: {} as never,
  });

  await client.request({
    path: 'delayed-response',
    httpMethod: 'GET',
    httpOptions: {timeout: timeoutMs},
  });

  const elapsedMs = Date.now() - startedAt;
  assert(
    elapsedMs >= delayMs,
    `Request completed before the configured server delay (${elapsedMs}ms).`,
  );
  console.log(`PASS: request completed after ${elapsedMs}ms.`);
} finally {
  clearInterval(progress);
  for (const timer of pendingTimers) {
    clearTimeout(timer);
  }
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
