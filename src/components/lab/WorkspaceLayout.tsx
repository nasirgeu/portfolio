import { useEffect, useState, type ReactNode } from 'react';
import { Maximize, Minimize } from 'lucide-react';

interface Props {
  /** Inputs (algorithm, values, examples). */
  controls: ReactNode;
  /** The visualization, step log, results and design diagram. */
  visual: ReactNode;
  /** Execution controls. Shown in a bar that stays under the navbar while the visualization is on screen. */
  toolbar?: ReactNode;
}

const buttonClass =
  'btn !min-h-8 !px-3 !py-1 !text-xs !font-medium !tracking-normal !normal-case';

/**
 * Full screen for the whole workspace (#lab-workspace, see ExperimentWorkspace.astro).
 * It is offered only where the browser supports it. Which button shows ("Full screen" or "Exit")
 * is switched by the :fullscreen rules in lab.css.
 */
function FullScreenButtons() {
  const [supported, setSupported] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    setSupported(Boolean(document.fullscreenEnabled));
  }, []);

  if (!supported) return null;

  const enter = () => {
    const workspace = document.getElementById('lab-workspace');
    if (!workspace) return;
    const fail = () => {
      setUnavailable(true);
      window.setTimeout(() => setUnavailable(false), 2500);
    };
    // Some embedded browsers refuse full screen, or never answer. Tell the visitor instead of doing nothing.
    workspace.requestFullscreen().catch(fail);
    window.setTimeout(() => {
      if (!document.fullscreenElement) fail();
    }, 1500);
  };

  return (
    <span>
      <button
        type="button"
        data-fs-enter
        className={buttonClass}
        onClick={enter}
        disabled={unavailable}
        aria-label="Enter full screen"
      >
        {unavailable ? (
          'Full screen unavailable here'
        ) : (
          <>
            <Maximize size={14} aria-hidden="true" /> Full screen
          </>
        )}
      </button>
      <button
        type="button"
        data-fs-exit
        className={buttonClass}
        onClick={() => {
          if (document.fullscreenElement) void document.exitFullscreen();
        }}
        aria-label="Exit full screen"
      >
        <Minimize size={14} aria-hidden="true" /> Exit full screen
      </button>
    </span>
  );
}

/**
 * The shared experiment workspace, top to bottom on every screen size:
 * the inputs panel first, then the visualization. The visualization starts with a bar of
 * execution controls that stays on screen (under the navbar) while you scroll through it,
 * so the controls and the chart are always visible together.
 */
export default function WorkspaceLayout({ controls, visual, toolbar }: Props) {
  return (
    <div className="grid grid-cols-1 gap-5">
      <section aria-label="Inputs" className="lab-panel">
        <div className="lab-panel-head">
          <span>Inputs</span>
          <FullScreenButtons />
        </div>
        <div className="space-y-5 p-4 sm:p-5">{controls}</div>
      </section>

      <section aria-label="Visualization" className="lab-panel min-w-0">
        <div className="lab-panel-head">
          <span>Visualization</span>
        </div>
        {toolbar && (
          <div className="lab-toolbar" role="region" aria-label="Execution">
            {toolbar}
          </div>
        )}
        <div className="p-4 sm:p-5">{visual}</div>
      </section>
    </div>
  );
}
