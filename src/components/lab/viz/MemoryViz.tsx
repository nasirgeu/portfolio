import {
  FIT_LABEL,
  chooseGap,
  type AllocStep,
  type Block,
  type Fit,
  type Gap,
} from '../../../lib/allocator';
import { toneStyle } from '../colors';
import { Stat, StatGrid } from '../Stat';

const FITS: Fit[] = ['first', 'best', 'worst'];

interface Overlay {
  request: number | null;
  candidates: readonly Gap[];
  chosen: Gap | null;
}

interface StripProps {
  blocks: readonly Block[];
  memSize: number;
  /** Taller strip for the main view. */
  big?: boolean;
  overlay?: Overlay;
  /** Letter of the block that was just placed. */
  touched?: string | null;
  /** The gap that appeared when a block was freed. */
  freedGap?: Gap | null;
  label: string;
  /** Show start addresses under the strip. */
  ticks?: boolean;
}

const same = (a: Gap | null | undefined, b: Gap): boolean => !!a && a.start === b.start && a.size === b.size;

/** Memory drawn as one horizontal address space, to scale. */
export function AddressSpace({ blocks, memSize, big = false, overlay, touched, freedGap, label, ticks = false }: StripProps) {
  const height = big ? 'h-24' : 'h-9';
  return (
    <div>
      <div role="img" aria-label={label} className={`relative overflow-hidden rounded-md ${height}`}>
        {blocks.map((b) => {
          const frac = b.size / memSize;
          const isChosen = overlay !== undefined && b.id === null && same(overlay.chosen, b);
          const isCandidate = overlay !== undefined && b.id === null && overlay.candidates.some((g) => same(g, b));
          const tooSmall =
            overlay !== undefined && b.id === null && overlay.request !== null && b.size < overlay.request;
          const isTouched = b.id !== null && b.id === touched;
          const isFreed = b.id === null && freedGap !== undefined && freedGap !== null && same(freedGap, b);

          let tone = '';
          if (b.id !== null) tone = `tone ${isTouched ? 'tone-solid viz-in' : 'tone-soft'}`;
          const free = isChosen
            ? 'border-solid border-accent bg-accent-soft text-accent ring-2 ring-accent ring-inset'
            : isCandidate
              ? 'border-dashed border-accent text-accent'
              : tooSmall
                ? 'border-dashed border-warn/70 text-warn'
                : 'border-dashed border-line-strong text-muted';

          return (
            <div
              key={`${b.start}-${b.id ?? 'free'}`}
              title={`${b.id ?? 'free'}: ${b.start} to ${b.start + b.size} (${b.size} units)`}
              style={{
                left: `${(b.start / memSize) * 100}%`,
                width: `${frac * 100}%`,
                ...(b.id !== null ? toneStyle(b.id) : {}),
              }}
              className={`absolute top-0 flex ${height} flex-col items-center justify-center border font-mono transition-colors ${
                b.id !== null ? tone : free
              } ${b.id !== null ? 'gantt-seg' : ''} ${isFreed ? 'mem-free-in' : ''}`}
            >
              {frac >= 0.05 && (
                <>
                  <span className={`${big ? 'text-lg' : 'text-xs'} leading-none font-semibold`}>{b.id ?? b.size}</span>
                  {big && frac >= 0.1 && (
                    <span className="mt-1 text-xs leading-none">
                      {b.start}–{b.start + b.size}
                    </span>
                  )}
                  {isChosen && big && <span className="mt-1 text-xs tracking-wider uppercase">chosen</span>}
                </>
              )}
            </div>
          );
        })}
      </div>
      {ticks && (
        <div className="relative mt-1 h-4 font-mono text-xs text-muted" aria-hidden="true">
          {blocks
            .filter((b) => b.size / memSize >= 0.07 || b.start === 0)
            .map((b) => (
              <span key={b.start} style={{ left: `${(b.start / memSize) * 100}%` }} className="absolute">
                {b.start}
              </span>
            ))}
          <span className="absolute right-0">{memSize}</span>
        </div>
      )}
    </div>
  );
}

interface Props {
  step: AllocStep | null;
  blocks: readonly Block[];
  memSize: number;
  fit: Fit;
}

/**
 * Memory allocation: a large address space, the gap decision (candidates and the
 * chosen gap), how each strategy would choose on the same memory, and fragmentation.
 */
