/**
 * Share button for writing posts.
 *
 * On a phone or tablet it opens the system share sheet (WhatsApp, Messages and so on). Everywhere else it copies the link
 * and says so. One delegated listener, so it keeps working after the Writing pages swap their content in place.
 */

const label = (btn: HTMLElement): HTMLElement | null => btn.querySelector<HTMLElement>('[data-share-label]');

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers or blocked clipboard: select the text in a temporary field and copy it.
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    field.remove();
    return ok;
  }
}

document.addEventListener('click', async (e) => {
  const btn = (e.target as Element | null)?.closest<HTMLElement>('[data-share]');
  if (!btn) return;
  const title = btn.dataset['shareTitle'] ?? document.title;
  const url = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? location.href;
  const touch = window.matchMedia('(pointer: coarse)').matches;

  if (touch && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url });
    } catch {
      /* the visitor closed the share sheet */
    }
    return;
  }

  const text = label(btn);
  const original = text?.dataset['original'] ?? text?.textContent ?? 'Share';
  if (text) text.dataset['original'] = original;
  const ok = await copy(url);
  if (text) {
    text.textContent = ok ? 'Link copied' : 'Copy failed';
    window.setTimeout(() => {
      text.textContent = original;
    }, 2500);
  }
});

// Marks this file as a module, so its names stay private.
export {};
