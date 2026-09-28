/**
 * Outline SVG icons traced 1:1 from the Claude Design prototype.
 * All icons use currentColor, round caps/joins; size via props.
 */

interface IconProps {
  size?: number;
  filled?: boolean;
}

function base(size: number, strokeWidth: number, filled: boolean) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: filled ? 'currentColor' : 'none',
    stroke: filled ? 'none' : 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
}

export function HomeIcon({ size = 24, filled = false }: IconProps): React.JSX.Element {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 3.5 3 10.5h2.5V20h5v-5.4h3V20h5V10.5H21z" />
      </svg>
    );
  }
  return (
    <svg {...base(size, 2.75, false)}>
      <path d="M3 10.5 12 3.5l9 7" />
      <path d="M5.5 9.8V20h13V9.8" />
      <path d="M9.8 20v-5.4h4.4V20" />
    </svg>
  );
}

export function CalendarIcon({ size = 24, filled = false }: IconProps): React.JSX.Element {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M7 2.5v2h10v-2h2v2h1.5A1.5 1.5 0 0 1 22 6v12.5a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18.5V6a1.5 1.5 0 0 1 1.5-1.5H5v-2zm-1 8v8h12v-8z" />
      </svg>
    );
  }
  return (
    <svg {...base(size, 2.75, false)}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="4" />
      <path d="M8 3v3.5M16 3v3.5M3.5 10.5h17" />
    </svg>
  );
}

export function ChartIcon({ size = 24, filled = false }: IconProps): React.JSX.Element {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M4 4h2.5v15.5H20V21H4zM7.5 16.2l4.6-4.6 2.6 2.2 5-6.8 1.7 1.3-6.6 9-2.7-2.3-3 3z" />
      </svg>
    );
  }
  return (
    <svg {...base(size, 2.75, false)}>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 15.5 12 11l3 2.5 4-5.5" />
    </svg>
  );
}

export function PawIcon({ size = 24, filled = false }: IconProps): React.JSX.Element {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M7.3 4.5c-1.3-.4-2.5 1-2.5 3s1 3.4 2.2 3.4 2-1.6 2-3.4-1-2.8-1.7-3zm9.4 0c-1.3.2-1.7 1-1.7 3s.8 3.4 2 3.4 2.2-1.4 2.2-3.4-1.2-3.4-2.5-3zM12 11.4c-2.9 0-7.5 2.4-7.5 5.3 0 1.9 1.5 3 3 3 1.4 0 2.4-.8 4.5-.8s3.1.8 4.5.8c1.5 0 3-1.1 3-3 0-2.9-4.6-5.3-7.5-5.3z" />
      </svg>
    );
  }
  return (
    <svg {...base(size, 2.6, false)}>
      <path d="M10 4.6c0-1.3-1.5-2.3-2.4-1.1-.5.7-.9 1.9-.9 3.3s.4 2.3.9 2.9M14 4.6c0-1.3 1.5-2.3 2.4-1.1.5.7.9 1.9.9 3.3s-.4 2.3-.9 2.9" />
      <path d="M8 13.5c-1.9 1-3.3 2.4-3.3 4.3S6 20.6 8 19.7s2.4-1 3.9-1 1.9 0 3.9 1 3.3-.5 3.3-2.3-1.4-3.3-3.3-4.3" />
    </svg>
  );
}

export function LockIcon({ size = 56 }: { size?: number }): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3.5" y="10.5" width="17" height="10.5" rx="3.4" />
      <path d="M7.5 10.5V7.6a4.5 4.5 0 0 1 9 0v2.9" />
      <circle cx="12" cy="15.6" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PencilIcon({ size = 19 }: { size?: number }): React.JSX.Element {
  return (
    <svg {...base(size, 2.75, false)}>
      <path d="M17 3.5 20.5 7 9 18.5H5.5V15z" />
      <path d="M14 6.5 17.5 10" />
    </svg>
  );
}

export function TrashIcon({ size = 17 }: { size?: number }): React.JSX.Element {
  return (
    <svg {...base(size, 2.75, false)}>
      <path d="M4.5 7h15M9.5 7V4.5h5V7M7 7l1 13h8l1-13" />
    </svg>
  );
}

export function CheckIcon({ size = 19 }: { size?: number }): React.JSX.Element {
  return (
    <svg {...base(size, 2.75, false)}>
      <path d="M5 12.5 10 17.5 19.5 7" />
    </svg>
  );
}

export function PlusIcon({ size = 22 }: { size?: number }): React.JSX.Element {
  return (
    <svg {...base(size, 2.75, false)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 20 }: { size?: number }): React.JSX.Element {
  return (
    <svg {...base(size, 2.75, false)}>
      <path d="M14.5 5 8 12l6.5 7" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 20 }: { size?: number }): React.JSX.Element {
  return (
    <svg {...base(size, 2.75, false)}>
      <path d="M9.5 5 16 12l-6.5 7" />
    </svg>
  );
}
