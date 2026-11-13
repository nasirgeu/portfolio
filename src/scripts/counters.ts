/**
 * Count-up for the highlight numbers (1,747 solved, the contest rating, 90%).
 *
 * The real number is already in the page, so it is correct without JavaScript and with reduced motion. When a number
 * scrolls into view it counts up from 0 to that value once, over about a second and a half.
 */

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const els = Array.from(document.querySelectorAll<HTMLElement>('[data-count]'));

if (!calm && 'IntersectionObserver' in window && els.length > 0) {
  const duration = 1500;
  const format = (n: number, decimals: number, suffix: string): string =>
    `${n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;

  const run = (el: HTMLElement): void => {
    const target = Number(el.dataset['count']);
    if (!Number.isFinite(target)) return;
    const decimals = Number(el.dataset['countDecimals'] ?? 0);
    const suffix = el.dataset['countSuffix'] ?? '';
    const final = el.textContent ?? format(target, decimals, suffix);
    const start = performance.now();
    const tick = (now: number): void => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = p < 1 ? format(target * eased, decimals, suffix) : final;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const watcher = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        watcher.unobserve(entry.target);
        run(entry.target as HTMLElement);
      }
    },
    { threshold: 0.6 },
  );
  els.forEach((el) => watcher.observe(el));
}

// Marks this file as a module, so its names stay private.
export {};
