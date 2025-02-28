export declare enum AdapterSize {
    ADAPTER_SIZE_UNSPECIFIED = "ADAPTER_SIZE_UNSPECIFIED",
    ADAPTER_SIZE_ONE = "ADAPTER_SIZE_ONE",
    ADAPTER_SIZE_FOUR = "ADAPTER_SIZE_FOUR",
    ADAPTER_SIZE_EIGHT = "ADAPTER_SIZE_EIGHT",
    ADAPTER_SIZE_SIXTEEN = "ADAPTER_SIZE_SIXTEEN",
    ADAPTER_SIZE_THIRTY_TWO = "ADAPTER_SIZE_THIRTY_TWO"
}

/**
 * The ApiClient class is used to send requests to the Gemini API or Vertex AI
 * endpoints.
 */
declare class ApiClient {
    private readonly clientOptions;
    constructor(opts: ApiClientInitOptions);
    isVertexAI(): boolean;
    getProject(): string | undefined;
    getLocation(): string | undefined;
    getApiVersion(): string;
    getBaseUrl(): string;
    getRequestUrl(): string;
    getHeaders(): Record<string, string>;
    private getRequestUrlInternal;
    getBaseResourcePath(): string;
    getApiKey(): string | undefined;
    getWebsocketBaseUrl(): string;
    setBaseUrl(url: string): void;
    request(request: HttpRequest): Promise<HttpResponse>;
    private patchHttpOptions;
    requestStream(request: HttpRequest): Promise<any>;
    private includeExtraHttpOptionsToRequestInit;
    private unaryApiCall;
    private streamApiCall;
    processStreamResponse(response: Response): AsyncGenerator<any>;
    private apiCall;
    getDefaultHeaders(): Record<string, string>;
    private getHeadersInternal;
}

/**
 * Options for initializing the ApiClient. The ApiClient uses the parameters
 * for authentication purposes as well as to infer if SDK should send the
 * request to Vertex AI or Gemini API.
 */
declare interface ApiClientInitOptions {
    /**
     * The object used for adding authentication headers to API requests.
     */
    auth: Auth;
    /**
     * Optional. The Google Cloud project ID for Vertex AI users.
     * It is not the numeric project name.
     * If not provided, SDK will try to resolve it from runtime environment.
     */
    project?: string;
    /**
     * Optional. The Google Cloud project location for Vertex AI users.
     * If not provided, SDK will try to resolve it from runtime environment.
     */
    location?: string;
    /**
     * The API Key. This is required for Gemini API users.
     */
    apiKey?: string;
    /**
     * Optional. Set to true if you intend to call Vertex AI endpoints.
     * If unset, default SDK behavior is to call Gemini API.
     */
    vertexai?: boolean;
    /**
     * Optional. The API version for the endpoint.
     * If unset, SDK will choose a default api version.
     */
    apiVersion?: string;
    /**
     * Optional. A set of customizable configuration for HTTP requests.
     */
    httpOptions?: HttpOptions;
    /**
     * Optional. An extra string to append at the end of the User-Agent header.
     *
     * This can be used to e.g specify the runtime and its version.
     */
    userAgentExtra?: string;
}

/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * The Auth interface is used to authenticate with the API service.
 */
declare interface Auth {
    /**
     * Sets the headers needed to authenticate with the API service.
     *
     * @param headers - The Headers object that will be updated with the authentication headers.
     */
    addAuthHeaders(headers: Headers): Promise<void>;
}

/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
declare class BaseModule {
    [key: string]: any;
}

/**
 * Base pager class for iterating through paginated results.
 */
declare class BasePager<T> {
    private nameInternal;
    private pageInternal;
    private configInternal;
    private pageInternalSize;
    protected requestInternal: (config: any) => any;
    protected idxInternal: number;
    init(name: PagedItem, request: (config: any) => any, response: any, config: any): void;
    constructor(name: PagedItem, request: (config: any) => any, response: any, config: any);
    /**
     * Returns the current page, which is a list of items.
     *
     * The returned list of items is a subset of the entire list.
     */
    page(): T[];
    /**
     * Returns the type of paged item (for example, ``batch_jobs``).
     */
    name(): PagedItem;
    /**
     * Returns the length of the page fetched each time by this pager.
     *
     * The number of items in the page is less than or equal to the page length.
     */
    pageSize(): number;
    /**
     * Returns the configuration when making the API request for the next page.
     *
     * A configuration is a set of optional parameters and arguments that can be
     * used to customize the API request. For example, the ``pageToken`` parameter
     * contains the token to request the next page.
     */
    config(): any;
    /**
     * Returns the total number of items in the current page.
     */
    len(): number;
    /**
     * Returns the item at the given index.
     */
    getItem(index: number): T;
    /**
     * Initializes the next page from the response.
     *
     * This is an internal method that should be called by subclasses after
     * fetching the next page.
     */
    protected initNextPage(response: any): void;
}

/** Content blob. */
declare interface Blob_2 {
    /** Required. Raw bytes. */
    data?: string;
    /** Required. The IANA standard MIME type of the source data. */
    mimeType?: string;
}
export { Blob_2 as Blob }

export declare enum BlockedReason {
    BLOCKED_REASON_UNSPECIFIED = "BLOCKED_REASON_UNSPECIFIED",
    SAFETY = "SAFETY",
    OTHER = "OTHER",
    BLOCKLIST = "BLOCKLIST",
    PROHIBITED_CONTENT = "PROHIBITED_CONTENT"
}

/** A resource used in LLM queries for users to explicitly specify what to cache. */
export declare interface CachedContent {
    /** The server-generated resource name of the cached content. */
    name?: string;
    /** The user-generated meaningful display name of the cached content. */
    displayName?: string;
    /** The name of the publisher model to use for cached content. */
    model?: string;
    /** Creation time of the cache entry. */
    createTime?: string;
    /** When the cache entry was last updated in UTC time. */
    updateTime?: string;
    /** Expiration time of the cached content. */
    expireTime?: string;
    /** Metadata on the usage of the cached content. */
    usageMetadata?: CachedContentUsageMetadata;
}

/** Metadata on the usage of the cached content. */
export declare interface CachedContentUsageMetadata {
    /** Duration of audio in seconds. */
    audioDurationSeconds?: number;
    /** Number of images. */
    imageCount?: number;
    /** Number of text characters. */
    textCount?: number;
    /** Total number of tokens that the cached content consumes. */
    totalTokenCount?: number;
    /** Duration of video in seconds. */
    videoDurationSeconds?: number;
}

export declare class Caches extends BaseModule {
    private readonly apiClient;
    constructor(apiClient: ApiClient);
    /**
     * Lists cached content configurations.
     *
     * @example
     * ```ts
     * const cachedContents = await client.caches.list({config: {'pageSize': 2}});
     * for (const cachedContent of cachedContents) {
     *   console.log(cachedContent);
     * }
     * ```
     */
    list: (params?: types.ListCachedContentsParameters) => Promise<Pager<types.CachedContent>>;
    /**
     * Creates cached content, this call will initialize the cached content in
     * the data storage, and users need to pay for the cache data storage.
     *
     * @example
     * ```ts
     * const contents = ...; // Initialize the content to cache.
     * const response = await client.caches.create({
     *   model: 'gemini-1.5-flash',
     *   config: {
     *    'contents': contents,
     *    'displayName': 'test cache',
     *    'systemInstruction': 'What is the sum of the two pdfs?',
     *    'ttl': '86400s',
     *  }
     * });
     * ```
     */
    create(params: types.CreateCachedContentParameters): Promise<types.CachedContent>;
    /**
     * Gets cached content configurations.
     *
     * @example
     * ```ts
     * await client.caches.get({name: 'gemini-1.5-flash'});
     * ```
     */
    get(params: types.GetCachedContentParameters): Promise<types.CachedContent>;
    /**
     * Deletes cached content.
     *
     * @example
     * ```ts
     * await client.caches.delete({name: 'gemini-1.5-flash'});
     * ```
     */
    delete(params: types.DeleteCachedContentParameters): Promise<types.DeleteCachedContentResponse>;
    /**
     * Updates cached content configurations.
     *
     * @example
     * ```ts
     * const response = await client.caches.update({
     *   name: 'gemini-1.5-flash',
     *   config: {'ttl': '7600s'}
     * });
     * ```
     */
    update(params: types.UpdateCachedContentParameters): Promise<types.CachedContent>;
    private listInternal;
}

/** A response candidate generated from the model. */
export declare interface Candidate {
    /** Contains the multi-part content of the response.
     */
    content?: Content;
    /** Source attribution of the generated content.
     */
    citationMetadata?: CitationMetadata;
    /** Describes the reason the model stopped generating tokens.
     */
    finishMessage?: string;
    /** Number of tokens for this candidate.
     */
    tokenCount?: number;
    /** Output only. Average log probability score of the candidate. */
    avgLogprobs?: number;
    /** Output only. The reason why the model stopped generating tokens. If empty, the model has not stopped generating the tokens. */
    finishReason?: FinishReason;
    /** Output only. Metadata specifies sources used to ground generated content. */
    groundingMetadata?: GroundingMetadata;
    /** Output only. Index of the candidate. */
    index?: number;
    /** Output only. Log-likelihood scores for the response tokens and top tokens */
    logprobsResult?: LogprobsResult;
    /** Output only. List of ratings for the safety of a response candidate. There is at most one rating per category. */
    safetyRatings?: SafetyRating[];
}

/**
 * Chat session that enables sending messages and stores the chat history so
 * far.
 */
export declare class Chat {
    private readonly apiClient;
    private readonly modelsModule;
    private readonly model;
    private readonly config;
    private readonly curatedHistory;
    private sendPromise;
    constructor(apiClient: ApiClient, modelsModule: Models, model: string, config: types.GenerateContentConfig, curatedHistory: types.Content[]);
    /**
     * Sends a message to the model and returns the response.
     *
     * This method will wait for the previous message to be processed before
     * sending the next message.
     *
     * @see {@link Chat#sendMessageStream} for streaming method.
     * @param message The message to send.
     * @returns The model's response.
     */
    sendMessage(message: types.PartListUnion): Promise<types.GenerateContentResponse>;
    /**
     * Sends a message to the model and returns the response in chunks.
     *
     * This method will wait for the previous message to be processed before
     * sending the next message.
     *
     * @see {@link Chat#sendMessage} for non-streaming method.
     * @param message The message to send.
     * @returns The model's response.
     */
    sendMessageStream(message: types.PartListUnion): Promise<AsyncGenerator<types.GenerateContentResponse>>;
}

/**
 * A utility class to create a chat session.
 */
export declare class Chats {
    private readonly modelsModule;
    private readonly apiClient;
    constructor(modelsModule: Models, apiClient: ApiClient);
    /**
     * Creates a new chat session.
     *
     * @param model The model to use for the chat.
     * @param config The configuration to use for the generate content request.
     * @param history The initial history to use for the chat.
     * @returns A new chat session.
     */
    create(model: string, config?: types.GenerateContentConfig, history?: types.Content[]): Chat;
}

/** Source attributions for content. */
export declare interface Citation {
    /** Output only. End index into the content. */
    endIndex?: number;
    /** Output only. License of the attribution. */
    license?: string;
    /** Output only. Publication date of the attribution. */
    publicationDate?: GoogleTypeDate;
    /** Output only. Start index into the content. */
    startIndex?: number;
    /** Output only. Title of the attribution. */
    title?: string;
    /** Output only. Url reference of the attribution. */
    uri?: string;
}

/** Citation information when the model quotes another source. */
export declare interface CitationMetadata {
    /** Contains citation information when the model directly quotes, at
     length, from another source. Can include traditional websites and code
     repositories.
     */
    citations?: Citation[];
}

/** Result of executing the [ExecutableCode]. Always follows a `part` containing the [ExecutableCode]. */
export declare interface CodeExecutionResult {
    /** Required. Outcome of the code execution. */
    outcome?: Outcome;
    /** Optional. Contains stdout when code execution is successful, stderr or other description otherwise. */
    output?: string;
}

/** Optional parameters for computing tokens. */
export declare interface ComputeTokensConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
}

/** Parameters for computing tokens. */
export declare interface ComputeTokensParameters {
    /** ID of the model to use. For a list of models, see `Google models
     <https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models>`_. */
    model: string;
    /** Input content. */
    contents: ContentListUnion;
    /** Optional parameters for the request.
     */
    config?: ComputeTokensConfig;
}

/** Response for computing tokens. */
export declare class ComputeTokensResponse {
    /** Lists of tokens info from the input. A ComputeTokensRequest could have multiple instances with a prompt in each instance. We also need to return lists of tokens info for the request with multiple instances. */
    tokensInfo?: TokensInfo[];
}

/** Contains the multi-part content of a message. */
export declare interface Content {
    /** List of parts that constitute a single message. Each part may have
     a different IANA MIME type. */
    parts?: Part[];
    /** Optional. The producer of the content. Must be either 'user' or
     'model'. Useful to set for multi-turn conversations, otherwise can be
     left blank or unset. If role is not specified, SDK will determine the role. */
    role?: string;
}

/** The embedding generated from an input content. */
export declare interface ContentEmbedding {
    /** A list of floats representing an embedding.
     */
    values?: number[];
    /** Vertex API only. Statistics of the input text associated with this
     embedding.
     */
    statistics?: ContentEmbeddingStatistics;
}

/** Statistics of the input text associated with the result of content embedding. */
export declare interface ContentEmbeddingStatistics {
    /** Vertex API only. If the input text was truncated due to having
     a length longer than the allowed maximum input.
     */
    truncated?: boolean;
    /** Vertex API only. Number of tokens of the input text.
     */
    tokenCount?: number;
}

export declare type ContentListUnion = ContentUnion[] | ContentUnion;

