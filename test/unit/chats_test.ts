/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Models} from '../../src/models';
import {Client} from '../../src/node/node_client';
import {GenerateContentResponse} from '../../src/types';

describe('sendMessage invalid response', () => {
  const testCases = [
    {
      name: 'GenerateContent returns default response',
      response: new GenerateContentResponse(),
    },
    {
      name: 'GenerateContent returns empty candidates',
      response: Object.setPrototypeOf(
        {candidates: []},
        GenerateContentResponse.prototype,
      ),
    },
    {
      name: 'GenerateContent returns default candidate',
      response: Object.setPrototypeOf(
        {candidates: [{}]},
        GenerateContentResponse.prototype,
      ),
    },
    {
      name: 'GenerateContent returns default content',
      response: Object.setPrototypeOf(
        {candidates: [{content: {}}]},
        GenerateContentResponse.prototype,
      ),
    },
    {
      name: 'GenerateContent returns default part',
      response: Object.setPrototypeOf(
        {candidates: [{content: {parts: [{}]}}]},
        GenerateContentResponse.prototype,
      ),
    },
    {
      name: 'GenerateContent returns part with empty text',
      response: Object.setPrototypeOf(
        {candidates: [{content: {parts: [{text: ''}]}}]},
        GenerateContentResponse.prototype,
      ),
    },
  ];

  testCases.forEach(async (testCase) => {
    it(testCase.name, async () => {
      const client = new Client({vertexai: false, apiKey: 'fake-api-key'});
      const modelsModule = client.models;
      spyOn(modelsModule, 'generateContent').and.returnValue(
        Promise.resolve(testCase.response),
      );
      const chat = client.chats.create({model: 'gemini-1.5-flash'});
      let response = await chat.sendMessage({message: 'send message 1'});
      expect(response).toEqual(testCase.response);
      response = await chat.sendMessage({message: 'send message 2'});
      expect(modelsModule.generateContent).toHaveBeenCalledWith({
        model: 'gemini-1.5-flash',
        contents: [{role: 'user', parts: [{text: 'send message 1'}]}],
        config: {},
      });
      // Verify that invalid response and request are not added to the
      expect(modelsModule.generateContent).toHaveBeenCalledWith({
        model: 'gemini-1.5-flash',
        contents: [{role: 'user', parts: [{text: 'send message 2'}]}],
        config: {},
      });
    });
  });
});

describe('sendMessage valid response', () => {
  it('GenerateContent returns valid response', async () => {
    const client = new Client({vertexai: false, apiKey: 'fake-api-key'});
    const validResponse = Object.setPrototypeOf(
      {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                {
                  text: 'valid response 1',
                },
              ],
            },
          },
        ],
      },
      GenerateContentResponse.prototype,
    );
    const modelsModule = client.models;
    spyOn(modelsModule, 'generateContent').and.returnValue(
      Promise.resolve(validResponse),
    );
    const chat = client.chats.create({model: 'gemini-1.5-flash'});
    let response = await chat.sendMessage({message: 'send message 1'});
    expect(response).toEqual(validResponse);
    response = await chat.sendMessage({message: 'send message 2'});
    expect(modelsModule.generateContent).toHaveBeenCalledWith({
      model: 'gemini-1.5-flash',
      contents: [{role: 'user', parts: [{text: 'send message 1'}]}],
      config: {},
    });
    // Verify that valid response and request are added to the history.
    expect(modelsModule.generateContent).toHaveBeenCalledWith({
      model: 'gemini-1.5-flash',
      contents: [
        {role: 'user', parts: [{text: 'send message 1'}]},
        {role: 'model', parts: [{text: 'valid response 1'}]},
        {role: 'user', parts: [{text: 'send message 2'}]},
      ],
      config: {},
    });
  });
});

describe('sendMessage config', () => {
  let client: Client;
  let modelsModule: Models;
  let modelsSpy: jasmine.Spy;
  const response = new GenerateContentResponse();
  response.candidates = [
    {
      content: {
        role: 'model',
        parts: [
          {
            text: 'valid response',
          },
        ],
      },
    },
  ];

  beforeEach(() => {
    client = new Client({vertexai: false, apiKey: 'fake-api-key'});
    modelsModule = client.models;
    modelsSpy = spyOn(modelsModule, 'generateContent').and.returnValue(
      Promise.resolve(response),
    );
  });

  it('use default config', async () => {
    const defaultConfig = {candidateCount: 1};
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      config: defaultConfig,
    });
    await chat.sendMessage({message: 'send message'});

    expect(modelsModule.generateContent).toHaveBeenCalledWith(
      jasmine.objectContaining({config: defaultConfig}),
    );
  });

  it('use per-request config', async () => {
    const defaultConfig = {candidateCount: 1};
    const requestConfig = {candidateCount: 2};
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      config: defaultConfig,
    });
    await chat.sendMessage({message: 'send message', config: requestConfig});
    await chat.sendMessage({message: 'send message'});

    const calls = modelsSpy.calls.allArgs();
    expect(calls.length).toBe(2);
    expect(calls[0][0]['config']).toEqual(requestConfig);
    expect(calls[1][0]['config']).toEqual(defaultConfig);
  });
});

