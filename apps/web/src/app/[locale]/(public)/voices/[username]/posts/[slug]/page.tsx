import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';
import { FollowButton, LikeButton, CommentForm } from '@/components/shared/social-actions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: string; username: string; slug: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, slug } = await params;
  const supabase = await createClient();

  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('username', username)
    .single();

  const profile = profileData as AnyRow | null;
  if (!profile) return { title: 'Not Found' };

  const { data: postData } = await supabase
    .from('voice_posts')
    .select('title, content')
    .eq('slug', slug)
    .eq('author_id', profile.id)
    .single();

  const post = postData as AnyRow | null;
  if (!post) return { title: 'Not Found' };

  return {
    title: `${post.title} · ${profile.display_name} · Baam`,
    description: post.content?.slice(0, 160) || '',
    openGraph: {
      title: post.title || '',
      description: post.content?.slice(0, 160) || '',
    },
  };
}

export default async function VoicePostDetailPage({ params }: Props) {
  const { username, slug } = await params;
  const supabase = await createClient();
  const currentUser = await getCurrentUser().catch(() => null);

  // Fetch author profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  const profile = profileData as AnyRow | null;
  if (profileError || !profile) notFound();

  // Fetch post
  const { data: postData, error: postError } = await supabase
    .from('voice_posts')
    .select('*')
    .eq('slug', slug)
    .eq('author_id', profile.id)
    .eq('status', 'published')
    .single();

  const post = postData as AnyRow | null;
  if (postError || !post) notFound();

  // Fetch comments
  const { data: rawComments } = await supabase
    .from('voice_post_comments')
    .select('*')
    .eq('post_id', post.id)
    .order('created_at', { ascending: true });

  const comments = (rawComments || []) as AnyRow[];

  // Fetch more posts from same author
  const { data: rawMorePosts } = await supabase
    .from('voice_posts')
    .select('*')
    .eq('author_id', profile.id)
    .eq('status', 'published')
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(4);

  const morePosts = (rawMorePosts || []) as AnyRow[];

  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-text-muted mb-4">
          <Link href="/" className="hover:text-primary">首页</Link>
          <span className="mx-2">›</span>
          <Link href="/voices" className="hover:text-primary">达人</Link>
          <span className="mx-2">›</span>
          <Link href={`/voices/${username}`} className="hover:text-primary">
            {profile.display_name || username}
          </Link>
          <span className="mx-2">›</span>
          <span className="text-text-secondary">{post.title}</span>
        </nav>

        <div className="lg:flex gap-8">
          {/* Main Content */}
          <article className="flex-1 max-w-[var(--content-max)]">
            {/* Author Card */}
            <div className="flex items-center gap-3 mb-6">
              <Link href={`/voices/${username}`}>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                  {profile.display_name?.[0] || '?'}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/voices/${username}`} className="font-semibold text-sm hover:text-primary">
                    {profile.display_name || username}
                  </Link>
                  {profile.is_verified && (
                    <span className="badge badge-blue text-xs">已认证</span>
                  )}
                </div>
                <p className="text-xs text-text-muted">{profile.follower_count || 0} 关注者</p>
              </div>
              <FollowButton profileId={profile.id} isFollowing={false} isLoggedIn={!!currentUser} className="h-8 px-4 text-xs rounded-lg" />
            </div>

            {/* Post Header */}
            <header className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                {post.content_type && (
                  <span className="badge badge-purple text-xs">{post.content_type}</span>
                )}
                {post.published_at && (
                  <span className="text-xs text-text-muted">
                    {new Date(post.published_at).toLocaleDateString('zh-CN', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{post.title}</h1>
            </header>

            {/* Post Body */}
            {post.body && (
              <div className="prose prose-sm max-w-none mb-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-text-primary [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-text-secondary">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4 py-4 border-t border-b border-border mb-8">
              <LikeButton postId={post.id} isLiked={false} likeCount={post.like_count || 0} isLoggedIn={!!currentUser} />
              <span className="text-sm text-text-muted">💬 {post.comment_count || 0} 评论</span>
            </div>

            {/* Comments */}
            <section className="mb-8">
              <h2 className="text-lg font-bold mb-4">评论 ({comments.length})</h2>
              {comments.length > 0 && (
                <div className="space-y-4 mb-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs flex-shrink-0">
                          {(comment.author_name || '?')[0]}
                        </div>
                        <span className="text-sm font-medium">{comment.author_name || '匿名用户'}</span>
                        {comment.created_at && (
                          <span className="text-xs text-text-muted">
                            {formatTimeAgo(comment.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-primary pl-9">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
              <CommentForm postId={post.id} isLoggedIn={!!currentUser} />
            </section>

            {/* More from Author */}
            {morePosts.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4">更多来自 {profile.display_name || username}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {morePosts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/voices/${username}/posts/${p.slug}`}
                      className="card p-4 block"
                    >
                      <h3 className="font-medium text-sm line-clamp-2 mb-2">{p.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span>{p.like_count || 0} 赞</span>
                        <span>{p.comment_count || 0} 评论</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6 mt-8 lg:mt-0">
            <div className="bg-bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-3">关于作者</h3>
              <Link href={`/voices/${username}`} className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
                  {profile.display_name?.[0] || '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{profile.display_name}</p>
                  <p className="text-xs text-text-muted">{profile.headline}</p>
                </div>
              </Link>
              {profile.bio && (
                <p className="text-xs text-text-secondary line-clamp-3">{profile.bio}</p>
              )}
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
