import { check, finish } from './check.ts';
import { parseOps, simulateAllocator as sim, type AllocStep, type Fit, type Op } from '../src/lib/allocator.ts';

console.log('Memory allocation');
const ops = (text: string, mem: number): Op[] => parseOps(text, mem).ops;
const startOf = (s: AllocStep | undefined, id: string): number | undefined => s?.blocks.find((b) => b.id === id)?.start;
const last = (steps: AllocStep[]): AllocStep | undefined => steps[steps.length - 1];

// Memory 40: after freeing A, C and E there are three gaps: 0 (size 10), 12 (size 5), 19 (size 7).
const setup = 'A10 B2 C5 D2 E7 F2 G12 -A -C -E';
const gaps = last(sim('first', 40, ops(setup, 40)))
  ?.blocks.filter((b) => b.id === null)
  .map((b) => `${b.start}:${b.size}`)
  .join(' ');
check('setup leaves gaps 0:10, 12:5, 19:7', gaps === '0:10 12:5 19:7', gaps);

// A 6-unit request: first fit -> first big-enough gap (0), best fit -> smallest big-enough gap (19), worst fit -> largest gap (0)
check('first fit places a 6-unit block at 0', startOf(last(sim('first', 40, ops(`${setup} H6`, 40))), 'H') === 0);
check('best fit places a 6-unit block at 19 (the 7-unit gap)', startOf(last(sim('best', 40, ops(`${setup} H6`, 40))), 'H') === 19);
check('worst fit places a 6-unit block at 0 (the 10-unit gap)', startOf(last(sim('worst', 40, ops(`${setup} H6`, 40))), 'H') === 0);

// A 5-unit request: best fit finds the exact 5-unit gap at 12 and leaves no leftover
const exact = last(sim('best', 40, ops(`${setup} H5`, 40)));
check('best fit uses an exact-fit gap (5 units at 12)', startOf(exact, 'H') === 12 && exact?.note.includes('fills the gap exactly') === true);

// Freeing merges neighbours
const merged = last(sim('first', 40, ops('A10 B10 -A -B', 40)));
check('freeing neighbouring blocks merges them into one gap', merged?.blocks.length === 1 && merged.blocks[0]?.size === 40);

// External fragmentation: enough free space in total, but no single gap is big enough
const frag = last(sim('first', 20, ops('A5 B5 C5 D5 -A -C E8', 20)));
check('request fails when no single gap fits', frag?.ok === false);
check('failure note explains external fragmentation', frag?.note.includes('external fragmentation') === true && frag.note.includes('10 free units in total'), frag?.note);

// Mistakes are reported, not crashed on
check('freeing a block that is not in memory is reported', last(sim('first', 20, ops('-A', 20)))?.ok === false);
check('allocating the same letter twice is reported', sim('first', 20, ops('A5 A3', 20))[1]?.ok === false);

// Properties for random scripts and every strategy
let sound = true;
for (let t = 0; t < 400 && sound; t++) {
  const mem = [16, 32, 48, 64][Math.floor(Math.random() * 4)] as number;
  const letters = 'ABCDEFGH';
  const script: Op[] = Array.from({ length: 5 + Math.floor(Math.random() * 20) }, () => {
    const id = letters[Math.floor(Math.random() * letters.length)] as string;
    return Math.random() < 0.6 ? { kind: 'alloc', id, size: 1 + Math.floor(Math.random() * 12) } : { kind: 'free', id };
  });
  for (const fit of ['first', 'best', 'worst'] as Fit[]) {
    for (const s of sim(fit, mem, script)) {
      const covers = s.blocks.every((b, i) => {
        const prev = s.blocks[i - 1];
        return b.size > 0 && b.start === (prev ? prev.start + prev.size : 0);
      });
      const total = s.blocks.reduce((sum, b) => sum + b.size, 0) === mem;
      const noAdjacentGaps = s.blocks.every((b, i) => i === 0 || !(b.id === null && s.blocks[i - 1]?.id === null));
      const named = s.blocks.filter((b) => b.id !== null);
      const unique = new Set(named.map((b) => b.id)).size === named.length;
      const freeSum = s.blocks.filter((b) => b.id === null).reduce((sum, b) => sum + b.size, 0);
      if (!covers || !total || !noAdjacentGaps || !unique || s.freeUnits !== freeSum || s.largestFree > s.freeUnits) sound = false;
    }
  }
}
check('400 random scripts x 3 strategies: memory always fully covered, free gaps always merged, totals add up', sound);

