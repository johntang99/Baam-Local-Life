'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';

const navLinks = [
  { href: '/', label: '首页' },
  { href: '/helper-2', label: '小帮手' },
  { href: '/discover', label: '逛逛晒晒' },
  { href: '/news', label: '新闻' },
  { href: '/guides', label: '生活资讯' },
  { href: '/businesses', label: '商家' },
  { href: '/events', label: '活动' },
  { href: '/discounts', label: '优惠' },
  { href: '/classifieds', label: '分类信息' },
];

function isActive(pathname: string, href: string): boolean {
  // Strip locale prefix (e.g. /zh/news -> /news)
  const path = pathname.replace(/^\/(zh|en)/, '') || '/';
  if (href === '/') return path === '/';
  return path.startsWith(href);
}

export function EditorialNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: 'rgba(251, 246, 236, 0.85)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderColor: 'var(--ed-line)',
      }}
    >
      <nav
        className="flex items-center justify-between gap-4"
        style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '12px 16px' }}
      >
        {/* Hamburger (mobile only) */}
        <button
          className="lg:hidden flex items-center justify-center"
          style={{ width: 36, height: 36, color: 'var(--ed-ink-soft)' }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="菜单"
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div
            className="flex items-center justify-center"
            style={{
              width: 32, height: 32,
              background: 'var(--ed-ink)', color: 'var(--ed-paper)',
              borderRadius: 9,
              fontFamily: 'var(--ed-font-serif-italic)',
              fontStyle: 'italic',
              fontSize: 16, fontWeight: 500,
            }}
          >
            B
          </div>
          <div className="hidden sm:block" style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Baam
            <span style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontWeight: 400, color: 'var(--ed-ink-muted)', fontSize: 14, marginLeft: 4 }}>
              纽约
            </span>
          </div>
        </Link>

        {/* Nav Links (desktop) */}
        <div className="hidden lg:flex items-center gap-6 flex-1 justify-center" style={{ fontSize: 14, color: 'var(--ed-ink-soft)' }}>
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative py-1 transition-colors hover:text-ed-accent whitespace-nowrap"
                style={active ? { color: 'var(--ed-ink)', fontWeight: 500 } : undefined}
              >
                {link.label}
                {active && (
                  <span
                    className="absolute left-0 right-0"
                    style={{ bottom: -4, height: 2, background: 'var(--ed-accent)', borderRadius: 2 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/search"
            className="flex items-center justify-center transition-colors"
            style={{ width: 36, height: 36, borderRadius: '50%', color: 'var(--ed-ink-soft)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </Link>

          <span
            className="hidden md:inline-block"
            style={{
              padding: '7px 14px',
              background: 'var(--ed-paper-warm)',
              borderRadius: 'var(--ed-radius-pill)',
              fontSize: 13,
              color: 'var(--ed-ink-soft)',
            }}
          >
            繁 · 法拉盛
          </span>

          <a
            href="/zh/auth/login"
            className="transition-transform hover:-translate-y-px"
            style={{
              padding: '8px 18px',
              background: 'var(--ed-ink)',
              color: 'var(--ed-paper)',
              borderRadius: 'var(--ed-radius-pill)',
              fontSize: 13,
            }}
          >
            登录
          </a>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div
          className="lg:hidden border-t"
          style={{
            borderColor: 'var(--ed-line)',
            background: 'var(--ed-paper)',
            padding: '8px 16px 16px',
          }}
        >
          <div className="flex flex-col">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="py-3 border-b transition-colors"
                  style={{
                    borderColor: 'var(--ed-line)',
                    fontSize: 15,
                    fontWeight: active ? 600 : 400,
                    color: active ? 'var(--ed-ink)' : 'var(--ed-ink-soft)',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
