/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * API-mode integration tests for the live (bidirectional WebSocket) module.
 * These talk to the real wss:// endpoint directly, with no test-server proxy.
 * See go/genai-sdk:integration-testing.
 */

import type {Session} from '../../../src/live.js';
import {GoogleGenAI} from '../../../src/node/node_client.js';
import type {FunctionCall, LiveServerMessage} from '../../../src/types.js';
import {Modality, Type} from '../../../src/types.js';

interface LiveBackend {
  name: string;
  model: string;
  isVertex: boolean;
  /**
   * Pins the Vertex client to a region, overriding the GOOGLE_CLOUD_LOCATION
   * the Agent Platform wrapper exports. Undefined means take it as-is.
   */
  location?: string;
}

/**
 * The backends under test. Live models are backend specific, and both are
 * audio-native and reject a TEXT response modality, so these tests request
 * AUDIO and enable output transcription.
 *
 * The Vertex model is not served on the global endpoint, where setup is
 * rejected with 1008 "Publisher model ... was not found". It is available in
 * us-central1, us-east5 and europe-west4, so the client is pinned to a region
 * even though the shared table tests run at global.
 */
const LIVE_BACKENDS: LiveBackend[] = [
  {name: 'Gemini API', model: 'gemini-3.1-flash-live-preview', isVertex: false},
  {
    name: 'Vertex',
    model: 'gemini-live-2.5-flash-native-audio',
    isVertex: true,
    location: 'us-central1',
  },
];

/** Bounds a single model turn, which is otherwise an open-ended stream. */
const TURN_TIMEOUT_MS = 90_000;

/** Per-spec budget; Jasmine's 5s default is far below a live turn. */
const SPEC_TIMEOUT_MS = 2 * TURN_TIMEOUT_MS + 30_000;

interface Turn {
  audioBytes: number;
  transcript: string;
  toolCalls: FunctionCall[];
}

/**
 * Collects live server messages into discrete turns. Wires up onerror and
 * onclose so a broken socket rejects the pending wait rather than hanging.
 */
class TurnCollector {
  private readonly pending: LiveServerMessage[] = [];
  private notify: (() => void) | null = null;
  private failure: Error | null = null;

  readonly callbacks = {
    onmessage: (message: LiveServerMessage) => {
      this.pending.push(message);
      this.notify?.();
    },
    onerror: (event: ErrorEvent) => {
      this.failure = new Error(`live socket error: ${event.message}`);
      this.notify?.();
    },
    onclose: (event: CloseEvent) => {
      this.failure = new Error(
        `live socket closed unexpectedly: ${event.reason}`,
      );
      this.notify?.();
    },
  };

  /** Drains one model turn, or the tool call that interrupts it. */
  async nextTurn(): Promise<Turn> {
    const turn: Turn = {audioBytes: 0, transcript: '', toolCalls: []};
    const deadline = Date.now() + TURN_TIMEOUT_MS;

    for (;;) {
      while (this.pending.length > 0) {
        const message = this.pending.shift()!;
        if (message.toolCall?.functionCalls?.length) {
          turn.toolCalls.push(...message.toolCall.functionCalls);
          return turn;
        }
        const serverContent = message.serverContent;
        if (!serverContent) continue;
        if (serverContent.outputTranscription?.text) {
          turn.transcript += serverContent.outputTranscription.text;
        }
        for (const part of serverContent.modelTurn?.parts ?? []) {
          if (part.inlineData?.data) {
            turn.audioBytes += part.inlineData.data.length;
          }
        }
        if (serverContent.turnComplete) {
          return turn;
        }
      }

      if (this.failure) throw this.failure;

      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        throw new Error(
          `timed out after ${TURN_TIMEOUT_MS}ms waiting for the model turn`,
        );
      }
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, remaining);
        this.notify = () => {
          clearTimeout(timer);
          this.notify = null;
          resolve();
        };
      });
    }
  }
}

/** True when the error is a 429; see go/genai-sdk:integration-testing 4.4. */
function isQuotaError(error: unknown): boolean {
  return error instanceof Error && /429|RESOURCE_EXHAUSTED/.test(error.message);
}

/**
 * Whether the running job has selected this backend, via
 * GOOGLE_GENAI_RUN_{VERTEX,GEMINI}_ONLY_IN_API_MODE. Required, not cosmetic:
 * each live job only has credentials for its own backend.
 */
function backendEnabled(isVertex: boolean): boolean {
  const vertexOnly = !!process.env['GOOGLE_GENAI_RUN_VERTEX_ONLY_IN_API_MODE'];
  const geminiOnly = !!process.env['GOOGLE_GENAI_RUN_GEMINI_ONLY_IN_API_MODE'];
  if (isVertex && geminiOnly) return false;
  if (!isVertex && vertexOnly) return false;
  return true;
}

function liveConfig(overrides: Record<string, unknown> = {}) {
  return {
    responseModalities: [Modality.AUDIO],
    outputAudioTranscription: {},
    ...overrides,
  };
}

