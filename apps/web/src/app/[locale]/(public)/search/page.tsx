import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/routing';
import type { Metadata } from 'next';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '搜索 · Baam',
    description: '搜索本地商家、新闻、指南、达人、活动',
  };
}

const searchTabs = [
  { key: 'all', label: '全部' },
  { key: 'biz', label: '商家' },
  { key: 'news', label: '新闻' },
  { key: 'guides', label: '指南' },
  { key: 'forum', label: '论坛' },
  { key: 'voices', label: '达人' },
  { key: 'events', label: '活动' },
];

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() || '';
  const supabase = await createClient();
  const t = await getTranslations();

  let businesses: AnyRow[] = [];
  let articles: AnyRow[] = [];

  if (query) {
    // Search businesses
    const { data: rawBiz } = await supabase
      .from('businesses')
      .select('*')
      .ilike('display_name', `%${query}%`)
      .limit(10);

    businesses = (rawBiz || []) as AnyRow[];

    // Search articles
    const { data: rawArticles } = await supabase
      .from('articles')
      .select('*')
      .ilike('title_zh', `%${query}%`)
      .eq('editorial_status', 'published')
      .limit(10);

    articles = (rawArticles || []) as AnyRow[];
  }

  const hasResults = businesses.length > 0 || articles.length > 0;

  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">搜索</h1>
          <form className="max-w-2xl">
            <div className="flex gap-2">
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="搜索商家、新闻、指南、达人..."
                className="flex-1 h-11 px-4 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
              <button type="submit" className="btn btn-primary h-11 px-6 text-sm">搜索</button>
            </div>
          </form>
        </div>

        {/* AI Summary Placeholder */}
        {query && (
          <div className="ai-summary-card mb-6">
            <p className="text-sm text-secondary-dark leading-relaxed">
              AI 摘要功能即将上线 — 将为您智能总结「{query}」的相关结果
            </p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {searchTabs.map((tab, i) => (
            <button
              key={tab.key}
              className={`px-4 py-2 text-sm font-medium rounded-full ${
                i === 0
                  ? 'bg-primary text-text-inverse'
                  : 'bg-border-light text-text-secondary hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {!query ? (
          <div className="py-12 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-text-secondary">输入关键词开始搜索</p>
            <p className="text-text-muted text-sm mt-1">搜索商家、新闻、指南、达人、活动</p>
          </div>
        ) : !hasResults ? (
          <div className="py-12 text-center">
            <p className="text-4xl mb-4">😔</p>
            <p className="text-text-secondary">没有找到「{query}」的相关结果</p>
            <p className="text-text-muted text-sm mt-1">试试其他关键词或浏览分类</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Business Results */}
            {businesses.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4">商家 ({businesses.length})</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {businesses.map((biz) => (
                    <Link key={biz.id} href={`/biz/${biz.slug}`} className="card p-4 block">
                      <h3 className="font-semibold text-sm mb-1">{biz.display_name}</h3>
                      {biz.category && (
                        <span className="badge badge-gray text-xs">{biz.category}</span>
                      )}
                      {biz.address && (
                        <p className="text-xs text-text-muted mt-2 line-clamp-1">{biz.address}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Article Results */}
            {articles.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4">新闻与指南 ({articles.length})</h2>
                <div className="space-y-4">
                  {articles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="card p-5 block"
                    >
                      <h3 className="font-semibold text-base mb-2 line-clamp-2">
                        {article.title_zh || article.title_en}
                      </h3>
                      {(article.ai_summary_zh || article.summary_zh) && (
                        <p className="text-sm text-text-secondary line-clamp-2">
                          {article.ai_summary_zh || article.summary_zh}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
