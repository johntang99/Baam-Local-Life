import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/routing';
import { EditorialPageHeader } from '@/components/editorial/page-header';
import { EditorialContainer } from '@/components/editorial/container';
import { EditorialCard } from '@/components/editorial/card';
import type { Metadata } from 'next';
import { getCurrentSite } from '@/lib/sites';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const PAGE_SIZE = 18;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '本地活动 · Baam',
    description: '纽约本地活动、社区聚会、讲座工作坊',
  };
}

const dateTabs = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'all', label: '全部' },
];

interface Props {
  searchParams: Promise<{ page?: string; period?: string; price?: string }>;
}

export default async function EventsListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page || '1', 10));
  const period = sp.period || 'all';
  const priceFilter = sp.price || '';

  const supabase = await createClient();
  const site = await getCurrentSite();

  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  let countQuery = supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('site_id', site.id);

  if (period === 'week') {
    countQuery = countQuery.gte('start_at', now.toISOString()).lte('start_at', weekEnd.toISOString());
  } else if (period === 'month') {
    countQuery = countQuery.gte('start_at', now.toISOString()).lte('start_at', monthEnd.toISOString());
  }
  if (priceFilter === 'free') countQuery = countQuery.eq('is_free', true);
  if (priceFilter === 'paid') countQuery = countQuery.eq('is_free', false);

  const { count } = await countQuery;
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  const from = (currentPage - 1) * PAGE_SIZE;
  let dataQuery = supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .eq('site_id', site.id);

  if (period === 'week') {
    dataQuery = dataQuery.gte('start_at', now.toISOString()).lte('start_at', weekEnd.toISOString());
  } else if (period === 'month') {
    dataQuery = dataQuery.gte('start_at', now.toISOString()).lte('start_at', monthEnd.toISOString());
  }
  if (priceFilter === 'free') dataQuery = dataQuery.eq('is_free', true);
  if (priceFilter === 'paid') dataQuery = dataQuery.eq('is_free', false);

  const { data: rawEvents, error } = await dataQuery
    .order('start_at', { ascending: true })
    .range(from, from + PAGE_SIZE - 1);

  const events = (rawEvents || []) as AnyRow[];

  const preservedParams: Record<string, string> = {};
  if (period !== 'all') preservedParams.period = period;
  if (priceFilter) preservedParams.price = priceFilter;

  // Build filter tab hrefs
  function buildFilterHref(p: string, price: string) {
    const params = new URLSearchParams();
    if (p !== 'all') params.set('period', p);
    if (price) params.set('price', price);
    const qs = params.toString();
    return qs ? `/events?${qs}` : '/events';
  }

  return (
    <main>
      <EditorialPageHeader
        breadcrumbs={[
          { label: '首页', href: '/' },
          { label: '本地活动' },
        ]}
        title="本地活动"
        titleEm="Events"
        subtitle="纽约本地活动、社区聚会、讲座工作坊"
      />

      <EditorialContainer className="pb-16">
        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-3 mb-6" style={{ marginTop: 4 }}>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {dateTabs.map((tab) => (
              <Link
                key={tab.key}
                href={buildFilterHref(tab.key, priceFilter)}
                className="whitespace-nowrap flex-shrink-0 transition-all"
                style={{
                  padding: '6px 14px', borderRadius: 'var(--ed-radius-pill)', fontSize: 13,
                  background: period === tab.key ? 'var(--ed-ink)' : 'transparent',
                  color: period === tab.key ? 'var(--ed-paper)' : 'var(--ed-ink-soft)',
                  border: period === tab.key ? '1px solid var(--ed-ink)' : '1px solid var(--ed-line)',
                }}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <div className="flex gap-1.5 ml-auto">
            {[
              { key: '', label: '全部' },
              { key: 'free', label: '免费' },
              { key: 'paid', label: '付费' },
            ].map((opt) => (
              <Link
                key={opt.key}
                href={buildFilterHref(period, opt.key)}
                className="whitespace-nowrap flex-shrink-0 transition-all"
                style={{
                  padding: '6px 14px', borderRadius: 'var(--ed-radius-pill)', fontSize: 13,
                  background: priceFilter === opt.key ? 'var(--ed-ink)' : 'transparent',
                  color: priceFilter === opt.key ? 'var(--ed-paper)' : 'var(--ed-ink-soft)',
                  border: priceFilter === opt.key ? '1px solid var(--ed-ink)' : '1px solid var(--ed-line)',
                }}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {error ? (
          <p style={{ color: 'var(--ed-ink-muted)', textAlign: 'center', padding: '48px 0' }}>加载活动时出错，请稍后重试。</p>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🎉</p>
            <p style={{ color: 'var(--ed-ink-soft)', fontSize: 15 }}>暂无活动内容</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => {
              const startDate = event.start_at ? new Date(event.start_at) : null;
              const month = startDate ? startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '';
              const day = startDate ? startDate.getDate() : '';
              const timeStr = startDate ? startDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';
              const isFree = event.is_free || event.price === 0;

              return (
                <Link key={event.id} href={`/events/${event.slug}`} className="block group">
                  <EditorialCard className="overflow-hidden h-full flex flex-col">
                    <div className="relative" style={{ height: 128, background: 'var(--ed-paper-warm)' }}>
                      <div className="absolute" style={{
                        top: 12, left: 12,
                        background: 'var(--ed-surface-elev)', borderRadius: 'var(--ed-radius-md)',
                        padding: '6px 10px', textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        border: '1px solid var(--ed-line)',
                      }}>
                        <p style={{ fontSize: 10, color: 'var(--ed-ink-muted)', lineHeight: 1.2, fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic' }}>{month}</p>
                        <p style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1, fontFamily: 'var(--ed-font-serif-italic)' }}>{day}</p>
                      </div>
                      <span className="absolute" style={{
                        top: 12, right: 12,
                        padding: '3px 10px', borderRadius: 'var(--ed-radius-pill)', fontSize: 11, fontWeight: 500,
                        background: isFree ? 'var(--ed-tag-green-bg)' : 'var(--ed-tag-purple-bg)',
                        color: isFree ? 'var(--ed-tag-green-text)' : 'var(--ed-tag-purple-text)',
                      }}>
                        {isFree ? '免费' : '付费'}
                      </span>
                    </div>
                    <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <h3 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 14.5, fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {event.title_zh || event.title_en || event.title}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12, color: 'var(--ed-ink-muted)' }}>
                        {timeStr && <p>{timeStr}</p>}
                        {(event.venue_name || event.venue) && <p>{event.venue_name || event.venue}</p>}
                      </div>
                    </div>
                  </EditorialCard>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-1 mt-10" aria-label="分页">
            {currentPage > 1 ? (
              <Link href={buildPaginationHref('/events', currentPage - 1, preservedParams)} style={{ padding: '8px 14px', fontSize: 13, color: 'var(--ed-ink-soft)', borderRadius: 'var(--ed-radius-md)' }}>上一页</Link>
            ) : (
              <span style={{ padding: '8px 14px', fontSize: 13, color: 'var(--ed-ink-muted)', opacity: 0.4 }}>上一页</span>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .map((page, idx, arr) => (
                <span key={page} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== page - 1 && <span style={{ padding: '0 4px', color: 'var(--ed-ink-muted)' }}>...</span>}
                  <Link
                    href={buildPaginationHref('/events', page, preservedParams)}
                    style={{
                      width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, borderRadius: 'var(--ed-radius-md)',
                      background: page === currentPage ? 'var(--ed-ink)' : 'transparent',
                      color: page === currentPage ? 'var(--ed-paper)' : 'var(--ed-ink-soft)',
                      fontWeight: page === currentPage ? 600 : 400,
                    }}
                  >
                    {page}
                  </Link>
                </span>
              ))}
            {currentPage < totalPages ? (
              <Link href={buildPaginationHref('/events', currentPage + 1, preservedParams)} style={{ padding: '8px 14px', fontSize: 13, color: 'var(--ed-ink-soft)', borderRadius: 'var(--ed-radius-md)' }}>下一页</Link>
            ) : (
              <span style={{ padding: '8px 14px', fontSize: 13, color: 'var(--ed-ink-muted)', opacity: 0.4 }}>下一页</span>
            )}
          </nav>
        )}
      </EditorialContainer>
    </main>
  );
}

function buildPaginationHref(basePath: string, page: number, extra: Record<string, string>): string {
  const params = new URLSearchParams(extra);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
