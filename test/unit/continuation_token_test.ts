/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as afc from '../../src/_afc.js';
import {GoogleGenAI} from '../../src/client.js';
import * as types from '../../src/types.js';

function buildResponse(options: {
  parts?: types.Part[];
  finishReason?: types.FinishReason;
  continuationToken?: string;
  usageMetadata?: types.GenerateContentResponseUsageMetadata;
  safetyRatings?: types.SafetyRating[];
  groundingMetadata?: types.GroundingMetadata;
  citationMetadata?: types.CitationMetadata;
  logprobsResult?: types.LogprobsResult;
  finishMessage?: string;
  responseId?: string;
  modelVersion?: string;
}): types.GenerateContentResponse {
  const response = new types.GenerateContentResponse();
  response.candidates = [
    {
      content: {
        role: 'model',
        parts: options.parts ?? [{text: 'default'}],
      },
      finishReason: options.finishReason,
      continuationToken: options.continuationToken,
      safetyRatings: options.safetyRatings,
      groundingMetadata: options.groundingMetadata,
      citationMetadata: options.citationMetadata,
      logprobsResult: options.logprobsResult,
      finishMessage: options.finishMessage,
      index: 0,
    },
  ];
  response.usageMetadata = options.usageMetadata;
  response.responseId = options.responseId;
  response.modelVersion = options.modelVersion;
  return response;
}

function createWeatherCallableTool(spyFn?: jasmine.Spy): types.CallableTool {
  return {
    tool: async () => ({
      functionDeclarations: [
        {
          name: 'get_weather',
          description: 'Gets weather for a location',
          parameters: {
            type: types.Type.OBJECT,
            properties: {location: {type: types.Type.STRING}},
            required: ['location'],
          },
        },
      ],
    }),
    callTool: async (functionCalls: types.FunctionCall[]) => {
      if (spyFn) {
        spyFn(functionCalls);
      }
      return [
        {
          functionResponse: {
            name: 'get_weather',
            response: {result: '72F and sunny in Boston'},
          },
        },
      ];
    },
  };
}

async function* makeStream(
  chunks: types.GenerateContentResponse[],
): AsyncGenerator<types.GenerateContentResponse> {
  for (const chunk of chunks) {
    yield chunk;
  }
}

interface InternalModels {
  generateContentInternal: (
    params: types.GenerateContentParameters,
  ) => Promise<types.GenerateContentResponse>;
  generateContentStreamInternal: (
    params: types.GenerateContentParameters,
  ) => Promise<AsyncGenerator<types.GenerateContentResponse>>;
}

