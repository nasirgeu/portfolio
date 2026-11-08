/**
 * Sorting engine. Pure functions, no screen code.
 * Every algorithm sorts a copy of the input and records one Step per visible action
 * (a comparison, a swap or a write) with a plain-English note.
 */

export type SortAlgorithm =
  | 'bubble'
  | 'selection'
  | 'insertion'
  | 'merge'
  | 'quick'
  | 'heap'
  | 'counting'
  | 'radix'
  | 'shell';

export const SORT_ALGORITHMS: readonly SortAlgorithm[] = [
  'bubble',
  'selection',
  'insertion',
  'merge',
  'quick',
  'heap',
  'counting',
  'radix',
  'shell',
];

export const SORT_LABEL: Record<SortAlgorithm, string> = {
  bubble: 'Bubble',
  selection: 'Selection',
  insertion: 'Insertion',
  merge: 'Merge',
  quick: 'Quick',
  heap: 'Heap',
  counting: 'Counting',
  radix: 'Radix',
  shell: 'Shell',
};

export const SORT_EXPLAIN: Record<SortAlgorithm, string> = {
  bubble: 'Compares neighbouring values and swaps them when they are in the wrong order. After each pass, the largest remaining value moves towards the end of the list.',
  selection: 'Finds the smallest value in the unsorted part and swaps it to the front, one position at a time.',
  insertion: 'Takes the next value and slides it left until it sits in the right place among the values already sorted.',
  merge: 'Splits the list in halves, sorts each half, then merges the two sorted halves back together.',
  quick: 'Picks a pivot, moves smaller values to its left and larger to its right, then repeats on each side.',
  heap: 'Builds a max-heap so the largest value is at the front, then moves it to the end and repairs the heap.',
  counting: 'Counts how many times each value appears, then writes the values back in order. It never compares two values.',
  radix: 'Sorts by one digit at a time, from the last digit to the first, using a stable counting pass for each digit.',
  shell: 'Insertion sort on values far apart first (a gap), then on a smaller and smaller gap, ending with gap 1.',
};

export type StepKind = 'compare' | 'swap' | 'write' | 'pivot' | 'done' | 'start';

export interface Step {
  kind: StepKind;
  /** The whole array after this step. */
  array: number[];
  /** Positions being compared or touched. */
  focus: number[];
  /** Positions that are in their final place. */
  sorted: number[];
  /** A position or range being worked on (pivot, merge range, gap). */
  marker: number | null;
  /** Active range [lo, hi] (inclusive) for divide-and-conquer algorithms, or null. */
  range: [number, number] | null;
  comparisons: number;
  writes: number;
  note: string;
}

export interface SortResult {
  steps: Step[];
  comparisons: number;
  /** Swaps for swap-based algorithms, element writes for the others. */
  writes: number;
  sorted: number[];
}

export const MAX_ITEMS = 16;
export const MIN_VALUE = 0;
export const MAX_VALUE = 99;

export function parseNumbers(text: string): { values: number[]; error: string | null } {
  const parts = text.split(/[\s,]+/).filter((p) => p.length > 0);
  if (parts.length === 0) return { values: [], error: 'Enter at least two numbers, for example 5 2 9 1 7.' };
  const values: number[] = [];
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return { values: [], error: `"${p}" is not a whole number. Use numbers from 0 to 99, separated by spaces.` };
    const n = Number(p);
    if (n < MIN_VALUE || n > MAX_VALUE) return { values: [], error: `${n} is out of range. Use numbers from 0 to 99.` };
    values.push(n);
  }
  if (values.length < 2) return { values: [], error: 'Enter at least two numbers so there is something to sort.' };
  if (values.length > MAX_ITEMS) return { values: [], error: `Use at most ${MAX_ITEMS} numbers so the bars stay readable.` };
  return { values, error: null };
}

class Recorder {
  steps: Step[] = [];
  comparisons = 0;
  writes = 0;
  sorted = new Set<number>();
  a: number[];
  constructor(a: number[]) {
    this.a = a;
  }

  push(kind: StepKind, focus: number[], note: string, marker: number | null = null, range: [number, number] | null = null): void {
    this.steps.push({
      kind,
      array: [...this.a],
      focus,
      sorted: [...this.sorted].sort((x, y) => x - y),
      marker,
      range,
      comparisons: this.comparisons,
      writes: this.writes,
      note,
    });
  }

