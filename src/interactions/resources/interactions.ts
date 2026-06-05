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
import {
  LegacyLyriaStream,
  coerceLegacyInteractionResponse,
  isLegacyLyriaRequest,
  isVertexClient,
} from '../internal/legacy-lyria.js';
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
    const needsLegacyLyriaShim = isLegacyLyriaRequest({
      isVertex: isVertexClient(this._client),
      model: 'model' in body ? body.model : undefined,
    });
    const isStreaming = params.stream ?? false;
    const promise = this._client.post(path`/${api_version}/interactions`, {
      body,
      ...options,
      stream: isStreaming,
      ...(needsLegacyLyriaShim && isStreaming ? { __streamClass: LegacyLyriaStream } : {}),
    });

    if (isStreaming) {
      return promise as APIPromise<Stream<InteractionSSEEvent>>;
    }

    let nonStreaming = promise as APIPromise<Interaction>;
    if (needsLegacyLyriaShim) {
      nonStreaming = nonStreaming._thenUnwrap((data) => coerceLegacyInteractionResponse(data) as Interaction);
    }
    return nonStreaming._thenUnwrap(addOutputProperties);
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
    return (
      this._client.post(path`/${api_version}/interactions/${id}/cancel`, options) as APIPromise<Interaction>
    )._thenUnwrap(addOutputProperties);
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
    const response = this._client.get(path`/${api_version}/interactions/${id}`, {
      query,
      ...options,
      stream: params?.stream ?? false,
    });

    if (params?.stream) {
      return response as APIPromise<Stream<InteractionSSEEvent>>;
    }

    return (response as APIPromise<Interaction>)._thenUnwrap(addOutputProperties);
  }
}
export class Interactions extends BaseInteractions {}

function addOutputProperties(interaction: Interaction): Interaction {
  const steps = interaction.steps ?? [];

  // output_text: scan backwards across all steps (stopping at user_input),
  // skip non-text content until the first text item is found, then collect
  // text until a non-text barrier is hit.
  const textParts: string[] = [];
  let collecting = false;
  outer: for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i]!;
    if (step.type === 'user_input') break;
    if (step.type !== 'model_output' || !step.content) {
      if (collecting) break outer;
      continue;
    }
    const content = step.content;
    for (let j = content.length - 1; j >= 0; j--) {
      const item = content[j]!;
      if (item.type === 'text') {
        collecting = true;
        textParts.push(item.text ?? '');
      } else if (collecting) {
        // Hit a non-text barrier after we started collecting.
        break outer;
      }
    }
  }
  const output_text = textParts.reverse().join('');

  let output_image: ImageContent | undefined;
  let output_audio: AudioContent | undefined;
  let output_video: VideoContent | undefined;

  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i]!;
    const anyStep = step as any;
    if (anyStep.type === 'user_input') {
      break;
    }
    if (anyStep.type === 'model_output' && anyStep.content) {
      for (let j = anyStep.content.length - 1; j >= 0; j--) {
        const content = anyStep.content[j]!;
        if (content.type === 'image' && !output_image) {
          output_image = content as any;
        }
        if (content.type === 'audio' && !output_audio) {
          output_audio = content as any;
        }
        if (content.type === 'video' && !output_video) {
          output_video = content as any;
        }
      }
    }
  }

  return {
    ...interaction,
    ...(output_text && { output_text }),
    ...(output_image && { output_image }),
    ...(output_audio && { output_audio }),
    ...(output_video && { output_video }),
  };
}

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
export type Annotation = FileCitation | PlaceCitation | URLCitation;

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
  bit_rate?: number;

  /**
   * The delivery mode for the audio output.
   */
  delivery?: 'inline' | 'uri';

  /**
   * The MIME type of the audio output.
   */
  mime_type?: 'audio/mp3' | 'audio/ogg_opus' | 'audio/l16' | 'audio/wav' | 'audio/alaw' | 'audio/mulaw';

  /**
   * Sample rate in Hz.
   */
  sample_rate?: number;
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
   * Enables bigquery tool for the Deep Research agent.
   */
  enable_bigquery_tool?: boolean;

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
  mime_type?: 'application/pdf' | 'text/csv';

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

/**
 * Configuration for a custom environment.
 */
export interface Environment {
  type: 'remote';

  /**
   * Network configuration for the environment.
   */
  network?: 'disabled' | Environment.Allowlist;

  sources?: Array<Environment.Source>;
}

