/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * PrefixMatcher helps find longest prefixes using a trie data structure.
 * Translated from go-sentencepiece/internal/prefixmatcher
 */

interface TrieNode {
  children: Map<string, TrieNode>;
  final: boolean;
}

function newTrieNode(): TrieNode {
  return {
    children: new Map(),
    final: false,
  };
}

/**
 * PrefixMatcher finds the longest prefix of a string that matches
 * a vocabulary word using a trie data structure.
 */
export class PrefixMatcher {
  private root: TrieNode;

  /**
   * Creates a new PrefixMatcher from a set of vocabulary strings.
   */
  constructor(vocab: Set<string>) {
    this.root = newTrieNode();
    for (const word of vocab) {
      this.add(word);
    }
  }

  /**
   * Finds the longest prefix of text that matches a vocabulary word.
   * Returns the length of the prefix, or 0 if no prefix was found.
   */
  findPrefixLen(text: string): number {
    let node = this.root;
    let maxLen = 0;

    let i = 0;
    for (const char of text) {
      const child = node.children.get(char);
      if (!child) {
        return maxLen;
      }
      if (child.final) {
        maxLen = i + 1;
      }
      node = child;
      i++;
    }

    return maxLen;
  }

  /**
   * Adds a word to the trie.
   */
  private add(word: string): void {
    let node = this.root;

    for (const char of word) {
      let child = node.children.get(char);
      if (!child) {
        child = newTrieNode();
        node.children.set(char, child);
      }
      node = child;
    }

    node.final = true;
  }
}
