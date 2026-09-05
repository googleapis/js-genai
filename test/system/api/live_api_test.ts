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

/**
 * The only live model family currently served on the Gemini API. It is
 * audio-native and rejects a TEXT response modality, so these tests request
 * AUDIO and enable output transcription for an assertable text signal.
 */
const LIVE_MODEL = 'gemini-3.1-flash-live-preview';

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

function liveConfig(overrides: Record<string, unknown> = {}) {
  return {
    responseModalities: [Modality.AUDIO],
    outputAudioTranscription: {},
    ...overrides,
  };
}

describe('live module (API mode)', () => {
  let ai: GoogleGenAI;

  beforeEach(() => {
    ai = new GoogleGenAI({apiKey: process.env['GOOGLE_API_KEY']});
  });

  async function connect(
    collector: TurnCollector,
    config: Record<string, unknown> = liveConfig(),
    model: string = LIVE_MODEL,
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
        const followUp = await collector.nextTurn();
        expect(followUp.transcript.trim().length).toBeGreaterThan(0);
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
});
