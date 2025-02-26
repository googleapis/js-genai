/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {LiveServerMessage, NodeClient} from '@google/genai/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function liveFromMLDev() {
  const client = new NodeClient({
    vertexai: false,
    apiKey: GEMINI_API_KEY,
    httpOptions: {
      apiVersion: 'v1alpha',
    }
  });

  const session = await client.live.connect({model: 'gemini-2.0-flash-exp'});
  session.onmessage = (message: LiveServerMessage) => {
    console.debug(
        'Received message from the server: %s\n', JSON.stringify(message));
  };

  session.send(/*message=*/ 'Hello world', /*turnComplete=*/ true);
  session.close();
}

async function liveFromVertexAI() {
  const client = new NodeClient({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  const session = await client.live.connect({model: 'gemini-2.0-flash-exp'});
  session.onmessage = (message: LiveServerMessage) => {
    console.debug(
        'Received message from the server: %s\n', JSON.stringify(message));
  };

  session.send(/*message=*/ 'Hello world', /*turnComplete=*/ true);
  session.close();
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await liveFromVertexAI().catch((e) => console.error('got error', e));
  } else {
    await liveFromMLDev().catch((e) => console.error('got error', e));
  }
}

main();
