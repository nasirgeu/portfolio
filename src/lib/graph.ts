/**
 * Graph engine. Pure functions, no screen code.
 * Eight classic algorithms run on a small graph and record one Step per decision,
 * with the state of every node and edge, the working data structure and a plain-English note.
 *
 * Input format: edges such as A-B:4 (undirected, weight 4) or A>B:4 (directed). The weight is optional (default 1).
 */

export type GraphAlgorithm = 'bfs' | 'dfs' | 'dijkstra' | 'bellman-ford' | 'floyd-warshall' | 'prim' | 'kruskal' | 'topological';

export const GRAPH_ALGORITHMS: readonly GraphAlgorithm[] = [
  'bfs',
  'dfs',
  'dijkstra',
  'bellman-ford',
  'floyd-warshall',
  'prim',
  'kruskal',
  'topological',
];

export const GRAPH_LABEL: Record<GraphAlgorithm, string> = {
  bfs: 'BFS',
  dfs: 'DFS',
  dijkstra: 'Dijkstra',
  'bellman-ford': 'Bellman-Ford',
  'floyd-warshall': 'Floyd-Warshall',
  prim: "Prim's",
  kruskal: "Kruskal's",
  topological: 'Topological sort',
};

export const GRAPH_EXPLAIN: Record<GraphAlgorithm, string> = {
  bfs: 'Visits the graph level by level using a queue: first the start node, then its neighbours, then their neighbours.',
  dfs: 'Goes as deep as possible along one path using a stack, then backs up and tries the next branch.',
  dijkstra: 'Finds the shortest distance from a starting node. It always selects the closest unfinished node next. It works with edge weights of 0 or more.',
  'bellman-ford': 'Finds shortest distances by relaxing every edge again and again. Slower than Dijkstra, but it handles negative weights and can detect a negative cycle.',
  'floyd-warshall': 'Finds the shortest distance between every pair of nodes by allowing one more node at a time as a stop-over.',
  prim: "Grows a minimum spanning tree from the start node, always adding the cheapest edge that reaches a new node. Needs an undirected graph.",
  kruskal: "Builds a minimum spanning tree by taking edges from cheapest to dearest and skipping any that would make a cycle. Needs an undirected graph.",
  topological: 'Orders the nodes of a directed graph so every edge points forward, by repeatedly taking a node with no incoming edges.',
};

export const NEEDS_SOURCE: Record<GraphAlgorithm, boolean> = {
  bfs: true,
  dfs: true,
  dijkstra: true,
  'bellman-ford': true,
  'floyd-warshall': false,
  prim: true,
  kruskal: false,
  topological: false,
};

export interface Edge {
  from: string;
  to: string;
  weight: number;
  directed: boolean;
}

export interface Graph {
  nodes: string[];
  edges: Edge[];
}

export const MAX_EDGES = 14;
export const MAX_NODES = 8;
export const MIN_WEIGHT = -20;
export const MAX_WEIGHT = 99;

export const edgeLabel = (e: Edge): string => `${e.from}${e.directed ? '→' : '–'}${e.to}`;

