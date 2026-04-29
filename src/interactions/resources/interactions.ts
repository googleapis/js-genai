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
   *
   * @example
   * ```ts
   * const interaction = await client.interactions.create({
   *   api_version: 'api_version',
   *   input: { text: 'text', type: 'text' },
   *   model: 'gemini-2.5-computer-use-preview-10-2025',
   * });
   * ```
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
   *
   * @example
   * ```ts
   * const interaction = await client.interactions.delete('id', {
   *   api_version: 'api_version',
   * });
   * ```
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
   * Cancels an interaction by id. This only applies to background interactions that
   * are still running.
   *
   * @example
   * ```ts
   * const interaction = await client.interactions.cancel('id', {
   *   api_version: 'api_version',
   * });
   * ```
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
   * Retrieves the full details of a single interaction based on its
   * `Interaction.id`.
   *
   * @example
   * ```ts
   * const interaction = await client.interactions.get('id', {
   *   api_version: 'api_version',
   * });
   * ```
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
export type Annotation = URLCitation | FileCitation | PlaceCitation;

/**
 * An audio content block.
 */
export interface AudioContent {
  type: 'audio';

  /**
   * The number of audio channels.
   */
  channels?: number;

  /**
   * The audio content.
   */
  data?: string;

  /**
   * The mime type of the audio.
   */
  mime_type?:
    | 'audio/wav'
    | 'audio/mp3'
    | 'audio/aiff'
    | 'audio/aac'
    | 'audio/ogg'
    | 'audio/flac'
    | 'audio/mpeg'
    | 'audio/m4a'
    | 'audio/l16'
    | 'audio/opus'
    | 'audio/alaw'
    | 'audio/mulaw';

  /**
   * The sample rate of the audio.
   */
  sample_rate?: number;

  /**
   * The URI of the audio.
   */
  uri?: string;
}

/**
 * Configuration for audio output format.
 */
export interface AudioResponseFormat {
  type: 'audio';

  /**
   * Bit rate in bits per second (bps). Only applicable for compressed formats (MP3,
   * Opus).
   */
  bitRate?: number;

  /**
   * The delivery mode for the audio output.
   */
  delivery?: 'inline' | 'url';

  /**
   * The MIME type of the audio output.
   */
  mimeType?: 'audio/mp3' | 'audio/ogg_opus' | 'audio/l16' | 'audio/wav' | 'audio/alaw' | 'audio/mulaw';

  /**
   * Sample rate in Hz.
   */
  sampleRate?: number;
}

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
 * Code execution call step.
 */
export interface CodeExecutionCallStep {
  /**
   * Required. A unique ID for this specific tool call.
   */
  id: string;

  /**
   * Required. The arguments to pass to the code execution.
   */
  arguments: CodeExecutionCallStep.Arguments;

  type: 'code_execution_call';

  /**
   * A signature hash for backend validation.
   */
  signature?: string;
}

export namespace CodeExecutionCallStep {
  /**
   * Required. The arguments to pass to the code execution.
   */
  export interface Arguments {
    /**
     * The code to be executed.
     */
    code?: string;

    /**
     * Programming language of the `code`.
     */
    language?: 'python';
  }
}

/**
 * Code execution result step.
 */
export interface CodeExecutionResultStep {
  /**
   * Required. ID to match the ID from the function call block.
   */
  call_id: string;

  /**
   * Required. The output of the code execution.
   */
  result: string;

  type: 'code_execution_result';

  /**
   * Whether the code execution resulted in an error.
   */
  is_error?: boolean;

  /**
   * A signature hash for backend validation.
   */
  signature?: string;
}

/**
 * The content of the response.
 */
export type Content = TextContent | ImageContent | AudioContent | DocumentContent | VideoContent;

/**
 * Configuration for the Deep Research agent.
 */
export interface DeepResearchAgentConfig {
  type: 'deep-research';

  /**
   * Enables human-in-the-loop planning for the Deep Research agent. If set to true,
   * the Deep Research agent will provide a research plan in its response. The agent
   * will then proceed only if the user confirms the plan in the next turn.
   */
  collaborative_planning?: boolean;

  /**
   * Whether to include thought summaries in the response.
   */
  thinking_summaries?: 'auto' | 'none';

  /**
   * Whether to include visualizations in the response.
   */
  visualization?: 'off' | 'auto';
}

/**
 * A document content block.
 */
export interface DocumentContent {
  type: 'document';

  /**
   * The document content.
   */
  data?: string;

  /**
   * The mime type of the document.
   */
  mime_type?: 'application/pdf';

  /**
   * The URI of the document.
   */
  uri?: string;
}

/**
 * Configuration for dynamic agents.
 */
export interface DynamicAgentConfig {
  type: 'dynamic';

  [k: string]: unknown;
}

export interface ErrorEvent {
  event_type: 'error';

  /**
   * Error message from an interaction.
   */
  error?: ErrorEvent.Error;

  /**
   * The event_id token to be used to resume the interaction stream, from this event.
   */
  event_id?: string;
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
 * A file citation annotation.
 */
export interface FileCitation {
  type: 'file_citation';

