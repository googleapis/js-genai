/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource.js';
import * as Errors from '../core/error.js';
import * as InteractionsAPI from './interactions.js';
import { APIPromise } from '../core/api-promise.js';
import { Stream } from '../core/streaming.js';
import { RequestOptions } from '../internal/request-options.js';
import { path } from '../internal/utils/path.js';

export class BaseInteractions extends APIResource {
  static override readonly _key: readonly ['interactions'] = Object.freeze(['interactions'] as const);

  /**
   * Creates a new interaction.
   */
  create(params: CreateModelInteractionParamsNonStreaming, options?: RequestOptions): APIPromise<Interaction>;
  create(
    params: CreateModelInteractionParamsStreaming,
    options?: RequestOptions,
  ): APIPromise<Stream<InteractionSSEEvent>>;
  create(params: CreateAgentInteractionParamsNonStreaming, options?: RequestOptions): APIPromise<Interaction>;
  create(
    params: CreateAgentInteractionParamsStreaming,
    options?: RequestOptions,
  ): APIPromise<Stream<InteractionSSEEvent>>;
  create(
    params: BaseCreateModelInteractionParams | BaseCreateAgentInteractionParams,
    options?: RequestOptions,
  ): APIPromise<Stream<InteractionSSEEvent> | Interaction>;
  create(
    params: InteractionCreateParams,
    options?: RequestOptions,
  ): APIPromise<Interaction> | APIPromise<Stream<InteractionSSEEvent>> {
    const { api_version = this._client.apiVersion, ...body } = params;
    if ('model' in body && 'agent_config' in body) {
      throw new Errors.GeminiNextGenAPIClientError(
        `Invalid request: specified \`model\` and \`agent_config\`. If specifying \`model\`, use \`generation_config\`.`,
      );
    }
    if ('agent' in body && 'generation_config' in body) {
      throw new Errors.GeminiNextGenAPIClientError(
        `Invalid request: specified \`agent\` and \`generation_config\`. If specifying \`agent\`, use \`agent_config\`.`,
      );
    }
    return this._client.post(path`/${api_version}/interactions`, {
      body,
      ...options,
      stream: params.stream ?? false,
    }) as APIPromise<Interaction> | APIPromise<Stream<InteractionSSEEvent>>;
  }

  /**
   * Deletes the interaction by id.
   */
  delete(
    id: string,
    params: InteractionDeleteParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<unknown> {
    const { api_version = this._client.apiVersion } = params ?? {};
    return this._client.delete(path`/${api_version}/interactions/${id}`, options);
  }

  /**
   * Cancels an interaction based on its `Interaction.id`.
   */
  cancel(
    id: string,
    params: InteractionCancelParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<Interaction> {
    const { api_version = this._client.apiVersion } = params ?? {};
    return this._client.post(path`/${api_version}/interactions/${id}/cancel`, options);
  }

  /**
   * Retrieves the full details of a single interaction based on its `Interaction.id`.
   */
  get(
    id: string,
    params?: InteractionGetParamsNonStreaming,
    options?: RequestOptions,
  ): APIPromise<Interaction>;
  get(
    id: string,
    params: InteractionGetParamsStreaming,
    options?: RequestOptions,
  ): APIPromise<Stream<InteractionSSEEvent>>;
  get(
    id: string,
    params?: InteractionGetParamsBase | undefined,
    options?: RequestOptions,
  ): APIPromise<Stream<InteractionSSEEvent> | Interaction>;
  get(
    id: string,
    params: InteractionGetParams | undefined = {},
    options?: RequestOptions,
  ): APIPromise<Interaction> | APIPromise<Stream<InteractionSSEEvent>> {
    const { api_version = this._client.apiVersion, ...query } = params ?? {};
    return this._client.get(path`/${api_version}/interactions/${id}`, {
      query,
      ...options,
      stream: params?.stream ?? false,
    }) as APIPromise<Interaction> | APIPromise<Stream<InteractionSSEEvent>>;
  }
}
export class Interactions extends BaseInteractions {}

/**
 * The configuration for allowed tools.
 */
export interface AllowedTools {
  /**
   * The mode of the tool choice.
   */
  mode?: ToolChoiceType;

  /**
   * The names of the allowed tools.
   */
  tools?: Array<string>;
}

/**
 * Citation information for model-generated content.
 */
export interface Annotation {
  /**
   * End of the attributed segment, exclusive.
   */
  end_index?: number;

  /**
   * Source attributed for a portion of the text. Could be a URL, title, or
   * other identifier.
   */
  source?: string;

  /**
   * Start of segment of the response that is attributed to this source.
   *
   * Index indicates the start of the segment, measured in bytes.
   */
  start_index?: number;
}

/**
 * An audio content block.
 */
export interface AudioContent {
  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type: 'audio';

  data?: string;

  /**
   * The mime type of the audio.
   */
  mime_type?: AudioMimeType;

  uri?: string;
}

/**
 * The mime type of the audio.
 */
export type AudioMimeType =
  | 'audio/wav'
  | 'audio/mp3'
  | 'audio/aiff'
  | 'audio/aac'
  | 'audio/ogg'
  | 'audio/flac'
  | (string & {});

/**
 * The arguments to pass to the code execution.
 */
export interface CodeExecutionCallArguments {
  /**
   * The code to be executed.
   */
  code?: string;

  /**
   * Programming language of the `code`.
   */
  language?: 'python';
}

/**
 * Code execution content.
 */
export interface CodeExecutionCallContent {
  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type: 'code_execution_call';

  /**
   * A unique ID for this specific tool call.
   */
  id?: string;

  /**
   * The arguments to pass to the code execution.
   */
  arguments?: CodeExecutionCallArguments;
}

/**
 * Code execution result content.
 */
export interface CodeExecutionResultContent {
  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type: 'code_execution_result';

  /**
   * ID to match the ID from the code execution call block.
   */
  call_id?: string;

  /**
   * Whether the code execution resulted in an error.
   */
  is_error?: boolean;

  /**
   * The output of the code execution.
   */
  result?: string;

  /**
   * A signature hash for backend validation.
   */
  signature?: string;
}

export interface ContentDelta {
  delta?:
    | ContentDelta.TextDelta
    | ContentDelta.ImageDelta
    | ContentDelta.AudioDelta
    | ContentDelta.DocumentDelta
    | ContentDelta.VideoDelta
    | ContentDelta.ThoughtSummaryDelta
    | ContentDelta.ThoughtSignatureDelta
    | ContentDelta.FunctionCallDelta
    | ContentDelta.FunctionResultDelta
    | ContentDelta.CodeExecutionCallDelta
    | ContentDelta.CodeExecutionResultDelta
    | ContentDelta.URLContextCallDelta
    | ContentDelta.URLContextResultDelta
    | ContentDelta.GoogleSearchCallDelta
    | ContentDelta.GoogleSearchResultDelta
    | ContentDelta.MCPServerToolCallDelta
    | ContentDelta.MCPServerToolResultDelta
    | ContentDelta.FileSearchResultDelta;

  /**
   * The event_id token to be used to resume the interaction stream, from
   * this event.
   */
  event_id?: string;

  event_type?: 'content.delta';

  index?: number;
}

export namespace ContentDelta {
  export interface TextDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'text';

    /**
     * Citation information for model-generated content.
     */
    annotations?: Array<InteractionsAPI.Annotation>;

    text?: string;
  }

  export interface ImageDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'image';

    data?: string;

    /**
     * The mime type of the image.
     */
    mime_type?: InteractionsAPI.ImageMimeType;

    /**
     * The resolution of the media.
     */
    resolution?: 'low' | 'medium' | 'high';

    uri?: string;
  }

