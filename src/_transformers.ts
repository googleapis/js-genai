/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Tool as McpTool} from '@modelcontextprotocol/sdk/types.js';
import {z} from 'zod';

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

/**
 * Represents the possible JSON schema types.
 */
type JSONSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'object'
  | 'array'
  | 'boolean'
  | 'null';

/**
 * A subset of JSON Schema according to 2020-12 JSON Schema draft, plus one
 * additional google only field: propertyOrdering. The propertyOrdering field
 * is used to specify the order of the properties in the object. see details in
 * https://ai.google.dev/gemini-api/docs/structured-output#property-ordering
 * for more details.
 *
 * Represents a subset of a JSON Schema object that can be used by Gemini API.
 * The difference between this interface and the Schema interface is that this
 * interface is compatible with OpenAPI 3.1 schema objects while the
 * types.Schema interface @see {@link Schema} is used to make API call to
 * Gemini API.
 */
export interface JSONSchema {
  /**
   * Validation succeeds if the type of the instance matches the type
   * represented by the given type, or matches at least one of the given types
   * in the array.
   */
  type?: JSONSchemaType | JSONSchemaType[];

  /**
   * Defines semantic information about a string instance (e.g., "date-time",
   * "email").
   */
  format?: string;

  /**
   * A preferably short description about the purpose of the instance
   * described by the schema. This is not supported for Gemini API.
   */
  title?: string;

  /**
   * An explanation about the purpose of the instance described by the
   * schema.
   */
  description?: string;

  /**
   * This keyword can be used to supply a default JSON value associated
   * with a particular schema. The value should be valid according to the
   * schema. This is not supported for Gemini API.
   */
  default?: unknown;

  /**
   * Used for arrays. This keyword is used to define the schema of the elements
   * in the array.
   */
  items?: JSONSchema;

  /**
   * Key word for arrays. Specify the minimum number of elements in the array.
   */
  minItems?: string;

  /**
   * Key word for arrays. Specify the maximum number of elements in the array.e
   */
  maxItems?: string;

  /**
   * Used for specify the possible values for an enum.
   */
  enum?: unknown[];

  /**
   * Used for objects. This keyword is used to define the schema of the
   * properties in the object.
   */
  properties?: Record<string, JSONSchema>;

  /**
   * Used for objects. This keyword is used to specify the properties of the
   * object that are required to be present in the instance.
   */
  required?: string[];

  /**
   * The key word for objects. Specify the minimum number of properties in the
   * object.
   */
  minProperties?: string;

  /**
   * The key word for objects. Specify the maximum number of properties in the
   * object.
   */
  maxProperties?: string;

  /**
   * Used for numbers. Specify the minimum value for a number.
   */
  minimum?: number;

  /**
   * Used for numbers. specify the maximum value for a number.
   */
  maximum?: number;

  /**
   * Used for strings. The keyword to specify the minimum length of the
   * string.
   */
  minLength?: string;

  /**
   * Used for strings. The keyword to specify the maximum length of the
   * string.
   */
  maxLength?: string;

  /**
   * Used for strings. Key word to specify a regular
   * expression (ECMA-262) matches the instance successfully.
   */
  pattern?: string;

  /**
   * Used for Union types and Intersection types. This keyword is used to define
   * the schema of the possible values.
   */
  anyOf?: JSONSchema[];

  /**
   * The order of the properties. Not a standard field in OpenAPI spec.
   * Only used to support the order of the properties. see details in
   * https://ai.google.dev/gemini-api/docs/structured-output#property-ordering
   */
  propertyOrdering?: string[];
}

// The fields that are supported by JSONSchema. Must be kept in sync with the
// JSONSchema interface above.
export const supportedJsonSchemaFields = new Set<string>([
  'type',
  'format',
  'title',
  'description',
  'default',
  'items',
  'minItems',
  'maxItems',
  'enum',
  'properties',
  'required',
  'minProperties',
  'maxProperties',
  'minimum',
  'maximum',
  'minLength',
  'maxLength',
  'pattern',
  'anyOf',
  'propertyOrdering',
]);