describe('sendMessageStream config', () => {
  let client: Client;
  let modelsModule: Models;
  let modelsSpy: jasmine.Spy;
  const chunk = new GenerateContentResponse();
  chunk.candidates = [
    {
      content: {
        role: 'model',
        parts: [
          {
            text: 'valid response',
          },
        ],
      },
    },
  ];
  async function* mockStreamResponse() {
    yield chunk;
  }

  beforeEach(() => {
    client = new Client({vertexai: false, apiKey: 'fake-api-key'});
    modelsModule = client.models;
    modelsSpy = spyOn(modelsModule, 'generateContentStream').and.returnValue(
      Promise.resolve(mockStreamResponse()),
    );
  });

  it('use default config', async () => {
    const defaultConfig = {candidateCount: 1};
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      config: defaultConfig,
    });
    await chat.sendMessageStream({message: 'send message'});

    expect(modelsModule.generateContentStream).toHaveBeenCalledWith(
      jasmine.objectContaining({config: defaultConfig}),
    );
  });

  it('use per-request config', async () => {
    const defaultConfig = {candidateCount: 1};
    const requestConfig = {candidateCount: 2};
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      config: defaultConfig,
    });
    await chat.sendMessageStream({
      message: 'send message',
      config: requestConfig,
    });
    await chat.sendMessageStream({message: 'send message'});

    const calls = modelsSpy.calls.allArgs();
    expect(calls.length).toBe(2);
    expect(calls[0][0]['config']).toEqual(requestConfig);
    expect(calls[1][0]['config']).toEqual(defaultConfig);
  });
});

describe('sendMessageStream invalid response', () => {
  const responseChunk1 = Object.setPrototypeOf(
    {
      candidates: [
        {
          content: {
            role: 'model',
            parts: [
              {
                text: 'response chunk 1',
              },
            ],
          },
        },
      ],
    },
    GenerateContentResponse.prototype,
  );
  const responseChunk2 = Object.setPrototypeOf(
    {
      candidates: [
        {
          content: {
            role: 'model',
            parts: [
              {
                text: 'response chunk 2',
              },
            ],
          },
        },
      ],
    },
    GenerateContentResponse.prototype,
  );

  async function* mockStreamResponse() {
    yield responseChunk1;
    yield responseChunk2;
  }

  it('GenerateContentStream no finish reason', async () => {
    const client = new Client({vertexai: false, apiKey: 'fake-api-key'});
    const modelsModule = client.models;
    spyOn(modelsModule, 'generateContentStream').and.returnValue(
      Promise.resolve(mockStreamResponse()),
    );
    const chat = client.chats.create({model: 'gemini-1.5-flash'});
    await chat.sendMessageStream({message: 'send message 1'});
    await chat.sendMessageStream({message: 'send message 2'});
    expect(modelsModule.generateContentStream).toHaveBeenCalledWith({
      model: 'gemini-1.5-flash',
      contents: [{role: 'user', parts: [{text: 'send message 1'}]}],
      config: {},
    });
    // Verify that invalid response and request are not added to the history.
    expect(modelsModule.generateContentStream).toHaveBeenCalledWith({
      model: 'gemini-1.5-flash',
      contents: [{role: 'user', parts: [{text: 'send message 2'}]}],
      config: {},
    });
  });
});

describe('sendMessageStream valid response', () => {
  const responseChunk1 = Object.setPrototypeOf(
    {
      candidates: [
        {
          content: {
            role: 'model',
            parts: [
              {
                text: 'response chunk 1',
              },
            ],
          },
        },
      ],
    },
    GenerateContentResponse.prototype,
  );
  const responseChunk2 = Object.setPrototypeOf(
    {
      candidates: [
        {
          content: {
            role: 'model',
            parts: [
              {
                text: 'response chunk 2',
              },
            ],
          },
          finishReason: 'STOP',
        },
      ],
    },
    GenerateContentResponse.prototype,
  );

  async function* mockStreamResponse() {
    yield responseChunk1;
    yield responseChunk2;
  }

  it('GenerateContentStream with finish reason', async () => {
    const client = new Client({vertexai: false, apiKey: 'fake-api-key'});
    const modelsModule = client.models;
    spyOn(modelsModule, 'generateContentStream').and.returnValue(
      Promise.resolve(mockStreamResponse()),
    );
    const chat = client.chats.create({model: 'gemini-1.5-flash'});
    let response = await chat.sendMessageStream({message: 'send message 1'});
    let chunk = await response.next();
    expect(chunk.value).toEqual(responseChunk1);
    chunk = await response.next();
    expect(chunk.value).toEqual(responseChunk2);
    response = await chat.sendMessageStream({message: 'send message 2'});
    expect(modelsModule.generateContentStream).toHaveBeenCalledWith({
      model: 'gemini-1.5-flash',
      contents: [{role: 'user', parts: [{text: 'send message 1'}]}],
      config: {},
    });
    // Verify that valid response and request are added to the history.
    expect(modelsModule.generateContentStream).toHaveBeenCalledWith({
      model: 'gemini-1.5-flash',
      contents: [
        {role: 'user', parts: [{text: 'send message 1'}]},
        {role: 'model', parts: [{text: 'response chunk 1'}]},
        {role: 'model', parts: [{text: 'response chunk 2'}]},
        {role: 'user', parts: [{text: 'send message 2'}]},
      ],
      config: {},
    });
  });
});
