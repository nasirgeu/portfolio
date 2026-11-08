/**
 * Memory allocation simulator (contiguous allocation): first fit, best fit, worst fit.
 * A simplified teaching model: one block of memory split into free gaps and
 * allocated blocks. Pure logic with no UI, with a plain-English note for every step.
 *
 * Rules: a gap is split when it is larger than the request; when a block is freed,
 * it merges with free neighbours. Ties between gaps go to the lower address.
 */

export type Fit = 'first' | 'best' | 'worst';

export interface Block {
  start: number;
  size: number;
  /** Block name (a letter), or null for free space. */
  id: string | null;
}

export type Op = { kind: 'alloc'; id: string; size: number } | { kind: 'free'; id: string };

export interface Gap {
  start: number;
  size: number;
}

export interface AllocStep {
  /** The operation as typed, e.g. "A5" or "-A". */
  label: string;
  /** Memory after this operation. */
  blocks: Block[];
  /** Memory just before this operation, so the choice can be drawn. */
  before: Block[];
  /** Units requested by an allocation, or null for a free. */
  request: number | null;
  /** Free gaps that were big enough for the request. */
  candidates: Gap[];
  /** The gap the strategy picked (before it was split), or null. */
  chosen: Gap | null;
  ok: boolean;
  /** The block that was just placed or freed, if any. */
  touched: string | null;
  freeUnits: number;
  largestFree: number;
  note: string;
}

export const FIT_LABEL: Record<Fit, string> = {
  first: 'First fit',
  best: 'Best fit',
  worst: 'Worst fit',
};

export const FIT_EXPLAIN: Record<Fit, string> = {
  first: 'Starts from the lowest address and picks the first free gap that is large enough. It can be faster because it stops searching as soon as it finds a suitable gap.',
  best: 'Takes the smallest gap that is big enough, so it leaves the smallest leftover. It can leave many tiny gaps that are hard to use.',
  worst: 'Takes the largest gap, hoping the leftover stays big enough to be useful. In practice it often wastes the big gaps.',
};

const stats = (blocks: readonly Block[]): { free: number; largest: number } => {
  const gaps = blocks.filter((b) => b.id === null);
  return { free: gaps.reduce((s, b) => s + b.size, 0), largest: gaps.reduce((m, b) => Math.max(m, b.size), 0) };
};

const clone = (blocks: readonly Block[]): Block[] => blocks.map((b) => ({ ...b }));

interface Choice {
  request: number | null;
  candidates: Gap[];
  chosen: Gap | null;
}
const NO_CHOICE: Choice = { request: null, candidates: [], chosen: null };

/**
 * The strategy rule, shared by the engine and the visualization:
 * first fit takes the lowest address, best fit the smallest gap, worst fit the largest.
 * Ties go to the lower address (gaps are given in address order).
 */
export function chooseGap<T extends Gap>(fit: Fit, gaps: readonly T[]): T {
  let chosen = gaps[0] as T;
  for (const g of gaps) {
    if (fit === 'best' && g.size < chosen.size) chosen = g;
    if (fit === 'worst' && g.size > chosen.size) chosen = g;
  }
  return chosen;
}

