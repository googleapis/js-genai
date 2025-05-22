/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAIOptions} from '../../../src/client.js';
import {Session} from '../../../src/live.js';
import {liveEphemeralConnect} from '../../../src/node/_node_live_ephemeral.js';
import {GoogleGenAI} from '../../../src/node/node_client.js';
import * as types from '../../../src/types.js';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const MLDEV_MODEL = 'gemini-2.0-flash-live-001';

class SessionWithQueue {
  private messageQueue: types.LiveServerMessage[] = [];
  private messageResolver:
      ((message: types.LiveServerMessage) => void)|null = null;
  private session: Session|null = null;

  public client: GoogleGenAI;  // Explicitly define properties
  public model: string;
  public createAuthTokenConfig?: types.CreateAuthTokenConfig;
  public liveConnectConfig?: types.LiveConnectConfig;

  constructor(
      client: GoogleGenAI,  // Remove 'public' keyword here
      model: string,
      createAuthTokenConfig?: types.CreateAuthTokenConfig,
      liveConnectConfig?: types.LiveConnectConfig,
  ) {
    this.client = client;  // Assign to the class properties
    this.model = model;
    this.createAuthTokenConfig = createAuthTokenConfig;
    this.liveConnectConfig = liveConnectConfig;
  }

  async initializeSession(): Promise<void> {
    // Use client to create a token
    const token: types.AuthToken = await this.client.authTokens.create({
      config: this.createAuthTokenConfig,
    });
    console.log(`Created token.${token.name}`);

    // Use a token to create a constrained Live session (no need to use client)
    this.session = await liveEphemeralConnect({
      accessToken: token.name,
      model: this.model,
      config: this.liveConnectConfig,
      callbacks: {
        onopen: null,
        onmessage: (message: types.LiveServerMessage) => {
          if (this.messageResolver) {
            this.messageResolver(message);
            this.messageResolver = null;  // Clear resolver after fulfilling
          } else {
            this.messageQueue.push(message);
          }
        },
        onerror: null,
        onclose: null,
      },
    });
  }

  sendClientContent(params: types.LiveSendClientContentParameters) {
    if (this.session === null) {
      throw new Error('Session is uninitialized. Cannot send client content.');
    }
    return this.session.sendClientContent(params);
  }

  sendRealtimeInput(params: types.LiveSendRealtimeInputParameters) {
    if (this.session === null) {
      throw new Error('Session is uninitialized. Cannot send client content.');
    }
    return this.session.sendRealtimeInput(params);
  }

  sendToolResponse(params: types.LiveSendToolResponseParameters) {
    if (this.session === null) {
      throw new Error('Session is uninitialized. Cannot send client content.');
    }
    return this.session.sendToolResponse(params);
  }

  close() {
    if (this.session === null) {
      throw new Error('Session is uninitialized. Cannot send client content.');
    }
    return this.session.close();
  }

  async receive(): Promise<types.LiveServerMessage> {
    return new Promise((resolve) => {
      if (this.messageQueue.length > 0) {
        resolve(this.messageQueue.shift()!);
      } else {
        this.messageResolver = resolve;
      }
    });
  }
}

async function make_session_with_queue(
    client: GoogleGenAI,
    model: string,
    createAuthTokenConfig?: types.CreateAuthTokenConfig,
    liveConnectConfig?: types.LiveConnectConfig,
    ): Promise<SessionWithQueue> {
  const session = new SessionWithQueue(
      client, model, createAuthTokenConfig, liveConnectConfig);
  await session.initializeSession();
  return session;
}

