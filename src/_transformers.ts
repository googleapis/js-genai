/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Tool as McpTool} from '@modelcontextprotocol/sdk/types.js';

import {ApiClient} from './_api_client.js';
import * as baseTransformers from './_base_transformers.js';
import * as types from './types.js';

export function tModel(apiClient: ApiClient, model: string | unknown): string {
  if (!model || typeof model !== 'string') {
    throw new Error('model is required and must be a string');
  }

  if (apiClient.isVertexAI()) {
    if (
      model.startsWith('publishers/') ||
      model.startsWith('projects/') ||
      model.startsWith('models/')
    ) {
      return model;
    } else if (model.indexOf('/') >= 0) {
      const parts = model.split('/', 2);
      return `publishers/${parts[0]}/models/${parts[1]}`;
    } else {
      return `publishers/google/models/${model}`;
    }
  } else {
    if (model.startsWith('models/') || model.startsWith('tunedModels/')) {
      return model;
    } else {
      return `models/${model}`;
    }
  }
}

export function tCachesModel(
  apiClient: ApiClient,
  model: string | unknown,
): string {
  const transformedModel = tModel(apiClient, model as string);
  if (!transformedModel) {
    return '';
  }

  if (transformedModel.startsWith('publishers/') && apiClient.isVertexAI()) {
    // vertex caches only support model name start with projects.
    return `projects/${apiClient.getProject()}/locations/${apiClient.getLocation()}/${transformedModel}`;
  } else if (transformedModel.startsWith('models/') && apiClient.isVertexAI()) {
    return `projects/${apiClient.getProject()}/locations/${apiClient.getLocation()}/publishers/google/${transformedModel}`;
  } else {
    return transformedModel;
  }
}

export function tBlobs(
  blobs: types.BlobImageUnion | types.BlobImageUnion[],
): types.Blob[] {
  if (Array.isArray(blobs)) {
    return blobs.map((blob) => tBlob(blob));
  } else {
    return [tBlob(blobs)];
  }
}

export function tBlob(blob: types.BlobImageUnion): types.Blob {
  if (typeof blob === 'object' && blob !== null) {
    return blob;
  }

  throw new Error(
    `Could not parse input as Blob. Unsupported blob type: ${typeof blob}`,
  );
}

export function tImageBlob(blob: types.BlobImageUnion): types.Blob {
  const transformedBlob = tBlob(blob);
  if (
    transformedBlob.mimeType &&
    transformedBlob.mimeType.startsWith('image/')
  ) {
    return transformedBlob;
  }
  throw new Error(`Unsupported mime type: ${transformedBlob.mimeType!}`);
}

export function tAudioBlob(blob: types.Blob): types.Blob {
  const transformedBlob = tBlob(blob);
  if (
    transformedBlob.mimeType &&
    transformedBlob.mimeType.startsWith('audio/')
  ) {
    return transformedBlob;
  }
  throw new Error(`Unsupported mime type: ${transformedBlob.mimeType!}`);
}

export function tPart(origin?: types.PartUnion | null): types.Part {
  if (origin === null || origin === undefined) {
    throw new Error('PartUnion is required');
  }
  if (typeof origin === 'object') {
    return origin;
  }
  if (typeof origin === 'string') {
    return {text: origin};
  }
  throw new Error(`Unsupported part type: ${typeof origin}`);
}

export function tParts(origin?: types.PartListUnion | null): types.Part[] {
  if (
    origin === null ||
    origin === undefined ||
    (Array.isArray(origin) && origin.length === 0)
  ) {
    throw new Error('PartListUnion is required');
  }
  if (Array.isArray(origin)) {
    return origin.map((item) => tPart(item as types.PartUnion)!);
  }
  return [tPart(origin)!];
}

function _isContent(origin: unknown): boolean {
  return (
    origin !== null &&
    origin !== undefined &&
    typeof origin === 'object' &&
    'parts' in origin &&
    Array.isArray(origin.parts)
  );
}

function _isFunctionCallPart(origin: unknown): boolean {
  return (
    origin !== null &&
    origin !== undefined &&
    typeof origin === 'object' &&
    'functionCall' in origin
  );
}

