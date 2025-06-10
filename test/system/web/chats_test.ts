/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Tool, Type} from '../../../src/types.js';
import {GoogleGenAI} from '../../../src/web/web_client.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const function_calling: Tool = {
  functionDeclarations: [
    {
      description: 'Custom divide function',
      name: 'customDivide',
      parameters: {
        type: Type.OBJECT,
        properties: {
          numerator: {
            type: Type.NUMBER,
          },
          denominator: {
            type: Type.NUMBER,
          },
        },
      },
    },
  ],
};

describe('sendMessage', () => {
  const testCases = [
    {
      name: 'Google AI with text',
      client: new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY}),
      model: 'gemini-2.0-flash',
      config: {},
      history: [],
      messages: ['why is the sky blue?'],
    },
    {
      name: 'Google AI with config',
      client: new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY}),
      model: 'gemini-2.0-flash',
      config: {temperature: 0.5, maxOutputTokens: 20},
      history: [],
      messages: ['why is the sky blue?'],
    },
    {
      name: 'Google AI with history',
      client: new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY}),
      model: 'gemini-2.0-flash',
      config: {},
      history: [
        {parts: [{text: 'a=5'}], role: 'user'},
        {parts: [{text: 'b=10'}], role: 'user'},
      ],
      messages: ['what is the value of a+b?'],
    },
    {
      name: 'Google AI multiple messages',
      client: new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY}),
      model: 'gemini-2.0-flash',
      config: {},
      history: [],
      messages: [
        'Tell me a story in 100 words?',
        'What is the title of the story?',
      ],
    },
  ];

  testCases.forEach(async (testCase) => {
    it(testCase.name, async () => {
      const client = testCase.client;
      const chat = client.chats.create({
        model: testCase.model,
        config: testCase.config,
        history: testCase.history,
      });
      for (const message of testCase.messages) {
        const response = await chat.sendMessage({message});
        console.log('chat.sendMessage response: ', response.text);
        expect(response.text).not.toBeNull();
      }
      const comprehensiveHistory = chat.getHistory();
      expect(comprehensiveHistory.length).toBeGreaterThan(0);
      const curatedHistory = chat.getHistory(true);
      expect(curatedHistory.length).toBeGreaterThan(0);
    });
  });

  testCases.forEach(async (testCase) => {
    it(testCase.name + ' stream', async () => {
      const client = testCase.client;
      const chat = client.chats.create({
        model: testCase.model,
        config: testCase.config,
        history: testCase.history,
      });
      for (const message of testCase.messages) {
        const response = await chat.sendMessageStream({message});
        for await (const chunk of response) {
          console.log('chat.sendMessageStream response chunk: ', chunk.text);
          expect(chunk.text).not.toBeNull();
        }
      }
      const comprehensiveHistory = chat.getHistory();
      expect(comprehensiveHistory.length).toBeGreaterThan(0);
      const curatedHistory = chat.getHistory(true);
      expect(curatedHistory.length).toBeGreaterThan(0);
    });
  });

  it('Google AI array of strings', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});
    const chat = client.chats.create({model: 'gemini-2.0-flash'});
    const response = await chat.sendMessage({
      message: ['why is the sky blue?', 'Can the sky appear in other colors?'],
    });
    console.log('chat.sendMessage response: ', response.text);
  });
});

describe('chats function calling', () => {
  const testCases = [
    {
      name: 'Google AI with function calling',
      client: new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY}),
      model: 'gemini-2.0-flash',
      config: {tools: [function_calling]},
      history: [],
      messages: ['what is the result of 100/2', 'what is the result of 50/2?'],
    },
  ];

  testCases.forEach(async (testCase) => {
    it(testCase.name, async () => {
      const client = testCase.client;
      const chat = client.chats.create({
        model: testCase.model,
        config: testCase.config,
        history: testCase.history,
      });
      for (const message of testCase.messages) {
        const response = await chat.sendMessage({message});
        console.log(
          'chat.sendMessage function calls: ',
          response.functionCalls,
        );
        expect(response.functionCalls).not.toBeNull();
      }
    });
  });

  testCases.forEach(async (testCase) => {
    it(testCase.name + ' stream', async () => {
      const client = testCase.client;
      const chat = client.chats.create({
        model: testCase.model,
        config: testCase.config,
        history: testCase.history,
      });
      for (const message of testCase.messages) {
        const response = await chat.sendMessageStream({message});
        for await (const chunk of response) {
          console.log(
            'chat.sendMessageStream function calls: ',
            chunk.functionCalls,
          );
          expect(chunk.functionCalls).not.toBeNull();
        }
      }
    });
  });
});
