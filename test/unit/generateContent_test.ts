import {z} from 'zod';

import {GoogleGenAI} from '../../src/client';
import * as types from '../../src/types';

const fetchOkOptions = {
  status: 200,
  statusText: 'OK',
  ok: true,
  headers: {'Content-Type': 'application/json'},
  url: 'some-url',
};

const mockGenerateContentResponse: types.GenerateContentResponse =
  Object.setPrototypeOf(
    {
      candidates: [
        {
          content: {
            parts: [
              {
                text: 'The',
              },
            ],
            role: 'model',
          },
          finishReason: types.FinishReason.STOP,
          index: 0,
        },
      ],
      usageMetadata: {
        promptTokenCount: 8,
        candidatesTokenCount: 1,
        totalTokenCount: 9,
      },
    },
    types.GenerateContentResponse.prototype,
  );

describe('generateContent', () => {
  describe('with zod schema', () => {
    it('should not throw error when given zod object', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const zodSchema = z.object({
        foo: z.string(),
        bar: z.number(),
      });
      spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      expect(async () => {
        await client.models.generateContent({
          model: 'gemini-1.5-flash-exp',
          contents: 'why is the sky blue?',
          config: {responseSchema: zodSchema},
        });
      }).not.toThrow();
    });
  });
});