/** @internal */
export declare function contentToMldev(apiClient: ApiClient, fromObject: types.Content, parentObject?: Record<string, unknown>): Record<string, unknown>;

/** @internal */
export declare function contentToVertex(apiClient: ApiClient, fromObject: types.Content, parentObject?: Record<string, unknown>): Record<string, unknown>;

export declare type ContentUnion = Content | PartUnion[] | PartUnion;

/** Configuration for a Control reference image. */
export declare interface ControlReferenceConfig {
    /** The type of control reference image to use. */
    controlType?: ControlReferenceType;
    /** Defaults to False. When set to True, the control image will be
     computed by the model based on the control type. When set to False,
     the control image must be provided by the user. */
    enableControlImageComputation?: boolean;
}

/** A control reference image.

 The image of the control reference image is either a control image provided
 by the user, or a regular image which the backend will use to generate a
 control image of. In the case of the latter, the
 enable_control_image_computation field in the config should be set to True.

 A control image is an image that represents a sketch image of areas for the
 model to fill in based on the prompt.
 */
export declare interface ControlReferenceImage {
    /** The reference image for the editing operation. */
    referenceImage?: Image_2;
    /** The id of the reference image. */
    referenceId?: number;
    /** The type of the reference image. Only set by the SDK. */
    referenceType?: string;
    /** Configuration for the control reference image. */
    config?: ControlReferenceConfig;
}

export declare enum ControlReferenceType {
    CONTROL_TYPE_DEFAULT = "CONTROL_TYPE_DEFAULT",
    CONTROL_TYPE_CANNY = "CONTROL_TYPE_CANNY",
    CONTROL_TYPE_SCRIBBLE = "CONTROL_TYPE_SCRIBBLE",
    CONTROL_TYPE_FACE_MESH = "CONTROL_TYPE_FACE_MESH"
}

/** Config for the count_tokens method. */
export declare interface CountTokensConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
    /** Instructions for the model to steer it toward better performance.
     */
    systemInstruction?: ContentUnion;
    /** Code that enables the system to interact with external systems to
     perform an action outside of the knowledge and scope of the model.
     */
    tools?: Tool[];
    /** Configuration that the model uses to generate the response. Not
     supported by the Gemini Developer API.
     */
    generationConfig?: GenerationConfig;
}

/** Parameters for counting tokens. */
export declare interface CountTokensParameters {
    /** ID of the model to use. For a list of models, see `Google models
     <https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models>`_. */
    model: string;
    /** Input content. */
    contents: ContentListUnion;
    /** Configuration for counting tokens. */
    config?: CountTokensConfig;
}

/** Response for counting tokens. */
export declare class CountTokensResponse {
    /** Total number of tokens. */
    totalTokens?: number;
    /** Number of tokens in the cached part of the prompt (the cached content). */
    cachedContentTokenCount?: number;
}

/** Optional configuration for cached content creation. */
export declare interface CreateCachedContentConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
    /** The TTL for this resource. The expiration time is computed: now + TTL. */
    ttl?: string;
    /** Timestamp of when this resource is considered expired. */
    expireTime?: string;
    /** The user-generated meaningful display name of the cached content.
     */
    displayName?: string;
    /** The content to cache.
     */
    contents?: ContentListUnion;
    /** Developer set system instruction.
     */
    systemInstruction?: ContentUnion;
    /** A list of `Tools` the model may use to generate the next response.
     */
    tools?: Tool[];
    /** Configuration for the tools to use. This config is shared for all tools.
     */
    toolConfig?: ToolConfig;
}

/** Parameters for caches.create method. */
export declare interface CreateCachedContentParameters {
    /** ID of the model to use. Example: gemini-1.5-flash */
    model: string;
    /** Configuration that contains optional parameters.
     */
    config?: CreateCachedContentConfig;
}

/** Used to override the default configuration. */
export declare interface CreateFileConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
}

/** Generates the parameters for the private _create method. */
export declare interface CreateFileParameters {
    /** The file to be uploaded.
     mime_type: (Required) The MIME type of the file. Must be provided.
     name: (Optional) The name of the file in the destination (e.g.
     'files/sample-image').
     display_name: (Optional) The display name of the file.
     */
    file: File_2;
    /** Used to override the default configuration. */
    config?: CreateFileConfig;
}

/** Response for the create file method. */
export declare class CreateFileResponse {
    /** Used to retain the full HTTP response. */
    sdkHttpResponse?: HttpResponse;
}

/**
 * create a Content object with a model role from a PartListUnion or string.
 */
export declare function createModelContent(partOrString: PartListUnion | string): Content;

/**
 * createPartFromBase64 creates a Part object from a base64 string.
 */
export declare function createPartFromBase64(data: string, mimeType: string): Part;

/**
 * createPartFromCodeExecutionResult creates a Part object from outcome and output of a code execution result.
 */
export declare function createPartFromCodeExecutionResult(outcome: Outcome, output: string): Part;

/**
 * createPartFromExecutableCode creates a Part object from code and language of an executable code.
 */
export declare function createPartFromExecutableCode(code: string, language: Language): Part;

/**
 * createPartFromFunctionCall creates a Part object from a function call.
 */
export declare function createPartFromFunctionCall(name: string, args: Record<string, any>): Part;

/**
 * createPartFromFunctionResponse creates a Part object from a function response.
 */
export declare function createPartFromFunctionResponse(id: string, name: string, response: Record<string, any>): Part;

/**
 * createPartFromText creates a Part object from a text.
 */
export declare function createPartFromText(text: string): Part;

/**
 * createPartFromUri creates a Part object from a URI.
 */
export declare function createPartFromUri(uri: string, mimeType: string): Part;

/**
 * createPartFromVideoMetadata creates a Part object from start and end offsets of a video metadata.
 */
export declare function createPartFromVideoMetadata(startOffset: string, endOffset: string): Part;

/** Supervised fine-tuning job creation request - optional fields. */
export declare interface CreateTuningJobConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
    /** Cloud Storage path to file containing training dataset for tuning. The dataset must be formatted as a JSONL file. */
    validationDataset?: TuningValidationDataset;
    /** The display name of the tuned Model. The name can be up to 128 characters long and can consist of any UTF-8 characters. */
    tunedModelDisplayName?: string;
    /** The description of the TuningJob */
    description?: string;
    /** Number of complete passes the model makes over the entire training dataset during training. */
    epochCount?: number;
    /** Multiplier for adjusting the default learning rate. */
    learningRateMultiplier?: number;
    /** Adapter size for tuning. */
    adapterSize?: AdapterSize;
    /** The batch size hyperparameter for tuning. If not set, a default of 4 or 16 will be used based on the number of training examples. */
    batchSize?: number;
    /** The learning rate hyperparameter for tuning. If not set, a default of 0.001 or 0.0002 will be calculated based on the number of training examples. */
    learningRate?: number;
}

/** Supervised fine-tuning job creation parameters - optional fields. */
export declare interface CreateTuningJobParameters {
    /** The base model that is being tuned, e.g., "gemini-1.0-pro-002". */
    baseModel: string;
    /** Cloud Storage path to file containing training dataset for tuning. The dataset must be formatted as a JSONL file. */
    trainingDataset: TuningDataset;
    /** Configuration for the tuning job. */
    config?: CreateTuningJobConfig;
}

/**
 * create a Content object with a user role from a PartListUnion or string.
 */
export declare function createUserContent(partOrString: PartListUnion | string): Content;

/** Distribution computed over a tuning dataset. */
export declare interface DatasetDistribution {
    /** Output only. Defines the histogram bucket. */
    buckets?: DatasetDistributionDistributionBucket[];
    /** Output only. The maximum of the population values. */
    max?: number;
    /** Output only. The arithmetic mean of the values in the population. */
    mean?: number;
    /** Output only. The median of the values in the population. */
    median?: number;
    /** Output only. The minimum of the population values. */
    min?: number;
    /** Output only. The 5th percentile of the values in the population. */
    p5?: number;
    /** Output only. The 95th percentile of the values in the population. */
    p95?: number;
    /** Output only. Sum of a given population of values. */
    sum?: number;
}

/** Dataset bucket used to create a histogram for the distribution given a population of values. */
export declare interface DatasetDistributionDistributionBucket {
    /** Output only. Number of values in the bucket. */
    count?: string;
    /** Output only. Left bound of the bucket. */
    left?: number;
    /** Output only. Right bound of the bucket. */
    right?: number;
}

/** Statistics computed over a tuning dataset. */
export declare interface DatasetStats {
    /** Output only. Number of billable characters in the tuning dataset. */
    totalBillableCharacterCount?: string;
    /** Output only. Number of tuning characters in the tuning dataset. */
    totalTuningCharacterCount?: string;
    /** Output only. Number of examples in the tuning dataset. */
    tuningDatasetExampleCount?: string;
    /** Output only. Number of tuning steps for this Tuning Job. */
    tuningStepCount?: string;
    /** Output only. Sample user messages in the training dataset uri. */
    userDatasetExamples?: Content[];
    /** Output only. Dataset distributions for the user input tokens. */
    userInputTokenDistribution?: DatasetDistribution;
    /** Output only. Dataset distributions for the messages per example. */
    userMessagePerExampleDistribution?: DatasetDistribution;
    /** Output only. Dataset distributions for the user output tokens. */
    userOutputTokenDistribution?: DatasetDistribution;
}

/** Optional parameters for caches.delete method. */
export declare interface DeleteCachedContentConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
}

/** Parameters for caches.delete method. */
export declare interface DeleteCachedContentParameters {
    /** The server-generated resource name of the cached content.
     */
    name: string;
    /** Optional parameters for the request.
     */
    config?: DeleteCachedContentConfig;
}

/** Empty response for caches.delete method. */
export declare class DeleteCachedContentResponse {
}

/** Statistics computed for datasets used for distillation. */
export declare interface DistillationDataStats {
    /** Output only. Statistics computed for the training dataset. */
    trainingDatasetStats?: DatasetStats;
}

/** Hyperparameters for Distillation. */
export declare interface DistillationHyperParameters {
    /** Optional. Adapter size for distillation. */
    adapterSize?: AdapterSize;
    /** Optional. Number of complete passes the model makes over the entire training dataset during training. */
    epochCount?: string;
    /** Optional. Multiplier for adjusting the default learning rate. */
    learningRateMultiplier?: number;
}

/** Tuning Spec for Distillation. */
export declare interface DistillationSpec {
    /** The base teacher model that is being distilled, e.g., "gemini-1.0-pro-002". */
    baseTeacherModel?: string;
    /** Optional. Hyperparameters for Distillation. */
    hyperParameters?: DistillationHyperParameters;
    /** Required. A path in a Cloud Storage bucket, which will be treated as the root output directory of the distillation pipeline. It is used by the system to generate the paths of output artifacts. */
    pipelineRootDirectory?: string;
    /** The student model that is being tuned, e.g., "google/gemma-2b-1.1-it". */
    studentModel?: string;
    /** Required. Cloud Storage path to file containing training dataset for tuning. The dataset must be formatted as a JSONL file. */
    trainingDatasetUri?: string;
    /** The resource name of the Tuned teacher model. Format: `projects/{project}/locations/{location}/models/{model}`. */
    tunedTeacherModelSource?: string;
    /** Optional. Cloud Storage path to file containing validation dataset for tuning. The dataset must be formatted as a JSONL file. */
    validationDatasetUri?: string;
}

/** Used to override the default configuration. */
export declare interface DownloadFileConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
}

/** Describes the options to customize dynamic retrieval. */
export declare interface DynamicRetrievalConfig {
    /** The mode of the predictor to be used in dynamic retrieval. */
    mode?: DynamicRetrievalConfigMode;
    /** Optional. The threshold to be used in dynamic retrieval. If not set, a system default value is used. */
    dynamicThreshold?: number;
}

export declare enum DynamicRetrievalConfigMode {
    MODE_UNSPECIFIED = "MODE_UNSPECIFIED",
    MODE_DYNAMIC = "MODE_DYNAMIC"
}

export declare interface EmbedContentConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
    /** Type of task for which the embedding will be used.
     */
    taskType?: string;
    /** Title for the text. Only applicable when TaskType is
     `RETRIEVAL_DOCUMENT`.
     */
    title?: string;
    /** Reduced dimension for the output embedding. If set,
     excessive values in the output embedding are truncated from the end.
     Supported by newer models since 2024 only. You cannot set this value if
     using the earlier model (`models/embedding-001`).
     */
    outputDimensionality?: number;
    /** Vertex API only. The MIME type of the input.
     */
    mimeType?: string;
    /** Vertex API only. Whether to silently truncate inputs longer than
     the max sequence length. If this option is set to false, oversized inputs
     will lead to an INVALID_ARGUMENT error, similar to other text APIs.
     */
    autoTruncate?: boolean;
}

/** Request-level metadata for the Vertex Embed Content API. */
export declare interface EmbedContentMetadata {
    /** Vertex API only. The total number of billable characters included
     in the request.
     */
    billableCharacterCount?: number;
}

/** Parameters for the embed_content method. */
export declare interface EmbedContentParameters {
    /** ID of the model to use. For a list of models, see `Google models
     <https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models>`_. */
    model: string;
    /** The content to embed. Only the `parts.text` fields will be counted.
     */
    contents: ContentListUnion;
    /** Configuration that contains optional parameters.
     */
    config?: EmbedContentConfig;
}

/** Response for the embed_content method. */
export declare class EmbedContentResponse {
    /** The embeddings for each request, in the same order as provided in
     the batch request.
     */
    embeddings?: ContentEmbedding[];
    /** Vertex API only. Metadata about the request.
     */
    metadata?: EmbedContentMetadata;
}

