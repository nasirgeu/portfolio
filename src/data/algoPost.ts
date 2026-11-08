/**
 * Turns a short description of one algorithm into a full post, so every algorithm
 * post has the same simple structure: the idea, how it works, a small example,
 * what it costs, where it is good, where it struggles, and a link to the experiment.
 */

import type { Block, Post } from './writing';

export interface AlgoSpec {
  slug: string;
  /** Short name used in the title, e.g. "Bubble sort". */
  name: string;
  group: Post['group'];
  tags: readonly string[];
  summary: string;
  /** One or two paragraphs that explain the idea in plain language. */
  intro: readonly string[];
  steps: readonly string[];
  example: { intro: string; code: string; after?: string };
  /** Time, space and other properties. */
  facts: readonly string[];
  strengths: readonly string[];
  limits: readonly string[];
  /** What to do in the Lab, and which experiment it is in. */
  lab: { slug: string; name: string; tryText: string };
}

/**
 * The example introduction can hold sentences and data (a list of numbers, the processes, the gaps)
 * separated by blank lines. A part that ends with ":", "." or "?" is a sentence; any other part is data
 * and is shown in a code block so its spacing and line breaks are kept.
 */
function exampleIntro(text: string): Block[] {
  return text.split('\n\n').map((part): Block => {
    const t = part.trim();
    return /[:.?]$/.test(t) ? { type: 'p', text: t } : { type: 'code', code: t };
  });
}

export function buildPost(spec: AlgoSpec, date: string): Post {
  const body: Block[] = [
    ...spec.intro.map((text): Block => ({ type: 'p', text })),
    { type: 'h2', text: 'How it works' },
    { type: 'list', items: spec.steps },
    { type: 'h2', text: 'A small example' },
    ...exampleIntro(spec.example.intro),
    { type: 'code', code: spec.example.code },
    ...(spec.example.after ? [{ type: 'p', text: spec.example.after } as Block] : []),
    { type: 'h2', text: 'What to know about its cost' },
    { type: 'list', items: spec.facts },
    { type: 'h2', text: 'Where it works well' },
    { type: 'list', items: spec.strengths },
    { type: 'h2', text: 'Where it struggles' },
    { type: 'list', items: spec.limits },
    { type: 'h2', text: 'Try it yourself' },
    { type: 'p', text: spec.lab.tryText },
    { type: 'link', text: `Open the ${spec.lab.name} experiment`, href: `/lab/${spec.lab.slug}` },
  ];
  return {
    slug: spec.slug,
    title: `${spec.name}, explained`,
    summary: spec.summary,
    date,
    group: spec.group,
    tags: spec.tags,
    body,
  };
}
