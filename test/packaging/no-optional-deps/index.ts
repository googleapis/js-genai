/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI, mcpToTool} from '@google/genai';

// If it's unused the formatter removes the import. mcpToTool is the surface
// whose declarations reference the optional @modelcontextprotocol/sdk peer.
console.log(GoogleGenAI, mcpToTool);
