import { createClient } from '@/lib/supabase/server';
import { getCurrentSite } from '@/lib/sites';
import { Link } from '@/lib/i18n/routing';
import { EditorialPageHeader } from '@/components/editorial/page-header';
import { EditorialContainer } from '@/components/editorial/container';
import { EditorialCard } from '@/components/editorial/card';
import { pickBusinessDisplayName } from '@/lib/business-name';
import BusinessMapWrapper from '@/components/businesses/BusinessMapWrapper';
import type { Metadata } from 'next';
import type { MapBusiness } from '@/components/businesses/BusinessMapView';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const PAGE_SIZE = 20;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '商家目录 · Baam',
    description: '纽约本地华人商家目录 — 餐饮美食、医疗健康、法律移民、地产保险、教育培训等',
  };
}

const CATEGORY_EMOJI: Record<string, string> = {
  '餐饮美食': '🍜', '医疗健康': '🏥', '法律移民': '⚖️', '地产保险': '🏠',
  '教育培训': '📚', '购物零售': '🛍️', '装修家居': '🔧', '汽车服务': '🚗',
  '财税服务': '💼', '美容保健': '💆', '其他服务': '🏢', '商家': '🏢',
  '书店文具': '📖', '百货商场': '🏬', '旅行社': '✈️', '电子产品': '📱',
  '韩餐': '🍲', '搬家': '📦', '超市杂货': '🛒', 'SPA按摩': '💆‍♀️',
  '火锅烧烤': '🥘', '中餐': '🍚', '礼品特色': '🎁', '酒吧夜生活': '🍷',
  '眼科验光': '👓', '泰餐': '🍛', '烘焙甜品': '🧁',
};

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '☆' : '') + '☆'.repeat(empty);
}

interface Props {
  searchParams: Promise<{ page?: string; cat?: string; sub?: string; view?: string }>;
}