  export interface AudioDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'audio';

    data?: string;

    /**
     * The mime type of the audio.
     */
    mime_type?: InteractionsAPI.AudioMimeType;

    uri?: string;
  }

  export interface DocumentDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'document';

    data?: string;

    mime_type?: string;

    uri?: string;
  }

  export interface VideoDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'video';

    data?: string;

    /**
     * The mime type of the video.
     */
    mime_type?: InteractionsAPI.VideoMimeType;

    /**
     * The resolution of the media.
     */
    resolution?: 'low' | 'medium' | 'high';

    uri?: string;
  }

  export interface ThoughtSummaryDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'thought_summary';

    /**
     * A text content block.
     */
    content?: InteractionsAPI.TextContent | InteractionsAPI.ImageContent;
  }

  export interface ThoughtSignatureDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'thought_signature';

    /**
     * Signature to match the backend source to be part of the generation.
     */
    signature?: string;
  }

  export interface FunctionCallDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'function_call';

    /**
     * A unique ID for this specific tool call.
     */
    id?: string;

    arguments?: { [key: string]: unknown };

    name?: string;
  }

  export interface FunctionResultDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'function_result';

    /**
     * ID to match the ID from the function call block.
     */
    call_id?: string;

    is_error?: boolean;

    name?: string;

    /**
     * Tool call result delta.
     */
    result?: FunctionResultDelta.Items | string;
  }

  export namespace FunctionResultDelta {
    export interface Items {
      items?: Array<string | InteractionsAPI.ImageContent>;
    }
  }

  export interface CodeExecutionCallDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'code_execution_call';

    /**
     * A unique ID for this specific tool call.
     */
    id?: string;

    /**
     * The arguments to pass to the code execution.
     */
    arguments?: InteractionsAPI.CodeExecutionCallArguments;
  }

  export interface CodeExecutionResultDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'code_execution_result';

    /**
     * ID to match the ID from the function call block.
     */
    call_id?: string;

    is_error?: boolean;

    result?: string;

    signature?: string;
  }

  export interface URLContextCallDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'url_context_call';

    /**
     * A unique ID for this specific tool call.
     */
    id?: string;

    /**
     * The arguments to pass to the URL context.
     */
    arguments?: InteractionsAPI.URLContextCallArguments;
  }

  export interface URLContextResultDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'url_context_result';

    /**
     * ID to match the ID from the function call block.
     */
    call_id?: string;

    is_error?: boolean;

    result?: Array<InteractionsAPI.URLContextResult>;

    signature?: string;
  }

  export interface GoogleSearchCallDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'google_search_call';

    /**
     * A unique ID for this specific tool call.
     */
    id?: string;

    /**
     * The arguments to pass to Google Search.
     */
    arguments?: InteractionsAPI.GoogleSearchCallArguments;
  }

  export interface GoogleSearchResultDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'google_search_result';

    /**
     * ID to match the ID from the function call block.
     */
    call_id?: string;

    is_error?: boolean;

    result?: Array<InteractionsAPI.GoogleSearchResult>;

    signature?: string;
  }

  export interface MCPServerToolCallDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'mcp_server_tool_call';

    /**
     * A unique ID for this specific tool call.
     */
    id?: string;

    arguments?: { [key: string]: unknown };

    name?: string;

    server_name?: string;
  }

  export interface MCPServerToolResultDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'mcp_server_tool_result';

    /**
     * ID to match the ID from the function call block.
     */
    call_id?: string;

    name?: string;

    /**
     * Tool call result delta.
     */
    result?: MCPServerToolResultDelta.Items | string;

    server_name?: string;
  }

  export namespace MCPServerToolResultDelta {
    export interface Items {
      items?: Array<string | InteractionsAPI.ImageContent>;
    }
  }

  export interface FileSearchResultDelta {
    /**
     * Used as the OpenAPI type discriminator for the content oneof.
     */
    type: 'file_search_result';

    result?: Array<FileSearchResultDelta.Result>;
  }

  export namespace FileSearchResultDelta {
    /**
     * The result of the File Search.
     */
    export interface Result {
      /**
       * The name of the file search store.
       */
      file_search_store?: string;

      /**
       * The text of the search result.
       */
      text?: string;

      /**
       * The title of the search result.
       */
      title?: string;
    }
  }
}

