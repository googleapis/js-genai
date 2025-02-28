/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @suppress {lintChecks}
 */

// clang-format off

class BaseModule {
}
function formatMap(templateString, valueMap) {
    // Use a regular expression to find all placeholders in the template string
    const regex = /\{([^}]+)\}/g;
    // Replace each placeholder with its corresponding value from the valueMap
    return templateString.replace(regex, (match, key) => {
        if (Object.prototype.hasOwnProperty.call(valueMap, key)) {
            const value = valueMap[key];
            // Convert the value to a string if it's not a string already
            return value !== undefined && value !== null ? String(value) : '';
        }
        else {
            // Handle missing keys
            throw new Error(`Key '${key}' not found in valueMap.`);
        }
    });
}
function setValueByPath(data, keys, value) {
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (key.endsWith('[]')) {
            const keyName = key.slice(0, -2);
            if (!(keyName in data)) {
                if (Array.isArray(value)) {
                    data[keyName] = Array.from({ length: value.length }, () => ({}));
                }
                else {
                    throw new Error(`Value ${value} must be a list given an array path ${key}`);
                }
            }
            if (Array.isArray(data[keyName])) {
                const arrayData = data[keyName];
                if (Array.isArray(value)) {
                    for (let j = 0; j < arrayData.length; j++) {
                        const entry = arrayData[j];
                        setValueByPath(entry, keys.slice(i + 1), value[j]);
                    }
                }
                else {
                    for (const d of arrayData) {
                        setValueByPath(d, keys.slice(i + 1), value);
                    }
                }
            }
            return;
        }
        if (!data[key] || typeof data[key] !== 'object') {
            data[key] = {};
        }
        data = data[key];
    }
    const keyToSet = keys[keys.length - 1];
    const existingData = data[keyToSet];
    if (existingData !== undefined) {
        if (!value ||
            (typeof value === 'object' && Object.keys(value).length === 0)) {
            return;
        }
        if (value === existingData) {
            return;
        }
        if (typeof existingData === 'object' &&
            typeof value === 'object' &&
            existingData !== null &&
            value !== null) {
            Object.assign(existingData, value);
        }
        else {
            throw new Error(`Cannot set value for an existing key. Key: ${keyToSet}; Existing value: ${existingData}; New value: ${value}.`);
        }
    }
    else {
        data[keyToSet] = value;
    }
}
function getValueByPath(data, keys) {
    try {
        if (keys.length === 1 && keys[0] === '_self') {
            return data;
        }
        for (let i = 0; i < keys.length; i++) {
            if (typeof data !== 'object' || data === null) {
                return undefined;
            }
            const key = keys[i];
            if (key.endsWith('[]')) {
                const keyName = key.slice(0, -2);
                if (keyName in data) {
                    const arrayData = data[keyName];
                    if (!Array.isArray(arrayData)) {
                        return undefined;
                    }
                    return arrayData.map((d) => getValueByPath(d, keys.slice(i + 1)));
                }
                else {
                    return undefined;
                }
            }
            else {
                data = data[key];
            }
        }
        return data;
    }
    catch (error) {
        if (error instanceof TypeError) {
            return undefined;
        }
        throw error;
    }
}


function tModel(apiClient, model) {
    if (!model || typeof model !== 'string') {
        throw new Error('model is required and must be a string');
    }
    if (apiClient.isVertexAI()) {
        if (model.startsWith('publishers/') ||
            model.startsWith('projects/') ||
            model.startsWith('models/')) {
            return model;
        }
        else if (model.indexOf('/') >= 0) {
            const parts = model.split('/', 2);
            return `publishers/${parts[0]}/models/${parts[1]}`;
        }
        else {
            return `publishers/google/models/${model}`;
        }
    }
    else {
        if (model.startsWith('models/') || model.startsWith('tunedModels/')) {
            return model;
        }
        else {
            return `models/${model}`;
        }
    }
}
function tCachesModel(apiClient, model) {
    const transformedModel = tModel(apiClient, model);
    if (!transformedModel) {
        return '';
    }
    if (transformedModel.startsWith('publishers/') && apiClient.isVertexAI()) {
        // vertex caches only support model name start with projects.
        return `projects/${apiClient.getProject()}/locations/${apiClient.getLocation()}/${transformedModel}`;
    }
    else if (transformedModel.startsWith('models/') && apiClient.isVertexAI()) {
        return `projects/${apiClient.getProject()}/locations/${apiClient.getLocation()}/publishers/google/${transformedModel}`;
    }
    else {
        return transformedModel;
    }
}
function tPart(apiClient, origin) {
    if (!origin) {
        throw new Error('PartUnion is required');
    }
    if (typeof origin === 'object') {
        return origin;
    }
    if (typeof origin === 'string') {
        return { text: origin };
    }
    throw new Error(`Unsupported part type: ${typeof origin}`);
}
function tParts(apiClient, origin) {
    if (!origin) {
        throw new Error('PartListUnion is required');
    }
    if (Array.isArray(origin)) {
        return origin.map((item) => tPart(apiClient, item));
    }
    return [tPart(apiClient, origin)];
}
function tContent(apiClient, origin) {
    if (!origin) {
        throw new Error('ContentUnion is required');
    }
    if (typeof origin === 'object' && 'parts' in origin) {
        return origin;
    }
    return {
        role: 'user',
        parts: tParts(apiClient, origin),
    };
}
function tContentsForEmbed(apiClient, origin) {
    if (!origin) {
        return [];
    }
    if (apiClient.isVertexAI() && Array.isArray(origin)) {
        return origin.flatMap((item) => {
            const content = tContent(apiClient, item);
            if (content.parts &&
                content.parts.length > 0 &&
                content.parts[0].text !== undefined) {
                return [content.parts[0].text];
            }
            return [];
        });
    }
    else if (apiClient.isVertexAI()) {
        const content = tContent(apiClient, origin);
        if (content.parts &&
            content.parts.length > 0 &&
            content.parts[0].text !== undefined) {
            return [content.parts[0].text];
        }
        return [];
    }
    if (Array.isArray(origin)) {
        return origin.map((item) => tContent(apiClient, item));
    }
    return [tContent(apiClient, origin)];
}
function tContents(apiClient, origin) {
    if (!origin) {
        return [];
    }
    if (Array.isArray(origin)) {
        return origin.map((item) => tContent(apiClient, item));
    }
    return [tContent(apiClient, origin)];
}
function processSchema(apiClient, schema) {
    if (!apiClient.isVertexAI()) {
        if ('title' in schema) {
            delete schema['title'];
        }
        if ('default' in schema) {
            throw new Error('Default value is not supported in the response schema for the Gemini API.');
        }
    }
    if ('anyOf' in schema) {
        if (!apiClient.isVertexAI()) {
            throw new Error('AnyOf is not supported in the response schema for the Gemini API.');
        }
        if (schema['anyOf'] !== undefined) {
            for (const subSchema of schema['anyOf']) {
                processSchema(apiClient, subSchema);
            }
        }
    }
}
function tSchema(apiClient, schema) {
    processSchema(apiClient, schema);
    return schema;
}
function tSpeechConfig(apiClient, speechConfig) {
    if (typeof speechConfig === 'object' && 'voiceConfig' in speechConfig) {
        return speechConfig;
    }
    else if (typeof speechConfig === 'string') {
        return {
            voiceConfig: {
                prebuiltVoiceConfig: {
                    voiceName: speechConfig,
                },
            },
        };
    }
    else {
        throw new Error(`Unsupported speechConfig type: ${typeof speechConfig}`);
    }
}
function tTool(apiClient, tool) {
    return tool;
}
function tTools(apiClient, tool) {
    if (!Array.isArray(tool)) {
        throw new Error('tool is required and must be an array of Tools');
    }
    return tool;
}
/**
 * Prepends resource name with project, location, resource_prefix if needed.
 *
 * @param client The API client.
 * @param resourceName The resource name.
 * @param resourcePrefix The resource prefix.
 * @param splitsAfterPrefix The number of splits after the prefix.
 * @returns The completed resource name.
 *
 * Examples:
 *
 * ```
 * resource_name = '123'
 * resource_prefix = 'cachedContents'
 * splits_after_prefix = 1
 * client.vertexai = True
 * client.project = 'bar'
 * client.location = 'us-west1'
 * _resource_name(client, resource_name, resource_prefix, splits_after_prefix)
 * returns: 'projects/bar/locations/us-west1/cachedContents/123'
 * ```
 *
 * ```
 * resource_name = 'projects/foo/locations/us-central1/cachedContents/123'
 * resource_prefix = 'cachedContents'
 * splits_after_prefix = 1
 * client.vertexai = True
 * client.project = 'bar'
 * client.location = 'us-west1'
 * _resource_name(client, resource_name, resource_prefix, splits_after_prefix)
 * returns: 'projects/foo/locations/us-central1/cachedContents/123'
 * ```
 *
 * ```
 * resource_name = '123'
 * resource_prefix = 'cachedContents'
 * splits_after_prefix = 1
 * client.vertexai = False
 * _resource_name(client, resource_name, resource_prefix, splits_after_prefix)
 * returns 'cachedContents/123'
 * ```
 *
 * ```
 * resource_name = 'some/wrong/cachedContents/resource/name/123'
 * resource_prefix = 'cachedContents'
 * splits_after_prefix = 1
 * client.vertexai = False
 * # client.vertexai = True
 * _resource_name(client, resource_name, resource_prefix, splits_after_prefix)
 * -> 'some/wrong/resource/name/123'
 * ```
 */
function resourceName(client, resourceName, resourcePrefix, splitsAfterPrefix = 1) {
    const shouldAppendPrefix = !resourceName.startsWith(`${resourcePrefix}/`) &&
        resourceName.split('/').length === splitsAfterPrefix;
    if (client.isVertexAI()) {
        if (resourceName.startsWith('projects/')) {
            return resourceName;
        }
        else if (resourceName.startsWith('locations/')) {
            return `projects/${client.getProject()}/${resourceName}`;
        }
        else if (resourceName.startsWith(`${resourcePrefix}/`)) {
            return `projects/${client.getProject()}/locations/${client.getLocation()}/${resourceName}`;
        }
        else if (shouldAppendPrefix) {
            return `projects/${client.getProject()}/locations/${client.getLocation()}/${resourcePrefix}/${resourceName}`;
        }
        else {
            return resourceName;
        }
    }
    if (shouldAppendPrefix) {
        return `${resourcePrefix}/${resourceName}`;
    }
    return resourceName;
}
function tCachedContentName(apiClient, name) {
    if (typeof name !== 'string') {
        throw new Error('name must be a string');
    }
    return resourceName(apiClient, name, 'cachedContents');
}
function tTuningJobStatus(apiClient, status) {
    switch (status) {
        case 'STATE_UNSPECIFIED':
            return 'JOB_STATE_UNSPECIFIED';
        case 'CREATING':
            return 'JOB_STATE_RUNNING';
        case 'ACTIVE':
            return 'JOB_STATE_SUCCEEDED';
        case 'FAILED':
            return 'JOB_STATE_FAILED';
        default:
            return status;
    }
}
function tBytes(apiClient, fromImageBytes) {
    if (typeof fromImageBytes !== 'string') {
        throw new Error('fromImageBytes must be a string');
    }
    // TODO(b/389133914): Remove dummy bytes converter.
    return fromImageBytes;
}
function tFileName(apiClient, fromName) {
    if (typeof fromName !== 'string') {
        throw new Error('fromName must be a string');
    }
    // Remove the files/ prefx for MLdev urls to get the actual name of the file.
    if (fromName.startsWith('files/')) {
        return fromName.split('files/')[1];
    }
    return fromName;
}


/**
 * @fileoverview Pagers for the GenAI List APIs.
 */
// Type of request, response and config are determined by the specific list
// method.
/*  eslint-disable @typescript-eslint/no-explicit-any */
/** @internal */
var PagedItem;
(function (PagedItem) {
    PagedItem["PAGED_ITEM_BATCH_JOBS"] = "batchJobs";
    PagedItem["PAGED_ITEM_MODELS"] = "models";
    PagedItem["PAGED_ITEM_TUNING_JOBS"] = "tuningJobs";
    PagedItem["PAGED_ITEM_FILES"] = "files";
    PagedItem["PAGED_ITEM_CACHED_CONTENTS"] = "cachedContents";
})(PagedItem || (PagedItem = {}));
/**
 * Base pager class for iterating through paginated results.
 */
class BasePager {
    init(name, request, response, config) {
        var _a;
        this.nameInternal = name;
        this.requestInternal = request;
        this.pageInternal = response[this.nameInternal] || [];
        this.idxInternal = 0;
        let requestConfig = {};
        if (!config) {
            requestConfig = {};
        }
        else if (typeof config === 'object') {
            requestConfig = Object.assign({}, config);
        }
        else {
            requestConfig = config;
        }
        requestConfig['pageToken'] = response['nextPageToken'];
        this.configInternal = requestConfig;
        this.pageInternalSize =
            (_a = requestConfig['pageSize']) !== null && _a !== void 0 ? _a : this.pageInternal.length;
    }
    constructor(name, request, response, config) {
        this.pageInternal = [];
        this.init(name, request, response, config);
    }
    /**
     * Returns the current page, which is a list of items.
     *
     * The returned list of items is a subset of the entire list.
     */
    page() {
        return this.pageInternal;
    }
    /**
     * Returns the type of paged item (for example, ``batch_jobs``).
     */
    name() {
        return this.nameInternal;
    }
    /**
     * Returns the length of the page fetched each time by this pager.
     *
     * The number of items in the page is less than or equal to the page length.
     */
    pageSize() {
        return this.pageInternalSize;
    }
    /**
     * Returns the configuration when making the API request for the next page.
     *
     * A configuration is a set of optional parameters and arguments that can be
     * used to customize the API request. For example, the ``pageToken`` parameter
     * contains the token to request the next page.
     */
    config() {
        return this.configInternal;
    }
    /**
     * Returns the total number of items in the current page.
     */
    len() {
        return this.pageInternal.length;
    }
    /**
     * Returns the item at the given index.
     */
    getItem(index) {
        return this.pageInternal[index];
    }
    /**
     * Initializes the next page from the response.
     *
     * This is an internal method that should be called by subclasses after
     * fetching the next page.
     */
    initNextPage(response) {
        this.init(this.nameInternal, this.requestInternal, response, this.configInternal);
    }
}
/**
 * Pager class for iterating through paginated results.
 */
class Pager extends BasePager {
    constructor(name, request, response, config) {
        super(name, request, response, config);
    }
    [Symbol.asyncIterator]() {
        return {
            next: async () => {
                if (this.idxInternal >= this.len()) {
                    try {
                        this.nextPage();
                    }
                    catch (e) {
                        return { value: undefined, done: true };
                    }
                }
                const item = this.getItem(this.idxInternal);
                this.idxInternal += 1;
                return { value: item, done: false };
            },
            return: async () => {
                return { value: undefined, done: true };
            },
        };
    }
    /**
     * Fetches the next page of items. This makes a new API request.
     */
    nextPage() {
        if (!this.config()['pageToken']) {
            throw new Error('No more pages to fetch.');
        }
        const response = this.requestInternal(this.config());
        this.initNextPage(response);
        return this.page();
    }
}


