import {z} from 'zod';

import {zodToGoogleGenAISchema} from '../../src/schema_helper';
import * as types from '../../src/types';

describe('zodToGoogleGenAISchema', () => {
  describe('can convert zod schema to ai schema', () => {
    it('should process simple zod object', () => {
      const zodSchema = z.object({
        simpleString: z.string().describe('This is a simple string'),
        stringWithRegex: z.string().regex(/^[a-zA-Z]{1,10}$/),
        stringDateTime: z.string().datetime(),
        stringWithEnum: z.enum(['enumvalue1', 'enumvalue2', 'enumvalue3']),
        stringWithLength: z.string().min(1).max(10),
        simpleNumber: z.number(),
        simpleInteger: z.number().int(),
        integerInt64: z.bigint(),
        numberWithMinMax: z.number().min(1).max(10),
        simpleBoolean: z.boolean(),
      });
      const expected: types.Schema = {
        type: types.Type.OBJECT,
        properties: {
          simpleString: {
            type: types.Type.STRING,
            description: 'This is a simple string',
          },
          stringWithRegex: {
            type: types.Type.STRING,
            pattern: '^[a-zA-Z]{1,10}$',
          },
          stringDateTime: {type: types.Type.STRING, format: 'date-time'},
          stringWithEnum: {
            type: types.Type.STRING,
            format: 'enum',
            enum: ['enumvalue1', 'enumvalue2', 'enumvalue3'],
          },
          stringWithLength: {
            type: types.Type.STRING,
            minLength: '1',
            maxLength: '10',
          },
          simpleNumber: {type: types.Type.NUMBER},
          simpleInteger: {type: types.Type.INTEGER},
          integerInt64: {type: types.Type.INTEGER, format: 'int64'},
          numberWithMinMax: {type: types.Type.NUMBER, minimum: 1, maximum: 10},
          simpleBoolean: {type: types.Type.BOOLEAN},
        },
        required: [
          'simpleString',
          'stringWithRegex',
          'stringDateTime',
          'stringWithEnum',
          'stringWithLength',
          'simpleNumber',
          'simpleInteger',
          'integerInt64',
          'numberWithMinMax',
          'simpleBoolean',
        ],
      };
      const processedSchema = zodToGoogleGenAISchema(false, zodSchema);
      expect(processedSchema).toEqual(expected);
    });
    it('ML Dev should throw error when zod schema include default values', () => {
      const zodSchema = z.object({
        simpleString: z.string().default('default'),
      });
      expect(() => zodToGoogleGenAISchema(false, zodSchema)).toThrowError(
        'Default value is not supported in the response schema for the Gemini API.',
      );
    });
    it('Vertex AI should processzod schema include default values', () => {
      const zodSchema = z.object({
        simpleString: z.string().default('default'),
        anotherString: z.string(),
      });
      expect(() => zodToGoogleGenAISchema(true, zodSchema)).not.toThrow();
      expect(zodToGoogleGenAISchema(true, zodSchema)).toEqual({
        type: types.Type.OBJECT,
        properties: {
          simpleString: {
            type: types.Type.STRING,
            default: 'default',
          },
          anotherString: {type: types.Type.STRING},
        },
        required: ['anotherString'],
      });
    });
  });
});
