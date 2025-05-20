/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';
import {zodToJsonSchema} from 'zod-to-json-schema';

import {ApiClient} from '../../src/_api_client.js';
import {
  createJsonSchemaValidator,
  tContent,
  tContents,
  tExtractModels,
  tFileName,
  tModel,
  tModelsUrl,
  tPart,
  tParts,
  tSchema,
  tSpeechConfig,
  tTool,
  tTools,
} from '../../src/_transformers.js';
import {CrossDownloader} from '../../src/cross/_cross_downloader.js';
import {CrossUploader} from '../../src/cross/_cross_uploader.js';
import * as types from '../../src/types.js';
import {FakeAuth} from '../_fake_auth.js';

describe('tModel', () => {
  it('empty string', () => {
    expect(() => {
      tModel(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        '',
      );
    }).toThrowError('model is required and must be a string');
  });
  it('returns model name for MLDev starting with models', () => {
    expect(
      tModel(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        'models/gemini-2.0-flash',
      ),
    ).toEqual('models/gemini-2.0-flash');
  });
  it('returns model name for MLDev starting with tunedModels', () => {
    expect(
      tModel(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        'tunedModels/gemini-2.0-flash',
      ),
    ).toEqual('tunedModels/gemini-2.0-flash');
  });
  it('returns model prefix for MLDev', () => {
    expect(
      tModel(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        'gemini-2.0-flash',
      ),
    ).toEqual('models/gemini-2.0-flash');
  });
  it('returns model name for Vertex starting with publishers', () => {
    expect(
      tModel(
        new ApiClient({
          auth: new FakeAuth(),
          vertexai: true,
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        'publishers/gemini-2.0-flash',
      ),
    ).toEqual('publishers/gemini-2.0-flash');
  });
  it('returns model name for Vertex starting with projects', () => {
    expect(
      tModel(
        new ApiClient({
          auth: new FakeAuth(),
          vertexai: true,
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        'projects/gemini-2.0-flash',
      ),
    ).toEqual('projects/gemini-2.0-flash');
  });
  it('returns model name for Vertex starting with models', () => {
    expect(
      tModel(
        new ApiClient({
          auth: new FakeAuth(),
          vertexai: true,
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        'models/gemini-2.0-flash',
      ),
    ).toEqual('models/gemini-2.0-flash');
  });
  it('returns publisher prefix for Vertex with slash', () => {
    expect(
      tModel(
        new ApiClient({
          auth: new FakeAuth(),
          vertexai: true,
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        'google/gemini-2.0-flash',
      ),
    ).toEqual('publishers/google/models/gemini-2.0-flash');
  });
  it('returns publisher prefix for Vertex', () => {
    expect(
      tModel(
        new ApiClient({
          auth: new FakeAuth(),
          vertexai: true,
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        'gemini-2.0-flash',
      ),
    ).toEqual('publishers/google/models/gemini-2.0-flash');
  });
});

describe('tModelsUrl', () => {
  it('should return "publishers/google/models" when baseModels is true and isVertexAI is true', () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      vertexai: true,
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    expect(tModelsUrl(apiClient, true)).toBe('publishers/google/models');
  });

  it('should return "models" when baseModels is true and isVertexAI is false', () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      vertexai: false,
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    expect(tModelsUrl(apiClient, true)).toBe('models');
  });

  it('should return "models" when baseModels is false and isVertexAI is true', () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      vertexai: true,
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    expect(tModelsUrl(apiClient, false)).toBe('models');
  });

  it('should return "tunedModels" when baseModels is false and isVertexAI is false', () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      vertexai: false,
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    expect(tModelsUrl(apiClient, false)).toBe('tunedModels');
  });
});

describe('tExtractModels', () => {
  it('should return empty array when no models, tunedModels, or publisherModels fields exist', () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const response = {};
    expect(tExtractModels(apiClient, response)).toEqual([]);
  });

  it('should return models array when models field exists', () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const models = [{name: 'model1'}, {name: 'model2'}];
    const response = {models};
    expect(tExtractModels(apiClient, response)).toEqual(models);
  });

  it('should return tunedModels array when tunedModels field exists', () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const tunedModels = [{name: 'tunedModel1'}, {name: 'tunedModel2'}];
    const response = {tunedModels};
    expect(tExtractModels(apiClient, response)).toEqual(tunedModels);
  });

  it('should return publisherModels array when publisherModels field exists', () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const publisherModels = [
      {name: 'publisherModel1'},
      {name: 'publisherModel2'},
    ];
    const response = {publisherModels};
    expect(tExtractModels(apiClient, response)).toEqual(publisherModels);
  });

  it('should prioritize models field if multiple fields exist', () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const models = [{name: 'model1'}, {name: 'model2'}];
    const tunedModels = [{name: 'tunedModel1'}, {name: 'tunedModel2'}];
    const response = {models, tunedModels};
    expect(tExtractModels(apiClient, response)).toEqual(models);
  });
});

describe('tSpeechConfig', () => {
  it('string to speechConfig', () => {
    const speechConfig = {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: 'voice-name',
        },
      },
    };
    expect(
      tSpeechConfig(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        'voice-name',
      ),
    ).toEqual(speechConfig);
  });
});