function _isFunctionResponsePart(origin: unknown): boolean {
  return (
    origin !== null &&
    origin !== undefined &&
    typeof origin === 'object' &&
    'functionResponse' in origin
  );
}

export function tContent(origin?: types.ContentUnion): types.Content {
  if (origin === null || origin === undefined) {
    throw new Error('ContentUnion is required');
  }
  if (_isContent(origin)) {
    // _isContent is a utility function that checks if the
    // origin is a Content.
    return origin as types.Content;
  }

  return {
    role: 'user',
    parts: tParts(origin as types.PartListUnion)!,
  };
}

export function tContentsForEmbed(
  apiClient: ApiClient,
  origin: types.ContentListUnion,
): types.ContentUnion[] {
  if (!origin) {
    return [];
  }
  if (apiClient.isVertexAI() && Array.isArray(origin)) {
    return origin.flatMap((item) => {
      const content = tContent(item as types.ContentUnion);
      if (
        content.parts &&
        content.parts.length > 0 &&
        content.parts[0].text !== undefined
      ) {
        return [content.parts[0].text];
      }
      return [];
    });
  } else if (apiClient.isVertexAI()) {
    const content = tContent(origin as types.ContentUnion);
    if (
      content.parts &&
      content.parts.length > 0 &&
      content.parts[0].text !== undefined
    ) {
      return [content.parts[0].text];
    }
    return [];
  }
  if (Array.isArray(origin)) {
    return origin.map((item) => tContent(item as types.ContentUnion)!);
  }
  return [tContent(origin as types.ContentUnion)!];
}

export function tContents(origin?: types.ContentListUnion): types.Content[] {
  if (
    origin === null ||
    origin === undefined ||
    (Array.isArray(origin) && origin.length === 0)
  ) {
    throw new Error('contents are required');
  }
  if (!Array.isArray(origin)) {
    // If it's not an array, it's a single content or a single PartUnion.
    if (_isFunctionCallPart(origin) || _isFunctionResponsePart(origin)) {
      throw new Error(
        'To specify functionCall or functionResponse parts, please wrap them in a Content object, specifying the role for them',
      );
    }
    return [tContent(origin as types.ContentUnion)];
  }

  const result: types.Content[] = [];
  const accumulatedParts: types.PartUnion[] = [];
  const isContentArray = _isContent(origin[0]);

  for (const item of origin) {
    const isContent = _isContent(item);

    if (isContent != isContentArray) {
      throw new Error(
        'Mixing Content and Parts is not supported, please group the parts into a the appropriate Content objects and specify the roles for them',
      );
    }

    if (isContent) {
      // `isContent` contains the result of _isContent, which is a utility
      // function that checks if the item is a Content.
      result.push(item as types.Content);
    } else if (_isFunctionCallPart(item) || _isFunctionResponsePart(item)) {
      throw new Error(
        'To specify functionCall or functionResponse parts, please wrap them, and any other parts, in Content objects as appropriate, specifying the role for them',
      );
    } else {
      accumulatedParts.push(item as types.PartUnion);
    }
  }

  if (!isContentArray) {
    result.push({role: 'user', parts: tParts(accumulatedParts)});
  }
  return result;
}

/*
Transform the type field from an array of types to an array of anyOf fields.
Example:
  {type: ['STRING', 'NUMBER']}
will be transformed to
  {anyOf: [{type: 'STRING'}, {type: 'NUMBER'}]}
*/
function flattenTypeArrayToAnyOf(
  typeList: string[],
  resultingSchema: types.Schema,
) {
  if (typeList.includes('null')) {
    resultingSchema['nullable'] = true;
  }
  const listWithoutNull = typeList.filter((type) => type !== 'null');

  if (listWithoutNull.length === 1) {
    resultingSchema['type'] = Object.values(types.Type).includes(
      listWithoutNull[0].toUpperCase() as types.Type,
    )
      ? (listWithoutNull[0].toUpperCase() as types.Type)
      : types.Type.TYPE_UNSPECIFIED;
  } else {
    resultingSchema['anyOf'] = [];
    for (const i of listWithoutNull) {
      resultingSchema['anyOf'].push({
        'type': Object.values(types.Type).includes(
          i.toUpperCase() as types.Type,
        )
          ? (i.toUpperCase() as types.Type)
          : types.Type.TYPE_UNSPECIFIED,
      });
    }
  }
}

