/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI} from '../../src/client';
import {Models} from '../../src/models';
import {
  Content,
  FinishReason,
  GenerateContentResponse,
  Type,
} from '../../src/types';

function buildGenerateContentResponse(
  content: Content,
  finishReason?: FinishReason,
): GenerateContentResponse {
  const response = new GenerateContentResponse();
  response.candidates = [
    {
      content,
    },
  ];
  if (finishReason !== undefined) {
    response.candidates[0].finishReason = finishReason;
  }
  return response;
}

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
      response: buildGenerateContentResponse({}),
    },
    {
      name: 'GenerateContent returns default part',
      response: buildGenerateContentResponse({parts: [{}], role: 'model'}),
    },
    {
      name: 'GenerateContent returns part with empty text',
      response: buildGenerateContentResponse({
        parts: [{text: ''}],
        role: 'model',
      }),
    },
  ];

  testCases.forEach(async (testCase) => {
    it(testCase.name, async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
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
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
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

describe('sendMessage subsequent calls', () => {
  it('sendMessage errors should not persist', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const chat = client.chats.create({model: 'gemini-1.5-flash'});

    const modelsModule = client.models;
    spyOn(modelsModule, 'generateContent').and.returnValue(
      Promise.reject('test error'),
    );

    const message1 = chat.sendMessage({message: 'send message 1'});
    await expectAsync(message1).toBeRejectedWith('test error');

    const successResponse = new GenerateContentResponse();
    successResponse.candidates = [
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
    modelsModule.generateContent = jasmine
      .createSpy('generateContent')
      .and.returnValue(Promise.resolve(successResponse));

    const message2 = chat.sendMessage({message: 'send message 2'});
    await expectAsync(message2).toBeResolvedTo(successResponse);
  });
});

describe('GenerateContent response schema', () => {
  it('smoke test GenerateContent response schema with Array', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const validResponse = Object.setPrototypeOf(
      {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                {
                  text: '[{"recipeName": "recipe1"},{"recipeName": "recipe2"},{"recipeName": "recipe3"}]',
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
    const request = {
      model: 'gemini-2.0-flash',
      contents: 'List 3 popular cookie recipes.',
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              'recipeName': {
                type: Type.STRING,
                description: 'Name of the recipe',
                nullable: false,
              },
            },
            required: ['recipeName'],
          },
        },
      },
    };
    const response = await client.models.generateContent(request);

    expect(response).toEqual(validResponse);
    // Verify that valid response and request are added to the history.
    expect(modelsModule.generateContent).toHaveBeenCalledWith(request);
  });
});

describe('sendMessage config', () => {
  let client: GoogleGenAI;
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
    client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
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
  let client: GoogleGenAI;
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
    client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
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
                text: '',
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

  it('Chunk with empty text', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
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
  const responseChunk1 = buildGenerateContentResponse({
    parts: [{text: 'response chunk 1'}],
    role: 'model',
  });

  const responseChunk2 = buildGenerateContentResponse(
    {
      parts: [{text: 'response chunk 2'}],
      role: 'model',
    },
    FinishReason.STOP,
  );

  async function* mockStreamResponse() {
    yield responseChunk1;
    yield responseChunk2;
  }

  it('GenerateContentStream with finish reason', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const modelsModule = client.models;
    const modelsSpy = spyOn(
      modelsModule,
      'generateContentStream',
    ).and.returnValue(Promise.resolve(mockStreamResponse()));
    const chat = client.chats.create({model: 'gemini-1.5-flash'});
    const response1 = await chat.sendMessageStream({message: 'send message 1'});
    const chunks1 = [];
    for await (const chunk of response1) {
      chunks1.push(chunk);
    }
    const response2 = await chat.sendMessageStream({message: 'send message 2'});
    const chunks2 = [];
    for await (const chunk of response2) {
      chunks2.push(chunk);
    }

    expect(chunks1).toEqual([responseChunk1, responseChunk2]);
    expect(chunks2).toEqual([]);
    const calls = modelsSpy.calls.allArgs();
    expect(calls[0][0]['contents']).toEqual([
      {role: 'user', parts: [{text: 'send message 1'}]},
    ]);
    expect(calls[1][0]['contents']).toEqual([
      {role: 'user', parts: [{text: 'send message 1'}]},
      {role: 'model', parts: [{text: 'response chunk 1'}]},
      {role: 'model', parts: [{text: 'response chunk 2'}]},
      {role: 'user', parts: [{text: 'send message 2'}]},
    ]);
  });
});

describe('create chat with history', () => {
  it('throws error if history not start with a user turn', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const history = [{role: 'model', parts: [{text: 'some model response'}]}];

    expect(() =>
      client.chats.create({model: 'gemini-1.5-flash', history}),
    ).toThrowError('History must start with a user turn.');
  });

  it('throws error if history contains invalid role', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const history = [
      {role: 'user', parts: [{text: 'user content'}]},
      {role: 'unknown_role', parts: [{text: 'unknown role response'}]},
    ];

    expect(() =>
      client.chats.create({model: 'gemini-1.5-flash', history}),
    ).toThrowError('Role must be user or model, but got unknown_role.');
  });

  it('derives curated history with invalid model response', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const comprehensiveHistory = [
      {role: 'user', parts: [{text: 'user content 1'}]},
      {role: 'model', parts: []},
      {role: 'user', parts: [{text: 'user content 2'}]},
      {role: 'model', parts: [{text: 'valid model response'}]},
    ];
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      history: comprehensiveHistory,
    });

    expect(chat.getHistory()).toEqual(comprehensiveHistory);
    expect(chat.getHistory(true)).toEqual(comprehensiveHistory.slice(2));
  });

  it('derives curated history with valid model response', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const comprehensiveHistory = [
      {role: 'user', parts: [{text: 'user content 1'}]},
      {role: 'model', parts: [{text: 'valid model response 1'}]},
      {role: 'user', parts: [{text: 'user content 2'}]},
      {
        role: 'model',
        parts: [{functionCall: {name: 'foo', args: {'param': 'bar'}}}],
      },
      {role: 'user', parts: [{text: 'user content 2'}]},
      {
        role: 'model',
        parts: [{functionResponse: {name: 'foo', response: {'result': 'bar'}}}],
      },
    ];
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      history: comprehensiveHistory,
    });

    expect(chat.getHistory()).toEqual(comprehensiveHistory);
    expect(chat.getHistory(true)).toEqual(comprehensiveHistory);
  });
});

