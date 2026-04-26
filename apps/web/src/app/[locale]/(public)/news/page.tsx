import { createClient } from '@/lib/supabase/server';
import { getCurrentSite } from '@/lib/sites';
import { Link } from '@/lib/i18n/routing';
import { EditorialPageHeader } from '@/components/editorial/page-header';
import { EditorialContainer } from '@/components/editorial/container';
import { EditorialFilterBar } from '@/components/editorial/filter-bar';
import { EditorialCard } from '@/components/editorial/card';
import { NewsletterForm } from '@/components/shared/newsletter-form';
import type { Metadata } from 'next';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const PAGE_SIZE = 20;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '新闻 · Baam',
    description: '纽约本地新闻、政策变化、社区动态、活动公告',
  };
}

const verticalConfig: Record<string, { label: string; bg: string; color: string; emoji: string }> = {
  news_alert: { label: '快报', bg: 'var(--ed-accent)', color: 'var(--ed-paper)', emoji: '🚨' },
  news_brief: { label: '简报', bg: 'var(--ed-ink)', color: 'var(--ed-paper)', emoji: '📄' },
  news_explainer: { label: '政策解读', bg: 'var(--ed-tag-purple-bg)', color: 'var(--ed-tag-purple-text)', emoji: '📖' },
  news_roundup: { label: '周度汇总', bg: 'var(--ed-amber)', color: 'var(--ed-ink)', emoji: '📊' },
  news_community: { label: '社区新闻', bg: 'var(--ed-tag-green-bg)', color: 'var(--ed-tag-green-text)', emoji: '👥' },
};

const filterTabs = [
  { key: 'all', label: '全部', verticals: ['news_alert', 'news_brief', 'news_explainer', 'news_roundup', 'news_community'] },
  { key: 'alert', label: '快报', verticals: ['news_alert'] },
  { key: 'brief', label: '简报', verticals: ['news_brief'] },
  { key: 'explainer', label: '解读', verticals: ['news_explainer'] },
  { key: 'roundup', label: '汇总', verticals: ['news_roundup'] },
  { key: 'community', label: '社区', verticals: ['news_community'] },
];

// Keyword-based fallback images
const topicImages: Record<string, string> = {
  '美甲': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop&q=80',
  '英语': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop&q=80',
  '报税': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop&q=80',
  '保险': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop&q=80',
  '移民': 'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=600&h=400&fit=crop&q=80',
  '租房': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop&q=80',
  '餐': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop&q=80',
  '美食': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop&q=80',
  '驾照': 'https://images.unsplash.com/photo-1449965408869-ebd3fee7710d?w=600&h=400&fit=crop&q=80',
  '活动': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop&q=80',
  '地铁': 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&h=400&fit=crop&q=80',
};

function getArticleImage(article: AnyRow, index: number): string | null {
  if (article.cover_image_url) return article.cover_image_url;
  const title = article.title_zh || article.title || '';
  for (const [keyword, url] of Object.entries(topicImages)) {
    if (title.includes(keyword)) return url;
  }
  return null;
}

function formatNewsDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + ' · ' + d.getFullYear();
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

interface Props {
  searchParams: Promise<{ page?: string; type?: string }>;
}