// Input checking
const parsed = JSON.stringify(parseOps('A5 -A b3', 32).ops);
check('parses allocate and free', parsed === JSON.stringify([{ kind: 'alloc', id: 'A', size: 5 }, { kind: 'free', id: 'A' }, { kind: 'alloc', id: 'B', size: 3 }]));
check('rejects a size bigger than memory', parseOps('A40', 32).error !== null);
check('rejects nonsense', parseOps('hello', 32).error !== null);
check('rejects empty input', parseOps('', 32).error !== null);

// The choice each strategy made: which gaps were big enough, and which one was picked
const choiceOf = (fit: Fit, request: string): AllocStep | undefined => last(sim(fit, 40, ops(`${setup} ${request}`, 40)));
const gapsText = (s: AllocStep | undefined): string => s?.candidates.map((g) => `${g.start}:${g.size}`).join(' ') ?? '';
const h6 = { first: choiceOf('first', 'H6'), best: choiceOf('best', 'H6'), worst: choiceOf('worst', 'H6') };
check('H6: the gaps considered are the two big enough (0:10 and 19:7)', gapsText(h6.first) === '0:10 19:7' && gapsText(h6.best) === '0:10 19:7');
check('H6: first fit chooses gap 0:10, best fit chooses 19:7, worst fit chooses 0:10', h6.first?.chosen?.start === 0 && h6.best?.chosen?.start === 19 && h6.best?.chosen?.size === 7 && h6.worst?.chosen?.start === 0);
check('the step records the memory before and the request size', h6.best?.request === 6 && (h6.best?.before.filter((b) => b.id === null).length ?? 0) === 3);
const failed = last(sim('first', 20, ops('A5 B5 C5 D5 -A -C E8', 20)));
check('a failed request has no candidates and no chosen gap', failed?.request === 8 && failed.candidates.length === 0 && failed.chosen === null);
check('a free step has no request or chosen gap', last(sim('first', 20, ops('A5 -A', 20)))?.request === null && last(sim('first', 20, ops('A5 -A', 20)))?.chosen === null);
let choiceSound = true;
for (let t = 0; t < 300 && choiceSound; t++) {
  const mem = [16, 32, 48][Math.floor(Math.random() * 3)] as number;
  const script: Op[] = Array.from({ length: 6 + Math.floor(Math.random() * 14) }, () => {
    const id = 'ABCDEF'[Math.floor(Math.random() * 6)] as string;
    return Math.random() < 0.6 ? { kind: 'alloc', id, size: 1 + Math.floor(Math.random() * 10) } : { kind: 'free', id };
  });
  for (const fit of ['first', 'best', 'worst'] as Fit[]) {
    for (const s of sim(fit, mem, script)) {
      if (s.chosen === null) continue;
      const sizes = s.candidates.map((g) => g.size);
      const bigEnough = s.candidates.every((g) => g.size >= (s.request ?? 0));
      const picked = s.candidates.some((g) => g.start === s.chosen?.start && g.size === s.chosen?.size);
      const rule =
        fit === 'first' ? s.chosen.start === Math.min(...s.candidates.map((g) => g.start)) : fit === 'best' ? s.chosen.size === Math.min(...sizes) : s.chosen.size === Math.max(...sizes);
      const placed = s.blocks.find((b) => b.id === s.touched)?.start === s.chosen.start;
      if (!bigEnough || !picked || !rule || !placed) choiceSound = false;
    }
  }
}
check('300 random scripts x 3 strategies: the chosen gap is a big-enough candidate, follows the strategy, and is where the block lands', choiceSound);

finish('Memory allocation');
