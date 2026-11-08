import { check, finish } from './check.ts';
import {
  MAX_ITEMS,
  SEARCH_ALGORITHMS,
  parseList,
  parseTarget,
  prepareList,
  search,
  type SearchAlgorithm,
} from '../src/lib/searching.ts';

console.log('Hand-worked searches');
const run = (a: SearchAlgorithm, list: number[], t: number) => search(a, prepareList(a, list).list, t);

const bin = run('binary', [1, 3, 5, 7, 9, 11, 13, 15], 11);
check('binary: 11 is found at index 5 in 2 comparisons', bin.index === 5 && bin.comparisons === 2, `${bin.index}/${bin.comparisons}`);
const lin = run('linear', [4, 8, 15, 16, 23, 42], 16);
check('linear: 16 is found at index 3 in 4 comparisons', lin.index === 3 && lin.comparisons === 4);
const linMiss = run('linear', [4, 8, 15], 99);
check('linear: a missing value costs n comparisons and returns -1', linMiss.index === -1 && linMiss.comparisons === 3);
const seq = Array.from({ length: 16 }, (_, i) => i + 1);
const jmp = run('jump', seq, 11);
check('jump over 1..16 for 11: found at index 10 in 6 comparisons', jmp.index === 10 && jmp.comparisons === 6, `${jmp.index}/${jmp.comparisons}`);
const interp = run('interpolation', [10, 20, 30, 40, 50, 60, 70, 80], 70);
check('interpolation on evenly spread values finds 70 on the first guess', interp.index === 6 && interp.comparisons === 1);
check('interpolation: a target below the smallest is rejected with no probe', run('interpolation', [10, 20, 30], 5).comparisons === 0);
check('binary on one element', run('binary', [7], 7).index === 0);
check('searching an empty list finds nothing', run('linear', [], 3).index === -1);

console.log('Sorting first');
check('binary sorts an unsorted list first', JSON.stringify(prepareList('binary', [9, 1, 5]).list) === '[1,5,9]' && prepareList('binary', [9, 1, 5]).sortedFirst);
check('linear keeps the list as typed', JSON.stringify(prepareList('linear', [9, 1, 5]).list) === '[9,1,5]' && !prepareList('linear', [9, 1, 5]).sortedFirst);
check('an already sorted list is not reported as re-sorted', !prepareList('jump', [1, 2, 3]).sortedFirst);

console.log('Random inputs obey the rules');
let seed = 987;
const rnd = (n: number): number => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed % n;
};
let foundRight = true;
let missingRight = true;
let windowOk = true;
let binaryBound = true;
let agree = true;
let linearCost = true;
const bad: string[] = [];
for (let t = 0; t < 250; t++) {
  const n = 1 + rnd(MAX_ITEMS);
  const arr = Array.from({ length: n }, () => rnd(100));
  const target = rnd(100);
  const sorted = [...arr].sort((x, y) => x - y);
  const present = arr.includes(target);
  for (const a of SEARCH_ALGORITHMS) {
    const { list } = prepareList(a, arr);
    const r = search(a, list, target);
    if (present && (r.index < 0 || list[r.index] !== target)) {
      foundRight = false;
      bad.push(`${a} ${arr.join(' ')} -> ${target}`);
    }
    if (!present && r.index !== -1) missingRight = false;
    if (r.steps.some((s) => s.lo < 0 || s.hi > n - 1 || (s.probe !== null && (s.probe < 0 || s.probe >= n)))) windowOk = false;
    if (a === 'binary' && r.comparisons > Math.floor(Math.log2(n)) + 1) binaryBound = false;
    if (a === 'linear') {
      const first = arr.indexOf(target);
      if (r.comparisons !== (first >= 0 ? first + 1 : n)) linearCost = false;
    }
    const last = r.steps[r.steps.length - 1];
    if (!last || (present ? last.kind !== 'found' : last.kind !== 'missing')) agree = false;
  }
  void sorted;
}
check('a present target is always found at a position that holds it', foundRight, bad.slice(0, 2).join(' | '));
check('a missing target always returns -1', missingRight);
check('probes and windows stay inside the list', windowOk);
check('binary search uses at most ⌊log₂ n⌋ + 1 comparisons', binaryBound);
check('linear search costs index + 1 comparisons (n when missing)', linearCost);
check('the last step is always "found" or "missing" to match the result', agree);

console.log('Input checks');
check('accepts spaces and commas', JSON.stringify(parseList('3, 8  12').values) === '[3,8,12]');
check('rejects letters', parseList('3 x').error !== null);
check('rejects a number above 99', parseList('3 100').error !== null);
check('rejects an empty box', parseList(' ').error !== null);
check(`rejects more than ${MAX_ITEMS} numbers`, parseList(Array.from({ length: MAX_ITEMS + 1 }, () => '1').join(' ')).error !== null);
check('target must be a whole number 0 to 99', parseTarget('42').error === null && parseTarget('abc').error !== null && parseTarget('100').error !== null && parseTarget('').error !== null);

finish('searching');
