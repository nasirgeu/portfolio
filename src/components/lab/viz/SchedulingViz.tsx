import type { Segment } from '../../../lib/scheduling';
import { toneStyle } from '../colors';
import { Stat, StatGrid } from '../Stat';

const UNIT_PX = 34; // width of one time unit in the Gantt chart

interface Props {
  segments: readonly Segment[];
  /** Index of the last part shown. -1 means nothing yet. */
  cursor: number;
  /** Name of the algorithm, for the "why this process" card. */
  ruleLabel: string;
}

const hatch = {
  backgroundImage:
    'repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in srgb, var(--muted) 18%, transparent) 6px 7px)',
};

/** A coloured process chip. */
function Chip({ id, badge, size = 'md' }: { id: string; badge?: string | undefined; size?: 'md' | 'lg' }) {
  return (
    <span
      style={toneStyle(id)}
      className={`tone tone-soft inline-flex items-center gap-1.5 rounded-md border font-mono font-semibold ${
        size === 'lg' ? 'px-3 py-1.5 text-lg' : 'px-2.5 py-1 text-sm'
      }`}
    >
      {id}
      {badge && <span className="rounded bg-bg px-1 text-xs font-medium tracking-wide text-fg uppercase">{badge}</span>}
    </span>
  );
}

/**
 * CPU scheduling: the Gantt chart is the main view. Processes have their own colour,
 * the running process is highlighted, context switches and preemptions are marked,
 * and the ready queue and the scheduler's reason are shown for the current part.
 */
