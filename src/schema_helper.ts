/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';
import {zodToJsonSchema} from 'zod-to-json-schema';

import {Schema} from './types';

/**
 * A placeholder name for the zod schema when converting to JSON schema. The
 * name is not important and will not be used by users.
 */
const PLACEHOLDER_ZOD_SCHEMA_NAME = 'placeholderZodSchemaName';

/**
 * Represents the possible JSON schema types.
 */
export type JSONSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'object'
  | 'array'
  | 'boolean'
  | 'null';

/**
 * A subset of JSON Schema according to 2020-12 JSON Schema draft.
 *
 * Represents a subset of a JSON Schema object that can be used by Gemini API.
 * The difference between this interface and the Schema interface is that this
 * interface is compatible with OpenAPI 3.0 schema objects while the
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
}

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

const jsonSchemaValidator: jsonSchemaValidatorType = z.lazy(() => {
  return z
    .object({
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
    })
    .strict();
});

/**
 * Converts a Zod object into the Gemini schema format.
 *
 * This function first validates the structure of the input `zodSchema` object
 * against an internal representation of JSON Schema (see {@link JSONSchema}).
 * Any mismatch in data types and inrecongnized properties will cause an error.
 *
 * @param vertexai If true, targets Vertex AI schema format; otherwise, targets
 * the Gemini API format.
 * @param zodSchema The Zod schema object to convert. Its structure is validated
 * against the {@link JSONSchema} interface before conversion to JSONSchema
 * schema.
 * @return The resulting Schema object. @see {@link Schema}
 * @throws {ZodError} If the input `zodSchema` does not conform to the expected
 * JSONSchema structure during the initial validation step.
 * @see {@link JSONSchema} The interface used to validate the input `zodSchema`.
 */
export function responseSchemaFromZod(
  vertexai: boolean,
  zodSchema: z.ZodType,
): Schema {
  const jsonSchema = zodToJsonSchema(zodSchema, PLACEHOLDER_ZOD_SCHEMA_NAME)
    .definitions![PLACEHOLDER_ZOD_SCHEMA_NAME] as Record<string, unknown>;
  const validatedJsonSchema = jsonSchemaValidator.parse(jsonSchema);
  return processJsonSchema(vertexai, validatedJsonSchema);
}

function processJsonSchema(
  _vertexai: boolean,
  _jsonSchema: JSONSchema,
): Schema {
  // TODO(b/398409940): implement this function in a follow up CL.
  throw new Error(
    'Not yet supported. Please provide the proper schema object in `generateContentConfig`.',
  );
}
