/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiClient} from '../../src/_api_client.js';
import {
  isSchema,
  tContent,
  tContents,
  tExtractModels,
  tFileName,
  tModel,
  tModelsUrl,
  tPart,
  tParts,
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
    const response = {};
    expect(tExtractModels(response)).toEqual([]);
  });

  it('should return models array when models field exists', () => {
    const models = [{name: 'model1'}, {name: 'model2'}];
    const response = {models};
    expect(tExtractModels(response)).toEqual(models);
  });

  it('should return tunedModels array when tunedModels field exists', () => {
    const tunedModels = [{name: 'tunedModel1'}, {name: 'tunedModel2'}];
    const response = {tunedModels};
    expect(tExtractModels(response)).toEqual(tunedModels);
  });

  it('should return publisherModels array when publisherModels field exists', () => {
    const publisherModels = [
      {name: 'publisherModel1'},
      {name: 'publisherModel2'},
    ];
    const response = {publisherModels};
    expect(tExtractModels(response)).toEqual(publisherModels);
  });

  it('should prioritize models field if multiple fields exist', () => {
    const models = [{name: 'model1'}, {name: 'model2'}];
    const tunedModels = [{name: 'tunedModel1'}, {name: 'tunedModel2'}];
    const response = {models, tunedModels};
    expect(tExtractModels(response)).toEqual(models);
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
    expect(tSpeechConfig('voice-name')).toEqual(speechConfig);
  });
});

describe('tTool', () => {
  it('no change', () => {
    const tool = {functionDeclarations: [{name: 'function-name'}]};
    expect(tTool(tool)).toEqual(tool);
  });
});

