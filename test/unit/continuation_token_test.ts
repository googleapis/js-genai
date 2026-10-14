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

  it('isResumableFinishReason returns true for undefined and FinishReason.CONTINUATION', () => {
    expect(
      afc.isResumableFinishReason(types.FinishReason.CONTINUATION),
    ).toBeTrue();
    expect(afc.isResumableFinishReason(undefined)).toBeTrue();
    expect(
      afc.isResumableFinishReason(types.FinishReason.MAX_TOKENS),
    ).toBeFalse();
    expect(afc.isResumableFinishReason(types.FinishReason.STOP)).toBeFalse();
  });

  it('processContinuationStreamChunk updates hopState and clears stale checkpoint continuationToken on non-resumable finishReason', () => {
    const hopState: afc.StreamContinuationHopState = {};
    const chunk1 = buildResponse({
      parts: [{text: 'Checkpoint, '}],
      continuationToken: 'ckpt-token-1',
      usageMetadata: {
        promptTokenCount: 15,
        candidatesTokenCount: 5,
        totalTokenCount: 20,
      },
    });
    const out1 = afc.processContinuationStreamChunk(
      chunk1,
      true,
      undefined,
      hopState,
    );
    expect(hopState.continuationToken).toBe('ckpt-token-1');
    expect(hopState.hopFinishReason).toBeUndefined();
    expect(out1.usageMetadata?.initialPromptTokenCount).toBe(15);

    const chunk2 = buildResponse({
      parts: [{text: 'Done.'}],
      finishReason: types.FinishReason.STOP,
    });
    const out2 = afc.processContinuationStreamChunk(
      chunk2,
      true,
      undefined,
      hopState,
    );
    expect(hopState.continuationToken).toBeUndefined();
    expect(hopState.hopFinishReason).toBe(types.FinishReason.STOP);
    expect(out2.candidates?.[0]?.finishReason).toBe(types.FinishReason.STOP);
  });

  it('shouldRethrowStreamError returns true for AbortError, aborted signal, or non-resumable hopState', () => {
    const resumableHopState: afc.StreamContinuationHopState = {
      continuationToken: 'ckpt-1',
      hopFinishReason: undefined,
    };
    expect(
      afc.shouldRethrowStreamError(
        new Error('network drop'),
        undefined,
        true,
        resumableHopState,
      ),
    ).toBeFalse();

    const abortErr = new Error('The operation was aborted');
    abortErr.name = 'AbortError';
    expect(
      afc.shouldRethrowStreamError(
        abortErr,
        undefined,
        true,
        resumableHopState,
      ),
    ).toBeTrue();

    const controller = new AbortController();
    controller.abort();
    expect(
      afc.shouldRethrowStreamError(
        new Error('network drop'),
        {abortSignal: controller.signal},
        true,
        resumableHopState,
      ),
    ).toBeTrue();

    expect(
      afc.shouldRethrowStreamError(
        new Error('network drop'),
        undefined,
        false,
        resumableHopState,
      ),
    ).toBeTrue();
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
    expect(afc.mergeCandidates([c1Hop1], [])).toEqual([
      {
        content: {role: 'model', parts: [{text: 'C0-H1 '}]},
        index: 0,
      },
    ]);

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
    expect(merged.initialPromptTokenCount).toBe(10);
    expect(merged.usageMetadata?.initialPromptTokenCount).toBe(10);

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

  it('mergeContinuationResponses clears finishReason and preserves promptFeedback when a continuation hop returns no candidates', () => {
    const hop1 = buildResponse({
      parts: [{text: 'Partial output before block.'}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'tok-hop-1',
      finishMessage: 'Continuing',
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 100,
        totalTokenCount: 110,
      },
    });

    for (const emptyCandidates of [undefined, [] as types.Candidate[]]) {
      const hop2 = new types.GenerateContentResponse();
      hop2.candidates = emptyCandidates;
      hop2.promptFeedback = {
        blockReason: types.BlockedReason.OTHER,
        blockReasonMessage: 'Blocked on continuation hop',
      };
      hop2.usageMetadata = {
        promptTokenCount: 110,
        totalTokenCount: 110,
      };

      const merged = afc.mergeContinuationResponses([hop1, hop2]);

      expect(merged.text).toBe('Partial output before block.');
      expect(merged.candidates?.length).toBe(1);
      expect(merged.candidates?.[0]?.finishReason).toBeUndefined();
      expect(merged.candidates?.[0]?.continuationToken).toBeUndefined();
      expect(merged.candidates?.[0]?.finishMessage).toBeUndefined();
      expect(merged.promptFeedback).toEqual({
        blockReason: types.BlockedReason.OTHER,
        blockReasonMessage: 'Blocked on continuation hop',
      });
      expect(merged.usageMetadata?.promptTokenCount).toBe(120);
      expect(merged.usageMetadata?.initialPromptTokenCount).toBe(10);
    }
  });

  it('mergeContinuationResponses shifts groundingSupports chunk and part indices across hops', () => {
    const hop1 = buildResponse({
      parts: [{text: 'Thinking...', thought: true}, {text: 'part 1 '}],
      finishReason: types.FinishReason.CONTINUATION,
      continuationToken: 'tok-1',
      groundingMetadata: {
        groundingChunks: [
          {
            image: {
              imageUri: 'https://img1.example/a.png',
              sourceUri: 'https://source1.example/img',
              title: 'Image 1',
              domain: 'source1.example',
            },
          },
          {
            web: {
              uri: 'https://source1.example',
              title: 'Source 1',
            },
          },
        ],
        groundingSupports: [
          {
            groundingChunkIndices: [0, 1],
            confidenceScores: [0.9, 0.8],
            segment: {
              partIndex: 1,
              startIndex: 0,
              endIndex: 7,
              text: 'part 1 ',
            },
          },
        ],
      },
    });

    const hop2 = buildResponse({
      parts: [{text: 'part 2 '}],
      finishReason: types.FinishReason.STOP,
      groundingMetadata: {
        groundingChunks: [
          {
            web: {
              uri: 'https://source2.example',
              title: 'Source 2',
            },
          },
        ],
        groundingSupports: [
          {
            groundingChunkIndices: [0],
            confidenceScores: [0.95],
            segment: {
              partIndex: 0,
              startIndex: 0,
              endIndex: 7,
              text: 'part 2 ',
            },
          },
          {
            // Omitted partIndex (defaults to 0) should also be shifted by hop1's part count (2).
            groundingChunkIndices: [0],
            segment: {
              startIndex: 0,
              endIndex: 7,
              text: 'part 2 ',
            },
          },
        ],
      },
    });

    const merged = afc.mergeContinuationResponses([hop1, hop2]);
    const cand = merged.candidates?.[0];
    const gm = cand?.groundingMetadata;

    expect(gm?.groundingChunks?.length).toBe(3);
    expect(gm?.groundingSupports?.length).toBe(3);

    expect(gm?.groundingSupports?.[0]?.groundingChunkIndices).toEqual([0, 1]);
    expect(gm?.groundingSupports?.[0]?.segment?.partIndex).toBe(1);

    const s1 = gm?.groundingSupports?.[1];
    expect(s1?.groundingChunkIndices).toEqual([2]);
    expect(s1?.segment?.partIndex).toBe(2);
    expect(gm?.groundingChunks?.[s1!.groundingChunkIndices![0]]?.web?.uri).toBe(
      'https://source2.example',
    );
    expect(cand?.content?.parts?.[s1!.segment!.partIndex!]?.text).toBe(
      'part 2 ',
    );

    const s2 = gm?.groundingSupports?.[2];
    expect(s2?.groundingChunkIndices).toEqual([2]);
    expect(s2?.segment?.partIndex).toBe(2);

    // Ensure hop2 input was not mutated.
    expect(
      hop2.candidates?.[0]?.groundingMetadata?.groundingSupports?.[0]
        ?.groundingChunkIndices,
    ).toEqual([0]);
    expect(
      hop2.candidates?.[0]?.groundingMetadata?.groundingSupports?.[0]?.segment
        ?.partIndex,
    ).toBe(0);
    expect(
      hop2.candidates?.[0]?.groundingMetadata?.groundingSupports?.[1]?.segment
        ?.partIndex,
    ).toBeUndefined();
  });

  it('mergeContinuationResponses handles groundingSupports corner cases (3 hops, missing metadata/segment, empty chunk indices, multi-candidate)', () => {
    const hop1 = Object.assign(new types.GenerateContentResponse(), {
      candidates: [
        {
          index: 0,
          content: {
            role: 'model',
            parts: [{text: 'c0-h1-p0 '}, {text: 'c0-h1-p1 '}],
          },
          finishReason: types.FinishReason.CONTINUATION,
          continuationToken: 't1',
        },
        {
          index: 1,
          content: {
            role: 'model',
            parts: [{text: 'c1-h1-p0 '}],
          },
          groundingMetadata: {
            groundingChunks: [{web: {uri: 'https://c1-s0.example'}}],
          },
          finishReason: types.FinishReason.CONTINUATION,
          continuationToken: 't1-c1',
        },
      ],
    });

    const hop2 = Object.assign(new types.GenerateContentResponse(), {
      candidates: [
        {
          index: 0,
          content: {
            role: 'model',
            parts: [{text: 'c0-h2-p0 '}],
          },
          groundingMetadata: {
            groundingChunks: [
              {web: {uri: 'https://c0-s0.example'}},
              {web: {uri: 'https://c0-s1.example'}},
            ],
          },
          finishReason: types.FinishReason.CONTINUATION,
          continuationToken: 't2',
        },
        {
          index: 1,
          content: {
            role: 'model',
            parts: [{text: 'c1-h2-p0 '}],
          },
          groundingMetadata: {
            groundingChunks: [{web: {uri: 'https://c1-s1.example'}}],
            groundingSupports: [
              {
                groundingChunkIndices: [0],
                segment: {partIndex: 0, text: 'c1-h2-p0 '},
              },
            ],
          },
          finishReason: types.FinishReason.STOP,
        },
      ],
    });

    const hop3 = Object.assign(new types.GenerateContentResponse(), {
      candidates: [
        {
          index: 0,
          content: {
            role: 'model',
            parts: [{text: 'c0-h3-p0.'}],
          },
          groundingMetadata: {
            groundingChunks: [{web: {uri: 'https://c0-s2.example'}}],
            groundingSupports: [
              {
                groundingChunkIndices: [0],
              },
              {
                groundingChunkIndices: [],
                segment: {partIndex: 0, text: 'c0-h3-p0.'},
              },
              {
                groundingChunkIndices: [0],
                segment: {partIndex: 0, text: 'c0-h3-p0.'},
              },
            ],
          },
          finishReason: types.FinishReason.STOP,
        },
      ],
    });

    const merged = afc.mergeContinuationResponses([hop1, hop2, hop3]);

    const cand0 = merged.candidates?.[0];
    const gm0 = cand0?.groundingMetadata;
    expect(cand0?.content?.parts?.length).toBe(4);
    expect(gm0?.groundingChunks?.length).toBe(3);
    expect(gm0?.groundingSupports?.length).toBe(3);
    expect(gm0?.groundingSupports?.[0]?.segment).toBeUndefined();
    expect(gm0?.groundingSupports?.[0]?.groundingChunkIndices).toEqual([2]);
    expect(gm0?.groundingSupports?.[1]?.groundingChunkIndices).toEqual([]);
    expect(gm0?.groundingSupports?.[1]?.segment?.partIndex).toBe(3);
    const s2 = gm0?.groundingSupports?.[2];
    expect(
      gm0?.groundingChunks?.[s2!.groundingChunkIndices![0]]?.web?.uri,
    ).toBe('https://c0-s2.example');
    expect(cand0?.content?.parts?.[s2!.segment!.partIndex!]?.text).toBe(
      'c0-h3-p0.',
    );

    const cand1 = merged.candidates?.[1];
    const gm1 = cand1?.groundingMetadata;
    expect(gm1?.groundingSupports?.[0]?.groundingChunkIndices).toEqual([1]);
    expect(gm1?.groundingSupports?.[0]?.segment?.partIndex).toBe(1);
    expect(
      gm1?.groundingChunks?.[
        gm1!.groundingSupports![0].groundingChunkIndices![0]
      ]?.web?.uri,
    ).toBe('https://c1-s1.example');
    expect(
      cand1?.content?.parts?.[gm1!.groundingSupports![0].segment!.partIndex!]
        ?.text,
    ).toBe('c1-h2-p0 ');
  });

  it('mergeUsageMetadata sums billed token counts and modality details while preserving initialPromptTokenCount', () => {
    const hop1Usage: types.GenerateContentResponseUsageMetadata = {
      promptTokenCount: 100,
      promptTokensDetails: [
        {modality: types.MediaModality.TEXT, tokenCount: 100},
      ],
      cachedContentTokenCount: 80,
      cacheTokensDetails: [
        {modality: types.MediaModality.TEXT, tokenCount: 80},
      ],
      candidatesTokenCount: 200,
      candidatesTokensDetails: [
        {modality: types.MediaModality.TEXT, tokenCount: 200},
      ],
      thoughtsTokenCount: 50,
      toolUsePromptTokenCount: 10,
      toolUsePromptTokensDetails: [
        {modality: types.MediaModality.TEXT, tokenCount: 10},
      ],
      totalTokenCount: 360,
    };
    const hop2Usage: types.GenerateContentResponseUsageMetadata = {
      promptTokenCount: 350,
      promptTokensDetails: [
        {modality: types.MediaModality.TEXT, tokenCount: 350},
      ],
      cachedContentTokenCount: 300,
      cacheTokensDetails: [
        {modality: types.MediaModality.TEXT, tokenCount: 300},
      ],
      candidatesTokenCount: 150,
      candidatesTokensDetails: [
        {modality: types.MediaModality.TEXT, tokenCount: 150},
      ],
      thoughtsTokenCount: 30,
      toolUsePromptTokenCount: 5,
      toolUsePromptTokensDetails: [
        {modality: types.MediaModality.TEXT, tokenCount: 5},
      ],
      totalTokenCount: 535,
      trafficType: types.TrafficType.ON_DEMAND,
    };

    expect(afc.mergeUsageMetadata(undefined, hop1Usage)).toBe(hop1Usage);
    expect(afc.mergeUsageMetadata(hop1Usage, undefined)).toBe(hop1Usage);

    const merged = afc.mergeUsageMetadata(hop1Usage, hop2Usage);
    expect(merged?.promptTokenCount).toBe(450);
    expect(merged?.initialPromptTokenCount).toBe(100);
    expect(afc.getInitialPromptTokenCount(merged)).toBe(100);
    expect(merged?.promptTokensDetails).toEqual([
      {modality: types.MediaModality.TEXT, tokenCount: 450},
    ]);
    expect(merged?.cachedContentTokenCount).toBe(380);
    expect(merged?.cacheTokensDetails).toEqual([
      {modality: types.MediaModality.TEXT, tokenCount: 380},
    ]);
    expect(merged?.candidatesTokenCount).toBe(350);
    expect(merged?.candidatesTokensDetails).toEqual([
      {modality: types.MediaModality.TEXT, tokenCount: 350},
    ]);
    expect(merged?.thoughtsTokenCount).toBe(80);
    expect(merged?.toolUsePromptTokenCount).toBe(15);
    expect(merged?.toolUsePromptTokensDetails).toEqual([
      {modality: types.MediaModality.TEXT, tokenCount: 15},
    ]);
    expect(merged?.totalTokenCount).toBe(895);
    expect(merged?.trafficType).toBe(types.TrafficType.ON_DEMAND);
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
      expect(result.initialPromptTokenCount).toBe(10);
      expect(result.usageMetadata?.initialPromptTokenCount).toBe(10);
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
    const spy = spyOn(internalModels, 'generateContentStreamInternal');

    // 1. Default (config omitted, empty config, or AFC disabled) -> enabled
    for (const cfg of [
      undefined,
      {},
      {automaticFunctionCalling: {disable: true}},
    ] as Array<types.GenerateContentConfig | undefined>) {
      const chunk1 = buildResponse({
        parts: [{text: 'Chunk 1. '}],
        finishReason: types.FinishReason.CONTINUATION,
        continuationToken: 'tok-1',
      });
      const chunk2 = buildResponse({
        parts: [{text: 'Chunk 2.'}],
        finishReason: types.FinishReason.STOP,
      });
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
      const received: types.GenerateContentResponse[] = [];
      for await (const chunk of stream) {
        received.push(chunk);
      }

      expect(spy).toHaveBeenCalledTimes(2);
      expect(received.map((c) => c.text ?? '')).toEqual([
        'Chunk 1. ',
        'Chunk 2.',
      ]);
      expect(received[0].candidates?.[0]?.finishReason).toBeUndefined();
      expect(received[1].candidates?.[0]?.finishReason).toBe(
        types.FinishReason.STOP,
      );
    }

    // 2. Explicit automaticContinuation: false -> disabled (both AFC enabled
    // and disabled)
    for (const disableAfc of [false, true]) {
      const chunk1 = buildResponse({
        parts: [{text: 'Chunk 1. '}],
        finishReason: types.FinishReason.CONTINUATION,
        continuationToken: 'tok-1',
      });
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
      expect(received[0].candidates?.[0]?.finishReason).toBe(
        types.FinishReason.CONTINUATION,
      );
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
    const received: types.GenerateContentResponse[] = [];
    for await (const chunk of stream) {
      received.push(chunk);
    }

    expect(spy).toHaveBeenCalledTimes(2);
    const args = spy.calls.allArgs();
    expect(args[0][0].config?.continuationToken).toBeUndefined();
    expect(args[1][0].config?.continuationToken).toBe('stream-tok-1');
    expect(received.map((c) => c.text ?? '')).toEqual([
      'Hop1-A ',
      'Hop1-B ',
      'Hop2-A',
    ]);
    expect(received[0].candidates?.[0]?.finishReason).toBeUndefined();
    expect(received[1].candidates?.[0]?.finishReason).toBeUndefined();
    expect(received[2].candidates?.[0]?.finishReason).toBe(
      types.FinishReason.STOP,
    );
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
      const chunks: types.GenerateContentResponse[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
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
      expect(chunks.map((c) => c.text ?? '')).toEqual([
        'H1A ',
        'H1B ',
        'H2A ',
        'H2B ',
        'H3 ',
        'H4.',
      ]);
      for (const intermediate of chunks.slice(0, 5)) {
        expect(intermediate.candidates?.[0]?.finishReason).toBeUndefined();
      }
      expect(chunks[5].candidates?.[0]?.finishReason).toBe(
        types.FinishReason.STOP,
      );
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
    expect(received[0].candidates?.[0]?.finishReason).toBeUndefined();
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

  it('generateContentStream resumes from checkpoint continuationToken on mid-stream cutoff or error', async () => {
    async function* makeFailingStream(
      chunks: types.GenerateContentResponse[],
      errorMessage: string,
    ): AsyncGenerator<types.GenerateContentResponse> {
      for (const chunk of chunks) {
        yield chunk;
      }
      throw new Error(errorMessage);
    }

    const hop1Cutoff = [
      buildResponse({
        parts: [{text: 'Checkpoint 1, '}],
        continuationToken: 'ckpt-tok-1',
      }),
    ];
    const hop2Error = [
      buildResponse({
        parts: [{text: 'Checkpoint 2, '}],
        continuationToken: 'ckpt-tok-2',
      }),
    ];
    const hop3Done = [
      buildResponse({
        parts: [{text: 'Earlier checkpoint, '}],
        continuationToken: 'stale-ckpt-tok',
      }),
      buildResponse({
        parts: [{text: 'Final stop.'}],
        finishReason: types.FinishReason.STOP,
      }),
    ];

    const spy = spyOn(
      internalModels,
      'generateContentStreamInternal',
    ).and.returnValues(
      Promise.resolve(makeStream(hop1Cutoff)),
      Promise.resolve(makeFailingStream(hop2Error, 'network drop')),
      Promise.resolve(makeStream(hop3Done)),
    );

    const stream = await client.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: 'Stream with cutoff and error',
    });
    const texts: string[] = [];
    for await (const chunk of stream) {
      texts.push(chunk.text ?? '');
    }

    expect(spy).toHaveBeenCalledTimes(3);
    const args = spy.calls.allArgs();
    expect(args[0][0].config?.continuationToken).toBeUndefined();
    expect(args[1][0].config?.continuationToken).toBe('ckpt-tok-1');
    expect(args[2][0].config?.continuationToken).toBe('ckpt-tok-2');
    expect(texts).toEqual([
      'Checkpoint 1, ',
      'Checkpoint 2, ',
      'Earlier checkpoint, ',
      'Final stop.',
    ]);
  });

  it('generateContentStream rethrows mid-stream error when no checkpoint continuationToken was received in current hop', async () => {
    async function* makeFailingStream(
      chunks: types.GenerateContentResponse[],
    ): AsyncGenerator<types.GenerateContentResponse> {
      for (const chunk of chunks) {
        yield chunk;
      }
      throw new Error('unrecoverable stream error');
    }

    const hop1Cutoff = [
      buildResponse({
        parts: [{text: 'Hop 1 checkpoint, '}],
        continuationToken: 'ckpt-tok-1',
      }),
    ];
    const spy = spyOn(
      internalModels,
      'generateContentStreamInternal',
    ).and.returnValues(
      Promise.resolve(makeStream(hop1Cutoff)),
      Promise.resolve(
        makeFailingStream([buildResponse({parts: [{text: 'Hop 2 no token'}]})]),
      ),
    );

    const stream = await client.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: 'Stream with error on hop 2',
    });
    const receivedTexts: string[] = [];
    await expectAsync(
      (async () => {
        for await (const chunk of stream) {
          receivedTexts.push(chunk.text ?? '');
        }
      })(),
    ).toBeRejectedWithError('unrecoverable stream error');
    expect(spy).toHaveBeenCalledTimes(2);
    expect(receivedTexts).toEqual(['Hop 1 checkpoint, ', 'Hop 2 no token']);
  });

  it('generateContentStream accumulates usageMetadata across continuation hops', async () => {
    const hop1 = [
      buildResponse({
        parts: [{text: 'Hop 1A, '}],
        usageMetadata: {
          promptTokenCount: 20,
          cachedContentTokenCount: 15,
          candidatesTokenCount: 50,
          thoughtsTokenCount: 10,
          totalTokenCount: 80,
        },
      }),
      buildResponse({
        parts: [{text: 'Hop 1B, '}],
        finishReason: types.FinishReason.CONTINUATION,
        continuationToken: 'stream-usage-tok-1',
        usageMetadata: {
          promptTokenCount: 20,
          cachedContentTokenCount: 15,
          candidatesTokenCount: 100,
          thoughtsTokenCount: 30,
          totalTokenCount: 150,
        },
      }),
    ];
    const hop2 = [
      buildResponse({
        parts: [{text: 'Hop 2A, '}],
        usageMetadata: {
          promptTokenCount: 150,
          cachedContentTokenCount: 120,
          candidatesTokenCount: 40,
          thoughtsTokenCount: 5,
          totalTokenCount: 195,
        },
      }),
      buildResponse({
        parts: [{text: 'Hop 2B.'}],
        finishReason: types.FinishReason.STOP,
        usageMetadata: {
          promptTokenCount: 150,
          cachedContentTokenCount: 120,
          candidatesTokenCount: 80,
          thoughtsTokenCount: 10,
          totalTokenCount: 240,
        },
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
      contents: 'Stream with usage',
    });
    const chunks: types.GenerateContentResponse[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(spy).toHaveBeenCalledTimes(2);
    expect(chunks.length).toBe(4);
    // Hop 1 chunks retain their own hop usage and expose initialPromptTokenCount
    expect(chunks[0].usageMetadata?.promptTokenCount).toBe(20);
    expect(chunks[0].initialPromptTokenCount).toBe(20);
    expect(chunks[0].usageMetadata?.initialPromptTokenCount).toBe(20);
    expect(chunks[0].usageMetadata?.candidatesTokenCount).toBe(50);
    expect(chunks[0].usageMetadata?.totalTokenCount).toBe(80);
    expect(chunks[1].usageMetadata?.promptTokenCount).toBe(20);
    expect(chunks[1].initialPromptTokenCount).toBe(20);
    expect(chunks[1].usageMetadata?.initialPromptTokenCount).toBe(20);
    expect(chunks[1].usageMetadata?.cachedContentTokenCount).toBe(15);
    expect(chunks[1].usageMetadata?.candidatesTokenCount).toBe(100);
    expect(chunks[1].usageMetadata?.thoughtsTokenCount).toBe(30);
    expect(chunks[1].usageMetadata?.totalTokenCount).toBe(150);
    // Hop 2 chunk 0 sums Hop 1 final usage with Hop 2 chunk 0 usage while preserving initialPromptTokenCount
    expect(chunks[2].usageMetadata?.promptTokenCount).toBe(20 + 150);
    expect(chunks[2].initialPromptTokenCount).toBe(20);
    expect(chunks[2].usageMetadata?.initialPromptTokenCount).toBe(20);
    expect(chunks[2].usageMetadata?.cachedContentTokenCount).toBe(15 + 120);
    expect(chunks[2].usageMetadata?.candidatesTokenCount).toBe(100 + 40);
    expect(chunks[2].usageMetadata?.thoughtsTokenCount).toBe(30 + 5);
    expect(chunks[2].usageMetadata?.totalTokenCount).toBe(150 + 195);
    // Hop 2 final chunk sums Hop 1 final usage with Hop 2 final usage while preserving initialPromptTokenCount
    expect(chunks[3].usageMetadata?.promptTokenCount).toBe(20 + 150);
    expect(chunks[3].initialPromptTokenCount).toBe(20);
    expect(chunks[3].usageMetadata?.initialPromptTokenCount).toBe(20);
    expect(chunks[3].usageMetadata?.cachedContentTokenCount).toBe(15 + 120);
    expect(chunks[3].usageMetadata?.candidatesTokenCount).toBe(100 + 80);
    expect(chunks[3].usageMetadata?.thoughtsTokenCount).toBe(30 + 10);
    expect(chunks[3].usageMetadata?.totalTokenCount).toBe(150 + 240);
  });

  it('generateContent merges groundingMetadata across hops with shifted chunk and part indices', async () => {
    const hop1 = Object.assign(new types.GenerateContentResponse(), {
      candidates: [
        {
          content: {role: 'model', parts: [{text: 'part 1 '}]},
          finishReason: types.FinishReason.CONTINUATION,
          continuationToken: 'tok-1',
          groundingMetadata: {
            groundingChunks: [{web: {uri: 'https://source1.example'}}],
            groundingSupports: [
              {
                groundingChunkIndices: [0],
                segment: {partIndex: 0, text: 'part 1 '},
              },
            ],
          },
        },
      ],
    });
    const hop2 = Object.assign(new types.GenerateContentResponse(), {
      candidates: [
        {
          content: {role: 'model', parts: [{text: 'part 2 '}]},
          finishReason: types.FinishReason.STOP,
          groundingMetadata: {
            groundingChunks: [{web: {uri: 'https://source2.example'}}],
            groundingSupports: [
              {
                groundingChunkIndices: [0],
                segment: {partIndex: 0, text: 'part 2 '},
              },
            ],
          },
        },
      ],
    });

    const spy = spyOn(
      internalModels,
      'generateContentInternal',
    ).and.returnValues(Promise.resolve(hop1), Promise.resolve(hop2));

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Grounded query',
    });

    expect(spy).toHaveBeenCalledTimes(2);
    const cand = response.candidates?.[0];
    const gm = cand?.groundingMetadata;
    expect(gm?.groundingSupports?.length).toBe(2);
    const s = gm?.groundingSupports?.[1];
    expect(gm?.groundingChunks?.[s!.groundingChunkIndices![0]]?.web?.uri).toBe(
      'https://source2.example',
    );
    expect(cand?.content?.parts?.[s!.segment!.partIndex!]?.text).toBe(
      'part 2 ',
    );
  });

  it('generateContentStream preserves per-chunk groundingMetadata and merges shifted indices across hops', async () => {
    const hop1: types.GenerateContentResponse[] = [
      buildResponse({parts: [{text: 'hop 1 intro, '}]}),
      Object.assign(
        buildResponse({
          parts: [{text: 'hop 1 grounded. '}],
          finishReason: types.FinishReason.CONTINUATION,
          continuationToken: 'tok-stream-1',
        }),
        {
          candidates: [
            {
              content: {role: 'model', parts: [{text: 'hop 1 grounded. '}]},
              finishReason: types.FinishReason.CONTINUATION,
              continuationToken: 'tok-stream-1',
              groundingMetadata: {
                groundingChunks: [{web: {uri: 'https://source1.example'}}],
                groundingSupports: [
                  {
                    groundingChunkIndices: [0],
                    segment: {partIndex: 0, text: 'hop 1 grounded. '},
                  },
                ],
              },
            },
          ],
        },
      ),
    ];
    const hop2: types.GenerateContentResponse[] = [
      buildResponse({parts: [{text: 'hop 2 intro, '}]}),
      Object.assign(
        buildResponse({
          parts: [{text: 'hop 2 grounded.'}],
          finishReason: types.FinishReason.STOP,
        }),
        {
          candidates: [
            {
              content: {role: 'model', parts: [{text: 'hop 2 grounded.'}]},
              finishReason: types.FinishReason.STOP,
              groundingMetadata: {
                groundingChunks: [{web: {uri: 'https://source2.example'}}],
                groundingSupports: [
                  {
                    groundingChunkIndices: [0],
                    segment: {partIndex: 0, text: 'hop 2 grounded.'},
                  },
                ],
              },
            },
          ],
        },
      ),
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
      contents: 'Grounded stream',
    });
    const chunks: types.GenerateContentResponse[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(spy).toHaveBeenCalledTimes(2);
    expect(chunks.length).toBe(4);
    // Each yielded chunk keeps per-chunk indices resolving to that chunk's groundingChunks[0] and parts[0].
    const sHop1 =
      chunks[1].candidates?.[0]?.groundingMetadata?.groundingSupports?.[0];
    expect(
      chunks[1].candidates?.[0]?.groundingMetadata?.groundingChunks?.[
        sHop1!.groundingChunkIndices![0]
      ]?.web?.uri,
    ).toBe('https://source1.example');
    expect(
      chunks[1].candidates?.[0]?.content?.parts?.[sHop1!.segment!.partIndex!]
        ?.text,
    ).toBe('hop 1 grounded. ');
    expect(chunks[1].candidates?.[0]?.finishReason).toBeUndefined();

    const sHop2 =
      chunks[3].candidates?.[0]?.groundingMetadata?.groundingSupports?.[0];
    expect(
      chunks[3].candidates?.[0]?.groundingMetadata?.groundingChunks?.[
        sHop2!.groundingChunkIndices![0]
      ]?.web?.uri,
    ).toBe('https://source2.example');
    expect(
      chunks[3].candidates?.[0]?.content?.parts?.[sHop2!.segment!.partIndex!]
        ?.text,
    ).toBe('hop 2 grounded.');
    expect(chunks[3].candidates?.[0]?.finishReason).toBe(
      types.FinishReason.STOP,
    );

    // Merging the streamed chunks shifts indices across all 4 chunks.
    const merged = afc.mergeContinuationResponses(chunks);
    const cand = merged.candidates?.[0];
    const gm = cand?.groundingMetadata;
    expect(gm?.groundingSupports?.length).toBe(2);
    expect(
      gm?.groundingChunks?.[gm!.groundingSupports![0].groundingChunkIndices![0]]
        ?.web?.uri,
    ).toBe('https://source1.example');
    expect(
      cand?.content?.parts?.[gm!.groundingSupports![0].segment!.partIndex!]
        ?.text,
    ).toBe('hop 1 grounded. ');
    expect(
      gm?.groundingChunks?.[gm!.groundingSupports![1].groundingChunkIndices![0]]
        ?.web?.uri,
    ).toBe('https://source2.example');
    expect(
      cand?.content?.parts?.[gm!.groundingSupports![1].segment!.partIndex!]
        ?.text,
    ).toBe('hop 2 grounded.');
  });

  it('generateContentStream discards stale checkpoint continuationToken when candidate ends with STOP', async () => {
    const chunk1 = buildResponse({
      parts: [{text: 'Chunk 1 with checkpoint, '}],
      continuationToken: 'checkpoint-token-1',
    });
    const chunk2 = buildResponse({
      parts: [{text: 'Chunk 2 final.'}],
      finishReason: types.FinishReason.STOP,
    });

    const spy = spyOn(
      internalModels,
      'generateContentStreamInternal',
    ).and.returnValues(Promise.resolve(makeStream([chunk1, chunk2])));

    const stream = await client.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: 'Generate text',
      config: {automaticContinuation: true},
    });

    const chunks: types.GenerateContentResponse[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(spy).toHaveBeenCalledTimes(1);
    expect(chunks.length).toBe(2);
    expect(chunks[0].text).toBe('Chunk 1 with checkpoint, ');
    expect(chunks[1].text).toBe('Chunk 2 final.');
    expect(chunks[1].candidates?.[0]?.finishReason).toBe(
      types.FinishReason.STOP,
    );
    expect(chunks[1].candidates?.[0]?.continuationToken).toBeUndefined();
  });

  it('generateContentStream re-throws AbortError and does not attempt continuation', async () => {
    const abortController = new AbortController();
    async function* makeAbortingStream(): AsyncGenerator<types.GenerateContentResponse> {
      yield buildResponse({
        parts: [{text: 'Checkpoint before abort, '}],
        continuationToken: 'ckpt-before-abort',
      });
      abortController.abort();
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      throw abortError;
    }

    const spy = spyOn(
      internalModels,
      'generateContentStreamInternal',
    ).and.returnValues(Promise.resolve(makeAbortingStream()));

    const stream = await client.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: 'Generate with abort',
      config: {
        automaticContinuation: true,
        abortSignal: abortController.signal,
      },
    });

    let caughtError: unknown;
    try {
      for await (const chunk of stream) {
        // First chunk should arrive
        expect(chunk.text).toBe('Checkpoint before abort, ');
      }
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeDefined();
    expect((caughtError as Error).name).toBe('AbortError');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('generateContentStream does not attach initialPromptTokenCount when automaticContinuation is false', async () => {
    const chunk1 = buildResponse({
      parts: [{text: 'Chunk with usage'}],
      finishReason: types.FinishReason.STOP,
      usageMetadata: {
        promptTokenCount: 42,
        candidatesTokenCount: 10,
        totalTokenCount: 52,
      },
    });

    const spy = spyOn(
      internalModels,
      'generateContentStreamInternal',
    ).and.returnValues(Promise.resolve(makeStream([chunk1])));

    const stream = await client.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: 'Generate with opt-out',
      config: {automaticContinuation: false},
    });

    const received: types.GenerateContentResponse[] = [];
    for await (const chunk of stream) {
      received.push(chunk);
    }

    expect(spy).toHaveBeenCalledTimes(1);
    expect(received.length).toBe(1);
    expect(received[0].usageMetadata?.promptTokenCount).toBe(42);
    expect(received[0].usageMetadata?.initialPromptTokenCount).toBeUndefined();
  });
});

