/**
 * Projects. Keep descriptions high-level: never paste confidential source code
 * or internal details. Code snippets below are small, generic illustrations
 * written for this portfolio, not company code.
 */

export type ProjectCategory = 'Systems' | 'Full-stack' | 'Web & Apps';

export interface Project {
  id: string;
  title: string;
  tagline: string;
  category: ProjectCategory;
  summary: string;
  /** Shown under "What I worked on". */
  highlights: readonly string[];
  /** Optional extra list shown above the highlights. */
  extra?: { label: string; items: readonly string[] };
  tech: readonly string[];
  /** Layers of a simple architecture illustration, top to bottom. */
  architecture: readonly string[];
  snippet?: { language: string; caption: string; code: string };
  links?: { label: string; url: string }[];
  /** Internal Tally work: marked as such on the card. */
  confidential?: boolean;
}

export const projectsSection = {
  heading: "Projects I've worked on.",
  intro: [
    "Here are some projects I've worked on, from low-level C++ development to full-stack applications. Open a project to see what it does, how it works and which technologies I used.",
    'Some of my work at Tally Solutions is part of internal company projects. Because of this, their source code and detailed implementation are not publicly available.',
  ],
  internalNote: 'This is internal company work. The source code and detailed implementation are not publicly available.',
  highlightsLabel: 'What I worked on',
} as const;

export const projectCategories: readonly ProjectCategory[] = ['Systems', 'Full-stack', 'Web & Apps'];

