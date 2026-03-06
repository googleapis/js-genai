/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI, type Interactions} from '@google/genai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {type z} from 'zod';

function invariant(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || 'Invariant failed');
  }
}

const SKIP_HTTP = process.env.SKIP_HTTP === 'true';

const BENCHMARK_MODEL = 'gemini-3-pro-image-preview';
const MOCK_FILE = path.join(
  process.cwd(),
  `interaction_recording_${BENCHMARK_MODEL}.bin`,
);

const MODE = (process.env.MODE || 'live') as 'live' | 'record' | 'mock';

if (MODE === 'mock') {
  if (!fs.existsSync(MOCK_FILE)) {
    console.error(
      `Mock file ${MOCK_FILE} not found. Run with MODE=record first.`,
    );
    process.exit(1);
  }
  const mockedData = fs.readFileSync(MOCK_FILE);
  const mockedChunks: Uint8Array[] = [];
  let offset = 0;
  while (offset < mockedData.length) {
    const length = mockedData.readUInt32LE(offset);
    offset += 4;
    mockedChunks.push(
      new Uint8Array(mockedData.subarray(offset, offset + length)),
    );
    offset += length;
  }

  const originalFetch = globalThis.fetch;
  (globalThis as any).fetch = async (url: string | URL, init?: RequestInit) => {
    if (url.toString().includes('/interactions')) {
      const stream = new ReadableStream({
        async start(controller) {
          for (const chunk of mockedChunks) {
            controller.enqueue(chunk);
            await Promise.resolve();
          }
          controller.close();
        },
      });
      return new Response(stream, {
        status: 200,
        headers: {'content-type': 'text/event-stream'},
      });
    }
    return originalFetch(url, init);
  };
} else if (MODE === 'record') {
  const originalFetch = globalThis.fetch;
  (globalThis as any).fetch = async (url: string | URL, init?: RequestInit) => {
    const response = await originalFetch(url, init);
    if (
      url.toString().includes('/interactions') &&
      response.ok &&
      response.body
    ) {
      if (fs.existsSync(MOCK_FILE)) fs.unlinkSync(MOCK_FILE);
      const reader = response.body.getReader();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            let chunkCount = 0;
            const buffers: Buffer[] = [];
            while (true) {
              const {done, value} = await reader.read();
              if (done) {
                fs.writeFileSync(MOCK_FILE, Buffer.concat(buffers));
                console.log(
                  `\n[RECORD] Saved ${chunkCount} chunks to ${MOCK_FILE}`,
                );
                controller.close();
                break;
              }
              chunkCount++;
              const lengthBuf = Buffer.alloc(4);
              lengthBuf.writeUInt32LE(value.length);
              buffers.push(lengthBuf);
              buffers.push(Buffer.from(value));
              controller.enqueue(value);
            }
          } catch (e) {
            controller.error(e);
          }
        },
      });
      return new Response(stream, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }
    return response;
  };
}

let client: GoogleGenAI;

export type GeminiTextModel = 'gemini-3-pro-preview' | 'gemini-3-flash-preview';
export type GeminiImageModel = 'gemini-3-pro-image-preview';
export type GeminiThinkingLevel = 'minimal' | 'low' | 'medium' | 'high';
export type GeminiResolution = '1K' | '2K' | '4K';
export type GeminiAspectRatio =
  | '1:1'
  | '2:3'
  | '3:2'
  | '3:4'
  | '4:3'
  | '4:5'
  | '5:4'
  | '9:16'
  | '16:9'
  | '21:9';

type GeminiAskTextArgs<TSchema extends z.ZodSchema> = {
  interactionId?: string;
  model: GeminiTextModel;
  thinkingLevel: GeminiThinkingLevel;
  instructions?: string;
  input: string;
  attachments?: Array<Blob | string>;
  schema: TSchema;
  onThought?: (progress: {title: string; summary: string}) => void;
  transport?: 'sdk' | 'http';
};

type GeminiAskImageArgs = {
  interactionId?: string;
  model: GeminiImageModel;
  instructions?: string;
  input: string;
  attachments?: Array<Blob | string>;
  aspectRatio: GeminiAspectRatio;
  resolution: GeminiResolution;
  onThought?: (progress: {title: string; summary: string}) => void;
  transport?: 'sdk' | 'http';
};

type GeminiAskResult<TData> = {
  interactionId: string;
  data: TData;
  totalMs: number;
};

const iterateLines = async function* (
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      chunks.push(value);
      totalSize += value.length;
    }
    const finalBuffer = new Uint8Array(totalSize);
    let offset = 0;
    for (const c of chunks) {
      finalBuffer.set(c, offset);
      offset += c.length;
    }
    const text = new TextDecoder().decode(finalBuffer);
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      yield line;
    }
  } finally {
    reader.releaseLock();
  }
};

const parseSSEStream = async function* (
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<Interactions.InteractionSSEEvent> {
  const dataLines: string[] = [];
  for await (const line of iterateLines(stream)) {
    if (!line.length) {
      if (!dataLines.length) continue;
      const data = dataLines.join('\n');
      dataLines.length = 0;
      if (data.startsWith('[DONE]')) continue;
      yield JSON.parse(data) as Interactions.InteractionSSEEvent;
      continue;
    }
    if (line.startsWith(':')) continue;
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) continue;
    if (line.slice(0, separatorIndex) !== 'data') continue;
    const value = line.slice(separatorIndex + 1);
    dataLines.push(value.startsWith(' ') ? value.slice(1) : value);
  }
};

