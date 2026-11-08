import { useEffect, useMemo, useState } from 'react';
import StepLog from './StepLog';
import DesignDiagram from './DesignDiagram';
import ExecutionControls, { stepDelay } from './lab/ExecutionControls';
import WorkspaceLayout from './lab/WorkspaceLayout';
import SchedulingViz from './lab/viz/SchedulingViz';
import { Stat, StatGrid } from './lab/Stat';
import { toneStyle } from './lab/colors';
import { schedulingDiagram } from '../data/designDiagrams';
import {
  ALGORITHM_LABEL,
  needsPriority,
  needsQuantum,
  parseProcesses,
  parseQuantum,
  simulateSchedule,
  type SchedAlgorithm,
} from '../lib/scheduling';

const ALGORITHMS: SchedAlgorithm[] = ['FCFS', 'SJF', 'SRTF', 'RR', 'NPP', 'PP', 'HRRN'];

const EXPLAIN: Record<SchedAlgorithm, string> = {
  FCFS: 'Processes run in the order they arrive. Simple and fair, but a long process can make everyone behind it wait.',
  SJF: 'When the CPU is free, it picks the waiting process with the shortest burst time. Once started, a process runs until it finishes.',
  SRTF: 'SRTF works like SJF, but it can interrupt a running process. If a new process arrives and has less remaining work, it gets the CPU instead.',
  NPP: 'When the CPU is free, it picks the waiting process with the highest priority (a lower number means higher priority). Once started, a process runs until it finishes.',
  PP: 'Like the non-preemptive version, but a newly arrived process with a higher priority takes over right away.',
  RR: 'Every process gets a short turn called a time quantum. If it is not finished when the turn ends, it goes to the back of the queue. Nobody waits too long, which is why it is used in time-sharing systems.',
  HRRN: 'When the CPU is free, it picks the waiting process with the highest response ratio: (waiting time + burst time) / burst time. Short jobs go early, but a long job that has waited a long time eventually wins, so nothing starves.',
};

interface Example {
  label: string;
  algo: SchedAlgorithm;
  arrival: string;
  burst: string;
  priority: string;
  quantum: string;
}

const EXAMPLES: Example[] = [
  { label: 'Classic set (SRTF)', algo: 'SRTF', arrival: '0 1 2 3', burst: '8 4 9 5', priority: '3 1 4 2', quantum: '2' },
  { label: 'Round Robin', algo: 'RR', arrival: '0 1 2 3', burst: '5 3 1 2', priority: '3 1 4 2', quantum: '2' },
  { label: 'Priority', algo: 'NPP', arrival: '0 0 0 0 0', burst: '10 1 2 1 5', priority: '3 1 4 5 2', quantum: '2' },
  { label: 'CPU idle gap', algo: 'FCFS', arrival: '3 10', burst: '2 2', priority: '1 2', quantum: '2' },
];

