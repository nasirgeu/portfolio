export interface Achievement {
  id: string;
  /** Large figure shown on the card. */
  value: string;
  label: string;
  detail: string;
  icon: 'trophy' | 'medal' | 'target' | 'award';
  /** Set to false for anything unconfirmed. Unverified items show a tag in dev only. */
  verified: boolean;
}

export const competitive = {
  heading: 'I enjoy solving challenging problems.',
  intro:
    'I regularly practise data structures and algorithms to improve my problem-solving skills. Competitive programming has helped me think through difficult problems, find better solutions and write more efficient code.',
  buttonLabel: 'View My LeetCode Profile',
} as const;

/**
 * Sources: LeetCode public profile (checked Nov 2026: 1,747 solved, peak contest
 * rating 1989.58 in Biweekly Contest 120, 46 contests attended) and the resume.
 */
export const achievements: readonly Achievement[] = [
  {
    id: 'leetcode-solved',
    value: '1,700+',
    label: 'LeetCode Problems Solved',
    detail:
      'Solved problems across Easy, Medium and Hard levels. I have also practised additional problems on GeeksforGeeks and Coding Ninjas.',
    icon: 'target',
    verified: true,
  },
  {
    id: 'leetcode-rating',
    value: '1989',
    label: 'Highest Contest Rating',
    detail: 'Reached a peak rating of 1989 in LeetCode Biweekly Contest 120 after taking part in 46 contests.',
    icon: 'trophy',
    verified: true,
  },
  {
    id: 'leetcode-knight',
    value: 'Knight',
    label: 'LeetCode Badge',
    detail: 'Earned the Knight badge, placing me among the top 5% of contest participants.',
    icon: 'medal',
    verified: true,
  },
  {
    id: 'hackwithinfy',
    value: 'Top 100 Finalist',
    label: 'Infosys HackWithInfy 2024',
    detail: 'Reached the top 100 finalists in the HackWithInfy competition.',
    icon: 'award',
    verified: true,
  },
  {
    id: 'coding-ninjas',
    value: 'AIR 3',
    label: 'Coding Ninjas Competition',
    detail: 'Secured All India Rank 3 in the Coding Ninjas coding competition.',
    icon: 'trophy',
    verified: true,
  },
  {
    id: 'geu-acm',
    value: 'Winner',
    label: 'GEU-ACM Software Development Hackathon',
    detail:
      'Was part of the winning team in the Software Development Hackathon. Also secured 4th place in the college-level Crack-C competition.',
    icon: 'award',
    verified: true,
  },
];