export function simulateAllocator(fit: Fit, memSize: number, ops: readonly Op[]): AllocStep[] {
  let blocks: Block[] = [{ start: 0, size: memSize, id: null }];
  let before: Block[] = clone(blocks);
  const steps: AllocStep[] = [];

  const push = (label: string, ok: boolean, touched: string | null, note: string, choice: Choice = NO_CHOICE): void => {
    const s = stats(blocks);
    steps.push({
      label,
      blocks: clone(blocks),
      before,
      request: choice.request,
      candidates: choice.candidates,
      chosen: choice.chosen,
      ok,
      touched,
      freeUnits: s.free,
      largestFree: s.largest,
      note,
    });
  };

  for (const op of ops) {
    before = clone(blocks);
    if (op.kind === 'alloc') {
      const label = `${op.id}${op.size}`;
      if (blocks.some((b) => b.id === op.id)) {
        push(label, false, null, `Block ${op.id} is already in memory, so nothing changes. Free it first or use a different letter.`, { request: op.size, candidates: [], chosen: null });
        continue;
      }
      const gaps = blocks.filter((b) => b.id === null && b.size >= op.size);
      const { free, largest } = stats(blocks);
      if (gaps.length === 0) {
        const frag =
          free >= op.size
            ? ` There are ${free} free units in total, but they are split into separate gaps and the largest gap is only ${largest}. This is called external fragmentation.`
            : ` Only ${free} units are free in total.`;
        push(label, false, null, `Allocate ${op.id} (${op.size} units): there is no gap big enough, so the request fails.${frag}`, { request: op.size, candidates: [], chosen: null });
        continue;
      }
      const chosen = chooseGap(fit, gaps);
      const where =
        fit === 'first'
          ? `First fit takes the first gap that is big enough: the gap at address ${chosen.start} (size ${chosen.size}).`
          : fit === 'best'
            ? `Best fit takes the smallest gap that is big enough: the gap at address ${chosen.start} (size ${chosen.size}).`
            : `Worst fit takes the largest gap: the gap at address ${chosen.start} (size ${chosen.size}).`;
      const leftover = chosen.size - op.size;
      const next: Block[] = [];
      for (const b of blocks) {
        if (b !== chosen) {
          next.push(b);
          continue;
        }
        next.push({ start: b.start, size: op.size, id: op.id });
        if (leftover > 0) next.push({ start: b.start + op.size, size: leftover, id: null });
      }
      blocks = next;
      const tail = leftover > 0 ? ` The leftover ${leftover} units stay free at address ${chosen.start + op.size}.` : ' It fills the gap exactly.';
      push(label, true, op.id, `Allocate ${op.id} (${op.size} units): ${where}${tail}`, {
        request: op.size,
        candidates: gaps.map((g) => ({ start: g.start, size: g.size })),
        chosen: { start: chosen.start, size: chosen.size },
      });
    } else {
      const label = `-${op.id}`;
      const index = blocks.findIndex((b) => b.id === op.id);
      if (index < 0) {
        push(label, false, null, `Free ${op.id}: block ${op.id} is not in memory, so there is nothing to free.`);
        continue;
      }
      const target = blocks[index] as Block;
      target.id = null;
      // merge with free neighbours
      const merged: Block[] = [];
      let mergedWith = 0;
      for (const b of blocks) {
        const prev = merged[merged.length - 1];
        if (prev && prev.id === null && b.id === null) {
          prev.size += b.size;
          mergedWith++;
        } else {
          merged.push({ ...b });
        }
      }
      blocks = merged;
      const gap = blocks.find((b) => b.start <= target.start && b.start + b.size > target.start) as Block;
      const note =
        mergedWith > 0
          ? `Free ${op.id}: its ${target.size} units become free and join the free space next to it, making one gap of ${gap.size} at address ${gap.start}.`
          : `Free ${op.id}: its ${target.size} units at address ${target.start} become a free gap. No free space is next to it, so it stays a separate gap.`;
      push(label, true, null, note);
    }
  }
  return steps;
}

/** Initial (empty) memory, for drawing before any step. */
export const emptyMemory = (memSize: number): Block[] => [{ start: 0, size: memSize, id: null }];

/** Parse "A5 B3 -A C4" into operations, or return a friendly error. */
export function parseOps(text: string, memSize: number): { ops: Op[]; error: string | null } {
  const parts = text.split(/[\s,]+/).filter((p) => p.length > 0);
  if (parts.length === 0) return { ops: [], error: 'Enter at least one operation, for example A5 B3 -A.' };
  if (parts.length > 30) return { ops: [], error: 'Please use 30 operations or fewer.' };
  const ops: Op[] = [];
  for (const raw of parts) {
    const alloc = /^([A-Za-z])(\d{1,3})$/.exec(raw);
    const free = /^-([A-Za-z])$/.exec(raw);
    if (alloc) {
      const size = Number(alloc[2]);
      if (size < 1) return { ops: [], error: `"${raw}": a block needs at least 1 unit.` };
      if (size > memSize) return { ops: [], error: `"${raw}": that is bigger than the whole memory (${memSize} units).` };
      ops.push({ kind: 'alloc', id: (alloc[1] as string).toUpperCase(), size });
    } else if (free) {
      ops.push({ kind: 'free', id: (free[1] as string).toUpperCase() });
    } else {
      return {
        ops: [],
        error: `"${raw}" is not valid. Use a letter and a size to allocate (A5), or a minus sign and a letter to free (-A).`,
      };
    }
  }
  return { ops, error: null };
}
