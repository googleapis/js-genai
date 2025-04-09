/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI, LiveServerMessage, Modality} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function live(client: GoogleGenAI) {
  const responseQueue: LiveServerMessage[] = [];

  // This should use an async queue.
  async function waitMessage(): Promise<LiveServerMessage> {
    let done = false;
    let message: LiveServerMessage | undefined = undefined;
    while (!done) {
      message = responseQueue.shift();
      if (message) {
        console.debug('Received: %s\n', JSON.stringify(message, null, 4));
        done = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return message!;
  }

  async function handleTurn(): Promise<LiveServerMessage[]> {
    const turn: LiveServerMessage[] = [];
    let done = false;
    while (!done) {
      const message = await waitMessage();
      turn.push(message);
      if (message.serverContent && message.serverContent.turnComplete) {
        done = true;
      }
    }
    return turn;
  }

  const session = await client.live.connect({
    model: 'gemini-2.0-flash-live-001',
    callbacks: {
      onopen: function() {
        console.debug('Opened');
      },
      onmessage: function(message: LiveServerMessage) {
        responseQueue.push(message);
      },
      onerror: function(e: ErrorEvent) {
        console.debug('Error:', e.message);
      },
      onclose: function(e: CloseEvent) {
        console.debug('Close:', e.reason);
      },
    },
    config: {responseModalities: [Modality.TEXT]},
  });

  const simple = 'Hello world';
  console.log('-'.repeat(80));
  console.log(`Sent: ${simple}`);
  session.sendClientContent({turns: simple});

  await handleTurn();

  const turns = [
    'This image is just black, can you see it?',
    {
      inlineData: {
        // 2x2 black PNG, base64 encoded.
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAC0lEQVR4nGNgQAYAAA4AAamRc7EAAAAASUVORK5CYII=',
        mimeType: 'image/png',
      },
    },
  ];
  console.log('-'.repeat(80));
  console.log(`Sent: ${turns}`);
  session.sendClientContent({turns: turns});

  await handleTurn();

  session.close();
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    const client = new GoogleGenAI({
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    });
    await live(client).catch((e) => console.error('got error', e));
  } else {
    const client = new GoogleGenAI({
      vertexai: false,
      apiKey: GEMINI_API_KEY,
    });
    await live(client).catch((e) => console.error('got error', e));
  }
}

main();