// Code generated by the Google Gen AI SDK generator DO NOT EDIT.
var Outcome;
(function (Outcome) {
    Outcome["OUTCOME_UNSPECIFIED"] = "OUTCOME_UNSPECIFIED";
    Outcome["OUTCOME_OK"] = "OUTCOME_OK";
    Outcome["OUTCOME_FAILED"] = "OUTCOME_FAILED";
    Outcome["OUTCOME_DEADLINE_EXCEEDED"] = "OUTCOME_DEADLINE_EXCEEDED";
})(Outcome || (Outcome = {}));
var Language;
(function (Language) {
    Language["LANGUAGE_UNSPECIFIED"] = "LANGUAGE_UNSPECIFIED";
    Language["PYTHON"] = "PYTHON";
})(Language || (Language = {}));
var Type;
(function (Type) {
    Type["TYPE_UNSPECIFIED"] = "TYPE_UNSPECIFIED";
    Type["STRING"] = "STRING";
    Type["NUMBER"] = "NUMBER";
    Type["INTEGER"] = "INTEGER";
    Type["BOOLEAN"] = "BOOLEAN";
    Type["ARRAY"] = "ARRAY";
    Type["OBJECT"] = "OBJECT";
})(Type || (Type = {}));
var HarmCategory;
(function (HarmCategory) {
    HarmCategory["HARM_CATEGORY_UNSPECIFIED"] = "HARM_CATEGORY_UNSPECIFIED";
    HarmCategory["HARM_CATEGORY_HATE_SPEECH"] = "HARM_CATEGORY_HATE_SPEECH";
    HarmCategory["HARM_CATEGORY_DANGEROUS_CONTENT"] = "HARM_CATEGORY_DANGEROUS_CONTENT";
    HarmCategory["HARM_CATEGORY_HARASSMENT"] = "HARM_CATEGORY_HARASSMENT";
    HarmCategory["HARM_CATEGORY_SEXUALLY_EXPLICIT"] = "HARM_CATEGORY_SEXUALLY_EXPLICIT";
    HarmCategory["HARM_CATEGORY_CIVIC_INTEGRITY"] = "HARM_CATEGORY_CIVIC_INTEGRITY";
})(HarmCategory || (HarmCategory = {}));
var HarmBlockMethod;
(function (HarmBlockMethod) {
    HarmBlockMethod["HARM_BLOCK_METHOD_UNSPECIFIED"] = "HARM_BLOCK_METHOD_UNSPECIFIED";
    HarmBlockMethod["SEVERITY"] = "SEVERITY";
    HarmBlockMethod["PROBABILITY"] = "PROBABILITY";
})(HarmBlockMethod || (HarmBlockMethod = {}));
var HarmBlockThreshold;
(function (HarmBlockThreshold) {
    HarmBlockThreshold["HARM_BLOCK_THRESHOLD_UNSPECIFIED"] = "HARM_BLOCK_THRESHOLD_UNSPECIFIED";
    HarmBlockThreshold["BLOCK_LOW_AND_ABOVE"] = "BLOCK_LOW_AND_ABOVE";
    HarmBlockThreshold["BLOCK_MEDIUM_AND_ABOVE"] = "BLOCK_MEDIUM_AND_ABOVE";
    HarmBlockThreshold["BLOCK_ONLY_HIGH"] = "BLOCK_ONLY_HIGH";
    HarmBlockThreshold["BLOCK_NONE"] = "BLOCK_NONE";
    HarmBlockThreshold["OFF"] = "OFF";
})(HarmBlockThreshold || (HarmBlockThreshold = {}));
var Mode;
(function (Mode) {
    Mode["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
    Mode["MODE_DYNAMIC"] = "MODE_DYNAMIC";
})(Mode || (Mode = {}));
var FinishReason;
(function (FinishReason) {
    FinishReason["FINISH_REASON_UNSPECIFIED"] = "FINISH_REASON_UNSPECIFIED";
    FinishReason["STOP"] = "STOP";
    FinishReason["MAX_TOKENS"] = "MAX_TOKENS";
    FinishReason["SAFETY"] = "SAFETY";
    FinishReason["RECITATION"] = "RECITATION";
    FinishReason["OTHER"] = "OTHER";
    FinishReason["BLOCKLIST"] = "BLOCKLIST";
    FinishReason["PROHIBITED_CONTENT"] = "PROHIBITED_CONTENT";
    FinishReason["SPII"] = "SPII";
    FinishReason["MALFORMED_FUNCTION_CALL"] = "MALFORMED_FUNCTION_CALL";
})(FinishReason || (FinishReason = {}));
var HarmProbability;
(function (HarmProbability) {
    HarmProbability["HARM_PROBABILITY_UNSPECIFIED"] = "HARM_PROBABILITY_UNSPECIFIED";
    HarmProbability["NEGLIGIBLE"] = "NEGLIGIBLE";
    HarmProbability["LOW"] = "LOW";
    HarmProbability["MEDIUM"] = "MEDIUM";
    HarmProbability["HIGH"] = "HIGH";
})(HarmProbability || (HarmProbability = {}));
var HarmSeverity;
(function (HarmSeverity) {
    HarmSeverity["HARM_SEVERITY_UNSPECIFIED"] = "HARM_SEVERITY_UNSPECIFIED";
    HarmSeverity["HARM_SEVERITY_NEGLIGIBLE"] = "HARM_SEVERITY_NEGLIGIBLE";
    HarmSeverity["HARM_SEVERITY_LOW"] = "HARM_SEVERITY_LOW";
    HarmSeverity["HARM_SEVERITY_MEDIUM"] = "HARM_SEVERITY_MEDIUM";
    HarmSeverity["HARM_SEVERITY_HIGH"] = "HARM_SEVERITY_HIGH";
})(HarmSeverity || (HarmSeverity = {}));
var BlockedReason;
(function (BlockedReason) {
    BlockedReason["BLOCKED_REASON_UNSPECIFIED"] = "BLOCKED_REASON_UNSPECIFIED";
    BlockedReason["SAFETY"] = "SAFETY";
    BlockedReason["OTHER"] = "OTHER";
    BlockedReason["BLOCKLIST"] = "BLOCKLIST";
    BlockedReason["PROHIBITED_CONTENT"] = "PROHIBITED_CONTENT";
})(BlockedReason || (BlockedReason = {}));
var JobState;
(function (JobState) {
    JobState["JOB_STATE_UNSPECIFIED"] = "JOB_STATE_UNSPECIFIED";
    JobState["JOB_STATE_QUEUED"] = "JOB_STATE_QUEUED";
    JobState["JOB_STATE_PENDING"] = "JOB_STATE_PENDING";
    JobState["JOB_STATE_RUNNING"] = "JOB_STATE_RUNNING";
    JobState["JOB_STATE_SUCCEEDED"] = "JOB_STATE_SUCCEEDED";
    JobState["JOB_STATE_FAILED"] = "JOB_STATE_FAILED";
    JobState["JOB_STATE_CANCELLING"] = "JOB_STATE_CANCELLING";
    JobState["JOB_STATE_CANCELLED"] = "JOB_STATE_CANCELLED";
    JobState["JOB_STATE_PAUSED"] = "JOB_STATE_PAUSED";
    JobState["JOB_STATE_EXPIRED"] = "JOB_STATE_EXPIRED";
    JobState["JOB_STATE_UPDATING"] = "JOB_STATE_UPDATING";
    JobState["JOB_STATE_PARTIALLY_SUCCEEDED"] = "JOB_STATE_PARTIALLY_SUCCEEDED";
})(JobState || (JobState = {}));
var AdapterSize;
(function (AdapterSize) {
    AdapterSize["ADAPTER_SIZE_UNSPECIFIED"] = "ADAPTER_SIZE_UNSPECIFIED";
    AdapterSize["ADAPTER_SIZE_ONE"] = "ADAPTER_SIZE_ONE";
    AdapterSize["ADAPTER_SIZE_FOUR"] = "ADAPTER_SIZE_FOUR";
    AdapterSize["ADAPTER_SIZE_EIGHT"] = "ADAPTER_SIZE_EIGHT";
    AdapterSize["ADAPTER_SIZE_SIXTEEN"] = "ADAPTER_SIZE_SIXTEEN";
    AdapterSize["ADAPTER_SIZE_THIRTY_TWO"] = "ADAPTER_SIZE_THIRTY_TWO";
})(AdapterSize || (AdapterSize = {}));
var State;
(function (State) {
    State["STATE_UNSPECIFIED"] = "STATE_UNSPECIFIED";
    State["ACTIVE"] = "ACTIVE";
    State["ERROR"] = "ERROR";
})(State || (State = {}));
var DynamicRetrievalConfigMode;
(function (DynamicRetrievalConfigMode) {
    DynamicRetrievalConfigMode["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
    DynamicRetrievalConfigMode["MODE_DYNAMIC"] = "MODE_DYNAMIC";
})(DynamicRetrievalConfigMode || (DynamicRetrievalConfigMode = {}));
var FunctionCallingConfigMode;
(function (FunctionCallingConfigMode) {
    FunctionCallingConfigMode["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
    FunctionCallingConfigMode["AUTO"] = "AUTO";
    FunctionCallingConfigMode["ANY"] = "ANY";
    FunctionCallingConfigMode["NONE"] = "NONE";
})(FunctionCallingConfigMode || (FunctionCallingConfigMode = {}));
var MediaResolution;
(function (MediaResolution) {
    MediaResolution["MEDIA_RESOLUTION_UNSPECIFIED"] = "MEDIA_RESOLUTION_UNSPECIFIED";
    MediaResolution["MEDIA_RESOLUTION_LOW"] = "MEDIA_RESOLUTION_LOW";
    MediaResolution["MEDIA_RESOLUTION_MEDIUM"] = "MEDIA_RESOLUTION_MEDIUM";
    MediaResolution["MEDIA_RESOLUTION_HIGH"] = "MEDIA_RESOLUTION_HIGH";
})(MediaResolution || (MediaResolution = {}));
var SafetyFilterLevel;
(function (SafetyFilterLevel) {
    SafetyFilterLevel["BLOCK_LOW_AND_ABOVE"] = "BLOCK_LOW_AND_ABOVE";
    SafetyFilterLevel["BLOCK_MEDIUM_AND_ABOVE"] = "BLOCK_MEDIUM_AND_ABOVE";
    SafetyFilterLevel["BLOCK_ONLY_HIGH"] = "BLOCK_ONLY_HIGH";
    SafetyFilterLevel["BLOCK_NONE"] = "BLOCK_NONE";
})(SafetyFilterLevel || (SafetyFilterLevel = {}));
var PersonGeneration;
(function (PersonGeneration) {
    PersonGeneration["DONT_ALLOW"] = "DONT_ALLOW";
    PersonGeneration["ALLOW_ADULT"] = "ALLOW_ADULT";
    PersonGeneration["ALLOW_ALL"] = "ALLOW_ALL";
})(PersonGeneration || (PersonGeneration = {}));
var ImagePromptLanguage;
(function (ImagePromptLanguage) {
    ImagePromptLanguage["auto"] = "auto";
    ImagePromptLanguage["en"] = "en";
    ImagePromptLanguage["ja"] = "ja";
    ImagePromptLanguage["ko"] = "ko";
    ImagePromptLanguage["hi"] = "hi";
})(ImagePromptLanguage || (ImagePromptLanguage = {}));
var FileState;
(function (FileState) {
    FileState["STATE_UNSPECIFIED"] = "STATE_UNSPECIFIED";
    FileState["PROCESSING"] = "PROCESSING";
    FileState["ACTIVE"] = "ACTIVE";
    FileState["FAILED"] = "FAILED";
})(FileState || (FileState = {}));
var FileSource;
(function (FileSource) {
    FileSource["SOURCE_UNSPECIFIED"] = "SOURCE_UNSPECIFIED";
    FileSource["UPLOADED"] = "UPLOADED";
    FileSource["GENERATED"] = "GENERATED";
})(FileSource || (FileSource = {}));
var MaskReferenceMode;
(function (MaskReferenceMode) {
    MaskReferenceMode["MASK_MODE_DEFAULT"] = "MASK_MODE_DEFAULT";
    MaskReferenceMode["MASK_MODE_USER_PROVIDED"] = "MASK_MODE_USER_PROVIDED";
    MaskReferenceMode["MASK_MODE_BACKGROUND"] = "MASK_MODE_BACKGROUND";
    MaskReferenceMode["MASK_MODE_FOREGROUND"] = "MASK_MODE_FOREGROUND";
    MaskReferenceMode["MASK_MODE_SEMANTIC"] = "MASK_MODE_SEMANTIC";
})(MaskReferenceMode || (MaskReferenceMode = {}));
var ControlReferenceType;
(function (ControlReferenceType) {
    ControlReferenceType["CONTROL_TYPE_DEFAULT"] = "CONTROL_TYPE_DEFAULT";
    ControlReferenceType["CONTROL_TYPE_CANNY"] = "CONTROL_TYPE_CANNY";
    ControlReferenceType["CONTROL_TYPE_SCRIBBLE"] = "CONTROL_TYPE_SCRIBBLE";
    ControlReferenceType["CONTROL_TYPE_FACE_MESH"] = "CONTROL_TYPE_FACE_MESH";
})(ControlReferenceType || (ControlReferenceType = {}));
var SubjectReferenceType;
(function (SubjectReferenceType) {
    SubjectReferenceType["SUBJECT_TYPE_DEFAULT"] = "SUBJECT_TYPE_DEFAULT";
    SubjectReferenceType["SUBJECT_TYPE_PERSON"] = "SUBJECT_TYPE_PERSON";
    SubjectReferenceType["SUBJECT_TYPE_ANIMAL"] = "SUBJECT_TYPE_ANIMAL";
    SubjectReferenceType["SUBJECT_TYPE_PRODUCT"] = "SUBJECT_TYPE_PRODUCT";
})(SubjectReferenceType || (SubjectReferenceType = {}));
var Modality;
(function (Modality) {
    Modality["MODALITY_UNSPECIFIED"] = "MODALITY_UNSPECIFIED";
    Modality["TEXT"] = "TEXT";
    Modality["IMAGE"] = "IMAGE";
    Modality["AUDIO"] = "AUDIO";
})(Modality || (Modality = {}));
/** A function response. */
class FunctionResponse {
}
/**
 * createPartFromUri creates a Part object from a URI.
 */
function createPartFromUri(uri, mimeType) {
    return {
        fileData: {
            fileUri: uri,
            mimeType: mimeType,
        },
    };
}
/**
 * createPartFromText creates a Part object from a text.
 */
function createPartFromText(text) {
    return {
        text: text,
    };
}
/**
 * createPartFromFunctionCall creates a Part object from a function call.
 */
function createPartFromFunctionCall(name, args) {
    return {
        functionCall: {
            name: name,
            args: args,
        },
    };
}
/**
 * createPartFromFunctionResponse creates a Part object from a function response.
 */
function createPartFromFunctionResponse(id, name, response) {
    return {
        functionResponse: {
            id: id,
            name: name,
            response: response,
        },
    };
}
/**
 * createPartFromBase64 creates a Part object from a base64 string.
 */
function createPartFromBase64(data, mimeType) {
    return {
        inlineData: {
            data: data,
            mimeType: mimeType,
        },
    };
}
/**
 * createPartFromVideoMetadata creates a Part object from start and end offsets of a video metadata.
 */
function createPartFromVideoMetadata(startOffset, endOffset) {
    return {
        videoMetadata: {
            startOffset: startOffset,
            endOffset: endOffset,
        },
    };
}
/**
 * createPartFromCodeExecutionResult creates a Part object from outcome and output of a code execution result.
 */
function createPartFromCodeExecutionResult(outcome, output) {
    return {
        codeExecutionResult: {
            outcome: outcome,
            output: output,
        },
    };
}
/**
 * createPartFromExecutableCode creates a Part object from code and language of an executable code.
 */
function createPartFromExecutableCode(code, language) {
    return {
        executableCode: {
            code: code,
            language: language,
        },
    };
}
function _isPart(obj) {
    return (obj.fileData !== undefined ||
        obj.text !== undefined ||
        obj.functionCall !== undefined ||
        obj.functionResponse !== undefined ||
        obj.inlineData !== undefined ||
        obj.videoMetadata !== undefined ||
        obj.codeExecutionResult !== undefined ||
        obj.executableCode !== undefined);
}
function _toParts(partOrString) {
    let parts = [];
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
 * create a Content object with a user role from a PartListUnion or string.
 */
function createUserContent(partOrString) {
    return {
        role: 'user',
        parts: _toParts(partOrString),
    };
}
/**
 * create a Content object with a model role from a PartListUnion or string.
 */
function createModelContent(partOrString) {
    return {
        role: 'model',
        parts: _toParts(partOrString),
    };
}
/** Content filter results for a prompt sent in the request. */
class GenerateContentResponsePromptFeedback {
}
/** Usage metadata about response(s). */
class GenerateContentResponseUsageMetadata {
}
/** Response message for PredictionService.GenerateContent. */
class GenerateContentResponse {
    text() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (((_d = (_c = (_b = (_a = this === null || this === void 0 ? void 0 : this.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d.length) === 0) {
            return undefined;
        }
        if ((this === null || this === void 0 ? void 0 : this.candidates) && this.candidates.length > 1) {
            console.warn('there are multiple candidates in the response, returning text from the first one.');
        }
        let text = '';
        let anyTextPartText = false;
        for (const part of (_h = (_g = (_f = (_e = this === null || this === void 0 ? void 0 : this.candidates) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.content) === null || _g === void 0 ? void 0 : _g.parts) !== null && _h !== void 0 ? _h : []) {
            for (const [fieldName, fieldValue] of Object.entries(part)) {
                if (fieldName !== 'text' &&
                    fieldName !== 'thought' &&
                    (fieldValue !== null || fieldValue !== undefined)) {
                    throw new Error(`GenerateContentResponse.text only supports text parts, but got ${fieldName} part ${JSON.stringify(part)}`);
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
        // part.text === '' is different from part.text is null
        return anyTextPartText ? text : undefined;
    }
    functionCalls() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (((_d = (_c = (_b = (_a = this === null || this === void 0 ? void 0 : this.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d.length) === 0) {
            return undefined;
        }
        if ((this === null || this === void 0 ? void 0 : this.candidates) && this.candidates.length > 1) {
            console.warn('there are multiple candidates in the response, returning function calls from the first one.');
        }
        const functionCalls = (_h = (_g = (_f = (_e = this === null || this === void 0 ? void 0 : this.candidates) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.content) === null || _g === void 0 ? void 0 : _g.parts) === null || _h === void 0 ? void 0 : _h.filter((part) => part.functionCall).map((part) => part.functionCall).filter((functionCall) => functionCall !== undefined);
        if ((functionCalls === null || functionCalls === void 0 ? void 0 : functionCalls.length) === 0) {
            return undefined;
        }
        return functionCalls;
    }
}
/** Response for the embed_content method. */
class EmbedContentResponse {
}
/** The output images response. */
class GenerateImagesResponse {
}
/** Response for counting tokens. */
class CountTokensResponse {
}
/** Response for computing tokens. */
class ComputeTokensResponse {
}
/** Response for the list tuning jobs method. */
class ListTuningJobsResponse {
}
/** Empty response for caches.delete method. */
class DeleteCachedContentResponse {
}
class ListCachedContentsResponse {
}
/** Response for the list files method. */
class ListFilesResponse {
}
/** A wrapper class for the http response. */
class HttpResponse {
    constructor(response) {
        // Process the headers.
        let headers = {};
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
/** Response for the create file method. */
class CreateFileResponse {
}
/** Represents a single response in a replay. */
class ReplayResponse {
}
/** Client generated response to a `ToolCall` received from the server.

  Individual `FunctionResponse` objects are matched to the respective
  `FunctionCall` objects by the `id` field.

  Note that in the unary and server-streaming GenerateContent APIs function
  calling happens by exchanging the `Content` parts, while in the bidi
  GenerateContent APIs function calling happens over this dedicated set of
  messages.
   */
class LiveClientToolResponse {
}


class Caches extends BaseModule {
    constructor(apiClient) {
        super();
        this.apiClient = apiClient;
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
        this.list = async (params = {}) => {
            return new Pager(PagedItem.PAGED_ITEM_CACHED_CONTENTS, this.listInternal, await this.listInternal(params), params.config);
        };
    }
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
    async create(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = createCachedContentParametersToVertex(this.apiClient, params);
            path = formatMap('cachedContents', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = cachedContentFromVertex(this.apiClient, apiResponse);
                return resp;
            });
        }
        else {
            const body = createCachedContentParametersToMldev(this.apiClient, params);
            path = formatMap('cachedContents', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = cachedContentFromMldev(this.apiClient, apiResponse);
                return resp;
            });
        }
    }
    /**
     * Gets cached content configurations.
     *
     * @example
     * ```ts
     * await client.caches.get({name: 'gemini-1.5-flash'});
     * ```
     */
    async get(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = getCachedContentParametersToVertex(this.apiClient, params);
            path = formatMap('{name}', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'GET',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = cachedContentFromVertex(this.apiClient, apiResponse);
                return resp;
            });
        }
        else {
            const body = getCachedContentParametersToMldev(this.apiClient, params);
            path = formatMap('{name}', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'GET',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = cachedContentFromMldev(this.apiClient, apiResponse);
                return resp;
            });
        }
    }
    /**
     * Deletes cached content.
     *
     * @example
     * ```ts
     * await client.caches.delete({name: 'gemini-1.5-flash'});
     * ```
     */
    async delete(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = deleteCachedContentParametersToVertex(this.apiClient, params);
            path = formatMap('{name}', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'DELETE',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = deleteCachedContentResponseFromVertex(this.apiClient);
                const typedResp = new DeleteCachedContentResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
        else {
            const body = deleteCachedContentParametersToMldev(this.apiClient, params);
            path = formatMap('{name}', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'DELETE',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = deleteCachedContentResponseFromMldev(this.apiClient);
                const typedResp = new DeleteCachedContentResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
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
    async update(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = updateCachedContentParametersToVertex(this.apiClient, params);
            path = formatMap('{name}', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'PATCH',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = cachedContentFromVertex(this.apiClient, apiResponse);
                return resp;
            });
        }
        else {
            const body = updateCachedContentParametersToMldev(this.apiClient, params);
            path = formatMap('{name}', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'PATCH',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = cachedContentFromMldev(this.apiClient, apiResponse);
                return resp;
            });
        }
    }
    async listInternal(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = listCachedContentsParametersToVertex(this.apiClient, params);
            path = formatMap('cachedContents', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'GET',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = listCachedContentsResponseFromVertex(this.apiClient, apiResponse);
                const typedResp = new ListCachedContentsResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
        else {
            const body = listCachedContentsParametersToMldev(this.apiClient, params);
            path = formatMap('cachedContents', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'GET',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = listCachedContentsResponseFromMldev(this.apiClient, apiResponse);
                const typedResp = new ListCachedContentsResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
}
function partToMldev$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ['videoMetadata']) !== undefined) {
        throw new Error('videoMetadata parameter is not supported in Gemini API.');
    }
    const fromThought = getValueByPath(fromObject, ['thought']);
    if (fromThought !== undefined && fromThought !== null) {
        setValueByPath(toObject, ['thought'], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
        'codeExecutionResult',
    ]);
    if (fromCodeExecutionResult !== undefined &&
        fromCodeExecutionResult !== null) {
        setValueByPath(toObject, ['codeExecutionResult'], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
        'executableCode',
    ]);
    if (fromExecutableCode !== undefined && fromExecutableCode !== null) {
        setValueByPath(toObject, ['executableCode'], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ['fileData']);
    if (fromFileData !== undefined && fromFileData !== null) {
        setValueByPath(toObject, ['fileData'], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ['functionCall']);
    if (fromFunctionCall !== undefined && fromFunctionCall !== null) {
        setValueByPath(toObject, ['functionCall'], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
        'functionResponse',
    ]);
    if (fromFunctionResponse !== undefined && fromFunctionResponse !== null) {
        setValueByPath(toObject, ['functionResponse'], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ['inlineData']);
    if (fromInlineData !== undefined && fromInlineData !== null) {
        setValueByPath(toObject, ['inlineData'], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ['text']);
    if (fromText !== undefined && fromText !== null) {
        setValueByPath(toObject, ['text'], fromText);
    }
    return toObject;
}
function partToVertex$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromVideoMetadata = getValueByPath(fromObject, [
        'videoMetadata',
    ]);
    if (fromVideoMetadata !== undefined && fromVideoMetadata !== null) {
        setValueByPath(toObject, ['videoMetadata'], fromVideoMetadata);
    }
    const fromThought = getValueByPath(fromObject, ['thought']);
    if (fromThought !== undefined && fromThought !== null) {
        setValueByPath(toObject, ['thought'], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
        'codeExecutionResult',
    ]);
    if (fromCodeExecutionResult !== undefined &&
        fromCodeExecutionResult !== null) {
        setValueByPath(toObject, ['codeExecutionResult'], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
        'executableCode',
    ]);
    if (fromExecutableCode !== undefined && fromExecutableCode !== null) {
        setValueByPath(toObject, ['executableCode'], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ['fileData']);
    if (fromFileData !== undefined && fromFileData !== null) {
        setValueByPath(toObject, ['fileData'], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ['functionCall']);
    if (fromFunctionCall !== undefined && fromFunctionCall !== null) {
        setValueByPath(toObject, ['functionCall'], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
        'functionResponse',
    ]);
    if (fromFunctionResponse !== undefined && fromFunctionResponse !== null) {
        setValueByPath(toObject, ['functionResponse'], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ['inlineData']);
    if (fromInlineData !== undefined && fromInlineData !== null) {
        setValueByPath(toObject, ['inlineData'], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ['text']);
    if (fromText !== undefined && fromText !== null) {
        setValueByPath(toObject, ['text'], fromText);
    }
    return toObject;
}
/** @internal */
function contentToMldev$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ['parts']);
    if (fromParts !== undefined && fromParts !== null) {
        if (Array.isArray(fromParts)) {
            setValueByPath(toObject, ['parts'], fromParts.map((item) => {
                return partToMldev$1(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['parts'], fromParts);
        }
    }
    const fromRole = getValueByPath(fromObject, ['role']);
    if (fromRole !== undefined && fromRole !== null) {
        setValueByPath(toObject, ['role'], fromRole);
    }
    return toObject;
}
/** @internal */
function contentToVertex$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ['parts']);
    if (fromParts !== undefined && fromParts !== null) {
        if (Array.isArray(fromParts)) {
            setValueByPath(toObject, ['parts'], fromParts.map((item) => {
                return partToVertex$1(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['parts'], fromParts);
        }
    }
    const fromRole = getValueByPath(fromObject, ['role']);
    if (fromRole !== undefined && fromRole !== null) {
        setValueByPath(toObject, ['role'], fromRole);
    }
    return toObject;
}
function schemaToVertex$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromMinItems = getValueByPath(fromObject, ['minItems']);
    if (fromMinItems !== undefined && fromMinItems !== null) {
        setValueByPath(toObject, ['minItems'], fromMinItems);
    }
    const fromExample = getValueByPath(fromObject, ['example']);
    if (fromExample !== undefined && fromExample !== null) {
        setValueByPath(toObject, ['example'], fromExample);
    }
    const fromPropertyOrdering = getValueByPath(fromObject, [
        'propertyOrdering',
    ]);
    if (fromPropertyOrdering !== undefined && fromPropertyOrdering !== null) {
        setValueByPath(toObject, ['propertyOrdering'], fromPropertyOrdering);
    }
    const fromPattern = getValueByPath(fromObject, ['pattern']);
    if (fromPattern !== undefined && fromPattern !== null) {
        setValueByPath(toObject, ['pattern'], fromPattern);
    }
    const fromMinimum = getValueByPath(fromObject, ['minimum']);
    if (fromMinimum !== undefined && fromMinimum !== null) {
        setValueByPath(toObject, ['minimum'], fromMinimum);
    }
    const fromDefault = getValueByPath(fromObject, ['default']);
    if (fromDefault !== undefined && fromDefault !== null) {
        setValueByPath(toObject, ['default'], fromDefault);
    }
    const fromAnyOf = getValueByPath(fromObject, ['anyOf']);
    if (fromAnyOf !== undefined && fromAnyOf !== null) {
        setValueByPath(toObject, ['anyOf'], fromAnyOf);
    }
    const fromMaxLength = getValueByPath(fromObject, ['maxLength']);
    if (fromMaxLength !== undefined && fromMaxLength !== null) {
        setValueByPath(toObject, ['maxLength'], fromMaxLength);
    }
    const fromTitle = getValueByPath(fromObject, ['title']);
    if (fromTitle !== undefined && fromTitle !== null) {
        setValueByPath(toObject, ['title'], fromTitle);
    }
    const fromMinLength = getValueByPath(fromObject, ['minLength']);
    if (fromMinLength !== undefined && fromMinLength !== null) {
        setValueByPath(toObject, ['minLength'], fromMinLength);
    }
    const fromMinProperties = getValueByPath(fromObject, [
        'minProperties',
    ]);
    if (fromMinProperties !== undefined && fromMinProperties !== null) {
        setValueByPath(toObject, ['minProperties'], fromMinProperties);
    }
    const fromMaxItems = getValueByPath(fromObject, ['maxItems']);
    if (fromMaxItems !== undefined && fromMaxItems !== null) {
        setValueByPath(toObject, ['maxItems'], fromMaxItems);
    }
    const fromMaximum = getValueByPath(fromObject, ['maximum']);
    if (fromMaximum !== undefined && fromMaximum !== null) {
        setValueByPath(toObject, ['maximum'], fromMaximum);
    }
    const fromNullable = getValueByPath(fromObject, ['nullable']);
    if (fromNullable !== undefined && fromNullable !== null) {
        setValueByPath(toObject, ['nullable'], fromNullable);
    }
    const fromMaxProperties = getValueByPath(fromObject, [
        'maxProperties',
    ]);
    if (fromMaxProperties !== undefined && fromMaxProperties !== null) {
        setValueByPath(toObject, ['maxProperties'], fromMaxProperties);
    }
    const fromType = getValueByPath(fromObject, ['type']);
    if (fromType !== undefined && fromType !== null) {
        setValueByPath(toObject, ['type'], fromType);
    }
    const fromDescription = getValueByPath(fromObject, ['description']);
    if (fromDescription !== undefined && fromDescription !== null) {
        setValueByPath(toObject, ['description'], fromDescription);
    }
    const fromEnum = getValueByPath(fromObject, ['enum']);
    if (fromEnum !== undefined && fromEnum !== null) {
        setValueByPath(toObject, ['enum'], fromEnum);
    }
    const fromFormat = getValueByPath(fromObject, ['format']);
    if (fromFormat !== undefined && fromFormat !== null) {
        setValueByPath(toObject, ['format'], fromFormat);
    }
    const fromItems = getValueByPath(fromObject, ['items']);
    if (fromItems !== undefined && fromItems !== null) {
        setValueByPath(toObject, ['items'], fromItems);
    }
    const fromProperties = getValueByPath(fromObject, ['properties']);
    if (fromProperties !== undefined && fromProperties !== null) {
        setValueByPath(toObject, ['properties'], fromProperties);
    }
    const fromRequired = getValueByPath(fromObject, ['required']);
    if (fromRequired !== undefined && fromRequired !== null) {
        setValueByPath(toObject, ['required'], fromRequired);
    }
    return toObject;
}
function functionDeclarationToMldev$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ['response']) !== undefined) {
        throw new Error('response parameter is not supported in Gemini API.');
    }
    const fromDescription = getValueByPath(fromObject, ['description']);
    if (fromDescription !== undefined && fromDescription !== null) {
        setValueByPath(toObject, ['description'], fromDescription);
    }
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['name'], fromName);
    }
    const fromParameters = getValueByPath(fromObject, ['parameters']);
    if (fromParameters !== undefined && fromParameters !== null) {
        setValueByPath(toObject, ['parameters'], fromParameters);
    }
    return toObject;
}
function functionDeclarationToVertex$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromResponse = getValueByPath(fromObject, ['response']);
    if (fromResponse !== undefined && fromResponse !== null) {
        setValueByPath(toObject, ['response'], schemaToVertex$1(apiClient, fromResponse));
    }
    const fromDescription = getValueByPath(fromObject, ['description']);
    if (fromDescription !== undefined && fromDescription !== null) {
        setValueByPath(toObject, ['description'], fromDescription);
    }
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['name'], fromName);
    }
    const fromParameters = getValueByPath(fromObject, ['parameters']);
    if (fromParameters !== undefined && fromParameters !== null) {
        setValueByPath(toObject, ['parameters'], fromParameters);
    }
    return toObject;
}
function googleSearchToMldev$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    return toObject;
}
function googleSearchToVertex$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    return toObject;
}
function dynamicRetrievalConfigToMldev$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ['mode']);
    if (fromMode !== undefined && fromMode !== null) {
        setValueByPath(toObject, ['mode'], fromMode);
    }
    const fromDynamicThreshold = getValueByPath(fromObject, [
        'dynamicThreshold',
    ]);
    if (fromDynamicThreshold !== undefined && fromDynamicThreshold !== null) {
        setValueByPath(toObject, ['dynamicThreshold'], fromDynamicThreshold);
    }
    return toObject;
}
function dynamicRetrievalConfigToVertex$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ['mode']);
    if (fromMode !== undefined && fromMode !== null) {
        setValueByPath(toObject, ['mode'], fromMode);
    }
    const fromDynamicThreshold = getValueByPath(fromObject, [
        'dynamicThreshold',
    ]);
    if (fromDynamicThreshold !== undefined && fromDynamicThreshold !== null) {
        setValueByPath(toObject, ['dynamicThreshold'], fromDynamicThreshold);
    }
    return toObject;
}
function googleSearchRetrievalToMldev$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromDynamicRetrievalConfig = getValueByPath(fromObject, [
        'dynamicRetrievalConfig',
    ]);
    if (fromDynamicRetrievalConfig !== undefined &&
        fromDynamicRetrievalConfig !== null) {
        setValueByPath(toObject, ['dynamicRetrievalConfig'], dynamicRetrievalConfigToMldev$1(apiClient, fromDynamicRetrievalConfig));
    }
    return toObject;
}
function googleSearchRetrievalToVertex$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromDynamicRetrievalConfig = getValueByPath(fromObject, [
        'dynamicRetrievalConfig',
    ]);
    if (fromDynamicRetrievalConfig !== undefined &&
        fromDynamicRetrievalConfig !== null) {
        setValueByPath(toObject, ['dynamicRetrievalConfig'], dynamicRetrievalConfigToVertex$1(apiClient, fromDynamicRetrievalConfig));
    }
    return toObject;
}
/** @internal */
function toolToMldev$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromFunctionDeclarations = getValueByPath(fromObject, [
        'functionDeclarations',
    ]);
    if (fromFunctionDeclarations !== undefined &&
        fromFunctionDeclarations !== null) {
        if (Array.isArray(fromFunctionDeclarations)) {
            setValueByPath(toObject, ['functionDeclarations'], fromFunctionDeclarations.map((item) => {
                return functionDeclarationToMldev$1(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['functionDeclarations'], fromFunctionDeclarations);
        }
    }
    if (getValueByPath(fromObject, ['retrieval']) !== undefined) {
        throw new Error('retrieval parameter is not supported in Gemini API.');
    }
    const fromGoogleSearch = getValueByPath(fromObject, ['googleSearch']);
    if (fromGoogleSearch !== undefined && fromGoogleSearch !== null) {
        setValueByPath(toObject, ['googleSearch'], googleSearchToMldev$1());
    }
    const fromGoogleSearchRetrieval = getValueByPath(fromObject, [
        'googleSearchRetrieval',
    ]);
    if (fromGoogleSearchRetrieval !== undefined &&
        fromGoogleSearchRetrieval !== null) {
        setValueByPath(toObject, ['googleSearchRetrieval'], googleSearchRetrievalToMldev$1(apiClient, fromGoogleSearchRetrieval));
    }
    const fromCodeExecution = getValueByPath(fromObject, [
        'codeExecution',
    ]);
    if (fromCodeExecution !== undefined && fromCodeExecution !== null) {
        setValueByPath(toObject, ['codeExecution'], fromCodeExecution);
    }
    return toObject;
}
/** @internal */
function toolToVertex$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromFunctionDeclarations = getValueByPath(fromObject, [
        'functionDeclarations',
    ]);
    if (fromFunctionDeclarations !== undefined &&
        fromFunctionDeclarations !== null) {
        if (Array.isArray(fromFunctionDeclarations)) {
            setValueByPath(toObject, ['functionDeclarations'], fromFunctionDeclarations.map((item) => {
                return functionDeclarationToVertex$1(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['functionDeclarations'], fromFunctionDeclarations);
        }
    }
    const fromRetrieval = getValueByPath(fromObject, ['retrieval']);
    if (fromRetrieval !== undefined && fromRetrieval !== null) {
        setValueByPath(toObject, ['retrieval'], fromRetrieval);
    }
    const fromGoogleSearch = getValueByPath(fromObject, ['googleSearch']);
    if (fromGoogleSearch !== undefined && fromGoogleSearch !== null) {
        setValueByPath(toObject, ['googleSearch'], googleSearchToVertex$1());
    }
    const fromGoogleSearchRetrieval = getValueByPath(fromObject, [
        'googleSearchRetrieval',
    ]);
    if (fromGoogleSearchRetrieval !== undefined &&
        fromGoogleSearchRetrieval !== null) {
        setValueByPath(toObject, ['googleSearchRetrieval'], googleSearchRetrievalToVertex$1(apiClient, fromGoogleSearchRetrieval));
    }
    const fromCodeExecution = getValueByPath(fromObject, [
        'codeExecution',
    ]);
    if (fromCodeExecution !== undefined && fromCodeExecution !== null) {
        setValueByPath(toObject, ['codeExecution'], fromCodeExecution);
    }
    return toObject;
}
function functionCallingConfigToMldev$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ['mode']);
    if (fromMode !== undefined && fromMode !== null) {
        setValueByPath(toObject, ['mode'], fromMode);
    }
    const fromAllowedFunctionNames = getValueByPath(fromObject, [
        'allowedFunctionNames',
    ]);
    if (fromAllowedFunctionNames !== undefined &&
        fromAllowedFunctionNames !== null) {
        setValueByPath(toObject, ['allowedFunctionNames'], fromAllowedFunctionNames);
    }
    return toObject;
}
function functionCallingConfigToVertex$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ['mode']);
    if (fromMode !== undefined && fromMode !== null) {
        setValueByPath(toObject, ['mode'], fromMode);
    }
    const fromAllowedFunctionNames = getValueByPath(fromObject, [
        'allowedFunctionNames',
    ]);
    if (fromAllowedFunctionNames !== undefined &&
        fromAllowedFunctionNames !== null) {
        setValueByPath(toObject, ['allowedFunctionNames'], fromAllowedFunctionNames);
    }
    return toObject;
}
function toolConfigToMldev$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromFunctionCallingConfig = getValueByPath(fromObject, [
        'functionCallingConfig',
    ]);
    if (fromFunctionCallingConfig !== undefined &&
        fromFunctionCallingConfig !== null) {
        setValueByPath(toObject, ['functionCallingConfig'], functionCallingConfigToMldev$1(apiClient, fromFunctionCallingConfig));
    }
    return toObject;
}
function toolConfigToVertex$1(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromFunctionCallingConfig = getValueByPath(fromObject, [
        'functionCallingConfig',
    ]);
    if (fromFunctionCallingConfig !== undefined &&
        fromFunctionCallingConfig !== null) {
        setValueByPath(toObject, ['functionCallingConfig'], functionCallingConfigToVertex$1(apiClient, fromFunctionCallingConfig));
    }
    return toObject;
}
function createCachedContentConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTtl = getValueByPath(fromObject, ['ttl']);
    if (parentObject !== undefined && fromTtl !== undefined && fromTtl !== null) {
        setValueByPath(parentObject, ['ttl'], fromTtl);
    }
    const fromExpireTime = getValueByPath(fromObject, ['expireTime']);
    if (parentObject !== undefined &&
        fromExpireTime !== undefined &&
        fromExpireTime !== null) {
        setValueByPath(parentObject, ['expireTime'], fromExpireTime);
    }
    const fromDisplayName = getValueByPath(fromObject, ['displayName']);
    if (parentObject !== undefined &&
        fromDisplayName !== undefined &&
        fromDisplayName !== null) {
        setValueByPath(parentObject, ['displayName'], fromDisplayName);
    }
    const fromContents = getValueByPath(fromObject, ['contents']);
    if (parentObject !== undefined &&
        fromContents !== undefined &&
        fromContents !== null) {
        if (Array.isArray(fromContents)) {
            setValueByPath(parentObject, ['contents'], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
                return contentToMldev$1(apiClient, item);
            })));
        }
        else {
            setValueByPath(parentObject, ['contents'], tContents(apiClient, fromContents));
        }
    }
    const fromSystemInstruction = getValueByPath(fromObject, [
        'systemInstruction',
    ]);
    if (parentObject !== undefined &&
        fromSystemInstruction !== undefined &&
        fromSystemInstruction !== null) {
        setValueByPath(parentObject, ['systemInstruction'], contentToMldev$1(apiClient, tContent(apiClient, fromSystemInstruction)));
    }
    const fromTools = getValueByPath(fromObject, ['tools']);
    if (parentObject !== undefined &&
        fromTools !== undefined &&
        fromTools !== null) {
        if (Array.isArray(fromTools)) {
            setValueByPath(parentObject, ['tools'], fromTools.map((item) => {
                return toolToMldev$1(apiClient, item);
            }));
        }
        else {
            setValueByPath(parentObject, ['tools'], fromTools);
        }
    }
    const fromToolConfig = getValueByPath(fromObject, ['toolConfig']);
    if (parentObject !== undefined &&
        fromToolConfig !== undefined &&
        fromToolConfig !== null) {
        setValueByPath(parentObject, ['toolConfig'], toolConfigToMldev$1(apiClient, fromToolConfig));
    }
    return toObject;
}
function createCachedContentConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTtl = getValueByPath(fromObject, ['ttl']);
    if (parentObject !== undefined && fromTtl !== undefined && fromTtl !== null) {
        setValueByPath(parentObject, ['ttl'], fromTtl);
    }
    const fromExpireTime = getValueByPath(fromObject, ['expireTime']);
    if (parentObject !== undefined &&
        fromExpireTime !== undefined &&
        fromExpireTime !== null) {
        setValueByPath(parentObject, ['expireTime'], fromExpireTime);
    }
    const fromDisplayName = getValueByPath(fromObject, ['displayName']);
    if (parentObject !== undefined &&
        fromDisplayName !== undefined &&
        fromDisplayName !== null) {
        setValueByPath(parentObject, ['displayName'], fromDisplayName);
    }
    const fromContents = getValueByPath(fromObject, ['contents']);
    if (parentObject !== undefined &&
        fromContents !== undefined &&
        fromContents !== null) {
        if (Array.isArray(fromContents)) {
            setValueByPath(parentObject, ['contents'], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
                return contentToVertex$1(apiClient, item);
            })));
        }
        else {
            setValueByPath(parentObject, ['contents'], tContents(apiClient, fromContents));
        }
    }
    const fromSystemInstruction = getValueByPath(fromObject, [
        'systemInstruction',
    ]);
    if (parentObject !== undefined &&
        fromSystemInstruction !== undefined &&
        fromSystemInstruction !== null) {
        setValueByPath(parentObject, ['systemInstruction'], contentToVertex$1(apiClient, tContent(apiClient, fromSystemInstruction)));
    }
    const fromTools = getValueByPath(fromObject, ['tools']);
    if (parentObject !== undefined &&
        fromTools !== undefined &&
        fromTools !== null) {
        if (Array.isArray(fromTools)) {
            setValueByPath(parentObject, ['tools'], fromTools.map((item) => {
                return toolToVertex$1(apiClient, item);
            }));
        }
        else {
            setValueByPath(parentObject, ['tools'], fromTools);
        }
    }
    const fromToolConfig = getValueByPath(fromObject, ['toolConfig']);
    if (parentObject !== undefined &&
        fromToolConfig !== undefined &&
        fromToolConfig !== null) {
        setValueByPath(parentObject, ['toolConfig'], toolConfigToVertex$1(apiClient, fromToolConfig));
    }
    return toObject;
}
function createCachedContentParametersToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ['model']);
    if (fromModel !== undefined && fromModel !== null) {
        setValueByPath(toObject, ['model'], tCachesModel(apiClient, fromModel));
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], createCachedContentConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function createCachedContentParametersToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ['model']);
    if (fromModel !== undefined && fromModel !== null) {
        setValueByPath(toObject, ['model'], tCachesModel(apiClient, fromModel));
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], createCachedContentConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function getCachedContentParametersToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['_url', 'name'], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], fromConfig);
    }
    return toObject;
}
function getCachedContentParametersToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['_url', 'name'], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], fromConfig);
    }
    return toObject;
}
function deleteCachedContentParametersToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['_url', 'name'], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], fromConfig);
    }
    return toObject;
}
function deleteCachedContentParametersToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['_url', 'name'], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], fromConfig);
    }
    return toObject;
}
function updateCachedContentConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTtl = getValueByPath(fromObject, ['ttl']);
    if (parentObject !== undefined && fromTtl !== undefined && fromTtl !== null) {
        setValueByPath(parentObject, ['ttl'], fromTtl);
    }
    const fromExpireTime = getValueByPath(fromObject, ['expireTime']);
    if (parentObject !== undefined &&
        fromExpireTime !== undefined &&
        fromExpireTime !== null) {
        setValueByPath(parentObject, ['expireTime'], fromExpireTime);
    }
    return toObject;
}
function updateCachedContentConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTtl = getValueByPath(fromObject, ['ttl']);
    if (parentObject !== undefined && fromTtl !== undefined && fromTtl !== null) {
        setValueByPath(parentObject, ['ttl'], fromTtl);
    }
    const fromExpireTime = getValueByPath(fromObject, ['expireTime']);
    if (parentObject !== undefined &&
        fromExpireTime !== undefined &&
        fromExpireTime !== null) {
        setValueByPath(parentObject, ['expireTime'], fromExpireTime);
    }
    return toObject;
}
function updateCachedContentParametersToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['_url', 'name'], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], updateCachedContentConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function updateCachedContentParametersToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['_url', 'name'], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], updateCachedContentConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function listCachedContentsConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromPageSize = getValueByPath(fromObject, ['pageSize']);
    if (parentObject !== undefined &&
        fromPageSize !== undefined &&
        fromPageSize !== null) {
        setValueByPath(parentObject, ['_query', 'pageSize'], fromPageSize);
    }
    const fromPageToken = getValueByPath(fromObject, ['pageToken']);
    if (parentObject !== undefined &&
        fromPageToken !== undefined &&
        fromPageToken !== null) {
        setValueByPath(parentObject, ['_query', 'pageToken'], fromPageToken);
    }
    return toObject;
}
function listCachedContentsConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromPageSize = getValueByPath(fromObject, ['pageSize']);
    if (parentObject !== undefined &&
        fromPageSize !== undefined &&
        fromPageSize !== null) {
        setValueByPath(parentObject, ['_query', 'pageSize'], fromPageSize);
    }
    const fromPageToken = getValueByPath(fromObject, ['pageToken']);
    if (parentObject !== undefined &&
        fromPageToken !== undefined &&
        fromPageToken !== null) {
        setValueByPath(parentObject, ['_query', 'pageToken'], fromPageToken);
    }
    return toObject;
}
function listCachedContentsParametersToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], listCachedContentsConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function listCachedContentsParametersToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], listCachedContentsConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function cachedContentFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['name'], fromName);
    }
    const fromDisplayName = getValueByPath(fromObject, ['displayName']);
    if (fromDisplayName !== undefined && fromDisplayName !== null) {
        setValueByPath(toObject, ['displayName'], fromDisplayName);
    }
    const fromModel = getValueByPath(fromObject, ['model']);
    if (fromModel !== undefined && fromModel !== null) {
        setValueByPath(toObject, ['model'], fromModel);
    }
    const fromCreateTime = getValueByPath(fromObject, ['createTime']);
    if (fromCreateTime !== undefined && fromCreateTime !== null) {
        setValueByPath(toObject, ['createTime'], fromCreateTime);
    }
    const fromUpdateTime = getValueByPath(fromObject, ['updateTime']);
    if (fromUpdateTime !== undefined && fromUpdateTime !== null) {
        setValueByPath(toObject, ['updateTime'], fromUpdateTime);
    }
    const fromExpireTime = getValueByPath(fromObject, ['expireTime']);
    if (fromExpireTime !== undefined && fromExpireTime !== null) {
        setValueByPath(toObject, ['expireTime'], fromExpireTime);
    }
    const fromUsageMetadata = getValueByPath(fromObject, [
        'usageMetadata',
    ]);
    if (fromUsageMetadata !== undefined && fromUsageMetadata !== null) {
        setValueByPath(toObject, ['usageMetadata'], fromUsageMetadata);
    }
    return toObject;
}
function cachedContentFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['name'], fromName);
    }
    const fromDisplayName = getValueByPath(fromObject, ['displayName']);
    if (fromDisplayName !== undefined && fromDisplayName !== null) {
        setValueByPath(toObject, ['displayName'], fromDisplayName);
    }
    const fromModel = getValueByPath(fromObject, ['model']);
    if (fromModel !== undefined && fromModel !== null) {
        setValueByPath(toObject, ['model'], fromModel);
    }
    const fromCreateTime = getValueByPath(fromObject, ['createTime']);
    if (fromCreateTime !== undefined && fromCreateTime !== null) {
        setValueByPath(toObject, ['createTime'], fromCreateTime);
    }
    const fromUpdateTime = getValueByPath(fromObject, ['updateTime']);
    if (fromUpdateTime !== undefined && fromUpdateTime !== null) {
        setValueByPath(toObject, ['updateTime'], fromUpdateTime);
    }
    const fromExpireTime = getValueByPath(fromObject, ['expireTime']);
    if (fromExpireTime !== undefined && fromExpireTime !== null) {
        setValueByPath(toObject, ['expireTime'], fromExpireTime);
    }
    const fromUsageMetadata = getValueByPath(fromObject, [
        'usageMetadata',
    ]);
    if (fromUsageMetadata !== undefined && fromUsageMetadata !== null) {
        setValueByPath(toObject, ['usageMetadata'], fromUsageMetadata);
    }
    return toObject;
}
function deleteCachedContentResponseFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    return toObject;
}
function deleteCachedContentResponseFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    return toObject;
}
function listCachedContentsResponseFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromNextPageToken = getValueByPath(fromObject, [
        'nextPageToken',
    ]);
    if (fromNextPageToken !== undefined && fromNextPageToken !== null) {
        setValueByPath(toObject, ['nextPageToken'], fromNextPageToken);
    }
    const fromCachedContents = getValueByPath(fromObject, [
        'cachedContents',
    ]);
    if (fromCachedContents !== undefined && fromCachedContents !== null) {
        if (Array.isArray(fromCachedContents)) {
            setValueByPath(toObject, ['cachedContents'], fromCachedContents.map((item) => {
                return cachedContentFromMldev(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['cachedContents'], fromCachedContents);
        }
    }
    return toObject;
}
function listCachedContentsResponseFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromNextPageToken = getValueByPath(fromObject, [
        'nextPageToken',
    ]);
    if (fromNextPageToken !== undefined && fromNextPageToken !== null) {
        setValueByPath(toObject, ['nextPageToken'], fromNextPageToken);
    }
    const fromCachedContents = getValueByPath(fromObject, [
        'cachedContents',
    ]);
    if (fromCachedContents !== undefined && fromCachedContents !== null) {
        if (Array.isArray(fromCachedContents)) {
            setValueByPath(toObject, ['cachedContents'], fromCachedContents.map((item) => {
                return cachedContentFromVertex(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['cachedContents'], fromCachedContents);
        }
    }
    return toObject;
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};


/**
 * Validates the GenerateContentResponse.
 *
 * @param response The GenerateContentResponse to validate.
 * @returns True if the response is valid, false otherwise.
 */
function validateResponse(response) {
    var _a;
    if (response.candidates == undefined || response.candidates.length === 0) {
        return false;
    }
    const content = (_a = response.candidates[0]) === null || _a === void 0 ? void 0 : _a.content;
    if (content === undefined) {
        return false;
    }
    if (content.parts === undefined || content.parts.length === 0) {
        return false;
    }
    for (const part of content.parts) {
        if (part === undefined || Object.keys(part).length === 0) {
            return false;
        }
        if (part.text !== undefined && part.text === '') {
            return false;
        }
    }
    return true;
}
/**
 * Processes the stream response and appends the valid response to the history.
 *
 * @param streamResponse The stream response to process.
 * @param curatedHistory The curated history of the conversation.
 * @param inputContent The input content which sends to the model.
 * @returns generator of the stream response.
 */
function processStreamResponse(streamResponse, curatedHistory, inputContent) {
    var _a, _b, _c, _d;
    return __asyncGenerator(this, arguments, function* processStreamResponse_1() {
        var _e, e_1, _f, _g;
        const outputContent = [];
        let finishReason = undefined;
        try {
            for (var _h = true, streamResponse_1 = __asyncValues(streamResponse), streamResponse_1_1; streamResponse_1_1 = yield __await(streamResponse_1.next()), _e = streamResponse_1_1.done, !_e; _h = true) {
                _g = streamResponse_1_1.value;
                _h = false;
                const chunk = _g;
                if (validateResponse(chunk)) {
                    const content = (_b = (_a = chunk === null || chunk === void 0 ? void 0 : chunk.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content;
                    if (content !== undefined) {
                        outputContent.push(content);
                    }
                    if (((_d = (_c = chunk === null || chunk === void 0 ? void 0 : chunk.candidates) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.finishReason) !== undefined) {
                        finishReason = chunk.candidates[0].finishReason;
                    }
                }
                if (outputContent.length && finishReason !== undefined) {
                    curatedHistory.push(inputContent);
                    curatedHistory.push(...outputContent);
                }
                yield yield __await(chunk);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_h && !_e && (_f = streamResponse_1.return)) yield __await(_f.call(streamResponse_1));
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
/**
 * A utility class to create a chat session.
 */
class Chats {
    constructor(modelsModule, apiClient) {
        this.modelsModule = modelsModule;
        this.apiClient = apiClient;
    }
    /**
     * Creates a new chat session.
     *
     * @param model The model to use for the chat.
     * @param config The configuration to use for the generate content request.
     * @param history The initial history to use for the chat.
     * @returns A new chat session.
     */
    create(model, config = {}, history = []) {
        return new Chat(this.apiClient, this.modelsModule, model, config, history);
    }
}
/**
 * Chat session that enables sending messages and stores the chat history so
 * far.
 */
class Chat {
    constructor(apiClient, modelsModule, model, config, curatedHistory) {
        this.apiClient = apiClient;
        this.modelsModule = modelsModule;
        this.model = model;
        this.config = config;
        this.curatedHistory = curatedHistory;
        // A promise to represent the current state of the message being sent to the
        // model.
        this.sendPromise = Promise.resolve();
    }
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
    async sendMessage(message) {
        await this.sendPromise;
        const inputContent = tContent(this.apiClient, message);
        const responsePromise = this.modelsModule.generateContent({
            model: this.model,
            contents: this.curatedHistory.concat(inputContent),
            config: this.config,
        });
        this.sendPromise = (async () => {
            var _a, _b;
            const response = await responsePromise;
            if (validateResponse(response)) {
                this.curatedHistory.push(inputContent);
                const outputContent = (_b = (_a = response === null || response === void 0 ? void 0 : response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content;
                if (outputContent !== undefined) {
                    this.curatedHistory.push(outputContent);
                }
            }
            return;
        })();
        await this.sendPromise;
        return responsePromise;
    }
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
    async sendMessageStream(message) {
        await this.sendPromise;
        const inputContent = tContent(this.apiClient, message);
        const streamResponse = this.modelsModule.generateContentStream({
            model: this.model,
            contents: this.curatedHistory.concat(inputContent),
            config: this.config,
        });
        this.sendPromise = streamResponse.then(() => undefined);
        const response = await streamResponse;
        const result = processStreamResponse(response, this.curatedHistory, inputContent);
        return result;
    }
}


class Models extends BaseModule {
    constructor(apiClient) {
        super();
        this.apiClient = apiClient;
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
        this.generateContent = async (params) => {
            return await this.generateContentInternal(params);
        };
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
        this.generateContentStream = async (params) => {
            return await this.generateContentStreamInternal(params);
        };
    }
    async generateContentInternal(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = generateContentParametersToVertex(this.apiClient, params);
            path = formatMap('{model}:generateContent', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = generateContentResponseFromVertex(this.apiClient, apiResponse);
                const typedResp = new GenerateContentResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
        else {
            const body = generateContentParametersToMldev(this.apiClient, params);
            path = formatMap('{model}:generateContent', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = generateContentResponseFromMldev(this.apiClient, apiResponse);
                const typedResp = new GenerateContentResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
    async generateContentStreamInternal(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = generateContentParametersToVertex(this.apiClient, params);
            path = formatMap('{model}:streamGenerateContent?alt=sse', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            const apiClient = this.apiClient;
            response = apiClient.requestStream({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            });
            return response.then(function (apiResponse) {
                return __asyncGenerator(this, arguments, function* () {
                    var _a, e_1, _b, _c;
                    try {
                        for (var _d = true, apiResponse_1 = __asyncValues(apiResponse), apiResponse_1_1; apiResponse_1_1 = yield __await(apiResponse_1.next()), _a = apiResponse_1_1.done, !_a; _d = true) {
                            _c = apiResponse_1_1.value;
                            _d = false;
                            const chunk = _c;
                            const resp = generateContentResponseFromVertex(apiClient, chunk);
                            const typedResp = new GenerateContentResponse();
                            Object.assign(typedResp, resp);
                            yield yield __await(typedResp);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (!_d && !_a && (_b = apiResponse_1.return)) yield __await(_b.call(apiResponse_1));
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                });
            });
        }
        else {
            const body = generateContentParametersToMldev(this.apiClient, params);
            path = formatMap('{model}:streamGenerateContent?alt=sse', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            const apiClient = this.apiClient;
            response = apiClient.requestStream({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            });
            return response.then(function (apiResponse) {
                return __asyncGenerator(this, arguments, function* () {
                    var _a, e_2, _b, _c;
                    try {
                        for (var _d = true, apiResponse_2 = __asyncValues(apiResponse), apiResponse_2_1; apiResponse_2_1 = yield __await(apiResponse_2.next()), _a = apiResponse_2_1.done, !_a; _d = true) {
                            _c = apiResponse_2_1.value;
                            _d = false;
                            const chunk = _c;
                            const resp = generateContentResponseFromMldev(apiClient, chunk);
                            const typedResp = new GenerateContentResponse();
                            Object.assign(typedResp, resp);
                            yield yield __await(typedResp);
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (!_d && !_a && (_b = apiResponse_2.return)) yield __await(_b.call(apiResponse_2));
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                });
            });
        }
    }
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
    async embedContent(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = embedContentParametersToVertex(this.apiClient, params);
            path = formatMap('{model}:predict', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = embedContentResponseFromVertex(this.apiClient, apiResponse);
                const typedResp = new EmbedContentResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
        else {
            const body = embedContentParametersToMldev(this.apiClient, params);
            path = formatMap('{model}:batchEmbedContents', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = embedContentResponseFromMldev(this.apiClient, apiResponse);
                const typedResp = new EmbedContentResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
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
    async generateImages(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = generateImagesParametersToVertex(this.apiClient, params);
            path = formatMap('{model}:predict', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = generateImagesResponseFromVertex(this.apiClient, apiResponse);
                const typedResp = new GenerateImagesResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
        else {
            const body = generateImagesParametersToMldev(this.apiClient, params);
            path = formatMap('{model}:predict', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = generateImagesResponseFromMldev(this.apiClient, apiResponse);
                const typedResp = new GenerateImagesResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
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
    async countTokens(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = countTokensParametersToVertex(this.apiClient, params);
            path = formatMap('{model}:countTokens', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = countTokensResponseFromVertex(this.apiClient, apiResponse);
                const typedResp = new CountTokensResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
        else {
            const body = countTokensParametersToMldev(this.apiClient, params);
            path = formatMap('{model}:countTokens', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = countTokensResponseFromMldev(this.apiClient, apiResponse);
                const typedResp = new CountTokensResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
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
    async computeTokens(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = computeTokensParametersToVertex(this.apiClient, params);
            path = formatMap('{model}:computeTokens', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = computeTokensResponseFromVertex(this.apiClient, apiResponse);
                const typedResp = new ComputeTokensResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
        else {
            const body = computeTokensParametersToMldev(this.apiClient, params);
            path = formatMap('None', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = computeTokensResponseFromMldev(this.apiClient, apiResponse);
                const typedResp = new ComputeTokensResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
}
function partToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ['videoMetadata']) !== undefined) {
        throw new Error('videoMetadata parameter is not supported in Gemini API.');
    }
    const fromThought = getValueByPath(fromObject, ['thought']);
    if (fromThought !== undefined && fromThought !== null) {
        setValueByPath(toObject, ['thought'], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
        'codeExecutionResult',
    ]);
    if (fromCodeExecutionResult !== undefined &&
        fromCodeExecutionResult !== null) {
        setValueByPath(toObject, ['codeExecutionResult'], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
        'executableCode',
    ]);
    if (fromExecutableCode !== undefined && fromExecutableCode !== null) {
        setValueByPath(toObject, ['executableCode'], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ['fileData']);
    if (fromFileData !== undefined && fromFileData !== null) {
        setValueByPath(toObject, ['fileData'], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ['functionCall']);
    if (fromFunctionCall !== undefined && fromFunctionCall !== null) {
        setValueByPath(toObject, ['functionCall'], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
        'functionResponse',
    ]);
    if (fromFunctionResponse !== undefined && fromFunctionResponse !== null) {
        setValueByPath(toObject, ['functionResponse'], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ['inlineData']);
    if (fromInlineData !== undefined && fromInlineData !== null) {
        setValueByPath(toObject, ['inlineData'], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ['text']);
    if (fromText !== undefined && fromText !== null) {
        setValueByPath(toObject, ['text'], fromText);
    }
    return toObject;
}
function partToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromVideoMetadata = getValueByPath(fromObject, [
        'videoMetadata',
    ]);
    if (fromVideoMetadata !== undefined && fromVideoMetadata !== null) {
        setValueByPath(toObject, ['videoMetadata'], fromVideoMetadata);
    }
    const fromThought = getValueByPath(fromObject, ['thought']);
    if (fromThought !== undefined && fromThought !== null) {
        setValueByPath(toObject, ['thought'], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
        'codeExecutionResult',
    ]);
    if (fromCodeExecutionResult !== undefined &&
        fromCodeExecutionResult !== null) {
        setValueByPath(toObject, ['codeExecutionResult'], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
        'executableCode',
    ]);
    if (fromExecutableCode !== undefined && fromExecutableCode !== null) {
        setValueByPath(toObject, ['executableCode'], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ['fileData']);
    if (fromFileData !== undefined && fromFileData !== null) {
        setValueByPath(toObject, ['fileData'], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ['functionCall']);
    if (fromFunctionCall !== undefined && fromFunctionCall !== null) {
        setValueByPath(toObject, ['functionCall'], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
        'functionResponse',
    ]);
    if (fromFunctionResponse !== undefined && fromFunctionResponse !== null) {
        setValueByPath(toObject, ['functionResponse'], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ['inlineData']);
    if (fromInlineData !== undefined && fromInlineData !== null) {
        setValueByPath(toObject, ['inlineData'], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ['text']);
    if (fromText !== undefined && fromText !== null) {
        setValueByPath(toObject, ['text'], fromText);
    }
    return toObject;
}
/** @internal */
function contentToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ['parts']);
    if (fromParts !== undefined && fromParts !== null) {
        if (Array.isArray(fromParts)) {
            setValueByPath(toObject, ['parts'], fromParts.map((item) => {
                return partToMldev(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['parts'], fromParts);
        }
    }
    const fromRole = getValueByPath(fromObject, ['role']);
    if (fromRole !== undefined && fromRole !== null) {
        setValueByPath(toObject, ['role'], fromRole);
    }
    return toObject;
}
/** @internal */
function contentToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ['parts']);
    if (fromParts !== undefined && fromParts !== null) {
        if (Array.isArray(fromParts)) {
            setValueByPath(toObject, ['parts'], fromParts.map((item) => {
                return partToVertex(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['parts'], fromParts);
        }
    }
    const fromRole = getValueByPath(fromObject, ['role']);
    if (fromRole !== undefined && fromRole !== null) {
        setValueByPath(toObject, ['role'], fromRole);
    }
    return toObject;
}
function schemaToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ['minItems']) !== undefined) {
        throw new Error('minItems parameter is not supported in Gemini API.');
    }
    if (getValueByPath(fromObject, ['example']) !== undefined) {
        throw new Error('example parameter is not supported in Gemini API.');
    }
    const fromPropertyOrdering = getValueByPath(fromObject, [
        'propertyOrdering',
    ]);
    if (fromPropertyOrdering !== undefined && fromPropertyOrdering !== null) {
        setValueByPath(toObject, ['propertyOrdering'], fromPropertyOrdering);
    }
    if (getValueByPath(fromObject, ['pattern']) !== undefined) {
        throw new Error('pattern parameter is not supported in Gemini API.');
    }
    if (getValueByPath(fromObject, ['minimum']) !== undefined) {
        throw new Error('minimum parameter is not supported in Gemini API.');
    }
    if (getValueByPath(fromObject, ['default']) !== undefined) {
        throw new Error('default parameter is not supported in Gemini API.');
    }
    if (getValueByPath(fromObject, ['anyOf']) !== undefined) {
        throw new Error('anyOf parameter is not supported in Gemini API.');
    }
    if (getValueByPath(fromObject, ['maxLength']) !== undefined) {
        throw new Error('maxLength parameter is not supported in Gemini API.');
    }
    if (getValueByPath(fromObject, ['title']) !== undefined) {
        throw new Error('title parameter is not supported in Gemini API.');
    }
    if (getValueByPath(fromObject, ['minLength']) !== undefined) {
        throw new Error('minLength parameter is not supported in Gemini API.');
    }
    if (getValueByPath(fromObject, ['minProperties']) !== undefined) {
        throw new Error('minProperties parameter is not supported in Gemini API.');
    }
    if (getValueByPath(fromObject, ['maxItems']) !== undefined) {
        throw new Error('maxItems parameter is not supported in Gemini API.');
    }
    if (getValueByPath(fromObject, ['maximum']) !== undefined) {
        throw new Error('maximum parameter is not supported in Gemini API.');
    }
    if (getValueByPath(fromObject, ['nullable']) !== undefined) {
        throw new Error('nullable parameter is not supported in Gemini API.');
    }
    if (getValueByPath(fromObject, ['maxProperties']) !== undefined) {
        throw new Error('maxProperties parameter is not supported in Gemini API.');
    }
    const fromType = getValueByPath(fromObject, ['type']);
    if (fromType !== undefined && fromType !== null) {
        setValueByPath(toObject, ['type'], fromType);
    }
    const fromDescription = getValueByPath(fromObject, ['description']);
    if (fromDescription !== undefined && fromDescription !== null) {
        setValueByPath(toObject, ['description'], fromDescription);
    }
    const fromEnum = getValueByPath(fromObject, ['enum']);
    if (fromEnum !== undefined && fromEnum !== null) {
        setValueByPath(toObject, ['enum'], fromEnum);
    }
    const fromFormat = getValueByPath(fromObject, ['format']);
    if (fromFormat !== undefined && fromFormat !== null) {
        setValueByPath(toObject, ['format'], fromFormat);
    }
    const fromItems = getValueByPath(fromObject, ['items']);
    if (fromItems !== undefined && fromItems !== null) {
        setValueByPath(toObject, ['items'], fromItems);
    }
    const fromProperties = getValueByPath(fromObject, ['properties']);
    if (fromProperties !== undefined && fromProperties !== null) {
        setValueByPath(toObject, ['properties'], fromProperties);
    }
    const fromRequired = getValueByPath(fromObject, ['required']);
    if (fromRequired !== undefined && fromRequired !== null) {
        setValueByPath(toObject, ['required'], fromRequired);
    }
    return toObject;
}
function schemaToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromMinItems = getValueByPath(fromObject, ['minItems']);
    if (fromMinItems !== undefined && fromMinItems !== null) {
        setValueByPath(toObject, ['minItems'], fromMinItems);
    }
    const fromExample = getValueByPath(fromObject, ['example']);
    if (fromExample !== undefined && fromExample !== null) {
        setValueByPath(toObject, ['example'], fromExample);
    }
    const fromPropertyOrdering = getValueByPath(fromObject, [
        'propertyOrdering',
    ]);
    if (fromPropertyOrdering !== undefined && fromPropertyOrdering !== null) {
        setValueByPath(toObject, ['propertyOrdering'], fromPropertyOrdering);
    }
    const fromPattern = getValueByPath(fromObject, ['pattern']);
    if (fromPattern !== undefined && fromPattern !== null) {
        setValueByPath(toObject, ['pattern'], fromPattern);
    }
    const fromMinimum = getValueByPath(fromObject, ['minimum']);
    if (fromMinimum !== undefined && fromMinimum !== null) {
        setValueByPath(toObject, ['minimum'], fromMinimum);
    }
    const fromDefault = getValueByPath(fromObject, ['default']);
    if (fromDefault !== undefined && fromDefault !== null) {
        setValueByPath(toObject, ['default'], fromDefault);
    }
    const fromAnyOf = getValueByPath(fromObject, ['anyOf']);
    if (fromAnyOf !== undefined && fromAnyOf !== null) {
        setValueByPath(toObject, ['anyOf'], fromAnyOf);
    }
    const fromMaxLength = getValueByPath(fromObject, ['maxLength']);
    if (fromMaxLength !== undefined && fromMaxLength !== null) {
        setValueByPath(toObject, ['maxLength'], fromMaxLength);
    }
    const fromTitle = getValueByPath(fromObject, ['title']);
    if (fromTitle !== undefined && fromTitle !== null) {
        setValueByPath(toObject, ['title'], fromTitle);
    }
    const fromMinLength = getValueByPath(fromObject, ['minLength']);
    if (fromMinLength !== undefined && fromMinLength !== null) {
        setValueByPath(toObject, ['minLength'], fromMinLength);
    }
    const fromMinProperties = getValueByPath(fromObject, [
        'minProperties',
    ]);
    if (fromMinProperties !== undefined && fromMinProperties !== null) {
        setValueByPath(toObject, ['minProperties'], fromMinProperties);
    }
    const fromMaxItems = getValueByPath(fromObject, ['maxItems']);
    if (fromMaxItems !== undefined && fromMaxItems !== null) {
        setValueByPath(toObject, ['maxItems'], fromMaxItems);
    }
    const fromMaximum = getValueByPath(fromObject, ['maximum']);
    if (fromMaximum !== undefined && fromMaximum !== null) {
        setValueByPath(toObject, ['maximum'], fromMaximum);
    }
    const fromNullable = getValueByPath(fromObject, ['nullable']);
    if (fromNullable !== undefined && fromNullable !== null) {
        setValueByPath(toObject, ['nullable'], fromNullable);
    }
    const fromMaxProperties = getValueByPath(fromObject, [
        'maxProperties',
    ]);
    if (fromMaxProperties !== undefined && fromMaxProperties !== null) {
        setValueByPath(toObject, ['maxProperties'], fromMaxProperties);
    }
    const fromType = getValueByPath(fromObject, ['type']);
    if (fromType !== undefined && fromType !== null) {
        setValueByPath(toObject, ['type'], fromType);
    }
    const fromDescription = getValueByPath(fromObject, ['description']);
    if (fromDescription !== undefined && fromDescription !== null) {
        setValueByPath(toObject, ['description'], fromDescription);
    }
    const fromEnum = getValueByPath(fromObject, ['enum']);
    if (fromEnum !== undefined && fromEnum !== null) {
        setValueByPath(toObject, ['enum'], fromEnum);
    }
    const fromFormat = getValueByPath(fromObject, ['format']);
    if (fromFormat !== undefined && fromFormat !== null) {
        setValueByPath(toObject, ['format'], fromFormat);
    }
    const fromItems = getValueByPath(fromObject, ['items']);
    if (fromItems !== undefined && fromItems !== null) {
        setValueByPath(toObject, ['items'], fromItems);
    }
    const fromProperties = getValueByPath(fromObject, ['properties']);
    if (fromProperties !== undefined && fromProperties !== null) {
        setValueByPath(toObject, ['properties'], fromProperties);
    }
    const fromRequired = getValueByPath(fromObject, ['required']);
    if (fromRequired !== undefined && fromRequired !== null) {
        setValueByPath(toObject, ['required'], fromRequired);
    }
    return toObject;
}
function safetySettingToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ['method']) !== undefined) {
        throw new Error('method parameter is not supported in Gemini API.');
    }
    const fromCategory = getValueByPath(fromObject, ['category']);
    if (fromCategory !== undefined && fromCategory !== null) {
        setValueByPath(toObject, ['category'], fromCategory);
    }
    const fromThreshold = getValueByPath(fromObject, ['threshold']);
    if (fromThreshold !== undefined && fromThreshold !== null) {
        setValueByPath(toObject, ['threshold'], fromThreshold);
    }
    return toObject;
}
function safetySettingToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromMethod = getValueByPath(fromObject, ['method']);
    if (fromMethod !== undefined && fromMethod !== null) {
        setValueByPath(toObject, ['method'], fromMethod);
    }
    const fromCategory = getValueByPath(fromObject, ['category']);
    if (fromCategory !== undefined && fromCategory !== null) {
        setValueByPath(toObject, ['category'], fromCategory);
    }
    const fromThreshold = getValueByPath(fromObject, ['threshold']);
    if (fromThreshold !== undefined && fromThreshold !== null) {
        setValueByPath(toObject, ['threshold'], fromThreshold);
    }
    return toObject;
}
function functionDeclarationToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ['response']) !== undefined) {
        throw new Error('response parameter is not supported in Gemini API.');
    }
    const fromDescription = getValueByPath(fromObject, ['description']);
    if (fromDescription !== undefined && fromDescription !== null) {
        setValueByPath(toObject, ['description'], fromDescription);
    }
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['name'], fromName);
    }
    const fromParameters = getValueByPath(fromObject, ['parameters']);
    if (fromParameters !== undefined && fromParameters !== null) {
        setValueByPath(toObject, ['parameters'], fromParameters);
    }
    return toObject;
}
function functionDeclarationToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromResponse = getValueByPath(fromObject, ['response']);
    if (fromResponse !== undefined && fromResponse !== null) {
        setValueByPath(toObject, ['response'], schemaToVertex(apiClient, fromResponse));
    }
    const fromDescription = getValueByPath(fromObject, ['description']);
    if (fromDescription !== undefined && fromDescription !== null) {
        setValueByPath(toObject, ['description'], fromDescription);
    }
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['name'], fromName);
    }
    const fromParameters = getValueByPath(fromObject, ['parameters']);
    if (fromParameters !== undefined && fromParameters !== null) {
        setValueByPath(toObject, ['parameters'], fromParameters);
    }
    return toObject;
}
function googleSearchToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    return toObject;
}
function googleSearchToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    return toObject;
}
function dynamicRetrievalConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ['mode']);
    if (fromMode !== undefined && fromMode !== null) {
        setValueByPath(toObject, ['mode'], fromMode);
    }
    const fromDynamicThreshold = getValueByPath(fromObject, [
        'dynamicThreshold',
    ]);
    if (fromDynamicThreshold !== undefined && fromDynamicThreshold !== null) {
        setValueByPath(toObject, ['dynamicThreshold'], fromDynamicThreshold);
    }
    return toObject;
}
function dynamicRetrievalConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ['mode']);
    if (fromMode !== undefined && fromMode !== null) {
        setValueByPath(toObject, ['mode'], fromMode);
    }
    const fromDynamicThreshold = getValueByPath(fromObject, [
        'dynamicThreshold',
    ]);
    if (fromDynamicThreshold !== undefined && fromDynamicThreshold !== null) {
        setValueByPath(toObject, ['dynamicThreshold'], fromDynamicThreshold);
    }
    return toObject;
}
function googleSearchRetrievalToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromDynamicRetrievalConfig = getValueByPath(fromObject, [
        'dynamicRetrievalConfig',
    ]);
    if (fromDynamicRetrievalConfig !== undefined &&
        fromDynamicRetrievalConfig !== null) {
        setValueByPath(toObject, ['dynamicRetrievalConfig'], dynamicRetrievalConfigToMldev(apiClient, fromDynamicRetrievalConfig));
    }
    return toObject;
}
function googleSearchRetrievalToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromDynamicRetrievalConfig = getValueByPath(fromObject, [
        'dynamicRetrievalConfig',
    ]);
    if (fromDynamicRetrievalConfig !== undefined &&
        fromDynamicRetrievalConfig !== null) {
        setValueByPath(toObject, ['dynamicRetrievalConfig'], dynamicRetrievalConfigToVertex(apiClient, fromDynamicRetrievalConfig));
    }
    return toObject;
}
/** @internal */
function toolToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromFunctionDeclarations = getValueByPath(fromObject, [
        'functionDeclarations',
    ]);
    if (fromFunctionDeclarations !== undefined &&
        fromFunctionDeclarations !== null) {
        if (Array.isArray(fromFunctionDeclarations)) {
            setValueByPath(toObject, ['functionDeclarations'], fromFunctionDeclarations.map((item) => {
                return functionDeclarationToMldev(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['functionDeclarations'], fromFunctionDeclarations);
        }
    }
    if (getValueByPath(fromObject, ['retrieval']) !== undefined) {
        throw new Error('retrieval parameter is not supported in Gemini API.');
    }
    const fromGoogleSearch = getValueByPath(fromObject, ['googleSearch']);
    if (fromGoogleSearch !== undefined && fromGoogleSearch !== null) {
        setValueByPath(toObject, ['googleSearch'], googleSearchToMldev());
    }
    const fromGoogleSearchRetrieval = getValueByPath(fromObject, [
        'googleSearchRetrieval',
    ]);
    if (fromGoogleSearchRetrieval !== undefined &&
        fromGoogleSearchRetrieval !== null) {
        setValueByPath(toObject, ['googleSearchRetrieval'], googleSearchRetrievalToMldev(apiClient, fromGoogleSearchRetrieval));
    }
    const fromCodeExecution = getValueByPath(fromObject, [
        'codeExecution',
    ]);
    if (fromCodeExecution !== undefined && fromCodeExecution !== null) {
        setValueByPath(toObject, ['codeExecution'], fromCodeExecution);
    }
    return toObject;
}
/** @internal */
function toolToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromFunctionDeclarations = getValueByPath(fromObject, [
        'functionDeclarations',
    ]);
    if (fromFunctionDeclarations !== undefined &&
        fromFunctionDeclarations !== null) {
        if (Array.isArray(fromFunctionDeclarations)) {
            setValueByPath(toObject, ['functionDeclarations'], fromFunctionDeclarations.map((item) => {
                return functionDeclarationToVertex(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['functionDeclarations'], fromFunctionDeclarations);
        }
    }
    const fromRetrieval = getValueByPath(fromObject, ['retrieval']);
    if (fromRetrieval !== undefined && fromRetrieval !== null) {
        setValueByPath(toObject, ['retrieval'], fromRetrieval);
    }
    const fromGoogleSearch = getValueByPath(fromObject, ['googleSearch']);
    if (fromGoogleSearch !== undefined && fromGoogleSearch !== null) {
        setValueByPath(toObject, ['googleSearch'], googleSearchToVertex());
    }
    const fromGoogleSearchRetrieval = getValueByPath(fromObject, [
        'googleSearchRetrieval',
    ]);
    if (fromGoogleSearchRetrieval !== undefined &&
        fromGoogleSearchRetrieval !== null) {
        setValueByPath(toObject, ['googleSearchRetrieval'], googleSearchRetrievalToVertex(apiClient, fromGoogleSearchRetrieval));
    }
    const fromCodeExecution = getValueByPath(fromObject, [
        'codeExecution',
    ]);
    if (fromCodeExecution !== undefined && fromCodeExecution !== null) {
        setValueByPath(toObject, ['codeExecution'], fromCodeExecution);
    }
    return toObject;
}
function functionCallingConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ['mode']);
    if (fromMode !== undefined && fromMode !== null) {
        setValueByPath(toObject, ['mode'], fromMode);
    }
    const fromAllowedFunctionNames = getValueByPath(fromObject, [
        'allowedFunctionNames',
    ]);
    if (fromAllowedFunctionNames !== undefined &&
        fromAllowedFunctionNames !== null) {
        setValueByPath(toObject, ['allowedFunctionNames'], fromAllowedFunctionNames);
    }
    return toObject;
}
function functionCallingConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ['mode']);
    if (fromMode !== undefined && fromMode !== null) {
        setValueByPath(toObject, ['mode'], fromMode);
    }
    const fromAllowedFunctionNames = getValueByPath(fromObject, [
        'allowedFunctionNames',
    ]);
    if (fromAllowedFunctionNames !== undefined &&
        fromAllowedFunctionNames !== null) {
        setValueByPath(toObject, ['allowedFunctionNames'], fromAllowedFunctionNames);
    }
    return toObject;
}
function toolConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromFunctionCallingConfig = getValueByPath(fromObject, [
        'functionCallingConfig',
    ]);
    if (fromFunctionCallingConfig !== undefined &&
        fromFunctionCallingConfig !== null) {
        setValueByPath(toObject, ['functionCallingConfig'], functionCallingConfigToMldev(apiClient, fromFunctionCallingConfig));
    }
    return toObject;
}
function toolConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromFunctionCallingConfig = getValueByPath(fromObject, [
        'functionCallingConfig',
    ]);
    if (fromFunctionCallingConfig !== undefined &&
        fromFunctionCallingConfig !== null) {
        setValueByPath(toObject, ['functionCallingConfig'], functionCallingConfigToVertex(apiClient, fromFunctionCallingConfig));
    }
    return toObject;
}
function prebuiltVoiceConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromVoiceName = getValueByPath(fromObject, ['voiceName']);
    if (fromVoiceName !== undefined && fromVoiceName !== null) {
        setValueByPath(toObject, ['voiceName'], fromVoiceName);
    }
    return toObject;
}
function prebuiltVoiceConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromVoiceName = getValueByPath(fromObject, ['voiceName']);
    if (fromVoiceName !== undefined && fromVoiceName !== null) {
        setValueByPath(toObject, ['voiceName'], fromVoiceName);
    }
    return toObject;
}
function voiceConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromPrebuiltVoiceConfig = getValueByPath(fromObject, [
        'prebuiltVoiceConfig',
    ]);
    if (fromPrebuiltVoiceConfig !== undefined &&
        fromPrebuiltVoiceConfig !== null) {
        setValueByPath(toObject, ['prebuiltVoiceConfig'], prebuiltVoiceConfigToMldev(apiClient, fromPrebuiltVoiceConfig));
    }
    return toObject;
}
function voiceConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromPrebuiltVoiceConfig = getValueByPath(fromObject, [
        'prebuiltVoiceConfig',
    ]);
    if (fromPrebuiltVoiceConfig !== undefined &&
        fromPrebuiltVoiceConfig !== null) {
        setValueByPath(toObject, ['prebuiltVoiceConfig'], prebuiltVoiceConfigToVertex(apiClient, fromPrebuiltVoiceConfig));
    }
    return toObject;
}
function speechConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromVoiceConfig = getValueByPath(fromObject, ['voiceConfig']);
    if (fromVoiceConfig !== undefined && fromVoiceConfig !== null) {
        setValueByPath(toObject, ['voiceConfig'], voiceConfigToMldev(apiClient, fromVoiceConfig));
    }
    return toObject;
}
function speechConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromVoiceConfig = getValueByPath(fromObject, ['voiceConfig']);
    if (fromVoiceConfig !== undefined && fromVoiceConfig !== null) {
        setValueByPath(toObject, ['voiceConfig'], voiceConfigToVertex(apiClient, fromVoiceConfig));
    }
    return toObject;
}
function thinkingConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromIncludeThoughts = getValueByPath(fromObject, [
        'includeThoughts',
    ]);
    if (fromIncludeThoughts !== undefined && fromIncludeThoughts !== null) {
        setValueByPath(toObject, ['includeThoughts'], fromIncludeThoughts);
    }
    return toObject;
}
function thinkingConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromIncludeThoughts = getValueByPath(fromObject, [
        'includeThoughts',
    ]);
    if (fromIncludeThoughts !== undefined && fromIncludeThoughts !== null) {
        setValueByPath(toObject, ['includeThoughts'], fromIncludeThoughts);
    }
    return toObject;
}
function generateContentConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromSystemInstruction = getValueByPath(fromObject, [
        'systemInstruction',
    ]);
    if (parentObject !== undefined &&
        fromSystemInstruction !== undefined &&
        fromSystemInstruction !== null) {
        setValueByPath(parentObject, ['systemInstruction'], contentToMldev(apiClient, tContent(apiClient, fromSystemInstruction)));
    }
    const fromTemperature = getValueByPath(fromObject, ['temperature']);
    if (fromTemperature !== undefined && fromTemperature !== null) {
        setValueByPath(toObject, ['temperature'], fromTemperature);
    }
    const fromTopP = getValueByPath(fromObject, ['topP']);
    if (fromTopP !== undefined && fromTopP !== null) {
        setValueByPath(toObject, ['topP'], fromTopP);
    }
    const fromTopK = getValueByPath(fromObject, ['topK']);
    if (fromTopK !== undefined && fromTopK !== null) {
        setValueByPath(toObject, ['topK'], fromTopK);
    }
    const fromCandidateCount = getValueByPath(fromObject, [
        'candidateCount',
    ]);
    if (fromCandidateCount !== undefined && fromCandidateCount !== null) {
        setValueByPath(toObject, ['candidateCount'], fromCandidateCount);
    }
    const fromMaxOutputTokens = getValueByPath(fromObject, [
        'maxOutputTokens',
    ]);
    if (fromMaxOutputTokens !== undefined && fromMaxOutputTokens !== null) {
        setValueByPath(toObject, ['maxOutputTokens'], fromMaxOutputTokens);
    }
    const fromStopSequences = getValueByPath(fromObject, [
        'stopSequences',
    ]);
    if (fromStopSequences !== undefined && fromStopSequences !== null) {
        setValueByPath(toObject, ['stopSequences'], fromStopSequences);
    }
    const fromResponseLogprobs = getValueByPath(fromObject, [
        'responseLogprobs',
    ]);
    if (fromResponseLogprobs !== undefined && fromResponseLogprobs !== null) {
        setValueByPath(toObject, ['responseLogprobs'], fromResponseLogprobs);
    }
    const fromLogprobs = getValueByPath(fromObject, ['logprobs']);
    if (fromLogprobs !== undefined && fromLogprobs !== null) {
        setValueByPath(toObject, ['logprobs'], fromLogprobs);
    }
    const fromPresencePenalty = getValueByPath(fromObject, [
        'presencePenalty',
    ]);
    if (fromPresencePenalty !== undefined && fromPresencePenalty !== null) {
        setValueByPath(toObject, ['presencePenalty'], fromPresencePenalty);
    }
    const fromFrequencyPenalty = getValueByPath(fromObject, [
        'frequencyPenalty',
    ]);
    if (fromFrequencyPenalty !== undefined && fromFrequencyPenalty !== null) {
        setValueByPath(toObject, ['frequencyPenalty'], fromFrequencyPenalty);
    }
    const fromSeed = getValueByPath(fromObject, ['seed']);
    if (fromSeed !== undefined && fromSeed !== null) {
        setValueByPath(toObject, ['seed'], fromSeed);
    }
    const fromResponseMimeType = getValueByPath(fromObject, [
        'responseMimeType',
    ]);
    if (fromResponseMimeType !== undefined && fromResponseMimeType !== null) {
        setValueByPath(toObject, ['responseMimeType'], fromResponseMimeType);
    }
    const fromResponseSchema = getValueByPath(fromObject, [
        'responseSchema',
    ]);
    if (fromResponseSchema !== undefined && fromResponseSchema !== null) {
        setValueByPath(toObject, ['responseSchema'], schemaToMldev(apiClient, tSchema(apiClient, fromResponseSchema)));
    }
    if (getValueByPath(fromObject, ['routingConfig']) !== undefined) {
        throw new Error('routingConfig parameter is not supported in Gemini API.');
    }
    const fromSafetySettings = getValueByPath(fromObject, [
        'safetySettings',
    ]);
    if (parentObject !== undefined &&
        fromSafetySettings !== undefined &&
        fromSafetySettings !== null) {
        if (Array.isArray(fromSafetySettings)) {
            setValueByPath(parentObject, ['safetySettings'], fromSafetySettings.map((item) => {
                return safetySettingToMldev(apiClient, item);
            }));
        }
        else {
            setValueByPath(parentObject, ['safetySettings'], fromSafetySettings);
        }
    }
    const fromTools = getValueByPath(fromObject, ['tools']);
    if (parentObject !== undefined &&
        fromTools !== undefined &&
        fromTools !== null) {
        if (Array.isArray(fromTools)) {
            setValueByPath(parentObject, ['tools'], tTools(apiClient, tTools(apiClient, fromTools).map((item) => {
                return toolToMldev(apiClient, tTool(apiClient, item));
            })));
        }
        else {
            setValueByPath(parentObject, ['tools'], tTools(apiClient, fromTools));
        }
    }
    const fromToolConfig = getValueByPath(fromObject, ['toolConfig']);
    if (parentObject !== undefined &&
        fromToolConfig !== undefined &&
        fromToolConfig !== null) {
        setValueByPath(parentObject, ['toolConfig'], toolConfigToMldev(apiClient, fromToolConfig));
    }
    if (getValueByPath(fromObject, ['labels']) !== undefined) {
        throw new Error('labels parameter is not supported in Gemini API.');
    }
    const fromCachedContent = getValueByPath(fromObject, [
        'cachedContent',
    ]);
    if (parentObject !== undefined &&
        fromCachedContent !== undefined &&
        fromCachedContent !== null) {
        setValueByPath(parentObject, ['cachedContent'], tCachedContentName(apiClient, fromCachedContent));
    }
    const fromResponseModalities = getValueByPath(fromObject, [
        'responseModalities',
    ]);
    if (fromResponseModalities !== undefined && fromResponseModalities !== null) {
        setValueByPath(toObject, ['responseModalities'], fromResponseModalities);
    }
    const fromMediaResolution = getValueByPath(fromObject, [
        'mediaResolution',
    ]);
    if (fromMediaResolution !== undefined && fromMediaResolution !== null) {
        setValueByPath(toObject, ['mediaResolution'], fromMediaResolution);
    }
    const fromSpeechConfig = getValueByPath(fromObject, ['speechConfig']);
    if (fromSpeechConfig !== undefined && fromSpeechConfig !== null) {
        setValueByPath(toObject, ['speechConfig'], speechConfigToMldev(apiClient, tSpeechConfig(apiClient, fromSpeechConfig)));
    }
    if (getValueByPath(fromObject, ['audioTimestamp']) !== undefined) {
        throw new Error('audioTimestamp parameter is not supported in Gemini API.');
    }
    const fromThinkingConfig = getValueByPath(fromObject, [
        'thinkingConfig',
    ]);
    if (fromThinkingConfig !== undefined && fromThinkingConfig !== null) {
        setValueByPath(toObject, ['thinkingConfig'], thinkingConfigToMldev(apiClient, fromThinkingConfig));
    }
    return toObject;
}
function generateContentConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromSystemInstruction = getValueByPath(fromObject, [
        'systemInstruction',
    ]);
    if (parentObject !== undefined &&
        fromSystemInstruction !== undefined &&
        fromSystemInstruction !== null) {
        setValueByPath(parentObject, ['systemInstruction'], contentToVertex(apiClient, tContent(apiClient, fromSystemInstruction)));
    }
    const fromTemperature = getValueByPath(fromObject, ['temperature']);
    if (fromTemperature !== undefined && fromTemperature !== null) {
        setValueByPath(toObject, ['temperature'], fromTemperature);
    }
    const fromTopP = getValueByPath(fromObject, ['topP']);
    if (fromTopP !== undefined && fromTopP !== null) {
        setValueByPath(toObject, ['topP'], fromTopP);
    }
    const fromTopK = getValueByPath(fromObject, ['topK']);
    if (fromTopK !== undefined && fromTopK !== null) {
        setValueByPath(toObject, ['topK'], fromTopK);
    }
    const fromCandidateCount = getValueByPath(fromObject, [
        'candidateCount',
    ]);
    if (fromCandidateCount !== undefined && fromCandidateCount !== null) {
        setValueByPath(toObject, ['candidateCount'], fromCandidateCount);
    }
    const fromMaxOutputTokens = getValueByPath(fromObject, [
        'maxOutputTokens',
    ]);
    if (fromMaxOutputTokens !== undefined && fromMaxOutputTokens !== null) {
        setValueByPath(toObject, ['maxOutputTokens'], fromMaxOutputTokens);
    }
    const fromStopSequences = getValueByPath(fromObject, [
        'stopSequences',
    ]);
    if (fromStopSequences !== undefined && fromStopSequences !== null) {
        setValueByPath(toObject, ['stopSequences'], fromStopSequences);
    }
    const fromResponseLogprobs = getValueByPath(fromObject, [
        'responseLogprobs',
    ]);
    if (fromResponseLogprobs !== undefined && fromResponseLogprobs !== null) {
        setValueByPath(toObject, ['responseLogprobs'], fromResponseLogprobs);
    }
    const fromLogprobs = getValueByPath(fromObject, ['logprobs']);
    if (fromLogprobs !== undefined && fromLogprobs !== null) {
        setValueByPath(toObject, ['logprobs'], fromLogprobs);
    }
    const fromPresencePenalty = getValueByPath(fromObject, [
        'presencePenalty',
    ]);
    if (fromPresencePenalty !== undefined && fromPresencePenalty !== null) {
        setValueByPath(toObject, ['presencePenalty'], fromPresencePenalty);
    }
    const fromFrequencyPenalty = getValueByPath(fromObject, [
        'frequencyPenalty',
    ]);
    if (fromFrequencyPenalty !== undefined && fromFrequencyPenalty !== null) {
        setValueByPath(toObject, ['frequencyPenalty'], fromFrequencyPenalty);
    }
    const fromSeed = getValueByPath(fromObject, ['seed']);
    if (fromSeed !== undefined && fromSeed !== null) {
        setValueByPath(toObject, ['seed'], fromSeed);
    }
    const fromResponseMimeType = getValueByPath(fromObject, [
        'responseMimeType',
    ]);
    if (fromResponseMimeType !== undefined && fromResponseMimeType !== null) {
        setValueByPath(toObject, ['responseMimeType'], fromResponseMimeType);
    }
    const fromResponseSchema = getValueByPath(fromObject, [
        'responseSchema',
    ]);
    if (fromResponseSchema !== undefined && fromResponseSchema !== null) {
        setValueByPath(toObject, ['responseSchema'], schemaToVertex(apiClient, tSchema(apiClient, fromResponseSchema)));
    }
    const fromRoutingConfig = getValueByPath(fromObject, [
        'routingConfig',
    ]);
    if (fromRoutingConfig !== undefined && fromRoutingConfig !== null) {
        setValueByPath(toObject, ['routingConfig'], fromRoutingConfig);
    }
    const fromSafetySettings = getValueByPath(fromObject, [
        'safetySettings',
    ]);
    if (parentObject !== undefined &&
        fromSafetySettings !== undefined &&
        fromSafetySettings !== null) {
        if (Array.isArray(fromSafetySettings)) {
            setValueByPath(parentObject, ['safetySettings'], fromSafetySettings.map((item) => {
                return safetySettingToVertex(apiClient, item);
            }));
        }
        else {
            setValueByPath(parentObject, ['safetySettings'], fromSafetySettings);
        }
    }
    const fromTools = getValueByPath(fromObject, ['tools']);
    if (parentObject !== undefined &&
        fromTools !== undefined &&
        fromTools !== null) {
        if (Array.isArray(fromTools)) {
            setValueByPath(parentObject, ['tools'], tTools(apiClient, tTools(apiClient, fromTools).map((item) => {
                return toolToVertex(apiClient, tTool(apiClient, item));
            })));
        }
        else {
            setValueByPath(parentObject, ['tools'], tTools(apiClient, fromTools));
        }
    }
    const fromToolConfig = getValueByPath(fromObject, ['toolConfig']);
    if (parentObject !== undefined &&
        fromToolConfig !== undefined &&
        fromToolConfig !== null) {
        setValueByPath(parentObject, ['toolConfig'], toolConfigToVertex(apiClient, fromToolConfig));
    }
    const fromLabels = getValueByPath(fromObject, ['labels']);
    if (parentObject !== undefined &&
        fromLabels !== undefined &&
        fromLabels !== null) {
        setValueByPath(parentObject, ['labels'], fromLabels);
    }
    const fromCachedContent = getValueByPath(fromObject, [
        'cachedContent',
    ]);
    if (parentObject !== undefined &&
        fromCachedContent !== undefined &&
        fromCachedContent !== null) {
        setValueByPath(parentObject, ['cachedContent'], tCachedContentName(apiClient, fromCachedContent));
    }
    const fromResponseModalities = getValueByPath(fromObject, [
        'responseModalities',
    ]);
    if (fromResponseModalities !== undefined && fromResponseModalities !== null) {
        setValueByPath(toObject, ['responseModalities'], fromResponseModalities);
    }
    const fromMediaResolution = getValueByPath(fromObject, [
        'mediaResolution',
    ]);
    if (fromMediaResolution !== undefined && fromMediaResolution !== null) {
        setValueByPath(toObject, ['mediaResolution'], fromMediaResolution);
    }
    const fromSpeechConfig = getValueByPath(fromObject, ['speechConfig']);
    if (fromSpeechConfig !== undefined && fromSpeechConfig !== null) {
        setValueByPath(toObject, ['speechConfig'], speechConfigToVertex(apiClient, tSpeechConfig(apiClient, fromSpeechConfig)));
    }
    const fromAudioTimestamp = getValueByPath(fromObject, [
        'audioTimestamp',
    ]);
    if (fromAudioTimestamp !== undefined && fromAudioTimestamp !== null) {
        setValueByPath(toObject, ['audioTimestamp'], fromAudioTimestamp);
    }
    const fromThinkingConfig = getValueByPath(fromObject, [
        'thinkingConfig',
    ]);
    if (fromThinkingConfig !== undefined && fromThinkingConfig !== null) {
        setValueByPath(toObject, ['thinkingConfig'], thinkingConfigToVertex(apiClient, fromThinkingConfig));
    }
    return toObject;
}
function generateContentParametersToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ['model']);
    if (fromModel !== undefined && fromModel !== null) {
        setValueByPath(toObject, ['_url', 'model'], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ['contents']);
    if (fromContents !== undefined && fromContents !== null) {
        if (Array.isArray(fromContents)) {
            setValueByPath(toObject, ['contents'], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
                return contentToMldev(apiClient, item);
            })));
        }
        else {
            setValueByPath(toObject, ['contents'], tContents(apiClient, fromContents));
        }
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['generationConfig'], generateContentConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function generateContentParametersToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ['model']);
    if (fromModel !== undefined && fromModel !== null) {
        setValueByPath(toObject, ['_url', 'model'], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ['contents']);
    if (fromContents !== undefined && fromContents !== null) {
        if (Array.isArray(fromContents)) {
            setValueByPath(toObject, ['contents'], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
                return contentToVertex(apiClient, item);
            })));
        }
        else {
            setValueByPath(toObject, ['contents'], tContents(apiClient, fromContents));
        }
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['generationConfig'], generateContentConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function embedContentConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTaskType = getValueByPath(fromObject, ['taskType']);
    if (parentObject !== undefined &&
        fromTaskType !== undefined &&
        fromTaskType !== null) {
        setValueByPath(parentObject, ['requests[]', 'taskType'], fromTaskType);
    }
    const fromTitle = getValueByPath(fromObject, ['title']);
    if (parentObject !== undefined &&
        fromTitle !== undefined &&
        fromTitle !== null) {
        setValueByPath(parentObject, ['requests[]', 'title'], fromTitle);
    }
    const fromOutputDimensionality = getValueByPath(fromObject, [
        'outputDimensionality',
    ]);
    if (parentObject !== undefined &&
        fromOutputDimensionality !== undefined &&
        fromOutputDimensionality !== null) {
        setValueByPath(parentObject, ['requests[]', 'outputDimensionality'], fromOutputDimensionality);
    }
    if (getValueByPath(fromObject, ['mimeType']) !== undefined) {
        throw new Error('mimeType parameter is not supported in Gemini API.');
    }
    if (getValueByPath(fromObject, ['autoTruncate']) !== undefined) {
        throw new Error('autoTruncate parameter is not supported in Gemini API.');
    }
    return toObject;
}
function embedContentConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTaskType = getValueByPath(fromObject, ['taskType']);
    if (parentObject !== undefined &&
        fromTaskType !== undefined &&
        fromTaskType !== null) {
        setValueByPath(parentObject, ['instances[]', 'task_type'], fromTaskType);
    }
    const fromTitle = getValueByPath(fromObject, ['title']);
    if (parentObject !== undefined &&
        fromTitle !== undefined &&
        fromTitle !== null) {
        setValueByPath(parentObject, ['instances[]', 'title'], fromTitle);
    }
    const fromOutputDimensionality = getValueByPath(fromObject, [
        'outputDimensionality',
    ]);
    if (parentObject !== undefined &&
        fromOutputDimensionality !== undefined &&
        fromOutputDimensionality !== null) {
        setValueByPath(parentObject, ['parameters', 'outputDimensionality'], fromOutputDimensionality);
    }
    const fromMimeType = getValueByPath(fromObject, ['mimeType']);
    if (parentObject !== undefined &&
        fromMimeType !== undefined &&
        fromMimeType !== null) {
        setValueByPath(parentObject, ['instances[]', 'mimeType'], fromMimeType);
    }
    const fromAutoTruncate = getValueByPath(fromObject, ['autoTruncate']);
    if (parentObject !== undefined &&
        fromAutoTruncate !== undefined &&
        fromAutoTruncate !== null) {
        setValueByPath(parentObject, ['parameters', 'autoTruncate'], fromAutoTruncate);
    }
    return toObject;
}
function embedContentParametersToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ['model']);
    if (fromModel !== undefined && fromModel !== null) {
        setValueByPath(toObject, ['_url', 'model'], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ['contents']);
    if (fromContents !== undefined && fromContents !== null) {
        setValueByPath(toObject, ['requests[]', 'content'], tContentsForEmbed(apiClient, fromContents));
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], embedContentConfigToMldev(apiClient, fromConfig, toObject));
    }
    const fromModelForEmbedContent = getValueByPath(fromObject, ['model']);
    if (fromModelForEmbedContent !== undefined) {
        setValueByPath(toObject, ['requests[]', 'model'], tModel(apiClient, fromModelForEmbedContent));
    }
    return toObject;
}
function embedContentParametersToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ['model']);
    if (fromModel !== undefined && fromModel !== null) {
        setValueByPath(toObject, ['_url', 'model'], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ['contents']);
    if (fromContents !== undefined && fromContents !== null) {
        setValueByPath(toObject, ['instances[]', 'content'], tContentsForEmbed(apiClient, fromContents));
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], embedContentConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function generateImagesConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ['outputGcsUri']) !== undefined) {
        throw new Error('outputGcsUri parameter is not supported in Gemini API.');
    }
    const fromNegativePrompt = getValueByPath(fromObject, [
        'negativePrompt',
    ]);
    if (parentObject !== undefined &&
        fromNegativePrompt !== undefined &&
        fromNegativePrompt !== null) {
        setValueByPath(parentObject, ['parameters', 'negativePrompt'], fromNegativePrompt);
    }
    const fromNumberOfImages = getValueByPath(fromObject, [
        'numberOfImages',
    ]);
    if (parentObject !== undefined &&
        fromNumberOfImages !== undefined &&
        fromNumberOfImages !== null) {
        setValueByPath(parentObject, ['parameters', 'sampleCount'], fromNumberOfImages);
    }
    const fromGuidanceScale = getValueByPath(fromObject, [
        'guidanceScale',
    ]);
    if (parentObject !== undefined &&
        fromGuidanceScale !== undefined &&
        fromGuidanceScale !== null) {
        setValueByPath(parentObject, ['parameters', 'guidanceScale'], fromGuidanceScale);
    }
    if (getValueByPath(fromObject, ['seed']) !== undefined) {
        throw new Error('seed parameter is not supported in Gemini API.');
    }
    const fromSafetyFilterLevel = getValueByPath(fromObject, [
        'safetyFilterLevel',
    ]);
    if (parentObject !== undefined &&
        fromSafetyFilterLevel !== undefined &&
        fromSafetyFilterLevel !== null) {
        setValueByPath(parentObject, ['parameters', 'safetySetting'], fromSafetyFilterLevel);
    }
    const fromPersonGeneration = getValueByPath(fromObject, [
        'personGeneration',
    ]);
    if (parentObject !== undefined &&
        fromPersonGeneration !== undefined &&
        fromPersonGeneration !== null) {
        setValueByPath(parentObject, ['parameters', 'personGeneration'], fromPersonGeneration);
    }
    const fromIncludeSafetyAttributes = getValueByPath(fromObject, [
        'includeSafetyAttributes',
    ]);
    if (parentObject !== undefined &&
        fromIncludeSafetyAttributes !== undefined &&
        fromIncludeSafetyAttributes !== null) {
        setValueByPath(parentObject, ['parameters', 'includeSafetyAttributes'], fromIncludeSafetyAttributes);
    }
    const fromIncludeRaiReason = getValueByPath(fromObject, [
        'includeRaiReason',
    ]);
    if (parentObject !== undefined &&
        fromIncludeRaiReason !== undefined &&
        fromIncludeRaiReason !== null) {
        setValueByPath(parentObject, ['parameters', 'includeRaiReason'], fromIncludeRaiReason);
    }
    const fromLanguage = getValueByPath(fromObject, ['language']);
    if (parentObject !== undefined &&
        fromLanguage !== undefined &&
        fromLanguage !== null) {
        setValueByPath(parentObject, ['parameters', 'language'], fromLanguage);
    }
    const fromOutputMimeType = getValueByPath(fromObject, [
        'outputMimeType',
    ]);
    if (parentObject !== undefined &&
        fromOutputMimeType !== undefined &&
        fromOutputMimeType !== null) {
        setValueByPath(parentObject, ['parameters', 'outputOptions', 'mimeType'], fromOutputMimeType);
    }
    const fromOutputCompressionQuality = getValueByPath(fromObject, [
        'outputCompressionQuality',
    ]);
    if (parentObject !== undefined &&
        fromOutputCompressionQuality !== undefined &&
        fromOutputCompressionQuality !== null) {
        setValueByPath(parentObject, ['parameters', 'outputOptions', 'compressionQuality'], fromOutputCompressionQuality);
    }
    if (getValueByPath(fromObject, ['addWatermark']) !== undefined) {
        throw new Error('addWatermark parameter is not supported in Gemini API.');
    }
    const fromAspectRatio = getValueByPath(fromObject, ['aspectRatio']);
    if (parentObject !== undefined &&
        fromAspectRatio !== undefined &&
        fromAspectRatio !== null) {
        setValueByPath(parentObject, ['parameters', 'aspectRatio'], fromAspectRatio);
    }
    if (getValueByPath(fromObject, ['enhancePrompt']) !== undefined) {
        throw new Error('enhancePrompt parameter is not supported in Gemini API.');
    }
    return toObject;
}
function generateImagesConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromOutputGcsUri = getValueByPath(fromObject, ['outputGcsUri']);
    if (parentObject !== undefined &&
        fromOutputGcsUri !== undefined &&
        fromOutputGcsUri !== null) {
        setValueByPath(parentObject, ['parameters', 'storageUri'], fromOutputGcsUri);
    }
    const fromNegativePrompt = getValueByPath(fromObject, [
        'negativePrompt',
    ]);
    if (parentObject !== undefined &&
        fromNegativePrompt !== undefined &&
        fromNegativePrompt !== null) {
        setValueByPath(parentObject, ['parameters', 'negativePrompt'], fromNegativePrompt);
    }
    const fromNumberOfImages = getValueByPath(fromObject, [
        'numberOfImages',
    ]);
    if (parentObject !== undefined &&
        fromNumberOfImages !== undefined &&
        fromNumberOfImages !== null) {
        setValueByPath(parentObject, ['parameters', 'sampleCount'], fromNumberOfImages);
    }
    const fromGuidanceScale = getValueByPath(fromObject, [
        'guidanceScale',
    ]);
    if (parentObject !== undefined &&
        fromGuidanceScale !== undefined &&
        fromGuidanceScale !== null) {
        setValueByPath(parentObject, ['parameters', 'guidanceScale'], fromGuidanceScale);
    }
    const fromSeed = getValueByPath(fromObject, ['seed']);
    if (parentObject !== undefined &&
        fromSeed !== undefined &&
        fromSeed !== null) {
        setValueByPath(parentObject, ['parameters', 'seed'], fromSeed);
    }
    const fromSafetyFilterLevel = getValueByPath(fromObject, [
        'safetyFilterLevel',
    ]);
    if (parentObject !== undefined &&
        fromSafetyFilterLevel !== undefined &&
        fromSafetyFilterLevel !== null) {
        setValueByPath(parentObject, ['parameters', 'safetySetting'], fromSafetyFilterLevel);
    }
    const fromPersonGeneration = getValueByPath(fromObject, [
        'personGeneration',
    ]);
    if (parentObject !== undefined &&
        fromPersonGeneration !== undefined &&
        fromPersonGeneration !== null) {
        setValueByPath(parentObject, ['parameters', 'personGeneration'], fromPersonGeneration);
    }
    const fromIncludeSafetyAttributes = getValueByPath(fromObject, [
        'includeSafetyAttributes',
    ]);
    if (parentObject !== undefined &&
        fromIncludeSafetyAttributes !== undefined &&
        fromIncludeSafetyAttributes !== null) {
        setValueByPath(parentObject, ['parameters', 'includeSafetyAttributes'], fromIncludeSafetyAttributes);
    }
    const fromIncludeRaiReason = getValueByPath(fromObject, [
        'includeRaiReason',
    ]);
    if (parentObject !== undefined &&
        fromIncludeRaiReason !== undefined &&
        fromIncludeRaiReason !== null) {
        setValueByPath(parentObject, ['parameters', 'includeRaiReason'], fromIncludeRaiReason);
    }
    const fromLanguage = getValueByPath(fromObject, ['language']);
    if (parentObject !== undefined &&
        fromLanguage !== undefined &&
        fromLanguage !== null) {
        setValueByPath(parentObject, ['parameters', 'language'], fromLanguage);
    }
    const fromOutputMimeType = getValueByPath(fromObject, [
        'outputMimeType',
    ]);
    if (parentObject !== undefined &&
        fromOutputMimeType !== undefined &&
        fromOutputMimeType !== null) {
        setValueByPath(parentObject, ['parameters', 'outputOptions', 'mimeType'], fromOutputMimeType);
    }
    const fromOutputCompressionQuality = getValueByPath(fromObject, [
        'outputCompressionQuality',
    ]);
    if (parentObject !== undefined &&
        fromOutputCompressionQuality !== undefined &&
        fromOutputCompressionQuality !== null) {
        setValueByPath(parentObject, ['parameters', 'outputOptions', 'compressionQuality'], fromOutputCompressionQuality);
    }
    const fromAddWatermark = getValueByPath(fromObject, ['addWatermark']);
    if (parentObject !== undefined &&
        fromAddWatermark !== undefined &&
        fromAddWatermark !== null) {
        setValueByPath(parentObject, ['parameters', 'addWatermark'], fromAddWatermark);
    }
    const fromAspectRatio = getValueByPath(fromObject, ['aspectRatio']);
    if (parentObject !== undefined &&
        fromAspectRatio !== undefined &&
        fromAspectRatio !== null) {
        setValueByPath(parentObject, ['parameters', 'aspectRatio'], fromAspectRatio);
    }
    const fromEnhancePrompt = getValueByPath(fromObject, [
        'enhancePrompt',
    ]);
    if (parentObject !== undefined &&
        fromEnhancePrompt !== undefined &&
        fromEnhancePrompt !== null) {
        setValueByPath(parentObject, ['parameters', 'enhancePrompt'], fromEnhancePrompt);
    }
    return toObject;
}
function generateImagesParametersToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ['model']);
    if (fromModel !== undefined && fromModel !== null) {
        setValueByPath(toObject, ['_url', 'model'], tModel(apiClient, fromModel));
    }
    const fromPrompt = getValueByPath(fromObject, ['prompt']);
    if (fromPrompt !== undefined && fromPrompt !== null) {
        setValueByPath(toObject, ['instances', 'prompt'], fromPrompt);
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], generateImagesConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function generateImagesParametersToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ['model']);
    if (fromModel !== undefined && fromModel !== null) {
        setValueByPath(toObject, ['_url', 'model'], tModel(apiClient, fromModel));
    }
    const fromPrompt = getValueByPath(fromObject, ['prompt']);
    if (fromPrompt !== undefined && fromPrompt !== null) {
        setValueByPath(toObject, ['instances', 'prompt'], fromPrompt);
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], generateImagesConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function countTokensConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromSystemInstruction = getValueByPath(fromObject, [
        'systemInstruction',
    ]);
    if (parentObject !== undefined &&
        fromSystemInstruction !== undefined &&
        fromSystemInstruction !== null) {
        setValueByPath(parentObject, ['generateContentRequest', 'systemInstruction'], contentToMldev(apiClient, tContent(apiClient, fromSystemInstruction)));
    }
    const fromTools = getValueByPath(fromObject, ['tools']);
    if (parentObject !== undefined &&
        fromTools !== undefined &&
        fromTools !== null) {
        if (Array.isArray(fromTools)) {
            setValueByPath(parentObject, ['generateContentRequest', 'tools'], fromTools.map((item) => {
                return toolToMldev(apiClient, item);
            }));
        }
        else {
            setValueByPath(parentObject, ['generateContentRequest', 'tools'], fromTools);
        }
    }
    if (getValueByPath(fromObject, ['generationConfig']) !== undefined) {
        throw new Error('generationConfig parameter is not supported in Gemini API.');
    }
    return toObject;
}
function countTokensConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromSystemInstruction = getValueByPath(fromObject, [
        'systemInstruction',
    ]);
    if (parentObject !== undefined &&
        fromSystemInstruction !== undefined &&
        fromSystemInstruction !== null) {
        setValueByPath(parentObject, ['systemInstruction'], contentToVertex(apiClient, tContent(apiClient, fromSystemInstruction)));
    }
    const fromTools = getValueByPath(fromObject, ['tools']);
    if (parentObject !== undefined &&
        fromTools !== undefined &&
        fromTools !== null) {
        if (Array.isArray(fromTools)) {
            setValueByPath(parentObject, ['tools'], fromTools.map((item) => {
                return toolToVertex(apiClient, item);
            }));
        }
        else {
            setValueByPath(parentObject, ['tools'], fromTools);
        }
    }
    const fromGenerationConfig = getValueByPath(fromObject, [
        'generationConfig',
    ]);
    if (parentObject !== undefined &&
        fromGenerationConfig !== undefined &&
        fromGenerationConfig !== null) {
        setValueByPath(parentObject, ['generationConfig'], fromGenerationConfig);
    }
    return toObject;
}
function countTokensParametersToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ['model']);
    if (fromModel !== undefined && fromModel !== null) {
        setValueByPath(toObject, ['_url', 'model'], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ['contents']);
    if (fromContents !== undefined && fromContents !== null) {
        if (Array.isArray(fromContents)) {
            setValueByPath(toObject, ['contents'], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
                return contentToMldev(apiClient, item);
            })));
        }
        else {
            setValueByPath(toObject, ['contents'], tContents(apiClient, fromContents));
        }
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], countTokensConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function countTokensParametersToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ['model']);
    if (fromModel !== undefined && fromModel !== null) {
        setValueByPath(toObject, ['_url', 'model'], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ['contents']);
    if (fromContents !== undefined && fromContents !== null) {
        if (Array.isArray(fromContents)) {
            setValueByPath(toObject, ['contents'], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
                return contentToVertex(apiClient, item);
            })));
        }
        else {
            setValueByPath(toObject, ['contents'], tContents(apiClient, fromContents));
        }
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], countTokensConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function computeTokensParametersToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ['model']);
    if (fromModel !== undefined && fromModel !== null) {
        setValueByPath(toObject, ['_url', 'model'], tModel(apiClient, fromModel));
    }
    if (getValueByPath(fromObject, ['contents']) !== undefined) {
        throw new Error('contents parameter is not supported in Gemini API.');
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], fromConfig);
    }
    return toObject;
}
function computeTokensParametersToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ['model']);
    if (fromModel !== undefined && fromModel !== null) {
        setValueByPath(toObject, ['_url', 'model'], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ['contents']);
    if (fromContents !== undefined && fromContents !== null) {
        if (Array.isArray(fromContents)) {
            setValueByPath(toObject, ['contents'], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
                return contentToVertex(apiClient, item);
            })));
        }
        else {
            setValueByPath(toObject, ['contents'], tContents(apiClient, fromContents));
        }
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], fromConfig);
    }
    return toObject;
}
function partFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromThought = getValueByPath(fromObject, ['thought']);
    if (fromThought !== undefined && fromThought !== null) {
        setValueByPath(toObject, ['thought'], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
        'codeExecutionResult',
    ]);
    if (fromCodeExecutionResult !== undefined &&
        fromCodeExecutionResult !== null) {
        setValueByPath(toObject, ['codeExecutionResult'], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
        'executableCode',
    ]);
    if (fromExecutableCode !== undefined && fromExecutableCode !== null) {
        setValueByPath(toObject, ['executableCode'], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ['fileData']);
    if (fromFileData !== undefined && fromFileData !== null) {
        setValueByPath(toObject, ['fileData'], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ['functionCall']);
    if (fromFunctionCall !== undefined && fromFunctionCall !== null) {
        setValueByPath(toObject, ['functionCall'], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
        'functionResponse',
    ]);
    if (fromFunctionResponse !== undefined && fromFunctionResponse !== null) {
        setValueByPath(toObject, ['functionResponse'], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ['inlineData']);
    if (fromInlineData !== undefined && fromInlineData !== null) {
        setValueByPath(toObject, ['inlineData'], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ['text']);
    if (fromText !== undefined && fromText !== null) {
        setValueByPath(toObject, ['text'], fromText);
    }
    return toObject;
}
function partFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromVideoMetadata = getValueByPath(fromObject, [
        'videoMetadata',
    ]);
    if (fromVideoMetadata !== undefined && fromVideoMetadata !== null) {
        setValueByPath(toObject, ['videoMetadata'], fromVideoMetadata);
    }
    const fromThought = getValueByPath(fromObject, ['thought']);
    if (fromThought !== undefined && fromThought !== null) {
        setValueByPath(toObject, ['thought'], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
        'codeExecutionResult',
    ]);
    if (fromCodeExecutionResult !== undefined &&
        fromCodeExecutionResult !== null) {
        setValueByPath(toObject, ['codeExecutionResult'], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
        'executableCode',
    ]);
    if (fromExecutableCode !== undefined && fromExecutableCode !== null) {
        setValueByPath(toObject, ['executableCode'], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ['fileData']);
    if (fromFileData !== undefined && fromFileData !== null) {
        setValueByPath(toObject, ['fileData'], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ['functionCall']);
    if (fromFunctionCall !== undefined && fromFunctionCall !== null) {
        setValueByPath(toObject, ['functionCall'], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
        'functionResponse',
    ]);
    if (fromFunctionResponse !== undefined && fromFunctionResponse !== null) {
        setValueByPath(toObject, ['functionResponse'], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ['inlineData']);
    if (fromInlineData !== undefined && fromInlineData !== null) {
        setValueByPath(toObject, ['inlineData'], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ['text']);
    if (fromText !== undefined && fromText !== null) {
        setValueByPath(toObject, ['text'], fromText);
    }
    return toObject;
}
/** @internal */
function contentFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ['parts']);
    if (fromParts !== undefined && fromParts !== null) {
        if (Array.isArray(fromParts)) {
            setValueByPath(toObject, ['parts'], fromParts.map((item) => {
                return partFromMldev(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['parts'], fromParts);
        }
    }
    const fromRole = getValueByPath(fromObject, ['role']);
    if (fromRole !== undefined && fromRole !== null) {
        setValueByPath(toObject, ['role'], fromRole);
    }
    return toObject;
}
/** @internal */
function contentFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ['parts']);
    if (fromParts !== undefined && fromParts !== null) {
        if (Array.isArray(fromParts)) {
            setValueByPath(toObject, ['parts'], fromParts.map((item) => {
                return partFromVertex(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['parts'], fromParts);
        }
    }
    const fromRole = getValueByPath(fromObject, ['role']);
    if (fromRole !== undefined && fromRole !== null) {
        setValueByPath(toObject, ['role'], fromRole);
    }
    return toObject;
}
function citationMetadataFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromCitations = getValueByPath(fromObject, ['citationSources']);
    if (fromCitations !== undefined && fromCitations !== null) {
        setValueByPath(toObject, ['citations'], fromCitations);
    }
    return toObject;
}
function citationMetadataFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromCitations = getValueByPath(fromObject, ['citations']);
    if (fromCitations !== undefined && fromCitations !== null) {
        setValueByPath(toObject, ['citations'], fromCitations);
    }
    return toObject;
}
function candidateFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromContent = getValueByPath(fromObject, ['content']);
    if (fromContent !== undefined && fromContent !== null) {
        setValueByPath(toObject, ['content'], contentFromMldev(apiClient, fromContent));
    }
    const fromCitationMetadata = getValueByPath(fromObject, [
        'citationMetadata',
    ]);
    if (fromCitationMetadata !== undefined && fromCitationMetadata !== null) {
        setValueByPath(toObject, ['citationMetadata'], citationMetadataFromMldev(apiClient, fromCitationMetadata));
    }
    const fromTokenCount = getValueByPath(fromObject, ['tokenCount']);
    if (fromTokenCount !== undefined && fromTokenCount !== null) {
        setValueByPath(toObject, ['tokenCount'], fromTokenCount);
    }
    const fromAvgLogprobs = getValueByPath(fromObject, ['avgLogprobs']);
    if (fromAvgLogprobs !== undefined && fromAvgLogprobs !== null) {
        setValueByPath(toObject, ['avgLogprobs'], fromAvgLogprobs);
    }
    const fromFinishReason = getValueByPath(fromObject, ['finishReason']);
    if (fromFinishReason !== undefined && fromFinishReason !== null) {
        setValueByPath(toObject, ['finishReason'], fromFinishReason);
    }
    const fromGroundingMetadata = getValueByPath(fromObject, [
        'groundingMetadata',
    ]);
    if (fromGroundingMetadata !== undefined && fromGroundingMetadata !== null) {
        setValueByPath(toObject, ['groundingMetadata'], fromGroundingMetadata);
    }
    const fromIndex = getValueByPath(fromObject, ['index']);
    if (fromIndex !== undefined && fromIndex !== null) {
        setValueByPath(toObject, ['index'], fromIndex);
    }
    const fromLogprobsResult = getValueByPath(fromObject, [
        'logprobsResult',
    ]);
    if (fromLogprobsResult !== undefined && fromLogprobsResult !== null) {
        setValueByPath(toObject, ['logprobsResult'], fromLogprobsResult);
    }
    const fromSafetyRatings = getValueByPath(fromObject, [
        'safetyRatings',
    ]);
    if (fromSafetyRatings !== undefined && fromSafetyRatings !== null) {
        setValueByPath(toObject, ['safetyRatings'], fromSafetyRatings);
    }
    return toObject;
}
function candidateFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromContent = getValueByPath(fromObject, ['content']);
    if (fromContent !== undefined && fromContent !== null) {
        setValueByPath(toObject, ['content'], contentFromVertex(apiClient, fromContent));
    }
    const fromCitationMetadata = getValueByPath(fromObject, [
        'citationMetadata',
    ]);
    if (fromCitationMetadata !== undefined && fromCitationMetadata !== null) {
        setValueByPath(toObject, ['citationMetadata'], citationMetadataFromVertex(apiClient, fromCitationMetadata));
    }
    const fromFinishMessage = getValueByPath(fromObject, [
        'finishMessage',
    ]);
    if (fromFinishMessage !== undefined && fromFinishMessage !== null) {
        setValueByPath(toObject, ['finishMessage'], fromFinishMessage);
    }
    const fromAvgLogprobs = getValueByPath(fromObject, ['avgLogprobs']);
    if (fromAvgLogprobs !== undefined && fromAvgLogprobs !== null) {
        setValueByPath(toObject, ['avgLogprobs'], fromAvgLogprobs);
    }
    const fromFinishReason = getValueByPath(fromObject, ['finishReason']);
    if (fromFinishReason !== undefined && fromFinishReason !== null) {
        setValueByPath(toObject, ['finishReason'], fromFinishReason);
    }
    const fromGroundingMetadata = getValueByPath(fromObject, [
        'groundingMetadata',
    ]);
    if (fromGroundingMetadata !== undefined && fromGroundingMetadata !== null) {
        setValueByPath(toObject, ['groundingMetadata'], fromGroundingMetadata);
    }
    const fromIndex = getValueByPath(fromObject, ['index']);
    if (fromIndex !== undefined && fromIndex !== null) {
        setValueByPath(toObject, ['index'], fromIndex);
    }
    const fromLogprobsResult = getValueByPath(fromObject, [
        'logprobsResult',
    ]);
    if (fromLogprobsResult !== undefined && fromLogprobsResult !== null) {
        setValueByPath(toObject, ['logprobsResult'], fromLogprobsResult);
    }
    const fromSafetyRatings = getValueByPath(fromObject, [
        'safetyRatings',
    ]);
    if (fromSafetyRatings !== undefined && fromSafetyRatings !== null) {
        setValueByPath(toObject, ['safetyRatings'], fromSafetyRatings);
    }
    return toObject;
}
function generateContentResponseFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromCandidates = getValueByPath(fromObject, ['candidates']);
    if (fromCandidates !== undefined && fromCandidates !== null) {
        if (Array.isArray(fromCandidates)) {
            setValueByPath(toObject, ['candidates'], fromCandidates.map((item) => {
                return candidateFromMldev(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['candidates'], fromCandidates);
        }
    }
    const fromModelVersion = getValueByPath(fromObject, ['modelVersion']);
    if (fromModelVersion !== undefined && fromModelVersion !== null) {
        setValueByPath(toObject, ['modelVersion'], fromModelVersion);
    }
    const fromPromptFeedback = getValueByPath(fromObject, [
        'promptFeedback',
    ]);
    if (fromPromptFeedback !== undefined && fromPromptFeedback !== null) {
        setValueByPath(toObject, ['promptFeedback'], fromPromptFeedback);
    }
    const fromUsageMetadata = getValueByPath(fromObject, [
        'usageMetadata',
    ]);
    if (fromUsageMetadata !== undefined && fromUsageMetadata !== null) {
        setValueByPath(toObject, ['usageMetadata'], fromUsageMetadata);
    }
    return toObject;
}
function generateContentResponseFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromCandidates = getValueByPath(fromObject, ['candidates']);
    if (fromCandidates !== undefined && fromCandidates !== null) {
        if (Array.isArray(fromCandidates)) {
            setValueByPath(toObject, ['candidates'], fromCandidates.map((item) => {
                return candidateFromVertex(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['candidates'], fromCandidates);
        }
    }
    const fromCreateTime = getValueByPath(fromObject, ['createTime']);
    if (fromCreateTime !== undefined && fromCreateTime !== null) {
        setValueByPath(toObject, ['createTime'], fromCreateTime);
    }
    const fromResponseId = getValueByPath(fromObject, ['responseId']);
    if (fromResponseId !== undefined && fromResponseId !== null) {
        setValueByPath(toObject, ['responseId'], fromResponseId);
    }
    const fromModelVersion = getValueByPath(fromObject, ['modelVersion']);
    if (fromModelVersion !== undefined && fromModelVersion !== null) {
        setValueByPath(toObject, ['modelVersion'], fromModelVersion);
    }
    const fromPromptFeedback = getValueByPath(fromObject, [
        'promptFeedback',
    ]);
    if (fromPromptFeedback !== undefined && fromPromptFeedback !== null) {
        setValueByPath(toObject, ['promptFeedback'], fromPromptFeedback);
    }
    const fromUsageMetadata = getValueByPath(fromObject, [
        'usageMetadata',
    ]);
    if (fromUsageMetadata !== undefined && fromUsageMetadata !== null) {
        setValueByPath(toObject, ['usageMetadata'], fromUsageMetadata);
    }
    return toObject;
}
function contentEmbeddingStatisticsFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTruncated = getValueByPath(fromObject, ['truncated']);
    if (fromTruncated !== undefined && fromTruncated !== null) {
        setValueByPath(toObject, ['truncated'], fromTruncated);
    }
    const fromTokenCount = getValueByPath(fromObject, ['token_count']);
    if (fromTokenCount !== undefined && fromTokenCount !== null) {
        setValueByPath(toObject, ['tokenCount'], fromTokenCount);
    }
    return toObject;
}
function contentEmbeddingFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromValues = getValueByPath(fromObject, ['values']);
    if (fromValues !== undefined && fromValues !== null) {
        setValueByPath(toObject, ['values'], fromValues);
    }
    return toObject;
}
function contentEmbeddingFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromValues = getValueByPath(fromObject, ['values']);
    if (fromValues !== undefined && fromValues !== null) {
        setValueByPath(toObject, ['values'], fromValues);
    }
    const fromStatistics = getValueByPath(fromObject, ['statistics']);
    if (fromStatistics !== undefined && fromStatistics !== null) {
        setValueByPath(toObject, ['statistics'], contentEmbeddingStatisticsFromVertex(apiClient, fromStatistics));
    }
    return toObject;
}
function embedContentMetadataFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    return toObject;
}
function embedContentMetadataFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromBillableCharacterCount = getValueByPath(fromObject, [
        'billableCharacterCount',
    ]);
    if (fromBillableCharacterCount !== undefined &&
        fromBillableCharacterCount !== null) {
        setValueByPath(toObject, ['billableCharacterCount'], fromBillableCharacterCount);
    }
    return toObject;
}
function embedContentResponseFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromEmbeddings = getValueByPath(fromObject, ['embeddings']);
    if (fromEmbeddings !== undefined && fromEmbeddings !== null) {
        if (Array.isArray(fromEmbeddings)) {
            setValueByPath(toObject, ['embeddings'], fromEmbeddings.map((item) => {
                return contentEmbeddingFromMldev(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['embeddings'], fromEmbeddings);
        }
    }
    const fromMetadata = getValueByPath(fromObject, ['metadata']);
    if (fromMetadata !== undefined && fromMetadata !== null) {
        setValueByPath(toObject, ['metadata'], embedContentMetadataFromMldev());
    }
    return toObject;
}
function embedContentResponseFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromEmbeddings = getValueByPath(fromObject, [
        'predictions[]',
        'embeddings',
    ]);
    if (fromEmbeddings !== undefined && fromEmbeddings !== null) {
        if (Array.isArray(fromEmbeddings)) {
            setValueByPath(toObject, ['embeddings'], fromEmbeddings.map((item) => {
                return contentEmbeddingFromVertex(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['embeddings'], fromEmbeddings);
        }
    }
    const fromMetadata = getValueByPath(fromObject, ['metadata']);
    if (fromMetadata !== undefined && fromMetadata !== null) {
        setValueByPath(toObject, ['metadata'], embedContentMetadataFromVertex(apiClient, fromMetadata));
    }
    return toObject;
}
function imageFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromImageBytes = getValueByPath(fromObject, [
        'bytesBase64Encoded',
    ]);
    if (fromImageBytes !== undefined && fromImageBytes !== null) {
        setValueByPath(toObject, ['imageBytes'], tBytes(apiClient, fromImageBytes));
    }
    const fromMimeType = getValueByPath(fromObject, ['mimeType']);
    if (fromMimeType !== undefined && fromMimeType !== null) {
        setValueByPath(toObject, ['mimeType'], fromMimeType);
    }
    return toObject;
}
function imageFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromGcsUri = getValueByPath(fromObject, ['gcsUri']);
    if (fromGcsUri !== undefined && fromGcsUri !== null) {
        setValueByPath(toObject, ['gcsUri'], fromGcsUri);
    }
    const fromImageBytes = getValueByPath(fromObject, [
        'bytesBase64Encoded',
    ]);
    if (fromImageBytes !== undefined && fromImageBytes !== null) {
        setValueByPath(toObject, ['imageBytes'], tBytes(apiClient, fromImageBytes));
    }
    const fromMimeType = getValueByPath(fromObject, ['mimeType']);
    if (fromMimeType !== undefined && fromMimeType !== null) {
        setValueByPath(toObject, ['mimeType'], fromMimeType);
    }
    return toObject;
}
function generatedImageFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromImage = getValueByPath(fromObject, ['_self']);
    if (fromImage !== undefined && fromImage !== null) {
        setValueByPath(toObject, ['image'], imageFromMldev(apiClient, fromImage));
    }
    const fromRaiFilteredReason = getValueByPath(fromObject, [
        'raiFilteredReason',
    ]);
    if (fromRaiFilteredReason !== undefined && fromRaiFilteredReason !== null) {
        setValueByPath(toObject, ['raiFilteredReason'], fromRaiFilteredReason);
    }
    return toObject;
}
function generatedImageFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromImage = getValueByPath(fromObject, ['_self']);
    if (fromImage !== undefined && fromImage !== null) {
        setValueByPath(toObject, ['image'], imageFromVertex(apiClient, fromImage));
    }
    const fromRaiFilteredReason = getValueByPath(fromObject, [
        'raiFilteredReason',
    ]);
    if (fromRaiFilteredReason !== undefined && fromRaiFilteredReason !== null) {
        setValueByPath(toObject, ['raiFilteredReason'], fromRaiFilteredReason);
    }
    const fromEnhancedPrompt = getValueByPath(fromObject, ['prompt']);
    if (fromEnhancedPrompt !== undefined && fromEnhancedPrompt !== null) {
        setValueByPath(toObject, ['enhancedPrompt'], fromEnhancedPrompt);
    }
    return toObject;
}
function generateImagesResponseFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromGeneratedImages = getValueByPath(fromObject, [
        'predictions',
    ]);
    if (fromGeneratedImages !== undefined && fromGeneratedImages !== null) {
        if (Array.isArray(fromGeneratedImages)) {
            setValueByPath(toObject, ['generatedImages'], fromGeneratedImages.map((item) => {
                return generatedImageFromMldev(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['generatedImages'], fromGeneratedImages);
        }
    }
    return toObject;
}
function generateImagesResponseFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromGeneratedImages = getValueByPath(fromObject, [
        'predictions',
    ]);
    if (fromGeneratedImages !== undefined && fromGeneratedImages !== null) {
        if (Array.isArray(fromGeneratedImages)) {
            setValueByPath(toObject, ['generatedImages'], fromGeneratedImages.map((item) => {
                return generatedImageFromVertex(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['generatedImages'], fromGeneratedImages);
        }
    }
    return toObject;
}
function countTokensResponseFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTotalTokens = getValueByPath(fromObject, ['totalTokens']);
    if (fromTotalTokens !== undefined && fromTotalTokens !== null) {
        setValueByPath(toObject, ['totalTokens'], fromTotalTokens);
    }
    const fromCachedContentTokenCount = getValueByPath(fromObject, [
        'cachedContentTokenCount',
    ]);
    if (fromCachedContentTokenCount !== undefined &&
        fromCachedContentTokenCount !== null) {
        setValueByPath(toObject, ['cachedContentTokenCount'], fromCachedContentTokenCount);
    }
    return toObject;
}
function countTokensResponseFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTotalTokens = getValueByPath(fromObject, ['totalTokens']);
    if (fromTotalTokens !== undefined && fromTotalTokens !== null) {
        setValueByPath(toObject, ['totalTokens'], fromTotalTokens);
    }
    return toObject;
}
function computeTokensResponseFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTokensInfo = getValueByPath(fromObject, ['tokensInfo']);
    if (fromTokensInfo !== undefined && fromTokensInfo !== null) {
        setValueByPath(toObject, ['tokensInfo'], fromTokensInfo);
    }
    return toObject;
}
function computeTokensResponseFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTokensInfo = getValueByPath(fromObject, ['tokensInfo']);
    if (fromTokensInfo !== undefined && fromTokensInfo !== null) {
        setValueByPath(toObject, ['tokensInfo'], fromTokensInfo);
    }
    return toObject;
}


const FUNCTION_RESPONSE_REQUIRES_ID = 'FunctionResponse request must have an `id` field from the response of a ToolCall.FunctionalCalls in Google AI.';
function liveConnectConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromGenerationConfig = getValueByPath(fromObject, [
        'generationConfig',
    ]);
    if (fromGenerationConfig !== undefined) {
        setValueByPath(toObject, ['generationConfig'], fromGenerationConfig);
    }
    const fromResponseModalities = getValueByPath(fromObject, [
        'responseModalities',
    ]);
    if (fromResponseModalities !== undefined) {
        setValueByPath(toObject, ['generationConfig', 'responseModalities'], fromResponseModalities);
    }
    const fromSpeechConfig = getValueByPath(fromObject, ['speechConfig']);
    if (fromSpeechConfig !== undefined) {
        setValueByPath(toObject, ['generationConfig', 'speechConfig'], fromSpeechConfig);
    }
    const fromSystemInstruction = getValueByPath(fromObject, [
        'systemInstruction',
    ]);
    if (fromSystemInstruction !== undefined && fromSystemInstruction !== null) {
        setValueByPath(toObject, ['systemInstruction'], contentToMldev(apiClient, fromSystemInstruction));
    }
    const fromTools = getValueByPath(fromObject, ['tools']);
    if (fromTools !== undefined &&
        fromTools !== null &&
        Array.isArray(fromTools)) {
        setValueByPath(toObject, ['tools'], fromTools.map((item) => {
            return toolToMldev(apiClient, item);
        }));
    }
    return toObject;
}
function liveConnectConfigToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromGenerationConfig = getValueByPath(fromObject, [
        'generationConfig',
    ]);
    if (fromGenerationConfig !== undefined) {
        setValueByPath(toObject, ['generationConfig'], fromGenerationConfig);
    }
    const fromResponseModalities = getValueByPath(fromObject, [
        'responseModalities',
    ]);
    if (fromResponseModalities !== undefined) {
        setValueByPath(toObject, ['generationConfig', 'responseModalities'], fromResponseModalities);
    }
    else {
        // Set default to AUDIO to align with MLDev API.
        setValueByPath(toObject, ['generationConfig', 'responseModalities'], ['AUDIO']);
    }
    const fromSpeechConfig = getValueByPath(fromObject, ['speechConfig']);
    if (fromSpeechConfig !== undefined) {
        setValueByPath(toObject, ['generationConfig', 'speechConfig'], fromSpeechConfig);
    }
    const fromSystemInstruction = getValueByPath(fromObject, [
        'systemInstruction',
    ]);
    if (fromSystemInstruction !== undefined && fromSystemInstruction !== null) {
        setValueByPath(toObject, ['systemInstruction'], contentToVertex(apiClient, fromSystemInstruction));
    }
    const fromTools = getValueByPath(fromObject, ['tools']);
    if (fromTools !== undefined &&
        fromTools !== null &&
        Array.isArray(fromTools)) {
        setValueByPath(toObject, ['tools'], fromTools.map((item) => {
            return toolToVertex(apiClient, item);
        }));
    }
    return toObject;
}
function liveConnectParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['setup'], liveConnectConfigToMldev(apiClient, fromConfig));
    }
    const fromModel = getValueByPath(fromObject, ['model']);
    if (fromModel !== undefined) {
        setValueByPath(toObject, ['setup', 'model'], fromModel);
    }
    return toObject;
}
function liveConnectParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['setup'], liveConnectConfigToVertex(apiClient, fromConfig));
    }
    const fromModel = getValueByPath(fromObject, ['model']);
    if (fromModel !== undefined) {
        setValueByPath(toObject, ['setup', 'model'], fromModel);
    }
    return toObject;
}
function liveServerContentFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromModelTurn = getValueByPath(fromObject, ['modelTurn']);
    if (fromModelTurn !== undefined && fromModelTurn !== null) {
        setValueByPath(toObject, ['modelTurn'], contentFromMldev(apiClient, fromModelTurn));
    }
    const fromTurnComplete = getValueByPath(fromObject, ['turnComplete']);
    if (fromTurnComplete !== undefined) {
        setValueByPath(toObject, ['turnComplete'], fromTurnComplete);
    }
    const fromInterrupted = getValueByPath(fromObject, ['interrupted']);
    if (fromInterrupted !== undefined) {
        setValueByPath(toObject, ['interrupted'], fromInterrupted);
    }
    return toObject;
}
function liveServerContentFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModelTurn = getValueByPath(fromObject, ['modelTurn']);
    if (fromModelTurn !== undefined && fromModelTurn !== null) {
        setValueByPath(toObject, ['modelTurn'], contentFromVertex(apiClient, fromModelTurn));
    }
    const fromTurnComplete = getValueByPath(fromObject, ['turnComplete']);
    if (fromTurnComplete !== undefined) {
        setValueByPath(toObject, ['turnComplete'], fromTurnComplete);
    }
    const fromInterrupted = getValueByPath(fromObject, ['interrupted']);
    if (fromInterrupted !== undefined) {
        setValueByPath(toObject, ['interrupted'], fromInterrupted);
    }
    return toObject;
}
function functionCallFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromId = getValueByPath(fromObject, ['id']);
    if (fromId !== undefined) {
        setValueByPath(toObject, ['id'], fromId);
    }
    const fromArgs = getValueByPath(fromObject, ['args']);
    if (fromArgs !== undefined) {
        setValueByPath(toObject, ['args'], fromArgs);
    }
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined) {
        setValueByPath(toObject, ['name'], fromName);
    }
    return toObject;
}
function functionCallFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromArgs = getValueByPath(fromObject, ['args']);
    if (fromArgs !== undefined) {
        setValueByPath(toObject, ['args'], fromArgs);
    }
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined) {
        setValueByPath(toObject, ['name'], fromName);
    }
    return toObject;
}
function liveServerToolCallFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionCalls = getValueByPath(fromObject, [
        'functionCalls',
    ]);
    if (fromFunctionCalls !== undefined &&
        fromFunctionCalls !== null &&
        Array.isArray(fromFunctionCalls)) {
        setValueByPath(toObject, ['functionCalls'], fromFunctionCalls.map((item) => {
            return functionCallFromMldev(apiClient, item);
        }));
    }
    return toObject;
}
function liveServerToolCallFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionCalls = getValueByPath(fromObject, [
        'functionCalls',
    ]);
    if (fromFunctionCalls !== undefined &&
        fromFunctionCalls !== null &&
        Array.isArray(fromFunctionCalls)) {
        setValueByPath(toObject, ['functionCalls'], fromFunctionCalls.map((item) => {
            return functionCallFromVertex(apiClient, item);
        }));
    }
    return toObject;
}
function liveServerToolCallCancellationFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromIds = getValueByPath(fromObject, ['ids']);
    if (fromIds !== undefined) {
        setValueByPath(toObject, ['ids'], fromIds);
    }
    return toObject;
}
function liveServerToolCallCancellationFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromIds = getValueByPath(fromObject, ['ids']);
    if (fromIds !== undefined) {
        setValueByPath(toObject, ['ids'], fromIds);
    }
    return toObject;
}
function liveServerMessageFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromSetupComplete = getValueByPath(fromObject, [
        'setupComplete',
    ]);
    if (fromSetupComplete !== undefined) {
        setValueByPath(toObject, ['setupComplete'], fromSetupComplete);
    }
    const fromServerContent = getValueByPath(fromObject, [
        'serverContent',
    ]);
    if (fromServerContent !== undefined && fromServerContent !== null) {
        setValueByPath(toObject, ['serverContent'], liveServerContentFromMldev(apiClient, fromServerContent));
    }
    const fromToolCall = getValueByPath(fromObject, ['toolCall']);
    if (fromToolCall !== undefined && fromToolCall !== null) {
        setValueByPath(toObject, ['toolCall'], liveServerToolCallFromMldev(apiClient, fromToolCall));
    }
    const fromToolCallCancellation = getValueByPath(fromObject, [
        'toolCallCancellation',
    ]);
    if (fromToolCallCancellation !== undefined &&
        fromToolCallCancellation !== null) {
        setValueByPath(toObject, ['toolCallCancellation'], liveServerToolCallCancellationFromMldev(apiClient, fromToolCallCancellation));
    }
    return toObject;
}
function liveServerMessageFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromSetupComplete = getValueByPath(fromObject, [
        'setupComplete',
    ]);
    if (fromSetupComplete !== undefined) {
        setValueByPath(toObject, ['setupComplete'], fromSetupComplete);
    }
    const fromServerContent = getValueByPath(fromObject, [
        'serverContent',
    ]);
    if (fromServerContent !== undefined && fromServerContent !== null) {
        setValueByPath(toObject, ['serverContent'], liveServerContentFromVertex(apiClient, fromServerContent));
    }
    const fromToolCall = getValueByPath(fromObject, ['toolCall']);
    if (fromToolCall !== undefined && fromToolCall !== null) {
        setValueByPath(toObject, ['toolCall'], liveServerToolCallFromVertex(apiClient, fromToolCall));
    }
    const fromToolCallCancellation = getValueByPath(fromObject, [
        'toolCallCancellation',
    ]);
    if (fromToolCallCancellation !== undefined &&
        fromToolCallCancellation !== null) {
        setValueByPath(toObject, ['toolCallCancellation'], liveServerToolCallCancellationFromVertex(apiClient, fromToolCallCancellation));
    }
    return toObject;
}
/**
   Live class encapsulates the configuration for live interaction with the
   Generative Language API. It embeds ApiClient for general API settings.

   @experimental
  */
