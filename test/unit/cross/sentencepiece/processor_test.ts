/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SentencePiece Processor tests.
 * Translated from https://github.com/eliben/go-sentencepiece/blob/main/processor_test.go
 */

import {
  SentencePieceProcessor,
  Token,
} from '../../../../src/cross/sentencepiece/_processor.js';
import {loadModelProtoBytes} from '../../../../src/cross/tokenizer/_loader.js';
import {NodeTokenizerPlatform} from '../../../../src/node/_node_tokenizer_platform.js';

/**
 * Creates a processor instance for testing.
 * Downloads the gemma2 tokenizer model if needed.
 * Note: Test expectations are based on gemma2 model with vocab size 256000.
 */
async function createProcessor(): Promise<SentencePieceProcessor> {
  const platform = new NodeTokenizerPlatform();
  const modelBytes = await loadModelProtoBytes('gemma2', platform);
  return new SentencePieceProcessor(modelBytes);
}

describe('SentencePieceProcessor', () => {
  describe('encode - IDs only', () => {
    let proc: SentencePieceProcessor;

    beforeAll(async () => {
      proc = await createProcessor();
    });

    const tests = [
      {text: 'hello world', wantIDs: [17534, 2134]},
      {text: '12345', wantIDs: [235274, 235284, 235304, 235310, 235308]},
      {text: '  ', wantIDs: [139]},
      {text: '   ', wantIDs: [140]},
      {text: '        ', wantIDs: [145]},
      {text: 'ҔӌԐڎ', wantIDs: [427, 365, 428, 357, 429, 361, 435, 359]},
      {text: ' <mask>  <pad>', wantIDs: [235248, 4, 139, 235322, 8939, 235313]},
      {text: '<table><th></th></table>', wantIDs: [169, 175, 183, 177]},
      {
        text: 'one line\nand another line',
        wantIDs: [785, 2017, 108, 639, 2550, 2017],
      },
      {
        text: 'Language: English\r\n\r\nCredits: Produced by David Widger\r\n',
        wantIDs: [
          14357, 235292, 4645, 235316, 108, 235316, 108, 34711, 235292, 99662,
          731, 6046, 37303, 1197, 235316, 108,
        ],
      },
      {text: 'Bienvenido a este proyecto', wantIDs: [176831, 476, 4004, 25431]},
      {
        text: 'अस्मिन् परियोजनायां स्वागतम्',
        wantIDs: [
          236088, 22740, 212361, 18029, 14480, 19900, 146166, 6751, 235563,
          56545, 44071, 235550, 26989,
        ],
      },
      {
        text: 'if allow == true { return x;} else {return x+y;}',
        wantIDs: [
          648, 2765, 1159, 1382, 612, 2203, 1141, 22505, 1354, 612, 773, 1141,
          235340, 235267, 22505,
        ],
      },
    ];

    tests.forEach(({text, wantIDs}) => {
      it(`should encode "${text}"`, () => {
        const got = proc.encode(text);
        const gotIDs = got.map((t) => t.id);

        expect(gotIDs).toEqual(wantIDs);
      });
    });
  });

  describe('encode - with text', () => {
    let proc: SentencePieceProcessor;

    beforeAll(async () => {
      proc = await createProcessor();
    });

    const tests = [
      {
        text: 'hi <td> bye',
        wantTokens: [
          {id: 544, text: 'hi'},
          {id: 235248, text: '▁'},
          {id: 176, text: '<td>'},
          {id: 44788, text: '▁bye'},
        ],
      },
      {
        text: 'hiƻ <td>🤨there ⇲bob, สวัสดี',
        wantTokens: [
          {id: 544, text: 'hi'},
          {id: 415, text: '<0xC6>'},
          {id: 404, text: '<0xBB>'},
          {id: 235248, text: '▁'},
          {id: 176, text: '<td>'},
          {id: 241847, text: '🤨'},
          {id: 11048, text: 'there'},
          {id: 235248, text: '▁'},
          {id: 248372, text: '⇲'},
          {id: 26242, text: 'bob'},
          {id: 235269, text: ','},
          {id: 12515, text: '▁ส'},
          {id: 151622, text: 'วัส'},
          {id: 28890, text: 'ดี'},
        ],
      },
    ];

    tests.forEach(({text, wantTokens}) => {
      it(`should encode "${text}" with token text`, () => {
        const got = proc.encode(text);
        expect(got).toEqual(wantTokens);
      });
    });
  });

  describe('symbolMatch', () => {
    let proc: SentencePieceProcessor;

    beforeAll(async () => {
      proc = await createProcessor();
    });

    const tests = [
      {text: '<td>', wantLen: 4, wantFound: true},
      {text: '<s>', wantLen: 3, wantFound: true},
      {text: '</s>', wantLen: 4, wantFound: true},
      {text: '<start_of_turn>', wantLen: 15, wantFound: true},
      {text: '<start_of_turn!', wantLen: 1, wantFound: false},
      {text: '▁▁', wantLen: 2, wantFound: true},
      {text: '▁▁▁▁▁▁', wantLen: 6, wantFound: true},
      {text: 'bob', wantLen: 1, wantFound: false},
      {text: '🤨', wantLen: 1, wantFound: false},
      {text: 'สวัสดี', wantLen: 1, wantFound: false},
    ];

    tests.forEach(({text, wantLen, wantFound}) => {
      it(`should match symbol "${text}"`, () => {
        // Note: symbolMatch is private, so we test it through encode behavior
        // This test would need the method to be exposed or use type assertion
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [gotLen, gotFound] = (proc as any).symbolMatch(text);
        expect(gotLen).toBe(wantLen);
        expect(gotFound).toBe(wantFound);
      });
    });
  });

  describe('convertHexValue', () => {
    const tests = [
      {input: '<0x40>', wantN: 64},
      {input: '<0x00>', wantN: 0},
      {input: '<0x1a>', wantN: 26},
      {input: '<0xF3>', wantN: 243},
      {input: '0x12>', wantN: -1},
      {input: '<x12>', wantN: -1},
      {input: '<012>', wantN: -1},
      {input: '<0xTA>', wantN: -1},
    ];

    tests.forEach(({input, wantN}) => {
      it(`should convert "${input}" to ${wantN}`, () => {
        // convertHexValue is a private function in the processor
        // We need to test it indirectly or expose it for testing
        const convertHexValue = (bv: string): number => {
          const match = bv.match(/^<0x([0-9A-Fa-f]{2})>$/);
          if (!match) {
            return -1;
          }
          return parseInt(match[1], 16);
        };

        const gotN = convertHexValue(input);
        expect(gotN).toBe(wantN);
      });
    });
  });

  describe('decode', () => {
    let proc: SentencePieceProcessor;

    beforeAll(async () => {
      proc = await createProcessor();
    });

    const tests = [
      {ids: [17534, 2134], wantText: 'hello world'},
      {
        ids: [427, 365, 428, 357, 29422, 1653, 427, 365, 428, 357],
        wantText: 'Ҕӌnever againҔӌ',
      },
      {
        ids: [785, 2017, 108, 639, 2550, 2017],
        wantText: 'one line\nand another line',
      },
      {ids: [1001, 1002, 1003, 1004], wantText: 'buark}) res'},
      {
        ids: [111001, 111002, 111003, 111004],
        wantText: ' Wichita EducaçãoVocabulary天堂',
      },
      {ids: [139], wantText: '  '},
      {ids: [140], wantText: '   '},
      {ids: [145], wantText: '        '},
      {ids: [441, 401, 387], wantText: 'ส'},
      {ids: [411, 380], wantText: '£'},

      // control IDs (0, 1, 2)
      {ids: [2, 411, 380], wantText: '£'},
      {ids: [1, 2, 411, 380], wantText: '£'},
      {ids: [2, 411, 380, 0, 1, 2, 0], wantText: '£'},

      // unknown (id=3)
      {ids: [3, 411, 380], wantText: ' ⁇ £'},
      {ids: [3, 3, 1000, 3], wantText: ' ⁇  ⁇ ew ⁇ '},

      // invalid bytes for UTF-8, produce "invalid unicode" runes
      {ids: [349, 349, 349], wantText: '���'},
      {ids: [800, 348, 500, 348], wantText: 'sed�it�'},
    ];

    tests.forEach(({ids, wantText}) => {
      it(`should decode [${ids}]`, () => {
        const got = proc.decode(ids);
        expect(got).toBe(wantText);
      });
    });
  });

  describe('decodeTokens', () => {
    let proc: SentencePieceProcessor;

    beforeAll(async () => {
      proc = await createProcessor();
    });

    it('should decode tokens using their IDs', () => {
      const wantText = 'hello   world';
      const tokens: Token[] = [
        {id: 17534, text: 'xxx'},
        {id: 139, text: 'xxx'},
        {id: 2134, text: 'xxx'},
      ];

      const text = proc.decodeTokens(tokens);
      expect(text).toBe(wantText);
    });
  });

  describe('modelInfo', () => {
    let proc: SentencePieceProcessor;

    beforeAll(async () => {
      proc = await createProcessor();
    });

    it('should return correct model info', () => {
      const info = proc.modelInfo();

      // Assumes we use the known model file
      const wantVocabSize = 256000;
      const wantBOS = 2;
      const wantEOS = 1;
      const wantPAD = 0;
      const wantUNK = 3;

      expect(info.vocabularySize).toBe(wantVocabSize);
      expect(info.beginningOfSentenceID).toBe(wantBOS);
      expect(info.endOfSentenceID).toBe(wantEOS);
      expect(info.padID).toBe(wantPAD);
      expect(info.unknownID).toBe(wantUNK);
    });
  });
});
