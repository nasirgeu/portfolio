/**
 * CPU scheduling simulator: FCFS, SJF, SRTF, Round Robin, Priority (non-preemptive),
 * Priority (preemptive) and Highest Response Ratio Next (HRRN).
 * Pure logic with no UI, and every decision comes with a plain-English explanation.
 *
 * Tie-breaking: equal keys are settled by earlier arrival, then by input order.
 * A running process is never preempted by one that merely ties with it.
 * Priority: a LOWER number means a HIGHER priority.
 * Round Robin: processes that arrive while another is running join the queue
 * BEFORE the process that just used up its time quantum.
 * HRRN: response ratio = (waiting time + burst time) / burst time. The highest wins.
 */

export type SchedAlgorithm = 'FCFS' | 'SJF' | 'SRTF' | 'RR' | 'NPP' | 'PP' | 'HRRN';

export interface ProcessInput {
  id: string;
  arrival: number;
  burst: number;
  priority: number;
}

export interface Segment {
  /** Process id, or null when the CPU is idle. */
  pid: string | null;
  start: number;
  end: number;
  /** Processes waiting (arrived, not finished, not on the CPU) when this part starts, in the order the scheduler would take them. */
  queue: string[];
  /** Plain-English explanation of this part of the schedule. */
  note: string;
}

export interface ProcessResult extends ProcessInput {
  completion: number;
  turnaround: number;
  waiting: number;
}

export interface SchedResult {
  segments: Segment[];
  processes: ProcessResult[];
  avgTurnaround: number;
  avgWaiting: number;
  totalTime: number;
}

export const ALGORITHM_LABEL: Record<SchedAlgorithm, string> = {
  FCFS: 'First Come, First Served',
  SJF: 'Shortest Job First',
  SRTF: 'Shortest Remaining Time First',
  RR: 'Round Robin',
  NPP: 'Priority (non-preemptive)',
  PP: 'Priority (preemptive)',
  HRRN: 'Highest Response Ratio Next',
};

export const needsPriority = (a: SchedAlgorithm): boolean => a === 'NPP' || a === 'PP';
export const needsQuantum = (a: SchedAlgorithm): boolean => a === 'RR';
export const isPreemptive = (a: SchedAlgorithm): boolean => a === 'SRTF' || a === 'PP' || a === 'RR';

const EPS = 1e-9;
const units = (n: number): string => `${n} time unit${n === 1 ? '' : 's'}`;

function summarize(
  procs: readonly ProcessInput[],
  segments: Segment[],
  completion: readonly number[],
  totalTime: number,
): SchedResult {
  const processes: ProcessResult[] = procs.map((x, i) => {
    const c = completion[i] as number;
    const turnaround = c - x.arrival;
    return { ...x, completion: c, turnaround, waiting: turnaround - x.burst };
  });
  const avg = (f: (r: ProcessResult) => number): number => processes.reduce((s, r) => s + f(r), 0) / procs.length;
  return { segments, processes, avgTurnaround: avg((r) => r.turnaround), avgWaiting: avg((r) => r.waiting), totalTime };
}

/** Round Robin: a fair rotation where each process gets at most `quantum` time units per turn. */
function roundRobin(procs: readonly ProcessInput[], quantum: number): SchedResult {
  const n = procs.length;
  const p = (i: number): ProcessInput => procs[i] as ProcessInput;
  const rem = procs.map((x) => x.burst);
  const completion: number[] = Array.from({ length: n }, () => 0);
  const queued: boolean[] = Array.from({ length: n }, () => false);
  const order = procs.map((_, i) => i).sort((a, b) => p(a).arrival - p(b).arrival || a - b);
  const queue: number[] = [];
  const segments: Segment[] = [];
  const opening = new Map<Segment, string>();
  let t = 0;
  let finished = 0;

  const admit = (upTo: number): void => {
    for (const i of order) {
      if (!queued[i] && p(i).arrival <= upTo) {
        queued[i] = true;
        queue.push(i);
      }
    }
  };

  while (finished < n) {
    admit(t);
    if (queue.length === 0) {
      const next = Math.min(...order.filter((i) => !queued[i]).map((i) => p(i).arrival));
      segments.push({
        pid: null,
        start: t,
        end: next,
        queue: [],
        note:
          finished === 0
            ? `From time ${t} to ${next}, no process has arrived yet, so the CPU is idle.`
            : `From time ${t} to ${next}, every process that has arrived is finished, so the CPU is idle until the next one arrives.`,
      });
      t = next;
      continue;
    }

    const i = queue.shift() as number;
    const waitingAtStart = queue.map((j) => p(j).id);
    const name = p(i).id;
    const remBefore = rem[i] as number;
    const run = Math.min(quantum, remBefore);
    const start = t;
    t += run;
    rem[i] = remBefore - run;
    admit(t); // arrivals during this turn join the queue before the current process
    const others = queue.length > 0;

    const last = segments[segments.length - 1];
    const continuing = last !== undefined && last.pid === name && last.end === start;
    const finishedNow = rem[i] === 0;
    if (finishedNow) {
      completion[i] = t;
      finished++;
    } else {
      queue.push(i);
    }

    if (continuing && last) {
      // The same process kept the CPU because nobody else was waiting: one merged part, one clear sentence.
      last.end = t;
      const base = opening.get(last) ?? '';
      let tail: string;
      if (finishedNow) tail = `Nobody else is waiting, so it keeps the CPU and finishes at time ${t}.`;
      else if (others)
        tail = `It kept the CPU while nobody else was waiting. At time ${t} another process is waiting and it still has ${rem[i]} left, so it goes to the back of the queue.`;
      else tail = 'Nobody else is waiting, so it keeps the CPU.';
      last.note = `${base} ${tail}`;
    } else {
      const front =
        remBefore < p(i).burst
          ? `${name} is back at the front of the queue and continues with ${remBefore} left, for up to ${units(quantum)}.`
          : `${name} is at the front of the queue, so it gets the CPU for up to ${units(quantum)}.`;
      let sentence: string;
      if (finishedNow)
        sentence = run < quantum ? `It only needs ${run}, so it finishes early at time ${t}.` : `It finishes at time ${t}.`;
      else if (others)
        sentence = `Its ${units(quantum)} ${quantum === 1 ? 'is' : 'are'} used up with ${rem[i]} left, so it goes to the back of the queue.`;
      else sentence = 'Nobody else is waiting, so it keeps the CPU.';
      const base = `At time ${start}: ${front}`;
      const seg: Segment = { pid: name, start, end: t, queue: waitingAtStart, note: `${base} ${sentence}` };
      opening.set(seg, base);
      segments.push(seg);
    }
  }

  return summarize(procs, segments, completion, t);
}