export default function SchedulingViz({ segments, cursor, ruleLabel }: Props) {
  const revealed = segments.slice(0, cursor + 1);
  const cur = cursor >= 0 ? segments[cursor] : undefined;
  const prev = cursor > 0 ? segments[cursor - 1] : undefined;
  const endTime = revealed.length > 0 ? (revealed[revealed.length - 1]?.end ?? 0) : 0;

  // A process was paused at boundary i when the one running before it appears again later.
  const pausedAt = (i: number): boolean => {
    const before = segments[i - 1];
    return !!before?.pid && segments.slice(i).some((x) => x.pid === before.pid);
  };
  const isSwitch = (i: number): boolean => {
    const before = segments[i - 1];
    const here = segments[i];
    return i > 0 && !!before?.pid && !!here?.pid && before.pid !== here.pid;
  };

  const busy = revealed.reduce((sum, g) => (g.pid ? sum + g.end - g.start : sum), 0);
  const busyPct = endTime > 0 ? Math.round((busy / endTime) * 100) : 0;
  let switches = 0;
  let preemptions = 0;
  revealed.forEach((_, i) => {
    if (isSwitch(i)) {
      switches++;
      if (pausedAt(i)) preemptions++;
    }
  });

  const curPreempted = cursor > 0 && isSwitch(cursor) && pausedAt(cursor);
  const queue = cur?.queue ?? [];
  const prevQueue = prev?.queue ?? [];
  const arrivedSince = new Set(queue.filter((id) => !prevQueue.includes(id) && id !== prev?.pid));
  const pausedId = curPreempted ? prev?.pid : undefined;
  const ticks = Array.from(new Set(revealed.flatMap((s) => [s.start, s.end]))).sort((a, b) => a - b);

  return (
    <div>
      {/* Gantt chart */}
      <h3 className="font-mono text-xs tracking-wider text-muted uppercase">Gantt chart</h3>
      <div className="mt-2 overflow-x-auto rounded-lg border border-line bg-bg p-3">
        <div
          role="img"
          aria-label={
            revealed.length === 0
              ? 'Gantt chart. Nothing drawn yet. For the demo, click Next, Play or Show all.'
              : `Gantt chart: ${revealed.map((s) => `${s.pid ?? 'idle'} from ${s.start} to ${s.end}`).join(', ')}`
          }
          style={{ width: `${Math.max(endTime, 1) * UNIT_PX}px`, minWidth: '100%' }}
          className="relative pt-4"
        >
          <div className="relative h-16">
            {revealed.length === 0 && (
              <div className="absolute inset-0 flex items-center rounded-md border border-dashed border-line px-3 text-sm text-muted">
                The chart is drawn here. For the demo, click Next, Play or Show all.
              </div>
            )}
            {revealed.map((s, i) => {
              const current = i === cursor;
              const preemptHere = current && i > 0 && isSwitch(i) && pausedAt(i);
              return (
                <div
                  key={i}
                  title={`${s.pid ?? 'idle'}: ${s.start} to ${s.end}`}
                  style={{
                    left: `${s.start * UNIT_PX}px`,
                    width: `${(s.end - s.start) * UNIT_PX}px`,
                    ...(s.pid ? toneStyle(s.pid) : hatch),
                  }}
                  className={`gantt-seg absolute top-0 flex h-16 flex-col items-center justify-center border font-mono transition-colors ${
                    s.pid === null
                      ? 'border-dashed border-line-strong text-muted'
                      : `tone ${current ? 'tone-solid' : 'tone-soft'}`
                  } ${preemptHere ? 'gantt-preempt' : ''}`}
                >
                  <span className="text-base leading-none font-semibold">{s.pid ?? 'idle'}</span>
                  <span className="mt-1 text-xs leading-none">{s.end - s.start}u</span>
                </div>
              );
            })}
            {/* context switch markers */}
            {revealed.map((s, i) =>
              isSwitch(i) ? (
                <span
                  key={`sw-${i}`}
                  aria-hidden="true"
                  title={pausedAt(i) ? `Preemption at ${s.start}` : `Context switch at ${s.start}`}
                  style={{ left: `${s.start * UNIT_PX}px` }}
                  className={`absolute -top-3 size-2.5 -translate-x-1/2 rotate-45 border ${
                    pausedAt(i) ? 'border-warn bg-warn' : 'border-muted bg-bg'
                  }`}
                />
              ) : null,
            )}
          </div>
          <div className="relative mt-1 h-5 font-mono text-xs text-muted">
            {ticks.map((tk) => (
              <span key={tk} style={{ left: `${tk * UNIT_PX}px` }} className="absolute -translate-x-1/2">
                {tk}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rotate-45 border border-muted bg-bg" aria-hidden="true" /> context switch
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rotate-45 border border-warn bg-warn" aria-hidden="true" /> preemption (a running process was paused)
        </span>
      </p>

      {/* CPU */}
      <section aria-label="CPU" className="mt-6 rounded-lg border border-line bg-bg p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <p className="font-mono text-xs tracking-wider text-muted uppercase">CPU is</p>
            <div key={`cpu-${cursor}`} className="viz-pop mt-1 flex items-center gap-3">
              {cur?.pid ? (
                <>
                  <Chip id={cur.pid} size="lg" />
                  <span className="text-sm text-muted">
                    running from {cur.start} to {cur.end} ({cur.end - cur.start} time unit{cur.end - cur.start === 1 ? '' : 's'})
                  </span>
                </>
              ) : cur ? (
                <span className="text-sm font-semibold text-muted">
                  idle from {cur.start} to {cur.end}
                </span>
              ) : (
                <span className="text-sm text-muted">not started. Press Next or Play.</span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <StatGrid>
            <Stat label="Clock" value={endTime} hint="end of the latest part" />
            <Stat label="Context switches" value={switches} />
            <Stat label="Preemptions" value={preemptions} tone={preemptions > 0 ? 'warn' : 'default'} />
            <Stat label="CPU busy" value={`${busyPct}%`} hint="so far" tone="accent" />
          </StatGrid>
        </div>
      </section>

      {/* Ready queue */}
      <section aria-label="Ready queue" className="mt-6">
        <h3 className="font-mono text-xs tracking-wider text-muted uppercase">Ready queue (next to run on the left)</h3>
        <div key={`rq-${cursor}`} className="viz-pop mt-2 flex min-h-14 flex-wrap items-center gap-2 rounded-lg border border-line bg-bg p-3">
          {cur === undefined ? (
            <span className="text-sm text-muted">The queue appears once a step is shown.</span>
          ) : queue.length === 0 ? (
            <span className="text-sm text-muted">Empty: nobody is waiting.</span>
          ) : (
            queue.map((id) => (
              <Chip key={id} id={id} badge={id === pausedId ? 'paused' : arrivedSince.has(id) ? 'new' : undefined} />
            ))
          )}
        </div>
      </section>

      {/* Why this process */}
      <section aria-label="Why the scheduler chose this" className="mt-6">
        <h3 className="font-mono text-xs tracking-wider text-muted uppercase">Why this process? ({ruleLabel})</h3>
        <p
          key={`why-${cursor}`}
          className="viz-pop mt-2 rounded-lg border border-accent/50 bg-accent-soft p-4 text-sm"
        >
          {cur ? cur.note : 'The scheduler explains each choice here, using the real numbers at that moment.'}
        </p>
      </section>
    </div>
  );
}
