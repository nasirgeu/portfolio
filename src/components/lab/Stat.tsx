import type { ReactNode } from 'react';

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'accent' | 'warn';
}

/** One headline number with a label, used for live statistics in every experiment. */
export function Stat({ label, value, hint, tone = 'default' }: StatProps) {
  const color = tone === 'accent' ? 'text-accent' : tone === 'warn' ? 'text-warn' : 'text-fg';
  return (
    <div className="rounded-lg border border-line bg-bg p-3">
      <p className="font-mono text-xs tracking-wider text-muted uppercase">{label}</p>
      <p className={`mt-0.5 text-2xl font-bold tracking-tight ${color}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** A responsive row of stats. */
export function StatGrid({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const grid = cols === 2 ? 'sm:grid-cols-2' : cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 xl:grid-cols-4';
  return <div className={`grid grid-cols-2 gap-3 ${grid}`}>{children}</div>;
}
