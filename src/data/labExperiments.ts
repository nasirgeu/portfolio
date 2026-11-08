/**
 * Content for the Engineering Lab: the dashboard cards and the technical notes
 * shown on each experiment page. Everything here describes the real engines in
 * src/lib/, including their real complexity.
 */

export type ExperimentSlug =
  | 'page-replacement'
  | 'cpu-scheduling'
  | 'memory-allocation'
  | 'sorting'
  | 'searching'
  | 'graph-algorithms';

/** The Lab is split in two groups, used by the navbar, the sidebar and the dashboard. */
export type ExperimentGroup = 'os' | 'algorithms';

export const groupInfo: Record<ExperimentGroup, { label: string; short: string; blurb: string }> = {
  os: {
    label: 'Operating Systems',
    short: 'OS',
    blurb: 'Learn how an operating system manages memory and shares CPU time between processes.',
  },
  algorithms: {
    label: 'Algorithms',
    short: 'Algorithms',
    blurb: 'Learn how common algorithms work by following their decisions one step at a time.',
  },
};

export interface ComplexityRow {
  algorithm: string;
  time: string;
  space: string;
}

export interface Experiment {
  slug: ExperimentSlug;
  /** Which part of the Lab it belongs to. */
  group: ExperimentGroup;
  /** Position in the Lab (1-based), shown on cards and the sidebar. */
  order: number;
  name: string;
  category: string;
  /** One line used on the dashboard card. */
  summary: string;
  /** Short description shown on the Lab dashboard card. */
  cardDescription: string;
  /** Short description shown on the Home page Lab section. */
  teaser: string;
  /** Paragraph used in the experiment page header. */
  description: string;
  tech: readonly string[];
  /** The algorithms the experiment lets you compare. */
  algorithms: readonly string[];
  /** What a visitor can learn from it. */
  learn: readonly string[];
  /** Used for the SEO description of the experiment page. */
  seoDescription: string;
  technical: {
    how: readonly string[];
    steps: readonly string[];
    variables: readonly { name: string; meaning: string }[];
    complexityNote: string;
    complexity: readonly ComplexityRow[];
    example: { input: readonly string[]; output: readonly string[] };
    edgeCases: readonly string[];
    code: readonly { label: string; path: string }[];
  };
}

