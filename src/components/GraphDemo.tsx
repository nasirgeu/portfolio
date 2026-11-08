import { useEffect, useMemo, useState } from 'react';
import {
  GRAPH_ALGORITHMS,
  GRAPH_EXPLAIN,
  GRAPH_FACTS,
  GRAPH_LABEL,
  MAX_EDGES,
  NEEDS_SOURCE,
  parseGraph,
  requirement,
  runGraph,
  type GraphAlgorithm,
} from '../lib/graph';
import StepLog from './StepLog';
import ExecutionControls from './lab/ExecutionControls';
import WorkspaceLayout from './lab/WorkspaceLayout';
import AlgoPicker from './lab/AlgoPicker';
import { useStepper } from './lab/useStepper';
import GraphViz, { DataTable, StructurePanel } from './lab/viz/GraphViz';

interface Example {
  label: string;
  text: string;
}
const ROADS = 'A-B:4 A-C:2 B-C:1 B-D:5 C-D:8 C-E:10 D-E:2 D-F:6 E-F:3';
const EXAMPLES: Example[] = [
  { label: 'Road network', text: ROADS },
  { label: 'Negative weight', text: 'A>B:4 A>C:5 B>C:-3 C>D:2' },
  { label: 'Task order', text: 'A>B A>C B>D C>D D>E' },
  { label: 'Negative cycle', text: 'A>B:1 B>C:-3 C>A:1' },
  { label: 'Directed cycle', text: 'A>B B>C C>A D>A' },
  { label: 'Not connected', text: 'A-B:1 B-C:2 D-E:3' },
];

/** The example that suits each algorithm, offered when the current graph does not. */
const SUGGEST: Record<GraphAlgorithm, Example> = {
  bfs: EXAMPLES[0] as Example,
  dfs: EXAMPLES[0] as Example,
  dijkstra: EXAMPLES[0] as Example,
  'bellman-ford': EXAMPLES[1] as Example,
  'floyd-warshall': EXAMPLES[1] as Example,
  prim: EXAMPLES[0] as Example,
  kruskal: EXAMPLES[0] as Example,
  topological: EXAMPLES[2] as Example,
};

const OPTIONS = GRAPH_ALGORITHMS.map((a) => ({ value: a, label: GRAPH_LABEL[a] }));

export default function GraphDemo() {
  const [algo, setAlgo] = useState<GraphAlgorithm>('dijkstra');
  const [text, setText] = useState(ROADS);
  const [source, setSource] = useState('A');

  const parsed = useMemo(() => parseGraph(text), [text]);
  const graph = parsed.graph;
  const problem = graph ? requirement(algo, graph) : null;
  const source2 = graph && graph.nodes.includes(source) ? source : (graph?.nodes[0] ?? 'A');

  // Keep the start node valid when the graph changes.
  useEffect(() => {
    if (graph && !graph.nodes.includes(source)) setSource(graph.nodes[0] ?? 'A');
  }, [graph, source]);

  const result = useMemo(() => (graph && !problem ? runGraph(algo, graph, source2) : null), [graph, problem, algo, source2]);
  const steps = result?.steps ?? null;
  const last = (steps?.length ?? 0) - 1;
  const { cursor, setCursor, playing, setPlaying, speed, setSpeed } = useStepper(last, `${algo}|${text}|${source2}`, 1100);
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
      {step && result ? `${result.workLabel}: ${step.work}` : null}
    </ExecutionControls>
  ) : null;

  const error = parsed.error ?? problem;

  const controls = (
    <>
      <AlgoPicker label="Choose a graph algorithm" options={OPTIONS} value={algo} onChange={setAlgo} explain={GRAPH_EXPLAIN[algo]} />

      <div className="grid gap-5 sm:grid-cols-[1fr_9rem]">
        <div>
          <label htmlFor="graph-edges" className={labelCls}>
            Edges
          </label>
          <input
            id="graph-edges"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            className={field}
            placeholder="e.g. A-B:4 A-C:2 B-D:5"
          />
        </div>
        {NEEDS_SOURCE[algo] && graph && (
          <div>
            <label htmlFor="graph-source" className={labelCls}>
              Start node
            </label>
            <select
              id="graph-source"
              value={source2}
              onChange={(e) => setSource(e.target.value)}
              className="mt-2 block min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3 font-mono text-sm text-fg"
            >
              {graph.nodes.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className={`-mt-2 text-sm ${error ? 'text-warn' : 'text-muted'}`} role={error ? 'alert' : undefined}>
        {error ? (
          <>
            <p>{error}</p>
            {problem && !parsed.error && (
              <button
                type="button"
                onClick={() => setText(SUGGEST[algo].text)}
                className="mt-2 min-h-10 rounded-full border border-line px-4 text-sm text-fg transition-colors hover:border-line-strong"
              >
                Use the “{SUGGEST[algo].label}” example
              </button>
            )}
          </>
        ) : (
          <p>
            A-B:4 means an undirected connection between A and B with weight 4. A&gt;B:4 means a directed connection from A to
            B with weight 4. The weight is optional. Use letters A to H and up to {MAX_EDGES} edges.
          </p>
        )}
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
        </div>
      </div>
    </>
  );

  const visual =
    graph && steps && result ? (
      <>
        <GraphViz graph={graph} step={step} index={cursor} total={steps.length} workLabel={result.workLabel} orderLabel={result.orderLabel} />

        <div className="mt-3">
          <StructurePanel structure={step?.structure ?? null} order={step?.order ?? []} orderLabel={result.orderLabel} />
          {step?.table && <DataTable table={step.table} />}
        </div>

        <StepLog
          items={steps.slice(0, cursor + 1).map((s, i) => ({ label: `Step ${i + 1}`, text: s.note }))}
          total={steps.length}
          emptyMessage="Press Next or Play to follow each decision made by the algorithm."
        />

        {cursor >= last && (
          <dl className="mt-4 space-y-1.5 rounded-lg border border-accent/40 bg-accent-soft p-3 text-sm" role="status">
            {result.summary.map((s) => (
              <div key={s.label} className="flex flex-wrap gap-x-2">
                <dt className="font-mono text-xs text-muted">{s.label}:</dt>
                <dd className="font-mono">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-6">
          <h3 className="font-mono text-xs tracking-wider text-muted uppercase">About {GRAPH_LABEL[algo]}</h3>
          <dl className="mt-2 grid gap-3 rounded-lg border border-line bg-bg p-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-mono text-xs text-muted">Time</dt>
              <dd className="mt-0.5 font-mono">{GRAPH_FACTS[algo].time}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs text-muted">Space</dt>
              <dd className="mt-0.5 font-mono">{GRAPH_FACTS[algo].space}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs text-muted">Works on</dt>
              <dd className="mt-0.5">{GRAPH_FACTS[algo].needs}</dd>
            </div>
          </dl>
        </div>
      </>
    ) : (
      <p className="rounded-lg border border-dashed border-line p-6 text-sm text-muted">
        {parsed.error ? 'Fix the edges above to see the graph.' : 'This graph does not suit the selected algorithm. See the message above.'}
      </p>
    );

  return <WorkspaceLayout controls={controls} visual={visual} toolbar={toolbar} />;
}