  /** Compare a[i] with a[j] (or a value) and record it. Returns true when a[i] > a[j]. */
  greater(i: number, j: number, note: (gt: boolean) => string, marker: number | null = null, range: [number, number] | null = null): boolean {
    this.comparisons++;
    const gt = (this.a[i] as number) > (this.a[j] as number);
    this.push('compare', [i, j], note(gt), marker, range);
    return gt;
  }

  /** Swap a[i] and a[j]. The note builder receives the two values as they were before the swap. */
  swap(i: number, j: number, note: (x: number, y: number) => string, marker: number | null = null, range: [number, number] | null = null): void {
    const x = this.a[i] as number;
    const y = this.a[j] as number;
    this.a[i] = y;
    this.a[j] = x;
    this.writes++;
    this.push('swap', [i, j], note(x, y), marker, range);
  }
}

const v = (r: Recorder, i: number): number => r.a[i] as number;

/* ------------------------------------------------------------------ the algorithms */

function bubble(r: Recorder): void {
  const n = r.a.length;
  for (let pass = 0; pass < n - 1; pass++) {
    let swapped = false;
    for (let i = 0; i < n - 1 - pass; i++) {
      const gt = r.greater(i, i + 1, (g) =>
        g
          ? `${v(r, i)} is bigger than ${v(r, i + 1)}, so they are out of order.`
          : `${v(r, i)} is not bigger than ${v(r, i + 1)}, so they stay.`,
      );
      if (gt) {
        r.swap(i, i + 1, (x, y) => `Swap ${x} and ${y}.`);
        swapped = true;
      }
    }
    r.sorted.add(n - 1 - pass);
    r.push('done', [n - 1 - pass], `Pass ${pass + 1} done: ${v(r, n - 1 - pass)} has bubbled to its final place.`);
    if (!swapped) {
      for (let k = 0; k < n; k++) r.sorted.add(k);
      r.push('done', [], 'No swaps in this pass, so the list is already sorted and the algorithm can stop early.');
      return;
    }
  }
  r.sorted.add(0);
}

function selection(r: Recorder): void {
  const n = r.a.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      const lessThanMin = r.greater(
        min,
        j,
        (g) =>
          g ? `${v(r, j)} is smaller than the current minimum ${v(r, min)}: new minimum.` : `${v(r, j)} is not smaller than ${v(r, min)}.`,
        min,
      );
      if (lessThanMin) min = j;
    }
    if (min !== i) r.swap(i, min, (_x, y) => `Swap the minimum ${y} into position ${i + 1}.`);
    else r.push('compare', [i], `${v(r, i)} is already the smallest of the rest, so no swap is needed.`);
    r.sorted.add(i);
    r.push('done', [i], `Position ${i + 1} is final.`);
  }
  r.sorted.add(n - 1);
}

function insertion(r: Recorder): void {
  const n = r.a.length;
  r.sorted.add(0);
  for (let i = 1; i < n; i++) {
    let j = i;
    r.push('pivot', [i], `Take ${v(r, i)} and insert it into the sorted part on its left.`, i);
    while (j > 0) {
      const gt = r.greater(j - 1, j, (g) =>
        g ? `${v(r, j - 1)} is bigger than ${v(r, j)}, so ${v(r, j)} moves left.` : `${v(r, j - 1)} is not bigger than ${v(r, j)}: ${v(r, j)} is in place.`,
      );
      if (!gt) break;
      r.swap(j - 1, j, (x, y) => `Swap ${x} and ${y}.`);
      j--;
    }
    r.sorted.add(i);
  }
  r.push('done', [], 'Every value has been inserted, so the list is sorted.');
}

