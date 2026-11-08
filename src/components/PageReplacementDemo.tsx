import { useEffect, useMemo, useState } from 'react';
import { parseReferences, simulate, type Algorithm } from '../lib/pageReplacement';
import StepLog from './StepLog';
import DesignDiagram from './DesignDiagram';
import ExecutionControls, { stepDelay } from './lab/ExecutionControls';
import WorkspaceLayout from './lab/WorkspaceLayout';
import FrameBlocks from './lab/viz/FrameBlocks';
import { Stat } from './lab/Stat';
import { pageReplacementDiagram } from '../data/designDiagrams';

const ALGORITHMS: Algorithm[] = ['FIFO', 'LRU', 'Optimal'];
const DEFAULT_REFS = '7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1';
const BELADY_REFS = '1 2 3 4 1 2 5 1 2 3 4 5';
const FRAME_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

const EXPLAIN: Record<Algorithm, string> = {
  FIFO: 'When memory is full, FIFO removes the page that has been in memory the longest.',
  LRU: 'When memory is full, LRU removes the page that has not been used for the longest time.',
  Optimal:
    'When memory is full, Optimal removes the page whose next use is farthest in the future. Real systems cannot see the future, so it is the best case to compare against.',
};

export default function PageReplacementDemo() {
  const [algo, setAlgo] = useState<Algorithm>('LRU');
  const [frameCount, setFrameCount] = useState(3);
  const [text, setText] = useState(DEFAULT_REFS);
  const [cursor, setCursor] = useState(-1); // -1 = nothing shown yet
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const parsed = useMemo(() => parseReferences(text), [text]);
  const result = useMemo(
    () => (parsed.error ? null : simulate(algo, frameCount, parsed.refs)),
    [parsed, algo, frameCount],
  );
  // The same input run through all three algorithms, for the comparison.
  const comparison = useMemo(
    () => (parsed.error ? null : ALGORITHMS.map((a) => ({ a, ...simulate(a, frameCount, parsed.refs) }))),
    [parsed, frameCount],
  );
  // FIFO with every frame count, to show Belady's anomaly on the current requests.
  const fifoByFrames = useMemo(
    () => (parsed.error ? null : FRAME_OPTIONS.map((f) => ({ f, faults: simulate('FIFO', f, parsed.refs).faults }))),
    [parsed],
  );

  const last = (result?.steps.length ?? 0) - 1;

  // Any change to the inputs restarts the walkthrough.
  useEffect(() => {
    setCursor(-1);
    setPlaying(false);
  }, [algo, frameCount, text]);

  useEffect(() => {
    if (!playing) return;
    if (cursor >= last) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setCursor((c) => Math.min(c + 1, last)), stepDelay(900, speed));
    return () => window.clearTimeout(t);
  }, [playing, cursor, last, speed]);

  const shown = result ? result.steps.slice(0, cursor + 1) : [];
  const hitsSoFar = shown.filter((s) => s.hit).length;
  const faultsSoFar = shown.length - hitsSoFar;
  const step = result && cursor >= 0 ? (result.steps[cursor] ?? null) : null;

  const diagram = useMemo(() => pageReplacementDiagram(algo), [algo]);

  const anomaly = useMemo(() => {
    if (!fifoByFrames) return null;
    for (let i = 1; i < fifoByFrames.length; i++) {
      const a = fifoByFrames[i - 1];
      const b = fifoByFrames[i];
      if (a && b && b.faults > a.faults) return { from: a, to: b };
    }
    return null;
  }, [fifoByFrames]);
  const maxFifo = Math.max(1, ...(fifoByFrames ?? []).map((x) => x.faults));
  const best = comparison ? Math.min(...comparison.map((c) => c.faults)) : 0;

  const loadBelady = (): void => {
    setText(BELADY_REFS);
    setFrameCount(3);
    setAlgo('FIFO');
  };

  // The execution controls live in a sticky bar above the chart, not in the inputs panel.
  const toolbar = result ? (
      <ExecutionControls
        cursor={cursor}
        last={last}
        playing={playing}
        setCursor={setCursor}
        setPlaying={setPlaying}
        speed={speed}
        setSpeed={setSpeed}
      >
        {faultsSoFar} faults · {hitsSoFar} hits
      </ExecutionControls>
  ) : null;

  const controls = (
    <>
      {/* Algorithm choice */}
      <div>
        <div role="group" aria-label="Choose an algorithm" className="flex flex-wrap gap-2">
          {ALGORITHMS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAlgo(a)}
              aria-pressed={algo === a}
              className={`min-h-10 rounded-full border px-4 text-sm transition-colors ${
                algo === a
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line text-muted hover:border-line-strong hover:text-fg'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">{EXPLAIN[algo]}</p>
      </div>

      {/* Inputs */}
      <div>
        <label htmlFor="refs" className="font-mono text-xs tracking-wider text-muted uppercase">
          Pages requested, in order
        </label>
        <input
          id="refs"
          value={text}
          onChange={(e) => setText(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={parsed.error ? true : undefined}
          aria-describedby="refs-help"
          className="mt-2 block min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3 font-mono text-sm text-fg placeholder:text-muted"
        />
        <p
          id="refs-help"
          className={`mt-2 text-sm ${parsed.error ? 'text-warn' : 'text-muted'}`}
          role={parsed.error ? 'alert' : undefined}
        >
          {parsed.error ?? 'Enter page numbers separated by spaces or commas. Use whole numbers from 0 to 99, with up to 40 requests.'}
        </p>
      </div>

      <div>
        <label htmlFor="frames" className="font-mono text-xs tracking-wider text-muted uppercase">
          Frames (memory slots)
        </label>
        <select
          id="frames"
          value={frameCount}
          onChange={(e) => setFrameCount(Number(e.target.value))}
          className="mt-2 block min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3 font-mono text-sm text-fg"
        >
          {FRAME_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Examples */}
      <div>
        <p className="font-mono text-xs tracking-wider text-muted uppercase">Examples</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-10 rounded-full border border-line px-4 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
            onClick={() => {
              setText(DEFAULT_REFS);
              setFrameCount(3);
              setAlgo('LRU');
            }}
          >
            Classic list
          </button>
          <button
            type="button"
            className="min-h-10 rounded-full border border-line px-4 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
            onClick={loadBelady}
          >
            Belady&rsquo;s anomaly
          </button>
        </div>
      </div>

    </>
  );

  const visual = result && comparison ? (
    <>
      <FrameBlocks
        step={step}
        frameCount={frameCount}
        index={cursor}
        total={result.steps.length}
        hits={hitsSoFar}
        faults={faultsSoFar}
      />

      {/* Plain-English explanation, one bullet per step reached */}
      <StepLog
        items={shown.map((x, i) => ({ label: `Step ${i + 1}`, text: x.note }))}
        total={result.steps.length}
        emptyMessage="Press Next or Play to see how each page request is handled, one at a time."
      />

      {/* History of every request */}
      <h3 className="mt-6 font-mono text-xs tracking-wider text-muted uppercase">History of every request</h3>
      <div className="mt-2 overflow-x-auto rounded-lg border border-line bg-bg">
        <table className="w-full border-collapse text-center font-mono text-sm">
          <caption className="sr-only">
            Step-by-step {algo} page replacement with {frameCount} frames. Each column is one page request.
          </caption>
          <thead>
            <tr>
              <th scope="row" className="sticky left-0 bg-bg px-3 py-2 text-left text-xs font-normal text-muted">
                Request
              </th>
              {result.steps.map((s, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`min-w-10 px-2 py-2 font-semibold ${i === cursor ? 'bg-accent-soft text-accent' : i > cursor ? 'text-muted' : ''}`}
                >
                  {s.page}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: frameCount }, (_, f) => (
              <tr key={f} className="border-t border-line">
                <th scope="row" className="sticky left-0 bg-bg px-3 py-2 text-left text-xs font-normal text-muted">
                  Frame {f + 1}
                </th>
                {result.steps.map((s, i) => {
                  const revealed = i <= cursor;
                  const changed = revealed && s.changedFrame === f;
                  return (
                    <td
                      key={i}
                      className={`px-2 py-2 ${i === cursor ? 'bg-accent-soft' : ''} ${changed ? 'font-bold text-accent' : ''}`}
                    >
                      {revealed ? (s.frames[f] ?? '–') : <span className="text-muted">·</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t border-line">
              <th scope="row" className="sticky left-0 bg-bg px-3 py-2 text-left text-xs font-normal text-muted">
                Result
              </th>
              {result.steps.map((s, i) => (
                <td
                  key={i}
                  className={`px-2 py-2 text-xs ${i === cursor ? 'bg-accent-soft' : ''} ${
                    i <= cursor ? (s.hit ? 'text-accent' : 'text-warn') : 'text-muted'
                  }`}
                >
                  {i <= cursor ? (s.hit ? 'Hit' : 'Fault') : '·'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Comparison of all three algorithms on the same input */}
      <section aria-label="Algorithm comparison" className="mt-6">
        <h3 className="font-mono text-xs tracking-wider text-muted uppercase">
          Page faults for these inputs (lower is better)
        </h3>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {comparison.map((c) => {
            const total = c.hits + c.faults;
            return (
              <li
                key={c.a}
                className={`rounded-lg border p-4 ${c.a === algo ? 'border-accent bg-accent-soft' : 'border-line bg-bg'}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-mono text-sm text-muted">{c.a}</p>
                  {c.faults === best && (
                    <span className="rounded border border-accent px-1.5 font-mono text-xs tracking-wider text-accent uppercase">
                      fewest
                    </span>
                  )}
                </div>
                <p className="mt-1 text-3xl font-bold tracking-tight">{c.faults}</p>
                <div className="mt-2 h-2 overflow-hidden rounded bg-surface-2" aria-hidden="true">
                  <div className="h-2 rounded bg-warn" style={{ width: `${total > 0 ? (c.faults / total) * 100 : 0}%` }} />
                </div>
                <p className="mt-2 font-mono text-xs text-muted">
                  {c.hits} hits · {total > 0 ? Math.round((c.hits / total) * 100) : 0}% hit ratio
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Belady's anomaly, computed with the real FIFO engine */}
      {fifoByFrames && (
        <section aria-label="Belady's anomaly" className="mt-6">
          <h3 className="font-mono text-xs tracking-wider text-muted uppercase">
            Belady&rsquo;s anomaly: FIFO faults by number of frames
          </h3>
          <div className="mt-2 rounded-lg border border-line bg-bg p-4">
            <ul className="space-y-1.5" aria-label="FIFO page faults for each number of frames">
              {fifoByFrames.map((x) => {
                const rise = anomaly !== null && anomaly.to.f === x.f;
                return (
                  <li key={x.f} className="flex items-center gap-3 font-mono text-xs">
                    <span className="w-16 shrink-0 text-muted">
                      {x.f} frame{x.f === 1 ? '' : 's'}
                    </span>
                    <span className="h-3 flex-1 overflow-hidden rounded bg-surface-2" aria-hidden="true">
                      <span
                        className={`block h-3 rounded ${rise ? 'bg-warn' : 'bg-accent'}`}
                        style={{ width: `${(x.faults / maxFifo) * 100}%` }}
                      />
                    </span>
                    <span className={`w-8 text-right ${rise ? 'font-bold text-warn' : ''}`}>{x.faults}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-sm text-muted">
              {anomaly
                ? `Anomaly found: with ${anomaly.to.f} frames FIFO has ${anomaly.to.faults} faults, more than the ${anomaly.from.faults} it has with ${anomaly.from.f}. More memory made FIFO worse.`
                : 'For this particular input, adding more frames does not increase FIFO faults. Try the Belady’s anomaly example to see a case where it does.'}
            </p>
          </div>
        </section>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Requests" value={result.steps.length} />
        <Stat label={`${algo} faults`} value={result.faults} tone="warn" />
        <Stat label={`${algo} hits`} value={result.hits} tone="accent" />
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