describe('liveEphemeralConnect', () => {
  it('ML Dev Case 1: global lock', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
      apiVersion: 'v1alpha',
    };
    const client = new GoogleGenAI(clientOpts);
    const createAuthTokenConfig: types.CreateAuthTokenConfig = {
      uses: 1,
      liveEphemeralParameters: {
        model: MLDEV_MODEL,
        config: {
          responseModalities: [types.Modality.AUDIO],
          temperature: 0.7,
        },
      },
    };
    const liveConnectConfig: types.LiveConnectConfig = {
      responseModalities: [types.Modality.TEXT],
      httpOptions: {
        apiVersion: 'v1alpha',
      },
    };
    const session = await make_session_with_queue(
        client, MLDEV_MODEL, createAuthTokenConfig, liveConnectConfig);

    session.sendClientContent({
      turns: 'Hello!',
      turnComplete: true,
    });
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();
    // Due to the global lock, responseModalities TEXT will be ignored by the
    // API.
    const message = await session.receive();

    expect(message.serverContent?.modelTurn?.parts?.[0].inlineData)
        .not.toBeNull();

    session.close();

    console.log('ML Dev Case 1: global lock ok');
  });

  it('ML Dev Case 2: lock all non-null fields', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
      apiVersion: 'v1alpha',
    };
    const client = new GoogleGenAI(clientOpts);
    const createAuthTokenConfig: types.CreateAuthTokenConfig = {
      uses: 1,
      lockAdditionalFields: [],
      liveEphemeralParameters: {
        model: MLDEV_MODEL,
        config: {
          responseModalities: [types.Modality.AUDIO],
          temperature: 0.7,
        },
      },
    };
    const liveConnectConfig: types.LiveConnectConfig = {
      responseModalities: [types.Modality.TEXT],
      outputAudioTranscription: {},
      httpOptions: {
        apiVersion: 'v1alpha',
      },
    };
    const session = await make_session_with_queue(
        client, MLDEV_MODEL, createAuthTokenConfig, liveConnectConfig);

    session.sendClientContent({
      turns: 'Hello!',
      turnComplete: true,
    });
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    // Due to the non additional lock, responseModalities TEXT will be ignored
    // by the API. Also we should observe the output transcription.

    const message = await session.receive();
    expect(message.serverContent?.modelTurn?.parts?.[0].inlineData)
        .not.toBeNull();
    const transcription = await session.receive();
    console.log(transcription.serverContent?.outputTranscription);

    session.close();

    console.log('ML Dev Case 2: lock all non-null fields ok');
  });

  it('ML Dev Case 3: freeze unset fields as default', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
      apiVersion: 'v1alpha',
    };
    const client = new GoogleGenAI(clientOpts);
    const createAuthTokenConfig: types.CreateAuthTokenConfig = {
      uses: 1,
      lockAdditionalFields: ['outputAudioTranscription'],
      liveEphemeralParameters: {
        model: MLDEV_MODEL,
        config: {
          responseModalities: [types.Modality.AUDIO],
          temperature: 0.7,
        },
      },
    };
    const liveConnectConfig: types.LiveConnectConfig = {
      outputAudioTranscription: {},  /// this will be ignored
      httpOptions: {
        apiVersion: 'v1alpha',
      },
    };
    const session = await make_session_with_queue(
        client, MLDEV_MODEL, createAuthTokenConfig, liveConnectConfig);

    session.sendClientContent({
      turns: 'Hello!',
      turnComplete: true,
    });
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    // Due to the additional lock, output transcription will be ignored
    // by the API.

    const message = await session.receive();
    expect(message.serverContent?.modelTurn?.parts?.[0].inlineData)
        .not.toBeNull();
    const transcription = await session.receive();
    expect(transcription.serverContent?.outputTranscription).toBeUndefined();

    session.close();

    console.log('ML Dev Case 3: freeze unset fields as default ok');
  });

  it('ML Dev Case 5: no lock', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
      apiVersion: 'v1alpha',
    };
    const client = new GoogleGenAI(clientOpts);
    const createAuthTokenConfig: types.CreateAuthTokenConfig = {
      uses: 1,
      liveEphemeralParameters: {
        model: MLDEV_MODEL,
      },
    };
    const liveConnectConfig: types.LiveConnectConfig = {
      responseModalities: [types.Modality.TEXT],
      httpOptions: {
        apiVersion: 'v1alpha',
      },
    };
    const session = await make_session_with_queue(
        client, MLDEV_MODEL, createAuthTokenConfig, liveConnectConfig);

    session.sendClientContent({
      turns: 'Hello!',
      turnComplete: true,
    });
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await session.receive();
    expect(message.serverContent?.modelTurn?.parts?.[0].text).not.toBeNull();

    session.close();

    console.log('ML Dev Case 5: no lock ok');
  });

  it('ML Dev Case 6: lock temperature', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
      apiVersion: 'v1alpha',
    };
    const client = new GoogleGenAI(clientOpts);
    const createAuthTokenConfig: types.CreateAuthTokenConfig = {
      uses: 1,
      // instead of generationConfig.temperature
      lockAdditionalFields: ['temperature'],
      liveEphemeralParameters: {
        model: MLDEV_MODEL,
        config: {
          responseModalities: [types.Modality.TEXT],
        },
      },
    };
    const liveConnectConfig: types.LiveConnectConfig = {
      httpOptions: {
        apiVersion: 'v1alpha',
      },
    };
    const session = await make_session_with_queue(
        client, MLDEV_MODEL, createAuthTokenConfig, liveConnectConfig);

    session.sendClientContent({
      turns: 'Hello!',
      turnComplete: true,
    });
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    // Due to the additional lock, output transcription will be ignored
    // by the API.

    const message = await session.receive();
    expect(message.serverContent?.modelTurn?.parts?.[0].text).not.toBeNull();

    session.close();

    console.log('ML Dev Case 6: lock temperature ok');
  });
});
