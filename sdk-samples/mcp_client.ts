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

async function mcpSample(ai: GoogleGenAI) {
  const printingClient = await spinUpPrintingServer();
  const beepingClient = await spinUpBeepingServer();

  await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-04-17',
    contents:
      'Use the printer to print a simple math question in red and the answer in blue, and beep with the beeper, also tell me a joke. IMPORTANT DONT FORGET TO BEEP AT THE END',
    config: {
      tools: [mcpToTool(printingClient, beepingClient)],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.AUTO,
        },
      },
    },
  });
}

async function spinUpPrintingServer(): Promise<Client> {
  const server = new McpServer({
    name: 'printer',
    version: '1.0.0',
  });

  const colorMap: {[key: string]: string} = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    white: '\x1b[37m',
    reset: '\x1b[0m', // Resets all text attributes to default
  };

  server.tool(
    'print_message',
    {
      text: z.string(),
      color: z.string().regex(/red|blue|green|white/),
    },
    async ({text, color}) => {
      if (colorMap[color]) {
        console.log(colorMap[color] + text);
        console.log(colorMap.reset);
      } else {
        console.log(text);
      }

      return {
        content: [],
      };
    },
  );

  const transports = InMemoryTransport.createLinkedPair();
  await server.connect(transports[0]);

  const client = new Client({
    name: 'printer',
    version: '1.0.0',
  });
  client.connect(transports[1]);

  return client;
}

async function spinUpBeepingServer(): Promise<Client> {
  const server = new McpServer({
    name: 'beeper',
    version: '1.0.0',
  });

  server.tool('beep', async () => {
    process.stdout.write('\u0007');
    return {
      content: [],
    };
  });

  const transports = InMemoryTransport.createLinkedPair();
  await server.connect(transports[0]);

  const client = new Client({
    name: 'beeper',
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

  mcpSample(ai);
}

main();