describe('continuation token helpers (_afc)', () => {
  it('shouldEnableAutomaticContinuation respects defaults regardless of maxOutputTokens', () => {
    expect(afc.shouldEnableAutomaticContinuation(undefined)).toBeTrue();
    expect(afc.shouldEnableAutomaticContinuation({})).toBeTrue();
    expect(afc.shouldEnableAutomaticContinuation(undefined, false)).toBeFalse();
    expect(afc.shouldEnableAutomaticContinuation(undefined, true)).toBeTrue();
    expect(afc.shouldEnableAutomaticContinuation({}, false)).toBeFalse();
    expect(afc.shouldEnableAutomaticContinuation({}, true)).toBeTrue();
    expect(
      afc.shouldEnableAutomaticContinuation(
        {automaticContinuation: true},
        false,
      ),
    ).toBeTrue();
    expect(
      afc.shouldEnableAutomaticContinuation(
        {automaticContinuation: false},
        true,
      ),
    ).toBeFalse();
    // maxOutputTokens is forwarded to backend and does not disable automatic
    // continuation
    expect(
      afc.shouldEnableAutomaticContinuation(
        {automaticContinuation: true, maxOutputTokens: 128},
        false,
      ),
    ).toBeTrue();
    expect(
      afc.shouldEnableAutomaticContinuation({maxOutputTokens: 128}),
    ).toBeTrue();
    expect(
      afc.shouldEnableAutomaticContinuation({maxOutputTokens: 128}, true),
    ).toBeTrue();
    expect(
      afc.shouldEnableAutomaticContinuation({maxOutputTokens: 128}, false),
    ).toBeFalse();
  });

  it('isResumableFinishReason only returns true for FinishReason.CONTINUATION', () => {
    expect(
      afc.isResumableFinishReason(types.FinishReason.CONTINUATION),
    ).toBeTrue();
    expect(
      afc.isResumableFinishReason(types.FinishReason.MAX_TOKENS),
    ).toBeFalse();
    expect(afc.isResumableFinishReason(types.FinishReason.STOP)).toBeFalse();
    expect(afc.isResumableFinishReason(undefined)).toBeFalse();
  });

  it('prepareContinuationConfig sets continuationToken and strips automaticContinuation without mutating input', () => {
    expect(afc.prepareContinuationConfig(undefined, undefined)).toBeUndefined();
    expect(afc.prepareContinuationConfig(undefined, 'tok-1')).toEqual({
      continuationToken: 'tok-1',
    });

    const baseConfig: types.GenerateContentConfig = {
      temperature: 0.5,
      automaticContinuation: true,
    };
    const sameRef = afc.prepareContinuationConfig(baseConfig, undefined, false);
    expect(sameRef).toBe(baseConfig);

    const withToken = afc.prepareContinuationConfig(baseConfig, 'tok-2', false);
    expect(withToken).toEqual({
      temperature: 0.5,
      automaticContinuation: true,
      continuationToken: 'tok-2',
    });
    expect(baseConfig.continuationToken).toBeUndefined();

    const stripped = afc.prepareContinuationConfig(baseConfig, 'tok-3', true);
    expect(stripped).toEqual({
      temperature: 0.5,
      continuationToken: 'tok-3',
    });
    expect(stripped?.automaticContinuation).toBeUndefined();
    expect(baseConfig.automaticContinuation).toBeTrue();
  });

  it('shouldContinueGeneration checks continuationToken and finishReason === CONTINUATION on candidates[0]', () => {
    expect(afc.shouldContinueGeneration(undefined)).toBeUndefined();
    const emptyCandResp = new types.GenerateContentResponse();
    emptyCandResp.candidates = [];
    expect(afc.shouldContinueGeneration(emptyCandResp)).toBeUndefined();

    const contResp = buildResponse({
      parts: [{text: 'hop1'}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'tok-1',
    });
    expect(afc.shouldContinueGeneration(contResp)).toBe('tok-1');

    const maxTokensResp = buildResponse({
      parts: [{text: 'hop1'}],
      finishReason: types.FinishReason.MAX_TOKENS,
      continuationToken: 'tok-2',
    });
    expect(afc.shouldContinueGeneration(maxTokensResp)).toBeUndefined();

    const stopResp = buildResponse({
      parts: [{text: 'done'}],
      finishReason: types.FinishReason.STOP,
      continuationToken: 'tok-3',
    });
    expect(afc.shouldContinueGeneration(stopResp)).toBeUndefined();

    const noTokenResp = buildResponse({
      parts: [{text: 'hop1'}],
      finishReason: types.FinishReason.CONTINUATION,
    });
    expect(afc.shouldContinueGeneration(noTokenResp)).toBeUndefined();

    // Only candidates[0] drives continuation
    const multiCandResp = new types.GenerateContentResponse();
    multiCandResp.candidates = [
      {
        content: {role: 'model', parts: [{text: 'cand0'}]},
        finishReason: types.FinishReason.STOP,
      },
      {
        content: {role: 'model', parts: [{text: 'cand1'}]},
        finishReason: types.FinishReason.CONTINUATION,
        continuationToken: 'tok-cand1',
      },
    ];
    expect(afc.shouldContinueGeneration(multiCandResp)).toBeUndefined();
  });

  it('mergeCandidates merges candidates element-wise and preserves trailing candidates', () => {
    const c1Hop1: types.Candidate = {
      content: {role: 'model', parts: [{text: 'C0-H1 '}]},
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'tok-0',
      index: 0,
    };
    const c2Hop1: types.Candidate = {
      content: {role: 'model', parts: [{text: 'C1-H1 '}]},
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'tok-1',
      index: 1,
    };
    const c1Hop2: types.Candidate = {
      content: {role: 'model', parts: [{text: 'C0-H2'}]},
      finishReason: types.FinishReason.STOP,
      index: 0,
    };
    const c2Hop2: types.Candidate = {
      content: {role: 'model', parts: [{text: 'C1-H2'}]},
      finishReason: types.FinishReason.STOP,
      index: 1,
    };
    const c3Hop2: types.Candidate = {
      content: {role: 'model', parts: [{text: 'C2-H2'}]},
      finishReason: types.FinishReason.STOP,
      index: 2,
    };

    // Empty arrays on either side
    expect(afc.mergeCandidates([], [c1Hop2])).toEqual([c1Hop2]);
    expect(afc.mergeCandidates([c1Hop1], [])).toEqual([c1Hop1]);

    // 2 candidates + 3 candidates -> 3 merged candidates
    const merged2To3 = afc.mergeCandidates(
      [c1Hop1, c2Hop1],
      [c1Hop2, c2Hop2, c3Hop2],
    );
    expect(merged2To3.length).toBe(3);
    expect(merged2To3[0].content?.parts).toEqual([
      {text: 'C0-H1 '},
      {text: 'C0-H2'},
    ]);
    expect(merged2To3[0].finishReason).toBe(types.FinishReason.STOP);
    expect(merged2To3[0].continuationToken).toBeUndefined();
    expect(merged2To3[1].content?.parts).toEqual([
      {text: 'C1-H1 '},
      {text: 'C1-H2'},
    ]);
    expect(merged2To3[2].content?.parts).toEqual([{text: 'C2-H2'}]);

    // 3 candidates + 2 candidates -> 3 merged candidates
    const merged3To2 = afc.mergeCandidates(
      [c1Hop1, c2Hop1, c3Hop2],
      [c1Hop2, c2Hop2],
    );
    expect(merged3To2.length).toBe(3);
    expect(merged3To2[2].content?.parts).toEqual([{text: 'C2-H2'}]);
  });

  it('mergeContinuationResponses merges parts, usageMetadata, safetyRatings, citations, grounding, logprobs, and terminal fields', () => {
    expect(
      afc.mergeContinuationResponses([]) instanceof
        types.GenerateContentResponse,
    ).toBeTrue();

    // ModalityTokenCount when prevVal is empty array and currVal is
    // non-empty array
    const emptyModalityResp = buildResponse({
      parts: [{text: 'a'}],
      usageMetadata: {promptTokensDetails: []},
    });
    const nonEmptyModalityResp = buildResponse({
      parts: [{text: 'b'}],
      usageMetadata: {
        promptTokensDetails: [
          {modality: types.MediaModality.TEXT, tokenCount: 10},
        ],
      },
    });
    const mergedModality = afc.mergeContinuationResponses([
      emptyModalityResp,
      nonEmptyModalityResp,
    ]);
    expect(mergedModality.usageMetadata?.promptTokensDetails).toEqual([
      {modality: types.MediaModality.TEXT, tokenCount: 10},
    ]);

    const hop1 = buildResponse({
      parts: [
        {text: '', thought: true},
        {text: 'Thinking...', thought: true},
        {text: 'Hello '},
      ],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'tok-1',
      citationMetadata: {
        citations: [{uri: 'https://example.com/1', startIndex: 0, endIndex: 5}],
      },
      groundingMetadata: {webSearchQueries: ['hello']},
      logprobsResult: {
        logProbabilitySum: -1.5,
        chosenCandidates: [{token: 'Hello ', logProbability: -1.5}],
      },
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 20,
        totalTokenCount: 35,
        thoughtsTokenCount: 5,
        promptTokensDetails: [
          {modality: types.MediaModality.TEXT, tokenCount: 10},
        ],
      },
      safetyRatings: [
        {
          category: types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          probability: types.HarmProbability.LOW,
          blocked: false,
        },
      ],
      responseId: 'resp-1',
      modelVersion: 'gemini-2.5-pro',
    });

    const hop2 = buildResponse({
      parts: [{text: 'world!'}],
      finishReason: types.FinishReason.STOP,
      finishMessage: 'Completed',
      citationMetadata: {
        citations: [
          {uri: 'https://example.com/2', startIndex: 6, endIndex: 12},
        ],
      },
      groundingMetadata: {webSearchQueries: ['world']},
      logprobsResult: {
        logProbabilitySum: -0.5,
        chosenCandidates: [{token: 'world!', logProbability: -0.5}],
      },
      usageMetadata: {
        promptTokenCount: 30,
        candidatesTokenCount: 15,
        totalTokenCount: 48,
        thoughtsTokenCount: 3,
        promptTokensDetails: [
          {modality: types.MediaModality.TEXT, tokenCount: 25},
          {modality: types.MediaModality.IMAGE, tokenCount: 5},
        ],
      },
      safetyRatings: [
        {
          category: types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          probability: types.HarmProbability.HIGH,
          blocked: true,
        },
        {
          category: types.HarmCategory.HARM_CATEGORY_HARASSMENT,
          probability: types.HarmProbability.NEGLIGIBLE,
        },
      ],
      responseId: 'resp-2',
      modelVersion: 'gemini-2.5-pro',
    });

    const merged = afc.mergeContinuationResponses([hop1, hop2]);

    expect(merged instanceof types.GenerateContentResponse).toBeTrue();
    expect(merged.text).toBe('Hello world!');
    expect(merged.responseId).toBe('resp-2');
    expect(merged.candidates?.[0]?.finishReason).toBe(types.FinishReason.STOP);
    expect(merged.candidates?.[0]?.finishMessage).toBe('Completed');
    expect(merged.candidates?.[0]?.citationMetadata).toEqual({
      citations: [
        {uri: 'https://example.com/1', startIndex: 0, endIndex: 5},
        {uri: 'https://example.com/2', startIndex: 6, endIndex: 12},
      ],
    });
    expect(merged.candidates?.[0]?.groundingMetadata).toEqual({
      webSearchQueries: ['hello', 'world'],
    });
    expect(merged.candidates?.[0]?.logprobsResult).toEqual({
      logProbabilitySum: -2.0,
      chosenCandidates: [
        {token: 'Hello ', logProbability: -1.5},
        {token: 'world!', logProbability: -0.5},
      ],
    });
    expect(merged.candidates?.[0]?.content?.parts).toEqual([
      {text: '', thought: true},
      {text: 'Thinking...', thought: true},
      {text: 'Hello '},
      {text: 'world!'},
    ]);

    expect(merged.usageMetadata?.promptTokenCount).toBe(40);
    expect(merged.usageMetadata?.candidatesTokenCount).toBe(35);
    expect(merged.usageMetadata?.totalTokenCount).toBe(83);
    expect(merged.usageMetadata?.thoughtsTokenCount).toBe(8);
    expect(merged.usageMetadata?.promptTokensDetails).toEqual([
      {modality: types.MediaModality.TEXT, tokenCount: 35},
      {modality: types.MediaModality.IMAGE, tokenCount: 5},
    ]);

    expect(merged.candidates?.[0]?.safetyRatings).toEqual([
      {
        category: types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        probability: types.HarmProbability.HIGH,
        blocked: true,
      },
      {
        category: types.HarmCategory.HARM_CATEGORY_HARASSMENT,
        probability: types.HarmProbability.NEGLIGIBLE,
      },
    ]);
  });
});

