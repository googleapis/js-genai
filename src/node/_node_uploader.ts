/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'fs/promises';

import {ApiClient} from '../_api_client.js';
import {FileStat, Uploader} from '../_uploader.js';
import {
  DELAY_MULTIPLIER,
  INITIAL_RETRY_DELAY_MS,
  MAX_CHUNK_SIZE,
  MAX_RETRY_COUNT,
  X_GOOG_UPLOAD_STATUS_HEADER_FIELD,
  getBlobStat,
  sleep,
  uploadBlob,
} from '../cross/_cross_uploader.js';
import {File, HttpResponse} from '../types.js';

export class NodeUploader implements Uploader {
  async stat(file: string | Blob): Promise<FileStat> {
    const fileStat: FileStat = {size: 0, type: undefined};
    if (typeof file === 'string') {
      const originalStat = await fs.stat(file);
      fileStat.size = originalStat.size;
      fileStat.type = this.inferMimeType(file);
      return fileStat;
    } else {
      return await getBlobStat(file);
    }
  }

  async upload(
    file: string | Blob,
    uploadUrl: string,
    apiClient: ApiClient,
  ): Promise<File> {
    if (typeof file === 'string') {
      return await this.uploadFileFromPath(file, uploadUrl, apiClient);
    } else {
      return uploadBlob(file, uploadUrl, apiClient);
    }
  }

  /**
   * Infers the MIME type of a file based on its extension.
   *
   * @param filePath The path to the file.
   * @returns The MIME type of the file, or undefined if it cannot be inferred.
   */
  private inferMimeType(filePath: string): string | undefined {
    // Get the file extension.
    const fileExtension = filePath.slice(filePath.lastIndexOf('.') + 1);

    // Create a map of file extensions to MIME types.
    const mimeTypes: {[key: string]: string} = {
      'aac': 'audio/aac',
      'abw': 'application/x-abiword',
      'arc': 'application/x-freearc',
      'avi': 'video/x-msvideo',
      'azw': 'application/vnd.amazon.ebook',
      'bin': 'application/octet-stream',
      'bmp': 'image/bmp',
      'bz': 'application/x-bzip',
      'bz2': 'application/x-bzip2',
      'csh': 'application/x-csh',
      'css': 'text/css',
      'csv': 'text/csv',
      'doc': 'application/msword',
      'docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'eot': 'application/vnd.ms-fontobject',
      'epub': 'application/epub+zip',
      'gz': 'application/gzip',
      'gif': 'image/gif',
      'htm': 'text/html',
      'html': 'text/html',
      'ico': 'image/vnd.microsoft.icon',
      'ics': 'text/calendar',
      'jar': 'application/java-archive',
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
      'js': 'text/javascript',
      'json': 'application/json',
      'jsonld': 'application/ld+json',
      'kml': 'application/vnd.google-earth.kml+xml',
      'kmz': 'application/vnd.google-earth.kmz+xml',
      'mjs': 'text/javascript',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
      'mpeg': 'video/mpeg',
      'mpkg': 'application/vnd.apple.installer+xml',
      'odt': 'application/vnd.oasis.opendocument.text',
      'oga': 'audio/ogg',
      'ogv': 'video/ogg',
      'ogx': 'application/ogg',
      'opus': 'audio/opus',
      'otf': 'font/otf',
      'png': 'image/png',
      'pdf': 'application/pdf',
      'php': 'application/x-httpd-php',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx':
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'rar': 'application/vnd.rar',
      'rtf': 'application/rtf',
      'sh': 'application/x-sh',
      'svg': 'image/svg+xml',
      'swf': 'application/x-shockwave-flash',
      'tar': 'application/x-tar',
      'tif': 'image/tiff',
      'tiff': 'image/tiff',
      'ts': 'video/mp2t',
      'ttf': 'font/ttf',
      'txt': 'text/plain',
      'vsd': 'application/vnd.visio',
      'wav': 'audio/wav',
      'weba': 'audio/webm',
      'webm': 'video/webm',
      'webp': 'image/webp',
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      'xhtml': 'application/xhtml+xml',
      'xls': 'application/vnd.ms-excel',
      'xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xml': 'application/xml',
      'xul': 'application/vnd.mozilla.xul+xml',
      'zip': 'application/zip',
      '3gp': 'video/3gpp',
      '3g2': 'video/3gpp2',
      '7z': 'application/x-7z-compressed',
    };

    // Look up the MIME type based on the file extension.
    const mimeType = mimeTypes[fileExtension.toLowerCase()];

    // Return the MIME type.
    return mimeType;
  }

  private async uploadFileFromPath(
    file: string,
    uploadUrl: string,
    apiClient: ApiClient,
  ): Promise<File> {
    let fileSize = 0;
    let offset = 0;
    let response: HttpResponse = new HttpResponse(new Response());
    let uploadCommand = 'upload';
    let fileHandle: fs.FileHandle | undefined;
    try {
      fileHandle = await fs.open(file, 'r');
      if (!fileHandle) {
        throw new Error(`Failed to open file`);
      }
      fileSize = (await fileHandle.stat()).size;
      while (offset < fileSize) {
        const chunkSize = Math.min(MAX_CHUNK_SIZE, fileSize - offset);
        if (offset + chunkSize >= fileSize) {
          uploadCommand += ', finalize';
        }
        const buffer = new Uint8Array(chunkSize);
        const {bytesRead: bytesRead} = await fileHandle.read(
          buffer,
          0,
          chunkSize,
          offset,
        );

        if (bytesRead !== chunkSize) {
          throw new Error(
            `Failed to read ${chunkSize} bytes from file at offset ${
              offset
            }. bytes actually read: ${bytesRead}`,
          );
        }

        const chunk = new Blob([buffer]);
        let retryCount = 0;
        let currentDelayMs = INITIAL_RETRY_DELAY_MS;
        const urlParts = new URL(uploadUrl);
        while (retryCount < MAX_RETRY_COUNT) {
          response = await apiClient.request({
            path: urlParts.pathname + urlParts.search,
            body: chunk,
            httpMethod: 'POST',
            httpOptions: {
              apiVersion: '',
              // baseUrl: uploadUrl, // This baseUrl affects the baseUrl set in apiClient, remove it
              headers: {
                'X-Goog-Upload-Command': uploadCommand,
                'X-Goog-Upload-Offset': String(offset),
                'Content-Length': String(bytesRead),
              },
            },
          });
          if (response?.headers?.[X_GOOG_UPLOAD_STATUS_HEADER_FIELD]) {
            break;
          }
          retryCount++;
          await sleep(currentDelayMs);
          currentDelayMs = currentDelayMs * DELAY_MULTIPLIER;
        }
        offset += bytesRead;
        // The `x-goog-upload-status` header field can be `active`, `final` and
        //`cancelled` in resposne.
        if (
          response?.headers?.[X_GOOG_UPLOAD_STATUS_HEADER_FIELD] !== 'active'
        ) {
          break;
        }
        if (fileSize <= offset) {
          throw new Error(
            'All content has been uploaded, but the upload status is not finalized.',
          );
        }
      }
      const responseJson = (await response?.json()) as Record<
        string,
        File | unknown
      >;
      if (response?.headers?.[X_GOOG_UPLOAD_STATUS_HEADER_FIELD] !== 'final') {
        throw new Error(
          'Failed to upload file: Upload status is not finalized.',
        );
      }
      return responseJson['file'] as File;
    } finally {
      // Ensure the file handle is always closed
      if (fileHandle) {
        await fileHandle.close();
      }
    }
  }
}
