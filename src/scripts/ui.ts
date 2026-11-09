import { animate } from 'motion/mini';
import { inView } from 'motion';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

/* ---------- Theme toggle ---------- */
const themeBtn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');

function syncThemeUi(): void {
  const theme = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const themeLabel = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  themeBtn?.setAttribute('aria-label', themeLabel);
  themeBtn?.setAttribute('data-tip', themeLabel);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f4f7fb' : '#0b1322');
}
syncThemeUi();

themeBtn?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  root.setAttribute('data-theme', next);
  try {
    localStorage.setItem('theme', next);
  } catch {
    /* storage unavailable */
  }
  syncThemeUi();
});

/* ---------- Mobile menu ---------- */
const menuBtn = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const menu = document.getElementById('mobile-menu');
const iconOpen = menuBtn?.querySelector('[data-icon-open]');
const iconClose = menuBtn?.querySelector('[data-icon-close]');

function setMenu(open: boolean): void {
  if (!menuBtn || !menu) return;
  menu.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menuBtn.setAttribute('data-tip', open ? 'Close menu' : 'Open menu');
  iconOpen?.classList.toggle('hidden', open);
  iconClose?.classList.toggle('hidden', !open);
}

menuBtn?.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
menu?.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('a')) setMenu(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuBtn?.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuBtn.focus();
  }
});
window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
  if (e.matches) setMenu(false);
});

/* ---------- Desktop dropdown (click, hover, keyboard, Escape, click outside) ---------- */
document.querySelectorAll<HTMLElement>('[data-dropdown]').forEach((group) => {
  const button = group.querySelector<HTMLButtonElement>('[data-group-toggle]');
  const panel = group.querySelector<HTMLElement>('[data-group-panel]');
  const chevron = group.querySelector<SVGElement>('[data-chevron]');
  if (!button || !panel) return;
  const setOpen = (open: boolean): void => {
    button.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    chevron?.style.setProperty('transform', open ? 'rotate(180deg)' : '');
  };
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  group.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') setOpen(true);
  });
  group.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') setOpen(false);
  });
  group.addEventListener('focusout', (e) => {
    if (!group.contains(e.relatedTarget as Node | null)) setOpen(false);
  });
  panel.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setOpen(false);
  });
  document.addEventListener('click', (e) => {
    if (!group.contains(e.target as Node)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      button.focus();
    }
  });
});

/* ---------- Active navigation (scroll tracking on the Home page) ---------- */
// Navbar links are pages (Home, Lab, Writing) plus Contact. Each one lists, in data-spy, the id it stands for.
// The "On this page" menu links point at one section each, through their #hash.
const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'));
const sideLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-side-link]'));
const topEl = document.getElementById('top');
// While the Lab, Writing or Contact section is in view, the matching navbar link is active. Any other section is "Home".
const NAV_FOR_SECTION: Record<string, string> = { 'lab-preview': 'lab', writing: 'writing', contact: 'contact' };
const sections = sideLinks
  .map((l) => document.getElementById(l.hash.slice(1)))
  .filter((el, i, arr): el is HTMLElement => el !== null && arr.indexOf(el) === i);

function setActive(sectionId: string): void {
  const navKey = NAV_FOR_SECTION[sectionId] ?? 'home';
  for (const link of navLinks) {
    // A link is active if it stands for the current page area, or (in the full menu) points at the current section.
    if (link.dataset['spy'] === navKey || link.hash === `#${sectionId}`) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
  for (const link of sideLinks) {
    if (link.hash === `#${sectionId}`) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
}

if (sections.length > 0) {
  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        // While the hero at the top of the page is in view, About is the active section.
        setActive(entry.target.id === 'top' ? 'about' : entry.target.id);
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((s) => spy.observe(s));
  if (topEl) spy.observe(topEl);
  // At the very bottom of the page the last section can never reach the middle of the screen, so it is set here.
  const last = sections[sections.length - 1];
  if (last) {
    window.addEventListener(
      'scroll',
      () => {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) setActive(last.id);
      },
      { passive: true },
    );
  }
  // Home and About are active from the first paint, before the scroll tracker has reported anything.
  if (topEl && window.scrollY < 80) setActive('about');
}

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (reduceMotion) {
  revealEls.forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
} else {
  revealEls.forEach((el) => {
    const delay = Number(el.dataset.revealDelay ?? 0) / 1000;
    inView(
      el,
      () => {
        animate(el, { opacity: 1, transform: 'translateY(0px)' }, { duration: 0.6, delay, ease: 'easeOut' });
      },
      { margin: '0px 0px -10% 0px' },
    );
  });
}

/* ---------- Copy email ---------- */
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  const label = btn.querySelector<HTMLElement>('[data-copy-label]');
  const original = label?.textContent ?? '';
  btn.addEventListener('click', async () => {
    const text = btn.dataset.copy ?? '';
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      ta.remove();
    }
    if (label) label.textContent = ok ? 'Copied!' : 'Copy failed';
    window.setTimeout(() => {
      if (label) label.textContent = original;
    }, 2000);
  });
});

/* ---------- Back to top ---------- */
const toTop = document.querySelector<HTMLButtonElement>('[data-to-top]');
if (toTop) {
  const update = (): void => {
    toTop.hidden = window.scrollY < 700;
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    document.getElementById('top')?.focus({ preventScroll: true });
  });
}

/* ---------- Booking dialog (iframe loads only on first open) ---------- */
const bookDialog = document.querySelector<HTMLDialogElement>('[data-book-dialog]');
if (bookDialog) {
  const frame = bookDialog.querySelector<HTMLIFrameElement>('iframe');
  let lastTrigger: HTMLElement | null = null;

  document.querySelectorAll<HTMLElement>('[data-book-call]').forEach((btn) => {
    btn.addEventListener('click', () => {
      lastTrigger = btn;
      if (frame && !frame.getAttribute('src')) frame.setAttribute('src', frame.dataset.src ?? '');
      bookDialog.showModal();
    });
  });
  bookDialog.querySelector('[data-book-close]')?.addEventListener('click', () => bookDialog.close());
  bookDialog.addEventListener('click', (e) => {
    if (e.target === bookDialog) bookDialog.close();
  });
  bookDialog.addEventListener('close', () => lastTrigger?.focus());
}
