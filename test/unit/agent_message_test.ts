/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  clearSeenAgentMessages,
  parseAgentMessageHeader,
  warnFromAgentMessageHeaders,
} from '../../src/_api_client.js';
import {
  GeminiNextGenInteractions,
  GoogleGenAIParentClient,
} from '../../src/gaos/google-genai.js';
import {SDKHooks} from '../../src/gaos/hooks/hooks.js';
import {AfterSuccessContext} from '../../src/gaos/hooks/types.js';

describe('Agent-Message header handling', () => {
  let warnSpy: jasmine.Spy;

  beforeEach(() => {
    clearSeenAgentMessages();
    warnSpy = spyOn(console, 'warn');
  });

  afterEach(() => {
    clearSeenAgentMessages();
  });

  describe('parseAgentMessageHeader', () => {
    it('parses a single structured item', () => {
      const header =
        'field_ignored;field="generation_config.thinking_config.thinking_budget";msg=%"thinking_budget is ignored for this model"';
      expect(parseAgentMessageHeader(header)).toEqual([
        'thinking_budget is ignored for this model',
      ]);
    });

    it('parses multiple comma-separated items with commas and semicolons in quotes', () => {
      const header =
        'field_ignored;field="foo";msg=%"first, warning; here", ' +
        'deprecated;field="bar";msg=%"second warning"';
      expect(parseAgentMessageHeader(header)).toEqual([
        'first, warning; here',
        'second warning',
      ]);
    });

    it('parses item without field and with unknown parameters', () => {
      const header =
        'model_deprecated;extra="val";flag;msg=%"Model is deprecated"';
      expect(parseAgentMessageHeader(header)).toEqual(['Model is deprecated']);
    });

    it('decodes percent-encoded UTF-8 and standard quoted strings', () => {
      const pctHeader = 'code;msg=%"Use %22foo%22 %e2%80%94 bar"';
      expect(parseAgentMessageHeader(pctHeader)).toEqual([
        'Use "foo" \u2014 bar',
      ]);

      const quotedHeader = 'code;msg="Use \\"foo\\" \\\\ bar"';
      expect(parseAgentMessageHeader(quotedHeader)).toEqual([
        'Use "foo" \\ bar',
      ]);
    });

    it('ignores malformed headers gracefully', () => {
      const malformedHeaders = [
        '',
        '   ',
        ';;;',
        'field_ignored',
        'field_ignored;field="x"',
        'field_ignored;msg=unquoted',
        'field_ignored;msg=%"unterminated',
        '123invalid;msg=%"bad token code"',
      ];
      for (const bad of malformedHeaders) {
        expect(parseAgentMessageHeader(bad)).toEqual([]);
      }
    });

    it('skips malformed sibling item and preserves valid item', () => {
      const header = 'broken_item;field="x", valid_code;msg=%"valid warning"';
      expect(parseAgentMessageHeader(header)).toEqual(['valid warning']);
    });

    it('supports plain-string fallback', () => {
      expect(
        parseAgentMessageHeader('Model gemini-1.5-pro is deprecated.'),
      ).toEqual(['Model gemini-1.5-pro is deprecated.']);
    });
  });

  describe('warnFromAgentMessageHeaders', () => {
    it('emits warnings and deduplicates across calls and case variations', () => {
      const header = 'field_ignored;field="x";msg=%"dedup test message"';

      warnFromAgentMessageHeaders(new Headers({'Agent-Message': header}));
      warnFromAgentMessageHeaders(new Headers({'agent-message': header}));
      warnFromAgentMessageHeaders(new Headers({'AGENT-MESSAGE': header}));

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith('[Gemini API] dedup test message');
    });

    it('handles multiple Agent-Message header lines', () => {
      const headers = new Headers();
      headers.append('Agent-Message', 'code1;msg=%"multi header 1"');
      headers.append('agent-message', 'code2;msg=%"multi header 2"');

      warnFromAgentMessageHeaders(headers);

      expect(warnSpy.calls.allArgs()).toEqual([
        ['[Gemini API] multi header 1'],
        ['[Gemini API] multi header 2'],
      ]);
    });

    it('ignores missing headers', () => {
      warnFromAgentMessageHeaders(undefined);
      warnFromAgentMessageHeaders(new Headers());

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('error responses', () => {
    const errorResponse = (status: number, agentMessage?: string) => {
      const headers = new Headers({'Content-Type': 'application/json'});
      if (agentMessage) {
        headers.set('Agent-Message', agentMessage);
      }
      return new Response(
        JSON.stringify({error: {code: status, message: `failed ${status}`}}),
        {status, headers},
      );
    };

    // Returns the error thrown by `call` when fetch returns `response`.
    const errorFrom = async (
      call: () => Promise<unknown>,
      response: () => Response,
    ): Promise<unknown> => {
      spyOn(globalThis, 'fetch').and.callFake(() =>
        Promise.resolve(response()),
      );
      try {
        await call();
      } catch (e) {
        return e;
      }
      throw new Error('expected the call to throw');
    };

    for (const status of [400, 503]) {
      it(`Interactions warns on ${status} and still throws the same error`, async () => {
        const parentClient = jasmine.createSpyObj<GoogleGenAIParentClient>([
          'isVertexAI',
          'getProject',
          'getLocation',
          'getBaseUrl',
          'getApiVersion',
          'getAuthHeaders',
        ]);
        parentClient.isVertexAI.and.returnValue(false);
        parentClient.getBaseUrl.and.returnValue('https://my.base.host');
        parentClient.getApiVersion.and.returnValue('v1beta');
        parentClient.getAuthHeaders.and.callFake(() =>
          Promise.resolve(new Headers()),
        );
        const interactions = new GeminiNextGenInteractions(parentClient);
        const call = () =>
          interactions.create(
            {agent: 'some-agent', input: 'some input'},
            {maxRetries: 0},
          );

        const expected = await errorFrom(call, () => errorResponse(status));
        (globalThis.fetch as jasmine.Spy).and.callFake(() =>
          Promise.resolve(
            errorResponse(status, `code;msg=%"gaos error ${status}"`),
          ),
        );
        const actual = await call().then(
          () => fail('expected the call to throw'),
          (e: unknown) => e,
        );

        expect(warnSpy.calls.allArgs()).toEqual([
          [`[Gemini API] gaos error ${status}`],
        ]);
        expect(actual).toBeInstanceOf(
          (expected as object).constructor as new () => unknown,
        );
        expect((actual as Error).message).toEqual((expected as Error).message);
        expect((actual as {status?: number}).status).toBe(
          (expected as {status?: number}).status,
        );
      });
    }
  });

  describe('GAOS SDKHooks integration', () => {
    it('emits deduplicated warnings from afterSuccess hook', async () => {
      const hooks = new SDKHooks();
      const dummyCtx = {} as unknown as AfterSuccessContext;

      const resp1 = new Response('{}', {
        status: 200,
        headers: {'Agent-Message': 'code1;msg=%"gaos hook warning 1"'},
      });
      const resp2 = new Response('{}', {
        status: 200,
        headers: {'agent-message': 'code2;msg=%"gaos hook warning 2"'},
      });

      await hooks.afterSuccess(dummyCtx, resp1);
      await hooks.afterSuccess(dummyCtx, resp1);
      await hooks.afterSuccess(dummyCtx, resp2);

      expect(warnSpy.calls.allArgs()).toEqual([
        ['[Gemini API] gaos hook warning 1'],
        ['[Gemini API] gaos hook warning 2'],
      ]);
    });

    it('shares deduplication with the GenerateContent client', async () => {
      const header = 'code;msg=%"shared warning"';
      warnFromAgentMessageHeaders(new Headers({'Agent-Message': header}));

      await new SDKHooks().afterSuccess(
        {} as unknown as AfterSuccessContext,
        new Response('{}', {status: 200, headers: {'Agent-Message': header}}),
      );

      expect(warnSpy.calls.allArgs()).toEqual([
        ['[Gemini API] shared warning'],
      ]);
    });
  });
});