const jsonSchemaTypeValidator = z.enum([
  'string',
  'number',
  'integer',
  'object',
  'array',
  'boolean',
  'null',
]);

// Handles all types and arrays of all types.
const schemaTypeUnion = z.union([
  jsonSchemaTypeValidator,
  z.array(jsonSchemaTypeValidator),
]);

// Declare the type for the schema variable.
type jsonSchemaValidatorType = z.ZodType<JSONSchema>;

/**
 * Creates a zod validator for JSONSchema.
 *
 * @param strictMode Whether to enable strict mode, default to true. When
 * strict mode is enabled, the zod validator will throw error if there
 * are unrecognized fields in the input data. If strict mode is
 * disabled, the zod validator will ignore the unrecognized fields, only
 * populate the fields that are listed in the JSONSchema. Regardless of
 * the mode the type mismatch will always result in an error, for example
 * items field should be a single JSONSchema, but for tuple type it would
 * be an array of JSONSchema, this will always result in an error.
 * @return The zod validator for JSONSchema.
 */
export function createJsonSchemaValidator(
  strictMode: boolean = true,
): jsonSchemaValidatorType {
  const jsonSchemaValidator: jsonSchemaValidatorType = z.lazy(() => {
    // Define the base object shape *inside* the z.lazy callback
    const baseShape = z.object({
      // --- Type ---
      type: schemaTypeUnion.optional(),

      // --- Annotations ---
      format: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      default: z.unknown().optional(),

      // --- Array Validations ---
      items: jsonSchemaValidator.optional(),
      minItems: z.coerce.string().optional(),
      maxItems: z.coerce.string().optional(),
      // --- Generic Validations ---
      enum: z.array(z.unknown()).optional(),

      // --- Object Validations ---
      properties: z.record(z.string(), jsonSchemaValidator).optional(),
      required: z.array(z.string()).optional(),
      minProperties: z.coerce.string().optional(),
      maxProperties: z.coerce.string().optional(),
      propertyOrdering: z.array(z.string()).optional(),

      // --- Numeric Validations ---
      minimum: z.number().optional(),
      maximum: z.number().optional(),

      // --- String Validations ---
      minLength: z.coerce.string().optional(),
      maxLength: z.coerce.string().optional(),
      pattern: z.string().optional(),

      // --- Schema Composition ---
      anyOf: z.array(jsonSchemaValidator).optional(),

      // --- Additional Properties --- This field is not included in the
      // JSONSchema, will not be communicated to the model, it is here purely
      // for enabling the zod validation strict mode.
      additionalProperties: z.boolean().optional(),
    });

    // Conditionally apply .strict() based on the flag
    return strictMode ? baseShape.strict() : baseShape;
  });
  return jsonSchemaValidator;
}