export function parseGraph(text: string): { graph: Graph | null; error: string | null } {
  const tokens = text.split(/[\s,]+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return { graph: null, error: 'Enter some edges, for example A-B:4 A-C:2 B-D:5.' };
  const nodes = new Set<string>();
  const edges: Edge[] = [];
  const seen = new Set<string>();
  for (const raw of tokens) {
    const t = raw.toUpperCase();
    if (/^[A-H]$/.test(t)) {
      nodes.add(t);
      continue;
    }
    const m = /^([A-H])([->])([A-H])(?::(-?\d+))?$/.exec(t);
    if (!m) return { graph: null, error: `"${raw}" is not an edge. Write edges like A-B:4 (undirected) or A>B:4 (directed), with letters A to H.` };
    const from = m[1] as string;
    const to = m[3] as string;
    const directed = m[2] === '>';
    if (from === to) return { graph: null, error: `"${raw}" connects a node to itself. Self-loops are not supported.` };
    const weight = m[4] === undefined ? 1 : Number(m[4]);
    if (weight < MIN_WEIGHT || weight > MAX_WEIGHT) return { graph: null, error: `The weight in "${raw}" must be from ${MIN_WEIGHT} to ${MAX_WEIGHT}.` };
    const key = directed ? `${from}>${to}` : [from, to].sort().join('-');
    if (seen.has(key)) return { graph: null, error: `The edge ${from}${directed ? '>' : '-'}${to} appears twice.` };
    seen.add(key);
    nodes.add(from);
    nodes.add(to);
    edges.push({ from, to, weight, directed });
  }
  if (edges.length === 0) return { graph: null, error: 'Add at least one edge, for example A-B:4.' };
  if (edges.length > MAX_EDGES) return { graph: null, error: `Use at most ${MAX_EDGES} edges so the picture stays readable.` };
  const sorted = [...nodes].sort();
  if (sorted.length > MAX_NODES) return { graph: null, error: `Use at most ${MAX_NODES} nodes (A to H).` };
  return { graph: { nodes: sorted, edges }, error: null };
}

/** Why the graph cannot be used with this algorithm, or null when it can. */
export function requirement(algorithm: GraphAlgorithm, g: Graph): string | null {
  if ((algorithm === 'prim' || algorithm === 'kruskal') && g.edges.some((e) => e.directed)) {
    return `${GRAPH_LABEL[algorithm]} works on undirected graphs. Write every edge with a dash, like A-B:4.`;
  }
  if (algorithm === 'topological' && g.edges.some((e) => !e.directed)) {
    return 'Topological sort works on directed graphs. Write every edge with an arrow, like A>B.';
  }
  if (algorithm === 'dijkstra' && g.edges.some((e) => e.weight < 0)) {
    return "Dijkstra's algorithm needs weights of 0 or more. Try Bellman-Ford or Floyd-Warshall for negative weights.";
  }
  return null;
}

export type NodeState = 'idle' | 'frontier' | 'current' | 'done';
export type EdgeState = 'idle' | 'considered' | 'tree' | 'rejected' | 'relaxed';

export interface Table {
  title: string;
  head: string[];
  rows: { label: string; cells: string[] }[];
  /** Highlighted cells as [row, column]. */
  hl: [number, number][];
}

export interface Step {
  note: string;
  nodes: Record<string, NodeState>;
  edges: EdgeState[];
  current: string | null;
  structure: { label: string; items: string[] } | null;
  table: Table | null;
  /** Visit order, finish order or topological order so far. */
  order: string[];
  work: number;
}

export interface GraphResult {
  steps: Step[];
  orderLabel: string;
  workLabel: string;
  summary: { label: string; value: string }[];
  order: string[];
  /** Shortest distance from the source (Dijkstra, Bellman-Ford), or BFS level. Infinity when unreachable. */
  dist: Record<string, number> | null;
  /** All-pairs distances in node order (Floyd-Warshall). */
  matrix: number[][] | null;
  /** Total weight of the spanning tree (Prim, Kruskal). */
  weight: number | null;
  /** Indices of the chosen edges (Prim, Kruskal). */
  chosen: number[];
  negativeCycle: boolean;
  /** Topological sort found a cycle. */
  cyclic: boolean;
}

interface Neighbour {
  to: string;
  edge: number;
  weight: number;
}

export function neighbours(g: Graph, u: string): Neighbour[] {
  const out: Neighbour[] = [];
  g.edges.forEach((e, i) => {
    if (e.from === u) out.push({ to: e.to, edge: i, weight: e.weight });
    else if (!e.directed && e.to === u) out.push({ to: e.from, edge: i, weight: e.weight });
  });
  return out.sort((a, b) => (a.to < b.to ? -1 : a.to > b.to ? 1 : a.edge - b.edge));
}

const fmt = (n: number): string => (n === Infinity ? '∞' : String(n));

class Builder {
  g: Graph;
  nodeS: Record<string, NodeState> = {};
  edgeS: EdgeState[];
  steps: Step[] = [];
  order: string[] = [];
  work = 0;
  constructor(g: Graph) {
    this.g = g;
    this.edgeS = g.edges.map(() => 'idle' as EdgeState);
    for (const n of g.nodes) this.nodeS[n] = 'idle';
  }
  snap(note: string, current: string | null = null, structure: Step['structure'] = null, table: Table | null = null): void {
    this.steps.push({
      note,
      nodes: { ...this.nodeS },
      edges: [...this.edgeS],
      current,
      structure,
      table,
      order: [...this.order],
      work: this.work,
    });
  }
  /** Forget the short-lived highlights. Permanent states ('tree', and 'rejected' where it is kept) stay. */
  clearTemp(): void {
    this.edgeS = this.edgeS.map((s) => (s === 'considered' || s === 'relaxed' ? 'idle' : s));
  }
  clearRejected(): void {
    this.edgeS = this.edgeS.map((s) => (s === 'rejected' ? 'idle' : s));
  }
}

const row = (g: Graph, label: string, values: readonly number[], hl: number[] = []): Table => ({
  title: label,
  head: g.nodes,
  rows: [{ label, cells: values.map(fmt) }],
  hl: hl.map((c) => [0, c] as [number, number]),
});

const emptyResult = (): GraphResult => ({
  steps: [],
  orderLabel: 'Order',
  workLabel: 'Work',
  summary: [],
  order: [],
  dist: null,
  matrix: null,
  weight: null,
  chosen: [],
  negativeCycle: false,
  cyclic: false,
});

/* ------------------------------------------------------------------ BFS and DFS */

function bfs(g: Graph, src: string, b: Builder, res: GraphResult): void {
  const level: Record<string, number> = {};
  for (const n of g.nodes) level[n] = Infinity;
  level[src] = 0;
  const queue = [src];
  b.nodeS[src] = 'frontier';
  const tbl = (hl: number[] = []): Table => row(g, 'Level', g.nodes.map((n) => level[n] as number), hl);
  b.snap(`Start at ${src}. Put it in the queue.`, src, { label: 'Queue (front on the left)', items: [...queue] }, tbl([g.nodes.indexOf(src)]));
  while (queue.length > 0) {
    const u = queue.shift() as string;
    b.nodeS[u] = 'current';
    b.order.push(u);
    b.snap(`Take ${u} from the front of the queue and visit it.`, u, { label: 'Queue (front on the left)', items: [...queue] }, tbl());
    for (const n of neighbours(g, u)) {
      b.work++;
      if (level[n.to] === Infinity) {
        level[n.to] = (level[u] as number) + 1;
        queue.push(n.to);
        b.nodeS[n.to] = 'frontier';
        b.edgeS[n.edge] = 'tree';
        b.snap(`${n.to} is new, so add it to the back of the queue (level ${level[n.to]}).`, u, { label: 'Queue (front on the left)', items: [...queue] }, tbl([g.nodes.indexOf(n.to)]));
      } else {
        if (b.edgeS[n.edge] === 'idle') b.edgeS[n.edge] = 'rejected';
        b.snap(`${n.to} has already been seen, so skip it.`, u, { label: 'Queue (front on the left)', items: [...queue] }, tbl());
      }
    }
    b.nodeS[u] = 'done';
  }
  const unreached = g.nodes.filter((n) => level[n] === Infinity);
  b.snap(
    unreached.length === 0
      ? 'The queue is empty. Every node has been visited.'
      : `The queue is empty. ${unreached.join(', ')} cannot be reached from ${src}.`,
    null,
    { label: 'Queue (front on the left)', items: [] },
    tbl(),
  );
  res.dist = level;
  res.orderLabel = 'Visit order';
  res.workLabel = 'Edges examined';
  res.summary = [
    { label: 'Visit order', value: b.order.join(' → ') },
    { label: 'Levels', value: g.nodes.map((n) => `${n}:${fmt(level[n] as number)}`).join('  ') },
  ];
}

function dfs(g: Graph, src: string, b: Builder, res: GraphResult): void {
  const seen = new Set<string>();
  const stack: string[] = [];
  const finish: string[] = [];
  const struct = (): Step['structure'] => ({ label: 'Stack (top on the right)', items: [...stack] });
  const visit = (u: string): void => {
    seen.add(u);
    stack.push(u);
    b.nodeS[u] = 'current';
    b.order.push(u);
    b.snap(`Visit ${u} and push it on the stack.`, u, struct());
    for (const n of neighbours(g, u)) {
      b.work++;
      if (!seen.has(n.to)) {
        b.edgeS[n.edge] = 'tree';
        b.nodeS[n.to] = 'frontier';
        b.snap(`${n.to} is new, so go deeper from ${u}.`, u, struct());
        visit(n.to);
        b.nodeS[u] = 'current';
      } else {
        if (b.edgeS[n.edge] === 'idle') b.edgeS[n.edge] = 'rejected';
        b.snap(`${n.to} has already been visited, so skip it.`, u, struct());
      }
    }
    b.nodeS[u] = 'done';
    stack.pop();
    finish.push(u);
    b.snap(`${u} has no new neighbours left. Pop it off the stack and go back.`, stack.length > 0 ? (stack[stack.length - 1] as string) : null, struct());
  };
  visit(src);
  const unreached = g.nodes.filter((n) => !seen.has(n));
  b.snap(unreached.length === 0 ? 'The stack is empty. Every node has been visited.' : `The stack is empty. ${unreached.join(', ')} cannot be reached from ${src}.`, null, struct());
  res.orderLabel = 'Visit order';
  res.workLabel = 'Edges examined';
  res.summary = [
    { label: 'Visit order', value: b.order.join(' → ') },
    { label: 'Finish order', value: finish.join(' → ') },
  ];
}

/* ------------------------------------------------------------------ shortest paths */

function dijkstra(g: Graph, src: string, b: Builder, res: GraphResult): void {
  const dist: Record<string, number> = {};
  const pred: Record<string, number> = {};
  for (const n of g.nodes) dist[n] = Infinity;
  dist[src] = 0;
  const done = new Set<string>();
  const pq = (): Step['structure'] => ({
    label: 'Priority queue (smallest first)',
    items: g.nodes
      .filter((n) => !done.has(n) && (dist[n] as number) < Infinity)
      .sort((x, y) => (dist[x] as number) - (dist[y] as number) || (x < y ? -1 : 1))
      .map((n) => `${n}:${dist[n]}`),
  });
  const tbl = (hl: number[] = []): Table => row(g, 'Distance', g.nodes.map((n) => dist[n] as number), hl);
  b.nodeS[src] = 'frontier';
  b.snap(`Start at ${src}. Its distance is 0 and every other node is unknown (∞).`, src, pq(), tbl([g.nodes.indexOf(src)]));
  for (;;) {
    let u: string | null = null;
    for (const n of g.nodes) {
      if (done.has(n) || (dist[n] as number) === Infinity) continue;
      if (u === null || (dist[n] as number) < (dist[u] as number)) u = n;
    }
    if (u === null) break;
    done.add(u);
    b.nodeS[u] = 'current';
    b.order.push(u);
    b.clearTemp();
    b.snap(`Pick ${u}: it has the smallest distance (${dist[u]}) of the nodes not finished. That distance is now final.`, u, pq(), tbl([g.nodes.indexOf(u)]));
    for (const n of neighbours(g, u)) {
      if (done.has(n.to)) continue;
      b.work++;
      const cand = (dist[u] as number) + n.weight;
      const old = dist[n.to] as number;
      if (cand < old) {
        const prev = pred[n.to];
        if (prev !== undefined) b.edgeS[prev] = 'rejected';
        dist[n.to] = cand;
        pred[n.to] = n.edge;
        b.edgeS[n.edge] = 'relaxed';
        b.nodeS[n.to] = 'frontier';
        b.snap(`Going to ${n.to} through ${u} costs ${dist[u]} + ${n.weight} = ${cand}, better than ${fmt(old)}. Update it.`, u, pq(), tbl([g.nodes.indexOf(n.to)]));
        b.edgeS[n.edge] = 'tree';
      } else {
        b.edgeS[n.edge] = b.edgeS[n.edge] === 'tree' ? 'tree' : 'considered';
        b.snap(`Going to ${n.to} through ${u} costs ${cand}, not better than ${fmt(old)}. Keep the old distance.`, u, pq(), tbl([g.nodes.indexOf(n.to)]));
        if (b.edgeS[n.edge] === 'considered') b.edgeS[n.edge] = 'rejected';
      }
    }
    b.nodeS[u] = 'done';
  }
  b.clearRejected();
  b.snap('No unfinished node can be reached, so every shortest distance is final. The highlighted edges form the shortest-path tree.', null, pq(), tbl());
  res.dist = dist;
  res.orderLabel = 'Finalised order';
  res.workLabel = 'Edges relaxed or checked';
  res.summary = [
    { label: `Distance from ${src}`, value: g.nodes.map((n) => `${n}:${fmt(dist[n] as number)}`).join('  ') },
    { label: 'Finalised order', value: b.order.join(' → ') },
  ];
}

function bellmanFord(g: Graph, src: string, b: Builder, res: GraphResult): void {
  const dist: Record<string, number> = {};
  const pred: Record<string, number> = {};
  for (const n of g.nodes) dist[n] = Infinity;
  dist[src] = 0;
  const arcs: { from: string; to: string; weight: number; edge: number }[] = [];
  g.edges.forEach((e, i) => {
    arcs.push({ from: e.from, to: e.to, weight: e.weight, edge: i });
    if (!e.directed) arcs.push({ from: e.to, to: e.from, weight: e.weight, edge: i });
  });
  const tbl = (hl: number[] = []): Table => row(g, 'Distance', g.nodes.map((n) => dist[n] as number), hl);
  b.nodeS[src] = 'frontier';
  b.snap(`Start at ${src}. Its distance is 0 and every other node is unknown (∞). Each round relaxes every edge once.`, src, null, tbl([g.nodes.indexOf(src)]));
  const rounds = g.nodes.length - 1;
  let stoppedEarly = false;
  for (let round = 1; round <= rounds; round++) {
    let changed = false;
    b.clearTemp();
    b.snap(`Round ${round} of at most ${rounds}: try every edge.`, null, null, tbl());
    for (const a of arcs) {
      const d = dist[a.from] as number;
      if (d === Infinity) continue;
      b.work++;
      const cand = d + a.weight;
      const old = dist[a.to] as number;
      b.clearTemp();
      if (cand < old) {
        const prev = pred[a.to];
        if (prev !== undefined && prev !== a.edge) b.edgeS[prev] = 'idle';
        dist[a.to] = cand;
        pred[a.to] = a.edge;
        changed = true;
        b.nodeS[a.to] = 'frontier';
        b.edgeS[a.edge] = 'relaxed';
        b.snap(`${a.from}→${a.to}: ${d} + ${a.weight} = ${cand} is better than ${fmt(old)}. Update ${a.to}.`, a.from, null, tbl([g.nodes.indexOf(a.to)]));
        b.edgeS[a.edge] = 'tree';
      } else {
        const wasTree = b.edgeS[a.edge] === 'tree';
        b.edgeS[a.edge] = wasTree ? 'tree' : 'considered';
        b.snap(`${a.from}→${a.to}: ${d} + ${a.weight} = ${cand} is not better than ${fmt(old)}. No change.`, a.from, null, tbl([g.nodes.indexOf(a.to)]));
        if (!wasTree) b.edgeS[a.edge] = 'idle';
      }
    }
    if (!changed) {
      b.snap(`Round ${round} changed nothing, so the distances can no longer improve. Stop early.`, null, null, tbl());
      stoppedEarly = true;
      break;
    }
  }
  b.clearTemp();
  let negative = false;
  if (!stoppedEarly) {
    for (const a of arcs) {
      const d = dist[a.from] as number;
      if (d !== Infinity && d + a.weight < (dist[a.to] as number)) {
        negative = true;
        b.edgeS[a.edge] = 'relaxed';
        b.snap(`Extra check: ${a.from}→${a.to} can still be improved after ${rounds} rounds. That only happens with a negative cycle, so shortest distances do not exist.`, a.from, null, tbl([g.nodes.indexOf(a.to)]));
        break;
      }
    }
  }
  if (!negative) b.snap(stoppedEarly ? 'Done. These are the shortest distances.' : `Extra check: no edge can improve after ${rounds} rounds, so there is no negative cycle. These are the shortest distances.`, null, null, tbl());
  res.dist = dist;
  res.negativeCycle = negative;
  res.workLabel = 'Edges relaxed or checked';
  res.summary = negative
    ? [{ label: 'Result', value: 'Negative cycle found: no shortest path exists' }]
    : [{ label: `Distance from ${src}`, value: g.nodes.map((n) => `${n}:${fmt(dist[n] as number)}`).join('  ') }];
}

function floydWarshall(g: Graph, b: Builder, res: GraphResult): void {
  const n = g.nodes.length;
  const d: number[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
  const idx = (s: string): number => g.nodes.indexOf(s);
  for (const e of g.edges) {
    const i = idx(e.from);
    const j = idx(e.to);
    d[i]![j] = Math.min(d[i]![j] as number, e.weight);
    if (!e.directed) d[j]![i] = Math.min(d[j]![i] as number, e.weight);
  }
  const tbl = (hl: [number, number][] = []): Table => ({
    title: 'Shortest distance, row → column',
    head: g.nodes,
    rows: g.nodes.map((label, i) => ({ label, cells: (d[i] as number[]).map(fmt) })),
    hl,
  });
  b.snap('Start with the direct edges only: 0 on the diagonal, the edge weight where an edge exists and ∞ otherwise.', null, null, tbl());
  for (let k = 0; k < n; k++) {
    const improved: [number, number][] = [];
    const notes: string[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const via = (d[i]![k] as number) + (d[k]![j] as number);
        b.work++;
        if (via < (d[i]![j] as number)) {
          notes.push(`${g.nodes[i]}→${g.nodes[j]}: ${fmt(d[i]![j] as number)} → ${via}`);
          d[i]![j] = via;
          improved.push([i, j]);
        }
      }
    }
    b.nodeS[g.nodes[k] as string] = 'current';
    const name = g.nodes[k] as string;
    b.snap(
      improved.length > 0
        ? `Allow ${name} as a stop-over. Improved: ${notes.join(', ')}.`
        : `Allow ${name} as a stop-over. No pair gets shorter.`,
      name,
      null,
      tbl(improved),
    );
    b.nodeS[name] = 'done';
  }
  const neg = g.nodes.some((_, i) => (d[i]![i] as number) < 0);
  b.snap(
    neg
      ? 'A distance from a node to itself is below 0, so there is a negative cycle and the distances are not meaningful.'
      : 'Every node has been tried as a stop-over, so every pair shows its shortest distance.',
    null,
    null,
    tbl(),
  );
  res.matrix = d;
  res.negativeCycle = neg;
  res.workLabel = 'Pair checks';
  res.summary = neg
    ? [{ label: 'Result', value: 'Negative cycle found' }]
    : [{ label: 'Result', value: `${n * n} pair distances computed` }];
}

/* ------------------------------------------------------------------ minimum spanning trees */

function prim(g: Graph, src: string, b: Builder, res: GraphResult): void {
  const inTree = new Set<string>([src]);
  const chosen: number[] = [];
  let total = 0;
  b.nodeS[src] = 'done';
  b.order.push(src);
  const crossing = (): number[] =>
    g.edges
      .map((_e, i) => i)
      .filter((i) => {
        const e = g.edges[i] as Edge;
        return inTree.has(e.from) !== inTree.has(e.to);
      });
  const list = (idx: number[]): Step['structure'] => ({
    label: 'Edges leaving the tree (cheapest first)',
    items: [...idx].sort((x, y) => (g.edges[x] as Edge).weight - (g.edges[y] as Edge).weight || x - y).map((i) => `${edgeLabel(g.edges[i] as Edge)}:${(g.edges[i] as Edge).weight}`),
  });
  const first = crossing();
  for (const i of first) b.edgeS[i] = 'considered';
  b.snap(`Start the tree at ${src}. Every edge that leaves the tree is a candidate.`, src, list(first), null);
  while (inTree.size < g.nodes.length) {
    const cand = crossing();
    if (cand.length === 0) break;
    const best = [...cand].sort((x, y) => (g.edges[x] as Edge).weight - (g.edges[y] as Edge).weight || x - y)[0] as number;
    const e = g.edges[best] as Edge;
    const next = inTree.has(e.from) ? e.to : e.from;
    for (const i of cand) b.edgeS[i] = 'considered';
    b.edgeS[best] = 'tree';
    inTree.add(next);
    chosen.push(best);
    total += e.weight;
    b.nodeS[next] = 'current';
    b.order.push(next);
    b.work++;
    b.snap(`The cheapest edge leaving the tree is ${edgeLabel(e)} (${e.weight}). Add ${next} to the tree. Total weight: ${total}.`, next, list(cand), null);
    b.nodeS[next] = 'done';
    b.clearTemp();
  }
  const missed = g.nodes.filter((n) => !inTree.has(n));
  b.snap(
    missed.length === 0
      ? `The tree reaches all ${g.nodes.length} nodes. Total weight: ${total}.`
      : `No edge leaves the tree, but ${missed.join(', ')} ${missed.length === 1 ? 'is' : 'are'} not in it. The graph is not connected, so only the part containing ${src} was built.`,
    null,
    list([]),
    null,
  );
  res.chosen = chosen;
  res.weight = total;
  res.orderLabel = 'Order nodes joined';
  res.workLabel = 'Edges added';
  res.summary = [
    { label: 'Tree edges', value: chosen.map((i) => edgeLabel(g.edges[i] as Edge)).join('  ') || 'none' },
    { label: 'Total weight', value: String(total) },
  ];
}

function kruskal(g: Graph, b: Builder, res: GraphResult): void {
  const parent: Record<string, string> = {};
  for (const n of g.nodes) parent[n] = n;
  const find = (x: string): string => {
    let r = x;
    while (parent[r] !== r) r = parent[r] as string;
    return r;
  };
  const sorted = g.edges.map((_, i) => i).sort((x, y) => (g.edges[x] as Edge).weight - (g.edges[y] as Edge).weight || x - y);
  const status = new Map<number, string>();
  const list = (): Step['structure'] => ({
    label: 'Edges, cheapest first',
    items: sorted.map((i) => `${edgeLabel(g.edges[i] as Edge)}:${(g.edges[i] as Edge).weight}${status.get(i) ?? ''}`),
  });
  const groups = (hl: number[] = []): Table => ({
    title: 'Group of each node',
    head: g.nodes,
    rows: [{ label: 'Group', cells: g.nodes.map((n) => find(n)) }],
    hl: hl.map((c) => [0, c] as [number, number]),
  });
  const chosen: number[] = [];
  let total = 0;
  b.snap('Sort the edges from cheapest to dearest. At first every node is in its own group.', null, list(), groups());
  for (const i of sorted) {
    const e = g.edges[i] as Edge;
    b.work++;
    b.clearTemp();
    const ra = find(e.from);
    const rb = find(e.to);
    if (ra !== rb) {
      parent[ra] = rb;
      chosen.push(i);
      total += e.weight;
      b.edgeS[i] = 'tree';
      b.nodeS[e.from] = 'done';
      b.nodeS[e.to] = 'done';
      status.set(i, ' ✓');
      b.snap(`${edgeLabel(e)} (${e.weight}) joins two different groups, so keep it. Total weight: ${total}.`, null, list(), groups([g.nodes.indexOf(e.from), g.nodes.indexOf(e.to)]));
    } else {
      b.edgeS[i] = 'rejected';
      status.set(i, ' ✗');
      b.snap(`${edgeLabel(e)} (${e.weight}) would connect two nodes that are already in the same group, which makes a cycle. Skip it.`, null, list(), groups([g.nodes.indexOf(e.from), g.nodes.indexOf(e.to)]));
    }
    if (chosen.length === g.nodes.length - 1) break;
  }
  const groupsLeft = new Set(g.nodes.map((n) => find(n))).size;
  b.snap(
    groupsLeft === 1
      ? `${chosen.length} edges connect all ${g.nodes.length} nodes, so the tree is complete. Total weight: ${total}.`
      : `The edges ran out with ${groupsLeft} separate groups left. The graph is not connected, so this is a spanning forest. Total weight: ${total}.`,
    null,
    list(),
    groups(),
  );
  res.chosen = chosen;
  res.weight = total;
  res.workLabel = 'Edges examined';
  res.summary = [
    { label: 'Tree edges', value: chosen.map((i) => edgeLabel(g.edges[i] as Edge)).join('  ') || 'none' },
    { label: 'Total weight', value: String(total) },
  ];
}

/* ------------------------------------------------------------------ topological sort */

function topological(g: Graph, b: Builder, res: GraphResult): void {
  const indeg: Record<string, number> = {};
  for (const n of g.nodes) indeg[n] = 0;
  for (const e of g.edges) indeg[e.to] = (indeg[e.to] as number) + 1;
  const queue = g.nodes.filter((n) => indeg[n] === 0);
  const tbl = (hl: number[] = []): Table => row(g, 'In-degree', g.nodes.map((n) => indeg[n] as number), hl);
  const struct = (): Step['structure'] => ({ label: 'Ready (no incoming edges left)', items: [...queue] });
  for (const n of queue) b.nodeS[n] = 'frontier';
  b.snap(
    queue.length > 0
      ? `Count the incoming edges of every node. ${queue.join(', ')} ${queue.length === 1 ? 'has' : 'have'} none, so ${queue.length === 1 ? 'it is' : 'they are'} ready to go first.`
      : 'Count the incoming edges of every node. Every node has at least one, so nothing can go first.',
    null,
    struct(),
    tbl(),
  );
  while (queue.length > 0) {
    const u = queue.shift() as string;
    b.nodeS[u] = 'current';
    b.order.push(u);
    const freed: string[] = [];
    for (const n of neighbours(g, u)) {
      b.work++;
      indeg[n.to] = (indeg[n.to] as number) - 1;
      b.edgeS[n.edge] = 'tree';
      if (indeg[n.to] === 0) {
        queue.push(n.to);
        b.nodeS[n.to] = 'frontier';
        freed.push(n.to);
      }
    }
    b.snap(
      `Take ${u} next and remove its outgoing edges.${freed.length > 0 ? ` ${freed.join(', ')} now ${freed.length === 1 ? 'has' : 'have'} no incoming edges left and ${freed.length === 1 ? 'joins' : 'join'} the queue.` : ''}`,
      u,
      struct(),
      tbl(neighbours(g, u).map((n) => g.nodes.indexOf(n.to))),
    );
    b.nodeS[u] = 'done';
  }
  const cyclic = b.order.length < g.nodes.length;
  if (cyclic) {
    const stuck = g.nodes.filter((n) => !b.order.includes(n));
    b.snap(`Nothing is ready, but ${stuck.join(', ')} ${stuck.length === 1 ? 'is' : 'are'} still waiting for each other. There is a cycle, so no topological order exists.`, null, struct(), tbl());
  } else {
    b.snap(`Every node has been placed: ${b.order.join(' → ')}. Every edge points from an earlier node to a later one.`, null, struct(), tbl());
  }
  res.cyclic = cyclic;
  res.orderLabel = 'Topological order';
  res.workLabel = 'Edges removed';
  res.summary = [{ label: 'Result', value: cyclic ? 'Cycle found: no valid order' : b.order.join(' → ') }];
}

/* ------------------------------------------------------------------ entry point */

export function runGraph(algorithm: GraphAlgorithm, g: Graph, source: string): GraphResult {
  const src = g.nodes.includes(source) ? source : (g.nodes[0] as string);
  const b = new Builder(g);
  const res = emptyResult();
  if (algorithm === 'bfs') bfs(g, src, b, res);
  else if (algorithm === 'dfs') dfs(g, src, b, res);
  else if (algorithm === 'dijkstra') dijkstra(g, src, b, res);
  else if (algorithm === 'bellman-ford') bellmanFord(g, src, b, res);
  else if (algorithm === 'floyd-warshall') floydWarshall(g, b, res);
  else if (algorithm === 'prim') prim(g, src, b, res);
  else if (algorithm === 'kruskal') kruskal(g, b, res);
  else topological(g, b, res);
  res.steps = b.steps;
  res.order = [...b.order];
  return res;
}

export const GRAPH_FACTS: Record<GraphAlgorithm, { time: string; space: string; needs: string }> = {
  bfs: { time: 'O(V + E)', space: 'O(V)', needs: 'Any graph' },
  dfs: { time: 'O(V + E)', space: 'O(V)', needs: 'Any graph' },
  dijkstra: { time: 'O(V² ) as written, O((V + E) log V) with a heap', space: 'O(V)', needs: 'Weights of 0 or more' },
  'bellman-ford': { time: 'O(V·E)', space: 'O(V)', needs: 'Any weights; detects negative cycles' },
  'floyd-warshall': { time: 'O(V³)', space: 'O(V²)', needs: 'Any weights; detects negative cycles' },
  prim: { time: 'O(V·E) as written, O(E log V) with a heap', space: 'O(V)', needs: 'Undirected, weighted' },
  kruskal: { time: 'O(E log E)', space: 'O(V)', needs: 'Undirected, weighted' },
  topological: { time: 'O(V + E)', space: 'O(V)', needs: 'Directed graph' },
};
