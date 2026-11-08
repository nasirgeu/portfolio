import { edgeLabel, type Graph, type Step, type Table } from '../../../lib/graph';
import { Stat, StatGrid } from '../Stat';

// A squarer canvas keeps the labels readable when the graph is scaled down on a phone.
const W = 480;
const H = 380;
const R = 22;

interface Pt {
  x: number;
  y: number;
}

/** Nodes sit evenly on a circle, the first one at the top. */
function layout(nodes: readonly string[]): Record<string, Pt> {
  const out: Record<string, Pt> = {};
  const n = nodes.length;
  nodes.forEach((id, i) => {
    if (n <= 2) {
      out[id] = { x: W / 2 + (i === 0 ? -110 : 110), y: H / 2 };
      return;
    }
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    out[id] = { x: W / 2 + 180 * Math.cos(a), y: H / 2 + 145 * Math.sin(a) };
  });
  return out;
}

const NODE_CLS: Record<string, { fill: string; stroke: string; text: string }> = {
  idle: { fill: 'var(--surface)', stroke: 'var(--border-strong)', text: 'var(--fg)' },
  frontier: { fill: 'var(--surface)', stroke: 'var(--warn)', text: 'var(--warn)' },
  current: { fill: 'var(--accent)', stroke: 'var(--accent)', text: 'var(--accent-fg)' },
  done: { fill: 'var(--accent-soft)', stroke: 'var(--accent)', text: 'var(--accent)' },
};

const EDGE_STYLE: Record<string, { stroke: string; width: number; dash?: string; opacity: number }> = {
  idle: { stroke: 'var(--border-strong)', width: 1.75, opacity: 1 },
  considered: { stroke: 'var(--warn)', width: 2.5, dash: '6 4', opacity: 1 },
  tree: { stroke: 'var(--accent)', width: 3.5, opacity: 1 },
  rejected: { stroke: 'var(--border-strong)', width: 1.5, dash: '3 5', opacity: 0.55 },
  relaxed: { stroke: 'var(--accent)', width: 3.5, dash: '6 4', opacity: 1 },
};

interface Props {
  graph: Graph;
  step: Step | null;
  index: number;
  total: number;
  workLabel: string;
  orderLabel: string;
}

/**
 * The graph as SVG. Every colour comes from the snapshot of the step being shown:
 * the node being processed is solid blue, nodes waiting are amber, finished nodes are soft blue,
 * and edges in the result (tree or shortest path) are thick and blue.
 */
export default function GraphViz({ graph, step, index, total, workLabel, orderLabel }: Props) {
  const pos = layout(graph.nodes);
  // Two directed edges between the same pair are drawn as gentle curves so both stay visible.
  const hasReverse = (i: number): boolean => {
    const e = graph.edges[i] as (typeof graph.edges)[number];
    return e.directed && graph.edges.some((o, j) => j !== i && o.directed && o.from === e.to && o.to === e.from);
  };

  return (
    <section aria-label="Graph">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-xs tracking-wider text-muted uppercase">The graph</h3>
        <p className="font-mono text-xs text-muted">
          Step {Math.max(index + 1, 0)} of {total}
        </p>
      </div>

      <div className="mt-2 rounded-lg border border-line bg-bg p-2 sm:p-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mx-auto block h-auto w-full max-w-[34rem]"
          role="img"
          aria-label={`Graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges: ${graph.edges.map((e) => `${edgeLabel(e)} weight ${e.weight}`).join(', ')}`}
        >
          {graph.edges.map((e, i) => {
            const a = pos[e.from] as Pt;
            const b = pos[e.to] as Pt;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const bend = hasReverse(i) ? 22 : 0;
            const nx = -uy;
            const ny = ux;
            const cx = (a.x + b.x) / 2 + nx * bend * 2;
            const cy = (a.y + b.y) / 2 + ny * bend * 2;
            // Start and end on the edge of each node circle.
            const sx = a.x + ux * R;
            const sy = a.y + uy * R;
            const tx = e.directed ? b.x - ux * (R + 2) : b.x - ux * R;
            const ty = e.directed ? b.y - uy * (R + 2) : b.y - uy * R;
            const state = step ? (step.edges[i] ?? 'idle') : 'idle';
            const st = EDGE_STYLE[state] as (typeof EDGE_STYLE)[string];
            // Label sits on the middle of the curve.
            const lx = 0.25 * sx + 0.5 * cx + 0.25 * tx;
            const ly = 0.25 * sy + 0.5 * cy + 0.25 * ty;
            // Arrow head: direction of the curve at its end.
            const hx = tx - cx;
            const hy = ty - cy;
            const hl = Math.hypot(hx, hy) || 1;
            const hux = hx / hl;
            const huy = hy / hl;
            const ah = 11;
            const arrow = `${tx + hux * 2},${ty + huy * 2} ${tx - hux * ah - huy * 5},${ty - huy * ah + hux * 5} ${tx - hux * ah + huy * 5},${ty - huy * ah - hux * 5}`;
            return (
              <g key={i} style={{ opacity: st.opacity, transition: 'opacity .3s' }}>
                <path
                  d={`M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`}
                  fill="none"
                  stroke={st.stroke}
                  strokeWidth={st.width}
                  strokeDasharray={st.dash}
                  strokeLinecap="round"
                  style={{ transition: 'stroke .3s, stroke-width .3s' }}
                />
                {e.directed && <polygon points={arrow} fill={st.stroke} />}
                <g transform={`translate(${lx} ${ly})`}>
                  <rect x="-16" y="-11" width="32" height="22" rx="6" fill="var(--bg)" stroke="var(--border)" />
                  <text textAnchor="middle" dy="5" fontSize="14" fontFamily="var(--font-mono, monospace)" fill="var(--muted)">
                    {e.weight}
                  </text>
                </g>
              </g>
            );
          })}
          {graph.nodes.map((id) => {
            const p = pos[id] as Pt;
            const state = step ? (step.nodes[id] ?? 'idle') : 'idle';
            const c = NODE_CLS[state] as (typeof NODE_CLS)[string];
            return (
              <g key={id} transform={`translate(${p.x} ${p.y})`}>
                <circle r={R} fill={c.fill} stroke={c.stroke} strokeWidth="2.5" style={{ transition: 'fill .3s, stroke .3s' }} />
                <text textAnchor="middle" dy="6" fontSize="18" fontWeight="700" fontFamily="var(--font-mono, monospace)" fill={c.text}>
                  {id}
                </text>
              </g>
            );
          })}
        </svg>
        <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-xs text-muted" aria-label="Colour key">
          <li><span className="mr-1.5 inline-block size-2.5 rounded-full border border-accent bg-accent align-middle" />current</li>
          <li><span className="mr-1.5 inline-block size-2.5 rounded-full border border-warn align-middle" />waiting</li>
          <li><span className="mr-1.5 inline-block size-2.5 rounded-full border border-accent bg-accent-soft align-middle" />finished</li>
          <li><span className="mr-1.5 inline-block h-0.5 w-4 bg-accent align-middle" />in the result</li>
        </ul>
      </div>

      <div className="mt-3">
        <StatGrid>
          <Stat label={workLabel} value={step?.work ?? 0} tone="warn" />
          <Stat label={orderLabel} value={step?.order.length ?? 0} hint={`of ${graph.nodes.length} nodes`} tone="accent" />
          <Stat label="Nodes" value={graph.nodes.length} />
          <Stat label="Edges" value={graph.edges.length} />
        </StatGrid>
      </div>
    </section>
  );
}

