import { ReactNode } from 'react';

interface EditorialCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  id?: string;
}

export function EditorialCard({ children, className = '', hover = true, id }: EditorialCardProps) {
  return (
    <div
      id={id}
      className={`${hover ? 'transition-all hover:-translate-y-0.5' : ''} ${className}`}
      style={{
        background: 'var(--ed-surface-elev)',
        border: '1px solid var(--ed-line)',
        borderRadius: 'var(--ed-radius-lg)',
        overflow: 'hidden',
        boxShadow: 'none',
        // @ts-expect-error custom property for hover shadow via CSS
        '--_shadow': 'var(--ed-shadow-card)',
      }}
      {...(hover ? { 'data-hover': '' } : {})}
    >
      {children}
    </div>
  );
}
