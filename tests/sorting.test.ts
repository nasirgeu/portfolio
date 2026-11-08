import { check, finish } from './check.ts';
import { MAX_ITEMS, SORT_ALGORITHMS, parseNumbers, sort, type SortAlgorithm } from '../src/lib/sorting.ts';

const input = [5, 2, 9, 1, 7];
const asc = (a: readonly number[]): boolean => a.every((x, i) => i === 0 || (a[i - 1] as number) <= x);
const inversions = (a: readonly number[]): number => {
  let n = 0;
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if ((a[i] as number) > (a[j] as number)) n++;
  return n;
};

console.log('Hand-worked counts for 5 2 9 1 7');
const bubble = sort('bubble', input);
check('bubble: 10 comparisons', bubble.comparisons === 10, String(bubble.comparisons));
check('bubble: 5 swaps (the number of inversions)', bubble.writes === 5, String(bubble.writes));
const ins = sort('insertion', input);
check('insertion: 7 comparisons', ins.comparisons === 7, String(ins.comparisons));
check('insertion: 5 swaps', ins.writes === 5, String(ins.writes));
const sel = sort('selection', [3, 1, 2]);
check('selection on 3 1 2: 3 comparisons, 2 swaps', sel.comparisons === 3 && sel.writes === 2, `${sel.comparisons}/${sel.writes}`);
check('counting never compares', sort('counting', input).comparisons === 0);
check('bubble stops early on a sorted list (n-1 comparisons, 0 swaps)', (() => {
  const r = sort('bubble', [1, 2, 3, 4]);
  return r.comparisons === 3 && r.writes === 0;
})());
check('radix handles 3-digit-style spread (170 45 75 90 2 24 66 → sorted)', asc(sort('radix', [70, 45, 75, 90, 2, 24, 66]).sorted));

console.log('Every algorithm sorts');
for (const a of SORT_ALGORITHMS) {
  check(`${a}: sorts the example`, JSON.stringify(sort(a, input).sorted) === '[1,2,5,7,9]');
  check(`${a}: handles duplicates`, JSON.stringify(sort(a, [3, 1, 3, 1, 2, 2]).sorted) === '[1,1,2,2,3,3]');
  check(`${a}: handles reversed`, JSON.stringify(sort(a, [9, 7, 5, 3, 1]).sorted) === '[1,3,5,7,9]');
  check(`${a}: handles two values`, JSON.stringify(sort(a, [2, 1]).sorted) === '[1,2]');
}

console.log('Random inputs obey the rules');
let seed = 12345;
const rnd = (n: number): number => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed % n;
};
let allSorted = true;
let permutation = true;
let stepsConsistent = true;
let insertionSwaps = true;
let mergeBound = true;
const failures: string[] = [];
for (let t = 0; t < 150; t++) {
  const n = 2 + rnd(MAX_ITEMS - 1);
  const arr = Array.from({ length: n }, () => rnd(100));
  const expected = [...arr].sort((x, y) => x - y);
  for (const a of SORT_ALGORITHMS as readonly SortAlgorithm[]) {
    const r = sort(a, arr);
    if (!asc(r.sorted)) {
      allSorted = false;
      failures.push(`${a}:${arr.join(' ')}`);
    }
    if (JSON.stringify([...r.sorted]) !== JSON.stringify(expected)) permutation = false;
    const last = r.steps[r.steps.length - 1];
    if (!last || JSON.stringify(last.array) !== JSON.stringify(expected)) stepsConsistent = false;
    if (r.steps.some((s) => s.array.length !== n)) stepsConsistent = false;
    if (a === 'insertion' && r.writes !== inversions(arr)) insertionSwaps = false;
    if (a === 'bubble' && r.writes !== inversions(arr)) insertionSwaps = false;
    if (a === 'merge' && r.comparisons > n * Math.ceil(Math.log2(n))) mergeBound = false;
  }
}
check('every algorithm returns a sorted list', allSorted, failures.slice(0, 3).join(' | '));
check('the result is the same values (a permutation)', permutation);
check('the last step shows the sorted array, every step keeps the length', stepsConsistent);
check('insertion and bubble swap exactly once per inversion', insertionSwaps);
check('merge sort uses at most n·⌈log₂ n⌉ comparisons', mergeBound);

console.log('Input checks');
check('accepts spaces and commas', JSON.stringify(parseNumbers('5, 2  9,1').values) === '[5,2,9,1]');
check('rejects letters', parseNumbers('5 a 3').error !== null);
check('rejects a negative number', parseNumbers('5 -1 3').error !== null);
check('rejects a number above 99', parseNumbers('5 100').error !== null);
check('rejects a single number', parseNumbers('5').error !== null);
check('rejects an empty box', parseNumbers('   ').error !== null);
check(`rejects more than ${MAX_ITEMS} numbers`, parseNumbers(Array.from({ length: MAX_ITEMS + 1 }, () => '1').join(' ')).error !== null);

finish('sorting');