  /**
   * User provided metadata about the retrieved context.
   */
  custom_metadata?: { [key: string]: unknown };

  /**
   * The URI of the file.
   */
  document_uri?: string;

  /**
   * End of the attributed segment, exclusive.
   */
  end_index?: number;

  /**
   * The name of the file.
   */
  file_name?: string;

  /**
   * Media ID in-case of image citations, if applicable.
   */
  media_id?: string;

  /**
   * Page number of the cited document, if applicable.
   */
  page_number?: number;

  /**
   * Source attributed for a portion of the text.
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
 * File Search call step.
 */
export interface FileSearchCallStep {
  /**
   * Required. A unique ID for this specific tool call.
   */
  id: string;

  type: 'file_search_call';

  /**
   * A signature hash for backend validation.
   */
  signature?: string;
}

/**
 * File Search result step.
 */
export interface FileSearchResultStep {
  /**
   * Required. ID to match the ID from the function call block.
   */
  call_id: string;

  type: 'file_search_result';

  /**
   * A signature hash for backend validation.
   */
  signature?: string;
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
 * A function tool call step.
 */
export interface FunctionCallStep {
  /**
   * Required. A unique ID for this specific tool call.
   */
  id: string;

  /**
   * Required. The arguments to pass to the function.
   */
  arguments: { [key: string]: unknown };

  /**
   * Required. The name of the tool to call.
   */
  name: string;

  type: 'function_call';

  /**
   * A signature hash for backend validation.
   */
  signature?: string;
}

/**
 * Result of a function tool call.
 */
export interface FunctionResultStep {
  /**
   * Required. ID to match the ID from the function call block.
   */
  call_id: string;

  /**
   * The result of the tool call.
   */
  result: unknown | Array<TextContent | ImageContent> | string;

  type: 'function_result';

  /**
   * Whether the tool call resulted in an error.
   */
  is_error?: boolean;

  /**
   * The name of the tool that was called.
   */
  name?: string;

  /**
   * A signature hash for backend validation.
   */
  signature?: string;
}

/**
 * Configuration parameters for model interactions.
 */
export interface GenerationConfig {
  /**
   * Configuration for image interaction.
   */
  image_config?: ImageConfig;

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
   * The tool choice configuration.
   */
  tool_choice?: ToolChoiceType | ToolChoiceConfig;

  /**
   * The maximum cumulative probability of tokens to consider when sampling.
   */
  top_p?: number;
}

/**
 * The arguments to pass to the Google Maps tool.
 */
export interface GoogleMapsCallArguments {
  /**
   * The queries to be executed.
   */
  queries?: Array<string>;
}

/**
 * Google Maps call step.
 */
export interface GoogleMapsCallStep {
  /**
   * Required. A unique ID for this specific tool call.
   */
  id: string;

  type: 'google_maps_call';

  /**
   * The arguments to pass to the Google Maps tool.
   */
  arguments?: GoogleMapsCallStep.Arguments;

  /**
   * A signature hash for backend validation.
   */
  signature?: string;
}

export namespace GoogleMapsCallStep {
  /**
   * The arguments to pass to the Google Maps tool.
   */
  export interface Arguments {
    /**
     * The queries to be executed.
     */
    queries?: Array<string>;
  }
}

/**
 * The result of the Google Maps.
 */
export interface GoogleMapsResult {
  /**
   * The places that were found.
   */
  places?: Array<GoogleMapsResult.Place>;

  /**
   * Resource name of the Google Maps widget context token.
   */
  widget_context_token?: string;
}

export namespace GoogleMapsResult {
  export interface Place {
    /**
     * Title of the place.
     */
    name?: string;

    /**
     * The ID of the place, in `places/{place_id}` format.
     */
    place_id?: string;

    /**
     * Snippets of reviews that are used to generate answers about the features of a
     * given place in Google Maps.
     */
    review_snippets?: Array<Place.ReviewSnippet>;

    /**
     * URI reference of the place.
     */
    url?: string;
  }

  export namespace Place {
    /**
     * Encapsulates a snippet of a user review that answers a question about the
     * features of a specific place in Google Maps.
     */
    export interface ReviewSnippet {
      /**
       * The ID of the review snippet.
       */
      review_id?: string;

      /**
       * Title of the review.
       */
      title?: string;

      /**
       * A link that corresponds to the user review on Google Maps.
       */
      url?: string;
    }
  }
}

/**
 * Google Maps result step.
 */
export interface GoogleMapsResultStep {
  /**
   * Required. ID to match the ID from the function call block.
   */
  call_id: string;

  result: Array<GoogleMapsResultStep.Result>;

  type: 'google_maps_result';

  /**
   * A signature hash for backend validation.
   */
  signature?: string;
}

export namespace GoogleMapsResultStep {
  /**
   * The result of the Google Maps.
   */
  export interface Result {
    places?: Array<Result.Place>;

    widget_context_token?: string;
  }

  export namespace Result {
    export interface Place {
      name?: string;

      place_id?: string;

