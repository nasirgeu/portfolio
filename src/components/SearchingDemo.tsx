import { useMemo, useState } from 'react';
import {
  MAX_ITEMS,
  NEEDS_SORTED,
  SEARCH_ALGORITHMS,
  SEARCH_EXPLAIN,
  SEARCH_LABEL,
  parseList,
  parseTarget,
  prepareList,
  search,
  type SearchAlgorithm,
} from '../lib/searching';
import StepLog from './StepLog';
import ExecutionControls from './lab/ExecutionControls';
import WorkspaceLayout from './lab/WorkspaceLayout';
import AlgoPicker from './lab/AlgoPicker';
import { useStepper } from './lab/useStepper';
import SearchingViz, { SearchingComparison } from './lab/viz/SearchingViz';

interface Example {
  label: string;
  list: string;
  target: string;
}
const EXAMPLES: Example[] = [
  { label: 'Classic', list: '1 3 5 7 9 11 13 15', target: '11' },
  { label: 'Not in the list', list: '2 4 6 8 10 12 14 16', target: '9' },
  { label: 'Evenly spread', list: '10 20 30 40 50 60 70 80', target: '70' },
  { label: 'Skewed values', list: '1 2 3 4 5 6 7 8 9 99', target: '9' },
  { label: 'Unsorted list', list: '42 7 19 88 3 56 25 71', target: '25' },
  { label: 'Longer list', list: '2 5 8 12 16 23 38 45 56 72 91 95 97 98', target: '72' },
];

const OPTIONS = SEARCH_ALGORITHMS.map((a) => ({ value: a, label: SEARCH_LABEL[a] }));

export default function SearchingDemo() {
  const [algo, setAlgo] = useState<SearchAlgorithm>('binary');
  const [listText, setListText] = useState('1 3 5 7 9 11 13 15');
  const [targetText, setTargetText] = useState('11');

  const list = useMemo(() => parseList(listText), [listText]);
  const target = useMemo(() => parseTarget(targetText), [targetText]);
  const error = list.error ?? target.error;

  const prepared = useMemo(() => (error ? null : prepareList(algo, list.values)), [error, algo, list]);
  const result = useMemo(() => (prepared ? search(algo, prepared.list, target.target) : null), [prepared, algo, target]);
  const rows = useMemo(
    () =>
      error
        ? null
        : SEARCH_ALGORITHMS.map((a) => ({ algorithm: a, result: search(a, prepareList(a, list.values).list, target.target) })),
    [error, list, target],
  );

  const steps = result?.steps ?? null;
  const last = (steps?.length ?? 0) - 1;
  const { cursor, setCursor, playing, setPlaying, speed, setSpeed } = useStepper(last, `${algo}|${listText}|${targetText}`, 1100);
  const step = steps && cursor >= 0 ? (steps[cursor] ?? null) : null;

  const labelCls = 'font-mono text-xs tracking-wider text-muted uppercase';
  const field =
    'mt-2 block min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3 font-mono text-sm text-fg placeholder:text-muted';

  const toolbar = steps ? (
    <ExecutionControls
      cursor={cursor}
      last={last}
      playing={playing}
      setCursor={setCursor}
      setPlaying={setPlaying}
      speed={speed}
      setSpeed={setSpeed}
    >
      {step ? `${step.comparisons} comparisons` : null}
    </ExecutionControls>
  ) : null;

  const controls = (
    <>
      <AlgoPicker label="Choose a search algorithm" options={OPTIONS} value={algo} onChange={setAlgo} explain={SEARCH_EXPLAIN[algo]} />

      <div className="grid gap-5 sm:grid-cols-[1fr_9rem]">
        <div>
          <label htmlFor="search-list" className={labelCls}>
            List of numbers
          </label>
          <input
            id="search-list"
            value={listText}
            onChange={(e) => setListText(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={list.error ? true : undefined}
            className={field}
            placeholder="e.g. 3 8 12 20 25"
          />
        </div>
        <div>
          <label htmlFor="search-target" className={labelCls}>
            Target
          </label>
          <input
            id="search-target"
            value={targetText}
            onChange={(e) => setTargetText(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={target.error ? true : undefined}
            className={field}
            placeholder="e.g. 12"
          />
        </div>
      </div>
      <p className={`-mt-2 text-sm ${error ? 'text-warn' : 'text-muted'}`} role={error ? 'alert' : undefined}>
        {error ?? `Enter whole numbers from 0 to 99, separated by spaces. Up to ${MAX_ITEMS} numbers.`}
      </p>

      <div>
        <p className={labelCls}>Examples</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e.label}
              type="button"
              onClick={() => {
                setListText(e.list);
                setTargetText(e.target);
              }}
              className="min-h-10 rounded-full border border-line px-4 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const visual =
    steps && prepared && rows && result ? (
      <>
        {prepared.sortedFirst && (
          <p className="mb-3 rounded-lg border border-line bg-surface-2 p-3 text-sm" role="status">
            {SEARCH_LABEL[algo]} search needs sorted data, so the list was sorted first:{' '}
            <span className="font-mono">{prepared.list.join(' ')}</span>
          </p>
        )}
        {!prepared.sortedFirst && NEEDS_SORTED[algo] && (
          <p className="mb-3 text-sm text-muted">{SEARCH_LABEL[algo]} search needs sorted data, and this list already is.</p>
        )}

        <SearchingViz step={step} list={prepared.list} target={target.target} index={cursor} total={steps.length} />

        <StepLog
          items={steps.slice(0, cursor + 1).map((s, i) => ({ label: `Step ${i + 1}`, text: s.note }))}
          total={steps.length}
          emptyMessage="Press Next or Play to see how the algorithm checks each position and narrows down the search."
        />

        {cursor >= last && (
          <p className="mt-4 rounded-lg border border-accent/40 bg-accent-soft p-3 text-sm" role="status">
            {result.index >= 0
              ? `Found ${target.target} at position ${result.index + 1} after ${result.comparisons} comparisons.`
              : `${target.target} is not in the list. ${result.comparisons} comparisons were needed to be sure.`}
          </p>
        )}

        <SearchingComparison rows={rows} selected={algo} onSelect={setAlgo} />
      </>
    ) : (
      <p className="rounded-lg border border-dashed border-line p-6 text-sm text-muted">Fix the input above to see the visualization.</p>
    );

  return <WorkspaceLayout controls={controls} visual={visual} toolbar={toolbar} />;
}
