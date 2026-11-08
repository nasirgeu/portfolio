import { useMemo, useState } from 'react';
import {
  MAX_ITEMS,
  SORT_ALGORITHMS,
  SORT_EXPLAIN,
  SORT_LABEL,
  parseNumbers,
  sort,
  type SortAlgorithm,
} from '../lib/sorting';
import StepLog from './StepLog';
import ExecutionControls from './lab/ExecutionControls';
import WorkspaceLayout from './lab/WorkspaceLayout';
import AlgoPicker from './lab/AlgoPicker';
import { useStepper } from './lab/useStepper';
import SortingViz, { SortingComparison } from './lab/viz/SortingViz';

interface Example {
  label: string;
  text: string;
}
const EXAMPLES: Example[] = [
  { label: 'Mixed', text: '5 2 9 1 7 3 8 4 6' },
  { label: 'Already sorted', text: '1 2 3 4 5 6 7 8 9' },
  { label: 'Reversed', text: '9 8 7 6 5 4 3 2 1' },
  { label: 'Many duplicates', text: '4 2 4 1 2 4 1 2 4' },
  { label: 'Nearly sorted', text: '1 2 4 3 5 6 8 7 9' },
  { label: 'Two digits (radix)', text: '70 45 75 90 2 24 66 15' },
];

const OPTIONS = SORT_ALGORITHMS.map((a) => ({ value: a, label: SORT_LABEL[a] }));

export default function SortingDemo() {
  const [algo, setAlgo] = useState<SortAlgorithm>('bubble');
  const [text, setText] = useState('5 2 9 1 7 3 8 4 6');

  const parsed = useMemo(() => parseNumbers(text), [text]);
  const result = useMemo(() => (parsed.error ? null : sort(algo, parsed.values)), [parsed, algo]);
  const all = useMemo(
    () => (parsed.error ? null : SORT_ALGORITHMS.map((a) => ({ algorithm: a, result: sort(a, parsed.values) }))),
    [parsed],
  );
  const steps = result?.steps ?? null;
  const last = (steps?.length ?? 0) - 1;
  const { cursor, setCursor, playing, setPlaying, speed, setSpeed } = useStepper(last, `${algo}|${text}`, 650);
  const step = steps && cursor >= 0 ? (steps[cursor] ?? null) : null;

  const labelCls = 'font-mono text-xs tracking-wider text-muted uppercase';
  const field =
    'mt-2 block min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3 font-mono text-sm text-fg placeholder:text-muted';

  const randomList = (): void => {
    const n = 8 + Math.floor(Math.random() * 5);
    setText(Array.from({ length: n }, () => Math.floor(Math.random() * 99) + 1).join(' '));
  };

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
      {step ? `${step.comparisons} comparisons · ${step.writes} swaps or writes` : null}
    </ExecutionControls>
  ) : null;

  const controls = (
    <>
      <AlgoPicker label="Choose a sorting algorithm" options={OPTIONS} value={algo} onChange={setAlgo} explain={SORT_EXPLAIN[algo]} />

      <div>
        <label htmlFor="sort-list" className={labelCls}>
          Numbers to sort
        </label>
        <input
          id="sort-list"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={parsed.error ? true : undefined}
          className={field}
          placeholder="e.g. 5 2 9 1 7"
        />
        <p className={`mt-2 text-sm ${parsed.error ? 'text-warn' : 'text-muted'}`} role={parsed.error ? 'alert' : undefined}>
          {parsed.error ?? `Enter whole numbers from 0 to 99. Separate numbers with spaces. You can enter up to ${MAX_ITEMS} numbers.`}
        </p>
      </div>

      <div>
        <p className={labelCls}>Examples</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e.label}
              type="button"
              onClick={() => setText(e.text)}
              className="min-h-10 rounded-full border border-line px-4 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              {e.label}
            </button>
          ))}
          <button
            type="button"
            onClick={randomList}
            className="min-h-10 rounded-full border border-line px-4 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            Random list
          </button>
        </div>
      </div>
    </>
  );

  const visual =
    steps && all && result ? (
      <>
        <SortingViz step={step} input={parsed.values} index={cursor} total={steps.length} />

        <StepLog
          items={steps.slice(0, cursor + 1).map((s, i) => ({ label: `Step ${i + 1}`, text: s.note }))}
          total={steps.length}
          emptyMessage="Press Next or Play to follow the algorithm one comparison or change at a time."
        />

        {cursor >= last && (
          <p className="mt-4 rounded-lg border border-accent/40 bg-accent-soft p-3 text-sm" role="status">
            Sorted: <span className="font-mono">{result.sorted.join(' ')}</span> ({result.comparisons} comparisons, {result.writes}{' '}
            swaps or writes).
          </p>
        )}

        <SortingComparison results={all} selected={algo} onSelect={setAlgo} />
      </>
    ) : (
      <p className="rounded-lg border border-dashed border-line p-6 text-sm text-muted">Fix the input above to see the visualization.</p>
    );

  return <WorkspaceLayout controls={controls} visual={visual} toolbar={toolbar} />;
}
