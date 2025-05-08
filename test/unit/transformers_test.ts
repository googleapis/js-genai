/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiClient} from '../../src/_api_client';
import {
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
} from '../../src/_transformers';
import {CrossDownloader} from '../../src/cross/_cross_downloader';
import {CrossUploader} from '../../src/cross/_cross_uploader';
import * as types from '../../src/types';
import {FakeAuth} from '../_fake_auth';

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
  it('no change', () => {
    const tool = {functionDeclarations: [{name: 'function-name'}]};
    expect(
      tTool(
        new ApiClient({
          auth: new FakeAuth(),
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        }),
        tool,
      ),
    ).toEqual(tool);
  });
});

describe('tSchema', () => {
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
      type: 'OBJECT',
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
