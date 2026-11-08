import { useState } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';

interface Node {
  id: string;
  /** Label on the box in the diagram. */
  title: string;
  /** Heading of the detail panel when the box is selected. */
  heading: string;
  short: string;
  does: string;
  where: string;
  why: string;
}

const FLOW: Node[] = [
  {
    id: 'input',
    title: 'You enter the input',
    heading: 'You type the inputs',
    short: 'Text boxes',
    does: 'Each demo starts with sensible default values, so it works on the first visit. Inputs are plain text such as "0 1 2 3" or "A5 B3 -A", so there is no form library to load.',
    where: 'src/components/PageReplacementDemo.tsx, SchedulingDemo.tsx, AllocatorDemo.tsx',
    why: 'Anyone can try their own numbers immediately, and a single text box is easy to use on a phone.',
  },
  {
    id: 'parse',
    title: 'Input is checked',
    heading: 'Parser and checks',
    short: 'Parser and validation',
    does: 'Turns the text into numbers and rejects bad input with a plain-English message instead of crashing. For example: a burst time of 0, lists of different lengths, a time quantum outside 1 to 20, a block larger than memory, or too many processes.',
    where: 'parseReferences, parseProcesses, parseQuantum and parseOps in src/lib/',
    why: 'The simulation only ever sees valid data, and visitors are told exactly what to fix.',
  },
  {
    id: 'engine',
    title: 'The algorithm runs',
    heading: 'Simulation engine',
    short: 'Pure TypeScript simulation',
    does: 'The engine uses plain TypeScript functions. It does not depend on the screen, random values or the system clock. This means the same input always produces the same result. Rules for handling ties (for example, choosing the process that arrived first and then following input order) are documented in the code.',
    where: 'src/lib/pageReplacement.ts, scheduling.ts, allocator.ts',
    why: 'Keeping the algorithm separate from the user interface makes it easier to test, understand and maintain.',
  },
  {
    id: 'steps',
    title: 'Steps are created',
    heading: 'Steps with explanations',
    short: 'Each decision includes an explanation',
    does: 'The engine does not return only a final answer. It returns every decision as a step, together with a plain-English reason such as "LRU removes the page that was used the longest time ago". Next, Back and Play only move a cursor along that list.',
    where: 'The notes built inside each simulate function, shown by src/components/StepLog.tsx',
    why: 'The explanation can never disagree with the result, because both come from the same step.',
  },
  {
    id: 'ui',
    title: 'Results are displayed',
    heading: 'Interface',
    short: 'React interface',
    does: 'React components that load only when you scroll to them. The rest of the site is static HTML. The Gantt chart and memory strip are drawn to scale, and each step log becomes a scrollable list once it gets long.',
    where: 'src/components/*Demo.tsx, loaded with client:visible in src/pages/lab/[slug].astro',
    why: 'Almost no JavaScript is needed to read the page, so it stays fast. Motion respects the reduced-motion setting, buttons work from the keyboard, and the step log is announced politely by screen readers.',
  },
];

const TESTS: Node = {
  id: 'tests',
  title: 'Automated tests',
  heading: 'Automated checks',
  short: 'npm test',
  does: 'More than 50 checks run against the engines. Some are textbook answers worked out by hand (for example FIFO 15, LRU 12 and Optimal 9 page faults on the classic string). Some are famous cases, such as Belady\'s anomaly or SRTF having the lowest average waiting time. Hundreds of random inputs must also obey rules such as "all CPU time is used" and "memory is always fully covered".',
  where: 'tests/*.test.ts, run with npm test',
  why: 'A demo that teaches a concept must be right. If a rule changes, a failing check says so before a visitor sees a wrong answer.',
};

export default function LabArchitecture() {
  const [selected, setSelected] = useState('engine');
  const all = [...FLOW, TESTS];
  const node = all.find((n) => n.id === selected) ?? FLOW[2]!;

  const pill = (n: Node, i?: number) => (
    <button
      key={n.id}
      type="button"
      onClick={() => setSelected(n.id)}
      aria-pressed={selected === n.id}
      className={`w-full rounded-xl border px-4 py-3 text-left transition-colors lg:min-h-[4.5rem] ${
        selected === n.id
          ? 'border-accent bg-accent-soft'
          : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2'
      } ${n.id === 'tests' ? 'border-dashed' : ''}`}
    >
      <span className="block font-mono text-xs text-muted">{i !== undefined ? `0${i + 1}` : 'Checks'}</span>
      <span className={`block text-sm font-semibold ${selected === n.id ? 'text-accent' : ''}`}>{n.title}</span>
      <span className="block text-xs text-muted">{n.short}</span>
    </button>
  );

  return (
    <div className="card p-5 sm:p-7">
      <p className="mb-4 text-sm text-muted">Select any part of the diagram to learn what it does and why it is designed this way.</p>

      <ol className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center" aria-label="How a demo works, from input to screen">
        {FLOW.map((n, i) => (
          <li key={n.id} className="flex flex-col items-center gap-2 lg:flex-1 lg:flex-row">
            {pill(n, i)}
            {i < FLOW.length - 1 && (
              <>
                <ArrowDown size={16} aria-hidden="true" className="shrink-0 text-line-strong lg:hidden" />
                <ArrowRight size={16} aria-hidden="true" className="hidden shrink-0 text-line-strong lg:block" />
              </>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-3 flex flex-col items-center gap-2 lg:items-stretch">
        <p className="text-center font-mono text-xs text-muted lg:text-left">
          The simulation logic and explanations are also checked through automated tests.
        </p>
        <div className="lg:max-w-xs">{pill(TESTS)}</div>
      </div>

      <div className="mt-6 rounded-lg border border-line bg-surface-2 p-5" aria-live="polite">
        <h3 className="text-lg font-semibold">{node.heading}</h3>
        <dl className="mt-3 space-y-4 text-sm">
          <div>
            <dt className="font-mono text-xs tracking-wider text-muted uppercase">What it does</dt>
            <dd className="mt-1">{node.does}</dd>
          </div>
          <div>
            <dt className="font-mono text-xs tracking-wider text-muted uppercase">Where it lives</dt>
            <dd className="mt-1 font-mono text-xs break-words text-accent">{node.where}</dd>
          </div>
          <div>
            <dt className="font-mono text-xs tracking-wider text-muted uppercase">Why it is built this way</dt>
            <dd className="mt-1">{node.why}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
