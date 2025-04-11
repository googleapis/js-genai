/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';
import {zodToJsonSchema} from 'zod-to-json-schema';

import {Schema, Type} from './types';

export function zodToGoogleGenAISchema(
  vertexai: boolean,
  schema: z.ZodObject<z.ZodRawShape>,
): Schema {
  const jsonSchema = zodToJsonSchema(schema, 'zodSchema').definitions![
    'zodSchema'
  ] as Record<string, unknown>;
  return processJsonSchema(vertexai, jsonSchema);
}

function processJsonSchema(
  vertexai: boolean,
  zodSchema: Record<string, unknown>,
): Schema {
  let processedSchema: Schema = {};

  if (zodSchema['default']) {
    if (!vertexai) {
      throw new Error(
        'Default value is not supported in the response schema for the Gemini API.',
      );
    } else {
      processedSchema.default = zodSchema['default'] as string;
    }
  }

  if (zodSchema['description']) {
    processedSchema.description = zodSchema['description'] as string;
  }

  if (zodSchema['format']) {
    processedSchema.format = validateSupportedFormat(
      vertexai,
      zodSchema['type'] as string,
      zodSchema['format'],
    );
  }

  switch (zodSchema['type']) {
    case 'object':
      processedSchema.type = Type.OBJECT;
      processedSchema.properties = {};
      processedSchema.required = zodSchema['required'] as string[];
      for (const [key, value] of Object.entries(
        zodSchema['properties'] as Record<string, unknown>,
      )) {
        processedSchema.properties![key] = processJsonSchema(
          vertexai,
          value as Record<string, unknown>,
        );
      }
      return processedSchema;
    case 'string':
      processedSchema.type = Type.STRING;
      if (zodSchema['pattern']) {
        processedSchema.pattern = zodSchema['pattern'] as string;
      }
      if (zodSchema['enum']) {
        processedSchema.format = 'enum';
        processedSchema.enum = zodSchema['enum'] as string[];
      } else {
        if (zodSchema['minLength']) {
          processedSchema.minLength = zodSchema['minLength'].toString();
        }
        if (zodSchema['maxLength']) {
          processedSchema.maxLength = zodSchema['maxLength'].toString();
        }
      }
      return processedSchema;

    case 'number':
      processedSchema.type = Type.NUMBER;
      if (zodSchema['minimum']) {
        processedSchema.minimum = zodSchema['minimum'] as number;
      }
      if (zodSchema['maximum']) {
        processedSchema.maximum = zodSchema['maximum'] as number;
      }
      return processedSchema;
    case 'integer':
      processedSchema.type = Type.INTEGER;
      if (zodSchema['minimum']) {
        processedSchema.minimum = zodSchema['minimum'] as number;
      }
      if (zodSchema['maximum']) {
        processedSchema.maximum = zodSchema['maximum'] as number;
      }
      return processedSchema;
    case 'boolean':
      processedSchema.type = Type.BOOLEAN;
      return processedSchema;
    case 'array':
      throw new Error(`Not implemented yet`);
    default:
      throw new Error(`Unsupported type: ${zodSchema['type']}`);
  }
}

function validateSupportedFormat(
  vertexai: boolean,
  type: string,
  format: string | undefined | unknown,
): string | undefined {
  if (format === undefined) {
    return format;
  }
  switch (type) {
    case 'number':
      if (format !== 'float' && format !== 'double') {
        throw new Error(`Unsupported format for number type: ${format}`);
      }
      return format;
    case 'integer':
      if (format !== 'int32' && format !== 'int64') {
        throw new Error(`Unsupported format for integer type: ${format}`);
      }
      return format;
    case 'string':
      if (vertexai) {
        if (
          format !== 'date-time' &&
          format !== 'byte' &&
          format !== 'enmail' &&
          format !== 'enum'
        ) {
          throw new Error(
            `Unsupported vertexaiformat for string type: ${format}`,
          );
        }
      } else {
        if (format !== 'date-time' && format !== 'enum') {
          throw new Error(
            `Unsupported mldev format for string type: ${format}`,
          );
        }
      }
      return format;
    default:
      throw new Error(`Unsupported type: ${type}`);
  }
}
