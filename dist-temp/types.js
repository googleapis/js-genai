/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { generateVideosOperationFromMldev, generateVideosOperationFromVertex, importFileOperationFromMldev, uploadToFileSearchStoreOperationFromMldev, } from './converters/_operations_converters.js';
/** Outcome of the code execution. */
export var Outcome;
(function (Outcome) {
    /**
     * Unspecified status. This value should not be used.
     */
    Outcome["OUTCOME_UNSPECIFIED"] = "OUTCOME_UNSPECIFIED";
    /**
     * Code execution completed successfully.
     */
    Outcome["OUTCOME_OK"] = "OUTCOME_OK";
    /**
     * Code execution finished but with a failure. `stderr` should contain the reason.
     */
    Outcome["OUTCOME_FAILED"] = "OUTCOME_FAILED";
    /**
     * Code execution ran for too long, and was cancelled. There may or may not be a partial output present.
     */
    Outcome["OUTCOME_DEADLINE_EXCEEDED"] = "OUTCOME_DEADLINE_EXCEEDED";
})(Outcome || (Outcome = {}));
/** Programming language of the `code`. */
export var Language;
(function (Language) {
    /**
     * Unspecified language. This value should not be used.
     */
    Language["LANGUAGE_UNSPECIFIED"] = "LANGUAGE_UNSPECIFIED";
    /**
     * Python >= 3.10, with numpy and simpy available.
     */
    Language["PYTHON"] = "PYTHON";
})(Language || (Language = {}));
/** Specifies how the response should be scheduled in the conversation. */
export var FunctionResponseScheduling;
(function (FunctionResponseScheduling) {
    /**
     * This value is unused.
     */
    FunctionResponseScheduling["SCHEDULING_UNSPECIFIED"] = "SCHEDULING_UNSPECIFIED";
    /**
     * Only add the result to the conversation context, do not interrupt or trigger generation.
     */
    FunctionResponseScheduling["SILENT"] = "SILENT";
    /**
     * Add the result to the conversation context, and prompt to generate output without interrupting ongoing generation.
     */
    FunctionResponseScheduling["WHEN_IDLE"] = "WHEN_IDLE";
    /**
     * Add the result to the conversation context, interrupt ongoing generation and prompt to generate output.
     */
    FunctionResponseScheduling["INTERRUPT"] = "INTERRUPT";
})(FunctionResponseScheduling || (FunctionResponseScheduling = {}));
/** The type of the data. */
export var Type;
(function (Type) {
    /**
     * Not specified, should not be used.
     */
    Type["TYPE_UNSPECIFIED"] = "TYPE_UNSPECIFIED";
    /**
     * OpenAPI string type
     */
    Type["STRING"] = "STRING";
    /**
     * OpenAPI number type
     */
    Type["NUMBER"] = "NUMBER";
    /**
     * OpenAPI integer type
     */
    Type["INTEGER"] = "INTEGER";
    /**
     * OpenAPI boolean type
     */
    Type["BOOLEAN"] = "BOOLEAN";
    /**
     * OpenAPI array type
     */
    Type["ARRAY"] = "ARRAY";
    /**
     * OpenAPI object type
     */
    Type["OBJECT"] = "OBJECT";
    /**
     * Null type
     */
    Type["NULL"] = "NULL";
})(Type || (Type = {}));
/** The mode of the predictor to be used in dynamic retrieval. */
export var Mode;
(function (Mode) {
    /**
     * Always trigger retrieval.
     */
    Mode["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
    /**
     * Run retrieval only when system decides it is necessary.
     */
    Mode["MODE_DYNAMIC"] = "MODE_DYNAMIC";
})(Mode || (Mode = {}));
/** The API spec that the external API implements. This enum is not supported in Gemini API. */
export var ApiSpec;
(function (ApiSpec) {
    /**
     * Unspecified API spec. This value should not be used.
     */
    ApiSpec["API_SPEC_UNSPECIFIED"] = "API_SPEC_UNSPECIFIED";
    /**
     * Simple search API spec.
     */
    ApiSpec["SIMPLE_SEARCH"] = "SIMPLE_SEARCH";
    /**
     * Elastic search API spec.
     */
    ApiSpec["ELASTIC_SEARCH"] = "ELASTIC_SEARCH";
})(ApiSpec || (ApiSpec = {}));
/** Type of auth scheme. This enum is not supported in Gemini API. */
export var AuthType;
(function (AuthType) {
    AuthType["AUTH_TYPE_UNSPECIFIED"] = "AUTH_TYPE_UNSPECIFIED";
    /**
     * No Auth.
     */
    AuthType["NO_AUTH"] = "NO_AUTH";
    /**
     * API Key Auth.
     */
    AuthType["API_KEY_AUTH"] = "API_KEY_AUTH";
    /**
     * HTTP Basic Auth.
     */
    AuthType["HTTP_BASIC_AUTH"] = "HTTP_BASIC_AUTH";
    /**
     * Google Service Account Auth.
     */
    AuthType["GOOGLE_SERVICE_ACCOUNT_AUTH"] = "GOOGLE_SERVICE_ACCOUNT_AUTH";
    /**
     * OAuth auth.
     */
    AuthType["OAUTH"] = "OAUTH";
    /**
     * OpenID Connect (OIDC) Auth.
     */
    AuthType["OIDC_AUTH"] = "OIDC_AUTH";
})(AuthType || (AuthType = {}));
/** The location of the API key. This enum is not supported in Gemini API. */
export var HttpElementLocation;
(function (HttpElementLocation) {
    HttpElementLocation["HTTP_IN_UNSPECIFIED"] = "HTTP_IN_UNSPECIFIED";
    /**
     * Element is in the HTTP request query.
     */
    HttpElementLocation["HTTP_IN_QUERY"] = "HTTP_IN_QUERY";
    /**
     * Element is in the HTTP request header.
     */
    HttpElementLocation["HTTP_IN_HEADER"] = "HTTP_IN_HEADER";
    /**
     * Element is in the HTTP request path.
     */
    HttpElementLocation["HTTP_IN_PATH"] = "HTTP_IN_PATH";
    /**
     * Element is in the HTTP request body.
     */
    HttpElementLocation["HTTP_IN_BODY"] = "HTTP_IN_BODY";
    /**
     * Element is in the HTTP request cookie.
     */
    HttpElementLocation["HTTP_IN_COOKIE"] = "HTTP_IN_COOKIE";
})(HttpElementLocation || (HttpElementLocation = {}));
/** Sites with confidence level chosen & above this value will be blocked from the search results. This enum is not supported in Gemini API. */
export var PhishBlockThreshold;
(function (PhishBlockThreshold) {
    /**
     * Defaults to unspecified.
     */
    PhishBlockThreshold["PHISH_BLOCK_THRESHOLD_UNSPECIFIED"] = "PHISH_BLOCK_THRESHOLD_UNSPECIFIED";
    /**
     * Blocks Low and above confidence URL that is risky.
     */
    PhishBlockThreshold["BLOCK_LOW_AND_ABOVE"] = "BLOCK_LOW_AND_ABOVE";
    /**
     * Blocks Medium and above confidence URL that is risky.
     */
    PhishBlockThreshold["BLOCK_MEDIUM_AND_ABOVE"] = "BLOCK_MEDIUM_AND_ABOVE";
    /**
     * Blocks High and above confidence URL that is risky.
     */
    PhishBlockThreshold["BLOCK_HIGH_AND_ABOVE"] = "BLOCK_HIGH_AND_ABOVE";
    /**
     * Blocks Higher and above confidence URL that is risky.
     */
    PhishBlockThreshold["BLOCK_HIGHER_AND_ABOVE"] = "BLOCK_HIGHER_AND_ABOVE";
    /**
     * Blocks Very high and above confidence URL that is risky.
     */
    PhishBlockThreshold["BLOCK_VERY_HIGH_AND_ABOVE"] = "BLOCK_VERY_HIGH_AND_ABOVE";
    /**
     * Blocks Extremely high confidence URL that is risky.
     */
    PhishBlockThreshold["BLOCK_ONLY_EXTREMELY_HIGH"] = "BLOCK_ONLY_EXTREMELY_HIGH";
})(PhishBlockThreshold || (PhishBlockThreshold = {}));
/** The level of thoughts tokens that the model should generate. */
export var ThinkingLevel;
(function (ThinkingLevel) {
    /**
     * Default value.
     */
    ThinkingLevel["THINKING_LEVEL_UNSPECIFIED"] = "THINKING_LEVEL_UNSPECIFIED";
    /**
     * Low thinking level.
     */
    ThinkingLevel["LOW"] = "LOW";
    /**
     * High thinking level.
     */
    ThinkingLevel["HIGH"] = "HIGH";
})(ThinkingLevel || (ThinkingLevel = {}));
/** Harm category. */
export var HarmCategory;
(function (HarmCategory) {
    /**
     * The harm category is unspecified.
     */
    HarmCategory["HARM_CATEGORY_UNSPECIFIED"] = "HARM_CATEGORY_UNSPECIFIED";
    /**
     * The harm category is harassment.
     */
    HarmCategory["HARM_CATEGORY_HARASSMENT"] = "HARM_CATEGORY_HARASSMENT";
    /**
     * The harm category is hate speech.
     */
    HarmCategory["HARM_CATEGORY_HATE_SPEECH"] = "HARM_CATEGORY_HATE_SPEECH";
    /**
     * The harm category is sexually explicit content.
     */
    HarmCategory["HARM_CATEGORY_SEXUALLY_EXPLICIT"] = "HARM_CATEGORY_SEXUALLY_EXPLICIT";
    /**
     * The harm category is dangerous content.
     */
    HarmCategory["HARM_CATEGORY_DANGEROUS_CONTENT"] = "HARM_CATEGORY_DANGEROUS_CONTENT";
    /**
     * Deprecated: Election filter is not longer supported. The harm category is civic integrity.
     */
    HarmCategory["HARM_CATEGORY_CIVIC_INTEGRITY"] = "HARM_CATEGORY_CIVIC_INTEGRITY";
    /**
     * The harm category is image hate. This enum value is not supported in Gemini API.
     */
    HarmCategory["HARM_CATEGORY_IMAGE_HATE"] = "HARM_CATEGORY_IMAGE_HATE";
    /**
     * The harm category is image dangerous content. This enum value is not supported in Gemini API.
     */
    HarmCategory["HARM_CATEGORY_IMAGE_DANGEROUS_CONTENT"] = "HARM_CATEGORY_IMAGE_DANGEROUS_CONTENT";
    /**
     * The harm category is image harassment. This enum value is not supported in Gemini API.
     */
    HarmCategory["HARM_CATEGORY_IMAGE_HARASSMENT"] = "HARM_CATEGORY_IMAGE_HARASSMENT";
    /**
     * The harm category is image sexually explicit content. This enum value is not supported in Gemini API.
     */
    HarmCategory["HARM_CATEGORY_IMAGE_SEXUALLY_EXPLICIT"] = "HARM_CATEGORY_IMAGE_SEXUALLY_EXPLICIT";
    /**
     * The harm category is for jailbreak prompts. This enum value is not supported in Gemini API.
     */
    HarmCategory["HARM_CATEGORY_JAILBREAK"] = "HARM_CATEGORY_JAILBREAK";
})(HarmCategory || (HarmCategory = {}));
/** Specify if the threshold is used for probability or severity score. If not specified, the threshold is used for probability score. This enum is not supported in Gemini API. */
export var HarmBlockMethod;
(function (HarmBlockMethod) {
    /**
     * The harm block method is unspecified.
     */
    HarmBlockMethod["HARM_BLOCK_METHOD_UNSPECIFIED"] = "HARM_BLOCK_METHOD_UNSPECIFIED";
    /**
     * The harm block method uses both probability and severity scores.
     */
    HarmBlockMethod["SEVERITY"] = "SEVERITY";
    /**
     * The harm block method uses the probability score.
     */
    HarmBlockMethod["PROBABILITY"] = "PROBABILITY";
})(HarmBlockMethod || (HarmBlockMethod = {}));
/** The harm block threshold. */
export var HarmBlockThreshold;
(function (HarmBlockThreshold) {
    /**
     * Unspecified harm block threshold.
     */
    HarmBlockThreshold["HARM_BLOCK_THRESHOLD_UNSPECIFIED"] = "HARM_BLOCK_THRESHOLD_UNSPECIFIED";
    /**
     * Block low threshold and above (i.e. block more).
     */
    HarmBlockThreshold["BLOCK_LOW_AND_ABOVE"] = "BLOCK_LOW_AND_ABOVE";
    /**
     * Block medium threshold and above.
     */
    HarmBlockThreshold["BLOCK_MEDIUM_AND_ABOVE"] = "BLOCK_MEDIUM_AND_ABOVE";
    /**
     * Block only high threshold (i.e. block less).
     */
    HarmBlockThreshold["BLOCK_ONLY_HIGH"] = "BLOCK_ONLY_HIGH";
    /**
     * Block none.
     */
    HarmBlockThreshold["BLOCK_NONE"] = "BLOCK_NONE";
    /**
     * Turn off the safety filter.
     */
    HarmBlockThreshold["OFF"] = "OFF";
})(HarmBlockThreshold || (HarmBlockThreshold = {}));
/** Output only. The reason why the model stopped generating tokens.

If empty, the model has not stopped generating the tokens. */
export var FinishReason;
(function (FinishReason) {
    /**
     * The finish reason is unspecified.
     */
    FinishReason["FINISH_REASON_UNSPECIFIED"] = "FINISH_REASON_UNSPECIFIED";
    /**
     * Token generation reached a natural stopping point or a configured stop sequence.
     */
    FinishReason["STOP"] = "STOP";
    /**
     * Token generation reached the configured maximum output tokens.
     */
    FinishReason["MAX_TOKENS"] = "MAX_TOKENS";
    /**
     * Token generation stopped because the content potentially contains safety violations. NOTE: When streaming, [content][] is empty if content filters blocks the output.
     */
    FinishReason["SAFETY"] = "SAFETY";
    /**
     * The token generation stopped because of potential recitation.
     */
    FinishReason["RECITATION"] = "RECITATION";
    /**
     * The token generation stopped because of using an unsupported language.
     */
    FinishReason["LANGUAGE"] = "LANGUAGE";
    /**
     * All other reasons that stopped the token generation.
     */
    FinishReason["OTHER"] = "OTHER";
    /**
     * Token generation stopped because the content contains forbidden terms.
     */
    FinishReason["BLOCKLIST"] = "BLOCKLIST";
    /**
     * Token generation stopped for potentially containing prohibited content.
     */
    FinishReason["PROHIBITED_CONTENT"] = "PROHIBITED_CONTENT";
    /**
     * Token generation stopped because the content potentially contains Sensitive Personally Identifiable Information (SPII).
     */
    FinishReason["SPII"] = "SPII";
    /**
     * The function call generated by the model is invalid.
     */
    FinishReason["MALFORMED_FUNCTION_CALL"] = "MALFORMED_FUNCTION_CALL";
    /**
     * Token generation stopped because generated images have safety violations.
     */
    FinishReason["IMAGE_SAFETY"] = "IMAGE_SAFETY";
    /**
     * The tool call generated by the model is invalid.
     */
    FinishReason["UNEXPECTED_TOOL_CALL"] = "UNEXPECTED_TOOL_CALL";
    /**
     * Image generation stopped because the generated images have prohibited content.
     */
    FinishReason["IMAGE_PROHIBITED_CONTENT"] = "IMAGE_PROHIBITED_CONTENT";
    /**
     * The model was expected to generate an image, but none was generated.
     */
    FinishReason["NO_IMAGE"] = "NO_IMAGE";
})(FinishReason || (FinishReason = {}));
/** Output only. Harm probability levels in the content. */
export var HarmProbability;
(function (HarmProbability) {
    /**
     * Harm probability unspecified.
     */
    HarmProbability["HARM_PROBABILITY_UNSPECIFIED"] = "HARM_PROBABILITY_UNSPECIFIED";
    /**
     * Negligible level of harm.
     */
    HarmProbability["NEGLIGIBLE"] = "NEGLIGIBLE";
    /**
     * Low level of harm.
     */
    HarmProbability["LOW"] = "LOW";
    /**
     * Medium level of harm.
     */
    HarmProbability["MEDIUM"] = "MEDIUM";
    /**
     * High level of harm.
     */
    HarmProbability["HIGH"] = "HIGH";
})(HarmProbability || (HarmProbability = {}));
/** Output only. Harm severity levels in the content. This enum is not supported in Gemini API. */
export var HarmSeverity;
(function (HarmSeverity) {
    /**
     * Harm severity unspecified.
     */
    HarmSeverity["HARM_SEVERITY_UNSPECIFIED"] = "HARM_SEVERITY_UNSPECIFIED";
    /**
     * Negligible level of harm severity.
     */
    HarmSeverity["HARM_SEVERITY_NEGLIGIBLE"] = "HARM_SEVERITY_NEGLIGIBLE";
    /**
     * Low level of harm severity.
     */
    HarmSeverity["HARM_SEVERITY_LOW"] = "HARM_SEVERITY_LOW";
    /**
     * Medium level of harm severity.
     */
    HarmSeverity["HARM_SEVERITY_MEDIUM"] = "HARM_SEVERITY_MEDIUM";
    /**
     * High level of harm severity.
     */
    HarmSeverity["HARM_SEVERITY_HIGH"] = "HARM_SEVERITY_HIGH";
})(HarmSeverity || (HarmSeverity = {}));
/** Status of the url retrieval. */
export var UrlRetrievalStatus;
(function (UrlRetrievalStatus) {
    /**
     * Default value. This value is unused.
     */
    UrlRetrievalStatus["URL_RETRIEVAL_STATUS_UNSPECIFIED"] = "URL_RETRIEVAL_STATUS_UNSPECIFIED";
    /**
     * Url retrieval is successful.
     */
    UrlRetrievalStatus["URL_RETRIEVAL_STATUS_SUCCESS"] = "URL_RETRIEVAL_STATUS_SUCCESS";
    /**
     * Url retrieval is failed due to error.
     */
    UrlRetrievalStatus["URL_RETRIEVAL_STATUS_ERROR"] = "URL_RETRIEVAL_STATUS_ERROR";
    /**
     * Url retrieval is failed because the content is behind paywall. This enum value is not supported in Vertex AI.
     */
    UrlRetrievalStatus["URL_RETRIEVAL_STATUS_PAYWALL"] = "URL_RETRIEVAL_STATUS_PAYWALL";
    /**
     * Url retrieval is failed because the content is unsafe. This enum value is not supported in Vertex AI.
     */
    UrlRetrievalStatus["URL_RETRIEVAL_STATUS_UNSAFE"] = "URL_RETRIEVAL_STATUS_UNSAFE";
})(UrlRetrievalStatus || (UrlRetrievalStatus = {}));
/** Output only. The reason why the prompt was blocked. */
export var BlockedReason;
(function (BlockedReason) {
    /**
     * The blocked reason is unspecified.
     */
    BlockedReason["BLOCKED_REASON_UNSPECIFIED"] = "BLOCKED_REASON_UNSPECIFIED";
    /**
     * The prompt was blocked for safety reasons.
     */
    BlockedReason["SAFETY"] = "SAFETY";
    /**
     * The prompt was blocked for other reasons. For example, it may be due to the prompt's language, or because it contains other harmful content.
     */
    BlockedReason["OTHER"] = "OTHER";
    /**
     * The prompt was blocked because it contains a term from the terminology blocklist.
     */
    BlockedReason["BLOCKLIST"] = "BLOCKLIST";
    /**
     * The prompt was blocked because it contains prohibited content.
     */
    BlockedReason["PROHIBITED_CONTENT"] = "PROHIBITED_CONTENT";
    /**
     * The prompt was blocked because it contains content that is unsafe for image generation.
     */
    BlockedReason["IMAGE_SAFETY"] = "IMAGE_SAFETY";
    /**
     * The prompt was blocked by Model Armor. This enum value is not supported in Gemini API.
     */
    BlockedReason["MODEL_ARMOR"] = "MODEL_ARMOR";
    /**
     * The prompt was blocked as a jailbreak attempt. This enum value is not supported in Gemini API.
     */
    BlockedReason["JAILBREAK"] = "JAILBREAK";
})(BlockedReason || (BlockedReason = {}));
/** Output only. The traffic type for this request. This enum is not supported in Gemini API. */
export var TrafficType;
(function (TrafficType) {
    /**
     * Unspecified request traffic type.
     */
    TrafficType["TRAFFIC_TYPE_UNSPECIFIED"] = "TRAFFIC_TYPE_UNSPECIFIED";
    /**
     * The request was processed using Pay-As-You-Go quota.
     */
    TrafficType["ON_DEMAND"] = "ON_DEMAND";
    /**
     * Type for Provisioned Throughput traffic.
     */
    TrafficType["PROVISIONED_THROUGHPUT"] = "PROVISIONED_THROUGHPUT";
})(TrafficType || (TrafficType = {}));
/** Server content modalities. */
export var Modality;
(function (Modality) {
    /**
     * The modality is unspecified.
     */
    Modality["MODALITY_UNSPECIFIED"] = "MODALITY_UNSPECIFIED";
    /**
     * Indicates the model should return text
     */
    Modality["TEXT"] = "TEXT";
    /**
     * Indicates the model should return images.
     */
    Modality["IMAGE"] = "IMAGE";
    /**
     * Indicates the model should return audio.
     */
    Modality["AUDIO"] = "AUDIO";
})(Modality || (Modality = {}));
/** The media resolution to use. */
export var MediaResolution;
(function (MediaResolution) {
    /**
     * Media resolution has not been set
     */
    MediaResolution["MEDIA_RESOLUTION_UNSPECIFIED"] = "MEDIA_RESOLUTION_UNSPECIFIED";
    /**
     * Media resolution set to low (64 tokens).
     */
    MediaResolution["MEDIA_RESOLUTION_LOW"] = "MEDIA_RESOLUTION_LOW";
    /**
     * Media resolution set to medium (256 tokens).
     */
    MediaResolution["MEDIA_RESOLUTION_MEDIUM"] = "MEDIA_RESOLUTION_MEDIUM";
    /**
     * Media resolution set to high (zoomed reframing with 256 tokens).
     */
    MediaResolution["MEDIA_RESOLUTION_HIGH"] = "MEDIA_RESOLUTION_HIGH";
})(MediaResolution || (MediaResolution = {}));
/** Tuning mode. This enum is not supported in Gemini API. */
export var TuningMode;
(function (TuningMode) {
    /**
     * Tuning mode is unspecified.
     */
    TuningMode["TUNING_MODE_UNSPECIFIED"] = "TUNING_MODE_UNSPECIFIED";
    /**
     * Full fine-tuning mode.
     */
    TuningMode["TUNING_MODE_FULL"] = "TUNING_MODE_FULL";
    /**
     * PEFT adapter tuning mode.
     */
    TuningMode["TUNING_MODE_PEFT_ADAPTER"] = "TUNING_MODE_PEFT_ADAPTER";
})(TuningMode || (TuningMode = {}));
/** Adapter size for tuning. This enum is not supported in Gemini API. */
export var AdapterSize;
(function (AdapterSize) {
    /**
     * Adapter size is unspecified.
     */
    AdapterSize["ADAPTER_SIZE_UNSPECIFIED"] = "ADAPTER_SIZE_UNSPECIFIED";
    /**
     * Adapter size 1.
     */
    AdapterSize["ADAPTER_SIZE_ONE"] = "ADAPTER_SIZE_ONE";
    /**
     * Adapter size 2.
     */
    AdapterSize["ADAPTER_SIZE_TWO"] = "ADAPTER_SIZE_TWO";
    /**
     * Adapter size 4.
     */
    AdapterSize["ADAPTER_SIZE_FOUR"] = "ADAPTER_SIZE_FOUR";
    /**
     * Adapter size 8.
     */
    AdapterSize["ADAPTER_SIZE_EIGHT"] = "ADAPTER_SIZE_EIGHT";
    /**
     * Adapter size 16.
     */
    AdapterSize["ADAPTER_SIZE_SIXTEEN"] = "ADAPTER_SIZE_SIXTEEN";
    /**
     * Adapter size 32.
     */
    AdapterSize["ADAPTER_SIZE_THIRTY_TWO"] = "ADAPTER_SIZE_THIRTY_TWO";
})(AdapterSize || (AdapterSize = {}));
/** Job state. */
export var JobState;
(function (JobState) {
    /**
     * The job state is unspecified.
     */
    JobState["JOB_STATE_UNSPECIFIED"] = "JOB_STATE_UNSPECIFIED";
    /**
     * The job has been just created or resumed and processing has not yet begun.
     */
    JobState["JOB_STATE_QUEUED"] = "JOB_STATE_QUEUED";
    /**
     * The service is preparing to run the job.
     */
    JobState["JOB_STATE_PENDING"] = "JOB_STATE_PENDING";
    /**
     * The job is in progress.
     */
    JobState["JOB_STATE_RUNNING"] = "JOB_STATE_RUNNING";
    /**
     * The job completed successfully.
     */
    JobState["JOB_STATE_SUCCEEDED"] = "JOB_STATE_SUCCEEDED";
    /**
     * The job failed.
     */
    JobState["JOB_STATE_FAILED"] = "JOB_STATE_FAILED";
    /**
     * The job is being cancelled. From this state the job may only go to either `JOB_STATE_SUCCEEDED`, `JOB_STATE_FAILED` or `JOB_STATE_CANCELLED`.
     */
    JobState["JOB_STATE_CANCELLING"] = "JOB_STATE_CANCELLING";
    /**
     * The job has been cancelled.
     */
    JobState["JOB_STATE_CANCELLED"] = "JOB_STATE_CANCELLED";
    /**
     * The job has been stopped, and can be resumed.
     */
    JobState["JOB_STATE_PAUSED"] = "JOB_STATE_PAUSED";
    /**
     * The job has expired.
     */
    JobState["JOB_STATE_EXPIRED"] = "JOB_STATE_EXPIRED";
    /**
     * The job is being updated. Only jobs in the `JOB_STATE_RUNNING` state can be updated. After updating, the job goes back to the `JOB_STATE_RUNNING` state.
     */
    JobState["JOB_STATE_UPDATING"] = "JOB_STATE_UPDATING";
    /**
     * The job is partially succeeded, some results may be missing due to errors.
     */
    JobState["JOB_STATE_PARTIALLY_SUCCEEDED"] = "JOB_STATE_PARTIALLY_SUCCEEDED";
})(JobState || (JobState = {}));
/** The tuning task. Either I2V or T2V. This enum is not supported in Gemini API. */
export var TuningTask;
(function (TuningTask) {
    /**
     * Default value. This value is unused.
     */
    TuningTask["TUNING_TASK_UNSPECIFIED"] = "TUNING_TASK_UNSPECIFIED";
    /**
     * Tuning task for image to video.
     */
    TuningTask["TUNING_TASK_I2V"] = "TUNING_TASK_I2V";
    /**
     * Tuning task for text to video.
     */
    TuningTask["TUNING_TASK_T2V"] = "TUNING_TASK_T2V";
    /**
     * Tuning task for reference to video.
     */
    TuningTask["TUNING_TASK_R2V"] = "TUNING_TASK_R2V";
})(TuningTask || (TuningTask = {}));
/** The tokenization quality used for given media. */
export var PartMediaResolutionLevel;
(function (PartMediaResolutionLevel) {
    /**
     * Media resolution has not been set.
     */
    PartMediaResolutionLevel["MEDIA_RESOLUTION_UNSPECIFIED"] = "MEDIA_RESOLUTION_UNSPECIFIED";
    /**
     * Media resolution set to low.
     */
    PartMediaResolutionLevel["MEDIA_RESOLUTION_LOW"] = "MEDIA_RESOLUTION_LOW";
    /**
     * Media resolution set to medium.
     */
    PartMediaResolutionLevel["MEDIA_RESOLUTION_MEDIUM"] = "MEDIA_RESOLUTION_MEDIUM";
    /**
     * Media resolution set to high.
     */
    PartMediaResolutionLevel["MEDIA_RESOLUTION_HIGH"] = "MEDIA_RESOLUTION_HIGH";
})(PartMediaResolutionLevel || (PartMediaResolutionLevel = {}));
/** Options for feature selection preference. */
export var FeatureSelectionPreference;
(function (FeatureSelectionPreference) {
    FeatureSelectionPreference["FEATURE_SELECTION_PREFERENCE_UNSPECIFIED"] = "FEATURE_SELECTION_PREFERENCE_UNSPECIFIED";
    FeatureSelectionPreference["PRIORITIZE_QUALITY"] = "PRIORITIZE_QUALITY";
    FeatureSelectionPreference["BALANCED"] = "BALANCED";
    FeatureSelectionPreference["PRIORITIZE_COST"] = "PRIORITIZE_COST";
})(FeatureSelectionPreference || (FeatureSelectionPreference = {}));
/** Defines the function behavior. Defaults to `BLOCKING`. */
export var Behavior;
(function (Behavior) {
    /**
     * This value is unused.
     */
    Behavior["UNSPECIFIED"] = "UNSPECIFIED";
    /**
     * If set, the system will wait to receive the function response before continuing the conversation.
     */
    Behavior["BLOCKING"] = "BLOCKING";
    /**
     * If set, the system will not wait to receive the function response. Instead, it will attempt to handle function responses as they become available while maintaining the conversation between the user and the model.
     */
    Behavior["NON_BLOCKING"] = "NON_BLOCKING";
})(Behavior || (Behavior = {}));
/** Config for the dynamic retrieval config mode. */
export var DynamicRetrievalConfigMode;
(function (DynamicRetrievalConfigMode) {
    /**
     * Always trigger retrieval.
     */
    DynamicRetrievalConfigMode["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
    /**
     * Run retrieval only when system decides it is necessary.
     */
    DynamicRetrievalConfigMode["MODE_DYNAMIC"] = "MODE_DYNAMIC";
})(DynamicRetrievalConfigMode || (DynamicRetrievalConfigMode = {}));
/** The environment being operated. */
export var Environment;
(function (Environment) {
    /**
     * Defaults to browser.
     */
    Environment["ENVIRONMENT_UNSPECIFIED"] = "ENVIRONMENT_UNSPECIFIED";
    /**
     * Operates in a web browser.
     */
    Environment["ENVIRONMENT_BROWSER"] = "ENVIRONMENT_BROWSER";
})(Environment || (Environment = {}));
/** Config for the function calling config mode. */
export var FunctionCallingConfigMode;
(function (FunctionCallingConfigMode) {
    /**
     * The function calling config mode is unspecified. Should not be used.
     */
    FunctionCallingConfigMode["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
    /**
     * Default model behavior, model decides to predict either function calls or natural language response.
     */
    FunctionCallingConfigMode["AUTO"] = "AUTO";
    /**
     * Model is constrained to always predicting function calls only. If "allowed_function_names" are set, the predicted function calls will be limited to any one of "allowed_function_names", else the predicted function calls will be any one of the provided "function_declarations".
     */
    FunctionCallingConfigMode["ANY"] = "ANY";
    /**
     * Model will not predict any function calls. Model behavior is same as when not passing any function declarations.
     */
    FunctionCallingConfigMode["NONE"] = "NONE";
    /**
     * Model decides to predict either a function call or a natural language response, but will validate function calls with constrained decoding. If "allowed_function_names" are set, the predicted function call will be limited to any one of "allowed_function_names", else the predicted function call will be any one of the provided "function_declarations".
     */
    FunctionCallingConfigMode["VALIDATED"] = "VALIDATED";
})(FunctionCallingConfigMode || (FunctionCallingConfigMode = {}));
/** Enum that controls the safety filter level for objectionable content. */
export var SafetyFilterLevel;
(function (SafetyFilterLevel) {
    SafetyFilterLevel["BLOCK_LOW_AND_ABOVE"] = "BLOCK_LOW_AND_ABOVE";
    SafetyFilterLevel["BLOCK_MEDIUM_AND_ABOVE"] = "BLOCK_MEDIUM_AND_ABOVE";
    SafetyFilterLevel["BLOCK_ONLY_HIGH"] = "BLOCK_ONLY_HIGH";
    SafetyFilterLevel["BLOCK_NONE"] = "BLOCK_NONE";
})(SafetyFilterLevel || (SafetyFilterLevel = {}));
/** Enum that controls the generation of people. */
export var PersonGeneration;
(function (PersonGeneration) {
    /**
     * Block generation of images of people.
     */
    PersonGeneration["DONT_ALLOW"] = "DONT_ALLOW";
    /**
     * Generate images of adults, but not children.
     */
    PersonGeneration["ALLOW_ADULT"] = "ALLOW_ADULT";
    /**
     * Generate images that include adults and children.
     */
    PersonGeneration["ALLOW_ALL"] = "ALLOW_ALL";
})(PersonGeneration || (PersonGeneration = {}));
/** Enum that specifies the language of the text in the prompt. */
export var ImagePromptLanguage;
(function (ImagePromptLanguage) {
    /**
     * Auto-detect the language.
     */
    ImagePromptLanguage["auto"] = "auto";
    /**
     * English
     */
    ImagePromptLanguage["en"] = "en";
    /**
     * Japanese
     */
    ImagePromptLanguage["ja"] = "ja";
    /**
     * Korean
     */
    ImagePromptLanguage["ko"] = "ko";
    /**
     * Hindi
     */
    ImagePromptLanguage["hi"] = "hi";
    /**
     * Chinese
     */
    ImagePromptLanguage["zh"] = "zh";
    /**
     * Portuguese
     */
    ImagePromptLanguage["pt"] = "pt";
    /**
     * Spanish
     */
    ImagePromptLanguage["es"] = "es";
})(ImagePromptLanguage || (ImagePromptLanguage = {}));
/** Enum representing the mask mode of a mask reference image. */
export var MaskReferenceMode;
(function (MaskReferenceMode) {
    MaskReferenceMode["MASK_MODE_DEFAULT"] = "MASK_MODE_DEFAULT";
    MaskReferenceMode["MASK_MODE_USER_PROVIDED"] = "MASK_MODE_USER_PROVIDED";
    MaskReferenceMode["MASK_MODE_BACKGROUND"] = "MASK_MODE_BACKGROUND";
    MaskReferenceMode["MASK_MODE_FOREGROUND"] = "MASK_MODE_FOREGROUND";
    MaskReferenceMode["MASK_MODE_SEMANTIC"] = "MASK_MODE_SEMANTIC";
})(MaskReferenceMode || (MaskReferenceMode = {}));
/** Enum representing the control type of a control reference image. */
export var ControlReferenceType;
(function (ControlReferenceType) {
    ControlReferenceType["CONTROL_TYPE_DEFAULT"] = "CONTROL_TYPE_DEFAULT";
    ControlReferenceType["CONTROL_TYPE_CANNY"] = "CONTROL_TYPE_CANNY";
    ControlReferenceType["CONTROL_TYPE_SCRIBBLE"] = "CONTROL_TYPE_SCRIBBLE";
    ControlReferenceType["CONTROL_TYPE_FACE_MESH"] = "CONTROL_TYPE_FACE_MESH";
})(ControlReferenceType || (ControlReferenceType = {}));
/** Enum representing the subject type of a subject reference image. */
export var SubjectReferenceType;
(function (SubjectReferenceType) {
    SubjectReferenceType["SUBJECT_TYPE_DEFAULT"] = "SUBJECT_TYPE_DEFAULT";
    SubjectReferenceType["SUBJECT_TYPE_PERSON"] = "SUBJECT_TYPE_PERSON";
    SubjectReferenceType["SUBJECT_TYPE_ANIMAL"] = "SUBJECT_TYPE_ANIMAL";
    SubjectReferenceType["SUBJECT_TYPE_PRODUCT"] = "SUBJECT_TYPE_PRODUCT";
})(SubjectReferenceType || (SubjectReferenceType = {}));
/** Enum representing the editing mode. */
export var EditMode;
(function (EditMode) {
    EditMode["EDIT_MODE_DEFAULT"] = "EDIT_MODE_DEFAULT";
    EditMode["EDIT_MODE_INPAINT_REMOVAL"] = "EDIT_MODE_INPAINT_REMOVAL";
    EditMode["EDIT_MODE_INPAINT_INSERTION"] = "EDIT_MODE_INPAINT_INSERTION";
    EditMode["EDIT_MODE_OUTPAINT"] = "EDIT_MODE_OUTPAINT";
    EditMode["EDIT_MODE_CONTROLLED_EDITING"] = "EDIT_MODE_CONTROLLED_EDITING";
    EditMode["EDIT_MODE_STYLE"] = "EDIT_MODE_STYLE";
    EditMode["EDIT_MODE_BGSWAP"] = "EDIT_MODE_BGSWAP";
    EditMode["EDIT_MODE_PRODUCT_IMAGE"] = "EDIT_MODE_PRODUCT_IMAGE";
})(EditMode || (EditMode = {}));
/** Enum that represents the segmentation mode. */
export var SegmentMode;
(function (SegmentMode) {
    SegmentMode["FOREGROUND"] = "FOREGROUND";
    SegmentMode["BACKGROUND"] = "BACKGROUND";
    SegmentMode["PROMPT"] = "PROMPT";
    SegmentMode["SEMANTIC"] = "SEMANTIC";
    SegmentMode["INTERACTIVE"] = "INTERACTIVE";
})(SegmentMode || (SegmentMode = {}));
/** Enum for the reference type of a video generation reference image. */
export var VideoGenerationReferenceType;
(function (VideoGenerationReferenceType) {
    /**
     * A reference image that provides assets to the generated video,
        such as the scene, an object, a character, etc.
     */
    VideoGenerationReferenceType["ASSET"] = "ASSET";
    /**
     * A reference image that provides aesthetics including colors,
        lighting, texture, etc., to be used as the style of the generated video,
        such as 'anime', 'photography', 'origami', etc.
     */
    VideoGenerationReferenceType["STYLE"] = "STYLE";
})(VideoGenerationReferenceType || (VideoGenerationReferenceType = {}));
/** Enum for the mask mode of a video generation mask. */
export var VideoGenerationMaskMode;
(function (VideoGenerationMaskMode) {
    /**
     * The image mask contains a masked rectangular region which is
        applied on the first frame of the input video. The object described in
        the prompt is inserted into this region and will appear in subsequent
        frames.
     */
    VideoGenerationMaskMode["INSERT"] = "INSERT";
    /**
     * The image mask is used to determine an object in the
        first video frame to track. This object is removed from the video.
     */
    VideoGenerationMaskMode["REMOVE"] = "REMOVE";
    /**
     * The image mask is used to determine a region in the
        video. Objects in this region will be removed.
     */
    VideoGenerationMaskMode["REMOVE_STATIC"] = "REMOVE_STATIC";
    /**
     * The image mask contains a masked rectangular region where
        the input video will go. The remaining area will be generated. Video
        masks are not supported.
     */
    VideoGenerationMaskMode["OUTPAINT"] = "OUTPAINT";
})(VideoGenerationMaskMode || (VideoGenerationMaskMode = {}));
/** Enum that controls the compression quality of the generated videos. */
export var VideoCompressionQuality;
(function (VideoCompressionQuality) {
    /**
     * Optimized video compression quality. This will produce videos
        with a compressed, smaller file size.
     */
    VideoCompressionQuality["OPTIMIZED"] = "OPTIMIZED";
    /**
     * Lossless video compression quality. This will produce videos
        with a larger file size.
     */
    VideoCompressionQuality["LOSSLESS"] = "LOSSLESS";
})(VideoCompressionQuality || (VideoCompressionQuality = {}));
/** Enum representing the tuning method. */
export var TuningMethod;
(function (TuningMethod) {
    /**
     * Supervised fine tuning.
     */
    TuningMethod["SUPERVISED_FINE_TUNING"] = "SUPERVISED_FINE_TUNING";
    /**
     * Preference optimization tuning.
     */
    TuningMethod["PREFERENCE_TUNING"] = "PREFERENCE_TUNING";
})(TuningMethod || (TuningMethod = {}));
/** State for the lifecycle of a Document. */
export var DocumentState;
(function (DocumentState) {
    DocumentState["STATE_UNSPECIFIED"] = "STATE_UNSPECIFIED";
    DocumentState["STATE_PENDING"] = "STATE_PENDING";
    DocumentState["STATE_ACTIVE"] = "STATE_ACTIVE";
    DocumentState["STATE_FAILED"] = "STATE_FAILED";
})(DocumentState || (DocumentState = {}));
/** State for the lifecycle of a File. */
export var FileState;
(function (FileState) {
    FileState["STATE_UNSPECIFIED"] = "STATE_UNSPECIFIED";
    FileState["PROCESSING"] = "PROCESSING";
    FileState["ACTIVE"] = "ACTIVE";
    FileState["FAILED"] = "FAILED";
})(FileState || (FileState = {}));
/** Source of the File. */
export var FileSource;
(function (FileSource) {
    FileSource["SOURCE_UNSPECIFIED"] = "SOURCE_UNSPECIFIED";
    FileSource["UPLOADED"] = "UPLOADED";
    FileSource["GENERATED"] = "GENERATED";
})(FileSource || (FileSource = {}));
/** The reason why the turn is complete. */
export var TurnCompleteReason;
(function (TurnCompleteReason) {
    /**
     * Default value. Reason is unspecified.
     */
    TurnCompleteReason["TURN_COMPLETE_REASON_UNSPECIFIED"] = "TURN_COMPLETE_REASON_UNSPECIFIED";
    /**
     * The function call generated by the model is invalid.
     */
    TurnCompleteReason["MALFORMED_FUNCTION_CALL"] = "MALFORMED_FUNCTION_CALL";
    /**
     * The response is rejected by the model.
     */
    TurnCompleteReason["RESPONSE_REJECTED"] = "RESPONSE_REJECTED";
    /**
     * Needs more input from the user.
     */
    TurnCompleteReason["NEED_MORE_INPUT"] = "NEED_MORE_INPUT";
})(TurnCompleteReason || (TurnCompleteReason = {}));
/** Server content modalities. */
export var MediaModality;
(function (MediaModality) {
    /**
     * The modality is unspecified.
     */
    MediaModality["MODALITY_UNSPECIFIED"] = "MODALITY_UNSPECIFIED";
    /**
     * Plain text.
     */
    MediaModality["TEXT"] = "TEXT";
    /**
     * Images.
     */
    MediaModality["IMAGE"] = "IMAGE";
    /**
     * Video.
     */
    MediaModality["VIDEO"] = "VIDEO";
    /**
     * Audio.
     */
    MediaModality["AUDIO"] = "AUDIO";
    /**
     * Document, e.g. PDF.
     */
    MediaModality["DOCUMENT"] = "DOCUMENT";
})(MediaModality || (MediaModality = {}));
/** Start of speech sensitivity. */
export var StartSensitivity;
(function (StartSensitivity) {
    /**
     * The default is START_SENSITIVITY_LOW.
     */
    StartSensitivity["START_SENSITIVITY_UNSPECIFIED"] = "START_SENSITIVITY_UNSPECIFIED";
    /**
     * Automatic detection will detect the start of speech more often.
     */
    StartSensitivity["START_SENSITIVITY_HIGH"] = "START_SENSITIVITY_HIGH";
    /**
     * Automatic detection will detect the start of speech less often.
     */
    StartSensitivity["START_SENSITIVITY_LOW"] = "START_SENSITIVITY_LOW";
})(StartSensitivity || (StartSensitivity = {}));
/** End of speech sensitivity. */
export var EndSensitivity;
(function (EndSensitivity) {
    /**
     * The default is END_SENSITIVITY_LOW.
     */
    EndSensitivity["END_SENSITIVITY_UNSPECIFIED"] = "END_SENSITIVITY_UNSPECIFIED";
    /**
     * Automatic detection ends speech more often.
     */
    EndSensitivity["END_SENSITIVITY_HIGH"] = "END_SENSITIVITY_HIGH";
    /**
     * Automatic detection ends speech less often.
     */
    EndSensitivity["END_SENSITIVITY_LOW"] = "END_SENSITIVITY_LOW";
})(EndSensitivity || (EndSensitivity = {}));
/** The different ways of handling user activity. */
export var ActivityHandling;
(function (ActivityHandling) {
    /**
     * If unspecified, the default behavior is `START_OF_ACTIVITY_INTERRUPTS`.
     */
    ActivityHandling["ACTIVITY_HANDLING_UNSPECIFIED"] = "ACTIVITY_HANDLING_UNSPECIFIED";
    /**
     * If true, start of activity will interrupt the model's response (also called "barge in"). The model's current response will be cut-off in the moment of the interruption. This is the default behavior.
     */
    ActivityHandling["START_OF_ACTIVITY_INTERRUPTS"] = "START_OF_ACTIVITY_INTERRUPTS";
    /**
     * The model's response will not be interrupted.
     */
    ActivityHandling["NO_INTERRUPTION"] = "NO_INTERRUPTION";
})(ActivityHandling || (ActivityHandling = {}));
/** Options about which input is included in the user's turn. */
export var TurnCoverage;
(function (TurnCoverage) {
    /**
     * If unspecified, the default behavior is `TURN_INCLUDES_ONLY_ACTIVITY`.
     */
    TurnCoverage["TURN_COVERAGE_UNSPECIFIED"] = "TURN_COVERAGE_UNSPECIFIED";
    /**
     * The users turn only includes activity since the last turn, excluding inactivity (e.g. silence on the audio stream). This is the default behavior.
     */
    TurnCoverage["TURN_INCLUDES_ONLY_ACTIVITY"] = "TURN_INCLUDES_ONLY_ACTIVITY";
    /**
     * The users turn includes all realtime input since the last turn, including inactivity (e.g. silence on the audio stream).
     */
    TurnCoverage["TURN_INCLUDES_ALL_INPUT"] = "TURN_INCLUDES_ALL_INPUT";
})(TurnCoverage || (TurnCoverage = {}));
/** Scale of the generated music. */
export var Scale;
(function (Scale) {
    /**
     * Default value. This value is unused.
     */
    Scale["SCALE_UNSPECIFIED"] = "SCALE_UNSPECIFIED";
    /**
     * C major or A minor.
     */
    Scale["C_MAJOR_A_MINOR"] = "C_MAJOR_A_MINOR";
    /**
     * Db major or Bb minor.
     */
    Scale["D_FLAT_MAJOR_B_FLAT_MINOR"] = "D_FLAT_MAJOR_B_FLAT_MINOR";
    /**
     * D major or B minor.
     */
    Scale["D_MAJOR_B_MINOR"] = "D_MAJOR_B_MINOR";
    /**
     * Eb major or C minor
     */
    Scale["E_FLAT_MAJOR_C_MINOR"] = "E_FLAT_MAJOR_C_MINOR";
    /**
     * E major or Db minor.
     */
    Scale["E_MAJOR_D_FLAT_MINOR"] = "E_MAJOR_D_FLAT_MINOR";
    /**
     * F major or D minor.
     */
    Scale["F_MAJOR_D_MINOR"] = "F_MAJOR_D_MINOR";
    /**
     * Gb major or Eb minor.
     */
    Scale["G_FLAT_MAJOR_E_FLAT_MINOR"] = "G_FLAT_MAJOR_E_FLAT_MINOR";
    /**
     * G major or E minor.
     */
    Scale["G_MAJOR_E_MINOR"] = "G_MAJOR_E_MINOR";
    /**
     * Ab major or F minor.
     */
    Scale["A_FLAT_MAJOR_F_MINOR"] = "A_FLAT_MAJOR_F_MINOR";
    /**
     * A major or Gb minor.
     */
    Scale["A_MAJOR_G_FLAT_MINOR"] = "A_MAJOR_G_FLAT_MINOR";
    /**
     * Bb major or G minor.
     */
    Scale["B_FLAT_MAJOR_G_MINOR"] = "B_FLAT_MAJOR_G_MINOR";
    /**
     * B major or Ab minor.
     */
    Scale["B_MAJOR_A_FLAT_MINOR"] = "B_MAJOR_A_FLAT_MINOR";
})(Scale || (Scale = {}));
/** The mode of music generation. */
export var MusicGenerationMode;
(function (MusicGenerationMode) {
    /**
     * Rely on the server default generation mode.
     */
    MusicGenerationMode["MUSIC_GENERATION_MODE_UNSPECIFIED"] = "MUSIC_GENERATION_MODE_UNSPECIFIED";
    /**
     * Steer text prompts to regions of latent space with higher quality
        music.
     */
    MusicGenerationMode["QUALITY"] = "QUALITY";
    /**
     * Steer text prompts to regions of latent space with a larger
        diversity of music.
     */
    MusicGenerationMode["DIVERSITY"] = "DIVERSITY";
    /**
     * Steer text prompts to regions of latent space more likely to
        generate music with vocals.
     */
    MusicGenerationMode["VOCALIZATION"] = "VOCALIZATION";
})(MusicGenerationMode || (MusicGenerationMode = {}));
/** The playback control signal to apply to the music generation. */
export var LiveMusicPlaybackControl;
(function (LiveMusicPlaybackControl) {
    /**
     * This value is unused.
     */
    LiveMusicPlaybackControl["PLAYBACK_CONTROL_UNSPECIFIED"] = "PLAYBACK_CONTROL_UNSPECIFIED";
    /**
     * Start generating the music.
     */
    LiveMusicPlaybackControl["PLAY"] = "PLAY";
    /**
     * Hold the music generation. Use PLAY to resume from the current position.
     */
    LiveMusicPlaybackControl["PAUSE"] = "PAUSE";
    /**
     * Stop the music generation and reset the context (prompts retained).
        Use PLAY to restart the music generation.
     */
    LiveMusicPlaybackControl["STOP"] = "STOP";
    /**
     * Reset the context of the music generation without stopping it.
        Retains the current prompts and config.
     */
    LiveMusicPlaybackControl["RESET_CONTEXT"] = "RESET_CONTEXT";
})(LiveMusicPlaybackControl || (LiveMusicPlaybackControl = {}));
/** Raw media bytes for function response.

Text should not be sent as raw bytes, use the FunctionResponse.response
field. */
export class FunctionResponseBlob {
}
/** URI based data for function response. */
export class FunctionResponseFileData {
}
/** A datatype containing media that is part of a `FunctionResponse` message.

A `FunctionResponsePart` consists of data which has an associated datatype. A
`FunctionResponsePart` can only contain one of the accepted types in
`FunctionResponsePart.data`.

A `FunctionResponsePart` must have a fixed IANA MIME type identifying the
type and subtype of the media if the `inline_data` field is filled with raw
bytes. */
export class FunctionResponsePart {
}
/**
 * Creates a `FunctionResponsePart` object from a `base64` encoded `string`.
 */
export function createFunctionResponsePartFromBase64(data, mimeType) {
    return {
        inlineData: {
            data: data,
            mimeType: mimeType,
        },
    };
}
/**
 * Creates a `FunctionResponsePart` object from a `URI` string.
 */
export function createFunctionResponsePartFromUri(uri, mimeType) {
    return {
        fileData: {
            fileUri: uri,
            mimeType: mimeType,
        },
    };
}
/** A function response. */
export class FunctionResponse {
}
/**
 * Creates a `Part` object from a `URI` string.
 */
export function createPartFromUri(uri, mimeType, mediaResolution) {
    return {
        fileData: {
            fileUri: uri,
            mimeType: mimeType,
        },
        ...(mediaResolution && { mediaResolution: { level: mediaResolution } }),
    };
}
/**
 * Creates a `Part` object from a `text` string.
 */
export function createPartFromText(text) {
    return {
        text: text,
    };
}
/**
 * Creates a `Part` object from a `FunctionCall` object.
 */
export function createPartFromFunctionCall(name, args) {
    return {
        functionCall: {
            name: name,
            args: args,
        },
    };
}
/**
 * Creates a `Part` object from a `FunctionResponse` object.
 */
export function createPartFromFunctionResponse(id, name, response, parts = []) {
    return {
        functionResponse: {
            id: id,
            name: name,
            response: response,
            ...(parts.length > 0 && { parts }),
        },
    };
}
/**
 * Creates a `Part` object from a `base64` encoded `string`.
 */
export function createPartFromBase64(data, mimeType, mediaResolution) {
    return {
        inlineData: {
            data: data,
            mimeType: mimeType,
        },
        ...(mediaResolution && { mediaResolution: { level: mediaResolution } }),
    };
}
/**
 * Creates a `Part` object from the `outcome` and `output` of a `CodeExecutionResult` object.
 */
export function createPartFromCodeExecutionResult(outcome, output) {
    return {
        codeExecutionResult: {
            outcome: outcome,
            output: output,
        },
    };
}
/**
 * Creates a `Part` object from the `code` and `language` of an `ExecutableCode` object.
 */
export function createPartFromExecutableCode(code, language) {
    return {
        executableCode: {
            code: code,
            language: language,
        },
    };
}
function _isPart(obj) {
    if (typeof obj === 'object' && obj !== null) {
        return ('fileData' in obj ||
            'text' in obj ||
            'functionCall' in obj ||
            'functionResponse' in obj ||
            'inlineData' in obj ||
            'videoMetadata' in obj ||
            'codeExecutionResult' in obj ||
            'executableCode' in obj);
    }
    return false;
}
function _toParts(partOrString) {
    const parts = [];
    if (typeof partOrString === 'string') {
        parts.push(createPartFromText(partOrString));
    }
    else if (_isPart(partOrString)) {
        parts.push(partOrString);
    }
    else if (Array.isArray(partOrString)) {
        if (partOrString.length === 0) {
            throw new Error('partOrString cannot be an empty array');
        }
        for (const part of partOrString) {
            if (typeof part === 'string') {
                parts.push(createPartFromText(part));
            }
            else if (_isPart(part)) {
                parts.push(part);
            }
            else {
                throw new Error('element in PartUnion must be a Part object or string');
            }
        }
    }
    else {
        throw new Error('partOrString must be a Part object, string, or array');
    }
    return parts;
}
/**
 * Creates a `Content` object with a user role from a `PartListUnion` object or `string`.
 */
export function createUserContent(partOrString) {
    return {
        role: 'user',
        parts: _toParts(partOrString),
    };
}
/**
 * Creates a `Content` object with a model role from a `PartListUnion` object or `string`.
 */
export function createModelContent(partOrString) {
    return {
        role: 'model',
        parts: _toParts(partOrString),
    };
}
/** A wrapper class for the http response. */
export class HttpResponse {
    constructor(response) {
        // Process the headers.
        const headers = {};
        for (const pair of response.headers.entries()) {
            headers[pair[0]] = pair[1];
        }
        this.headers = headers;
        // Keep the original response.
        this.responseInternal = response;
    }
    json() {
        return this.responseInternal.json();
    }
}
/** Content filter results for a prompt sent in the request. Note: This is sent only in the first stream chunk and only if no candidates were generated due to content violations. */
export class GenerateContentResponsePromptFeedback {
}
/** Usage metadata about the content generation request and response. This message provides a detailed breakdown of token usage and other relevant metrics. This data type is not supported in Gemini API. */
export class GenerateContentResponseUsageMetadata {
}
/** Response message for PredictionService.GenerateContent. */
export class GenerateContentResponse {
    /**
     * Returns the concatenation of all text parts from the first candidate in the response.
     *
     * @remarks
     * If there are multiple candidates in the response, the text from the first
     * one will be returned.
     * If there are non-text parts in the response, the concatenation of all text
     * parts will be returned, and a warning will be logged.
     * If there are thought parts in the response, the concatenation of all text
     * parts excluding the thought parts will be returned.
     *
     * @example
     * ```ts
     * const response = await ai.models.generateContent({
     *   model: 'gemini-2.0-flash',
     *   contents:
     *     'Why is the sky blue?',
     * });
     *
     * console.debug(response.text);
     * ```
     */
    get text() {
        if (this.candidates?.[0]?.content?.parts?.length === 0) {
            return undefined;
        }
        if (this.candidates && this.candidates.length > 1) {
            console.warn('there are multiple candidates in the response, returning text from the first one.');
        }
        let text = '';
        let anyTextPartText = false;
        const nonTextParts = [];
        for (const part of this.candidates?.[0]?.content?.parts ?? []) {
            for (const [fieldName, fieldValue] of Object.entries(part)) {
                if (fieldName !== 'text' &&
                    fieldName !== 'thought' &&
                    fieldName !== 'thoughtSignature' &&
                    (fieldValue !== null || fieldValue !== undefined)) {
                    nonTextParts.push(fieldName);
                }
            }
            if (typeof part.text === 'string') {
                if (typeof part.thought === 'boolean' && part.thought) {
                    continue;
                }
                anyTextPartText = true;
                text += part.text;
            }
        }
        if (nonTextParts.length > 0) {
            console.warn(`there are non-text parts ${nonTextParts} in the response, returning concatenation of all text parts. Please refer to the non text parts for a full response from model.`);
        }
        // part.text === '' is different from part.text is null
        return anyTextPartText ? text : undefined;
    }
    /**
     * Returns the concatenation of all inline data parts from the first candidate
     * in the response.
     *
     * @remarks
     * If there are multiple candidates in the response, the inline data from the
     * first one will be returned. If there are non-inline data parts in the
     * response, the concatenation of all inline data parts will be returned, and
     * a warning will be logged.
     */
    get data() {
        if (this.candidates?.[0]?.content?.parts?.length === 0) {
            return undefined;
        }
        if (this.candidates && this.candidates.length > 1) {
            console.warn('there are multiple candidates in the response, returning data from the first one.');
        }
        let data = '';
        const nonDataParts = [];
        for (const part of this.candidates?.[0]?.content?.parts ?? []) {
            for (const [fieldName, fieldValue] of Object.entries(part)) {
                if (fieldName !== 'inlineData' &&
                    (fieldValue !== null || fieldValue !== undefined)) {
                    nonDataParts.push(fieldName);
                }
            }
            if (part.inlineData && typeof part.inlineData.data === 'string') {
                data += atob(part.inlineData.data);
            }
        }
        if (nonDataParts.length > 0) {
            console.warn(`there are non-data parts ${nonDataParts} in the response, returning concatenation of all data parts. Please refer to the non data parts for a full response from model.`);
        }
        return data.length > 0 ? btoa(data) : undefined;
    }
    /**
     * Returns the function calls from the first candidate in the response.
     *
     * @remarks
     * If there are multiple candidates in the response, the function calls from
     * the first one will be returned.
     * If there are no function calls in the response, undefined will be returned.
     *
     * @example
     * ```ts
     * const controlLightFunctionDeclaration: FunctionDeclaration = {
     *   name: 'controlLight',
     *   parameters: {
     *   type: Type.OBJECT,
     *   description: 'Set the brightness and color temperature of a room light.',
     *   properties: {
     *     brightness: {
     *       type: Type.NUMBER,
     *       description:
     *         'Light level from 0 to 100. Zero is off and 100 is full brightness.',
     *     },
     *     colorTemperature: {
     *       type: Type.STRING,
     *       description:
     *         'Color temperature of the light fixture which can be `daylight`, `cool` or `warm`.',
     *     },
     *   },
     *   required: ['brightness', 'colorTemperature'],
     *  };
     *  const response = await ai.models.generateContent({
     *     model: 'gemini-2.0-flash',
     *     contents: 'Dim the lights so the room feels cozy and warm.',
     *     config: {
     *       tools: [{functionDeclarations: [controlLightFunctionDeclaration]}],
     *       toolConfig: {
     *         functionCallingConfig: {
     *           mode: FunctionCallingConfigMode.ANY,
     *           allowedFunctionNames: ['controlLight'],
     *         },
     *       },
     *     },
     *   });
     *  console.debug(JSON.stringify(response.functionCalls));
     * ```
     */
    get functionCalls() {
        if (this.candidates?.[0]?.content?.parts?.length === 0) {
            return undefined;
        }
        if (this.candidates && this.candidates.length > 1) {
            console.warn('there are multiple candidates in the response, returning function calls from the first one.');
        }
        const functionCalls = this.candidates?.[0]?.content?.parts
            ?.filter((part) => part.functionCall)
            .map((part) => part.functionCall)
            .filter((functionCall) => functionCall !== undefined);
        if (functionCalls?.length === 0) {
            return undefined;
        }
        return functionCalls;
    }
    /**
     * Returns the first executable code from the first candidate in the response.
     *
     * @remarks
     * If there are multiple candidates in the response, the executable code from
     * the first one will be returned.
     * If there are no executable code in the response, undefined will be
     * returned.
     *
     * @example
     * ```ts
     * const response = await ai.models.generateContent({
     *   model: 'gemini-2.0-flash',
     *   contents:
     *     'What is the sum of the first 50 prime numbers? Generate and run code for the calculation, and make sure you get all 50.'
     *   config: {
     *     tools: [{codeExecution: {}}],
     *   },
     * });
     *
     * console.debug(response.executableCode);
     * ```
     */
    get executableCode() {
        if (this.candidates?.[0]?.content?.parts?.length === 0) {
            return undefined;
        }
        if (this.candidates && this.candidates.length > 1) {
            console.warn('there are multiple candidates in the response, returning executable code from the first one.');
        }
        const executableCode = this.candidates?.[0]?.content?.parts
            ?.filter((part) => part.executableCode)
            .map((part) => part.executableCode)
            .filter((executableCode) => executableCode !== undefined);
        if (executableCode?.length === 0) {
            return undefined;
        }
        return executableCode?.[0]?.code;
    }
    /**
     * Returns the first code execution result from the first candidate in the response.
     *
     * @remarks
     * If there are multiple candidates in the response, the code execution result from
     * the first one will be returned.
     * If there are no code execution result in the response, undefined will be returned.
     *
     * @example
     * ```ts
     * const response = await ai.models.generateContent({
     *   model: 'gemini-2.0-flash',
     *   contents:
     *     'What is the sum of the first 50 prime numbers? Generate and run code for the calculation, and make sure you get all 50.'
     *   config: {
     *     tools: [{codeExecution: {}}],
     *   },
     * });
     *
     * console.debug(response.codeExecutionResult);
     * ```
     */
    get codeExecutionResult() {
        if (this.candidates?.[0]?.content?.parts?.length === 0) {
            return undefined;
        }
        if (this.candidates && this.candidates.length > 1) {
            console.warn('there are multiple candidates in the response, returning code execution result from the first one.');
        }
        const codeExecutionResult = this.candidates?.[0]?.content?.parts
            ?.filter((part) => part.codeExecutionResult)
            .map((part) => part.codeExecutionResult)
            .filter((codeExecutionResult) => codeExecutionResult !== undefined);
        if (codeExecutionResult?.length === 0) {
            return undefined;
        }
        return codeExecutionResult?.[0]?.output;
    }
}
/** Response for the embed_content method. */
export class EmbedContentResponse {
}
/** The output images response. */
export class GenerateImagesResponse {
}
/** Response for the request to edit an image. */
export class EditImageResponse {
}
export class UpscaleImageResponse {
}
/** The output images response. */
export class RecontextImageResponse {
}
/** The output images response. */
export class SegmentImageResponse {
}
export class ListModelsResponse {
}
export class DeleteModelResponse {
}
/** Response for counting tokens. */
export class CountTokensResponse {
}
/** Response for computing tokens. */
export class ComputeTokensResponse {
}
/** Response with generated videos. */
export class GenerateVideosResponse {
}
/** A video generation operation. */
export class GenerateVideosOperation {
    /**
     * Instantiates an Operation of the same type as the one being called with the fields set from the API response.
     * @internal
     */
    _fromAPIResponse({ apiResponse, _isVertexAI, }) {
        const operation = new GenerateVideosOperation();
        let response;
        const op = apiResponse;
        if (_isVertexAI) {
            response = generateVideosOperationFromVertex(op);
        }
        else {
            response = generateVideosOperationFromMldev(op);
        }
        Object.assign(operation, response);
        return operation;
    }
}
/** Response for the list tuning jobs method. */
export class ListTuningJobsResponse {
}
/** Empty response for caches.delete method. */
export class DeleteCachedContentResponse {
}
export class ListCachedContentsResponse {
}
/** Config for documents.list return value. */
export class ListDocumentsResponse {
}
/** Config for file_search_stores.list return value. */
export class ListFileSearchStoresResponse {
}
/** Response for the resumable upload method. */
export class UploadToFileSearchStoreResumableResponse {
}
/** Response for ImportFile to import a File API file with a file search store. */
export class ImportFileResponse {
}
/** Long-running operation for importing a file to a FileSearchStore. */
export class ImportFileOperation {
    /**
     * Instantiates an Operation of the same type as the one being called with the fields set from the API response.
     * @internal
     */
    _fromAPIResponse({ apiResponse, _isVertexAI, }) {
        const operation = new ImportFileOperation();
        const op = apiResponse;
        const response = importFileOperationFromMldev(op);
        Object.assign(operation, response);
        return operation;
    }
}
/** Response for the list files method. */
export class ListFilesResponse {
}
/** Response for the create file method. */
export class CreateFileResponse {
}
/** Response for the delete file method. */
export class DeleteFileResponse {
}
/** Config for `inlined_responses` parameter. */
export class InlinedResponse {
}
/** Config for `response` parameter. */
export class SingleEmbedContentResponse {
}
/** Config for `inlined_embedding_responses` parameter. */
export class InlinedEmbedContentResponse {
}
/** Config for batches.list return value. */
export class ListBatchJobsResponse {
}
/** Represents a single response in a replay. */
export class ReplayResponse {
}
/** A raw reference image.

A raw reference image represents the base image to edit, provided by the user.
It can optionally be provided in addition to a mask reference image or
a style reference image. */
export class RawReferenceImage {
    /** Internal method to convert to ReferenceImageAPIInternal. */
    toReferenceImageAPI() {
        const referenceImageAPI = {
            referenceType: 'REFERENCE_TYPE_RAW',
            referenceImage: this.referenceImage,
            referenceId: this.referenceId,
        };
        return referenceImageAPI;
    }
}
/** A mask reference image.

This encapsulates either a mask image provided by the user and configs for
the user provided mask, or only config parameters for the model to generate
a mask.

A mask image is an image whose non-zero values indicate where to edit the base
image. If the user provides a mask image, the mask must be in the same
dimensions as the raw image. */
export class MaskReferenceImage {
    /** Internal method to convert to ReferenceImageAPIInternal. */
    toReferenceImageAPI() {
        const referenceImageAPI = {
            referenceType: 'REFERENCE_TYPE_MASK',
            referenceImage: this.referenceImage,
            referenceId: this.referenceId,
            maskImageConfig: this.config,
        };
        return referenceImageAPI;
    }
}
/** A control reference image.

The image of the control reference image is either a control image provided
by the user, or a regular image which the backend will use to generate a
control image of. In the case of the latter, the
enable_control_image_computation field in the config should be set to True.

A control image is an image that represents a sketch image of areas for the
model to fill in based on the prompt. */
export class ControlReferenceImage {
    /** Internal method to convert to ReferenceImageAPIInternal. */
    toReferenceImageAPI() {
        const referenceImageAPI = {
            referenceType: 'REFERENCE_TYPE_CONTROL',
            referenceImage: this.referenceImage,
            referenceId: this.referenceId,
            controlImageConfig: this.config,
        };
        return referenceImageAPI;
    }
}
/** A style reference image.

This encapsulates a style reference image provided by the user, and
additionally optional config parameters for the style reference image.

A raw reference image can also be provided as a destination for the style to
be applied to. */
export class StyleReferenceImage {
    /** Internal method to convert to ReferenceImageAPIInternal. */
    toReferenceImageAPI() {
        const referenceImageAPI = {
            referenceType: 'REFERENCE_TYPE_STYLE',
            referenceImage: this.referenceImage,
            referenceId: this.referenceId,
            styleImageConfig: this.config,
        };
        return referenceImageAPI;
    }
}
/** A subject reference image.

This encapsulates a subject reference image provided by the user, and
additionally optional config parameters for the subject reference image.

A raw reference image can also be provided as a destination for the subject to
be applied to. */
export class SubjectReferenceImage {
    /* Internal method to convert to ReferenceImageAPIInternal. */
    toReferenceImageAPI() {
        const referenceImageAPI = {
            referenceType: 'REFERENCE_TYPE_SUBJECT',
            referenceImage: this.referenceImage,
            referenceId: this.referenceId,
            subjectImageConfig: this.config,
        };
        return referenceImageAPI;
    }
}
/** A content reference image.

A content reference image represents a subject to reference (ex. person,
product, animal) provided by the user. It can optionally be provided in
addition to a style reference image (ex. background, style reference). */
export class ContentReferenceImage {
    /** Internal method to convert to ReferenceImageAPIInternal. */
    toReferenceImageAPI() {
        const referenceImageAPI = {
            referenceType: 'REFERENCE_TYPE_CONTENT',
            referenceImage: this.referenceImage,
            referenceId: this.referenceId,
        };
        return referenceImageAPI;
    }
}
/** Response message for API call. */
export class LiveServerMessage {
    /**
     * Returns the concatenation of all text parts from the server content if present.
     *
     * @remarks
     * If there are non-text parts in the response, the concatenation of all text
     * parts will be returned, and a warning will be logged.
     */
    get text() {
        let text = '';
        let anyTextPartFound = false;
        const nonTextParts = [];
        for (const part of this.serverContent?.modelTurn?.parts ?? []) {
            for (const [fieldName, fieldValue] of Object.entries(part)) {
                if (fieldName !== 'text' &&
                    fieldName !== 'thought' &&
                    fieldValue !== null) {
                    nonTextParts.push(fieldName);
                }
            }
            if (typeof part.text === 'string') {
                if (typeof part.thought === 'boolean' && part.thought) {
                    continue;
                }
                anyTextPartFound = true;
                text += part.text;
            }
        }
        if (nonTextParts.length > 0) {
            console.warn(`there are non-text parts ${nonTextParts} in the response, returning concatenation of all text parts. Please refer to the non text parts for a full response from model.`);
        }
        // part.text === '' is different from part.text is null
        return anyTextPartFound ? text : undefined;
    }
    /**
     * Returns the concatenation of all inline data parts from the server content if present.
     *
     * @remarks
     * If there are non-inline data parts in the
     * response, the concatenation of all inline data parts will be returned, and
     * a warning will be logged.
     */
    get data() {
        let data = '';
        const nonDataParts = [];
        for (const part of this.serverContent?.modelTurn?.parts ?? []) {
            for (const [fieldName, fieldValue] of Object.entries(part)) {
                if (fieldName !== 'inlineData' && fieldValue !== null) {
                    nonDataParts.push(fieldName);
                }
            }
            if (part.inlineData && typeof part.inlineData.data === 'string') {
                data += atob(part.inlineData.data);
            }
        }
        if (nonDataParts.length > 0) {
            console.warn(`there are non-data parts ${nonDataParts} in the response, returning concatenation of all data parts. Please refer to the non data parts for a full response from model.`);
        }
        return data.length > 0 ? btoa(data) : undefined;
    }
}
/** Client generated response to a `ToolCall` received from the server.

Individual `FunctionResponse` objects are matched to the respective
`FunctionCall` objects by the `id` field.

Note that in the unary and server-streaming GenerateContent APIs function
calling happens by exchanging the `Content` parts, while in the bidi
GenerateContent APIs function calling happens over this dedicated set of
messages. */
export class LiveClientToolResponse {
}
/** Parameters for sending tool responses to the live API. */
export class LiveSendToolResponseParameters {
    constructor() {
        /** Tool responses to send to the session. */
        this.functionResponses = [];
    }
}
/** Response message for the LiveMusicClientMessage call. */
export class LiveMusicServerMessage {
    /**
     * Returns the first audio chunk from the server content, if present.
     *
     * @remarks
     * If there are no audio chunks in the response, undefined will be returned.
     */
    get audioChunk() {
        if (this.serverContent &&
            this.serverContent.audioChunks &&
            this.serverContent.audioChunks.length > 0) {
            return this.serverContent.audioChunks[0];
        }
        return undefined;
    }
}
/** The response when long-running operation for uploading a file to a FileSearchStore complete. */
export class UploadToFileSearchStoreResponse {
}
/** Long-running operation for uploading a file to a FileSearchStore. */
export class UploadToFileSearchStoreOperation {
    /**
     * Instantiates an Operation of the same type as the one being called with the fields set from the API response.
     * @internal
     */
    _fromAPIResponse({ apiResponse, _isVertexAI, }) {
        const operation = new UploadToFileSearchStoreOperation();
        const op = apiResponse;
        const response = uploadToFileSearchStoreOperationFromMldev(op);
        Object.assign(operation, response);
        return operation;
    }
}
