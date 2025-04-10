/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Candidate,
  Content,
  GenerateContentResponse,
  Language,
  Outcome,
  Part,
  createModelContent,
  createPartFromBase64,
  createPartFromCodeExecutionResult,
  createPartFromExecutableCode,
  createPartFromFunctionCall,
  createPartFromFunctionResponse,
  createPartFromText,
  createPartFromUri,
  createUserContent,
} from '../../src/types';

describe('GenerateContentResponse.text', () => {
  it('should return undefined when candidates is undefined', () => {
    const response = new GenerateContentResponse();
    expect(response.text).toBeUndefined();
  });

  it('should return undefined when candidates is an empty array', () => {
    const response = new GenerateContentResponse();
    response.candidates = [];
    expect(response.text).toBeUndefined();
  });

  it('should return undefined when content is undefined', () => {
    const response = new GenerateContentResponse();
    response.candidates = [{} as Candidate];
    expect(response.text).toBeUndefined();
  });

  it('should return undefined when content.parts is undefined', () => {
    const response = new GenerateContentResponse();
    response.candidates = [{content: {} as Content} as Candidate];
    expect(response.text).toBeUndefined();
  });

  it('should return undefined when content.parts is empty array', () => {
    const response = new GenerateContentResponse();
    response.candidates = [{content: {parts: []}} as Candidate];
    expect(response.text).toBeUndefined();
  });

  it('should use first candidate when there are multiple candidates', () => {
    const response = new GenerateContentResponse();
    response.candidates = [
      {content: {parts: [{text: 'First candidate'}]}} as Candidate,
      {content: {parts: [{text: 'Second candidate'}]}} as Candidate,
    ];
    spyOn(console, 'warn');

    expect(response.text).toBe('First candidate');
    expect(console.warn).toHaveBeenCalledWith(
      'there are multiple candidates in the response, returning text from the first one.',
    );
  });

  it('should return concatenated text from valid text parts', () => {
    const response = new GenerateContentResponse();
    response.candidates = [
      {
        content: {
          parts: [{text: 'Hello '}, {text: 'world!'}],
        },
      } as Candidate,
    ];
    expect(response.text).toBe('Hello world!');
  });

  it('should log a warning when parts contain invalid fields', () => {
    const response = new GenerateContentResponse();
    response.candidates = [
      {
        content: {
          parts: [
            {text: 'Hello '},
            {
              inlineData: {
                data: 'world!',
                mimeType: 'text/plain',
              },
            },
          ],
        },
      } as Candidate,
    ];
    spyOn(console, 'warn');

    expect(response.text).toEqual('Hello ');
    expect(console.warn).toHaveBeenCalledWith(
      'there are non-text parts inlineData in the response, returning concatenation of all text parts. Please refer to the non text parts for a full response from model.',
    );
  });

  it('should skip parts with thought set to true', () => {
    const response = new GenerateContentResponse();
    response.candidates = [
      {
        content: {
          parts: [{text: 'Hello '}, {text: 'world!', thought: true}],
        },
      } as Candidate,
    ];
    expect(response.text).toBe('Hello ');
  });
});