/** Represents a customer-managed encryption key spec that can be applied to a top-level resource. */
export declare interface EncryptionSpec {
    /** Required. The Cloud KMS resource identifier of the customer managed encryption key used to protect a resource. Has the form: `projects/my-project/locations/my-region/keyRings/my-kr/cryptoKeys/my-key`. The key needs to be in the same region as where the compute resource is created. */
    kmsKeyName?: string;
}

/** Code generated by the model that is meant to be executed, and the result returned to the model. Generated when using the [FunctionDeclaration] tool and [FunctionCallingConfig] mode is set to [Mode.CODE]. */
export declare interface ExecutableCode {
    /** Required. The code to be executed. */
    code?: string;
    /** Required. Programming language of the `code`. */
    language?: Language;
}

/** A file uploaded to the API. */
declare interface File_2 {
    /** The `File` resource name. The ID (name excluding the "files/" prefix) can contain up to 40 characters that are lowercase alphanumeric or dashes (-). The ID cannot start or end with a dash. If the name is empty on create, a unique name will be generated. Example: `files/123-456` */
    name?: string;
    /** Optional. The human-readable display name for the `File`. The display name must be no more than 512 characters in length, including spaces. Example: 'Welcome Image' */
    displayName?: string;
    /** Output only. MIME type of the file. */
    mimeType?: string;
    /** Output only. Size of the file in bytes. */
    sizeBytes?: number;
    /** Output only. The timestamp of when the `File` was created. */
    createTime?: string;
    /** Output only. The timestamp of when the `File` will be deleted. Only set if the `File` is scheduled to expire. */
    expirationTime?: string;
    /** Output only. The timestamp of when the `File` was last updated. */
    updateTime?: string;
    /** Output only. SHA-256 hash of the uploaded bytes. */
    sha256Hash?: string;
    /** Output only. The URI of the `File`. */
    uri?: string;
    /** Output only. The URI of the `File`, only set for downloadable (generated) files. */
    downloadUri?: string;
    /** Output only. Processing state of the File. */
    state?: FileState;
    /** Output only. The source of the `File`. */
    source?: FileSource;
    /** Output only. Metadata for a video. */
    videoMetadata?: Record<string, any>;
    /** Output only. Error status if File processing failed. */
    error?: FileStatus;
}
export { File_2 as File }

/** URI based data. */
export declare interface FileData {
    /** Required. URI. */
    fileUri?: string;
    /** Required. The IANA standard MIME type of the source data. */
    mimeType?: string;
}

declare class Files extends BaseModule {
    private readonly apiClient;
    constructor(apiClient: ApiClient);
    /**
     * This method lists all files from the service.
     *
     * @param params - The parameters for the list request
     * @returns The paginated results of the list of files
     *
     * @example
     * The following code prints the names of all files from the service, the
     * szie of each page is 2.
     *
     * const listResponse = await client.files.list({config: {'pageSize': 2}});
     * for await (const file of listResponse) {
     *   console.log(file.name());
     * }
     */
    list: (params?: types.ListFilesParameters) => Promise<Pager<types.File>>;
    private listInternal;
    private createInternal;
    get(params: types.GetFileParameters): Promise<types.File>;
}

export declare enum FileSource {
    SOURCE_UNSPECIFIED = "SOURCE_UNSPECIFIED",
    UPLOADED = "UPLOADED",
    GENERATED = "GENERATED"
}

export declare enum FileState {
    STATE_UNSPECIFIED = "STATE_UNSPECIFIED",
    PROCESSING = "PROCESSING",
    ACTIVE = "ACTIVE",
    FAILED = "FAILED"
}

/** Status of a File that uses a common error model. */
export declare interface FileStatus {
    /** A list of messages that carry the error details. There is a common set of message types for APIs to use. */
    details?: Record<string, any>[];
    /** A list of messages that carry the error details. There is a common set of message types for APIs to use. */
    message?: string;
    /** The status code. 0 for OK, 1 for CANCELLED */
    code?: number;
}

export declare enum FinishReason {
    FINISH_REASON_UNSPECIFIED = "FINISH_REASON_UNSPECIFIED",
    STOP = "STOP",
    MAX_TOKENS = "MAX_TOKENS",
    SAFETY = "SAFETY",
    RECITATION = "RECITATION",
    OTHER = "OTHER",
    BLOCKLIST = "BLOCKLIST",
    PROHIBITED_CONTENT = "PROHIBITED_CONTENT",
    SPII = "SPII",
    MALFORMED_FUNCTION_CALL = "MALFORMED_FUNCTION_CALL"
}

/** A function call. */
export declare interface FunctionCall {
    /** The unique id of the function call. If populated, the client to execute the
     `function_call` and return the response with the matching `id`. */
    id?: string;
    /** Optional. Required. The function parameters and values in JSON object format. See [FunctionDeclaration.parameters] for parameter details. */
    args?: Record<string, any>;
    /** Required. The name of the function to call. Matches [FunctionDeclaration.name]. */
    name?: string;
}

/** Function calling config. */
export declare interface FunctionCallingConfig {
    /** Optional. Function calling mode. */
    mode?: FunctionCallingConfigMode;
    /** Optional. Function names to call. Only set when the Mode is ANY. Function names should match [FunctionDeclaration.name]. With mode set to ANY, model will predict a function call from the set of function names provided. */
    allowedFunctionNames?: string[];
}

export declare enum FunctionCallingConfigMode {
    MODE_UNSPECIFIED = "MODE_UNSPECIFIED",
    AUTO = "AUTO",
    ANY = "ANY",
    NONE = "NONE"
}

/** Defines a function that the model can generate JSON inputs for.

 The inputs are based on `OpenAPI 3.0 specifications
 <https://spec.openapis.org/oas/v3.0.3>`_.
 */
export declare interface FunctionDeclaration {
    /** Describes the output from the function in the OpenAPI JSON Schema
     Object format. */
    response?: Schema;
    /** Optional. Description and purpose of the function. Model uses it to decide how and whether to call the function. */
    description?: string;
    /** Required. The name of the function to call. Must start with a letter or an underscore. Must be a-z, A-Z, 0-9, or contain underscores, dots and dashes, with a maximum length of 64. */
    name?: string;
    /** Optional. Describes the parameters to this function in JSON Schema Object format. Reflects the Open API 3.03 Parameter Object. string Key: the name of the parameter. Parameter names are case sensitive. Schema Value: the Schema defining the type used for the parameter. For function with no parameters, this can be left unset. Parameter names must start with a letter or an underscore and must only contain chars a-z, A-Z, 0-9, or underscores with a maximum length of 64. Example with 1 required and 1 optional parameter: type: OBJECT properties: param1: type: STRING param2: type: INTEGER required: - param1 */
    parameters?: Schema;
}

/** A function response. */
export declare class FunctionResponse {
    /** The id of the function call this response is for. Populated by the client
     to match the corresponding function call `id`. */
    id?: string;
    /** Required. The name of the function to call. Matches [FunctionDeclaration.name] and [FunctionCall.name]. */
    name?: string;
    /** Required. The function response in JSON object format. Use "output" key to specify function output and "error" key to specify error details (if any). If "output" and "error" keys are not specified, then whole "response" is treated as function output. */
    response?: Record<string, any>;
}

/** Optional model configuration parameters.

 For more information, see `Content generation parameters
 <https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/content-generation-parameters>`_.
 */
export declare interface GenerateContentConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
    /** Instructions for the model to steer it toward better performance.
     For example, "Answer as concisely as possible" or "Don't use technical
     terms in your response".
     */
    systemInstruction?: ContentUnion;
    /** Value that controls the degree of randomness in token selection.
     Lower temperatures are good for prompts that require a less open-ended or
     creative response, while higher temperatures can lead to more diverse or
     creative results.
     */
    temperature?: number;
    /** Tokens are selected from the most to least probable until the sum
     of their probabilities equals this value. Use a lower value for less
     random responses and a higher value for more random responses.
     */
    topP?: number;
    /** For each token selection step, the ``top_k`` tokens with the
     highest probabilities are sampled. Then tokens are further filtered based
     on ``top_p`` with the final token selected using temperature sampling. Use
     a lower number for less random responses and a higher number for more
     random responses.
     */
    topK?: number;
    /** Number of response variations to return.
     */
    candidateCount?: number;
    /** Maximum number of tokens that can be generated in the response.
     */
    maxOutputTokens?: number;
    /** List of strings that tells the model to stop generating text if one
     of the strings is encountered in the response.
     */
    stopSequences?: string[];
    /** Whether to return the log probabilities of the tokens that were
     chosen by the model at each step.
     */
    responseLogprobs?: boolean;
    /** Number of top candidate tokens to return the log probabilities for
     at each generation step.
     */
    logprobs?: number;
    /** Positive values penalize tokens that already appear in the
     generated text, increasing the probability of generating more diverse
     content.
     */
    presencePenalty?: number;
    /** Positive values penalize tokens that repeatedly appear in the
     generated text, increasing the probability of generating more diverse
     content.
     */
    frequencyPenalty?: number;
    /** When ``seed`` is fixed to a specific number, the model makes a best
     effort to provide the same response for repeated requests. By default, a
     random number is used.
     */
    seed?: number;
    /** Output response media type of the generated candidate text.
     */
    responseMimeType?: string;
    /** Schema that the generated candidate text must adhere to.
     */
    responseSchema?: SchemaUnion;
    /** Configuration for model router requests.
     */
    routingConfig?: GenerationConfigRoutingConfig;
    /** Safety settings in the request to block unsafe content in the
     response.
     */
    safetySettings?: SafetySetting[];
    /** Code that enables the system to interact with external systems to
     perform an action outside of the knowledge and scope of the model.
     */
    tools?: ToolListUnion;
    /** Associates model output to a specific function call.
     */
    toolConfig?: ToolConfig;
    /** Labels with user-defined metadata to break down billed charges. */
    labels?: Record<string, string>;
    /** Resource name of a context cache that can be used in subsequent
     requests.
     */
    cachedContent?: string;
    /** The requested modalities of the response. Represents the set of
     modalities that the model can return.
     */
    responseModalities?: string[];
    /** If specified, the media resolution specified will be used.
     */
    mediaResolution?: MediaResolution;
    /** The speech generation configuration.
     */
    speechConfig?: SpeechConfigUnion;
    /** If enabled, audio timestamp will be included in the request to the
     model.
     */
    audioTimestamp?: boolean;
    /** The thinking features configuration.
     */
    thinkingConfig?: ThinkingConfig;
}

/** Config for models.generate_content parameters. */
export declare interface GenerateContentParameters {
    /** ID of the model to use. For a list of models, see `Google models
     <https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models>`_. */
    model: string;
    /** Content of the request.
     */
    contents: ContentListUnion;
    /** Configuration that contains optional model parameters.
     */
    config?: GenerateContentConfig;
}

/** Response message for PredictionService.GenerateContent. */
export declare class GenerateContentResponse {
    /** Response variations returned by the model.
     */
    candidates?: Candidate[];
    /** Timestamp when the request is made to the server.
     */
    createTime?: string;
    /** Identifier for each response.
     */
    responseId?: string;
    /** Output only. The model version used to generate the response. */
    modelVersion?: string;
    /** Output only. Content filter results for a prompt sent in the request. Note: Sent only in the first stream chunk. Only happens when no candidates were generated due to content violations. */
    promptFeedback?: GenerateContentResponsePromptFeedback;
    /** Usage metadata about the response(s). */
    usageMetadata?: GenerateContentResponseUsageMetadata;
    text(): string | undefined;
    functionCalls(): FunctionCall[] | undefined;
}

/** Content filter results for a prompt sent in the request. */
export declare class GenerateContentResponsePromptFeedback {
    /** Output only. Blocked reason. */
    blockReason?: BlockedReason;
    /** Output only. A readable block reason message. */
    blockReasonMessage?: string;
    /** Output only. Safety ratings. */
    safetyRatings?: SafetyRating[];
}

/** Usage metadata about response(s). */
export declare class GenerateContentResponseUsageMetadata {
    /** Output only. Number of tokens in the cached part in the input (the cached content). */
    cachedContentTokenCount?: number;
    /** Number of tokens in the response(s). */
    candidatesTokenCount?: number;
    /** Number of tokens in the request. When `cached_content` is set, this is still the total effective prompt size meaning this includes the number of tokens in the cached content. */
    promptTokenCount?: number;
    /** Total token count for prompt and response candidates. */
    totalTokenCount?: number;
}

/** An output image. */
export declare interface GeneratedImage {
    /** The output image data.
     */
    image?: Image_2;
    /** Responsible AI filter reason if the image is filtered out of the
     response.
     */
    raiFilteredReason?: string;
    /** The rewritten prompt used for the image generation if the prompt
     enhancer is enabled.
     */
    enhancedPrompt?: string;
}

/** The config for generating an images. */
export declare interface GenerateImagesConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
    /** Cloud Storage URI used to store the generated images.
     */
    outputGcsUri?: string;
    /** Description of what to discourage in the generated images.
     */
    negativePrompt?: string;
    /** Number of images to generate.
     */
    numberOfImages?: number;
    /** Controls how much the model adheres to the text prompt. Large
     values increase output and prompt alignment, but may compromise image
     quality.
     */
    guidanceScale?: number;
    /** Random seed for image generation. This is not available when
     ``add_watermark`` is set to true.
     */
    seed?: number;
    /** Filter level for safety filtering.
     */
    safetyFilterLevel?: SafetyFilterLevel;
    /** Allows generation of people by the model.
     */
    personGeneration?: PersonGeneration;
    /** Whether to report the safety scores of each image in the response.
     */
    includeSafetyAttributes?: boolean;
    /** Whether to include the Responsible AI filter reason if the image
     is filtered out of the response.
     */
    includeRaiReason?: boolean;
    /** Language of the text in the prompt.
     */
    language?: ImagePromptLanguage;
    /** MIME type of the generated image.
     */
    outputMimeType?: string;
    /** Compression quality of the generated image (for ``image/jpeg``
     only).
     */
    outputCompressionQuality?: number;
    /** Whether to add a watermark to the generated images.
     */
    addWatermark?: boolean;
    /** Aspect ratio of the generated images.
     */
    aspectRatio?: string;
    /** Whether to use the prompt rewriting logic.
     */
    enhancePrompt?: boolean;
}