export namespace Environment {
  /**
   * Outbound networking configuration for the sandbox. When specified, restricts
   * which external domains the sandbox can reach. Omit entirely to allow all
   * outbound traffic with no header injection.
   */
  export interface Allowlist {
    /**
     * List of allowed outbound domains. Only requests to listed domains are permitted.
     * Use [{'domain': '*'}] to allow all domains while still injecting headers on
     * specific ones.
     */
    allowlist?: Array<Allowlist.Allowlist>;
  }

  export namespace Allowlist {
    /**
     * A single domain allowlist rule with optional header injection.
     */
    export interface Allowlist {
      /**
       * Domain to allow outbound requests to. Supports wildcards (e.g.
       * '_.googleapis.com'). Use '_' to allow all domains.
       */
      domain: string;

      /**
       * Headers to inject on all outbound requests matching this domain. Each entry is a
       * flat {header_name: header_value} object. The egress proxy injects these
       * automatically.
       */
      transform?: Array<{ [key: string]: string }>;
    }
  }

  /**
   * A source to be mounted into the environment.
   */
  export interface Source {
    /**
     * The inline content if `type` is `INLINE`.
     */
    content?: string;

    /**
     * Optional encoding for inline content (e.g. `base64`).
     */
    encoding?: string;

    /**
     * The source of the environment. For GCS, this is the GCS path. For GitHub, this
     * is the GitHub path.
     */
    source?: string;

    /**
     * Where the source should appear in the environment.
     */
    target?: string;

    type?: 'gcs' | 'inline' | 'repository' | 'skill_registry';
  }
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

  /**
   * Optional metadata accompanying ANY streamed event.
   */
  metadata?: ErrorEvent.Metadata;
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

  /**
   * Optional metadata accompanying ANY streamed event.
   */
  export interface Metadata {
    /**
     * Statistics on the interaction request's token usage.
     */
    usage?: InteractionsAPI.Usage;
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
  result: Array<Content> | Array<ImageContent | TextContent> | string;

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

/**
 * Configuration parameters for model interactions.
 */
export interface GenerationConfig {
  /**
   * @deprecated Configuration for image interaction.
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
  tool_choice?: ToolChoiceConfig | ToolChoiceType;

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

  /**
   * The delivery mode for the image output.
   */
  delivery?: 'inline' | 'uri';

  /**
   * The size of the image output.
   */
  image_size?: '512' | '1K' | '2K' | '4K';

  /**
   * The MIME type of the image output.
   */
  mime_type?: 'image/jpeg';
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
  status:
    | 'in_progress'
    | 'requires_action'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'incomplete'
    | 'budget_exceeded';

  /**
   * Required. Output only. The steps that make up the interaction.
   */
  steps: Array<Step>;

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
    | 'antigravity-preview-05-2026'
    | (string & {});

  /**
   * Configuration parameters for the agent interaction.
   */
  agent_config?: DeepResearchAgentConfig | DynamicAgentConfig;

  /**
   * The environment configuration for the interaction. Can be an object specifying
   * remote environment sources or a string referencing an existing environment ID.
   */
  environment?: Environment | string;

  /**
   * Output only. The environment ID for the interaction. Only populated if
   * environment config is set in the request.
   */
  environment_id?: string;

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
    | Array<AudioResponseFormat | ImageResponseFormat | TextResponseFormat | unknown>
    | AudioResponseFormat
    | ImageResponseFormat
    | TextResponseFormat
    | unknown;

  /**
   * @deprecated The mime type of the response. This is required if response_format
   * is set.
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

  /**
   * Concatenated text from the last model output in response to the current request.
   *
   * Note: this is added by the SDK.
   */
  output_text?: string;

  /**
   * The last image generated by the model in response to the current request.
   *
   * Note: this is added by the SDK.
   */
  output_image?: ImageContent;

  /**
   * The last audio generated by the model in response to the current request.
   *
   * Note: this is added by the SDK.
   */
  output_audio?: AudioContent;

  /**
   * The last video generated by the model in response to the current request.
   *
   * Note: this is added by the SDK.
   */
  output_video?: VideoContent;
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

  /**
   * Optional metadata accompanying ANY streamed event.
   */
  metadata?: InteractionCompletedEvent.Metadata;
}

export namespace InteractionCompletedEvent {
  /**
   * Optional metadata accompanying ANY streamed event.
   */
  export interface Metadata {
    /**
     * Statistics on the interaction request's token usage.
     */
    usage?: InteractionsAPI.Usage;
  }
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

  /**
   * Optional metadata accompanying ANY streamed event.
   */
  metadata?: InteractionCreatedEvent.Metadata;
}

export namespace InteractionCreatedEvent {
  /**
   * Optional metadata accompanying ANY streamed event.
   */
  export interface Metadata {
    /**
     * Statistics on the interaction request's token usage.
     */
    usage?: InteractionsAPI.Usage;
  }
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

