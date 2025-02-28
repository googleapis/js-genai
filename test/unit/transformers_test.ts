/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiClient} from '../../src/_api_client';
import {FakeAuth} from '../../src/_fake_auth';
import {tContent, tContents, tModel, tPart, tParts, tSchema, tSpeechConfig, tTool} from '../../src/_transformers';

describe('tModel', () => {
  it('empty string', () => {
    expect(() => {
      tModel(new ApiClient({auth: new FakeAuth()}), '');
    }).toThrowError('model is required and must be a string');
  });
  it('returns model name for MLDev starting with models', () => {
    expect(
      tModel(
        new ApiClient({auth: new FakeAuth()}),
        'models/gemini-1.5-flash-exp',
      ),
    ).toEqual('models/gemini-1.5-flash-exp');
  });
  it('returns model name for MLDev starting with tunedModels', () => {
    expect(
      tModel(
        new ApiClient({auth: new FakeAuth()}),
        'tunedModels/gemini-1.5-flash-exp',
      ),
    ).toEqual('tunedModels/gemini-1.5-flash-exp');
  });
  it('returns model prefix for MLDev', () => {
    expect(
      tModel(new ApiClient({auth: new FakeAuth()}), 'gemini-1.5-flash-exp'),
    ).toEqual('models/gemini-1.5-flash-exp');
  });
  it('returns model name for Vertex starting with publishers', () => {
    expect(
      tModel(
        new ApiClient({auth: new FakeAuth(), vertexai: true}),
        'publishers/gemini-1.5-flash-exp',
      ),
    ).toEqual('publishers/gemini-1.5-flash-exp');
  });
  it('returns model name for Vertex starting with projects', () => {
    expect(
      tModel(
        new ApiClient({auth: new FakeAuth(), vertexai: true}),
        'projects/gemini-1.5-flash-exp',
      ),
    ).toEqual('projects/gemini-1.5-flash-exp');
  });
  it('returns model name for Vertex starting with models', () => {
    expect(
      tModel(
        new ApiClient({auth: new FakeAuth(), vertexai: true}),
        'models/gemini-1.5-flash-exp',
      ),
    ).toEqual('models/gemini-1.5-flash-exp');
  });
  it('returns publisher prefix for Vertex with slash', () => {
    expect(
      tModel(
        new ApiClient({auth: new FakeAuth(), vertexai: true}),
        'google/gemini-1.5-flash-exp',
      ),
    ).toEqual('publishers/google/models/gemini-1.5-flash-exp');
  });
  it('returns publisher prefix for Vertex', () => {
    expect(
      tModel(
        new ApiClient({auth: new FakeAuth(), vertexai: true}),
        'gemini-1.5-flash-exp',
      ),
    ).toEqual('publishers/google/models/gemini-1.5-flash-exp');
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
      tSpeechConfig(new ApiClient({auth: new FakeAuth()}), 'voice-name'),
    ).toEqual(speechConfig);
  });
});

describe('tTool', () => {
  it('no change', () => {
    const tool = {functionDeclarations: [{name: 'function-name'}]};
    expect(tTool(new ApiClient({auth: new FakeAuth()}), tool)).toEqual(tool);
  });
});

describe('tSchema', () => {
  it('no change', () => {
    const schema = {title: 'title'};
    expect(
      tSchema(new ApiClient({auth: new FakeAuth(), vertexai: true}), schema),
    ).toEqual(schema);
  });
  it('removes title for MLDev', () => {
    const schema = {title: 'title'};
    expect(
      tSchema(new ApiClient({auth: new FakeAuth(), vertexai: false}), schema),
    ).toEqual({});
  });
  it('throws error if default value is present for MLDev', () => {
    const schema = {default: 'default'};
    expect(() => {
      tSchema(new ApiClient({auth: new FakeAuth(), vertexai: false}), schema);
    }).toThrowError(
      'Default value is not supported in the response schema for the Gemini API.',
    );
  });
  it('throws error if anyOf value is present for MLDev', () => {
    const schema = {anyOf: []};
    expect(() => {
      tSchema(new ApiClient({auth: new FakeAuth(), vertexai: false}), schema);
    }).toThrowError(
      'AnyOf is not supported in the response schema for the Gemini API.',
    );
  });
  it('processes anyOf', () => {
    const schema = {
      title: 'title',
      anyOf: [{title: 'subSchemaTitle1'}, {title: 'subSchemaTitle2'}],
    };
    expect(
      tSchema(new ApiClient({auth: new FakeAuth(), vertexai: true}), schema),
    ).toEqual(schema);
  });
});

