/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiClient} from './_api_client.js';
import * as common from './_common.js';
import {BaseModule} from './_common.js';
import * as converters from './converters/_tokens_converters.js';
import * as types from './types.js';

/**
 * Returns a comma-separated list of field masks from a given object.
 *
 * @param setup The object to extract field masks from.
 * @return A comma-separated list of field masks.
 */
function getFieldMasks(setup: Record<string, unknown>): string {
  const fields: string[] = [];

  for (const key in setup) {
    if (Object.prototype.hasOwnProperty.call(setup, key)) {
      const value = setup[key];
      // 2nd layer, recursively get field masks see TODO(b/418290100)
      if (
        typeof value === 'object' &&
        value != null &&
        Object.keys(value).length > 0
      ) {
        const field = Object.keys(value).map((kk) => `${key}.${kk}`);
        fields.push(...field);
      } else {
        fields.push(key); // 1st layer
      }
    }
  }

  return fields.join(',');
}

/**
 * Converts bidiGenerateContentSetup.
 * @param requestDict - The request dictionary.
 * @param config - The configuration object.
 * @return - The modified request dictionary.
 */
function convertBidiSetupToTokenSetup(
  requestDict: Record<string, unknown>,
  config?: {lockAdditionalFields?: string[]},
): Record<string, unknown> {
  // Convert bidiGenerateContentSetup from bidiGenerateContentSetup.setup.
  let setupForMaskGeneration: Record<string, unknown> | null = null;
  const bidiGenerateContentSetupValue = requestDict['bidiGenerateContentSetup'];
  if (
    typeof bidiGenerateContentSetupValue === 'object' &&
    bidiGenerateContentSetupValue !== null &&
    'setup' in bidiGenerateContentSetupValue
  ) {
    // Now we know bidiGenerateContentSetupValue is an object and has a 'setup'
    // property.
    const innerSetup = (bidiGenerateContentSetupValue as {setup: unknown})
      .setup;

    if (typeof innerSetup === 'object' && innerSetup !== null) {
      // Valid inner setup found.
      requestDict['bidiGenerateContentSetup'] = innerSetup;
      setupForMaskGeneration = innerSetup as Record<string, unknown>;
    } else {
      // `bidiGenerateContentSetupValue.setup` is not a valid object; treat as
      // if bidiGenerateContentSetup is invalid.
      delete requestDict['bidiGenerateContentSetup'];
    }
  } else if (bidiGenerateContentSetupValue !== undefined) {
    // `bidiGenerateContentSetup` exists but not in the expected
    // shape {setup: {...}}; treat as invalid.
    delete requestDict['bidiGenerateContentSetup'];
  }

  const preExistingFieldMask = requestDict['fieldMask'];
  // Handle mask generation setup.
  if (setupForMaskGeneration) {
    const generatedMaskFromBidi = getFieldMasks(setupForMaskGeneration);

    if (
      Array.isArray(config?.lockAdditionalFields) &&
      config?.lockAdditionalFields.length === 0
    ) {
      // Case 1: lockAdditionalFields is an empty array. Lock only fields from
      // bidi setup.
      if (generatedMaskFromBidi) {
        // Only assign if mask is not empty
        requestDict['fieldMask'] = generatedMaskFromBidi;
      } else {
        delete requestDict['fieldMask']; // If mask is empty, effectively no
        // specific fields locked by bidi
      }
    } else if (
      config?.lockAdditionalFields &&
      config.lockAdditionalFields.length > 0 &&
      preExistingFieldMask !== null &&
      Array.isArray(preExistingFieldMask) &&
      preExistingFieldMask.length > 0
    ) {
      // Case 2: Lock fields from bidi setup + additional fields
      // (preExistingFieldMask).

      const generationConfigFields = [
        'temperature',
        'topK',
        'topP',
        'maxOutputTokens',
        'responseModalities',
        'seed',
        'speechConfig',
      ];

      let mappedFieldsFromPreExisting: string[] = [];
      if (preExistingFieldMask.length > 0) {
        mappedFieldsFromPreExisting = preExistingFieldMask.map((field) => {
          if (generationConfigFields.includes(field)) {
            return `generationConfig.${field}`;
          }
          return field; // Keep original field name if not in
          // generationConfigFields
        });
      }

      const finalMaskParts: string[] = [];
      if (generatedMaskFromBidi) {
        finalMaskParts.push(generatedMaskFromBidi);
      }
      if (mappedFieldsFromPreExisting.length > 0) {
        finalMaskParts.push(...mappedFieldsFromPreExisting);
      }

      if (finalMaskParts.length > 0) {
        requestDict['fieldMask'] = finalMaskParts.join(',');
      } else {
        // If no fields from bidi and no valid additional fields from
        // pre-existing mask.
        delete requestDict['fieldMask'];
      }
    } else {
      // Case 3: "Lock all fields" (meaning, don't send a field_mask, let server
      // defaults apply or all are mutable). This is hit if:
      //  - `config.lockAdditionalFields` is undefined.
      //  - `config.lockAdditionalFields` is non-empty, BUT
      //  `preExistingFieldMask` is null, not a string, or an empty string.
      delete requestDict['fieldMask'];
    }
  } else {
    // No valid `bidiGenerateContentSetup` was found or extracted.
    // "Lock additional null fields if any".
    if (
      preExistingFieldMask !== null &&
      Array.isArray(preExistingFieldMask) &&
      preExistingFieldMask.length > 0
    ) {
      // If there's a pre-existing field mask, it's a string, and it's not
      // empty, then we should lock all fields.
      requestDict['fieldMask'] = preExistingFieldMask.join(',');
    } else {
      delete requestDict['fieldMask'];
    }
  }

  return requestDict;
}