/** The parameters for generating images. */
export declare interface GenerateImagesParameters {
    /** ID of the model to use. For a list of models, see `Google models
     <https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models>`_. */
    model: string;
    /** Text prompt that typically describes the images to output.
     */
    prompt: string;
    /** Configuration for generating images.
     */
    config?: GenerateImagesConfig;
}

/** The output images response. */
export declare class GenerateImagesResponse {
    /** List of generated images.
     */
    generatedImages?: GeneratedImage[];
}

/** Generation config. */
export declare interface GenerationConfig {
    /** Optional. If enabled, audio timestamp will be included in the request to the model. */
    audioTimestamp?: boolean;
    /** Optional. Number of candidates to generate. */
    candidateCount?: number;
    /** Optional. Frequency penalties. */
    frequencyPenalty?: number;
    /** Optional. Logit probabilities. */
    logprobs?: number;
    /** Optional. The maximum number of output tokens to generate per message. */
    maxOutputTokens?: number;
    /** Optional. Positive penalties. */
    presencePenalty?: number;
    /** Optional. If true, export the logprobs results in response. */
    responseLogprobs?: boolean;
    /** Optional. Output response mimetype of the generated candidate text. Supported mimetype: - `text/plain`: (default) Text output. - `application/json`: JSON response in the candidates. The model needs to be prompted to output the appropriate response type, otherwise the behavior is undefined. This is a preview feature. */
    responseMimeType?: string;
    /** Optional. The `Schema` object allows the definition of input and output data types. These types can be objects, but also primitives and arrays. Represents a select subset of an [OpenAPI 3.0 schema object](https://spec.openapis.org/oas/v3.0.3#schema). If set, a compatible response_mime_type must also be set. Compatible mimetypes: `application/json`: Schema for JSON response. */
    responseSchema?: Schema;
    /** Optional. Routing configuration. */
    routingConfig?: GenerationConfigRoutingConfig;
    /** Optional. Seed. */
    seed?: number;
    /** Optional. Stop sequences. */
    stopSequences?: string[];
    /** Optional. Controls the randomness of predictions. */
    temperature?: number;
    /** Optional. If specified, top-k sampling will be used. */
    topK?: number;
    /** Optional. If specified, nucleus sampling will be used. */
    topP?: number;
}

/** The configuration for routing the request to a specific model. */
export declare interface GenerationConfigRoutingConfig {
    /** Automated routing. */
    autoMode?: GenerationConfigRoutingConfigAutoRoutingMode;
    /** Manual routing. */
    manualMode?: GenerationConfigRoutingConfigManualRoutingMode;
}

/** When automated routing is specified, the routing will be determined by the pretrained routing model and customer provided model routing preference. */
export declare interface GenerationConfigRoutingConfigAutoRoutingMode {
    /** The model routing preference. */
    modelRoutingPreference?: 'UNKNOWN' | 'PRIORITIZE_QUALITY' | 'BALANCED' | 'PRIORITIZE_COST';
}

/** When manual routing is set, the specified model will be used directly. */
export declare interface GenerationConfigRoutingConfigManualRoutingMode {
    /** The model name to use. Only the public LLM models are accepted. e.g. 'gemini-1.5-pro-001'. */
    modelName?: string;
}

/** Optional parameters for caches.get method. */
export declare interface GetCachedContentConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
}

/** Parameters for caches.get method. */
export declare interface GetCachedContentParameters {
    /** The server-generated resource name of the cached content.
     */
    name: string;
    /** Optional parameters for the request.
     */
    config?: GetCachedContentConfig;
}

/** Used to override the default configuration. */
export declare interface GetFileConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
}

/** Generates the parameters for the get method. */
export declare interface GetFileParameters {
    /** The name identifier for the file to retrieve. */
    name: string;
    /** Used to override the default configuration. */
    config?: GetFileConfig;
}

/** Optional parameters for tunings.get method. */
export declare interface GetTuningJobConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
}

/** Parameters for the get method. */
export declare interface GetTuningJobParameters {
    name: string;
    /** Optional parameters for the request. */
    config?: GetTuningJobConfig;
}

/** The `Status` type defines a logical error model that is suitable for different programming environments, including REST APIs and RPC APIs. It is used by [gRPC](https://github.com/grpc). Each `Status` message contains three pieces of data: error code, error message, and error details. You can find out more about this error model and how to work with it in the [API Design Guide](https://cloud.google.com/apis/design/errors). */
export declare interface GoogleRpcStatus {
    /** The status code, which should be an enum value of google.rpc.Code. */
    code?: number;
    /** A list of messages that carry the error details. There is a common set of message types for APIs to use. */
    details?: Record<string, any>[];
    /** A developer-facing error message, which should be in English. Any user-facing error message should be localized and sent in the google.rpc.Status.details field, or localized by the client. */
    message?: string;
}

/** Tool to support Google Search in Model. Powered by Google. */
export declare interface GoogleSearch {
}

/** Tool to retrieve public web data for grounding, powered by Google. */
export declare interface GoogleSearchRetrieval {
    /** Specifies the dynamic retrieval configuration for the given source. */
    dynamicRetrievalConfig?: DynamicRetrievalConfig;
}

/** Represents a whole or partial calendar date, such as a birthday. The time of day and time zone are either specified elsewhere or are insignificant. The date is relative to the Gregorian Calendar. This can represent one of the following: * A full date, with non-zero year, month, and day values. * A month and day, with a zero year (for example, an anniversary). * A year on its own, with a zero month and a zero day. * A year and month, with a zero day (for example, a credit card expiration date). Related types: * google.type.TimeOfDay * google.type.DateTime * google.protobuf.Timestamp */
export declare interface GoogleTypeDate {
    /** Day of a month. Must be from 1 to 31 and valid for the year and month, or 0 to specify a year by itself or a year and month where the day isn't significant. */
    day?: number;
    /** Month of a year. Must be from 1 to 12, or 0 to specify a year without a month and day. */
    month?: number;
    /** Year of the date. Must be from 1 to 9999, or 0 to specify a date without a year. */
    year?: number;
}

/** Grounding chunk. */
export declare interface GroundingChunk {
    /** Grounding chunk from context retrieved by the retrieval tools. */
    retrievedContext?: GroundingChunkRetrievedContext;
    /** Grounding chunk from the web. */
    web?: GroundingChunkWeb;
}

/** Chunk from context retrieved by the retrieval tools. */
export declare interface GroundingChunkRetrievedContext {
    /** Text of the attribution. */
    text?: string;
    /** Title of the attribution. */
    title?: string;
    /** URI reference of the attribution. */
    uri?: string;
}

/** Chunk from the web. */
export declare interface GroundingChunkWeb {
    /** Title of the chunk. */
    title?: string;
    /** URI reference of the chunk. */
    uri?: string;
}

/** Metadata returned to client when grounding is enabled. */
export declare interface GroundingMetadata {
    /** List of supporting references retrieved from specified grounding source. */
    groundingChunks?: GroundingChunk[];
    /** Optional. List of grounding support. */
    groundingSupports?: GroundingSupport[];
    /** Optional. Output only. Retrieval metadata. */
    retrievalMetadata?: RetrievalMetadata;
    /** Optional. Queries executed by the retrieval tools. */
    retrievalQueries?: string[];
    /** Optional. Google search entry for the following-up web searches. */
    searchEntryPoint?: SearchEntryPoint;
    /** Optional. Web search queries for the following-up web search. */
    webSearchQueries?: string[];
}

/** Grounding support. */
export declare interface GroundingSupport {
    /** Confidence score of the support references. Ranges from 0 to 1. 1 is the most confident. This list must have the same size as the grounding_chunk_indices. */
    confidenceScores?: number[];
    /** A list of indices (into 'grounding_chunk') specifying the citations associated with the claim. For instance [1,3,4] means that grounding_chunk[1], grounding_chunk[3], grounding_chunk[4] are the retrieved content attributed to the claim. */
    groundingChunkIndices?: number[];
    /** Segment of the content this support belongs to. */
    segment?: Segment;
}

export declare enum HarmBlockMethod {
    HARM_BLOCK_METHOD_UNSPECIFIED = "HARM_BLOCK_METHOD_UNSPECIFIED",
    SEVERITY = "SEVERITY",
    PROBABILITY = "PROBABILITY"
}

export declare enum HarmBlockThreshold {
    HARM_BLOCK_THRESHOLD_UNSPECIFIED = "HARM_BLOCK_THRESHOLD_UNSPECIFIED",
    BLOCK_LOW_AND_ABOVE = "BLOCK_LOW_AND_ABOVE",
    BLOCK_MEDIUM_AND_ABOVE = "BLOCK_MEDIUM_AND_ABOVE",
    BLOCK_ONLY_HIGH = "BLOCK_ONLY_HIGH",
    BLOCK_NONE = "BLOCK_NONE",
    OFF = "OFF"
}

export declare enum HarmCategory {
    HARM_CATEGORY_UNSPECIFIED = "HARM_CATEGORY_UNSPECIFIED",
    HARM_CATEGORY_HATE_SPEECH = "HARM_CATEGORY_HATE_SPEECH",
    HARM_CATEGORY_DANGEROUS_CONTENT = "HARM_CATEGORY_DANGEROUS_CONTENT",
    HARM_CATEGORY_HARASSMENT = "HARM_CATEGORY_HARASSMENT",
    HARM_CATEGORY_SEXUALLY_EXPLICIT = "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    HARM_CATEGORY_CIVIC_INTEGRITY = "HARM_CATEGORY_CIVIC_INTEGRITY"
}

export declare enum HarmProbability {
    HARM_PROBABILITY_UNSPECIFIED = "HARM_PROBABILITY_UNSPECIFIED",
    NEGLIGIBLE = "NEGLIGIBLE",
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}

export declare enum HarmSeverity {
    HARM_SEVERITY_UNSPECIFIED = "HARM_SEVERITY_UNSPECIFIED",
    HARM_SEVERITY_NEGLIGIBLE = "HARM_SEVERITY_NEGLIGIBLE",
    HARM_SEVERITY_LOW = "HARM_SEVERITY_LOW",
    HARM_SEVERITY_MEDIUM = "HARM_SEVERITY_MEDIUM",
    HARM_SEVERITY_HIGH = "HARM_SEVERITY_HIGH"
}

/** HTTP options to be used in each of the requests. */
export declare interface HttpOptions {
    /** The base URL for the AI platform service endpoint. */
    baseUrl?: string;
    /** Specifies the version of the API to use. */
    apiVersion?: string;
    /** Additional HTTP headers to be sent with the request. */
    headers?: Record<string, string>;
    /** Timeout for the request in milliseconds. */
    timeout?: number;
}

/**
 * Represents the necessary information to send a request to an API endpoint.
 * This interface defines the structure for constructing and executing HTTP
 * requests.
 */
declare interface HttpRequest {
    /**
     * URL path from the modules, this path is appended to the base API URL to
     * form the complete request URL.
     */
    path: string;
    /**
     * Optional query parameters to be appended to the request URL.
     */
    queryParams?: Record<string, string>;
    /**
     * Optional request body in json string format, GET request doesn't need a
     * request body.
     */
    body?: string;
    /**
     * The HTTP method to be used for the request.
     */
    httpMethod: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    /**
     * Optional set of customizable configuration for HTTP requests.
     */
    httpOptions?: HttpOptions;
}

/** A wrapper class for the http response. */
export declare class HttpResponse {
    /** Used to retain the processed HTTP headers in the response. */
    headers?: Record<string, string>;
    /**
     * The original http response.
     */
    responseInternal: Response;
    constructor(response: Response);
    json(): Promise<any>;
}

/** An image. */
declare interface Image_2 {
    /** The Cloud Storage URI of the image. ``Image`` can contain a value
     for this field or the ``image_bytes`` field but not both.
     */
    gcsUri?: string;
    /** The image bytes data. ``Image`` can contain a value for this field
     or the ``gcs_uri`` field but not both.
     */
    imageBytes?: string;
    /** The MIME type of the image. */
    mimeType?: string;
}
export { Image_2 as Image }

export declare enum ImagePromptLanguage {
    auto = "auto",
    en = "en",
    ja = "ja",
    ko = "ko",
    hi = "hi"
}

export declare enum JobState {
    JOB_STATE_UNSPECIFIED = "JOB_STATE_UNSPECIFIED",
    JOB_STATE_QUEUED = "JOB_STATE_QUEUED",
    JOB_STATE_PENDING = "JOB_STATE_PENDING",
    JOB_STATE_RUNNING = "JOB_STATE_RUNNING",
    JOB_STATE_SUCCEEDED = "JOB_STATE_SUCCEEDED",
    JOB_STATE_FAILED = "JOB_STATE_FAILED",
    JOB_STATE_CANCELLING = "JOB_STATE_CANCELLING",
    JOB_STATE_CANCELLED = "JOB_STATE_CANCELLED",
    JOB_STATE_PAUSED = "JOB_STATE_PAUSED",
    JOB_STATE_EXPIRED = "JOB_STATE_EXPIRED",
    JOB_STATE_UPDATING = "JOB_STATE_UPDATING",
    JOB_STATE_PARTIALLY_SUCCEEDED = "JOB_STATE_PARTIALLY_SUCCEEDED"
}

export declare enum Language {
    LANGUAGE_UNSPECIFIED = "LANGUAGE_UNSPECIFIED",
    PYTHON = "PYTHON"
}

/** Config for caches.list method. */
export declare interface ListCachedContentsConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
    pageSize?: number;
    pageToken?: string;
}