class Live {
    constructor(apiClient, auth, webSocketFactory) {
        this.apiClient = apiClient;
        this.auth = auth;
        this.webSocketFactory = webSocketFactory;
    }
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
    async connect(params, callbacks) {
        var _a, _b, _c;
        const websocketBaseUrl = this.apiClient.getWebsocketBaseUrl();
        const apiVersion = this.apiClient.getApiVersion();
        let url;
        const headers = mapToHeaders(this.apiClient.getDefaultHeaders());
        if (this.apiClient.isVertexAI()) {
            url = `${websocketBaseUrl}/ws/google.cloud.aiplatform.${apiVersion}.LlmBidiService/BidiGenerateContent`;
            await this.auth.addAuthHeaders(headers);
        }
        else {
            const apiKey = this.apiClient.getApiKey();
            url = `${websocketBaseUrl}/ws/google.ai.generativelanguage.${apiVersion}.GenerativeService.BidiGenerateContent?key=${apiKey}`;
        }
        let onopenResolve = () => { };
        const onopenPromise = new Promise((resolve) => {
            onopenResolve = resolve;
        });
        const onopenAwaitedCallback = function () {
            var _a;
            (_a = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onopen) === null || _a === void 0 ? void 0 : _a.call(callbacks);
            onopenResolve({});
        };
        const websocketCallbacks = {
            onopen: onopenAwaitedCallback,
            onmessage: (_a = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onmessage) !== null && _a !== void 0 ? _a : function (e) { },
            onerror: (_b = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onerror) !== null && _b !== void 0 ? _b : function (e) { },
            onclose: (_c = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onclose) !== null && _c !== void 0 ? _c : function (e) { },
        };
        const conn = this.webSocketFactory.create(url, headersToMap(headers), websocketCallbacks);
        conn.connect();
        // Wait for the websocket to open before sending requests.
        await onopenPromise;
        let transformedModel = tModel(this.apiClient, params.model);
        if (this.apiClient.isVertexAI() &&
            transformedModel.startsWith('publishers/')) {
            const project = this.apiClient.getProject();
            const location = this.apiClient.getLocation();
            transformedModel =
                `projects/${project}/locations/${location}/` + transformedModel;
        }
        let clientMessage = {};
        const liveConnectParameters = {
            model: transformedModel,
            config: params.config,
        };
        if (this.apiClient.isVertexAI()) {
            clientMessage = liveConnectParametersToVertex(this.apiClient, liveConnectParameters);
        }
        else {
            clientMessage = liveConnectParametersToMldev(this.apiClient, liveConnectParameters);
        }
        conn.send(JSON.stringify(clientMessage));
        return new Session(conn, this.apiClient);
    }
}
/**
   Session class represents a connection to the API.

   @experimental
  */