      review_snippets?: Array<Place.ReviewSnippet>;

      url?: string;
    }

    export namespace Place {
      /**
       * Encapsulates a snippet of a user review that answers a question about the
       * features of a specific place in Google Maps.
       */
      export interface ReviewSnippet {
        /**
         * The ID of the review snippet.
         */
        review_id?: string;

        /**
         * Title of the review.
         */
        title?: string;

        /**
         * A link that corresponds to the user review on Google Maps.
         */
        url?: string;
      }
    }
  }
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
 * Google Search call step.
 */
export interface GoogleSearchCallStep {
  /**
   * Required. A unique ID for this specific tool call.
   */
  id: string;

  /**
   * Required. The arguments to pass to Google Search.
   */
  arguments: GoogleSearchCallStep.Arguments;

  type: 'google_search_call';

  /**
   * The type of search grounding enabled.
   */
  search_type?: 'web_search' | 'image_search' | 'enterprise_web_search';

  /**
   * A signature hash for backend validation.
   */
  signature?: string;
}

export namespace GoogleSearchCallStep {
  /**
   * Required. The arguments to pass to Google Search.
   */
  export interface Arguments {
    /**
     * Web search queries for the following-up web search.
     */
    queries?: Array<string>;
  }
}

/**
 * The result of the Google Search.
 */
export interface GoogleSearchResult {
  /**
   * Web content snippet that can be embedded in a web page or an app webview.
   */
  search_suggestions?: string;
}

/**
 * Google Search result step.
 */
export interface GoogleSearchResultStep {
  /**
   * Required. ID to match the ID from the function call block.
   */
  call_id: string;

  /**
   * Required. The results of the Google Search.
   */
  result: Array<GoogleSearchResultStep.Result>;

  type: 'google_search_result';

  /**
   * Whether the Google Search resulted in an error.
   */
  is_error?: boolean;

  /**
   * A signature hash for backend validation.
   */
  signature?: string;
}

export namespace GoogleSearchResultStep {
  /**
   * The result of the Google Search.
   */
  export interface Result {
    /**
     * Web content snippet that can be embedded in a web page or an app webview.
     */
    search_suggestions?: string;
  }
}

/**
 * The configuration for image interaction.
 */
export interface ImageConfig {
  aspect_ratio?:
    | '1:1'
    | '2:3'
    | '3:2'
    | '3:4'
    | '4:3'
    | '4:5'
    | '5:4'
    | '9:16'
    | '16:9'
    | '21:9'
    | '1:8'
    | '8:1'
    | '1:4'
    | '4:1';

  image_size?: '1K' | '2K' | '4K' | '512';
}

/**
 * An image content block.
 */
export interface ImageContent {
  type: 'image';

  /**
   * The image content.
   */
  data?: string;

  /**
   * The mime type of the image.
   */
  mime_type?:
    | 'image/png'
    | 'image/jpeg'
    | 'image/webp'
    | 'image/heic'
    | 'image/heif'
    | 'image/gif'
    | 'image/bmp'
    | 'image/tiff';

  /**
   * The resolution of the media.
   */
  resolution?: 'low' | 'medium' | 'high' | 'ultra_high';

  /**
   * The URI of the image.
   */
  uri?: string;
}

/**
 * Configuration for image output format.
 */
export interface ImageResponseFormat {
  type: 'image';

  /**
   * The aspect ratio for the image output.
   */
  aspectRatio?:
    | '1:1'
    | '2:3'
    | '3:2'
    | '3:4'
    | '4:3'
    | '4:5'
    | '5:4'
    | '9:16'
    | '16:9'
    | '21:9'
    | '1:8'
    | '8:1'
    | '1:4'
    | '4:1';

  /**
   * The delivery mode for the image output.
   */
  delivery?: 'inline' | 'url';

  /**
   * The size of the image output.
   */
  imageSize?: '512' | '1K' | '2K' | '4K';

  /**
   * The MIME type of the image output.
   */
  mimeType?: 'image/jpeg';
}

/**
 * The Interaction resource.
 */
export interface Interaction {
  /**
   * Required. Output only. A unique identifier for the interaction completion.
   */
  id: string;

  /**
   * Required. Output only. The time at which the response was created in ISO 8601
   * format (YYYY-MM-DDThh:mm:ssZ).
   */
  created: string;

  /**
   * Required. Output only. The status of the interaction.
   */
  status: 'in_progress' | 'requires_action' | 'completed' | 'failed' | 'cancelled' | 'incomplete';

  /**
   * Required. Output only. The time at which the response was last updated in ISO
   * 8601 format (YYYY-MM-DDThh:mm:ssZ).
   */
  updated: string;

  /**
   * The name of the `Agent` used for generating the interaction.
   */
  agent?:
    | 'deep-research-pro-preview-12-2025'
    | 'deep-research-preview-04-2026'
    | 'deep-research-max-preview-04-2026'
    | (string & {});

  /**
   * Configuration parameters for the agent interaction.
   */
  agent_config?: DynamicAgentConfig | DeepResearchAgentConfig;

