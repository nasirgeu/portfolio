/**
 * Related links between the Writing posts and the Engineering Lab, worked out from data that is already on the site.
 * A post is linked to an experiment when its own body links to that experiment (the "try it" button at the end).
 */
import { posts, type Post } from '../data/writing';
import { experiments, type Experiment } from '../data/labExperiments';

export interface RelatedItem {
  href: string;
  title: string;
  hint: string;
}

const postHref = (p: Post): string => `/writing/${p.slug}/`;

/** The experiment a post links to, if any. */
export function labFor(post: Post): Experiment | undefined {
  for (const block of post.body) {
    if (block.type !== 'link') continue;
    const slug = block.href.replace(/^\/lab\//, '').replace(/\/$/, '');
    const found = experiments.find((e) => e.slug === slug);
    if (found) return found;
  }
  return undefined;
}

const asItem = (p: Post): RelatedItem => ({ href: postHref(p), title: p.title, hint: p.group });

/** Up to `max` other posts about the same experiment, then the same topic, plus the experiment itself. */
export function relatedForPost(post: Post, max = 3): RelatedItem[] {
  const lab = labFor(post);
  const sameLab = lab ? posts.filter((p) => p.slug !== post.slug && labFor(p)?.slug === lab.slug) : [];
  const sameGroup = posts.filter((p) => p.slug !== post.slug && p.group === post.group && !sameLab.includes(p));
  const chosen = [...sameLab, ...sameGroup].slice(0, max).map(asItem);
  if (lab) {
    chosen.push({ href: `/lab/${lab.slug}/`, title: `Try it: ${lab.name}`, hint: 'Engineering Lab' });
  }
  return chosen;
}

/** The posts written about one experiment, to read next to it. */
export function relatedForExperiment(slug: string, max = 3): RelatedItem[] {
  const written = posts.filter((p) => labFor(p)?.slug === slug).slice(0, max).map(asItem);
  return [...written, { href: '/writing/', title: 'All writing', hint: 'Writing' }];
}
