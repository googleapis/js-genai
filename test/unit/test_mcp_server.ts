/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Client as McpClient} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';

export async function spinUpPrintingServer(): Promise<McpClient> {
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
    'print',
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

  const client = new McpClient({
    name: 'printer',
    version: '1.0.0',
  });
  client.connect(transports[1]);

  return client;
}

export async function spinUpBeepingServer(): Promise<McpClient> {
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

  const client = new McpClient({
    name: 'beeper',
    version: '1.0.0',
  });
  client.connect(transports[1]);

  return client;
}

export async function spinUpThrowingServer(): Promise<McpClient> {
  const server = new McpServer({
    name: 'throwingTool',
    version: '1.0.0',
  });

  server.tool('throwError', async () => {
    throw new Error('Error from throwing tool');
  });

  const transports = InMemoryTransport.createLinkedPair();
  await server.connect(transports[0]);

  const client = new McpClient({
    name: 'throwingTool',
    version: '1.0.0',
  });
  client.connect(transports[1]);

  return client;
}