describe('getHistory', () => {
  const existingInputContent = {
    role: 'user',
    parts: [{text: 'existing user content'}],
  };
  const existingOutputContent = {
    role: 'model',
    parts: [{text: 'existing model response'}],
  };

  async function* mockStreamResponse() {
    yield buildGenerateContentResponse({
      parts: [{text: 'streaming response chunk 1'}],
      role: 'model',
    });
    yield buildGenerateContentResponse(
      {parts: [{text: 'streaming response chunk 2'}], role: 'model'},
      FinishReason.STOP,
    );
  }

  it('appends to history when sendMessage is called', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const modelsModule = client.models;
    const mockResponse = buildGenerateContentResponse({
      parts: [{text: 'new model response'}],
      role: 'model',
    });
    spyOn(modelsModule, 'generateContent').and.returnValue(
      Promise.resolve(mockResponse),
    );
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      history: [existingInputContent, existingOutputContent],
    });

    await chat.sendMessage({message: 'new user content'});

    const expectedHistory = [
      existingInputContent,
      existingOutputContent,
      {role: 'user', parts: [{text: 'new user content'}]},
      {role: 'model', parts: [{text: 'new model response'}]},
    ];
    expect(chat.getHistory()).toEqual(expectedHistory);
    expect(chat.getHistory(true)).toEqual(expectedHistory);
  });

  it('appends to history when sendMessageStream is called', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const modelsModule = client.models;
    spyOn(modelsModule, 'generateContentStream').and.returnValue(
      Promise.resolve(mockStreamResponse()),
    );
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      history: [existingInputContent, existingOutputContent],
    });

    const chunks = await chat.sendMessageStream({message: 'new user content'});
    for await (const _chunk of chunks) {
      // No-op, consumes all chunks from the stream.
    }

    const expectedHistory = [
      existingInputContent,
      existingOutputContent,
      {role: 'user', parts: [{text: 'new user content'}]},
      {
        role: 'model',
        parts: [{text: 'streaming response chunk 1'}],
      },
      {
        role: 'model',
        parts: [{text: 'streaming response chunk 2'}],
      },
    ];
    expect(chat.getHistory()).toEqual(expectedHistory);
    expect(chat.getHistory(true)).toEqual(expectedHistory);
  });

  it('invalid model response is not added to curated history', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const modelsModule = client.models;
    const invalidContent = {parts: [{text: ''}], role: 'model'};
    const mockResponse = buildGenerateContentResponse(invalidContent);
    spyOn(modelsModule, 'generateContent').and.returnValue(
      Promise.resolve(mockResponse),
    );
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
    });

    await chat.sendMessage({message: 'new user content'});

    const expectedComprehensiveHistory = [
      {role: 'user', parts: [{text: 'new user content'}]},
      invalidContent,
    ];
    expect(chat.getHistory()).toEqual(expectedComprehensiveHistory);
    expect(chat.getHistory(true)).toEqual([]);
  });

  it('inserts an empty model content when response is empty.', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const modelsModule = client.models;
    spyOn(modelsModule, 'generateContent').and.returnValue(
      Promise.resolve(new GenerateContentResponse()),
    );
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
    });

    await chat.sendMessage({message: 'new user content'});

    const expectedComprehensiveHistory = [
      {role: 'user', parts: [{text: 'new user content'}]},
      {role: 'model', parts: []},
    ];
    expect(chat.getHistory()).toEqual(expectedComprehensiveHistory);
    expect(chat.getHistory(true)).toEqual([]);
  });
});
