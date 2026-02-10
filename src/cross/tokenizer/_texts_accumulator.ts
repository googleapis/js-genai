/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TextsAccumulator extracts countable text from Content and Tool objects.
 *
 * This class traverses complex Content and Tool objects and extracts all text
 * content that should be included when calculating token counts.
 *
 * A key feature is its ability to detect unsupported fields in Content objects.
 * If a user provides a Content object with fields that this local tokenizer
 * doesn't recognize, this class will log a warning.
 *
 * Translated from python-genai/local_tokenizer.py
 */

import type {
  Content,
  FunctionCall,
  FunctionDeclaration,
  FunctionResponse,
  Part,
  Schema,
  Tool,
} from '../../types.js';

/**
 * Accumulates countable texts from Content and Tool objects.
 */
export class TextsAccumulator {
  private texts: string[];

  constructor() {
    this.texts = [];
  }

  /**
   * Returns all accumulated texts.
   */
  getTexts(): string[] {
    return this.texts;
  }

  /**
   * Adds multiple Content objects.
   */
  addContents(contents: Content[]): void {
    for (const content of contents) {
      this.addContent(content);
    }
  }

  addContent(content: Content): void {
    const countedContent: Content = {
      parts: [],
      role: content.role,
    };

    if (content.parts) {
      for (const part of content.parts) {
        const countedPart: Part = {};

        if (part.fileData || part.inlineData) {
          throw new Error(
            'LocalTokenizers do not support non-text content types.',
          );
        }

        if (part.videoMetadata) {
          countedPart.videoMetadata = part.videoMetadata;
        }

        if (part.functionCall) {
          this.addFunctionCall(part.functionCall);
          countedPart.functionCall = part.functionCall;
        }

        if (part.functionResponse) {
          this.addFunctionResponse(part.functionResponse);
          countedPart.functionResponse = part.functionResponse;
        }

        if (part.text) {
          countedPart.text = part.text;
          this.texts.push(part.text);
        }

        if (countedContent.parts) {
          countedContent.parts.push(countedPart);
        }
      }
    }

    if (!this.deepEqual(content, countedContent)) {
      console.warn(
        `Content contains unsupported types for token counting. ` +
          `Supported fields: ${JSON.stringify(countedContent)}. ` +
          `Got: ${JSON.stringify(content)}.`,
      );
    }
  }

  addFunctionCall(functionCall: FunctionCall): void {
    if (functionCall.name) {
      this.texts.push(functionCall.name);
    }

    if (functionCall.args) {
      this.dictTraverse(functionCall.args);
    }
  }

  addTools(tools: Tool[]): void {
    for (const tool of tools) {
      this.addTool(tool);
    }
  }

  addTool(tool: Tool): void {
    if (tool.functionDeclarations) {
      for (const functionDeclaration of tool.functionDeclarations) {
        this.functionDeclarationTraverse(functionDeclaration);
      }
    }
  }

  addFunctionResponses(functionResponses: FunctionResponse[]): void {
    for (const functionResponse of functionResponses) {
      this.addFunctionResponse(functionResponse);
    }
  }

  addFunctionResponse(functionResponse: FunctionResponse): void {
    if (functionResponse.name) {
      this.texts.push(functionResponse.name);
    }

    if (functionResponse.response) {
      this.dictTraverse(functionResponse.response);
    }
  }

  private functionDeclarationTraverse(
    functionDeclaration: FunctionDeclaration,
  ): void {
    if (functionDeclaration.name) {
      this.texts.push(functionDeclaration.name);
    }

    if (functionDeclaration.description) {
      this.texts.push(functionDeclaration.description);
    }

    if (functionDeclaration.parameters) {
      this.addSchema(functionDeclaration.parameters);
    }

    if (functionDeclaration.response) {
      this.addSchema(functionDeclaration.response);
    }
  }

  addSchema(schema: Schema): void {
    if (schema.format) {
      this.texts.push(schema.format);
    }

    if (schema.description) {
      this.texts.push(schema.description);
    }

    if (schema.enum) {
      this.texts.push(...schema.enum);
    }

    if (schema.required) {
      this.texts.push(...schema.required);
    }

    if (schema.items) {
      this.addSchema(schema.items);
    }

    if (schema.properties) {
      for (const [key, value] of Object.entries(schema.properties)) {
        this.texts.push(key);
        this.addSchema(value);
      }
    }

    if (schema.example !== undefined && schema.example !== null) {
      this.anyTraverse(schema.example);
    }
  }

  private dictTraverse(obj: Record<string, any>): void {
    this.texts.push(...Object.keys(obj));
    for (const value of Object.values(obj)) {
      this.anyTraverse(value);
    }
  }

  private anyTraverse(value: any): void {
    if (typeof value === 'string') {
      this.texts.push(value);
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        for (const item of value) {
          this.anyTraverse(item);
        }
      } else {
        this.dictTraverse(value);
      }
    }
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return obj1 === obj2;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) return false;
      for (let i = 0; i < obj1.length; i++) {
        if (!this.deepEqual(obj1[i], obj2[i])) return false;
      }
      return true;
    }

    const keys1 = Object.keys(obj1).filter((k) => obj1[k] !== undefined);
    const keys2 = Object.keys(obj2).filter((k) => obj2[k] !== undefined);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!this.deepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
  }
}