export default function SchedulingDemo() {
  const [algo, setAlgo] = useState<SchedAlgorithm>('SRTF');
  const [arrival, setArrival] = useState('0 1 2 3');
  const [burst, setBurst] = useState('8 4 9 5');
  const [priority, setPriority] = useState('3 1 4 2');
  const [quantumText, setQuantumText] = useState('2');
  const [cursor, setCursor] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const usePriority = needsPriority(algo);
  const useQuantum = needsQuantum(algo);
  const quantum = useMemo(() => parseQuantum(quantumText), [quantumText]);
  const parsed = useMemo(
    () => parseProcesses(arrival, burst, priority, usePriority),
    [arrival, burst, priority, usePriority],
  );
  const inputError = parsed.error ?? (useQuantum ? quantum.error : null);
  const result = useMemo(
    () => (inputError ? null : simulateSchedule(algo, parsed.procs, quantum.quantum)),
    [inputError, parsed, algo, quantum.quantum],
  );

  const last = (result?.segments.length ?? 0) - 1;

  useEffect(() => {
    setCursor(-1);
    setPlaying(false);
  }, [algo, arrival, burst, priority, quantumText]);

  useEffect(() => {
    if (!playing) return;
    if (cursor >= last) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setCursor((c) => Math.min(c + 1, last)), stepDelay(1100, speed));
    return () => window.clearTimeout(t);
  }, [playing, cursor, last, speed]);

  const field =
    'mt-2 block min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3 font-mono text-sm text-fg placeholder:text-muted';
  const label = 'font-mono text-xs tracking-wider text-muted uppercase';

  const revealed = result ? result.segments.slice(0, cursor + 1) : [];
  const diagram = useMemo(() => schedulingDiagram(algo, quantum.quantum), [algo, quantum.quantum]);

  const loadExample = (e: Example): void => {
    setAlgo(e.algo);
    setArrival(e.arrival);
    setBurst(e.burst);
    setPriority(e.priority);
    setQuantumText(e.quantum);
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
      />
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
              title={ALGORITHM_LABEL[a]}
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
        <p className="mt-3 text-sm font-medium">{ALGORITHM_LABEL[algo]}</p>
        <p className="mt-1 text-sm text-muted">{EXPLAIN[algo]}</p>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <div>
          <label htmlFor="sch-arrival" className={label}>
            Arrival times
          </label>
          <input id="sch-arrival" value={arrival} onChange={(e) => setArrival(e.target.value)} autoComplete="off" spellCheck={false} className={field} placeholder="e.g. 0 1 2 3" />
        </div>
        <div>
          <label htmlFor="sch-burst" className={label}>
            Burst times
          </label>
          <input id="sch-burst" value={burst} onChange={(e) => setBurst(e.target.value)} autoComplete="off" spellCheck={false} className={field} placeholder="e.g. 8 4 9 5" />
        </div>
        {useQuantum && (
          <div>
            <label htmlFor="sch-quantum" className={label}>
              Time quantum (1 to 20)
            </label>
            <input id="sch-quantum" value={quantumText} onChange={(e) => setQuantumText(e.target.value)} inputMode="numeric" autoComplete="off" spellCheck={false} className={field} placeholder="e.g. 2" />
          </div>
        )}
        {usePriority && (
          <div>
            <label htmlFor="sch-priority" className={label}>
              Priorities (lower = higher)
            </label>
            <input id="sch-priority" value={priority} onChange={(e) => setPriority(e.target.value)} autoComplete="off" spellCheck={false} className={field} placeholder="e.g. 3 1 4 2" />
          </div>
        )}
        <p
          className={`text-sm ${inputError ? 'text-warn' : 'text-muted'}`}
          role={inputError ? 'alert' : undefined}
        >
          {inputError ??
            'Enter one number per process, separated by spaces. The first number represents process A, the second represents process B, and so on.'}
        </p>
      </div>

      {/* Examples */}
      <div>
        <p className={label}>Examples</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e.label}
              type="button"
              onClick={() => loadExample(e)}
              className="min-h-10 rounded-full border border-line px-4 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

    </>
  );

  const visual = result ? (
    <>
      <SchedulingViz segments={result.segments} cursor={cursor} ruleLabel={ALGORITHM_LABEL[algo]} />

      <StepLog
        items={revealed.map((x, i) => ({ label: `Part ${i + 1}`, text: x.note }))}
        total={result.segments.length}
        emptyMessage="Press Next or Play to see which process runs next and why."
      />

      {/* Results */}
      <h3 className="mt-6 font-mono text-xs tracking-wider text-muted uppercase">Process statistics</h3>
      <div className="mt-2 overflow-x-auto rounded-lg border border-line bg-bg">
        <table className="w-full border-collapse text-center font-mono text-sm">
          <caption className="sr-only">Finish, turnaround and waiting time for each process</caption>
          <thead>
            <tr className="text-xs text-muted">
              <th scope="col" className="px-3 py-2 font-normal">Process</th>
              <th scope="col" className="px-3 py-2 font-normal">Arrival</th>
              <th scope="col" className="px-3 py-2 font-normal">Burst</th>
              {usePriority && <th scope="col" className="px-3 py-2 font-normal">Priority</th>}
              <th scope="col" className="px-3 py-2 font-normal">Finish</th>
              <th scope="col" className="px-3 py-2 font-normal">Turnaround</th>
              <th scope="col" className="px-3 py-2 font-normal">Waiting</th>
            </tr>
          </thead>
          <tbody>
            {result.processes.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <th scope="row" className="px-3 py-2">
                  <span style={toneStyle(p.id)} className="tone tone-soft inline-flex size-7 items-center justify-center rounded-md border font-semibold">
                    {p.id}
                  </span>
                </th>
                <td className="px-3 py-2">{p.arrival}</td>
                <td className="px-3 py-2">{p.burst}</td>
                {usePriority && <td className="px-3 py-2">{p.priority}</td>}
                <td className="px-3 py-2">{p.completion}</td>
                <td className="px-3 py-2">{p.turnaround}</td>
                <td className="px-3 py-2">{p.waiting}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line-strong font-semibold">
              <th scope="row" colSpan={usePriority ? 5 : 4} className="px-3 py-2 text-right text-xs font-normal text-muted">
                Average
              </th>
              <td className="px-3 py-2">{result.avgTurnaround.toFixed(2)}</td>
              <td className="px-3 py-2">{result.avgWaiting.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-3">
        <StatGrid cols={3}>
          <Stat label="Average waiting time" value={result.avgWaiting.toFixed(2)} tone="accent" />
          <Stat label="Average turnaround time" value={result.avgTurnaround.toFixed(2)} />
          <Stat label="Total time" value={result.totalTime} hint="until the last process ends" />
        </StatGrid>
      </div>

      <details className="mt-4 text-sm text-muted">
        <summary className="min-h-10 cursor-pointer py-2 text-fg">What do these words mean?</summary>
        <ul className="mt-2 space-y-1.5 pl-4">
          <li><strong className="font-semibold text-fg">Arrival time:</strong> when a process joins the queue.</li>
          <li><strong className="font-semibold text-fg">Burst time:</strong> how much CPU time the process needs in total.</li>
          <li><strong className="font-semibold text-fg">Finish time:</strong> when the process is completely done.</li>
          <li><strong className="font-semibold text-fg">Turnaround time:</strong> finish time minus arrival time. The total time from joining to finishing.</li>
          <li><strong className="font-semibold text-fg">Waiting time:</strong> turnaround time minus burst time. The time spent waiting instead of running.</li>
          <li><strong className="font-semibold text-fg">Preemptive:</strong> the CPU can pause a running process to give the turn to another one.</li>
          <li><strong className="font-semibold text-fg">Context switch:</strong> the CPU stops one process and starts another.</li>
          <li><strong className="font-semibold text-fg">Time quantum:</strong> in Round Robin, the longest a process may run before the next process gets a turn.</li>
          <li><strong className="font-semibold text-fg">Response ratio:</strong> in HRRN, (waiting time + burst time) / burst time. It grows the longer a process waits.</li>
          <li><strong className="font-semibold text-fg">Starvation:</strong> when a process waits for a very long time because others keep getting chosen first.</li>
        </ul>
      </details>

      <DesignDiagram nodes={diagram} />
    </>
  ) : (
    <p className="rounded-lg border border-dashed border-line p-6 text-sm text-muted">
      Fix the input on the left to see the visualization.
    </p>
  );

  return <WorkspaceLayout controls={controls} visual={visual} toolbar={toolbar} />;
}