export function simulateSchedule(
  algorithm: SchedAlgorithm,
  procs: readonly ProcessInput[],
  quantum = 2,
): SchedResult {
  if (algorithm === 'RR') return roundRobin(procs, Math.max(1, Math.floor(quantum)));

  const n = procs.length;
  const p = (i: number): ProcessInput => procs[i] as ProcessInput;
  const rem = procs.map((x) => x.burst);
  const done: boolean[] = Array.from({ length: n }, () => false);
  const completion: number[] = Array.from({ length: n }, () => 0);
  const segments: Segment[] = [];
  const preemptive = isPreemptive(algorithm);
  let t = 0;

  const ratio = (i: number): number => (t - p(i).arrival + p(i).burst) / p(i).burst;
  const primary = (i: number): number => {
    switch (algorithm) {
      case 'FCFS':
        return p(i).arrival;
      case 'SJF':
        return p(i).burst;
      case 'SRTF':
        return rem[i] as number;
      case 'HRRN':
        return -ratio(i); // highest ratio first
      default:
        return p(i).priority;
    }
  };
  const compare = (a: number, b: number): number => {
    const d = primary(a) - primary(b);
    return Math.abs(d) > EPS ? d : p(a).arrival - p(b).arrival || a - b;
  };

  let finished = 0;
  let current = -1;

  while (finished < n) {
    const ready: number[] = [];
    for (let i = 0; i < n; i++) if (!done[i] && p(i).arrival <= t) ready.push(i);

    if (ready.length === 0) {
      const next = Math.min(...procs.filter((_, i) => !done[i]).map((x) => x.arrival));
      segments.push({
        pid: null,
        start: t,
        end: next,
        queue: [],
        note:
          finished === 0
            ? `From time ${t} to ${next}, no process has arrived yet, so the CPU is idle.`
            : `From time ${t} to ${next}, every process that has arrived is finished, so the CPU is idle until the next one arrives.`,
      });
      t = next;
      current = -1;
      continue;
    }

    let pick = [...ready].sort(compare)[0] as number;
    if (preemptive && current >= 0 && !done[current] && ready.includes(current) && Math.abs(primary(current) - primary(pick)) <= EPS) {
      pick = current; // never switch for a tie
    }

    const nextArrivals = procs.filter((x, i) => !done[i] && x.arrival > t).map((x) => x.arrival);
    const nextArrival = nextArrivals.length > 0 ? Math.min(...nextArrivals) : Number.POSITIVE_INFINITY;
    const remBefore = rem[pick] as number;
    const dur = preemptive ? Math.min(remBefore, nextArrival - t) : remBefore;

    const last = segments[segments.length - 1];
    const continuing = last !== undefined && last.pid === p(pick).id && last.end === t;
    const name = p(pick).id;
    const prev = current;

    if (!continuing) {
      let why: string;
      const alone = ready.length === 1;
      if (preemptive && prev >= 0 && !done[prev] && prev !== pick) {
        const prevName = p(prev).id;
        why =
          algorithm === 'SRTF'
            ? `A new process changes things. ${name} has less time left (${remBefore}) than ${prevName} (${rem[prev]}), so ${name} takes over and ${prevName} is paused.`
            : `A new process changes things. ${name} has a higher priority (${p(pick).priority}) than ${prevName} (${p(prev).priority}), so ${name} takes over and ${prevName} is paused.`;
      } else if (alone) {
        why = `${name} is the only process waiting, so it runs.`;
      } else if (algorithm === 'FCFS') {
        why = `${name} arrived first (at time ${p(pick).arrival}) among the waiting processes, so it goes next.`;
      } else if (algorithm === 'SJF') {
        why = `${name} has the shortest burst time (${p(pick).burst}) among the waiting processes, so it goes next and runs until it finishes.`;
      } else if (algorithm === 'NPP') {
        why = `${name} has the highest priority (priority ${p(pick).priority}; a lower number means higher priority) among the waiting processes, so it runs until it finishes.`;
      } else if (algorithm === 'SRTF') {
        why = `${name} has the least time left (${remBefore}) among the waiting processes, so it runs.`;
      } else if (algorithm === 'HRRN') {
        why = `${name} has the highest response ratio (${ratio(pick).toFixed(2)}) among the waiting processes. It has waited ${t - p(pick).arrival} and needs ${p(pick).burst}, so it goes next and runs until it finishes.`;
      } else {
        why = `${name} has the highest priority (priority ${p(pick).priority}) among the waiting processes, so it runs.`;
      }
      if (remBefore < p(pick).burst && !(preemptive && prev >= 0 && !done[prev] && prev !== pick)) {
        why += ` It had been paused earlier and continues with ${remBefore} left.`;
      }
      const waiting = ready.filter((j) => j !== pick).sort(compare).map((j) => p(j).id);
      segments.push({ pid: name, start: t, end: t + dur, queue: waiting, note: `At time ${t}: ${why}` });
    } else if (last) {
      last.end = t + dur;
    }

    rem[pick] = remBefore - dur;
    t += dur;
    if (rem[pick] === 0) {
      done[pick] = true;
      completion[pick] = t;
      finished++;
      const seg = segments[segments.length - 1];
      if (seg) seg.note += ` ${name} finishes at time ${t}.`;
    }
    current = pick;
  }

  return summarize(procs, segments, completion, t);
}

