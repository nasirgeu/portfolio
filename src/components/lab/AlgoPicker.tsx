interface Props<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** A sentence under the buttons that explains the selected option. */
  explain?: string;
}

/** Pill buttons for choosing an algorithm. The selected one has aria-pressed. */
export default function AlgoPicker<T extends string>({ label, options, value, onChange, explain }: Props<T>) {
  return (
    <div>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={`min-h-10 rounded-full border px-4 text-sm transition-colors ${
              value === o.value
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line text-muted hover:border-line-strong hover:text-fg'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {explain && <p className="mt-3 text-sm text-muted">{explain}</p>}
    </div>
  );
}