export const experiments: readonly Experiment[] = [
  {
    slug: 'page-replacement',
    group: 'os',
    order: 1,
    name: 'Page Replacement',
    category: 'Memory management',
    summary: 'Watch an operating system decide which memory page to throw out when memory is full.',
    cardDescription: 'Compare FIFO, LRU and Optimal.',
    teaser: 'Compare FIFO, LRU and Optimal.',
    description:
      'A computer has limited memory, so it cannot keep every page in memory at the same time. When a program requests a page that is not currently in memory, a page fault occurs. The system then needs to make space by removing another page. Change the page requests or the number of memory frames and compare how FIFO, LRU and Optimal handle them.',
    tech: ['TypeScript', 'React', 'Astro'],
    algorithms: ['FIFO', 'LRU', 'Optimal'],
    learn: [
      'What a page fault is and why it costs time',
      'Why LRU usually beats FIFO',
      "Belady's anomaly: more memory can make FIFO worse",
    ],
    seoDescription:
      'An interactive simulator for FIFO, LRU and Optimal page replacement. Follow each step and compare page faults.',
    technical: {
      how: [
        'Each request represents a page number. If the requested page is already in memory, it is a hit. If it is not in memory, it is a page fault. If an empty frame is available, the page is placed there. If all frames are full, one of the existing pages must be removed.',
        'The three algorithms decide which page to remove in different ways. FIFO removes the page that has been in memory the longest. LRU removes the page that has not been used for the longest time. Optimal removes the page whose next use is farthest in the future. It needs future knowledge, so it is mainly useful as a best-case comparison.',
      ],
      steps: [
        'Read the next page request.',
        'Check whether the page is already in memory.',
        'If there is a page fault, use an empty frame if possible.',
        'If all frames are full, choose a page to remove.',
        'Load the new page and save the memory state with an explanation.',
        'After all requests are complete, count the hits and faults and compare all three algorithms.',
      ],
      variables: [
        { name: 'N', meaning: 'Total number of page requests.' },
        { name: 'F', meaning: 'Number of memory frames.' },
        { name: 'frames[]', meaning: 'The page stored in each frame, or an empty value.' },
        { name: 'loadOrder', meaning: 'The order in which frames were filled, used by FIFO.' },
        { name: 'lastUsed[]', meaning: 'The last time each page was used, including hits, used by LRU.' },
        { name: 'hits, faults', meaning: 'Total page hits and page faults.' },
      ],
      complexityNote:
        'N is the number of requests and F is the number of frames. The walkthrough stores a copy of the frames after every step, which is why its space usage is O(N·F). The actual working memory is only O(F).',
      complexity: [
        { algorithm: 'FIFO', time: 'O(N·F)', space: 'O(N·F)' },
        { algorithm: 'LRU', time: 'O(N·F)', space: 'O(N·F)' },
        { algorithm: 'Optimal', time: 'O(N²·F) worst case', space: 'O(N·F)' },
      ],
      example: {
        input: ['Requests: 7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1', 'Frames: 3'],
        output: ['FIFO: 15 page faults', 'LRU: 12 page faults', 'Optimal: 9 page faults'],
      },
      edgeCases: [
        'More frames than unique pages: Only the first request for each page causes a fault.',
        "Belady's anomaly: For the requests 1 2 3 4 1 2 5 1 2 3 4 5, FIFO gives 9 faults with 3 frames but 10 faults with 4 frames.",
        'One frame: Every time the requested page changes, a page fault occurs.',
        'Same page requested repeatedly: Only the first request causes a fault. All later requests are hits.',
        'Invalid input: Letters or more than 40 requests are rejected with a clear error message.',
      ],
      code: [
        { label: 'Engine', path: 'src/lib/pageReplacement.ts' },
        { label: 'Workspace', path: 'src/components/PageReplacementDemo.tsx' },
        { label: 'Checks', path: 'tests/pageReplacement.test.ts' },
      ],
    },
  },
  {
    slug: 'cpu-scheduling',
    group: 'os',
    order: 2,
    name: 'CPU Scheduling',
    category: 'Process management',
    summary: 'See how seven scheduling rules share one CPU, drawn as a to-scale Gantt chart.',
    cardDescription: 'Explore seven ways an operating system decides which process gets CPU time.',
    teaser: 'Explore 7 CPU scheduling algorithms.',
    description:
      'Many programs may need the CPU at the same time, but each CPU core can run only one process at a time. A scheduling algorithm decides which process should run next. Enter when each process arrives and how much CPU time it needs. Then compare how seven scheduling algorithms share CPU time. The Gantt chart shows the execution timeline, and each decision comes with a simple explanation.',
    tech: ['TypeScript', 'React', 'Astro'],
    algorithms: ['FCFS', 'SJF', 'SRTF', 'Round Robin', 'NPP', 'PP', 'HRRN'],
    learn: [
      'How waiting time and turnaround time are calculated',
      'Why SRTF has the lowest average waiting time',
      'How a time quantum changes Round Robin',
    ],
    seoDescription:
      'An interactive CPU scheduling simulator for FCFS, SJF, SRTF, Round Robin, Priority and HRRN. It displays a Gantt chart and explains each scheduling decision.',
    technical: {
      how: [
        'The simulator keeps track of the current time. It checks which processes have arrived, selects one using the chosen rule, runs it and records the result in the Gantt chart. This continues until all processes finish.',
        'Non-preemptive algorithms (FCFS, SJF, non-preemptive Priority and HRRN) let a process continue until it finishes. Preemptive algorithms (SRTF and preemptive Priority) can choose another process when a new one arrives. Round Robin gives each process a turn of up to one time quantum.',
      ],
      steps: [
        'Start the clock at time 0.',
        'Check which processes have arrived.',
        'If no process is ready, keep the CPU idle until the next process arrives.',
        'Choose the next process using the selected scheduling algorithm.',
        'Run the process until it finishes, gets interrupted or reaches its time quantum.',
        'Save that part of the Gantt chart with an explanation.',
        'Calculate turnaround and waiting times for all processes.',
      ],
      variables: [
        { name: 'n', meaning: 'Number of processes, up to 12.' },
        { name: 'arrival, burst', meaning: 'When a process arrives and how much CPU time it needs.' },
        { name: 'priority', meaning: 'A lower number means a higher priority.' },
        { name: 'remaining', meaning: 'CPU time still needed by a process. Used by SRTF and Round Robin.' },
        { name: 'quantum', meaning: 'Maximum time for one Round Robin turn, from 1 to 20.' },
        { name: 'turnaround', meaning: 'Finish time minus arrival time.' },
        { name: 'waiting', meaning: 'Turnaround time minus burst time.' },
      ],
      complexityNote:
        'n is the number of processes. Each selection rebuilds and sorts the ready list. There are at most about 2n selections, which gives O(n² log n) for the basic algorithms. For Round Robin, R is the number of turns, roughly the total burst time divided by the time quantum. Each turn checks the arrival list.',
      complexity: [
        { algorithm: 'FCFS, SJF, Priority, HRRN', time: 'O(n² log n)', space: 'O(n)' },
        { algorithm: 'SRTF, Priority (preemptive)', time: 'O(n² log n)', space: 'O(n)' },
        { algorithm: 'Round Robin', time: 'O(n·R)', space: 'O(n + R)' },
      ],
      example: {
        input: ['Arrival: 0 1 2 3', 'Burst: 8 4 9 5', 'Algorithm: SRTF'],
        output: [
          'Gantt chart: A 0–1, B 1–5, D 5–10, A 10–17, C 17–26',
          'Average waiting time: 6.50',
          'Average turnaround time: 13.00',
          'For comparison: FCFS gives 8.75 and SJF gives 7.75 average waiting time.',
        ],
      },
      edgeCases: [
        'CPU idle time: If no process has arrived or all available processes have finished, the CPU is shown as idle.',
        "Ties: The process that arrived first is selected. If arrival times are equal, input order is used. A running process is not interrupted just because another process has the same selection value.",
        "Invalid input: A burst time of 0, different list lengths, a quantum outside 1 to 20 or more than 12 processes are rejected.",
        "Round Robin: If the quantum is larger than every process's burst time, the result is the same as FCFS.",
        'One process: It runs as a single block in the Gantt chart.',
      ],
      code: [
        { label: 'Engine', path: 'src/lib/scheduling.ts' },
        { label: 'Workspace', path: 'src/components/SchedulingDemo.tsx' },
        { label: 'Checks', path: 'tests/scheduling.test.ts' },
      ],
    },
  },
  {
    slug: 'memory-allocation',
    group: 'os',
    order: 3,
    name: 'Memory Allocation',
    category: 'Memory management',
    summary: 'Place blocks into memory with first, best and worst fit, and watch fragmentation appear.',
    cardDescription: 'See how memory blocks are assigned and compare different ways of choosing free space.',
    teaser: 'Compare First Fit, Best Fit and Worst Fit.',
    description:
      'Programs request memory when they need it and release it when they are done. Over time, free memory can become divided into smaller gaps. This is called fragmentation. When a program requests memory, the allocator must choose a suitable free gap. Try First Fit, Best Fit and Worst Fit with the same requests and compare how each method uses memory. This is a simplified example for learning. It is different from the custom memory manager I built at work.',
    tech: ['TypeScript', 'React', 'Astro'],
    algorithms: ['First Fit', 'Best Fit', 'Worst Fit'],
    learn: [
      'What external fragmentation is',
      'How the three strategies choose a gap',
      'Why freeing a block can merge neighbouring gaps',
    ],
    seoDescription:
      'An interactive memory allocation simulator for First Fit, Best Fit and Worst Fit. See how memory is allocated, freed and affected by fragmentation.',
    technical: {
      how: [
        'Memory is represented as a continuous space containing allocated blocks and free gaps. Each allocated block has a letter as its name. When a program requests memory, the allocator looks for one free gap large enough to hold the block. When a block is freed, its space becomes available again and is joined with any free gaps next to it.',
        'The three methods choose a free gap differently. First Fit chooses the first suitable gap, starting from the lowest address. Best Fit chooses the smallest gap that can hold the requested block. Worst Fit chooses the largest available gap. If two gaps are equally suitable, the one at the lower address is selected. If a gap is larger than the requested size, the remaining space stays free.',
      ],
      steps: [
        'Read the next operation.',
        'Decide whether it is an allocation or a free operation.',
        'If a block is being freed, release it and combine it with neighbouring free gaps.',
        'If memory is being allocated, check that the block name is not already in use.',
        'Find all free gaps that are large enough.',
        'Select a gap using First Fit, Best Fit or Worst Fit.',
        'Place the block and keep any remaining space as a free gap.',
        'Save the memory map and explain the result.',
      ],
      variables: [
        { name: 'M', meaning: 'Total memory size in units (16, 24, 32, 48 or 64).' },
        { name: 'blocks[]', meaning: 'The starting address, size and name of every block and free gap.' },
        { name: 'k', meaning: 'Number of operations, up to 30.' },
        { name: 'free in total', meaning: 'Sum of all free memory gaps.' },
        { name: 'largest gap', meaning: 'Size of the biggest free gap.' },
        { name: 'fragmentation', meaning: '1 − largest gap ÷ free in total, shown as a percentage.' },
      ],
      complexityNote:
        'k is the number of operations, and m is the number of blocks and free gaps. Each operation checks the block list. The walkthrough also saves a copy of the memory layout after every step.',
      complexity: [
        { algorithm: 'First Fit', time: 'O(k·m)', space: 'O(k·m)' },
        { algorithm: 'Best Fit', time: 'O(k·m)', space: 'O(k·m)' },
        { algorithm: 'Worst Fit', time: 'O(k·m)', space: 'O(k·m)' },
      ],
      example: {
        input: ['Memory: 48 units', 'Operations: A10 B2 C5 D2 E7 F2 G12 -A -C -E H6'],
        output: [
          'First Fit: H is placed at address 0.',
          'Best Fit: H is placed at address 19, using the 7-unit gap.',
          'Worst Fit: H is placed at address 0, using the 10-unit gap.',
        ],
      },
      edgeCases: [
        'External fragmentation: Enough memory may be free in total, but if no single gap is large enough, the request fails.',
        'Exact fit: If a gap is exactly the requested size, no free space remains in that gap.',
        'Joining free gaps: Freeing neighbouring blocks combines them into one larger gap. For example, A10 B10 -A -B leaves one free gap.',
        'Invalid free operation: Trying to free a block that does not exist is reported.',
        'Duplicate block name: Allocating the same letter twice is reported.',
        'Oversized block: A block larger than the total memory size is rejected.',
      ],
      code: [
        { label: 'Engine', path: 'src/lib/allocator.ts' },
        { label: 'Workspace', path: 'src/components/AllocatorDemo.tsx' },
        { label: 'Checks', path: 'tests/allocator.test.ts' },
      ],
    },
  },
  {
    slug: 'sorting',
    group: 'algorithms',
    order: 4,
    name: 'Sorting Algorithms',
    category: 'Algorithms',
    summary: 'Watch nine sorting algorithms rearrange the same list, with live comparison and swap counts.',
    cardDescription: 'Compare nine ways to arrange numbers in order.',
    teaser: 'Try Bubble, Selection, Insertion, Merge, Quick, Heap, Counting, Radix and Shell sort.',
    description:
      'Sorting means arranging values in a particular order. There are many ways to do it. Enter a list of numbers, choose an algorithm and follow how it sorts the list. Each bar represents a number. The visualizer highlights every comparison, swap and write operation. You can also compare how all nine algorithms handle the same list.',
    tech: ['TypeScript', 'React', 'Astro'],
    algorithms: ['Bubble', 'Selection', 'Insertion', 'Merge', 'Quick', 'Heap', 'Counting', 'Radix', 'Shell'],
    learn: [
      'Why O(n²) algorithms slow down quickly on bigger lists',
      'How divide and conquer (merge, quick) beats repeated scanning',
      'How counting and radix sort avoid comparing values at all',
    ],
    seoDescription:
      'An interactive sorting visualizer for nine sorting algorithms. Compare their steps, comparisons, swaps and time complexity.',
    technical: {
      how: [
        'The simulator makes a copy of your list and sorts that copy. Your original input stays unchanged. Every comparison, swap or write is saved as a separate step. Each step shows the list at that moment, the positions being checked, the values already in their final positions and a short explanation.',
        'Bubble, Selection, Insertion, Quick, Heap and Shell Sort report swaps. Merge, Counting and Radix Sort write values into their correct positions, so they report writes instead. Counting Sort does not compare two values, so its comparison count is 0.',
      ],
      steps: [
        'Check the input list. It must contain 2 to 16 whole numbers between 0 and 99.',
        'Make a copy so the original list is not changed.',
        'Run the selected sorting algorithm.',
        'Save every comparison, swap or write with an explanation.',
        'Mark values as final when they no longer need to move.',
        'Show the final counts and compare all nine algorithms using the same list.',
      ],
      variables: [
        { name: 'n', meaning: 'Number of values, up to 16.' },
        { name: 'array', meaning: 'The complete list after each step.' },
        { name: 'focus', meaning: 'The positions being compared or changed.' },
        { name: 'sorted', meaning: 'Positions that have reached their final place.' },
        { name: 'range', meaning: 'The part of the list being processed by a divide-and-conquer step.' },
        { name: 'comparisons, writes', meaning: 'The live counts shown above the bars.' },
      ],
      complexityNote:
        "n is the number of values, k is the largest value for Counting Sort, d is the number of digits and b is the base 10 used by Radix Sort. The walkthrough uses additional O(n) space because it saves a copy of the list after every step. The table shows the algorithm's own space complexity.",
      complexity: [
        { algorithm: 'Bubble, Selection, Insertion', time: 'O(n²). Bubble and Insertion can take O(n) when already sorted.', space: 'O(1)' },
        { algorithm: 'Merge', time: 'O(n log n)', space: 'O(n)' },
        { algorithm: 'Quick', time: 'O(n log n) average, O(n²) worst', space: 'O(log n)' },
        { algorithm: 'Heap', time: 'O(n log n)', space: 'O(1)' },
        { algorithm: 'Counting', time: 'O(n + k)', space: 'O(k)' },
        { algorithm: 'Radix', time: 'O(d·(n + b))', space: 'O(n + b)' },
        { algorithm: 'Shell', time: 'Between O(n log n) and O(n²), depending on gaps', space: 'O(1)' },
      ],
      example: {
        input: ['List: 5 2 9 1 7', 'Algorithm: Bubble'],
        output: ['Bubble: 10 comparisons and 5 swaps.', 'Insertion: 7 comparisons and 5 swaps.', 'Counting: 0 comparisons.'],
      },
      edgeCases: [
        'Already sorted list: Bubble Sort finishes after one pass, with n − 1 comparisons and no swaps.',
        'Reversed list: This is the worst case for Bubble Sort, Insertion Sort and Quick Sort when it uses the last value as the pivot.',
        'Duplicate values: All algorithms can handle duplicate values. Stable algorithms keep equal values in their original order.',
        'Invalid input: Lists with fewer than 2 values, letters, negative numbers, numbers above 99 or more than 16 values are rejected with a clear message.',
      ],
      code: [
        { label: 'Engine', path: 'src/lib/sorting.ts' },
        { label: 'Workspace', path: 'src/components/SortingDemo.tsx' },
        { label: 'Checks', path: 'tests/sorting.test.ts' },
      ],
    },
  },
  {
    slug: 'searching',
    group: 'algorithms',
    order: 5,
    name: 'Searching Algorithms',
    category: 'Algorithms',
    summary: 'Find a value with linear, binary, jump and interpolation search and see how much of the list each one skips.',
    cardDescription: 'Compare four ways to find a value in a list.',
    teaser: 'Try Linear, Binary, Jump and Interpolation search.',
    description:
      'Finding a value in a list can take very little time or many checks, depending on the algorithm. Enter a list of numbers and a target value. Then watch how each algorithm searches for it. Values that are still possible remain highlighted, while values that are no longer relevant fade away. This helps you see how each method reduces the search area.',
    tech: ['TypeScript', 'React', 'Astro'],
    algorithms: ['Linear', 'Binary', 'Jump', 'Interpolation'],
    learn: [
      'Why binary search needs a sorted list and what it saves',
      'How jump search balances jumping and scanning with a block of about √n',
      'Why interpolation search is fast on evenly spread numbers and slow on others',
    ],
    seoDescription:
      'An interactive visualizer for Linear, Binary, Jump and Interpolation Search. See how each algorithm searches a list and compare the number of comparisons.',
    technical: {
      how: [
        'The simulator checks the list one position at a time, depending on the selected algorithm. Each check is saved as a step. The step shows which position was checked, which part of the list is still possible and why the search moves forward.',
        'Linear Search checks values one by one and works with sorted or unsorted lists. Binary Search checks the middle value and removes half of the search area. Jump Search moves through the list in fixed-size jumps, then checks the relevant section. Interpolation Search estimates where the target should be based on the values, so it works especially well when values are evenly spread. Binary, Jump and Interpolation Search need sorted data. If you enter an unsorted list, the simulator sorts it first and tells you that it has done so.',
      ],
      steps: [
        'Check the list and target. The list can contain up to 20 whole numbers from 0 to 99.',
        'Sort the list first if the selected algorithm requires sorted data.',
        'Choose the next position to check.',
        'Compare that value with the target.',
        'Reduce the search area based on the result.',
        'Stop when the target is found or no possible positions remain.',
        'Compare all four algorithms using the same input.',
      ],
      variables: [
        { name: 'n', meaning: 'Number of values, up to 20.' },
        { name: 'target', meaning: 'The value being searched for.' },
        { name: 'lo, hi', meaning: 'First and last positions that may still contain the target.' },
        { name: 'probe', meaning: 'The position checked in the current step.' },
        { name: 'comparisons', meaning: 'Number of positions checked so far.' },
      ],
      complexityNote:
        'n is the number of values. Interpolation Search is fast when values are evenly spread. When they are not, its performance can become O(n).',
      complexity: [
        { algorithm: 'Linear', time: 'O(n)', space: 'O(1)' },
        { algorithm: 'Binary', time: 'O(log n)', space: 'O(1)' },
        { algorithm: 'Jump', time: 'O(√n)', space: 'O(1)' },
        { algorithm: 'Interpolation', time: 'O(log log n) average on evenly spread values, O(n) worst', space: 'O(1)' },
      ],
      example: {
        input: ['List: 1 3 5 7 9 11 13 15', 'Target: 11'],
        output: ['Binary: Found at position 6 in 2 comparisons.', 'Linear: 6 comparisons.', 'Jump: 4 comparisons.'],
      },
      edgeCases: [
        'Target not found: Every algorithm finishes after checking all possible positions and reports that the value is not in the list.',
        'Duplicate values: Linear Search returns the first match. The other algorithms return one matching position.',
        'Target outside the range: If the target is smaller than the first value or larger than the last value, Interpolation Search can rule it out without checking a position.',
        'Unsorted list: The simulator sorts the list before Binary, Jump and Interpolation Search and informs you about it.',
      ],
      code: [
        { label: 'Engine', path: 'src/lib/searching.ts' },
        { label: 'Workspace', path: 'src/components/SearchingDemo.tsx' },
        { label: 'Checks', path: 'tests/searching.test.ts' },
      ],
    },
  },
  {
    slug: 'graph-algorithms',
    group: 'algorithms',
    order: 6,
    name: 'Graph Algorithms',
    category: 'Algorithms',
    summary: 'Run eight graph algorithms on a graph you draw with text, and watch the queue, stack and distance table update.',
    cardDescription: 'Explore how algorithms work with nodes, connections, paths and networks.',
    teaser: "Explore BFS, DFS, Dijkstra, Bellman-Ford, Floyd-Warshall, Prim's, Kruskal's and Topological Sort.",
    description:
      'Graphs are used to represent roads, computer networks, connections and task dependencies. Enter a few connections, such as A-B:4, and the page will draw the graph. Choose an algorithm and follow how it works, step by step. You can explore graph traversal, shortest paths, minimum spanning trees and topological ordering. The visualizer also shows the data structure used by each algorithm, such as a queue, stack, priority queue or table. Every important decision comes with a simple explanation.',
    tech: ['TypeScript', 'React', 'SVG', 'Astro'],
    algorithms: ['BFS', 'DFS', 'Dijkstra', 'Bellman-Ford', 'Floyd-Warshall', "Prim's", "Kruskal's", 'Topological sort'],
    learn: [
      'How a queue gives BFS and a stack gives DFS',
      'Why Dijkstra needs non-negative weights and how Bellman-Ford copes with negative ones',
      "How Prim's and Kruskal's build the same minimum spanning tree in different ways",
    ],
    seoDescription:
      "An interactive graph visualizer for BFS, DFS, Dijkstra, Bellman-Ford, Floyd-Warshall, Prim's, Kruskal's and Topological Sort.",
    technical: {
      how: [
        'The simulator converts your input into a graph with up to 8 nodes and 14 edges. A dash (-) creates an undirected connection. An arrow (>) creates a directed connection. A weight can be added to a connection. The selected algorithm processes the graph and records every important decision. Each step contains the state of the nodes and edges, the queue, stack or table being used and a simple explanation.',
        "Some algorithms also have specific requirements. Prim's and Kruskal's need an undirected graph. Topological Sort needs a directed graph. Dijkstra needs edge weights of 0 or more. If the graph does not meet these requirements, the page explains the problem instead of showing an incorrect result.",
      ],
      steps: [
        'Read and validate the connections. Node names must be between A and H, and weights must be between −20 and 99.',
        'Check whether the graph is suitable for the selected algorithm.',
        'Run the algorithm and record every decision.',
        'Show the result, such as traversal order, shortest distances, a minimum spanning tree or topological order.',
        'Use Back, Next and Play to move through the recorded steps.',
      ],
      variables: [
        { name: 'V, E', meaning: 'Number of nodes and edges.' },
        { name: 'queue, stack', meaning: 'Data structures used by BFS and DFS to decide which node to visit next.' },
        { name: 'dist[]', meaning: 'Best known distance from the starting node to each other node.' },
        { name: 'priority queue', meaning: "Dijkstra's list of nodes, ordered by the smallest known distance." },
        { name: 'groups', meaning: "Tracks which connected group each node belongs to. Used by Kruskal's Union-Find approach." },
        { name: 'in-degree', meaning: 'Number of incoming edges for a node. Used by Topological Sort.' },
      ],
      complexityNote:
        "V is the number of nodes and E is the number of edges. Dijkstra and Prim's use a simple scan in this implementation. A heap-based approach can make them more efficient for larger graphs.",
      complexity: [
        { algorithm: 'BFS, DFS, Topological Sort', time: 'O(V + E)', space: 'O(V)' },
        { algorithm: 'Dijkstra (as implemented)', time: 'O(V²), O((V + E) log V) with a heap', space: 'O(V)' },
        { algorithm: 'Bellman-Ford', time: 'O(V·E)', space: 'O(V)' },
        { algorithm: 'Floyd-Warshall', time: 'O(V³)', space: 'O(V²)' },
        { algorithm: "Prim's (as implemented)", time: 'O(V·E), O(E log V) with a heap', space: 'O(V)' },
        { algorithm: "Kruskal's", time: 'O(E log E)', space: 'O(V)' },
      ],
      example: {
        input: ['Edges: A-B:4 A-C:2 B-C:1 B-D:5 C-D:8 C-E:10 D-E:2 D-F:6 E-F:3', 'Algorithm: Dijkstra from A'],
        output: ['Distances: A = 0, B = 3, C = 2, D = 8, E = 10, F = 13.', "Prim's and Kruskal's both produce a minimum spanning tree with a total weight of 13."],
      },
      edgeCases: [
        "Disconnected graph: BFS and DFS show which nodes cannot be reached. Prim's stops after processing the connected group containing the starting node.",
        'Negative cycle: Bellman-Ford and Floyd-Warshall report a negative cycle instead of returning an incorrect shortest distance.',
        'Directed cycle: Topological Sort reports that a valid ordering is not possible.',
        'Undirected negative edge: It is treated as a negative cycle because the edge can be followed in both directions repeatedly.',
        'Invalid graph: Self-loops, repeated edges, weights outside the allowed range, more than 8 nodes or more than 14 edges are rejected with a clear message.',
      ],
      code: [
        { label: 'Engine', path: 'src/lib/graph.ts' },
        { label: 'Workspace', path: 'src/components/GraphDemo.tsx' },
        { label: 'Checks', path: 'tests/graph.test.ts' },
      ],
    },
  },
];

export const experimentsByGroup = (group: ExperimentGroup): readonly Experiment[] => experiments.filter((e) => e.group === group);

export const getExperiment = (slug: string): Experiment | undefined => experiments.find((e) => e.slug === slug);

export const getNeighbours = (slug: string): { prev: Experiment | undefined; next: Experiment | undefined } => {
  const i = experiments.findIndex((e) => e.slug === slug);
  return { prev: i > 0 ? experiments[i - 1] : undefined, next: i >= 0 ? experiments[i + 1] : undefined };
};

/** 3 page replacement + 7 scheduling + 3 allocation + 9 sorting + 4 searching + 8 graph. */
export const totalAlgorithms = 34;
