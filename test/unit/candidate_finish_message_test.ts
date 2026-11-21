/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI} from '../../src/client.js';

const FINISH_MESSAGE = 'The model reached a natural stopping point.';

function responseBody(finishMessage?: string) {
  return {
    candidates: [
      {
        content: {role: 'model', parts: [{text: 'Hi'}]},
        finishReason: 'STOP',
        ...(finishMessage !== undefined ? {finishMessage} : {}),
        index: 0,
      },
    ],
  };
}

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {'Content-Type': 'application/json'},
  });
}

function sseResponse(body: unknown): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(body)}\n\n`));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {'Content-Type': 'text/event-stream'},
  });
}

describe('Candidate.finishMessage', () => {
  let originalGeminiBaseUrl: string | undefined;
  let originalVertexBaseUrl: string | undefined;

  beforeEach(() => {
    originalGeminiBaseUrl = process.env['GOOGLE_GEMINI_BASE_URL'];
    originalVertexBaseUrl = process.env['GOOGLE_VERTEX_BASE_URL'];
    delete process.env['GOOGLE_GEMINI_BASE_URL'];
    delete process.env['GOOGLE_VERTEX_BASE_URL'];
  });

  afterEach(() => {
    if (originalGeminiBaseUrl !== undefined) {
      process.env['GOOGLE_GEMINI_BASE_URL'] = originalGeminiBaseUrl;
    } else {
      delete process.env['GOOGLE_GEMINI_BASE_URL'];
    }
    if (originalVertexBaseUrl !== undefined) {
      process.env['GOOGLE_VERTEX_BASE_URL'] = originalVertexBaseUrl;
    } else {
      delete process.env['GOOGLE_VERTEX_BASE_URL'];
    }
  });

  // The Gemini Developer API converter must copy finishMessage to the candidate.
  it('generateContent keeps finishMessage from the Gemini Developer API', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    spyOn(global, 'fetch').and.resolveTo(
      okResponse(responseBody(FINISH_MESSAGE)),
    );

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hi',
    });

    expect(response.candidates?.[0]?.finishMessage).toBe(FINISH_MESSAGE);
  });

  // Streamed chunks go through the same converter and must keep the field.
  it('generateContentStream keeps finishMessage from the Gemini Developer API', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    spyOn(global, 'fetch').and.resolveTo(
      sseResponse(responseBody(FINISH_MESSAGE)),
    );

    const stream = await client.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: 'Hi',
    });
    let lastFinishMessage: string | undefined;
    let chunkCount = 0;
    for await (const chunk of stream) {
      chunkCount++;
      lastFinishMessage = chunk.candidates?.[0]?.finishMessage;
    }

    expect(chunkCount).toBe(1);
    expect(lastFinishMessage).toBe(FINISH_MESSAGE);
  });

  // The converter must not invent a value when the API omits the field.
  it('generateContent leaves finishMessage undefined when the API omits it', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    spyOn(global, 'fetch').and.resolveTo(okResponse(responseBody()));

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hi',
    });

    expect(response.candidates?.[0]?.finishMessage).toBeUndefined();
  });

  // Guards the Vertex AI path, which already kept the field.
  it('generateContent keeps finishMessage from Vertex AI', async () => {
    const client = new GoogleGenAI({vertexai: true, apiKey: 'fake-api-key'});
    spyOn(global, 'fetch').and.resolveTo(
      okResponse(responseBody(FINISH_MESSAGE)),
    );

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hi',
    });

    expect(response.candidates?.[0]?.finishMessage).toBe(FINISH_MESSAGE);
  });
});
