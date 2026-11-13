import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { check, finish } from './check.ts';

/**
 * Checks the BUILT site (the `dist` folder), so run it after a build: `node tests/seo.test.ts`.
 * It runs automatically after `npm run build` (the `postbuild` script), so a build that points at the wrong address fails
 * instead of being deployed.
 *
 * Rules:
 *  - no built file mentions "workers.dev";
 *  - every HTML page has a canonical link, og:url and JSON-LD on https://mohdnasir.site;
 *  - robots.txt and the sitemap use that address, and only writing posts carry a lastmod date;
 *  - the manifest, llms.txt and the icons exist.
 */

const SITE = process.env['SITE_URL'] ?? 'https://mohdnasir.site';
const DIST = 'dist';

if (!existsSync(DIST)) {
  console.log('No dist folder: build the site first (npm run build). Nothing was checked.');
  process.exit(process.env['CI'] || process.env['CF_PAGES'] || process.env['WORKERS_CI'] ? 1 : 0);
}

const TEXT = /\.(html|xml|txt|json|webmanifest|js|css|svg)$/i;
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk(DIST);
const rel = (p: string): string => p.slice(DIST.length + 1).replaceAll('\\', '/');
const read = (p: string): string => readFileSync(p, 'utf8');

console.log(`Built site: ${files.length} files in ${DIST}/`);

console.log('\nNo old address anywhere');
const mentions = files.filter((p) => TEXT.test(p) && /workers\.dev/i.test(read(p))).map(rel);
check('no built text file mentions workers.dev', mentions.length === 0, mentions.slice(0, 5).join(', '));

console.log('\nEvery page points at the real site address');
const pages = files.filter((p) => p.endsWith('index.html') || p.endsWith('404.html'));
check('there are built pages', pages.length > 0);
const badCanonical: string[] = [];
const badOgUrl: string[] = [];
const badJsonLd: string[] = [];
for (const p of pages) {
  const html = read(p);
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? '';
  const ogUrl = html.match(/<meta property="og:url" content="([^"]*)"/)?.[1] ?? '';
  if (!canonical.startsWith(`${SITE}/`)) badCanonical.push(`${rel(p)} (${canonical || 'missing'})`);
  if (!ogUrl.startsWith(`${SITE}/`)) badOgUrl.push(`${rel(p)} (${ogUrl || 'missing'})`);
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  let ok = false;
  try {
    const graph = ld ? JSON.parse(ld)['@graph'] : undefined;
    ok = Array.isArray(graph) && graph.some((n: { '@type'?: string; '@id'?: string }) => n['@type'] === 'Person' && n['@id'] === `${SITE}/#person`);
  } catch {
    ok = false;
  }
  if (!ok) badJsonLd.push(rel(p));
}
check('every canonical link uses the site address', badCanonical.length === 0, badCanonical.slice(0, 3).join('; '));
check('every og:url uses the site address', badOgUrl.length === 0, badOgUrl.slice(0, 3).join('; '));
check('every page has the Person JSON-LD with its stable @id', badJsonLd.length === 0, badJsonLd.slice(0, 3).join('; '));

console.log('\nRobots, sitemap and the other root files');
const robots = existsSync(join(DIST, 'robots.txt')) ? read(join(DIST, 'robots.txt')) : '';
check('robots.txt names the sitemap on the site address', robots.includes(`Sitemap: ${SITE}/sitemap-index.xml`));
const index = existsSync(join(DIST, 'sitemap-index.xml')) ? read(join(DIST, 'sitemap-index.xml')) : '';
check('sitemap-index.xml exists and uses the site address', index.includes(`<loc>${SITE}/`));
const sitemap = files.filter((p) => /sitemap-\d+\.xml$/.test(p)).map(read).join('\n');
const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1] ?? '');
check('the sitemap lists pages', locs.length > 0);
check('every sitemap URL is on the site address', locs.every((u) => u.startsWith(`${SITE}/`)));
const urlBlocks = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1] ?? '');
const datedNonPosts = urlBlocks.filter((b) => b.includes('<lastmod>') && !/<loc>[^<]*\/writing\/[^/<]+\/<\/loc>/.test(b));
check('only writing posts carry a lastmod date', datedNonPosts.length === 0, `${datedNonPosts.length} other pages have one`);

check('llms.txt exists', existsSync(join(DIST, 'llms.txt')));
const manifestPath = join(DIST, 'manifest.webmanifest');
let manifestOk = false;
try {
  const m = JSON.parse(read(manifestPath));
  manifestOk = Array.isArray(m.icons) && m.icons.length > 0 && m.icons.every((i: { src: string }) => existsSync(join(DIST, i.src)));
} catch {
  manifestOk = false;
}
check('the web manifest is valid and every icon it lists exists', manifestOk);
check('the old-address redirect for /sitemap.xml is configured', existsSync(join(DIST, '_redirects')) && read(join(DIST, '_redirects')).includes('/sitemap.xml /sitemap-index.xml'));

console.log('\nThe 404 page');
const notFound = existsSync(join(DIST, '404.html')) ? read(join(DIST, '404.html')) : '';
check('404.html asks search engines not to index it', /<meta name="robots" content="noindex/.test(notFound));

finish('built-site checks');