describe('tPart', () => {
  it('null', () => {
    expect(() => {
      tPart(new ApiClient({auth: new FakeAuth()}), null);
    }).toThrowError('PartUnion is required');
  });

  it('undefined', () => {
    expect(() => {
      tPart(new ApiClient({auth: new FakeAuth()}), undefined);
    }).toThrowError('PartUnion is required');
  });

  it('string', () => {
    expect(
      tPart(new ApiClient({auth: new FakeAuth()}), 'test string'),
    ).toEqual({text: 'test string'});
  });

  it('part object', () => {
    expect(
      tPart(new ApiClient({auth: new FakeAuth()}), {text: 'test string'}),
    ).toEqual({text: 'test string'});
  });

  it('int', () => {
    expect(() => {
      // @ts-expect-error: escaping to test unsupported type
      tPart(new ApiClient({auth: new FakeAuth()}), 123);
    }).toThrowError('Unsupported part type: number');
  });
});

describe('tParts', () => {
  it('null', () => {
    expect(() => {
      tParts(new ApiClient({auth: new FakeAuth()}), null);
    }).toThrowError('PartListUnion is required');
  });

  it('undefined', () => {
    expect(() => {
      tParts(new ApiClient({auth: new FakeAuth()}), undefined);
    }).toThrowError('PartListUnion is required');
  });

  it('empty array', () => {
    expect(() => {
      tParts(new ApiClient({auth: new FakeAuth()}), [])
    }).toThrowError('PartListUnion is required');
  });

  it('string array', () => {
    expect(
      tParts(
        new ApiClient({auth: new FakeAuth()}),
        ['test string 1', 'test string 2'],
      ),
    ).toEqual([{text: 'test string 1'}, {text: 'test string 2'}]);
  });

  it('string and part object', () => {
    expect(
      tParts(
        new ApiClient({auth: new FakeAuth()}),
        ['test string 1', {text: 'test string 2'}],
      ),
    ).toEqual([{text: 'test string 1'}, {text: 'test string 2'}]);
  });

  it('int', () => {
    expect(() => {
      // @ts-expect-error: escaping to test unsupported type
      tParts(new ApiClient({auth: new FakeAuth()}), 123);
    }).toThrowError('Unsupported part type: number');
  });

  it('int in array', () => {
    expect(() => {
      // @ts-expect-error: escaping to test unsupported type
      tParts(new ApiClient({auth: new FakeAuth()}), [123]);
    }).toThrowError('Unsupported part type: number');
  })
});

describe('tContent', () => {
  it('null', () => {
    expect(() => {
      // @ts-expect-error: escaping to test unsupported type
      tContent(new ApiClient({auth: new FakeAuth()}), null);
    }).toThrowError('ContentUnion is required');
  });

  it('undefined', () => {
    expect(() => {
      tContent(new ApiClient({auth: new FakeAuth()}), undefined);
    }).toThrowError('ContentUnion is required');
  });

  it('empty array', () => {
    expect(() => {
      tContent(new ApiClient({auth: new FakeAuth()}), []);
    }).toThrowError('PartListUnion is required');
  });

  it('number', () => {
    expect(() => {
      // @ts-expect-error: escaping to test unsupported type
      tContent(new ApiClient({auth: new FakeAuth()}), 123);
    }).toThrowError('Unsupported part type: number');
  });

  it('function call part', () => {
    expect(
      tContent(new ApiClient({auth: new FakeAuth()}), {functionCall: {name: 'function-name', args: {arg1: 'arg1'}}}),
    ).toEqual({role: 'model', parts: [{functionCall: {name: 'function-name', args: {arg1: 'arg1'}}}]});
  });

  it('text part', () => {
    expect(
      tContent(new ApiClient({auth: new FakeAuth()}), {text: 'test string'}),
    ).toEqual({role: 'user', parts: [{text: 'test string'}]});
  });

  it('content', () => {
    expect(
      tContent(
        new ApiClient({auth: new FakeAuth()}),
        {role: 'user', parts: [{text: 'test string'}]},
      ),
    ).toEqual({role: 'user', parts: [{text: 'test string'}]});
  });

  it('string', () => {
    expect(
      tContent(new ApiClient({auth: new FakeAuth()}), 'test string'),
    ).toEqual({role: 'user', parts: [{text: 'test string'}]});
  });
});