describe('tTool', () => {
  let vertexApiClient: ApiClient;
  let mlDevApiClient: ApiClient;
  beforeEach(() => {
    vertexApiClient = new ApiClient({
      auth: new FakeAuth(),
      vertexai: true,
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    mlDevApiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'apikey-from-opts',
      vertexai: false,
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
  });
  it('no change', () => {
    const tool = {functionDeclarations: [{name: 'function-name'}]};
    expect(tTool(vertexApiClient, tool)).toEqual(tool);
    expect(tTool(mlDevApiClient, tool)).toEqual(tool);
  });
});

describe('createJsonSchemaValidator', () => {
  it('should not throw error when strict mode is disabled for additional properties', () => {
    const setSchema = z.object({setField: z.set(z.string())});
    const validator = createJsonSchemaValidator(false);
    expect(() =>
      validator.parse(zodToJsonSchema(setSchema) as Record<string, unknown>),
    ).not.toThrowError();
  });
  it('should throw error when strict mode is disabled for additional properties', () => {
    const setSchema = z.object({
      setField: z.set(z.string()),
    });
    const validator = createJsonSchemaValidator();
    expect(() =>
      validator.parse(zodToJsonSchema(setSchema) as Record<string, unknown>),
    ).toThrowError();
  });
});

describe('tTools', () => {
  it('no change', () => {
    const tools = [{functionDeclarations: [{name: 'function-name'}]}];
    expect(
      tTools(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        tools,
      ),
    ).toEqual(tools);
  });
  it('null', () => {
    expect(() => {
      tTools(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        null,
      );
    }).toThrowError('tools is required');
  });
  it('undefined', () => {
    expect(() => {
      tTools(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        undefined,
      );
    }).toThrowError('tools is required');
  });
  it('empty array', () => {
    expect(
      tTools(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        [],
      ),
    ).toEqual([]);
  });
  it('non array', () => {
    expect(() => {
      tTools(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        {},
      );
    }).toThrowError('tools is required and must be an array of Tools');
  });
});

describe('tSchema', () => {
  let vertexApiClient: ApiClient;
  let mlDevApiClient: ApiClient;
  beforeEach(() => {
    vertexApiClient = new ApiClient({
      auth: new FakeAuth(),
      vertexai: true,
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    mlDevApiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'apikey-from-opts',
      vertexai: false,
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
  });
  it('no change', () => {
    const schema = {
      title: 'title',
      default: 'default',
    } as types.Schema;
    expect(
      tSchema(
        new ApiClient({
          auth: new FakeAuth(),
          vertexai: true,
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        schema,
      ),
    ).toEqual(schema);
    expect(
      tSchema(
        new ApiClient({
          auth: new FakeAuth(),
          vertexai: false,
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        schema,
      ),
    ).toEqual(schema);
  });
  it('processes anyOf', () => {
    const schema = {
      anyOf: [{type: 'STRING'}, {type: 'NUMBER'}],
    } as types.Schema;
    expect(
      tSchema(
        new ApiClient({
          auth: new FakeAuth(),
          vertexai: true,
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        schema,
      ),
    ).toEqual(schema);
    expect(
      tSchema(
        new ApiClient({
          auth: new FakeAuth(),
          vertexai: false,
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        schema,
      ),
    ).toEqual(schema);
  });
  it('processes items', () => {
    const schema = {
      type: 'OBJECT',
      properties: {
        type: {
          type: 'ARRAY',
          items: {
            type: 'STRING',
          },
        },
      },
    } as types.Schema;
    expect(
      tSchema(
        new ApiClient({
          auth: new FakeAuth(),
          vertexai: true,
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        schema,
      ),
    ).toEqual(schema);
    expect(
      tSchema(
        new ApiClient({
          auth: new FakeAuth(),
          vertexai: false,
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        schema,
      ),
    ).toEqual(schema);
  });
  it('process properties', () => {
    const schema = {
      type: 'OBJECT',
      properties: {
        type: {
          type: 'STRING',
        },
      },
    } as types.Schema;
    expect(
      tSchema(
        new ApiClient({
          auth: new FakeAuth(),
          vertexai: true,
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        schema,
      ),
    ).toEqual(schema);
    expect(
      tSchema(
        new ApiClient({
          auth: new FakeAuth(),
          vertexai: false,
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        schema,
      ),
    ).toEqual(schema);
  });
  it('should throw error for tuple schema due to item field data type mismatch', () => {
    const tupleSchema = z.object({
      tupleField: z.tuple([z.string(), z.number()]),
    });
    expect(() =>
      tSchema(vertexApiClient, zodToJsonSchema(tupleSchema)),
    ).toThrowError();
    expect(() =>
      tSchema(mlDevApiClient, zodToJsonSchema(tupleSchema)),
    ).toThrowError();
  });
  it('should throw error for set schema due to unsupported type(set): uniqueItems', () => {
    const setSchema = z.object({
      setField: z.set(z.string()),
    });
    expect(() =>
      tSchema(vertexApiClient, zodToJsonSchema(setSchema)),
    ).toThrowError();
    expect(() =>
      tSchema(mlDevApiClient, zodToJsonSchema(setSchema)),
    ).toThrowError();
  });
  it('should throw error for nested zod object referred twice due to unsupported property: $ref', () => {
    /*
       The following is the result of zodToJsonSchema(nestedSchema):
       nestedSchema {
         type: 'object',
         properties: {
           simpleString: { type: 'string', description: 'This is a simple
       string' }, simpleInteger: { type: 'integer' }, inner: { type: 'object',
             properties: [Object],
             required: [Array],
             additionalProperties: false
           },
           otherInner: { '$ref': '#/properties/inner' }
         },
         required: [ 'simpleString', 'simpleInteger', 'inner', 'otherInner' ],
         additionalProperties: false,
         '$schema': 'http://json-schema.org/draft-07/schema#'
       }

       If an object is referred twice, the $ref field will be added to the
       schema, which is not supported by our backend.
       */
    const innerObject = z.object({
      innerString: z.string(),
      innerNumber: z.number(),
    });
    const nestedSchema = z.object({
      simpleString: z.string().describe('This is a simple string'),
      simpleInteger: z.number().int(),
      inner: innerObject,
      otherInner: innerObject,
    });
    expect(() =>
      tSchema(vertexApiClient, zodToJsonSchema(nestedSchema)),
    ).toThrowError();
    expect(() =>
      tSchema(mlDevApiClient, zodToJsonSchema(nestedSchema)),
    ).toThrowError();
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
    expect(tSchema(vertexApiClient, zodToJsonSchema(zodSchema))).toEqual(
      expected,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(zodSchema))).toEqual(
      expected,
    );
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
    expect(tSchema(vertexApiClient, zodToJsonSchema(nestedSchema))).toEqual(
      expected,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(nestedSchema))).toEqual(
      expected,
    );
  });
  it('should process propertyOrdering', () => {
    const objectWithPropertyOrdering = z.object({
      simpleString: z.string(),
      simpleObject: z.object({
        innerString: z.string(),
        anotherInnerString: z.string(),
      }),
    });
    const jsonSchemaFromZod = zodToJsonSchema(
      objectWithPropertyOrdering,
    ) as Record<string, unknown>;

    jsonSchemaFromZod['propertyOrdering'] = ['simpleObject', 'simpleString'];

    const expected = {
      type: types.Type.OBJECT,
      properties: {
        simpleString: {
          type: types.Type.STRING,
        },
        simpleObject: {
          type: types.Type.OBJECT,
          properties: {
            innerString: {
              type: types.Type.STRING,
            },
            anotherInnerString: {
              type: types.Type.STRING,
            },
          },
          required: ['innerString', 'anotherInnerString'],
        },
      },
      required: ['simpleString', 'simpleObject'],
      propertyOrdering: ['simpleObject', 'simpleString'],
    };

    expect(tSchema(vertexApiClient, jsonSchemaFromZod)).toEqual(expected);
    expect(tSchema(mlDevApiClient, jsonSchemaFromZod)).toEqual(expected);
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
    expect(tSchema(vertexApiClient, zodToJsonSchema(stringDirectly))).toEqual(
      expectedStringDirectly,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(stringDirectly))).toEqual(
      expectedStringDirectly,
    );

    const expectedNumberDirectly = {
      type: types.Type.NUMBER,
      minimum: 1,
      maximum: 10,
      description: 'This is a simple number',
    };
    expect(tSchema(vertexApiClient, zodToJsonSchema(numberDirectly))).toEqual(
      expectedNumberDirectly,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(numberDirectly))).toEqual(
      expectedNumberDirectly,
    );
    const expectedIntegerDirectly = {
      type: types.Type.INTEGER,
      format: 'int64',
      description: 'This is a simple integer',
    };
    expect(tSchema(vertexApiClient, zodToJsonSchema(integerDirectly))).toEqual(
      expectedIntegerDirectly,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(integerDirectly))).toEqual(
      expectedIntegerDirectly,
    );

    const expectedBooleanDirectly = {
      type: types.Type.BOOLEAN,
      description: 'This is a simple boolean',
    };
    expect(tSchema(vertexApiClient, zodToJsonSchema(booleanDirectly))).toEqual(
      expectedBooleanDirectly,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(booleanDirectly))).toEqual(
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

    expect(tSchema(vertexApiClient, zodToJsonSchema(zodSchema))).toEqual(
      expected,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(zodSchema))).toEqual(
      expected,
    );
  });
  it('should process zod array of objects', () => {
    const innerObject = z.object({
      simpleString: z.string(),
      anotherString: z.string(),
    });
    const objectArray = z.object({
      arrayOfObjects: z.array(innerObject),
    });

    const expected = {
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
              anotherString: {
                type: types.Type.STRING,
              },
            },
            required: ['simpleString', 'anotherString'],
          },
        },
      },
      required: ['arrayOfObjects'],
    };
    expect(tSchema(vertexApiClient, zodToJsonSchema(objectArray))).toEqual(
      expected,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(objectArray))).toEqual(
      expected,
    );
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
    expect(tSchema(vertexApiClient, zodToJsonSchema(defaultObject))).toEqual(
      expected,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(defaultObject))).toEqual(
      expected,
    );
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
    expect(tSchema(vertexApiClient, zodToJsonSchema(objectNullable))).toEqual(
      expected,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(objectNullable))).toEqual(
      expected,
    );
  });
  it('should throw error when there is only null in the type', () => {
    const objectNullable = z.object({
      nullValue: z.null(),
    });

    expect(() =>
      tSchema(vertexApiClient, zodToJsonSchema(objectNullable)),
    ).toThrowError(
      'type: null can not be the only possible type for the field.',
    );
    expect(() =>
      tSchema(mlDevApiClient, zodToJsonSchema(objectNullable)),
    ).toThrowError(
      'type: null can not be the only possible type for the field.',
    );
  });
  it('should process nullable array and remove anyOf field when necessary', () => {
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
    expect(tSchema(vertexApiClient, zodToJsonSchema(nullableArray))).toEqual(
      expected,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(nullableArray))).toEqual(
      expected,
    );
  });
  it('should process nullable object and remove anyOf field when necessary', () => {
    /*
          Resulted JSONSchema:
          {
            type: 'object',
            properties: {
              nullableObject:{
                anyOf: [
                  { type: 'object', properties: { simpleString: { type: 'string'
          } } }, { type: 'null' }
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
    expect(tSchema(vertexApiClient, zodToJsonSchema(objectNullable))).toEqual(
      expected,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(objectNullable))).toEqual(
      expected,
    );
  });
  it('should process union consist of only not-nullable primitive types without additional fields', () => {
    /*
       Resulted JSONSchema:
       {
         type: 'object',
         properties: {
           unionPrimitivesField: { type: [string, number, boolean]}
         },
         required: [ 'unionPrimitivesField' ],
         additionalProperties: false
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
    expect(tSchema(vertexApiClient, zodToJsonSchema(unionPrimitives))).toEqual(
      expected,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(unionPrimitives))).toEqual(
      expected,
    );
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
    expect(tSchema(vertexApiClient, zodToJsonSchema(unionPrimitives))).toEqual(
      expected,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(unionPrimitives))).toEqual(
      expected,
    );
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
    expect(tSchema(vertexApiClient, zodToJsonSchema(unionPrimitives))).toEqual(
      expected,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(unionPrimitives))).toEqual(
      expected,
    );
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
    expect(tSchema(vertexApiClient, zodToJsonSchema(unionPrimitives))).toEqual(
      expected,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(unionPrimitives))).toEqual(
      expected,
    );
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
    expect(tSchema(vertexApiClient, zodToJsonSchema(unionPrimitives))).toEqual(
      expected,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(unionPrimitives))).toEqual(
      expected,
    );
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
    expect(tSchema(vertexApiClient, zodToJsonSchema(unionPrimitives))).toEqual(
      expected,
    );
    expect(tSchema(mlDevApiClient, zodToJsonSchema(unionPrimitives))).toEqual(
      expected,
    );
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
    expect(
      tSchema(vertexApiClient, zodToJsonSchema(unionPrimitivesAndObjects)),
    ).toEqual(expected);
    expect(
      tSchema(mlDevApiClient, zodToJsonSchema(unionPrimitivesAndObjects)),
    ).toEqual(expected);
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
    expect(
      tSchema(vertexApiClient, zodToJsonSchema(uninonArrayAndObjects)),
    ).toEqual(expected);
    expect(
      tSchema(mlDevApiClient, zodToJsonSchema(uninonArrayAndObjects)),
    ).toEqual(expected);
  });
});

describe('tPart', () => {
  it('null', () => {
    expect(() => {
      tPart(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        null,
      );
    }).toThrowError('PartUnion is required');
  });

  it('undefined', () => {
    expect(() => {
      tPart(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        undefined,
      );
    }).toThrowError('PartUnion is required');
  });

  it('string', () => {
    expect(
      tPart(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        'test string',
      ),
    ).toEqual({text: 'test string'});
  });

  it('part object', () => {
    expect(
      tPart(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        {text: 'test string'},
      ),
    ).toEqual({text: 'test string'});
  });

  it('int', () => {
    expect(() => {
      tPart(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        // @ts-expect-error: escaping to test unsupported type
        123,
      );
    }).toThrowError('Unsupported part type: number');
  });
});

describe('tParts', () => {
  it('null', () => {
    expect(() => {
      tParts(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        null,
      );
    }).toThrowError('PartListUnion is required');
  });

  it('undefined', () => {
    expect(() => {
      tParts(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        undefined,
      );
    }).toThrowError('PartListUnion is required');
  });

  it('empty array', () => {
    expect(() => {
      tParts(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        [],
      );
    }).toThrowError('PartListUnion is required');
  });

  it('string array', () => {
    expect(
      tParts(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        ['test string 1', 'test string 2'],
      ),
    ).toEqual([{text: 'test string 1'}, {text: 'test string 2'}]);
  });

  it('string and part object', () => {
    expect(
      tParts(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        ['test string 1', {text: 'test string 2'}],
      ),
    ).toEqual([{text: 'test string 1'}, {text: 'test string 2'}]);
  });

  it('int', () => {
    expect(() => {
      tParts(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        // @ts-expect-error: escaping to test unsupported type
        123,
      );
    }).toThrowError('Unsupported part type: number');
  });

  it('int in array', () => {
    expect(() => {
      tParts(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        // @ts-expect-error: escaping to test unsupported type
        [123],
      );
    }).toThrowError('Unsupported part type: number');
  });
});

describe('tContent', () => {
  it('null', () => {
    expect(() => {
      tContent(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        // @ts-expect-error: escaping to test unsupported type
        null,
      );
    }).toThrowError('ContentUnion is required');
  });

  it('undefined', () => {
    expect(() => {
      tContent(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        undefined,
      );
    }).toThrowError('ContentUnion is required');
  });

  it('empty array', () => {
    expect(() => {
      tContent(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        [],
      );
    }).toThrowError('PartListUnion is required');
  });

  it('number', () => {
    expect(() => {
      tContent(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        // @ts-expect-error: escaping to test unsupported type
        123,
      );
    }).toThrowError('Unsupported part type: number');
  });

  it('text part', () => {
    expect(
      tContent(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        {text: 'test string'},
      ),
    ).toEqual({role: 'user', parts: [{text: 'test string'}]});
  });

  it('content', () => {
    expect(
      tContent(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        {
          role: 'user',
          parts: [{text: 'test string'}],
        },
      ),
    ).toEqual({role: 'user', parts: [{text: 'test string'}]});
  });

  it('string', () => {
    expect(
      tContent(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        'test string',
      ),
    ).toEqual({role: 'user', parts: [{text: 'test string'}]});
  });
});

describe('tContents', () => {
  it('null', () => {
    expect(() => {
      tContents(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        // @ts-expect-error: escaping to test error
        null,
      );
    }).toThrowError('contents are required');
  });

  it('undefined', () => {
    expect(() => {
      tContents(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        undefined,
      );
    }).toThrowError('contents are required');
  });

  it('empty array', () => {
    expect(() => {
      tContents(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        [],
      );
    }).toThrowError('contents are required');
  });

  it('content', () => {
    expect(
      tContents(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        {
          role: 'user',
          parts: [{text: 'test string'}],
        },
      ),
    ).toEqual([{role: 'user', parts: [{text: 'test string'}]}]);
  });

  it('text part', () => {
    expect(
      tContents(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        {text: 'test string'},
      ),
    ).toEqual([{role: 'user', parts: [{text: 'test string'}]}]);
  });

  it('function call part', () => {
    expect(() => {
      tContents(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        {
          functionCall: {name: 'function-name', args: {arg1: 'arg1'}},
        },
      );
    }).toThrowError(
      'To specify functionCall or functionResponse parts, please wrap them in a Content object, specifying the role for them',
    );
  });

  it('function call part in array', () => {
    expect(() => {
      tContents(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        [
          {
            functionCall: {name: 'function-name', args: {arg1: 'arg1'}},
          },
          {text: 'test string'},
        ],
      );
    }).toThrowError(
      'To specify functionCall or functionResponse parts, please wrap them, and any other parts, in Content objects as appropriate, specifying the role for them',
    );
  });

  it('function response part', () => {
    expect(() => {
      tContents(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        {
          functionResponse: {
            name: 'name1',
            response: {result: {answer: 'answer1'}},
          },
        },
      );
    }).toThrowError(
      'To specify functionCall or functionResponse parts, please wrap them in a Content object, specifying the role for them',
    );
  });

  it('function response part in array', () => {
    expect(() => {
      tContents(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        [
          {
            functionResponse: {
              name: 'name1',
              response: {result: {answer: 'answer1'}},
            },
          },
          {text: 'test string'},
        ],
      );
    }).toThrowError(
      'To specify functionCall or functionResponse parts, please wrap them, and any other parts, in Content objects as appropriate, specifying the role for them',
    );
  });

  it('string', () => {
    expect(
      tContents(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        'test string',
      ),
    ).toEqual([{role: 'user', parts: [{text: 'test string'}]}]);
  });

  it('array of contents', () => {
    expect(
      tContents(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        [
          {role: 'user', parts: [{text: 'test string 1'}]},
          {role: 'model', parts: [{text: 'test string 2'}]},
        ],
      ),
    ).toEqual([
      {role: 'user', parts: [{text: 'test string 1'}]},
      {role: 'model', parts: [{text: 'test string 2'}]},
    ]);
  });

  it('array of text parts', () => {
    expect(
      tContents(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        [{text: 'test string 1'}, {text: 'test string 2'}],
      ),
    ).toEqual([
      {
        role: 'user',
        parts: [{text: 'test string 1'}, {text: 'test string 2'}],
      },
    ]);
  });
});

describe('tFileName', () => {
  it('no change', () => {
    const fileName = 'test file name';
    expect(
      tFileName(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        fileName,
      ),
    ).toEqual(fileName);
  });

  it('file starts with files/', () => {
    const fileName = 'test file name';
    const fileNameWithFilesPrefix = `files/${fileName}`;
    expect(
      tFileName(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        fileNameWithFilesPrefix,
      ),
    ).toEqual(fileName);
  });

  it('video file', () => {
    const fileName = 'filename';
    const fileUri = `https://generativelanguage.googleapis.com/v1beta/files/${
      fileName
    }:download?alt=media`;
    expect(
      tFileName(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        {uri: fileUri},
      ),
    ).toEqual(fileName);
  });
  it('generated video file', () => {
    const fileName = 'filename';
    const fileUri = `https://generativelanguage.googleapis.com/v1beta/files/${
      fileName
    }:download?alt=media`;
    expect(
      tFileName(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        {video: {uri: fileUri}},
      ),
    ).toEqual(fileName);
  });
  it('generated video file with no uri', () => {
    expect(
      tFileName(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        {video: {uri: undefined}},
      ),
    ).toEqual(undefined);
  });
});