export default function MemoryViz({ step, blocks, memSize, fit }: Props) {
  const gaps = blocks.filter((b) => b.id === null);
  const free = step ? step.freeUnits : memSize;
  const largest = step ? step.largestFree : memSize;
  const used = memSize - free;
  const frag = free > 0 ? Math.round((1 - largest / free) * 100) : 0;

  // After a free, find the gap that now holds the freed block's old range.
  let freedGap: Gap | null = null;
  if (step && step.label.startsWith('-') && step.ok) {
    const letter = step.label.slice(1);
    const old = step.before.find((b) => b.id === letter);
    const g = old ? step.blocks.find((b) => b.id === null && b.start <= old.start && b.start + b.size > old.start) : undefined;
    if (g) freedGap = { start: g.start, size: g.size };
  }

  const overlay: Overlay | undefined =
    step && step.request !== null ? { request: step.request, candidates: step.candidates, chosen: step.chosen } : undefined;

  return (
    <div>
      {/* Address space */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-xs tracking-wider text-muted uppercase">Address space</h3>
        <p className="font-mono text-xs text-muted">
          addresses 0 to {memSize} ({memSize} units)
        </p>
      </div>
      <div className="mt-2 rounded-lg border border-line bg-bg p-3">
        <AddressSpace
          big
          ticks
          blocks={blocks}
          memSize={memSize}
          touched={step?.touched ?? null}
          freedGap={freedGap}
          label={`Memory of ${memSize} units: ${blocks
            .map((b) => `${b.id ?? 'free'} ${b.size} units from ${b.start}`)
            .join(', ')}`}
        />
        <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted">
          <span>solid colour: allocated block</span>
          <span>dashed: free gap</span>
        </p>
      </div>

      {/* The decision for this step */}
      {step && overlay && (
        <section aria-label="The gap decision" className="mt-6" key={`decision-${step.label}-${step.blocks.length}`}>
          <h3 className="font-mono text-xs tracking-wider text-muted uppercase">
            The decision: where does {step.label} ({overlay.request} units) go?
          </h3>
          <div className="viz-pop mt-2 rounded-lg border border-line bg-bg p-3">
            <p className="mb-2 text-xs text-muted">Memory before this step. Gaps that are big enough are outlined; too small ones are amber.</p>
            <AddressSpace
              ticks
              blocks={step.before}
              memSize={memSize}
              overlay={overlay}
              label={`Memory before ${step.label}, with ${step.candidates.length} gap${step.candidates.length === 1 ? '' : 's'} big enough`}
            />
            <p className="mt-3 text-sm">
              {step.chosen
                ? `${FIT_LABEL[fit]} chose the gap at address ${step.chosen.start} (size ${step.chosen.size}).`
                : step.ok
                  ? ''
                  : 'No gap was chosen: the request could not be placed.'}
            </p>
          </div>

          <h3 className="mt-5 font-mono text-xs tracking-wider text-muted uppercase">
            How each strategy would choose on this same memory
          </h3>
          <ul className="mt-2 space-y-2" aria-label="Strategy comparison">
            {FITS.map((f) => {
              const pick = step.candidates.length > 0 ? chooseGap(f, step.candidates) : null;
              return (
                <li
                  key={f}
                  className={`rounded-lg border p-3 ${f === fit ? 'border-accent bg-accent-soft' : 'border-line bg-bg'}`}
                >
                  <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                    <span className={`font-mono text-xs font-semibold ${f === fit ? 'text-accent' : ''}`}>
                      {FIT_LABEL[f]}
                      {f === fit && <span className="ml-2 font-normal text-muted">(selected)</span>}
                    </span>
                    <span className="font-mono text-xs text-muted">
                      {pick ? `gap at ${pick.start}, size ${pick.size}` : 'no gap is big enough'}
                    </span>
                  </div>
                  <AddressSpace
                    blocks={step.before}
                    memSize={memSize}
                    overlay={{ request: overlay.request, candidates: step.candidates, chosen: pick }}
                    label={`${FIT_LABEL[f]} ${pick ? `chooses the gap at ${pick.start}` : 'finds no gap'}`}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Free memory and fragmentation */}
      <section aria-label="Free memory and fragmentation" className="mt-6">
        <h3 className="font-mono text-xs tracking-wider text-muted uppercase">Free memory and fragmentation</h3>
        <div className="mt-2">
          <StatGrid>
            <Stat label="Free in total" value={free} hint={`of ${memSize} units`} />
            <Stat label="Largest free block" value={largest} tone="accent" />
            <Stat label="Used" value={`${Math.round((used / memSize) * 100)}%`} hint={`${used} units`} />
            <Stat label="Fragmentation" value={`${frag}%`} tone={frag > 0 ? 'warn' : 'default'} />
          </StatGrid>
        </div>
        <div className="mt-3 rounded-lg border border-line bg-bg p-3">
          <p className="mb-2 text-xs text-muted">
            The free memory, split by gap
            {gaps.length > 0 ? ` (${gaps.length} gap${gaps.length === 1 ? '' : 's'})` : ''}. The accent part is the largest.
          </p>
          {free === 0 ? (
            <p className="text-sm text-muted">There is no free memory.</p>
          ) : (
            <div
              role="img"
              aria-label={`Free memory by gap: ${gaps.map((g) => g.size).join(', ')} units`}
              className="flex h-6 gap-0.5 overflow-hidden rounded"
            >
              {gaps.map((g) => (
                <div
                  key={g.start}
                  title={`gap at ${g.start}: ${g.size} units`}
                  style={{ width: `${(g.size / free) * 100}%` }}
                  className={`h-6 ${g.size === largest ? 'bg-accent' : 'bg-warn/70'}`}
                />
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-muted">
            Fragmentation is how much of the free space is not in the largest gap. 0% means all free space is in one
            piece. Higher means it is split into smaller gaps that big requests cannot use.
          </p>
        </div>
      </section>
    </div>
  );
}