export default async function NewsListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page || '1', 10));
  const activeType = sp.type || 'all';
  const activeTab = filterTabs.find(t => t.key === activeType) || filterTabs[0];

  const supabase = await createClient();
  const site = await getCurrentSite();

  const countQuery = supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('site_id', site.id)
    .in('content_vertical', activeTab.verticals)
    .eq('editorial_status', 'published')
    .not('title_zh', 'is', null);
  const { count } = await countQuery;
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  const from = (currentPage - 1) * PAGE_SIZE;
  const { data: rawArticles, error } = await supabase
    .from('articles')
    .select('*')
    .eq('site_id', site.id)
    .in('content_vertical', activeTab.verticals)
    .eq('editorial_status', 'published')
    .not('title_zh', 'is', null)
    .order('published_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const articles = (rawArticles || []) as AnyRow[];

  // Alerts banner
  const { data: rawAlerts } = await supabase
    .from('articles')
    .select('*')
    .eq('site_id', site.id)
    .eq('content_vertical', 'news_alert')
    .eq('editorial_status', 'published')
    .order('published_at', { ascending: false })
    .limit(3);
  const alerts = (rawAlerts || []) as AnyRow[];

  const preservedParams: Record<string, string> = {};
  if (activeType !== 'all') preservedParams.type = activeType;

  // Split featured (first 3 with images) vs rest
  const featured = articles.slice(0, 3);
  const rest = articles.slice(3);

  return (
    <main>
      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div style={{
          background: 'var(--ed-accent)',
          color: 'var(--ed-paper)',
          padding: '10px 16px',
          fontSize: 13.5,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span style={{ flex: 1 }}>
            <strong>紧急提醒：</strong>{alerts[0].title_zh}
          </span>
          <Link href={`/news/${alerts[0].slug}`} style={{ color: 'var(--ed-paper)', opacity: 0.9, textDecoration: 'underline', fontSize: 12.5 }}>
            查看详情 →
          </Link>
        </div>
      )}

      <EditorialPageHeader
        breadcrumbs={[
          { label: '首页', href: '/' },
          { label: '新闻' },
        ]}
        title="今日要闻"
        titleEm="Newsroom"
        subtitle="纽约本地新闻、政策变化、社区动态"
      />

      <EditorialContainer className="pb-16">
        {/* Filter tabs */}
        <EditorialFilterBar
          tabs={filterTabs.map(t => ({
            key: t.key,
            label: t.label,
            href: t.key === 'all' ? '/news' : `/news?type=${t.key}`,
          }))}
          activeKey={activeType}
        />

        <div className="lg:flex gap-10">
          <div className="flex-1 min-w-0">
            {error ? (
              <p style={{ color: 'var(--ed-ink-muted)', textAlign: 'center', padding: '48px 0' }}>
                加载新闻时出错，请稍后重试。
              </p>
            ) : articles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 0' }}>
                <p style={{ fontSize: 48, marginBottom: 16 }}>📰</p>
                <p style={{ color: 'var(--ed-ink-soft)', fontSize: 15 }}>暂无新闻内容</p>
                <p style={{ color: 'var(--ed-ink-muted)', fontSize: 13, marginTop: 6 }}>新闻将在这里显示</p>
              </div>
            ) : (
              <>
                {/* Featured top row — large left + 2 stacked right */}
                {featured.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 mb-8">
                    {/* Large feature card */}
                    <Link href={`/news/${featured[0].slug}`} className="block group">
                      <EditorialCard className="h-full flex flex-col">
                        {(() => {
                          const img = getArticleImage(featured[0], 0);
                          const tag = verticalConfig[featured[0].content_vertical] || verticalConfig.news_brief;
                          return (
                            <>
                              <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                {img ? (
                                  <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--ed-paper-warm)' }}>
                                    <span style={{ fontSize: 56, opacity: 0.5 }}>{tag.emoji}</span>
                                  </div>
                                )}
                                <span className="absolute" style={{
                                  bottom: 12, left: 12,
                                  padding: '4px 12px', borderRadius: 'var(--ed-radius-pill)',
                                  fontSize: 11.5, fontWeight: 500,
                                  background: tag.bg, color: tag.color,
                                }}>
                                  {tag.label}
                                </span>
                              </div>
                              <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: 12, color: 'var(--ed-ink-muted)', fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', marginBottom: 10 }}>
                                  {formatNewsDate(featured[0].published_at)}
                                </div>
                                <h3 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 20, fontWeight: 600, lineHeight: 1.35, marginBottom: 10 }}>
                                  {featured[0].title_zh || featured[0].title_en}
                                </h3>
                                <p style={{ fontSize: 14, color: 'var(--ed-ink-soft)', lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {featured[0].ai_summary_zh || featured[0].summary_zh || ''}
                                </p>
                              </div>
                            </>
                          );
                        })()}
                      </EditorialCard>
                    </Link>

                    {/* Right stacked cards */}
                    <div className="flex flex-col gap-5">
                      {featured.slice(1, 3).map((article, i) => {
                        const img = getArticleImage(article, i + 1);
                        const tag = verticalConfig[article.content_vertical] || verticalConfig.news_community;
                        return (
                          <Link key={article.id} href={`/news/${article.slug}`} className="block group flex-1">
                            <EditorialCard className="h-full flex flex-row overflow-hidden">
                              {/* Image */}
                              <div className="relative flex-shrink-0 w-[140px] sm:w-[180px]" style={{ overflow: 'hidden' }}>
                                {img ? (
                                  <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--ed-paper-warm)' }}>
                                    <span style={{ fontSize: 32, opacity: 0.5 }}>{tag.emoji}</span>
                                  </div>
                                )}
                              </div>
                              {/* Content */}
                              <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <span style={{
                                  display: 'inline-block', width: 'fit-content',
                                  padding: '2px 10px', borderRadius: 'var(--ed-radius-pill)',
                                  fontSize: 11, fontWeight: 500, marginBottom: 8,
                                  background: tag.bg, color: tag.color,
                                }}>
                                  {tag.label}
                                </span>
                                <h3 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 15, fontWeight: 600, lineHeight: 1.4, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {article.title_zh || article.title_en}
                                </h3>
                                <div style={{ marginTop: 'auto', fontSize: 12, color: 'var(--ed-ink-muted)', fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic' }}>
                                  {formatNewsDate(article.published_at)}
                                </div>
                              </div>
                            </EditorialCard>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Divider */}
                {rest.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--ed-line)', margin: '8px 0 32px', position: 'relative' }}>
                    <span style={{
                      position: 'absolute', top: -10, left: 0,
                      background: 'var(--ed-paper)', padding: '0 12px 0 0',
                      fontSize: 12, color: 'var(--ed-ink-muted)',
                      fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic',
                    }}>
                      more stories
                    </span>
                  </div>
                )}

                {/* Rest of articles — compact list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rest.map((article, i) => {
                    const tag = verticalConfig[article.content_vertical] || verticalConfig.news_community;
                    const img = getArticleImage(article, i + 3);
                    const summary = article.ai_summary_zh || article.summary_zh;

                    return (
                      <Link key={article.id} href={`/news/${article.slug}`} className="block group">
                        <EditorialCard className="h-full flex flex-col">
                          {/* Image or placeholder */}
                          <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                            {img ? (
                              <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--ed-paper-warm)' }}>
                                <span style={{ fontSize: 40, opacity: 0.4 }}>{tag.emoji}</span>
                              </div>
                            )}
                            <span className="absolute" style={{
                              bottom: 8, left: 10,
                              padding: '3px 10px', borderRadius: 'var(--ed-radius-pill)',
                              fontSize: 11, fontWeight: 500,
                              background: tag.bg, color: tag.color,
                            }}>
                              {tag.label}
                            </span>
                          </div>
                          <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <h3 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 14.5, fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {article.title_zh || article.title_en}
                            </h3>
                            {summary && (
                              <p style={{ fontSize: 13, color: 'var(--ed-ink-soft)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {summary}
                              </p>
                            )}
                            <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--ed-line)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ed-ink-muted)' }}>
                              <span>{formatTimeAgo(article.published_at)}</span>
                              {article.source_name && (
                                <>
                                  <span style={{ color: 'var(--ed-line-strong)' }}>·</span>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.source_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </EditorialCard>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-1 mt-10" aria-label="分页">
                {currentPage > 1 ? (
                  <Link
                    href={buildPaginationHref('/news', currentPage - 1, preservedParams)}
                    style={{ padding: '8px 14px', fontSize: 13, color: 'var(--ed-ink-soft)', borderRadius: 'var(--ed-radius-md)', transition: 'all 0.2s' }}
                    className="hover:bg-[var(--ed-surface)]"
                  >
                    上一页
                  </Link>
                ) : (
                  <span style={{ padding: '8px 14px', fontSize: 13, color: 'var(--ed-ink-muted)', opacity: 0.4, cursor: 'not-allowed' }}>上一页</span>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((page, idx, arr) => (
                    <span key={page} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span style={{ padding: '0 4px', color: 'var(--ed-ink-muted)' }}>...</span>
                      )}
                      <Link
                        href={buildPaginationHref('/news', page, preservedParams)}
                        style={{
                          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, borderRadius: 'var(--ed-radius-md)', transition: 'all 0.2s',
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
                  <Link
                    href={buildPaginationHref('/news', currentPage + 1, preservedParams)}
                    style={{ padding: '8px 14px', fontSize: 13, color: 'var(--ed-ink-soft)', borderRadius: 'var(--ed-radius-md)', transition: 'all 0.2s' }}
                    className="hover:bg-[var(--ed-surface)]"
                  >
                    下一页
                  </Link>
                ) : (
                  <span style={{ padding: '8px 14px', fontSize: 13, color: 'var(--ed-ink-muted)', opacity: 0.4, cursor: 'not-allowed' }}>下一页</span>
                )}
              </nav>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block flex-shrink-0" style={{ width: 280 }}>
            <div className="sticky" style={{ top: 100 }}>
              {/* Newsletter */}
              <div style={{
                background: 'var(--ed-surface-elev)',
                border: '1px solid var(--ed-line)',
                borderRadius: 'var(--ed-radius-lg)',
                padding: '24px 20px',
                marginBottom: 24,
              }}>
                <h3 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                  订阅本地周报
                </h3>
                <p style={{ fontSize: 13, color: 'var(--ed-ink-soft)', marginBottom: 16, lineHeight: 1.6 }}>
                  每周精选本地新闻、指南、活动
                </p>
                <NewsletterForm source="news_sidebar" />
              </div>

              {/* Category quick links */}
              <div style={{
                background: 'var(--ed-surface-elev)',
                border: '1px solid var(--ed-line)',
                borderRadius: 'var(--ed-radius-lg)',
                padding: '20px',
              }}>
                <h4 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
                  新闻分类
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filterTabs.filter(t => t.key !== 'all').map(tab => (
                    <Link
                      key={tab.key}
                      href={`/news?type=${tab.key}`}
                      style={{
                        fontSize: 13,
                        color: activeType === tab.key ? 'var(--ed-accent)' : 'var(--ed-ink-soft)',
                        fontWeight: activeType === tab.key ? 600 : 400,
                        padding: '6px 0',
                        borderBottom: '1px solid var(--ed-line)',
                        transition: 'color 0.2s',
                      }}
                      className="hover:text-[var(--ed-accent)]"
                    >
                      {tab.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
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
