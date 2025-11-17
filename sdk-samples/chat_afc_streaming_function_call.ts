/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  CallableTool,
  FunctionCall,
  FunctionCallingConfigMode,
  FunctionDeclaration,
  GoogleGenAI,
  Part,
  Type,
} from '@google/genai';
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function chatFromVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });
  const controlLightFunctionDeclaration: FunctionDeclaration = {
    name: 'controlLight',
    parameters: {
      type: Type.OBJECT,
      description: 'Set the brightness and color temperature of a room light.',
      properties: {
        brightness: {
          type: Type.NUMBER,
          description:
            'Light level from 0 to 100. Zero is off and 100 is full brightness.',
        },
        colorTemperature: {
          type: Type.STRING,
          description:
            'Color temperature of the light fixture which can be `daylight`, `cool` or `warm`.',
        },
      },
      required: ['brightness', 'colorTemperature'],
    },
  };
  const controlLightCallableTool: CallableTool = {
    tool: async () => {
      return Promise.resolve({
        functionDeclarations: [controlLightFunctionDeclaration],
      });
    },
    callTool: async (params: FunctionCall[]) => {
      console.log('Tool called', params);
      const response: Part = {
        functionResponse: {
          name: 'controlLight',
          response: {brightness: 25, colorTemperature: 'warm'},
        },
      };
      return [response];
    },
  };
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      tools: [controlLightCallableTool],
      automaticFunctionCalling: {
        disable: true,
      },
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.AUTO,
          streamFunctionCallArguments: true,
        },
      },
      systemInstruction:
        'You are a helpful assistant. You can control the brightness and color temperature of a room light, once you have succeeded tell me the new values',
    },
  });
  const response = await chat.sendMessageStream({
    message: 'Dim the lights so the room feels cozy and warm.',
  });
  for await (const chunk of response) {
    if (chunk.text) {
      console.log(chunk.text);
    }
  }
  const secondResponse = await chat.sendMessageStream({
    message: 'Thanks!',
  });
  for await (const chunk of secondResponse) {
    if (chunk) {
      const textPart = chunk.text;
      const functionCalls = chunk.functionCalls;
      if (textPart) {
        console.log('text: ', textPart);
      }
      if (functionCalls) {
        console.log('functionCalls: ', JSON.stringify(functionCalls, null, 2));
      }
    }
  }
  console.log('History: ', JSON.stringify(chat.getHistory(), null, 2));
}
async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await chatFromVertexAI().catch((e) => console.error('got error', e));
  } else {
    console.log(
      'Gemini Developer API does not support streaming function calling.',
    );
    return;
  }
}
main();