export interface ContentStart {
  /**
   * The content of the response.
   */
  content?:
    | TextContent
    | ImageContent
    | AudioContent
    | DocumentContent
    | VideoContent
    | ThoughtContent
    | FunctionCallContent
    | FunctionResultContent
    | CodeExecutionCallContent
    | CodeExecutionResultContent
    | URLContextCallContent
    | URLContextResultContent
    | GoogleSearchCallContent
    | GoogleSearchResultContent
    | MCPServerToolCallContent
    | MCPServerToolResultContent
    | FileSearchResultContent;

  /**
   * The event_id token to be used to resume the interaction stream, from
   * this event.
   */
  event_id?: string;

  event_type?: 'content.start';

  index?: number;
}

export interface ContentStop {
  /**
   * The event_id token to be used to resume the interaction stream, from
   * this event.
   */
  event_id?: string;

  event_type?: 'content.stop';

  index?: number;
}

/**
 * Configuration for the Deep Research agent.
 */
export interface DeepResearchAgentConfig {
  /**
   * Whether to include thought summaries in the response.
   */
  thinking_summaries?: 'auto' | 'none';

  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type?: 'deep-research';
}

/**
 * A document content block.
 */
export interface DocumentContent {
  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type: 'document';

  data?: string;

  mime_type?: string;

  uri?: string;
}

/**
 * Configuration for dynamic agents.
 */
export interface DynamicAgentConfig {
  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type?: 'dynamic';

  [k: string]: unknown;
}

export interface ErrorEvent {
  /**
   * Error message from an interaction.
   */
  error?: ErrorEvent.Error;

  /**
   * The event_id token to be used to resume the interaction stream, from
   * this event.
   */
  event_id?: string;

  event_type?: 'error';
}

export namespace ErrorEvent {
  /**
   * Error message from an interaction.
   */
  export interface Error {
    /**
     * A URI that identifies the error type.
     */
    code?: string;

    /**
     * A human-readable error message.
     */
    message?: string;
  }
}

/**
 * File Search result content.
 */
export interface FileSearchResultContent {
  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type: 'file_search_result';

  /**
   * The results of the File Search.
   */
  result?: Array<FileSearchResultContent.Result>;
}

export namespace FileSearchResultContent {
  /**
   * The result of the File Search.
   */
  export interface Result {
    /**
     * The name of the file search store.
     */
    file_search_store?: string;

    /**
     * The text of the search result.
     */
    text?: string;

    /**
     * The title of the search result.
     */
    title?: string;
  }
}

/**
 * A tool that can be used by the model.
 */
export interface Function {
  type: 'function';

  /**
   * A description of the function.
   */
  description?: string;

  /**
   * The name of the function.
   */
  name?: string;

  /**
   * The JSON Schema for the function's parameters.
   */
  parameters?: unknown;
}

/**
 * A function tool call content block.
 */
export interface FunctionCallContent {
  /**
   * A unique ID for this specific tool call.
   */
  id: string;

  /**
   * The arguments to pass to the function.
   */
  arguments: { [key: string]: unknown };

  /**
   * The name of the tool to call.
   */
  name: string;

  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type: 'function_call';
}

/**
 * A function tool result content block.
 */
export interface FunctionResultContent {
  /**
   * ID to match the ID from the function call block.
   */
  call_id: string;

  /**
   * The result of the tool call.
   */
  result: FunctionResultContent.Items | unknown | string;

  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type: 'function_result';

  /**
   * Whether the tool call resulted in an error.
   */
  is_error?: boolean;

  /**
   * The name of the tool that was called.
   */
  name?: string;
}

