/**
 * Content for the decision-flow diagram shown under each Lab demo.
 * Every box explains, in simple words, what the real code in src/lib/ does.
 */

import type { Algorithm } from '../lib/pageReplacement';
import { ALGORITHM_LABEL, isPreemptive, type SchedAlgorithm } from '../lib/scheduling';
import { FIT_LABEL, type Fit } from '../lib/allocator';

export interface Branch {
  label: string;
  to: string;
}

export interface DiagramNode {
  id: string;
  kind: 'start' | 'step' | 'decision';
  title: string;
  short: string;
  does: string;
  where: string;
  why: string;
  /** For decisions: where each answer leads. */
  branches?: readonly Branch[];
}

/* ---------------------------------------------------------------- page replacement */

const VICTIM: Record<Algorithm, { short: string; does: string }> = {
  FIFO: {
    short: 'Oldest page leaves',
    does: 'Removes the page that has been in memory the longest. The code keeps the frames in the order they were loaded and removes the one at the front.',
  },
  LRU: {
    short: 'Longest unused leaves',
    does: 'Removes the page that was used the longest time ago. The code remembers when each frame was last used, including every hit, and picks the oldest one.',
  },
  Optimal: {
    short: 'Needed furthest ahead',
    does: 'Looks ahead in the list of requests and removes the page that will not be needed for the longest time, or never again. Real systems cannot see the future, so this is the best possible result to compare against.',
  },
};

export function pageReplacementDiagram(algo: Algorithm): DiagramNode[] {
  return [
    {
      id: 'request',
      kind: 'start',
      title: 'Next page request',
      short: 'Read one page number',
      does: 'The simulator reads the requests one page at a time. Each request becomes one step.',
      where: 'simulate() in src/lib/pageReplacement.ts',
      why: 'One request is one step, so Next and Back match the data exactly.',
    },
    {
      id: 'present',
      kind: 'decision',
      title: 'Is the page already in a frame?',
      short: 'Look through the frames',
      does: 'Checks whether the requested page is already in one of the frames.',
      where: 'frames.indexOf(page) in simulate()',
      why: 'This one check decides whether the request costs anything.',
      branches: [
        { label: 'Yes', to: algo === 'LRU' ? 'Hit: nothing is loaded, and the page becomes the most recently used' : 'Hit: nothing is loaded' },
        { label: 'No', to: 'Page fault: a page must be loaded' },
      ],
    },
    {
      id: 'empty',
      kind: 'decision',
      title: 'Is there an empty frame?',
      short: 'Use free space first',
      does: 'Looks for a frame that is still empty. Memory starts empty, so the first few faults only fill frames.',
      where: 'frames.indexOf(null) in simulate()',
      why: 'No page should be removed while there is still free space.',
      branches: [
        { label: 'Yes', to: 'Load the page into the first empty frame' },
        { label: 'No', to: 'Choose a victim' },
      ],
    },
    {
      id: 'victim',
      kind: 'step',
      title: `Choose a victim (${algo})`,
      short: VICTIM[algo].short,
      does: VICTIM[algo].does,
      where: `The ${algo} branch of simulate()`,
      why: 'This is the only place where the three algorithms differ. Everything else is the same.',
    },
    {
      id: 'record',
      kind: 'step',
      title: 'Replace, then write the step',
      short: 'Save a copy + a reason',
      does: 'Puts the new page in the victim frame, saves a copy of all the frames and writes a simple note, for example which page was removed and why.',
      where: 'steps.push({ ... }) in simulate()',
      why: 'Saving a copy for every step lets you move forward and back freely, and keeps the explanation matching the result.',
    },
  ];
}

/* ---------------------------------------------------------------- CPU scheduling */

const PICK: Record<SchedAlgorithm, string> = {
  FCFS: 'Picks the process that arrived first. If two arrive together, the one entered first goes first.',
  SJF: 'Picks the process with the shortest burst time. Ties go to the earlier arrival, then to the input order.',
  SRTF: 'Picks the process with the least time left. Ties go to the earlier arrival, and a tie never makes the running process switch.',
  RR: 'Picks the process at the front of the queue. Processes that arrive during a turn join the queue before the one that just used its turn.',
  NPP: 'Picks the waiting process with the lowest priority number, which means the highest priority. Ties go to the earlier arrival.',
  PP: 'Picks the waiting process with the lowest priority number. A tie never makes the running process switch.',
  HRRN: 'Calculates (waiting time + burst time) / burst time for every waiting process and picks the highest. The longer a process waits, the closer it gets to the front.',
};

