import type { AlgoSpec } from '../algoPost';

/* Page replacement: the same request list is used in all three posts so the results can be compared. */
const PAGE_REFS = '7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1';
const pageLab = (algo: string) => ({
  slug: 'page-replacement',
  name: 'Page Replacement',
  tryText: `Open the Page Replacement experiment, enter the request list from this post with 3 frames, choose ${algo} and step through it. Then switch to the other algorithms and compare the page faults.`,
});

/* CPU scheduling: the same four processes (A to D) are used in every post. */
const PROCS = 'Arrival times: 0 2 4 5\nBurst times:   7 4 1 4';
const PROCS_PRIORITY = `${PROCS}\nPriorities:    3 1 4 2   (a lower number means a higher priority)`;
const schedLab = (algo: string, extra = '') => ({
  slug: 'cpu-scheduling',
  name: 'CPU Scheduling',
  tryText: `Open the CPU Scheduling experiment, enter the processes from this post, choose ${algo} and step through the Gantt chart.${extra} Then try the other algorithms on the same processes and compare the averages.`,
});

/* Memory allocation: the same gaps and requests are used in all three posts. */
const MEM_EXAMPLE =
  'Free gaps (KB), in address order:  100  500  200  300  600\nRequests (KB), one after another: 212  417  112  426';
const memLab = (fit: string) => ({
  slug: 'memory-allocation',
  name: 'Memory Allocation',
  tryText: `Open the Memory Allocation experiment, build a memory like the one in this post, choose ${fit} and allocate the blocks one at a time. Then run the same list with the other strategies and compare.`,
});