export function processJsonSchema(
  _jsonSchema: types.Schema | Record<string, unknown>,
): types.Schema {
  const genAISchema: types.Schema = {};
  const schemaFieldNames = ['items'];
  const listSchemaFieldNames = ['anyOf'];
  const dictSchemaFieldNames = ['properties'];

  if (_jsonSchema['type'] && _jsonSchema['anyOf']) {
    throw new Error('type and anyOf cannot be both populated.');
  }

  /*
  This is to handle the nullable array or object. The _jsonSchema will
  be in the format of {anyOf: [{type: 'null'}, {type: 'object'}]}. The
  logic is to check if anyOf has 2 elements and one of the element is null,
  if so, the anyOf field is unnecessary, so we need to get rid of the anyOf
  field and make the schema nullable. Then use the other element as the new
  _jsonSchema for processing. This is because the backend doesn't have a null
  type.
  This has to be checked before we process any other fields.
  For example:
    const objectNullable = z.object({
      nullableArray: z.array(z.string()).nullable(),
    });
  Will have the raw _jsonSchema as:
  {
    type: 'OBJECT',
    properties: {
        nullableArray: {
           anyOf: [
              {type: 'null'},
              {
                type: 'array',
                items: {type: 'string'},
              },
            ],
        }
    },
    required: [ 'nullableArray' ],
  }
  Will result in following schema compatible with Gemini API:
    {
      type: 'OBJECT',
      properties: {
         nullableArray: {
            nullable: true,
            type: 'ARRAY',
            items: {type: 'string'},
         }
      },
      required: [ 'nullableArray' ],
    }
  */
  const incomingAnyOf = _jsonSchema['anyOf'] as Record<string, unknown>[];
  if (incomingAnyOf != null && incomingAnyOf.length == 2) {
    if (incomingAnyOf[0]!['type'] === 'null') {
      genAISchema['nullable'] = true;
      _jsonSchema = incomingAnyOf![1];
    } else if (incomingAnyOf[1]!['type'] === 'null') {
      genAISchema['nullable'] = true;
      _jsonSchema = incomingAnyOf![0];
    }
  }

  if (_jsonSchema['type'] instanceof Array) {
    flattenTypeArrayToAnyOf(_jsonSchema['type'], genAISchema);
  }

  for (const [fieldName, fieldValue] of Object.entries(_jsonSchema)) {
    // Skip if the fieldvalue is undefined or null.
    if (fieldValue == null) {
      continue;
    }

    if (fieldName == 'type') {
      if (fieldValue === 'null') {
        throw new Error(
          'type: null can not be the only possible type for the field.',
        );
      }
      if (fieldValue instanceof Array) {
        // we have already handled the type field with array of types in the
        // beginning of this function.
        continue;
      }
      genAISchema['type'] = Object.values(types.Type).includes(
        fieldValue.toUpperCase() as types.Type,
      )
        ? fieldValue.toUpperCase()
        : types.Type.TYPE_UNSPECIFIED;
    } else if (schemaFieldNames.includes(fieldName)) {
      (genAISchema as Record<string, unknown>)[fieldName] =
        processJsonSchema(fieldValue);
    } else if (listSchemaFieldNames.includes(fieldName)) {
      const listSchemaFieldValue: Array<types.Schema> = [];
      for (const item of fieldValue) {
        if (item['type'] == 'null') {
          genAISchema['nullable'] = true;
          continue;
        }
        listSchemaFieldValue.push(
          processJsonSchema(item as Record<string, unknown>),
        );
      }
      (genAISchema as Record<string, unknown>)[fieldName] =
        listSchemaFieldValue;
    } else if (dictSchemaFieldNames.includes(fieldName)) {
      const dictSchemaFieldValue: Record<string, types.Schema> = {};
      for (const [key, value] of Object.entries(
        fieldValue as Record<string, unknown>,
      )) {
        dictSchemaFieldValue[key] = processJsonSchema(
          value as Record<string, unknown>,
        );
      }
      (genAISchema as Record<string, unknown>)[fieldName] =
        dictSchemaFieldValue;
    } else {
      // additionalProperties is not included in JSONSchema, skipping it.
      if (fieldName === 'additionalProperties') {
        continue;
      }
      (genAISchema as Record<string, unknown>)[fieldName] = fieldValue;
    }
  }
  return genAISchema;
}

