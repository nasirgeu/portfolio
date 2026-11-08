/**
 * Page replacement simulator (FIFO, LRU, Optimal).
 * Pure logic with no UI, so it can be checked on its own.
 * Every step carries a plain-English explanation.
 */

export type Algorithm = 'FIFO' | 'LRU' | 'Optimal';

export interface Step {
  /** Position in the reference string (0-based). */
  index: number;
  /** The page being requested. */
  page: number;
  /** Frame contents after this step (null = empty). */
  frames: (number | null)[];
  hit: boolean;
  /** The page that was removed, if any. */
  evicted: number | null;
  /** Which frame changed, if any. */
  changedFrame: number | null;
  /** Plain-English explanation of what happened. */
  note: string;
}

export interface Result {
  steps: Step[];
  hits: number;
  faults: number;
}

const RULE: Record<Algorithm, string> = {
  FIFO: 'FIFO removes the page that has been in memory the longest',
  LRU: 'LRU removes the page that was used the longest time ago',
  Optimal: 'Optimal removes the page that will not be needed for the longest time',
};

export function simulate(algorithm: Algorithm, frameCount: number, refs: readonly number[]): Result {
  const frames: (number | null)[] = Array.from({ length: frameCount }, () => null);
  const lastUsed: number[] = Array.from({ length: frameCount }, () => -1);
  const loadOrder: number[] = []; // frame indexes, oldest first (used by FIFO)
  const steps: Step[] = [];
  let hits = 0;
  let faults = 0;

  refs.forEach((page, i) => {
    const slot = frames.indexOf(page);

    if (slot >= 0) {
      hits++;
      lastUsed[slot] = i;
      steps.push({
        index: i,
        page,
        frames: [...frames],
        hit: true,
        evicted: null,
        changedFrame: null,
        note:
          `Page ${page} is already in memory, so this is a hit and nothing is loaded.` +
          (algorithm === 'LRU' ? ` It now counts as the most recently used page.` : ''),
      });
      return;
    }

    faults++;
    const empty = frames.indexOf(null);

    if (empty >= 0) {
      frames[empty] = page;
      lastUsed[empty] = i;
      loadOrder.push(empty);
      steps.push({
        index: i,
        page,
        frames: [...frames],
        hit: false,
        evicted: null,
        changedFrame: empty,
        note: `Page ${page} is not in memory, so this is a page fault. There is an empty frame, so page ${page} is loaded into frame ${empty + 1}.`,
      });
      return;
    }

    let victim = 0;
    let why = '';
    if (algorithm === 'FIFO') {
      victim = loadOrder.shift() ?? 0;
      why = `${RULE.FIFO}.`;
    } else if (algorithm === 'LRU') {
      victim = lastUsed.indexOf(Math.min(...lastUsed));
      why = `${RULE.LRU}.`;
    } else {
      let furthest = -1;
      frames.forEach((p, f) => {
        const next = refs.indexOf(p as number, i + 1);
        const distance = next === -1 ? Number.POSITIVE_INFINITY : next;
        if (distance > furthest) {
          furthest = distance;
          victim = f;
        }
      });
      why = furthest === Number.POSITIVE_INFINITY
        ? `${RULE.Optimal}. Page ${frames[victim]} is never needed again.`
        : `${RULE.Optimal}. Page ${frames[victim]} is needed again the furthest in the future.`;
    }

    const evicted = frames[victim] ?? null;
    frames[victim] = page;
    lastUsed[victim] = i;
    loadOrder.push(victim);
    steps.push({
      index: i,
      page,
      frames: [...frames],
      hit: false,
      evicted,
      changedFrame: victim,
      note: `Page ${page} is not in memory and all frames are full, so this is a page fault. ${why} Page ${evicted} is removed from frame ${victim + 1} and page ${page} takes its place.`,
    });
  });

  return { steps, hits, faults };
}

/** Parse "7 0 1, 2" into page numbers. Returns an error message when the input is not valid. */
export function parseReferences(text: string): { refs: number[]; error: string | null } {
  const parts = text.split(/[\s,]+/).filter((p) => p.length > 0);
  if (parts.length === 0) return { refs: [], error: 'Enter at least one page number.' };
  if (parts.length > 40) return { refs: [], error: 'Please use 40 page numbers or fewer.' };
  const refs: number[] = [];
  for (const p of parts) {
    if (!/^\d{1,2}$/.test(p)) return { refs: [], error: `"${p}" is not valid. Use whole numbers from 0 to 99.` };
    refs.push(Number(p));
  }
  return { refs, error: null };
}