class Session {
    constructor(conn, apiClient) {
        this.conn = conn;
        this.apiClient = apiClient;
        conn.setOnMessageCallback((event) => {
            try {
                void this.handleMessage(event);
            }
            catch (e) {
                console.error(e);
            }
        });
    }
    async handleMessage(event) {
        if (!this.onmessage) {
            return;
        }
        let serverMessage;
        let data;
        if (event.data instanceof Blob) {
            data = JSON.parse(await event.data.text());
        }
        else {
            data = JSON.parse(event.data);
        }
        if (this.apiClient.isVertexAI()) {
            serverMessage = liveServerMessageFromVertex(this.apiClient, data);
        }
        else {
            serverMessage = liveServerMessageFromMldev(this.apiClient, data);
        }
        this.onmessage(serverMessage);
    }
    parseClientMessage(apiClient, input, turnComplete = false) {
        if (typeof input === 'object' && input !== null && 'setup' in input) {
            throw new Error("Message type 'setup' is not supported in send(). Use connect() instead.");
        }
        if (typeof input === 'string') {
            input = [input];
        }
        else if (typeof input === 'object' &&
            input !== null &&
            'name' in input &&
            'response' in input) {
            // ToolResponse.FunctionResponse
            if (!apiClient.isVertexAI() && !('id' in input)) {
                throw new Error(FUNCTION_RESPONSE_REQUIRES_ID);
            }
            input = [input];
        }
        let clientMessage = {};
        if (Array.isArray(input) &&
            input.some((c) => typeof c === 'object' && c !== null && 'name' in c && 'response' in c)) {
            // ToolResponse.FunctionResponse
            clientMessage = {
                toolResponse: { functionResponses: input },
            };
        }
        else if (Array.isArray(input) &&
            input.some((c) => typeof c === 'string')) {
            const contents = apiClient.isVertexAI()
                ? tContents(apiClient, input)
                    .map((item) => contentToVertex(apiClient, item))
                : tContents(apiClient, input)
                    .map((item) => contentToMldev(apiClient, item));
            clientMessage = {
                clientContent: { turns: contents, turnComplete: turnComplete },
            };
        }
        else if (typeof input === 'object' &&
            input !== null &&
            'content' in input) {
            clientMessage = { clientContent: input };
        }
        else if (typeof input === 'object' &&
            input !== null &&
            'mediaChunks' in input) {
            // LiveClientRealtimeInput
            clientMessage = { realtimeInput: input };
        }
        else if (typeof input === 'object' &&
            input !== null &&
            'turns' in input) {
            // LiveClientContent
            clientMessage = { clientContent: input };
        }
        else if (typeof input === 'object' &&
            input !== null &&
            'functionResponses' in input) {
            // LiveClientToolResponse
            if (!apiClient.isVertexAI() && !input.functionResponses[0].id) {
                throw new Error(FUNCTION_RESPONSE_REQUIRES_ID);
            }
            clientMessage = { toolResponse: input };
        }
        else if (typeof input === 'object' &&
            input !== null &&
            'name' in input &&
            'response' in input) {
            // FunctionResponse
            if (!apiClient.isVertexAI() && !input.id) {
                throw new Error(FUNCTION_RESPONSE_REQUIRES_ID);
            }
            clientMessage = {
                toolResponse: {
                    functionResponses: [input],
                },
            };
        }
        else if (Array.isArray(input) &&
            typeof input[0] === 'object' &&
            input[0] !== null &&
            'name' in input[0] &&
            'response' in input[0]) {
            // FunctionResponse[]
            if (!apiClient.isVertexAI() && !input[0].id) {
                throw new Error(FUNCTION_RESPONSE_REQUIRES_ID);
            }
            clientMessage = {
                toolResponse: {
                    functionResponses: input.map((c) => c),
                },
            };
        }
        else {
            throw new Error(`Unsupported input type '${typeof input}' or input content '${input}'.`);
        }
        return clientMessage;
    }
    /**
       Transmits a message over the established websocket connection.

       @experimental
     */
    send(message, turnComplete = false) {
        const clientMessage = this.parseClientMessage(this.apiClient, message, turnComplete);
        this.conn.send(JSON.stringify(clientMessage));
    }
    /**
       Close terminates the websocket connection.

       @experimental
     */
    close() {
        this.conn.close();
    }
}
// Converts an headers object to a "map" object as expected by the WebSocket
// constructor. We use this as the Auth interface works with Headers objects
// while the WebSocket constructor takes a map.
function headersToMap(headers) {
    const headerMap = {};
    headers.forEach((value, key) => {
        headerMap[key] = value;
    });
    return headerMap;
}
// Converts a "map" object to a headers object. We use this as the Auth
// interface works with Headers objects while the API client default headers
// returns a map.
function mapToHeaders(map) {
    const headers = new Headers();
    for (const [key, value] of Object.entries(map)) {
        headers.append(key, value);
    }
    return headers;
}


