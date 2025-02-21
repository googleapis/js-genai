/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {NodeClient} from '@google/genai/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function createChatFromMLDev() {
  const client = new NodeClient({vertexai: false, apiKey: GEMINI_API_KEY});

  const chat = client.chats.create('gemini-2.0-flash', {}, []);

  const response = await chat.sendMessage('Why is the sky blue?');

  console.debug(response.text());
}

async function createChatFromVertexAI() {
  const client = new NodeClient({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  const chat = client.chats.create('gemini-2.0-flash', {}, []);

  const response = await chat.sendMessage('Why is the sky blue?');

  console.debug(response.text());
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await createChatFromVertexAI().catch((e) => console.error('got error', e));
  } else {
    await createChatFromMLDev().catch((e) => console.error('got error', e));
  }
}

main();
