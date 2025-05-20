/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Client as McpClient} from '@modelcontextprotocol/sdk/client/index.js';
import {Tool as McpTool} from '@modelcontextprotocol/sdk/types.js';

import {GOOGLE_API_CLIENT_HEADER} from '../_api_client.js';
import {mcpToolsToGeminiTool} from '../_transformers.js';
import {
  CallableTool,
  CallableToolConfig,
  FunctionCall,
  GenerateContentParameters,
  Part,
  Tool,
  ToolListUnion,
} from '../types.js';

// TODO: b/416041229 - Determine how to retrieve the MCP package version.
export const MCP_LABEL = 'mcp_used/unknown';

// Checks whether the list of tools contains any MCP tools.
export function hasMcpToolUsage(tools: ToolListUnion): boolean {
  for (const tool of tools) {
    if (isMcpCallableTool(tool)) {
      return true;
    }
    if (typeof tool === 'object' && 'inputSchema' in tool) {
      return true;
    }
  }

  return false;
}

// Sets the MCP version label in the Google API client header.
export function setMcpUsageHeader(headers: Record<string, string>) {
  const existingHeader = headers[GOOGLE_API_CLIENT_HEADER] ?? '';
  if (existingHeader.includes(MCP_LABEL)) {
    return;
  }
  headers[GOOGLE_API_CLIENT_HEADER] = (
    existingHeader + ` ${MCP_LABEL}`
  ).trimStart();
}

// Checks whether the list of tools contains any MCP clients. Will return true
// if there is at least one MCP client.
export function hasMcpClientTools(params: GenerateContentParameters): boolean {
  return params.config?.tools?.some((tool) => isMcpCallableTool(tool)) ?? false;
}

// Checks whether the list of tools contains any non-MCP tools. Will return true
// if there is at least one non-MCP tool.
export function hasNonMcpTools(params: GenerateContentParameters): boolean {
  return (
    params.config?.tools?.some((tool) => !isMcpCallableTool(tool)) ?? false
  );
}

// Returns true if the object is a MCP CallableTool, otherwise false.
function isMcpCallableTool(object: unknown): boolean {
  // TODO: b/418266406 - Add a more robust check for the MCP CallableTool.
  return (
    object !== null &&
    typeof object === 'object' &&
    'tool' in object &&
    'callTool' in object
  );
}

// List all tools from the MCP client.
async function* listAllTools(
  mcpClient: McpClient,
  maxTools: number = 100,
): AsyncGenerator<McpTool> {
  let cursor: string | undefined = undefined;
  let numTools = 0;
  while (numTools < maxTools) {
    const t = await mcpClient.listTools({cursor});
    for (const tool of t.tools) {
      yield tool;
      numTools++;
    }
    if (!t.nextCursor) {
      break;
    }
    cursor = t.nextCursor;
  }
}

/**
 * McpCallableTool can be used for model inference and invoking MCP clients with
 * given function call arguments.
 *
 * @experimental Built-in MCP support is an experimental feature, may change in future
 * versions.
 */
export class McpCallableTool implements CallableTool {
  private readonly mcpClients;
  private mcpTools: McpTool[] = [];
  private functionNameToMcpClient: Record<string, McpClient> = {};
  private readonly config: CallableToolConfig;

  private constructor(
    mcpClients: McpClient[] = [],
    config: CallableToolConfig,
  ) {
    this.mcpClients = mcpClients;
    this.config = config;
  }

  /**
   * Creates a McpCallableTool.
   */
  public static create(
    mcpClients: McpClient[],
    config: CallableToolConfig,
  ): McpCallableTool {
    return new McpCallableTool(mcpClients, config);
  }

  /**
   * Validates the function names are not duplicate and initialize the function
   * name to MCP client mapping.
   *
   * @throws {Error} if the MCP tools from the MCP clients have duplicate tool
   *     names.
   */
  async initialize() {
    if (this.mcpTools.length > 0) {
      return;
    }

    const functionMap: Record<string, McpClient> = {};
    const mcpTools: McpTool[] = [];
    for (const mcpClient of this.mcpClients) {
      for await (const mcpTool of listAllTools(mcpClient)) {
        mcpTools.push(mcpTool);
        const mcpToolName = mcpTool.name as string;
        if (functionMap[mcpToolName]) {
          throw new Error(
            `Duplicate function name ${
              mcpToolName
            } found in MCP tools. Please ensure function names are unique.`,
          );
        }
        functionMap[mcpToolName] = mcpClient;
      }
    }
    this.mcpTools = mcpTools;
    this.functionNameToMcpClient = functionMap;
  }

  public async tool(): Promise<Tool> {
    await this.initialize();
    return mcpToolsToGeminiTool(this.mcpTools, this.config);
  }

  public async callTool(functionCalls: FunctionCall[]): Promise<Part[]> {
    await this.initialize();
    const functionCallResponseParts: Part[] = [];
    for (const functionCall of functionCalls) {
      if (functionCall.name! in this.functionNameToMcpClient) {
        const mcpClient = this.functionNameToMcpClient[functionCall.name!];
        const callToolResponse = await mcpClient.callTool({
          name: functionCall.name!,
          arguments: functionCall.args,
        });
        functionCallResponseParts.push({
          functionResponse: {
            name: functionCall.name,
            response: callToolResponse.isError
              ? {error: callToolResponse}
              : (callToolResponse as Record<string, unknown>),
          },
        });
      }
    }
    return functionCallResponseParts;
  }
}

function isMcpClient(client: unknown): client is McpClient {
  return (
    client !== null &&
    typeof client === 'object' &&
    'listTools' in client &&
    typeof client.listTools === 'function'
  );
}

/**
 * Creates a McpCallableTool from MCP clients and an optional config.
 *
 * The callable tool can invoke the MCP clients with given function call
 * arguments. (often for automatic function calling).
 * Use the config to modify tool parameters such as behavior.
 *
 * @experimental Built-in MCP support is an experimental feature, may change in future
 * versions.
 */
export function mcpToTool(
  ...args: [...McpClient[], CallableToolConfig | McpClient]
): CallableTool {
  if (args.length === 0) {
    throw new Error('No MCP clients provided');
  }
  const maybeConfig = args[args.length - 1];
  if (isMcpClient(maybeConfig)) {
    return McpCallableTool.create(args as McpClient[], {});
  }
  return McpCallableTool.create(
    args.slice(0, args.length - 1) as McpClient[],
    maybeConfig,
  );
}
