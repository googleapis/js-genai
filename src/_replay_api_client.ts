/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';

import {ClientInitOptions, NodeClient} from './node/node_client';
import * as types from './types';

/**
 * Configuration options for initializing a `ReplayClient`.
 *
 * This interface extends the base {@link ./_api_client.ClientInitOptions} and
 * private fields to hold the replay file's path or its JSON format.
 *
 * @interface
 * @extends ClientInitOptions
 */
export interface ReplayClientInitOpts extends ClientInitOptions {
  replayFile?: string;
  replayFileJson?: Record<string, unknown>;
}

/**
 * The ReplayAPIClient class is used to execute intergration tests in replay
 * mode, where the API responses are loaded and constructed from recorded files.
 */
export class ReplayAPIClient extends NodeClient {
  private replayFile: string;
  private replayFileJson: Record<string, unknown>;

  constructor(opts: ReplayClientInitOpts) {
    super(opts);
    this.replayFile = '';
    this.replayFileJson = {};
  }

  loadReplayFilename(
    replayFilePath: string,
    testTableItem: types.TestTableItem,
    testName: string,
  ) {
    const responseFilePath = replayFilePath.replace('_test_table', testName);

    // Get the response filename from the test name if it exists, otherwise get
    // it from the override replay ID.
    if (fs.existsSync(responseFilePath)) {
      this.replayFile = responseFilePath;
    } else {
      const replayId = testTableItem.overrideReplayId;
      this.replayFile = replayFilePath.replace(
        '_test_table',
        `${replayId}.${this.vertexai ? 'vertex' : 'mldev'}`,
      );
    }
    // json from replay file could be any response.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const localFileJson: any = JSON.parse(
      fs.readFileSync(this.replayFile, {encoding: 'utf8'}),
    );
    if (localFileJson) {
      this.replayFileJson = localFileJson;
    }
  }

  getNumInteractions() {
    if (Array.isArray(this.replayFileJson['interactions'])) {
      return this.replayFileJson['interactions'].length;
    } else {
      throw new Error('Could not find interactions in replay file.');
    }
  }

  getExpectedResponseFromReplayFile(interactionIndex: number) {
    if (Array.isArray(this.replayFileJson['interactions'])) {
      return this.replayFileJson['interactions'][interactionIndex]?.response
        ?.sdk_response_segments[0];
    } else {
      throw new Error('Could not find interactions in replay file.');
    }
  }

  getExpectedRequestFromReplayFile(interactionIndex: number) {
    if (Array.isArray(this.replayFileJson['interactions'])) {
      return this.replayFileJson['interactions'][interactionIndex]?.request;
    } else {
      throw new Error('Could not find interactions in replay file.');
    }
  }

  /**
   * Sets all the interaction responses on the replay client using the fetch
   * spy.
   */
  // mock could be anything.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setupReplayResponses(fetchSpy: any) {
    // json from replay file could be any response.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseJson: any = JSON.parse(
      fs.readFileSync(this.replayFile, {encoding: 'utf8'}),
    );

    const responses: Promise<Response>[] = [];
    for (const interaction of responseJson.interactions) {
      const responseStatusCode = interaction?.response?.status_code ?? 200;
      const interactionResponse = interaction?.response;
      const headers = interaction?.response?.headers;
      const responseBody = JSON.stringify(interactionResponse.body_segments[0]);
      responses.push(
        Promise.resolve(
          new Response(responseBody, {
            status: responseStatusCode,
            headers: headers,
          }),
        ),
      );
    }

    fetchSpy.calls.reset();
    fetchSpy.and.returnValues(...responses);
  }
}
