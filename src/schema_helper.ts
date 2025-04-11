/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';
import {zodToJsonSchema} from 'zod-to-json-schema';

import {Schema} from './types';

export function zodToGoogleGenAISchema(
  isVertexAI: boolean,
  schema: z.ZodObject<z.ZodRawShape>,
): Schema {
  const jsonSchema = zodToJsonSchema(schema, 'zodSchema').definitions![
    'zodSchema'
  ] as Record<string, unknown>;
  return processJsonSchema(isVertexAI, jsonSchema);
}

function processJsonSchema(
  _isVertexAI: boolean,
  _zodSchema: Record<string, unknown>,
): Schema {
  // TODO(b/398409940): implement this function in a follow up CL.
  throw new Error(
    'Not yet supported. Please provide the proper schema object in `generateContentConfig`.',
  );
}
