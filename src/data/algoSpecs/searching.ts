import type { AlgoSpec } from '../algoPost';

const LIST = '2 5 8 12 16 23 38 56 72 91';
const searchLab = (algo: string) => ({
  slug: 'searching',
  name: 'Searching',
  tryText: `Open the Searching experiment, enter the list from this post, set the target to 23, choose ${algo} and step through it. Then compare it with the other algorithms and look at how many positions each one checks.`,
});

export const searchingSpecs: readonly AlgoSpec[] = [
  {
    slug: 'linear-search',
    name: 'Linear search',
    group: 'Searching',
    tags: ['Algorithms', 'Searching'],
    summary: 'Linear search checks every item from the start until it finds the target or reaches the end. It works on any list, sorted or not.',
    intro: [
      'Linear search is the simplest way to find something. You look at the first item, then the next, and keep going until you find what you want or run out of items.',
      'It does not need the list to be sorted, which makes it the safe choice when you know nothing about the data.',
    ],
    steps: ['Start at the first position.', 'Compare the item with the target.', 'If it matches, stop: you found it.', 'If not, move to the next position. If you reach the end, the target is not in the list.'],
    example: {
      intro: `Search for 23 in this sorted list:\n\n${LIST}\n\nLinear search checks 2, 5, 8, 12, 16 and 23, so it takes:`,
      code: '6 checks (found at position 6)',
    },
    facts: ['Best case O(1) when the target is first.', 'Average and worst case O(n).', 'Uses O(1) extra space and needs no sorted list.'],
    strengths: ['Works on unsorted data.', 'Very simple, and fast enough for short lists.'],
    limits: ['Slow for long lists, because it may check every item.', 'Ignores any order the data has.'],
    lab: searchLab('Linear Search'),
  },
  {
    slug: 'binary-search',
    name: 'Binary search',
    group: 'Searching',
    tags: ['Algorithms', 'Searching'],
    summary: 'Binary search needs a sorted list. It checks the middle item and throws away the half that cannot contain the target.',
    intro: [
      'Binary search is like guessing a number between 1 and 100 when someone tells you "higher" or "lower" after each guess. If you always guess the middle, you cut the possibilities in half every time.',
      'It only works on a sorted list, because the order is what tells you which half to discard.',
    ],
    steps: ['Look at the middle item of the current range.', 'If it equals the target, you are done.', 'If the target is smaller, keep only the left half. If it is bigger, keep only the right half.', 'Repeat until you find the target or the range is empty.'],
    example: {
      intro: `Search for 23 in this sorted list:\n\n${LIST}\n\nBinary search checks 16 (too small), then 56 (too big), then 23 (found), so it takes:`,
      code: '3 checks',
      after: 'Linear search needed 6 checks for the same target.',
    },
    facts: ['Best case O(1).', 'Average and worst case O(log n): doubling the list adds only one more check.', 'Needs a sorted list and uses O(1) extra space.'],
    strengths: ['Extremely fast on large sorted lists.', 'A list of a million items needs only about 20 checks.'],
    limits: ['The list must be sorted first, which costs time if it is not.', 'Needs fast access to the middle item, so it suits arrays better than linked lists.'],
    lab: searchLab('Binary Search'),
  },
  {
    slug: 'jump-search',
    name: 'Jump search',
    group: 'Searching',
    tags: ['Algorithms', 'Searching'],
    summary: 'Jump search skips ahead in fixed-size blocks, then scans one block in order. It sits between linear and binary search.',
    intro: [
      'Jump search works on a sorted list. Instead of checking every item, it jumps ahead by a fixed number of positions, usually about the square root of the list length, until it passes the target.',
      'Then it goes back to the block it just skipped and scans that block one item at a time.',
    ],
    steps: ['Choose a block size, usually about the square root of the list length.', 'Jump from block to block until you reach one whose last item is at least the target.', 'Scan that block from the left, one item at a time.', 'If you find the target, stop. If the block does not contain it, the target is not in the list.'],
    example: {
      intro: `Search for 23 in this sorted list of 10 items:\n\n${LIST}\n\nThe block size is about 3. The search jumps to 8 (too small), then to 23 (big enough, so the jumping stops). It then goes back and scans 12 and 16 and finds 23. Total:`,
      code: '4 checks',
      after: 'Linear search needed 6 checks and binary search needed 3. On a much longer list, the gap between jump search and linear search grows quickly.',
    },
    facts: ['Average and worst case O(√n).', 'Uses O(1) extra space.', 'Needs a sorted list.'],
    strengths: ['Faster than linear search on large sorted lists.', 'Only moves forward, which suits data that is slow to read backwards.'],
    limits: ['Slower than binary search.', 'Needs a sorted list.'],
    lab: searchLab('Jump Search'),
  },
  {
    slug: 'interpolation-search',
    name: 'Interpolation search',
    group: 'Searching',
    tags: ['Algorithms', 'Searching'],
    summary: 'Interpolation search guesses where the target should be, based on its value, like looking for a name near the end of a phone book.',
    intro: [
      'When you look for "Zhang" in a phone book you do not open it in the middle. You open it near the end, because you expect that name to be there. Interpolation search does the same thing with numbers.',
      'It uses the target value and the values at the ends of the current range to estimate a position, then checks that position.',
    ],
    steps: ['Estimate a position from the target value and the values at both ends of the range.', 'Check the item at that position.', 'If it matches, stop. If it is too small, search to the right. If it is too big, search to the left.', 'Make a new estimate for the smaller range and repeat.'],
    example: {
      intro: `Search for 23 in this sorted list:\n\n${LIST}\n\nThe value 23 is closer to the start than the end of the value range, so the first estimate lands near the left side instead of the middle. The checks go 8, 12, 16 and then 23. Total:`,
      code: '4 checks',
      after: 'On this short list that is one more than binary search needed (3). Interpolation search pays off on long lists whose values are spread evenly.',
    },
    facts: ['About O(log log n) when the values are evenly spread.', 'Worst case O(n) when the values are very uneven.', 'Needs a sorted list and uses O(1) extra space.'],
    strengths: ['Very fast on evenly spread numbers.', 'Can beat binary search on large, smooth data.'],
    limits: ['Slow when values are clustered or grow very quickly.', 'Needs numbers, so that it can estimate a position.'],
    lab: searchLab('Interpolation Search'),
  },
];
