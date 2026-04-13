/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {TokenizerConfig, TokenizerPlatform} from './_interfaces.js';

/**
 * Source of truth: https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models
 */
const GEMINI_MODELS_TO_TOKENIZER_NAMES: Record<string, string> = {
  'gemini-2.5-pro': 'gemma3',
  'gemini-2.5-flash': 'gemma3',
  'gemini-2.5-flash-lite': 'gemma3',
  'gemini-2.0-flash': 'gemma3',
  'gemini-2.0-flash-lite': 'gemma3',
};

const GEMINI_STABLE_MODELS_TO_TOKENIZER_NAMES: Record<string, string> = {
  'gemini-3-pro-preview': 'gemma3',
  'gemini-2.5-pro-preview-06-05': 'gemma3',
  'gemini-2.5-pro-preview-05-06': 'gemma3',
  'gemini-2.5-pro-exp-03-25': 'gemma3',
  'gemini-live-2.5-flash': 'gemma3',
  'gemini-2.5-flash-preview-05-20': 'gemma3',
  'gemini-2.5-flash-preview-04-17': 'gemma3',
  'gemini-2.5-flash-lite-preview-06-17': 'gemma3',
  'gemini-2.0-flash-001': 'gemma3',
  'gemini-2.0-flash-lite-001': 'gemma3',
};

const TOKENIZERS: Record<string, TokenizerConfig> = {
  gemma2: {
    modelUrl:
      'https://raw.githubusercontent.com/google/gemma_pytorch/33b652c465537c6158f9a472ea5700e5e770ad3f/tokenizer/tokenizer.model',
    modelHash:
      '61a7b147390c64585d6c3543dd6fc636906c9af3865a5548f27f31aee1d4c8e2',
  },
  gemma3: {
    modelUrl:
      'https://raw.githubusercontent.com/google/gemma_pytorch/014acb7ac4563a5f77c76d7ff98f31b568c16508/tokenizer/gemma3_cleaned_262144_v2.spiece.model',
    modelHash:
      '1299c11d7cf632ef3b4e11937501358ada021bbdf7c47638d13c0ee982f2e79c',
  },
};

/**
 * Gets the tokenizer name for the given model name.
 *
 * @param modelName The Gemini model name
 * @return The tokenizer name to use
 * @throws Error if the model is not supported
 */
export function getTokenizerName(modelName: string): string {
  if (modelName in GEMINI_MODELS_TO_TOKENIZER_NAMES) {
    return GEMINI_MODELS_TO_TOKENIZER_NAMES[modelName];
  }
  if (modelName in GEMINI_STABLE_MODELS_TO_TOKENIZER_NAMES) {
    return GEMINI_STABLE_MODELS_TO_TOKENIZER_NAMES[modelName];
  }

  const supportedModels = [
    ...Object.keys(GEMINI_MODELS_TO_TOKENIZER_NAMES),
    ...Object.keys(GEMINI_STABLE_MODELS_TO_TOKENIZER_NAMES),
  ].join(', ');

  throw new Error(
    `Model ${modelName} is not supported for local tokenization. Supported models: ${supportedModels}.`,
  );
}

/**
 * Gets the tokenizer configuration for the given tokenizer name.
 *
 * @param tokenizerName The tokenizer name
 * @return The tokenizer configuration
 * @throws Error if the tokenizer is not found
 */
export function getTokenizerConfig(tokenizerName: string): TokenizerConfig {
  if (!(tokenizerName in TOKENIZERS)) {
    throw new Error(
      `Tokenizer ${tokenizerName} is not supported. Supported tokenizers: ${Object.keys(TOKENIZERS).join(', ')}`,
    );
  }
  return TOKENIZERS[tokenizerName];
}

/**
 * Loads tokenizer model bytes from cache or URL.
 *
 * @param tokenizerName The tokenizer name
 * @param platform Platform-specific implementations
 * @return The model bytes
 */
export async function loadModelProtoBytes(
  tokenizerName: string,
  platform: TokenizerPlatform,
): Promise<Uint8Array> {
  const config = getTokenizerConfig(tokenizerName);

  const encoder = new TextEncoder();
  const cacheKey = await platform.fileSystem.computeSha1(
    encoder.encode(config.modelUrl),
  );

  let modelData = await platform.cache.load(cacheKey, config.modelHash);

  if (!modelData) {
    modelData = await platform.fileSystem.fetchFromUrl(config.modelUrl);

    const isValid = await platform.fileSystem.validateHash(
      modelData,
      config.modelHash,
    );

    if (!isValid) {
      const actualHash = await platform.fileSystem.computeSha1(modelData);
      throw new Error(
        `Downloaded model file is corrupted. Expected hash ${config.modelHash}. Got file hash ${actualHash}.`,
      );
    }

    await platform.cache.save(cacheKey, modelData);
  }

  return modelData;
}