const CONTENT_TYPE_HEADER = 'Content-Type';
const USER_AGENT_HEADER = 'User-Agent';
const GOOGLE_API_CLIENT_HEADER = 'x-goog-api-client';
const SDK_VERSION = '0.1.0'; // x-release-please-version
const LIBRARY_LABEL = `google-genai-sdk/${SDK_VERSION}`;
const VERTEX_AI_API_DEFAULT_VERSION = 'v1beta1';
const GOOGLE_AI_API_DEFAULT_VERSION = 'v1beta';
const responseLineRE = /^data: (.*)(?:\n\n|\r\r|\r\n\r\n)/;
/**
 * Client errors raised by the GenAI API.
 */
class ClientError extends Error {
    constructor(message, stackTrace) {
        if (stackTrace) {
            super(message, { cause: stackTrace });
        }
        else {
            super(message, { cause: new Error().stack });
        }
        this.message = message;
        this.name = 'ClientError';
    }
}
/**
 * Server errors raised by the GenAI API.
 */
class ServerError extends Error {
    constructor(message, stackTrace) {
        if (stackTrace) {
            super(message, { cause: stackTrace });
        }
        else {
            super(message, { cause: new Error().stack });
        }
        this.message = message;
        this.name = 'ServerError';
    }
}
/**
 * The ApiClient class is used to send requests to the Gemini API or Vertex AI
 * endpoints.
 */