describe('Models automatic continuation', () => {
  let client: GoogleGenAI;
  let internalModels: InternalModels;

  beforeEach(() => {
    client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    internalModels = client.models as unknown as InternalModels;
  });

  it('generateContent enables automaticContinuation by default and respects automaticContinuation: false opt-out', async () => {
    const hop1 = buildResponse({
      parts: [{text: 'Hop 1 continuation. '}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'tok-cont-1',
    });
    const hop2 = buildResponse({
      parts: [{text: 'Hop 2 stop.'}],
      finishReason: types.FinishReason.STOP,
    });

    const spy = spyOn(internalModels, 'generateContentInternal');

    // 1. Default (config omitted, empty config, or AFC disabled) -> enabled
    for (const cfg of [
      undefined,
      {},
      {automaticFunctionCalling: {disable: true}},
    ] as Array<types.GenerateContentConfig | undefined>) {
      spy.and.returnValues(Promise.resolve(hop1), Promise.resolve(hop2));
      spy.calls.reset();

      const result = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Write a long story',
        config: cfg,
      });

      expect(spy).toHaveBeenCalledTimes(2);
      expect(result.text).toBe('Hop 1 continuation. Hop 2 stop.');
      expect(result.candidates?.[0]?.finishReason).toBe(
        types.FinishReason.STOP,
      );
      expect(result.candidates?.[0]?.continuationToken).toBeUndefined();
    }

    // 2. Explicit automaticContinuation: false -> disabled (both AFC enabled
    // and disabled)
    for (const disableAfc of [false, true]) {
      spy.and.returnValue(Promise.resolve(hop1));
      spy.calls.reset();

      const result = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Explicit False',
        config: {
          automaticContinuation: false,
          automaticFunctionCalling: {disable: disableAfc},
        },
      });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(result).toBe(hop1);
      expect(result.candidates?.[0]?.finishReason).toBe(
        types.FinishReason.CONTINUATION,
      );
      expect(result.candidates?.[0]?.continuationToken).toBe('tok-cont-1');
    }
  });

  it('generateContent automatically continues across 4 hops, sums usageMetadata, and does not mutate caller config', async () => {
    const hop1 = buildResponse({
      parts: [{text: 'Hop 1 part. '}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'token-hop-1',
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 32768,
        thoughtsTokenCount: 500,
        totalTokenCount: 33278,
      },
    });
    const hop2 = buildResponse({
      parts: [{text: 'Hop 2 part. '}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'token-hop-2',
      usageMetadata: {
        promptTokenCount: 32778,
        candidatesTokenCount: 32768,
        thoughtsTokenCount: 300,
        totalTokenCount: 65846,
      },
    });
    const hop3 = buildResponse({
      parts: [{text: 'Hop 3 part. '}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'token-hop-3',
      usageMetadata: {
        promptTokenCount: 65546,
        candidatesTokenCount: 32768,
        thoughtsTokenCount: 200,
        totalTokenCount: 98514,
      },
    });
    const hop4 = buildResponse({
      parts: [{text: 'Hop 4 final part.'}],
      finishReason: types.FinishReason.STOP,
      usageMetadata: {
        promptTokenCount: 98314,
        candidatesTokenCount: 1024,
        thoughtsTokenCount: 100,
        totalTokenCount: 99438,
      },
    });

    const spy = spyOn(internalModels, 'generateContentInternal');

    for (const disableAfc of [false, true]) {
      const userConfig: types.GenerateContentConfig = {
        automaticContinuation: true,
        temperature: 0.7,
        automaticFunctionCalling: {disable: disableAfc},
      };
      spy.and.returnValues(
        Promise.resolve(hop1),
        Promise.resolve(hop2),
        Promise.resolve(hop3),
        Promise.resolve(hop4),
      );
      spy.calls.reset();

      const result = await client.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: 'Write a very long story',
        config: userConfig,
      });

      expect(spy).toHaveBeenCalledTimes(4);
      const args = spy.calls.allArgs();
      const expectedTokens: Array<string | undefined> = [
        undefined,
        'token-hop-1',
        'token-hop-2',
        'token-hop-3',
      ];
      const firstContents = args[0][0].contents;
      for (let idx = 0; idx < expectedTokens.length; idx++) {
        expect(args[idx][0].config?.continuationToken).toBe(
          expectedTokens[idx],
        );
        expect(args[idx][0].config?.temperature).toBe(0.7);
        expect(args[idx][0].contents).toEqual(firstContents);
      }

      expect(result.text).toBe(
        'Hop 1 part. Hop 2 part. Hop 3 part. Hop 4 final part.',
      );
      expect(result.candidates?.[0]?.finishReason).toBe(
        types.FinishReason.STOP,
      );
      expect(result.candidates?.[0]?.continuationToken).toBeUndefined();
      expect(result.candidates?.[0]?.content?.parts).toEqual([
        {text: 'Hop 1 part. '},
        {text: 'Hop 2 part. '},
        {text: 'Hop 3 part. '},
        {text: 'Hop 4 final part.'},
      ]);
      expect(result.usageMetadata?.promptTokenCount).toBe(
        10 + 32778 + 65546 + 98314,
      );
      expect(result.usageMetadata?.candidatesTokenCount).toBe(32768 * 3 + 1024);
      expect(result.usageMetadata?.thoughtsTokenCount).toBe(
        500 + 300 + 200 + 100,
      );
      expect(result.usageMetadata?.totalTokenCount).toBe(
        33278 + 65846 + 98514 + 99438,
      );
      // Caller's config is not mutated
      expect(userConfig.continuationToken).toBeUndefined();
    }
  });

  it('generateContent preserves empty text placeholder part from a thought-only hop', async () => {
    const hop1 = buildResponse({
      parts: [{text: '', thoughtSignature: 'sig-hop-1'}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'tok-after-thought',
    });
    const hop2 = buildResponse({
      parts: [{text: 'Final answer after deep thinking.'}],
      finishReason: types.FinishReason.STOP,
    });

    const spy = spyOn(
      internalModels,
      'generateContentInternal',
    ).and.returnValues(Promise.resolve(hop1), Promise.resolve(hop2));

    const result = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: 'Solve hard math problem',
    });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(result.text).toBe('Final answer after deep thinking.');
    const parts = result.candidates?.[0]?.content?.parts;
    expect(parts?.length).toBe(2);
    expect(parts?.[0]).toEqual({text: '', thoughtSignature: 'sig-hop-1'});
    expect(parts?.[1]).toEqual({text: 'Final answer after deep thinking.'});
  });

  it('generateContent and generateContentStream support continuation with non-callable FunctionDeclaration tools', async () => {
    const hop1 = buildResponse({
      parts: [{text: 'Part 1. '}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'tok-incompat',
    });
    const hop2 = buildResponse({
      parts: [{text: 'Part 2.'}],
      finishReason: types.FinishReason.STOP,
    });
    const toolDecl: types.Tool = {
      functionDeclarations: [{name: 'manual_fn', description: 'manual'}],
    };

    const gcSpy = spyOn(
      internalModels,
      'generateContentInternal',
    ).and.returnValues(Promise.resolve(hop1), Promise.resolve(hop2));

    const result = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: 'Test incompatible tools unary',
      config: {tools: [toolDecl]},
    });
    expect(gcSpy).toHaveBeenCalledTimes(2);
    expect(result.text).toBe('Part 1. Part 2.');

    const streamSpy = spyOn(
      internalModels,
      'generateContentStreamInternal',
    ).and.returnValues(
      Promise.resolve(makeStream([hop1])),
      Promise.resolve(makeStream([hop2])),
    );

    const stream = await client.models.generateContentStream({
      model: 'gemini-2.5-pro',
      contents: 'Test incompatible tools stream',
      config: {tools: [toolDecl]},
    });
    const texts: string[] = [];
    for await (const chunk of stream) {
      texts.push(chunk.text ?? '');
    }
    expect(streamSpy).toHaveBeenCalledTimes(2);
    expect(texts).toEqual(['Part 1. ', 'Part 2.']);
  });

  it('generateContent forwards maxOutputTokens and stops when finishReason is MAX_TOKENS', async () => {
    const hop1 = buildResponse({
      parts: [{text: 'Part 1, '}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'tok-1',
    });
    const hop2 = buildResponse({
      parts: [{text: 'Truncated'}],
      finishReason: types.FinishReason.MAX_TOKENS,
      continuationToken: 'tok-2',
    });
    const spy = spyOn(
      internalModels,
      'generateContentInternal',
    ).and.returnValues(Promise.resolve(hop1), Promise.resolve(hop2));

    const result = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Write a long story',
      config: {automaticContinuation: true, maxOutputTokens: 50},
    });

    expect(spy).toHaveBeenCalledTimes(2);
    const args = spy.calls.allArgs();
    expect(args[0][0].config?.maxOutputTokens).toBe(50);
    expect(args[0][0].config?.continuationToken).toBeUndefined();
    expect(args[1][0].config?.maxOutputTokens).toBe(50);
    expect(args[1][0].config?.continuationToken).toBe('tok-1');
    expect(result.text).toBe('Part 1, Truncated');
    expect(result.candidates?.[0]?.finishReason).toBe(
      types.FinishReason.MAX_TOKENS,
    );
  });

  it('generateContent decouples automatic continuation from AFC (CallableTool)', async () => {
    const turn1Hop1 = buildResponse({
      parts: [{text: 'Thinking about weather...', thought: true}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'afc-tok-1',
    });
    const turn1Hop2 = buildResponse({
      parts: [
        {
          functionCall: {
            name: 'get_weather',
            args: {location: 'Boston'},
          },
        },
      ],
      finishReason: types.FinishReason.STOP,
    });
    const turn2Hop1 = buildResponse({
      parts: [{text: 'The weather in Boston is 72F and sunny.'}],
      finishReason: types.FinishReason.STOP,
    });

    const spy = spyOn(
      internalModels,
      'generateContentInternal',
    ).and.returnValues(
      Promise.resolve(turn1Hop1),
      Promise.resolve(turn1Hop2),
      Promise.resolve(turn2Hop1),
    );
    const toolSpy = jasmine.createSpy('weatherTool');
    const weatherTool = createWeatherCallableTool(toolSpy);

    const result = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'What is the weather in Boston?',
      config: {
        tools: [weatherTool],
      },
    });

    expect(spy).toHaveBeenCalledTimes(3);
    expect(toolSpy).toHaveBeenCalledTimes(1);
    const args = spy.calls.allArgs();
    // Turn 1 Hop 1: no continuation token
    expect(args[0][0].config?.continuationToken).toBeUndefined();
    // Turn 1 Hop 2: resumes with afc-tok-1
    expect(args[1][0].config?.continuationToken).toBe('afc-tok-1');
    // Turn 2 Hop 1 (after tool call): continuationToken is cleared
    expect(args[2][0].config?.continuationToken).toBeUndefined();
    expect(result.text).toBe('The weather in Boston is 72F and sunny.');
    expect(result.automaticFunctionCallingHistory?.length).toBe(3);
    expect(result.automaticFunctionCallingHistory?.[1]?.parts).toEqual([
      {text: 'Thinking about weather...', thought: true},
      {
        functionCall: {
          name: 'get_weather',
          args: {location: 'Boston'},
        },
      },
    ]);
  });

  it('generateContentStream enables automaticContinuation by default and respects automaticContinuation: false opt-out', async () => {
    const chunk1 = buildResponse({
      parts: [{text: 'Chunk 1. '}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'tok-1',
    });
    const chunk2 = buildResponse({
      parts: [{text: 'Chunk 2.'}],
      finishReason: types.FinishReason.STOP,
    });
    const spy = spyOn(internalModels, 'generateContentStreamInternal');

    // 1. Default (config omitted, empty config, or AFC disabled) -> enabled
    for (const cfg of [
      undefined,
      {},
      {automaticFunctionCalling: {disable: true}},
    ] as Array<types.GenerateContentConfig | undefined>) {
      spy.and.returnValues(
        Promise.resolve(makeStream([chunk1])),
        Promise.resolve(makeStream([chunk2])),
      );
      spy.calls.reset();

      const stream = await client.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: 'Stream a story',
        config: cfg,
      });
      const texts: string[] = [];
      for await (const chunk of stream) {
        texts.push(chunk.text ?? '');
      }

      expect(spy).toHaveBeenCalledTimes(2);
      expect(texts).toEqual(['Chunk 1. ', 'Chunk 2.']);
    }

    // 2. Explicit automaticContinuation: false -> disabled (both AFC enabled
    // and disabled)
    for (const disableAfc of [false, true]) {
      spy.and.returnValue(Promise.resolve(makeStream([chunk1])));
      spy.calls.reset();

      const stream = await client.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: 'Stream a story',
        config: {
          automaticContinuation: false,
          automaticFunctionCalling: {disable: disableAfc},
        },
      });
      const received: types.GenerateContentResponse[] = [];
      for await (const chunk of stream) {
        received.push(chunk);
      }

      expect(spy).toHaveBeenCalledTimes(1);
      expect(received.length).toBe(1);
      expect(received[0].text).toBe('Chunk 1. ');
    }
  });

  it('generateContentStream automatically continues when automaticContinuation is true', async () => {
    const hop1Chunk1 = buildResponse({parts: [{text: 'Hop1-A '}]});
    const hop1Chunk2 = buildResponse({
      parts: [{text: 'Hop1-B '}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'stream-tok-1',
    });
    const hop2Chunk1 = buildResponse({
      parts: [{text: 'Hop2-A'}],
      finishReason: types.FinishReason.STOP,
    });

    const spy = spyOn(
      internalModels,
      'generateContentStreamInternal',
    ).and.returnValues(
      Promise.resolve(makeStream([hop1Chunk1, hop1Chunk2])),
      Promise.resolve(makeStream([hop2Chunk1])),
    );

    const stream = await client.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: 'Stream a story',
      config: {automaticContinuation: true},
    });
    const texts: string[] = [];
    for await (const chunk of stream) {
      texts.push(chunk.text ?? '');
    }

    expect(spy).toHaveBeenCalledTimes(2);
    const args = spy.calls.allArgs();
    expect(args[0][0].config?.continuationToken).toBeUndefined();
    expect(args[1][0].config?.continuationToken).toBe('stream-tok-1');
    expect(texts).toEqual(['Hop1-A ', 'Hop1-B ', 'Hop2-A']);
  });

  it('generateContentStream handles intermediate chunk continuationToken and final chunk finishReason across 4 hops', async () => {
    const toolDecl: types.Tool = {
      functionDeclarations: [{name: 'manual_fn', description: 'manual'}],
    };
    for (const cfg of [
      {
        automaticContinuation: true,
        automaticFunctionCalling: {disable: false},
      },
      {
        automaticContinuation: true,
        automaticFunctionCalling: {disable: true},
      },
      {
        automaticContinuation: true,
        tools: [toolDecl],
      },
    ] as types.GenerateContentConfig[]) {
      const hop1 = [
        buildResponse({
          parts: [{text: 'H1A '}],
          continuationToken: 'tok-hop-1',
        }),
        buildResponse({
          parts: [{text: 'H1B '}],
          finishReason: types.FinishReason.CONTINUATION,
        }),
      ];
      const hop2 = [
        buildResponse({
          parts: [{text: 'H2A '}],
          continuationToken: 'tok-hop-2',
        }),
        buildResponse({
          parts: [{text: 'H2B '}],
          finishReason: types.FinishReason.CONTINUATION,
        }),
      ];
      const hop3 = [
        buildResponse({
          parts: [{text: 'H3 '}],
          finishReason: types.FinishReason.CONTINUATION,
          continuationToken: 'tok-hop-3',
        }),
      ];
      const hop4 = [
        buildResponse({
          parts: [{text: 'H4.'}],
          finishReason: types.FinishReason.STOP,
        }),
      ];

      const spy = (
        jasmine.isSpy(internalModels.generateContentStreamInternal)
          ? (internalModels.generateContentStreamInternal as unknown as jasmine.Spy)
          : spyOn(internalModels, 'generateContentStreamInternal')
      ).and.returnValues(
        Promise.resolve(makeStream(hop1)),
        Promise.resolve(makeStream(hop2)),
        Promise.resolve(makeStream(hop3)),
        Promise.resolve(makeStream(hop4)),
      );
      spy.calls.reset();

      const stream = await client.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: 'Stream 4 hops',
        config: cfg,
      });
      const texts: string[] = [];
      for await (const chunk of stream) {
        texts.push(chunk.text ?? '');
      }

      expect(spy).toHaveBeenCalledTimes(4);
      const args = spy.calls.allArgs();
      expect(args[0][0].config?.continuationToken).toBeUndefined();
      expect(args[1][0].config?.continuationToken).toBe('tok-hop-1');
      expect(args[2][0].config?.continuationToken).toBe('tok-hop-2');
      expect(args[3][0].config?.continuationToken).toBe('tok-hop-3');
      for (const callArg of [args[1][0], args[2][0], args[3][0]]) {
        expect(callArg.contents).toEqual(args[0][0].contents);
      }
      expect(texts).toEqual(['H1A ', 'H1B ', 'H2A ', 'H2B ', 'H3 ', 'H4.']);
    }
  });

  it('generateContentStream forwards maxOutputTokens and stops when finishReason is MAX_TOKENS', async () => {
    const hop1 = [
      buildResponse({
        parts: [{text: 'Stream Part 1, '}],
        finishReason: types.FinishReason.CONTINUATION,
        continuationToken: 'stream-tok-1',
      }),
    ];
    const hop2 = [
      buildResponse({
        parts: [{text: 'Stream Truncated'}],
        finishReason: types.FinishReason.MAX_TOKENS,
        continuationToken: 'stream-tok-2',
      }),
    ];
    const spy = spyOn(
      internalModels,
      'generateContentStreamInternal',
    ).and.returnValues(
      Promise.resolve(makeStream(hop1)),
      Promise.resolve(makeStream(hop2)),
    );

    const stream = await client.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: 'Stream a story',
      config: {automaticContinuation: true, maxOutputTokens: 64},
    });
    const received: types.GenerateContentResponse[] = [];
    for await (const chunk of stream) {
      received.push(chunk);
    }

    expect(spy).toHaveBeenCalledTimes(2);
    const args = spy.calls.allArgs();
    expect(args[0][0].config?.maxOutputTokens).toBe(64);
    expect(args[0][0].config?.continuationToken).toBeUndefined();
    expect(args[1][0].config?.maxOutputTokens).toBe(64);
    expect(args[1][0].config?.continuationToken).toBe('stream-tok-1');
    expect(received.length).toBe(2);
    expect(received[1].candidates?.[0]?.finishReason).toBe(
      types.FinishReason.MAX_TOKENS,
    );
  });

  it('generateContentStream decouples automatic continuation from AFC (CallableTool)', async () => {
    const turn1Hop1 = [
      buildResponse({
        parts: [{text: 'Thinking...', thought: true}],
        finishReason: types.FinishReason.CONTINUATION,
        continuationToken: 'stream-afc-tok-1',
      }),
    ];
    const turn1Hop2 = [
      buildResponse({
        parts: [
          {
            functionCall: {
              name: 'get_weather',
              args: {location: 'Boston'},
            },
          },
        ],
        finishReason: types.FinishReason.STOP,
      }),
    ];
    const turn2Hop1 = [
      buildResponse({
        parts: [{text: 'Sunny in Boston!'}],
        finishReason: types.FinishReason.STOP,
      }),
    ];

    const spy = spyOn(
      internalModels,
      'generateContentStreamInternal',
    ).and.returnValues(
      Promise.resolve(makeStream(turn1Hop1)),
      Promise.resolve(makeStream(turn1Hop2)),
      Promise.resolve(makeStream(turn2Hop1)),
    );
    const toolSpy = jasmine.createSpy('weatherTool');
    const weatherTool = createWeatherCallableTool(toolSpy);

    const stream = await client.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: 'What is the weather in Boston?',
      config: {
        tools: [weatherTool],
      },
    });

    const chunks: types.GenerateContentResponse[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(spy).toHaveBeenCalledTimes(3);
    expect(toolSpy).toHaveBeenCalledTimes(1);
    const args = spy.calls.allArgs();
    expect(args[0][0].config?.continuationToken).toBeUndefined();
    expect(args[1][0].config?.continuationToken).toBe('stream-afc-tok-1');
    expect(args[2][0].config?.continuationToken).toBeUndefined();
    expect(chunks[chunks.length - 1].text).toBe('Sunny in Boston!');
  });
});

