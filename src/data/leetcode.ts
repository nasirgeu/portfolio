/**
 * LeetCode numbers for the highlight cards under the hero.
 * Source: the public LeetCode profile (checked Nov 2026). These are typed in, not loaded live,
 * so update them by hand when you want them current.
 */

export const leetcode = {
  profileUrl: 'https://leetcode.com/u/Mohd_Nasir/',
  /** Problems solved, and how many problems LeetCode has, for each difficulty. */
  solved: {
    easy: { solved: 549, total: 975 },
    medium: { solved: 924, total: 2145 },
    hard: { solved: 274, total: 989 },
  },
  /** LeetCode's "Beats" percentage: overall, and for each difficulty. */
  beats: { overall: 99.9, easy: 99.91, medium: 99.9, hard: 99.73 },
  contests: {
    attended: 46,
    current: 1770,
    /** The highest rating, rounded down (1989.58 is shown as 1,989). */
    peak: 1989,
    topPercent: 9.8,
  },
} as const;

/** Contest rating after each contest: [date, rating]. */
export const ratingHistory: readonly (readonly [string, number])[] = [
  ['2022-02-05', 1479],
  ['2022-06-11', 1474],
  ['2022-11-26', 1484],
  ['2022-12-10', 1563],
  ['2022-12-11', 1545],
  ['2023-03-18', 1576],
  ['2023-03-19', 1563],
  ['2023-06-10', 1656],
  ['2023-06-25', 1699],
  ['2023-07-02', 1736],
  ['2023-07-16', 1743],
  ['2023-07-22', 1778],
  ['2023-07-23', 1769],
  ['2023-07-30', 1812],
  ['2023-08-05', 1822],
  ['2023-08-06', 1808],
  ['2023-08-13', 1830],
  ['2023-08-19', 1861],
  ['2023-08-20', 1887],
  ['2023-08-27', 1861],
  ['2023-09-16', 1858],
  ['2023-09-17', 1878],
  ['2023-09-24', 1955],
  ['2023-12-09', 1976],
  ['2023-12-23', 1990],
  ['2023-12-31', 1954],
  ['2024-01-06', 1970],
  ['2024-01-07', 1968],
  ['2024-01-14', 1927],
  ['2024-01-20', 1934],
  ['2024-01-28', 1927],
  ['2024-02-04', 1941],
  ['2024-02-17', 1927],
  ['2024-02-18', 1939],
  ['2024-03-02', 1902],
  ['2024-03-10', 1855],
  ['2024-03-16', 1798],
  ['2024-03-24', 1856],
  ['2024-03-31', 1822],
  ['2024-04-07', 1821],
  ['2024-04-13', 1835],
  ['2024-04-14', 1805],
  ['2024-08-04', 1795],
  ['2024-10-27', 1769],
  ['2024-12-07', 1716],
  ['2024-12-08', 1770],
];
