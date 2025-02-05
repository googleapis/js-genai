/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {ApiClient} from './_api_client';
import * as t from './_transformers';
import {Models} from './models';
import * as types from './types';

/**
 * Validates the GenerateContentResponse.
 *
 * @param response The GenerateContentResponse to validate.
 * @returns True if the response is valid, false otherwise.
 */
function validateResponse(response: types.GenerateContentResponse): boolean {
  if (response.candidates == undefined || response.candidates.length === 0) {
    return false;
  }
  const content = response.candidates[0]?.content;
  if (content === undefined) {
    return false;
  }
  if (content.parts === undefined || content.parts.length === 0) {
    return false;
  }
  for (const part of content.parts) {
    if (part === undefined || Object.keys(part).length === 0) {
      return false;
    }
    if (part.text !== undefined && part.text === '') {
      return false;
    }
  }
  return true;
}

/**
 * Processes the stream response and appends the valid response to the history.
 *
 * @param streamResponse The stream response to process.
 * @param curatedHistory The curated history of the conversation.
 * @param inputContent The input content which sends to the model.
 * @returns generator of the stream response.
 */
async function* processStreamResponse(
  streamResponse: AsyncGenerator<types.GenerateContentResponse>,
  curatedHistory: types.Content[],
  inputContent: types.Content,
) {
  const outputContent: types.Content[] = [];
  let finishReason: types.FinishReason | undefined = undefined;
  for await (const chunk of streamResponse) {
    if (validateResponse(chunk)) {
      const content = chunk?.candidates?.[0]?.content;
      if (content !== undefined) {
        outputContent.push(content);
      }
      if (chunk?.candidates?.[0]?.finishReason !== undefined) {
        finishReason = chunk.candidates[0].finishReason;
      }
    }
    if (outputContent.length && finishReason !== undefined) {
      curatedHistory.push(inputContent);
      curatedHistory.push(...outputContent);
    }
    yield chunk;
  }
}

/**
 * A utility class to create a chat session.
 */
export class Chats {
  private readonly modelsModule: Models;
  private readonly apiClient: ApiClient;

  constructor(modelsModule: Models, apiClient: ApiClient) {
    this.modelsModule = modelsModule;
    this.apiClient = apiClient;
  }

  /**
   * Creates a new chat session.
   *
   * @param model The model to use for the chat.
   * @param config The configuration to use for the generate content request.
   * @param history The initial history to use for the chat.
   * @returns A new chat session.
   */
  create(
    model: string,
    config: types.GenerateContentConfig = {},
    history: types.Content[] = [],
  ) {
    return new Chat(this.apiClient, this.modelsModule, model, config, history);
  }
}

/**
 * Chat session that enables sending messages and stores the chat history so
 * far.
 */
export class Chat {
  // A promise to represent the current state of the message being sent to the
  // model.
  private sendPromise: Promise<void> = Promise.resolve();

  constructor(
    private readonly apiClient: ApiClient,
    private readonly modelsModule: Models,
    private readonly model: string,
    private readonly config: types.GenerateContentConfig,
    private readonly curatedHistory: types.Content[],
  ) {}

  /**
   * Sends a message to the model and returns the response.
   *
   * This method will wait for the previous message to be processed before
   * sending the next message.
   *
   * @see {@link Chat#sendMessageStream} for streaming method.
   * @param message The message to send.
   * @returns The model's response.
   */
  async sendMessage(
    message: types.PartListUnion,
  ): Promise<types.GenerateContentResponse> {
    await this.sendPromise;
    const inputContent = t.tContent(this.apiClient, message);
    const responsePromise = this.modelsModule.generateContent(
      this.model,
      this.curatedHistory.concat(inputContent),
      this.config,
    );
    this.sendPromise = (async () => {
      const response = await responsePromise;
      if (validateResponse(response)) {
        this.curatedHistory.push(inputContent);
        const outputContent = response?.candidates?.[0]?.content;
        if (outputContent !== undefined) {
          this.curatedHistory.push(outputContent);
        }
      }
      return;
    })();
    await this.sendPromise;
    return responsePromise;
  }

  /**
   * Sends a message to the model and returns the response in chunks.
   *
   * This method will wait for the previous message to be processed before
   * sending the next message.
   *
   * @see {@link Chat#sendMessage} for non-streaming method.
   * @param message The message to send.
   * @returns The model's response.
   */
  async sendMessageStream(
    message: types.PartListUnion,
  ): Promise<AsyncGenerator<types.GenerateContentResponse>> {
    await this.sendPromise;
    const inputContent = t.tContent(this.apiClient, message);
    const streamResponse = this.modelsModule.generateContentStream(
      this.model,
      this.curatedHistory.concat(inputContent),
      this.config,
    );
    this.sendPromise = streamResponse.then(() => undefined);
    const response = await streamResponse;
    const result = processStreamResponse(
      response,
      this.curatedHistory,
      inputContent,
    );
    return result;
  }
}