function runText(algo: SchedAlgorithm, quantum: number): string {
  if (algo === 'RR')
    return `Runs for at most ${quantum} time unit${quantum === 1 ? '' : 's'}. If it is not finished, it goes to the back of the queue. If nobody else is waiting, it keeps the CPU.`;
  if (algo === 'SRTF' || algo === 'PP')
    return 'Runs until it finishes or until the next process arrives, whichever comes first. Then the choice is made again, so a new process can take over (preemption).';
  return 'Runs until it finishes. Nothing can interrupt it (non-preemptive).';
}

export function schedulingDiagram(algo: SchedAlgorithm, quantum: number): DiagramNode[] {
  const label = ALGORITHM_LABEL[algo];
  return [
    {
      id: 'clock',
      kind: 'start',
      title: 'Start the clock at time 0',
      short: 'Keep track of "now"',
      does: 'The simulator keeps one number, the current time, and moves it forward as processes run.',
      where: algo === 'RR' ? 'roundRobin() in src/lib/scheduling.ts' : 'simulateSchedule() in src/lib/scheduling.ts',
      why: 'Jumping straight to the next event, instead of moving one unit at a time, keeps it fast and exact.',
    },
    {
      id: 'arrived',
      kind: 'step',
      title: 'Who has arrived?',
      short: 'Build the ready list',
      does: algo === 'RR' ? 'Adds every process that has arrived by now to the queue, in order of arrival.' : 'Collects every process that has arrived by now and is not finished yet.',
      where: algo === 'RR' ? 'admit() in roundRobin()' : 'the ready list in simulateSchedule()',
      why: 'The CPU can only choose from processes that have already arrived.',
    },
    {
      id: 'anyone',
      kind: 'decision',
      title: 'Is anyone ready?',
      short: 'Or is the CPU idle?',
      does: 'If nothing has arrived yet, or everything that arrived is finished, the CPU has nothing to run.',
      where: 'the ready.length === 0 branch',
      why: 'Idle time is real, so it is shown on the chart and counted.',
      branches: [
        { label: 'Yes', to: 'Pick a process' },
        { label: 'No', to: 'Stay idle until the next arrival, then try again' },
      ],
    },
    {
      id: 'pick',
      kind: 'step',
      title: `Pick the next process (${algo})`,
      short: label,
      does: PICK[algo],
      where: 'the compare / primary rule',
      why: 'This is the main idea of each algorithm and the only place most of them differ. The tie-breaking rules are written at the top of the file.',
    },
    {
      id: 'run',
      kind: 'step',
      title: 'Run it',
      short: isPreemptive(algo) ? 'Until done or interrupted' : 'Until it finishes',
      does: runText(algo, quantum),
      where: 'the dur (duration) calculation',
      why: isPreemptive(algo)
        ? 'Checking again only when a process arrives (or a turn ends) is enough, because nothing else can change the best choice.'
        : 'Without preemption it is simple: the chosen process keeps the CPU until it is done.',
    },
    {
      id: 'record',
      kind: 'step',
      title: 'Record the part, with a reason',
      short: 'Gantt part + sentence',
      does: 'Adds a part to the Gantt chart (joining the previous part if the same process continues), writes a simple reason and moves the clock forward. This repeats until every process has finished.',
      where: 'segments.push({ ... })',
      why: 'The chart, the step log and the table all use these same parts, so they always match.',
    },
    {
      id: 'totals',
      kind: 'step',
      title: 'Work out the results',
      short: 'Turnaround and waiting',
      does: 'Turnaround time = finish time minus arrival time. Waiting time = turnaround time minus burst time. Both are then averaged.',
      where: 'summarize() in src/lib/scheduling.ts',
      why: 'These two averages are how textbooks compare the algorithms, so the tests check them against answers worked out by hand.',
    },
  ];
}

