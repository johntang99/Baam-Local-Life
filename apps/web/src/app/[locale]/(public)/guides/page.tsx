import { createClient } from '@/lib/supabase/server';
import { getCurrentSite } from '@/lib/sites';
import { Link } from '@/lib/i18n/routing';
import { EditorialPageHeader } from '@/components/editorial/page-header';
import { EditorialContainer } from '@/components/editorial/container';
import { EditorialCard } from '@/components/editorial/card';
import { NewsletterForm } from '@/components/shared/newsletter-form';
import type { Metadata } from 'next';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '生活资讯 · Baam',
    description: '纽约华人必备实用指南，AI整理，编辑审核，持续更新',
  };
}

const verticalConfig: Record<string, { label: string; bg: string; color: string }> = {
  guide_howto: { label: 'How-To', bg: 'var(--ed-ink)', color: 'var(--ed-paper)' },
  guide_checklist: { label: 'Checklist', bg: 'var(--ed-tag-green-bg)', color: 'var(--ed-tag-green-text)' },
  guide_bestof: { label: 'Best-of', bg: 'var(--ed-tag-green-bg)', color: 'var(--ed-tag-green-text)' },
  guide_comparison: { label: '对比', bg: 'var(--ed-tag-purple-bg)', color: 'var(--ed-tag-purple-text)' },
  guide_neighborhood: { label: '社区', bg: 'var(--ed-amber)', color: 'var(--ed-ink)' },
  guide_seasonal: { label: '时令', bg: 'var(--ed-accent)', color: 'var(--ed-paper)' },
  guide_resource: { label: '资源', bg: 'var(--ed-ink)', color: 'var(--ed-paper)' },
  guide_scenario: { label: '场景', bg: 'var(--ed-tag-purple-bg)', color: 'var(--ed-tag-purple-text)' },
};

const GUIDE_VERTICALS = [
  'guide_howto', 'guide_checklist', 'guide_bestof', 'guide_comparison',
  'guide_neighborhood', 'guide_seasonal', 'guide_resource', 'guide_scenario',
];

const GUIDE_CATEGORY_ORDER = [
  'guide-new-immigrant', 'guide-medical', 'guide-education', 'guide-housing',
  'guide-tax-business', 'guide-dmv-transport', 'guide-family', 'guide-food-weekend',
  'guide-legal-docs', 'guide-chinese-resources', 'guide-new-in-town', 'guide-government-howto',
  'guide-best-of',
];

const coverEmojis = ['📋', '🏥', '💼', '🏠', '🚗', '🏫', '🍜', '⚖️', '🌏', '👨‍👩‍👧', '📊', '🔑'];

function getEmoji(title: string, index: number) {
  const hash = title ? title.charCodeAt(0) % coverEmojis.length : index % coverEmojis.length;
  return coverEmojis[hash];
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cat?: string }>;
}