export namespace FunctionResultContent {
  export interface Items {
    items?: Array<string | InteractionsAPI.ImageContent>;
  }
}

/**
 * Configuration parameters for model interactions.
 */
export interface GenerationConfig {
  /**
   * The maximum number of tokens to include in the response.
   */
  max_output_tokens?: number;

  /**
   * Seed used in decoding for reproducibility.
   */
  seed?: number;

  /**
   * Configuration for speech interaction.
   */
  speech_config?: Array<SpeechConfig>;

  /**
   * A list of character sequences that will stop output interaction.
   */
  stop_sequences?: Array<string>;

  /**
   * Controls the randomness of the output.
   */
  temperature?: number;

  /**
   * The level of thought tokens that the model should generate.
   */
  thinking_level?: ThinkingLevel;

  /**
   * Whether to include thought summaries in the response.
   */
  thinking_summaries?: 'auto' | 'none';

  /**
   * The tool choice for the interaction.
   */
  tool_choice?: ToolChoice;

  /**
   * The maximum cumulative probability of tokens to consider when sampling.
   */
  top_p?: number;
}

/**
 * The arguments to pass to Google Search.
 */
export interface GoogleSearchCallArguments {
  /**
   * Web search queries for the following-up web search.
   */
  queries?: Array<string>;
}

/**
 * Google Search content.
 */
export interface GoogleSearchCallContent {
  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type: 'google_search_call';

  /**
   * A unique ID for this specific tool call.
   */
  id?: string;

  /**
   * The arguments to pass to Google Search.
   */
  arguments?: GoogleSearchCallArguments;
}

/**
 * The result of the Google Search.
 */
export interface GoogleSearchResult {
  /**
   * Web content snippet that can be embedded in a web page or an app webview.
   */
  rendered_content?: string;

  /**
   * Title of the search result.
   */
  title?: string;

  /**
   * URI reference of the search result.
   */
  url?: string;
}

/**
 * Google Search result content.
 */
export interface GoogleSearchResultContent {
  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type: 'google_search_result';

  /**
   * ID to match the ID from the google search call block.
   */
  call_id?: string;

  /**
   * Whether the Google Search resulted in an error.
   */
  is_error?: boolean;

  /**
   * The results of the Google Search.
   */
  result?: Array<GoogleSearchResult>;

  /**
   * The signature of the Google Search result.
   */
  signature?: string;
}

/**
 * An image content block.
 */
export interface ImageContent {
  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type: 'image';

  data?: string;

  /**
   * The mime type of the image.
   */
  mime_type?: ImageMimeType;

  /**
   * The resolution of the media.
   */
  resolution?: 'low' | 'medium' | 'high';

  uri?: string;
}

/**
 * The mime type of the image.
 */
export type ImageMimeType =
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'image/heic'
  | 'image/heif'
  | (string & {});

/**
 * The Interaction resource.
 */
export interface Interaction {
  /**
   * Output only. A unique identifier for the interaction completion.
   */
  id: string;

  /**
   * Output only. The status of the interaction.
   */
  status: 'in_progress' | 'requires_action' | 'completed' | 'failed' | 'cancelled';

  /**
   * The name of the `Agent` used for generating the interaction.
   */
  agent?: (string & {}) | 'deep-research-pro-preview-12-2025';

  /**
   * Output only. The time at which the response was created in ISO 8601 format
   * (YYYY-MM-DDThh:mm:ssZ).
   */
  created?: string;

  /**
   * Output only. The error message for the interaction, if any.
   */
  error?: Interaction.Error;

  /**
   * The name of the `Model` used for generating the interaction.
   */
  model?: Model;

  /**
   * Output only. The object type of the interaction. Always set to `interaction`.
   */
  object?: 'interaction';

  /**
   * Output only. Responses from the model.
   */
  outputs?: Array<
    | TextContent
    | ImageContent
    | AudioContent
    | DocumentContent
    | VideoContent
    | ThoughtContent
    | FunctionCallContent
    | FunctionResultContent
    | CodeExecutionCallContent
    | CodeExecutionResultContent
    | URLContextCallContent
    | URLContextResultContent
    | GoogleSearchCallContent
    | GoogleSearchResultContent
    | MCPServerToolCallContent
    | MCPServerToolResultContent
    | FileSearchResultContent
  >;

  /**
   * The ID of the previous interaction, if any.
   */
  previous_interaction_id?: string;

  /**
   * Output only. The role of the interaction.
   */
  role?: string;

  /**
   * Output only. The time at which the response was last updated in ISO 8601 format
   * (YYYY-MM-DDThh:mm:ssZ).
   */
  updated?: string;

  /**
   * Output only. Statistics on the interaction request's token usage.
   */
  usage?: Usage;
}

export namespace Interaction {
  /**
   * Output only. The error message for the interaction, if any.
   */
  export interface Error {
    /**
     * A URI that identifies the error type.
     */
    code?: string;

    /**
     * A human-readable error message.
     */
    message?: string;
  }
}

export interface InteractionEvent {
  /**
   * The event_id token to be used to resume the interaction stream, from
   * this event.
   */
  event_id?: string;

  event_type?: 'interaction.start' | 'interaction.complete';