describe('GenerateContentResponse.data', () => {
  it('should return undefined when candidates is undefined', () => {
    const response = new GenerateContentResponse();
    expect(response.data).toBeUndefined();
  });

  it('should return undefined when candidates is an empty array', () => {
    const response = new GenerateContentResponse();
    response.candidates = [];
    expect(response.data).toBeUndefined();
  });

  it('should return undefined when content is undefined', () => {
    const response = new GenerateContentResponse();
    response.candidates = [{} as Candidate];
    expect(response.data).toBeUndefined();
  });

  it('should return undefined when content.parts is undefined', () => {
    const response = new GenerateContentResponse();
    response.candidates = [{content: {} as Content} as Candidate];
    expect(response.data).toBeUndefined();
  });

  it('should return undefined when content.parts is empty array', () => {
    const response = new GenerateContentResponse();
    response.candidates = [{content: {parts: []}} as Candidate];
    expect(response.data).toBeUndefined();
  });

  it('should use first candidate when there are multiple candidates', () => {
    const response = new GenerateContentResponse();
    response.candidates = [
      {
        content: {
          parts: [
            {inlineData: {data: 'SGVsbG8gV29ybGQh', mimeType: 'text/plain'}},
          ],
        },
      } as Candidate,
      {
        content: {
          parts: [
            {
              inlineData: {
                data: 'WW91IGFyZSBhd2Vzb21lIQ==',
                mimeType: 'text/plain',
              },
            },
          ],
        },
      } as Candidate,
    ];
    spyOn(console, 'warn');

    expect(response.data).toBe('SGVsbG8gV29ybGQh');
    expect(console.warn).toHaveBeenCalledWith(
      'there are multiple candidates in the response, returning data from the first one.',
    );
  });

  it('should return concatenated inline data from valid data parts', () => {
    const response = new GenerateContentResponse();
    response.candidates = [
      {
        content: {
          parts: [
            {inlineData: {data: 'SGVsbG8gV29ybGQh', mimeType: 'text/plain'}},
            {
              inlineData: {
                data: 'WW91IGFyZSBhd2Vzb21lIQ==',
                mimeType: 'text/plain',
              },
            },
          ],
        },
      } as Candidate,
    ];
    expect(response.data).toBe('SGVsbG8gV29ybGQhWW91IGFyZSBhd2Vzb21lIQ==');
  });

  it('should log a warning when parts contain invalid fields', () => {
    const response = new GenerateContentResponse();
    response.candidates = [
      {
        content: {
          parts: [
            {text: 'Hello '},
            {
              inlineData: {
                data: 'SGVsbG8gV29ybGQh',
                mimeType: 'text/plain',
              },
            },
          ],
        },
      } as Candidate,
    ];
    spyOn(console, 'warn');

    expect(response.data).toEqual('SGVsbG8gV29ybGQh');
    expect(console.warn).toHaveBeenCalledWith(
      'there are non-data parts text in the response, returning concatenation of all data parts. Please refer to the non data parts for a full response from model.',
    );
  });
});

describe('GenerateContentResponse.functionCalls', () => {
  it('should return undefined when candidates is undefined', () => {
    const response = new GenerateContentResponse();
    expect(response.functionCalls).toBeUndefined();
  });

  it('should return undefined when candidates is an empty array', () => {
    const response = new GenerateContentResponse();
    response.candidates = [];
    expect(response.functionCalls).toBeUndefined();
  });

  it('should return undefined when candidates[0].content.parts is an empty array', () => {
    const response = new GenerateContentResponse();
    response.candidates = [{content: {parts: []}}];
    expect(response.functionCalls).toBeUndefined();
  });

  it('should use the first candidate when there are multiple candidates', () => {
    const response = new GenerateContentResponse();
    response.candidates = [
      {content: {parts: [{functionCall: {name: 'func1'}}]}},
      {content: {parts: [{functionCall: {name: 'func2'}}]}},
    ];
    spyOn(console, 'warn');

    expect(response.functionCalls).toEqual([{name: 'func1'}]);
    expect(console.warn).toHaveBeenCalledWith(
      'there are multiple candidates in the response, returning function calls from the first one.',
    );
  });

  it('should return an array of function calls when candidates[0].content.parts contains valid function calls', () => {
    const response = new GenerateContentResponse();
    response.candidates = [
      {
        content: {
          parts: [
            {functionCall: {name: 'func1'}},
            {functionCall: {name: 'func2'}},
          ],
        },
      },
    ];
    expect(response.functionCalls).toEqual([{name: 'func1'}, {name: 'func2'}]);
  });

  it('should return undefined when candidates[0].content.parts contains no function calls', () => {
    const response = new GenerateContentResponse();
    response.candidates = [
      {content: {parts: [{text: 'text1'}, {text: 'text2'}]}},
    ];
    expect(response.functionCalls).toBeUndefined();
  });
  it('should filter out filter out undefined function calls', () => {
    const response = new GenerateContentResponse();
    response.candidates = [
      {
        content: {
          parts: [{functionCall: {name: 'func1'}}, {functionCall: undefined}],
        },
      },
    ];
    expect(response.functionCalls).toEqual([{name: 'func1'}]);
  });
});

