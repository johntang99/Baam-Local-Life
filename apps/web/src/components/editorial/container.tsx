import { ReactNode } from 'react';

interface EditorialContainerProps {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}

export function EditorialContainer({ children, className = '', narrow = false }: EditorialContainerProps) {
  return (
    <div
      className={className}
      style={{
        maxWidth: narrow ? '800px' : 'var(--ed-container-max, 1240px)',
        margin: '0 auto',
        padding: '0 16px',
      }}
    >
      {children}
    </div>
  );
}
