/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Tool as McpTool} from '@modelcontextprotocol/sdk/types.js';

import {ApiClient} from './_api_client.js';
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

// we take the unknown in the schema field because we want enable user to pass
// the output of major schema declaration tools without casting. Tools such as
// zodToJsonSchema, typebox, zodToJsonSchema function can return JsonSchema7Type
// or object, see details in
// https://github.com/StefanTerdell/zod-to-json-schema/blob/70525efe555cd226691e093d171370a3b10921d1/src/zodToJsonSchema.ts#L7
// typebox can return unknown, see details in
// https://github.com/sinclairzx81/typebox/blob/5a5431439f7d5ca6b494d0d18fbfd7b1a356d67c/src/type/create/type.ts#L35
export function tSchema(schema: types.Schema | unknown): types.Schema {
  return schema as types.Schema;
}
/**
 * Checks if the schema is a valid types.Schema. This function is used to
 * pick out the ones that can be process as types.Schema and pass to
 * responseSchema. Any other will be process send to responseJsonSchema.
 * @param _jsonSchema The schema to check. Default to be false.
 * @return True if the schema is a valid JSONSchema, false otherwise.
 */
export function isSchema(_jsonSchema: unknown): _jsonSchema is types.Schema {
  // Define all valid keys, categorized by their expected value type.
  const schemaFieldNames = new Set(['items']);
  const listSchemaFieldNames = new Set(['anyOf']);
  const dictSchemaFieldNames = new Set(['properties']);
  const stringFieldsNames = new Set([
    'title',
    'description',
    'minLength',
    'maxLength',
    'format',
    'pattern',
    'minProperties',
    'maxProperties',
    'minItems',
    'maxItems',
  ]);
  const numberFieldsNames = new Set(['minimum', 'maximum']);
  const booleanFieldsNames = new Set(['nullable']);
  const stringArrayFieldsNames = new Set([
    'enum',
    'propertyOrdering',
    'required',
  ]);
  const unknownFieldsNames = new Set(['default', 'example']);

  const allValidKeys = new Set([
    ...schemaFieldNames,
    ...listSchemaFieldNames,
    ...dictSchemaFieldNames,
    ...stringFieldsNames,
    ...numberFieldsNames,
    ...booleanFieldsNames,
    ...stringArrayFieldsNames,
    ...unknownFieldsNames,
    'type',
  ]);

  const schema = _jsonSchema as Record<string, unknown>;

  for (const key in schema) {
    if (!allValidKeys.has(key)) {
      return false;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(schema)) {
    if (fieldValue == null) {
      continue;
    }

    if (fieldName === 'type') {
      if (
        typeof fieldValue !== 'string' ||
        !Object.values(types.Type).includes(fieldValue as types.Type)
      ) {
        return false;
      }
    } else if (stringFieldsNames.has(fieldName)) {
      if (typeof fieldValue !== 'string') {
        return false;
      }
    } else if (numberFieldsNames.has(fieldName)) {
      if (typeof fieldValue !== 'number') {
        return false;
      }
    } else if (booleanFieldsNames.has(fieldName)) {
      if (typeof fieldValue !== 'boolean') {
        return false;
      }
    } else if (stringArrayFieldsNames.has(fieldName)) {
      if (
        !Array.isArray(fieldValue) ||
        !fieldValue.every((item) => typeof item === 'string')
      ) {
        return false;
      }
    } else if (schemaFieldNames.has(fieldName)) {
      // 'items'
      if (!isSchema(fieldValue)) {
        return false;
      }
    } else if (listSchemaFieldNames.has(fieldName)) {
      // 'anyOf'
      if (
        !Array.isArray(fieldValue) ||
        !fieldValue.every((item) => isSchema(item))
      ) {
        return false;
      }
    } else if (dictSchemaFieldNames.has(fieldName)) {
      // 'properties'
      if (
        typeof fieldValue !== 'object' ||
        fieldValue === null ||
        Array.isArray(fieldValue)
      ) {
        return false;
      }
      for (const subSchema of Object.values(fieldValue)) {
        if (!isSchema(subSchema)) {
          return false;
        }
      }
    }
  }
  return true;
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
  if (typeof fromImageBytes !== 'string') {
    throw new Error('fromImageBytes must be a string');
  }
  // TODO(b/389133914): Remove dummy bytes converter.
  return fromImageBytes;
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