class ApiClient {
    constructor(opts) {
        var _a, _b;
        this.clientOptions = Object.assign(Object.assign({}, opts), { project: opts.project, location: opts.location, apiKey: opts.apiKey, vertexai: opts.vertexai });
        const initHttpOptions = {};
        if (this.clientOptions.vertexai) {
            initHttpOptions.apiVersion =
                (_a = this.clientOptions.apiVersion) !== null && _a !== void 0 ? _a : VERTEX_AI_API_DEFAULT_VERSION;
            initHttpOptions.baseUrl = `https://${this.clientOptions.location}-aiplatform.googleapis.com/`;
            this.clientOptions.apiKey = undefined; // unset API key.
        }
        else {
            initHttpOptions.apiVersion =
                (_b = this.clientOptions.apiVersion) !== null && _b !== void 0 ? _b : GOOGLE_AI_API_DEFAULT_VERSION;
            initHttpOptions.baseUrl = `https://generativelanguage.googleapis.com/`;
        }
        initHttpOptions.headers = this.getDefaultHeaders();
        this.clientOptions.httpOptions = initHttpOptions;
        if (opts.httpOptions) {
            this.clientOptions.httpOptions = this.patchHttpOptions(initHttpOptions, opts.httpOptions);
        }
    }
    isVertexAI() {
        var _a;
        return (_a = this.clientOptions.vertexai) !== null && _a !== void 0 ? _a : false;
    }
    getProject() {
        return this.clientOptions.project;
    }
    getLocation() {
        return this.clientOptions.location;
    }
    getApiVersion() {
        if (this.clientOptions.httpOptions &&
            this.clientOptions.httpOptions.apiVersion !== undefined) {
            return this.clientOptions.httpOptions.apiVersion;
        }
        throw new Error('API version is not set.');
    }
    getBaseUrl() {
        if (this.clientOptions.httpOptions &&
            this.clientOptions.httpOptions.baseUrl !== undefined) {
            return this.clientOptions.httpOptions.baseUrl;
        }
        throw new Error('Base URL is not set.');
    }
    getRequestUrl() {
        return this.getRequestUrlInternal(this.clientOptions.httpOptions);
    }
    getHeaders() {
        if (this.clientOptions.httpOptions &&
            this.clientOptions.httpOptions.headers !== undefined) {
            return this.clientOptions.httpOptions.headers;
        }
        else {
            throw new Error('Headers are not set.');
        }
    }
    getRequestUrlInternal(httpOptions) {
        if (!httpOptions ||
            httpOptions.baseUrl === undefined ||
            httpOptions.apiVersion === undefined) {
            throw new Error('HTTP options are not correctly set.');
        }
        if (!httpOptions.baseUrl.endsWith('/') && httpOptions.apiVersion) {
            return `${httpOptions.baseUrl}/${httpOptions.apiVersion}`;
        }
        return `${httpOptions.baseUrl}${httpOptions.apiVersion}`;
    }
    getBaseResourcePath() {
        return `projects/${this.clientOptions.project}/locations/${this.clientOptions.location}`;
    }
    getApiKey() {
        return this.clientOptions.apiKey;
    }
    getWebsocketBaseUrl() {
        const baseUrl = this.getBaseUrl();
        const urlParts = new URL(baseUrl);
        urlParts.protocol = 'wss';
        return urlParts.toString();
    }
    setBaseUrl(url) {
        if (this.clientOptions.httpOptions) {
            this.clientOptions.httpOptions.baseUrl = url;
        }
        else {
            throw new Error('HTTP options are not correctly set.');
        }
    }
    async request(request) {
        let patchedHttpOptions = this.clientOptions.httpOptions;
        if (request.httpOptions) {
            patchedHttpOptions = this.patchHttpOptions(this.clientOptions.httpOptions, request.httpOptions);
        }
        let path = request.path;
        if (this.clientOptions.vertexai && !path.startsWith('projects/')) {
            path = `${this.getBaseResourcePath()}/${path}`;
        }
        const url = new URL(`${this.getRequestUrlInternal(patchedHttpOptions)}/${path}`);
        if (request.queryParams) {
            for (const [key, value] of Object.entries(request.queryParams)) {
                url.searchParams.append(key, String(value));
            }
        }
        let requestInit = {};
        if (request.httpMethod === 'GET') {
            if (request.body && request.body !== '{}') {
                throw new Error(`Request body should be empty for GET request, but got: ${request.body}`);
            }
        }
        else {
            requestInit.body = request.body;
        }
        requestInit = await this.includeExtraHttpOptionsToRequestInit(requestInit, patchedHttpOptions);
        return this.unaryApiCall(url, requestInit, request.httpMethod);
    }
    patchHttpOptions(baseHttpOptions, requestHttpOptions) {
        const patchedHttpOptions = JSON.parse(JSON.stringify(baseHttpOptions));
        for (const [key, value] of Object.entries(requestHttpOptions)) {
            // Records compile to objects.
            if (typeof value === 'object') {
                // @ts-expect-error TS2345TS7053: Element implicitly has an 'any' type because
                // expression of type 'string' can't be used to index type
                // 'HttpOptions'.
                patchedHttpOptions[key] = Object.assign(Object.assign({}, patchedHttpOptions[key]), value);
            }
            else if (value !== undefined) {
                // @ts-expect-error TS2345TS7053: Element implicitly has an 'any' type because
                // expression of type 'string' can't be used to index type
                // 'HttpOptions'.
                patchedHttpOptions[key] = value;
            }
        }
        return patchedHttpOptions;
    }
    async requestStream(request) {
        let patchedHttpOptions = this.clientOptions.httpOptions;
        if (request.httpOptions) {
            patchedHttpOptions = this.patchHttpOptions(this.clientOptions.httpOptions, request.httpOptions);
        }
        let path = request.path;
        if (this.clientOptions.vertexai && !path.startsWith('projects/')) {
            path = `${this.getBaseResourcePath()}/${path}`;
        }
        const url = new URL(`${this.getRequestUrlInternal(patchedHttpOptions)}/${path}`);
        if (!url.searchParams.has('alt') || url.searchParams.get('alt') !== 'sse') {
            url.searchParams.set('alt', 'sse');
        }
        let requestInit = {};
        requestInit.body = request.body;
        requestInit = await this.includeExtraHttpOptionsToRequestInit(requestInit, patchedHttpOptions);
        return this.streamApiCall(url, requestInit, request.httpMethod);
    }
    async includeExtraHttpOptionsToRequestInit(requestInit, httpOptions) {
        if (httpOptions && httpOptions.timeout && httpOptions.timeout > 0) {
            const abortController = new AbortController();
            const signal = abortController.signal;
            setTimeout(() => abortController.abort(), httpOptions.timeout);
            requestInit.signal = signal;
        }
        requestInit.headers = await this.getHeadersInternal(httpOptions);
        return requestInit;
    }
    async unaryApiCall(url, requestInit, httpMethod) {
        return this.apiCall(url.toString(), Object.assign(Object.assign({}, requestInit), { method: httpMethod }))
            .then(async (response) => {
            await throwErrorIfNotOK(response, url.toString(), requestInit);
            return new HttpResponse(response);
        })
            .catch((e) => {
            if (e instanceof Error) {
                throw e;
            }
            else {
                throw new Error(JSON.stringify(e));
            }
        });
    }
    async streamApiCall(url, requestInit, httpMethod) {
        return this.apiCall(url.toString(), Object.assign(Object.assign({}, requestInit), { method: httpMethod }))
            .then(async (response) => {
            await throwErrorIfNotOK(response, url.toString(), requestInit);
            return this.processStreamResponse(response);
        })
            .catch((e) => {
            if (e instanceof Error) {
                throw e;
            }
            else {
                throw new Error(JSON.stringify(e));
            }
        });
    }
    processStreamResponse(response) {
        var _a;
        return __asyncGenerator(this, arguments, function* processStreamResponse_1() {
            const reader = (_a = response === null || response === void 0 ? void 0 : response.body) === null || _a === void 0 ? void 0 : _a.getReader();
            const decoder = new TextDecoder('utf-8');
            if (!reader) {
                throw new Error('Response body is empty');
            }
            try {
                let buffer = '';
                while (true) {
                    const { done, value } = yield __await(reader.read());
                    if (done) {
                        if (buffer.trim().length > 0) {
                            throw new Error(`Incomplete JSON segment at the end: ${buffer}`);
                        }
                        break;
                    }
                    const chunkString = decoder.decode(value);
                    buffer += chunkString;
                    let match = buffer.match(responseLineRE);
                    while (match) {
                        const processedChunkString = match[1];
                        try {
                            const chunkData = JSON.parse(processedChunkString);
                            yield yield __await(chunkData);
                            buffer = buffer.slice(match[0].length);
                            match = buffer.match(responseLineRE);
                        }
                        catch (e) {
                            throw new Error(`exception parsing stream chunk ${processedChunkString}. ${e}`);
                        }
                    }
                }
            }
            finally {
                reader.releaseLock();
            }
        });
    }
    async apiCall(url, requestInit) {
        return fetch(url, requestInit).catch((e) => {
            throw new Error(`exception ${e} sending request to url: ${url} with requestInit: ${JSON.stringify(requestInit)}}`);
        });
    }
    getDefaultHeaders() {
        const headers = {};
        const versionHeaderValue = LIBRARY_LABEL + ' ' + this.clientOptions.userAgentExtra;
        headers[USER_AGENT_HEADER] = versionHeaderValue;
        headers[GOOGLE_API_CLIENT_HEADER] = versionHeaderValue;
        headers[CONTENT_TYPE_HEADER] = 'application/json';
        return headers;
    }
    async getHeadersInternal(httpOptions) {
        const headers = new Headers();
        if (httpOptions && httpOptions.headers) {
            for (const [key, value] of Object.entries(httpOptions.headers)) {
                headers.append(key, value);
            }
        }
        await this.clientOptions.auth.addAuthHeaders(headers);
        return headers;
    }
}
async function throwErrorIfNotOK(response, url, requestInit) {
    var _a;
    if (response === undefined) {
        throw new ServerError('response is undefined');
    }
    if (!response.ok) {
        const status = response.status;
        const statusText = response.statusText;
        let errorBody;
        if ((_a = response.headers.get('content-type')) === null || _a === void 0 ? void 0 : _a.includes('application/json')) {
            errorBody = await response.json();
        }
        else {
            errorBody = {
                error: {
                    message: `exception parsing response from url: ${url} with requestInit: ${JSON.stringify(requestInit)}}`,
                    code: response.status,
                    status: response.statusText,
                },
            };
        }
        const errorMessage = `got status: ${status} ${statusText}. ${JSON.stringify(errorBody)}`;
        if (status >= 400 && status < 500) {
            const clientError = new ClientError(errorMessage);
            throw clientError;
        }
        else if (status >= 500 && status < 600) {
            const serverError = new ServerError(errorMessage);
            throw serverError;
        }
        throw new Error(errorMessage);
    }
}

