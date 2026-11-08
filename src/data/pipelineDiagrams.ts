/**
 * "Under the hood" for each experiment: the path of the data from the visitor's
 * input to the pixels. Every box names the real function or component.
 */

import type { DiagramNode } from './designDiagrams';
import type { ExperimentSlug } from './labExperiments';

const testsNode = (suite: string, what: string): DiagramNode => ({
  id: 'tests',
  kind: 'step',
  title: 'Automated checks',
  short: 'Tests the results using npm test.',
  does: what,
  where: `tests/${suite}.test.ts, run with npm test`,
  why: 'A simulator that teaches a concept must be right. If a rule changes, a failing check says so before a visitor sees a wrong answer.',
});

export function pipelineDiagram(slug: ExperimentSlug): DiagramNode[] {
  if (slug === 'page-replacement') {
    return [
      {
        id: 'input',
        kind: 'start',
        title: 'Input',
        short: 'Page requests, number of frames and selected algorithm.',
        does: 'You enter the page requests, choose the number of frames and select FIFO, LRU or Optimal. These inputs are stored in React state.',
        where: 'PageReplacementDemo.tsx (text, frameCount, algo)',
        why: 'Only the values you enter are stored. The rest of the results are calculated from those values, which helps keep everything consistent.',
      },
      {
        id: 'parse',
        kind: 'step',
        title: 'Parsing',
        short: 'Converts the entered text into numbers or shows an error message.',
        does: 'The text is split into page numbers. Letters, numbers above 99, an empty box or more than 40 requests produce a plain-English message instead of a result.',
        where: 'parseReferences() in src/lib/pageReplacement.ts',
        why: 'The simulator only ever receives valid data.',
      },
      {
        id: 'simulate',
        kind: 'step',
        title: 'Simulation',
        short: 'Runs the selected algorithm using a pure function.',
        does: 'simulate(algorithm, frames, requests) walks through the requests once. It uses no screen code, no randomness and no clock.',
        where: 'simulate() in src/lib/pageReplacement.ts',
        why: 'The same input always gives the same result, which makes it testable.',
      },
      {
        id: 'steps',
        kind: 'step',
        title: 'Step generation',
        short: 'Creates one step for every page request.',
        does: 'Every request becomes a step: the page, a snapshot of the frames, hit or fault, which frame changed, which page was removed, and the plain-English note. The page also runs all three algorithms, and FIFO with 1 to 7 frames, on the same requests for the comparison and the Belady view.',
        where: 'Step[] returned by simulate()',
        why: 'The explanation is written by the same code that makes the decision, so it can never disagree with the result.',
      },
      {
        id: 'viz',
        kind: 'step',
        title: 'Visualization',
        short: 'Displays memory frames, request history and explanations.',
        does: 'Back, Next and Play only move a cursor along the list of steps. FrameBlocks draws the frames for the step at the cursor, the history table and step log show everything up to it, and the speed control changes how fast Play moves the cursor.',
        where: 'components/lab/viz/FrameBlocks.tsx, StepLog.tsx, ExecutionControls.tsx',
        why: 'The screen never calculates the algorithm. It only shows what the simulation produced.',
      },
      testsNode(
        'pageReplacement',
        "Textbook answers worked out by hand (FIFO 15, LRU 12 and Optimal 9 faults on the classic requests), Belady's anomaly, a rule that Optimal never has more faults, and input checks.",
      ),
    ];
  }

  if (slug === 'cpu-scheduling') {
    return [
      {
        id: 'input',
        kind: 'start',
        title: 'Input',
        short: 'Arrival times, burst times, priorities and algorithm.',
        does: 'You enter arrival times and burst times. You can also enter priorities or a time quantum when the selected algorithm needs them. Then you choose one of the seven algorithms.',
        where: 'SchedulingDemo.tsx (arrival, burst, priority, quantumText, algo)',
        why: 'Only the values you enter are stored. The process information is created from those values whenever the simulation runs.',
      },
      {
        id: 'parse',
        kind: 'step',
        title: 'Parsing',
        short: 'Converts the entered numbers into processes A, B, C and so on.',
        does: 'The text boxes become a list of processes named A, B, C and so on. A burst of 0, lists of different lengths, a quantum outside 1 to 20 or more than 12 processes produce a plain-English message.',
        where: 'parseProcesses() and parseQuantum() in src/lib/scheduling.ts',
        why: 'The simulator only ever receives valid processes.',
      },
      {
        id: 'simulate',
        kind: 'step',
        title: 'Simulation',
        short: 'Runs the selected scheduling algorithm.',
        does: 'simulateSchedule(algorithm, processes, quantum) keeps a clock, builds the ready list, picks a process with the selected rule and runs it. Round Robin has its own function. Tie-breaking rules are written at the top of the file.',
        where: 'simulateSchedule() and roundRobin() in src/lib/scheduling.ts',
        why: 'Pure logic is easy to test: the same input always gives the same chart.',
      },
      {
        id: 'steps',
        kind: 'step',
        title: 'Step generation',
        short: 'Creates a step for each period when a process runs.',
        does: 'The result is a list of parts. Each has the process (or idle), start and end, the ready queue at that moment and the reason the scheduler chose it. Turnaround and waiting time are worked out from the finish times.',
        where: 'Segment[] and summarize() in src/lib/scheduling.ts',
        why: 'The chart, the queue, the reason and the table all come from the same parts.',
      },
      {
        id: 'viz',
        kind: 'step',
        title: 'Visualization',
        short: 'Displays the Gantt chart and related information.',
        does: "SchedulingViz draws the parts up to the cursor to scale, each process in its own colour, with the running process highlighted. Context switches and preemptions are found by comparing neighbouring parts. The ready queue and the scheduler's reason come straight from the part at the cursor.",
        where: 'components/lab/viz/SchedulingViz.tsx, ExecutionControls.tsx',
        why: 'The screen only shows what the simulation produced. Nothing is estimated.',
      },
      testsNode(
        'scheduling',
        'Hand-worked averages for all seven algorithms, idle gaps and ties, the ready queue at each part, and hundreds of random inputs that must obey rules such as "all CPU time is used" and "SRTF has the lowest average waiting time".',
      ),
    ];
  }

  if (slug === 'sorting') {
    return [
      {
        id: 'input',
        kind: 'start',
        title: 'Input',
        short: 'Numbers and selected algorithm.',
        does: 'You enter a list of numbers and choose one of the nine sorting algorithms. These inputs are stored in React state.',
        where: 'SortingDemo.tsx (text, algo)',
        why: 'Only your input is stored. The sorted list and all the steps are calculated from it.',
      },
      {
        id: 'parse',
        kind: 'step',
        title: 'Parsing',
        short: 'Converts the entered text into numbers or shows an error.',
        does: 'The text is split into whole numbers from 0 to 99. Letters, negatives, a single number or more than 16 numbers produce a plain-English message instead of a result.',
        where: 'parseNumbers() in src/lib/sorting.ts',
        why: 'The engine only ever receives a valid list.',
      },
      {
        id: 'simulate',
        kind: 'step',
        title: 'Simulation',
        short: 'Runs the selected sorting algorithm.',
        does: 'sort(algorithm, list) copies the list and runs the chosen algorithm on the copy. A small Recorder class counts comparisons and swaps, so every algorithm reports its work the same way.',
        where: 'sort() and the nine algorithm functions in src/lib/sorting.ts',
        why: 'The original list is never changed, there is no randomness and the same input always gives the same steps.',
      },
      {
        id: 'steps',
        kind: 'step',
        title: 'Step generation',
        short: 'Records every comparison, swap or write.',
        does: 'Each action records a step: the whole list, the positions being touched, the positions already in place, the running totals and a plain-English note written by the same code that made the move.',
        where: 'Step[] returned by sort()',
        why: 'The explanation can never disagree with what the algorithm actually did.',
      },
      {
        id: 'viz',
        kind: 'step',
        title: 'Visualization',
        short: 'Displays the bars, counters and operation history.',
        does: 'SortingViz draws one bar per value and colours the compared, swapped and finished bars. Back, Next and Play only move a cursor along the list of steps. The comparison table runs all nine algorithms on the same list.',
        where: 'components/lab/viz/SortingViz.tsx, ExecutionControls.tsx',
        why: 'The screen never sorts anything itself. It only shows what the engine produced.',
      },
      testsNode(
        'sorting',
        'Hand-counted comparisons and swaps (bubble 10 and 5 on 5 2 9 1 7), every algorithm on duplicates and reversed lists, and hundreds of random lists that must come out sorted and be the same values.',
      ),
    ];
  }

  if (slug === 'searching') {
    return [
      {
        id: 'input',
        kind: 'start',
        title: 'Input',
        short: 'List of numbers, target and selected algorithm.',
        does: 'You enter a list of numbers and a target value, then select Linear, Binary, Jump or Interpolation Search.',
        where: 'SearchingDemo.tsx (text, targetText, algo)',
        why: 'Only the list, target and selected algorithm are stored. The rest is calculated from them.',
      },
      {
        id: 'parse',
        kind: 'step',
        title: 'Parsing and preparation',
        short: 'Checks the input and sorts the list if needed.',
        does: 'The list and the target are checked. Binary, jump and interpolation search need sorted data, so the list is sorted first and the page says so.',
        where: 'parseList(), parseTarget() and prepareList() in src/lib/searching.ts',
        why: 'The page never runs binary search on a list where the answer would be wrong.',
      },
      {
        id: 'simulate',
        kind: 'step',
        title: 'Simulation',
        short: 'Runs the selected search algorithm.',
        does: 'search(algorithm, list, target) probes the list the way the chosen algorithm would and records every probe. Interpolation search shows the formula it used for each guess.',
        where: 'search() and the four algorithm functions in src/lib/searching.ts',
        why: 'The same input always gives the same probes, which makes the engine testable.',
      },
      {
        id: 'steps',
        kind: 'step',
        title: 'Step generation',
        short: 'Records every position checked.',
        does: 'Each probe becomes a step: the position looked at, the window that is still possible, every position checked so far, the comparison count and a plain-English note.',
        where: 'Step[] returned by search()',
        why: 'The shrinking window is data, not an animation trick, so it is always accurate.',
      },
      {
        id: 'viz',
        kind: 'step',
        title: 'Visualization',
        short: 'Shows the list, remaining search area and comparison count.',
        does: 'SearchingViz draws one cell per value. Cells outside the window fade, the probed cell is highlighted and the found cell turns green. The comparison table runs all four algorithms on the same list and target.',
        where: 'components/lab/viz/SearchingViz.tsx, ExecutionControls.tsx',
        why: 'The screen only shows what the engine produced.',
      },
      testsNode(
        'searching',
        'Hand-worked probes for all four algorithms, a rule that binary search never uses more than ⌊log₂ n⌋ + 1 comparisons, and hundreds of random lists where a present target must always be found and a missing one never.',
      ),
    ];
  }

  if (slug === 'graph-algorithms') {
    return [
      {
        id: 'input',
        kind: 'start',
        title: 'Input',
        short: 'Edges, selected algorithm and starting node.',
        does: 'You enter graph connections such as A-B:4 or A>B:2, choose one of eight algorithms and select a starting node when needed.',
        where: 'GraphDemo.tsx (text, algo, source)',
        why: "The graph is created from your input each time. This keeps the displayed graph and the algorithm's calculations in sync.",
      },
      {
        id: 'parse',
        kind: 'step',
        title: 'Parsing and validation',
        short: 'Converts the text into a graph or shows an error message.',
        does: 'The text becomes a list of nodes and weighted edges. Bad tokens, self-loops, repeated edges, weights out of range or too many nodes produce a plain-English message. A second check explains when the graph does not suit the algorithm, such as a negative weight for Dijkstra.',
        where: 'parseGraph() and requirement() in src/lib/graph.ts',
        why: 'The engine only receives graphs it can handle correctly.',
      },
      {
        id: 'simulate',
        kind: 'step',
        title: 'Simulation',
        short: 'Runs the selected graph algorithm.',
        does: 'runGraph(algorithm, graph, start) runs the algorithm. A Builder class takes a snapshot every time something is decided, so all eight algorithms record their steps in the same format.',
        where: 'runGraph() and the eight algorithm functions in src/lib/graph.ts',
        why: 'There is no screen code and no randomness, so each algorithm can be checked against known answers.',
      },
      {
        id: 'steps',
        kind: 'step',
        title: 'Step generation',
        short: 'Records node and edge states, working data and results.',
        does: 'Each step stores the state of every node and edge, the queue, stack, priority queue or sorted edge list, a table of distances or groups, the work done so far and a plain-English note.',
        where: 'Step[] and GraphResult returned by runGraph()',
        why: 'The picture, the data structure panel and the explanation all come from the same snapshot.',
      },
      {
        id: 'viz',
        kind: 'step',
        title: 'Visualization',
        short: 'Displays the graph and related information.',
        does: 'GraphViz draws the nodes on a circle with SVG, colours nodes and edges from the snapshot and shows weights and arrows. Back, Next and Play only move a cursor along the steps.',
        where: 'components/lab/viz/GraphViz.tsx, ExecutionControls.tsx',
        why: 'The screen only shows what the engine produced.',
      },
      testsNode(
        'graph',
        'Hand-worked answers for all eight algorithms, negative cycles and directed cycles, disconnected graphs, and hundreds of random graphs where Dijkstra, Bellman-Ford and Floyd-Warshall must agree and Prim and Kruskal must find the same tree weight.',
      ),
    ];
  }

  return [
    {
      id: 'input',
      kind: 'start',
      title: 'Input',
      short: 'Operations, memory size and allocation strategy.',
      does: 'You enter operations such as A5 or -A, choose the memory size and select First Fit, Best Fit or Worst Fit.',
      where: 'AllocatorDemo.tsx (text, memSize, fit)',
      why: 'Only the values you enter are stored. The memory layout and other results are calculated from them.',
    },
    {
      id: 'parse',
      kind: 'step',
      title: 'Parsing',
      short: 'Converts the entered text into memory operations.',
      does: 'The text becomes a list of allocate and free operations. A block bigger than the memory, nonsense, an empty box or more than 30 operations produce a plain-English message.',
      where: 'parseOps() in src/lib/allocator.ts',
      why: 'The simulator only ever receives valid operations.',
    },
    {
      id: 'simulate',
      kind: 'step',
      title: 'Simulation',
      short: 'Runs the selected allocation method.',
      does: 'simulateAllocator(strategy, memory size, operations) keeps the list of blocks and gaps. Choosing a gap uses chooseGap(), the single rule that defines first, best and worst fit.',
      where: 'simulateAllocator() and chooseGap() in src/lib/allocator.ts',
      why: 'The engine and the visualization share one rule, so the strategy comparison on screen is the real rule, not a copy.',
    },
    {
      id: 'steps',
      kind: 'step',
      title: 'Step generation',
      short: 'Creates one step for every operation.',
      does: 'Every operation becomes a step: memory before and after, the gaps that were big enough, the gap that was chosen, the totals and the plain-English note.',
      where: 'AllocStep[] returned by simulateAllocator()',
      why: 'Keeping "before" and "after" lets the screen show the decision and its effect.',
    },
    {
      id: 'viz',
      kind: 'step',
      title: 'Visualization',
      short: 'Displays the memory map and explains each decision.',
      does: 'MemoryViz draws memory as one horizontal address space, the candidate gaps and the chosen one, how all three strategies choose on that same memory, and the fragmentation numbers. Back, Next and Play move a cursor along the steps.',
      where: 'components/lab/viz/MemoryViz.tsx, ExecutionControls.tsx',
      why: 'The screen only shows what the simulation produced.',
    },
    testsNode(
      'allocator',
      'Hand-worked placements for all three strategies, merging on free, external fragmentation, the gaps considered and chosen at every step, and hundreds of random scripts that must keep memory fully covered.',
    ),
  ];
}
