import {z, ZodError} from 'zod';

import {functionDeclarationFromZodFunction, schemaFromJson, schemaFromZodType,} from '../../src/schema_helper';
import * as types from '../../src/types';

describe('schema helper', () => {
  describe('schemaFromZodType can convert zod schema to Google AI schema', () => {
    // throw zod error whe item is not JSONSchema.
    it('should throw zod error for tuple schema due to item field data type mismatch', () => {
      const tupleSchema = z.object({
        tupleField: z.tuple([z.string(), z.number()]),
      });
      expect(() => schemaFromZodType(tupleSchema)).toThrowError(ZodError);
    });
    it('should throw zod error for set schema due to unsupported property: uniqueItems', () => {
      const setSchema = z.object({
        setField: z.set(z.string()),
      });
      expect(() => schemaFromZodType(setSchema)).toThrowError(ZodError);
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
      expect(() => schemaFromZodType(supportedSchema)).not.toThrowError(
        ZodError,
      );
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
      expect(() => schemaFromZodType(nestedSchema)).toThrowError(ZodError);
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
      // Above is the error message from schemaFromZodType, it lists all
      // incompatible fields
      let vertextZodError: ZodError = new ZodError([]);
      try {
        schemaFromZodType(unsupportedSchema);
      } catch (error) {
        vertextZodError = error as ZodError;
      }
      expect(() => schemaFromZodType(unsupportedSchema)).toThrowError(ZodError);
      expect(vertextZodError.errors.length).toBe(3);
    });
    it('should process simple zod object, with optional fields', () => {
      const zodSchema = z.object({
        // required, properties, type: object
        simpleString: z.string().describe('This is a simple string'), // description, type: string
        stringWithRegex: z.string().regex(/^[a-zA-Z]{1,10}$/), // regex, type: string
        stringDateTime: z.string().datetime(), // format: date-time, type: string
        stringWithEnum: z.enum(['enumvalue1', 'enumvalue2', 'enumvalue3']), // enum, type: string
        stringWithLength: z.string().min(1).max(10), // minLength, maxLength, type: string
        optionalNumber: z.number().optional(), // optional,type: number
        simpleNumber: z.number(), // type: number
        simpleInteger: z.number().int(), // type: integer
        integerInt64: z.bigint(), // format: int64, type: integer
        numberWithMinMax: z.number().min(1).max(10), // minimum, maximum, type: number
        simpleBoolean: z.boolean(), // type: boolean
        optionalBoolean: z.boolean().optional(), // optional, type: boolean
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
          optionalNumber: {type: types.Type.NUMBER},
          simpleNumber: {type: types.Type.NUMBER},
          simpleInteger: {type: types.Type.INTEGER},
          integerInt64: {type: types.Type.INTEGER, format: 'int64'},
          numberWithMinMax: {type: types.Type.NUMBER, minimum: 1, maximum: 10},
          simpleBoolean: {type: types.Type.BOOLEAN},
          optionalBoolean: {type: types.Type.BOOLEAN},
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
      expect(schemaFromZodType(zodSchema)).toEqual(expected);
    });
    it('should process nested zod object if it was only referred once', () => {
      const innerObject = z.object({
        innerString: z.string(),
        innerNumber: z.number(),
      });
      const nestedSchema = z.object({
        simpleString: z.string().describe('This is a simple string'),
        simpleInteger: z.number().int(),
        inner: innerObject,
      });

      const expected: types.Schema = {
        type: types.Type.OBJECT,
        properties: {
          simpleString: {
            type: types.Type.STRING,
            description: 'This is a simple string',
          },
          simpleInteger: {type: types.Type.INTEGER},
          inner: {
            type: types.Type.OBJECT,
            properties: {
              innerString: {
                type: types.Type.STRING,
              },
              innerNumber: {type: types.Type.NUMBER},
            },
            required: ['innerString', 'innerNumber'],
          },
        },
        required: ['simpleString', 'simpleInteger', 'inner'],
      };
      expect(schemaFromZodType(nestedSchema)).toEqual(expected);
      expect(schemaFromZodType(nestedSchema)).toEqual(expected);
    });
    it('should process primitive types directly', () => {
      const stringDirectly = z
        .string()
        .min(1)
        .max(10)
        .regex(/^[a-zA-Z]{1,10}$/)
        .describe('This is a simple string');
      const numberDirectly = z
        .number()
        .min(1)
        .max(10)
        .describe('This is a simple number');
      const integerDirectly = z.bigint().describe('This is a simple integer');
      const booleanDirectly = z.boolean().describe('This is a simple boolean');

      const expectedStringDirectly = {
        type: types.Type.STRING,
        minLength: '1',
        maxLength: '10',
        pattern: '^[a-zA-Z]{1,10}$',
        description: 'This is a simple string',
      };
      expect(schemaFromZodType(stringDirectly)).toEqual(expectedStringDirectly);
      const expectedNumberDirectly = {
        type: types.Type.NUMBER,
        minimum: 1,
        maximum: 10,
        description: 'This is a simple number',
      };
      expect(schemaFromZodType(numberDirectly)).toEqual(expectedNumberDirectly);
      const expectedIntegerDirectly = {
        type: types.Type.INTEGER,
        format: 'int64',
        description: 'This is a simple integer',
      };
      expect(schemaFromZodType(integerDirectly)).toEqual(
        expectedIntegerDirectly,
      );
      expect(schemaFromZodType(integerDirectly)).toEqual(
        expectedIntegerDirectly,
      );

      const expectedBooleanDirectly = {
        type: types.Type.BOOLEAN,
        description: 'This is a simple boolean',
      };
      expect(schemaFromZodType(booleanDirectly)).toEqual(
        expectedBooleanDirectly,
      );
    });
    it('should process array of primitives', () => {
      const zodSchema = z.object({
        // items, type: array
        stringArray: z.array(z.string()).max(10).min(1),
        numberArray: z.array(z.number()).max(15).min(6),
      });

      const expected = {
        type: types.Type.OBJECT,
        properties: {
          stringArray: {
            type: types.Type.ARRAY,
            minItems: '1',
            maxItems: '10',
            items: {
              type: types.Type.STRING,
            },
          },
          numberArray: {
            type: types.Type.ARRAY,
            minItems: '6',
            maxItems: '15',
            items: {
              type: types.Type.NUMBER,
            },
          },
        },
        required: ['stringArray', 'numberArray'],
      };

      expect(schemaFromZodType(zodSchema)).toEqual(expected);
    });
    it('should process zod array of objects', () => {
      const innerObject = z.object({
        simpleString: z.string(),
        anotherString: z.string(),
      });
      const objectArray = z.object({
        arrayOfObjects: z.array(innerObject),
      });
      expect(schemaFromZodType(objectArray)).toEqual({
        type: types.Type.OBJECT,
        properties: {
          arrayOfObjects: {
            type: types.Type.ARRAY,
            items: {
              type: types.Type.OBJECT,
              properties: {
                simpleString: {
                  type: types.Type.STRING,
                },
                anotherString: {type: types.Type.STRING},
              },
              required: ['simpleString', 'anotherString'],
            },
          },
        },
        required: ['arrayOfObjects'],
      });
    });
    it('should process default value', () => {
      const defaultObject = z.object({
        simpleString: z.string().default('default string'),
      });
      const expected = {
        type: types.Type.OBJECT,
        properties: {
          simpleString: {
            type: types.Type.STRING,
            default: 'default string',
          },
        },
      };
      expect(schemaFromZodType(defaultObject)).toEqual(expected);
    });
    it('should process primitive nullables', () => {
      /*
      Resulted JSONSchema:
      {
        type: 'object',
        properties: { nullablePrimitives: { type: [string, null] } },
        required: [ 'nullablePrimitives' ],
        additionalProperties: false
      }
      */
      const objectNullable = z.object({
        nullablePrimitives: z.string().nullable(),
      });

      const expected = {
        type: types.Type.OBJECT,
        properties: {
          nullablePrimitives: {
            type: types.Type.STRING,
            nullable: true,
          },
        },
        required: ['nullablePrimitives'],
      };
      expect(schemaFromZodType(objectNullable)).toEqual(expected);
    });
    it('should throw error when there is only null in the type', () => {
      const objectNullable = z.object({
        nullValue: z.null(),
      });

      expect(() => schemaFromZodType(objectNullable)).toThrowError(
        'type: null can not be the only possible type for the field.',
      );
      expect(() => schemaFromZodType(objectNullable)).toThrowError(
        'type: null can not be the only possible type for the field.',
      );
    });
    it('should process nullable array and remove anyOf filed when necessary', () => {
      /*
      Resulted JSONSchema:
        { anyOf: 
          [ 
            { type: 'array', items: {type: 'string'} }, 
            { type: 'null' }
          ]
        }
      */
      const nullableArray = z.array(z.string()).nullable();
      const expected = {
        type: types.Type.ARRAY,
        items: {
          type: types.Type.STRING,
        },
        nullable: true,
      };
      expect(schemaFromZodType(nullableArray)).toEqual(expected);
    });
    it('should process nullable object and remove anyOf filed when necessary', () => {
      /*
      Resulted JSONSchema:
      {
        type: 'object',
        properties: { 
          nullableObject:{ 
            anyOf: [
              { type: 'object', properties: { simpleString: { type: 'string' } } }, 
              { type: 'null' } 
            ]
          } 
        required: [ 'nullableObject' ], additionalProperties: false
      }
      */
      const innerObject = z.object({
        simpleString: z.string().nullable(),
      });
      const objectNullable = z.object({
        nullableObject: innerObject.nullable(),
      });

      const expected = {
        type: types.Type.OBJECT,
        properties: {
          nullableObject: {
            type: types.Type.OBJECT,
            properties: {
              simpleString: {
                type: types.Type.STRING,
                nullable: true,
              },
            },
            required: ['simpleString'],
            nullable: true,
          },
        },
        required: ['nullableObject'],
      };
      expect(schemaFromZodType(objectNullable)).toEqual(expected);
    });
    it('should process union consist of only not-nullable primitive types without additional fields', () => {
      /*
      Resulted JSONSchema:
      {
        type: 'object',
        properties: { 
          unionPrimitivesField: { type: [string, number, boolean]}
        }, 
        required: [ 'unionPrimitivesField' ], additionalProperties: false
      }
      */
      const unionPrimitives = z.object({
        unionPrimitivesField: z.union([z.string(), z.number(), z.boolean()]),
      });

      const expected = {
        type: types.Type.OBJECT,
        properties: {
          unionPrimitivesField: {
            anyOf: [
              {type: types.Type.STRING},
              {type: types.Type.NUMBER},
              {type: types.Type.BOOLEAN},
            ],
          },
        },
        required: ['unionPrimitivesField'],
      };
      expect(schemaFromZodType(unionPrimitives)).toEqual(expected);
    });
    it('should process union consist of only not-nullable primitive types without additional fields, one of the union type is null', () => {
      /*
      Resulted JSONSchema:
      {
        type: 'object',
        properties: { 
          unionPrimitivesField: { type: [string, number, null] }
        }, 
        required: [ 'unionPrimitivesField' ], 
        additionalProperties: false
      }
     */
      const unionPrimitives = z.object({
        unionPrimitivesField: z.union([z.string(), z.number(), z.null()]),
      });

      const expected = {
        type: types.Type.OBJECT,
        properties: {
          unionPrimitivesField: {
            anyOf: [{type: types.Type.STRING}, {type: types.Type.NUMBER}],
            nullable: true,
          },
        },
        required: ['unionPrimitivesField'],
      };
      expect(schemaFromZodType(unionPrimitives)).toEqual(expected);
    });
    it('should process union primitive types, one of the union type is nullable, and one of the union type is null', () => {
      /*
      Resulted JSONSchema:
      {
        type: 'object',
         properties: { 
          unionPrimitivesField: { 
            anyOf: [
              { type: [string, null]}, { type: 'number' }, { type: 'null' }
            ] 
          } 
        }, 
        required: [ 'unionPrimitivesField' ], 
        additionalProperties: false
      }
      */
      const unionPrimitives = z.object({
        unionPrimitivesField: z.union([
          z.string().nullable(),
          z.number(),
          z.null(),
        ]),
      });

      const expected = {
        type: types.Type.OBJECT,
        properties: {
          unionPrimitivesField: {
            anyOf: [
              {type: types.Type.STRING, nullable: true},
              {type: types.Type.NUMBER},
            ],
            nullable: true,
          },
        },
        required: ['unionPrimitivesField'],
      };
      expect(schemaFromZodType(unionPrimitives)).toEqual(expected);
    });
    it('should process union primitive types, when types in the union are primitives without any additional fields, one of them is nullable', () => {
      /*
      Resulted JSONSchema:
      {
        type: 'object',
        properties: { 
          unionPrimitivesField: { 
              anyOf: [{ type: [string, null]}, { type: 'number' }]
          } 
        }, 
        required: [ 'unionPrimitivesField' ],
        additionalProperties: false
      }
      */
      const unionPrimitives = z.object({
        unionPrimitivesField: z.union([z.string().nullable(), z.number()]),
      });

      const expected = {
        type: types.Type.OBJECT,
        properties: {
          unionPrimitivesField: {
            anyOf: [
              {type: types.Type.STRING, nullable: true},
              {type: types.Type.NUMBER},
            ],
          },
        },
        required: ['unionPrimitivesField'],
      };
      expect(schemaFromZodType(unionPrimitives)).toEqual(expected);
      expect(schemaFromZodType(unionPrimitives)).toEqual(expected);
    });
    it('should process union primitive types, when types in the union are primitives without any additional fields, both of them is nullable', () => {
      /*
       Resulted JSONSchema:
        {
          type: 'object',
          properties: { 
              unionPrimitivesField: { 
                anyOf: [{ type: [string, null]}, { type: [number, null] }] 
              } 
          }, 
          required: [ 'unionPrimitivesField' ], 
          additionalProperties: false
        }
      */
      const unionPrimitives = z.object({
        unionPrimitivesField: z.union([
          z.string().nullable(),
          z.number().nullable(),
        ]),
      });

      const expected = {
        type: types.Type.OBJECT,
        properties: {
          unionPrimitivesField: {
            anyOf: [
              {type: types.Type.STRING, nullable: true},
              {type: types.Type.NUMBER, nullable: true},
            ],
          },
        },
        required: ['unionPrimitivesField'],
      };
      expect(schemaFromZodType(unionPrimitives)).toEqual(expected);
    });
    it('should process union primitive types, when types in the union are primitives with additional fields, not nullable', () => {
      /*
       Resulted JSONSchema:
         {
          type: 'object',
          properties: 
             { unionPrimitivesField: 
                 { anyOf: [
                    {type: 'string',pattern: '^[a-zA-Z]{1,10}$'}, 
                    {type: 'number'}
                   ] 
                  } 
              }, 
          required: [ 'unionPrimitivesField' ], 
          additionalProperties: false
          }
      */
      const unionPrimitives = z.object({
        unionPrimitivesField: z.union([
          z.string().regex(/^[a-zA-Z]{1,10}$/),
          z.number(),
        ]),
      });

      const expected = {
        type: types.Type.OBJECT,
        properties: {
          unionPrimitivesField: {
            anyOf: [
              {
                type: types.Type.STRING,
                pattern: '^[a-zA-Z]{1,10}$',
              },
              {type: types.Type.NUMBER},
            ],
          },
        },
        required: ['unionPrimitivesField'],
      };
      expect(schemaFromZodType(unionPrimitives)).toEqual(expected);
    });
    it('should process union objects', () => {
      /*
      Resulted JSONSchema:
      {
        type: 'object',
        properties: { 
          unionPrimitivesField: { anyOf: [Array] } 
        },
        required: [ 'unionPrimitivesField' ],
        additionalProperties: false
      }
      */
      const innerObject = z.object({
        simpleString: z.string(),
      });
      const unionPrimitivesAndObjects = z.object({
        unionPrimitivesObjectsField: z.union([
          z.string(),
          z.number(),
          innerObject,
        ]),
      });

      const expected = {
        type: types.Type.OBJECT,
        properties: {
          unionPrimitivesObjectsField: {
            anyOf: [
              {type: types.Type.STRING},
              {type: types.Type.NUMBER},
              {
                type: types.Type.OBJECT,
                properties: {
                  simpleString: {
                    type: types.Type.STRING,
                  },
                },
                required: ['simpleString'],
              },
            ],
          },
        },
        required: ['unionPrimitivesObjectsField'],
      };
      expect(schemaFromZodType(unionPrimitivesAndObjects)).toEqual(expected);
    });
    it('should process union array and objects', () => {
      /*
      Resulted JSONSchema:
      {
        type: 'object',
        properties: { uninonField: { anyOf: [Array, Object] } },
        required: [ 'uninonField' ],
        additionalProperties: false
      }
      */
      const innerObject = z.object({
        simpleString: z.string(),
      });
      const uninonArrayAndObjects = z.object({
        uninonField: z.union([z.array(z.string()), innerObject]),
      });

      const expected = {
        type: types.Type.OBJECT,
        properties: {
          uninonField: {
            anyOf: [
              {
                type: types.Type.ARRAY,
                items: {
                  type: types.Type.STRING,
                },
              },
              {
                type: types.Type.OBJECT,
                properties: {
                  simpleString: {
                    type: types.Type.STRING,
                  },
                },
                required: ['simpleString'],
              },
            ],
          },
        },
        required: ['uninonField'],
      };
      expect(schemaFromZodType(uninonArrayAndObjects)).toEqual(expected);
    });
  });
  describe('functionDeclarationFromZodFunction can convert zod function to FunctionDeclaration', () => {
    it('throw error when the function has more than one parameter value', () => {
      const testParameter = z.object({
        numberField: z
          .number()
          .min(0)
          .max(100)
          .describe('this is a number field'),
      });
      const setParameterFunction = z
        .function()
        .args(testParameter, z.string())
        .returns(z.void())
        .describe('this is a setParameter function');

      expect(() => {
        functionDeclarationFromZodFunction({
          name: 'setParameterFunction',
          zodFunctionSchema: setParameterFunction,
        });
      }).toThrowError(
        'Multiple positional parameters are not supported at the moment. Function parameters must be defined using a single object with named properties.',
      );
    });
    it('throw error when the function parameter is not object', () => {
      const setParameterFunction = z
        .function()
        .args(z.string())
        .returns(z.void())
        .describe('this is a setParameter function');

      expect(() => {
        functionDeclarationFromZodFunction({
          name: 'setParameterFunction',
          zodFunctionSchema: setParameterFunction,
        });
      }).toThrowError(
        'Function parameter is not object and not void, please check the parameter type. Please wrap the parameter in an object with named properties.',
      );
      expect(() => {
        functionDeclarationFromZodFunction({
          name: 'setParameterFunction',
          zodFunctionSchema: setParameterFunction,
        });
      }).toThrowError(
        'Function parameter is not object and not void, please check the parameter type. Please wrap the parameter in an object with named properties.',
      );
    });
    it('should process function with object parameters and return value', () => {
      const setParameter = z.object({
        numberField: z
          .number()
          .min(0)
          .max(100)
          .describe('this is a number field'),
        stringEnumField: z
          .enum(['daylight', 'cool', 'warm'])
          .describe('this is a string enum field'),
        booleanField: z.boolean().describe('this is a boolean field'),
      });

      const returnValue = z.object({
        numberField: z
          .number()
          .min(0)
          .max(100)
          .describe('this is a return number field'),
      });
      const setParameterFunction = z
        .function()
        .args(setParameter)
        .returns(returnValue)
        .describe('this is a setParameter function');

      const expected = {
        description: 'this is a setParameter function',
        name: 'setParameterFunction',
        parameters: {
          type: types.Type.OBJECT,
          properties: {
            numberField: {
              type: types.Type.NUMBER,
              minimum: 0,
              maximum: 100,
              description: 'this is a number field',
            },
            stringEnumField: {
              type: types.Type.STRING,
              enum: ['daylight', 'cool', 'warm'],
              format: 'enum',
              description: 'this is a string enum field',
            },
            booleanField: {
              type: types.Type.BOOLEAN,
              description: 'this is a boolean field',
            },
          },
          required: ['numberField', 'stringEnumField', 'booleanField'],
        },
        response: {
          type: types.Type.OBJECT,
          properties: {
            numberField: {
              type: types.Type.NUMBER,
              minimum: 0,
              maximum: 100,
              description: 'this is a return number field',
            },
          },
          required: ['numberField'],
        },
      };
      expect(
        functionDeclarationFromZodFunction({
          name: 'setParameterFunction',
          zodFunctionSchema: setParameterFunction,
        }),
      ).toEqual(expected);
    });
    it('should process function with object parameters that have two fields with the same type', () => {
      const setParameter = z.object({
        numberFieldOne: z
          .number()
          .min(0)
          .max(100)
          .describe('this is a number field'),
        numberFieldTwo: z
          .number()
          .min(0)
          .max(100)
          .describe('this is the other number field'),
      });

      const returnValue = z.object({
        numberField: z
          .number()
          .min(0)
          .max(100)
          .describe('this is a return number field'),
      });
      const setParameterFunction = z
        .function()
        .args(setParameter)
        .returns(returnValue)
        .describe('this is a setParameter function');

      const expected = {
        description: 'this is a setParameter function',
        name: 'setParameterFunction',
        parameters: {
          type: types.Type.OBJECT,
          properties: {
            numberFieldOne: {
              type: types.Type.NUMBER,
              minimum: 0,
              maximum: 100,
              description: 'this is a number field',
            },
            numberFieldTwo: {
              type: types.Type.NUMBER,
              minimum: 0,
              maximum: 100,
              description: 'this is the other number field',
            },
          },
          required: ['numberFieldOne', 'numberFieldTwo'],
        },
        response: {
          type: types.Type.OBJECT,
          properties: {
            numberField: {
              type: types.Type.NUMBER,
              minimum: 0,
              maximum: 100,
              description: 'this is a return number field',
            },
          },
          required: ['numberField'],
        },
      };
      expect(
        functionDeclarationFromZodFunction({
          name: 'setParameterFunction',
          zodFunctionSchema: setParameterFunction,
        }),
      ).toEqual(expected);
    });
    it('should process function with void as parameters and have return value', () => {
      const returnValue = z.object({
        numberField: z
          .number()
          .min(0)
          .max(100)
          .describe('this is a return number field'),
      });
      const setParameterFunction = z
        .function()
        .args(z.void())
        .returns(returnValue)
        .describe('this is a setParameter function');

      const expected = {
        description: 'this is a setParameter function',
        name: 'setParameterFunction',
        response: {
          type: types.Type.OBJECT,
          properties: {
            numberField: {
              type: types.Type.NUMBER,
              minimum: 0,
              maximum: 100,
              description: 'this is a return number field',
            },
          },
          required: ['numberField'],
        },
      };
      expect(
        functionDeclarationFromZodFunction({
          name: 'setParameterFunction',
          zodFunctionSchema: setParameterFunction,
        }),
      ).toEqual(expected);
    });
    it('should process function with no parameters and have return value', () => {
      const returnValue = z.object({
        valueField: z
          .number()
          .min(0)
          .max(100)
          .describe('this is a return number field'),
      });
      const setParameterFunction = z
        .function()
        .args()
        .returns(returnValue)
        .describe('this is a setParameter function');

      const expected = {
        description: 'this is a setParameter function',
        name: 'setParameterFunction',
        response: {
          type: types.Type.OBJECT,
          properties: {
            valueField: {
              type: types.Type.NUMBER,
              minimum: 0,
              maximum: 100,
              description: 'this is a return number field',
            },
          },
          required: ['valueField'],
        },
      };
      expect(
        functionDeclarationFromZodFunction({
          name: 'setParameterFunction',
          zodFunctionSchema: setParameterFunction,
        }),
      ).toEqual(expected);
    });
    it('should process function with parameters and return value to void', () => {
      const setParameter = z.object({
        numberField: z
          .number()
          .min(0)
          .max(100)
          .describe('this is a number field'),
        stringEnumField: z
          .enum(['daylight', 'cool', 'warm'])
          .describe('this is a string enum field'),
        booleanField: z.boolean().describe('this is a boolean field'),
      });

      const setParameterFunction = z
        .function()
        .args(setParameter)
        .returns(z.void())
        .describe('this is a setParameter function');

      const expected = {
        description: 'this is a setParameter function',
        name: 'setParameterFunction',
        parameters: {
          type: types.Type.OBJECT,
          properties: {
            numberField: {
              type: types.Type.NUMBER,
              minimum: 0,
              maximum: 100,
              description: 'this is a number field',
            },
            stringEnumField: {
              type: types.Type.STRING,
              enum: ['daylight', 'cool', 'warm'],
              format: 'enum',
              description: 'this is a string enum field',
            },
            booleanField: {
              type: types.Type.BOOLEAN,
              description: 'this is a boolean field',
            },
          },
          required: ['numberField', 'stringEnumField', 'booleanField'],
        },
      };
      expect(
        functionDeclarationFromZodFunction({
          name: 'setParameterFunction',
          zodFunctionSchema: setParameterFunction,
        }),
      ).toEqual(expected);
    });
    it('should process function with parameters that have optional fields and return value to void', () => {
      const setParameter = z.object({
        numberField: z
          .number()
          .min(0)
          .max(100)
          .describe('this is a number field'),
        stringEnumField: z
          .enum(['daylight', 'cool', 'warm'])
          .describe('this is a string enum field'),
        booleanField: z.boolean().describe('this is a boolean field'),
        optionalField: z
          .string()
          .optional()
          .describe('this is an optional field'),
      });

      const setParameterFunction = z
        .function()
        .args(setParameter)
        .returns(z.void())
        .describe('this is a setParameter function');

      const expected = {
        description: 'this is a setParameter function',
        name: 'setParameterFunction',
        parameters: {
          type: types.Type.OBJECT,
          properties: {
            numberField: {
              type: types.Type.NUMBER,
              minimum: 0,
              maximum: 100,
              description: 'this is a number field',
            },
            stringEnumField: {
              type: types.Type.STRING,
              enum: ['daylight', 'cool', 'warm'],
              format: 'enum',
              description: 'this is a string enum field',
            },
            booleanField: {
              type: types.Type.BOOLEAN,
              description: 'this is a boolean field',
            },
            optionalField: {
              type: types.Type.STRING,
              description: 'this is an optional field',
            },
          },
          required: ['numberField', 'stringEnumField', 'booleanField'],
        },
      };
      expect(
        functionDeclarationFromZodFunction({
          name: 'setParameterFunction',
          zodFunctionSchema: setParameterFunction,
        }),
      ).toEqual(expected);
    });
    it('should process function with parameters that have optional fields and return value to void', () => {
      const setParameter = z.object({
        numberField: z
          .number()
          .min(0)
          .max(100)
          .describe('this is a number field'),
        stringEnumField: z
          .enum(['daylight', 'cool', 'warm'])
          .describe('this is a string enum field'),
        booleanField: z.boolean().describe('this is a boolean field'),
        optionalField: z
          .string()
          .optional()
          .describe('this is an optional field'),
      });

      const setParameterFunction = z
        .function()
        .args(setParameter)
        .returns(z.void())
        .describe('this is a setParameter function');

      const expected = {
        description: 'this is a setParameter function',
        name: 'setParameterFunction',
        parameters: {
          type: types.Type.OBJECT,
          properties: {
            numberField: {
              type: types.Type.NUMBER,
              minimum: 0,
              maximum: 100,
              description: 'this is a number field',
            },
            stringEnumField: {
              type: types.Type.STRING,
              enum: ['daylight', 'cool', 'warm'],
              format: 'enum',
              description: 'this is a string enum field',
            },
            booleanField: {
              type: types.Type.BOOLEAN,
              description: 'this is a boolean field',
            },
            optionalField: {
              type: types.Type.STRING,
              description: 'this is an optional field',
            },
          },
          required: ['numberField', 'stringEnumField', 'booleanField'],
        },
      };
      expect(
        functionDeclarationFromZodFunction({
          name: 'setParameterFunction',
          zodFunctionSchema: setParameterFunction,
        }),
      ).toEqual(expected);
    });
    it('should process function with parameters that only have optional fields and return value to void', () => {
      const setParameter = z.object({
        numberField: z
          .number()
          .min(0)
          .max(100)
          .optional()
          .describe('this is a number field'),
        stringEnumField: z
          .enum(['daylight', 'cool', 'warm'])
          .optional()
          .describe('this is a string enum field'),
        booleanField: z
          .boolean()
          .optional()
          .describe('this is a boolean field'),
        optionalField: z
          .string()
          .optional()
          .describe('this is an optional field'),
      });

      const setParameterFunction = z
        .function()
        .args(setParameter)
        .returns(z.void())
        .describe('this is a setParameter function');

      const expected = {
        description: 'this is a setParameter function',
        name: 'setParameterFunction',
        parameters: {
          type: types.Type.OBJECT,
          properties: {
            numberField: {
              type: types.Type.NUMBER,
              minimum: 0,
              maximum: 100,
              description: 'this is a number field',
            },
            stringEnumField: {
              type: types.Type.STRING,
              enum: ['daylight', 'cool', 'warm'],
              format: 'enum',
              description: 'this is a string enum field',
            },
            booleanField: {
              type: types.Type.BOOLEAN,
              description: 'this is a boolean field',
            },
            optionalField: {
              type: types.Type.STRING,
              description: 'this is an optional field',
            },
          },
        },
      };
      expect(
        functionDeclarationFromZodFunction({
          name: 'setParameterFunction',
          zodFunctionSchema: setParameterFunction,
        }),
      ).toEqual(expected);
    });
    it('should throw error when the parameter is zod optional', () => {
      const setParameter = z
        .object({
          numberField: z
            .number()
            .min(0)
            .max(100)
            .describe('this is a number field'),
          stringEnumField: z
            .enum(['daylight', 'cool', 'warm'])
            .describe('this is a string enum field'),
          booleanField: z.boolean().describe('this is a boolean field'),
          optionalField: z
            .string()
            .optional()
            .describe('this is an optional field'),
        })
        .optional();
      const setParameterFunction = z
        .function()
        .args(setParameter)
        .returns(z.void())
        .describe('this is a setParameter function');
      expect(() => {
        functionDeclarationFromZodFunction({
          name: 'setParameterFunction',
          zodFunctionSchema: setParameterFunction,
        });
      }).toThrowError(
        'Supllying only optional parameter is not supported at the moment. You can make all the fields inside the parameter object as optional.',
      );
    });
    it('should throw error when the parameter is more than one', () => {
      const setParameter = z.object({
        numberField: z
          .number()
          .min(0)
          .max(100)
          .describe('this is a number field'),
        stringEnumField: z
          .enum(['daylight', 'cool', 'warm'])
          .describe('this is a string enum field'),
        booleanField: z.boolean().describe('this is a boolean field'),
        optionalField: z
          .string()
          .optional()
          .describe('this is an optional field'),
      });
      const setParameterFunction = z
        .function()
        .args(setParameter, z.string())
        .returns(z.void())
        .describe('this is a setParameter function');
      expect(() => {
        functionDeclarationFromZodFunction({
          name: 'setParameterFunction',
          zodFunctionSchema: setParameterFunction,
        });
      }).toThrowError(
        'Multiple positional parameters are not supported at the moment. Function parameters must be defined using a single object with named properties.',
      );
    });
  });
  describe('schemaFromJson can convert raw json schema to Schema', () => {
    it('should process simple json schema', () => {
      const rawJsonSchema = {
        'type': 'string',
        'pattern': '^[a-zA-Z]{1,10}$',
      };
      const expected = {
        type: types.Type.STRING,
        pattern: '^[a-zA-Z]{1,10}$',
      };
      expect(schemaFromJson(rawJsonSchema)).toEqual(expected);
    });
    it('should process simple object schema', () => {
      const rawJsonSchema = {
        type: 'object',
        properties: {
          unionPrimitivesField: {
            anyOf: [
              {type: 'string', pattern: '^[a-zA-Z]{1,10}$'},
              {type: 'number'},
            ],
          },
        },
        required: ['unionPrimitivesField'],
      };
      const expected = {
        type: types.Type.OBJECT,
        properties: {
          unionPrimitivesField: {
            anyOf: [
              {
                type: types.Type.STRING,
                pattern: '^[a-zA-Z]{1,10}$',
              },
              {
                type: types.Type.NUMBER,
              },
            ],
          },
        },
        required: ['unionPrimitivesField'],
      };
      expect(schemaFromJson(rawJsonSchema)).toEqual(expected);
    });
    it('should process type filed with array of types, and null type', () => {
      const rawJsonSchema = {
        type: 'object',
        properties: {
          unionPrimitivesField: {type: ['string', 'number', 'null']},
        },
        required: ['unionPrimitivesField'],
        additionalProperties: false,
      };
      const expected = {
        type: types.Type.OBJECT,
        properties: {
          unionPrimitivesField: {
            anyOf: [
              {
                type: types.Type.STRING,
              },
              {
                type: types.Type.NUMBER,
              },
            ],
            nullable: true,
          },
        },
        required: ['unionPrimitivesField'],
      };
      expect(schemaFromJson(rawJsonSchema)).toEqual(expected);
    });
  });
  describe('schemaFromJson can convert raw json schema to Schema', () => {
    it('should process simple json schema', () => {
      const rawJsonSchema = {
        'type': 'string',
        'pattern': '^[a-zA-Z]{1,10}$',
      };
      const expected = {
        type: types.Type.STRING,
        pattern: '^[a-zA-Z]{1,10}$',
      };
      expect(schemaFromJson(rawJsonSchema)).toEqual(expected);
    });
    it('should process simple object schema', () => {
      const rawJsonSchema = {
        type: 'object',
        properties: {
          unionPrimitivesField: {
            anyOf: [
              {type: 'string', pattern: '^[a-zA-Z]{1,10}$'},
              {type: 'number'},
            ],
          },
        },
        required: ['unionPrimitivesField'],
      };
      const expected = {
        type: types.Type.OBJECT,
        properties: {
          unionPrimitivesField: {
            anyOf: [
              {
                type: types.Type.STRING,
                pattern: '^[a-zA-Z]{1,10}$',
              },
              {
                type: types.Type.NUMBER,
              },
            ],
          },
        },
        required: ['unionPrimitivesField'],
      };
      expect(schemaFromJson(rawJsonSchema)).toEqual(expected);
    });
    it('should process type filed with array of types, and null type', () => {
      const rawJsonSchema = {
        type: 'object',
        properties: {
          unionPrimitivesField: {type: ['string', 'number', 'null']},
        },
        required: ['unionPrimitivesField'],
        additionalProperties: false,
      };
      const expected = {
        type: types.Type.OBJECT,
        properties: {
          unionPrimitivesField: {
            anyOf: [
              {
                type: types.Type.STRING,
              },
              {
                type: types.Type.NUMBER,
              },
            ],
            nullable: true,
          },
        },
        required: ['unionPrimitivesField'],
      };
      expect(schemaFromJson(rawJsonSchema)).toEqual(expected);
    });
  });
});