class BrowserWebSocketFactory {
    create(url, headers, callbacks) {
        return new BrowserWebSocket(url, headers, callbacks);
    }
}
class BrowserWebSocket {
    constructor(url, headers, callbacks) {
        this.url = url;
        this.headers = headers;
        this.callbacks = callbacks;
    }
    connect() {
        this.ws = new WebSocket(this.url);
        this.ws.onopen = this.callbacks.onopen;
        this.ws.onerror = this.callbacks.onerror;
        this.ws.onclose = this.callbacks.onclose;
        this.ws.onmessage = this.callbacks.onmessage;
    }
    send(message) {
        if (this.ws === undefined) {
            throw new Error('WebSocket is not connected');
        }
        this.ws.send(message);
    }
    close() {
        if (this.ws === undefined) {
            throw new Error('WebSocket is not connected');
        }
        this.ws.close();
    }
    setOnMessageCallback(callback) {
        if (this.ws === undefined) {
            throw new Error('WebSocket is not connected');
        }
        this.ws.onmessage = callback;
    }
}

const GOOGLE_API_KEY_HEADER = 'x-goog-api-key';
// TODO(b/395122533): We need a secure client side authentication mechanism.
class WebAuth {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    async addAuthHeaders(headers) {
        if (headers.get(GOOGLE_API_KEY_HEADER) !== null) {
            return;
        }
        headers.append(GOOGLE_API_KEY_HEADER, this.apiKey);
    }
}


class Files extends BaseModule {
    constructor(apiClient) {
        super();
        this.apiClient = apiClient;
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
        this.list = async (params = {}) => {
            return new Pager(PagedItem.PAGED_ITEM_FILES, this.listInternal, await this.listInternal(params), params.config);
        };
    }
    async listInternal(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = listFilesParametersToVertex(this.apiClient, params);
            path = formatMap('None', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'GET',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = listFilesResponseFromVertex(this.apiClient);
                const typedResp = new ListFilesResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
        else {
            const body = listFilesParametersToMldev(this.apiClient, params);
            path = formatMap('files', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'GET',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = listFilesResponseFromMldev(this.apiClient, apiResponse);
                const typedResp = new ListFilesResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
    async createInternal(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = createFileParametersToVertex(this.apiClient, params);
            path = formatMap('', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = createFileResponseFromVertex(this.apiClient, apiResponse);
                const typedResp = new CreateFileResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
        else {
            const body = createFileParametersToMldev(this.apiClient, params);
            path = formatMap('upload/v1beta/files', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = createFileResponseFromMldev(this.apiClient, apiResponse);
                const typedResp = new CreateFileResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
    async get(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = getFileParametersToVertex(this.apiClient, params);
            path = formatMap('None', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'GET',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = fileFromVertex(this.apiClient);
                return resp;
            });
        }
        else {
            const body = getFileParametersToMldev(this.apiClient, params);
            path = formatMap('files/{file}', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'GET',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = fileFromMldev(this.apiClient, apiResponse);
                return resp;
            });
        }
    }
}
function listFilesConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromPageSize = getValueByPath(fromObject, ['pageSize']);
    if (parentObject !== undefined &&
        fromPageSize !== undefined &&
        fromPageSize !== null) {
        setValueByPath(parentObject, ['_query', 'pageSize'], fromPageSize);
    }
    const fromPageToken = getValueByPath(fromObject, ['pageToken']);
    if (parentObject !== undefined &&
        fromPageToken !== undefined &&
        fromPageToken !== null) {
        setValueByPath(parentObject, ['_query', 'pageToken'], fromPageToken);
    }
    return toObject;
}
function listFilesParametersToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], listFilesConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function listFilesParametersToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ['config']) !== undefined) {
        throw new Error('config parameter is not supported in Vertex AI.');
    }
    return toObject;
}
function fileStatusToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromDetails = getValueByPath(fromObject, ['details']);
    if (fromDetails !== undefined && fromDetails !== null) {
        setValueByPath(toObject, ['details'], fromDetails);
    }
    const fromMessage = getValueByPath(fromObject, ['message']);
    if (fromMessage !== undefined && fromMessage !== null) {
        setValueByPath(toObject, ['message'], fromMessage);
    }
    const fromCode = getValueByPath(fromObject, ['code']);
    if (fromCode !== undefined && fromCode !== null) {
        setValueByPath(toObject, ['code'], fromCode);
    }
    return toObject;
}
function fileToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['name'], fromName);
    }
    const fromDisplayName = getValueByPath(fromObject, ['displayName']);
    if (fromDisplayName !== undefined && fromDisplayName !== null) {
        setValueByPath(toObject, ['displayName'], fromDisplayName);
    }
    const fromMimeType = getValueByPath(fromObject, ['mimeType']);
    if (fromMimeType !== undefined && fromMimeType !== null) {
        setValueByPath(toObject, ['mimeType'], fromMimeType);
    }
    const fromSizeBytes = getValueByPath(fromObject, ['sizeBytes']);
    if (fromSizeBytes !== undefined && fromSizeBytes !== null) {
        setValueByPath(toObject, ['sizeBytes'], fromSizeBytes);
    }
    const fromCreateTime = getValueByPath(fromObject, ['createTime']);
    if (fromCreateTime !== undefined && fromCreateTime !== null) {
        setValueByPath(toObject, ['createTime'], fromCreateTime);
    }
    const fromExpirationTime = getValueByPath(fromObject, [
        'expirationTime',
    ]);
    if (fromExpirationTime !== undefined && fromExpirationTime !== null) {
        setValueByPath(toObject, ['expirationTime'], fromExpirationTime);
    }
    const fromUpdateTime = getValueByPath(fromObject, ['updateTime']);
    if (fromUpdateTime !== undefined && fromUpdateTime !== null) {
        setValueByPath(toObject, ['updateTime'], fromUpdateTime);
    }
    const fromSha256Hash = getValueByPath(fromObject, ['sha256Hash']);
    if (fromSha256Hash !== undefined && fromSha256Hash !== null) {
        setValueByPath(toObject, ['sha256Hash'], fromSha256Hash);
    }
    const fromUri = getValueByPath(fromObject, ['uri']);
    if (fromUri !== undefined && fromUri !== null) {
        setValueByPath(toObject, ['uri'], fromUri);
    }
    const fromDownloadUri = getValueByPath(fromObject, ['downloadUri']);
    if (fromDownloadUri !== undefined && fromDownloadUri !== null) {
        setValueByPath(toObject, ['downloadUri'], fromDownloadUri);
    }
    const fromState = getValueByPath(fromObject, ['state']);
    if (fromState !== undefined && fromState !== null) {
        setValueByPath(toObject, ['state'], fromState);
    }
    const fromSource = getValueByPath(fromObject, ['source']);
    if (fromSource !== undefined && fromSource !== null) {
        setValueByPath(toObject, ['source'], fromSource);
    }
    const fromVideoMetadata = getValueByPath(fromObject, [
        'videoMetadata',
    ]);
    if (fromVideoMetadata !== undefined && fromVideoMetadata !== null) {
        setValueByPath(toObject, ['videoMetadata'], fromVideoMetadata);
    }
    const fromError = getValueByPath(fromObject, ['error']);
    if (fromError !== undefined && fromError !== null) {
        setValueByPath(toObject, ['error'], fileStatusToMldev(apiClient, fromError));
    }
    return toObject;
}
function createFileParametersToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromFile = getValueByPath(fromObject, ['file']);
    if (fromFile !== undefined && fromFile !== null) {
        setValueByPath(toObject, ['file'], fileToMldev(apiClient, fromFile));
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], fromConfig);
    }
    return toObject;
}
function createFileParametersToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ['file']) !== undefined) {
        throw new Error('file parameter is not supported in Vertex AI.');
    }
    if (getValueByPath(fromObject, ['config']) !== undefined) {
        throw new Error('config parameter is not supported in Vertex AI.');
    }
    return toObject;
}
function getFileParametersToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['_url', 'file'], tFileName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], fromConfig);
    }
    return toObject;
}
function getFileParametersToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ['name']) !== undefined) {
        throw new Error('name parameter is not supported in Vertex AI.');
    }
    if (getValueByPath(fromObject, ['config']) !== undefined) {
        throw new Error('config parameter is not supported in Vertex AI.');
    }
    return toObject;
}
function fileStatusFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromDetails = getValueByPath(fromObject, ['details']);
    if (fromDetails !== undefined && fromDetails !== null) {
        setValueByPath(toObject, ['details'], fromDetails);
    }
    const fromMessage = getValueByPath(fromObject, ['message']);
    if (fromMessage !== undefined && fromMessage !== null) {
        setValueByPath(toObject, ['message'], fromMessage);
    }
    const fromCode = getValueByPath(fromObject, ['code']);
    if (fromCode !== undefined && fromCode !== null) {
        setValueByPath(toObject, ['code'], fromCode);
    }
    return toObject;
}
function fileFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['name'], fromName);
    }
    const fromDisplayName = getValueByPath(fromObject, ['displayName']);
    if (fromDisplayName !== undefined && fromDisplayName !== null) {
        setValueByPath(toObject, ['displayName'], fromDisplayName);
    }
    const fromMimeType = getValueByPath(fromObject, ['mimeType']);
    if (fromMimeType !== undefined && fromMimeType !== null) {
        setValueByPath(toObject, ['mimeType'], fromMimeType);
    }
    const fromSizeBytes = getValueByPath(fromObject, ['sizeBytes']);
    if (fromSizeBytes !== undefined && fromSizeBytes !== null) {
        setValueByPath(toObject, ['sizeBytes'], fromSizeBytes);
    }
    const fromCreateTime = getValueByPath(fromObject, ['createTime']);
    if (fromCreateTime !== undefined && fromCreateTime !== null) {
        setValueByPath(toObject, ['createTime'], fromCreateTime);
    }
    const fromExpirationTime = getValueByPath(fromObject, [
        'expirationTime',
    ]);
    if (fromExpirationTime !== undefined && fromExpirationTime !== null) {
        setValueByPath(toObject, ['expirationTime'], fromExpirationTime);
    }
    const fromUpdateTime = getValueByPath(fromObject, ['updateTime']);
    if (fromUpdateTime !== undefined && fromUpdateTime !== null) {
        setValueByPath(toObject, ['updateTime'], fromUpdateTime);
    }
    const fromSha256Hash = getValueByPath(fromObject, ['sha256Hash']);
    if (fromSha256Hash !== undefined && fromSha256Hash !== null) {
        setValueByPath(toObject, ['sha256Hash'], fromSha256Hash);
    }
    const fromUri = getValueByPath(fromObject, ['uri']);
    if (fromUri !== undefined && fromUri !== null) {
        setValueByPath(toObject, ['uri'], fromUri);
    }
    const fromDownloadUri = getValueByPath(fromObject, ['downloadUri']);
    if (fromDownloadUri !== undefined && fromDownloadUri !== null) {
        setValueByPath(toObject, ['downloadUri'], fromDownloadUri);
    }
    const fromState = getValueByPath(fromObject, ['state']);
    if (fromState !== undefined && fromState !== null) {
        setValueByPath(toObject, ['state'], fromState);
    }
    const fromSource = getValueByPath(fromObject, ['source']);
    if (fromSource !== undefined && fromSource !== null) {
        setValueByPath(toObject, ['source'], fromSource);
    }
    const fromVideoMetadata = getValueByPath(fromObject, [
        'videoMetadata',
    ]);
    if (fromVideoMetadata !== undefined && fromVideoMetadata !== null) {
        setValueByPath(toObject, ['videoMetadata'], fromVideoMetadata);
    }
    const fromError = getValueByPath(fromObject, ['error']);
    if (fromError !== undefined && fromError !== null) {
        setValueByPath(toObject, ['error'], fileStatusFromMldev(apiClient, fromError));
    }
    return toObject;
}
function fileFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    return toObject;
}
function listFilesResponseFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromNextPageToken = getValueByPath(fromObject, [
        'nextPageToken',
    ]);
    if (fromNextPageToken !== undefined && fromNextPageToken !== null) {
        setValueByPath(toObject, ['nextPageToken'], fromNextPageToken);
    }
    const fromFiles = getValueByPath(fromObject, ['files']);
    if (fromFiles !== undefined && fromFiles !== null) {
        if (Array.isArray(fromFiles)) {
            setValueByPath(toObject, ['files'], fromFiles.map((item) => {
                return fileFromMldev(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['files'], fromFiles);
        }
    }
    return toObject;
}
function listFilesResponseFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    return toObject;
}
function createFileResponseFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromHttpHeaders = getValueByPath(fromObject, ['httpHeaders']);
    if (fromHttpHeaders !== undefined && fromHttpHeaders !== null) {
        setValueByPath(toObject, ['httpHeaders'], fromHttpHeaders);
    }
    return toObject;
}
function createFileResponseFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromHttpHeaders = getValueByPath(fromObject, ['httpHeaders']);
    if (fromHttpHeaders !== undefined && fromHttpHeaders !== null) {
        setValueByPath(toObject, ['httpHeaders'], fromHttpHeaders);
    }
    return toObject;
}