describe('tContents', () => {
  it('null', () => {
    expect(() => {
      // @ts-expect-error: escaping to test error
      tContents(new ApiClient({auth: new FakeAuth()}), null);
    }).toThrowError('contents are required');
  });

  it('undefined', () => {
    expect(() => {
      // @ts-expect-error: escaping to test error
      tContents(new ApiClient({auth: new FakeAuth()}), undefined);
    }).toThrowError('contents are required');
  });

  it('empty array', () => {
    expect(() => {
      tContents(new ApiClient({auth: new FakeAuth()}), []);
    }).toThrowError('contents are required');
  });

  it('content', () => {
    expect(
      tContents(
        new ApiClient({auth: new FakeAuth()}),
        {role: 'user', parts: [{text: 'test string'}]},
      ),
    ).toEqual([{role: 'user', parts: [{text: 'test string'}]}]);
  });

  it('text part', () => {
    expect(
      tContents(new ApiClient({auth: new FakeAuth()}), {text: 'test string'}),
    ).toEqual([{role: 'user', parts: [{text: 'test string'}]}]);
  });

  it('function call part', () => {
    expect(
      tContents(
        new ApiClient({auth: new FakeAuth()}),
        {functionCall: {name: 'function-name', args: {arg1: 'arg1'}}},
      ),
    ).toEqual([
      {role: 'model', parts: [{functionCall: {name: 'function-name', args: {arg1: 'arg1'}}}]},
    ]);
  });

  it('string', () => {
    expect(
      tContents(new ApiClient({auth: new FakeAuth()}), 'test string'),
    ).toEqual([{role: 'user', parts: [{text: 'test string'}]}]);
  });

  it('array of contents', () => {
    expect(
      tContents(
        new ApiClient({auth: new FakeAuth()}),
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
        new ApiClient({auth: new FakeAuth()}),
        [{text: 'test string 1'}, {text: 'test string 2'}],
      ),
    ).toEqual([
      {role: 'user', parts: [{text: 'test string 1'}, {text: 'test string 2'}]},
    ]);
  });

  it('array of string mixed with text parts, contents', () => {
    expect(
      tContents(
        new ApiClient({auth: new FakeAuth()}),
        [
          'test string 1',
          {text: 'test string 2'},
          {role: 'user', parts: [{text: 'test string 3'}]},
          {functionCall: {name: 'function-name', args: {arg1: 'arg1'}}},
          {functionResponse: {name: 'function-name', response: {result: {answer: 'answer1'}}}},
          {role: 'model', parts: [{text: 'answer1'}]},
          'thank you',
        ],
      ),
    ).toEqual([
      {
          role: 'user',
          parts: [
            {text: 'test string 1'},
            {text: 'test string 2'},
          ]
      },
      {
          role: 'user',
          parts: [{text: 'test string 3'}]
      },
      {
        role: 'model',
        parts: [
          {functionCall: {name: 'function-name', args: {arg1: 'arg1'}}},
        ],
      },
      {
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: 'function-name',
              response: {result: {answer: 'answer1'}},
            },
          },
        ],
      },
      {
        role: 'model',
        parts: [{text: 'answer1'}],
      },
      {
        role: 'user',
        parts: [{text: 'thank you'}],
      },
    ]);
  });

  it('array of array', () => {
    expect(
      tContents(
        new ApiClient({auth: new FakeAuth()}),
        [
          'question1',
          {functionCall: {name: 'name1', args: {arg1: 'arg1'}}},
          {functionResponse: {name: 'name1', response: {result: {answer: 'answer1'}}}},
          {
            role: 'model',
            parts: [{text: 'answer1'}],
          },
          [
            'context2',
            'question2',
          ],
        ]
      ),
    ).toEqual(
    [
      {
        role: 'user',
        parts: [{text: 'question1'}],
      },
      {
        role: 'model',
        parts: [
          {functionCall: {name: 'name1', args: {arg1: 'arg1'}}},
        ],
      },
      {
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: 'name1',
              response: {result: {answer: 'answer1'}},
            },
          },
        ],
      },
      {
        role: 'model',
        parts: [{text: 'answer1'}],
      },
      {
        role: 'user',
        parts: [
          {text: 'context2'},
          {text: 'question2'},
        ],
      },
    ]);
  });
});
