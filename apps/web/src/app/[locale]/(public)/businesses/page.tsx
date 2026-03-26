import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/routing';
import { Pagination } from '@/components/shared/pagination';
import type { Metadata } from 'next';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const PAGE_SIZE = 20;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return {
    title: `${t('businesses')} · Baam`,
    description: '纽约本地华人商家目录 — 餐饮美食、医疗健康、法律移民、地产保险、教育培训等',
  };
}

const categoryColors: Record<string, string> = {
  '餐饮美食': 'badge-primary', '医疗健康': 'badge-blue', '法律移民': 'badge-red',
  '地产保险': 'badge-green', '教育培训': 'badge-purple', '装修家居': 'badge-gray',
  '汽车服务': 'badge-gray', '财税服务': 'badge-green', '美容保健': 'badge-purple',
};

const categoryEmojis: Record<string, string> = {
  '餐饮美食': '🍜', '医疗健康': '🏥', '法律移民': '⚖️', '地产保险': '🏠',
  '教育培训': '📚', '装修家居': '🔧', '汽车服务': '🚗', '财税服务': '💼', '美容保健': '💆',
};

const categoryGradients: Record<string, string> = {
  '餐饮美食': 'from-yellow-200 to-yellow-300', '医疗健康': 'from-blue-200 to-blue-400',
  '法律移民': 'from-red-200 to-red-400', '地产保险': 'from-green-200 to-green-300',
  '教育培训': 'from-pink-200 to-pink-300', '装修家居': 'from-cyan-200 to-cyan-300',
  '汽车服务': 'from-slate-200 to-slate-300', '财税服务': 'from-green-200 to-green-300',
  '美容保健': 'from-rose-200 to-rose-300',
};

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '☆' : '') + '☆'.repeat(empty);
}

interface Props {
  searchParams: Promise<{ page?: string; cat?: string; sort?: string }>;
}