export class Tokens extends BaseModule {
  constructor(private readonly apiClient: ApiClient) {
    super();
  }
  /**
   * Creates an ephemeral auth token resource.
   *
   * @experimental
   *
   * @remarks
   * Ephermeral auth tokens is only supported in the Gemini Developer API.
   * It can be used for the session connection to the Live constrained API.
   *
   * @param params - The parameters for the create request.
   * @return The created auth token.
   *
   * @example
   * ```ts
   * // Case 1: If LiveEphemeralParameters is unset, unlock LiveConnectConfig
   * // when using the token in Live API sessions. Each session connection can
   * // use a different configuration.
   * const config: CreateAuthTokenConfig = {
   *     uses: 3,
   *     expireTime: '2025-05-01T00:00:00Z',
   * }
   * const token = await ai.tokens.create(config);
   *
   * // Case 2: If LiveEphemeralParameters is set, lock all fields in
   * // LiveConnectConfig when using the token in Live API sessions. For
   * // example, changing `outputAudioTranscription` in the Live API
   * // connection will be ignored by the API.
   * const config: CreateAuthTokenConfig =
   *     uses: 3,
   *     expireTime: '2025-05-01T00:00:00Z',
   *     LiveEphemeralParameters: {
   *        model: 'gemini-2.0-flash-001',
   *        config: {
   *           'responseModalities': ['AUDIO'],
   *           'systemInstruction': 'Always answer in English.',
   *        }
   *     }
   * }
   * const token = await ai.tokens.create(config);
   *
   * // Case 3: If LiveEphemeralParameters is set and lockAdditionalFields is
   * // set, lock LiveConnectConfig with set and additional fields (e.g.
   * // responseModalities, systemInstruction, temperature in this example) when
   * // using the token in Live API sessions.
   * const config: CreateAuthTokenConfig =
   *     uses: 3,
   *     expireTime: '2025-05-01T00:00:00Z',
   *     LiveEphemeralParameters: {
   *        model: 'gemini-2.0-flash-001',
   *        config: {
   *           'responseModalities': ['AUDIO'],
   *           'systemInstruction': 'Always answer in English.',
   *        }
   *     },
   *     lockAdditionalFields: ['temperature'],
   * }
   * const token = await ai.tokens.create(config);
   *
   * // Case 4: If LiveEphemeralParameters is set and lockAdditionalFields is
   * // empty array, lock LiveConnectConfig with set fields (e.g.
   * // responseModalities, systemInstruction in this example) when using the
   * // token in Live API sessions.
   * const config: CreateAuthTokenConfig =
   *     uses: 3,
   *     expireTime: '2025-05-01T00:00:00Z',
   *     LiveEphemeralParameters: {
   *        model: 'gemini-2.0-flash-001',
   *        config: {
   *           'responseModalities': ['AUDIO'],
   *           'systemInstruction': 'Always answer in English.',
   *        }
   *     },
   *     lockAdditionalFields: [],
   * }
   * const token = await ai.tokens.create(config);
   * ```
   */

  async create(
    params: types.CreateAuthTokenParameters,
  ): Promise<types.AuthToken> {
    let response: Promise<types.AuthToken>;
    let path: string = '';
    let queryParams: Record<string, string> = {};
    if (this.apiClient.isVertexAI()) {
      throw new Error(
        'The client.tokens.create method is only supported by the Gemini Developer API.',
      );
    } else {
      const body = converters.createAuthTokenParametersToMldev(
        this.apiClient,
        params,
      );
      path = common.formatMap(
        'auth_tokens',
        body['_url'] as Record<string, unknown>,
      );

      queryParams = body['_query'] as Record<string, string>;
      delete body['config'];
      delete body['_url'];
      delete body['_query'];

      const transformedBody = convertBidiSetupToTokenSetup(body, params.config);

      response = this.apiClient
        .request({
          path: path,
          queryParams: queryParams,
          body: JSON.stringify(transformedBody),
          httpMethod: 'POST',
          httpOptions: params.config?.httpOptions,
          abortSignal: params.config?.abortSignal,
        })
        .then((httpResponse) => {
          return httpResponse.json();
        }) as Promise<types.AuthToken>;

      return response.then((apiResponse) => {
        const resp = converters.authTokenFromMldev(apiResponse);

        return resp as types.AuthToken;
      });
    }
  }
}
