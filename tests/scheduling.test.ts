import { check, finish } from './check.ts';
import {
  parseProcesses,
  parseQuantum,
  simulateSchedule as sim,
  type ProcessInput,
  type SchedAlgorithm,
} from '../src/lib/scheduling.ts';

console.log('CPU scheduling');
type Result = ReturnType<typeof sim>;
const mk = (rows: number[][]): ProcessInput[] =>
  rows.map((r, i) => ({ id: String.fromCharCode(65 + i), arrival: r[0] as number, burst: r[1] as number, priority: r[2] ?? 0 }));
const gantt = (x: Result): string => x.segments.map((s) => (s.pid ?? 'idle') + s.end).join(',');
const ALL: SchedAlgorithm[] = ['FCFS', 'SJF', 'SRTF', 'RR', 'NPP', 'PP', 'HRRN'];

// Textbook set: A(0,8) B(1,4) C(2,9) D(3,5)
const set1 = mk([[0, 8], [1, 4], [2, 9], [3, 5]]);
check('FCFS: avg waiting 8.75, avg turnaround 15.25', sim('FCFS', set1).avgWaiting === 8.75 && sim('FCFS', set1).avgTurnaround === 15.25);
check('SJF: avg waiting 7.75, avg turnaround 14.25', sim('SJF', set1).avgWaiting === 7.75 && sim('SJF', set1).avgTurnaround === 14.25);
check('SRTF: avg waiting 6.5, avg turnaround 13', sim('SRTF', set1).avgWaiting === 6.5 && sim('SRTF', set1).avgTurnaround === 13);
check('SRTF chart is A,B,D,A,C', gantt(sim('SRTF', set1)) === 'A1,B5,D10,A17,C26', gantt(sim('SRTF', set1)));

// Priority (lower number = higher priority)
const pri = mk([[0, 10, 3], [0, 1, 1], [0, 2, 4], [0, 1, 5], [0, 5, 2]]);
const npp = sim('NPP', pri);
check('Priority non-preemptive: order B,E,A,C,D and avg waiting 8.2', npp.segments.map((s) => s.pid).join('') === 'BEACD' && Math.abs(npp.avgWaiting - 8.2) < 1e-9);
check('Priority preemptive: A is paused by B, then resumes', gantt(sim('PP', mk([[0, 4, 2], [1, 3, 1], [2, 1, 3]]))) === 'A1,B4,A7,C8');

// Round Robin, worked by hand: quantum 2
const rrSet = mk([[0, 5], [1, 3], [2, 1], [3, 2]]);
const rr = sim('RR', rrSet, 2);
check('Round Robin q=2 chart', gantt(rr) === 'A2,B4,C5,A7,D9,B10,A11', gantt(rr));
check('Round Robin q=2: avg waiting 4.5, avg turnaround 7.25', rr.avgWaiting === 4.5 && rr.avgTurnaround === 7.25);
check('Round Robin q=1 on three processes', gantt(sim('RR', mk([[0, 3], [0, 4], [0, 3]]), 1)) === 'A1,B2,C3,A4,B5,C6,A7,B8,C9,B10');
check('Round Robin: a lone process stays one block', sim('RR', mk([[0, 5]]), 2).segments.length === 1);

// HRRN, worked by hand
const hrrn = sim('HRRN', mk([[0, 3], [2, 6], [4, 4], [6, 5], [8, 2]]));
check('HRRN: order A,B,C,E,D', hrrn.segments.map((s) => s.pid).join('') === 'ABCED');
check('HRRN: avg waiting 4.0, avg turnaround 8.0', Math.abs(hrrn.avgWaiting - 4) < 1e-9 && Math.abs(hrrn.avgTurnaround - 8) < 1e-9);

// Idle time and ties
check('idle gaps are drawn', gantt(sim('FCFS', mk([[3, 2], [10, 2]]))) === 'idle3,A5,idle10,B12');
check('SRTF does not switch for a tie', gantt(sim('SRTF', mk([[0, 4], [1, 3]]))) === 'A4,B7');

// Wording of the plain-English notes
const lone = sim('RR', mk([[0, 9]]), 1).segments[0]?.note ?? '';
check('Round Robin note for a lone process is one clear sentence', (lone.match(/Nobody else is waiting/g) ?? []).length === 1 && lone.includes('finishes at time 9'));
const grammar = sim('RR', mk([[0, 3], [0, 3]]), 1).segments.map((s) => s.note).join(' ');
check('grammar: "1 time unit is used up"', grammar.includes('1 time unit is used up') && !grammar.includes('1 time units'));

