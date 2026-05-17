'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/lib/i18n/routing';
import { SectionHeader } from './section-header';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface BusinessesSectionProps {
  bizByCategory: Record<string, AnyRow[]>;
  categories: AnyRow[];
  coverPhotos: Record<string, string>;
}

const imgGradients = [
  'linear-gradient(135deg, #C9B599 0%, #7A6850 100%)',
  'linear-gradient(135deg, #A8C4A2 0%, #4D6B48 100%)',
  'linear-gradient(135deg, #7FA8B8 0%, #3D5A6B 100%)',
  'linear-gradient(135deg, #D9A89A 0%, #7D3F2E 100%)',
];

export function BusinessesSection({ bizByCategory, categories, coverPhotos }: BusinessesSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failedCovers, setFailedCovers] = useState<Record<string, boolean>>({});

  // Auto-rotate only through categories that have featured businesses
  const populatedIndices = categories.map((cat, i) => ({ i, count: (bizByCategory[cat.slug] || []).length })).filter((x) => x.count > 0).map((x) => x.i);

  useEffect(() => {
    if (paused || populatedIndices.length === 0) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const curPos = populatedIndices.indexOf(prev);
        const nextPos = (curPos + 1) % populatedIndices.length;
        return populatedIndices[nextPos];
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [paused, populatedIndices.join(',')]);

  if (categories.length === 0) return null;

  const currentCat = categories[activeIndex];
  const currentBiz = bizByCategory[currentCat?.slug] || [];

  return (
    <section style={{ padding: '88px 0' }}>
      <div style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '0 32px' }}>
        <SectionHeader
          number="06"
          english="Directory"
          title="推荐商家"
          titleEm="trusted locals"
          right={
            <Link href="/businesses" className="inline-flex items-center gap-1.5 transition-all" style={{ fontSize: 14, color: 'var(--ed-ink-soft)' }}>
              浏览商家目录
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </Link>
          }
        />

        {/* Category tabs — auto-rotate, pause on hover, click navigates */}
        <div
          className="flex gap-1 overflow-x-auto"
          style={{ marginBottom: 28, scrollbarWidth: 'none' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/businesses?category=${cat.slug}`}
              className="transition-all flex-shrink-0 whitespace-nowrap"
              style={{
                padding: '6px 12px', borderRadius: 'var(--ed-radius-pill)', fontSize: 13,
                background: i === activeIndex ? 'var(--ed-ink)' : 'transparent',
                color: i === activeIndex ? 'var(--ed-paper)' : 'var(--ed-ink-soft)',
                border: i === activeIndex ? '1px solid var(--ed-ink)' : '1px solid var(--ed-line)',
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {cat.icon} {cat.name_zh}
            </Link>
          ))}
        </div>

        {/* Business grid — 4 columns, filtered by active category */}
        {currentBiz.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>{currentCat?.icon || '🏢'}</p>
            <p style={{ fontSize: 14, color: 'var(--ed-ink-muted)', marginBottom: 16 }}>
              该分类暂无推荐商家
            </p>
            <Link
              href={`/businesses?category=${currentCat?.slug || ''}`}
              style={{ fontSize: 13, color: 'var(--ed-accent)', fontWeight: 500 }}
            >
              浏览全部{currentCat?.name_zh || ''}商家 →
            </Link>
          </div>
        ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {currentBiz.slice(0, 8).map((biz, i) => {
            const name = biz.display_name_zh || biz.display_name || '商家';
            const firstChar = name[0] || '🏢';
            const cover = coverPhotos[biz.id];
            const hasValidCover = Boolean(cover) && !failedCovers[biz.id];
            const street = (biz.address_full || '').replace(/,?\s*(NY|New York)\s*\d{0,5},?\s*(USA|美国)?$/i, '').trim().replace(/,\s*$/, '');
            const addr = [street, biz.city].filter(Boolean).join(', ');

            return (
              <Link
                key={biz.id}
                href={`/businesses/${biz.slug}`}
                className="block transition-all hover:-translate-y-1"
                style={{
                  background: 'var(--ed-surface-elev)',
                  border: '1px solid var(--ed-line)',
                  borderRadius: 'var(--ed-radius-lg)',
                  overflow: 'hidden',
                }}
              >
                {/* Image */}
                <div className="relative" style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                  {hasValidCover ? (
                    <img
                      src={cover}
                      alt={name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={() => {
                        setFailedCovers((prev) => ({ ...prev, [biz.id]: true }));
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: imgGradients[i % imgGradients.length] }}>
                      <span style={{ fontSize: 32, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>{firstChar}</span>
                    </div>
                  )}
                  {biz.avg_rating && (
                    <div
                      className="absolute flex items-center gap-1"
                      style={{
                        bottom: 8, right: 8, padding: '3px 8px',
                        background: 'rgba(255,253,248,0.92)', backdropFilter: 'blur(6px)',
                        borderRadius: 'var(--ed-radius-pill)', fontSize: 11.5, fontWeight: 500, zIndex: 2,
                      }}
                    >
                      <span style={{ color: 'var(--ed-amber)' }}>★</span>
                      <span>{Number(biz.avg_rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '14px 16px' }}>
                  <h3 style={{
                    fontFamily: 'var(--ed-font-serif)', fontSize: 14.5, fontWeight: 600,
                    lineHeight: 1.35, marginBottom: 6,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {name}
                  </h3>
                  {addr && (
                    <p className="flex items-center gap-1 truncate" style={{ fontSize: 12, color: 'var(--ed-ink-muted)', marginBottom: 8 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                      {addr}
                    </p>
                  )}
                  {biz.phone && (
                    <p style={{ fontSize: 12, color: 'var(--ed-ink-muted)' }}>{biz.phone}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        )}
      </div>
    </section>
  );
}
