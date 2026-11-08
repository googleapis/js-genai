/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unit tests for Interactions automatic continuation behaviors that are not
 * covered by the cross-language conformance cases
 * (interactions_continuation_conformance_test.ts): the whole-call timeout
 * (checked with a fake clock), the SDK-only `automatic_continuation` option
 * staying off the wire, early termination of a continued stream, and the
 * package-root export of `ContinuationInterruptedError`.
 */

import {
  CallDeadline,
  ContinuationTimeoutError,
  mergeUsages,
  resetIncompleteContinuationWarningForTesting,
} from '../../src/_interactions_continuation.js';
import {GoogleGenAI} from '../../src/client.js';
import {ContinuationInterruptedError} from '../../src/errors.js';
import {
  GoogleGenAIInteraction,
  GoogleGenAIRequestOptions,
} from '../../src/gaos/google-genai.js';
import {Interactions} from '../../src/gaos/resources.js';
import * as root from '../../src/index.js';
import * as types from '../../src/types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

const NO_RETRIES: GoogleGenAIRequestOptions = {retries: {strategy: 'none'}};

function textStep(text: string): Json {
  return {type: 'model_output', content: [{type: 'text', text}]};
}

function interaction(
  id: string,
  status: string,
  text: string,
  token?: string,
  outputTokens?: number,
): Json {
  return {
    id,
    status,
    steps: [textStep(text)],
    ...(token ? {continuation_token: token} : {}),
    ...(outputTokens !== undefined
      ? {usage: {total_output_tokens: outputTokens}}
      : {}),
  };
}

function created(id: string): Json {
  return {
    event_type: 'interaction.created',
    interaction: {id, status: 'in_progress'},
  };
}

function delta(text: string): Json {
  return {event_type: 'step.delta', index: 0, delta: {type: 'text', text}};
}

function completed(id: string, status: string, token?: string): Json {
  return {
    event_type: 'interaction.completed',
    interaction: {id, status, ...(token ? {continuation_token: token} : {})},
  };
}

type Hop = {json: Json} | {events: Json[]};

/** Answers each fetch call with the next scripted hop. */
class FakeServer {
  readonly bodies: Array<Record<string, Json>> = [];
  /** Called on every request, e.g. to advance a fake clock. */
  onRequest: () => void = () => {};

  constructor(private readonly hops: Hop[]) {}

  readonly fetch: types.Fetch = async (input, init) => {
    const raw =
      typeof Request !== 'undefined' && input instanceof Request
        ? await input.clone().text()
        : String(init?.body ?? '{}');
    this.bodies.push(JSON.parse(raw) as Record<string, Json>);
    this.onRequest();
    const hop = this.hops[this.bodies.length - 1];
    if (!hop) {
      throw new Error(`Unexpected request #${this.bodies.length}`);
    }
    if ('json' in hop) {
      return new Response(JSON.stringify(hop.json), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      });
    }
    const encoder = new TextEncoder();
    const chunks = hop.events.map(
      (e) => `event: ${e.event_type}\ndata: ${JSON.stringify(e)}\n\n`,
    );
    let i = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull: (controller) => {
        if (i < chunks.length) {
          controller.enqueue(encoder.encode(chunks[i++]));
        } else {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      status: 200,
      headers: {'Content-Type': 'text/event-stream'},
    });
  };
}

function makeClient(server: FakeServer): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: 'test-key',
    httpOptions: {fetch: server.fetch},
  });
}

