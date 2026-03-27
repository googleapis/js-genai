/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI, LiveServerMessage, Modality} from '@google/genai';
import {writeFile} from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

class AsyncQueue<T> {
  private queue: T[] = [];
  private waiting: ((value: T) => void)[] = [];

  /**
   * Adds an item to the queue.
   * If there's a waiting consumer, it resolves immediately.
   * @param item The item to add to the queue.
   */
  put(item: T): void {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift();
      if (resolve) {
        resolve(item);
      }
    } else {
      this.queue.push(item);
    }
  }

  /**
   * Gets the next item from the queue.
   * If the queue is empty, it waits for an item to be added.
   * @return A Promise that resolves with the next item.
   */
  get(): Promise<T> {
    return new Promise<T>((resolve) => {
      if (this.queue.length > 0) {
        resolve(this.queue.shift()!);
      } else {
        this.waiting.push(resolve);
      }
    });
  }

  /**
   * Clears the queue.
   */
  clear(): void {
    this.queue = [];
    this.waiting = [];
  }
}

// ---------------------------------------------------------------------------
// Audio handling utilities (not specific to historyConfig)
// ---------------------------------------------------------------------------

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

function parseMimeType(mimeType: string): WavConversionOptions {
  const [fileType, ...params] = mimeType.split(';').map((s) => s.trim());
  const [, format] = fileType.split('/');

  const options: Partial<WavConversionOptions> = {
    numChannels: 1,
    bitsPerSample: 16,
  };

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split('=').map((s) => s.trim());
    if (key === 'rate') {
      options.sampleRate = parseInt(value, 10);
    }
  }

  return options as WavConversionOptions;
}

function createWavHeader(
  dataLength: number,
  options: WavConversionOptions,
): Buffer {
  const {numChannels, sampleRate, bitsPerSample} = options;

  // http://soundfile.sapp.org/doc/WaveFormat
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0); // ChunkID
  buffer.writeUInt32LE(36 + dataLength, 4); // ChunkSize
  buffer.write('WAVE', 8); // Format
  buffer.write('fmt ', 12); // Subchunk1ID
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22); // NumChannels
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(byteRate, 28); // ByteRate
  buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34); // BitsPerSample
  buffer.write('data', 36); // Subchunk2ID
  buffer.writeUInt32LE(dataLength, 40); // Subchunk2Size

  return buffer;
}

function convertToWav(rawData: string[], mimeType: string): Buffer {
  const options = parseMimeType(mimeType);
  const dataLength = rawData.reduce((a, b) => a + b.length, 0);
  const wavHeader = createWavHeader(dataLength, options);
  const buffer = Buffer.concat(
    // TODO: go/ts59upgrade - Remove this suppression after TS 5.9.2 upgrade
    //   error TS2345: Argument of type 'Buffer[]' is not assignable to parameter of type 'readonly Uint8Array<ArrayBufferLike>[]'.
    // @ts-ignore
    rawData.map((data) => Buffer.from(data, 'base64')),
  );

  // TODO: go/ts59upgrade - Remove this suppression after TS 5.9.2 upgrade
  // error TS2322: Type 'Buffer' is not assignable to type 'Uint8Array<ArrayBufferLike>'.
  // @ts-ignore
  return Buffer.concat([wavHeader, buffer]);
}

