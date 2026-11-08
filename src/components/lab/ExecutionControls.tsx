import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { FastForward, Pause, Play, RotateCcw, StepBack, StepForward } from 'lucide-react';

export const SPEEDS = [0.5, 1, 2, 4] as const;

/** Milliseconds between automatic steps at a given speed. */
export const stepDelay = (baseMs: number, speed: number): number => Math.round(baseMs / speed);

interface Props {
  /** Index of the last step shown. -1 means nothing has been shown yet. */
  cursor: number;
  /** Index of the final step. */
  last: number;
  playing: boolean;
  setCursor: Dispatch<SetStateAction<number>>;
  setPlaying: Dispatch<SetStateAction<boolean>>;
  /** Playback speed multiplier used by Play. */
  speed: number;
  setSpeed: Dispatch<SetStateAction<number>>;
  /** Optional readout shown beside the buttons, for example "3 faults · 2 hits". */
  children?: ReactNode;
}

const btn =
  'btn !min-h-10 !px-2.5 sm:!px-3 !text-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';
/** On phones only the icons show, so the whole bar fits on one line. */
const label = 'hidden sm:inline';

/**
 * Back, Next, Play / Pause / Resume, Show all, Reset and a playback speed, in one compact row.
 * It is shown in a bar that stays under the navbar while the visualization is on screen,
 * so the controls and the chart are always visible together.
 */
export default function ExecutionControls({
  cursor,
  last,
  playing,
  setCursor,
  setPlaying,
  speed,
  setSpeed,
  children,
}: Props) {
  const atEnd = cursor >= last && last >= 0;
  const playLabel = playing ? 'Pause' : cursor >= 0 && !atEnd ? 'Resume' : 'Play';

  return (
    <div role="group" aria-label="Execution controls" className="flex flex-wrap items-center gap-x-1.5 gap-y-2 sm:gap-x-2">
      <button
        type="button"
        className={btn}
        aria-label="Back"
        onClick={() => setCursor((c) => Math.max(c - 1, -1))}
        disabled={cursor < 0}
      >
        <StepBack size={16} aria-hidden="true" /> <span className={label}>Back</span>
      </button>
      <button
        type="button"
        className={btn}
        aria-label="Next"
        onClick={() => setCursor((c) => Math.min(c + 1, last))}
        disabled={atEnd}
      >
        <span className={label}>Next</span> <StepForward size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={btn}
        aria-label={playLabel}
        onClick={() => {
          if (atEnd) setCursor(-1);
          setPlaying((p) => !p);
        }}
        aria-pressed={playing}
      >
        {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        <span className={label}>{playLabel}</span>
      </button>
      <button
        type="button"
        className={btn}
        aria-label="Show all"
        onClick={() => {
          setPlaying(false);
          setCursor(last);
        }}
        disabled={atEnd}
      >
        <FastForward size={16} aria-hidden="true" /> <span className={label}>Show all</span>
      </button>
      <button
        type="button"
        className={btn}
        aria-label="Reset"
        onClick={() => {
          setPlaying(false);
          setCursor(-1);
        }}
        disabled={cursor < 0}
      >
        <RotateCcw size={16} aria-hidden="true" /> <span className={label}>Reset</span>
      </button>

      <span className="mx-1 hidden h-6 w-px bg-line-strong sm:block" aria-hidden="true" />

      <label htmlFor="lab-speed" className="font-mono text-xs tracking-wider text-muted uppercase">
        <span className="sr-only sm:not-sr-only">Speed</span>
      </label>
      <select
        id="lab-speed"
        value={speed}
        onChange={(e) => setSpeed(Number(e.target.value))}
        className="min-h-10 rounded-lg border border-line-strong bg-bg px-1 font-mono text-sm text-fg sm:px-2"
      >
        {SPEEDS.map((s) => (
          <option key={s} value={s}>
            {s}×
          </option>
        ))}
      </select>

      <span className="font-mono text-xs text-muted">
        {Math.max(cursor + 1, 0)} / {Math.max(last + 1, 0)}
      </span>

      {children && (
        <span className="ml-auto hidden font-mono text-sm text-muted md:inline" aria-live="off">
          {children}
        </span>
      )}
    </div>
  );
}
