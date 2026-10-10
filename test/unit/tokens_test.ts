/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI} from '../../src/node/index.js';
import * as types from '../../src/types.js';

describe('Tokens', () => {
  let client: GoogleGenAI;
  let fetchSpy: jasmine.Spy<typeof fetch>;

  beforeEach(() => {
    client = new GoogleGenAI({
      vertexai: false,
      apiKey: 'test-api-key',
      httpOptions: {
        apiVersion: 'v1alpha',
        baseUrl: 'https://generativelanguage.googleapis.com',
      },
    });
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(
      new Response(JSON.stringify({name: 'auth_tokens/test-token'}), {
        headers: {'Content-Type': 'application/json'},
      }),
    );
  });

  async function createToken(config: types.CreateAuthTokenConfig) {
    const token = await client.authTokens.create({config});
    expect(token.name).toBe('auth_tokens/test-token');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, request] = fetchSpy.calls.mostRecent().args;
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1alpha/auth_tokens',
    );
    expect(request?.method).toBe('POST');
    return JSON.parse(request?.body as string);
  }

  const tools: types.Tool[] = [
    {functionDeclarations: [{name: 'first'}]},
    {functionDeclarations: [{name: 'second'}]},
  ];

  for (const toolCount of [0, 1, 2]) {
    it(`locks the tools field without array indices for ${toolCount} tools`, async () => {
      const constrainedTools = tools.slice(0, toolCount);
      const body = await createToken({
        liveConnectConstraints: {
          model: 'test-model',
          config: {tools: constrainedTools},
        },
        lockAdditionalFields: [],
      });

      expect(body.bidiGenerateContentSetup.tools).toEqual(constrainedTools);
      expect(body.fieldMask.split(',').sort()).toEqual(['model', 'tools']);
    });
  }

  it('combines the tools field with additional camelCase field masks', async () => {
    const body = await createToken({
      liveConnectConstraints: {
        model: 'test-model',
        config: {tools},
      },
      lockAdditionalFields: ['temperature', 'sessionResumption'],
    });

    expect(body.fieldMask.split(',').sort()).toEqual([
      'generationConfig.temperature',
      'model',
      'sessionResumption',
      'tools',
    ]);
  });

  it('preserves nested repeated fields and generation config granularity', async () => {
    const body = await createToken({
      liveConnectConstraints: {
        model: 'test-model',
        config: {
          tools,
          responseModalities: [types.Modality.AUDIO],
          temperature: 0.5,
          systemInstruction: {parts: [{text: 'first'}, {text: 'second'}]},
        },
      },
      lockAdditionalFields: [],
    });

    expect(body.fieldMask.split(',').sort()).toEqual([
      'generationConfig.responseModalities',
      'generationConfig.temperature',
      'model',
      'systemInstruction.parts',
      'tools',
    ]);
  });

  it('omits the field mask when lockAdditionalFields is unset', async () => {
    const body = await createToken({
      liveConnectConstraints: {
        model: 'test-model',
        config: {tools},
      },
    });

    expect(body.bidiGenerateContentSetup.tools).toEqual(tools);
    expect(body.fieldMask).toBeUndefined();
  });
});
