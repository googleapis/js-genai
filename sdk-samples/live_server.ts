/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint no-constant-condition: 0 */
/* eslint @typescript-eslint/no-require-imports: 0 */

import * as types from '@google/genai';
import {GoogleGenAI} from '@google/genai';

import type {Request, Response} from 'express'; // Import types only
import express from 'express';

import cors from 'cors';
import http from 'http';
import path from 'path';
import {Server, Socket} from 'socket.io';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

export function createBlob(audioData: string): types.Blob {
  return {data: audioData, mimeType: 'audio/pcm;rate=16000'};
}

export function debug(data: object): string {
  return JSON.stringify(data);
}

async function main() {
  let options: types.GoogleGenAIOptions;
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    options = {
      // Vertex AI
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    };
  } else {
    options = {
      // Google AI
      vertexai: false,
      apiKey: API_KEY,
      httpOptions: {
        apiVersion: 'v1alpha',
      },
    };
  }
  const ai = new GoogleGenAI(options);
  const session = await ai.live.connect({
    model: 'gemini-2.0-flash-exp',
    callbacks: {
      onopen: () => {
        console.log('Live Session Opened');
      },
      onmessage: (message: types.LiveServerMessage) => {
        console.log('Received message from the server: %s\n', debug(message));
        if (
          message.serverContent &&
          message.serverContent.modelTurn &&
          message.serverContent.modelTurn.parts &&
          message.serverContent.modelTurn.parts.length > 0 &&
          message.serverContent.modelTurn.parts[0].inlineData &&
          message.serverContent.modelTurn.parts[0].inlineData.data
        ) {
          io.emit(
            'audioStream',
            message.serverContent.modelTurn.parts[0].inlineData.data,
          );
        }
      },
      onerror: (e: ErrorEvent) => {
        console.log('Live Session Error:', debug(e));
      },
      onclose: (e: CloseEvent) => {
        console.log('Live Session Closed:', debug(e));
      },
    },
  });

  const app = express();
  app.use(cors({origin: true}));
  const server = http.createServer(app);
  const io = new Server(server);

  app.get('/', function (req: Request, res: Response) {
    res.sendFile(path.join(process.cwd(), 'index.html'));
  });

  // Handle new connections to the socket.
  await io.on('connection', async function (socket: Socket) {
    console.log('Connected to the socket.');

    // Handle incoming content updates.`
    socket.on('contentUpdateText', function (text: string) {
      session.sendClientContent({turns: text, turnComplete: true});
    });

    // Handle incoming realtime audio input.
    socket.on('realtimeInput', function (audioData: string) {
      session.sendRealtimeInput({media: createBlob(audioData)});
    });
  });

  // Start the server
  // TODO: b/365983316 - Support configuring a different port.
  const port = 8000;
  await server.listen(port, async () => {
    console.log(`Server running on port ${port}`);
  });
}

main();

/* eslint no-constant-condition: 1 */
/* eslint @typescript-eslint/no-require-imports: 1 */
