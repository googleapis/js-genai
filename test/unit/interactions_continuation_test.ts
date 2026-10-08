/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-empty, no-constant-condition */

import * as fs from 'fs';
import * as path from 'path';
import {
  GeminiNextGenInteractions,
  GoogleGenAIParentClient,
  _resetContinuationWarningsForTesting,
} from '../../src/gaos/google-genai.js';
import {Stream} from '../../src/gaos/lib/event-streams.js';

describe('Interactions Automatic Continuation', () => {
  void fs;
  void path;
  void projectToExpectedShape;
  let parentClient: jasmine.SpyObj<GoogleGenAIParentClient>;
  let interactions: GeminiNextGenInteractions;

  const mockJsonResponse = (body: unknown, status = 200) => {
    return new Response(JSON.stringify(body), {
      status,
      headers: {'Content-Type': 'application/json'},
    });
  };

  const mockSseResponse = (events: any[], status = 200) => {
    const sseText = events
      .map(
        (ev: any) =>
          `event: ${ev?.event_type ?? 'message'}\ndata: ${JSON.stringify(ev)}\n\n`,
      )
      .join('');
    return new Response(sseText, {
      status,
      headers: {'Content-Type': 'text/event-stream'},
    });
  };

  function projectToExpectedShape(actual: any, expected: any): any {
    if (
      expected === null ||
      typeof expected !== 'object' ||
      actual === null ||
      typeof actual !== 'object'
    ) {
      return actual;
    }
    if (Array.isArray(expected)) {
      if (!Array.isArray(actual)) return actual;
      return actual.map((item, idx) =>
        idx < expected.length
          ? projectToExpectedShape(item, expected[idx])
          : item,
      );
    }
    const result: Record<string, any> = {};
    for (const key of Object.keys(expected)) {
      if (key in actual && actual[key] !== undefined) {
        result[key] = projectToExpectedShape(actual[key], expected[key]);
      } else if (expected[key] === null) {
        result[key] = null;
      } else if (
        (key === 'id' || key === 'output_text') &&
        expected[key] === ''
      ) {
        result[key] = '';
      }
    }
    return result;
  }

  async function getRequestBody(input: any): Promise<any> {
    if (input instanceof Request) {
      try {
        return await input.clone().json();
      } catch {
        return {};
      }
    }
    if (typeof input?.body === 'string') {
      try {
        return JSON.parse(input.body);
      } catch {
        return {};
      }
    }
    return {};
  }

  beforeEach(() => {
    _resetContinuationWarningsForTesting();

    parentClient = jasmine.createSpyObj<GoogleGenAIParentClient>([
      'isVertexAI',
      'getProject',
      'getLocation',
      'getBaseUrl',
      'getApiVersion',
      'getAuthHeaders',
    ]);
    parentClient.isVertexAI.and.returnValue(false);
    parentClient.getProject.and.returnValue('my-project');
    parentClient.getLocation.and.returnValue('my-location');
    parentClient.getBaseUrl.and.returnValue(
      'https://generativelanguage.googleapis.com',
    );
    parentClient.getApiVersion.and.returnValue('v1beta');
    parentClient.getAuthHeaders.and.callFake(() =>
      Promise.resolve(new Headers()),
    );

    interactions = new GeminiNextGenInteractions(parentClient);
  });

  describe('interaction output properties', () => {
    it('skips thought steps in output_text but stops at tool boundaries', async () => {
      const interaction: any = {
        id: 'int_tool',
        status: 'completed',
        steps: [
          {type: 'thought', signature: 'sig_0'},
          {
            type: 'model_output',
            content: [{type: 'text', text: 'Pre-tool chatter. '}],
          },
          {
            type: 'function_call',
            id: 'call_1',
            name: 'search',
            arguments: {q: 'test'},
          },
          {type: 'function_result', call_id: 'call_1', result: 'found'},
          {type: 'thought', signature: 'sig_1'},
          {
            type: 'model_output',
            content: [{type: 'text', text: 'Post-tool hop 1. '}],
          },
          {type: 'thought', signature: 'sig_2'},
          {
            type: 'model_output',
            content: [{type: 'text', text: 'Post-tool hop 2.'}],
          },
        ],
      };

      spyOn(globalThis, 'fetch').and.callFake(async () =>
        mockJsonResponse(interaction),
      );

      const res = await interactions.get('int_tool');
      expect(res.output_text).toBe('Post-tool hop 1. Post-tool hop 2.');
    });

    it('stops output property derivation at user_input step and populates get/cancel responses', async () => {
      const body = {
        id: 'int_media',
        status: 'completed',
        steps: [
          {
            type: 'model_output',
            content: [{type: 'text', text: 'Earlier turn text'}],
          },
          {
            type: 'user_input',
            content: [{type: 'text', text: 'Next user turn'}],
          },
          {
            type: 'model_output',
            content: [
              {type: 'text', text: 'Final turn text'},
              {type: 'image', data: 'img_b64', mime_type: 'image/png'},
              {type: 'audio', data: 'aud_b64', mime_type: 'audio/mp3'},
              {type: 'video', data: 'vid_b64', mime_type: 'video/mp4'},
            ],
          },
        ],
      };

      spyOn(globalThis, 'fetch').and.callFake(async () =>
        mockJsonResponse(body),
      );

      const getRes = await interactions.get('int_media');
      expect(getRes.output_text).toBe('Final turn text');
      expect(getRes.output_image).toEqual({
        type: 'image',
        data: 'img_b64',
        mime_type: 'image/png',
      } as any);
      expect(getRes.output_audio).toEqual({
        type: 'audio',
        data: 'aud_b64',
        mime_type: 'audio/mp3',
      } as any);
      expect(getRes.output_video).toEqual({
        type: 'video',
        data: 'vid_b64',
        mime_type: 'video/mp4',
      } as any);

      const cancelRes = await interactions.cancel('int_media');
      expect(cancelRes.output_text).toBe('Final turn text');
      expect(cancelRes.output_image).toBeDefined();
    });
  });

  describe('unary automatic_continuation loop', () => {
    it('stops when continuation_token is missing or empty', async () => {
      const missingTokenResp = {
        id: 'int_missing_tok',
        status: 'continuation_required',
        continuation_token: null,
        steps: [
          {
            type: 'model_output',
            content: [
              {type: 'text', text: 'Continuation required without token'},
            ],
          },
        ],
      };
      const emptyTokenResp = {
        id: 'int_empty_tok',
        status: 'continuation_required',
        continuation_token: '',
        steps: [
          {
            type: 'model_output',
            content: [
              {type: 'text', text: 'Continuation required with empty token'},
            ],
          },
        ],
      };

      let callIndex = 0;
      const fetchSpy = spyOn(globalThis, 'fetch').and.callFake(async () =>
        mockJsonResponse(callIndex++ === 0 ? missingTokenResp : emptyTokenResp),
      );

      const res1 = await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'Test 1',
        automatic_continuation: true,
      });
      const res2 = await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'Test 2',
        automatic_continuation: true,
      });

      expect(fetchSpy.calls.count()).toBe(2);
      expect(res1.status).toBe('continuation_required' as any);
      expect(res1.output_text).toBe('Continuation required without token');
      expect(res2.status).toBe('continuation_required' as any);
      expect(res2.output_text).toBe('Continuation required with empty token');
    });

    it('uses initial caller continuation_token on hop 1 and hop 1 token on hop 2', async () => {
      const hop1 = {
        id: 'int_1',
        status: 'continuation_required',
        continuation_token: 'tok_from_hop_1',
        steps: [
          {type: 'model_output', content: [{type: 'text', text: 'Hop 1 '}]},
        ],
      };
      const hop2 = {
        id: 'int_1',
        status: 'completed',
        continuation_token: null,
        steps: [
          {
            type: 'model_output',
            content: [{type: 'text', text: 'Hop 1 Hop 2'}],
          },
        ],
      };

      const sentTokens: Array<string | undefined> = [];
      let callIndex = 0;
      spyOn(globalThis, 'fetch').and.callFake(async (input: any) => {
        const body = await getRequestBody(input);
        sentTokens.push(body.continuation_token);
        return mockJsonResponse(callIndex++ === 0 ? hop1 : hop2);
      });

      const res = await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'Resume prompt',
        continuation_token: 'caller_initial_token',
        automatic_continuation: true,
      });

      expect(sentTokens).toEqual(['caller_initial_token', 'tok_from_hop_1']);
      expect(res.output_text).toBe('Hop 1 Hop 2');
    });

    it('retries transient HTTP 503 on hop 2 without re-running hop 1', async () => {
      const hop1 = {
        id: 'int_1',
        status: 'continuation_required',
        continuation_token: 'tok_1',
        steps: [
          {type: 'model_output', content: [{type: 'text', text: 'Hop 1 '}]},
        ],
      };
      const hop2 = {
        id: 'int_1',
        status: 'completed',
        continuation_token: null,
        steps: [
          {
            type: 'model_output',
            content: [{type: 'text', text: 'Hop 1 Hop 2'}],
          },
        ],
      };

      const sentTokens: Array<string | undefined> = [];
      let callIndex = 0;
      spyOn(globalThis, 'fetch').and.callFake(async (input: any) => {
        const body = await getRequestBody(input);
        sentTokens.push(body.continuation_token);
        callIndex++;
        if (callIndex === 1) {
          return mockJsonResponse(hop1, 200);
        }
        if (callIndex === 2) {
          return mockJsonResponse(
            {error: {message: 'Service Unavailable'}},
            503,
          );
        }
        return mockJsonResponse(hop2, 200);
      });

      const res = await interactions.create(
        {
          model: 'gemini-2.5-pro',
          input: 'Test retry',
          automatic_continuation: true,
        },
        {
          retries: {
            strategy: 'attempt-count-backoff',
            backoff: {
              initialInterval: 1,
              maxInterval: 5,
              exponent: 1,
              maxElapsedTime: 1000,
            },
            retryConnectionErrors: true,
            maxRetries: 2,
          },
        } as any,
      );

      expect(sentTokens).toEqual([undefined, 'tok_1', 'tok_1']);
      expect(res.status).toBe('completed');
      expect(res.output_text).toBe('Hop 1 Hop 2');
    });
  });

  describe('streaming automatic_continuation', () => {
    it('continues using checkpoint continuation_token from interaction.status_update event', async () => {
      const hop1Events = [
        {event_type: 'interaction.created', interaction: {id: 'int_stream'}},
        {
          event_type: 'interaction.status_update',
          status: 'in_progress',
          continuation_token: 'checkpoint_tok_1',
        },
        {event_type: 'step.delta', delta: {type: 'text', text: 'Chunk 1 '}},
        {
          event_type: 'interaction.completed',
          interaction: {
            id: 'int_stream',
            status: 'continuation_required',
          },
        },
      ];
      const hop2Events = [
        {event_type: 'interaction.created', interaction: {id: 'int_stream'}},
        {event_type: 'step.delta', delta: {type: 'text', text: 'Chunk 2'}},
        {
          event_type: 'interaction.completed',
          interaction: {
            id: 'int_stream',
            status: 'completed',
          },
        },
      ];

      const sentTokens: Array<string | undefined> = [];
      let callIndex = 0;
      spyOn(globalThis, 'fetch').and.callFake(async (input: any) => {
        const body = await getRequestBody(input);
        sentTokens.push(body.continuation_token);
        return mockSseResponse(callIndex++ === 0 ? hop1Events : hop2Events);
      });

      const stream = (await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'Test prompt',
        stream: true,
        automatic_continuation: true,
      })) as Stream<any>;

      const receivedText: string[] = [];
      for await (const chunk of stream) {
        if (chunk.event_type === 'step.delta' && chunk.delta?.type === 'text') {
          receivedText.push(chunk.delta.text);
        }
      }

      expect(sentTokens).toEqual([undefined, 'checkpoint_tok_1']);
      expect(receivedText.join('')).toBe('Chunk 1 Chunk 2');
    });

    it('resumes on dead connection using last continuation_token', async () => {
      const hop1EventsBeforeDrop = [
        {
          event_type: 'interaction.created',
          interaction: {id: 'int_stream', status: 'in_progress'},
        },
        {event_type: 'step.delta', delta: {type: 'text', text: 'Chunk 1 '}},
        {
          event_type: 'interaction.status_update',
          status: 'in_progress',
          continuation_token: 'tok_checkpoint_1',
        },
        {event_type: 'step.delta', delta: {type: 'text', text: 'Chunk 2 '}},
        {
          event_type: 'interaction.status_update',
          status: 'in_progress',
          continuation_token: 'tok_checkpoint_2',
        },
      ];
      const hop2Events = [
        {
          event_type: 'interaction.created',
          interaction: {id: 'int_stream', status: 'in_progress'},
        },
        {event_type: 'step.delta', delta: {type: 'text', text: 'Chunk 3'}},
        {
          event_type: 'interaction.completed',
          interaction: {
            id: 'int_stream',
            status: 'completed',
          },
        },
      ];

      const makeDroppingSseResponse = (
        events: any[],
        disconnectError?: Error,
      ) => {
        const enc = new TextEncoder();
        const sseText = events
          .map(
            (ev: any) =>
              `event: ${ev?.event_type ?? 'message'}\ndata: ${JSON.stringify(ev)}\n\n`,
          )
          .join('');
        let sentEvents = false;
        const body = new ReadableStream<Uint8Array>({
          pull(controller) {
            if (!sentEvents) {
              sentEvents = true;
              controller.enqueue(enc.encode(sseText));
              return;
            }
            if (disconnectError) {
              controller.error(disconnectError);
            } else {
              controller.close();
            }
          },
        });
        return new Response(body, {
          status: 200,
          headers: {'Content-Type': 'text/event-stream'},
        });
      };

      const fetchSpy = spyOn(globalThis, 'fetch');

      // 1. Dead connection mid-stream (transport error or premature EOF) after
      // checkpoint tokens -> reconnects and sends the last continuation_token.
      for (const disconnectErr of [
        new Error('peer closed connection'),
        undefined,
      ]) {
        fetchSpy.calls.reset();
        const sentTokens: Array<string | undefined> = [];
        let callIndex = 0;
        fetchSpy.and.callFake(async (input: any) => {
          const body = await getRequestBody(input);
          sentTokens.push(body.continuation_token);
          if (callIndex++ === 0) {
            return makeDroppingSseResponse(hop1EventsBeforeDrop, disconnectErr);
          }
          return mockSseResponse(hop2Events);
        });

        const stream = (await interactions.create({
          model: 'gemini-2.5-pro',
          input: 'Dead connection resume test',
          stream: true,
          automatic_continuation: true,
        })) as Stream<any>;

        const received: any[] = [];
        for await (const ev of stream) {
          received.push(ev);
        }

        expect(fetchSpy.calls.count()).toBe(2);
        expect(sentTokens).toEqual([undefined, 'tok_checkpoint_2']);
        expect(received.length).toBe(
          hop1EventsBeforeDrop.length + hop2Events.length,
        );
      }

      // 2. Dead connection before any continuation_token in the hop -> throws error.
      const eventsWithoutToken = [
        {
          event_type: 'interaction.created',
          interaction: {id: 'int_stream', status: 'in_progress'},
        },
        {event_type: 'step.delta', delta: {type: 'text', text: 'Early chunk'}},
      ];
      fetchSpy.calls.reset();
      fetchSpy.and.callFake(async () =>
        makeDroppingSseResponse(
          eventsWithoutToken,
          new Error('early disconnect'),
        ),
      );

      const streamEarlyDrop = (await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'Early dead connection test',
        stream: true,
        automatic_continuation: true,
      })) as Stream<any>;

      await expectAsync(
        (async () => {
          for await (const _ of streamEarlyDrop) {
            // consume
          }
        })(),
      ).toBeRejectedWithError(/early disconnect/);
      expect(fetchSpy.calls.count()).toBe(1);

      // 3. Dead connection when automatic_continuation: false -> throws even if
      // checkpoint token was received.
      fetchSpy.calls.reset();
      fetchSpy.and.callFake(async () =>
        makeDroppingSseResponse(
          hop1EventsBeforeDrop,
          new Error('disconnect with auto_continue=false'),
        ),
      );

      const streamNoAuto = (await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'No auto-continue dead connection test',
        stream: true,
        automatic_continuation: false,
      })) as Stream<any>;

      await expectAsync(
        (async () => {
          for await (const _ of streamNoAuto) {
            // consume
          }
        })(),
      ).toBeRejectedWithError(/disconnect with auto_continue=false/);
      expect(fetchSpy.calls.count()).toBe(1);

      // 4. Consecutive failure on resumed hop before a new token is emitted ->
      // throws without infinite looping.
      fetchSpy.calls.reset();
      let consecutiveCall = 0;
      fetchSpy.and.callFake(async () => {
        if (consecutiveCall++ === 0) {
          return makeDroppingSseResponse(
            hop1EventsBeforeDrop,
            new Error('hop 1 disconnect'),
          );
        }
        return makeDroppingSseResponse(
          eventsWithoutToken,
          new Error('hop 2 disconnect before token'),
        );
      });

      const streamConsecutive = (await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'Consecutive dead connection test',
        stream: true,
        automatic_continuation: true,
      })) as Stream<any>;

      await expectAsync(
        (async () => {
          for await (const _ of streamConsecutive) {
            // consume
          }
        })(),
      ).toBeRejectedWithError(/hop 2 disconnect before token/);
      expect(fetchSpy.calls.count()).toBe(2);

      // 5. Server SSE error event after a checkpoint token -> stops cleanly
      // without reconnecting.
      const eventsWithSseError = [
        ...hop1EventsBeforeDrop,
        {
          event_type: 'error',
          error: {code: 'resource_exhausted', message: 'quota exceeded'},
        },
      ];
      fetchSpy.calls.reset();
      fetchSpy.and.callFake(async () => mockSseResponse(eventsWithSseError));

      const streamSseError = (await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'SSE error event after checkpoint',
        stream: true,
        automatic_continuation: true,
      })) as Stream<any>;

      const receivedWithSseError: any[] = [];
      for await (const ev of streamSseError) {
        receivedWithSseError.push(ev);
      }
      expect(fetchSpy.calls.count()).toBe(1);
      expect(receivedWithSseError.length).toBe(eventsWithSseError.length);
      expect(
        receivedWithSseError[receivedWithSseError.length - 1].event_type,
      ).toBe('error');
    });

    it('stops streaming when status is requires_action or continuation_token is empty', async () => {
      const requiresActionEvents = [
        {
          event_type: 'interaction.completed',
          interaction: {
            id: 'int_stream',
            status: 'requires_action',
            continuation_token: 'tok_unused',
          },
        },
      ];
      const emptyTokenEvents = [
        {
          event_type: 'interaction.completed',
          interaction: {
            id: 'int_stream_empty',
            status: 'continuation_required',
            continuation_token: '',
          },
        },
      ];
      const missingTokenEvents = [
        {
          event_type: 'interaction.completed',
          interaction: {
            id: 'int_stream_missing',
            status: 'continuation_required',
          },
        },
      ];

      const fetchSpy = spyOn(globalThis, 'fetch').and.callFake(async () =>
        mockSseResponse(requiresActionEvents),
      );

      const stream1 = (await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'Test prompt',
        stream: true,
        automatic_continuation: true,
      })) as Stream<any>;

      const got1: any[] = [];
      for await (const ev of stream1) {
        got1.push(ev);
      }
      expect(fetchSpy.calls.count()).toBe(1);
      expect(got1.length).toBe(1);

      fetchSpy.calls.reset();
      fetchSpy.and.callFake(async () => mockSseResponse(emptyTokenEvents));

      const stream2 = (await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'Test empty token',
        stream: true,
        automatic_continuation: true,
      })) as Stream<any>;

      const got2: any[] = [];
      for await (const ev of stream2) {
        got2.push(ev);
      }
      expect(fetchSpy.calls.count()).toBe(1);
      expect(got2.length).toBe(1);

      fetchSpy.calls.reset();
      fetchSpy.and.callFake(async () => mockSseResponse(missingTokenEvents));

      const stream3 = (await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'Test missing token',
        stream: true,
        automatic_continuation: true,
      })) as Stream<any>;

      const got3: any[] = [];
      for await (const ev of stream3) {
        got3.push(ev);
      }
      expect(fetchSpy.calls.count()).toBe(1);
      expect(got3.length).toBe(1);
    });

    it('aborts streaming continuation cleanly when iterator returns early on hop 2', async () => {
      const hop1Events = [
        {
          event_type: 'interaction.completed',
          interaction: {
            id: 'int_stream',
            status: 'continuation_required',
            continuation_token: 'tok_1',
          },
        },
      ];
      let hop2Cancelled = false;
      const enc = new TextEncoder();
      const hop2Body = new ReadableStream<Uint8Array>({
        pull(controller) {
          controller.enqueue(
            enc.encode(
              'event: step.delta\ndata: {"event_type":"step.delta","delta":{"type":"text","text":"Hop 2 chunk 1"}}\n\n',
            ),
          );
        },
        cancel() {
          hop2Cancelled = true;
        },
      });

      let callIndex = 0;
      spyOn(globalThis, 'fetch').and.callFake(async () => {
        if (callIndex++ === 0) {
          return mockSseResponse(hop1Events);
        }
        return new Response(hop2Body, {
          status: 200,
          headers: {'Content-Type': 'text/event-stream'},
        });
      });

      const stream = (await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'Test prompt',
        stream: true,
        automatic_continuation: true,
      })) as Stream<any>;

      let count = 0;
      for await (const chunk of stream) {
        if (chunk.event_type === 'step.delta') {
          count++;
          break; // Early exit during hop 2
        }
      }

      expect(count).toBe(1);
      expect(hop2Cancelled).toBeTrue();
    });

    it('preserves wrapStreamErrors across hops when hop 2 fails or stream iterator throws', async () => {
      const hop1Events = [
        {event_type: 'interaction.created', interaction: {id: 'int_stream'}},
        {event_type: 'step.delta', delta: {type: 'text', text: 'Chunk 1 '}},
        {
          event_type: 'interaction.completed',
          interaction: {
            id: 'int_stream',
            status: 'continuation_required',
            continuation_token: 'tok_stream_1',
            usage: {total_output_tokens: 20},
          },
        },
      ];

      let callIndex = 0;
      spyOn(globalThis, 'fetch').and.callFake(async () => {
        if (callIndex++ === 0) {
          return mockSseResponse(hop1Events);
        }
        return mockJsonResponse(
          {error: {message: 'Stream failed on hop 2'}},
          400,
        );
      });

      const stream = (await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'Test prompt',
        stream: true,
        automatic_continuation: true,
      })) as Stream<any>;

      const received: any[] = [];
      let caughtError: any;
      try {
        for await (const chunk of stream) {
          received.push(chunk);
        }
      } catch (e) {
        caughtError = e;
      }

      expect(received.length).toBe(3);
      expect(caughtError).toBeDefined();
      expect(caughtError.message).toContain('Stream failed on hop 2');
    });
  });

  describe('background validation', () => {
    it('throws an error when automatic_continuation is false and background is true in unary mode', async () => {
      const fetchSpy = spyOn(globalThis, 'fetch');

      await expectAsync(
        interactions.create({
          model: 'gemini-2.5-pro',
          input: 'Test',
          background: true,
          automatic_continuation: false,
        } as any),
      ).toBeRejectedWithError(
        /automatic_continuation: false cannot be used with background: true/,
      );

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('throws an error when automatic_continuation is false and background is true in streaming mode', async () => {
      const fetchSpy = spyOn(globalThis, 'fetch');

      await expectAsync(
        interactions.create({
          model: 'gemini-2.5-pro',
          input: 'Test',
          background: true,
          stream: true,
          automatic_continuation: false,
        } as any),
      ).toBeRejectedWithError(
        /automatic_continuation: false cannot be used with background: true/,
      );

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('store: false validation', () => {
    it('rejects automatic_continuation: true when store: false in unary mode before making any HTTP call', async () => {
      const fetchSpy = spyOn(globalThis, 'fetch');

      await expectAsync(
        interactions.create({
          model: 'gemini-2.5-pro',
          input: 'Test',
          store: false,
          automatic_continuation: true,
        }),
      ).toBeRejectedWithError(
        /automatic_continuation: true cannot be used with store: false in unary mode/,
      );

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('warnings', () => {
    it('warns once when unary interaction stops with status continuation_required and continuation_token', async () => {
      const warnSpy = spyOn(console, 'warn');
      const hop1 = {
        id: 'int_1',
        status: 'continuation_required',
        continuation_token: 'tok_1',
        steps: [
          {type: 'model_output', content: [{type: 'text', text: 'Cut off'}]},
        ],
      };
      spyOn(globalThis, 'fetch').and.callFake(async () =>
        mockJsonResponse(hop1),
      );

      await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'Test 1',
      });
      await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'Test 2',
      });

      const incompleteWarns = warnSpy.calls
        .allArgs()
        .filter((args) =>
          String(args[0] ?? '').includes(
            "Interaction stopped before completion (status='continuation_required')",
          ),
        );
      expect(incompleteWarns.length).toBe(1);
    });

    it('warns once when streaming interaction stops with status continuation_required and continuation_token', async () => {
      const warnSpy = spyOn(console, 'warn');
      const hop1Events = [
        {
          event_type: 'interaction.completed',
          interaction: {
            id: 'int_stream',
            status: 'continuation_required',
            continuation_token: 'tok_stream_1',
          },
        },
      ];
      spyOn(globalThis, 'fetch').and.callFake(async () =>
        mockSseResponse(hop1Events),
      );

      for (let i = 0; i < 2; i++) {
        const stream = (await interactions.create({
          model: 'gemini-2.5-pro',
          input: 'Test',
          stream: true,
        })) as Stream<any>;
        for await (const _ of stream) {
          // consume stream
        }
      }

      const incompleteWarns = warnSpy.calls
        .allArgs()
        .filter((args) =>
          String(args[0] ?? '').includes(
            "Interaction stopped before completion (status='continuation_required')",
          ),
        );
      expect(incompleteWarns.length).toBe(1);
    });

    it('warns and wraps errors when streaming interaction is iterated via stream.values()', async () => {
      const warnSpy = spyOn(console, 'warn');
      const hop1Events = [
        {
          event_type: 'interaction.completed',
          interaction: {
            id: 'int_stream',
            status: 'continuation_required',
            continuation_token: 'tok_stream_1',
          },
        },
      ];
      let shouldErrorOnPull = false;
      spyOn(globalThis, 'fetch').and.callFake(async () => {
        if (!shouldErrorOnPull) {
          return mockSseResponse(hop1Events);
        }
        const errorBody = new ReadableStream<Uint8Array>({
          pull() {
            throw new Error('Raw stream read failure');
          },
        });
        return new Response(errorBody, {
          status: 200,
          headers: {'Content-Type': 'text/event-stream'},
        });
      });

      const stream = (await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'Test values warning',
        stream: true,
      })) as Stream<any>;
      for await (const _ of stream.values()) {
        // consume stream via .values()
      }

      const incompleteWarns = warnSpy.calls
        .allArgs()
        .filter((args) =>
          String(args[0] ?? '').includes(
            "Interaction stopped before completion (status='continuation_required')",
          ),
        );
      expect(incompleteWarns.length).toBe(1);

      shouldErrorOnPull = true;
      const errStream = (await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'Test values error',
        continuation_token: 'caller_tok',
        stream: true,
      })) as Stream<any>;
      let caughtError: any;
      try {
        for await (const _ of errStream.values()) {
          // consume stream via .values()
        }
      } catch (e) {
        caughtError = e;
      }
      expect(caughtError).toBeDefined();
      expect(caughtError.message).toContain('Raw stream read failure');
    });

    it('suppresses incomplete warning when caller passes continuation_token', async () => {
      const warnSpy = spyOn(console, 'warn');
      const hopContinuationRequired = {
        id: 'int_1',
        status: 'continuation_required',
        continuation_token: 'tok_1',
        steps: [
          {type: 'model_output', content: [{type: 'text', text: 'Cut off'}]},
        ],
        usage: {total_output_tokens: 100},
      };

      let isStreaming = false;
      spyOn(globalThis, 'fetch').and.callFake(async () =>
        isStreaming
          ? mockSseResponse([
              {
                event_type: 'interaction.completed',
                interaction: hopContinuationRequired,
              },
            ])
          : mockJsonResponse(hopContinuationRequired),
      );

      await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'Test',
        continuation_token: 'caller_tok',
      });

      isStreaming = true;
      const stream1 = (await interactions.create({
        model: 'gemini-2.5-pro',
        input: 'Test',
        continuation_token: 'caller_tok',
        stream: true,
      })) as Stream<any>;
      for await (const _ of stream1) {
      }

      const incompleteWarns = warnSpy.calls
        .allArgs()
        .filter((args) =>
          String(args[0] ?? '').includes("status='continuation_required'"),
        );
      expect(incompleteWarns.length).toBe(0);
    });
  });
});
