import { useId, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import type { DiagramNode } from '../data/designDiagrams';

interface Props {
  title?: string;
  nodes: readonly DiagramNode[];
  /** Start expanded. */
  defaultOpen?: boolean;
}

const KIND_LABEL: Record<DiagramNode['kind'], string> = {
  start: 'Start',
  step: 'Step',
  decision: 'Decision',
};

/**
 * A collapsible, clickable design diagram: a flow of boxes (steps and decisions)
 * with a detail panel. Closed by default so the demo above stays the focus.
 */
export default function DesignDiagram({
  title = 'Design diagram: how this demo decides',
  nodes,
  defaultOpen = false,
}: Props) {
  const [selectedId, setSelectedId] = useState('');
  const headingId = useId();
  const selected = nodes.find((n) => n.id === selectedId) ?? nodes[0];

  return (
    <details open={defaultOpen} className="group mt-6 rounded-lg border border-line bg-surface-2/40">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium marker:content-none">
        <span>{title}</span>
        <span aria-hidden="true" className="font-mono text-xs text-muted group-open:hidden">
          Show
        </span>
        <span aria-hidden="true" className="hidden font-mono text-xs text-muted group-open:inline">
          Hide
        </span>
      </summary>

      <div className="grid gap-5 border-t border-line p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div>
          <p className="mb-3 text-sm text-muted">Click any box to see what it does and why it is built that way.</p>
          <ol className="flex flex-col items-stretch gap-1.5" aria-label="Order of decisions, top to bottom">
            {nodes.map((n, i) => {
              const on = n.id === selected?.id;
              return (
                <li key={n.id} className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedId(n.id)}
                    aria-pressed={on}
                    className={`w-full rounded-xl border px-4 py-2.5 text-left transition-colors ${
                      n.kind === 'decision' ? 'border-dashed' : ''
                    } ${on ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2'}`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-muted">
                        {String(i + 1).padStart(2, '0')} · {KIND_LABEL[n.kind]}
                      </span>
                    </span>
                    <span className={`block text-sm font-semibold ${on ? 'text-accent' : ''}`}>{n.title}</span>
                    <span className="block text-xs text-muted">{n.short}</span>
                    {n.branches && (
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        {n.branches.map((b) => (
                          <span key={b.label} className="rounded-md border border-line bg-bg px-1.5 py-0.5 font-mono text-xs text-muted">
                            {b.label}
                          </span>
                        ))}
                      </span>
                    )}
                  </button>
                  {i < nodes.length - 1 && <ArrowDown size={14} aria-hidden="true" className="text-line-strong" />}
                </li>
              );
            })}
          </ol>
        </div>

        {selected && (
          <div className="self-start rounded-lg border border-line bg-surface-2 p-5 lg:sticky lg:top-24" aria-live="polite" aria-labelledby={headingId}>
            <p className="font-mono text-xs text-muted">{KIND_LABEL[selected.kind]}</p>
            <h3 id={headingId} className="mt-0.5 text-lg font-semibold">
              {selected.title}
            </h3>
            <dl className="mt-3 space-y-4 text-sm">
              <div>
                <dt className="font-mono text-xs tracking-wider text-muted uppercase">What it does</dt>
                <dd className="mt-1">{selected.does}</dd>
              </div>
              {selected.branches && (
                <div>
                  <dt className="font-mono text-xs tracking-wider text-muted uppercase">Where each answer leads</dt>
                  <dd className="mt-1">
                    <ul className="space-y-1.5">
                      {selected.branches.map((b) => (
                        <li key={b.label} className="flex gap-2">
                          <span className="shrink-0 font-mono text-xs text-accent">{b.label} →</span>
                          <span>{b.to}</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              <div>
                <dt className="font-mono text-xs tracking-wider text-muted uppercase">Where it lives</dt>
                <dd className="mt-1 font-mono text-xs break-words text-accent">{selected.where}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs tracking-wider text-muted uppercase">Why it is built this way</dt>
                <dd className="mt-1">{selected.why}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </details>
  );
}