  /**
   * The input for the interaction.
   */
  input?:
    | string
    | Array<Step>
    | Array<Content>
    | TextContent
    | ImageContent
    | AudioContent
    | DocumentContent
    | VideoContent;

  /**
   * The name of the `Model` used for generating the interaction.
   */
  model?: Model;

  /**
   * The ID of the previous interaction, if any.
   */
  previous_interaction_id?: string;

  /**
   * Enforces that the generated response is a JSON object that complies with the
   * JSON schema specified in this field.
   */
  response_format?:
    | Array<AudioResponseFormat | TextResponseFormat | ImageResponseFormat | VideoResponseFormat | unknown>
    | AudioResponseFormat
    | TextResponseFormat
    | ImageResponseFormat
    | VideoResponseFormat
    | unknown;

  /**
   * The mime type of the response. This is required if response_format is set.
   */
  response_mime_type?: string;

  /**
   * The requested modalities of the response (TEXT, IMAGE, AUDIO).
   */
  response_modalities?: Array<'text' | 'image' | 'audio' | 'video' | 'document'>;

  /**
   * @deprecated Output only. The role of the interaction.
   */
  role?: string;

  /**
   * The service tier for the interaction.
   */
  service_tier?: 'flex' | 'standard' | 'priority';

  /**
   * Output only. The steps that make up the interaction.
   */
  steps?: Array<Step>;

  /**
   * System instruction for the interaction.
   */
  system_instruction?: string;

  /**
   * A list of tool declarations the model may call during interaction.
   */
  tools?: Array<Tool>;

  /**
   * Output only. Statistics on the interaction request's token usage.
   */
  usage?: Usage;

  /**
   * Optional. Webhook configuration for receiving notifications when the interaction
   * completes.
   */
  webhook_config?: WebhookConfig;
}

export interface InteractionCompletedEvent {
  event_type: 'interaction.completed';

  /**
   * Required. The completed interaction with empty outputs to reduce the payload
   * size. Use the preceding ContentDelta events for the actual output.
   */
  interaction: Interaction;

  /**
   * The event_id token to be used to resume the interaction stream, from this event.
   */
  event_id?: string;
}

export interface InteractionCreatedEvent {
  event_type: 'interaction.created';

  /**
   * The Interaction resource.
   */
  interaction: Interaction;

  /**
   * The event_id token to be used to resume the interaction stream, from this event.
   */
  event_id?: string;
}

export type InteractionSSEEvent =
  | InteractionCreatedEvent
  | InteractionCompletedEvent
  | InteractionStatusUpdate
  | ErrorEvent
  | StepStart
  | StepDelta
  | StepStop;

export interface InteractionStatusUpdate {
  event_type: 'interaction.status_update';

  interaction_id: string;

  status: 'in_progress' | 'requires_action' | 'completed' | 'failed' | 'cancelled' | 'incomplete';

  /**
   * The event_id token to be used to resume the interaction stream, from this event.
   */
  event_id?: string;
}

/**
 * MCPServer tool call step.
 */
export interface MCPServerToolCallStep {
  /**
   * Required. A unique ID for this specific tool call.
   */
  id: string;

  /**
   * Required. The JSON object of arguments for the function.
   */
  arguments: { [key: string]: unknown };

  /**
   * Required. The name of the tool which was called.
   */
  name: string;

  /**
   * Required. The name of the used MCP server.
   */
  server_name: string;

  type: 'mcp_server_tool_call';

  /**
   * A signature hash for backend validation.
   */
  signature?: string;
}

/**
 * MCPServer tool result step.
 */
export interface MCPServerToolResultStep {
  /**
   * Required. ID to match the ID from the function call block.
   */
  call_id: string;

  /**
   * The output from the MCP server call. Can be simple text or rich content.
   */
  result: unknown | string | Array<TextContent | ImageContent>;

  type: 'mcp_server_tool_result';

  /**
   * Name of the tool which is called for this specific tool call.
   */
  name?: string;

  /**
   * The name of the used MCP server.
   */
  server_name?: string;

  /**
   * A signature hash for backend validation.
   */
  signature?: string;
}

/**
 * The model that will complete your prompt.\n\nSee
 * [models](https://ai.google.dev/gemini-api/docs/models) for additional details.
 */
export type Model =
  | 'gemini-2.5-computer-use-preview-10-2025'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-image'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-flash-lite-preview-09-2025'
  | 'gemini-2.5-flash-native-audio-preview-12-2025'
  | 'gemini-2.5-flash-preview-09-2025'
  | 'gemini-2.5-flash-preview-tts'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-pro-preview-tts'
  | 'gemini-3-flash-preview'
  | 'gemini-3-pro-image-preview'
  | 'gemini-3-pro-preview'
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.1-flash-image-preview'
  | 'gemini-3.1-flash-lite-preview'
  | 'gemini-3.1-flash-tts-preview'
  | 'lyria-3-clip-preview'
  | 'lyria-3-pro-preview'
  | (string & {});

/**
 * Output generated by the model.
 */
export interface ModelOutputStep {
  type: 'model_output';