  /**
   * The Interaction resource.
   */
  interaction?: Interaction;
}

export type InteractionSSEEvent =
  | InteractionEvent
  | InteractionStatusUpdate
  | ContentStart
  | ContentDelta
  | ContentStop
  | ErrorEvent;

export interface InteractionStatusUpdate {
  /**
   * The event_id token to be used to resume the interaction stream, from
   * this event.
   */
  event_id?: string;

  event_type?: 'interaction.status_update';

  interaction_id?: string;

  status?: 'in_progress' | 'requires_action' | 'completed' | 'failed' | 'cancelled';
}

/**
 * MCPServer tool call content.
 */
export interface MCPServerToolCallContent {
  /**
   * A unique ID for this specific tool call.
   */
  id: string;

  /**
   * The JSON object of arguments for the function.
   */
  arguments: { [key: string]: unknown };

  /**
   * The name of the tool which was called.
   */
  name: string;

  /**
   * The name of the used MCP server.
   */
  server_name: string;

  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type: 'mcp_server_tool_call';
}

/**
 * MCPServer tool result content.
 */
export interface MCPServerToolResultContent {
  /**
   * ID to match the ID from the MCP server tool call block.
   */
  call_id: string;

  /**
   * The result of the tool call.
   */
  result: MCPServerToolResultContent.Items | unknown | string;

  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type: 'mcp_server_tool_result';

  /**
   * Name of the tool which is called for this specific tool call.
   */
  name?: string;

  /**
   * The name of the used MCP server.
   */
  server_name?: string;
}

export namespace MCPServerToolResultContent {
  export interface Items {
    items?: Array<string | InteractionsAPI.ImageContent>;
  }
}

/**
 * The model that will complete your prompt.\n\nSee [models](https://ai.google.dev/gemini-api/docs/models) for additional details.
 */
export type Model =
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-preview-09-2025'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-flash-lite-preview-09-2025'
  | 'gemini-2.5-flash-preview-native-audio-dialog'
  | 'gemini-2.5-flash-image-preview'
  | 'gemini-2.5-pro-preview-tts'
  | 'gemini-3-pro-preview'
  | (string & {});

/**
 * The configuration for speech interaction.
 */
export interface SpeechConfig {
  /**
   * The language of the speech.
   */
  language?: string;

  /**
   * The speaker's name, it should match the speaker name given in the prompt.
   */
  speaker?: string;

  /**
   * The voice of the speaker.
   */
  voice?: string;
}

/**
 * A text content block.
 */
export interface TextContent {
  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type: 'text';

  /**
   * Citation information for model-generated content.
   */
  annotations?: Array<Annotation>;

  /**
   * The text content.
   */
  text?: string;
}

export type ThinkingLevel = 'low' | 'high';

/**
 * A thought content block.
 */
export interface ThoughtContent {
  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type: 'thought';

  /**
   * Signature to match the backend source to be part of the generation.
   */
  signature?: string;

  /**
   * A summary of the thought.
   */
  summary?: Array<TextContent | ImageContent>;
}

/**
 * A tool that can be used by the model.
 */
export type Tool =
  | Function
  | Tool.GoogleSearch
  | Tool.CodeExecution
  | Tool.URLContext
  | Tool.ComputerUse
  | Tool.MCPServer
  | Tool.FileSearch;

export namespace Tool {
  /**
   * A tool that can be used by the model to search Google.
   */
  export interface GoogleSearch {
    type: 'google_search';
  }

  /**
   * A tool that can be used by the model to execute code.
   */
  export interface CodeExecution {
    type: 'code_execution';
  }

  /**
   * A tool that can be used by the model to fetch URL context.
   */
  export interface URLContext {
    type: 'url_context';
  }

  /**
   * A tool that can be used by the model to interact with the computer.
   */
  export interface ComputerUse {
    type: 'computer_use';

    /**
     * The environment being operated.
     */
    environment?: 'browser';

    /**
     * The list of predefined functions that are excluded from the model call.
     */
    excludedPredefinedFunctions?: Array<string>;
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
     * The full URL for the MCPServer endpoint.
     * Example: "https://api.example.com/mcp"
     */
    url?: string;
  }

  /**
   * A tool that can be used by the model to search files.
   */
  export interface FileSearch {
    type: 'file_search';

    /**
     * The file search store names to search.
     */
    file_search_store_names?: Array<string>;

    /**
     * Metadata filter to apply to the semantic retrieval documents and chunks.
     */
    metadata_filter?: string;

    /**
     * The number of semantic retrieval chunks to retrieve.
     */
    top_k?: number;
  }
}

/**
 * The configuration for tool choice.
 */
export type ToolChoice = ToolChoiceType | ToolChoiceConfig;

export interface ToolChoiceConfig {
  /**
   * The configuration for allowed tools.
   */
  allowed_tools?: AllowedTools;
}

export type ToolChoiceType = 'auto' | 'any' | 'none' | 'validated';

