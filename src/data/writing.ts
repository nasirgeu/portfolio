/**
 * Posts for the Writing section. To add a post, add one object to `posts`.
 * Each post is a list of simple blocks, so no extra tools or libraries are needed.
 * Newest posts go first.
 */

import { buildPost } from './algoPost';
import { osSpecs } from './algoSpecs/os';
import { sortingSpecs } from './algoSpecs/sorting';
import { searchingSpecs } from './algoSpecs/searching';
import { graphSpecs } from './algoSpecs/graphs';

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'list'; items: readonly string[] }
  | { type: 'code'; caption?: string; code: string }
  | { type: 'link'; text: string; href: string };

export interface Post {
  slug: string;
  title: string;
  /** One or two sentences shown on cards and in search results. */
  summary: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  /** The topic the post is listed under on the Writing page. */
  group: 'Operating Systems' | 'Sorting' | 'Searching' | 'Graphs';
  tags: readonly string[];
  body: readonly Block[];
}

export const writingSection = {
  eyebrow: 'Writing',
  heading: 'Notes on how things work.',
  intro:
    'Short explanations of ideas I enjoy, written in plain language. Most of them go with an experiment in the Engineering Lab, so you can read the idea and then try it.',
  allPosts: 'All posts',
  emptyNote: 'New posts are coming soon.',
};

/** Longer posts that compare several algorithms. These are shown first, and on the Home page. */
const overviewPosts: readonly Post[] = [
  {
    slug: 'more-memory-more-page-faults',
    title: 'When more memory causes more page faults',
    summary:
      "With FIFO page replacement, giving a program more frames can sometimes make it fault more, not less. Here's a small example you can run yourself.",
    date: '2026-11-08',
    group: 'Operating Systems',
    tags: ['Operating Systems', 'Page replacement'],
    body: [
      {
        type: 'p',
        text: "It sounds obvious that more memory should never hurt. If a program has more frames to keep pages in, it should fault less often. For some page replacement algorithms this is true, but not for FIFO.",
      },
      { type: 'h2', text: 'A quick reminder' },
      {
        type: 'p',
        text: 'A page fault happens when the program asks for a page that is not in memory. If every frame is full, the system must remove one page to make room. FIFO removes the page that has been in memory the longest, without checking how useful it still is.',
      },
      { type: 'h2', text: 'The example' },
      { type: 'p', text: 'Use this list of page requests:' },
      { type: 'code', code: '1 2 3 4 1 2 5 1 2 3 4 5' },
      {
        type: 'list',
        items: [
          'With 3 frames, FIFO causes 9 page faults.',
          'With 4 frames, FIFO causes 10 page faults.',
        ],
      },
      {
        type: 'p',
        text: 'One extra frame made the result worse. This is known as Belady\'s anomaly.',
      },
      { type: 'h2', text: 'Why it happens' },
      {
        type: 'p',
        text: 'FIFO only looks at when a page arrived, not at how often it is used. With 4 frames, the pages in memory at each moment are different from the pages kept with 3 frames, and here that difference leads to removing pages that are needed again soon.',
      },
      {
        type: 'p',
        text: 'LRU and Optimal do not have this problem. Whatever frames they have with a smaller memory are always also kept with a larger one, so adding memory can never increase their faults.',
      },
      { type: 'h2', text: 'Try it yourself' },
      {
        type: 'p',
        text: 'Open the Page Replacement experiment, enter the list above, and compare FIFO with 3 frames and with 4 frames. Then switch to LRU and see how the numbers change.',
      },
      { type: 'link', text: 'Open the Page Replacement experiment', href: '/lab/page-replacement' },
    ],
  },
  {
    slug: 'first-fit-best-fit-worst-fit',
    title: 'First fit, best fit and worst fit: what actually changes',
    summary:
      'The same request can land in three different places depending on the strategy. A small example shows what each one picks and what it leaves behind.',
    date: '2026-11-08',
    group: 'Operating Systems',
    tags: ['Operating Systems', 'Memory allocation'],
    body: [
      {
        type: 'p',
        text: 'When a program asks for memory, the system looks through the free gaps and picks one. First fit, best fit and worst fit are three simple ways of picking. They all work, but they leave memory in different shapes.',
      },
      { type: 'h2', text: 'The example' },
      { type: 'p', text: 'Say these are the free gaps, in address order (sizes in KB), and a program asks for 212 KB:' },
      { type: 'code', code: '100   500   200   300   600' },
      {
        type: 'list',
        items: [
          'First fit takes the first gap that is big enough: 500 KB. It leaves 288 KB.',
          'Best fit takes the smallest gap that is big enough: 300 KB. It leaves 88 KB.',
          'Worst fit takes the largest gap: 600 KB. It leaves 388 KB.',
        ],
      },
      { type: 'h2', text: 'What each one is trying to do' },
      {
        type: 'list',
        items: [
          'First fit is fast because it stops searching as soon as it finds a gap.',
          'Best fit wastes the least space on this request, but it tends to leave very small gaps that are hard to use.',
          'Worst fit hopes the leftover piece is still big enough to be useful later.',
        ],
      },
      { type: 'h2', text: 'The problem they all share' },
      {
        type: 'p',
        text: 'Over time, allocating and freeing blocks breaks free memory into many small gaps. You can end up with plenty of free memory in total, but no single gap big enough for a new request. This is called external fragmentation. Merging neighbouring free gaps when a block is freed helps, but it does not remove the problem.',
      },
      { type: 'h2', text: 'Try it yourself' },
      {
        type: 'p',
        text: 'In the Memory Allocation experiment, enter a series of allocations and frees, then run the same list with each strategy and compare the memory maps and the largest free gap.',
      },
      { type: 'link', text: 'Open the Memory Allocation experiment', href: '/lab/memory-allocation' },
    ],
  },
  {
    slug: 'same-result-different-work',
    title: 'Same result, different work: comparing sorting algorithms',
    summary:
      'Every sorting algorithm gives the same sorted list. What changes is how much work it does to get there, and that is what the step-by-step view makes visible.',
    date: '2026-11-08',
    group: 'Sorting',
    tags: ['Algorithms', 'Sorting'],
    body: [
      {
        type: 'p',
        text: 'If you sort the same list with bubble sort or with merge sort, you get the same answer. The difference is the work done on the way, and that difference grows quickly as the list gets longer.',
      },
      { type: 'h2', text: 'Why the work differs' },
      {
        type: 'list',
        items: [
          'Bubble sort repeatedly compares neighbours and swaps them. It is simple, but the work grows with the square of the list size (O(n²)).',
          'Merge sort splits the list, sorts the halves and merges them. The work grows like n log n, and equal items keep their original order (it is stable).',
          'Quick sort picks a pivot and splits the list around it. It is usually very fast, about n log n, but a bad choice of pivot can make it O(n²).',
          'Counting sort does not compare items at all. It counts how many times each value appears, so it is very fast when the values are in a small range.',
        ],
      },
      { type: 'h2', text: 'A feeling for the numbers' },
      {
        type: 'p',
        text: 'For 1,000 items, n² is about 1,000,000 steps, while n log n is only about 10,000. That is roughly a hundred times less work, and the gap keeps widening as the list grows.',
      },
      { type: 'h2', text: 'What the step view shows' },
      {
        type: 'p',
        text: 'Reading the complexity table is one thing. Watching an algorithm compare and swap, one step at a time, shows where the work goes. The Sorting experiment records every comparison and swap with a short explanation, and you can compare two algorithms on the same list.',
      },
      { type: 'link', text: 'Open the Sorting experiment', href: '/lab/sorting' },
    ],
  },
];

