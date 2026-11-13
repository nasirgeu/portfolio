/**
 * Central SEO helpers: absolute URLs and the JSON-LD graph for every page.
 *
 * Every page gets one @graph. The Person and WebSite nodes have stable @id values, so every page points at the same
 * two nodes. Inner pages add a WebPage and a BreadcrumbList, and each writing post adds a BlogPosting. Only facts that
 * are already on the site are used: nothing here is invented.
 */
import { site, education } from '../data/site';

/** Used only if the build has no `site` setting. astro.config.mjs normally provides it. */
const FALLBACK_ORIGIN = 'https://mohdnasir.site';

export interface Crumb {
  name: string;
  /** Path on this site, such as "/lab/". */
  path: string;
}

export interface ArticleInfo {
  title: string;
  description: string;
  /** ISO date (YYYY-MM-DD) from the post data. */
  datePublished: string;
  section?: string | undefined;
  keywords?: readonly string[] | undefined;
}

export function siteOrigin(base: URL | undefined): string {
  return (base ?? new URL(FALLBACK_ORIGIN)).origin;
}

/** Absolute URL for a path such as "/writing/". */
export function absoluteUrl(base: URL | undefined, path: string): string {
  return new URL(path, siteOrigin(base)).href;
}

export const personId = (base: URL | undefined): string => `${siteOrigin(base)}/#person`;
export const websiteId = (base: URL | undefined): string => `${siteOrigin(base)}/#website`;

export interface GraphInput {
  base: URL | undefined;
  /** Path of the page being built, such as "/lab/sorting/". */
  path: string;
  title: string;
  description: string;
  crumbs?: readonly Crumb[] | undefined;
  article?: ArticleInfo | undefined;
  /** Absolute URL of the social preview image, if there is one. */
  image?: string | null | undefined;
}

/** The Person and WebSite nodes (the same on every page). */
function siteNodes(base: URL | undefined, description: string): Record<string, unknown>[] {
  const origin = siteOrigin(base);
  const sameAs = site.socials.map((s) => s.url).filter((u) => u.length > 0);
  return [
    {
      '@type': 'Person',
      '@id': personId(base),
      name: site.name,
      jobTitle: 'Software Engineer',
      url: `${origin}/`,
      description,
      worksFor: { '@type': 'Organization', name: site.company },
      alumniOf: { '@type': 'CollegeOrUniversity', name: education.university },
      knowsAbout: ['C++', 'C', 'Systems Programming', 'Memory Management', 'Performance Optimization', 'Data Structures and Algorithms'],
      ...(sameAs.length > 0 ? { sameAs } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': websiteId(base),
      url: `${origin}/`,
      name: `${site.name} | Portfolio`,
      inLanguage: 'en',
      publisher: { '@id': personId(base) },
    },
  ];
}

/** The complete JSON-LD object for one page. */
export function buildGraph(input: GraphInput): Record<string, unknown> {
  const { base, path, title, description, crumbs, article, image } = input;
  const url = absoluteUrl(base, path);
  const isHome = path === '/';
  const graph: Record<string, unknown>[] = [...siteNodes(base, site.metaDescription)];

  graph.push({
    '@type': isHome ? 'ProfilePage' : 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: 'en',
    isPartOf: { '@id': websiteId(base) },
    ...(isHome ? { mainEntity: { '@id': personId(base) } } : { about: { '@id': personId(base) } }),
    ...(isHome || !crumbs?.length ? {} : { breadcrumb: { '@id': `${url}#breadcrumb` } }),
  });

  if (!isHome && crumbs?.length) {
    const trail: Crumb[] = [{ name: 'Home', path: '/' }, ...crumbs];
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: trail.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: absoluteUrl(base, c.path),
      })),
    });
  }

  if (article) {
    graph.push({
      '@type': 'BlogPosting',
      '@id': `${url}#article`,
      mainEntityOfPage: { '@id': `${url}#webpage` },
      headline: article.title,
      description: article.description,
      datePublished: article.datePublished,
      inLanguage: 'en',
      author: { '@id': personId(base) },
      publisher: { '@id': personId(base) },
      ...(image ? { image } : {}),
      ...(article.section ? { articleSection: article.section } : {}),
      ...(article.keywords?.length ? { keywords: [...article.keywords].join(', ') } : {}),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
