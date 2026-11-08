// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Update SITE_URL (or set the SITE_URL env var in Cloudflare Pages) once you
// know your final domain. It is used for the sitemap, canonical URLs and OG tags.
const site = process.env.SITE_URL ?? 'https://nasirgeu.mohdnasir4257.workers.dev';

export default defineConfig({
  site,
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'always',
  },
  prefetch: { prefetchAll: false },
});
