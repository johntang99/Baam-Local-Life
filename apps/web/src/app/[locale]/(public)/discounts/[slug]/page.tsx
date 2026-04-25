import { createClient } from '@/lib/supabase/server';
import { getCurrentSite } from '@/lib/sites';
import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';
import { EditorialContainer } from '@/components/editorial/container';
import { EditorialCard } from '@/components/editorial/card';
import type { Metadata } from 'next';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const site = await getCurrentSite();
  const { data } = await supabase
    .from('deals').select('title_zh, short_desc_zh')
    .eq('slug', slug).eq('site_id', site.id).eq('status', 'approved').single() as { data: { title_zh: string; short_desc_zh: string } | null };
  if (!data) return { title: 'Not Found' };
  return { title: `${data.title_zh} · 社区优惠 · Baam`, description: data.short_desc_zh || '' };
}

function daysLeft(endDate: string | null): string {
  if (!endDate) return '长期有效';
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (diff <= 0) return '已结束';
  if (diff === 1) return '最后1天！';
  return `还剩 ${diff} 天`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function DealDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const site = await getCurrentSite();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deal, error } = await (supabase as any)
    .from('deals')
    .select('*, businesses(id, slug, display_name_zh, display_name, short_desc_zh, address_full, city, phone, website_url)')
    .eq('slug', slug).eq('site_id', site.id).eq('status', 'approved').single();

  if (error || !deal) notFound();

  const biz = deal.businesses as AnyRow | null;
  const remaining = daysLeft(deal.end_date);
  const isExpiring = deal.end_date && Math.ceil((new Date(deal.end_date).getTime() - Date.now()) / 86400000) <= 3;
  const isExpired = deal.end_date && new Date(deal.end_date) < new Date();

  let moreDealsList: AnyRow[] = [];
  if (biz?.id) {
    const { data: moreDeals } = await (supabase as any)
      .from('deals')
      .select('id, slug, title_zh, cover_photo, discount_type, original_price, discount_price, discount_percent, discount_label')
      .eq('business_id', biz.id).eq('status', 'approved').neq('id', deal.id).limit(3);
    moreDealsList = (moreDeals || []) as AnyRow[];
  }

  return (
    <main>
      <EditorialContainer className="py-6 pb-16" narrow>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 flex-wrap mb-4" style={{ fontSize: 13, color: 'var(--ed-ink-muted)' }}>
          <Link href="/" className="hover:text-[var(--ed-accent)] transition-colors">首页</Link>
          <span style={{ color: 'var(--ed-line-strong)' }}>›</span>
          <Link href="/discounts" className="hover:text-[var(--ed-accent)] transition-colors">社区优惠</Link>
          <span style={{ color: 'var(--ed-line-strong)' }}>›</span>
          <span style={{ color: 'var(--ed-ink-soft)' }}>{deal.title_zh}</span>
        </nav>

        <div className="lg:flex gap-10">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Cover Image */}
            {deal.cover_photo && (
              <div className="overflow-hidden" style={{ aspectRatio: '16/9', borderRadius: 'var(--ed-radius-lg)', marginBottom: 24 }}>
                <img src={deal.cover_photo} alt={deal.title_zh} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Status badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {deal.discount_type === 'price' && deal.original_price && deal.discount_price && (
                <span style={{ padding: '4px 14px', borderRadius: 'var(--ed-radius-pill)', fontSize: 13, fontWeight: 600, background: 'var(--ed-accent)', color: 'var(--ed-paper)' }}>
                  -{Math.round((1 - deal.discount_price / deal.original_price) * 100)}%
                </span>
              )}
              {deal.discount_type === 'percent' && deal.discount_percent && (
                <span style={{ padding: '4px 14px', borderRadius: 'var(--ed-radius-pill)', fontSize: 13, fontWeight: 600, background: 'var(--ed-accent)', color: 'var(--ed-paper)' }}>
                  {deal.discount_percent}% OFF
                </span>
              )}
              {(deal.discount_type === 'bogo' || deal.discount_type === 'freebie' || deal.discount_type === 'other') && deal.discount_label && (
                <span style={{ padding: '4px 14px', borderRadius: 'var(--ed-radius-pill)', fontSize: 13, fontWeight: 600, background: 'var(--ed-ink)', color: 'var(--ed-paper)' }}>
                  {deal.discount_label}
                </span>
              )}
              <span style={{
                padding: '4px 14px', borderRadius: 'var(--ed-radius-pill)', fontSize: 13, fontWeight: 500,
                background: isExpired ? 'var(--ed-surface)' : isExpiring ? 'rgba(199,62,29,0.08)' : 'var(--ed-tag-green-bg)',
                color: isExpired ? 'var(--ed-ink-muted)' : isExpiring ? 'var(--ed-accent)' : 'var(--ed-tag-green-text)',
              }}>
                {remaining}
              </span>
            </div>

            {/* Title */}
            <h1 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, lineHeight: 1.3, marginBottom: 16 }}>
              {deal.title_zh}
            </h1>

            {/* Price */}
            {deal.discount_type === 'price' && deal.original_price && deal.discount_price && (
              <div className="flex items-baseline gap-3" style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--ed-accent)' }}>${deal.discount_price}</span>
                <span style={{ fontSize: 16, color: 'var(--ed-ink-muted)', textDecoration: 'line-through' }}>${deal.original_price}</span>
                <span style={{ fontSize: 13, color: 'var(--ed-tag-green-text)', fontWeight: 500 }}>省 ${(deal.original_price - deal.discount_price).toFixed(2)}</span>
              </div>
            )}

            {/* Validity */}
            <div style={{ fontSize: 13, color: 'var(--ed-ink-soft)', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--ed-line)' }}>
              📅 {formatDate(deal.start_date)} ~ {deal.end_date ? formatDate(deal.end_date) : '不限'}
            </div>

            {/* Description */}
            {deal.long_desc_zh && (
              <div style={{ fontSize: 15, lineHeight: 1.85, color: 'var(--ed-ink)', marginBottom: 32, whiteSpace: 'pre-wrap' }}>
                {deal.long_desc_zh}
              </div>
            )}
            {!deal.long_desc_zh && deal.short_desc_zh && (
              <p style={{ fontSize: 15, color: 'var(--ed-ink-soft)', lineHeight: 1.8, marginBottom: 32 }}>{deal.short_desc_zh}</p>
            )}

            {/* External link */}
            {deal.external_url && (
              <a
                href={deal.external_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', borderRadius: 'var(--ed-radius-md)',
                  fontSize: 14, fontWeight: 500,
                  background: 'var(--ed-accent)', color: 'var(--ed-paper)',
                  marginBottom: 32,
                }}
              >
                查看商家优惠详情
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            )}

            {/* Photos */}
            {deal.photos && deal.photos.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                  <div style={{ width: 3, height: 18, background: 'var(--ed-accent)', borderRadius: 2 }} />
                  <h2 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 17, fontWeight: 600 }}>更多图片</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {deal.photos.map((photo: string, i: number) => (
                    <div key={i} className="overflow-hidden" style={{ aspectRatio: '4/3', borderRadius: 'var(--ed-radius-md)' }}>
                      <img src={photo} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* More deals */}
            {moreDealsList.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                  <div style={{ width: 3, height: 18, background: 'var(--ed-amber)', borderRadius: 2 }} />
                  <h2 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 17, fontWeight: 600 }}>该商家更多优惠</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {moreDealsList.map((d) => (
                    <Link key={d.id} href={`/discounts/${d.slug}`} className="block group">
                      <EditorialCard className="overflow-hidden h-full">
                        {d.cover_photo && (
                          <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                            <img src={d.cover_photo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                          </div>
                        )}
                        <div style={{ padding: '10px 12px' }}>
                          <h3 style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.title_zh}</h3>
                        </div>
                      </EditorialCard>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Business Info */}
          {biz && (
            <aside className="hidden lg:block flex-shrink-0" style={{ width: 260 }}>
              <div className="sticky" style={{ top: 100 }}>
                <EditorialCard className="p-5">
                  <h3 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>商家信息</h3>
                  <Link href={`/businesses/${biz.slug}`} className="block hover:text-[var(--ed-accent)] transition-colors" style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{biz.display_name_zh || biz.display_name}</p>
                  </Link>
                  {biz.short_desc_zh && (
                    <p style={{ fontSize: 12.5, color: 'var(--ed-ink-muted)', marginBottom: 10, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{biz.short_desc_zh}</p>
                  )}
                  {(biz.address_full || biz.city) && (
                    <p style={{ fontSize: 12, color: 'var(--ed-ink-soft)', marginBottom: 6, display: 'flex', alignItems: 'start', gap: 6 }}>
                      <span style={{ flexShrink: 0 }}>📍</span>
                      {[biz.address_full, biz.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {biz.phone && (
                    <a href={`tel:${biz.phone}`} style={{ fontSize: 12, color: 'var(--ed-ink-soft)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      📞 {biz.phone}
                    </a>
                  )}
                  <div className="flex gap-2" style={{ marginTop: 16 }}>
                    <Link
                      href={`/businesses/${biz.slug}`}
                      style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 'var(--ed-radius-md)', fontSize: 12.5, fontWeight: 500, background: 'var(--ed-ink)', color: 'var(--ed-paper)' }}
                    >
                      查看商家
                    </Link>
                    {biz.phone && (
                      <a
                        href={`tel:${biz.phone}`}
                        style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 'var(--ed-radius-md)', fontSize: 12.5, fontWeight: 500, border: '1px solid var(--ed-line)', color: 'var(--ed-ink-soft)' }}
                      >
                        拨打电话
                      </a>
                    )}
                  </div>
                </EditorialCard>
              </div>
            </aside>
          )}
        </div>
      </EditorialContainer>
    </main>
  );
}
