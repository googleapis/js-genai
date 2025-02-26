/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Session} from '../../src/live';
import {ClientInitOptions, NodeClient} from '../../src/node/node_client';
import * as types from '../../src/types';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;

async function receive(session: Session): Promise<types.LiveServerMessage> {
  return new Promise((resolve) => {
    session.onmessage = (message: types.LiveServerMessage) => {
      resolve(message);
      session.onmessage = undefined;
    };
  });
}

describe('live', () => {
  it('ML Dev should initialize from environment variables', async () => {
    const client = new NodeClient({vertexai: false});
    expect(client.live).not.toBeNull();
  });

  it('ML Dev should send text in async session', async () => {
    const clientOpts: ClientInitOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
      httpOptions: {
        apiVersion: 'v1alpha',
      },
    };
    const client = new NodeClient(clientOpts);
    const session = await client.live.connect({
      model: 'models/gemini-2.0-flash-exp',
    });

    session.send('Hello what should we talk about?', true);
    const setupMessage = await receive(session);
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await receive(session);
    expect(message.serverContent).not.toBeNull();

    session.close();
  });

  it('Vertex should send text in async session', async () => {
    const clientOpts: ClientInitOptions = {
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    };
    const client = new NodeClient(clientOpts);
    const session = await client.live.connect({
      model: `projects/${GOOGLE_CLOUD_PROJECT}/locations/${
        GOOGLE_CLOUD_LOCATION
      }/publishers/google/models/gemini-2.0-flash-exp`,
    });

    session.send('Hello what should we talk about?', true);
    const setupMessage = await receive(session);
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await receive(session);
    expect(message.serverContent).not.toBeNull();

    session.close();
  });

  it('ML Dev should send content dict in async session', async () => {
    const clientOpts: ClientInitOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
      httpOptions: {
        apiVersion: 'v1alpha',
      },
    };
    const client = new NodeClient(clientOpts);
    const session = await client.live.connect({
      model: 'models/gemini-2.0-flash-exp',
    });

    session.send({
      turns: [
        {parts: [{text: 'Hello what should we talk about?'}], role: 'user'},
      ],
      turnComplete: true,
    });
    const setupMessage = await receive(session);
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await receive(session);
    expect(message.serverContent).not.toBeNull();

    session.close();
  });

  it('Vertex should send content dict in async session', async () => {
    const clientOpts: ClientInitOptions = {
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    };
    const client = new NodeClient(clientOpts);
    const session = await client.live.connect({
      model: `projects/${GOOGLE_CLOUD_PROJECT}/locations/${
        GOOGLE_CLOUD_LOCATION
      }/publishers/google/models/gemini-2.0-flash-exp`,
    });

    session.send({
      turns: [
        {parts: [{text: 'Hello what should we talk about?'}], role: 'user'},
      ],
      turnComplete: true,
    });
    const setupMessage = await receive(session);
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await receive(session);
    expect(message.serverContent).not.toBeNull();

    session.close();
  });

  it('ML Dev should return error for invalid input in async session', async () => {
    const clientOpts: ClientInitOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
      httpOptions: {
        apiVersion: 'v1alpha',
      },
    };
    const client = new NodeClient(clientOpts);
    const session = await client.live.connect({
      model: 'models/gemini-2.0-flash-exp',
    });

    try {
      session.send({name: 'name', response: {response: {}}});
    } catch (e: unknown) {
      if (e instanceof Error) {
        expect(e.message).toContain('FunctionResponse request must have an');
      }
    }
    session.close();
  });

  it('Vertex should return error for invalid input in async session', async () => {
    const clientOpts: ClientInitOptions = {
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    };
    const client = new NodeClient(clientOpts);
    const session = await client.live.connect({
      model: `projects/${GOOGLE_CLOUD_PROJECT}/locations/${
        GOOGLE_CLOUD_LOCATION
      }/publishers/google/models/gemini-2.0-flash-exp`,
    });

    try {
      session.send({name: 'name', response: {response: {}}});
    } catch (e: unknown) {
      if (e instanceof Error) {
        expect(e.message).toContain('FunctionResponse request must have an');
      }
    }

    session.close();
  });

  it('Vertex should initialize session with publishers prefix', async () => {
    const clientOpts: ClientInitOptions = {
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    };
    const client = new NodeClient(clientOpts);
    const session = await client.live.connect({
      model: 'publishers/google/models/gemini-2.0-flash-exp',
    });
    const setupMessage = await receive(session);
    expect(setupMessage.setupComplete).not.toBeNull();

    session.close();
  });

  it('Vertex should initialize session without prefix', async () => {
    const clientOpts: ClientInitOptions = {
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    };
    const client = new NodeClient(clientOpts);
    const session = await client.live.connect({
      model: 'models/gemini-2.0-flash-exp',
    });
    const setupMessage = await receive(session);
    expect(setupMessage.setupComplete).not.toBeNull();

    session.close();
  });

  it('ML Dev should send tool response', async () => {
    const clientOpts: ClientInitOptions = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
      httpOptions: {
        apiVersion: 'v1alpha',
      },
    };
    const client = new NodeClient(clientOpts);
    const session = await client.live.connect({
      model: 'models/gemini-2.0-flash-exp',
      config: {
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
      },
    });

    session.send({
      turns: [
        {
          parts: [{text: 'what is the weather in Redmond Washington'}],
          role: 'user',
        },
      ],
      turnComplete: true,
    });
    const setupMessage = await receive(session);
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await receive(session);
    expect(message.toolCall).not.toBeNull();

    session.close();
  });

  it('Vertex should send tool response', async () => {
    const clientOpts: ClientInitOptions = {
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    };
    const client = new NodeClient(clientOpts);
    const session = await client.live.connect({
      model: `projects/${GOOGLE_CLOUD_PROJECT}/locations/${
        GOOGLE_CLOUD_LOCATION
      }/publishers/google/models/gemini-2.0-flash-exp`,
      config: {
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
      },
    });

    session.send({
      turns: [
        {
          parts: [{text: 'what is the weather in Redmond Washington'}],
          role: 'user',
        },
      ],
      turnComplete: true,
    });
    const setupMessage = await receive(session);
    expect(setupMessage.setupComplete).not.toBeNull();

    const message = await receive(session);
    expect(message.toolCall).not.toBeNull();

    session.close();
  });
});