function merge(r: Recorder): void {
  const n = r.a.length;
  const sort = (lo: number, hi: number): void => {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    sort(lo, mid);
    sort(mid + 1, hi);
    const left = r.a.slice(lo, mid + 1);
    const right = r.a.slice(mid + 1, hi + 1);
    r.push('pivot', [], `Merge the sorted halves [${left.join(', ')}] and [${right.join(', ')}].`, mid, [lo, hi]);
    let i = 0;
    let j = 0;
    let k = lo;
    while (i < left.length && j < right.length) {
      r.comparisons++;
      const takeLeft = (left[i] as number) <= (right[j] as number);
      r.push('compare', [lo + i, mid + 1 + j], `Compare ${left[i]} and ${right[j]}: ${takeLeft ? left[i] : right[j]} is smaller, so it goes next.`, mid, [lo, hi]);
      r.a[k] = takeLeft ? (left[i++] as number) : (right[j++] as number);
      r.writes++;
      r.push('write', [k], `Write ${r.a[k]} to position ${k + 1}.`, mid, [lo, hi]);
      k++;
    }
    while (i < left.length) {
      r.a[k] = left[i++] as number;
      r.writes++;
      r.push('write', [k], `Copy the leftover ${r.a[k]} to position ${k + 1}.`, mid, [lo, hi]);
      k++;
    }
    while (j < right.length) {
      r.a[k] = right[j++] as number;
      r.writes++;
      r.push('write', [k], `Copy the leftover ${r.a[k]} to position ${k + 1}.`, mid, [lo, hi]);
      k++;
    }
    if (lo === 0 && hi === n - 1) for (let x = 0; x < n; x++) r.sorted.add(x);
  };
  sort(0, n - 1);
  r.push('done', [], 'The last merge is complete, so the whole list is sorted.');
}

function quick(r: Recorder): void {
  const sort = (lo: number, hi: number): void => {
    if (lo > hi) return;
    if (lo === hi) {
      r.sorted.add(lo);
      return;
    }
    // Pivot: the last value of the range (Lomuto partition).
    const pivot = v(r, hi);
    r.push('pivot', [hi], `Choose the last value, ${pivot}, as the pivot for positions ${lo + 1} to ${hi + 1}.`, hi, [lo, hi]);
    let store = lo;
    for (let i = lo; i < hi; i++) {
      r.comparisons++;
      const smaller = v(r, i) < pivot;
      r.push('compare', [i, hi], `${v(r, i)} is ${smaller ? 'smaller than' : 'not smaller than'} the pivot ${pivot}.`, hi, [lo, hi]);
      if (smaller) {
        if (i !== store) r.swap(i, store, (x, y) => `Move ${x} to the left side by swapping with ${y}.`, hi, [lo, hi]);
        store++;
      }
    }
    if (store !== hi) r.swap(store, hi, () => `Put the pivot ${pivot} between the smaller and larger values.`, store, [lo, hi]);
    r.sorted.add(store);
    r.push('done', [store], `Pivot ${pivot} is now in its final position ${store + 1}.`, store, [lo, hi]);
    sort(lo, store - 1);
    sort(store + 1, hi);
  };
  sort(0, r.a.length - 1);
  for (let i = 0; i < r.a.length; i++) r.sorted.add(i);
  r.push('done', [], 'Every pivot is in place, so the list is sorted.');
}

function heap(r: Recorder): void {
  const n = r.a.length;
  const sift = (start: number, size: number): void => {
    let root = start;
    for (;;) {
      const l = 2 * root + 1;
      const rt = l + 1;
      let big = root;
      if (l < size && r.greater(l, big, (g) => (g ? `Child ${v(r, l)} is bigger than ${v(r, big)}.` : `Child ${v(r, l)} is not bigger than ${v(r, big)}.`))) big = l;
      if (rt < size && r.greater(rt, big, (g) => (g ? `Child ${v(r, rt)} is bigger than ${v(r, big)}.` : `Child ${v(r, rt)} is not bigger than ${v(r, big)}.`))) big = rt;
      if (big === root) return;
      r.swap(root, big, (x, y) => `Swap parent ${x} with its bigger child ${y} to keep the heap valid.`);
      root = big;
    }
  };
  r.push('pivot', [], 'Build a max-heap: every parent must be at least as big as its children.');
  for (let i = (n >> 1) - 1; i >= 0; i--) sift(i, n);
  r.push('done', [0], `The heap is built. The largest value, ${v(r, 0)}, is at the front.`);
  for (let end = n - 1; end > 0; end--) {
    r.swap(0, end, (x) => `Move the largest value ${x} to its final position ${end + 1}.`);
    r.sorted.add(end);
    sift(0, end);
  }
  r.sorted.add(0);
  r.push('done', [], 'The heap is empty, so the list is sorted.');
}