export interface Turn {
  /**
   * The content of the turn.
   */
  content?:
    | string
    | Array<
        | TextContent
        | ImageContent
        | AudioContent
        | DocumentContent
        | VideoContent
        | ThoughtContent
        | FunctionCallContent
        | FunctionResultContent
        | CodeExecutionCallContent
        | CodeExecutionResultContent
        | URLContextCallContent
        | URLContextResultContent
        | GoogleSearchCallContent
        | GoogleSearchResultContent
        | MCPServerToolCallContent
        | MCPServerToolResultContent
        | FileSearchResultContent
      >;

  /**
   * The originator of this turn. Must be user for input or model for
   * model output.
   */
  role?: string;
}

/**
 * The arguments to pass to the URL context.
 */
export interface URLContextCallArguments {
  /**
   * The URLs to fetch.
   */
  urls?: Array<string>;
}

/**
 * URL context content.
 */
export interface URLContextCallContent {
  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type: 'url_context_call';

  /**
   * A unique ID for this specific tool call.
   */
  id?: string;

  /**
   * The arguments to pass to the URL context.
   */
  arguments?: URLContextCallArguments;
}

/**
 * The result of the URL context.
 */
export interface URLContextResult {
  /**
   * The status of the URL retrieval.
   */
  status?: 'success' | 'error' | 'paywall' | 'unsafe';

  /**
   * The URL that was fetched.
   */
  url?: string;
}

/**
 * URL context result content.
 */
export interface URLContextResultContent {
  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type: 'url_context_result';

  /**
   * ID to match the ID from the url context call block.
   */
  call_id?: string;

  /**
   * Whether the URL context resulted in an error.
   */
  is_error?: boolean;

  /**
   * The results of the URL context.
   */
  result?: Array<URLContextResult>;

  /**
   * The signature of the URL context result.
   */
  signature?: string;
}

/**
 * Statistics on the interaction request's token usage.
 */
export interface Usage {
  /**
   * A breakdown of cached token usage by modality.
   */
  cached_tokens_by_modality?: Array<Usage.CachedTokensByModality>;

  /**
   * A breakdown of input token usage by modality.
   */
  input_tokens_by_modality?: Array<Usage.InputTokensByModality>;

  /**
   * A breakdown of output token usage by modality.
   */
  output_tokens_by_modality?: Array<Usage.OutputTokensByModality>;

  /**
   * A breakdown of tool-use token usage by modality.
   */
  tool_use_tokens_by_modality?: Array<Usage.ToolUseTokensByModality>;

  /**
   * Number of tokens in the cached part of the prompt (the cached content).
   */
  total_cached_tokens?: number;

  /**
   * Number of tokens in the prompt (context).
   */
  total_input_tokens?: number;

  /**
   * Total number of tokens across all the generated responses.
   */
  total_output_tokens?: number;

  /**
   * Number of tokens of thoughts for thinking models.
   */
  total_reasoning_tokens?: number;

  /**
   * Total token count for the interaction request (prompt + responses + other
   * internal tokens).
   */
  total_tokens?: number;

  /**
   * Number of tokens present in tool-use prompt(s).
   */
  total_tool_use_tokens?: number;
}

export namespace Usage {
  /**
   * The token count for a single response modality.
   */
  export interface CachedTokensByModality {
    /**
     * The modality associated with the token count.
     */
    modality?: 'text' | 'image' | 'audio';

    /**
     * Number of tokens for the modality.
     */
    tokens?: number;
  }

  /**
   * The token count for a single response modality.
   */
  export interface InputTokensByModality {
    /**
     * The modality associated with the token count.
     */
    modality?: 'text' | 'image' | 'audio';

    /**
     * Number of tokens for the modality.
     */
    tokens?: number;
  }

  /**
   * The token count for a single response modality.
   */
  export interface OutputTokensByModality {
    /**
     * The modality associated with the token count.
     */
    modality?: 'text' | 'image' | 'audio';

    /**
     * Number of tokens for the modality.
     */
    tokens?: number;
  }

  /**
   * The token count for a single response modality.
   */
  export interface ToolUseTokensByModality {
    /**
     * The modality associated with the token count.
     */
    modality?: 'text' | 'image' | 'audio';

    /**
     * Number of tokens for the modality.
     */
    tokens?: number;
  }
}

/**
 * A video content block.
 */
export interface VideoContent {
  /**
   * Used as the OpenAPI type discriminator for the content oneof.
   */
  type: 'video';

  data?: string;

  /**
   * The mime type of the video.
   */
  mime_type?: VideoMimeType;

  /**
   * The resolution of the media.
   */
  resolution?: 'low' | 'medium' | 'high';

  uri?: string;
}

/**
 * The mime type of the video.
 */
export type VideoMimeType =
  | 'video/mp4'
  | 'video/mpeg'
  | 'video/mov'
  | 'video/avi'
  | 'video/x-flv'
  | 'video/mpg'
  | 'video/webm'
  | 'video/wmv'
  | 'video/3gpp'
  | (string & {});

export type InteractionDeleteResponse = unknown;

export type InteractionCreateParams =
  | CreateModelInteractionParamsNonStreaming
  | CreateModelInteractionParamsStreaming
  | CreateAgentInteractionParamsNonStreaming
  | CreateAgentInteractionParamsStreaming;

