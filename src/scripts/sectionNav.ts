/**
 * Sidebar navigation without a full page load (used by the Lab and Writing pages).
 *
 * Picking an item in the sidebar fetches that page, then swaps only the right-hand content and the sidebar's
 * highlighted item. The navbar, sidebar and footer stay where they are. If anything goes wrong the browser simply
 * follows the link as usual, so every page also works without this script.
 */

const CONTENT = '[data-swap-content]';
const NAVS = '[data-swap-nav]';

/** "/lab/sorting" -> "lab". */
const sectionOf = (url: URL): string => url.pathname.split('/')[1] ?? '';

/** The section's own index or one of its pages, such as /lab, /lab/ or /lab/sorting. */
const inSameSection = (url: URL): boolean =>
  url.origin === location.origin &&
  sectionOf(url) === sectionOf(new URL(location.href)) &&
  /^\/[^/]+(\/[^/]+)?\/?$/.test(url.pathname);

const samePage = (a: URL, b: URL): boolean => a.pathname.replace(/\/$/, '') === b.pathname.replace(/\/$/, '');

let latest = 0;

async function show(url: URL, push: boolean): Promise<void> {
  const ticket = ++latest;
  try {
    const res = await fetch(url.href, { headers: { Accept: 'text/html' } });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const next = new DOMParser().parseFromString(await res.text(), 'text/html');

    const nextContent = next.querySelector<HTMLElement>(CONTENT);
    const content = document.querySelector<HTMLElement>(CONTENT);
    if (!nextContent || !content) throw new Error('Not a page with a sidebar');
    if (ticket !== latest) return; // a newer click replaced this one

    // Sidebar: keep the elements, update what is highlighted.
    const nextNavs = next.querySelectorAll<HTMLElement>(NAVS);
    document.querySelectorAll<HTMLElement>(NAVS).forEach((nav, i) => {
      const fresh = nextNavs[i];
      if (fresh) nav.innerHTML = fresh.innerHTML;
    });

    // Right side: new content. React islands start up on their own when they are added to the page.
    content.innerHTML = nextContent.innerHTML;
    content.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });

    document.title = next.title;
    const description = next.querySelector('meta[name="description"]')?.getAttribute('content');
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    if (push) history.pushState({ swap: true }, '', url.href);

    window.scrollTo({ top: 0, behavior: 'auto' });
    const heading = content.querySelector<HTMLElement>('h1');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  } catch {
    location.href = url.href;
  }
}

if (document.querySelector(CONTENT)) {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as Element | null)?.closest<HTMLAnchorElement>(`${NAVS} a[href]`);
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (!inSameSection(url) || url.hash) return;
    e.preventDefault();
    if (samePage(url, new URL(location.href))) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    void show(url, true);
  });

  // Back and forward buttons.
  window.addEventListener('popstate', () => {
    const url = new URL(location.href);
    if (inSameSection(url)) void show(url, false);
  });
}
