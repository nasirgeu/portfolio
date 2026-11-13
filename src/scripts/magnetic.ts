/**
 * A very small "magnetic" pull on primary buttons: the button follows the pointer by a few pixels while the pointer is
 * over it, then eases back. Mouse and trackpad only, and never with reduced motion.
 */

const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (fine && !calm) {
  const MAX = 6; // pixels
  document.querySelectorAll<HTMLElement>('.btn-primary, [data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const box = el.getBoundingClientRect();
      const x = ((e.clientX - (box.left + box.width / 2)) / box.width) * MAX * 2;
      const y = ((e.clientY - (box.top + box.height / 2)) / box.height) * MAX * 2;
      el.style.transition = 'transform 0.12s linear';
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
      el.style.transform = '';
    });
  });
}

// Marks this file as a module, so its names stay private.
export {};
