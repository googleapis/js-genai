/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Compatibility shim for the legacy vertex+lyria response/event shape.
 *
 * The vertex `aiplatform.googleapis.com` endpoint returns a different schema for
 * `lyria-3-pro-preview, lyria-3-clip-preview` than the public `generativelanguage.googleapis.com` API:
 * - non-streaming responses use `outputs: Array<Content>` instead of the modern
 *   `steps: Array<Step>` (where Step is a discriminated union, here always
 *   `ModelOutputStep` with `content: Array<Content>`),
 * - streaming SSE events use `interaction.start`, `content.start/delta/stop`,
 *   `interaction.complete` instead of the modern `interaction.created`,
 *   `step.start/delta/stop`, `interaction.completed`.
 *
 * The shim is gated at the resource layer (`resources/interactions.ts`): when
 * `client.clientAdapter?.isVertexAI()` is true AND the requested model is in
 * `LEGACY_LYRIA_MODELS`, the resource activates the shim by wrapping the
 * non-streaming `APIPromise` with `_thenUnwrap(coerceLegacyInteractionResponse)`
 * or by passing `__streamClass: LegacyLyriaStream` for streaming requests.
 *
 * Mirrors `src/gemini_next_gen_api/_legacy_lyria.py` from the Python SDK.
 */

import { Stream } from '../core/streaming.js';
import type { BaseGeminiNextGenAPIClient } from '../client.js';

export const LEGACY_LYRIA_MODELS: ReadonlySet<string> = new Set([
  'lyria-3-pro-preview',
  'lyria-3-clip-preview',
]);

export const LEGACY_EVENT_TYPE_RENAMES: Readonly<Record<string, string>> = {
  'interaction.start': 'interaction.created',
  'content.start': 'step.start',
  'content.delta': 'step.delta',
  'content.stop': 'step.stop',
  'interaction.complete': 'interaction.completed',
};

export function isLegacyLyriaRequest({ isVertex, model }: { isVertex: boolean; model: unknown }): boolean {
  return Boolean(isVertex) && typeof model === 'string' && LEGACY_LYRIA_MODELS.has(model);
}

/**
 * Detect whether a client is in vertex mode. Reads the `clientAdapter` field
 * directly because `BaseGeminiNextGenAPIClient` keeps it `private`; centralizing
 * the runtime cast here avoids leaking it into resource files.
 */
export function isVertexClient(client: BaseGeminiNextGenAPIClient): boolean {
  const adapter = (client as unknown as { clientAdapter?: { isVertexAI: () => boolean } }).clientAdapter;
  return Boolean(adapter && adapter.isVertexAI());
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Wrap a legacy `outputs: Array<Content>` payload into the modern
 * `steps: [{type: 'model_output', content: outputs}]` shape. Returns the input
 * unchanged when `steps` already wins or `outputs` is absent.
 */
function wrapOutputsAsSteps(data: Record<string, unknown>): Record<string, unknown> {
  if (!('outputs' in data) || 'steps' in data) {
    return data;
  }
  const { outputs, ...rest } = data;
  return {
    ...rest,
    steps: [{ type: 'model_output', content: outputs }],
  };
}

/**
 * Non-streaming: rewrite a legacy interaction response so consumers see the
 * modern `steps` shape.
 */
export function coerceLegacyInteractionResponse(data: unknown): unknown {
  if (!isPlainObject(data)) return data;
  return wrapOutputsAsSteps(data);
}

/**
 * Streaming: translate one legacy SSE event to its modern equivalent.
 *
 * Returns the input unchanged when the `event_type` is not one of the legacy
 * ones we know how to map. Two non-trivial cases:
 *   1. `content.start` carries `content: <Content>` — the modern `step.start`
 *      expects `step: {type: 'model_output', content: [<Content>]}`.
 *   2. `interaction.start` / `interaction.complete` wrap an `interaction`
 *      object that may itself carry the legacy `outputs` field; recurse.
 */
export function maybeRemapLegacyStreamEvent(data: unknown): unknown {
  if (!isPlainObject(data)) return data;

  const eventType = data['event_type'];
  if (typeof eventType !== 'string' || !(eventType in LEGACY_EVENT_TYPE_RENAMES)) {
    return data;
  }

  const renamed: Record<string, unknown> = {
    ...data,
    event_type: LEGACY_EVENT_TYPE_RENAMES[eventType]!,
  };

  if (eventType === 'content.start') {
    const { content, ...rest } = renamed;
    let stepContent: unknown[];
    if (content == null) {
      stepContent = [];
    } else if (Array.isArray(content)) {
      stepContent = content;
    } else {
      stepContent = [content];
    }
    return {
      ...rest,
      step: { type: 'model_output', content: stepContent },
    };
  }

  if (eventType === 'interaction.start' || eventType === 'interaction.complete') {
    const inner = renamed['interaction'];
    if (isPlainObject(inner)) {
      renamed['interaction'] = wrapOutputsAsSteps(inner);
    }
  }

  return renamed;
}

/**
 * The transform we apply (`maybeRemapLegacyStreamEvent`) only inspects
 * `event_type` — anything stricter would tie the runtime to one specific item
 * type. Constraining `Item` to the dict-of-event-type shape is enough to
 * prevent the historical `Item = string` foot-gun while staying compatible
 * with the modern `InteractionSSEEvent` discriminated union.
 */
type LegacyStreamItem = { event_type?: string } & Record<string, unknown>;

/**
 * Stream subclass that runs each yielded SSE event through
 * `maybeRemapLegacyStreamEvent` so consumers always see modern event shapes.
 *
 * Wired in via the `__streamClass` request option from `resources/interactions.ts`
 * (read by `src/internal/parse.ts:defaultParseResponse`).
 */
export class LegacyLyriaStream<Item> extends Stream<Item> {
  static override fromSSEResponse<Item>(
    response: Response,
    controller: AbortController,
    client?: BaseGeminiNextGenAPIClient,
  ): LegacyLyriaStream<Item> {
    const base = Stream.fromSSEResponse<Item>(response, controller, client);
    async function* wrappedIterator(): AsyncIterator<Item, void, undefined> {
      for await (const item of base) {
        yield maybeRemapLegacyStreamEvent(item) as Item;
      }
    }
    return new LegacyLyriaStream<Item>(wrappedIterator, controller, client);
  }
}