  content?: Array<Content>;
}

/**
 * A place citation annotation.
 */
export interface PlaceCitation {
  type: 'place_citation';

  /**
   * End of the attributed segment, exclusive.
   */
  end_index?: number;

  /**
   * Title of the place.
   */
  name?: string;

  /**
   * The ID of the place, in `places/{place_id}` format.
   */
  place_id?: string;

  /**
   * Snippets of reviews that are used to generate answers about the features of a
   * given place in Google Maps.
   */
  review_snippets?: Array<PlaceCitation.ReviewSnippet>;

  /**
   * Start of segment of the response that is attributed to this source.
   *
   * Index indicates the start of the segment, measured in bytes.
   */
  start_index?: number;

  /**
   * URI reference of the place.
   */
  url?: string;
}

export namespace PlaceCitation {
  /**
   * Encapsulates a snippet of a user review that answers a question about the
   * features of a specific place in Google Maps.
   */
  export interface ReviewSnippet {
    /**
     * The ID of the review snippet.
     */
    review_id?: string;

    /**
     * Title of the review.
     */
    title?: string;

    /**
     * A link that corresponds to the user review on Google Maps.
     */
    url?: string;
  }
}

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
 * A step in the interaction.
 */
export type Step =
  | UserInputStep
  | ModelOutputStep
  | ThoughtStep
  | FunctionCallStep
  | CodeExecutionCallStep
  | URLContextCallStep
  | MCPServerToolCallStep
  | GoogleSearchCallStep
  | FileSearchCallStep
  | GoogleMapsCallStep
  | FunctionResultStep
  | CodeExecutionResultStep
  | URLContextResultStep
  | GoogleSearchResultStep
  | MCPServerToolResultStep
  | FileSearchResultStep
  | GoogleMapsResultStep;

export interface StepDelta {
  delta:
    | StepDelta.Text
    | StepDelta.Image
    | StepDelta.Audio
    | StepDelta.Document
    | StepDelta.Video
    | StepDelta.ThoughtSummary
    | StepDelta.ThoughtSignature
    | StepDelta.TextAnnotationDelta
    | StepDelta.ArgumentsDelta;

  event_type: 'step.delta';

  index: number;

  /**
   * The event_id token to be used to resume the interaction stream, from this event.
   */
  event_id?: string;
}

export namespace StepDelta {
  export interface Text {
    text: string;

    type: 'text';
  }

  export interface Image {
    type: 'image';

    data?: string;

    mime_type?:
      | 'image/png'
      | 'image/jpeg'
      | 'image/webp'
      | 'image/heic'
      | 'image/heif'
      | 'image/gif'
      | 'image/bmp'
      | 'image/tiff';

    /**
     * The resolution of the media.
     */
    resolution?: 'low' | 'medium' | 'high' | 'ultra_high';

    uri?: string;
  }

  export interface Audio {
    type: 'audio';

    /**
     * The number of audio channels.
     */
    channels?: number;

    data?: string;

    mime_type?:
      | 'audio/wav'
      | 'audio/mp3'
      | 'audio/aiff'
      | 'audio/aac'
      | 'audio/ogg'
      | 'audio/flac'
      | 'audio/mpeg'
      | 'audio/m4a'
      | 'audio/l16'
      | 'audio/opus'
      | 'audio/alaw'
      | 'audio/mulaw';

    /**
     * @deprecated Deprecated. Use sample_rate instead. The value is ignored.
     */
    rate?: number;

    /**
     * The sample rate of the audio.
     */
    sample_rate?: number;

    uri?: string;
  }

  export interface Document {
    type: 'document';

    data?: string;

    mime_type?: 'application/pdf';

    uri?: string;
  }

  export interface Video {
    type: 'video';

    data?: string;

    mime_type?:
      | 'video/mp4'
      | 'video/mpeg'
      | 'video/mpg'
      | 'video/mov'
      | 'video/avi'
      | 'video/x-flv'
      | 'video/webm'
      | 'video/wmv'
      | 'video/3gpp';

    /**
     * The resolution of the media.
     */
    resolution?: 'low' | 'medium' | 'high' | 'ultra_high';

    uri?: string;
  }

  export interface ThoughtSummary {
    type: 'thought_summary';

    /**
     * A new summary item to be added to the thought.
     */
    content?: InteractionsAPI.TextContent | InteractionsAPI.ImageContent;
  }

  export interface ThoughtSignature {
    type: 'thought_signature';

    /**
     * Signature to match the backend source to be part of the generation.
     */
    signature?: string;
  }

  export interface TextAnnotationDelta {
    type: 'text_annotation_delta';

    /**
     * Citation information for model-generated content.
     */
    annotations?: Array<InteractionsAPI.Annotation>;
  }

  export interface ArgumentsDelta {
    type: 'arguments_delta';

    partial_arguments?: string;
  }
}

export interface StepStart {
  event_type: 'step.start';

  index: number;

  /**
   * A step in the interaction.
   */
  step: Step;