for (const backend of LIVE_BACKENDS) {
  // Selected at load time so a disabled backend's specs are reported as
  // skipped rather than each spec having to call pending() at runtime.
  const describeBackend = backendEnabled(backend.isVertex)
    ? describe
    : xdescribe;

  describeBackend(`live module (API mode, ${backend.name})`, () => {
    let ai: GoogleGenAI;

    beforeEach(() => {
      // Passed explicitly because an API key left in the environment would
      // otherwise take precedence and clear them. The location comes from the
      // backend rather than GOOGLE_CLOUD_LOCATION, which the Agent Platform
      // wrapper sets to global for the shared suite.
      ai = backend.isVertex
        ? new GoogleGenAI({
            vertexai: true,
            project: process.env['GOOGLE_CLOUD_PROJECT'],
            location: backend.location ?? process.env['GOOGLE_CLOUD_LOCATION'],
          })
        : new GoogleGenAI({apiKey: process.env['GOOGLE_API_KEY']});
    });

    async function connect(
      collector: TurnCollector,
      config: Record<string, unknown> = liveConfig(),
      model: string = backend.model,
    ): Promise<Session> {
      return await ai.live.connect({
        model,
        config,
        callbacks: collector.callbacks,
      });
    }

    it(
      'produces audio and a transcription for a text turn',
      async () => {
        const collector = new TurnCollector();
        const session = await connect(collector);
        try {
          session.sendClientContent({turns: 'Say hello.', turnComplete: true});
          const turn = await collector.nextTurn();

          expect(turn.audioBytes).toBeGreaterThan(0);
          expect(turn.transcript.trim().length).toBeGreaterThan(0);
        } catch (error) {
          if (isQuotaError(error)) {
            pending(
              `Resource exhausted (429). Skipping instead of failing: ${error}`,
            );
            return;
          }
          throw error;
        } finally {
          session.close();
        }
      },
      SPEC_TIMEOUT_MS,
    );

    it(
      'retains context across turns',
      async () => {
        const collector = new TurnCollector();
        const session = await connect(collector);
        try {
          session.sendClientContent({
            turns: 'Remember the number 42. Just acknowledge it.',
            turnComplete: true,
          });
          const first = await collector.nextTurn();
          expect(first.transcript.trim().length).toBeGreaterThan(0);

          session.sendClientContent({
            turns: 'What number did I ask you to remember?',
            turnComplete: true,
          });
          const second = await collector.nextTurn();

          expect(second.audioBytes).toBeGreaterThan(0);
          expect(second.transcript).toContain('42');
        } catch (error) {
          if (isQuotaError(error)) {
            pending(
              `Resource exhausted (429). Skipping instead of failing: ${error}`,
            );
            return;
          }
          throw error;
        } finally {
          session.close();
        }
      },
      SPEC_TIMEOUT_MS,
    );

    it(
      'completes a function calling round trip',
      async () => {
        const collector = new TurnCollector();
        const session = await connect(
          collector,
          liveConfig({
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'turn_on_the_lights',
                    description: 'Turns the lights on in the room.',
                    parameters: {type: Type.OBJECT, properties: {}},
                  },
                ],
              },
            ],
          }),
        );
        try {
          session.sendClientContent({
            turns: 'Please turn on the lights.',
            turnComplete: true,
          });
          const turn = await collector.nextTurn();

          expect(turn.toolCalls.length).toBeGreaterThan(0);
          const call = turn.toolCalls[0];
          expect(call.name).toBe('turn_on_the_lights');
          expect(call.id).toBeTruthy();

          session.sendToolResponse({
            functionResponses: [
              {id: call.id, name: call.name, response: {result: 'ok'}},
            ],
          });
          // Both backends must accept the tool result and complete the turn, but
          // only the Gemini API returns assertable content: Vertex emits an empty
          // transcription.
          const followUp = await collector.nextTurn();
          if (!backend.isVertex) {
            expect(followUp.transcript.trim().length).toBeGreaterThan(0);
          }
        } catch (error) {
          if (isQuotaError(error)) {
            pending(
              `Resource exhausted (429). Skipping instead of failing: ${error}`,
            );
            return;
          }
          throw error;
        } finally {
          session.close();
        }
      },
      SPEC_TIMEOUT_MS,
    );

    // Gemini API only: this validation is guarded by `!apiClient.isVertexAI()`,
    // so Vertex accepts an id-less FunctionResponse.
    if (!backend.isVertex) {
      it(
        'rejects a function response without an id',
        async () => {
          const collector = new TurnCollector();
          const session = await connect(collector);
          try {
            expect(() =>
              session.sendToolResponse({
                functionResponses: [
                  {name: 'turn_on_the_lights', response: {result: 'ok'}},
                ],
              }),
            ).toThrowError(/must have an `id` field/);
          } finally {
            session.close();
          }
        },
        SPEC_TIMEOUT_MS,
      );
    }
  });
}
