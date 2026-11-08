/**
 * Central site configuration. Edit this file to update your personal details.
 *
 * Any link left as an empty string ("") is treated as "not set yet": the UI
 * hides it or shows a clearly marked disabled state.
 */

export interface SocialLink {
  label: string;
  url: string;
  icon: 'github' | 'linkedin' | 'code' | 'mail';
}

export const site = {
  name: 'Mohd Nasir',
  title: 'Software Engineer | C++ Developer | Systems Engineer',
  company: 'Tally Solutions',
  headline: ['Building Better', 'and Faster Software.'],
  description:
    "I'm a Software Engineer at Tally Solutions with around 2 years of experience in C++. I work on core software components, memory management, multithreading and performance improvement. I enjoy solving difficult problems and building software that is fast, reliable and efficient.",
  metaDescription:
    'Mohd Nasir is a Software Engineer at Tally Solutions. He works with C++, multithreading, memory management, performance improvement, and data structures and algorithms.',
  location: 'Bangalore, India',

  email: 'mohdnasir4257@gmail.com',

  /** Resume PDF lives in /public. */
  resumeUrl: '/Mohd-Nasir-Resume.pdf',
  resumeFileName: 'Mohd-Nasir-Resume.pdf',

  /**
   * Your Calendly (or Cal.com) scheduling link, e.g. https://calendly.com/<you>/30min
   * Leave "" and the "Book a Call" buttons stay hidden.
   */
  bookingUrl: 'https://calendly.com/mohdnasir4257/30min',
  bookingLabel: 'Book a Call',

  availability: {
    show: true,
    /** 'open' = green, 'busy' = amber. */
    status: 'open' as 'open' | 'busy',
    label: 'Open to opportunities',
  },

  socials: [
    { label: 'GitHub', url: 'https://github.com/nasirgeu', icon: 'github' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/nasirgeu/', icon: 'linkedin' },
    { label: 'LeetCode', url: 'https://leetcode.com/u/Mohd_Nasir/', icon: 'code' },
  ] satisfies SocialLink[],

  /** Optional: a 1200x630 PNG in /public for social previews. */
  ogImage: '/og-image.png',
} as const;

/**
 * Proof strip under the hero. Only facts you can back up.
 * `href` is where "see source" points ("" hides the link).
 */
export const proof = [
  {
    value: '1,700+',
    label: 'LeetCode problems solved',
    sourceLabel: 'LeetCode profile',
    href: 'https://leetcode.com/u/Mohd_Nasir/',
  },
  {
    value: '1989',
    label: 'highest LeetCode contest rating',
    sourceLabel: 'LeetCode profile',
    href: 'https://leetcode.com/u/Mohd_Nasir/',
  },
  {
    value: '90%',
    label: 'faster than the system allocator in a measured benchmark',
    sourceLabel: 'About the memory manager',
    href: '#projects',
  },
] as const;

/**
 * Every navbar link. On the Home page the navbar shows only Home, Lab, Writing and Contact (the other sections are in
 * the "On this page" menu). On the Lab and Writing pages it shows the full bar, with the sections grouped under "Work".
 */
export const navItems = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'achievements', label: 'Competitive' },
  { id: 'education', label: 'Education' },
  { id: 'lab', label: 'Lab', href: '/lab' },
  { id: 'writing', label: 'Writing', href: '/writing' },
  { id: 'contact', label: 'Contact' },
] as const;

export const about = {
  heading: 'Working on the core of software systems.',
  paragraphs: [
    "I'm a Software Engineer at Tally Solutions with around 2 years of experience in C++. Most of my work involves building core software components, working with multiple threads, managing memory and improving performance.",
    "At work, I've built a custom memory manager, worked on a reader-writer locking mechanism for shared data and improved core data types using faster comparison techniques. I enjoy understanding how things work behind the scenes and finding ways to make software faster and more reliable.",
    "Outside work, I enjoy competitive programming and solving challenging problems. I've solved more than 1,700 problems on LeetCode and reached a highest contest rating of 1989.",
  ],
  principlesLabel: 'My approach to engineering',
  principles: [
    {
      title: 'Understand the problem first',
      text: 'I like to measure performance and find the real problem before making changes.',
    },
    {
      title: 'Use memory wisely',
      text: 'I focus on how memory is allocated, used and managed.',
    },
    {
      title: 'Build reusable components',
      text: 'I prefer building small, well-organised components that can be reused across different parts of a system.',
    },
  ],
} as const;

export interface ExperienceEntry {
  company: string;
  role: string;
  period: string;
  location: string;
  roles?: readonly { title: string; period: string }[];
  summary: string;
  points: readonly string[];
  tech: readonly string[];
}

export const experience: readonly ExperienceEntry[] = [
  {
    company: 'Tally Solutions',
    role: 'Software Engineer',
    period: 'September 2024 – Present',
    location: 'Bangalore, India',
    summary:
      'I work on core C++ components and help make software faster, more reliable and more efficient.',
    points: [
      'Built a reader-writer locking mechanism for shared data. It allows multiple threads to read data at the same time, while only one thread can modify it. This approach was later reused in other components.',
      'Worked on root container management and version finalization to improve the reliability of versioned data.',
      'Built a custom memory manager in C++ that was 90% faster than the system allocator in the measured benchmark. It uses block-based metadata and atomic operations to manage memory safely across multiple threads.',
      'Designed and added a stack-based variable data type to the core data types layer. I also completed the planned milestones on time.',
      'Made comparison operations faster across different data types using branchless logic and a common interface.',
      'Added compound assignment operations to the execution engine. I also contributed to reviewing the design and CPU performance of startup-flow gates and paused-queue interfaces.',
      'Built logging and tracing systems to monitor application behaviour and make debugging easier.',
    ],
    tech: ['C++', 'Concurrency', 'Atomics', 'Memory Management', 'Performance Optimization'],
  },
  {
    company: 'BharatRide',
    role: 'Web Development Intern',
    period: 'January 2023 – March 2023',
    location: 'Dehradun, India',
    summary: 'Worked on website development and made improvements to website performance.',
    points: [
      'Built responsive web pages using HTML, CSS and JavaScript.',
      'Worked with the team to add new website features.',
      'Fixed bugs and improved page loading speed.',
      'Made changes to improve the overall user experience.',
    ],
    tech: ['HTML', 'CSS', 'JavaScript'],
  },
];

export const education = {
  university: 'Graphic Era Deemed to be University',
  degree: 'Bachelor of Technology in Computer Science',
  period: 'September 2020 – June 2024',
  location: 'Dehradun, Uttarakhand',
  cgpa: '9.10',
  cgpaScale: '10',
} as const;

export const schooling = [
  {
    school: 'Saraswati Vidya Mandir',
    level: 'Class 12 – PCM',
    board: 'U.P. Board',
    period: '2018 – 2020',
    location: 'Afzalgarh, Uttar Pradesh',
    score: '83.40%',
  },
  {
    school: 'Saraswati Vidya Mandir',
    level: 'Class 10',
    board: 'U.P. Board',
    period: '2016 – 2018',
    location: 'Afzalgarh, Uttar Pradesh',
    score: '84.83%',
  },
] as const;

export const contact = {
  heading: "Let's connect.",
  paragraphs: [
    "I'm always happy to connect with people who are interested in software development, C++, system programming and solving interesting technical problems.",
    'If you have a job opportunity or simply want to talk about technology, feel free to get in touch.',
  ],
} as const;
