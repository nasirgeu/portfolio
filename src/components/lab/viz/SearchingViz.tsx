import { SEARCH_FACTS, SEARCH_LABEL, type SearchAlgorithm, type SearchResult, type Step } from '../../../lib/searching';
import { Stat, StatGrid } from '../Stat';

interface Props {
  step: Step | null;
  /** The list the algorithm searches (sorted when the algorithm needs it). */
  list: readonly number[];
  target: number;
  index: number;
  total: number;
}

/**
 * Searching as a row of cells. Cells outside the window are ruled out and fade,
 * the position being looked at is amber, positions already looked at show a cross,
 * and the target turns solid blue when it is found.
 */
export default function SearchingViz({ step, list, target, index, total }: Props) {
  const inWindow = (i: number): boolean => (step ? i >= step.lo && i <= step.hi : true);
  const windowSize = step ? Math.max(step.hi - step.lo + 1, 0) : list.length;
  const checked = new Set(step?.checked ?? []);
  const verdict = step?.kind === 'found' ? 'found' : step?.kind === 'missing' ? 'missing' : null;

  return (
    <section aria-label="Search window">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-xs tracking-wider text-muted uppercase">The list</h3>
        <p className="font-mono text-xs text-muted">
          Step {Math.max(index + 1, 0)} of {total}
        </p>
      </div>

      <div className="mt-2 rounded-lg border border-line bg-bg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="font-mono text-xs tracking-wider text-muted uppercase">Looking for</p>
            <p className="mt-1 inline-flex size-14 items-center justify-center rounded-xl border-2 border-accent text-3xl font-bold text-accent">
              {target}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            {verdict === 'found' && (
              <p key={`v-${index}`} className="viz-pop inline-flex rounded-md border border-accent bg-accent-soft px-2.5 py-1 font-mono text-xs font-semibold tracking-wider text-accent uppercase">
                Found at position {(step?.found ?? 0) + 1}
              </p>
            )}
            {verdict === 'missing' && (
              <p key={`v-${index}`} className="viz-pop inline-flex rounded-md border border-warn px-2.5 py-1 font-mono text-xs font-semibold tracking-wider text-warn uppercase">
                Not in the list
              </p>
            )}
            {verdict === null && (
              <p className="text-sm text-muted">
                {step ? 'Bright cells are still possible. Faded cells have been ruled out.' : 'Press Next or Play. The search starts here.'}
              </p>
            )}
          </div>
        </div>

        <ul
          className="mt-5 grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${Math.max(list.length, 1)}, minmax(0, 1fr))` }}
          aria-label="List positions"
        >
          {list.map((v, i) => {
            const isProbe = step?.probe === i;
            const isFound = step?.found === i;
            const ruledOut = !inWindow(i) && !isProbe;
            const cls = isFound
              ? 'border-accent bg-accent text-accent-fg'
              : isProbe
                ? 'border-warn bg-warn/25 text-fg'
                : checked.has(i)
                  ? 'border-line-strong bg-surface-2 text-muted'
                  : 'border-line-strong bg-surface text-fg';
            return (
              <li key={i} className="min-w-0 text-center">
                <div
                  className={`flex h-12 items-center justify-center rounded-lg border-2 font-mono text-sm font-semibold transition-[opacity,background-color,border-color] duration-300 sm:h-14 sm:text-base ${cls}`}
                  style={{ opacity: ruledOut ? 0.3 : 1 }}
                >
                  {v}
                </div>
                <p className="mt-1 font-mono text-xs text-muted">{i + 1}</p>
                <p className="h-4 font-mono text-xs text-muted" aria-hidden="true">
                  {isFound ? 'found' : isProbe ? 'look' : checked.has(i) ? '✕' : ''}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-3">
        <StatGrid>
          <Stat label="Comparisons" value={step?.comparisons ?? 0} tone="warn" />
          <Stat label="Still possible" value={windowSize} hint={`of ${list.length} positions`} tone="accent" />
          <Stat label="Looked at" value={checked.size} />
          <Stat label="Step" value={`${Math.max(index + 1, 0)}/${total}`} />
        </StatGrid>
      </div>
    </section>
  );
}

interface TableProps {
  rows: { algorithm: SearchAlgorithm; result: SearchResult }[];
  selected: SearchAlgorithm;
  onSelect: (a: SearchAlgorithm) => void;
}

/** All four algorithms on the same list and target. */
export function SearchingComparison({ rows, selected, onSelect }: TableProps) {
  const fewest = Math.min(...rows.map((r) => r.result.comparisons));
  return (
    <div className="mt-6">
      <h3 className="font-mono text-xs tracking-wider text-muted uppercase">Same list and target, every algorithm</h3>
      <div className="mt-2 overflow-x-auto rounded-lg border border-line bg-bg">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <caption className="sr-only">Comparisons used by each search algorithm for this list and target</caption>
          <thead>
            <tr className="font-mono text-xs text-muted">
              <th scope="col" className="px-3 py-2 font-normal">Algorithm</th>
              <th scope="col" className="px-3 py-2 text-right font-normal">Comparisons</th>
              <th scope="col" className="px-3 py-2 font-normal">Result</th>
              <th scope="col" className="px-3 py-2 font-normal">Average time</th>
              <th scope="col" className="px-3 py-2 font-normal">Sorted list</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ algorithm, result }) => (
              <tr key={algorithm} className={`border-t border-line ${algorithm === selected ? 'bg-accent-soft' : ''}`}>
                <th scope="row" className="px-3 py-2 font-medium">
                  <button
                    type="button"
                    onClick={() => onSelect(algorithm)}
                    aria-pressed={algorithm === selected}
                    className={`min-h-8 text-left hover:text-accent ${algorithm === selected ? 'text-accent' : ''}`}
                  >
                    {SEARCH_LABEL[algorithm]}
                  </button>
                </th>
                <td className={`px-3 py-2 text-right font-mono ${result.comparisons === fewest ? 'font-semibold text-accent' : ''}`}>
                  {result.comparisons}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{result.index >= 0 ? `position ${result.index + 1}` : 'not found'}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted">{SEARCH_FACTS[algorithm].average}</td>
                <td className="px-3 py-2 text-muted">{SEARCH_FACTS[algorithm].sorted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">
        Positions refer to the list each algorithm searched: sorted for binary, jump and interpolation, as typed for linear.
      </p>
    </div>
  );
}
