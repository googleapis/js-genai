/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { createWriteStream } from 'fs';
import { writeFile } from 'fs/promises';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { isGeneratedVideo, isVideo, tFileName } from '../_transformers.js';
import { HttpResponse, } from '../types.js';
export class NodeDownloader {
    async download(params, apiClient) {
        if (params.downloadPath) {
            const response = await downloadFile(params, apiClient);
            if (response instanceof HttpResponse) {
                const writer = createWriteStream(params.downloadPath);
                const body = Readable.fromWeb(response.responseInternal.body);
                body.pipe(writer);
                await finished(writer);
            }
            else {
                try {
                    await writeFile(params.downloadPath, response, {
                        encoding: 'base64',
                    });
                }
                catch (error) {
                    throw new Error(`Failed to write file to ${params.downloadPath}: ${error}`);
                }
            }
        }
    }
}
async function downloadFile(params, apiClient) {
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
    }
    else if (isGeneratedVideo(params.file)) {
        const videoBytes = params.file.video?.videoBytes;
        if (typeof videoBytes === 'string') {
            return videoBytes;
        }
        else {
            throw new Error('Failed to download generated video, Uri or videoBytes not found.');
        }
    }
    else if (isVideo(params.file)) {
        const videoBytes = params.file.videoBytes;
        if (typeof videoBytes === 'string') {
            return videoBytes;
        }
        else {
            throw new Error('Failed to download video, Uri or videoBytes not found.');
        }
    }
    else {
        throw new Error('Unsupported file type');
    }
}
