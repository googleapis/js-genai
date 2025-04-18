/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';

import {GoogleGenAIOptions} from '../../../src/client';
import {Session} from '../../../src/live';
import {GoogleGenAI} from '../../../src/node/node_client';
import * as types from '../../../src/types';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;

const VERTEX_MODEL = 'gemini-2.0-flash-live-preview-04-09';
const MLDEV_MODEL = 'gemini-2.0-flash-live-001';

function loadFileAsBase64(filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Construct the full path to the file
    const filePath = path.join(__dirname, filename);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err); // Reject if there's an error reading the file
        return;
      }
      // Encode the file content to base64
      const base64Data = data.toString('base64');
      resolve(base64Data); // Resolve with the base64 string
    });
  });
}

class SessionWithQueue {
  private messageQueue: types.LiveServerMessage[] = [];
  private messageResolver: ((message: types.LiveServerMessage) => void) | null =
    null;
  private session: Session | null = null;

  public client: GoogleGenAI; // Explicitly define properties
  public model: string;
  public config?: types.LiveConnectConfig;

  constructor(
    client: GoogleGenAI, // Remove 'public' keyword here
    model: string,
    config?: types.LiveConnectConfig,
  ) {
    this.client = client; // Assign to the class properties
    this.model = model;
    this.config = config;
  }