  /**
   * The event_id token to be used to resume the interaction stream, from this event.
   */
  event_id?: string;
}

export interface StepStop {
  event_type: 'step.stop';

  index: number;

  /**
   * The event_id token to be used to resume the interaction stream, from this event.
   */
  event_id?: string;
}

/**
 * A text content block.
 */
export interface TextContent {
  /**
   * Required. The text content.
   */
  text: string;

  type: 'text';

  /**
   * Citation information for model-generated content.
   */
  annotations?: Array<Annotation>;
}

/**
 * Configuration for text output format.
 */
export interface TextResponseFormat {
  type: 'text';

  /**
   * The MIME type of the text output.
   */
  mimeType?: 'application/json' | 'text/plain';

  /**
   * The JSON schema that the output should conform to. Only applicable when
   * mime_type is application/json.
   */
  schema?: { [key: string]: unknown };
}

export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high';

/**
 * A thought step.
 */
export interface ThoughtStep {
  type: 'thought';

  /**
   * A signature hash for backend validation.
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
  | Tool.CodeExecution
  | Tool.URLContext
  | Tool.ComputerUse
  | Tool.MCPServer
  | Tool.GoogleSearch
  | Tool.FileSearch
  | Tool.GoogleMaps
  | Tool.Retrieval;

export namespace Tool {
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
     * The full URL for the MCPServer endpoint. Example: "https://api.example.com/mcp"
     */
    url?: string;
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

  /**
   * A tool that can be used by the model to call Google Maps.
   */
  export interface GoogleMaps {
    type: 'google_maps';

    /**
     * Whether to return a widget context token in the tool call result of the
     * response.
     */
    enable_widget?: boolean;

    /**
     * The latitude of the user's location.
     */
    latitude?: number;

    /**
     * The longitude of the user's location.
     */
    longitude?: number;
  }

  /**
   * A tool that can be used by the model to retrieve files.
   */
  export interface Retrieval {
    type: 'retrieval';

    /**
     * The types of file retrieval to enable.
     */
    retrieval_types?: Array<'vertex_ai_search'>;

    /**
     * Used to specify configuration for VertexAISearch.
     */
    vertex_ai_search_config?: Retrieval.VertexAISearchConfig;
  }

  export namespace Retrieval {
    /**
     * Used to specify configuration for VertexAISearch.
     */
    export interface VertexAISearchConfig {
      /**
       * Optional. Used to specify Vertex AI Search datastores.
       */
      datastores?: Array<string>;

      /**
       * Optional. Used to specify Vertex AI Search engine.
       */
      engine?: string;
    }
  }
}

/**
 * The tool choice configuration containing allowed tools.
 */
export interface ToolChoiceConfig {
  /**
   * The allowed tools.
   */
  allowed_tools?: AllowedTools;
}

export type ToolChoiceType = 'auto' | 'any' | 'none' | 'validated';

/**
 * A URL citation annotation.
 */
export interface URLCitation {
  type: 'url_citation';

  /**
   * End of the attributed segment, exclusive.
   */
  end_index?: number;

  /**
   * Start of segment of the response that is attributed to this source.
   *
   * Index indicates the start of the segment, measured in bytes.
   */
  start_index?: number;

  /**
   * The title of the URL.
   */
  title?: string;

  /**
   * The URL.
   */
  url?: string;
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
 * URL context call step.
 */
export interface URLContextCallStep {
  /**
   * Required. A unique ID for this specific tool call.
   */
  id: string;

  /**
   * Required. The arguments to pass to the URL context.
   */
  arguments: URLContextCallStep.Arguments;

  type: 'url_context_call';

  /**
   * A signature hash for backend validation.
   */
  signature?: string;
}

export namespace URLContextCallStep {
  /**
   * Required. The arguments to pass to the URL context.
   */
  export interface Arguments {
    /**
     * The URLs to fetch.
     */
    urls?: Array<string>;
  }
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
 * URL context result step.
 */
export interface URLContextResultStep {
  /**
   * Required. ID to match the ID from the function call block.
   */
  call_id: string;

  /**
   * Required. The results of the URL context.
   */
  result: Array<URLContextResultStep.Result>;

  type: 'url_context_result';

  /**
   * Whether the URL context resulted in an error.
   */
  is_error?: boolean;

  /**
   * A signature hash for backend validation.
   */
  signature?: string;
}

export namespace URLContextResultStep {
  /**
   * The result of the URL context.
   */
  export interface Result {
    /**
     * The status of the URL retrieval.
     */
    status?: 'success' | 'error' | 'paywall' | 'unsafe';

    /**
     * The URL that was fetched.
     */
    url?: string;
  }
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
   * Grounding tool count.
   */
  grounding_tool_count?: Array<Usage.GroundingToolCount>;

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
  total_thought_tokens?: number;

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
    modality?: 'text' | 'image' | 'audio' | 'video' | 'document';

    /**
     * Number of tokens for the modality.
     */
    tokens?: number;
  }

  /**
   * The number of grounding tool counts.
   */
  export interface GroundingToolCount {
    /**
     * The number of grounding tool counts.
     */
    count?: number;

