/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as types from '@google/genai';
import {GoogleGenAI} from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);

  const getArg = (flag: string) => {
    const arg = args.find((a) => a.startsWith(flag + '='));
    return arg ? arg.substring(flag.length + 1) : undefined;
  };

  const voiceSamplePath = getArg('--voice-sample');
  const voiceConsentPath = getArg('--voice-consent');
  const voiceSignature = getArg('--voice-signature');
  const modelFlag = getArg('--model');
  const promptFlag = getArg('--prompt') || 'Hello Gemini, are you there?';

  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
  const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
  const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

  let options: types.GoogleGenAIOptions;
  let defaultModel: string;

  if (GOOGLE_GENAI_USE_VERTEXAI) {
    options = {
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    };
    defaultModel = 'gemini-2.0-flash-live-preview-04-09';
  } else {
    options = {
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
    };
    defaultModel = 'gemini-live-2.5-flash-preview';
  }

  const model = modelFlag || defaultModel;
  const ai = new GoogleGenAI(options);

  let speechConfig: types.SpeechConfig | undefined = undefined;

  if (voiceSamplePath) {
    const voiceSampleAudio = fs.readFileSync(voiceSamplePath);
    let consentAudio: Buffer | undefined = undefined;

    if (voiceConsentPath) {
      consentAudio = fs.readFileSync(voiceConsentPath);
    }

    if (!consentAudio && !voiceSignature) {
      console.error(
        'Either --voice-consent or --voice-signature must be provided when --voice-sample is used.',
      );
      process.exit(1);
    }

    const replicatedConfig: types.ReplicatedVoiceConfig = {
      mimeType: 'audio/wav',
      voiceSampleAudio: voiceSampleAudio.toString('base64'),
    };

    if (consentAudio) {
      replicatedConfig.consentAudio = consentAudio.toString('base64');
    }
    if (voiceSignature) {
      replicatedConfig.voiceConsentSignature = {signature: voiceSignature};
    }

    speechConfig = {
      voiceConfig: {
        replicatedVoiceConfig: replicatedConfig,
      },
    };
  }

  console.log('Connecting to Gemini Live API...');
  const audioChunks: Buffer[] = [];

  const session = await ai.live.connect({
    model: model,
    config: {
      responseModalities: [types.Modality.AUDIO],
      speechConfig: speechConfig,
    },
    callbacks: {
      onopen: () => {
        console.log('Live Session Opened');
      },
      onmessage: (message: types.LiveServerMessage) => {
        if (message.setupComplete) {
          console.log('Setup Complete received.');
          if (message.setupComplete.voiceConsentSignature) {
            console.log('\n=== Voice Consent Signature Received ===');
            console.log(message.setupComplete.voiceConsentSignature.signature);
            console.log('========================================\n');
          }
        }
        if (message.serverContent) {
          const content = message.serverContent;
          if (content.turnComplete) {
            console.log('Turn complete, saving audio...');
            saveWav(Buffer.concat(audioChunks), 'output.wav');
            session.close();
            process.exit(0);
          }
          if (content.modelTurn && content.modelTurn.parts) {
            for (const part of content.modelTurn.parts) {
              if (part.inlineData && part.inlineData.data) {
                const base64Data = part.inlineData.data;
                const buffer = Buffer.from(base64Data, 'base64');
                audioChunks.push(buffer);
                console.log(`Received audio chunk: ${buffer.length} bytes`);
              }
            }
          }
        }
      },
      onerror: (e: ErrorEvent) => {
        console.error('Live Session Error:', e);
      },
      onclose: (e: CloseEvent) => {
        console.log('Live Session Closed:', e);
      },
    },
  });

  console.log('Sending prompt:', promptFlag);
  session.sendRealtimeInput({text: promptFlag});
}

function saveWav(data: Buffer, filename: string) {
  const sampleRate = 24000;
  const bitsPerSample = 16;
  const channels = 1;
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  const fileBuffer = Buffer.concat([header, data]);
  fs.writeFileSync(filename, fileBuffer);
  console.log(`Saved audio response to ${path.resolve(filename)}`);
}

main().catch(console.error);
