import { check, finish } from './check.ts';
import { GRAPH_ALGORITHMS, MAX_EDGES, neighbours, parseGraph, requirement, runGraph, type Graph } from '../src/lib/graph.ts';

const g = (text: string): Graph => {
  const r = parseGraph(text);
  if (!r.graph) throw new Error(r.error ?? 'bad graph');
  return r.graph;
};

console.log('Parsing');
check('parses undirected and directed edges with weights', (() => {
  const x = g('A-B:4 b>c:-2 C-D');
  return x.nodes.join('') === 'ABCD' && x.edges[0]?.weight === 4 && x.edges[1]?.directed === true && x.edges[1]?.weight === -2 && x.edges[2]?.weight === 1;
})());
check('a lone letter adds an isolated node', g('A-B H').nodes.join('') === 'ABH');
check('rejects nonsense', parseGraph('A-B:x').error !== null && parseGraph('AB').error !== null && parseGraph('A-Z').error !== null);
check('rejects a self-loop', parseGraph('A-A').error !== null);
check('rejects a duplicate edge (either direction when undirected)', parseGraph('A-B B-A').error !== null);
check('allows A>B together with B>A', parseGraph('A>B B>A').error === null);
check('rejects an empty box and a letters-only graph', parseGraph('').error !== null && parseGraph('A B').error !== null);
check('rejects weights out of range', parseGraph('A-B:100').error !== null && parseGraph('A-B:-21').error !== null);
check(`rejects more than ${MAX_EDGES} edges`, parseGraph('A-B A-C A-D A-E A-F A-G A-H B-C B-D B-E B-F B-G B-H C-D C-E').error !== null);
check('neighbours are sorted by letter', neighbours(g('A-C A-B A-D'), 'A').map((n) => n.to).join('') === 'BCD');

console.log('Requirements');
check('Prim and Kruskal reject directed edges', requirement('prim', g('A>B')) !== null && requirement('kruskal', g('A>B')) !== null);
check('Topological sort rejects undirected edges', requirement('topological', g('A-B')) !== null);
check('Dijkstra rejects a negative weight', requirement('dijkstra', g('A>B:-1')) !== null);
check('Bellman-Ford accepts a negative weight', requirement('bellman-ford', g('A>B:-1')) === null);

console.log('Hand-worked results');
const net = g('A-B:4 A-C:2 B-C:1 B-D:5 C-D:8 C-E:10 D-E:2 D-F:6 E-F:3');
const bfs = runGraph('bfs', g('A-B A-C B-D C-D D-E'), 'A');
check('BFS order A B C D E', bfs.order.join('') === 'ABCDE', bfs.order.join(''));
check('BFS levels A0 B1 C1 D2 E3', JSON.stringify(bfs.dist) === JSON.stringify({ A: 0, B: 1, C: 1, D: 2, E: 3 }));
const dfs = runGraph('dfs', g('A-B A-C B-D C-D D-E'), 'A');
check('DFS order A B D C E', dfs.order.join('') === 'ABDCE', dfs.order.join(''));
const dj = runGraph('dijkstra', net, 'A');
check('Dijkstra distances A0 B3 C2 D8 E10 F13', JSON.stringify(dj.dist) === JSON.stringify({ A: 0, B: 3, C: 2, D: 8, E: 10, F: 13 }), JSON.stringify(dj.dist));
check('Dijkstra finalises in order A C B D E F', dj.order.join('') === 'ACBDEF', dj.order.join(''));
const neg = g('A>B:4 A>C:5 B>C:-3 C>D:2');
const bf = runGraph('bellman-ford', neg, 'A');
check('Bellman-Ford handles a negative edge: A0 B4 C1 D3', JSON.stringify(bf.dist) === JSON.stringify({ A: 0, B: 4, C: 1, D: 3 }) && !bf.negativeCycle, JSON.stringify(bf.dist));
check('Bellman-Ford detects a negative cycle', runGraph('bellman-ford', g('A>B:1 B>C:-3 C>A:1'), 'A').negativeCycle);
const fw = runGraph('floyd-warshall', neg, 'A');
check('Floyd-Warshall: A→C is 1, A→D is 3, B→D is -1, D→A is unreachable', (() => {
  const m = fw.matrix;
  return m !== null && m[0]![2] === 1 && m[0]![3] === 3 && m[1]![3] === -1 && m[3]![0] === Infinity;
})());
check('Floyd-Warshall detects a negative cycle', runGraph('floyd-warshall', g('A>B:1 B>C:-3 C>A:1'), 'A').negativeCycle);
const pr = runGraph('prim', net, 'A');
const kr = runGraph('kruskal', net, 'A');
check('Prim spanning tree weight is 13 with 5 edges', pr.weight === 13 && pr.chosen.length === 5, `${pr.weight}/${pr.chosen.length}`);
check('Kruskal spanning tree weight is 13 with 5 edges', kr.weight === 13 && kr.chosen.length === 5, `${kr.weight}/${kr.chosen.length}`);
check('Kruskal skips the cycle edge A–B', kr.chosen.every((i) => net.edges[i]?.from + (net.edges[i]?.to ?? '') !== 'AB'));
const tp = runGraph('topological', g('A>B A>C B>D C>D D>E'), 'A');
check('Topological order A B C D E', tp.order.join('') === 'ABCDE' && !tp.cyclic, tp.order.join(''));
check('Topological sort reports a cycle', runGraph('topological', g('A>B B>C C>A'), 'A').cyclic);
check('A disconnected graph: BFS from A cannot reach D, E', runGraph('bfs', g('A-B D-E'), 'A').dist?.['D'] === Infinity);
check('A disconnected graph: Kruskal gives a forest (weight 3)', runGraph('kruskal', g('A-B:1 D-E:2'), 'A').weight === 3);
check('Prim on a disconnected graph only covers the start component', runGraph('prim', g('A-B:1 D-E:2'), 'A').weight === 1);