    /**
     * The grounding tool type associated with the count.
     */
    type?: 'google_search' | 'google_maps' | 'retrieval';
  }

  /**
   * The token count for a single response modality.
   */
  export interface InputTokensByModality {
    /**
     * The modality associated with the token count.
     */
    modality?: 'text' | 'image' | 'audio' | 'video' | 'document';

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
    modality?: 'text' | 'image' | 'audio' | 'video' | 'document';

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
    modality?: 'text' | 'image' | 'audio' | 'video' | 'document';

    /**
     * Number of tokens for the modality.
     */
    tokens?: number;
  }
}

/**
 * Input provided by the user.
 */
export interface UserInputStep {
  type: 'user_input';

  content?: Array<Content>;
}

/**
 * A video content block.
 */
export interface VideoContent {
  type: 'video';

  /**
   * The video content.
   */
  data?: string;

  /**
   * The mime type of the video.
   */
  mime_type?:
    | 'video/mp4'
    | 'video/mpeg'
    | 'video/mpg'
    | 'video/mov'
    | 'video/avi'
    | 'video/x-flv'
    | 'video/webm'
    | 'video/wmv'
    | 'video/3gpp';

  /**
   * The resolution of the media.
   */
  resolution?: 'low' | 'medium' | 'high' | 'ultra_high';

  /**
   * The URI of the video.
   */
  uri?: string;
}

/**
 * Configuration for video output format.
 */
export interface VideoResponseFormat {
  type: 'video';
}

/**
 * Message for configuring webhook events for a request.
 */
export interface WebhookConfig {
  /**
   * Optional. If set, these webhook URIs will be used for webhook events instead of
   * the registered webhooks.
   */
  uris?: Array<string>;

  /**
   * Optional. The user metadata that will be returned on each event emission to the
   * webhooks.
   */
  user_metadata?: { [key: string]: unknown };
}

export type InteractionDeleteResponse = unknown;

export type InteractionCreateParams =
  | CreateModelInteractionParamsNonStreaming
  | CreateModelInteractionParamsStreaming
  | CreateAgentInteractionParamsNonStreaming
  | CreateAgentInteractionParamsStreaming;

export interface BaseCreateModelInteractionParams {
  /**
   * Path param: Which version of the API to use.
   */
  api_version?: string;

  /**
   * Body param: The input for the interaction.
   */
  input:
    | string
    | Array<Step>
    | Array<Content>
    | TextContent
    | ImageContent
    | AudioContent
    | DocumentContent
    | VideoContent;

  /**
   * Body param: The name of the `Model` used for generating the interaction.
   */
  model: Model;

  /**
   * Body param: Input only. Whether to run the model interaction in the background.
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
   * Body param: Enforces that the generated response is a JSON object that complies
   * with the JSON schema specified in this field.
   */
  response_format?:
    | Array<AudioResponseFormat | TextResponseFormat | ImageResponseFormat | VideoResponseFormat | unknown>
    | AudioResponseFormat
    | TextResponseFormat
    | ImageResponseFormat
    | VideoResponseFormat
    | unknown;

  /**
   * Body param: The mime type of the response. This is required if response_format
   * is set.
   */
  response_mime_type?: string;

  /**
   * Body param: The requested modalities of the response (TEXT, IMAGE, AUDIO).
   */
  response_modalities?: Array<'text' | 'image' | 'audio' | 'video' | 'document'>;

  /**
   * Body param: The service tier for the interaction.
   */
  service_tier?: 'flex' | 'standard' | 'priority';

  /**
   * Body param: Input only. Whether to store the response and request for later
   * retrieval.
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

  /**
   * Body param: Optional. Webhook configuration for receiving notifications when the
   * interaction completes.
   */
  webhook_config?: WebhookConfig;
}

export interface BaseCreateAgentInteractionParams {
  /**
   * Path param: Which version of the API to use.
   */
  api_version?: string;

  /**
   * Body param: The name of the `Agent` used for generating the interaction.
   */
  agent:
    | 'deep-research-pro-preview-12-2025'
    | 'deep-research-preview-04-2026'
    | 'deep-research-max-preview-04-2026'
    | (string & {});

  /**
   * Body param: The input for the interaction.
   */
  input:
    | string
    | Array<Step>
    | Array<Content>
    | TextContent
    | ImageContent
    | AudioContent
    | DocumentContent
    | VideoContent;

  /**
   * Body param: Configuration parameters for the agent interaction.
   */
  agent_config?: DynamicAgentConfig | DeepResearchAgentConfig;

  /**
   * Body param: Input only. Whether to run the model interaction in the background.
   */
  background?: boolean;

  /**
   * Body param: The ID of the previous interaction, if any.
   */
  previous_interaction_id?: string;

  /**
   * Body param: Enforces that the generated response is a JSON object that complies
   * with the JSON schema specified in this field.
   */
  response_format?:
    | Array<AudioResponseFormat | TextResponseFormat | ImageResponseFormat | VideoResponseFormat | unknown>
    | AudioResponseFormat
    | TextResponseFormat
    | ImageResponseFormat
    | VideoResponseFormat
    | unknown;

