import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: string; username: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('display_name, headline, avatar_url')
    .eq('username', username)
    .single();

  const profile = data as AnyRow | null;
  if (!profile) return { title: 'Not Found' };

  return {
    title: `${profile.display_name || username} · Baam`,
    description: profile.headline || '',
    openGraph: {
      title: profile.display_name || username,
      description: profile.headline || '',
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}

export default async function VoiceProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  // Fetch profile
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  const profile = data as AnyRow | null;
  if (error || !profile) notFound();

  // Fetch linked business
  const { data: rawLinks } = await supabase
    .from('profile_business_links')
    .select('*, businesses(*)')
    .eq('profile_id', profile.id)
    .limit(1);

  const businessLinks = (rawLinks || []) as AnyRow[];
  const linkedBusiness = businessLinks.length > 0 ? businessLinks[0].businesses as AnyRow | null : null;

  // Fetch posts
  const { data: rawPosts } = await supabase
    .from('voice_posts')
    .select('*')
    .eq('author_id', profile.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10);

  const posts = (rawPosts || []) as AnyRow[];

  // Fetch recommended voices
  const { data: rawRecommended } = await supabase
    .from('profiles')
    .select('id, username, display_name, headline, is_verified, follower_count')
    .neq('id', profile.id)
    .neq('profile_type', 'user')
    .limit(5);

  const recommended = (rawRecommended || []) as AnyRow[];

  return (
    <main>
      {/* Cover + Identity */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-40 relative" />

      <div className="max-w-7xl mx-auto px-4">
        {/* Profile Identity */}
        <div className="-mt-12 mb-6">
          <div className="flex items-end gap-4">
            {/* Avatar placeholder */}
            <div className="w-24 h-24 rounded-full bg-bg-card border-4 border-white flex items-center justify-center text-3xl shadow-sm">
              {profile.display_name?.[0] || '?'}
            </div>
            <div className="pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {profile.display_name || profile.username}
                </h1>
                {profile.is_verified && (
                  <span className="badge badge-blue text-xs">已认证</span>
                )}
              </div>
              {profile.headline && (
                <p className="text-text-secondary text-sm mt-1">{profile.headline}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-text-secondary text-sm mt-4 max-w-2xl">{profile.bio}</p>
          )}

          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-text-muted">
            <span><strong className="text-text-primary">{profile.follower_count || 0}</strong> 关注者</span>
            <span><strong className="text-text-primary">{posts.length}</strong> 篇内容</span>
            {profile.region && <span>{profile.region}</span>}
            {profile.language && <span>{profile.language}</span>}
          </div>

          {/* Follow Button */}
          <button className="btn btn-primary h-9 px-6 text-sm mt-4">关注</button>
        </div>

        <div className="lg:flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Linked Business Card */}
            {linkedBusiness && (
              <section className="mb-8">
                <h2 className="text-lg font-bold mb-3">关联商家</h2>
                <Link href={`/biz/${linkedBusiness.slug}`} className="card p-4 block">
                  <h3 className="font-semibold text-sm">{linkedBusiness.display_name}</h3>
                  {linkedBusiness.category && (
                    <span className="badge badge-gray text-xs mt-1">{linkedBusiness.category}</span>
                  )}
                </Link>
              </section>
            )}

            {/* Posts Section */}
            <section className="mb-8">
              <h2 className="text-lg font-bold mb-4">帖子</h2>
              {posts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-text-secondary">暂无帖子</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/voices/${username}/posts/${post.slug}`}
                      className="card p-5 block"
                    >
                      <h3 className="font-semibold text-base mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      {post.content && (
                        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                          {post.content.slice(0, 160)}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span>{post.like_count || 0} 赞</span>
                        <span>{post.comment_count || 0} 评论</span>
                        {post.published_at && (
                          <time>{formatTimeAgo(post.published_at)}</time>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Blog Section */}
            <section>
              <h2 className="text-lg font-bold mb-4">博客</h2>
              <div className="py-8 text-center">
                <p className="text-text-secondary text-sm">博客内容即将上线</p>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6 mt-8 lg:mt-0">
            {/* Recommended Voices */}
            {recommended.length > 0 && (
              <div className="bg-bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold text-sm mb-3">推荐达人</h3>
                <div className="space-y-3">
                  {recommended.map((v) => (
                    <Link key={v.id} href={`/voices/${v.username}`} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm flex-shrink-0">
                        {v.display_name?.[0] || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{v.display_name}</p>
                        <p className="text-xs text-text-muted truncate">{v.headline}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Guides placeholder */}
            <div className="bg-bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-3">相关指南</h3>
              <p className="text-xs text-text-muted">即将上线</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
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