describe('GenerateContentResponse.executableCode', () => {
  it('should return undefined when candidates is undefined', () => {
    const response = new GenerateContentResponse();
    expect(response.executableCode).toBeUndefined();
  });

  it('should return undefined when candidates is an empty array', () => {
    const response = new GenerateContentResponse();
    response.candidates = [];
    expect(response.executableCode).toBeUndefined();
  });

  it('should return undefined when candidates[0].content.parts is an empty array', () => {
    const response = new GenerateContentResponse();
    response.candidates = [{content: {parts: []}}];
    expect(response.executableCode).toBeUndefined();
  });

  it('should use the first candidate when there are multiple candidates', () => {
    const response = new GenerateContentResponse();
    response.candidates = [
      {content: {parts: [{executableCode: {code: 'print("Hello world!")'}}]}},
      {content: {parts: [{executableCode: {code: 'print("Goodbye world!")'}}]}},
    ];
    spyOn(console, 'warn');

    expect(response.executableCode).toBe('print("Hello world!")');
    expect(console.warn).toHaveBeenCalledWith(
      'there are multiple candidates in the response, returning executable code from the first one.',
    );
  });

  it('should return the executable code when candidates[0].content.parts contains valid executable code parts', () => {
    const response = new GenerateContentResponse();
    response.candidates = [
      {
        content: {
          parts: [{executableCode: {code: 'print("Hello world!")'}}],
        },
      },
    ];
    expect(response.executableCode).toBe('print("Hello world!")');
  });

  it('should return undefined when candidates[0].content.parts contains no executable code parts', () => {
    const response = new GenerateContentResponse();
    response.candidates = [
      {content: {parts: [{text: 'text1'}, {text: 'text2'}]}},
    ];
    expect(response.executableCode).toBeUndefined();
  });
});

describe('GenerateContentResponse.codeExecutionResult', () => {
  it('should return undefined when candidates is undefined', () => {
    const response = new GenerateContentResponse();
    expect(response.codeExecutionResult).toBeUndefined();
  });

  it('should return undefined when candidates is an empty array', () => {
    const response = new GenerateContentResponse();
    response.candidates = [];
    expect(response.codeExecutionResult).toBeUndefined();
  });

  it('should return undefined when candidates[0].content.parts is an empty array', () => {
    const response = new GenerateContentResponse();
    response.candidates = [{content: {parts: []}}];
    expect(response.codeExecutionResult).toBeUndefined();
  });

  it('should use the first candidate when there are multiple candidates', () => {
    const response = new GenerateContentResponse();
    response.candidates = [
      {
        content: {
          parts: [{codeExecutionResult: {output: 'Hello world!'}}],
        },
      },
      {
        content: {
          parts: [{codeExecutionResult: {output: 'Goodbye world!'}}],
        },
      },
    ];
    spyOn(console, 'warn');

    expect(response.codeExecutionResult).toBe('Hello world!');
    expect(console.warn).toHaveBeenCalledWith(
      'there are multiple candidates in the response, returning code execution result from the first one.',
    );
  });

  it('should return the output of the code execution result part when candidates[0].content.parts contains valid code execution result parts', () => {
    const response = new GenerateContentResponse();
    response.candidates = [
      {
        content: {
          parts: [{codeExecutionResult: {output: 'Hello world!'}}],
        },
      },
    ];
    expect(response.codeExecutionResult).toBe('Hello world!');
  });

  it('should return undefined when candidates[0].content.parts contains no code execution result parts', () => {
    const response = new GenerateContentResponse();
    response.candidates = [
      {content: {parts: [{text: 'text1'}, {text: 'text2'}]}},
    ];
    expect(response.codeExecutionResult).toBeUndefined();
  });
});

describe('createPart usability functions', () => {
  it('createPartFromText should create a text part', () => {
    const part = createPartFromText('Hello world!');
    const expectedPart: Part = {
      text: 'Hello world!',
    };

    expect(part).toEqual(expectedPart);
  });

  it('createPartFromUri should create a file data part', () => {
    const part = createPartFromUri('gs://bucket/file.txt', 'text/plain');
    const expectedPart: Part = {
      fileData: {
        fileUri: 'gs://bucket/file.txt',
        mimeType: 'text/plain',
      },
    };

    expect(part).toEqual(expectedPart);
  });

  it('createPartFromFunctionCall should create a function call part', () => {
    const part = createPartFromFunctionCall('func1', {
      param1: 'value1',
      param2: 'value2',
    });
    const expectedPart: Part = {
      functionCall: {
        name: 'func1',
        args: {
          param1: 'value1',
          param2: 'value2',
        },
      },
    };

    expect(part).toEqual(expectedPart);
  });

  it('createPartFromFunctionResponse should create a function response part', () => {
    const part = createPartFromFunctionResponse('id1', 'func1', {
      output: 'value1',
    });
    const expectedPart: Part = {
      functionResponse: {
        id: 'id1',
        name: 'func1',
        response: {
          output: 'value1',
        },
      },
    };

    expect(part).toEqual(expectedPart);
  });

  it('createPartFromBase64 should create an inline data part', () => {
    const part = createPartFromBase64('dGVzdA==', 'text/plain');
    const expectedPart: Part = {
      inlineData: {
        data: 'dGVzdA==',
        mimeType: 'text/plain',
      },
    };

    expect(part).toEqual(expectedPart);
  });

  it('createPartFromCodeExecutionResult should create a code execution result part', () => {
    const part = createPartFromCodeExecutionResult(
      Outcome.OUTCOME_OK,
      'Hello world!',
    );
    const expectedPart: Part = {
      codeExecutionResult: {
        outcome: Outcome.OUTCOME_OK,
        output: 'Hello world!',
      },
    };

    expect(part).toEqual(expectedPart);
  });

  it('createPartFromExecutableCode should create an executable code part', () => {
    const part = createPartFromExecutableCode(
      'print("Hello world!")',
      Language.PYTHON,
    );
    const expectedPart: Part = {
      executableCode: {
        code: 'print("Hello world!")',
        language: Language.PYTHON,
      },
    };

    expect(part).toEqual(expectedPart);
  });
});

