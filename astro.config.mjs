// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// The public address of the site. It is used for the sitemap, canonical URLs and OG tags.
// Set the SITE_URL environment variable to override it (for example for a preview build).
const site = process.env.SITE_URL ?? 'https://mohdnasir.site';

/**
 * Real "last modified" dates for the sitemap: a writing post gets its own publish date from the post data.
 * No other page gets a date, because nothing else has a date that is known to be real. If the data cannot be
 * loaded, the sitemap is still built, just without dates.
 * @type {Promise<Map<string, string>> | undefined}
 */
let postDates;
const loadPostDates = () => {
  postDates ??= import('./src/data/writing.ts')
    .then((m) => new Map(m.posts.map((/** @type {{ slug: string; date: string }} */ p) => [p.slug, p.date])))
    .catch(() => new Map());
  return postDates;
};

export default defineConfig({
  site,
  integrations: [
    react(),
    sitemap({
      serialize: async (item) => {
        const match = item.url.match(/\/writing\/([^/]+)\/?$/);
        const date = match ? (await loadPostDates()).get(match[1] ?? '') : undefined;
        return date ? { ...item, lastmod: new Date(`${date}T00:00:00Z`).toISOString() } : item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'always',
  },
  prefetch: { prefetchAll: false },
});