// Properties that must hold for every algorithm on any input
let sound = true;
let srtfBest = true;
let rrAsFcfs = true;
for (let t = 0; t < 500 && sound && srtfBest && rrAsFcfs; t++) {
  const n = 1 + Math.floor(Math.random() * 8);
  const p = mk(Array.from({ length: n }, () => [Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 5)]));
  const q = 1 + Math.floor(Math.random() * 5);
  const results: Record<string, Result> = {};
  for (const a of ALL) {
    const o = sim(a, p, q);
    results[a] = o;
    const busy = o.segments.filter((s) => s.pid).reduce((s, g) => s + g.end - g.start, 0);
    const contiguous = o.segments.every((s, i) => s.end > s.start && (i === 0 || s.start === (o.segments[i - 1]?.end ?? -1)));
    const noRepeat = o.segments.every((s, i) => i === 0 || s.pid === null || s.pid !== o.segments[i - 1]?.pid);
    const times = o.processes.every((r) => r.completion >= r.arrival + r.burst && r.waiting >= 0 && r.turnaround === r.completion - r.arrival);
    const noEarlyStart = o.segments.every((s) => s.pid === null || s.start >= (p.find((r) => r.id === s.pid)?.arrival ?? 0));
    const runsOnce = ['FCFS', 'SJF', 'NPP', 'HRRN'].includes(a) ? p.every((r) => o.segments.filter((s) => s.pid === r.id).length === 1) : true;
    if (busy !== p.reduce((s, r) => s + r.burst, 0) || !contiguous || !noRepeat || !times || !noEarlyStart || !runsOnce) sound = false;
  }
  const best = (results['SRTF'] as Result).avgWaiting;
  if (ALL.some((a) => (results[a] as Result).avgWaiting < best - 1e-9)) srtfBest = false;
  if (Math.abs(sim('RR', p, 20).avgWaiting - (results['FCFS'] as Result).avgWaiting) > 1e-9) rrAsFcfs = false;
}
check('500 random runs x 7 algorithms: all CPU time used, no gaps, no early starts, sensible times', sound);
check('500 random runs: SRTF never has a worse average waiting time', srtfBest);
check('500 random runs: Round Robin with a huge quantum equals FCFS', rrAsFcfs);

// Input checking
check('accepts valid input', parseProcesses('0 1', '2 3', '', false).error === null);
check('rejects different list lengths', parseProcesses('0 1', '3', '', false).error !== null);
check('rejects a burst of 0', parseProcesses('0', '0', '', false).error !== null);
check('rejects a bad token', (parseProcesses('0 x', '1 2', '', false).error ?? '').includes('"x"'));
check('priority algorithms need priorities', parseProcesses('0 1', '1 2', '', true).error !== null);
check('rejects more than 12 processes', parseProcesses(Array(13).fill('0').join(' '), Array(13).fill('1').join(' '), '', false).error !== null);
check('quantum must be 1 to 20', parseQuantum('3').error === null && parseQuantum('0').error !== null && parseQuantum('21').error !== null && parseQuantum('x').error !== null);

// The waiting queue shown by the visualization (ready queue at the start of each part)
const queueOf = (x: Result): string => x.segments.map((s) => `${s.pid ?? 'idle'}[${s.queue.join('')}]`).join(' ');
check('SRTF ready queue at each part', queueOf(sim('SRTF', set1)) === 'A[] B[A] D[AC] A[C] C[]', queueOf(sim('SRTF', set1)));
check('Round Robin ready queue at each part', queueOf(rr) === 'A[] B[CA] C[ADB] A[DB] D[BA] B[A] A[]', queueOf(rr));
check('FCFS ready queue is in arrival order', queueOf(sim('FCFS', set1)) === 'A[] B[CD] C[D] D[]', queueOf(sim('FCFS', set1)));
check('an idle part has an empty queue', sim('FCFS', mk([[3, 2]])).segments[0]?.queue.length === 0);
let queueSound = true;
for (let t = 0; t < 200 && queueSound; t++) {
  const n = 1 + Math.floor(Math.random() * 7);
  const p = mk(Array.from({ length: n }, () => [Math.floor(Math.random() * 10), 1 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 4)]));
  for (const a of ALL) {
    for (const s of sim(a, p, 2).segments) {
      const ids = s.queue;
      const arrived = ids.every((id) => (p.find((r) => r.id === id)?.arrival ?? 99) <= s.start);
      if (new Set(ids).size !== ids.length || ids.includes(s.pid ?? '') || !arrived) queueSound = false;
    }
  }
}
check('200 random runs x 7 algorithms: queue has no duplicates, never the running process, only arrived processes', queueSound);

finish('CPU scheduling');