class Tunings extends BaseModule {
    constructor(apiClient) {
        super();
        this.apiClient = apiClient;
        /**
         * Gets a TuningJob.
         *
         * @param name - The resource name of the tuning job.
         * @return - A TuningJob object.
         *
         * @experimental - The SDK's tuning implementation is experimental, and may
         * change in future versions.
         */
        this.get = async (params) => {
            return await this.getInternal(params);
        };
        /**
         * Lists tuning jobs.
         *
         * @param config - The configuration for the list request.
         * @return - A list of tuning jobs.
         *
         * @experimental - The SDK's tuning implementation is experimental, and may
         * change in future versions.
         */
        this.list = async (params = {}) => {
            return new Pager(PagedItem.PAGED_ITEM_TUNING_JOBS, this.listInternal, await this.listInternal(params), params.config);
        };
        /**
         * Creates a supervised fine-tuning job.
         *
         * @param params - The parameters for the tuning job.
         * @return - A TuningJob operation.
         *
         * @experimental - The SDK's tuning implementation is experimental, and may
         * change in future versions.
         */
        this.tune = async (params) => {
            if (this.apiClient.isVertexAI()) {
                return await this.tuneInternal(params);
            }
            else {
                const operation = await this.tuneMldevInternal(params);
                let tunedModelName = '';
                if (operation['metadata'] !== undefined &&
                    operation['metadata']['tunedModel'] !== undefined) {
                    tunedModelName = operation['metadata']['tunedModel'];
                }
                else if (operation['name'] !== undefined &&
                    operation['name'].includes('/operations/')) {
                    tunedModelName = operation['name'].split('/operations/')[0];
                }
                const tuningJob = {
                    name: tunedModelName,
                    state: JobState.JOB_STATE_QUEUED,
                };
                return tuningJob;
            }
        };
    }
    async getInternal(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = getTuningJobParametersToVertex(this.apiClient, params);
            path = formatMap('{name}', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'GET',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = tuningJobFromVertex(this.apiClient, apiResponse);
                return resp;
            });
        }
        else {
            const body = getTuningJobParametersToMldev(this.apiClient, params);
            path = formatMap('{name}', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'GET',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = tuningJobFromMldev(this.apiClient, apiResponse);
                return resp;
            });
        }
    }
    async listInternal(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = listTuningJobsParametersToVertex(this.apiClient, params);
            path = formatMap('tuningJobs', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'GET',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = listTuningJobsResponseFromVertex(this.apiClient, apiResponse);
                const typedResp = new ListTuningJobsResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
        else {
            const body = listTuningJobsParametersToMldev(this.apiClient, params);
            path = formatMap('tunedModels', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'GET',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = listTuningJobsResponseFromMldev(this.apiClient, apiResponse);
                const typedResp = new ListTuningJobsResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
    async tuneInternal(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = createTuningJobParametersToVertex(this.apiClient, params);
            path = formatMap('tuningJobs', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = tuningJobFromVertex(this.apiClient, apiResponse);
                return resp;
            });
        }
        else {
            const body = createTuningJobParametersToMldev(this.apiClient, params);
            path = formatMap('None', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = tuningJobFromMldev(this.apiClient, apiResponse);
                return resp;
            });
        }
    }
    async tuneMldevInternal(params) {
        var _a, _b;
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = createTuningJobParametersToVertex(this.apiClient, params);
            path = formatMap('None', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_a = params.config) === null || _a === void 0 ? void 0 : _a.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = operationFromVertex(this.apiClient, apiResponse);
                return resp;
            });
        }
        else {
            const body = createTuningJobParametersToMldev(this.apiClient, params);
            path = formatMap('tunedModels', body['_url']);
            queryParams = body['_query'];
            delete body['config'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((apiResponse) => {
                const resp = operationFromMldev(this.apiClient, apiResponse);
                return resp;
            });
        }
    }
}
function getTuningJobParametersToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['_url', 'name'], fromName);
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], fromConfig);
    }
    return toObject;
}
function getTuningJobParametersToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['_url', 'name'], fromName);
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], fromConfig);
    }
    return toObject;
}
function listTuningJobsConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromPageSize = getValueByPath(fromObject, ['pageSize']);
    if (parentObject !== undefined &&
        fromPageSize !== undefined &&
        fromPageSize !== null) {
        setValueByPath(parentObject, ['_query', 'pageSize'], fromPageSize);
    }
    const fromPageToken = getValueByPath(fromObject, ['pageToken']);
    if (parentObject !== undefined &&
        fromPageToken !== undefined &&
        fromPageToken !== null) {
        setValueByPath(parentObject, ['_query', 'pageToken'], fromPageToken);
    }
    const fromFilter = getValueByPath(fromObject, ['filter']);
    if (parentObject !== undefined &&
        fromFilter !== undefined &&
        fromFilter !== null) {
        setValueByPath(parentObject, ['_query', 'filter'], fromFilter);
    }
    return toObject;
}
function listTuningJobsConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromPageSize = getValueByPath(fromObject, ['pageSize']);
    if (parentObject !== undefined &&
        fromPageSize !== undefined &&
        fromPageSize !== null) {
        setValueByPath(parentObject, ['_query', 'pageSize'], fromPageSize);
    }
    const fromPageToken = getValueByPath(fromObject, ['pageToken']);
    if (parentObject !== undefined &&
        fromPageToken !== undefined &&
        fromPageToken !== null) {
        setValueByPath(parentObject, ['_query', 'pageToken'], fromPageToken);
    }
    const fromFilter = getValueByPath(fromObject, ['filter']);
    if (parentObject !== undefined &&
        fromFilter !== undefined &&
        fromFilter !== null) {
        setValueByPath(parentObject, ['_query', 'filter'], fromFilter);
    }
    return toObject;
}
function listTuningJobsParametersToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], listTuningJobsConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function listTuningJobsParametersToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], listTuningJobsConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function tuningExampleToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTextInput = getValueByPath(fromObject, ['textInput']);
    if (fromTextInput !== undefined && fromTextInput !== null) {
        setValueByPath(toObject, ['textInput'], fromTextInput);
    }
    const fromOutput = getValueByPath(fromObject, ['output']);
    if (fromOutput !== undefined && fromOutput !== null) {
        setValueByPath(toObject, ['output'], fromOutput);
    }
    return toObject;
}
function tuningDatasetToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ['gcsUri']) !== undefined) {
        throw new Error('gcsUri parameter is not supported in Gemini API.');
    }
    const fromExamples = getValueByPath(fromObject, ['examples']);
    if (fromExamples !== undefined && fromExamples !== null) {
        if (Array.isArray(fromExamples)) {
            setValueByPath(toObject, ['examples', 'examples'], fromExamples.map((item) => {
                return tuningExampleToMldev(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['examples', 'examples'], fromExamples);
        }
    }
    return toObject;
}
function tuningDatasetToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromGcsUri = getValueByPath(fromObject, ['gcsUri']);
    if (parentObject !== undefined &&
        fromGcsUri !== undefined &&
        fromGcsUri !== null) {
        setValueByPath(parentObject, ['supervisedTuningSpec', 'trainingDatasetUri'], fromGcsUri);
    }
    if (getValueByPath(fromObject, ['examples']) !== undefined) {
        throw new Error('examples parameter is not supported in Vertex AI.');
    }
    return toObject;
}
function tuningValidationDatasetToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromGcsUri = getValueByPath(fromObject, ['gcsUri']);
    if (fromGcsUri !== undefined && fromGcsUri !== null) {
        setValueByPath(toObject, ['validationDatasetUri'], fromGcsUri);
    }
    return toObject;
}
function createTuningJobConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ['validationDataset']) !== undefined) {
        throw new Error('validationDataset parameter is not supported in Gemini API.');
    }
    const fromTunedModelDisplayName = getValueByPath(fromObject, [
        'tunedModelDisplayName',
    ]);
    if (parentObject !== undefined &&
        fromTunedModelDisplayName !== undefined &&
        fromTunedModelDisplayName !== null) {
        setValueByPath(parentObject, ['displayName'], fromTunedModelDisplayName);
    }
    if (getValueByPath(fromObject, ['description']) !== undefined) {
        throw new Error('description parameter is not supported in Gemini API.');
    }
    const fromEpochCount = getValueByPath(fromObject, ['epochCount']);
    if (parentObject !== undefined &&
        fromEpochCount !== undefined &&
        fromEpochCount !== null) {
        setValueByPath(parentObject, ['tuningTask', 'hyperparameters', 'epochCount'], fromEpochCount);
    }
    const fromLearningRateMultiplier = getValueByPath(fromObject, [
        'learningRateMultiplier',
    ]);
    if (fromLearningRateMultiplier !== undefined &&
        fromLearningRateMultiplier !== null) {
        setValueByPath(toObject, ['tuningTask', 'hyperparameters', 'learningRateMultiplier'], fromLearningRateMultiplier);
    }
    if (getValueByPath(fromObject, ['adapterSize']) !== undefined) {
        throw new Error('adapterSize parameter is not supported in Gemini API.');
    }
    const fromBatchSize = getValueByPath(fromObject, ['batchSize']);
    if (parentObject !== undefined &&
        fromBatchSize !== undefined &&
        fromBatchSize !== null) {
        setValueByPath(parentObject, ['tuningTask', 'hyperparameters', 'batchSize'], fromBatchSize);
    }
    const fromLearningRate = getValueByPath(fromObject, ['learningRate']);
    if (parentObject !== undefined &&
        fromLearningRate !== undefined &&
        fromLearningRate !== null) {
        setValueByPath(parentObject, ['tuningTask', 'hyperparameters', 'learningRate'], fromLearningRate);
    }
    return toObject;
}
function createTuningJobConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromValidationDataset = getValueByPath(fromObject, [
        'validationDataset',
    ]);
    if (parentObject !== undefined &&
        fromValidationDataset !== undefined &&
        fromValidationDataset !== null) {
        setValueByPath(parentObject, ['supervisedTuningSpec'], tuningValidationDatasetToVertex(apiClient, fromValidationDataset));
    }
    const fromTunedModelDisplayName = getValueByPath(fromObject, [
        'tunedModelDisplayName',
    ]);
    if (parentObject !== undefined &&
        fromTunedModelDisplayName !== undefined &&
        fromTunedModelDisplayName !== null) {
        setValueByPath(parentObject, ['tunedModelDisplayName'], fromTunedModelDisplayName);
    }
    const fromDescription = getValueByPath(fromObject, ['description']);
    if (parentObject !== undefined &&
        fromDescription !== undefined &&
        fromDescription !== null) {
        setValueByPath(parentObject, ['description'], fromDescription);
    }
    const fromEpochCount = getValueByPath(fromObject, ['epochCount']);
    if (parentObject !== undefined &&
        fromEpochCount !== undefined &&
        fromEpochCount !== null) {
        setValueByPath(parentObject, ['supervisedTuningSpec', 'hyperParameters', 'epochCount'], fromEpochCount);
    }
    const fromLearningRateMultiplier = getValueByPath(fromObject, [
        'learningRateMultiplier',
    ]);
    if (fromLearningRateMultiplier !== undefined &&
        fromLearningRateMultiplier !== null) {
        setValueByPath(toObject, ['supervisedTuningSpec', 'hyperParameters', 'learningRateMultiplier'], fromLearningRateMultiplier);
    }
    const fromAdapterSize = getValueByPath(fromObject, ['adapterSize']);
    if (parentObject !== undefined &&
        fromAdapterSize !== undefined &&
        fromAdapterSize !== null) {
        setValueByPath(parentObject, ['supervisedTuningSpec', 'hyperParameters', 'adapterSize'], fromAdapterSize);
    }
    if (getValueByPath(fromObject, ['batchSize']) !== undefined) {
        throw new Error('batchSize parameter is not supported in Vertex AI.');
    }
    if (getValueByPath(fromObject, ['learningRate']) !== undefined) {
        throw new Error('learningRate parameter is not supported in Vertex AI.');
    }
    return toObject;
}
function createTuningJobParametersToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromBaseModel = getValueByPath(fromObject, ['baseModel']);
    if (fromBaseModel !== undefined && fromBaseModel !== null) {
        setValueByPath(toObject, ['baseModel'], fromBaseModel);
    }
    const fromTrainingDataset = getValueByPath(fromObject, [
        'trainingDataset',
    ]);
    if (fromTrainingDataset !== undefined && fromTrainingDataset !== null) {
        setValueByPath(toObject, ['tuningTask', 'trainingData'], tuningDatasetToMldev(apiClient, fromTrainingDataset));
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], createTuningJobConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function createTuningJobParametersToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromBaseModel = getValueByPath(fromObject, ['baseModel']);
    if (fromBaseModel !== undefined && fromBaseModel !== null) {
        setValueByPath(toObject, ['baseModel'], fromBaseModel);
    }
    const fromTrainingDataset = getValueByPath(fromObject, [
        'trainingDataset',
    ]);
    if (fromTrainingDataset !== undefined && fromTrainingDataset !== null) {
        setValueByPath(toObject, ['supervisedTuningSpec', 'trainingDatasetUri'], tuningDatasetToVertex(apiClient, fromTrainingDataset, toObject));
    }
    const fromConfig = getValueByPath(fromObject, ['config']);
    if (fromConfig !== undefined && fromConfig !== null) {
        setValueByPath(toObject, ['config'], createTuningJobConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
}
function tunedModelFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ['name']);
    if (fromModel !== undefined && fromModel !== null) {
        setValueByPath(toObject, ['model'], fromModel);
    }
    const fromEndpoint = getValueByPath(fromObject, ['name']);
    if (fromEndpoint !== undefined && fromEndpoint !== null) {
        setValueByPath(toObject, ['endpoint'], fromEndpoint);
    }
    return toObject;
}
function tunedModelFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ['model']);
    if (fromModel !== undefined && fromModel !== null) {
        setValueByPath(toObject, ['model'], fromModel);
    }
    const fromEndpoint = getValueByPath(fromObject, ['endpoint']);
    if (fromEndpoint !== undefined && fromEndpoint !== null) {
        setValueByPath(toObject, ['endpoint'], fromEndpoint);
    }
    return toObject;
}
function tuningJobFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['name'], fromName);
    }
    const fromState = getValueByPath(fromObject, ['state']);
    if (fromState !== undefined && fromState !== null) {
        setValueByPath(toObject, ['state'], tTuningJobStatus(apiClient, fromState));
    }
    const fromCreateTime = getValueByPath(fromObject, ['createTime']);
    if (fromCreateTime !== undefined && fromCreateTime !== null) {
        setValueByPath(toObject, ['createTime'], fromCreateTime);
    }
    const fromStartTime = getValueByPath(fromObject, [
        'tuningTask',
        'startTime',
    ]);
    if (fromStartTime !== undefined && fromStartTime !== null) {
        setValueByPath(toObject, ['startTime'], fromStartTime);
    }
    const fromEndTime = getValueByPath(fromObject, [
        'tuningTask',
        'completeTime',
    ]);
    if (fromEndTime !== undefined && fromEndTime !== null) {
        setValueByPath(toObject, ['endTime'], fromEndTime);
    }
    const fromUpdateTime = getValueByPath(fromObject, ['updateTime']);
    if (fromUpdateTime !== undefined && fromUpdateTime !== null) {
        setValueByPath(toObject, ['updateTime'], fromUpdateTime);
    }
    const fromDescription = getValueByPath(fromObject, ['description']);
    if (fromDescription !== undefined && fromDescription !== null) {
        setValueByPath(toObject, ['description'], fromDescription);
    }
    const fromBaseModel = getValueByPath(fromObject, ['baseModel']);
    if (fromBaseModel !== undefined && fromBaseModel !== null) {
        setValueByPath(toObject, ['baseModel'], fromBaseModel);
    }
    const fromTunedModel = getValueByPath(fromObject, ['_self']);
    if (fromTunedModel !== undefined && fromTunedModel !== null) {
        setValueByPath(toObject, ['tunedModel'], tunedModelFromMldev(apiClient, fromTunedModel));
    }
    const fromDistillationSpec = getValueByPath(fromObject, [
        'distillationSpec',
    ]);
    if (fromDistillationSpec !== undefined && fromDistillationSpec !== null) {
        setValueByPath(toObject, ['distillationSpec'], fromDistillationSpec);
    }
    const fromExperiment = getValueByPath(fromObject, ['experiment']);
    if (fromExperiment !== undefined && fromExperiment !== null) {
        setValueByPath(toObject, ['experiment'], fromExperiment);
    }
    const fromLabels = getValueByPath(fromObject, ['labels']);
    if (fromLabels !== undefined && fromLabels !== null) {
        setValueByPath(toObject, ['labels'], fromLabels);
    }
    const fromPipelineJob = getValueByPath(fromObject, ['pipelineJob']);
    if (fromPipelineJob !== undefined && fromPipelineJob !== null) {
        setValueByPath(toObject, ['pipelineJob'], fromPipelineJob);
    }
    const fromTunedModelDisplayName = getValueByPath(fromObject, [
        'tunedModelDisplayName',
    ]);
    if (fromTunedModelDisplayName !== undefined &&
        fromTunedModelDisplayName !== null) {
        setValueByPath(toObject, ['tunedModelDisplayName'], fromTunedModelDisplayName);
    }
    return toObject;
}
function tuningJobFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['name'], fromName);
    }
    const fromState = getValueByPath(fromObject, ['state']);
    if (fromState !== undefined && fromState !== null) {
        setValueByPath(toObject, ['state'], tTuningJobStatus(apiClient, fromState));
    }
    const fromCreateTime = getValueByPath(fromObject, ['createTime']);
    if (fromCreateTime !== undefined && fromCreateTime !== null) {
        setValueByPath(toObject, ['createTime'], fromCreateTime);
    }
    const fromStartTime = getValueByPath(fromObject, ['startTime']);
    if (fromStartTime !== undefined && fromStartTime !== null) {
        setValueByPath(toObject, ['startTime'], fromStartTime);
    }
    const fromEndTime = getValueByPath(fromObject, ['endTime']);
    if (fromEndTime !== undefined && fromEndTime !== null) {
        setValueByPath(toObject, ['endTime'], fromEndTime);
    }
    const fromUpdateTime = getValueByPath(fromObject, ['updateTime']);
    if (fromUpdateTime !== undefined && fromUpdateTime !== null) {
        setValueByPath(toObject, ['updateTime'], fromUpdateTime);
    }
    const fromError = getValueByPath(fromObject, ['error']);
    if (fromError !== undefined && fromError !== null) {
        setValueByPath(toObject, ['error'], fromError);
    }
    const fromDescription = getValueByPath(fromObject, ['description']);
    if (fromDescription !== undefined && fromDescription !== null) {
        setValueByPath(toObject, ['description'], fromDescription);
    }
    const fromBaseModel = getValueByPath(fromObject, ['baseModel']);
    if (fromBaseModel !== undefined && fromBaseModel !== null) {
        setValueByPath(toObject, ['baseModel'], fromBaseModel);
    }
    const fromTunedModel = getValueByPath(fromObject, ['tunedModel']);
    if (fromTunedModel !== undefined && fromTunedModel !== null) {
        setValueByPath(toObject, ['tunedModel'], tunedModelFromVertex(apiClient, fromTunedModel));
    }
    const fromSupervisedTuningSpec = getValueByPath(fromObject, [
        'supervisedTuningSpec',
    ]);
    if (fromSupervisedTuningSpec !== undefined &&
        fromSupervisedTuningSpec !== null) {
        setValueByPath(toObject, ['supervisedTuningSpec'], fromSupervisedTuningSpec);
    }
    const fromTuningDataStats = getValueByPath(fromObject, [
        'tuningDataStats',
    ]);
    if (fromTuningDataStats !== undefined && fromTuningDataStats !== null) {
        setValueByPath(toObject, ['tuningDataStats'], fromTuningDataStats);
    }
    const fromEncryptionSpec = getValueByPath(fromObject, [
        'encryptionSpec',
    ]);
    if (fromEncryptionSpec !== undefined && fromEncryptionSpec !== null) {
        setValueByPath(toObject, ['encryptionSpec'], fromEncryptionSpec);
    }
    const fromPartnerModelTuningSpec = getValueByPath(fromObject, [
        'partnerModelTuningSpec',
    ]);
    if (fromPartnerModelTuningSpec !== undefined &&
        fromPartnerModelTuningSpec !== null) {
        setValueByPath(toObject, ['partnerModelTuningSpec'], fromPartnerModelTuningSpec);
    }
    const fromDistillationSpec = getValueByPath(fromObject, [
        'distillationSpec',
    ]);
    if (fromDistillationSpec !== undefined && fromDistillationSpec !== null) {
        setValueByPath(toObject, ['distillationSpec'], fromDistillationSpec);
    }
    const fromExperiment = getValueByPath(fromObject, ['experiment']);
    if (fromExperiment !== undefined && fromExperiment !== null) {
        setValueByPath(toObject, ['experiment'], fromExperiment);
    }
    const fromLabels = getValueByPath(fromObject, ['labels']);
    if (fromLabels !== undefined && fromLabels !== null) {
        setValueByPath(toObject, ['labels'], fromLabels);
    }
    const fromPipelineJob = getValueByPath(fromObject, ['pipelineJob']);
    if (fromPipelineJob !== undefined && fromPipelineJob !== null) {
        setValueByPath(toObject, ['pipelineJob'], fromPipelineJob);
    }
    const fromTunedModelDisplayName = getValueByPath(fromObject, [
        'tunedModelDisplayName',
    ]);
    if (fromTunedModelDisplayName !== undefined &&
        fromTunedModelDisplayName !== null) {
        setValueByPath(toObject, ['tunedModelDisplayName'], fromTunedModelDisplayName);
    }
    return toObject;
}
function listTuningJobsResponseFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromNextPageToken = getValueByPath(fromObject, [
        'nextPageToken',
    ]);
    if (fromNextPageToken !== undefined && fromNextPageToken !== null) {
        setValueByPath(toObject, ['nextPageToken'], fromNextPageToken);
    }
    const fromTuningJobs = getValueByPath(fromObject, ['tunedModels']);
    if (fromTuningJobs !== undefined && fromTuningJobs !== null) {
        if (Array.isArray(fromTuningJobs)) {
            setValueByPath(toObject, ['tuningJobs'], fromTuningJobs.map((item) => {
                return tuningJobFromMldev(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['tuningJobs'], fromTuningJobs);
        }
    }
    return toObject;
}
function listTuningJobsResponseFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromNextPageToken = getValueByPath(fromObject, [
        'nextPageToken',
    ]);
    if (fromNextPageToken !== undefined && fromNextPageToken !== null) {
        setValueByPath(toObject, ['nextPageToken'], fromNextPageToken);
    }
    const fromTuningJobs = getValueByPath(fromObject, ['tuningJobs']);
    if (fromTuningJobs !== undefined && fromTuningJobs !== null) {
        if (Array.isArray(fromTuningJobs)) {
            setValueByPath(toObject, ['tuningJobs'], fromTuningJobs.map((item) => {
                return tuningJobFromVertex(apiClient, item);
            }));
        }
        else {
            setValueByPath(toObject, ['tuningJobs'], fromTuningJobs);
        }
    }
    return toObject;
}
function operationFromMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['name'], fromName);
    }
    const fromMetadata = getValueByPath(fromObject, ['metadata']);
    if (fromMetadata !== undefined && fromMetadata !== null) {
        setValueByPath(toObject, ['metadata'], fromMetadata);
    }
    const fromDone = getValueByPath(fromObject, ['done']);
    if (fromDone !== undefined && fromDone !== null) {
        setValueByPath(toObject, ['done'], fromDone);
    }
    const fromError = getValueByPath(fromObject, ['error']);
    if (fromError !== undefined && fromError !== null) {
        setValueByPath(toObject, ['error'], fromError);
    }
    const fromResponse = getValueByPath(fromObject, ['response']);
    if (fromResponse !== undefined && fromResponse !== null) {
        setValueByPath(toObject, ['response'], fromResponse);
    }
    return toObject;
}
function operationFromVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ['name']);
    if (fromName !== undefined && fromName !== null) {
        setValueByPath(toObject, ['name'], fromName);
    }
    const fromMetadata = getValueByPath(fromObject, ['metadata']);
    if (fromMetadata !== undefined && fromMetadata !== null) {
        setValueByPath(toObject, ['metadata'], fromMetadata);
    }
    const fromDone = getValueByPath(fromObject, ['done']);
    if (fromDone !== undefined && fromDone !== null) {
        setValueByPath(toObject, ['done'], fromDone);
    }
    const fromError = getValueByPath(fromObject, ['error']);
    if (fromError !== undefined && fromError !== null) {
        setValueByPath(toObject, ['error'], fromError);
    }
    const fromResponse = getValueByPath(fromObject, ['response']);
    if (fromResponse !== undefined && fromResponse !== null) {
        setValueByPath(toObject, ['response'], fromResponse);
    }
    return toObject;
}

const LANGUAGE_LABEL_PREFIX = 'gl-node/';
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
class WebClient {
    constructor(options) {
        var _a;
        this.vertexai = (_a = options.vertexai) !== null && _a !== void 0 ? _a : false;
        this.apiKey = options.apiKey;
        this.apiVersion = options.apiVersion;
        const auth = new WebAuth(this.apiKey);
        this.apiClient = new ApiClient({
            auth: auth,
            apiVersion: this.apiVersion,
            apiKey: this.apiKey,
            vertexai: this.vertexai,
            httpOptions: options.httpOptions,
            userAgentExtra: LANGUAGE_LABEL_PREFIX + 'web',
        });
        this.models = new Models(this.apiClient);
        this.live = new Live(this.apiClient, auth, new BrowserWebSocketFactory());
        this.tunings = new Tunings(this.apiClient);
        this.chats = new Chats(this.models, this.apiClient);
        this.caches = new Caches(this.apiClient);
        this.files = new Files(this.apiClient);
    }
}

export { AdapterSize, BlockedReason, Caches, Chat, Chats, ComputeTokensResponse, ControlReferenceType, CountTokensResponse, CreateFileResponse, DeleteCachedContentResponse, DynamicRetrievalConfigMode, EmbedContentResponse, FileSource, FileState, FinishReason, FunctionCallingConfigMode, FunctionResponse, GenerateContentResponse, GenerateContentResponsePromptFeedback, GenerateContentResponseUsageMetadata, GenerateImagesResponse, HarmBlockMethod, HarmBlockThreshold, HarmCategory, HarmProbability, HarmSeverity, HttpResponse, ImagePromptLanguage, JobState, Language, ListCachedContentsResponse, ListFilesResponse, ListTuningJobsResponse, Live, LiveClientToolResponse, MaskReferenceMode, MediaResolution, Modality, Mode, Models, Outcome, PersonGeneration, ReplayResponse, SafetyFilterLevel, Session, State, SubjectReferenceType, Type, WebClient, contentToMldev$1 as contentToMldev, contentToVertex$1 as contentToVertex, createModelContent, createPartFromBase64, createPartFromCodeExecutionResult, createPartFromExecutableCode, createPartFromFunctionCall, createPartFromFunctionResponse, createPartFromText, createPartFromUri, createPartFromVideoMetadata, createUserContent, toolToMldev$1 as toolToMldev, toolToVertex$1 as toolToVertex };
//# sourceMappingURL=index.mjs.map
