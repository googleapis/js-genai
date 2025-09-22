/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ChildProcess} from 'child_process';
import {GoogleAuth} from 'google-auth-library';
import * as path from 'path';
import {
  TestServerOptions,
  startTestServer,
  stopTestServer,
} from 'test-server-sdk';
import {fileURLToPath} from 'url';
import {setDefaultBaseUrls} from '../../src/_base_url.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageRoot = path.resolve(__dirname, '..', '..', '..');
const originalRequestHeaders = GoogleAuth.prototype.getRequestHeaders;
let isPatched = false;

const testServerOptions: TestServerOptions = {
  configPath: path.join(packageRoot, 'test', 'system', 'test-server.yml'),
  recordingDir: path.join(packageRoot, 'test', 'system', 'recordings'),
  mode: 'cli-driven',
  onStdOut: (data) => console.debug(`[test-server STDOUT] ${data.trimEnd()}`),
  onStdErr: (data) => console.error(`[test-server STDERR] ${data.trimEnd()}`),
  onError: (err) =>
    console.error(
      '[test-server ERROR] Failed to start or manage test-server process:',
      err,
    ),
};

let serverProcess: ChildProcess | null = null;

export async function setupTestServer() {
  if (!process.argv.includes('--test-server')) {
    return;
  }
  process.env.TEST_SERVER_SECRETS = `${process.env.GOOGLE_CLOUD_PROJECT},${process.env.GOOGLE_CLOUD_LOCATION}`;
  serverProcess = await startTestServer(testServerOptions);
  setDefaultBaseUrls({
    geminiUrl: 'http://localhost:1453',
    vertexUrl: 'http://localhost:1454',
  });
  if (!process.argv.includes('--record')) {
    GoogleAuth.prototype.getRequestHeaders = async function (_: string) {
      return {};
    };
    isPatched = true;
  }
}

export async function shutdownTestServer() {
  if (serverProcess) {
    console.log('Tearing down test-server...');
    await stopTestServer(serverProcess);
    serverProcess = null;
  }
  if (isPatched) {
    GoogleAuth.prototype.getRequestHeaders = originalRequestHeaders;
    isPatched = false;
  }
}
