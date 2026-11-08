export interface SkillGroup {
  title: string;
  description: string;
  icon: 'code' | 'cpu' | 'wrench' | 'layers';
  items: readonly string[];
}

export const skillsIntro = 'I mainly focus on programming, computer science fundamentals and building efficient software.';

export const skillGroups: readonly SkillGroup[] = [
  {
    title: 'Programming Languages',
    description: 'Languages I have worked with:',
    icon: 'code',
    items: ['C', 'C++', 'Java', 'SQL', 'JavaScript', 'HTML/CSS'],
  },
  {
    title: 'Core Computer Science',
    description: 'Topics I have studied and worked with:',
    icon: 'cpu',
    items: [
      'Data Structures & Algorithms',
      'Object-Oriented Programming',
      'Operating Systems',
      'Memory Management',
      'Multithreading',
      'System Design',
      'Database Management Systems (DBMS)',
    ],
  },
  {
    title: 'Software Engineering',
    description: 'Areas I have worked on:',
    icon: 'layers',
    items: [
      'Concurrency & Synchronization',
      'Reader-Writer Locks',
      'Atomic Operations',
      'Performance Optimization',
      'Logging & Tracing',
      'Low-Level Programming',
      'Debugging',
    ],
  },
  {
    title: 'Tools & Platforms',
    description: 'Tools and platforms I use:',
    icon: 'wrench',
    items: ['Git', 'GitHub', 'VS Code', 'Eclipse', 'MySQL', 'MongoDB', 'Windows', 'macOS'],
  },
];