describe('createUserContent', () => {
  it('should throw an error when partOrString is number type', () => {
    // @ts-expect-error: Expected to throw an error.
    expect(() => createUserContent(123)).toThrow(
      new Error('partOrString must be a Part object, string, or array'),
    );
  });
  it('should throw an error when partOrString is empty array', () => {
    expect(() => createUserContent([])).toThrow(
      new Error('partOrString cannot be an empty array'),
    );
  });
  it('should throw an error when partOrString array contains unsupported type', () => {
    // @ts-expect-error: Expected to throw an error.
    expect(() => createUserContent([123])).toThrow(
      new Error('element in PartUnion must be a Part object or string'),
    );
  });
  it('should throw an error when partOrString array contains unsupported object', () => {
    expect(() => createUserContent([{}])).toThrow(
      new Error('element in PartUnion must be a Part object or string'),
    );
  });
  it('should throw an error when partOrString is unsupported object', () => {
    expect(() => createUserContent({})).toThrow(
      new Error('partOrString must be a Part object, string, or array'),
    );
  });
  it('should create a user content object from a string', () => {
    expect(createUserContent('Hello world!')).toEqual({
      role: 'user',
      parts: [{text: 'Hello world!'}],
    });
  });
  it('should create a user content object from a Part object', () => {
    expect(
      createUserContent({
        fileData: {
          fileUri: 'gs://bucket/file.txt',
          mimeType: 'text/plain',
        },
      }),
    ).toEqual({
      role: 'user',
      parts: [
        {
          fileData: {
            fileUri: 'gs://bucket/file.txt',
            mimeType: 'text/plain',
          },
        },
      ],
    });
  });
});
describe('createModelContent', () => {
  it('should throw an error when partOrString is number type', () => {
    // @ts-expect-error: Expected to throw an error.
    expect(() => createModelContent(123)).toThrow(
      new Error('partOrString must be a Part object, string, or array'),
    );
  });
  it('should throw an error when partOrString is empty array', () => {
    expect(() => createModelContent([])).toThrow(
      new Error('partOrString cannot be an empty array'),
    );
  });
  it('should throw an error when partOrString array contains unsupported type', () => {
    // @ts-expect-error: Expected to throw an error.
    expect(() => createModelContent([123])).toThrow(
      new Error('element in PartUnion must be a Part object or string'),
    );
  });
  it('should throw an error when partOrString array contains unsupported object', () => {
    expect(() => createModelContent([{}])).toThrow(
      new Error('element in PartUnion must be a Part object or string'),
    );
  });
  it('should throw an error when partOrString is unsupported object', () => {
    expect(() => createModelContent({})).toThrow(
      new Error('partOrString must be a Part object, string, or array'),
    );
  });
  it('should create a model content object from a string', () => {
    expect(createModelContent('Hello world!')).toEqual({
      role: 'model',
      parts: [{text: 'Hello world!'}],
    });
  });
  it('should create a model content object from a Part object', () => {
    expect(
      createModelContent({
        fileData: {
          fileUri: 'gs://bucket/file.txt',
          mimeType: 'text/plain',
        },
      }),
    ).toEqual({
      role: 'model',
      parts: [
        {
          fileData: {
            fileUri: 'gs://bucket/file.txt',
            mimeType: 'text/plain',
          },
        },
      ],
    });
  });
});