/** Parameters for caches.list method. */
export declare interface ListCachedContentsParameters {
    /** Configuration that contains optional parameters.
     */
    config?: ListCachedContentsConfig;
}

export declare class ListCachedContentsResponse {
    nextPageToken?: string;
    /** List of cached contents.
     */
    cachedContents?: CachedContent[];
}

/** Used to override the default configuration. */
export declare interface ListFilesConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
    pageSize?: number;
    pageToken?: string;
}

/** Generates the parameters for the list method. */
export declare interface ListFilesParameters {
    /** Used to override the default configuration. */
    config?: ListFilesConfig;
}

/** Response for the list files method. */
export declare class ListFilesResponse {
    /** A token to retrieve next page of results. */
    nextPageToken?: string;
    /** The list of files. */
    files?: File_2[];
}

/** Configuration for the list tuning jobs method. */
export declare interface ListTuningJobsConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
    pageSize?: number;
    pageToken?: string;
    filter?: string;
}

/** Parameters for the list tuning jobs method. */
export declare interface ListTuningJobsParameters {
    config?: ListTuningJobsConfig;
}

/** Response for the list tuning jobs method. */
export declare class ListTuningJobsResponse {
    /** A token to retrieve the next page of results. Pass to ListTuningJobsRequest.page_token to obtain that page. */
    nextPageToken?: string;
    /** List of TuningJobs in the requested page. */
    tuningJobs?: TuningJob[];
}

/**
 Live class encapsulates the configuration for live interaction with the
 Generative Language API. It embeds ApiClient for general API settings.

 @experimental
 */
export declare class Live {
    private readonly apiClient;
    private readonly auth;
    private readonly webSocketFactory;
    constructor(apiClient: ApiClient, auth: Auth, webSocketFactory: WebSocketFactory);
    /**
     Establishes a connection to the specified model with the given
     configuration. It returns a Session object representing the connection.

     @experimental

     @param model - Model to use for the Live session.
     @param config - Configuration parameters for the Live session.
     @param callbacks - Optional callbacks for websocket events. If not
     provided, default no-op callbacks will be used. Generally, prefer to
     provide explicit callbacks to allow for proper handling of websocket
     events (e.g. connection errors).
     */
    connect(params: types.LiveConnectParameters, callbacks?: WebSocketCallbacks): Promise<Session>;
}

/** Incremental update of the current conversation delivered from the client.

 All the content here will unconditionally be appended to the conversation
 history and used as part of the prompt to the model to generate content.

 A message here will interrupt any current model generation.
 */
export declare interface LiveClientContent {
    /** The content appended to the current conversation with the model.

     For single-turn queries, this is a single instance. For multi-turn
     queries, this is a repeated field that contains conversation history and
     latest request.
     */
    turns?: Content[];
    /** If true, indicates that the server content generation should start with
     the currently accumulated prompt. Otherwise, the server will await
     additional messages before starting generation. */
    turnComplete?: boolean;
}

/** Messages sent by the client in the API call. */
export declare interface LiveClientMessage {
    /** Message to be sent by the system when connecting to the API. SDK users should not send this message. */
    setup?: LiveClientSetup;
    /** Incremental update of the current conversation delivered from the client. */
    clientContent?: LiveClientContent;
    /** User input that is sent in real time. */
    realtimeInput?: LiveClientRealtimeInput;
    /** Response to a `ToolCallMessage` received from the server. */
    toolResponse?: LiveClientToolResponse;
}

/** User input that is sent in real time.

 This is different from `ClientContentUpdate` in a few ways:

 - Can be sent continuously without interruption to model generation.
 - If there is a need to mix data interleaved across the
 `ClientContentUpdate` and the `RealtimeUpdate`, server attempts to
 optimize for best response, but there are no guarantees.
 - End of turn is not explicitly specified, but is rather derived from user
 activity (for example, end of speech).
 - Even before the end of turn, the data is processed incrementally
 to optimize for a fast start of the response from the model.
 - Is always assumed to be the user's input (cannot be used to populate
 conversation history).
 */
export declare interface LiveClientRealtimeInput {
    /** Inlined bytes data for media input. */
    mediaChunks?: Blob_2[];
}

/** Message contains configuration that will apply for the duration of the streaming session. */
export declare interface LiveClientSetup {
    /**
     The fully qualified name of the publisher model or tuned model endpoint to
     use.
     */
    model?: string;
    /** The generation configuration for the session.

     The following fields are supported:
     - `response_logprobs`
     - `response_mime_type`
     - `logprobs`
     - `response_schema`
     - `stop_sequence`
     - `routing_config`
     - `audio_timestamp`
     */
    generationConfig?: GenerationConfig;
    /** The user provided system instructions for the model.
     Note: only text should be used in parts and content in each part will be
     in a separate paragraph. */
    systemInstruction?: Content;
    /**  A list of `Tools` the model may use to generate the next response.

     A `Tool` is a piece of code that enables the system to interact with
     external systems to perform an action, or set of actions, outside of
     knowledge and scope of the model. */
    tools?: Tool[];
}

/** Client generated response to a `ToolCall` received from the server.

 Individual `FunctionResponse` objects are matched to the respective
 `FunctionCall` objects by the `id` field.

 Note that in the unary and server-streaming GenerateContent APIs function
 calling happens by exchanging the `Content` parts, while in the bidi
 GenerateContent APIs function calling happens over this dedicated set of
 messages.
 */
export declare class LiveClientToolResponse {
    /** The response to the function calls. */
    functionResponses?: FunctionResponse[];
}

/** Session config for the API connection. */
export declare interface LiveConnectConfig {
    /** The generation configuration for the session. */
    generationConfig?: GenerationConfig;
    /** The requested modalities of the response. Represents the set of
     modalities that the model can return. Defaults to AUDIO if not specified.
     */
    responseModalities?: Modality[];
    /** The speech generation configuration.
     */
    speechConfig?: SpeechConfig;
    /** The user provided system instructions for the model.
     Note: only text should be used in parts and content in each part will be
     in a separate paragraph. */
    systemInstruction?: Content;
    /** A list of `Tools` the model may use to generate the next response.

     A `Tool` is a piece of code that enables the system to interact with
     external systems to perform an action, or set of actions, outside of
     knowledge and scope of the model. */
    tools?: Tool[];
}

/** Parameters for connecting to the live API. */
export declare interface LiveConnectParameters {
    /** ID of the model to use. For a list of models, see `Google models
     <https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models>`_. */
    model: string;
    /** Optional configuration parameters for the request.
     */
    config?: LiveConnectConfig;
}

/** Incremental server update generated by the model in response to client messages.

 Content is generated as quickly as possible, and not in real time. Clients
 may choose to buffer and play it out in real time.
 */
export declare interface LiveServerContent {
    /** The content that the model has generated as part of the current conversation with the user. */
    modelTurn?: Content;
    /** If true, indicates that the model is done generating. Generation will only start in response to additional client messages. Can be set alongside `content`, indicating that the `content` is the last in the turn. */
    turnComplete?: boolean;
    /** If true, indicates that a client message has interrupted current model generation. If the client is playing out the content in realtime, this is a good signal to stop and empty the current queue. */
    interrupted?: boolean;
}

/** Response message for API call. */
export declare interface LiveServerMessage {
    /** Sent in response to a `LiveClientSetup` message from the client. */
    setupComplete?: LiveServerSetupComplete;
    /** Content generated by the model in response to client messages. */
    serverContent?: LiveServerContent;
    /** Request for the client to execute the `function_calls` and return the responses with the matching `id`s. */
    toolCall?: LiveServerToolCall;
    /** Notification for the client that a previously issued `ToolCallMessage` with the specified `id`s should have been not executed and should be cancelled. */
    toolCallCancellation?: LiveServerToolCallCancellation;
}

/** Sent in response to a `LiveGenerateContentSetup` message from the client. */
export declare interface LiveServerSetupComplete {
}

/** Request for the client to execute the `function_calls` and return the responses with the matching `id`s. */
export declare interface LiveServerToolCall {
    /** The function call to be executed. */
    functionCalls?: FunctionCall[];
}

/** Notification for the client that a previously issued `ToolCallMessage` with the specified `id`s should have been not executed and should be cancelled.

 If there were side-effects to those tool calls, clients may attempt to undo
 the tool calls. This message occurs only in cases where the clients interrupt
 server turns.
 */
export declare interface LiveServerToolCallCancellation {
    /** The ids of the tool calls to be cancelled. */
    ids?: string[];
}

/** Logprobs Result */
export declare interface LogprobsResult {
    /** Length = total number of decoding steps. The chosen candidates may or may not be in top_candidates. */
    chosenCandidates?: LogprobsResultCandidate[];
    /** Length = total number of decoding steps. */
    topCandidates?: LogprobsResultTopCandidates[];
}

/** Candidate for the logprobs token and score. */
export declare interface LogprobsResultCandidate {
    /** The candidate's log probability. */
    logProbability?: number;
    /** The candidate's token string value. */
    token?: string;
    /** The candidate's token id value. */
    tokenId?: number;
}

/** Candidates with top log probabilities at each decoding step. */
export declare interface LogprobsResultTopCandidates {
    /** Sorted by log probability in descending order. */
    candidates?: LogprobsResultCandidate[];
}

/** Configuration for a Mask reference image. */
export declare interface MaskReferenceConfig {
    /** Prompts the model to generate a mask instead of you needing to
     provide one (unless MASK_MODE_USER_PROVIDED is used). */
    maskMode?: MaskReferenceMode;
    /** A list of up to 5 class ids to use for semantic segmentation.
     Automatically creates an image mask based on specific objects. */
    segmentationClasses?: number[];
    /** Dilation percentage of the mask provided.
     Float between 0 and 1. */
    maskDilation?: number;
}

/** A mask reference image.

 This encapsulates either a mask image provided by the user and configs for
 the user provided mask, or only config parameters for the model to generate
 a mask.

 A mask image is an image whose non-zero values indicate where to edit the base
 image. If the user provides a mask image, the mask must be in the same
 dimensions as the raw image.
 */
export declare interface MaskReferenceImage {
    /** The reference image for the editing operation. */
    referenceImage?: Image_2;
    /** The id of the reference image. */
    referenceId?: number;
    /** The type of the reference image. Only set by the SDK. */
    referenceType?: string;
    /** Configuration for the mask reference image. */
    config?: MaskReferenceConfig;
}

export declare enum MaskReferenceMode {
    MASK_MODE_DEFAULT = "MASK_MODE_DEFAULT",
    MASK_MODE_USER_PROVIDED = "MASK_MODE_USER_PROVIDED",
    MASK_MODE_BACKGROUND = "MASK_MODE_BACKGROUND",
    MASK_MODE_FOREGROUND = "MASK_MODE_FOREGROUND",
    MASK_MODE_SEMANTIC = "MASK_MODE_SEMANTIC"
}

export declare enum MediaResolution {
    MEDIA_RESOLUTION_UNSPECIFIED = "MEDIA_RESOLUTION_UNSPECIFIED",
    MEDIA_RESOLUTION_LOW = "MEDIA_RESOLUTION_LOW",
    MEDIA_RESOLUTION_MEDIUM = "MEDIA_RESOLUTION_MEDIUM",
    MEDIA_RESOLUTION_HIGH = "MEDIA_RESOLUTION_HIGH"
}

export declare enum Modality {
    MODALITY_UNSPECIFIED = "MODALITY_UNSPECIFIED",
    TEXT = "TEXT",
    IMAGE = "IMAGE",
    AUDIO = "AUDIO"
}

export declare enum Mode {
    MODE_UNSPECIFIED = "MODE_UNSPECIFIED",
    MODE_DYNAMIC = "MODE_DYNAMIC"
}