export class Gemini {
  static async ask<TSchema extends z.ZodSchema>(
    args: GeminiAskTextArgs<TSchema>,
  ): Promise<GeminiAskResult<z.infer<TSchema>>>;
  static async ask(args: GeminiAskImageArgs): Promise<GeminiAskResult<Blob>>;
  static async ask<TSchema extends z.ZodSchema>(
    args: GeminiAskTextArgs<TSchema> | GeminiAskImageArgs,
  ): Promise<GeminiAskResult<z.infer<TSchema> | Blob>> {
    const transport = args.transport ?? (Math.random() < 0.5 ? 'sdk' : 'http');
    const requestTimestamp = Date.now();

    const requestBody: any = {
      stream: true,
      model: args.model,
      input: [{type: 'text', text: args.input}],
      response_modalities: ['image'],
      generation_config: {
        image_config: {
          aspect_ratio: (args as any).aspectRatio || '1:1',
          image_size: (args as any).resolution || '1K',
        },
      },
    };
    if (args.instructions) requestBody.system_instruction = args.instructions;
    if (args.interactionId)
      requestBody.previous_interaction_id = args.interactionId;

    const stream = await (async () => {
      if (transport === 'sdk') {
        return await client.interactions.create(requestBody);
      } else {
        if (SKIP_HTTP) {
          throw new Error('HTTP transport skipped');
        }
        const apiKey =
          process.env.GCLOUD_API_KEY ||
          process.env.GOOGLE_API_KEY ||
          process.env.GEMINI_API_KEY ||
          '';
        const url = new URL(
          'https://generativelanguage.googleapis.com/v1beta/interactions',
        );
        url.searchParams.set('alt', 'sse');

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'x-goog-api-key': apiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status} ${await response.text()}`,
          );
        }
        invariant(response.body, 'Missing interaction stream');
        return parseSSEStream(response.body);
      }
    })();

    let text = '';
    let imageDataChunks: string[] = [];
    let imageMimeType = '';
    let interactionId = '';
    let chunks = 0;

    for await (const chunk of stream) {
      chunks += 1;
      if (chunk.event_type === 'error') {
        throw new Error(
          `Server returned error event: ${JSON.stringify((chunk as any).error || chunk)}`,
        );
      }
      if (chunk.event_type === 'interaction.start')
        interactionId = chunk.interaction?.id || '';
      if (chunk.event_type === 'content.delta') {
        if (chunk.delta?.type === 'text') text += chunk.delta.text ?? '';
        else if (chunk.delta?.type === 'image') {
          if (chunk.delta.mime_type) imageMimeType = chunk.delta.mime_type;
          if (chunk.delta.data) imageDataChunks.push(chunk.delta.data);
        }
      }
    }

    const totalMs = Date.now() - requestTimestamp;
    console.log(
      `✨ Gemini • ${transport.toUpperCase()} • ${chunks} chunks • ${totalMs}ms`,
    );

    if (args.model.includes('image')) {
      if (imageDataChunks.length === 0) {
        throw new Error(`Missing image data.`);
      }
      return {
        interactionId,
        data: new Blob([Buffer.from(imageDataChunks.join(''), 'base64')], {
          type: imageMimeType,
        }),
        totalMs,
      };
    }
    return {
      interactionId,
      data: (args as any).schema.parse(JSON.parse(text)),
      totalMs,
    };
  }
}

async function main() {
  delete process.env.GOOGLE_GEMINI_BASE_URL;
  const apiKey =
    process.env.GCLOUD_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    '';
  if (!apiKey) {
    console.error('ERROR: GCLOUD_API_KEY environment variable is required.');
    process.exit(1);
  }
  client = new GoogleGenAI({apiKey});

  let benchmarkArgs = {
    model: BENCHMARK_MODEL,
    input: 'A beautiful sunset over the mountains',
    aspectRatio: '1:1',
    resolution: '2K',
  };
  console.log(`Running benchmark (${benchmarkArgs.resolution} resolution)...`);
  const results: {transport: string; totalMs: number}[] = [];

  for (let i = 0; i < 3; i++) {
    process.stdout.write(`Run ${i + 1}/3 (SDK): `);
    try {
      const sdkResult = await Gemini.ask({
        transport: 'sdk',
        ...(benchmarkArgs as any),
      });
      results.push({transport: 'sdk', totalMs: sdkResult.totalMs});
    } catch (e: any) {
      console.log(`FAILED: ${e.message}`);
    }

    if (!SKIP_HTTP) {
      process.stdout.write(`Run ${i + 1}/3 (HTTP): `);
      try {
        const httpResult = await Gemini.ask({
          transport: 'http',
          ...(benchmarkArgs as any),
        });
        results.push({transport: 'http', totalMs: httpResult.totalMs});
      } catch (e: any) {
        console.log(`FAILED: ${e.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`BENCHMARK SUMMARY (${benchmarkArgs.resolution} Images)`);
  console.log('='.repeat(60));

  ['sdk', 'http'].forEach((transport) => {
    const times = results
      .filter((r) => r.transport === transport)
      .map((r) => r.totalMs);
    if (times.length > 0) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(
        `${transport.toUpperCase()}: Avg: ${avg.toFixed(0)}ms, Min: ${Math.min(...times)}ms, Max: ${Math.max(...times)}ms (${times.length} successes)`,
      );
    } else {
      console.log(`${transport.toUpperCase()}: No successful runs.`);
    }
  });
  console.log('='.repeat(60));
}

main().catch(console.error);