export default async function BusinessListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page || '1', 10));
  const activeCat = sp.cat || '';
  const activeSub = sp.sub || '';
  const viewMode = sp.view === 'map' ? 'map' : 'list';

  const supabase = await createClient();
  const site = await getCurrentSite();

  // Fetch business categories
  const { data: rawCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('type', 'business')
    .eq('site_scope', 'zh')
    .order('sort_order', { ascending: true });

  const allCategories = (rawCategories || []) as AnyRow[];
  const parentCategories = allCategories.filter(c => !c.parent_id);
  const activeParent = parentCategories.find(c => c.slug === activeCat);
  const subcategories = activeParent
    ? allCategories.filter(c => c.parent_id === activeParent.id)
    : [];

  let filterCatIds: string[] | null = null;
  const filterSlug = activeSub || activeCat;
  if (filterSlug) {
    const matchedCat = allCategories.find(c => c.slug === filterSlug);
    if (matchedCat) {
      filterCatIds = [matchedCat.id];
      if (!matchedCat.parent_id) {
        const childIds = allCategories.filter(c => c.parent_id === matchedCat.id).map(c => c.id);
        filterCatIds.push(...childIds);
      }
    }
  }

  let count = 0;
  let businesses: AnyRow[] = [];
  const pageFrom = (currentPage - 1) * PAGE_SIZE;

  if (filterCatIds && filterCatIds.length > 0) {
    const { data: bizIdData } = await supabase
      .from('business_categories')
      .select('business_id')
      .in('category_id', filterCatIds)
      .range(0, 999);
    const bizIds = [...new Set((bizIdData || []).map((bc: AnyRow) => bc.business_id))];

    if (bizIds.length > 0) {
      const CHUNK_SIZE = 200;
      const allBizSorted: AnyRow[] = [];
      for (let i = 0; i < bizIds.length; i += CHUNK_SIZE) {
        const chunk = bizIds.slice(i, i + CHUNK_SIZE);
        const { data: chunkData } = await supabase
          .from('businesses')
          .select('id, is_featured, total_score, updated_at')
          .eq('is_active', true).eq('status', 'active').eq('site_id', site.id)
          .in('id', chunk);
        if (chunkData) allBizSorted.push(...chunkData);
      }
      count = allBizSorted.length;
      allBizSorted.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
      const pageIds = allBizSorted.slice(pageFrom, pageFrom + PAGE_SIZE).map(b => b.id);
      if (pageIds.length > 0) {
        const { data: rawBiz } = await supabase
          .from('businesses')
          .select('*, business_categories(categories(name_zh, slug))')
          .eq('site_id', site.id)
          .in('id', pageIds);
        const idOrder = new Map(pageIds.map((id, idx) => [id, idx]));
        businesses = ((rawBiz || []) as AnyRow[]).sort((a, b) => (idOrder.get(a.id) || 0) - (idOrder.get(b.id) || 0));
      }
    }
  } else {
    const { count: totalCount } = await supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true).eq('site_id', site.id).eq('status', 'active');
    count = totalCount || 0;

    const { data: rawBiz } = await supabase
      .from('businesses')
      .select('*, business_categories(categories(name_zh, slug))')
      .eq('is_active', true).eq('site_id', site.id).eq('status', 'active')
      .order('total_score', { ascending: false, nullsFirst: false })
      .range(pageFrom, pageFrom + PAGE_SIZE - 1);
    businesses = (rawBiz || []) as AnyRow[];
  }

  const totalPages = Math.ceil(count / PAGE_SIZE);

  // Map view data
  let mapBusinesses: MapBusiness[] = [];
  if (viewMode === 'map') {
    const MAP_SELECT = 'id, slug, display_name, display_name_zh, phone, avg_rating, review_count, business_locations(latitude, longitude, address_line1, city), business_categories(categories(name_zh))';
    let rawMapData: AnyRow[] = [];
    if (filterCatIds && filterCatIds.length > 0) {
      const { data: catBizIds } = await supabase.from('business_categories').select('business_id').in('category_id', filterCatIds).range(0, 999);
      const bizIds = [...new Set((catBizIds || []).map((r: AnyRow) => r.business_id))];
      const CHUNK = 200;
      for (let i = 0; i < bizIds.length; i += CHUNK) {
        const { data } = await supabase.from('businesses').select(MAP_SELECT).eq('is_active', true).eq('status', 'active').eq('site_id', site.id).in('id', bizIds.slice(i, i + CHUNK));
        if (data) rawMapData.push(...data);
      }
    } else {
      const { data } = await supabase.from('businesses').select(MAP_SELECT).eq('is_active', true).eq('status', 'active').eq('site_id', site.id).limit(1000);
      rawMapData = (data || []) as AnyRow[];
    }
    mapBusinesses = rawMapData.map((biz) => {
      const loc = Array.isArray(biz.business_locations) ? biz.business_locations[0] : null;
      if (!loc?.latitude || !loc?.longitude) return null;
      const cats = Array.isArray(biz.business_categories) ? biz.business_categories.map((bc: AnyRow) => bc.categories?.name_zh).filter(Boolean) : [];
      return { id: biz.id, slug: biz.slug, name: pickBusinessDisplayName(biz, ''), latitude: loc.latitude, longitude: loc.longitude, address: [loc.address_line1, loc.city].filter(Boolean).join(', '), phone: biz.phone || undefined, category: cats[0] || undefined, avg_rating: biz.avg_rating || undefined, review_count: biz.review_count || undefined };
    }).filter(Boolean) as MapBusiness[];
  }

  const viewParam = viewMode === 'map' ? '&view=map' : '';
  const preservedParams: Record<string, string> = {};
  if (activeCat) preservedParams.cat = activeCat;
  if (activeSub) preservedParams.sub = activeSub;

  return (
    <main>
      <EditorialPageHeader
        breadcrumbs={[
          { label: '首页', href: '/' },
          { label: '商家目录' },
        ]}
        title="商家目录"
        titleEm="Directory"
        subtitle={`共 ${count || 0} 家商家 · 纽约本地华人商家信息`}
        right={
          <div className="flex overflow-hidden" style={{ borderRadius: 'var(--ed-radius-md)', border: '1px solid var(--ed-line)' }}>
            <Link
              href={`/businesses${activeCat ? `?cat=${activeCat}` : ''}${activeSub ? `&sub=${activeSub}` : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
                background: viewMode === 'list' ? 'var(--ed-ink)' : 'transparent',
                color: viewMode === 'list' ? 'var(--ed-paper)' : 'var(--ed-ink-soft)',
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              列表
            </Link>
            <Link
              href={`/businesses?view=map${activeCat ? `&cat=${activeCat}` : ''}${activeSub ? `&sub=${activeSub}` : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
                borderLeft: '1px solid var(--ed-line)',
                background: viewMode === 'map' ? 'var(--ed-ink)' : 'transparent',
                color: viewMode === 'map' ? 'var(--ed-paper)' : 'var(--ed-ink-soft)',
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              地图
            </Link>
          </div>
        }
      />

      {/* Search + Category Filter — sticky */}
      <div className="sticky top-[52px] z-40" style={{ background: 'var(--ed-paper)', borderBottom: '1px solid var(--ed-line)' }}>
        <div style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '0 16px' }}>
          <div className="flex items-center gap-2 py-3">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              <Link
                href={`/businesses${viewMode === 'map' ? '?view=map' : ''}`}
                className="whitespace-nowrap flex-shrink-0 transition-all"
                style={{
                  padding: '6px 14px', borderRadius: 'var(--ed-radius-pill)', fontSize: 13,
                  background: !activeCat ? 'var(--ed-ink)' : 'transparent',
                  color: !activeCat ? 'var(--ed-paper)' : 'var(--ed-ink-soft)',
                  border: !activeCat ? '1px solid var(--ed-ink)' : '1px solid var(--ed-line)',
                }}
              >
                全部
              </Link>
              {parentCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/businesses?cat=${cat.slug}${viewParam}`}
                  className="whitespace-nowrap flex-shrink-0 transition-all"
                  style={{
                    padding: '6px 14px', borderRadius: 'var(--ed-radius-pill)', fontSize: 13,
                    background: activeCat === cat.slug ? 'var(--ed-ink)' : 'transparent',
                    color: activeCat === cat.slug ? 'var(--ed-paper)' : 'var(--ed-ink-soft)',
                    border: activeCat === cat.slug ? '1px solid var(--ed-ink)' : '1px solid var(--ed-line)',
                  }}
                >
                  {cat.icon && <span style={{ marginRight: 2 }}>{cat.icon}</span>}
                  {cat.name_zh}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Subcategories */}
        {subcategories.length > 0 && (
          <div style={{ borderTop: '1px solid var(--ed-line)', background: 'var(--ed-surface)' }}>
            <div style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '8px 16px' }}>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                <Link
                  href={`/businesses?cat=${activeCat}${viewParam}`}
                  className="whitespace-nowrap flex-shrink-0"
                  style={{
                    padding: '4px 12px', borderRadius: 'var(--ed-radius-pill)', fontSize: 12.5,
                    background: !activeSub ? 'var(--ed-ink)' : 'transparent',
                    color: !activeSub ? 'var(--ed-paper)' : 'var(--ed-ink-soft)',
                    border: !activeSub ? '1px solid var(--ed-ink)' : '1px solid var(--ed-line)',
                  }}
                >
                  全部{activeParent?.name_zh}
                </Link>
                {subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/businesses?cat=${activeCat}&sub=${sub.slug}${viewParam}`}
                    className="whitespace-nowrap flex-shrink-0"
                    style={{
                      padding: '4px 12px', borderRadius: 'var(--ed-radius-pill)', fontSize: 12.5,
                      background: activeSub === sub.slug ? 'var(--ed-ink)' : 'transparent',
                      color: activeSub === sub.slug ? 'var(--ed-paper)' : 'var(--ed-ink-soft)',
                      border: activeSub === sub.slug ? '1px solid var(--ed-ink)' : '1px solid var(--ed-line)',
                    }}
                  >
                    {sub.icon && <span style={{ marginRight: 2 }}>{sub.icon}</span>}
                    {sub.name_zh}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sort info */}
        <div style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '6px 16px', borderTop: '1px solid var(--ed-line)' }}>
          <div className="flex items-center justify-between" style={{ fontSize: 12, color: 'var(--ed-ink-muted)' }}>
            <span>
              {count || 0} 家商家
              {activeParent ? ` · ${activeParent.icon || ''} ${activeParent.name_zh}` : ''}
              {activeSub ? ` > ${allCategories.find(c => c.slug === activeSub)?.name_zh || ''}` : ''}
            </span>
            <span>按综合评分排序</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <EditorialContainer className="py-8 pb-16">
        {viewMode === 'map' ? (
          mapBusinesses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>📍</p>
              <p style={{ color: 'var(--ed-ink-soft)', fontSize: 15 }}>暂无地图数据</p>
            </div>
          ) : (
            <BusinessMapWrapper businesses={mapBusinesses} />
          )
        ) : (
          <>
            {businesses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 0' }}>
                <p style={{ fontSize: 48, marginBottom: 16 }}>🏪</p>
                <p style={{ color: 'var(--ed-ink-soft)', fontSize: 15 }}>暂无商家信息</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {businesses.map((biz) => (
                  <BusinessCard key={biz.id} biz={biz} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-1 mt-10" aria-label="分页">
                {currentPage > 1 ? (
                  <Link href={buildHref('/businesses', currentPage - 1, preservedParams)} style={{ padding: '8px 14px', fontSize: 13, color: 'var(--ed-ink-soft)', borderRadius: 'var(--ed-radius-md)' }}>上一页</Link>
                ) : (
                  <span style={{ padding: '8px 14px', fontSize: 13, color: 'var(--ed-ink-muted)', opacity: 0.4 }}>上一页</span>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((page, idx, arr) => (
                    <span key={page} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== page - 1 && <span style={{ padding: '0 4px', color: 'var(--ed-ink-muted)' }}>...</span>}
                      <Link
                        href={buildHref('/businesses', page, preservedParams)}
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
                  <Link href={buildHref('/businesses', currentPage + 1, preservedParams)} style={{ padding: '8px 14px', fontSize: 13, color: 'var(--ed-ink-soft)', borderRadius: 'var(--ed-radius-md)' }}>下一页</Link>
                ) : (
                  <span style={{ padding: '8px 14px', fontSize: 13, color: 'var(--ed-ink-muted)', opacity: 0.4 }}>下一页</span>
                )}
              </nav>
            )}
          </>
        )}
      </EditorialContainer>

      {/* Business CTA Banner */}
      <section style={{ background: 'var(--ed-ink)', color: 'var(--ed-paper)' }}>
        <div style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 700, marginBottom: 8 }}>
            你是商家？立即入驻 Baam，获得更多曝光
          </h2>
          <p style={{ fontSize: 14, opacity: 0.65, marginBottom: 28 }}>
            免费创建商家主页 · AI 自动优化 · 精准触达本地华人客户
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/businesses/claim"
              style={{ padding: '10px 28px', borderRadius: 'var(--ed-radius-md)', fontSize: 14, fontWeight: 500, background: 'var(--ed-paper)', color: 'var(--ed-ink)' }}
            >
              免费入驻
            </Link>
            <Link
              href="/businesses/claim"
              style={{ padding: '10px 28px', borderRadius: 'var(--ed-radius-md)', fontSize: 14, fontWeight: 500, border: '1px solid rgba(255,255,255,0.3)', color: 'var(--ed-paper)', background: 'transparent' }}
            >
              了解更多
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function buildHref(basePath: string, page: number, extra: Record<string, string>): string {
  const params = new URLSearchParams(extra);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function BusinessCard({ biz }: { biz: AnyRow }) {
  const aiTags = (biz.ai_tags || []).filter((t: string) => t !== 'GBP已认领') as string[];
  const name = pickBusinessDisplayName(biz, '');
  const loc = Array.isArray(biz.business_locations) ? biz.business_locations[0] : null;
  const address = (loc ? `${loc.address_line1 || ''}${loc.city ? ', ' + loc.city : ''}` : '') || biz.address_full || '';
  const websiteLabel = (biz.website_url || biz.website)
    ? String(biz.website_url || biz.website).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    : '';

  const cats = Array.isArray(biz.business_categories)
    ? biz.business_categories.map((bc: AnyRow) => bc.categories?.name_zh).filter(Boolean)
    : [];
  const primaryCat = cats[0] || '商家';
  const emoji = CATEGORY_EMOJI[primaryCat] || '🏢';
  const rating = typeof biz.avg_rating === 'number' ? biz.avg_rating : Number(biz.avg_rating || 0);
  const reviewCount = typeof biz.review_count === 'number' ? biz.review_count : Number(biz.review_count || 0);

  return (
    <Link href={`/businesses/${biz.slug}`} className="group block h-full">
      <EditorialCard className="h-full flex flex-col">
        {/* Banner — 16:9 */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '16/9', background: 'var(--ed-paper-warm)' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontSize: 48, opacity: 0.35 }} aria-hidden="true">{emoji}</span>
          </div>
          {biz.is_featured && (
            <span className="absolute" style={{
              top: 8, right: 8, padding: '2px 10px', borderRadius: 'var(--ed-radius-pill)',
              fontSize: 11, fontWeight: 500, background: 'var(--ed-accent)', color: 'var(--ed-paper)',
            }}>
              推荐
            </span>
          )}
          <span className="absolute" style={{
            bottom: 8, left: 10, padding: '3px 10px', borderRadius: 'var(--ed-radius-pill)',
            fontSize: 11, fontWeight: 500,
            background: 'var(--ed-surface-elev)', color: 'var(--ed-ink-soft)',
            border: '1px solid var(--ed-line)',
          }}>
            {primaryCat}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="flex items-start gap-1.5">
            <h3 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 14, fontWeight: 600, lineHeight: 1.4, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {name || '未命名商家'}
            </h3>
            {biz.is_verified && (
              <svg width="16" height="16" viewBox="0 0 20 20" fill="var(--ed-accent)" style={{ flexShrink: 0, marginTop: 2 }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Rating */}
          {reviewCount > 0 ? (
            <div className="flex items-center gap-1" style={{ fontSize: 12 }}>
              <span style={{ color: 'var(--ed-amber)' }}>★</span>
              <span style={{ fontWeight: 600 }}>{rating ? rating.toFixed(1) : '—'}</span>
              <span style={{ color: 'var(--ed-ink-muted)' }}>({reviewCount} 评价)</span>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--ed-ink-muted)' }}>暂无评价</p>
          )}

          {/* AI tags */}
          {aiTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {aiTags.slice(0, 3).map((tag) => (
                <span key={tag} style={{ padding: '2px 8px', borderRadius: 'var(--ed-radius-pill)', fontSize: 11, border: '1px solid var(--ed-line)', color: 'var(--ed-ink-muted)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Address */}
          {address && (
            <p style={{ fontSize: 12, color: 'var(--ed-ink-muted)', display: 'flex', alignItems: 'start', gap: 4 }}>
              <span style={{ flexShrink: 0 }}>📍</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{address}</span>
            </p>
          )}

          {/* Bottom contact */}
          <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--ed-line)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--ed-ink-muted)' }}>
            {biz.phone ? (
              <span className="flex items-center gap-1" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📞 {biz.phone}</span>
            ) : (
              <span>电话 —</span>
            )}
            {websiteLabel && (
              <span className="flex items-center gap-1 ml-auto" style={{ color: 'var(--ed-accent)' }}>🌐 官网</span>
            )}
          </div>
        </div>
      </EditorialCard>
    </Link>
  );
}