describe('tTools', () => {
  it('no change', () => {
    const tools = [{functionDeclarations: [{name: 'function-name'}]}];
    expect(tTools(tools)).toEqual(tools);
  });
  it('null', () => {
    expect(() => {
      tTools(null);
    }).toThrowError('tools is required');
  });
  it('undefined', () => {
    expect(() => {
      tTools(undefined);
    }).toThrowError('tools is required');
  });
  it('empty array', () => {
    expect(tTools([])).toEqual([]);
  });
  it('non array', () => {
    expect(() => {
      tTools({});
    }).toThrowError('tools is required and must be an array of Tools');
  });
});
describe('isSchema', () => {
  describe('Valid Schemas', () => {
    it('should return true for an empty object', () => {
      expect(isSchema({})).toBe(true);
    });

    it('should return true for a valid schema ', () => {
      const validComprehensiveSchema = {
        type: types.Type.OBJECT,
        title: 'Comprehensive User Profile',
        description:
          'A detailed schema for a user profile, demonstrating all possible fields.',
        nullable: true,
        default: null,
        example: 'some examples',
        properties: {
          stringField: {
            type: types.Type.STRING,
            description: 'User full name.',
            format: 'email',
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
            minLength: '5',
            maxLength: '100',
          },
          integerField: {
            type: types.Type.INTEGER,
            description: "User's age in years.",
            minimum: 18,
            maximum: 99,
          },
          arrayField: {
            type: types.Type.ARRAY,
            items: {
              type: types.Type.STRING,
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
            },
            minItems: '1',
            maxItems: '20',
          },
          enumField: {
            type: types.Type.STRING,
            enum: ['ADMIN', 'EDITOR', 'VIEWER'],
          },
          anyOfField: {
            type: types.Type.STRING,
            anyOf: [
              {
                type: types.Type.STRING,
                minLength: '1',
                maxLength: '100',
              },
              {
                type: types.Type.OBJECT,
                properties: {
                  nestedStringField: {type: types.Type.STRING},
                  nestedIntegerField: {type: types.Type.INTEGER},
                },
                required: ['nestedStringField'],
              },
            ],
          },
        },
        required: ['stringField', 'arrayField', 'enumField', 'anyOfField'],
        propertyOrdering: [
          'stringField',
          'integerField',
          'enumField',
          'arrayField',
          'anyOfField',
        ],
        minProperties: '2',
        maxProperties: '10',
      };
      expect(isSchema(validComprehensiveSchema)).toBe(true);
    });

    it('should return true for a complex, deeply nested valid schema', () => {
      const complexSchema = {
        type: types.Type.OBJECT,
        properties: {
          user: {
            type: types.Type.OBJECT,
            properties: {
              name: {type: types.Type.STRING, description: 'User name'},
              tags: {
                type: types.Type.ARRAY,
                items: {type: types.Type.STRING, minLength: '1'},
              },
            },
            required: ['name'],
          },
        },
      };
      expect(isSchema(complexSchema)).toBe(true);
    });
  });
  describe('Invalid Schemas', () => {
    it('should return false for deep nested schema with non recongnzied key', () => {
      const invalidSchemaWithUnrecognizedKey = {
        type: types.Type.OBJECT,
        properties: {
          nestedObject: {
            type: types.Type.OBJECT,
            properties: {
              doubleNestedObject: {
                type: types.Type.STRING,
                notRealField: 'not real',
              },
            },
            required: ['doubleNestedObject'],
          },
        },
      };
      expect(isSchema(invalidSchemaWithUnrecognizedKey)).toBe(false);
    });
    it('should return false data type mismatch (string) for deep nested schema', () => {
      const invalidSchemaWithWrongType = {
        type: types.Type.OBJECT,
        properties: {
          nestedObject: {
            type: types.Type.OBJECT,
            properties: {
              doubleNestedObject: {
                type: types.Type.STRING,
                // this should be a string
                pattern: 15,
              },
            },
            required: ['doubleNestedObject'],
          },
        },
      };
      expect(isSchema(invalidSchemaWithWrongType)).toBe(false);
    });
    it('should return false data type mismatch (number) for deep nested schema', () => {
      const invalidSchemaWithWrongType = {
        type: types.Type.OBJECT,
        properties: {
          nestedObject: {
            type: types.Type.OBJECT,
            properties: {
              doubleNestedObject: {
                type: types.Type.NUMBER,
                // this should be a string
                minimum: '15',
              },
            },
            required: ['doubleNestedObject'],
          },
        },
      };
      expect(isSchema(invalidSchemaWithWrongType)).toBe(false);
    });
    it('should return false for deep nested lower case string type', () => {
      const invalidSchemaWithLowerCaseType = {
        type: types.Type.OBJECT,
        properties: {
          nestedObject: {
            type: types.Type.OBJECT,
            properties: {
              doubleNestedObject: {
                // this should be a upper case
                type: 'string',
              },
            },
            required: ['doubleNestedObject'],
          },
        },
      };
      expect(isSchema(invalidSchemaWithLowerCaseType)).toBe(false);
    });
    it('should return false for deep nested arrays in type', () => {
      const invalidSchemaWithArrayInType = {
        type: types.Type.OBJECT,
        properties: {
          nestedObject: {
            type: types.Type.OBJECT,
            properties: {
              doubleNestedObject: {
                // type can not be an array for type.Schema
                type: ['string', 'number'],
              },
            },
            required: ['doubleNestedObject'],
          },
        },
      };
      expect(isSchema(invalidSchemaWithArrayInType)).toBe(false);
    });
    it('should return false for one anyOf field is not valid schema', () => {
      const invalidSchemaInAnyOf = {
        anyOf: [
          {
            type: types.Type.STRING,
            minLength: '1',
            maxLength: '100',
          },
          {
            type: types.Type.OBJECT,
            properties: {
              nestedStringField: {type: types.Type.STRING},
              nestedIntegerField: {type: types.Type.INTEGER},
            },
            required: ['nestedStringField'],
          },
          {
            type: types.Type.STRING,
            // this should be a valid schema
            notRealField: 'not real',
          },
        ],
      };
      expect(isSchema(invalidSchemaInAnyOf)).toBe(false);
    });
  });
  it('should return false for one property field is not valid schema', () => {
    const invalidSchemaInProperties = {
      type: types.Type.OBJECT,
      properties: {
        validField: {
          type: types.Type.STRING,
          minLength: '1',
          maxLength: '100',
        },
        invalidField: {
          type: types.Type.STRING,
          // this should be a valid schema
          notRealField: 'not real',
        },
      },
    };
    expect(isSchema(invalidSchemaInProperties)).toBe(false);
  });
});
describe('tPart', () => {
  it('null', () => {
    expect(() => {
      tPart(null);
    }).toThrowError('PartUnion is required');
  });

  it('undefined', () => {
    expect(() => {
      tPart(undefined);
    }).toThrowError('PartUnion is required');
  });

  it('string', () => {
    expect(tPart('test string')).toEqual({text: 'test string'});
  });

  it('part object', () => {
    expect(tPart({text: 'test string'})).toEqual({text: 'test string'});
  });

  it('int', () => {
    expect(() => {
      tPart(
        // @ts-expect-error: escaping to test unsupported type
        123,
      );
    }).toThrowError('Unsupported part type: number');
  });
});