export default async function GuidesListPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const site = await getCurrentSite();
  const activeCategorySlug = (sp.cat || '').trim();
  const siteScope = String(locale || '').toLowerCase().startsWith('en') ? 'en' : 'zh';

  const { data: rawGuideCategories } = await supabase
    .from('categories_guide')
    .select('id, slug, name_zh, name_en, icon, sort_order, site_scope')
    .eq('site_scope', siteScope)
    .order('sort_order', { ascending: true });
  const categories = (rawGuideCategories || []) as AnyRow[];
  const categoriesBySlug = new Map(categories.map((cat) => [String(cat.slug), cat]));
  const orderedCategories = GUIDE_CATEGORY_ORDER
    .map((slug) => categoriesBySlug.get(slug))
    .filter(Boolean) as AnyRow[];
  const visibleCategories = orderedCategories.length > 0 ? orderedCategories : categories;

  const activeCategoryId =
    activeCategorySlug && categoriesBySlug.get(activeCategorySlug)
      ? String(categoriesBySlug.get(activeCategorySlug)!.id)
      : '';

  let dataQuery = supabase
    .from('articles')
    .select('id, slug, title_zh, title_en, ai_summary_zh, summary_zh, content_vertical, published_at, category_id, audience_types, body_zh, view_count, cover_image_url')
    .eq('site_id', site.id)
    .in('content_vertical', GUIDE_VERTICALS)
    .eq('editorial_status', 'published')
    .order('published_at', { ascending: false })
    .limit(120);
  if (activeCategoryId) {
    dataQuery = dataQuery.eq('category_id', activeCategoryId);
  }
  const { data: rawArticles, error } = await dataQuery;
  const articles = (rawArticles || []) as AnyRow[];

  const featuredGuide = !activeCategoryId ? (articles[0] || null) : null;
  const recentGuides = !activeCategoryId ? articles.slice(1, 5) : [];
  const categoryGroups: { category: AnyRow; guides: AnyRow[] }[] = [];
  if (!activeCategoryId) {
    for (const cat of visibleCategories) {
      const catGuides = articles.filter((a) => String(a.category_id) === String(cat.id));
      if (catGuides.length > 0) {
        categoryGroups.push({ category: cat, guides: catGuides.slice(0, 6) });
      }
    }
  }

  // Build filter tabs from categories
  const filterTabs = [
    { key: '', label: '全部', href: '/guides' },
    ...visibleCategories.map(cat => ({
      key: cat.slug,
      label: cat.name_zh || cat.name_en,
      href: `/guides?cat=${cat.slug}`,
    })),
  ];

  return (
    <main>
      <EditorialPageHeader
        breadcrumbs={[
          { label: '首页', href: '/' },
          { label: '生活资讯' },
        ]}
        title="生活资讯"
        titleEm="Living Guides"
        subtitle="纽约华人必备实用指南，AI整理，编辑审核，持续更新"
      />

      {/* Category Tab Bar — sticky */}
      <div className="sticky top-[52px] z-40" style={{
        background: 'var(--ed-paper)',
        borderBottom: '1px solid var(--ed-line)',
      }}>
        <div style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '0 16px' }}>
          <div className="flex gap-1.5 overflow-x-auto py-3 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            {filterTabs.map((tab) => (
              <Link
                key={tab.key}
                href={tab.href}
                className="transition-all whitespace-nowrap flex-shrink-0"
                style={{
                  padding: '6px 14px', borderRadius: 'var(--ed-radius-pill)', fontSize: 13,
                  background: activeCategorySlug === tab.key ? 'var(--ed-ink)' : 'transparent',
                  color: activeCategorySlug === tab.key ? 'var(--ed-paper)' : 'var(--ed-ink-soft)',
                  border: activeCategorySlug === tab.key ? '1px solid var(--ed-ink)' : '1px solid var(--ed-line)',
                }}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <EditorialContainer className="py-8 pb-16">
        {error ? (
          <p style={{ color: 'var(--ed-ink-muted)', textAlign: 'center', padding: '48px 0' }}>
            加载指南时出错，请稍后重试。
          </p>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>📚</p>
            <p style={{ color: 'var(--ed-ink-soft)', fontSize: 15 }}>当前分类暂无文章</p>
            <p style={{ color: 'var(--ed-ink-muted)', fontSize: 13, marginTop: 6 }}>请切换分类或稍后再看</p>
          </div>
        ) : (
          <div className="lg:flex lg:gap-10">
            <div className="flex-1 min-w-0">
              {/* Featured + Recent (when not filtered by category) */}
              {!activeCategoryId && featuredGuide && (
                <section className="mb-10">
                  <div className="grid lg:grid-cols-5 gap-5">
                    {/* Featured large card */}
                    <Link href={`/guides/${featuredGuide.slug}`} className="lg:col-span-3 block group">
                      <EditorialCard className="h-full overflow-hidden flex flex-col">
                        <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                          {featuredGuide.cover_image_url ? (
                            <img
                              src={featuredGuide.cover_image_url}
                              alt={featuredGuide.title_zh || featuredGuide.title_en || ''}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--ed-paper-warm)' }}>
                              <span style={{ fontSize: 64, opacity: 0.4 }}>{getEmoji(featuredGuide.title_zh || '', 0)}</span>
                            </div>
                          )}
                          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(31,27,22,0.7) 0%, transparent 60%)' }} />
                          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                            <span style={{
                              display: 'inline-block', padding: '3px 12px', borderRadius: 'var(--ed-radius-pill)',
                              fontSize: 11.5, fontWeight: 500, marginBottom: 10,
                              background: 'var(--ed-tag-green-bg)', color: 'var(--ed-tag-green-text)',
                            }}>
                              编辑精选
                            </span>
                            <h2 style={{
                              fontFamily: 'var(--ed-font-serif)', fontSize: 'clamp(18px, 2.5vw, 24px)',
                              fontWeight: 700, lineHeight: 1.3, color: '#fff',
                            }}>
                              {featuredGuide.title_zh || featuredGuide.title_en}
                            </h2>
                          </div>
                        </div>
                        {(featuredGuide.ai_summary_zh || featuredGuide.summary_zh) && (
                          <div style={{ padding: '16px 20px' }}>
                            <p style={{ fontSize: 13.5, color: 'var(--ed-ink-soft)', lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {featuredGuide.ai_summary_zh || featuredGuide.summary_zh}
                            </p>
                          </div>
                        )}
                      </EditorialCard>
                    </Link>

                    {/* Recent guides stack */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                      <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ed-ink-muted)' }}>
                        最近发布
                      </h3>
                      {recentGuides.map((guide, idx) => {
                        const tag = verticalConfig[guide.content_vertical] || verticalConfig.guide_howto;
                        return (
                          <Link key={guide.id} href={`/guides/${guide.slug}`} className="group block">
                            <EditorialCard className="flex gap-4 p-4">
                              {guide.cover_image_url ? (
                                <div className="w-20 h-20 flex-shrink-0 overflow-hidden" style={{ borderRadius: 'var(--ed-radius-md)' }}>
                                  <img src={guide.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                </div>
                              ) : (
                                <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center" style={{ borderRadius: 'var(--ed-radius-md)', background: 'var(--ed-paper-warm)' }}>
                                  <span style={{ fontSize: 28, opacity: 0.5 }}>{getEmoji(guide.title_zh || '', idx)}</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span style={{ padding: '2px 8px', borderRadius: 'var(--ed-radius-pill)', fontSize: 10.5, fontWeight: 500, background: tag.bg, color: tag.color }}>
                                    {tag.label}
                                  </span>
                                  <span style={{ fontSize: 11.5, color: 'var(--ed-ink-muted)' }}>{formatTimeAgo(guide.published_at)}</span>
                                </div>
                                <h4 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 14, fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {guide.title_zh || guide.title_en}
                                </h4>
                              </div>
                            </EditorialCard>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              {/* Category filtered view */}
              {activeCategoryId ? (
                <section>
                  {/* Category header */}
                  <div style={{
                    padding: '24px 28px',
                    background: 'var(--ed-surface)',
                    border: '1px solid var(--ed-line)',
                    borderRadius: 'var(--ed-radius-lg)',
                    marginBottom: 28,
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}>
                    <span style={{ fontSize: 36 }}>{categoriesBySlug.get(activeCategorySlug)?.icon || '📚'}</span>
                    <div>
                      <h2 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 22, fontWeight: 700 }}>
                        {categoriesBySlug.get(activeCategorySlug)?.name_zh || categoriesBySlug.get(activeCategorySlug)?.name_en}
                      </h2>
                      <p style={{ fontSize: 13, color: 'var(--ed-ink-muted)', marginTop: 4 }}>
                        该分类共有 {articles.length} 篇实用指南
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {articles.map((guide, idx) => (
                      <GuideCard key={guide.id} guide={guide} index={idx} categories={categories} />
                    ))}
                  </div>
                </section>
              ) : (
                /* Category groups (all view) */
                categoryGroups.map((group, groupIdx) => (
                  <section key={group.category.id || groupIdx} style={{ marginBottom: 48 }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                      <div className="flex items-center gap-3">
                        {group.category.icon && <span style={{ fontSize: 24 }}>{group.category.icon}</span>}
                        <h2 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 19, fontWeight: 700 }}>
                          {group.category.name_zh || group.category.name_en}
                        </h2>
                      </div>
                      <Link
                        href={`/guides?cat=${group.category.slug}`}
                        style={{ fontSize: 13, color: 'var(--ed-accent)', fontWeight: 500 }}
                      >
                        更多 →
                      </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {group.guides.map((guide, idx) => (
                        <GuideCard key={guide.id} guide={guide} index={groupIdx * 4 + idx} categories={categories} />
                      ))}
                    </div>
                  </section>
                ))
              )}

              {/* Newsletter CTA */}
              <div style={{
                background: 'var(--ed-ink)',
                color: 'var(--ed-paper)',
                borderRadius: 'var(--ed-radius-xl)',
                padding: '40px 32px',
                textAlign: 'center',
                marginTop: 48,
              }}>
                <h2 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                  订阅纽约本地周报
                </h2>
                <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 24 }}>
                  每周一封，精选本地新闻、实用指南、活动推荐
                </p>
                <div style={{ maxWidth: 400, margin: '0 auto' }}>
                  <NewsletterForm source="guides_cta" />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block flex-shrink-0" style={{ width: 260 }}>
              <div className="sticky" style={{ top: 110 }}>
                {/* Hot search */}
                <div style={{
                  background: 'var(--ed-surface-elev)',
                  border: '1px solid var(--ed-line)',
                  borderRadius: 'var(--ed-radius-lg)',
                  padding: '20px',
                  marginBottom: 20,
                }}>
                  <h3 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                    热门搜索
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['中文家庭医生', '报税服务', '驾照路考', '学区排名', '白卡申请', '租房攻略'].map((term) => (
                      <Link
                        key={term}
                        href={`/ask?q=${encodeURIComponent(term)}`}
                        style={{
                          padding: '5px 12px', borderRadius: 'var(--ed-radius-pill)',
                          fontSize: 12, border: '1px solid var(--ed-line)',
                          color: 'var(--ed-ink-soft)', transition: 'all 0.2s',
                        }}
                        className="hover:border-[var(--ed-accent)] hover:text-[var(--ed-accent)]"
                      >
                        {term}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Sponsored */}
                <div style={{
                  background: 'var(--ed-surface-elev)',
                  border: '1px solid var(--ed-line)',
                  borderRadius: 'var(--ed-radius-lg)',
                  padding: '20px',
                }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 14, fontWeight: 600 }}>推荐商家</h3>
                    <span style={{ fontSize: 11, color: 'var(--ed-ink-muted)' }}>赞助</span>
                  </div>
                  <div className="flex items-start gap-3" style={{ marginBottom: 12 }}>
                    <div className="w-11 h-11 flex-shrink-0 flex items-center justify-center" style={{ borderRadius: 'var(--ed-radius-md)', background: 'var(--ed-paper-warm)' }}>
                      <span style={{ fontSize: 20 }}>💼</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>华信会计师事务所</h4>
                      <p style={{ fontSize: 12, color: 'var(--ed-ink-muted)' }}>报税季特惠，新客户可享优惠</p>
                    </div>
                  </div>
                  <Link
                    href="/businesses"
                    style={{
                      display: 'block', textAlign: 'center',
                      padding: '8px 0', borderRadius: 'var(--ed-radius-md)',
                      fontSize: 13, fontWeight: 500,
                      background: 'var(--ed-ink)', color: 'var(--ed-paper)',
                    }}
                  >
                    了解详情
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}
      </EditorialContainer>
    </main>
  );
}

function GuideCard({ guide, index, categories }: { guide: AnyRow; index: number; categories: AnyRow[] }) {
  const tag = verticalConfig[guide.content_vertical] || verticalConfig.guide_howto;
  const category = categories.find((cat) => String(cat.id) === String(guide.category_id));

  return (
    <Link href={`/guides/${guide.slug}`} className="group block">
      <EditorialCard className="h-full flex flex-col overflow-hidden">
        <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
          {guide.cover_image_url ? (
            <img
              src={guide.cover_image_url}
              alt={guide.title_zh || guide.title_en || ''}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--ed-paper-warm)' }}>
              <span style={{ fontSize: 40, opacity: 0.4 }}>{getEmoji(guide.title_zh || guide.title_en || '', index)}</span>
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
        <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {category && (
            <span style={{ fontSize: 11.5, color: 'var(--ed-ink-muted)' }}>
              {category.icon} {category.name_zh || category.name_en}
            </span>
          )}
          <h3 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 14.5, fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {guide.title_zh || guide.title_en}
          </h3>
          <span style={{ marginTop: 'auto', paddingTop: 6, fontSize: 12, color: 'var(--ed-ink-muted)' }}>
            {formatTimeAgo(guide.published_at)}
          </span>
        </div>
      </EditorialCard>
    </Link>
  );
}
