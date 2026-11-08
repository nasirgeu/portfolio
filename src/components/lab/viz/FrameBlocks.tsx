import type { Step } from '../../../lib/pageReplacement';
import { Stat, StatGrid } from '../Stat';

interface Props {
  /** The step being shown, or null before the first step. */
  step: Step | null;
  frameCount: number;
  /** Index of the step being shown (-1 before the first). */
  index: number;
  total: number;
  hits: number;
  faults: number;
}

/**
 * Page replacement: the requested page, a hit or fault verdict, and the memory
 * frames as distinct blocks. The incoming page, the removed page and a hit each
 * look different and animate when the step changes.
 */
export default function FrameBlocks({ step, frameCount, index, total, hits, faults }: Props) {
  const frames: (number | null)[] = step ? step.frames : Array.from({ length: frameCount }, () => null);
  const seen = hits + faults;
  const ratio = seen > 0 ? Math.round((hits / seen) * 100) : 0;

  return (
    <section aria-label="Memory frames">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-xs tracking-wider text-muted uppercase">Memory frames</h3>
        <p className="font-mono text-xs text-muted">
          Step {Math.max(index + 1, 0)} of {total}
        </p>
      </div>

      <div className="mt-2 rounded-lg border border-line bg-bg p-4">
        {/* The request and what happened to it */}
        <div className="flex flex-wrap items-center gap-4">
          <div key={`req-${index}`} className="viz-pop">
            <p className="font-mono text-xs tracking-wider text-muted uppercase">Requested page</p>
            <p
              className={`mt-1 inline-flex size-14 items-center justify-center rounded-xl border-2 text-3xl font-bold ${
                step ? (step.hit ? 'border-accent text-accent' : 'border-warn text-warn') : 'border-dashed border-line-strong text-muted'
              }`}
            >
              {step ? step.page : '–'}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            {step ? (
              <>
                <p
                  key={`verdict-${index}`}
                  className={`viz-pop inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-xs font-semibold tracking-wider uppercase ${
                    step.hit ? 'border-accent bg-accent-soft text-accent' : 'border-warn text-warn'
                  }`}
                >
                  {step.hit ? 'Hit' : 'Page fault'}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {step.hit
                    ? `Page ${step.page} is already in a frame, so nothing is loaded.`
                    : step.evicted === null
                      ? `Page ${step.page} is loaded into an empty frame.`
                      : `Page ${step.evicted} is removed and page ${step.page} comes in.`}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">Press Next or Play. The first request will appear here.</p>
            )}
          </div>
        </div>

        {/* The frames */}
        <ul className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-3" aria-label="Frames">
          {frames.map((page, f) => {
            const incoming = step !== null && step.changedFrame === f;
            const hitFrame = step !== null && step.hit && page === step.page;
            const removed = incoming && step.evicted !== null ? step.evicted : null;
            const tile = incoming
              ? 'viz-in viz-fault border-warn bg-surface text-warn'
              : hitFrame
                ? 'viz-hit border-accent bg-accent-soft text-accent'
                : page === null
                  ? 'border-dashed border-line-strong text-muted'
                  : 'border-line-strong bg-surface text-fg';
            return (
              <li key={`${index}-${f}`} className="relative">
                <p className="mb-1 font-mono text-xs text-muted">Frame {f + 1}</p>
                <div className="relative">
                  {removed !== null && (
                    <span
                      aria-hidden="true"
                      className="viz-out absolute inset-0 flex items-center justify-center rounded-xl border-2 border-dashed border-warn/60 text-2xl font-bold text-warn/70 line-through"
                    >
                      {removed}
                    </span>
                  )}
                  <div
                    className={`flex min-h-20 items-center justify-center rounded-xl border-2 text-3xl font-bold ${tile}`}
                  >
                    {page ?? '–'}
                  </div>
                </div>
                <p className="mt-1 h-4 font-mono text-xs text-muted">
                  {incoming
                    ? removed !== null
                      ? `in ${step?.page} · out ${removed}`
                      : `in ${step?.page}`
                    : hitFrame
                      ? 'hit'
                      : ''}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-3">
        <StatGrid>
          <Stat label="Hits so far" value={hits} tone="accent" />
          <Stat label="Faults so far" value={faults} tone="warn" />
          <Stat label="Hit ratio" value={`${ratio}%`} hint={seen > 0 ? `of ${seen} requests` : 'no requests yet'} />
          <Stat label="Step" value={`${Math.max(index + 1, 0)}/${total}`} />
        </StatGrid>
      </div>
    </section>
  );
}