export const osSpecs: readonly AlgoSpec[] = [
  /* ------------------------------------------------------------ page replacement */
  {
    slug: 'fifo-page-replacement',
    name: 'FIFO page replacement',
    group: 'Operating Systems',
    tags: ['Operating Systems', 'Page replacement'],
    summary: 'The simplest page replacement rule: when memory is full, the page that has been there longest leaves first.',
    intro: [
      'Memory is limited, so when a program needs a page that is not in memory and every frame is full, the system must remove one page. FIFO, which stands for first in, first out, makes the simplest possible choice: it removes the page that has been in memory the longest.',
      "It works like a queue at a shop. The page at the front arrived first, so it leaves first, whether or not it is still being used.",
    ],
    steps: [
      'Read the next page request.',
      'If the page is already in a frame, it is a hit and nothing changes.',
      'If it is not, it is a page fault. If there is an empty frame, load the page there.',
      'If every frame is full, remove the oldest page (the front of the queue) and load the new page.',
    ],
    example: {
      intro: `Request list, with 3 frames:\n\n${PAGE_REFS}\n\nResult with FIFO:`,
      code: '15 page faults',
      after: 'Note that a page that is used often can still be removed, simply because it is the oldest one.',
    },
    facts: [
      'It only needs a queue of the frames, so it is very cheap to run.',
      'It can show Belady\'s anomaly: with some request lists, more frames lead to more faults.',
      'It never looks at how recently or how often a page was used.',
    ],
    strengths: ['Very simple to build and to understand.', 'Almost no extra bookkeeping.'],
    limits: [
      'It can remove a page that is used all the time, just because it is old.',
      'Usually causes more faults than LRU on real programs.',
    ],
    lab: pageLab('FIFO'),
  },
  {
    slug: 'lru-page-replacement',
    name: 'LRU page replacement',
    group: 'Operating Systems',
    tags: ['Operating Systems', 'Page replacement'],
    summary: 'LRU removes the page that has not been used for the longest time, based on the idea that the recent past predicts the near future.',
    intro: [
      'LRU stands for least recently used. Instead of asking which page arrived first, it asks which page has gone unused for the longest time, and removes that one.',
      'The idea behind it is simple: a page that was used recently is likely to be used again soon, and a page that has not been touched for a while is a good candidate to remove.',
    ],
    steps: [
      'Read the next page request.',
      'If the page is already in a frame, it is a hit. Note that it was just used, so it becomes the most recently used page.',
      'If it is not in memory, it is a page fault. Load it into an empty frame if there is one.',
      'If every frame is full, remove the page whose last use was the longest time ago and load the new page.',
    ],
    example: {
      intro: `Request list, with 3 frames:\n\n${PAGE_REFS}\n\nResult with LRU:`,
      code: '12 page faults',
      after: 'On the same list FIFO had 15 faults. Keeping recently used pages paid off.',
    },
    facts: [
      'It needs to remember when each frame was last used, and update that on every hit.',
      'It never shows Belady\'s anomaly. With more frames it can only fault the same or less.',
      'Real hardware usually uses a cheaper approximation of LRU, because tracking every use exactly is costly.',
    ],
    strengths: ['Close to the best result on programs that reuse recent pages.', 'No Belady\'s anomaly.'],
    limits: [
      'Needs extra bookkeeping on every memory access.',
      'A program that loops over more pages than there are frames can make it perform badly.',
    ],
    lab: pageLab('LRU'),
  },
  {
    slug: 'optimal-page-replacement',
    name: 'Optimal page replacement',
    group: 'Operating Systems',
    tags: ['Operating Systems', 'Page replacement'],
    summary: 'Optimal replacement removes the page that will not be needed for the longest time. It cannot be built for real, but it shows the best possible result.',
    intro: [
      'Optimal page replacement looks into the future. When a page must be removed, it picks the page that will not be needed for the longest time, or never again. No other algorithm can cause fewer page faults on the same list.',
      'Real systems cannot see which pages a program will ask for next, so this algorithm cannot be used in practice. Its value is as a yardstick: it tells you how close FIFO or LRU come to the best possible answer.',
    ],
    steps: [
      'Read the next page request.',
      'If the page is already in a frame, it is a hit.',
      'If not, it is a page fault. Load the page into an empty frame if there is one.',
      'If every frame is full, look ahead at the remaining requests and remove the page whose next use is furthest away (or that is never used again).',
    ],
    example: {
      intro: `Request list, with 3 frames:\n\n${PAGE_REFS}\n\nResult with Optimal:`,
      code: '9 page faults',
      after: 'Compare this with FIFO (15) and LRU (12) on the same list. Nothing can do better than 9 here.',
    },
    facts: [
      'It needs the whole future request list, which real systems do not have.',
      'It never shows Belady\'s anomaly.',
      'It is the lower limit for page faults, so it is used to measure other algorithms.',
    ],
    strengths: ['The fewest possible page faults.', 'A fair benchmark for every other algorithm.'],
    limits: ['It cannot be implemented in a real operating system.', 'It is only useful offline, when the full list is known.'],
    lab: pageLab('Optimal'),
  },

  /* ------------------------------------------------------------ CPU scheduling */
  {
    slug: 'fcfs-cpu-scheduling',
    name: 'First Come First Served (FCFS) scheduling',
    group: 'Operating Systems',
    tags: ['Operating Systems', 'CPU scheduling'],
    summary: 'FCFS runs processes in the order they arrive. It is fair in a simple way, but one long process can make everyone else wait.',
    intro: [
      'First Come First Served is the simplest CPU scheduling rule: the process that arrives first gets the CPU first, and it keeps the CPU until it has finished.',
      'It is like a single queue at a counter. Nobody skips ahead, but one person with a very long request makes everyone behind them wait.',
    ],
    steps: [
      'Put processes in order of arrival. If two arrive together, the one entered first goes first.',
      'Give the CPU to the first process and let it run until it finishes.',
      'Then move on to the next process in the queue.',
      'If nobody has arrived yet, the CPU stays idle until the next arrival.',
    ],
    example: {
      intro: `Four processes, A to D:\n\n${PROCS}\n\nWith FCFS the order is A, B, C, D, and the average waiting time is:`,
      code: '4.75 time units',
      after: 'Process C needs only 1 time unit, but it has to wait for A and B to finish first.',
    },
    facts: [
      'It is non-preemptive: once a process starts, nothing interrupts it.',
      'The average waiting time can be high when a long process arrives early.',
      'It cannot cause starvation, because every process eventually reaches the front.',
    ],
    strengths: ['Very easy to implement and to explain.', 'Predictable and fair in order of arrival.'],
    limits: [
      'The convoy effect: short processes get stuck behind a long one.',
      'Poor for interactive work, where quick responses matter.',
    ],
    lab: schedLab('First Come First Served'),
  },
  {
    slug: 'sjf-cpu-scheduling',
    name: 'Shortest Job First (SJF) scheduling',
    group: 'Operating Systems',
    tags: ['Operating Systems', 'CPU scheduling'],
    summary: 'SJF always runs the waiting process with the shortest burst time next. It lowers the average waiting time, but long processes may wait a long time.',
    intro: [
      'Shortest Job First picks, from the processes that are waiting, the one that needs the least CPU time, and runs it to completion.',
      'Letting short jobs go first gets many processes out of the way quickly, which brings the average waiting time down.',
    ],
    steps: [
      'Collect the processes that have arrived and are not finished.',
      'Pick the one with the shortest burst time. Ties go to the earlier arrival, then to the input order.',
      'Run it until it finishes. This version cannot be interrupted.',
      'Repeat until all processes are done.',
    ],
    example: {
      intro: `Four processes, A to D:\n\n${PROCS}\n\nWith SJF, A runs first because it is the only process at time 0. After it, C (1 unit) goes first, then B, then D. The average waiting time is:`,
      code: '4.0 time units',
      after: 'FCFS gave 4.75 on the same processes.',
    },
    facts: [
      'When all processes are ready at the same time, running the shortest first gives the lowest possible average waiting time.',
      'It needs to know each burst time in advance, which real systems can only estimate.',
      'It is non-preemptive.',
    ],
    strengths: ['Low average waiting time.', 'Short jobs finish quickly.'],
    limits: [
      'Starvation: a long process can wait forever if short ones keep arriving.',
      'Burst times are not usually known in advance.',
    ],
    lab: schedLab('Shortest Job First'),
  },
  {
    slug: 'srtf-cpu-scheduling',
    name: 'Shortest Remaining Time First (SRTF) scheduling',
    group: 'Operating Systems',
    tags: ['Operating Systems', 'CPU scheduling'],
    summary: 'SRTF is the preemptive version of SJF. A newly arrived process can take the CPU if it needs less time than what the running process has left.',
    intro: [
      'Shortest Remaining Time First works like SJF, with one difference: it can interrupt the running process. Whenever a new process arrives, the scheduler compares the new burst time with the time the running process still has left.',
      'If the newcomer needs less, it takes the CPU straight away. This is called preemption.',
    ],
    steps: [
      'At every arrival, look at all waiting processes and the one that is running.',
      'Pick the process with the least time left. Ties go to the earlier arrival, and a tie never makes the running process switch.',
      'Run it until it finishes or until the next process arrives, whichever comes first.',
      'Then choose again.',
    ],
    example: {
      intro: `Four processes, A to D:\n\n${PROCS}\n\nWith SRTF, A starts, but B arrives at time 2 and needs less than what A has left, so B takes over. C then takes over from B, and so on. The average waiting time is:`,
      code: '3.0 time units',
      after: 'This is lower than FCFS (4.75) and SJF (4.0) on the same processes.',
    },
    facts: [
      'It gives the lowest possible average waiting time for this kind of problem.',
      'It switches between processes more often, which costs time in a real system.',
      'It still needs to know the burst times.',
    ],
    strengths: ['Excellent average waiting time.', 'Short jobs are served very quickly, even when they arrive late.'],
    limits: ['Long processes can starve.', 'More context switches than non-preemptive algorithms.'],
    lab: schedLab('Shortest Remaining Time First', ' Watch for the moments when the running process is interrupted.'),
  },
  {
    slug: 'round-robin-cpu-scheduling',
    name: 'Round Robin (RR) scheduling',
    group: 'Operating Systems',
    tags: ['Operating Systems', 'CPU scheduling'],
    summary: 'Round Robin gives every process a short turn on the CPU, called a time quantum, and then sends it to the back of the queue.',
    intro: [
      'Round Robin is built for fairness. Each process gets the CPU for at most a fixed amount of time, called the time quantum. If it is not finished when the time is up, it goes to the back of the queue and the next process gets a turn.',
      'It is the idea behind many time-sharing systems, where everyone should get a quick response.',
    ],
    steps: [
      'Keep a queue of waiting processes.',
      'Take the process at the front and let it run for at most one quantum.',
      'If it finishes, it leaves. If not, it goes to the back of the queue. Processes that arrive during the turn join the queue before it.',
      'If nobody else is waiting, the process simply keeps the CPU.',
    ],
    example: {
      intro: `Four processes, A to D, with a time quantum of 2:\n\n${PROCS}\n\nThe average waiting time is:`,
      code: '5.0 time units',
      after: 'The average is higher than SRTF, but every process gets the CPU regularly and nobody waits for a long stretch with no turn.',
    },
    facts: [
      'It is preemptive, and it never causes starvation.',
      'A very large quantum makes it behave like FCFS.',
      'A very small quantum makes it fair but wastes time switching between processes.',
    ],
    strengths: ['Fair to every process.', 'Good response time for interactive use.'],
    limits: [
      'The average waiting time is often higher than with SJF or SRTF.',
      'Performance depends on choosing a sensible quantum.',
    ],
    lab: schedLab('Round Robin', ' Try a quantum of 1, 2 and 5 to see how the order changes.'),
  },
  {
    slug: 'npp-cpu-scheduling',
    name: 'Non-preemptive priority scheduling',
    group: 'Operating Systems',
    tags: ['Operating Systems', 'CPU scheduling'],
    summary: 'Every process has a priority. When the CPU is free, the waiting process with the highest priority goes next and runs until it finishes.',
    intro: [
      'In priority scheduling, each process is given a priority number. In this experiment a lower number means a higher priority, so a process with priority 1 goes before one with priority 4.',
      'In the non-preemptive version, a process that has started always finishes. Priorities are only checked when the CPU becomes free.',
    ],
    steps: [
      'When the CPU is free, collect the processes that have arrived and are not finished.',
      'Pick the one with the lowest priority number. Ties go to the earlier arrival.',
      'Run it until it finishes.',
      'Repeat until all processes are done.',
    ],
    example: {
      intro: `Four processes, A to D:\n\n${PROCS_PRIORITY}\n\nA runs first because it is alone at time 0. After it, B (priority 1) goes first, then D (priority 2), then C (priority 4). The average waiting time is:`,
      code: '5.5 time units',
      after: 'Process C needs only 1 time unit, but its low priority makes it wait the longest.',
    },
    facts: [
      'Priorities can come from the system, such as importance, or from the user.',
      'It is non-preemptive.',
      'It ignores burst times, so short jobs get no special treatment.',
    ],
    strengths: ['Important work goes first.', 'Simple to understand.'],
    limits: [
      'Starvation: low-priority processes may never run if high-priority ones keep arriving.',
      'A common fix is aging, which slowly raises the priority of processes that have waited long.',
    ],
    lab: schedLab('Non-preemptive Priority'),
  },
  {
    slug: 'pp-cpu-scheduling',
    name: 'Preemptive priority scheduling',
    group: 'Operating Systems',
    tags: ['Operating Systems', 'CPU scheduling'],
    summary: 'A process with a higher priority can interrupt a running process with a lower priority as soon as it arrives.',
    intro: [
      'Preemptive priority scheduling follows the same rule as the non-preemptive version, but it also checks every time a new process arrives. If the newcomer has a higher priority than the running process, it takes the CPU immediately.',
      'The interrupted process goes back to waiting, with whatever time it still needs.',
    ],
    steps: [
      'At every arrival, compare the priorities of the waiting processes and the running one.',
      'Pick the process with the lowest priority number. A tie never makes the running process switch.',
      'Run it until it finishes or until a process arrives, then choose again.',
    ],
    example: {
      intro: `Four processes, A to D:\n\n${PROCS_PRIORITY}\n\nA starts, but B arrives at time 2 with a higher priority and takes over. D arrives later with priority 2, which is not higher than B, so B finishes first. The average waiting time is:`,
      code: '5.0 time units',
      after: 'Process C, with the lowest priority, still waits the longest.',
    },
    facts: [
      'It is preemptive, so urgent work starts straight away.',
      'It causes more context switches than the non-preemptive version.',
      'Starvation is still possible without aging.',
    ],
    strengths: ['Urgent work gets the CPU as soon as it arrives.', 'Suits systems with clear levels of importance.'],
    limits: ['Low-priority processes can starve.', 'Priorities do not take burst time into account.'],
    lab: schedLab('Preemptive Priority', ' Watch for the point where the higher-priority process interrupts the running one.'),
  },
  {
    slug: 'hrrn-cpu-scheduling',
    name: 'Highest Response Ratio Next (HRRN) scheduling',
    group: 'Operating Systems',
    tags: ['Operating Systems', 'CPU scheduling'],
    summary: 'HRRN favours short jobs but also rewards waiting, so long processes are not left behind forever.',
    intro: [
      'Highest Response Ratio Next tries to get the benefits of SJF without its main problem. For every waiting process it calculates a response ratio and runs the one with the highest value.',
      'The ratio is (waiting time + burst time) divided by burst time. A short job has a high ratio, and the longer any process waits, the higher its ratio grows.',
    ],
    steps: [
      'When the CPU is free, work out the response ratio for every waiting process.',
      'Pick the process with the highest ratio.',
      'Run it until it finishes. This version cannot be interrupted.',
      'Repeat until all processes are done.',
    ],
    example: {
      intro: `Four processes, A to D:\n\n${PROCS}\n\nWhen A finishes at time 7, the ratios are B: (5 + 4) / 4 = 2.25, C: (3 + 1) / 1 = 4 and D: (2 + 4) / 4 = 1.5. So C runs first. The average waiting time is:`,
      code: '4.0 time units',
      after: 'If B and D keep waiting, their ratios keep growing until they win.',
    },
    facts: [
      'It is non-preemptive.',
      'It needs the burst times, like SJF.',
      'It avoids starvation, because waiting always raises the ratio.',
    ],
    strengths: ['Good average waiting time.', 'Long processes eventually get their turn.'],
    limits: ['It must calculate a ratio for every waiting process at every decision.', 'It needs burst times in advance.'],
    lab: schedLab('Highest Response Ratio Next'),
  },

  /* ------------------------------------------------------------ memory allocation */
  {
    slug: 'first-fit-memory-allocation',
    name: 'First fit memory allocation',
    group: 'Operating Systems',
    tags: ['Operating Systems', 'Memory allocation'],
    summary: 'First fit gives a request the first free gap that is big enough, then stops searching.',
    intro: [
      'When a program asks for memory, the system looks through the free gaps and must choose one. First fit makes the quickest choice: it scans from the lowest address and takes the first gap that is big enough.',
      'It stops as soon as it finds one, so it does not spend time comparing the other gaps.',
    ],
    steps: [
      'Start at the lowest address and look at each free gap in turn.',
      'Take the first gap that is at least as big as the request.',
      'Place the block at the start of that gap. Any leftover space stays free as a smaller gap.',
      'If no gap is big enough, the request fails.',
    ],
    example: {
      intro: `${MEM_EXAMPLE}\n\nWith first fit: 212 goes into the 500 gap, 417 goes into 600, 112 goes into what is left of the 500 gap, and 426 has no gap big enough. Result:`,
      code: '3 requests placed, 1 request fails (426 KB)',
      after: 'The total free memory was enough, but no single gap could hold 426 KB. This is external fragmentation.',
    },
    facts: [
      'It is fast, because the search stops at the first match.',
      'It tends to use up the low-address end of memory first.',
      'Freed neighbouring gaps are merged to keep free space in as few pieces as possible.',
    ],
    strengths: ['Quick to run.', 'Simple to build and to understand.'],
    limits: ['Small gaps build up near the start of memory.', 'It can fail even when there is enough free memory in total.'],
    lab: memLab('First Fit'),
  },
  {
    slug: 'best-fit-memory-allocation',
    name: 'Best fit memory allocation',
    group: 'Operating Systems',
    tags: ['Operating Systems', 'Memory allocation'],
    summary: 'Best fit picks the smallest gap that is big enough, so the leftover space is as small as possible.',
    intro: [
      'Best fit looks at every free gap that is big enough and takes the smallest one. The goal is to leave as little unused space as possible after each allocation, so bigger gaps stay available for bigger requests.',
      'The price is a longer search, because it must check all the gaps before deciding.',
    ],
    steps: [
      'Look at every free gap.',
      'Among the gaps that are big enough, take the smallest. Ties go to the lower address.',
      'Place the block at the start of that gap. The leftover stays free.',
      'If no gap is big enough, the request fails.',
    ],
    example: {
      intro: `${MEM_EXAMPLE}\n\nWith best fit: 212 goes into 300, 417 goes into 500, 112 goes into 200, and 426 goes into 600. Result:`,
      code: 'All 4 requests placed',
      after: 'On the same list, first fit failed to place the last request.',
    },
    facts: [
      'It searches every gap, so each allocation takes longer.',
      'It leaves the smallest possible leftover for each request.',
      'Over time it can leave many tiny gaps that are too small to use.',
    ],
    strengths: ['Wastes the least space on each request.', 'Keeps large gaps for large requests.'],
    limits: ['Slower, since it checks every gap.', 'Tends to create very small leftover pieces.'],
    lab: memLab('Best Fit'),
  },
  {
    slug: 'worst-fit-memory-allocation',
    name: 'Worst fit memory allocation',
    group: 'Operating Systems',
    tags: ['Operating Systems', 'Memory allocation'],
    summary: 'Worst fit always takes the largest gap, hoping the leftover piece is still big enough to be useful.',
    intro: [
      'Worst fit does the opposite of best fit. It checks every free gap and takes the largest one. The idea is that cutting a request out of a big gap leaves a big leftover, which is more likely to be useful than a tiny sliver.',
      'In practice this idea does not always work out, which makes it a good example to compare against the others.',
    ],
    steps: [
      'Look at every free gap.',
      'Take the largest one. Ties go to the lower address.',
      'Place the block at the start of that gap. The leftover stays free.',
      'If even the largest gap is too small, the request fails.',
    ],
    example: {
      intro: `${MEM_EXAMPLE}\n\nWith worst fit: 212 goes into 600, 417 goes into 500, 112 goes into what is left of the 600 gap, and 426 has no gap big enough. Result:`,
      code: '3 requests placed, 1 request fails (426 KB)',
      after: 'The big gaps were used up early, so there was nothing large enough left for the last request.',
    },
    facts: [
      'It checks every gap, like best fit.',
      'It quickly uses up the largest gaps.',
      'It rarely performs better than first fit or best fit.',
    ],
    strengths: ['Leftover pieces tend to be large.', 'Useful for comparing strategies.'],
    limits: ['Large gaps disappear quickly.', 'Large requests are more likely to fail later.'],
    lab: memLab('Worst Fit'),
  },
];
