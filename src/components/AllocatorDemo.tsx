import { useEffect, useMemo, useState } from 'react';
import { FIT_EXPLAIN, FIT_LABEL, emptyMemory, parseOps, simulateAllocator, type Fit } from '../lib/allocator';
import StepLog from './StepLog';
import DesignDiagram from './DesignDiagram';
import ExecutionControls, { stepDelay } from './lab/ExecutionControls';
import WorkspaceLayout from './lab/WorkspaceLayout';
import MemoryViz from './lab/viz/MemoryViz';
import { toneStyle } from './lab/colors';
import { allocatorDiagram } from '../data/designDiagrams';

const FITS: Fit[] = ['first', 'best', 'worst'];
const SIZES = [16, 24, 32, 48, 64];

interface Example {
  label: string;
  ops: string;
  mem: number;
}
const EXAMPLES: Example[] = [
  { label: 'Default', ops: 'A5 B3 C9 D4 -A -C E4 F6 G7', mem: 32 },
  { label: 'Strategies differ', ops: 'A10 B2 C5 D2 E7 F2 G12 -A -C -E H6', mem: 48 },
  { label: 'Fragmentation fails', ops: 'A4 B4 C4 D4 -A -C E6', mem: 16 },
  { label: 'Free merges gaps', ops: 'A8 B8 C8 -A -B D14', mem: 32 },
];

export default function AllocatorDemo() {
  const [fit, setFit] = useState<Fit>('first');
  const [memSize, setMemSize] = useState(32);
  const [text, setText] = useState('A5 B3 C9 D4 -A -C E4 F6 G7');
  const [cursor, setCursor] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const parsed = useMemo(() => parseOps(text, memSize), [text, memSize]);
  const steps = useMemo(
    () => (parsed.error ? null : simulateAllocator(fit, memSize, parsed.ops)),
    [parsed, fit, memSize],
  );
  const last = (steps?.length ?? 0) - 1;

  useEffect(() => {
    setCursor(-1);
    setPlaying(false);
  }, [fit, memSize, text]);

  useEffect(() => {
    if (!playing) return;
    if (cursor >= last) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setCursor((c) => Math.min(c + 1, last)), stepDelay(1100, speed));
    return () => window.clearTimeout(t);
  }, [playing, cursor, last, speed]);

  const step = steps && cursor >= 0 ? (steps[cursor] ?? null) : null;
  const blocks = step ? step.blocks : emptyMemory(memSize);

  const labelCls = 'font-mono text-xs tracking-wider text-muted uppercase';
  const field =
    'mt-2 block min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3 font-mono text-sm text-fg placeholder:text-muted';

  const diagram = useMemo(() => allocatorDiagram(fit), [fit]);

  // The execution controls live in a sticky bar above the chart, not in the inputs panel.
  const toolbar = steps ? (
      <ExecutionControls
        cursor={cursor}
        last={last}
        playing={playing}
        setCursor={setCursor}
        setPlaying={setPlaying}
        speed={speed}
        setSpeed={setSpeed}
      />
  ) : null;

  const controls = (
    <>
      <div>
        <div role="group" aria-label="Choose a placement strategy" className="flex flex-wrap gap-2">
          {FITS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFit(f)}
              aria-pressed={fit === f}
              className={`min-h-10 rounded-full border px-4 text-sm transition-colors ${
                fit === f
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line text-muted hover:border-line-strong hover:text-fg'
              }`}
            >
              {FIT_LABEL[f]}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">{FIT_EXPLAIN[fit]}</p>
      </div>

      <div>
        <label htmlFor="alloc-ops" className={labelCls}>
          Operations, in order
        </label>
        <input
          id="alloc-ops"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={parsed.error ? true : undefined}
          className={field}
          placeholder="e.g. A5 B3 -A C4"
        />
        <p className={`mt-2 text-sm ${parsed.error ? 'text-warn' : 'text-muted'}`} role={parsed.error ? 'alert' : undefined}>
          {parsed.error ??
            'Enter a letter and size to allocate memory. For example, A5 means allocate 5 units to block A. Enter a minus sign and a letter to free a block. For example, -A frees block A.'}
        </p>
      </div>

      <div>
        <label htmlFor="alloc-mem" className={labelCls}>
          Memory size (units)
        </label>
        <select
          id="alloc-mem"
          value={memSize}
          onChange={(e) => setMemSize(Number(e.target.value))}
          className="mt-2 block min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3 font-mono text-sm text-fg"
        >
          {SIZES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Examples */}
      <div>
        <p className={labelCls}>Examples</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e.label}
              type="button"
              onClick={() => {
                setMemSize(e.mem);
                setText(e.ops);
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

  const visual = steps ? (
    <>
      <MemoryViz step={step} blocks={blocks} memSize={memSize} fit={fit} />

      <StepLog
        items={steps.slice(0, cursor + 1).map((s, i) => ({ label: `Step ${i + 1} (${s.label})`, text: s.note }))}
        total={steps.length}
        emptyMessage="Press Next or Play to see where each memory block is placed or released and why."
      />

      {/* Memory map as a table, for precise reading and screen readers */}
      <h3 className={`mt-6 ${labelCls}`}>Memory map</h3>
      <div className="mt-2 overflow-x-auto rounded-lg border border-line bg-bg">
        <table className="w-full border-collapse text-center font-mono text-sm">
          <caption className="sr-only">Every block and free gap in memory, from address 0 upwards</caption>
          <thead>
            <tr className="text-xs text-muted">
              <th scope="col" className="px-3 py-2 font-normal">Block</th>
              <th scope="col" className="px-3 py-2 font-normal">Start</th>
              <th scope="col" className="px-3 py-2 font-normal">End</th>
              <th scope="col" className="px-3 py-2 font-normal">Size</th>
              <th scope="col" className="px-3 py-2 font-normal">State</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((b) => (
              <tr key={`${b.start}-${b.id ?? 'free'}`} className="border-t border-line">
                <th scope="row" className="px-3 py-2">
                  {b.id ? (
                    <span style={toneStyle(b.id)} className="tone tone-soft inline-flex size-7 items-center justify-center rounded-md border font-semibold">
                      {b.id}
                    </span>
                  ) : (
                    <span className="text-muted">–</span>
                  )}
                </th>
                <td className="px-3 py-2">{b.start}</td>
                <td className="px-3 py-2">{b.start + b.size}</td>
                <td className="px-3 py-2">{b.size}</td>
                <td className="px-3 py-2">{b.id ? 'In use' : 'Free'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DesignDiagram nodes={diagram} />
    </>
  ) : (
    <p className="rounded-lg border border-dashed border-line p-6 text-sm text-muted">
      Fix the input on the left to see the visualization.
    </p>
  );

  return <WorkspaceLayout controls={controls} visual={visual} toolbar={toolbar} />;
}
