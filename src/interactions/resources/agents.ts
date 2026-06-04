/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource.js';
import * as InteractionsAPI from './interactions.js';
import { APIPromise } from '../core/api-promise.js';
import { RequestOptions } from '../internal/request-options.js';
import { path } from '../internal/utils/path.js';

export class BaseAgents extends APIResource {
  static override readonly _key: readonly ['agents'] = Object.freeze(['agents'] as const);

  /**
   * Creates a new Agent (Typed version for SDK).
   */
  create(params: AgentCreateParams | null | undefined = {}, options?: RequestOptions): APIPromise<Agent> {
    const { api_version = this._client.apiVersion, ...body } = params ?? {};
    return this._client.post(path`/${api_version}/agents`, { body, ...options });
  }

  /**
   * Lists all Agents.
   */
  list(
    params: AgentListParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<AgentListResponse> {
    const { api_version = this._client.apiVersion, ...query } = params ?? {};
    return this._client.get(path`/${api_version}/agents`, { query, ...options });
  }

  /**
   * Deletes an Agent.
   */
  delete(
    id: string,
    params: AgentDeleteParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<AgentDeleteResponse> {
    const { api_version = this._client.apiVersion } = params ?? {};
    return this._client.delete(path`/${api_version}/agents/${id}`, options);
  }

  /**
   * Gets a specific Agent.
   */
  get(
    id: string,
    params: AgentGetParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<Agent> {
    const { api_version = this._client.apiVersion } = params ?? {};
    return this._client.get(path`/${api_version}/agents/${id}`, options);
  }
}
export class Agents extends BaseAgents {}

/**
 * An agent definition for the CreateAgent API. This message is the target for
 * annotation-parser-based JSON parsing. New format: { "id": "customer-sentinel",
 * "base_agent": "", "system_instruction": "...", "base_environment": { "type":
 * "remote", "sources": [...] }, "tools": [ {"type": "code_execution"} ] }
 */
export interface Agent {
  /**
   * The unique identifier for the agent.
   */
  id?: string;

  /**
   * The base agent to extend.
   */
  base_agent?: string;

  /**
   * The environment configuration for the agent.
   */
  base_environment?: InteractionsAPI.Environment | string;

  /**
   * Agent description for developers to quickly read and understand.
   */
  description?: string;

  /**
   * System instruction for the agent.
   */
  system_instruction?: string;

  /**
   * The tools available to the agent.
   */
  tools?: Array<Agent.CodeExecution | Agent.GoogleSearch | Agent.MCPServer | Agent.URLContext>;
}

export namespace Agent {
  /**
   * A tool that can be used by the model to execute code.
   */
  export interface CodeExecution {
    type: 'code_execution';
  }

  /**
   * A tool that can be used by the model to search Google.
   */
  export interface GoogleSearch {
    type: 'google_search';

    /**
     * The types of search grounding to enable.
     */
    search_types?: Array<'web_search' | 'image_search' | 'enterprise_web_search'>;
  }

  /**
   * A MCPServer is a server that can be called by the model to perform actions.
   */
  export interface MCPServer {
    type: 'mcp_server';

    /**
     * The allowed tools.
     */
    allowed_tools?: Array<InteractionsAPI.AllowedTools>;

    /**
     * Optional: Fields for authentication headers, timeouts, etc., if needed.
     */
    headers?: { [key: string]: string };

    /**
     * The name of the MCPServer.
     */
    name?: string;

    /**
     * The full URL for the MCPServer endpoint. Example: "https://api.example.com/mcp"
     */
    url?: string;
  }

  /**
   * A tool that can be used by the model to fetch URL context.
   */
  export interface URLContext {
    type: 'url_context';
  }
}

export interface AgentListResponse {
  agents?: Array<Agent>;

  next_page_token?: string;
}

/**
 * A generic empty message that you can re-use to avoid defining duplicated empty
 * messages in your APIs. A typical example is to use it as the request or the
 * response type of an API method. For instance:
 *
 *     service Foo {
 *       rpc Bar(google.protobuf.Empty) returns (google.protobuf.Empty);
 *     }
 */
export interface AgentDeleteResponse {}

export interface AgentCreateParams {
  /**
   * Path param: Which version of the API to use.
   */
  api_version?: string;

  /**
   * Body param: The unique identifier for the agent.
   */
  id?: string;

  /**
   * Body param: The base agent to extend.
   */
  base_agent?: string;

  /**
   * Body param: The environment configuration for the agent.
   */
  base_environment?: InteractionsAPI.Environment | string;

  /**
   * Body param: Agent description for developers to quickly read and understand.
   */
  description?: string;

  /**
   * Body param: System instruction for the agent.
   */
  system_instruction?: string;

  /**
   * Body param: The tools available to the agent.
   */
  tools?: Array<
    | AgentCreateParams.CodeExecution
    | AgentCreateParams.GoogleSearch
    | AgentCreateParams.MCPServer
    | AgentCreateParams.URLContext
  >;
}

export namespace AgentCreateParams {
  /**
   * A tool that can be used by the model to execute code.
   */
  export interface CodeExecution {
    type: 'code_execution';
  }

  /**
   * A tool that can be used by the model to search Google.
   */
  export interface GoogleSearch {
    type: 'google_search';

    /**
     * The types of search grounding to enable.
     */
    search_types?: Array<'web_search' | 'image_search' | 'enterprise_web_search'>;
  }

  /**
   * A MCPServer is a server that can be called by the model to perform actions.
   */
  export interface MCPServer {
    type: 'mcp_server';

    /**
     * The allowed tools.
     */
    allowed_tools?: Array<InteractionsAPI.AllowedTools>;

    /**
     * Optional: Fields for authentication headers, timeouts, etc., if needed.
     */
    headers?: { [key: string]: string };

    /**
     * The name of the MCPServer.
     */
    name?: string;

    /**
     * The full URL for the MCPServer endpoint. Example: "https://api.example.com/mcp"
     */
    url?: string;
  }

  /**
   * A tool that can be used by the model to fetch URL context.
   */
  export interface URLContext {
    type: 'url_context';
  }
}

export interface AgentListParams {
  /**
   * Path param: Which version of the API to use.
   */
  api_version?: string;

  /**
   * Query param
   */
  page_size?: number;

  /**
   * Query param
   */
  page_token?: string;

  /**
   * Query param
   */
  parent?: string;
}

export interface AgentDeleteParams {
  /**
   * Which version of the API to use.
   */
  api_version?: string;
}

export interface AgentGetParams {
  /**
   * Which version of the API to use.
   */
  api_version?: string;
}

export declare namespace Agents {
  export {
    type Agent as Agent,
    type AgentListResponse as AgentListResponse,
    type AgentDeleteResponse as AgentDeleteResponse,
    type AgentCreateParams as AgentCreateParams,
    type AgentListParams as AgentListParams,
    type AgentDeleteParams as AgentDeleteParams,
    type AgentGetParams as AgentGetParams,
  };
}
