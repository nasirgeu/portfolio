// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// The public address of the site. It is used for the sitemap, canonical URLs and OG tags.
// Set the SITE_URL environment variable to override it (for example for a preview build).
const site = process.env.SITE_URL ?? 'https://mohdnasir.site';

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
