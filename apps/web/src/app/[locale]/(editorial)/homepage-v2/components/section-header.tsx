import { ReactNode } from 'react';

interface SectionHeaderProps {
  number: string;       // e.g. "01"
  english: string;      // e.g. "Community"
  title: string;        // e.g. "逛逛晒晒"
  titleEm?: string;     // e.g. "discover daily"
  right?: ReactNode;    // e.g. action buttons
}

export function SectionHeader({ number, english, title, titleEm, right }: SectionHeaderProps) {
  return (
    <div
      className="flex items-end justify-between flex-wrap gap-6"
      style={{ marginBottom: 40 }}
    >
      <div>
        {/* Section number */}
        <div
          className="flex items-center gap-2.5"
          style={{
            fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic',
            fontSize: 13, color: 'var(--ed-accent)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          <span style={{ width: 28, height: 1, background: 'var(--ed-accent)', display: 'inline-block' }} />
          <span>N° {number} / {english}</span>
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: 'var(--ed-font-serif)',
          fontSize: 'clamp(28px, 3.6vw, 40px)',
          fontWeight: 600,
          letterSpacing: '-0.015em',
          lineHeight: 1.15,
        }}>
          {title}
          {titleEm && (
            <>
              {' '}
              <span style={{
                fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic',
                fontWeight: 400, color: 'var(--ed-ink-muted)',
              }}>
                {titleEm}
              </span>
            </>
          )}
        </h2>
      </div>

      {right && <div>{right}</div>}
    </div>
  );
}
