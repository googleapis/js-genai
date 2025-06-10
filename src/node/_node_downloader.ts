/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {createWriteStream, writeFile} from 'fs';
import {Readable} from 'node:stream';
import type {ReadableStream} from 'node:stream/web';

import {ApiClient} from '../_api_client.js';
import {Downloader} from '../_downloader.js';
import {isGeneratedVideo, isVideo, tFileName} from '../_transformers.js';
import {
  DownloadFileParameters,
  GeneratedVideo,
  HttpResponse,
  Video,
} from '../types.js';

export class NodeDownloader implements Downloader {
  async download(
    params: DownloadFileParameters,
    apiClient: ApiClient,
  ): Promise<void> {
    if (params.downloadPath) {
      const response = await downloadFile(params, apiClient);
      if (response instanceof HttpResponse) {
        const writer = createWriteStream(params.downloadPath);
        Readable.fromWeb(
          response.responseInternal.body as ReadableStream<Uint8Array>,
        ).pipe(writer);
      } else {
        writeFile(
          params.downloadPath,
          response as string,
          {encoding: 'base64'},
          (error) => {
            if (error) {
              throw new Error(
                `Failed to write file to ${params.downloadPath}: ${error}`,
              );
            }
          },
        );
      }
    }
  }
}

async function downloadFile(
  params: DownloadFileParameters,
  apiClient: ApiClient,
): Promise<HttpResponse | string> {
  const name = tFileName(apiClient, params.file);
  if (name !== undefined) {
    return await apiClient.request({
      path: `files/${name}:download`,
      httpMethod: 'GET',
      queryParams: {
        'alt': 'media',
      },
      httpOptions: params.config?.httpOptions,
      abortSignal: params.config?.abortSignal,
    });
  } else if (isGeneratedVideo(params.file)) {
    const videoBytes = (params.file as GeneratedVideo).video?.videoBytes;
    if (typeof videoBytes === 'string') {
      return videoBytes;
    } else {
      throw new Error(
        'Failed to download generated video, Uri or videoBytes not found.',
      );
    }
  } else if (isVideo(params.file)) {
    const videoBytes = (params.file as Video).videoBytes;
    if (typeof videoBytes === 'string') {
      return videoBytes;
    } else {
      throw new Error('Failed to download video, Uri or videoBytes not found.');
    }
  } else {
    throw new Error('Unsupported file type');
  }
}