describe('tParts', () => {
  it('null', () => {
    expect(() => {
      tParts(null);
    }).toThrowError('PartListUnion is required');
  });

  it('undefined', () => {
    expect(() => {
      tParts(undefined);
    }).toThrowError('PartListUnion is required');
  });

  it('empty array', () => {
    expect(() => {
      tParts([]);
    }).toThrowError('PartListUnion is required');
  });

  it('string array', () => {
    expect(tParts(['test string 1', 'test string 2'])).toEqual([
      {text: 'test string 1'},
      {text: 'test string 2'},
    ]);
  });

  it('string and part object', () => {
    expect(tParts(['test string 1', {text: 'test string 2'}])).toEqual([
      {text: 'test string 1'},
      {text: 'test string 2'},
    ]);
  });

  it('int', () => {
    expect(() => {
      tParts(
        // @ts-expect-error: escaping to test unsupported type
        123,
      );
    }).toThrowError('Unsupported part type: number');
  });

  it('int in array', () => {
    expect(() => {
      tParts(
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
        // @ts-expect-error: escaping to test unsupported type
        null,
      );
    }).toThrowError('ContentUnion is required');
  });

  it('undefined', () => {
    expect(() => {
      tContent(undefined);
    }).toThrowError('ContentUnion is required');
  });

  it('empty array', () => {
    expect(() => {
      tContent([]);
    }).toThrowError('PartListUnion is required');
  });

  it('number', () => {
    expect(() => {
      tContent(
        // @ts-expect-error: escaping to test unsupported type
        123,
      );
    }).toThrowError('Unsupported part type: number');
  });

  it('text part', () => {
    expect(tContent({text: 'test string'})).toEqual({
      role: 'user',
      parts: [{text: 'test string'}],
    });
  });

  it('content', () => {
    expect(
      tContent({
        role: 'user',
        parts: [{text: 'test string'}],
      }),
    ).toEqual({role: 'user', parts: [{text: 'test string'}]});
  });

  it('string', () => {
    expect(tContent('test string')).toEqual({
      role: 'user',
      parts: [{text: 'test string'}],
    });
  });
});

describe('tContents', () => {
  it('null', () => {
    expect(() => {
      tContents(
        // @ts-expect-error: escaping to test error
        null,
      );
    }).toThrowError('contents are required');
  });

  it('undefined', () => {
    expect(() => {
      tContents(undefined);
    }).toThrowError('contents are required');
  });

  it('empty array', () => {
    expect(() => {
      tContents([]);
    }).toThrowError('contents are required');
  });

  it('content', () => {
    expect(
      tContents({
        role: 'user',
        parts: [{text: 'test string'}],
      }),
    ).toEqual([{role: 'user', parts: [{text: 'test string'}]}]);
  });

  it('text part', () => {
    expect(tContents({text: 'test string'})).toEqual([
      {role: 'user', parts: [{text: 'test string'}]},
    ]);
  });

  it('function call part', () => {
    expect(() => {
      tContents({
        functionCall: {name: 'function-name', args: {arg1: 'arg1'}},
      });
    }).toThrowError(
      'To specify functionCall or functionResponse parts, please wrap them in a Content object, specifying the role for them',
    );
  });

  it('function call part in array', () => {
    expect(() => {
      tContents([
        {
          functionCall: {name: 'function-name', args: {arg1: 'arg1'}},
        },
        {text: 'test string'},
      ]);
    }).toThrowError(
      'To specify functionCall or functionResponse parts, please wrap them, and any other parts, in Content objects as appropriate, specifying the role for them',
    );
  });

  it('function response part', () => {
    expect(() => {
      tContents({
        functionResponse: {
          name: 'name1',
          response: {result: {answer: 'answer1'}},
        },
      });
    }).toThrowError(
      'To specify functionCall or functionResponse parts, please wrap them in a Content object, specifying the role for them',
    );
  });

  it('function response part in array', () => {
    expect(() => {
      tContents([
        {
          functionResponse: {
            name: 'name1',
            response: {result: {answer: 'answer1'}},
          },
        },
        {text: 'test string'},
      ]);
    }).toThrowError(
      'To specify functionCall or functionResponse parts, please wrap them, and any other parts, in Content objects as appropriate, specifying the role for them',
    );
  });

  it('string', () => {
    expect(tContents('test string')).toEqual([
      {role: 'user', parts: [{text: 'test string'}]},
    ]);
  });

  it('array of contents', () => {
    expect(
      tContents([
        {role: 'user', parts: [{text: 'test string 1'}]},
        {role: 'model', parts: [{text: 'test string 2'}]},
      ]),
    ).toEqual([
      {role: 'user', parts: [{text: 'test string 1'}]},
      {role: 'model', parts: [{text: 'test string 2'}]},
    ]);
  });

  it('array of text parts', () => {
    expect(
      tContents([{text: 'test string 1'}, {text: 'test string 2'}]),
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
    expect(tFileName(fileName)).toEqual(fileName);
  });

  it('file starts with files/', () => {
    const fileName = 'test file name';
    const fileNameWithFilesPrefix = `files/${fileName}`;
    expect(tFileName(fileNameWithFilesPrefix)).toEqual(fileName);
  });

  it('video file', () => {
    const fileName = 'filename';
    const fileUri = `https://generativelanguage.googleapis.com/v1beta/files/${
      fileName
    }:download?alt=media`;
    expect(tFileName({uri: fileUri})).toEqual(fileName);
  });
  it('generated video file', () => {
    const fileName = 'filename';
    const fileUri = `https://generativelanguage.googleapis.com/v1beta/files/${
      fileName
    }:download?alt=media`;
    expect(tFileName({video: {uri: fileUri}})).toEqual(fileName);
  });
  it('generated video file with no uri', () => {
    expect(tFileName({video: {uri: undefined}})).toEqual(undefined);
  });
});