// we take the unknown in the schema field because we want enable user to pass
// the output of major schema declaration tools without casting. Tools such as
// zodToJsonSchema, typebox, zodToJsonSchema function can return JsonSchema7Type
// or object, see details in
// https://github.com/StefanTerdell/zod-to-json-schema/blob/70525efe555cd226691e093d171370a3b10921d1/src/zodToJsonSchema.ts#L7
// typebox can return unknown, see details in
// https://github.com/sinclairzx81/typebox/blob/5a5431439f7d5ca6b494d0d18fbfd7b1a356d67c/src/type/create/type.ts#L35
// Note: proper json schemas with the $schema field set never arrive to this
// transformer. Schemas with $schema are routed to the equivalent API json
// schema field.
export function tSchema(schema: types.Schema | unknown): types.Schema {
  return processJsonSchema(schema as types.Schema);
}

export function tSpeechConfig(
  speechConfig: types.SpeechConfigUnion,
): types.SpeechConfig {
  if (typeof speechConfig === 'object') {
    return speechConfig;
  } else if (typeof speechConfig === 'string') {
    return {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: speechConfig,
        },
      },
    };
  } else {
    throw new Error(`Unsupported speechConfig type: ${typeof speechConfig}`);
  }
}

export function tLiveSpeechConfig(
  speechConfig: types.SpeechConfig | object,
): types.SpeechConfig {
  if ('multiSpeakerVoiceConfig' in speechConfig) {
    throw new Error(
      'multiSpeakerVoiceConfig is not supported in the live API.',
    );
  }
  return speechConfig;
}

export function tTool(tool: types.Tool): types.Tool {
  if (tool.functionDeclarations) {
    for (const functionDeclaration of tool.functionDeclarations) {
      if (functionDeclaration.parameters) {
        if (!Object.keys(functionDeclaration.parameters).includes('$schema')) {
          functionDeclaration.parameters = processJsonSchema(
            functionDeclaration.parameters,
          );
        } else {
          if (!functionDeclaration.parametersJsonSchema) {
            functionDeclaration.parametersJsonSchema =
              functionDeclaration.parameters;
            delete functionDeclaration.parameters;
          }
        }
      }
      if (functionDeclaration.response) {
        if (!Object.keys(functionDeclaration.response).includes('$schema')) {
          functionDeclaration.response = processJsonSchema(
            functionDeclaration.response,
          );
        } else {
          if (!functionDeclaration.responseJsonSchema) {
            functionDeclaration.responseJsonSchema =
              functionDeclaration.response;
            delete functionDeclaration.response;
          }
        }
      }
    }
  }
  return tool;
}

