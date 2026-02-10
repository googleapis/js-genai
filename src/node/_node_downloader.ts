/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {createWriteStream} from 'fs';
import {writeFile} from 'fs/promises';
import {Readable} from 'node:stream';
import {finished} from 'node:stream/promises';
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
        const body = Readable.fromWeb(
          response.responseInternal.body as ReadableStream<Uint8Array>,
        );
        body.pipe(writer);
        await finished(writer);
      } else {
        try {
          await writeFile(params.downloadPath, response as string, {
            encoding: 'base64',
          });
        } catch (error) {
          throw new Error(
            `Failed to write file to ${params.downloadPath}: ${error}`,
          );
        }
      }
    }
  }
}

async function downloadFile(
  params: DownloadFileParameters,
  apiClient: ApiClient,
): Promise<HttpResponse | string> {
  const name = tFileName(params.file);
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