function saveBinaryFile(fileName: string, content: Buffer) {
  // TODO: go/ts59upgrade - Remove this suppression after TS 5.9.2 upgrade
  //   error TS2345: Argument of type 'Buffer' is not assignable to parameter of type 'string | ArrayBufferView'.
  // @ts-ignore
  writeFile(fileName, content, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing file ${fileName}:`, err);
      return;
    }
    console.log(`Appending stream content to file ${fileName}.`);
  });
}

// ---------------------------------------------------------------------------
// Main example: historyConfig with initial conversation context seeding
// ---------------------------------------------------------------------------

async function live(client: GoogleGenAI, model: string) {
  const responseQueue = new AsyncQueue<LiveServerMessage>();
  const audioParts: string[] = [];

  function handleModelTurn(message: LiveServerMessage) {
    if (message.serverContent?.outputTranscription) {
      console.log('Transcription: ', message.serverContent.outputTranscription);
    }
    if (message.serverContent?.modelTurn?.parts) {
      const part = message.serverContent.modelTurn.parts[0];

      if (part?.fileData) {
        console.log(`File: ${part.fileData.fileUri}`);
      }

      if (part?.inlineData) {
        const fileName = 'audio.wav';
        const inlineData = part.inlineData;

        audioParts.push(inlineData.data ?? '');

        const buffer = convertToWav(audioParts, inlineData.mimeType ?? '');
        saveBinaryFile(fileName, buffer);
      }

      if (part?.text) {
        console.log(part.text);
      }
    }
  }

  async function handleTurn(): Promise<LiveServerMessage[]> {
    const turn: LiveServerMessage[] = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const message = await responseQueue.get();
      handleModelTurn(message);
      turn.push(message);
      if (message.serverContent?.turnComplete) {
        return turn;
      }
    }
  }

  // Connect with historyConfig to enable seeding initial context history
  // via clientContent before starting the realtime conversation.
  const session = await client.live.connect({
    model: model,
    callbacks: {
      onopen: () => {
        console.debug('Opened');
      },
      onmessage: (message: LiveServerMessage) => {
        responseQueue.put(message);
      },
      onerror: (e: ErrorEvent) => {
        console.debug('Error:', e.message);
      },
      onclose: (e: CloseEvent) => {
        console.debug('Close:', e.reason);
        responseQueue.clear();
      },
    },
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: 'You are a helpful and friendly AI assistant.',
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Kore',
          },
        },
      },
      outputAudioTranscription: {},
      historyConfig: {initialHistoryInClientContent: true},
    },
  });

  // Seed the session with initial conversation history.
  // With historyConfig.initialHistoryInClientContent set to true, the server
  // will process these clientContent messages as context history without
  // triggering a model response. The history can end with role MODEL.
  // After turnComplete is true, the client can start the realtime conversation.
  console.log('-'.repeat(80));
  console.log('Seeding initial conversation history...');
  session.sendClientContent({
    turns: [
      {
        role: 'user',
        parts: [
          {text: "My name is Jad and I'm building a live streaming app."},
        ],
      },
      {
        role: 'model',
        parts: [
          {
            text: 'Nice to meet you, Jad! That sounds like an exciting project. What kind of live streaming are you focusing on?',
          },
        ],
      },
      {
        role: 'user',
        parts: [
          {
            text: "I'm focusing on real-time audio conversations using the Gemini API.",
          },
        ],
      },
      {
        role: 'model',
        parts: [
          {
            text: 'Great use case! The Gemini Live API is well-suited for real-time audio interactions. How can I help?',
          },
        ],
      },
    ],
    turnComplete: true,
  });
  console.log('History seeded.');

  // Now send a follow-up question that relies on the seeded context.
  // The model should be able to recall details from the conversation history.
  // After history seeding, use sendRealtimeInput to continue the conversation.
  console.log('-'.repeat(80));
  const followUp = 'What was my name and what am I building?';
  console.log(`Sent: ${followUp}`);
  session.sendRealtimeInput({text: followUp});

  await handleTurn();

  session.close();
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    // Note: historyConfig support may not yet be available on all Vertex AI
    // models. Check model documentation for compatibility.
    const client = new GoogleGenAI({
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    });
    const model = 'gemini-2.0-flash-live-preview-04-09';
    await live(client, model).catch((e) => console.error('got error', e));
    return;
  }

  const model = 'gemini-3.1-flash-live-preview';
  const client = new GoogleGenAI({
    vertexai: false,
    apiKey: GEMINI_API_KEY,
  });

  await live(client, model).catch((e) => console.error('got error', e));
}

main();
