/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI} from '../../src/client.js';
import {Models} from '../../src/models.js';
import {
  Content,
  FinishReason,
  GenerateContentResponse,
  Type,
} from '../../src/types.js';

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

    const successResponse = buildGenerateContentResponse({
      role: 'model',
      parts: [{text: 'valid response'}],
    });

    const modelsModule = client.models;
    spyOn(modelsModule, 'generateContent').and.returnValues(
      Promise.reject('test error'),
      Promise.resolve(successResponse),
    );

    const message1 = chat.sendMessage({message: 'send message 1'});
    await message1.catch(() => {});
    const message2 = chat.sendMessage({message: 'send message 2'});
    await message2.catch(() => {});

    await expectAsync(message1).toBeRejectedWith('test error');
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

  it('independent valid model output is added to curated history', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const comprehensiveHistory = [
      {role: 'model', parts: [{text: 'model content'}]},
    ];
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      history: comprehensiveHistory,
    });

    expect(chat.getHistory()).toEqual(comprehensiveHistory);
    expect(chat.getHistory(true)).toEqual(comprehensiveHistory);
  });

  it('consecutive valid model outputs are added to curated history', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const comprehensiveHistory = [
      {role: 'model', parts: [{text: 'model content 1'}]},
      {role: 'model', parts: [{text: 'model content 2'}]},
      {role: 'user', parts: [{text: 'user content 1'}]},
      {role: 'model', parts: [{text: 'model content 3'}]},
    ];
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      history: comprehensiveHistory,
    });

    expect(chat.getHistory()).toEqual(comprehensiveHistory);
    expect(chat.getHistory(true)).toEqual(comprehensiveHistory);
  });

  it('consecutive model outputs with invalid content are not added to curated history', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const comprehensiveHistory = [
      {role: 'model', parts: [{text: 'model content 1'}]},
      {role: 'model', parts: [{text: ''}]}, // invalid content
      {role: 'model', parts: [{text: 'model content 2'}]},
    ];
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      history: comprehensiveHistory,
    });

    expect(chat.getHistory()).toEqual(comprehensiveHistory);
    expect(chat.getHistory(true)).toEqual([]);
  });

  it('independent user input is added to curated history', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const comprehensiveHistory = [
      {role: 'user', parts: [{text: 'user content'}]},
    ];
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      history: comprehensiveHistory,
    });

    expect(chat.getHistory()).toEqual(comprehensiveHistory);
    expect(chat.getHistory(true)).toEqual(comprehensiveHistory);
  });

  it('consecutive user inputs are added to curated history', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const comprehensiveHistory = [
      {role: 'user', parts: [{text: 'user content 1'}]},
      {role: 'user', parts: [{text: 'user content 2'}]},
    ];
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      history: comprehensiveHistory,
    });

    expect(chat.getHistory()).toEqual(comprehensiveHistory);
    expect(chat.getHistory(true)).toEqual(comprehensiveHistory);
  });

  it('end with user input is added to curated history', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const comprehensiveHistory = [
      {role: 'user', parts: [{text: 'user content 1'}]},
      {role: 'model', parts: [{text: 'model content 2'}]},
      {role: 'user', parts: [{text: 'user content 2'}]},
    ];
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      history: comprehensiveHistory,
    });

    expect(chat.getHistory()).toEqual(comprehensiveHistory);
    expect(chat.getHistory(true)).toEqual(comprehensiveHistory);
  });

  it('user input with associated invalid model content is not added to curated history', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const comprehensiveHistory = [
      {role: 'user', parts: [{text: 'user content 1'}]},
      {role: 'user', parts: [{text: 'user content 2'}]},
      {role: 'model', parts: [{text: ''}]}, // invalid content
    ];
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      history: comprehensiveHistory,
    });

    expect(chat.getHistory()).toEqual(comprehensiveHistory);
    expect(chat.getHistory(true)).toEqual([
      {role: 'user', parts: [{text: 'user content 1'}]},
    ]);
  });

  it('user input with associated valid model content are added to curated history', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const comprehensiveHistory = [
      {role: 'user', parts: [{text: 'user content 1'}]},
      {role: 'user', parts: [{text: 'user content 2'}]},
      {role: 'model', parts: [{text: 'model content 1'}]},
    ];
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      history: comprehensiveHistory,
    });

    expect(chat.getHistory()).toEqual(comprehensiveHistory);
    expect(chat.getHistory(true)).toEqual(comprehensiveHistory);
  });

  it('mutate history outside of chat session does not affect the chat history', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const externalHistory = [
      {role: 'user', parts: [{text: 'user content 1'}]},
      {role: 'model', parts: [{text: 'model content 1'}]},
    ];
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      history: externalHistory,
    });
    externalHistory.push(
      {role: 'user', parts: [{text: 'user content 2'}]},
      {role: 'model', parts: [{text: 'model content 2'}]},
    );
    const expectedHistory = [
      {role: 'user', parts: [{text: 'user content 1'}]},
      {role: 'model', parts: [{text: 'model content 1'}]},
    ];

    expect(chat.getHistory()).toEqual(expectedHistory);
    expect(chat.getHistory(true)).toEqual(expectedHistory);
  });

  it('mutate history inside chat session does not affect the external history', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const modelsModule = client.models;
    const modelResponse = buildGenerateContentResponse({
      parts: [{text: 'model content 2'}],
      role: 'model',
    });
    spyOn(modelsModule, 'generateContent').and.returnValue(
      Promise.resolve(modelResponse),
    );
    const externalHistory = [
      {role: 'user', parts: [{text: 'user content 1'}]},
      {role: 'model', parts: [{text: 'model content 1'}]},
    ];
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      history: externalHistory,
    });
    await chat.sendMessage({message: 'user content 2'});

    expect(chat.getHistory().length).toEqual(4);
    expect(externalHistory.length).toEqual(2);
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

  it('getHistory returns a copy of the history', async () => {
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
    const fetchedHistory1 = chat.getHistory();

    await chat.sendMessage({message: 'new user content'});

    const fetchedHistory2 = chat.getHistory();

    expect(fetchedHistory1.length).toEqual(2);
    expect(fetchedHistory2.length).toEqual(4);
  });

  it('modifying the getHistory does not modify the chat history', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const originalHistory = [
      {role: 'user', parts: [{text: 'user content 1'}]},
      {role: 'model', parts: [{text: 'model content 1'}]},
    ];
    const chat = client.chats.create({
      model: 'gemini-1.5-flash',
      history: originalHistory,
    });

    const fetchedHistory1 = chat.getHistory();
    fetchedHistory1.push(
      {role: 'user', parts: [{text: 'user content 2'}]},
      {role: 'model', parts: [{text: 'model content 2'}]},
    );

    const fetchedHistory2 = chat.getHistory();

    expect(fetchedHistory2).toEqual(originalHistory);
  });

  it('empty text thoughts are appended', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const modelsModule = client.models;
    const mockResponse = buildGenerateContentResponse({
      parts: [{text: '', thought: true}, {text: 'new model response'}],
      role: 'model',
    });
    spyOn(modelsModule, 'generateContent').and.returnValue(
      Promise.resolve(mockResponse),
    );
    const chat = client.chats.create({
      model: 'gemini-2.0-flash',
      history: [existingInputContent, existingOutputContent],
    });

    await chat.sendMessage({message: 'new user content'});

    const expectedHistory = [
      existingInputContent,
      existingOutputContent,
      {role: 'user', parts: [{text: 'new user content'}]},
      {
        role: 'model',
        parts: [{text: '', thought: true}, {text: 'new model response'}],
      },
    ];
    expect(chat.getHistory()).toEqual(expectedHistory);
    expect(chat.getHistory(true)).toEqual(expectedHistory);
  });
  it('test chat history with no prior history and afc', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const sendMessageInputContent = {
      role: 'user',
      parts: [{text: 'user input will make model make function call'}],
    };
    const functionCall = {
      role: 'model',
      parts: [{functionCall: {name: 'foo', args: {'param': 'bar'}}}],
    };
    const functionResponse = {
      role: 'user',
      parts: [{functionResponse: {response: {'result': 'execution_result'}}}],
    };
    const modelFinalReturn = {
      role: 'model',
      parts: [{text: 'no momre functioncalls, model output'}],
    };
    // This is the response.automaticFunctionCallingHistory for the sendMessage,
    // afc history will have everything prior to the last model output. This is
    // tested in models_test.ts
    const afcHistory = [
      sendMessageInputContent,
      functionCall,
      functionResponse,
    ];
    const mockResponse = buildGenerateContentResponse(modelFinalReturn);
    mockResponse.automaticFunctionCallingHistory = afcHistory;

    spyOn(client.models, 'generateContent').and.returnValue(
      Promise.resolve(mockResponse),
    );
    // The scenario is that the chat has no prior history and the sendMessage
    // will invoke model to make function call and then return the model output.
    const chat = client.chats.create({
      model: 'gemini-2.0-flash',
    });

    await chat.sendMessage({message: sendMessageInputContent.parts[0].text});

    const expectedHistory = [
      sendMessageInputContent,
      functionCall,
      functionResponse,
      modelFinalReturn,
    ];

    expect(chat.getHistory(true)).toEqual(expectedHistory);
  });
  it('test chat history with prior history and afc', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const sendMessageInputContent = {
      role: 'user',
      parts: [{text: 'user input will make model make function call'}],
    };
    const functionCall = {
      role: 'model',
      parts: [{functionCall: {name: 'foo', args: {'param': 'bar'}}}],
    };
    const functionResponse = {
      role: 'user',
      parts: [{functionResponse: {response: {'result': 'execution_result'}}}],
    };
    const modelFinalReturn = {
      role: 'model',
      parts: [{text: 'no momre functioncalls, model output'}],
    };
    // This is the response.automaticFunctionCallingHistory for the sendMessage,
    // afc history will have everything prior to the last model output. This is
    // tested in models_test.ts
    const afcHistory = [
      existingInputContent,
      existingOutputContent,
      sendMessageInputContent,
      functionCall,
      functionResponse,
    ];
    const mockResponse = buildGenerateContentResponse(modelFinalReturn);
    mockResponse.automaticFunctionCallingHistory = afcHistory;

    spyOn(client.models, 'generateContent').and.returnValue(
      Promise.resolve(mockResponse),
    );
    // The scenario is that the chat has prior history and the sendMessage will
    // invoke model to make function call and then return the model output.
    const chat = client.chats.create({
      model: 'gemini-2.0-flash',
      history: [existingInputContent, existingOutputContent],
    });

    await chat.sendMessage({message: sendMessageInputContent.parts[0].text});

    const expectedHistory = [
      existingInputContent,
      existingOutputContent,
      sendMessageInputContent,
      functionCall,
      functionResponse,
      modelFinalReturn,
    ];

    expect(chat.getHistory(true)).toEqual(expectedHistory);
  });
});
