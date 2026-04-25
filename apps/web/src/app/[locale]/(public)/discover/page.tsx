import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/routing';
import { EditorialContainer } from '@/components/editorial/container';
import { EditorialCard } from '@/components/editorial/card';
import { DiscoverCard } from '@/components/discover/discover-card';
import { MasonryGrid } from '@/components/discover/masonry-grid';
import { DiscoverFeedClient } from '@/components/discover/discover-feed-client';
import { Pagination } from '@/components/shared/pagination';
import type { Metadata } from 'next';
import { getCurrentSite } from '@/lib/sites';
import { getCurrentUser } from '@/lib/auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: '逛逛晒晒 · Baam',
  description: '发现纽约华人生活中值得关注的人、内容、地点、服务与趋势',
};

interface Props {
  searchParams: Promise<{ tab?: string; page?: string; category?: string }>;
}

export default async function DiscoverPage({ searchParams }: Props) {
  const sp = await searchParams;
  const activeTab = sp.tab || 'all';
  const currentPage = Math.max(1, parseInt(sp.page || '1', 10));
  const categoryFilter = sp.category || null;

  const supabase = await createClient();
  const site = await getCurrentSite();
  const currentUser = await getCurrentUser().catch(() => null);

  // Fetch content categories
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawCategories } = await (supabase as any)
    .from('categories_discover')
    .select('id, slug, name_zh, name_en, icon, sort_order')
    .eq('is_active', true)
    .eq('site_scope', 'zh')
    .order('sort_order', { ascending: true });
  const categories = (rawCategories || []) as AnyRow[];

  // Build posts query
  let postsQuery = supabase
    .from('voice_posts')
    .select('*, profiles!voice_posts_author_id_fkey(id, username, display_name, avatar_url, is_verified, profile_type)', { count: 'exact' })
    .eq('status', 'published')
    .eq('visibility', 'public')
    .eq('site_id', site.id);

  // Tab filter
  if (activeTab === 'notes') {
    postsQuery = postsQuery.in('post_type', ['note', 'short_post', 'blog', 'recommendation', 'guide_post']);
  } else if (activeTab === 'videos') {
    postsQuery = postsQuery.eq('post_type', 'video');
  }

  // Category filter
  const activeCategory = categoryFilter ? categories.find((c: AnyRow) => c.slug === categoryFilter) : null;
  if (activeCategory) {
    postsQuery = postsQuery.eq('category_id', activeCategory.id);
  }

  postsQuery = postsQuery.order('published_at', { ascending: false });
  const from = (currentPage - 1) * PAGE_SIZE;
  const { data: rawPosts, count } = await postsQuery.range(from, from + PAGE_SIZE - 1);
  const posts = (rawPosts || []) as AnyRow[];
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  // ─── Sidebar Data ───

  // 热门话题 — trending topics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawTopics } = await (supabase as any)
    .from('discover_topics')
    .select('id, slug, name_zh, icon_emoji, post_count')
    .eq('is_trending', true)
    .order('post_count', { ascending: false })
    .limit(8);
  const topics = (rawTopics || []) as AnyRow[];

  // 推荐创作者 — featured creators
  const { data: rawCreators } = await supabase
    .from('profiles')
    .select('id, username, display_name, headline, avatar_url, is_verified, follower_count, profile_type')
    .eq('is_featured', true)
    .neq('profile_type', 'user')
    .order('follower_count', { ascending: false })
    .limit(5);
  const creators = (rawCreators || []) as AnyRow[];

  // 本周热晒 — most viewed posts this week
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: rawHotPosts } = await supabase
    .from('voice_posts')
    .select('id, slug, title, cover_images, cover_image_url, like_count, view_count, save_count')
    .eq('status', 'published').eq('visibility', 'public').eq('site_id', site.id)
    .gte('published_at', oneWeekAgo)
    .order('view_count', { ascending: false })
    .limit(10);
  const hotPosts = (rawHotPosts || []) as AnyRow[];

  const preservedParams: Record<string, string> = {};
  if (activeTab !== 'all') preservedParams.tab = activeTab;
  if (categoryFilter) preservedParams.category = categoryFilter;

  const creatorGradients = ['from-pink-200 to-rose-300', 'from-amber-200 to-primary-light', 'from-emerald-200 to-teal-300', 'from-violet-200 to-purple-300', 'from-sky-200 to-blue-300'];

  return (
    <main>
      {/* ─── Header + Category Tabs ─── */}
      <div style={{ background: 'var(--ed-paper)', borderBottom: '1px solid var(--ed-line)' }}>
        <div style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '24px 16px 0' }}>
          {/* Title Row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'var(--ed-ink-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                N° 01 / Community
              </p>
              <h1 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, color: 'var(--ed-ink)', lineHeight: 1.2 }}>
                逛逛晒晒 <span style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontWeight: 400, color: 'var(--ed-ink-soft)', fontSize: '0.8em' }}>discover daily</span>
              </h1>
            </div>
            <Link
              href="/discover/new-post"
              className="flex items-center gap-2 text-sm fw-semibold transition-all hover:-translate-y-px"
              style={{ padding: '8px 18px', borderRadius: 'var(--ed-radius-pill)', background: 'var(--ed-accent)', color: 'var(--ed-paper)' }}
            >
              <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.25)', borderRadius: '50%', fontSize: 13, lineHeight: 1 }}>+</span>
              发个晒晒
            </Link>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0 -mb-px" style={{ scrollbarWidth: 'none' }}>
            <Link
              href="/discover"
              className="flex-shrink-0 transition-colors"
              style={{
                padding: '10px 16px', fontSize: 14,
                fontWeight: !categoryFilter ? 700 : 500,
                color: !categoryFilter ? 'var(--ed-accent)' : 'var(--ed-ink-soft)',
                borderBottom: !categoryFilter ? '2px solid var(--ed-accent)' : '2px solid transparent',
                whiteSpace: 'nowrap',
              }}
            >
              推荐
            </Link>
            {categories.map((cat: AnyRow) => (
              <Link
                key={cat.slug}
                href={`/discover?category=${cat.slug}`}
                className="flex-shrink-0 transition-colors"
                style={{
                  padding: '10px 16px', fontSize: 14,
                  fontWeight: categoryFilter === cat.slug ? 700 : 500,
                  color: categoryFilter === cat.slug ? 'var(--ed-accent)' : 'var(--ed-ink-soft)',
                  borderBottom: categoryFilter === cat.slug ? '2px solid var(--ed-accent)' : '2px solid transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.name_zh}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Main Content: 4-col feed + sidebar ─── */}
      <div style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '24px 16px 48px' }}>
        {/* Active Category Banner */}
        {activeCategory && (
          <div className="flex items-center justify-between mb-5" style={{
            padding: '12px 18px', background: 'var(--ed-surface)', border: '1px solid var(--ed-line)', borderRadius: 'var(--ed-radius-md)',
          }}>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 18 }}>{activeCategory.icon}</span>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>{activeCategory.name_zh}</h2>
              <span style={{ fontSize: 12, color: 'var(--ed-ink-muted)' }}>{activeCategory.name_en}</span>
            </div>
            <Link href="/discover" style={{ fontSize: 12, color: 'var(--ed-ink-muted)' }}>清除筛选 ×</Link>
          </div>
        )}

        <div className="lg:flex lg:gap-6">
          {/* ─── Left: 4-column masonry feed ─── */}
          <div className="flex-1 min-w-0">
            <DiscoverFeedClient isLoggedIn={!!currentUser} currentUserId={currentUser?.id}>
              {posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0' }}>
                  <p style={{ fontSize: 48, marginBottom: 16 }}>📝</p>
                  <p style={{ color: 'var(--ed-ink-soft)', fontSize: 15 }}>暂无内容</p>
                  <Link href="/discover/new-post" style={{ display: 'inline-block', marginTop: 16, padding: '8px 20px', borderRadius: 'var(--ed-radius-md)', fontSize: 14, fontWeight: 500, background: 'var(--ed-ink)', color: 'var(--ed-paper)' }}>
                    发布笔记
                  </Link>
                </div>
              ) : (
                <>
                  <MasonryGrid columns={4}>
                    {posts.map((post, i) => (
                      <DiscoverCard key={post.id} post={post} author={post.profiles} index={i} currentUserId={currentUser?.id} />
                    ))}
                  </MasonryGrid>
                  <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/discover" searchParams={preservedParams} />
                </>
              )}
            </DiscoverFeedClient>
          </div>

          {/* ─── Right: Sidebar (5th column) ─── */}
          <aside className="hidden lg:block flex-shrink-0 space-y-5" style={{ width: 240 }}>
            {/* 热门话题 */}
            {topics.length > 0 && (
              <EditorialCard className="p-4">
                <h3 className="flex items-center gap-2 mb-3" style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 14, fontWeight: 600 }}>
                  🔥 热门话题
                </h3>
                <div className="space-y-2">
                  {topics.map((t: AnyRow, i: number) => (
                    <Link key={t.id} href={`/discover?topic=${t.slug}`} className="flex items-center gap-2.5 group">
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs fw-bold" style={{
                        borderRadius: '50%',
                        background: i < 3 ? 'var(--ed-accent)' : 'var(--ed-line)',
                        color: i < 3 ? 'var(--ed-paper)' : 'var(--ed-ink-soft)',
                      }}>{i + 1}</span>
                      <span className="text-[13px] group-hover:text-[var(--ed-accent)] transition-colors truncate">#{t.name_zh}</span>
                    </Link>
                  ))}
                </div>
              </EditorialCard>
            )}

            {/* 推荐创作者 */}
            {creators.length > 0 && (
              <EditorialCard className="p-4">
                <h3 className="flex items-center gap-2 mb-3" style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 14, fontWeight: 600 }}>
                  👤 推荐创作者
                </h3>
                <div className="space-y-3">
                  {creators.map((c: AnyRow, i: number) => (
                    <Link key={c.id} href={`/discover/voices/${c.username}`} className="flex items-center gap-2.5 group">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${creatorGradients[i % creatorGradients.length]} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                        {c.display_name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] fw-semibold truncate group-hover:text-[var(--ed-accent)] transition-colors">{c.display_name}</p>
                        <p className="text-[11px] truncate" style={{ color: 'var(--ed-ink-muted)' }}>{c.headline || formatFollowers(c.follower_count || 0) + '粉丝'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </EditorialCard>
            )}

            {/* 本周热晒 — top 10 most viewed this week */}
            {hotPosts.length > 0 && (
              <EditorialCard className="p-4">
                <h3 className="flex items-center gap-2 mb-3" style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 14, fontWeight: 600 }}>
                  ✨ 本周热晒
                </h3>
                <div className="space-y-2.5">
                  {hotPosts.map((p: AnyRow, i: number) => {
                    const img = p.cover_image_url || p.cover_images?.[0] || null;
                    return (
                      <Link key={p.id} href={`/discover/${p.slug}`} className="flex items-start gap-2.5 group">
                        <span className="flex-shrink-0 text-[11px] fw-bold mt-0.5" style={{
                          width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '50%',
                          background: i < 3 ? 'var(--ed-accent)' : 'transparent',
                          color: i < 3 ? 'var(--ed-paper)' : 'var(--ed-ink-muted)',
                        }}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] leading-snug line-clamp-2 group-hover:text-[var(--ed-accent)] transition-colors">{p.title || '无标题'}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--ed-ink-muted)' }}>
                            {(p.view_count || 0).toLocaleString()} 浏览 · {p.like_count || 0} 赞
                          </p>
                        </div>
                        {img && (
                          <img src={img} alt="" className="flex-shrink-0 w-10 h-10 object-cover" style={{ borderRadius: 'var(--ed-radius-md)' }} />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </EditorialCard>
            )}
          </aside>
        </div>
      </div>

      {/* FAB: Create Post (mobile) */}
      <Link
        href="/discover/new-post"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center z-40 hover:scale-105 transition-all lg:hidden"
        style={{ background: 'var(--ed-ink)', color: 'var(--ed-paper)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
        title="发布笔记"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </main>
  );
}

function formatFollowers(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toLocaleString();
}
