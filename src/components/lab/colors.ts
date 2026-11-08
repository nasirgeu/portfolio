import type { CSSProperties } from 'react';

/**
 * Identity colours for processes and memory blocks.
 * Each id gets a stable hue. The actual colours come from the .tone classes in
 * lab.css, which pick a lightness that reads well in both the dark and light themes.
 */
const HUES = [199, 142, 38, 330, 265, 12, 170, 56, 290, 100, 222, 350];

function indexOfId(id: string): number {
  if (id.length === 1) return id.toUpperCase().charCodeAt(0) - 65;
  const n = Number.parseInt(id.slice(1), 10);
  return Number.isNaN(n) ? 0 : n - 1;
}

/** Inline style that sets the hue for a `.tone` element. */
export function toneStyle(id: string): CSSProperties {
  const hue = HUES[Math.abs(indexOfId(id)) % HUES.length] as number;
  return { '--h': hue } as CSSProperties;
}