/** The queue, stack, priority queue or sorted edge list the algorithm is using. */
export function StructurePanel({ structure, order, orderLabel }: { structure: Step['structure']; order: readonly string[]; orderLabel: string }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border border-line bg-bg p-3">
        <h3 className="font-mono text-xs tracking-wider text-muted uppercase">{structure ? structure.label : 'Working data'}</h3>
        {structure && structure.items.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={structure.label}>
            {structure.items.map((it, i) => (
              <li
                key={`${it}-${i}`}
                className={`rounded-md border px-2 py-1 font-mono text-sm ${i === 0 ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong text-fg'}`}
              >
                {it}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">{structure ? 'Empty.' : 'Not used by this step.'}</p>
        )}
      </div>
      <div className="rounded-lg border border-line bg-bg p-3">
        <h3 className="font-mono text-xs tracking-wider text-muted uppercase">{orderLabel}</h3>
        {order.length > 0 ? (
          <ol className="mt-2 flex flex-wrap items-center gap-1.5" aria-label={orderLabel}>
            {order.map((n, i) => (
              <li key={`${n}-${i}`} className="flex items-center gap-1.5 font-mono text-sm">
                <span className="rounded-md border border-line-strong px-2 py-1 text-fg">{n}</span>
                {i < order.length - 1 && <span className="text-muted" aria-hidden="true">→</span>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-muted">Nothing yet.</p>
        )}
      </div>
    </div>
  );
}

/** A table of distances, levels, in-degrees or groups with the changed cells highlighted. */
export function DataTable({ table }: { table: Table }) {
  const hl = (r: number, c: number): boolean => table.hl.some(([hr, hc]) => hr === r && hc === c);
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-bg">
      <table className="w-full border-collapse text-center font-mono text-sm">
        <caption className="px-3 pt-2 text-left font-mono text-xs tracking-wider text-muted uppercase">{table.title}</caption>
        <thead>
          <tr className="text-xs text-muted">
            <th scope="col" className="px-3 py-2 text-left font-normal">
              <span className="sr-only">Row</span>
            </th>
            {table.head.map((h) => (
              <th key={h} scope="col" className="px-3 py-2 font-semibold text-fg">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r, ri) => (
            <tr key={r.label} className="border-t border-line">
              <th scope="row" className="px-3 py-2 text-left font-semibold text-fg">
                {r.label}
              </th>
              {r.cells.map((cell, ci) => (
                <td key={ci} className={`px-3 py-2 ${hl(ri, ci) ? 'bg-accent-soft font-semibold text-accent' : cell === '∞' ? 'text-muted' : ''}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