export const projects: readonly Project[] = [
  {
    id: 'memory-manager',
    title: 'Custom Memory Manager',
    tagline: 'A custom C++ memory manager that improved allocation performance by 90%.',
    category: 'Systems',
    summary:
      'I built a custom memory manager in C++ to make memory allocation faster. It uses a block-based design to manage allocation metadata and atomic operations to safely handle shared memory across multiple threads.',
    highlights: [
      'Improved performance by 90% compared to the system allocator in the measured benchmark.',
      'Designed a block-based method to manage memory allocation metadata.',
      'Used atomic operations to safely manage shared memory information across multiple threads.',
      'Focused on making memory allocation faster and more efficient.',
    ],
    tech: ['C++', 'Atomics', 'Memory Management', 'Performance Optimization'],
    architecture: ['Application Code', 'Allocator Interface', 'Block-Based Metadata', 'Operating System Pages'],
    snippet: {
      language: 'cpp',
      caption:
        'The code example below is a simple C++ arena allocator to explain the idea. It is only an example and is not the actual production code.',
      code: `class Arena {
  std::byte* base_;
  std::size_t cap_, off_ = 0;
public:
  Arena(std::byte* p, std::size_t n) : base_(p), cap_(n) {}

  void* alloc(std::size_t n, std::size_t align = alignof(std::max_align_t)) {
    std::size_t p = (off_ + align - 1) & ~(align - 1);
    if (p + n > cap_) return nullptr;
    off_ = p + n;
    return base_ + p;
  }
  void reset() noexcept { off_ = 0; }
};`,
    },
    confidential: true,
  },
  {
    id: 'versioned-sync',
    title: 'Versioned Data Synchronization',
    tagline: 'Allows multiple threads to read shared data while controlling write access.',
    category: 'Systems',
    summary:
      'I worked on a reader-writer synchronization mechanism for shared data with different versions. It allows multiple threads to read the same data at the same time, while making sure only one thread can modify it.',
    highlights: [
      'Added shared and exclusive wait locks.',
      'Allowed multiple threads to read shared data at the same time.',
      'Made sure a thread gets exclusive access when it needs to modify the data.',
      'Worked on root container management and version finalization.',
      'Built a reusable approach that was also used in other versioned components.',
    ],
    tech: ['C++', 'Concurrency', 'Reader-Writer Locks'],
    architecture: ['Readers / Writers', 'Shared & Exclusive Wait Locks', 'Versioned Data Component', 'Root Container'],
    confidential: true,
  },
  {
    id: 'coreobject',
    title: 'CoreObject',
    tagline: 'Building reusable components for core software functionality.',
    category: 'Systems',
    summary:
      'I worked on CoreObject, which provides reusable components and core data types used by different parts of the software platform. My work focused on handling data efficiently and improving performance.',
    highlights: [
      'Added a stack-based variable data type to the core data types layer.',
      'Made comparison operations faster using branchless logic.',
      'Created a common interface for comparison operations across different data types.',
      'Completed the planned data type milestones on time.',
      'Focused on building reusable components and managing resources efficiently.',
    ],
    tech: ['C++', 'Object-Oriented Programming', 'Data Structures'],
    architecture: ['Product Modules', 'CoreObject', 'Core Data Types', 'Platform Layer'],
    confidential: true,
  },
  {
    id: 'coredb',
    title: 'CoreDB',
    tagline: 'Working on core database components and data handling.',
    category: 'Systems',
    summary:
      'I worked on CoreDB, which contains low-level database components. My focus was on handling data efficiently and improving performance.',
    highlights: [
      'Worked on low-level database components.',
      'Improved the way data is handled.',
      'Contributed to performance improvements.',
      'Worked on components used by other parts of the software platform.',
    ],
    tech: ['C++', 'Data Structures', 'Performance Optimization'],
    architecture: ['Product Modules', 'CoreDB', 'Data Handling', 'Storage'],
    confidential: true,
  },
  {
    id: 'tallycompass-voc',
    title: 'TallyCompass VOC',
    tagline: 'Working on both the backend and frontend of a full-stack application.',
    category: 'Full-stack',
    summary:
      'I worked on TallyCompass VOC, a full-stack application with a Node.js and MongoDB backend and a React frontend.',
    highlights: [
      'Built backend features using Node.js.',
      'Used MongoDB to store and manage application data.',
      'Used Mongoose to create database models and handle data.',
      'Worked on the React frontend.',
      'Contributed to the overall application structure.',
    ],
    tech: ['Node.js', 'MongoDB', 'Mongoose', 'React'],
    architecture: ['React UI', 'REST API (Node.js)', 'Mongoose Models', 'MongoDB'],
    confidential: true,
  },
  {
    id: 'quiz-system',
    title: 'Quiz Organizing System',
    tagline: 'A quiz platform with separate sections for administrators and students.',
    category: 'Full-stack',
    summary:
      'I built a quiz management system where administrators can create and manage quizzes. Students can open shared links and take the quizzes.',
    highlights: [
      'Created separate sections for administrators and students.',
      'Added options to create, update and delete quizzes.',
      'Added email sharing of quiz links using SMTP.',
      'Made sure each student can attempt a quiz only once.',
      'Focused on keeping data accurate and making the system easy to use.',
    ],
    tech: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL'],
    architecture: ['Admin & Student Interface', 'PHP Backend', 'MySQL Database', 'SMTP Email Links'],
    links: [{ label: 'GitHub', url: 'https://github.com/nasirgeu/quizOrganizationSystem' }],
  },
  {
    id: 'scheduler-solver',
    title: 'OS Process Scheduling Solver',
    tagline: 'A browser-based tool to learn and visualise how process scheduling works.',
    category: 'Web & Apps',
    summary:
      'I built a browser-based tool using HTML, CSS and JavaScript to run different operating system scheduling algorithms and show their results in real time.',
    extra: {
      label: 'Supported algorithms',
      items: [
        'FCFS (First Come First Serve)',
        'SJF (Shortest Job First)',
        'SRTF (Shortest Remaining Time First)',
        'Priority Scheduling (Preemptive)',
        'Priority Scheduling (Non-Preemptive)',
      ],
    },
    highlights: [
      'Implemented different process scheduling algorithms.',
      'Calculated waiting time and turnaround time in real time.',
      'Created Gantt charts to show the order in which processes run.',
      'Added input checks and error handling.',
      'Focused on accurate results and an easy-to-use interface.',
    ],
    tech: ['HTML', 'CSS', 'JavaScript'],
    architecture: ['User Input & Validation', 'Scheduling Algorithms', 'Waiting Time / Turnaround Time', 'Gantt Chart'],
    links: [
      { label: 'Live Demo', url: 'https://nasirgeu.github.io/ProcessSchedulingSolver/' },
      { label: 'Try the new version in the Lab', url: '/lab/cpu-scheduling' },
    ],
  },
  {
    id: 'file-hidden-system',
    title: 'File Hidden System',
    tagline: 'An application to hide and manage files securely using email verification.',
    category: 'Web & Apps',
    summary:
      'I built a file management application using Java and MySQL. Users who log in can hide files, restore them and view their hidden files. Email OTP verification is used during login.',
    highlights: [
      'Built user login and email verification.',
      'Added OTP verification using SMTP.',
      'Added the option to hide files.',
      'Added the option to restore hidden files.',
      'Allowed logged-in users to view their hidden files.',
      'Used MySQL to store and manage application data.',
    ],
    tech: ['Java', 'MySQL', 'SMTP'],
    architecture: ['Login & Email OTP', 'Java Application', 'SMTP Email Delivery', 'MySQL Database'],
    links: [{ label: 'GitHub', url: 'https://github.com/nasirgeu/FileHiddenSystem' }],
  },
];