/*
Handle type field:
The resulted type field in JSONSchema form zod_to_json_schema can be either
an array consist of primitive types or a single primitive type.
This is due to the optimization of zod_to_json_schema, when the types in the
union are primitive types without any additional specifications,
zod_to_json_schema will squash the types into an array instead of put them
in anyOf fields. Otherwise, it will put the types in anyOf fields.
See the following link for more details:
https://github.com/zodjs/zod-to-json-schema/blob/main/src/index.ts#L101
The logic here is trying to undo that optimization, flattening the array of
types to anyOf fields.
                                 type field
                                      |
                            ___________________________
                           /                           \
                          /                              \
                         /                                \
                       Array                              Type.*
                /                  \                       |
      Include null.              Not included null     type = Type.*.
      [null, Type.*, Type.*]     multiple types.
      [null, Type.*]             [Type.*, Type.*]
            /                                \
      remove null                             \
      add nullable = true                      \
       /                    \                   \
    [Type.*]           [Type.*, Type.*]          \
 only one type left     multiple types left       \
 add type = Type.*.           \                  /
                               \                /
                         not populate the type field in final result
                           and make the types into anyOf fields
                          anyOf:[{type: 'Type.*'}, {type: 'Type.*'}];
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
  _jsonSchema: JSONSchema | types.Schema | Record<string, unknown>,
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
  const incomingAnyOf = _jsonSchema['anyOf'] as JSONSchema[];
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
        listSchemaFieldValue.push(processJsonSchema(item as JSONSchema));
      }
      (genAISchema as Record<string, unknown>)[fieldName] =
        listSchemaFieldValue;
    } else if (dictSchemaFieldNames.includes(fieldName)) {
      const dictSchemaFieldValue: Record<string, types.Schema> = {};
      for (const [key, value] of Object.entries(
        fieldValue as Record<string, unknown>,
      )) {
        dictSchemaFieldValue[key] = processJsonSchema(value as JSONSchema);
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
export function tSchema(schema: types.Schema | unknown): types.Schema {
  if (Object.keys(schema as Record<string, unknown>).includes('$schema')) {
    delete (schema as Record<string, unknown>)['$schema'];
    const validatedJsonSchema = createJsonSchemaValidator().parse(schema);
    return processJsonSchema(validatedJsonSchema);
  } else {
    return processJsonSchema(schema as types.Schema);
  }
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
        functionDeclaration.parameters = tSchema(
          functionDeclaration.parameters,
        );
      }
      if (functionDeclaration.response) {
        functionDeclaration.response = tSchema(functionDeclaration.response);
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
    parameters: processJsonSchema(
      filterToJsonSchema(
        mcpToolSchema['inputSchema'] as Record<string, unknown>,
      ),
    ),
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

// Filters the list schema field to only include fields that are supported by
// JSONSchema.
function filterListSchemaField(fieldValue: unknown): Record<string, unknown>[] {
  const listSchemaFieldValue: Record<string, unknown>[] = [];
  for (const listFieldValue of fieldValue as Record<string, unknown>[]) {
    listSchemaFieldValue.push(filterToJsonSchema(listFieldValue));
  }
  return listSchemaFieldValue;
}

// Filters the dict schema field to only include fields that are supported by
// JSONSchema.
function filterDictSchemaField(fieldValue: unknown): Record<string, unknown> {
  const dictSchemaFieldValue: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(
    fieldValue as Record<string, unknown>,
  )) {
    const valueRecord = value as Record<string, unknown>;
    dictSchemaFieldValue[key] = filterToJsonSchema(valueRecord);
  }
  return dictSchemaFieldValue;
}

// Filters the schema to only include fields that are supported by JSONSchema.
function filterToJsonSchema(
  schema: Record<string, unknown>,
): Record<string, unknown> {
  const schemaFieldNames: Set<string> = new Set(['items']); // 'additional_properties' to come
  const listSchemaFieldNames: Set<string> = new Set(['anyOf']); // 'one_of', 'all_of', 'not' to come
  const dictSchemaFieldNames: Set<string> = new Set(['properties']); // 'defs' to come
  const filteredSchema: Record<string, unknown> = {};

  for (const [fieldName, fieldValue] of Object.entries(schema)) {
    if (schemaFieldNames.has(fieldName)) {
      filteredSchema[fieldName] = filterToJsonSchema(
        fieldValue as Record<string, unknown>,
      );
    } else if (listSchemaFieldNames.has(fieldName)) {
      filteredSchema[fieldName] = filterListSchemaField(fieldValue);
    } else if (dictSchemaFieldNames.has(fieldName)) {
      filteredSchema[fieldName] = filterDictSchemaField(fieldValue);
    } else if (fieldName === 'type') {
      const typeValue = (fieldValue as string).toUpperCase();
      filteredSchema[fieldName] = Object.values(types.Type).includes(
        typeValue as types.Type,
      )
        ? (typeValue as types.Type)
        : types.Type.TYPE_UNSPECIFIED;
    } else if (supportedJsonSchemaFields.has(fieldName)) {
      filteredSchema[fieldName] = fieldValue;
    }
  }

  return filteredSchema;
}
