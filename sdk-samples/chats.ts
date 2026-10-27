/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';
import {MODEL_FLASH_LITE} from './constants.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function createChatFromMLDev() {
  const ai = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});

  const chat = ai.chats.create({model: MODEL_FLASH_LITE});

  const response = await chat.sendMessage({message: 'Why is the sky blue?'});
  console.debug('chat response 1: ', response.text);
  const response2 = await chat.sendMessage({message: 'Why is the sunset red?'});
  console.debug('chat response 2: ', response2.text);

  const history = chat.getHistory();
  for (const content of history) {
    console.debug('chat history: ', JSON.stringify(content, null, 2));
  }
}

async function createChatStreamFromMLDev() {
  const ai = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});
  const chat = ai.chats.create({model: MODEL_FLASH_LITE});
  const response = await chat.sendMessageStream({
    message: 'Why is the sky blue?',
  });
  for await (const chunk of response) {
    console.debug('chat response 1 chunk: ', chunk.text);
  }
  const response2 = await chat.sendMessageStream({
    message: 'Why is the sunset red?',
  });
  for await (const chunk of response2) {
    console.debug('chat response 2 chunk: ', chunk.text);
  }
  const history = chat.getHistory();
  for (const content of history) {
    console.debug('chat history: ', JSON.stringify(content, null, 2));
  }
}

async function createChatFromVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  const chat = ai.chats.create({model: MODEL_FLASH_LITE});

  const response = await chat.sendMessage({message: 'Why is the sky blue?'});
  console.debug('chat response 1: ', response.text);
  const response2 = await chat.sendMessage({message: 'Why is the sunset red?'});
  console.debug('chat response 2: ', response2.text);

  const history = chat.getHistory();
  for (const content of history) {
    console.debug('chat history: ', JSON.stringify(content, null, 2));
  }
}

async function createChatStreamFromVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });
  const chat = ai.chats.create({model: MODEL_FLASH_LITE});
  const response = await chat.sendMessageStream({
    message: 'Why is the sky blue?',
  });
  for await (const chunk of response) {
    console.debug('chat response 1 chunk: ', chunk.text);
  }
  const response2 = await chat.sendMessageStream({
    message: 'Why is the sunset red?',
  });
  for await (const chunk of response2) {
    console.debug('chat response 2 chunk: ', chunk.text);
  }
  const history = chat.getHistory();
  for (const content of history) {
    console.debug('chat history: ', JSON.stringify(content, null, 2));
  }
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await createChatFromVertexAI();
    await createChatStreamFromVertexAI();
  } else {
    await createChatFromMLDev();
    await createChatStreamFromMLDev();
  }
}

main();
