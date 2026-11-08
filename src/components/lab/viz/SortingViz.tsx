import { SORT_FACTS, SORT_LABEL, type SortAlgorithm, type SortResult, type Step } from '../../../lib/sorting';
import { Stat, StatGrid } from '../Stat';

interface Props {
  /** The step being shown, or null before the first step. */
  step: Step | null;
  /** The list as typed, shown before the first step. */
  input: readonly number[];
  index: number;
  total: number;
}

const KIND_TEXT: Record<Step['kind'], string> = {
  start: 'Start',
  compare: 'Comparing',
  swap: 'Swapping',
  write: 'Writing',
  pivot: 'Choosing',
  done: 'In place',
};

/**
 * Sorting as bars. Each bar is a value. Bars being compared are amber, a swap or write
 * is solid blue, bars already in their final place are soft blue and values outside the
 * range being worked on fade.
 */
export default function SortingViz({ step, input, index, total }: Props) {
  const values = step ? step.array : input;
  const max = Math.max(...values, 1);
  const focus = new Set(step?.focus ?? []);
  const sorted = new Set(step?.sorted ?? []);
  const range = step?.range ?? null;
  const kind = step?.kind ?? 'start';

  return (
    <section aria-label="Sorting bars">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-xs tracking-wider text-muted uppercase">The list</h3>
        <p className="font-mono text-xs text-muted">
          Step {Math.max(index + 1, 0)} of {total}
        </p>
      </div>

      <div className="mt-2 rounded-lg border border-line bg-bg p-4">
        <div className="flex h-48 items-end gap-1 sm:gap-1.5" role="img" aria-label={`List: ${values.join(', ')}`}>
          {values.map((v, i) => {
            const isFocus = focus.has(i);
            const isSorted = sorted.has(i);
            const outside = range !== null && (i < range[0] || i > range[1]);
            const active = isFocus && (kind === 'swap' || kind === 'write');
            const cls = active
              ? 'border-accent bg-accent text-accent-fg'
              : isFocus
                ? 'border-warn bg-warn/25 text-fg'
                : isSorted
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line-strong bg-surface-2 text-fg';
            return (
              <div key={i} className="flex h-full min-w-0 flex-1 flex-col justify-end" style={{ opacity: outside ? 0.35 : 1 }}>
                <div
                  className={`flex items-start justify-center rounded-t-md border-2 pt-1 font-mono text-xs font-semibold transition-[height,background-color,border-color] duration-300 sm:text-xs ${cls}`}
                  style={{ height: `${Math.max((v / max) * 100, 8)}%` }}
                >
                  {v}
                </div>
                <p className="mt-1 h-4 text-center font-mono text-xs text-muted">
                  {step?.marker === i && (kind === 'pivot' || range !== null) ? '▲' : ''}
                </p>
              </div>
            );
          })}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted" aria-label="Colour key">
          <li><span className="mr-1.5 inline-block size-2.5 rounded-sm border border-warn bg-warn/25 align-middle" />comparing</li>
          <li><span className="mr-1.5 inline-block size-2.5 rounded-sm border border-accent bg-accent align-middle" />swap or write</li>
          <li><span className="mr-1.5 inline-block size-2.5 rounded-sm border border-accent bg-accent-soft align-middle" />final place</li>
          <li><span className="mr-1.5 inline-block size-2.5 rounded-sm border border-line-strong bg-surface-2 align-middle" />not yet</li>
        </ul>
      </div>

      <div className="mt-3">
        <StatGrid>
          <Stat label="Comparisons" value={step?.comparisons ?? 0} tone="warn" />
          <Stat label="Swaps or writes" value={step?.writes ?? 0} tone="accent" />
          <Stat label="Now" value={<span className="text-xl">{step ? KIND_TEXT[step.kind] : '–'}</span>} />
          <Stat label="In final place" value={`${sorted.size}/${values.length}`} />
        </StatGrid>
      </div>
    </section>
  );
}

interface TableProps {
  results: { algorithm: SortAlgorithm; result: SortResult }[];
  selected: SortAlgorithm;
  onSelect: (a: SortAlgorithm) => void;
}

/** All nine algorithms on the same list, with the measured counts and the theory beside them. */
export function SortingComparison({ results, selected, onSelect }: TableProps) {
  const fewest = Math.min(...results.map((r) => r.result.comparisons));
  return (
    <div className="mt-6">
      <h3 className="font-mono text-xs tracking-wider text-muted uppercase">Same list, every algorithm</h3>
      <div className="mt-2 overflow-x-auto rounded-lg border border-line bg-bg">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <caption className="sr-only">Measured comparisons and swaps for each sorting algorithm on this list, with its time complexity</caption>
          <thead>
            <tr className="font-mono text-xs text-muted">
              <th scope="col" className="px-3 py-2 font-normal">Algorithm</th>
              <th scope="col" className="px-3 py-2 text-right font-normal">Comparisons</th>
              <th scope="col" className="px-3 py-2 text-right font-normal">Swaps / writes</th>
              <th scope="col" className="px-3 py-2 font-normal">Average time</th>
              <th scope="col" className="px-3 py-2 font-normal">Stable</th>
            </tr>
          </thead>
          <tbody>
            {results.map(({ algorithm, result }) => (
              <tr key={algorithm} className={`border-t border-line ${algorithm === selected ? 'bg-accent-soft' : ''}`}>
                <th scope="row" className="px-3 py-2 font-medium">
                  <button
                    type="button"
                    onClick={() => onSelect(algorithm)}
                    aria-pressed={algorithm === selected}
                    className={`min-h-8 text-left hover:text-accent ${algorithm === selected ? 'text-accent' : ''}`}
                  >
                    {SORT_LABEL[algorithm]}
                  </button>
                </th>
                <td className={`px-3 py-2 text-right font-mono ${result.comparisons === fewest ? 'font-semibold text-accent' : ''}`}>
                  {result.comparisons}
                </td>
                <td className="px-3 py-2 text-right font-mono">{result.writes}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted">{SORT_FACTS[algorithm].average}</td>
                <td className="px-3 py-2 text-muted">{SORT_FACTS[algorithm].stable ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">
        The lowest comparison count is highlighted. Counting and radix sort never compare two values, so they show 0.
      </p>
    </div>
  );
}
