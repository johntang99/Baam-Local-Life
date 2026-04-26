import { Link } from '@/lib/i18n/routing';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface DealsSectionProps {
  deals: AnyRow[];
}

function daysLeft(endDate: string | null): string {
  if (!endDate) return '长期有效';
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (diff <= 0) return '已结束';
  if (diff === 1) return '最后1天';
  return `还剩 ${diff} 天`;
}

function formatBadge(deal: AnyRow): string {
  if (deal.discount_type === 'price' && deal.original_price && deal.discount_price) {
    return `-${Math.round((1 - deal.discount_price / deal.original_price) * 100)}%`;
  }
  if (deal.discount_type === 'percent' && deal.discount_percent) {
    return `${deal.discount_percent}% OFF`;
  }
  return deal.discount_label || '优惠';
}

function getCategoryLabel(deal: AnyRow): string {
  if (deal.discount_type === 'bogo') return '🎁 买赠';
  if (deal.discount_type === 'freebie') return '🆓 免费';
  if (deal.discount_type === 'percent') return '🏮 折扣';
  return '🍜 美食';
}

const fallbackImages = [
  'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=300&fit=crop&q=80',
];

export function DealsSection({ deals }: DealsSectionProps) {
  if (deals.length === 0) return null;

  const hero = deals[0];
  const stacks = deals.slice(1, 4);
  const heroImg = hero.cover_photo || fallbackImages[0];
  const heroBadge = formatBadge(hero);
  const heroRemaining = daysLeft(hero.end_date);
  const heroBizName = hero.businesses?.display_name_zh || hero.businesses?.display_name || '';

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'var(--ed-ink)', padding: '88px 0' }}
    >
      {/* Radial gradients */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 45% 60% at 10% 30%, rgba(199,62,29,0.15), transparent 60%), radial-gradient(ellipse 40% 50% at 90% 70%, rgba(212,160,23,0.12), transparent 60%)',
      }} />

      <div style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '0 32px', position: 'relative' }}>
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-6" style={{ marginBottom: 44 }}>
          <div>
            <div className="flex items-center gap-2.5" style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontSize: 13, color: 'var(--ed-accent-soft)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              <span style={{ width: 28, height: 1, background: 'var(--ed-accent-soft)', display: 'inline-block' }} />
              <span>N° 05 / Deals</span>
            </div>
            <h2 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 'clamp(28px, 3.6vw, 40px)', fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.15, color: 'var(--ed-paper)' }}>
              限时优惠{' '}
              <span style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontWeight: 400, color: 'var(--ed-amber-soft)' }}>hot deals</span>
            </h2>
          </div>
          <Link href="/discounts" className="inline-flex items-center gap-1.5 transition-all" style={{ fontSize: 14, color: 'var(--ed-ink-muted)' }}>
            查看全部优惠
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </Link>
        </div>

        {/* Hero + Stack Grid (40:60) */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-[2fr_3fr]">

          {/* LEFT: Hero Deal */}
          <Link
            href={`/discounts/${hero.slug}`}
            className="block transition-all hover:-translate-y-0.5"
            style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--ed-surface-elev)' }}
          >
            {/* Hero image */}
            <div className="relative" style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
              <img src={heroImg} alt={hero.title_zh} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.5) 100%)' }} />
              <div className="absolute flex items-center gap-2" style={{ top: 20, left: 20, zIndex: 2 }}>
                <span style={{ padding: '8px 16px', background: 'var(--ed-accent)', color: 'var(--ed-paper)', borderRadius: 'var(--ed-radius-pill)', fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontSize: 20, fontWeight: 500, lineHeight: 1 }}>
                  {heroBadge}
                </span>
                <span style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: 'var(--ed-paper)', borderRadius: 'var(--ed-radius-pill)', fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontSize: 12 }}>
                  {heroRemaining}
                </span>
              </div>
            </div>
            {/* Hero body */}
            <div style={{ padding: '24px 28px 28px' }}>
              {heroBizName && (
                <div style={{ fontSize: 12, color: 'var(--ed-ink-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  {heroBizName}
                </div>
              )}
              <h3 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 22, fontWeight: 600, lineHeight: 1.35, marginBottom: 12 }}>
                {hero.title_zh}
              </h3>
              {hero.short_desc_zh && (
                <p style={{ fontSize: 14, color: 'var(--ed-ink-soft)', lineHeight: 1.65, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {hero.short_desc_zh}
                </p>
              )}
              {hero.discount_type === 'price' && hero.original_price && hero.discount_price && (
                <div className="flex items-baseline gap-2.5" style={{ paddingTop: 16, borderTop: '1px dashed var(--ed-line)' }}>
                  <span style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontSize: 32, fontWeight: 500, color: 'var(--ed-accent)', lineHeight: 1 }}>
                    ${hero.discount_price}
                  </span>
                  <span style={{ fontSize: 16, color: 'var(--ed-ink-muted)', textDecoration: 'line-through' }}>
                    ${hero.original_price}
                  </span>
                  <span style={{ fontSize: 12, color: '#25A06E', fontWeight: 500, marginLeft: 'auto', padding: '4px 10px', background: 'rgba(37,160,110,0.1)', borderRadius: 'var(--ed-radius-pill)' }}>
                    省 ${(hero.original_price - hero.discount_price).toFixed(0)}
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* RIGHT: 3 Stacked Cards */}
          <div className="flex flex-col gap-5">
            {stacks.map((deal, i) => {
              const img = deal.cover_photo || fallbackImages[(i + 1) % fallbackImages.length];
              const badge = formatBadge(deal);
              const bizName = deal.businesses?.display_name_zh || deal.businesses?.display_name || '';
              const remaining = daysLeft(deal.end_date);
              const catLabel = getCategoryLabel(deal);

              return (
                <Link
                  key={deal.id}
                  href={`/discounts/${deal.slug}`}
                  className="flex transition-all hover:translate-x-1"
                  style={{
                    borderRadius: 16, overflow: 'hidden',
                    background: 'rgba(251,246,236,0.06)',
                    border: '1px solid rgba(251,246,236,0.08)',
                  }}
                >
                  {/* Square image */}
                  <div className="hidden sm:block" style={{ width: 160, minWidth: 160, maxHeight: 160, flexShrink: 0, overflow: 'hidden', borderRadius: 12, margin: '12px 0 12px 12px', alignSelf: 'flex-start', position: 'relative' }}>
                    <img src={img} alt={deal.title_zh} style={{ width: 160, height: 160, objectFit: 'cover', display: 'block' }} />
                    <span style={{ position: 'absolute', top: 10, left: 10, padding: '3px 8px', background: 'var(--ed-accent)', color: 'var(--ed-paper)', borderRadius: 6, fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontSize: 12, fontWeight: 500, zIndex: 2 }}>
                      {badge}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: 'var(--ed-paper)', minWidth: 0 }}>
                    {bizName && (
                      <div style={{ fontSize: 11, color: 'var(--ed-ink-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                        {bizName}
                      </div>
                    )}
                    <h3 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 15, fontWeight: 600, lineHeight: 1.4, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--ed-paper)' }}>
                      {deal.title_zh}
                    </h3>
                    {deal.short_desc_zh && (
                      <p style={{ fontSize: 12, color: 'rgba(251,246,236,0.55)', lineHeight: 1.55, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {deal.short_desc_zh}
                      </p>
                    )}
                    <div className="flex items-center gap-2.5" style={{ fontSize: 12, marginTop: 'auto' }}>
                      <span style={{ padding: '3px 8px', background: 'rgba(212,160,23,0.15)', color: 'var(--ed-amber-soft)', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>
                        {catLabel}
                      </span>
                      <span style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontSize: 11, color: 'var(--ed-ink-muted)', marginLeft: 'auto' }}>
                        {remaining}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg className="flex-shrink-0" style={{ alignSelf: 'center', marginRight: 16, color: 'var(--ed-ink-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom hint */}
        <div className="flex items-center justify-center gap-3" style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(251,246,236,0.06)' }}>
          <span style={{ width: 4, height: 4, background: 'var(--ed-amber)', borderRadius: '50%' }} />
          <Link href="/discounts" style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontSize: 12, color: 'var(--ed-ink-muted)' }}>
            还有更多优惠活动进行中 · 查看全部 →
          </Link>
          <span style={{ width: 4, height: 4, background: 'var(--ed-amber)', borderRadius: '50%' }} />
        </div>
      </div>
    </section>
  );
}
