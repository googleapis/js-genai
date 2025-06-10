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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function generateContentFromMLDev() {
  const ai = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});

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

  const response = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash',
    contents: 'Dim the lights so the room feels cozy and warm.',
    config: {
      tools: [controlLightCallableTool],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.AUTO,
        },
      },
      systemInstruction:
        'You are a helpful assistant. You can control the brightness and color temperature of a room light, once you have succeeded tell me the new values',
    },
  });

  for await (const chunk of response) {
    if (chunk.text) {
      console.log(chunk.text);
    }
  }
}

async function generateContentFromVertexAI() {
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

  const response = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash',
    contents: 'Dim the lights so the room feels cozy and warm.',
    config: {
      tools: [controlLightCallableTool],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.AUTO,
        },
      },
      systemInstruction:
        'You are a helpful assistant. You can control the brightness and color temperature of a room light, once you have succeeded tell me the new values',
    },
  });

  for await (const chunk of response) {
    if (chunk.text) {
      console.log(chunk.text);
    }
  }
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await generateContentFromVertexAI().catch((e) =>
      console.error('got error', e),
    );
  } else {
    await generateContentFromMLDev().catch((e) =>
      console.error('got error', e),
    );
  }
}

main();
