import type { AnyFormComponent } from '@/form/registry/componentRegistry';

class MinHeap {
  private heap: number[] = [];

  push(val: number) {
    this.heap.push(val);
    this.bubbleUp();
  }

  pop(): number | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return min;
  }

  private bubbleUp() {
    let index = this.heap.length - 1;
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index] >= this.heap[parentIndex]) break;
      // Swap
      [this.heap[index], this.heap[parentIndex]] = [
        this.heap[parentIndex],
        this.heap[index],
      ];
      index = parentIndex;
    }
  }

  private sinkDown(index: number) {
    const length = this.heap.length;
    while (true) {
      const leftChildIdx = 2 * index + 1;
      const rightChildIdx = 2 * index + 2;
      let smallest = index;

      if (
        leftChildIdx < length &&
        this.heap[leftChildIdx] < this.heap[smallest]
      ) {
        smallest = leftChildIdx;
      }
      if (
        rightChildIdx < length &&
        this.heap[rightChildIdx] < this.heap[smallest]
      ) {
        smallest = rightChildIdx;
      }

      if (smallest === index) break;

      // Swap
      [this.heap[index], this.heap[smallest]] = [
        this.heap[smallest],
        this.heap[index],
      ];
      index = smallest;
    }
  }
}

/**
 * Discovers the absolute lowest unoccupied numbered suffix (e.g. "Multi Line Text 1")
 * using a mathematical MEX sequence injected into a Min-Heap.
 */
export function getLeastUnoccupiedLabel(
  components: AnyFormComponent[],
  baseLabel: string
): string {
  if (!baseLabel) return '';

  const usedNumbers = new Set<number>();

  for (const comp of components) {
    const label = comp.metadata?.label;
    if (label && label.startsWith(baseLabel)) {
      const suffix = label.slice(baseLabel.length).trim();
      const num = parseInt(suffix, 10);
      // Valid numeric suffixes (1, 2, 3...)
      if (!isNaN(num) && num > 0) {
        usedNumbers.add(num);
      }
    }
  }

  const heap = new MinHeap();
  // By Pigeonhole Principle, the first missing positive integer must be in range [1 ... N+1]
  const maxPossible = usedNumbers.size + 1;

  for (let i = 1; i <= maxPossible; i++) {
    if (!usedNumbers.has(i)) {
      heap.push(i);
    }
  }

  const leastAvailable = heap.pop();
  return `${baseLabel} ${leastAvailable}`;
}