export interface BaseCreateModelInteractionParams {
  /**
   * Body param: The inputs for the interaction.
   */
  input:
    | string
    | Array<
        | TextContent
        | ImageContent
        | AudioContent
        | DocumentContent
        | VideoContent
        | ThoughtContent
        | FunctionCallContent
        | FunctionResultContent
        | CodeExecutionCallContent
        | CodeExecutionResultContent
        | URLContextCallContent
        | URLContextResultContent
        | GoogleSearchCallContent
        | GoogleSearchResultContent
        | MCPServerToolCallContent
        | MCPServerToolResultContent
        | FileSearchResultContent
      >
    | Array<Turn>
    | TextContent
    | ImageContent
    | AudioContent
    | DocumentContent
    | VideoContent
    | ThoughtContent
    | FunctionCallContent
    | FunctionResultContent
    | CodeExecutionCallContent
    | CodeExecutionResultContent
    | URLContextCallContent
    | URLContextResultContent
    | GoogleSearchCallContent
    | GoogleSearchResultContent
    | MCPServerToolCallContent
    | MCPServerToolResultContent
    | FileSearchResultContent;

  /**
   * Body param: The name of the `Model` used for generating the interaction.
   */
  model: Model;

  /**
   * Path param: Which version of the API to use.
   */
  api_version?: string;

  /**
   * Body param: Whether to run the model interaction in the background.
   */
  background?: boolean;

  /**
   * Body param: Input only. Configuration parameters for the model interaction.
   */
  generation_config?: GenerationConfig;

  /**
   * Body param: The ID of the previous interaction, if any.
   */
  previous_interaction_id?: string;

  /**
   * Body param: Enforces that the generated response is a JSON object that complies with
   * the JSON schema specified in this field.
   */
  response_format?: unknown;

  /**
   * Body param: The mime type of the response. This is required if response_format is set.
   */
  response_mime_type?: string;

  /**
   * Body param: The requested modalities of the response (TEXT, IMAGE, AUDIO).
   */
  response_modalities?: Array<'text' | 'image' | 'audio'>;

  /**
   * Body param: Input only. Whether to store the response and request for later retrieval.
   */
  store?: boolean;

  /**
   * Body param: Input only. Whether the interaction will be streamed.
   */
  stream?: boolean;

  /**
   * Body param: System instruction for the interaction.
   */
  system_instruction?: string;

  /**
   * Body param: A list of tool declarations the model may call during interaction.
   */
  tools?: Array<Tool>;
}

export interface BaseCreateAgentInteractionParams {
  /**
   * Body param: The name of the `Agent` used for generating the interaction.
   */
  agent: (string & {}) | 'deep-research-pro-preview-12-2025';

  /**
   * Body param: The inputs for the interaction.
   */
  input:
    | string
    | Array<
        | TextContent
        | ImageContent
        | AudioContent
        | DocumentContent
        | VideoContent
        | ThoughtContent
        | FunctionCallContent
        | FunctionResultContent
        | CodeExecutionCallContent
        | CodeExecutionResultContent
        | URLContextCallContent
        | URLContextResultContent
        | GoogleSearchCallContent
        | GoogleSearchResultContent
        | MCPServerToolCallContent
        | MCPServerToolResultContent
        | FileSearchResultContent
      >
    | Array<Turn>
    | TextContent
    | ImageContent
    | AudioContent
    | DocumentContent
    | VideoContent
    | ThoughtContent
    | FunctionCallContent
    | FunctionResultContent
    | CodeExecutionCallContent
    | CodeExecutionResultContent
    | URLContextCallContent
    | URLContextResultContent
    | GoogleSearchCallContent
    | GoogleSearchResultContent
    | MCPServerToolCallContent
    | MCPServerToolResultContent
    | FileSearchResultContent;

  /**
   * Path param: Which version of the API to use.
   */
  api_version?: string;

  /**
   * Body param: Configuration for the agent.
   */
  agent_config?: DynamicAgentConfig | DeepResearchAgentConfig;

  /**
   * Body param: Whether to run the model interaction in the background.
   */
  background?: boolean;

  /**
   * Body param: The ID of the previous interaction, if any.
   */
  previous_interaction_id?: string;

  /**
   * Body param: Enforces that the generated response is a JSON object that complies with
   * the JSON schema specified in this field.
   */
  response_format?: unknown;

  /**
   * Body param: The mime type of the response. This is required if response_format is set.
   */
  response_mime_type?: string;

  /**
   * Body param: The requested modalities of the response (TEXT, IMAGE, AUDIO).
   */
  response_modalities?: Array<'text' | 'image' | 'audio'>;

  /**
   * Body param: Input only. Whether to store the response and request for later retrieval.
   */
  store?: boolean;

  /**
   * Body param: Input only. Whether the interaction will be streamed.
   */
  stream?: boolean;

  /**
   * Body param: System instruction for the interaction.
   */
  system_instruction?: string;

  /**
   * Body param: A list of tool declarations the model may call during interaction.
   */
  tools?: Array<Tool>;
}

export interface CreateModelInteractionParamsNonStreaming extends BaseCreateModelInteractionParams {
  /**
   * Body param: Input only. Whether the interaction will be streamed.
   */
  stream?: false;
}