describe('Interactions automatic continuation', () => {
  beforeEach(() => {
    resetIncompleteContinuationWarningForTesting();
    spyOn(console, 'warn');
  });

  describe('CallDeadline', () => {
    it('bounds a numeric timeout only', () => {
      let now = 1000;
      const clock = () => now;
      const deadline = new CallDeadline(10_000, {now: clock});
      expect(deadline.bounded).toBeTrue();
      expect(deadline.hopTimeoutMs()).toBe(10_000);
      now += 4_000;
      expect(deadline.remainingMs()).toBe(6_000);
      expect(deadline.hopTimeoutMs()).toBe(6_000);
      expect(deadline.expired()).toBeFalse();
      expect(() => deadline.check()).not.toThrow();
      now += 7_000;
      expect(deadline.expired()).toBeTrue();
      expect(deadline.hopTimeoutMs()).toBe(1);
      expect(() => deadline.check()).toThrowError(ContinuationTimeoutError);

      // No timeout, or a disabled deadline (opt-out / background / agent
      // calls), never expires and passes the timeout through unchanged.
      const unbounded = new CallDeadline(undefined, {now: clock});
      const disabled = new CallDeadline(60_000, {enabled: false, now: clock});
      now += 1_000_000_000;
      for (const d of [unbounded, disabled]) {
        expect(d.bounded).toBeFalse();
        expect(d.remainingMs()).toBeUndefined();
        expect(d.expired()).toBeFalse();
        expect(() => d.check()).not.toThrow();
      }
      expect(unbounded.hopTimeoutMs()).toBeUndefined();
      expect(disabled.hopTimeoutMs()).toBe(60_000);
    });
  });

  describe('whole-call timeout', () => {
    let now: number;

    beforeEach(() => {
      now = 1_000_000;
      spyOn(Date, 'now').and.callFake(() => now);
    });

    it('unary: completes within the budget across hops', async () => {
      const server = new FakeServer([
        {json: interaction('i1', 'requires_continuation', 'A', 't1')},
        {json: interaction('i2', 'requires_continuation', 'B', 't2')},
        {json: interaction('i3', 'completed', 'C')},
      ]);
      server.onRequest = () => {
        now += 10_000; // each hop takes 10s
      };
      const res = (await makeClient(server).interactions.create(
        {model: 'gemini-2.5-pro', input: 'Hello'},
        {...NO_RETRIES, timeout_ms: 60_000},
      )) as GoogleGenAIInteraction;
      expect(res.status).toBe('completed');
      expect(res.output_text).toBe('ABC');
      expect(res.continuation_ids).toEqual(['i1', 'i2', 'i3']);
      expect(server.bodies.length).toBe(3);
    });

    it('unary: expiry throws ContinuationInterruptedError with the partial result', async () => {
      const server = new FakeServer([
        {json: interaction('i1', 'requires_continuation', 'A', 't1', 40)},
        {json: interaction('i2', 'requires_continuation', 'B', 't2', 30)},
        {json: interaction('i3', 'completed', 'C')},
      ]);
      server.onRequest = () => {
        now += 10_000;
      };
      let error: unknown;
      try {
        await makeClient(server).interactions.create(
          {model: 'gemini-2.5-pro', input: 'Hello'},
          {...NO_RETRIES, timeout_ms: 15_000},
        );
      } catch (e) {
        error = e;
      }
      // Hop 1 (10s) left 5s for hop 2, which used it up; hop 3 never started.
      expect(server.bodies.length).toBe(2);
      expect(error).toBeInstanceOf(ContinuationInterruptedError);
      const err = error as ContinuationInterruptedError;
      expect(err.cause).toBeInstanceOf(ContinuationTimeoutError);
      expect(err.continuationToken).toBe('t2');
      expect(err.interactionId).toBe('i2');
      expect(err.continuationIds).toEqual(['i1', 'i2']);
      const partial = err.partialInteraction as GoogleGenAIInteraction;
      expect(partial.status).toBe('requires_continuation');
      expect(partial.output_text).toBe('AB');
      expect(partial.usage?.total_output_tokens).toBe(70);
    });

    it('unary: store=false leaves interactionId undefined on ContinuationInterruptedError', async () => {
      const server = new FakeServer([
        {json: interaction('i1', 'requires_continuation', 'A', 't1')},
        {json: interaction('i2', 'completed', 'B')},
      ]);
      server.onRequest = () => {
        now += 10_000;
      };
      let error: unknown;
      try {
        await makeClient(server).interactions.create(
          {model: 'gemini-2.5-pro', input: 'Hello', store: false},
          {...NO_RETRIES, timeout_ms: 5_000},
        );
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(ContinuationInterruptedError);
      const err = error as ContinuationInterruptedError;
      expect(err.continuationToken).toBe('t1');
      expect(err.interactionId).toBeUndefined();
      expect(err.continuationIds).toEqual(['i1']);
    });

    it('unary: a legacy `timeout` option is the same whole-call budget', async () => {
      const server = new FakeServer([
        {json: interaction('i1', 'requires_continuation', 'A', 't1')},
        {json: interaction('i2', 'completed', 'B')},
      ]);
      server.onRequest = () => {
        now += 10_000;
      };
      await expectAsync(
        makeClient(server).interactions.create(
          {model: 'gemini-2.5-pro', input: 'Hello'},
          {...NO_RETRIES, timeout: 5_000},
        ),
      ).toBeRejectedWithError(ContinuationInterruptedError);
      expect(server.bodies.length).toBe(1);
    });

    it('unary: the timeout is per request when automatic continuation is off', async () => {
      const server = new FakeServer([
        {json: interaction('i1', 'requires_continuation', 'A', 't1')},
      ]);
      server.onRequest = () => {
        now += 10_000;
      };
      const res = (await makeClient(server).interactions.create(
        {
          model: 'gemini-2.5-pro',
          input: 'Hello',
          automatic_continuation: false,
        },
        {...NO_RETRIES, timeout_ms: 5_000},
      )) as GoogleGenAIInteraction;
      expect(res.status).toBe('requires_continuation');
      expect(res.continuation_token).toBe('t1');
    });

    it('stream: expiry between hops throws ContinuationInterruptedError', async () => {
      const server = new FakeServer([
        {
          events: [
            created('i1'),
            delta('Part 1 '),
            completed('i1', 'requires_continuation', 't1'),
          ],
        },
        {
          events: [
            created('i2'),
            delta('Part 2'),
            completed('i2', 'completed'),
          ],
        },
      ]);
      const stream = await makeClient(server).interactions.create(
        {model: 'gemini-2.5-pro', input: 'Hello', stream: true},
        {...NO_RETRIES, timeout_ms: 15_000},
      );
      const received: string[] = [];
      let error: unknown;
      try {
        for await (const event of stream) {
          received.push(event.event_type);
          if (event.event_type === 'interaction.completed') {
            now += 20_000; // hop 1 outlived the 15s budget
          }
        }
      } catch (e) {
        error = e;
      }
      // Hop 1's events were all yielded; hop 2 never started.
      expect(received).toEqual([
        'interaction.created',
        'step.delta',
        'interaction.completed',
      ]);
      expect(server.bodies.length).toBe(1);
      expect(error).toBeInstanceOf(ContinuationInterruptedError);
      const err = error as ContinuationInterruptedError;
      expect(err.cause).toBeInstanceOf(ContinuationTimeoutError);
      expect(err.continuationToken).toBe('t1');
      expect(err.interactionId).toBe('i1');
      expect(err.continuationIds).toEqual(['i1']);
      expect(err.partialInteraction).toBeUndefined();
    });

    it('stream: store=false leaves interactionId undefined on ContinuationInterruptedError', async () => {
      const server = new FakeServer([
        {
          events: [
            created('i1'),
            delta('Part 1 '),
            completed('i1', 'requires_continuation', 't1'),
          ],
        },
        {
          events: [
            created('i2'),
            delta('Part 2'),
            completed('i2', 'completed'),
          ],
        },
      ]);
      const stream = await makeClient(server).interactions.create(
        {model: 'gemini-2.5-pro', input: 'Hello', stream: true, store: false},
        {...NO_RETRIES, timeout_ms: 15_000},
      );
      let error: unknown;
      try {
        for await (const event of stream) {
          if (event.event_type === 'interaction.completed') {
            now += 20_000;
          }
        }
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(ContinuationInterruptedError);
      const err = error as ContinuationInterruptedError;
      expect(err.cause).toBeInstanceOf(ContinuationTimeoutError);
      expect(err.continuationToken).toBe('t1');
      expect(err.interactionId).toBeUndefined();
      expect(err.continuationIds).toEqual(['i1']);
      expect(err.partialInteraction).toBeUndefined();
    });

    it('stream: expiry mid-hop stops before the next event, resumable from the last token', async () => {
      const server = new FakeServer([
        {
          events: [
            created('i1'),
            delta('Part 1 '),
            completed('i1', 'requires_continuation', 't1'),
          ],
        },
        {
          events: [
            created('i2'),
            delta('Part 2a '),
            delta('Part 2b '),
            completed('i2', 'completed'),
          ],
        },
      ]);
      const stream = await makeClient(server).interactions.create(
        {model: 'gemini-2.5-pro', input: 'Hello', stream: true},
        {...NO_RETRIES, timeout_ms: 60_000},
      );
      const received: string[] = [];
      let error: unknown;
      try {
        for await (const event of stream) {
          received.push(
            event.event_type === 'step.delta'
              ? (event.delta as Json).text
              : event.event_type,
          );
          if (received[received.length - 1] === 'Part 2a ') {
            now += 100_000; // the deadline passes while handling this event
          }
        }
      } catch (e) {
        error = e;
      }
      expect(received).toEqual([
        'interaction.created',
        'Part 1 ',
        'interaction.completed',
        'interaction.created',
        'Part 2a ',
      ]);
      expect(server.bodies.length).toBe(2);
      expect(error).toBeInstanceOf(ContinuationInterruptedError);
      const err = error as ContinuationInterruptedError;
      expect(err.cause).toBeInstanceOf(ContinuationTimeoutError);
      // Hop 2 produced output after hop 1's token, so resuming from t1
      // re-generates "Part 2a " (documented on ContinuationInterruptedError).
      expect(err.continuationToken).toBe('t1');
      expect(err.interactionId).toBe('i1');
      expect(err.continuationIds).toEqual(['i1', 'i2']);
    });
  });

  describe('request shaping', () => {
    it('leaves generation_config unset by default across hops', async () => {
      const server = new FakeServer([
        {json: interaction('i1', 'requires_continuation', 'A', 't1')},
        {json: interaction('i2', 'completed', 'B')},
      ]);
      const res = (await makeClient(server).interactions.create(
        {model: 'gemini-2.5-pro', input: 'Hello'},
        NO_RETRIES,
      )) as GoogleGenAIInteraction;
      expect(res.output_text).toBe('AB');
      expect(server.bodies.length).toBe(2);
      for (const body of server.bodies) {
        expect('generation_config' in body).toBeFalse();
      }
    });

    it('keeps automatic_continuation off the wire and passes request options to every hop', async () => {
      const server = new FakeServer([
        {json: interaction('i1', 'requires_continuation', 'A', 't1')},
        {json: interaction('i2', 'completed', 'B')},
      ]);
      const res = (await makeClient(server).interactions.create(
        {
          model: 'gemini-2.5-pro',
          input: 'Hello',
          automatic_continuation: true,
          generation_config: {seed: 7},
        },
        {...NO_RETRIES, extra_body: {labels: {run: 'x'}}},
      )) as GoogleGenAIInteraction;
      expect(res.output_text).toBe('AB');
      expect(server.bodies.length).toBe(2);
      for (const body of server.bodies) {
        expect('automatic_continuation' in body).toBeFalse();
        expect(body['generation_config']).toEqual({seed: 7});
        expect(body['labels']).toEqual({run: 'x'});
      }
      expect(server.bodies[1]['previous_interaction_id']).toBe('i1');
      expect('input' in server.bodies[1]).toBeFalse();
    });

    it("does not mutate the caller's params or generation_config", async () => {
      const server = new FakeServer([
        {json: interaction('i1', 'requires_continuation', 'A', 't1')},
        {json: interaction('i2', 'completed', 'B')},
      ]);
      const generationConfig: Interactions.GenerationConfig = {seed: 7};
      const params = {
        model: 'gemini-2.5-pro',
        input: 'Hello',
        generation_config: generationConfig,
      };
      await makeClient(server).interactions.create(params, NO_RETRIES);
      expect(params).toEqual({
        model: 'gemini-2.5-pro',
        input: 'Hello',
        generation_config: {seed: 7},
      });
      expect(generationConfig).toEqual({seed: 7});
      expect(server.bodies.length).toBe(2);
      for (const body of server.bodies) {
        expect(body['generation_config']).toEqual({seed: 7});
      }
    });
  });

  describe('stream termination', () => {
    it('does not open the next hop when the caller stops iterating', async () => {
      const server = new FakeServer([
        {
          events: [
            created('i1'),
            delta('A'),
            completed('i1', 'requires_continuation', 't1'),
          ],
        },
        {events: [created('i2'), delta('B'), completed('i2', 'completed')]},
      ]);
      const stream = await makeClient(server).interactions.create(
        {model: 'gemini-2.5-pro', input: 'Hello', stream: true},
        NO_RETRIES,
      );
      const received: string[] = [];
      for await (const event of stream) {
        received.push(event.event_type);
        if (event.event_type === 'interaction.completed') {
          break;
        }
      }
      // Give any stray hop-2 request a chance to show up.
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(received).toEqual([
        'interaction.created',
        'step.delta',
        'interaction.completed',
      ]);
      expect(server.bodies.length).toBe(1);
    });

    it('can be cancelled through the stream API', async () => {
      const server = new FakeServer([
        {
          events: [
            created('i1'),
            delta('A'),
            completed('i1', 'requires_continuation', 't1'),
          ],
        },
        {events: [created('i2'), delta('B'), completed('i2', 'completed')]},
      ]);
      const stream = await makeClient(server).interactions.create(
        {model: 'gemini-2.5-pro', input: 'Hello', stream: true},
        NO_RETRIES,
      );
      const reader = stream.getReader();
      expect((await reader.read()).value?.event_type).toBe(
        'interaction.created',
      );
      await reader.cancel();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(server.bodies.length).toBe(1);
    });
  });

  describe('opt-out warning', () => {
    it('warns once when an uncontinued unary call stops at requires_continuation', async () => {
      const server = new FakeServer([
        {json: interaction('i1', 'requires_continuation', 'A', 't1')},
        {json: interaction('i2', 'requires_continuation', 'B', 't2')},
      ]);
      const client = makeClient(server);
      const params = {
        model: 'gemini-2.5-pro',
        input: 'Hello',
        automatic_continuation: false,
      };
      await client.interactions.create(params, NO_RETRIES);
      await client.interactions.create(params, NO_RETRIES);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect((console.warn as jasmine.Spy).calls.argsFor(0)[0]).toContain(
        "status='requires_continuation'",
      );
    });

    it('warns once when an uncontinued stream stops at requires_continuation', async () => {
      const server = new FakeServer([
        {
          events: [
            created('i1'),
            delta('A'),
            completed('i1', 'requires_continuation', 't1'),
          ],
        },
      ]);
      const stream = await makeClient(server).interactions.create(
        {
          model: 'gemini-2.5-pro',
          input: 'Hello',
          stream: true,
          automatic_continuation: false,
        },
        NO_RETRIES,
      );
      const received: string[] = [];
      for await (const event of stream) {
        received.push(event.event_type);
      }
      expect(received.length).toBe(3);
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it('does not warn when the caller resumes with its own token', async () => {
      const server = new FakeServer([
        {json: interaction('i1', 'requires_continuation', 'A', 't1')},
      ]);
      await makeClient(server).interactions.create(
        {
          model: 'gemini-2.5-pro',
          input: 'Hello',
          automatic_continuation: false,
          continuation_token: 't0',
        },
        NO_RETRIES,
      );
      expect(console.warn).not.toHaveBeenCalled();
      expect(server.bodies[0]['continuation_token']).toBe('t0');
    });
  });

  describe('mergeUsages', () => {
    it('retains Hop 1 initial_input_tokens and sums total tokens across hops', () => {
      const merged = mergeUsages([
        {
          total_input_tokens: 10,
          total_output_tokens: 20,
          initial_input_tokens: 10,
        },
        {
          total_input_tokens: 5,
          total_output_tokens: 30,
          initial_input_tokens: 5,
        },
      ]);
      expect(merged).toEqual({
        total_input_tokens: 15,
        total_output_tokens: 50,
        initial_input_tokens: 10,
      });
    });

    it('falls back to Hop 1 total_input_tokens when initial_input_tokens is not present on Hop 1', () => {
      const merged = mergeUsages([
        {total_input_tokens: 10, total_output_tokens: 20},
        {
          total_input_tokens: 5,
          total_output_tokens: 30,
          initial_input_tokens: 5,
        },
      ]);
      expect(merged).toEqual({
        total_input_tokens: 15,
        total_output_tokens: 50,
        initial_input_tokens: 10,
      });
    });

    it('does not leak Hop N initial_input_tokens when Hop 1 populates neither initial nor total input tokens', () => {
      const merged = mergeUsages([
        {total_output_tokens: 20},
        {total_output_tokens: 30, initial_input_tokens: 5},
      ]);
      expect(merged).toEqual({
        total_output_tokens: 50,
      });
      expect(merged?.['initial_input_tokens']).toBeUndefined();
    });
  });

  describe('exports', () => {
    it('exposes ContinuationInterruptedError from the package root', () => {
      expect(root.ContinuationInterruptedError).toBe(
        ContinuationInterruptedError,
      );
      const err = new root.ContinuationInterruptedError({
        message: 'm',
        cause: new Error('c'),
        continuationToken: 't',
        interactionId: 'i',
        continuationIds: ['i'],
      });
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('ContinuationInterruptedError');
      expect((err.cause as Error).message).toBe('c');
    });
  });
});
