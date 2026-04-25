import { createClient } from '@/lib/supabase/server';
import { getCurrentSite } from '@/lib/sites';
import { Link } from '@/lib/i18n/routing';
import { EditorialPageHeader } from '@/components/editorial/page-header';
import { EditorialContainer } from '@/components/editorial/container';
import type { Metadata } from 'next';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export const metadata: Metadata = {
  title: '社区优惠 · Baam',
  description: '纽约华人社区商家优惠折扣信息，限时特惠、新店开业、团购活动',
};

function daysLeft(endDate: string | null): string {
  if (!endDate) return '长期有效';
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (diff <= 0) return '已结束';
  if (diff === 1) return '最后1天';
  return `还剩${diff}天`;
}

function formatDiscountBadge(deal: AnyRow): string {
  if (deal.discount_type === 'price' && deal.original_price && deal.discount_price) {
    return `-${Math.round((1 - deal.discount_price / deal.original_price) * 100)}%`;
  }
  if (deal.discount_type === 'percent' && deal.discount_percent) {
    return `${deal.discount_percent}% OFF`;
  }
  return deal.discount_label || '优惠';
}

const fallbackImages = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=340&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=340&fit=crop&q=80',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=340&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=340&fit=crop&q=80',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=340&fit=crop&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=340&fit=crop&q=80',
];

interface Props {
  searchParams: Promise<{ type?: string; sort?: string }>;
}

export default async function DiscountsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const site = await getCurrentSite();
  const today = new Date().toISOString().split('T')[0];

  const typeFilter = sp.type || 'all';
  const sortBy = sp.sort || 'newest';

  let query = supabase
    .from('deals')
    .select('*, businesses(display_name_zh, display_name, slug)')
    .eq('site_id', site.id)
    .eq('status', 'approved')
    .or(`end_date.is.null,end_date.gte.${today}`);

  if (typeFilter !== 'all') {
    query = query.eq('discount_type', typeFilter);
  }

  if (sortBy === 'ending') {
    query = query.not('end_date', 'is', null).order('end_date', { ascending: true });
  } else {
    query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
  }

  const { data: rawDeals } = await query.limit(30);
  const deals = (rawDeals || []) as AnyRow[];

  const filterTabs = [
    { key: 'all', label: '全部' },
    { key: 'price', label: '💰 折扣价' },
    { key: 'percent', label: '🏷️ 折扣%' },
    { key: 'bogo', label: '🎁 买一送一' },
    { key: 'other', label: '📋 其他' },
  ];

  const sortTabs = [
    { key: 'newest', label: '最新' },
    { key: 'ending', label: '即将结束' },
  ];

  function buildHref(type: string, sort: string) {
    const params = new URLSearchParams();
    if (type !== 'all') params.set('type', type);
    if (sort !== 'newest') params.set('sort', sort);
    const qs = params.toString();
    return qs ? `/discounts?${qs}` : '/discounts';
  }

  return (
    <main>
      <EditorialPageHeader
        breadcrumbs={[
          { label: '首页', href: '/' },
          { label: '社区优惠' },
        ]}
        title="社区优惠"
        titleEm="Deals"
        subtitle="纽约华人社区商家优惠折扣，限时特惠不容错过"
      />

      <EditorialContainer className="pb-16">
        {/* Filter & Sort */}
        <div className="flex flex-wrap items-center gap-4 mb-6" style={{ marginTop: 4 }}>
          <div className="flex gap-1.5 flex-wrap">
            {filterTabs.map((tab) => (
              <Link
                key={tab.key}
                href={buildHref(tab.key, sortBy)}
                className="whitespace-nowrap transition-all"
                style={{
                  padding: '6px 14px', borderRadius: 'var(--ed-radius-pill)', fontSize: 13,
                  background: typeFilter === tab.key ? 'var(--ed-ink)' : 'transparent',
                  color: typeFilter === tab.key ? 'var(--ed-paper)' : 'var(--ed-ink-soft)',
                  border: typeFilter === tab.key ? '1px solid var(--ed-ink)' : '1px solid var(--ed-line)',
                }}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <div className="flex gap-1.5 ml-auto">
            {sortTabs.map((tab) => (
              <Link
                key={tab.key}
                href={buildHref(typeFilter, tab.key)}
                className="whitespace-nowrap transition-all"
                style={{
                  padding: '6px 14px', borderRadius: 'var(--ed-radius-pill)', fontSize: 13,
                  background: sortBy === tab.key ? 'var(--ed-ink)' : 'transparent',
                  color: sortBy === tab.key ? 'var(--ed-paper)' : 'var(--ed-ink-soft)',
                  border: sortBy === tab.key ? '1px solid var(--ed-ink)' : '1px solid var(--ed-line)',
                }}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Deals Grid */}
        {deals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🏷️</p>
            <p style={{ color: 'var(--ed-ink-soft)', fontSize: 15 }}>暂无优惠信息</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {deals.map((deal, i) => {
              const bizName = deal.businesses?.display_name_zh || deal.businesses?.display_name || '';
              const coverImg = deal.cover_photo || fallbackImages[i % fallbackImages.length];
              const badge = formatDiscountBadge(deal);
              const remaining = daysLeft(deal.end_date);
              const isExpiring = deal.end_date && Math.ceil((new Date(deal.end_date).getTime() - Date.now()) / 86400000) <= 3;

              return (
                <Link
                  key={deal.id}
                  href={`/discounts/${deal.slug}`}
                  className="block group"
                >
                  <div style={{
                    background: 'var(--ed-surface-elev)',
                    border: '1px solid var(--ed-line)',
                    borderRadius: 'var(--ed-radius-lg)',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                  }}
                  className="hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
                  >
                    {/* Cover 16:9 */}
                    <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                      <img src={coverImg} alt={deal.title_zh} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      <span className="absolute" style={{ top: 12, left: 12, padding: '4px 12px', borderRadius: 'var(--ed-radius-pill)', fontSize: 12, fontWeight: 600, background: 'var(--ed-accent)', color: 'var(--ed-paper)' }}>
                        {badge}
                      </span>
                      <span className="absolute" style={{
                        top: 12, right: 12, padding: '3px 10px', borderRadius: 'var(--ed-radius-pill)',
                        fontSize: 11, fontWeight: 500, color: '#fff',
                        background: isExpiring ? 'var(--ed-accent)' : 'rgba(0,0,0,0.5)',
                      }}>
                        {remaining}
                      </span>
                    </div>

                    <div style={{ padding: '14px 16px' }}>
                      {bizName && (
                        <p style={{ fontSize: 11.5, color: 'var(--ed-ink-muted)', fontWeight: 500, marginBottom: 4 }}>{bizName}</p>
                      )}
                      <h3 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 14.5, fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 8 }}>
                        {deal.title_zh}
                      </h3>

                      {deal.discount_type === 'price' && deal.original_price && deal.discount_price && (
                        <div className="flex items-baseline gap-2" style={{ marginBottom: 6 }}>
                          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--ed-accent)' }}>${deal.discount_price}</span>
                          <span style={{ fontSize: 12, color: 'var(--ed-ink-muted)', textDecoration: 'line-through' }}>${deal.original_price}</span>
                        </div>
                      )}
                      {deal.discount_type === 'percent' && deal.discount_percent && (
                        <div style={{ marginBottom: 6 }}>
                          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--ed-accent)' }}>{deal.discount_percent}% OFF</span>
                        </div>
                      )}

                      {deal.short_desc_zh && (
                        <p style={{ fontSize: 12.5, color: 'var(--ed-ink-soft)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {deal.short_desc_zh}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </EditorialContainer>
    </main>
  );
}