export interface CreateModelInteractionParamsStreaming extends BaseCreateModelInteractionParams {
  /**
   * Body param: Input only. Whether the interaction will be streamed.
   */
  stream: true;
}

export interface CreateAgentInteractionParamsNonStreaming extends BaseCreateAgentInteractionParams {
  /**
   * Body param: Input only. Whether the interaction will be streamed.
   */
  stream?: false;
}

export interface CreateAgentInteractionParamsStreaming extends BaseCreateAgentInteractionParams {
  /**
   * Body param: Input only. Whether the interaction will be streamed.
   */
  stream: true;
}

export interface InteractionDeleteParams {
  /**
   * Which version of the API to use.
   */
  api_version?: string;
}

export interface InteractionCancelParams {
  /**
   * Which version of the API to use.
   */
  api_version?: string;
}

export type InteractionGetParams = InteractionGetParamsNonStreaming | InteractionGetParamsStreaming;

export interface InteractionGetParamsBase {
  /**
   * Path param: Which version of the API to use.
   */
  api_version?: string;

  /**
   * Query param: Optional. If set, resumes the interaction stream from the next chunk after the event marked by the event id. Can only be used if `stream` is true.
   */
  last_event_id?: string;

  /**
   * Query param: If set to true, the generated content will be streamed incrementally.
   */
  stream?: boolean;
}

export namespace InteractionGetParams {
  export type InteractionGetParamsNonStreaming = InteractionsAPI.InteractionGetParamsNonStreaming;
  export type InteractionGetParamsStreaming = InteractionsAPI.InteractionGetParamsStreaming;
}

export interface InteractionGetParamsNonStreaming extends InteractionGetParamsBase {
  /**
   * Query param: If set to true, the generated content will be streamed incrementally.
   */
  stream?: false;
}

export interface InteractionGetParamsStreaming extends InteractionGetParamsBase {
  /**
   * Query param: If set to true, the generated content will be streamed incrementally.
   */
  stream: true;
}

export declare namespace Interactions {
  export {
    type AllowedTools as AllowedTools,
    type Annotation as Annotation,
    type AudioContent as AudioContent,
    type AudioMimeType as AudioMimeType,
    type CodeExecutionCallArguments as CodeExecutionCallArguments,
    type CodeExecutionCallContent as CodeExecutionCallContent,
    type CodeExecutionResultContent as CodeExecutionResultContent,
    type ContentDelta as ContentDelta,
    type ContentStart as ContentStart,
    type ContentStop as ContentStop,
    type DeepResearchAgentConfig as DeepResearchAgentConfig,
    type DocumentContent as DocumentContent,
    type DynamicAgentConfig as DynamicAgentConfig,
    type ErrorEvent as ErrorEvent,
    type FileSearchResultContent as FileSearchResultContent,
    type Function as Function,
    type FunctionCallContent as FunctionCallContent,
    type FunctionResultContent as FunctionResultContent,
    type GenerationConfig as GenerationConfig,
    type GoogleSearchCallArguments as GoogleSearchCallArguments,
    type GoogleSearchCallContent as GoogleSearchCallContent,
    type GoogleSearchResult as GoogleSearchResult,
    type GoogleSearchResultContent as GoogleSearchResultContent,
    type ImageContent as ImageContent,
    type ImageMimeType as ImageMimeType,
    type Interaction as Interaction,
    type InteractionEvent as InteractionEvent,
    type InteractionSSEEvent as InteractionSSEEvent,
    type InteractionStatusUpdate as InteractionStatusUpdate,
    type MCPServerToolCallContent as MCPServerToolCallContent,
    type MCPServerToolResultContent as MCPServerToolResultContent,
    type Model as Model,
    type SpeechConfig as SpeechConfig,
    type TextContent as TextContent,
    type ThinkingLevel as ThinkingLevel,
    type ThoughtContent as ThoughtContent,
    type Tool as Tool,
    type ToolChoice as ToolChoice,
    type ToolChoiceConfig as ToolChoiceConfig,
    type ToolChoiceType as ToolChoiceType,
    type Turn as Turn,
    type URLContextCallArguments as URLContextCallArguments,
    type URLContextCallContent as URLContextCallContent,
    type URLContextResult as URLContextResult,
    type URLContextResultContent as URLContextResultContent,
    type Usage as Usage,
    type VideoContent as VideoContent,
    type VideoMimeType as VideoMimeType,
    type InteractionDeleteResponse as InteractionDeleteResponse,
    type InteractionCreateParams as InteractionCreateParams,
    type CreateModelInteractionParamsNonStreaming as CreateModelInteractionParamsNonStreaming,
    type CreateModelInteractionParamsStreaming as CreateModelInteractionParamsStreaming,
    type CreateAgentInteractionParamsNonStreaming as CreateAgentInteractionParamsNonStreaming,
    type CreateAgentInteractionParamsStreaming as CreateAgentInteractionParamsStreaming,
    type InteractionDeleteParams as InteractionDeleteParams,
    type InteractionCancelParams as InteractionCancelParams,
    type InteractionGetParams as InteractionGetParams,
    type InteractionGetParamsNonStreaming as InteractionGetParamsNonStreaming,
    type InteractionGetParamsStreaming as InteractionGetParamsStreaming,
  };
}
