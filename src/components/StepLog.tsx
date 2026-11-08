import { useEffect, useRef } from 'react';

export interface LogItem {
  label: string;
  text: string;
}

interface Props {
  /** Steps reached so far, oldest first. The last one is the current step. */
  items: readonly LogItem[];
  /** Total number of steps in the whole walkthrough. */
  total: number;
  /** Shown before any step is reached. */
  emptyMessage: string;
  /** Short name used in the heading and for screen readers, e.g. "Explanation". */
  heading?: string;
}

/**
 * Step-by-step explanation as a bulleted list.
 * It grows as steps are reached, then becomes a scrollable box (about five
 * bullets are visible at once) and keeps the newest bullet in view.
 */
export default function StepLog({ items, total, emptyMessage, heading = 'Step-by-step explanation' }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const lastItem = useRef<HTMLLIElement>(null);

  // Keep the newest bullet in view inside the box, without scrolling the page.
  useEffect(() => {
    const el = box.current;
    const li = lastItem.current;
    if (!el || !li) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = li.offsetTop + li.offsetHeight - el.clientHeight + 12;
    el.scrollTo({ top: Math.max(top, 0), behavior: reduce ? 'auto' : 'smooth' });
  }, [items.length]);

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="font-mono text-xs tracking-wider text-muted uppercase">{heading}</h3>
        <p className="font-mono text-xs text-muted">
          {items.length} of {total} {total === 1 ? 'step' : 'steps'}
        </p>
      </div>
      <div
        ref={box}
        role="log"
        aria-label={heading}
        aria-live="polite"
        aria-relevant="additions"
        tabIndex={0}
        className="max-h-[17rem] min-h-[4.5rem] overflow-y-auto rounded-lg border border-line bg-surface-2 p-4 text-sm"
      >
        {items.length === 0 ? (
          <p className="text-muted">{emptyMessage}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((it, i) => {
              const current = i === items.length - 1;
              return (
                <li
                  key={i}
                  ref={current ? lastItem : undefined}
                  aria-current={current ? 'step' : undefined}
                  className={`flex gap-3 ${current ? 'text-fg' : 'text-muted'}`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-[0.45rem] size-1.5 shrink-0 rounded-full ${current ? 'bg-accent' : 'bg-line-strong'}`}
                  />
                  <span>
                    <span className="font-mono text-xs text-muted">{it.label}: </span>
                    {it.text}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