  status:
    | 'in_progress'
    | 'requires_action'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'incomplete'
    | 'budget_exceeded';

  /**
   * The event_id token to be used to resume the interaction stream, from this event.
   */
  event_id?: string;

  /**
   * Optional metadata accompanying ANY streamed event.
   */
  metadata?: InteractionStatusUpdate.Metadata;
}

export namespace InteractionStatusUpdate {
  /**
   * Optional metadata accompanying ANY streamed event.
   */
  export interface Metadata {
    /**
     * Statistics on the interaction request's token usage.
     */
    usage?: InteractionsAPI.Usage;
  }
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
  result: Array<Content> | unknown | Array<ImageContent | TextContent>;

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
  | 'gemini-3.1-flash-lite'
  | 'gemini-3.1-flash-lite-preview'
  | 'gemini-3.1-flash-tts-preview'
  | 'lyria-3-clip-preview'
  | 'lyria-3-pro-preview'
  | 'gemini-3.5-flash'
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
    | StepDelta.ArgumentsDelta
    | StepDelta.Audio
    | StepDelta.CodeExecutionCall
    | StepDelta.CodeExecutionResult
    | StepDelta.Document
    | StepDelta.FileSearchCall
    | StepDelta.FileSearchResult
    | StepDelta.FunctionResult
    | StepDelta.GoogleMapsCall
    | StepDelta.GoogleMapsResult
    | StepDelta.GoogleSearchCall
    | StepDelta.GoogleSearchResult
    | StepDelta.Image
    | StepDelta.MCPServerToolCall
    | StepDelta.MCPServerToolResult
    | StepDelta.TextAnnotationDelta
    | StepDelta.Text
    | StepDelta.ThoughtSignature
    | StepDelta.ThoughtSummary
    | StepDelta.URLContextCall
    | StepDelta.URLContextResult
    | StepDelta.Video;

  event_type: 'step.delta';

  index: number;

  /**
   * The event_id token to be used to resume the interaction stream, from this event.
   */
  event_id?: string;

  /**
   * Optional metadata accompanying ANY streamed event.
   */
  metadata?: StepDelta.Metadata;
}

export namespace StepDelta {
  export interface ArgumentsDelta {
    type: 'arguments_delta';

    arguments?: string;
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

  export interface CodeExecutionCall {
    /**
     * The arguments to pass to the code execution.
     */
    arguments: InteractionsAPI.CodeExecutionCallArguments;

    type: 'code_execution_call';

    /**
     * A signature hash for backend validation.
     */
    signature?: string;
  }

  export interface CodeExecutionResult {
    result: string;

    type: 'code_execution_result';

    is_error?: boolean;

    /**
     * A signature hash for backend validation.
     */
    signature?: string;
  }

  export interface Document {
    type: 'document';

    data?: string;

    mime_type?: 'application/pdf' | 'text/csv';

    uri?: string;
  }

  export interface FileSearchCall {
    type: 'file_search_call';

    /**
     * A signature hash for backend validation.
     */
    signature?: string;
  }

  export interface FileSearchResult {
    result: Array<unknown>;

    type: 'file_search_result';

    /**
     * A signature hash for backend validation.
     */
    signature?: string;
  }

  export interface FunctionResult {
    /**
     * Required. ID to match the ID from the function call block.
     */
    call_id: string;

    result:
      | Array<InteractionsAPI.Content>
      | Array<InteractionsAPI.ImageContent | InteractionsAPI.TextContent>
      | string;

    type: 'function_result';

    is_error?: boolean;

    name?: string;
  }

  export interface GoogleMapsCall {
    type: 'google_maps_call';

    /**
     * The arguments to pass to the Google Maps tool.
     */
    arguments?: InteractionsAPI.GoogleMapsCallArguments;

    /**
     * A signature hash for backend validation.
     */
    signature?: string;
  }

  export interface GoogleMapsResult {
    type: 'google_maps_result';

    /**
     * The results of the Google Maps.
     */
    result?: Array<InteractionsAPI.GoogleMapsResult>;

    /**
     * A signature hash for backend validation.
     */
    signature?: string;
  }

  export interface GoogleSearchCall {
    /**
     * The arguments to pass to Google Search.
     */
    arguments: InteractionsAPI.GoogleSearchCallArguments;

    type: 'google_search_call';

    /**
     * A signature hash for backend validation.
     */
    signature?: string;
  }

  export interface GoogleSearchResult {
    result: Array<InteractionsAPI.GoogleSearchResult>;