/* ---------------------------------------------------------------- memory allocation */

const CHOOSE: Record<Fit, string> = {
  first: 'Takes the first gap, starting from the lowest address, that is big enough, and stops searching there.',
  best: 'Checks every gap that is big enough and takes the smallest one, so the leftover is as small as possible. Ties go to the lower address.',
  worst: 'Checks every gap that is big enough and takes the largest one, hoping the leftover stays useful. Ties go to the lower address.',
};

export function allocatorDiagram(fit: Fit): DiagramNode[] {
  return [
    {
      id: 'op',
      kind: 'start',
      title: 'Next operation',
      short: 'Allocate or free',
      does: 'The simulator reads the operations one at a time, such as A5 (allocate 5 units as block A) or -A (free block A).',
      where: 'simulateAllocator() in src/lib/allocator.ts',
      why: 'One operation is one step, so Next and Back match the data exactly.',
    },
    {
      id: 'kind',
      kind: 'decision',
      title: 'Allocate or free?',
      short: 'Two different paths',
      does: 'An allocation needs a gap. A free gives memory back and may join gaps together.',
      where: 'the op.kind check',
      why: 'The two operations change memory in opposite ways, so each one has its own rules.',
      branches: [
        { label: 'Allocate', to: 'Check the letter, then look for a gap' },
        { label: 'Free', to: 'Free the block and merge it with free neighbours' },
      ],
    },
    {
      id: 'free',
      kind: 'step',
      title: 'Free and merge',
      short: 'Join neighbouring gaps',
      does: 'Marks the block as free, then joins it with any free gap right next to it. This keeps free space in as few pieces as possible. If you free a letter that is not in memory, you are told instead of it being ignored.',
      where: 'the "free" branch (the merged list)',
      why: 'Without merging, two small free gaps side by side could not fit one bigger request.',
    },
    {
      id: 'exists',
      kind: 'decision',
      title: 'Is the letter already in memory?',
      short: 'Names must be unique',
      does: 'Each block has a one-letter name, so the same letter cannot be allocated twice at the same time.',
      where: 'blocks.some(b => b.id === op.id)',
      why: 'It keeps the memory map clear, and you are told what to do instead of seeing a silent change.',
      branches: [
        { label: 'Yes', to: 'Report it and change nothing' },
        { label: 'No', to: 'Look for a gap' },
      ],
    },
    {
      id: 'any',
      kind: 'decision',
      title: 'Is any single gap big enough?',
      short: 'Memory must be in one piece',
      does: 'Looks for free gaps that are at least as big as the request. Free units spread over several small gaps do not count.',
      where: 'the gaps list',
      why: 'This is where external fragmentation shows up: there is enough free memory in total, but no single gap is big enough.',
      branches: [
        { label: 'Yes', to: `Choose a gap (${FIT_LABEL[fit]})` },
        { label: 'No', to: 'The request fails, and the note explains why' },
      ],
    },
    {
      id: 'choose',
      kind: 'step',
      title: `Choose a gap (${FIT_LABEL[fit]})`,
      short: fit === 'first' ? 'First big enough' : fit === 'best' ? 'Smallest big enough' : 'Largest gap',
      does: CHOOSE[fit],
      where: 'the chosen gap loop',
      why: 'This is the only place where the three strategies differ. Everything else is the same.',
    },
    {
      id: 'split',
      kind: 'step',
      title: 'Place the block and split the gap',
      short: 'Leftover stays free',
      does: "The block starts at the first address of the gap. If the gap was bigger than the request, the leftover units stay free as a new, smaller gap right after the block.",
      where: 'the next (split) list',
      why: 'Splitting is what slowly breaks free memory into smaller and smaller gaps.',
    },
    {
      id: 'record',
      kind: 'step',
      title: 'Save the step, with a reason',
      short: 'Copy of memory + numbers',
      does: 'Saves a copy of the whole memory map with the totals (total free memory and the largest single gap) and writes a simple note.',
      where: 'push() in simulateAllocator()',
      why: 'The memory strip, the table, the numbers and the step log all come from this one saved step.',
    },
  ];
}