export declare class Models extends BaseModule {
    private readonly apiClient;
    constructor(apiClient: ApiClient);
    /**
     * Makes an API request to generate content with a given model.
     *
     * For the `model` parameter, supported formats for Vertex AI API include:
     * - The Gemini model ID, for example: 'gemini-1.5-flash-002'
     * - The full resource name starts with 'projects/', for example:
     *  'projects/my-project-id/locations/us-central1/publishers/google/models/gemini-1.5-flash-002'
     * - The partial resource name with 'publishers/', for example:
     *  'publishers/google/models/gemini-1.5-flash-002' or
     *  'publishers/meta/models/llama-3.1-405b-instruct-maas'
     * - `/` separated publisher and model name, for example:
     * 'google/gemini-1.5-flash-002' or 'meta/llama-3.1-405b-instruct-maas'
     *
     * For the `model` parameter, supported formats for Gemini API include:
     * - The Gemini model ID, for example: 'gemini-1.5-flash-002'
     * - The model name starts with 'models/', for example:
     *  'models/gemini-1.5-flash-002'
     * - If you would like to use a tuned model, the model name starts with
     * 'tunedModels/', for example:
     * 'tunedModels/1234567890123456789'
     *
     * Some models support multimodal input and output.
     *
     * @param model - The model to use for generating content.
     * @param contents - The input contents to use for generating content.
     * @param [config] - The configuration for generating content.
     * @return The response from generating content.
     *
     * @example
     * ```ts
     * const response = await client.models.generateContent({
     *   model: 'gemini-1.5-flash-002',
     *   contents: 'why is the sky blue?',
     *   config: {
     *     candidateCount: 2,
     *   }
     * });
     * console.log(response);
     * ```
     */
    generateContent: (params: types.GenerateContentParameters) => Promise<types.GenerateContentResponse>;
    /**
     * Makes an API request to generate content with a given model and yields the
     * response in chunks.
     *
     * For the `model` parameter, supported formats for Vertex AI API include:
     * - The Gemini model ID, for example: 'gemini-1.5-flash-002'
     * - The full resource name starts with 'projects/', for example:
     *  'projects/my-project-id/locations/us-central1/publishers/google/models/gemini-1.5-flash-002'
     * - The partial resource name with 'publishers/', for example:
     *  'publishers/google/models/gemini-1.5-flash-002' or
     *  'publishers/meta/models/llama-3.1-405b-instruct-maas'
     * - `/` separated publisher and model name, for example:
     * 'google/gemini-1.5-flash-002' or 'meta/llama-3.1-405b-instruct-maas'
     *
     * For the `model` parameter, supported formats for Gemini API include:
     * - The Gemini model ID, for example: 'gemini-1.5-flash-002'
     * - The model name starts with 'models/', for example:
     *  'models/gemini-1.5-flash-002'
     * - If you would like to use a tuned model, the model name starts with
     * 'tunedModels/', for example:
     * 'tunedModels/1234567890123456789'
     *
     * Some models support multimodal input and output.
     *
     * @param model - The model to use for generating content.
     * @param contents - The input contents to use for generating content.
     * @param [config] - The configuration for generating content.
     * @return The response from generating content.
     *
     * @example
     * ```ts
     * const response = await client.models.generateContentStream({
     *   model: 'gemini-1.5-flash-002',
     *   contents: 'why is the sky blue?',
     *   config: {
     *     maxOutputTokens: 200,
     *   }
     * });
     * for await (const chunk of response) {
     *   console.log(chunk);
     * }
     * ```
     */
    generateContentStream: (params: types.GenerateContentParameters) => Promise<AsyncGenerator<types.GenerateContentResponse>>;
    private generateContentInternal;
    private generateContentStreamInternal;
    /**
     * Calculates embeddings for the given contents. Only text is supported.
     *
     * @param model - The model to use.
     * @param contents - The contents to embed.
     * @param [config] - The config for embedding contents.
     * @return The response from the API.
     *
     * @example
     * ```ts
     * const response = await client.models.embedContent({
     *  model: 'text-embedding-004',
     *  contents: [
     *    'What is your name?',
     *    'What is your favorite color?',
     *  ],
     *  config: {
     *    outputDimensionality: 64,
     *  },
     * });
     * console.log(response);
     * ```
     */
    embedContent(params: types.EmbedContentParameters): Promise<types.EmbedContentResponse>;
    /**
     * Generates an image based on a text description and configuration.
     *
     * @param model - The model to use.
     * @param prompt - A text description of the image to generate.
     * @param [config] - The config for image generation.
     * @return The response from the API.
     *
     * @example
     * ```ts
     * const response = await client.models.generateImages({
     *  model: 'imagen-3.0-generate-002',
     *  prompt: 'Robot holding a red skateboard',
     *  config: {
     *    numberOfImages: 1,
     *    includeRaiReason: true,
     *  },
     * });
     * console.log(response?.generatedImages?.[0]?.image?.imageBytes);
     * ```
     */
    generateImages(params: types.GenerateImagesParameters): Promise<types.GenerateImagesResponse>;
    /**
     * Counts the number of tokens in the given contents. Multimodal input is
     * supported for Gemini models.
     *
     * @param model - The model to use for counting tokens.
     * @param contents - The contents to count tokens for.
     * @param [config] - The config for counting tokens.
     * @return The response from the API.
     *
     * @example
     * ```ts
     * const response = await client.models.countTokens({
     *  model: 'gemini-1.5-flash',
     *  contents: 'The quick brown fox jumps over the lazy dog.'
     * });
     * console.log(response);
     * ```
     */
    countTokens(params: types.CountTokensParameters): Promise<types.CountTokensResponse>;
    /**
     * Return a list of tokens based on the input contents. Only text is
     * supported.
     *
     * This method is not supported by the Gemini Developer API.
     *
     * @param model - The model to use.
     * @param contents - The content to compute tokens for.
     * @param [config] - The config for computing tokens.
     * @return The response from the API.
     *
     * @example
     * ```ts
     * const response = await client.models.computeTokens({
     *  model: 'gemini-1.5-flash',
     *  contents: 'What is your name?'
     * });
     * console.log(response);
     * ```
     */
    computeTokens(params: types.ComputeTokensParameters): Promise<types.ComputeTokensResponse>;
}

/** A long-running operation. */
export declare interface Operation {
    /** The server-assigned name, which is only unique within the same service that originally returns it. If you use the default HTTP mapping, the `name` should be a resource name ending with `operations/{unique_id}`. */
    name?: string;
    /** Service-specific metadata associated with the operation. It typically contains progress information and common metadata such as create time. Some services might not provide such metadata.  Any method that returns a long-running operation should document the metadata type, if any. */
    metadata?: Record<string, any>;
    /** If the value is `false`, it means the operation is still in progress. If `true`, the operation is completed, and either `error` or `response` is available. */
    done?: boolean;
    /** The error result of the operation in case of failure or cancellation. */
    error?: Record<string, any>;
    /** The normal response of the operation in case of success. */
    response?: Record<string, any>;
}

/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare enum Outcome {
    OUTCOME_UNSPECIFIED = "OUTCOME_UNSPECIFIED",
    OUTCOME_OK = "OUTCOME_OK",
    OUTCOME_FAILED = "OUTCOME_FAILED",
    OUTCOME_DEADLINE_EXCEEDED = "OUTCOME_DEADLINE_EXCEEDED"
}

/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Pagers for the GenAI List APIs.
 */
/** @internal */
declare enum PagedItem {
    PAGED_ITEM_BATCH_JOBS = "batchJobs",
    PAGED_ITEM_MODELS = "models",
    PAGED_ITEM_TUNING_JOBS = "tuningJobs",
    PAGED_ITEM_FILES = "files",
    PAGED_ITEM_CACHED_CONTENTS = "cachedContents"
}

/**
 * Pager class for iterating through paginated results.
 */
declare class Pager<T> extends BasePager<T> implements AsyncIterable<T> {
    constructor(name: PagedItem, request: (config: any) => any, response: any, config: any);
    [Symbol.asyncIterator](): AsyncIterator<T>;
    /**
     * Fetches the next page of items. This makes a new API request.
     */
    private nextPage;
}

/** A datatype containing media content.

 Exactly one field within a Part should be set, representing the specific type
 of content being conveyed. Using multiple fields within the same `Part`
 instance is considered invalid.
 */
export declare interface Part {
    /** Metadata for a given video. */
    videoMetadata?: VideoMetadata;
    /** Indicates if the part is thought from the model. */
    thought?: boolean;
    /** Optional. Result of executing the [ExecutableCode]. */
    codeExecutionResult?: CodeExecutionResult;
    /** Optional. Code generated by the model that is meant to be executed. */
    executableCode?: ExecutableCode;
    /** Optional. URI based data. */
    fileData?: FileData;
    /** Optional. A predicted [FunctionCall] returned from the model that contains a string representing the [FunctionDeclaration.name] with the parameters and their values. */
    functionCall?: FunctionCall;
    /** Optional. The result output of a [FunctionCall] that contains a string representing the [FunctionDeclaration.name] and a structured JSON object containing any output from the function call. It is used as context to the model. */
    functionResponse?: FunctionResponse;
    /** Optional. Inlined bytes data. */
    inlineData?: Blob_2;
    /** Optional. Text part (can be code). */
    text?: string;
}

export declare type PartListUnion = PartUnion[] | PartUnion;

/** Tuning spec for Partner models. */
export declare interface PartnerModelTuningSpec {
    /** Hyperparameters for tuning. The accepted hyper_parameters and their valid range of values will differ depending on the base model. */
    hyperParameters?: Record<string, any>;
    /** Required. Cloud Storage path to file containing training dataset for tuning. The dataset must be formatted as a JSONL file. */
    trainingDatasetUri?: string;
    /** Optional. Cloud Storage path to file containing validation dataset for tuning. The dataset must be formatted as a JSONL file. */
    validationDatasetUri?: string;
}

export declare type PartUnion = Part | string;

export declare enum PersonGeneration {
    DONT_ALLOW = "DONT_ALLOW",
    ALLOW_ADULT = "ALLOW_ADULT",
    ALLOW_ALL = "ALLOW_ALL"
}

/** The configuration for the prebuilt speaker to use. */
export declare interface PrebuiltVoiceConfig {
    /** The name of the prebuilt voice to use.
     */
    voiceName?: string;
}

/** A raw reference image.

 A raw reference image represents the base image to edit, provided by the user.
 It can optionally be provided in addition to a mask reference image or
 a style reference image.
 */
export declare interface RawReferenceImage {
    /** The reference image for the editing operation. */
    referenceImage?: Image_2;
    /** The id of the reference image. */
    referenceId?: number;
    /** The type of the reference image. Only set by the SDK. */
    referenceType?: string;
}

/** Represents a recorded session. */
export declare interface ReplayFile {
    replayId?: string;
    interactions?: ReplayInteraction[];
}

/** Represents a single interaction, request and response in a replay. */
export declare interface ReplayInteraction {
    request?: ReplayRequest;
    response?: ReplayResponse;
}

/** Represents a single request in a replay. */
export declare interface ReplayRequest {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    bodySegments?: Record<string, any>[];
}

/** Represents a single response in a replay. */
export declare class ReplayResponse {
    statusCode?: number;
    headers?: Record<string, string>;
    bodySegments?: Record<string, any>[];
    sdkResponseSegments?: Record<string, any>[];
}

/** Defines a retrieval tool that model can call to access external knowledge. */
export declare interface Retrieval {
    /** Optional. Deprecated. This option is no longer supported. */
    disableAttribution?: boolean;
    /** Set to use data source powered by Vertex AI Search. */
    vertexAiSearch?: VertexAISearch;
    /** Set to use data source powered by Vertex RAG store. User data is uploaded via the VertexRagDataService. */
    vertexRagStore?: VertexRagStore;
}

/** Metadata related to retrieval in the grounding flow. */
export declare interface RetrievalMetadata {
    /** Optional. Score indicating how likely information from Google Search could help answer the prompt. The score is in the range `[0, 1]`, where 0 is the least likely and 1 is the most likely. This score is only populated when Google Search grounding and dynamic retrieval is enabled. It will be compared to the threshold to determine whether to trigger Google Search. */
    googleSearchDynamicRetrievalScore?: number;
}

export declare enum SafetyFilterLevel {
    BLOCK_LOW_AND_ABOVE = "BLOCK_LOW_AND_ABOVE",
    BLOCK_MEDIUM_AND_ABOVE = "BLOCK_MEDIUM_AND_ABOVE",
    BLOCK_ONLY_HIGH = "BLOCK_ONLY_HIGH",
    BLOCK_NONE = "BLOCK_NONE"
}

/** Safety rating corresponding to the generated content. */
export declare interface SafetyRating {
    /** Output only. Indicates whether the content was filtered out because of this rating. */
    blocked?: boolean;
    /** Output only. Harm category. */
    category?: HarmCategory;
    /** Output only. Harm probability levels in the content. */
    probability?: HarmProbability;
    /** Output only. Harm probability score. */
    probabilityScore?: number;
    /** Output only. Harm severity levels in the content. */
    severity?: HarmSeverity;
    /** Output only. Harm severity score. */
    severityScore?: number;
}

/** Safety settings. */
export declare interface SafetySetting {
    /** Determines if the harm block method uses probability or probability
     and severity scores. */
    method?: HarmBlockMethod;
    /** Required. Harm category. */
    category?: HarmCategory;
    /** Required. The harm block threshold. */
    threshold?: HarmBlockThreshold;
}

/** Schema that defines the format of input and output data.

 Represents a select subset of an OpenAPI 3.0 schema object.
 */
export declare interface Schema {
    /** Optional. Minimum number of the elements for Type.ARRAY. */
    minItems?: string;
    /** Optional. Example of the object. Will only populated when the object is the root. */
    example?: any;
    /** Optional. The order of the properties. Not a standard field in open api spec. Only used to support the order of the properties. */
    propertyOrdering?: string[];
    /** Optional. Pattern of the Type.STRING to restrict a string to a regular expression. */
    pattern?: string;
    /** Optional. SCHEMA FIELDS FOR TYPE INTEGER and NUMBER Minimum value of the Type.INTEGER and Type.NUMBER */
    minimum?: number;
    /** Optional. Default value of the data. */
    default?: any;
    /** Optional. The value should be validated against any (one or more) of the subschemas in the list. */
    anyOf?: Schema[];
    /** Optional. Maximum length of the Type.STRING */
    maxLength?: string;
    /** Optional. The title of the Schema. */
    title?: string;
    /** Optional. SCHEMA FIELDS FOR TYPE STRING Minimum length of the Type.STRING */
    minLength?: string;
    /** Optional. Minimum number of the properties for Type.OBJECT. */
    minProperties?: string;
    /** Optional. Maximum number of the elements for Type.ARRAY. */
    maxItems?: string;
    /** Optional. Maximum value of the Type.INTEGER and Type.NUMBER */
    maximum?: number;
    /** Optional. Indicates if the value may be null. */
    nullable?: boolean;
    /** Optional. Maximum number of the properties for Type.OBJECT. */
    maxProperties?: string;
    /** Optional. The type of the data. */
    type?: Type;
    /** Optional. The description of the data. */
    description?: string;
    /** Optional. Possible values of the element of primitive type with enum format. Examples: 1. We can define direction as : {type:STRING, format:enum, enum:["EAST", NORTH", "SOUTH", "WEST"]} 2. We can define apartment number as : {type:INTEGER, format:enum, enum:["101", "201", "301"]} */
    enum?: string[];
    /** Optional. The format of the data. Supported formats: for NUMBER type: "float", "double" for INTEGER type: "int32", "int64" for STRING type: "email", "byte", etc */
    format?: string;
    /** Optional. SCHEMA FIELDS FOR TYPE ARRAY Schema of the elements of Type.ARRAY. */
    items?: 'Schema';
    /** Optional. SCHEMA FIELDS FOR TYPE OBJECT Properties of Type.OBJECT. */
    properties?: Record<string, Schema>;
    /** Optional. Required properties of Type.OBJECT. */
    required?: string[];
}

