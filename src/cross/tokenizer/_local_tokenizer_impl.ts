/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * LocalTokenizer implementation that integrates SentencePiece with platform-specific
 * caching and file operations.
 *
 * This is the main implementation that brings together:
 * - SentencePiece BPE tokenizer
 * - Platform-specific model loading and caching
 * - Text extraction from Content/Tool/Schema objects
 */

import {tContent, tContents} from '../../_transformers.js';
import type {
  ComputeTokensResult,
  ContentListUnion,
  CountTokensConfig,
  CountTokensResult,
  TokensInfo,
} from '../../types.js';
import {SentencePieceProcessor} from '../sentencepiece/_processor.js';
import {ILocalTokenizer, TokenizerPlatform} from './_interfaces.js';
import {getTokenizerName, loadModelProtoBytes} from './_loader.js';
import {TextsAccumulator} from './_texts_accumulator.js';

type SentencePieceProcessorConstructor = new (
  modelBytes: Uint8Array,
) => SentencePieceProcessor;

/**
 * LocalTokenizer provides text-only local tokenization for Gemini models.
 *
 * LIMITATIONS:
 * - Only supports text-based tokenization (no multimodal)
 * - Forward compatibility depends on open-source tokenizer models
 * - For tools/schemas, only supports types.Tool and types.Schema objects
 *   (Python functions or Pydantic models cannot be passed directly)
 */
export class LocalTokenizer implements ILocalTokenizer {
  private tokenizerName: string;
  private platform: TokenizerPlatform;
  private processor?: SentencePieceProcessor;
  private modelName: string;

  /**
   * Creates a new LocalTokenizer.
   *
   * @param modelName Gemini model name (e.g., 'gemini-2.0-flash-001')
   * @param platform Platform-specific implementations for caching and file operations
   */
  constructor(
    modelName: string,
    platform: TokenizerPlatform,
    private readonly ProcessorClass: SentencePieceProcessorConstructor = SentencePieceProcessor,
  ) {
    this.modelName = modelName;
    this.tokenizerName = getTokenizerName(modelName);
    this.platform = platform;
  }

  private async ensureProcessor(): Promise<void> {
    if (this.processor) {
      return;
    }

    const modelBytes = await loadModelProtoBytes(
      this.tokenizerName,
      this.platform,
    );

    this.processor = new this.ProcessorClass(modelBytes);
  }

  /**
   * Counts the number of tokens in the given content.
   *
   * @param contents The contents to tokenize
   * @param config Optional configuration for counting tokens
   * @return A CountTokensResult containing the total number of tokens
   *
   * @example
   * ```typescript
   * const tokenizer = new LocalTokenizer('gemini-2.0-flash-001', platform);
   * const result = await tokenizer.countTokens("What is your name?");
   * console.log(result.totalTokens); // 5
   * ```
   */
  async countTokens(
    contents: ContentListUnion,
    config?: CountTokensConfig,
  ): Promise<CountTokensResult> {
    await this.ensureProcessor();

    const processedContents = tContents(contents);

    const textAccumulator = new TextsAccumulator();
    textAccumulator.addContents(processedContents);

    if (config?.systemInstruction) {
      const systemContent = tContent(config.systemInstruction);
      textAccumulator.addContents([systemContent]);
    }

    if (config?.tools) {
      textAccumulator.addTools(config.tools);
    }

    if (config?.generationConfig?.responseSchema) {
      textAccumulator.addSchema(config.generationConfig.responseSchema);
    }

    const texts = textAccumulator.getTexts();
    let totalTokens = 0;

    for (const text of texts) {
      const tokens = this.processor!.encode(text);
      totalTokens += tokens.length;
    }

    return {
      totalTokens,
    };
  }

  /**
   * Computes detailed token information for the given content.
   *
   * @param contents The contents to tokenize
   * @return A ComputeTokensResult containing token IDs, bytes, and roles
   *
   * @example
   * ```typescript
   * const tokenizer = new LocalTokenizer('gemini-2.0-flash-001', platform);
   * const result = await tokenizer.computeTokens("What is your name?");
   * console.log(result.tokensInfo);
   * // [{tokenIds: [279, 329, 1313, 2508, 13], tokens: [' What', ' is', ...], role: 'user'}]
   * ```
   */
  async computeTokens(
    contents: ContentListUnion,
  ): Promise<ComputeTokensResult> {
    await this.ensureProcessor();

    const processedContents = tContents(contents);

    const tokensInfo: TokensInfo[] = [];

    for (const content of processedContents) {
      const textAccumulator = new TextsAccumulator();
      textAccumulator.addContent(content);

      const texts = textAccumulator.getTexts();

      const allTokenIds: number[] = [];
      const allTokens: string[] = [];

      for (const text of texts) {
        const tokens = this.processor!.encode(text);
        allTokenIds.push(...tokens.map((t) => t.id));
        allTokens.push(...tokens.map((t) => this.tokenTextToBase64(t.text)));
      }

      if (allTokenIds.length > 0) {
        tokensInfo.push({
          tokenIds: allTokenIds.map((id) => id.toString()),
          tokens: allTokens,
          role: content.role,
        });
      }
    }

    return {
      tokensInfo,
    };
  }

  private tokenTextToBase64(text: string): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text.replace(/▁/g, ' '));

    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