describe('Chat automatic continuation', () => {
  let client: GoogleGenAI;
  let internalModels: InternalModels;

  beforeEach(() => {
    client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    internalModels = client.models as unknown as InternalModels;
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

    const spy = spyOn(
      internalModels,
      'generateContentInternal',
    ).and.returnValues(
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
    expect(response.initialPromptTokenCount).toBe(10);
    expect(response.usageMetadata?.initialPromptTokenCount).toBe(10);
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

    const spy = spyOn(
      internalModels,
      'generateContentInternal',
    ).and.returnValues(Promise.resolve(hop1), Promise.resolve(hop2));

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
    const spy = spyOn(
      internalModels,
      'generateContentInternal',
    ).and.returnValue(Promise.resolve(hop1));

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
    const spy = spyOn(
      internalModels,
      'generateContentInternal',
    ).and.returnValues(Promise.resolve(hop1), Promise.resolve(hop2));

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

    const spy = spyOn(
      internalModels,
      'generateContentStreamInternal',
    ).and.returnValues(
      Promise.resolve(makeStream(hop1)),
      Promise.resolve(makeStream(hop2)),
      Promise.resolve(makeStream(hop3)),
      Promise.resolve(makeStream(hop4)),
    );

    const chat = client.chats.create({model: 'gemini-2.5-flash'});
    const stream = await chat.sendMessageStream({message: 'Stream a story'});
    const receivedChunks: types.GenerateContentResponse[] = [];
    for await (const chunk of stream) {
      receivedChunks.push(chunk);
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
    expect(receivedChunks.map((c) => c.text ?? '')).toEqual([
      'Stream 1A, ',
      'Stream 1B, ',
      'Stream 2, ',
      'Stream 3, ',
      'Stream 4.',
    ]);
    for (const intermediate of receivedChunks.slice(0, 4)) {
      expect(intermediate.candidates?.[0]?.finishReason).toBeUndefined();
    }
    expect(receivedChunks[4].candidates?.[0]?.finishReason).toBe(
      types.FinishReason.STOP,
    );
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
    const spy = spyOn(
      internalModels,
      'generateContentStreamInternal',
    ).and.returnValue(Promise.resolve(makeStream([hop1Chunk])));

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
    expect(received[0].candidates?.[0]?.finishReason).toBe(
      types.FinishReason.CONTINUATION,
    );
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

    const spy = spyOn(
      internalModels,
      'generateContentStreamInternal',
    ).and.returnValues(
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
    expect(received[0].candidates?.[0]?.finishReason).toBeUndefined();
    expect(received[1].candidates?.[0]?.finishReason).toBe(
      types.FinishReason.MAX_TOKENS,
    );
  });

  it('sendMessageStream decouples automatic continuation from AFC (CallableTool)', async () => {
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

  it('sendMessageStream does not record incomplete continuation hop in curated history', async () => {
    const hop1 = [
      buildResponse({
        parts: [{text: 'Hop 1, '}],
        finishReason: types.FinishReason.CONTINUATION,
        continuationToken: 'chat-stream-tok-1',
      }),
    ];
    const hop2CutOff = [
      buildResponse({
        parts: [{text: 'Hop 2 cut off without finishReason'}],
      }),
    ];

    const spy = spyOn(
      internalModels,
      'generateContentStreamInternal',
    ).and.returnValues(
      Promise.resolve(makeStream(hop1)),
      Promise.resolve(makeStream(hop2CutOff)),
    );

    const chat = client.chats.create({model: 'gemini-2.5-flash'});
    const stream = await chat.sendMessageStream({message: 'Stream a story'});
    const receivedTexts: string[] = [];
    for await (const chunk of stream) {
      receivedTexts.push(chunk.text ?? '');
    }

    expect(spy).toHaveBeenCalledTimes(2);
    expect(receivedTexts).toEqual([
      'Hop 1, ',
      'Hop 2 cut off without finishReason',
    ]);
    expect(chat.getHistory(true)).toEqual([]);
  });

  it('sendMessageStream resumes from checkpoint continuationToken on mid-stream cutoff or error and records complete history', async () => {
    async function* makeFailingStream(
      chunks: types.GenerateContentResponse[],
      errorMessage: string,
    ): AsyncGenerator<types.GenerateContentResponse> {
      for (const chunk of chunks) {
        yield chunk;
      }
      throw new Error(errorMessage);
    }

    const hop1Cutoff = [
      buildResponse({
        parts: [{text: 'Chat ckpt 1, '}],
        continuationToken: 'chat-ckpt-1',
      }),
    ];
    const hop2Error = [
      buildResponse({
        parts: [{text: 'Chat ckpt 2, '}],
        continuationToken: 'chat-ckpt-2',
      }),
    ];
    const hop3Done = [
      buildResponse({
        parts: [{text: 'Chat final.'}],
        finishReason: types.FinishReason.STOP,
      }),
    ];

    const spy = spyOn(
      internalModels,
      'generateContentStreamInternal',
    ).and.returnValues(
      Promise.resolve(makeStream(hop1Cutoff)),
      Promise.resolve(makeFailingStream(hop2Error, 'stream interrupted')),
      Promise.resolve(makeStream(hop3Done)),
    );

    const chat = client.chats.create({model: 'gemini-2.5-flash'});
    const stream = await chat.sendMessageStream({message: 'Stream a story'});
    const receivedTexts: string[] = [];
    for await (const chunk of stream) {
      receivedTexts.push(chunk.text ?? '');
    }

    expect(spy).toHaveBeenCalledTimes(3);
    const calls = spy.calls.allArgs();
    expect(calls[0][0].config).toEqual({});
    expect(calls[1][0].config).toEqual({continuationToken: 'chat-ckpt-1'});
    expect(calls[2][0].config).toEqual({continuationToken: 'chat-ckpt-2'});
    expect(receivedTexts).toEqual([
      'Chat ckpt 1, ',
      'Chat ckpt 2, ',
      'Chat final.',
    ]);
    expect(chat.getHistory(true)).toEqual([
      {role: 'user', parts: [{text: 'Stream a story'}]},
      {role: 'model', parts: [{text: 'Chat ckpt 1, '}]},
      {role: 'model', parts: [{text: 'Chat ckpt 2, '}]},
      {role: 'model', parts: [{text: 'Chat final.'}]},
    ]);
  });
});