  /**
   * Body param: The mime type of the response. This is required if response_format
   * is set.
   */
  response_mime_type?: string;

  /**
   * Body param: The requested modalities of the response (TEXT, IMAGE, AUDIO).
   */
  response_modalities?: Array<'text' | 'image' | 'audio' | 'video' | 'document'>;

  /**
   * Body param: The service tier for the interaction.
   */
  service_tier?: 'flex' | 'standard' | 'priority';

  /**
   * Body param: Input only. Whether to store the response and request for later
   * retrieval.
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

  /**
   * Body param: Optional. Webhook configuration for receiving notifications when the
   * interaction completes.
   */
  webhook_config?: WebhookConfig;
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
   * Query param: If set to true, includes the input in the response.
   */
  include_input?: boolean;

  /**
   * Query param: Optional. If set, resumes the interaction stream from the next
   * chunk after the event marked by the event id. Can only be used if `stream` is
   * true.
   */
  last_event_id?: string;

  /**
   * Query param: If set to true, the generated content will be streamed
   * incrementally.
   */
  stream?: boolean;
}

export namespace InteractionGetParams {
  export type InteractionGetParamsNonStreaming = InteractionsAPI.InteractionGetParamsNonStreaming;
  export type InteractionGetParamsStreaming = InteractionsAPI.InteractionGetParamsStreaming;
}

export interface InteractionGetParamsNonStreaming extends InteractionGetParamsBase {
  /**
   * Query param: If set to true, the generated content will be streamed
   * incrementally.
   */
  stream?: false;
}

export interface InteractionGetParamsStreaming extends InteractionGetParamsBase {
  /**
   * Query param: If set to true, the generated content will be streamed
   * incrementally.
   */
  stream: true;
}

export declare namespace Interactions {
  export {
    type AllowedTools as AllowedTools,
    type Annotation as Annotation,
    type AudioContent as AudioContent,
    type AudioResponseFormat as AudioResponseFormat,
    type CodeExecutionCallArguments as CodeExecutionCallArguments,
    type CodeExecutionCallStep as CodeExecutionCallStep,
    type CodeExecutionResultStep as CodeExecutionResultStep,
    type Content as Content,
    type DeepResearchAgentConfig as DeepResearchAgentConfig,
    type DocumentContent as DocumentContent,
    type DynamicAgentConfig as DynamicAgentConfig,
    type ErrorEvent as ErrorEvent,
    type FileCitation as FileCitation,
    type FileSearchCallStep as FileSearchCallStep,
    type FileSearchResultStep as FileSearchResultStep,
    type Function as Function,
    type FunctionCallStep as FunctionCallStep,
    type FunctionResultStep as FunctionResultStep,
    type GenerationConfig as GenerationConfig,
    type GoogleMapsCallArguments as GoogleMapsCallArguments,
    type GoogleMapsCallStep as GoogleMapsCallStep,
    type GoogleMapsResult as GoogleMapsResult,
    type GoogleMapsResultStep as GoogleMapsResultStep,
    type GoogleSearchCallArguments as GoogleSearchCallArguments,
    type GoogleSearchCallStep as GoogleSearchCallStep,
    type GoogleSearchResult as GoogleSearchResult,
    type GoogleSearchResultStep as GoogleSearchResultStep,
    type ImageConfig as ImageConfig,
    type ImageContent as ImageContent,
    type ImageResponseFormat as ImageResponseFormat,
    type Interaction as Interaction,
    type InteractionCompletedEvent as InteractionCompletedEvent,
    type InteractionCreatedEvent as InteractionCreatedEvent,
    type InteractionSSEEvent as InteractionSSEEvent,
    type InteractionStatusUpdate as InteractionStatusUpdate,
    type MCPServerToolCallStep as MCPServerToolCallStep,
    type MCPServerToolResultStep as MCPServerToolResultStep,
    type Model as Model,
    type ModelOutputStep as ModelOutputStep,
    type PlaceCitation as PlaceCitation,
    type SpeechConfig as SpeechConfig,
    type Step as Step,
    type StepDelta as StepDelta,
    type StepStart as StepStart,
    type StepStop as StepStop,
    type TextContent as TextContent,
    type TextResponseFormat as TextResponseFormat,
    type ThinkingLevel as ThinkingLevel,
    type ThoughtStep as ThoughtStep,
    type Tool as Tool,
    type ToolChoiceConfig as ToolChoiceConfig,
    type ToolChoiceType as ToolChoiceType,
    type URLCitation as URLCitation,
    type URLContextCallArguments as URLContextCallArguments,
    type URLContextCallStep as URLContextCallStep,
    type URLContextResult as URLContextResult,
    type URLContextResultStep as URLContextResultStep,
    type Usage as Usage,
    type UserInputStep as UserInputStep,
    type VideoContent as VideoContent,
    type VideoResponseFormat as VideoResponseFormat,
    type WebhookConfig as WebhookConfig,
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