    type: 'google_search_result';

    is_error?: boolean;

    /**
     * A signature hash for backend validation.
     */
    signature?: string;
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

  export interface MCPServerToolCall {
    arguments: { [key: string]: unknown };

    name: string;

    server_name: string;

    type: 'mcp_server_tool_call';
  }

  export interface MCPServerToolResult {
    result:
      | Array<InteractionsAPI.Content>
      | Array<InteractionsAPI.ImageContent | InteractionsAPI.TextContent>
      | string;

    type: 'mcp_server_tool_result';

    name?: string;

    server_name?: string;
  }

  export interface TextAnnotationDelta {
    type: 'text_annotation_delta';

    /**
     * Citation information for model-generated content.
     */
    annotations?: Array<InteractionsAPI.Annotation>;
  }

  export interface Text {
    text: string;

    type: 'text';
  }

  export interface ThoughtSignature {
    type: 'thought_signature';

    /**
     * Signature to match the backend source to be part of the generation.
     */
    signature?: string;
  }

  export interface ThoughtSummary {
    type: 'thought_summary';

    /**
     * A new summary item to be added to the thought.
     */
    content?: InteractionsAPI.Content;
  }

  export interface URLContextCall {
    /**
     * The arguments to pass to the URL context.
     */
    arguments: InteractionsAPI.URLContextCallArguments;

    type: 'url_context_call';

    /**
     * A signature hash for backend validation.
     */
    signature?: string;
  }

  export interface URLContextResult {
    result: Array<InteractionsAPI.URLContextResult>;

    type: 'url_context_result';

    is_error?: boolean;

    /**
     * A signature hash for backend validation.
     */
    signature?: string;
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

  /**
   * Optional metadata accompanying ANY streamed event.
   */
  export interface Metadata {
    /**
     * Statistics on the interaction request's token usage.
     */
    usage?: InteractionsAPI.Usage;
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

  /**
   * Optional metadata accompanying ANY streamed event.
   */
  metadata?: StepStart.Metadata;
}

export namespace StepStart {
  /**
   * Optional metadata accompanying ANY streamed event.
   */
  export interface Metadata {
    /**
     * Statistics on the interaction request's token usage.
     */
    usage?: InteractionsAPI.Usage;
  }
}

export interface StepStop {
  event_type: 'step.stop';

  index: number;

  /**
   * The event_id token to be used to resume the interaction stream, from this event.
   */
  event_id?: string;

  /**
   * Optional metadata accompanying ANY streamed event.
   */
  metadata?: StepStop.Metadata;
}

export namespace StepStop {
  /**
   * Optional metadata accompanying ANY streamed event.
   */
  export interface Metadata {
    /**
     * Statistics on the interaction request's token usage.
     */
    usage?: InteractionsAPI.Usage;
  }
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
  mime_type?: 'application/json' | 'text/plain';

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
  summary?: Array<ImageContent | TextContent>;
}

/**
 * A tool that can be used by the model.
 */
export type Tool =
  | Tool.CodeExecution
  | Tool.ComputerUse
  | Tool.FileSearch
  | Function
  | Tool.GoogleMaps
  | Tool.GoogleSearch
  | Tool.MCPServer
  | Tool.Retrieval
  | Tool.URLContext;

export namespace Tool {
  /**
   * A tool that can be used by the model to execute code.
   */
  export interface CodeExecution {
    type: 'code_execution';
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
    excluded_predefined_functions?: Array<string>;
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
   * A tool that can be used by the model to retrieve files.
   */
  export interface Retrieval {
    type: 'retrieval';

    /**
     * Used to specify configuration for ExaAISearch.
     */
    exa_ai_search_config?: Retrieval.ExaAISearchConfig;

    /**
     * Used to specify configuration for ParallelAISearch.
     */
    parallel_ai_search_config?: Retrieval.ParallelAISearchConfig;

    /**
     * Used to specify configuration for RagStore.
     */
    rag_store_config?: Retrieval.RagStoreConfig;

    /**
     * The types of file retrieval to enable.
     */
    retrieval_types?: Array<'vertex_ai_search' | 'rag_store' | 'exa_ai_search' | 'parallel_ai_search'>;

    /**
     * Used to specify configuration for VertexAISearch.
     */
    vertex_ai_search_config?: Retrieval.VertexAISearchConfig;
  }

  export namespace Retrieval {
    /**
     * Used to specify configuration for ExaAISearch.
     */
    export interface ExaAISearchConfig {
      /**
       * Required. The API key for ExaAiSearch.
       */
      api_key: string;

