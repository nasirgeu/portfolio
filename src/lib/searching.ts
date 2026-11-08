/**
 * Searching engine. Pure functions, no screen code.
 * Each algorithm looks for a target in a list and records one Step per probe,
 * with the part of the list that is still possible (the window) and a plain-English note.
 */

export type SearchAlgorithm = 'linear' | 'binary' | 'jump' | 'interpolation';

export const SEARCH_ALGORITHMS: readonly SearchAlgorithm[] = ['linear', 'binary', 'jump', 'interpolation'];

export const SEARCH_LABEL: Record<SearchAlgorithm, string> = {
  linear: 'Linear',
  binary: 'Binary',
  jump: 'Jump',
  interpolation: 'Interpolation',
};

export const SEARCH_EXPLAIN: Record<SearchAlgorithm, string> = {
  linear: 'Checks every value from the start until it finds the target. It works on any list, sorted or not.',
  binary: 'Checks the middle value of a sorted list. It then removes the half that cannot contain the target and repeats the process.',
  jump: 'Jumps ahead in blocks of about √n until it passes the target, then checks that one block value by value.',
  interpolation: 'Guesses where the target should be from its value, like opening a dictionary near the right letter. Best on evenly spread numbers.',
};

export const NEEDS_SORTED: Record<SearchAlgorithm, boolean> = { linear: false, binary: true, jump: true, interpolation: true };

export type SearchKind = 'start' | 'probe' | 'jump' | 'found' | 'missing';

export interface Step {
  kind: SearchKind;
  /** The position being looked at, or null. */
  probe: number | null;
  /** Positions that are still possible. Empty when lo > hi. */
  lo: number;
  hi: number;
  /** Positions already looked at, in order. */
  checked: number[];
  /** Position of the target once found. */
  found: number | null;
  comparisons: number;
  note: string;
}

export interface SearchResult {
  steps: Step[];
  index: number;
  comparisons: number;
}

export const MAX_ITEMS = 20;

export function parseList(text: string): { values: number[]; error: string | null } {
  const parts = text.split(/[\s,]+/).filter((p) => p.length > 0);
  if (parts.length === 0) return { values: [], error: 'Enter some numbers, for example 3 8 12 20 25.' };
  const values: number[] = [];
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return { values: [], error: `"${p}" is not a whole number. Use numbers from 0 to 99, separated by spaces.` };
    const n = Number(p);
    if (n > 99) return { values: [], error: `${n} is out of range. Use numbers from 0 to 99.` };
    values.push(n);
  }
  if (values.length > MAX_ITEMS) return { values: [], error: `Use at most ${MAX_ITEMS} numbers so the cells stay readable.` };
  return { values, error: null };
}

export function parseTarget(text: string): { target: number; error: string | null } {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return { target: 0, error: 'The target must be a whole number from 0 to 99.' };
  const n = Number(t);
  if (n > 99) return { target: 0, error: 'The target must be a whole number from 0 to 99.' };
  return { target: n, error: null };
}

/** Binary, jump and interpolation search need sorted data, so the list is sorted first. */
export function prepareList(algorithm: SearchAlgorithm, values: readonly number[]): { list: number[]; sortedFirst: boolean } {
  if (!NEEDS_SORTED[algorithm]) return { list: [...values], sortedFirst: false };
  const list = [...values].sort((a, b) => a - b);
  const changed = list.some((x, i) => x !== values[i]);
  return { list, sortedFirst: changed };
}

class Recorder {
  steps: Step[] = [];
  comparisons = 0;
  checked: number[] = [];
  push(kind: SearchKind, probe: number | null, lo: number, hi: number, note: string, found: number | null = null): void {
    this.steps.push({ kind, probe, lo, hi, checked: [...this.checked], found, comparisons: this.comparisons, note });
  }
  /** Look at one position. */
  look(i: number): void {
    this.comparisons++;
    if (!this.checked.includes(i)) this.checked.push(i);
  }
}

function linear(a: readonly number[], target: number, r: Recorder): number {
  const n = a.length;
  r.push('start', null, 0, n - 1, `Look for ${target} by checking every position from the left.`);
  for (let i = 0; i < n; i++) {
    r.look(i);
    if (a[i] === target) {
      r.push('found', i, i, n - 1, `Position ${i + 1} holds ${a[i]}, which is the target. Found it.`, i);
      return i;
    }
    r.push('probe', i, i + 1, n - 1, `Position ${i + 1} holds ${a[i]}, not ${target}. Move on to the next one.`);
  }
  r.push('missing', null, 0, -1, `Every position was checked and none holds ${target}, so it is not in the list.`);
  return -1;
}

