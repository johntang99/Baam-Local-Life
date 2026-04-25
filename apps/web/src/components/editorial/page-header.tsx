import { Link } from '@/lib/i18n/routing';
import { ReactNode } from 'react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface EditorialPageHeaderProps {
  breadcrumbs?: Breadcrumb[];
  title: string;
  titleEm?: string;
  subtitle?: string;
  right?: ReactNode;
  gradient?: boolean;
}

export function EditorialPageHeader({ breadcrumbs, title, titleEm, subtitle, right, gradient = true }: EditorialPageHeaderProps) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        padding: '40px 0 36px',
        background: gradient ? 'var(--ed-paper)' : 'transparent',
      }}
    >
      {gradient && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 50% 70% at 80% 20%, rgba(212,160,23,0.06), transparent 60%), radial-gradient(ellipse 40% 60% at 20% 80%, rgba(199,62,29,0.05), transparent 60%)',
        }} />
      )}
      <div className="relative" style={{ maxWidth: 'var(--ed-container-max, 1240px)', margin: '0 auto', padding: '0 16px' }}>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 flex-wrap mb-4" style={{ fontSize: 13, color: 'var(--ed-ink-muted)' }}>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span style={{ color: 'var(--ed-line-strong)' }}>›</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="transition-colors hover:text-ed-accent">{crumb.label}</Link>
                ) : (
                  <span style={{ color: 'var(--ed-ink-soft)' }}>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 style={{
              fontFamily: 'var(--ed-font-serif)',
              fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: 700,
              letterSpacing: '-0.015em',
              lineHeight: 1.2,
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
            </h1>
            {subtitle && (
              <p className="mt-2" style={{ fontSize: 14, color: 'var(--ed-ink-soft)', lineHeight: 1.6 }}>
                {subtitle}
              </p>
            )}
          </div>
          {right && <div className="flex-shrink-0">{right}</div>}
        </div>
      </div>
    </div>
  );
}
