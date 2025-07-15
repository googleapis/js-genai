/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Tool as McpTool, ToolSchema} from '@modelcontextprotocol/sdk/types.js';

import {
  mcpToGeminiTool,
  mcpToolsToGeminiTool,
} from '../../src/_transformers.js';
import {
  hasMcpToolUsage,
  mcpToTool,
  setMcpToolUsageFromMcpToTool,
  setMcpUsageHeader,
} from '../../src/mcp/_mcp.js';
import * as types from '../../src/types.js';

import {spinUpPrintingServer} from './test_mcp_server.js';

describe('mcpToGeminiTool', () => {
  it('should set behavior', () => {
    const mcpTool = {
      name: 'tool',
      description: 'tool-description',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    };

    const parsedMcpTool = ToolSchema.parse(mcpTool);
    expect(
      mcpToGeminiTool(parsedMcpTool, {
        behavior: types.Behavior.NON_BLOCKING,
      }),
    ).toEqual({
      functionDeclarations: [
        {
          name: 'tool',
          description: 'tool-description',
          parametersJsonSchema: {
            type: 'object',
            properties: {},
          },
          behavior: types.Behavior.NON_BLOCKING,
        },
      ],
    });
  });
});

describe('mcpToolsToGeminiTool', () => {
  const mcpTool1: McpTool = {
    name: 'tool-1',
    description: 'tool-1-description',
    inputSchema: {
      type: 'object',
      properties: {
        property: {
          type: 'object',
          items: {
            type: 'string',
            description: 'item-description',
          },
        },
      },
    },
  };
  const mcpTool2: McpTool = {
    name: 'tool-2',
    description: 'tool-2-description',
    inputSchema: {
      type: 'object',
      properties: {
        property: {
          type: 'object',
          items: {
            type: 'string',
            description: 'item-description',
          },
        },
      },
    },
  };

  it('return empty array from empty tools list', () => {
    expect(mcpToolsToGeminiTool([])).toEqual({functionDeclarations: []});
  });

  it('should process multiple MCP tools to single Gemini tool', () => {
    const mcpTools: McpTool[] = [mcpTool1, mcpTool2];

    expect(mcpToolsToGeminiTool(mcpTools)).toEqual({
      functionDeclarations: [
        {
          name: 'tool-1',
          description: 'tool-1-description',
          parametersJsonSchema: {
            type: 'object',
            properties: {
              property: {
                type: 'object',
                items: {
                  type: 'string',
                  description: 'item-description',
                },
              },
            },
          },
        },
        {
          name: 'tool-2',
          description: 'tool-2-description',
          parametersJsonSchema: {
            type: 'object',
            properties: {
              property: {
                type: 'object',
                items: {
                  type: 'string',
                  description: 'item-description',
                },
              },
            },
          },
        },
      ],
    });
  });

  it('should process multiple MCP tools with config', () => {
    const mcpTools: McpTool[] = [mcpTool1, mcpTool2];

    expect(
      mcpToolsToGeminiTool(mcpTools, {
        behavior: types.Behavior.NON_BLOCKING,
      }),
    ).toEqual({
      functionDeclarations: [
        {
          name: 'tool-1',
          description: 'tool-1-description',
          parametersJsonSchema: {
            type: 'object',
            properties: {
              property: {
                type: 'object',
                items: {
                  type: 'string',
                  description: 'item-description',
                },
              },
            },
          },
          behavior: types.Behavior.NON_BLOCKING,
        },
        {
          name: 'tool-2',
          description: 'tool-2-description',
          parametersJsonSchema: {
            type: 'object',
            properties: {
              property: {
                type: 'object',
                items: {
                  type: 'string',
                  description: 'item-description',
                },
              },
            },
          },
          behavior: types.Behavior.NON_BLOCKING,
        },
      ],
    });
  });
});

describe('hasMcpToolUsage', () => {
  it('should return true for McpCallableTool', async () => {
    const mcpCallableTool = mcpToTool(await spinUpPrintingServer());

    expect(hasMcpToolUsage([mcpCallableTool])).toBeTrue();
  });

  it('should return false for Gemini tools', () => {
    // Explicitly set the MCP usage to false.
    setMcpToolUsageFromMcpToTool(false);
    const tools = [
      {
        functionDeclarations: [
          {
            name: 'tool',
            description: 'tool-description',
            parametersJsonSchema: {
              type: 'object',
              properties: {
                property: {
                  type: 'object',
                  items: {
                    type: 'string',
                    description: 'item-description',
                  },
                },
              },
            },
          },
        ],
      },
    ];
    expect(hasMcpToolUsage(tools)).toBeFalse();
  });

  it('should return true after calling mcpToTool', async () => {
    // Explicitly set the MCP usage to false.
    setMcpToolUsageFromMcpToTool(false);

    const _mcpCallableTool = mcpToTool(await spinUpPrintingServer());
    const tools = [
      {
        functionDeclarations: [
          {
            name: 'tool',
            description: 'tool-description',
            parameters: {
              type: types.Type.OBJECT,
              properties: {
                property: {
                  type: types.Type.OBJECT,
                  items: {
                    type: types.Type.STRING,
                    description: 'item-description',
                  },
                },
              },
            },
          },
        ],
      },
    ];
    expect(hasMcpToolUsage(tools)).toBeTrue();
  });
});

describe('setMcpUsageHeader', () => {
  it('should set the MCP version label in the Google API client header', () => {
    const headers: Record<string, string> = {};
    setMcpUsageHeader(headers);
    expect(headers['x-goog-api-client']).toEqual('mcp_used/unknown');
  });
  it('should set the MCP version label from existing header', () => {
    const headers: Record<string, string> = {
      'x-goog-api-client': 'google-genai-sdk/1.0.0',
    };
    setMcpUsageHeader(headers);
    expect(headers['x-goog-api-client']).toEqual(
      'google-genai-sdk/1.0.0 mcp_used/unknown',
    );
  });
});

describe('mcpToTool', () => {
  it('throw error when MCP clients have duplicate function names', async () => {
    const mcpClient = await spinUpPrintingServer();

    try {
      mcpToTool(mcpClient, mcpClient);
    } catch (e) {
      expect((e as Error).message).toEqual(
        'Duplicate function name print found in MCP tools. Please ensure function names are unique.',
      );
    }
  });
});