function counting(r: Recorder): void {
  const n = r.a.length;
  const max = Math.max(...r.a);
  const counts = new Array<number>(max + 1).fill(0);
  for (const x of r.a) counts[x] = (counts[x] as number) + 1;
  r.push('start', [], `Count how often each value appears: ${counts.map((c, val) => (c > 0 ? `${val}×${c}` : '')).filter(Boolean).join(', ')}.`);
  let k = 0;
  for (let val = 0; val <= max; val++) {
    for (let c = 0; c < (counts[val] as number); c++) {
      r.a[k] = val;
      r.writes++;
      r.sorted.add(k);
      r.push('write', [k], `Write ${val} to position ${k + 1}.`);
      k++;
    }
  }
  r.push('done', [], `All ${n} values were written back in order without comparing any two of them.`);
}

function radix(r: Recorder): void {
  const n = r.a.length;
  const max = Math.max(...r.a);
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const name = exp === 1 ? 'ones' : exp === 10 ? 'tens' : 'hundreds';
    r.push('pivot', [], `Sort by the ${name} digit, keeping equal digits in their current order.`, null);
    const buckets: number[][] = Array.from({ length: 10 }, () => []);
    for (const x of r.a) (buckets[Math.floor(x / exp) % 10] as number[]).push(x);
    r.push('start', [], `Buckets by ${name} digit: ${buckets.map((b, d) => (b.length ? `${d}:[${b.join(' ')}]` : '')).filter(Boolean).join('  ')}.`);
    let k = 0;
    for (const b of buckets) {
      for (const x of b) {
        r.a[k] = x;
        r.writes++;
        r.push('write', [k], `Write ${x} to position ${k + 1}.`);
        k++;
      }
    }
  }
  for (let i = 0; i < n; i++) r.sorted.add(i);
  r.push('done', [], 'Every digit has been used, so the list is sorted.');
}

function shell(r: Recorder): void {
  const n = r.a.length;
  const gaps: number[] = [];
  for (let g = n >> 1; g >= 1; g >>= 1) gaps.push(g);
  for (const gap of gaps) {
    r.push('pivot', [], `Insertion sort on values ${gap} position${gap === 1 ? '' : 's'} apart.`, gap);
    for (let i = gap; i < n; i++) {
      let j = i;
      while (j >= gap) {
        const gt = r.greater(
          j - gap,
          j,
          (g) => (g ? `${v(r, j - gap)} is bigger than ${v(r, j)}, so they swap.` : `${v(r, j - gap)} is not bigger than ${v(r, j)}: stop.`),
          gap,
        );
        if (!gt) break;
        r.swap(j - gap, j, (x, y) => `Swap ${x} and ${y}.`, gap);
        j -= gap;
      }
    }
  }
  for (let i = 0; i < n; i++) r.sorted.add(i);
  r.push('done', [], 'The gap reached 1 and the last pass finished, so the list is sorted.');
}

const RUN: Record<SortAlgorithm, (r: Recorder) => void> = { bubble, selection, insertion, merge, quick, heap, counting, radix, shell };

export function sort(algorithm: SortAlgorithm, input: readonly number[]): SortResult {
  const r = new Recorder([...input]);
  r.push('start', [], `Start with [${input.join(', ')}].`);
  RUN[algorithm](r);
  return { steps: r.steps, comparisons: r.comparisons, writes: r.writes, sorted: [...r.a] };
}

/** Quick facts about each algorithm, shown in the comparison table. */
export const SORT_FACTS: Record<SortAlgorithm, { best: string; average: string; worst: string; space: string; stable: boolean }> = {
  bubble: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true },
  selection: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: false },
  insertion: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true },
  merge: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: true },
  quick: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)', stable: false },
  heap: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)', stable: false },
  counting: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n + k)', space: 'O(k)', stable: true },
  radix: { best: 'O(d·(n + b))', average: 'O(d·(n + b))', worst: 'O(d·(n + b))', space: 'O(n + b)', stable: true },
  shell: { best: 'O(n log n)', average: 'depends on gaps', worst: 'O(n²)', space: 'O(1)', stable: false },
};
