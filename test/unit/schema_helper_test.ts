import {z, ZodError} from 'zod';

import {responseSchemaFromZod} from '../../src/schema_helper';

describe('responseSchemaFromZod', () => {
  describe('can convert zod schema to Google AI schema', () => {
    it('should throw zod error for tuple schema due to type mismatch', () => {
      const tupleSchema = z.object({
        tupleField: z.tuple([z.string(), z.number()]),
      });
      expect(() => responseSchemaFromZod(true, tupleSchema)).toThrowError(
        ZodError,
      );
      expect(() => responseSchemaFromZod(false, tupleSchema)).toThrowError(
        ZodError,
      );
    });
    it('should throw zod error for set schema due to unsupported property: uniqueItems', () => {
      const setSchema = z.object({
        setField: z.set(z.string()),
      });
      expect(() => responseSchemaFromZod(true, setSchema)).toThrowError(
        ZodError,
      );
      expect(() => responseSchemaFromZod(false, setSchema)).toThrowError(
        ZodError,
      );
    });
    it('should not throw zod error for supported schema.', () => {
      const supportedSchema = z.object({
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
      expect(() =>
        responseSchemaFromZod(true, supportedSchema),
      ).not.toThrowError(ZodError);
      expect(() =>
        responseSchemaFromZod(false, supportedSchema),
      ).not.toThrowError(ZodError);
    });
    it('should throw zod error for nested zod object referred twice due to unsupported property: $ref', () => {
      const innerObject = z.object({
        innerString: z.string(),
        innerNumber: z.number(),
      });
      const nestedSchema = z.object({
        simpleString: z.string().describe('This is a simple string'),
        simpleInteger: z.number().int(),
        inner: innerObject,
        notherInner: innerObject,
      });
      expect(() => responseSchemaFromZod(true, nestedSchema)).toThrowError(
        ZodError,
      );
      expect(() => responseSchemaFromZod(false, nestedSchema)).toThrowError(
        ZodError,
      );
    });
    it('should throw zod error for all fields that failed validation together', () => {
      const unsupportedSchema = z.object({
        setField: z.set(z.string()),
        tupleField: z.tuple([z.string(), z.number()]),
        recordField: z.record(z.string()),
      });
      //  ZodError: [
      //   {
      //     "code": "unrecognized_keys",
      //     "keys": [
      //       "uniqueItems"
      //     ],
      //     "path": [
      //       "properties",
      //       "setField"
      //     ],
      //     "message": "Unrecognized key(s) in object: 'uniqueItems'"
      //   },
      //   {
      //     "code": "invalid_type",
      //     "expected": "object",
      //     "received": "array",
      //     "path": [
      //       "properties",
      //       "tupleField",
      //       "items"
      //     ],
      //     "message": "Expected object, received array"
      //   },
      //   {
      //     "code": "invalid_type",
      //     "expected": "boolean",
      //     "received": "object",
      //     "path": [
      //       "properties",
      //       "recordField",
      //       "additionalProperties"
      //     ],
      //     "message": "Expected boolean, received object"
      //   }
      // ]
      // Above is the error message from responseSchemaFromZod, it lists all
      // incompatible fields
      let vertextZodError: ZodError = new ZodError([]);
      try {
        responseSchemaFromZod(true, unsupportedSchema);
      } catch (error) {
        vertextZodError = error as ZodError;
      }
      expect(() => responseSchemaFromZod(true, unsupportedSchema)).toThrowError(
        ZodError,
      );
      expect(vertextZodError.errors.length).toBe(3);

      let genaiZodError: ZodError = new ZodError([]);
      try {
        responseSchemaFromZod(false, unsupportedSchema);
      } catch (error) {
        genaiZodError = error as ZodError;
      }
      expect(() =>
        responseSchemaFromZod(false, unsupportedSchema),
      ).toThrowError(ZodError);
      expect(genaiZodError.errors.length).toBe(3);
    });
  });
});
