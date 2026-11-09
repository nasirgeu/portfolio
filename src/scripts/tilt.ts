/**
 * Gentle 3D tilt for cards marked with data-tilt.
 *
 * The card leans a few degrees toward the pointer and a soft light follows it. It only runs for a mouse or trackpad
 * (not touch screens) and never when reduced motion is requested. One listener handles every card, so it also works for
 * cards that appear later, such as the project cards that load as you scroll.
 */

const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (fine && !calm) {
  let active: HTMLElement | null = null;
  let frame = 0;
  let x = 0;
  let y = 0;

  const settle = (el: HTMLElement | null): void => {
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  const draw = (): void => {
    frame = 0;
    if (!active) return;
    const box = active.getBoundingClientRect();
    const px = (x - box.left) / box.width;
    const py = (y - box.top) / box.height;
    active.style.setProperty('--rx', `${((0.5 - py) * 6).toFixed(2)}deg`);
    active.style.setProperty('--ry', `${((px - 0.5) * 8).toFixed(2)}deg`);
    active.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
    active.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
  };

  document.addEventListener(
    'pointermove',
    (e) => {
      const card = (e.target as Element | null)?.closest<HTMLElement>('[data-tilt]') ?? null;
      if (card !== active) {
        settle(active);
        active = card;
      }
      if (!card) return;
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(draw);
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => {
    settle(active);
    active = null;
  });
}