export declare type SchemaUnion = Schema;

/** Google search entry point. */
export declare interface SearchEntryPoint {
    /** Optional. Web content snippet that can be embedded in a web page or an app webview. */
    renderedContent?: string;
    /** Optional. Base64 encoded JSON representing array of tuple. */
    sdkBlob?: string;
}

/** Segment of the content. */
export declare interface Segment {
    /** Output only. End index in the given Part, measured in bytes. Offset from the start of the Part, exclusive, starting at zero. */
    endIndex?: number;
    /** Output only. The index of a Part object within its parent Content object. */
    partIndex?: number;
    /** Output only. Start index in the given Part, measured in bytes. Offset from the start of the Part, inclusive, starting at zero. */
    startIndex?: number;
    /** Output only. The text corresponding to the segment from the response. */
    text?: string;
}

/**
 Session class represents a connection to the API.

 @experimental
 */
export declare class Session {
    readonly conn: WebSocket_2;
    private readonly apiClient;
    onmessage?: (msg: types.LiveServerMessage) => void;
    constructor(conn: WebSocket_2, apiClient: ApiClient);
    private handleMessage;
    private parseClientMessage;
    /**
     Transmits a message over the established websocket connection.

     @experimental
     */
    send(message: types.ContentListUnion | types.LiveClientContent | types.LiveClientRealtimeInput | types.LiveClientToolResponse | types.FunctionResponse | types.FunctionResponse[], turnComplete?: boolean): void;
    /**
     Close terminates the websocket connection.

     @experimental
     */
    close(): void;
}

/** The speech generation configuration. */
export declare interface SpeechConfig {
    /** The configuration for the speaker to use.
     */
    voiceConfig?: VoiceConfig;
}

export declare type SpeechConfigUnion = SpeechConfig | string;

export declare enum State {
    STATE_UNSPECIFIED = "STATE_UNSPECIFIED",
    ACTIVE = "ACTIVE",
    ERROR = "ERROR"
}

/** Configuration for a Style reference image. */
export declare interface StyleReferenceConfig {
    /** A text description of the style to use for the generated image. */
    styleDescription?: string;
}

/** A style reference image.

 This encapsulates a style reference image provided by the user, and
 additionally optional config parameters for the style reference image.

 A raw reference image can also be provided as a destination for the style to
 be applied to.
 */
export declare interface StyleReferenceImage {
    /** The reference image for the editing operation. */
    referenceImage?: Image_2;
    /** The id of the reference image. */
    referenceId?: number;
    /** The type of the reference image. Only set by the SDK. */
    referenceType?: string;
    /** Configuration for the style reference image. */
    config?: StyleReferenceConfig;
}

/** Configuration for a Subject reference image. */
export declare interface SubjectReferenceConfig {
    /** The subject type of a subject reference image. */
    subjectType?: SubjectReferenceType;
    /** Subject description for the image. */
    subjectDescription?: string;
}

/** A subject reference image.

 This encapsulates a subject reference image provided by the user, and
 additionally optional config parameters for the subject reference image.

 A raw reference image can also be provided as a destination for the subject to
 be applied to.
 */
export declare interface SubjectReferenceImage {
    /** The reference image for the editing operation. */
    referenceImage?: Image_2;
    /** The id of the reference image. */
    referenceId?: number;
    /** The type of the reference image. Only set by the SDK. */
    referenceType?: string;
    /** Configuration for the subject reference image. */
    config?: SubjectReferenceConfig;
}

export declare enum SubjectReferenceType {
    SUBJECT_TYPE_DEFAULT = "SUBJECT_TYPE_DEFAULT",
    SUBJECT_TYPE_PERSON = "SUBJECT_TYPE_PERSON",
    SUBJECT_TYPE_ANIMAL = "SUBJECT_TYPE_ANIMAL",
    SUBJECT_TYPE_PRODUCT = "SUBJECT_TYPE_PRODUCT"
}

/** Hyperparameters for SFT. */
export declare interface SupervisedHyperParameters {
    /** Optional. Adapter size for tuning. */
    adapterSize?: AdapterSize;
    /** Optional. Number of complete passes the model makes over the entire training dataset during training. */
    epochCount?: string;
    /** Optional. Multiplier for adjusting the default learning rate. */
    learningRateMultiplier?: number;
}

/** Dataset distribution for Supervised Tuning. */
export declare interface SupervisedTuningDatasetDistribution {
    /** Output only. Sum of a given population of values that are billable. */
    billableSum?: string;
    /** Output only. Defines the histogram bucket. */
    buckets?: SupervisedTuningDatasetDistributionDatasetBucket[];
    /** Output only. The maximum of the population values. */
    max?: number;
    /** Output only. The arithmetic mean of the values in the population. */
    mean?: number;
    /** Output only. The median of the values in the population. */
    median?: number;
    /** Output only. The minimum of the population values. */
    min?: number;
    /** Output only. The 5th percentile of the values in the population. */
    p5?: number;
    /** Output only. The 95th percentile of the values in the population. */
    p95?: number;
    /** Output only. Sum of a given population of values. */
    sum?: string;
}

/** Dataset bucket used to create a histogram for the distribution given a population of values. */
export declare interface SupervisedTuningDatasetDistributionDatasetBucket {
    /** Output only. Number of values in the bucket. */
    count?: number;
    /** Output only. Left bound of the bucket. */
    left?: number;
    /** Output only. Right bound of the bucket. */
    right?: number;
}

/** Tuning data statistics for Supervised Tuning. */
export declare interface SupervisedTuningDataStats {
    /** Output only. Number of billable characters in the tuning dataset. */
    totalBillableCharacterCount?: string;
    /** Output only. Number of billable tokens in the tuning dataset. */
    totalBillableTokenCount?: string;
    /** The number of examples in the dataset that have been truncated by any amount. */
    totalTruncatedExampleCount?: string;
    /** Output only. Number of tuning characters in the tuning dataset. */
    totalTuningCharacterCount?: string;
    /** A partial sample of the indices (starting from 1) of the truncated examples. */
    truncatedExampleIndices?: string[];
    /** Output only. Number of examples in the tuning dataset. */
    tuningDatasetExampleCount?: string;
    /** Output only. Number of tuning steps for this Tuning Job. */
    tuningStepCount?: string;
    /** Output only. Sample user messages in the training dataset uri. */
    userDatasetExamples?: Content[];
    /** Output only. Dataset distributions for the user input tokens. */
    userInputTokenDistribution?: SupervisedTuningDatasetDistribution;
    /** Output only. Dataset distributions for the messages per example. */
    userMessagePerExampleDistribution?: SupervisedTuningDatasetDistribution;
    /** Output only. Dataset distributions for the user output tokens. */
    userOutputTokenDistribution?: SupervisedTuningDatasetDistribution;
}

/** Tuning Spec for Supervised Tuning for first party models. */
export declare interface SupervisedTuningSpec {
    /** Optional. Hyperparameters for SFT. */
    hyperParameters?: SupervisedHyperParameters;
    /** Required. Cloud Storage path to file containing training dataset for tuning. The dataset must be formatted as a JSONL file. */
    trainingDatasetUri?: string;
    /** Optional. Cloud Storage path to file containing validation dataset for tuning. The dataset must be formatted as a JSONL file. */
    validationDatasetUri?: string;
}

export declare interface TestTableFile {
    comment?: string;
    testMethod?: string;
    parameterNames?: string[];
    testTable?: TestTableItem[];
}

export declare interface TestTableItem {
    /** The name of the test. This is used to derive the replay id. */
    name?: string;
    /** The parameters to the test. Use pydantic models. */
    parameters?: Record<string, any>;
    /** Expects an exception for MLDev matching the string. */
    exceptionIfMldev?: string;
    /** Expects an exception for Vertex matching the string. */
    exceptionIfVertex?: string;
    /** Use if you don't want to use the default replay id which is derived from the test name. */
    overrideReplayId?: string;
    /** True if the parameters contain an unsupported union type. This test  will be skipped for languages that do not support the union type. */
    hasUnion?: boolean;
    /** When set to a reason string, this test will be skipped in the API mode. Use this flag for tests that can not be reproduced with the real API. E.g. a test that deletes a resource. */
    skipInApiMode?: string;
}

/** The thinking features configuration. */
export declare interface ThinkingConfig {
    /** Indicates whether to include thoughts in the response. If true, thoughts are returned only if the model supports thought and thoughts are available.
     */
    includeThoughts?: boolean;
}

/** Tokens info with a list of tokens and the corresponding list of token ids. */
export declare interface TokensInfo {
    /** Optional. Optional fields for the role from the corresponding Content. */
    role?: string;
    /** A list of token ids from the input. */
    tokenIds?: string[];
    /** A list of tokens from the input. */
    tokens?: string[];
}

/** Tool details of a tool that the model may use to generate a response. */
export declare interface Tool {
    /** List of function declarations that the tool supports. */
    functionDeclarations?: FunctionDeclaration[];
    /** Optional. Retrieval tool type. System will always execute the provided retrieval tool(s) to get external knowledge to answer the prompt. Retrieval results are presented to the model for generation. */
    retrieval?: Retrieval;
    /** Optional. Google Search tool type. Specialized retrieval tool
     that is powered by Google Search. */
    googleSearch?: GoogleSearch;
    /** Optional. GoogleSearchRetrieval tool type. Specialized retrieval tool that is powered by Google search. */
    googleSearchRetrieval?: GoogleSearchRetrieval;
    /** Optional. CodeExecution tool type. Enables the model to execute code as part of generation. This field is only used by the Gemini Developer API services. */
    codeExecution?: ToolCodeExecution;
}

/** Tool that executes code generated by the model, and automatically returns the result to the model. See also [ExecutableCode]and [CodeExecutionResult] which are input and output to this tool. */
export declare interface ToolCodeExecution {
}

/** Tool config.

 This config is shared for all tools provided in the request.
 */
export declare interface ToolConfig {
    /** Optional. Function calling config. */
    functionCallingConfig?: FunctionCallingConfig;
}

export declare type ToolListUnion = Tool[] | Function[];

/** @internal */
export declare function toolToMldev(apiClient: ApiClient, fromObject: types.Tool, parentObject?: Record<string, unknown>): Record<string, unknown>;

/** @internal */
export declare function toolToVertex(apiClient: ApiClient, fromObject: types.Tool, parentObject?: Record<string, unknown>): Record<string, unknown>;

export declare interface TunedModel {
    /** Output only. The resource name of the TunedModel. Format: `projects/{project}/locations/{location}/models/{model}`. */
    model?: string;
    /** Output only. A resource name of an Endpoint. Format: `projects/{project}/locations/{location}/endpoints/{endpoint}`. */
    endpoint?: string;
}

/** Supervised fine-tuning training dataset. */
export declare interface TuningDataset {
    /** GCS URI of the file containing training dataset in JSONL format. */
    gcsUri?: string;
    /** Inline examples with simple input/output text. */
    examples?: TuningExample[];
}

/** The tuning data statistic values for TuningJob. */
export declare interface TuningDataStats {
    /** Output only. Statistics for distillation. */
    distillationDataStats?: DistillationDataStats;
    /** The SFT Tuning data stats. */
    supervisedTuningDataStats?: SupervisedTuningDataStats;
}

export declare interface TuningExample {
    /** Text model input. */
    textInput?: string;
    /** The expected model output. */
    output?: string;
}

/** A tuning job. */
export declare interface TuningJob {
    /** Output only. Identifier. Resource name of a TuningJob. Format: `projects/{project}/locations/{location}/tuningJobs/{tuning_job}` */
    name?: string;
    /** Output only. The detailed state of the job. */
    state?: JobState;
    /** Output only. Time when the TuningJob was created. */
    createTime?: string;
    /** Output only. Time when the TuningJob for the first time entered the `JOB_STATE_RUNNING` state. */
    startTime?: string;
    /** Output only. Time when the TuningJob entered any of the following JobStates: `JOB_STATE_SUCCEEDED`, `JOB_STATE_FAILED`, `JOB_STATE_CANCELLED`, `JOB_STATE_EXPIRED`. */
    endTime?: string;
    /** Output only. Time when the TuningJob was most recently updated. */
    updateTime?: string;
    /** Output only. Only populated when job's state is `JOB_STATE_FAILED` or `JOB_STATE_CANCELLED`. */
    error?: GoogleRpcStatus;
    /** Optional. The description of the TuningJob. */
    description?: string;
    /** The base model that is being tuned, e.g., "gemini-1.0-pro-002". . */
    baseModel?: string;
    /** Output only. The tuned model resources associated with this TuningJob. */
    tunedModel?: TunedModel;
    /** Tuning Spec for Supervised Fine Tuning. */
    supervisedTuningSpec?: SupervisedTuningSpec;
    /** Output only. The tuning data statistics associated with this TuningJob. */
    tuningDataStats?: TuningDataStats;
    /** Customer-managed encryption key options for a TuningJob. If this is set, then all resources created by the TuningJob will be encrypted with the provided encryption key. */
    encryptionSpec?: EncryptionSpec;
    /** Tuning Spec for open sourced and third party Partner models. */
    partnerModelTuningSpec?: PartnerModelTuningSpec;
    /** Tuning Spec for Distillation. */
    distillationSpec?: DistillationSpec;
    /** Output only. The Experiment associated with this TuningJob. */
    experiment?: string;
    /** Optional. The labels with user-defined metadata to organize TuningJob and generated resources such as Model and Endpoint. Label keys and values can be no longer than 64 characters (Unicode codepoints), can only contain lowercase letters, numeric characters, underscores and dashes. International characters are allowed. See https://goo.gl/xmQnxf for more information and examples of labels. */
    labels?: Record<string, string>;
    /** Output only. The resource name of the PipelineJob associated with the TuningJob. Format: `projects/{project}/locations/{location}/pipelineJobs/{pipeline_job}`. */
    pipelineJob?: string;
    /** Optional. The display name of the TunedModel. The name can be up to 128 characters long and can consist of any UTF-8 characters. */
    tunedModelDisplayName?: string;
}