/** One post for every algorithm in the Engineering Lab, built from the short descriptions in algoSpecs. */
const algorithmPosts: readonly Post[] = [...osSpecs, ...sortingSpecs, ...searchingSpecs, ...graphSpecs].map((s) =>
  buildPost(s, '2026-11-08'),
);

export const posts: readonly Post[] = [...overviewPosts, ...algorithmPosts];

/** The comparison posts, shown as "start here" cards on the Writing page. */
export const featuredPosts: readonly Post[] = overviewPosts;

export const groups: readonly Post['group'][] = ['Operating Systems', 'Sorting', 'Searching', 'Graphs'];

export const getPost =(slug: string): Post | undefined => posts.find((p) => p.slug === slug);

/** Neighbours in the list, for the "previous / next" links on a post page. */
export function getPostNeighbours(slug: string): { newer: Post | undefined; older: Post | undefined } {
  const i = posts.findIndex((p) => p.slug === slug);
  return { newer: i > 0 ? posts[i - 1] : undefined, older: i >= 0 ? posts[i + 1] : undefined };
}

/** A shorter title for the sidebar: "Heap sort, explained" becomes "Heap sort". */
export const shortTitle = (post: Post): string => post.title.replace(/, explained$/, '');

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Rough reading time at 200 words a minute, never less than 1. */
export function readingMinutes(post: Post): number {
  const words = post.body
    .map((b) => {
      if (b.type === 'list') return b.items.join(' ');
      if (b.type === 'code') return '';
      return b.text;
    })
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