export default async function BusinessListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page || '1', 10));
  const activeCat = sp.cat || '';
  const sortBy = sp.sort || 'recommended';

  const supabase = await createClient();
  const t = await getTranslations();

  // Fetch business categories
  const { data: rawCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('type', 'business')
    .order('sort_order', { ascending: true });

  const categories = (rawCategories || []) as AnyRow[];

  // If category filter active, get business IDs from join table first
  let filteredBizIds: string[] | null = null;
  if (activeCat) {
    const matchedCat = categories.find(c => c.slug === activeCat);
    if (matchedCat) {
      const { data: bizCats } = await supabase
        .from('business_categories')
        .select('business_id')
        .eq('category_id', matchedCat.id);
      filteredBizIds = (bizCats || []).map((bc: AnyRow) => bc.business_id);
    }
  }

  // Build count query
  let countQuery = supabase
    .from('businesses')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('status', 'active');

  if (filteredBizIds !== null) {
    if (filteredBizIds.length === 0) {
      // No businesses in this category
      countQuery = countQuery.in('id', ['00000000-0000-0000-0000-000000000000']);
    } else {
      countQuery = countQuery.in('id', filteredBizIds);
    }
  }

  const { count } = await countQuery;
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  // Build data query
  const from = (currentPage - 1) * PAGE_SIZE;
  let dataQuery = supabase
    .from('businesses')
    .select('*')
    .eq('is_active', true)
    .eq('status', 'active');

  if (filteredBizIds !== null) {
    if (filteredBizIds.length === 0) {
      dataQuery = dataQuery.in('id', ['00000000-0000-0000-0000-000000000000']);
    } else {
      dataQuery = dataQuery.in('id', filteredBizIds);
    }
  }

  // Sort
  if (sortBy === 'rating') {
    dataQuery = dataQuery.order('avg_rating', { ascending: false });
  } else if (sortBy === 'recent') {
    dataQuery = dataQuery.order('updated_at', { ascending: false });
  } else {
    dataQuery = dataQuery
      .order('is_featured', { ascending: false })
      .order('avg_rating', { ascending: false });
  }

  const { data: rawBusinesses, error } = await dataQuery.range(from, from + PAGE_SIZE - 1);
  const businesses = (rawBusinesses || []) as AnyRow[];

  const featured = businesses.filter((b) => b.is_featured);
  const standard = businesses.filter((b) => !b.is_featured);

  // Preserved params for pagination
  const preservedParams: Record<string, string> = {};
  if (activeCat) preservedParams.cat = activeCat;
  if (sortBy !== 'recommended') preservedParams.sort = sortBy;

  const sortOptions = [
    { key: 'recommended', label: '推荐' },
    { key: 'rating', label: '评分最高' },
    { key: 'recent', label: '最近更新' },
  ];

  return (
    <main>
      {/* Page Header */}
      <section className="bg-bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">商家目录</h1>
              <p className="text-sm text-text-muted mt-1">
                共 {count || 0} 家商家 · 本地华人商家信息
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter Pills + Sort */}
      <section className="bg-bg-card border-b border-border sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            <Link
              href="/businesses"
              className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                !activeCat ? 'bg-primary text-text-inverse' : 'bg-border-light text-text-secondary hover:bg-primary/10 hover:text-primary'
              }`}
            >
              全部
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/businesses?cat=${cat.slug}`}
                className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  activeCat === cat.slug ? 'bg-primary text-text-inverse' : 'bg-border-light text-text-secondary hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {cat.name_zh || cat.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="sm:ml-auto flex gap-1">
              {sortOptions.map((opt) => (
                <Link
                  key={opt.key}
                  href={(() => { const p = new URLSearchParams({ ...(activeCat ? { cat: activeCat } : {}), ...(opt.key !== 'recommended' ? { sort: opt.key } : {}) }); const s = p.toString(); return s ? `/businesses?${s}` : '/businesses'; })()}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    sortBy === opt.key ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-primary'
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error ? (
          <p className="text-text-secondary py-8 text-center">加载商家时出错，请稍后重试。</p>
        ) : businesses.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-4xl mb-4">🏪</p>
            <p className="text-text-secondary">暂无商家信息</p>
            <p className="text-text-muted text-sm mt-1">商家将在这里显示</p>
          </div>
        ) : (
          <>
            {/* Featured Businesses */}
            {featured.length > 0 && (
              <div className="grid lg:grid-cols-2 gap-5 mb-6">
                {featured.map((biz) => (
                  <BusinessCard key={biz.id} biz={biz} featured />
                ))}
              </div>
            )}

            {/* Standard Business Cards */}
            <div className="grid lg:grid-cols-2 gap-5">
              {standard.map((biz) => (
                <BusinessCard key={biz.id} biz={biz} />
              ))}
            </div>
          </>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath="/businesses"
          searchParams={preservedParams}
        />
      </div>

      {/* Business CTA Banner */}
      <section className="bg-gradient-to-r from-primary to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-12 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            你是商家？立即入驻 Baam，获得更多曝光
          </h2>
          <p className="text-orange-100 text-sm sm:text-base mb-6">
            免费创建商家主页 · AI 自动优化 · 精准触达本地华人客户
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/businesses/claim"
              className="w-full sm:w-auto px-8 py-3 bg-white text-primary font-bold text-sm rounded-lg hover:bg-orange-50 transition shadow-lg inline-block text-center"
            >
              免费入驻
            </Link>
            <Link
              href="/businesses/claim"
              className="w-full sm:w-auto px-8 py-3 border-2 border-white/50 text-white font-medium text-sm rounded-lg hover:bg-white/10 transition inline-block text-center"
            >
              了解更多
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function BusinessCard({ biz, featured = false }: { biz: AnyRow; featured?: boolean }) {
  const catName = biz.category_name || biz.category || '';
  const badgeClass = categoryColors[catName] || 'badge-gray';
  const emoji = categoryEmojis[catName] || '🏢';
  const gradient = categoryGradients[catName] || 'from-gray-200 to-gray-300';
  const aiTags = (biz.ai_tags || []) as string[];
  const name = biz.display_name_zh || biz.name_zh || biz.display_name || biz.name || '';

  if (featured) {
    return (
      <Link href={`/businesses/${biz.slug}`} className="card-featured block relative overflow-hidden">
        <div className="absolute top-0 left-0 bg-primary text-text-inverse text-xs font-bold px-3 py-1 rounded-br-lg">推荐</div>
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br ${gradient} flex-shrink-0 flex items-center justify-center text-2xl sm:text-3xl`}>{emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-base sm:text-lg truncate">{name}</h3>
                {biz.is_verified && (
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm mb-2">
                <span className={`badge ${badgeClass}`}>{catName || '商家'}</span>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 text-xs">{renderStars(biz.avg_rating || 0)}</span>
                  <span className="text-xs text-text-secondary font-medium">{biz.avg_rating?.toFixed(1) || '—'}</span>
                  <span className="text-xs text-text-muted">({biz.review_count || 0}评价)</span>
                </div>
              </div>
              {aiTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {aiTags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted">{biz.region || biz.city || ''}{biz.address_short ? ` · ${biz.address_short}` : ''}</p>
                <span className="text-xs font-medium text-text-inverse bg-primary px-4 py-1.5 rounded-lg">联系</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/businesses/${biz.slug}`} className="card block">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${gradient} flex-shrink-0 flex items-center justify-center text-xl`}>{emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{name}</h3>
              {biz.is_verified && (
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm mb-2">
              <span className={`badge ${badgeClass}`}>{catName || '商家'}</span>
              <div className="flex items-center gap-1">
                <span className="text-yellow-500 text-xs">{renderStars(biz.avg_rating || 0)}</span>
                <span className="text-xs text-text-secondary font-medium">{biz.avg_rating?.toFixed(1) || '—'}</span>
                <span className="text-xs text-text-muted">({biz.review_count || 0}评价)</span>
              </div>
            </div>
            {aiTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {aiTags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted">{biz.region || biz.city || ''}{biz.address_short ? ` · ${biz.address_short}` : ''}</p>
              <span className="text-xs font-medium text-text-inverse bg-primary px-4 py-1.5 rounded-lg">联系</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
