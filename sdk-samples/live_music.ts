/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI, LiveMusicServerMessage} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function liveMusic(client: GoogleGenAI, model: string) {
  const responseQueue: LiveMusicServerMessage[] = [];

  // This should use an async queue.
  async function waitMessage(): Promise<LiveMusicServerMessage> {
    let messageCount = 0;
    let message: LiveMusicServerMessage | undefined = undefined;
    // This sample retrieves 2 messages from the server as a demo.
    // First message is setupComplete, second message is the first audio chunk.
    while (messageCount < 2) {
      message = responseQueue.shift();
      if (message) {
        messageCount++;
        if (message.serverContent?.audioChunks?.[0]?.data) {
          console.log(
            'Received audio chunk: %s\n',
            message.serverContent?.audioChunks?.[0]?.data,
          );
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return message!;
  }

  async function handleTurn(): Promise<LiveMusicServerMessage[]> {
    const turn: LiveMusicServerMessage[] = [];
    let done = false;
    while (!done) {
      const message = await waitMessage();
      turn.push(message);
      done = true;
    }
    return turn;
  }

  const session = await client.live.music.connect({
    model: model,
    callbacks: {
      onmessage: function (message: LiveMusicServerMessage) {
        responseQueue.push(message);
      },
      onerror: function (e: ErrorEvent) {
        console.debug('Error:', e.message);
      },
      onclose: function (e: CloseEvent) {
        console.debug('Close:', e.reason);
      },
    },
  });

  session.setMusicGenerationConfig({
    musicGenerationConfig: {
      bpm: 140,
    },
  });
  session.setWeightedPrompts({weightedPrompts: [{text: 'Jazz', weight: 1.0}]});
  session.play();

  await handleTurn();

  session.close();
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    console.error('Live music is not supported for Vertex AI.');
  } else {
    const client = new GoogleGenAI({
      vertexai: false,
      apiKey: GEMINI_API_KEY,
      apiVersion: 'v1alpha',
    });
    const model = 'lyria-realtime-exp';
    await liveMusic(client, model).catch((e) => console.error('got error', e));
  }
}

main();