declare class Tunings extends BaseModule {
    private readonly apiClient;
    constructor(apiClient: ApiClient);
    /**
     * Gets a TuningJob.
     *
     * @param name - The resource name of the tuning job.
     * @return - A TuningJob object.
     *
     * @experimental - The SDK's tuning implementation is experimental, and may
     * change in future versions.
     */
    get: (params: types.GetTuningJobParameters) => Promise<types.TuningJob>;
    /**
     * Lists tuning jobs.
     *
     * @param config - The configuration for the list request.
     * @return - A list of tuning jobs.
     *
     * @experimental - The SDK's tuning implementation is experimental, and may
     * change in future versions.
     */
    list: (params?: types.ListTuningJobsParameters) => Promise<Pager<types.TuningJob>>;
    /**
     * Creates a supervised fine-tuning job.
     *
     * @param params - The parameters for the tuning job.
     * @return - A TuningJob operation.
     *
     * @experimental - The SDK's tuning implementation is experimental, and may
     * change in future versions.
     */
    tune: (params: types.CreateTuningJobParameters) => Promise<types.TuningJob>;
    private getInternal;
    private listInternal;
    private tuneInternal;
    private tuneMldevInternal;
}

export declare interface TuningValidationDataset {
    /** GCS URI of the file containing validation dataset in JSONL format. */
    gcsUri?: string;
}

export declare enum Type {
    TYPE_UNSPECIFIED = "TYPE_UNSPECIFIED",
    STRING = "STRING",
    NUMBER = "NUMBER",
    INTEGER = "INTEGER",
    BOOLEAN = "BOOLEAN",
    ARRAY = "ARRAY",
    OBJECT = "OBJECT"
}

declare namespace types {
    export {
        createPartFromUri,
        createPartFromText,
        createPartFromFunctionCall,
        createPartFromFunctionResponse,
        createPartFromBase64,
        createPartFromVideoMetadata,
        createPartFromCodeExecutionResult,
        createPartFromExecutableCode,
        createUserContent,
        createModelContent,
        Outcome,
        Language,
        Type,
        HarmCategory,
        HarmBlockMethod,
        HarmBlockThreshold,
        Mode,
        FinishReason,
        HarmProbability,
        HarmSeverity,
        BlockedReason,
        JobState,
        AdapterSize,
        State,
        DynamicRetrievalConfigMode,
        FunctionCallingConfigMode,
        MediaResolution,
        SafetyFilterLevel,
        PersonGeneration,
        ImagePromptLanguage,
        FileState,
        FileSource,
        MaskReferenceMode,
        ControlReferenceType,
        SubjectReferenceType,
        Modality,
        VideoMetadata,
        CodeExecutionResult,
        ExecutableCode,
        FileData,
        FunctionCall,
        FunctionResponse,
        Blob_2 as Blob,
        Part,
        Content,
        HttpOptions,
        Schema,
        SafetySetting,
        FunctionDeclaration,
        GoogleSearch,
        DynamicRetrievalConfig,
        GoogleSearchRetrieval,
        VertexAISearch,
        VertexRagStoreRagResource,
        VertexRagStore,
        Retrieval,
        ToolCodeExecution,
        Tool,
        FunctionCallingConfig,
        ToolConfig,
        PrebuiltVoiceConfig,
        VoiceConfig,
        SpeechConfig,
        ThinkingConfig,
        GenerationConfigRoutingConfigAutoRoutingMode,
        GenerationConfigRoutingConfigManualRoutingMode,
        GenerationConfigRoutingConfig,
        GenerateContentConfig,
        GenerateContentParameters,
        GoogleTypeDate,
        Citation,
        CitationMetadata,
        GroundingChunkRetrievedContext,
        GroundingChunkWeb,
        GroundingChunk,
        Segment,
        GroundingSupport,
        RetrievalMetadata,
        SearchEntryPoint,
        GroundingMetadata,
        LogprobsResultCandidate,
        LogprobsResultTopCandidates,
        LogprobsResult,
        SafetyRating,
        Candidate,
        GenerateContentResponsePromptFeedback,
        GenerateContentResponseUsageMetadata,
        GenerateContentResponse,
        EmbedContentConfig,
        EmbedContentParameters,
        ContentEmbeddingStatistics,
        ContentEmbedding,
        EmbedContentMetadata,
        EmbedContentResponse,
        GenerateImagesConfig,
        GenerateImagesParameters,
        Image_2 as Image,
        GeneratedImage,
        GenerateImagesResponse,
        GenerationConfig,
        CountTokensConfig,
        CountTokensParameters,
        CountTokensResponse,
        ComputeTokensConfig,
        ComputeTokensParameters,
        TokensInfo,
        ComputeTokensResponse,
        GetTuningJobConfig,
        GetTuningJobParameters,
        TunedModel,
        GoogleRpcStatus,
        SupervisedHyperParameters,
        SupervisedTuningSpec,
        DatasetDistributionDistributionBucket,
        DatasetDistribution,
        DatasetStats,
        DistillationDataStats,
        SupervisedTuningDatasetDistributionDatasetBucket,
        SupervisedTuningDatasetDistribution,
        SupervisedTuningDataStats,
        TuningDataStats,
        EncryptionSpec,
        PartnerModelTuningSpec,
        DistillationHyperParameters,
        DistillationSpec,
        TuningJob,
        ListTuningJobsConfig,
        ListTuningJobsParameters,
        ListTuningJobsResponse,
        TuningExample,
        TuningDataset,
        TuningValidationDataset,
        CreateTuningJobConfig,
        CreateTuningJobParameters,
        Operation,
        CreateCachedContentConfig,
        CreateCachedContentParameters,
        CachedContentUsageMetadata,
        CachedContent,
        GetCachedContentConfig,
        GetCachedContentParameters,
        DeleteCachedContentConfig,
        DeleteCachedContentParameters,
        DeleteCachedContentResponse,
        UpdateCachedContentConfig,
        UpdateCachedContentParameters,
        ListCachedContentsConfig,
        ListCachedContentsParameters,
        ListCachedContentsResponse,
        ListFilesConfig,
        ListFilesParameters,
        FileStatus,
        File_2 as File,
        ListFilesResponse,
        CreateFileConfig,
        CreateFileParameters,
        HttpResponse,
        CreateFileResponse,
        GetFileConfig,
        GetFileParameters,
        TestTableItem,
        TestTableFile,
        ReplayRequest,
        ReplayResponse,
        ReplayInteraction,
        ReplayFile,
        UploadFileConfig,
        DownloadFileConfig,
        UpscaleImageConfig,
        UpscaleImageParameters,
        RawReferenceImage,
        MaskReferenceConfig,
        MaskReferenceImage,
        ControlReferenceConfig,
        ControlReferenceImage,
        StyleReferenceConfig,
        StyleReferenceImage,
        SubjectReferenceConfig,
        SubjectReferenceImage,
        LiveServerSetupComplete,
        LiveServerContent,
        LiveServerToolCall,
        LiveServerToolCallCancellation,
        LiveServerMessage,
        LiveClientSetup,
        LiveClientContent,
        LiveClientRealtimeInput,
        LiveClientToolResponse,
        LiveClientMessage,
        LiveConnectConfig,
        LiveConnectParameters,
        PartUnion,
        PartListUnion,
        ContentUnion,
        ContentListUnion,
        SchemaUnion,
        SpeechConfigUnion,
        ToolListUnion
    }
}

/** Optional parameters for caches.update method. */
export declare interface UpdateCachedContentConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
    /** The TTL for this resource. The expiration time is computed: now + TTL. */
    ttl?: string;
    /** Timestamp of when this resource is considered expired. */
    expireTime?: string;
}

export declare interface UpdateCachedContentParameters {
    /** The server-generated resource name of the cached content.
     */
    name: string;
    /** Configuration that contains optional parameters.
     */
    config?: UpdateCachedContentConfig;
}

/** Used to override the default configuration. */
export declare interface UploadFileConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
    /** The name of the file in the destination (e.g., 'files/sample-image'. If not provided one will be generated. */
    name?: string;
    /** mime_type: The MIME type of the file. If not provided, it will be inferred from the file extension. */
    mimeType?: string;
    /** Optional display name of the file. */
    displayName?: string;
}

/** Configuration for upscaling an image.

 For more information on this configuration, refer to
 the `Imagen API reference documentation
 <https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/imagen-api>`_.
 */
export declare interface UpscaleImageConfig {
    /** Used to override HTTP request options. */
    httpOptions?: HttpOptions;
    /** Whether to include a reason for filtered-out images in the
     response. */
    includeRaiReason?: boolean;
    /** The image format that the output should be saved as. */
    outputMimeType?: string;
    /** The level of compression if the ``output_mime_type`` is
     ``image/jpeg``. */
    outputCompressionQuality?: number;
}

/** User-facing config UpscaleImageParameters. */
export declare interface UpscaleImageParameters {
    /** The model to use. */
    model: string;
    /** The input image to upscale. */
    image: Image_2;
    /** The factor to upscale the image (x2 or x4). */
    upscaleFactor: string;
    /** Configuration for upscaling. */
    config?: UpscaleImageConfig;
}

/** Retrieve from Vertex AI Search datastore for grounding. See https://cloud.google.com/products/agent-builder */
export declare interface VertexAISearch {
    /** Required. Fully-qualified Vertex AI Search data store resource ID. Format: `projects/{project}/locations/{location}/collections/{collection}/dataStores/{dataStore}` */
    datastore?: string;
}

/** Retrieve from Vertex RAG Store for grounding. */
export declare interface VertexRagStore {
    /** Optional. Deprecated. Please use rag_resources instead. */
    ragCorpora?: string[];
    /** Optional. The representation of the rag source. It can be used to specify corpus only or ragfiles. Currently only support one corpus or multiple files from one corpus. In the future we may open up multiple corpora support. */
    ragResources?: VertexRagStoreRagResource[];
    /** Optional. Number of top k results to return from the selected corpora. */
    similarityTopK?: number;
    /** Optional. Only return results with vector distance smaller than the threshold. */
    vectorDistanceThreshold?: number;
}

/** The definition of the Rag resource. */
export declare interface VertexRagStoreRagResource {
    /** Optional. RagCorpora resource name. Format: `projects/{project}/locations/{location}/ragCorpora/{rag_corpus}` */
    ragCorpus?: string;
    /** Optional. rag_file_id. The files should be in the same rag_corpus set in rag_corpus field. */
    ragFileIds?: string[];
}

/** Metadata describes the input video content. */
export declare interface VideoMetadata {
    /** Optional. The end offset of the video. */
    endOffset?: string;
    /** Optional. The start offset of the video. */
    startOffset?: string;
}

/** The configuration for the voice to use. */
export declare interface VoiceConfig {
    /** The configuration for the speaker to use.
     */
    prebuiltVoiceConfig?: PrebuiltVoiceConfig;
}

/**
 Client for making requests in a browser-compatible environment.

 Use this client to make a request to the Gemini Developer API or Vertex AI
 API and then wait for the response.

 To initialize the client, Gemini API users can provide API key by providing
 input argument `apiKey="your-api-key"`.

 Vertex AI API users can provide inputs argument as `vertexai=true.

 Attributes:
 options: See ClientInitOptions for usage.

 Usage for the Gemini Developer API:

 ```ts
 import * as genai from ("@google/genai");

 const client = genai.Client({apiKey: 'my-api-key'})
 ```

 Usage for the Vertex AI API:

 ```ts
 import * as genai from ("@google/genai");

 const client = genai.Client({
 vertexai: true, project: 'my-project-id', location: 'us-central1'
 })
 ```
 */
export declare class WebClient {
    protected readonly apiClient: ApiClient;
    private readonly apiKey;
    readonly vertexai: boolean;
    private readonly apiVersion?;
    readonly models: Models;
    readonly live: Live;
    readonly tunings: Tunings;
    readonly chats: Chats;
    readonly caches: Caches;
    readonly files: Files;
    constructor(options: WebClientInitOptions);
}

/**
 * Options for initializing the WebClient. The client uses the parameters
 * for authentication purposes as well as to infer if SDK should send the
 * request to Vertex AI or Gemini API.
 */
export declare interface WebClientInitOptions {
    /**
     * The API Key.
     */
    apiKey: string;
    /**
     * Optional. Set to true if you intend to call Vertex AI endpoints.
     * If unset, default SDK behavior is to call Gemini API.
     */
    vertexai?: boolean;
    /**
     * Optional. The API version for the endpoint.
     * If unset, SDK will choose a default api version.
     */
    apiVersion?: string;
    /**
     * Optional. A set of customizable configuration for HTTP requests.
     */
    httpOptions?: HttpOptions;
}

declare interface WebSocket_2 {
    /**
     * Connects the socket to the server.
     */
    connect(): void;
    /**
     * Sends a message to the server.
     */
    send(message: string): void;
    /**
     * Closes the socket connection.
     */
    close(): void;
    /**
     * Sets the callback function for message events.
     */
    setOnMessageCallback(callback: (e: any) => void): void;
}

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
declare interface WebSocketCallbacks {
    onopen: () => void;
    onerror: (e: any) => void;
    onmessage: (e: any) => void;
    onclose: (e: any) => void;
}

declare interface WebSocketFactory {
    /**
     * Returns a new WebSocket instance.
     */
    create(url: string, headers: Record<string, string>, callbacks: WebSocketCallbacks): WebSocket_2;
}

export { }
