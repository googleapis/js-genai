/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {FunctionCallingConfigMode, GoogleGenAI, mcpToTool} from '@google/genai';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function chatAutofcSample(ai: GoogleGenAI) {
  const weatherClient = await spinUpWeatherServer();
  const multiplyClient = await spinUpMultiplyServer();

  const chat = await ai.chats.create({
    model: 'gemini-2.5-flash-preview-04-17',
    config: {
      tools: [mcpToTool(weatherClient, multiplyClient)],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.AUTO,
        },
      },
    },
  });
  await chat.sendMessage({
    message: 'Use the weather tool to find out the weather in New York.',
  });
  await chat.sendMessage({
    message: 'Use the multiply tool to multiply 5 by 6.',
  });
  await chat.sendMessage({
    message:
      'Use the multiply tool to multiply 7 by 8 and tell me the weather of Albany.',
  });
}

async function spinUpWeatherServer(): Promise<Client> {
  const server = new McpServer({
    name: 'reporter',
    version: '1.0.0',
  });

  server.tool(
    'weather',
    {
      location: z.string(),
    },
    async ({location}) => {
      const message = `The weather in ${location} is good today.`;
      console.log(message);
      return {
        content: [],
      };
    },
  );

  const transports = InMemoryTransport.createLinkedPair();
  await server.connect(transports[0]);

  const client = new Client({
    name: 'reporter',
    version: '1.0.0',
  });
  client.connect(transports[1]);

  return client;
}

async function spinUpMultiplyServer(): Promise<Client> {
  const server = new McpServer({
    name: 'multiplier',
    version: '1.0.0',
  });

  server.tool(
    'multiply',
    {
      firstNumber: z.number().min(2).max(10),
      secondNumber: z.number().min(2).max(10),
    },
    async ({firstNumber, secondNumber}) => {
      console.log({
        firstNumber: firstNumber,
        secondNumber: secondNumber,
        multiplicationResult: firstNumber * secondNumber,
      });
      return {
        content: [],
      };
    },
  );

  const transports = InMemoryTransport.createLinkedPair();
  await server.connect(transports[0]);

  const client = new Client({
    name: 'multiplier',
    version: '1.0.0',
  });
  client.connect(transports[1]);

  return client;
}

async function main() {
  let ai;
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    ai = new GoogleGenAI({
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    });
  } else {
    ai = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});
  }

  chatAutofcSample(ai);
}

main();
