/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {moveValueByPath} from '../../src/_common.js';

describe('moveValueByPath', () => {
  it('should move values with array wildcard notation', () => {
    const data: Record<string, unknown> = {
      requests: [
        {
          request: {
            content: {
              parts: [
                {
                  text: '1',
                },
              ],
            },
          },
          outputDimensionality: 64,
        },
        {
          request: {
            content: {
              parts: [
                {
                  text: '2',
                },
              ],
            },
          },
          outputDimensionality: 64,
        },
        {
          request: {
            content: {
              parts: [
                {
                  text: '3',
                },
              ],
            },
          },
          outputDimensionality: 64,
        },
      ],
    };

    const paths = {'requests[].*': 'requests[].request.*'};
    moveValueByPath(data, paths);

    const expected = {
      requests: [
        {
          request: {
            content: {
              parts: [
                {
                  text: '1',
                },
              ],
            },
            outputDimensionality: 64,
          },
        },
        {
          request: {
            content: {
              parts: [
                {
                  text: '2',
                },
              ],
            },
            outputDimensionality: 64,
          },
        },
        {
          request: {
            content: {
              parts: [
                {
                  text: '3',
                },
              ],
            },
            outputDimensionality: 64,
          },
        },
      ],
    };

    expect(data).toEqual(expected);
  });

  it('should move values with simple array wildcard (docstring example)', () => {
    const data: Record<string, unknown> = {
      requests: [
        {
          content: 'v1',
        },
        {
          content: 'v2',
        },
      ],
    };

    const paths = {'requests[].*': 'requests[].request.*'};
    moveValueByPath(data, paths);

    const expected = {
      requests: [
        {
          request: {
            content: 'v1',
          },
        },
        {
          request: {
            content: 'v2',
          },
        },
      ],
    };

    expect(data).toEqual(expected);
  });
});
