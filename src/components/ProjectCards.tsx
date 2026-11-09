import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ChevronRight, ExternalLink, Lock, X } from 'lucide-react';
import { projectCategories, projectsSection, type Project } from '../data/projects';

type Filter = 'All' | Project['category'];

interface Props {
  projects: readonly Project[];
}

/** Very small highlighter for the illustrative C++ snippet (no dependency). */
function highlight(code: string) {
  const re =
    /(\/\/.*)|\b(class|public|return|if|const|void|noexcept|alignof)\b|\b(std|byte|size_t|max_align_t)\b|\b(\d+)\b/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const cls = m[1] ? 'tok-c' : m[2] ? 'tok-k' : m[3] ? 'tok-t' : 'tok-n';
    out.push(
      <span key={key++} className={cls}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

function Architecture({ layers }: { layers: readonly string[] }) {
  return (
    <ol className="flex flex-col items-stretch gap-1.5" aria-label="Architecture layers, top to bottom">
      {layers.map((layer, i) => (
        <li key={layer} className="flex flex-col items-center gap-1.5">
          <div
            className={`w-full rounded-lg border px-3 py-2 text-center font-mono text-xs ${
              i === 1 ? 'border-accent text-accent bg-accent-soft' : 'border-line text-muted bg-bg'
            }`}
          >
            {layer}
          </div>
          {i < layers.length - 1 && <ArrowDown size={14} className="text-line-strong" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}

/** Card in the list: title, tagline and technologies. The arrow opens the full details in a popup. */
function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  return (
    <article className="card card-hover flex flex-col">
      <h3 className="m-0">
        <button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          className="flex w-full items-start justify-between gap-4 rounded-2xl p-6 text-left sm:p-7"
        >
          <span>
            <span className="eyebrow block">{project.category}</span>
            <span className="mt-2 block text-xl font-semibold tracking-tight">{project.title}</span>
            <span className="mt-1 block text-muted">{project.tagline}</span>
          </span>
          <ChevronRight size={22} aria-hidden="true" className="mt-1 shrink-0 text-muted" />
          <span className="sr-only">View details</span>
        </button>
      </h3>

      <div className="px-6 sm:px-7">
        <ul className="flex flex-wrap gap-2 pb-6" aria-label="Technologies">
          {project.tech.map((t) => (
            <li key={t} className="chip">
              {t}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/** Full details of one project, shown inside the popup. */
function ProjectDetails({ project }: { project: Project }) {
  const links = (project.links ?? []).filter((l) => l.url.length > 0);
  return (
    <div className="space-y-6">
      <p className="text-muted">{project.summary}</p>
      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          {project.extra && (
            <div className="mb-5">
              <h3 className="font-mono text-xs tracking-wider text-muted uppercase">{project.extra.label}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {project.extra.items.map((item) => (
                  <li key={item} className="chip !text-fg/90">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <h3 className="font-mono text-xs tracking-wider text-muted uppercase">{projectsSection.highlightsLabel}</h3>
          <ul className="mt-3 space-y-2">
            {project.highlights.map((h) => (
              <li key={h} className="flex gap-3">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-mono text-xs tracking-wider text-muted uppercase">Architecture</h3>
          <Architecture layers={project.architecture} />
        </div>
      </div>

      {project.snippet && (
        <figure>
          <figcaption className="mb-2 font-mono text-xs text-muted">{project.snippet.caption}</figcaption>
          <pre
            tabIndex={0}
            className="overflow-x-auto rounded-lg border border-line bg-bg p-4 font-mono text-[0.78rem] leading-relaxed"
          >
            <code>{highlight(project.snippet.code)}</code>
          </pre>
        </figure>
      )}

      {project.confidential && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Lock size={14} aria-hidden="true" />
          {projectsSection.internalNote}
        </p>
      )}

      {links.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              {...(l.url.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="btn"
            >
              {l.label}
              {l.url.startsWith('http') && (
                <>
                  <ExternalLink size={16} aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/** One shared popup (native <dialog>): Esc, the close button or a click outside closes it. */
function ProjectDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (project && !dialog.open) dialog.showModal();
    if (!project && dialog.open) dialog.close();
  }, [project]);

  // Keep the page behind the popup from scrolling.
  useEffect(() => {
    if (!project) return;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = previous;
    };
  }, [project]);

  return (
    <dialog
      ref={ref}
      className="book-dialog"
      aria-labelledby="project-dialog-title"
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {project && (
        <div className="max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface p-6 sm:px-8">
            <div>
              <p className="eyebrow">{project.category}</p>
              <h2 id="project-dialog-title" className="mt-1.5 text-2xl font-semibold tracking-tight">
                {project.title}
              </h2>
              <p className="mt-1 text-muted">{project.tagline}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close project details"
              data-tip="Close"
              className="tip tip-below inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="p-6 sm:p-8">
            <ProjectDetails project={project} />
          </div>
        </div>
      )}
    </dialog>
  );
}

export default function ProjectCards({ projects }: Props) {
  const [filter, setFilter] = useState<Filter>('All');
  const [openId, setOpenId] = useState<string | null>(null);
  const filters: Filter[] = ['All', ...projectCategories];
  const shown = projects.filter((p) => filter === 'All' || p.category === filter);
  const openProject = projects.find((p) => p.id === openId) ?? null;

  return (
    <div>
      <div role="group" aria-label="Filter projects by category" className="mb-8 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`min-h-10 rounded-full border px-4 text-sm transition-colors ${
              filter === f
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line text-muted hover:border-line-strong hover:text-fg'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2" aria-live="polite">
        {shown.map((p) => (
          <ProjectCard key={p.id} project={p} onOpen={() => setOpenId(p.id)} />
        ))}
      </div>
      <ProjectDialog project={openProject} onClose={() => setOpenId(null)} />
    </div>
  );
}