console.log('Every step is well formed');
let wellFormed = true;
for (const a of GRAPH_ALGORITHMS) {
  const graph = a === 'topological' ? g('A>B A>C B>D C>D D>E') : a === 'prim' || a === 'kruskal' || a === 'dijkstra' ? net : neg;
  const r = runGraph(a, graph, 'A');
  const ok =
    r.steps.length > 1 &&
    r.steps.every((s) => s.edges.length === graph.edges.length && graph.nodes.every((n) => s.nodes[n] !== undefined) && s.note.length > 0);
  if (!ok) {
    wellFormed = false;
    console.log(`    problem in ${a}`);
  }
}
check('every algorithm gives steps with a state for every node and edge, and a note', wellFormed);

console.log('Random graphs obey the rules');
let seed = 4242;
const rnd = (n: number): number => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed % n;
};
const L = 'ABCDEFGH';
let spAgree = true;
let mstAgree = true;
let bfsMatchesUnit = true;
let dfsSameSet = true;
let topoOk = true;
let mstEdges = true;
const bad: string[] = [];
for (let t = 0; t < 200; t++) {
  const n = 3 + rnd(6);
  // directed, non-negative weights: shortest paths must agree across three algorithms
  const dTok: string[] = [];
  const used = new Set<string>();
  for (let k = 0; k < 10; k++) {
    const a = rnd(n);
    const b = rnd(n);
    if (a === b || used.has(`${a}>${b}`)) continue;
    used.add(`${a}>${b}`);
    dTok.push(`${L[a]}>${L[b]}:${rnd(10)}`);
  }
  if (dTok.length > 0) {
    const dg = g(dTok.join(' '));
    const src = dg.nodes[0] as string;
    const x = runGraph('dijkstra', dg, src).dist as Record<string, number>;
    const y = runGraph('bellman-ford', dg, src).dist as Record<string, number>;
    const f = runGraph('floyd-warshall', dg, src).matrix as number[][];
    const si = dg.nodes.indexOf(src);
    for (const [i, node] of dg.nodes.entries()) {
      if (x[node] !== y[node] || x[node] !== (f[si] as number[])[i]) {
        spAgree = false;
        bad.push(`${dTok.join(' ')} @${node}: ${x[node]} ${y[node]} ${(f[si] as number[])[i]}`);
      }
    }
  }
  // undirected connected graph (a spanning chain plus extras): Prim and Kruskal agree
  const uTok: string[] = [];
  const seen = new Set<string>();
  for (let i = 1; i < n; i++) {
    const j = rnd(i);
    seen.add(`${j}-${i}`);
    uTok.push(`${L[j]}-${L[i]}:${1 + rnd(20)}`);
  }
  for (let k = 0; k < 4; k++) {
    const a = rnd(n);
    const b = rnd(n);
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    if (lo === hi || seen.has(`${lo}-${hi}`)) continue;
    seen.add(`${lo}-${hi}`);
    uTok.push(`${L[lo]}-${L[hi]}:${1 + rnd(20)}`);
  }
  const ug = g(uTok.join(' '));
  const p = runGraph('prim', ug, ug.nodes[0] as string);
  const k = runGraph('kruskal', ug, 'A');
  if (p.weight !== k.weight) mstAgree = false;
  if (k.chosen.length !== ug.nodes.length - 1 || p.chosen.length !== ug.nodes.length - 1) mstEdges = false;
  // BFS levels equal Dijkstra on unit weights; DFS reaches the same nodes as BFS
  const unit = g(uTok.map((s) => s.replace(/:\d+/, '')).join(' '));
  const lv = runGraph('bfs', unit, 'A').dist as Record<string, number>;
  const dd = runGraph('dijkstra', unit, 'A').dist as Record<string, number>;
  if (unit.nodes.some((node) => lv[node] !== dd[node])) bfsMatchesUnit = false;
  const vis = [...runGraph('dfs', unit, 'A').order].sort().join('');
  const vis2 = [...runGraph('bfs', unit, 'A').order].sort().join('');
  if (vis !== vis2) dfsSameSet = false;
  // a DAG (edges only go from an earlier letter to a later one): topological order respects every edge
  const tTok: string[] = [];
  const tu = new Set<string>();
  for (let q = 0; q < 10; q++) {
    const a = rnd(n);
    const b = rnd(n);
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    if (lo === hi || tu.has(`${lo}>${hi}`)) continue;
    tu.add(`${lo}>${hi}`);
    tTok.push(`${L[lo]}>${L[hi]}`);
  }
  if (tTok.length > 0) {
    const tg = g(tTok.join(' '));
    const tr = runGraph('topological', tg, 'A');
    const pos = new Map(tr.order.map((node, i) => [node, i] as const));
    if (tr.cyclic || tr.order.length !== tg.nodes.length || tg.edges.some((e) => (pos.get(e.from) as number) > (pos.get(e.to) as number))) topoOk = false;
  }
}
check('Dijkstra, Bellman-Ford and Floyd-Warshall agree on non-negative graphs', spAgree, bad.slice(0, 2).join(' | '));
check('Prim and Kruskal find the same total weight', mstAgree);
check('both spanning trees use exactly nodes − 1 edges', mstEdges);
check('BFS levels equal Dijkstra distances on unit weights', bfsMatchesUnit);
check('DFS and BFS reach the same set of nodes', dfsSameSet);
check('a topological order puts every edge forward', topoOk);

finish('graph');
