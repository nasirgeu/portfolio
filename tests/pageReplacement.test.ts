import { check, finish } from './check.ts';
import { parseReferences, simulate } from '../src/lib/pageReplacement.ts';

console.log('Page replacement');
const refs = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];

// Standard textbook result with 3 frames: FIFO 15, LRU 12, Optimal 9 faults.
const expected = { FIFO: 15, LRU: 12, Optimal: 9 } as const;
for (const a of ['FIFO', 'LRU', 'Optimal'] as const) {
  const r = simulate(a, 3, refs);
  check(`${a} gives ${expected[a]} faults on the textbook string`, r.faults === expected[a], `got ${r.faults}`);
  check(`${a}: hits + faults = number of requests`, r.hits + r.faults === refs.length);
}

// Belady anomaly: FIFO gets worse with more frames on this string.
const belady = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
const f3 = simulate('FIFO', 3, belady).faults;
const f4 = simulate('FIFO', 4, belady).faults;
check('Belady anomaly: FIFO 9 faults with 3 frames, 10 with 4', f3 === 9 && f4 === 10, `${f3} / ${f4}`);

// Optimal is never worse than FIFO or LRU.
let optimalBest = true;
for (let t = 0; t < 300 && optimalBest; t++) {
  const n = 5 + Math.floor(Math.random() * 30);
  const frames = 1 + Math.floor(Math.random() * 5);
  const rr = Array.from({ length: n }, () => Math.floor(Math.random() * 8));
  const o = simulate('Optimal', frames, rr).faults;
  optimalBest = o <= simulate('LRU', frames, rr).faults && o <= simulate('FIFO', frames, rr).faults;
}
check('300 random runs: Optimal never has more faults than FIFO or LRU', optimalBest);

// Input checking
check('parses spaces and commas', JSON.stringify(parseReferences('7 0, 1').refs) === '[7,0,1]');
check('rejects a non-number', parseReferences('a 1').error !== null);
check('rejects empty input', parseReferences('').error !== null);

finish('Page replacement');