      /**
       * Optional. This field can be used to pass any parameter from the Exa.ai Search
       * API.
       */
      custom_config?: { [key: string]: unknown };
    }

    /**
     * Used to specify configuration for ParallelAISearch.
     */
    export interface ParallelAISearchConfig {
      /**
       * Optional. The API key for ParallelAiSearch.
       */
      api_key?: string;

      /**
       * Optional. Custom configs for ParallelAiSearch.
       */
      custom_config?: { [key: string]: unknown };
    }

    /**
     * Used to specify configuration for RagStore.
     */
    export interface RagStoreConfig {
      /**
       * Optional. The representation of the rag source.
       */
      rag_resources?: Array<RagStoreConfig.RagResource>;

      /**
       * Optional. The retrieval config for the Rag query.
       */
      rag_retrieval_config?: RagStoreConfig.RagRetrievalConfig;

      /**
       * @deprecated Optional. Number of top k results to return from the selected
       * corpora.
       */
      similarity_top_k?: number;

      /**
       * @deprecated Optional. Only return results with vector distance smaller than the
       * threshold.
       */
      vector_distance_threshold?: number;
    }

    export namespace RagStoreConfig {
      /**
       * The definition of the Rag resource.
       */
      export interface RagResource {
        /**
         * Optional. RagCorpora resource name.
         */
        rag_corpus?: string;

        /**
         * Optional. rag_file_id. The files should be in the same rag_corpus set in
         * rag_corpus field.
         */
        rag_file_ids?: Array<string>;
      }

      /**
       * Optional. The retrieval config for the Rag query.
       */
      export interface RagRetrievalConfig {
        /**
         * Optional. Config for filters.
         */
        filter?: RagRetrievalConfig.Filter;

        /**
         * Optional. Config for Hybrid Search.
         */
        hybrid_search?: RagRetrievalConfig.HybridSearch;

        /**
         * Optional. Config for ranking and reranking.
         */
        ranking?: RagRetrievalConfig.Ranking;

        /**
         * Optional. The number of contexts to retrieve.
         */
        top_k?: number;
      }

      export namespace RagRetrievalConfig {
        /**
         * Optional. Config for filters.
         */
        export interface Filter {
          /**
           * Optional. String for metadata filtering.
           */
          metadata_filter?: string;

          /**
           * Optional. Only returns contexts with vector distance smaller than the threshold.
           */
          vector_distance_threshold?: number;

          /**
           * Optional. Only returns contexts with vector similarity larger than the
           * threshold.
           */
          vector_similarity_threshold?: number;
        }

        /**
         * Optional. Config for Hybrid Search.
         */
        export interface HybridSearch {
          /**
           * Optional. Alpha value controls the weight between dense and sparse vector search
           * results.
           */
          alpha?: number;
        }

        /**
         * Optional. Config for ranking and reranking.
         */
        export interface Ranking {
          ranking_config: 'rank_service';

          /**
           * Optional. The model name of the rank service.
           */
          model_name?: string;
        }
      }
    }

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

  /**
   * A tool that can be used by the model to fetch URL context.
   */
  export interface URLContext {
    type: 'url_context';
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
   * Body param: The environment configuration for the interaction. Can be an object
   * specifying remote environment sources or a string referencing an existing
   * environment ID.
   */
  environment?: Environment | string;

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
    | Array<AudioResponseFormat | ImageResponseFormat | TextResponseFormat | unknown>
    | AudioResponseFormat
    | ImageResponseFormat
    | TextResponseFormat
    | unknown;

  /**
   * @deprecated Body param: The mime type of the response. This is required if
   * response_format is set.
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
    | 'antigravity-preview-05-2026'
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
  agent_config?: DeepResearchAgentConfig | DynamicAgentConfig;

  /**
   * Body param: Input only. Whether to run the model interaction in the background.
   */
  background?: boolean;

  /**
   * Body param: The environment configuration for the interaction. Can be an object
   * specifying remote environment sources or a string referencing an existing
   * environment ID.
   */
  environment?: Environment | string;

  /**
   * Body param: The ID of the previous interaction, if any.
   */
  previous_interaction_id?: string;

  /**
   * Body param: Enforces that the generated response is a JSON object that complies
   * with the JSON schema specified in this field.
   */
  response_format?:
    | Array<AudioResponseFormat | ImageResponseFormat | TextResponseFormat | unknown>
    | AudioResponseFormat
    | ImageResponseFormat
    | TextResponseFormat
    | unknown;

  /**
   * @deprecated Body param: The mime type of the response. This is required if
   * response_format is set.
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
    type Environment as Environment,
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