const letter = (i: number): string => (i < 26 ? String.fromCharCode(65 + i) : `P${i + 1}`);

function parseList(text: string): { values: number[]; bad: string | null } {
  const parts = text.split(/[\s,]+/).filter((s) => s.length > 0);
  const values: number[] = [];
  for (const s of parts) {
    if (!/^\d{1,3}$/.test(s)) return { values: [], bad: s };
    values.push(Number(s));
  }
  return { values, bad: null };
}

/** Time quantum for Round Robin: a whole number from 1 to 20. */
export function parseQuantum(text: string): { quantum: number; error: string | null } {
  const t = text.trim();
  if (!/^\d{1,2}$/.test(t) || Number(t) < 1 || Number(t) > 20) {
    return { quantum: 2, error: 'The time quantum must be a whole number from 1 to 20.' };
  }
  return { quantum: Number(t), error: null };
}

/** Turn the three text boxes into processes, or return a friendly error. */
export function parseProcesses(
  arrivalText: string,
  burstText: string,
  priorityText: string,
  priorityNeeded: boolean,
): { procs: ProcessInput[]; error: string | null } {
  const fail = (error: string) => ({ procs: [] as ProcessInput[], error });
  const a = parseList(arrivalText);
  const b = parseList(burstText);
  const pr = parseList(priorityNeeded ? priorityText : '');
  if (a.bad !== null) return fail(`Arrival times: "${a.bad}" is not valid. Use whole numbers from 0 to 999.`);
  if (b.bad !== null) return fail(`Burst times: "${b.bad}" is not valid. Use whole numbers from 1 to 999.`);
  if (pr.bad !== null) return fail(`Priorities: "${pr.bad}" is not valid. Use whole numbers from 0 to 999.`);
  if (a.values.length === 0) return fail('Arrival times cannot be blank.');
  if (b.values.length === 0) return fail('Burst times cannot be blank.');
  if (a.values.length !== b.values.length)
    return fail('Please enter the same number of arrival times and burst times.');
  if (b.values.some((v) => v === 0)) return fail('A burst time of 0 is not valid. Each process needs at least 1 unit of CPU time.');
  if (a.values.length > 12) return fail('Please use 12 processes or fewer.');
  if (priorityNeeded) {
    if (pr.values.length === 0) return fail('Priorities cannot be blank for a priority algorithm.');
    if (pr.values.length !== a.values.length) return fail('Please enter one priority for each process.');
  }
  return {
    procs: a.values.map((arrival, i) => ({
      id: letter(i),
      arrival,
      burst: b.values[i] as number,
      priority: priorityNeeded ? (pr.values[i] as number) : 0,
    })),
    error: null,
  };
}