export function tTools(tools: types.ToolListUnion | unknown): types.Tool[] {
  // Check if the incoming type is defined.
  if (tools === undefined || tools === null) {
    throw new Error('tools is required');
  }
  if (!Array.isArray(tools)) {
    throw new Error('tools is required and must be an array of Tools');
  }
  const result: types.Tool[] = [];
  for (const tool of tools) {
    result.push(tool as types.Tool);
  }
  return result;
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
function resourceName(
  client: ApiClient,
  resourceName: string,
  resourcePrefix: string,
  splitsAfterPrefix: number = 1,
): string {
  const shouldAppendPrefix =
    !resourceName.startsWith(`${resourcePrefix}/`) &&
    resourceName.split('/').length === splitsAfterPrefix;
  if (client.isVertexAI()) {
    if (resourceName.startsWith('projects/')) {
      return resourceName;
    } else if (resourceName.startsWith('locations/')) {
      return `projects/${client.getProject()}/${resourceName}`;
    } else if (resourceName.startsWith(`${resourcePrefix}/`)) {
      return `projects/${client.getProject()}/locations/${client.getLocation()}/${resourceName}`;
    } else if (shouldAppendPrefix) {
      return `projects/${client.getProject()}/locations/${client.getLocation()}/${resourcePrefix}/${resourceName}`;
    } else {
      return resourceName;
    }
  }
  if (shouldAppendPrefix) {
    return `${resourcePrefix}/${resourceName}`;
  }
  return resourceName;
}

export function tCachedContentName(
  apiClient: ApiClient,
  name: string | unknown,
): string {
  if (typeof name !== 'string') {
    throw new Error('name must be a string');
  }
  return resourceName(apiClient, name, 'cachedContents');
}

export function tTuningJobStatus(status: string | unknown): string {
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
      return status as string;
  }
}

export function tBytes(fromImageBytes: string | unknown): string {
  return baseTransformers.tBytes(fromImageBytes);
}

function _isFile(origin: unknown): boolean {
  return (
    origin !== null &&
    origin !== undefined &&
    typeof origin === 'object' &&
    'name' in origin
  );
}

export function isGeneratedVideo(origin: unknown): boolean {
  return (
    origin !== null &&
    origin !== undefined &&
    typeof origin === 'object' &&
    'video' in origin
  );
}

export function isVideo(origin: unknown): boolean {
  return (
    origin !== null &&
    origin !== undefined &&
    typeof origin === 'object' &&
    'uri' in origin
  );
}

export function tFileName(
  fromName: string | types.File | types.GeneratedVideo | types.Video,
): string | undefined {
  let name: string | undefined;

  if (_isFile(fromName)) {
    name = (fromName as types.File).name;
  }
  if (isVideo(fromName)) {
    name = (fromName as types.Video).uri;
    if (name === undefined) {
      return undefined;
    }
  }
  if (isGeneratedVideo(fromName)) {
    name = (fromName as types.GeneratedVideo).video?.uri;
    if (name === undefined) {
      return undefined;
    }
  }
  if (typeof fromName === 'string') {
    name = fromName;
  }

  if (name === undefined) {
    throw new Error('Could not extract file name from the provided input.');
  }

  if (name.startsWith('https://')) {
    const suffix = name.split('files/')[1];
    const match = suffix.match(/[a-z0-9]+/);
    if (match === null) {
      throw new Error(`Could not extract file name from URI ${name}`);
    }
    name = match[0];
  } else if (name.startsWith('files/')) {
    name = name.split('files/')[1];
  }
  return name;
}

export function tModelsUrl(
  apiClient: ApiClient,
  baseModels: boolean | unknown,
): string {
  let res: string;
  if (apiClient.isVertexAI()) {
    res = baseModels ? 'publishers/google/models' : 'models';
  } else {
    res = baseModels ? 'models' : 'tunedModels';
  }
  return res;
}

export function tExtractModels(response: unknown): Record<string, unknown>[] {
  for (const key of ['models', 'tunedModels', 'publisherModels']) {
    if (hasField(response, key)) {
      return (response as Record<string, unknown>)[key] as Record<
        string,
        unknown
      >[];
    }
  }
  return [];
}

function hasField(data: unknown, fieldName: string): boolean {
  return data !== null && typeof data === 'object' && fieldName in data;
}

export function mcpToGeminiTool(
  mcpTool: McpTool,
  config: types.CallableToolConfig = {},
): types.Tool {
  const mcpToolSchema = mcpTool as Record<string, unknown>;
  const functionDeclaration: Record<string, unknown> = {
    name: mcpToolSchema['name'],
    description: mcpToolSchema['description'],
    parametersJsonSchema: mcpToolSchema['inputSchema'],
  };
  if (mcpToolSchema['outputSchema']) {
    functionDeclaration['responseJsonSchema'] = mcpToolSchema['outputSchema'];
  }
  if (config.behavior) {
    functionDeclaration['behavior'] = config.behavior;
  }

  const geminiTool = {
    functionDeclarations: [
      functionDeclaration as unknown as types.FunctionDeclaration,
    ],
  };

  return geminiTool;
}

