import { useEffect, useState } from 'react';
import { stepDelay } from './ExecutionControls';

/**
 * The cursor, play state and speed shared by the Lab demos.
 * `last` is the index of the final step. `resetKey` changes whenever the inputs change,
 * which sends the cursor back to the start and stops playback.
 */
export function useStepper(last: number, resetKey: string, baseMs = 900) {
  const [cursor, setCursor] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    setCursor(-1);
    setPlaying(false);
  }, [resetKey]);

  useEffect(() => {
    if (!playing) return;
    if (cursor >= last) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setCursor((c) => Math.min(c + 1, last)), stepDelay(baseMs, speed));
    return () => window.clearTimeout(t);
  }, [playing, cursor, last, speed, baseMs]);

  return { cursor, setCursor, playing, setPlaying, speed, setSpeed };
}
