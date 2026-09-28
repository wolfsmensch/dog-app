import { useRef } from 'react';
import { CalendarIcon } from './icons';

interface Props {
  value: string;
  onChange: (date: string) => void;
  max?: string;
  label: string;
  disabled?: boolean;
}

/** Pill date field with a beige calendar button (opens the native picker). */
export function DateField({ value, onChange, max, label, disabled }: Props): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  const [y, m, d] = value ? value.split('-') : ['', '', ''];
  const display = value ? `${d}.${m}.${y}` : '—';

  return (
    <div className="text-input" style={{ position: 'relative', padding: '4px 12px 4px 18px' }}>
      <span style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>{display}</span>
      <input
        ref={inputRef}
        type="date"
        value={value}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        disabled={disabled}
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}
      />
      <button
        type="button"
        className="icon-btn"
        aria-label={label}
        disabled={disabled}
        onClick={() => {
          const el = inputRef.current;
          if (!el) return;
          if (typeof el.showPicker === 'function') {
            try {
              el.showPicker();
              return;
            } catch {
              // Fall through to focus() for browsers blocking showPicker.
            }
          }
          el.focus();
        }}
      >
        <CalendarIcon size={18} />
      </button>
    </div>
  );
}