  async initializeSession(): Promise<void> {
    this.session = await this.client.live.connect({
      model: this.model,
      config: this.config,
      callbacks: {
        onopen: null,
        onmessage: (message: types.LiveServerMessage) => {
          if (this.messageResolver) {
            this.messageResolver(message);
            this.messageResolver = null; // Clear resolver after fulfilling
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
  config?: types.LiveConnectConfig,
): Promise<SessionWithQueue> {
  const session = new SessionWithQueue(client, model, config);
  await session.initializeSession();
  return session;
}

describe('live', () => {
  it('ML Dev should initialize from environment variables', async () => {
    const client = new GoogleGenAI({vertexai: false});
    expect(client.live).not.toBeNull();
  });

  it('ML Dev should send text in async session', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
    };
    const client = new GoogleGenAI(clientOpts);
    const session = await make_session_with_queue(client, MLDEV_MODEL);

    session.sendClientContent({
      turns: 'Hello what should we talk about?',
      turnComplete: true,
    });
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await session.receive();
    expect(message.serverContent).not.toBeNull();

    session.close();

    console.log('Mldev ok');
  });

  it('Vertex should send text in async session', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    };
    const client = new GoogleGenAI(clientOpts);
    const session = await make_session_with_queue(client, VERTEX_MODEL);

    session.sendClientContent({
      turns: 'Hello what should we talk about?',
      turnComplete: true,
    });
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await session.receive();
    expect(message.serverContent).not.toBeNull();

    session.close();
    console.log('Vertex ok');
  });

  it('ML Dev should send content dict in async session', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
    };
    const client = new GoogleGenAI(clientOpts);
    const session = await make_session_with_queue(client, MLDEV_MODEL);

    session.sendClientContent({
      turns: [
        {parts: [{text: 'Hello what should we talk about?'}], role: 'user'},
      ],
      turnComplete: true,
    });
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await session.receive();
    expect(message.serverContent).not.toBeNull();

    session.close();
  });

  it('Vertex should send content dict in async session', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    };
    const client = new GoogleGenAI(clientOpts);
    const session = await make_session_with_queue(client, VERTEX_MODEL);

    session.sendClientContent({
      turns: [
        {parts: [{text: 'Hello what should we talk about?'}], role: 'user'},
      ],
      turnComplete: true,
    });
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await session.receive();
    expect(message.serverContent).not.toBeNull();

    session.close();
  });

  it('ML Dev should receive transcription in async session with transcription enabled', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
    };
    const client = new GoogleGenAI(clientOpts);
    const config: types.LiveConnectConfig = {
      outputAudioTranscription: {},
    };
    const session = await make_session_with_queue(client, MLDEV_MODEL, config);

    session.sendClientContent({
      turns: 'Hello what should we talk about?',
      turnComplete: true,
    });
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    // First message could be empty.
    await session.receive();
    const message = await session.receive();
    expect(message.serverContent).not.toBeNull();
    console.log(
      'ML Dev should receive transcription in async session with transcription enabled',
    );
    console.log(message);

    session.close();

    console.log('Mldev ok');
  });

  it('Vertex should receive transcription in async session with transcription enabled', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    };
    const client = new GoogleGenAI(clientOpts);
    const config: types.LiveConnectConfig = {
      outputAudioTranscription: {},
    };
    const session = await make_session_with_queue(client, VERTEX_MODEL, config);

    session.sendClientContent({
      turns: 'Hello what should we talk about?',
      turnComplete: true,
    });
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    // First message could be empty.
    await session.receive();
    const message = await session.receive();
    expect(message.serverContent).not.toBeNull();
    console.log(
      'Vertex should receive transcription in async session with transcription enabled',
    );
    console.log(message);

    session.close();
    console.log('Vertex ok');
  });

  it('ML Dev should return error for invalid input in async session', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
    };
    const client = new GoogleGenAI(clientOpts);
    const session = await make_session_with_queue(client, MLDEV_MODEL);

    try {
      session.sendToolResponse({
        functionResponses: {name: 'name', response: {response: {}}},
      });
    } catch (e: unknown) {
      if (e instanceof Error) {
        expect(e.message).toContain('FunctionResponse request must have an');
      }
    }
    session.close();
  });

  it('Vertex should return error for invalid input in async session', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    };
    const client = new GoogleGenAI(clientOpts);
    const session = await make_session_with_queue(client, VERTEX_MODEL);

    try {
      session.sendToolResponse({
        functionResponses: {name: 'name', response: {response: {}}},
      });
    } catch (e: unknown) {
      if (e instanceof Error) {
        expect(e.message).toContain('FunctionResponse request must have an');
      }
    }

    session.close();
  });

  it('Vertex should initialize session with publishers prefix', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    };
    const client = new GoogleGenAI(clientOpts);
    const session = await make_session_with_queue(
      client,
      'publishers/google/models/gemini-2.0-flash-live-preview-04-09',
    );
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    session.close();
  });

  it('Vertex should initialize session without prefix', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    };
    const client = new GoogleGenAI(clientOpts);
    const session = await make_session_with_queue(client, VERTEX_MODEL);
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    session.close();
  });

  it('ML Dev should send tool response', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
    };
    const client = new GoogleGenAI(clientOpts);
    const session = await make_session_with_queue(client, MLDEV_MODEL, {
      tools: [
        {
          functionDeclarations: [
            {
              name: 'get_current_weather',
              description: 'Get the current weather in a given location',
              parameters: {
                type: types.Type.OBJECT,
                properties: {
                  location: {
                    type: types.Type.STRING,
                    description: 'The city and state, e.g. San Francisco, CA',
                  },
                  unit: {
                    type: types.Type.STRING,
                    enum: ['celsius', 'fahrenheit'],
                  },
                },
                required: ['location'],
              },
            },
          ],
        },
      ],
    });

    session.sendClientContent({
      turns: [
        {
          parts: [{text: 'what is the weather in Redmond Washington'}],
          role: 'user',
        },
      ],
      turnComplete: true,
    });
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await session.receive();
    expect(message.toolCall).not.toBeNull();

    session.close();
  });

  it('Vertex should send tool response', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    };
    const client = new GoogleGenAI(clientOpts);
    const session = await make_session_with_queue(client, VERTEX_MODEL, {
      tools: [
        {
          functionDeclarations: [
            {
              name: 'get_current_weather',
              description: 'Get the current weather in a given location',
              parameters: {
                type: types.Type.OBJECT,
                properties: {
                  location: {
                    type: types.Type.STRING,
                    description: 'The city and state, e.g. San Francisco, CA',
                  },
                  unit: {
                    type: types.Type.STRING,
                    enum: ['celsius', 'fahrenheit'],
                  },
                },
                required: ['location'],
              },
            },
          ],
        },
      ],
    });

    session.sendClientContent({
      turns: [
        {
          parts: [{text: 'what is the weather in Redmond Washington'}],
          role: 'user',
        },
      ],
      turnComplete: true,
    });
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await session.receive();
    expect(message.toolCall).not.toBeNull();

    session.close();
  });

  it('ML Dev should send tool response with function responses', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
    };
    const client = new GoogleGenAI(clientOpts);
    const session = await make_session_with_queue(client, MLDEV_MODEL);

    session.sendToolResponse({
      functionResponses: [
        {
          'id': 'function-call-1',
          'name': 'getStatus',
          'response': {
            'mood': 'happy',
          },
        },
      ],
    });
    session.close();
  });

  it('Vertex should send tool response with function responses', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    };
    const client = new GoogleGenAI(clientOpts);
    const session = await make_session_with_queue(client, VERTEX_MODEL);

    session.sendToolResponse({
      functionResponses: [
        {
          'name': 'getStatus',
          'response': {
            'mood': 'happy',
          },
        },
      ],
    });
    session.close();
  });

  it('Vertex should respond to realtime media-audio input', async () => {
    //  If you need to generate any other audio files this command was useful:
    //
    //  ffmpeg -i hello_are_you_there.wav -f s16le -acodec pcm_s16le -ar 16000 hello_are_you_there.pcm
    const audioBase64 = await loadFileAsBase64('hello_are_you_there.pcm');
    const clientOpts: GoogleGenAIOptions = {
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    };
    const client = new GoogleGenAI(clientOpts);
    const session = await make_session_with_queue(client, VERTEX_MODEL, {
      responseModalities: [types.Modality.TEXT],
    });

    session.sendRealtimeInput({
      media: {
        data: audioBase64,
        mimeType: 'audio/pcm;rate=16000',
      },
    });
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await session.receive();
    expect(message.serverContent).not.toBeNull();

    session.close();
  });

  it('MLDev should respond to realtime media-audio input', async () => {
    const audioBase64 = await loadFileAsBase64('hello_are_you_there.wav');

    const clientOpts: GoogleGenAIOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
    };
    const client = new GoogleGenAI(clientOpts);
    const session = await make_session_with_queue(client, MLDEV_MODEL, {
      responseModalities: [types.Modality.TEXT],
    });

    session.sendRealtimeInput({
      media: {
        data: audioBase64,
        mimeType: 'audio/pcm;rate=16000',
      },
    });
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await session.receive();
    expect(message.serverContent).not.toBeNull();

    session.close();
  });

  it('MLDev should reply to realtime audio input', async () => {
    const audioBase64 = await loadFileAsBase64('hello_are_you_there.wav');
    const clientOpts: GoogleGenAIOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
    };
    const client = new GoogleGenAI(clientOpts);
    const session = await make_session_with_queue(client, MLDEV_MODEL, {
      responseModalities: [types.Modality.TEXT],
    });

    session.sendRealtimeInput({
      audio: {
        data: audioBase64,
        mimeType: 'audio/pcm;rate=16000',
      },
    });
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await session.receive();
    expect(message.serverContent).not.toBeNull();

    session.close();
  });

  it('MLDev should reply to realtime text input', async () => {
    const clientOpts: GoogleGenAIOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
    };
    const client = new GoogleGenAI(clientOpts);
    const session = await make_session_with_queue(client, MLDEV_MODEL, {
      responseModalities: [types.Modality.TEXT],
    });

    session.sendRealtimeInput({
      text: 'Are you there Gemini?',
    });
    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await session.receive();
    expect(message.serverContent).not.toBeNull();

    session.close();
  });

  it('MLDev handle activity start and end', async () => {
    const audioBase64 = await loadFileAsBase64('hello_are_you_there.wav');

    const clientOpts: GoogleGenAIOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
    };
    const client = new GoogleGenAI(clientOpts);
    const session = await make_session_with_queue(client, MLDEV_MODEL, {
      responseModalities: [types.Modality.TEXT],
      realtimeInputConfig: {automaticActivityDetection: {disabled: true}},
    } as types.LiveConnectConfig);

    session.sendRealtimeInput({
      activityStart: {},
    } as types.LiveSendRealtimeInputParameters);
    session.sendRealtimeInput({
      audio: {
        data: audioBase64,
        mimeType: 'audio/pcm;rate=16000',
      },
    });
    session.sendRealtimeInput({
      activityEnd: {},
    } as types.LiveSendRealtimeInputParameters);

    const setupMessage = await session.receive();
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await session.receive();
    expect(message.serverContent).not.toBeNull();

    session.close();
  });
});
