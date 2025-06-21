/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  AuthToken,
  GoogleGenAI,
  LiveServerMessage,
  Modality,
} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;
const GOOGLE_GENAI_MLDEV_USE_EPHEMERAL =
  process.env.GOOGLE_GENAI_MLDEV_USE_EPHEMERAL;

class AsyncQueue<T> {
  private queue: T[] = [];
  private waiting: ((value: T) => void)[] = [];

  /**
   * Adds an item to the queue.
   * If there's a waiting consumer, it resolves immediately.
   * @param item The item to add to the queue.
   */
  put(item: T): void {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift();
      if (resolve) {
        resolve(item);
      }
    } else {
      this.queue.push(item);
    }
  }

  /**
   * Gets the next item from the queue.
   * If the queue is empty, it waits for an item to be added.
   * @return A Promise that resolves with the next item.
   */
  get(): Promise<T> {
    return new Promise<T>((resolve) => {
      if (this.queue.length > 0) {
        resolve(this.queue.shift()!);
      } else {
        this.waiting.push(resolve);
      }
    });
  }

  /**
   * Returns the number of items in the queue.
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Returns true if the queue is empty.
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Clears the queue.
   */
  clear(): void {
    this.queue = [];
    this.waiting = [];
  }
}

async function live(client: GoogleGenAI, model: string) {
  const responseQueue = new AsyncQueue<LiveServerMessage>();

  async function handleTurn(): Promise<LiveServerMessage[]> {
    const turn: LiveServerMessage[] = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const message = await responseQueue.get();
      const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
      const inlineData =
        message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;

      if (text) {
        console.log(`Received text: ${text}`);
      }
      if (inlineData) {
        console.log(`Received inline data: ${inlineData}`);
      }

      turn.push(message);
      if (message.serverContent?.turnComplete) {
        return turn;
      }
    }
  }

  const session = await client.live.connect({
    model: model,
    callbacks: {
      onopen: () => {
        console.debug('Opened');
      },
      onmessage: (message: LiveServerMessage) => {
        responseQueue.put(message);
      },
      onerror: (e: ErrorEvent) => {
        console.debug('Error:', e.message);
      },
      onclose: (e: CloseEvent) => {
        console.debug('Close:', e.reason);
        responseQueue.clear();
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
    const model = 'gemini-2.0-flash-live-preview-04-09';
    await live(client, model).catch((e) => console.error('got error', e));
    return;
  }

  const model = 'gemini-2.0-flash-live-001';
  let client = new GoogleGenAI({
    vertexai: false,
    apiKey: GEMINI_API_KEY,
  });

  if (GOOGLE_GENAI_MLDEV_USE_EPHEMERAL) {
    // Create the ephemeral token, normally you'd do this on your server
    // using your API key.
    const token: AuthToken = await client.authTokens.create({
      config: {
        uses: 1, // The default
        liveConnectConstraints: {
          model: model,
          config: {
            responseModalities: [Modality.TEXT],
          },
        },
        // Ephemeral tokens only work on v1alpha for now.
        httpOptions: {apiVersion: 'v1alpha'},
      },
    });
    console.log('Token:', JSON.stringify(token));

    // Use the auth token to create a client
    // This client can only call live.connect, never sees your api key.
    client = new GoogleGenAI({
      apiKey: token.name,
      apiVersion: 'v1alpha',
    });
  }

  await live(client, model).catch((e) => console.error('got error', e));
}

main();
