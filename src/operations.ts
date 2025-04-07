/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Code generated by the Google Gen AI SDK generator DO NOT EDIT.

import {ApiClient} from './_api_client';
import * as common from './_common';
import {BaseModule} from './_common';
import * as converters from './converters/_operations_converters';
import * as types from './types';

export class Operations extends BaseModule {
  constructor(private readonly apiClient: ApiClient) {
    super();
  }

  /**
   * Gets the status of a long-running operation.
   *
   * @param parameters The parameters for the get operation request.
   * @return The updated Operation object, with the latest status or result.
   */
  async getVideosOperation(
    parameters: types.OperationGetParameters,
  ): Promise<types.GenerateVideosOperation> {
    const operation = parameters.operation;
    const config = parameters.config;

    if (operation.name === undefined || operation.name === '') {
      throw new Error('Operation name is required.');
    }

    if (this.apiClient.isVertexAI()) {
      const resourceName = operation.name.split('/operations/')[0];
      let httpOptions: types.HttpOptions | undefined = undefined;

      if (config && 'httpOptions' in config) {
        httpOptions = config.httpOptions;
      }

      return this.fetchPredictVideosOperationInternal({
        operationName: operation.name,
        resourceName: resourceName,
        config: {httpOptions: httpOptions},
      });
    } else {
      return this.getVideosOperationInternal({
        operationName: operation.name,
        config: config,
      });
    }
  }

  private async getVideosOperationInternal(
    params: types.GetOperationParameters,
  ): Promise<types.GenerateVideosOperation> {
    let response: Promise<types.GenerateVideosOperation>;
    let path: string = '';
    let queryParams: Record<string, string> = {};
    if (this.apiClient.isVertexAI()) {
      const body = converters.getOperationParametersToVertex(
        this.apiClient,
        params,
      );
      path = common.formatMap(
        '{operationName}',
        body['_url'] as Record<string, unknown>,
      );
      queryParams = body['_query'] as Record<string, string>;
      delete body['config'];
      delete body['_url'];
      delete body['_query'];

      response = this.apiClient
        .request({
          path: path,
          queryParams: queryParams,
          body: JSON.stringify(body),
          httpMethod: 'GET',
          httpOptions: params.config?.httpOptions,
        })
        .then((httpResponse) => {
          return httpResponse.json();
        }) as Promise<types.GenerateVideosOperation>;

      return response.then((apiResponse) => {
        const resp = converters.generateVideosOperationFromVertex(
          this.apiClient,
          apiResponse,
        );

        return resp as types.GenerateVideosOperation;
      });
    } else {
      const body = converters.getOperationParametersToMldev(
        this.apiClient,
        params,
      );
      path = common.formatMap(
        '{operationName}',
        body['_url'] as Record<string, unknown>,
      );
      queryParams = body['_query'] as Record<string, string>;
      delete body['config'];
      delete body['_url'];
      delete body['_query'];

      response = this.apiClient
        .request({
          path: path,
          queryParams: queryParams,
          body: JSON.stringify(body),
          httpMethod: 'GET',
          httpOptions: params.config?.httpOptions,
        })
        .then((httpResponse) => {
          return httpResponse.json();
        }) as Promise<types.GenerateVideosOperation>;

      return response.then((apiResponse) => {
        const resp = converters.generateVideosOperationFromMldev(
          this.apiClient,
          apiResponse,
        );

        return resp as types.GenerateVideosOperation;
      });
    }
  }

  private async fetchPredictVideosOperationInternal(
    params: types.FetchPredictOperationParameters,
  ): Promise<types.GenerateVideosOperation> {
    let response: Promise<types.GenerateVideosOperation>;
    let path: string = '';
    let queryParams: Record<string, string> = {};
    if (this.apiClient.isVertexAI()) {
      const body = converters.fetchPredictOperationParametersToVertex(
        this.apiClient,
        params,
      );
      path = common.formatMap(
        '{resourceName}:fetchPredictOperation',
        body['_url'] as Record<string, unknown>,
      );
      queryParams = body['_query'] as Record<string, string>;
      delete body['config'];
      delete body['_url'];
      delete body['_query'];

      response = this.apiClient
        .request({
          path: path,
          queryParams: queryParams,
          body: JSON.stringify(body),
          httpMethod: 'POST',
          httpOptions: params.config?.httpOptions,
        })
        .then((httpResponse) => {
          return httpResponse.json();
        }) as Promise<types.GenerateVideosOperation>;

      return response.then((apiResponse) => {
        const resp = converters.generateVideosOperationFromVertex(
          this.apiClient,
          apiResponse,
        );

        return resp as types.GenerateVideosOperation;
      });
    } else {
      throw new Error('This method is only supported by the Vertex AI.');
    }
  }
}