/**
 * Converts a list of MCP tools to a single Gemini tool with a list of function
 * declarations.
 */
export function mcpToolsToGeminiTool(
  mcpTools: McpTool[],
  config: types.CallableToolConfig = {},
): types.Tool {
  const functionDeclarations: types.FunctionDeclaration[] = [];
  const toolNames = new Set<string>();
  for (const mcpTool of mcpTools) {
    const mcpToolName = mcpTool.name as string;
    if (toolNames.has(mcpToolName)) {
      throw new Error(
        `Duplicate function name ${
          mcpToolName
        } found in MCP tools. Please ensure function names are unique.`,
      );
    }
    toolNames.add(mcpToolName);
    const geminiTool = mcpToGeminiTool(mcpTool, config);
    if (geminiTool.functionDeclarations) {
      functionDeclarations.push(...geminiTool.functionDeclarations);
    }
  }

  return {functionDeclarations: functionDeclarations};
}

// Transforms a source input into a BatchJobSource object with validation.
export function tBatchJobSource(
  client: ApiClient,
  src: string | types.InlinedRequest[] | types.BatchJobSource,
): types.BatchJobSource {
  let sourceObj: types.BatchJobSource;

  if (typeof src === 'string') {
    if (client.isVertexAI()) {
      if (src.startsWith('gs://')) {
        sourceObj = {format: 'jsonl', gcsUri: [src]};
      } else if (src.startsWith('bq://')) {
        sourceObj = {format: 'bigquery', bigqueryUri: src};
      } else {
        throw new Error(`Unsupported string source for Vertex AI: ${src}`);
      }
    } else {
      // MLDEV
      if (src.startsWith('files/')) {
        sourceObj = {fileName: src}; // Default to fileName for string input
      } else {
        throw new Error(`Unsupported string source for Gemini API: ${src}`);
      }
    }
  } else if (Array.isArray(src)) {
    if (client.isVertexAI()) {
      throw new Error('InlinedRequest[] is not supported in Vertex AI.');
    }
    sourceObj = {inlinedRequests: src};
  } else {
    // It's already a BatchJobSource object
    sourceObj = src;
  }

  // Validation logic
  const vertexSourcesCount = [sourceObj.gcsUri, sourceObj.bigqueryUri].filter(
    Boolean,
  ).length;

  const mldevSourcesCount = [
    sourceObj.inlinedRequests,
    sourceObj.fileName,
  ].filter(Boolean).length;

  if (client.isVertexAI()) {
    if (mldevSourcesCount > 0 || vertexSourcesCount !== 1) {
      throw new Error(
        'Exactly one of `gcsUri` or `bigqueryUri` must be set for Vertex AI.',
      );
    }
  } else {
    // MLDEV
    if (vertexSourcesCount > 0 || mldevSourcesCount !== 1) {
      throw new Error(
        'Exactly one of `inlinedRequests`, `fileName`, ' +
          'must be set for Gemini API.',
      );
    }
  }

  return sourceObj;
}

export function tEmbeddingBatchJobSource(
  client: ApiClient,
  src: types.EmbeddingsBatchJobSource,
): types.EmbeddingsBatchJobSource {
  if (client.isVertexAI()) {
    throw new Error('Embedding batch jobs are not supported in Vertex AI.');
  }

  const sourceObj: types.EmbeddingsBatchJobSource = {...src};

  const mldevSources =
    Number(!!sourceObj.inlinedRequests) + Number(!!sourceObj.fileName);

  if (mldevSources !== 1) {
    throw new Error(
      'Exactly one of `inlinedRequests` or `fileName` must be set for Embedding Batch Jobs in the Gemini API.',
    );
  }
  return sourceObj;
}