describe('Chat automatic continuation', () => {
  let client: GoogleGenAI;

  beforeEach(() => {
    client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
  });

  it('sendMessage enables automatic continuation by default across 4 hops and records merged response in history', async () => {
    const hop1 = buildResponse({
      parts: [{text: 'Hop 1, '}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'chat-tok-1',
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 100,
        thoughtsTokenCount: 20,
        totalTokenCount: 130,
      },
    });
    const hop2 = buildResponse({
      parts: [{text: 'Hop 2, '}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'chat-tok-2',
      usageMetadata: {
        promptTokenCount: 110,
        candidatesTokenCount: 100,
        thoughtsTokenCount: 15,
        totalTokenCount: 225,
      },
    });
    const hop3 = buildResponse({
      parts: [{text: 'Hop 3, '}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'chat-tok-3',
      usageMetadata: {
        promptTokenCount: 210,
        candidatesTokenCount: 100,
        thoughtsTokenCount: 10,
        totalTokenCount: 320,
      },
    });
    const hop4 = buildResponse({
      parts: [{text: 'Hop 4.'}],
      finishReason: types.FinishReason.STOP,
      usageMetadata: {
        promptTokenCount: 310,
        candidatesTokenCount: 50,
        thoughtsTokenCount: 5,
        totalTokenCount: 365,
      },
    });

    const spy = spyOn(client.models, 'generateContent').and.returnValues(
      Promise.resolve(hop1),
      Promise.resolve(hop2),
      Promise.resolve(hop3),
      Promise.resolve(hop4),
    );

    const chat = client.chats.create({model: 'gemini-2.5-flash'});
    const response = await chat.sendMessage({message: 'Tell me a story'});

    expect(spy).toHaveBeenCalledTimes(4);
    const calls = spy.calls.allArgs();
    expect(calls[0][0].config).toEqual({});
    expect(calls[1][0].config).toEqual({continuationToken: 'chat-tok-1'});
    expect(calls[2][0].config).toEqual({continuationToken: 'chat-tok-2'});
    expect(calls[3][0].config).toEqual({continuationToken: 'chat-tok-3'});
    for (const call of [calls[1][0], calls[2][0], calls[3][0]]) {
      expect(call.contents).toEqual(calls[0][0].contents);
    }

    expect(response.text).toBe('Hop 1, Hop 2, Hop 3, Hop 4.');
    expect(response.usageMetadata?.promptTokenCount).toBe(640);
    expect(response.usageMetadata?.candidatesTokenCount).toBe(350);
    expect(response.usageMetadata?.thoughtsTokenCount).toBe(50);
    expect(response.usageMetadata?.totalTokenCount).toBe(1040);
    expect(chat.getHistory(true)).toEqual([
      {role: 'user', parts: [{text: 'Tell me a story'}]},
      {
        role: 'model',
        parts: [
          {text: 'Hop 1, '},
          {text: 'Hop 2, '},
          {text: 'Hop 3, '},
          {text: 'Hop 4.'},
        ],
      },
    ]);
  });

  it('sendMessage preserves empty text thought part and supports non-callable FunctionDeclaration tools', async () => {
    const hop1 = buildResponse({
      parts: [{text: '', thoughtSignature: 'sig-chat-1'}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'chat-thought-tok',
    });
    const hop2 = buildResponse({
      parts: [{text: 'Final answer.'}],
      finishReason: types.FinishReason.STOP,
    });
    const toolDecl: types.Tool = {
      functionDeclarations: [{name: 'manual_fn', description: 'manual'}],
    };

    const spy = spyOn(client.models, 'generateContent').and.returnValues(
      Promise.resolve(hop1),
      Promise.resolve(hop2),
    );

    const chat = client.chats.create({model: 'gemini-2.5-flash'});
    const response = await chat.sendMessage({
      message: 'Solve problem',
      config: {tools: [toolDecl]},
    });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(response.text).toBe('Final answer.');
    expect(response.candidates?.[0]?.content?.parts).toEqual([
      {text: '', thoughtSignature: 'sig-chat-1'},
      {text: 'Final answer.'},
    ]);
  });

  it('sendMessage respects automaticContinuation: false opt-out', async () => {
    const hop1 = buildResponse({
      parts: [{text: 'First half'}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'chat-tok-1',
    });
    const spy = spyOn(client.models, 'generateContent').and.returnValue(
      Promise.resolve(hop1),
    );

    const chat = client.chats.create({
      model: 'gemini-2.5-flash',
      config: {automaticContinuation: false},
    });
    const response = await chat.sendMessage({message: 'Tell me a story'});

    expect(spy).toHaveBeenCalledTimes(1);
    expect(response).toBe(hop1);
  });

  it('sendMessage forwards maxOutputTokens and stops when finishReason is MAX_TOKENS', async () => {
    const hop1 = buildResponse({
      parts: [{text: 'Part 1, '}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'chat-tok-1',
    });
    const hop2 = buildResponse({
      parts: [{text: 'Truncated'}],
      finishReason: types.FinishReason.MAX_TOKENS,
      continuationToken: 'chat-tok-2',
    });
    const spy = spyOn(client.models, 'generateContent').and.returnValues(
      Promise.resolve(hop1),
      Promise.resolve(hop2),
    );

    const chat = client.chats.create({
      model: 'gemini-2.5-flash',
      config: {maxOutputTokens: 100},
    });
    const response = await chat.sendMessage({message: 'Tell me a story'});

    expect(spy).toHaveBeenCalledTimes(2);
    const calls = spy.calls.allArgs();
    expect(calls[0][0].config).toEqual({maxOutputTokens: 100});
    expect(calls[1][0].config).toEqual({
      maxOutputTokens: 100,
      continuationToken: 'chat-tok-1',
    });
    expect(response.text).toBe('Part 1, Truncated');
    expect(response.candidates?.[0]?.finishReason).toBe(
      types.FinishReason.MAX_TOKENS,
    );
  });

  it('sendMessage decouples automatic continuation from AFC (CallableTool)', async () => {
    const internalModels = client.models as unknown as InternalModels;
    const turn1Hop1 = buildResponse({
      parts: [{text: 'Thinking...', thought: true}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'chat-afc-tok-1',
    });
    const turn1Hop2 = buildResponse({
      parts: [
        {
          functionCall: {
            name: 'get_weather',
            args: {location: 'Boston'},
          },
        },
      ],
      finishReason: types.FinishReason.STOP,
    });
    const turn2Hop1 = buildResponse({
      parts: [{text: 'The weather in Boston is 72F and sunny.'}],
      finishReason: types.FinishReason.STOP,
    });

    const spy = spyOn(
      internalModels,
      'generateContentInternal',
    ).and.returnValues(
      Promise.resolve(turn1Hop1),
      Promise.resolve(turn1Hop2),
      Promise.resolve(turn2Hop1),
    );
    const toolSpy = jasmine.createSpy('weatherTool');
    const weatherTool = createWeatherCallableTool(toolSpy);

    const chat = client.chats.create({
      model: 'gemini-2.5-flash',
      config: {tools: [weatherTool]},
    });
    const response = await chat.sendMessage({
      message: 'What is the weather in Boston?',
    });

    expect(spy).toHaveBeenCalledTimes(3);
    expect(toolSpy).toHaveBeenCalledTimes(1);
    const args = spy.calls.allArgs();
    expect(args[0][0].config?.continuationToken).toBeUndefined();
    expect(args[1][0].config?.continuationToken).toBe('chat-afc-tok-1');
    expect(args[2][0].config?.continuationToken).toBeUndefined();
    expect(response.text).toBe('The weather in Boston is 72F and sunny.');
    expect(chat.getHistory(true).length).toBe(4);
  });

  it('sendMessageStream enables automatic continuation by default across 4 hops and records all chunks in history', async () => {
    const hop1 = [
      buildResponse({
        parts: [{text: 'Stream 1A, '}],
        continuationToken: 'chat-stream-tok-1',
      }),
      buildResponse({
        parts: [{text: 'Stream 1B, '}],
        finishReason: types.FinishReason.CONTINUATION,
      }),
    ];
    const hop2 = [
      buildResponse({
        parts: [{text: 'Stream 2, '}],
        finishReason: types.FinishReason.CONTINUATION,
        continuationToken: 'chat-stream-tok-2',
      }),
    ];
    const hop3 = [
      buildResponse({
        parts: [{text: 'Stream 3, '}],
        finishReason: types.FinishReason.CONTINUATION,
        continuationToken: 'chat-stream-tok-3',
      }),
    ];
    const hop4 = [
      buildResponse({
        parts: [{text: 'Stream 4.'}],
        finishReason: types.FinishReason.STOP,
      }),
    ];

    const spy = spyOn(client.models, 'generateContentStream').and.returnValues(
      Promise.resolve(makeStream(hop1)),
      Promise.resolve(makeStream(hop2)),
      Promise.resolve(makeStream(hop3)),
      Promise.resolve(makeStream(hop4)),
    );

    const chat = client.chats.create({model: 'gemini-2.5-flash'});
    const stream = await chat.sendMessageStream({message: 'Stream a story'});
    const receivedTexts: string[] = [];
    for await (const chunk of stream) {
      receivedTexts.push(chunk.text ?? '');
    }

    expect(spy).toHaveBeenCalledTimes(4);
    const calls = spy.calls.allArgs();
    expect(calls[0][0].config).toEqual({});
    expect(calls[1][0].config).toEqual({
      continuationToken: 'chat-stream-tok-1',
    });
    expect(calls[2][0].config).toEqual({
      continuationToken: 'chat-stream-tok-2',
    });
    expect(calls[3][0].config).toEqual({
      continuationToken: 'chat-stream-tok-3',
    });
    for (const call of [calls[1][0], calls[2][0], calls[3][0]]) {
      expect(call.contents).toEqual(calls[0][0].contents);
    }
    expect(receivedTexts).toEqual([
      'Stream 1A, ',
      'Stream 1B, ',
      'Stream 2, ',
      'Stream 3, ',
      'Stream 4.',
    ]);
    expect(chat.getHistory(true)).toEqual([
      {role: 'user', parts: [{text: 'Stream a story'}]},
      {role: 'model', parts: [{text: 'Stream 1A, '}]},
      {role: 'model', parts: [{text: 'Stream 1B, '}]},
      {role: 'model', parts: [{text: 'Stream 2, '}]},
      {role: 'model', parts: [{text: 'Stream 3, '}]},
      {role: 'model', parts: [{text: 'Stream 4.'}]},
    ]);
  });

  it('sendMessageStream respects automaticContinuation: false opt-out', async () => {
    const hop1Chunk = buildResponse({
      parts: [{text: 'Stream hop 1'}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'chat-stream-tok-1',
    });
    const spy = spyOn(client.models, 'generateContentStream').and.returnValue(
      Promise.resolve(makeStream([hop1Chunk])),
    );

    const chat = client.chats.create({model: 'gemini-2.5-flash'});
    const stream = await chat.sendMessageStream({
      message: 'Stream a story',
      config: {automaticContinuation: false},
    });
    const received: types.GenerateContentResponse[] = [];
    for await (const chunk of stream) {
      received.push(chunk);
    }

    expect(spy).toHaveBeenCalledTimes(1);
    expect(received.length).toBe(1);
  });

  it('sendMessageStream forwards maxOutputTokens and stops when finishReason is MAX_TOKENS', async () => {
    const hop1Chunk = buildResponse({
      parts: [{text: 'Stream Part 1, '}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'chat-stream-tok-1',
    });
    const hop2Chunk = buildResponse({
      parts: [{text: 'Stream Truncated'}],
      finishReason: types.FinishReason.MAX_TOKENS,
      continuationToken: 'chat-stream-tok-2',
    });

    const spy = spyOn(client.models, 'generateContentStream').and.returnValues(
      Promise.resolve(makeStream([hop1Chunk])),
      Promise.resolve(makeStream([hop2Chunk])),
    );

    const chat = client.chats.create({
      model: 'gemini-2.5-flash',
      config: {maxOutputTokens: 120},
    });
    const stream = await chat.sendMessageStream({message: 'Stream a story'});
    const received: types.GenerateContentResponse[] = [];
    for await (const chunk of stream) {
      received.push(chunk);
    }

    expect(spy).toHaveBeenCalledTimes(2);
    const calls = spy.calls.allArgs();
    expect(calls[0][0].config).toEqual({maxOutputTokens: 120});
    expect(calls[1][0].config).toEqual({
      maxOutputTokens: 120,
      continuationToken: 'chat-stream-tok-1',
    });
    expect(received.length).toBe(2);
    expect(received[1].candidates?.[0]?.finishReason).toBe(
      types.FinishReason.MAX_TOKENS,
    );
  });

  it('sendMessageStream decouples automatic continuation from AFC (CallableTool)', async () => {
    const internalModels = client.models as unknown as InternalModels;
    const turn1Hop1 = [
      buildResponse({
        parts: [{text: 'Thinking...', thought: true}],
        finishReason: types.FinishReason.CONTINUATION,
        continuationToken: 'chat-stream-afc-tok-1',
      }),
    ];
    const turn1Hop2 = [
      buildResponse({
        parts: [
          {
            functionCall: {
              name: 'get_weather',
              args: {location: 'Boston'},
            },
          },
        ],
        finishReason: types.FinishReason.STOP,
      }),
    ];
    const turn2Hop1 = [
      buildResponse({
        parts: [{text: 'Sunny in Boston!'}],
        finishReason: types.FinishReason.STOP,
      }),
    ];

    const spy = spyOn(
      internalModels,
      'generateContentStreamInternal',
    ).and.returnValues(
      Promise.resolve(makeStream(turn1Hop1)),
      Promise.resolve(makeStream(turn1Hop2)),
      Promise.resolve(makeStream(turn2Hop1)),
    );
    const toolSpy = jasmine.createSpy('weatherTool');
    const weatherTool = createWeatherCallableTool(toolSpy);

    const chat = client.chats.create({
      model: 'gemini-2.5-flash',
      config: {tools: [weatherTool]},
    });
    const stream = await chat.sendMessageStream({
      message: 'What is the weather in Boston?',
    });

    const chunks: types.GenerateContentResponse[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(spy).toHaveBeenCalledTimes(3);
    expect(toolSpy).toHaveBeenCalledTimes(1);
    const args = spy.calls.allArgs();
    expect(args[0][0].config?.continuationToken).toBeUndefined();
    expect(args[1][0].config?.continuationToken).toBe('chat-stream-afc-tok-1');
    expect(args[2][0].config?.continuationToken).toBeUndefined();
    expect(chunks[chunks.length - 1].text).toBe('Sunny in Boston!');
  });
});
