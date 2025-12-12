/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generic priority queue with Insert, PopMax, and RemoveFunc operations.
 * Translated from go-sentencepiece/internal/priorityqueue
 *
 * Uses a binary heap data structure where items[0] is unused,
 * and elements are stored at indices 1...N.
 */
export class PriorityQueue<T> {
  private cmp: (a: T, b: T) => number;
  private items: T[];

  /**
   * Creates a new PriorityQueue.
   *
   * @param sizeHint Initial capacity hint for the queue
   * @param cmp Comparison function that returns > 0 if a has higher priority than b,
   *            0 if equal priority, < 0 otherwise
   */
  constructor(sizeHint: number, cmp: (a: T, b: T) => number) {
    this.cmp = cmp;
    this.items = new Array(Math.max(1, sizeHint + 1));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.items[0] = null as any;
    this.items.length = 1;
  }

  /**
   * Returns the number of items in the queue.
   */
  len(): number {
    return this.items.length - 1;
  }

  /**
   * Inserts a new element into the priority queue.
   */
  insert(elem: T): void {
    this.items.push(elem);
    this.siftUp(this.items.length - 1);
  }

  /**
   * Returns and removes the element with the maximal priority.
   * Throws if the queue is empty.
   */
  popMax(): T {
    if (this.items.length < 2) {
      throw new Error('popping from empty priority queue');
    }
    const maxItem = this.items[1];
    this.items[1] = this.items[this.items.length - 1];
    this.items.pop();
    if (this.items.length > 1) {
      this.siftDown(1);
    }
    return maxItem;
  }

  /**
   * Removes all elements for which the predicate returns true.
   */
  removeFunc(rm: (elem: T) => boolean): void {
    let i = 1;
    while (i < this.items.length && !rm(this.items[i])) {
      i++;
    }
    if (i === this.items.length) {
      return;
    }

    for (let j = i + 1; j < this.items.length; j++) {
      if (!rm(this.items[j])) {
        this.items[i] = this.items[j];
        i++;
      }
    }

    this.items.length = i;

    this.rebuildHeap();
  }

  /**
   * Rebuilds the entire heap from scratch.
   */
  private rebuildHeap(): void {
    for (let i = Math.floor(this.items.length / 2); i >= 1; i--) {
      this.siftDown(i);
    }
  }

  /**
   * Moves an element up the heap until heap property is restored.
   */
  private siftUp(n: number): void {
    let i = n;
    while (i > 1) {
      const p = Math.floor(i / 2);
      if (this.cmp(this.items[p], this.items[i]) >= 0) {
        return;
      }
      [this.items[i], this.items[p]] = [this.items[p], this.items[i]];
      i = p;
    }
  }

  /**
   * Moves an element down the heap until heap property is restored.
   */
  private siftDown(i: number): void {
    // eslint-disable-next-line
    while (true) {
      const c = 2 * i;
      if (c >= this.items.length) {
        return;
      }

      let maxChild = c;
      if (c + 1 < this.items.length) {
        if (this.cmp(this.items[c + 1], this.items[c]) > 0) {
          maxChild = c + 1;
        }
      }

      if (this.cmp(this.items[i], this.items[maxChild]) >= 0) {
        return;
      }

      [this.items[i], this.items[maxChild]] = [
        this.items[maxChild],
        this.items[i],
      ];
      i = maxChild;
    }
  }
}