export function tBatchJobDestination(
  dest: string | types.BatchJobDestination,
): types.BatchJobDestination {
  if (typeof dest !== 'string') {
    return dest as types.BatchJobDestination;
  }
  const destString = dest as string;
  if (destString.startsWith('gs://')) {
    return {
      format: 'jsonl',
      gcsUri: destString,
    };
  } else if (destString.startsWith('bq://')) {
    return {
      format: 'bigquery',
      bigqueryUri: destString,
    };
  } else {
    throw new Error(`Unsupported destination: ${destString}`);
  }
}

export function tRecvBatchJobDestination(
  dest: unknown,
): types.BatchJobDestination {
  // Ensure dest is a non-null object before proceeding.
  if (typeof dest !== 'object' || dest === null) {
    // If the input is not an object, it cannot be a valid BatchJobDestination
    // based on the operations performed. Return it cast, or handle as an error.
    // Casting an empty object might be a safe default.
    return {} as types.BatchJobDestination;
  }

  // Cast to Record<string, unknown> to allow string property access.
  const obj = dest as Record<string, unknown>;

  // Safely access nested properties.
  const inlineResponsesVal = obj['inlinedResponses'];
  if (typeof inlineResponsesVal !== 'object' || inlineResponsesVal === null) {
    return dest as types.BatchJobDestination;
  }
  const inlineResponsesObj = inlineResponsesVal as Record<string, unknown>;

  const responsesArray = inlineResponsesObj['inlinedResponses'];
  if (!Array.isArray(responsesArray) || responsesArray.length === 0) {
    return dest as types.BatchJobDestination;
  }

  // Check if any response has the 'embedding' property.
  let hasEmbedding = false;
  for (const responseItem of responsesArray) {
    if (typeof responseItem !== 'object' || responseItem === null) {
      continue;
    }
    const responseItemObj = responseItem as Record<string, unknown>;

    const responseVal = responseItemObj['response'];
    if (typeof responseVal !== 'object' || responseVal === null) {
      continue;
    }
    const responseObj = responseVal as Record<string, unknown>;

    // Check for the existence of the 'embedding' key.
    if (responseObj['embedding'] !== undefined) {
      hasEmbedding = true;
      break;
    }
  }

  // Perform the transformation if an embedding was found.
  if (hasEmbedding) {
    obj['inlinedEmbedContentResponses'] = obj['inlinedResponses'];
    delete obj['inlinedResponses'];
  }

  // Cast the (potentially) modified object to the target type.
  return dest as types.BatchJobDestination;
}

export function tBatchJobName(apiClient: ApiClient, name: unknown): string {
  const nameString = name as string;
  if (!apiClient.isVertexAI()) {
    const mldevPattern = /batches\/[^/]+$/;

    if (mldevPattern.test(nameString)) {
      return nameString.split('/').pop() as string;
    } else {
      throw new Error(`Invalid batch job name: ${nameString}.`);
    }
  }

  const vertexPattern =
    /^projects\/[^/]+\/locations\/[^/]+\/batchPredictionJobs\/[^/]+$/;

  if (vertexPattern.test(nameString)) {
    return nameString.split('/').pop() as string;
  } else if (/^\d+$/.test(nameString)) {
    return nameString;
  } else {
    throw new Error(`Invalid batch job name: ${nameString}.`);
  }
}

export function tJobState(state: unknown): string {
  const stateString = state as string;
  if (stateString === 'BATCH_STATE_UNSPECIFIED') {
    return 'JOB_STATE_UNSPECIFIED';
  } else if (stateString === 'BATCH_STATE_PENDING') {
    return 'JOB_STATE_PENDING';
  } else if (stateString === 'BATCH_STATE_RUNNING') {
    return 'JOB_STATE_RUNNING';
  } else if (stateString === 'BATCH_STATE_SUCCEEDED') {
    return 'JOB_STATE_SUCCEEDED';
  } else if (stateString === 'BATCH_STATE_FAILED') {
    return 'JOB_STATE_FAILED';
  } else if (stateString === 'BATCH_STATE_CANCELLED') {
    return 'JOB_STATE_CANCELLED';
  } else if (stateString === 'BATCH_STATE_EXPIRED') {
    return 'JOB_STATE_EXPIRED';
  } else {
    return stateString;
  }
}
