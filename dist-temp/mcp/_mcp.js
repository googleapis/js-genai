/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { GOOGLE_API_CLIENT_HEADER } from '../_api_client.js';
import { mcpToolsToGeminiTool } from '../_transformers.js';
// TODO: b/416041229 - Determine how to retrieve the MCP package version.
export const MCP_LABEL = 'mcp_used/unknown';
// Whether MCP tool usage is detected from mcpToTool. This is used for
// telemetry.
let hasMcpToolUsageFromMcpToTool = false;
// Checks whether the list of tools contains any MCP tools.
export function hasMcpToolUsage(tools) {
    for (const tool of tools) {
        if (isMcpCallableTool(tool)) {
            return true;
        }
        if (typeof tool === 'object' && 'inputSchema' in tool) {
            return true;
        }
    }
    return hasMcpToolUsageFromMcpToTool;
}
// Sets the MCP version label in the Google API client header.
export function setMcpUsageHeader(headers) {
    const existingHeader = headers[GOOGLE_API_CLIENT_HEADER] ?? '';
    headers[GOOGLE_API_CLIENT_HEADER] = (existingHeader + ` ${MCP_LABEL}`).trimStart();
}
// Returns true if the object is a MCP CallableTool, otherwise false.
function isMcpCallableTool(object) {
    return (object !== null &&
        typeof object === 'object' &&
        object instanceof McpCallableTool);
}
// List all tools from the MCP client.
async function* listAllTools(mcpClient, maxTools = 100) {
    let cursor = undefined;
    let numTools = 0;
    while (numTools < maxTools) {
        const t = await mcpClient.listTools({ cursor });
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
export class McpCallableTool {
    constructor(mcpClients = [], config) {
        this.mcpTools = [];
        this.functionNameToMcpClient = {};
        this.mcpClients = mcpClients;
        this.config = config;
    }
    /**
     * Creates a McpCallableTool.
     */
    static create(mcpClients, config) {
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
        const functionMap = {};
        const mcpTools = [];
        for (const mcpClient of this.mcpClients) {
            for await (const mcpTool of listAllTools(mcpClient)) {
                mcpTools.push(mcpTool);
                const mcpToolName = mcpTool.name;
                if (functionMap[mcpToolName]) {
                    throw new Error(`Duplicate function name ${mcpToolName} found in MCP tools. Please ensure function names are unique.`);
                }
                functionMap[mcpToolName] = mcpClient;
            }
        }
        this.mcpTools = mcpTools;
        this.functionNameToMcpClient = functionMap;
    }
    async tool() {
        await this.initialize();
        return mcpToolsToGeminiTool(this.mcpTools, this.config);
    }
    async callTool(functionCalls) {
        await this.initialize();
        const functionCallResponseParts = [];
        for (const functionCall of functionCalls) {
            if (functionCall.name in this.functionNameToMcpClient) {
                const mcpClient = this.functionNameToMcpClient[functionCall.name];
                let requestOptions = undefined;
                // TODO: b/424238654 - Add support for finer grained timeout control.
                if (this.config.timeout) {
                    requestOptions = {
                        timeout: this.config.timeout,
                    };
                }
                const callToolResponse = await mcpClient.callTool({
                    name: functionCall.name,
                    arguments: functionCall.args,
                }, 
                // Set the result schema to undefined to allow MCP to rely on the
                // default schema.
                undefined, requestOptions);
                functionCallResponseParts.push({
                    functionResponse: {
                        name: functionCall.name,
                        response: callToolResponse.isError
                            ? { error: callToolResponse }
                            : callToolResponse,
                    },
                });
            }
        }
        return functionCallResponseParts;
    }
}
function isMcpClient(client) {
    return (client !== null &&
        typeof client === 'object' &&
        'listTools' in client &&
        typeof client.listTools === 'function');
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
export function mcpToTool(...args) {
    // Set MCP usage for telemetry.
    hasMcpToolUsageFromMcpToTool = true;
    if (args.length === 0) {
        throw new Error('No MCP clients provided');
    }
    const maybeConfig = args[args.length - 1];
    if (isMcpClient(maybeConfig)) {
        return McpCallableTool.create(args, {});
    }
    return McpCallableTool.create(args.slice(0, args.length - 1), maybeConfig);
}
/**
 * Sets the MCP tool usage flag from calling mcpToTool. This is used for
 * telemetry.
 */
export function setMcpToolUsageFromMcpToTool(mcpToolUsage) {
    hasMcpToolUsageFromMcpToTool = mcpToolUsage;
}