function binary(a: readonly number[], target: number, r: Recorder): number {
  let lo = 0;
  let hi = a.length - 1;
  r.push('start', null, lo, hi, `Look for ${target} in the sorted list. The whole list is still possible.`);
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const m = a[mid] as number;
    r.look(mid);
    if (m === target) {
      r.push('found', mid, lo, hi, `The middle value at position ${mid + 1} is ${m}, which is the target. Found it.`, mid);
      return mid;
    }
    if (m < target) {
      r.push('probe', mid, mid + 1, hi, `The middle value ${m} is smaller than ${target}, so the target can only be on the right. Drop the left half.`);
      lo = mid + 1;
    } else {
      r.push('probe', mid, lo, mid - 1, `The middle value ${m} is bigger than ${target}, so the target can only be on the left. Drop the right half.`);
      hi = mid - 1;
    }
  }
  r.push('missing', null, lo, hi, `Nothing is left to check, so ${target} is not in the list.`);
  return -1;
}

function jump(a: readonly number[], target: number, r: Recorder): number {
  const n = a.length;
  const size = Math.max(1, Math.floor(Math.sqrt(n)));
  let prev = 0;
  r.push('start', null, 0, n - 1, `Look for ${target}. The jump size is ⌊√${n}⌋ = ${size}.`);
  if (n === 0) {
    r.push('missing', null, 0, -1, `The list is empty, so ${target} is not in it.`);
    return -1;
  }
  for (;;) {
    const end = Math.min(prev + size, n) - 1;
    r.look(end);
    const m = a[end] as number;
    if (m < target) {
      prev += size;
      if (prev >= n) {
        r.push('missing', null, prev, n - 1, `The value ${m} at the end of the last block is still smaller than ${target}, so it is not in the list.`);
        return -1;
      }
      r.push('jump', end, prev, n - 1, `Jump: position ${end + 1} holds ${m}, which is smaller than ${target}. The target is further on, so jump to the next block.`);
    } else {
      r.push('jump', end, prev, end, `Position ${end + 1} holds ${m}, which is ${m === target ? 'the target' : `at least ${target}`}. The target can only be in this block, positions ${prev + 1} to ${end + 1}.`);
      for (let i = prev; i <= end; i++) {
        // The last position of the block was already looked at by the jump.
        if (i !== end) r.look(i);
        const x = a[i] as number;
        if (x === target) {
          r.push('found', i, i, end, `Position ${i + 1} holds ${x}, which is the target. Found it.`, i);
          return i;
        }
        if (x > target) {
          r.push('missing', i, i, i - 1, `Position ${i + 1} holds ${x}, already bigger than ${target}, so the target is not in the list.`);
          return -1;
        }
        r.push('probe', i, i + 1, end, `Position ${i + 1} holds ${x}, not ${target}. Check the next value in this block.`);
      }
      r.push('missing', null, prev, prev - 1, `The block was checked and ${target} is not in it, so it is not in the list.`);
      return -1;
    }
  }
}

function interpolation(a: readonly number[], target: number, r: Recorder): number {
  let lo = 0;
  let hi = a.length - 1;
  r.push('start', null, lo, hi, `Look for ${target}. Guess its position from where it sits between the smallest and largest value.`);
  while (lo <= hi && target >= (a[lo] as number) && target <= (a[hi] as number)) {
    const first = a[lo] as number;
    const last = a[hi] as number;
    const pos = first === last ? lo : lo + Math.floor(((target - first) * (hi - lo)) / (last - first));
    const m = a[pos] as number;
    r.look(pos);
    const guess =
      first === last
        ? `All remaining values are equal to ${first}, so check position ${pos + 1}.`
        : `Estimated position: ${lo + 1} + (${target} − ${first}) × ${hi - lo} ÷ (${last} − ${first}) → position ${pos + 1}.`;
    if (m === target) {
      r.push('found', pos, lo, hi, `${guess} It holds ${m}, which is the target. Found it.`, pos);
      return pos;
    }
    if (m < target) {
      r.push('probe', pos, pos + 1, hi, `${guess} It holds ${m}, smaller than ${target}, so look to the right of it.`);
      lo = pos + 1;
    } else {
      r.push('probe', pos, lo, pos - 1, `${guess} It holds ${m}, bigger than ${target}, so look to the left of it.`);
      hi = pos - 1;
    }
  }
  r.push(
    'missing',
    null,
    lo,
    hi,
    lo <= hi
      ? `${target} is outside the range of the remaining values, so it cannot be in the list.`
      : `Nothing is left to check, so ${target} is not in the list.`,
  );
  return -1;
}

const RUN: Record<SearchAlgorithm, (a: readonly number[], t: number, r: Recorder) => number> = { linear, binary, jump, interpolation };

/** Search `list` (already sorted when the algorithm needs it; see prepareList). */
export function search(algorithm: SearchAlgorithm, list: readonly number[], target: number): SearchResult {
  const r = new Recorder();
  const index = RUN[algorithm](list, target, r);
  return { steps: r.steps, index, comparisons: r.comparisons };
}

export const SEARCH_FACTS: Record<SearchAlgorithm, { best: string; average: string; worst: string; space: string; sorted: string }> = {
  linear: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)', sorted: 'Not needed' },
  binary: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)', sorted: 'Required' },
  jump: { best: 'O(1)', average: 'O(√n)', worst: 'O(√n)', space: 'O(1)', sorted: 'Required' },
  interpolation: { best: 'O(1)', average: 'O(log log n) if evenly spread', worst: 'O(n)', space: 'O(1)', sorted: 'Required' },
};
