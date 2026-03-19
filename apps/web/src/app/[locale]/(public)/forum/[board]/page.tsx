import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: string; board: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { board } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('name_zh, name, description')
    .eq('slug', board)
    .eq('type', 'forum')
    .single();

  const boardData = data as AnyRow | null;
  if (!boardData) return { title: 'Not Found' };

  return {
    title: `${boardData.name_zh || boardData.name} · 社区论坛 · Baam`,
    description: boardData.description || '',
  };
}

export default async function ForumBoardPage({ params }: Props) {
  const { board } = await params;
  const supabase = await createClient();

  // Fetch board info
  const { data: rawBoard, error: boardError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', board)
    .eq('type', 'forum')
    .single();

  const boardData = rawBoard as AnyRow | null;
  if (boardError || !boardData) notFound();

  // Fetch threads for this board
  const { data: rawThreads } = await supabase
    .from('forum_threads')
    .select('*')
    .eq('board_id', boardData.id)
    .eq('status', 'published')
    .order('is_pinned', { ascending: false })
    .order('last_replied_at', { ascending: false })
    .limit(20);

  const threads = (rawThreads || []) as AnyRow[];

  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-text-muted mb-4">
          <Link href="/" className="hover:text-primary">首页</Link>
          <span className="mx-2">&rsaquo;</span>
          <Link href="/forum" className="hover:text-primary">论坛</Link>
          <span className="mx-2">&rsaquo;</span>
          <span className="text-text-secondary">{boardData.name_zh || boardData.name}</span>
        </nav>

        <div className="lg:flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Board Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>{boardData.emoji || '📋'}</span>
                {boardData.name_zh || boardData.name}
              </h1>
              {boardData.description && (
                <p className="text-sm text-text-secondary mt-1">{boardData.description}</p>
              )}
            </div>

            {/* Sort Buttons */}
            <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
              <button className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-text-inverse">最新回复</button>
              <button className="px-4 py-2 text-sm font-medium rounded-full bg-border-light text-text-secondary hover:bg-gray-200">最新发布</button>
              <button className="px-4 py-2 text-sm font-medium rounded-full bg-border-light text-text-secondary hover:bg-gray-200">最热</button>
            </div>

            {/* Thread List */}
            {threads.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-4xl mb-4">💬</p>
                <p className="text-text-secondary">该版块还没有帖子</p>
                <p className="text-text-muted text-sm mt-1">成为第一个发帖的人吧</p>
                <Link href="/forum/new" className="btn btn-primary mt-4 inline-block">发布新帖</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {threads.map((thread) => {
                  const timeAgo = formatTimeAgo(thread.last_replied_at || thread.created_at);
                  return (
                    <Link
                      key={thread.id}
                      href={`/forum/${board}/${thread.slug}`}
                      className="card p-4 block cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {thread.is_pinned && (
                              <span className="badge badge-red text-xs">置顶</span>
                            )}
                            <h3 className="font-semibold text-sm line-clamp-1">
                              {thread.title_zh || thread.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-text-muted">
                            <span>{thread.author_name || '匿名用户'}</span>
                            <span>{timeAgo}</span>
                            <span className="flex items-center gap-1">
                              💬 {thread.reply_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              👀 {thread.view_count || 0}
                            </span>
                            {thread.ai_summary_zh && (
                              <span className="text-primary" title="AI 速读可用">🤖</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6 mt-8 lg:mt-0">
            {/* Board Rules */}
            <div className="bg-bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-3">📜 版规</h3>
              <ul className="text-xs text-text-secondary space-y-2">
                <li>1. 请遵守社区规范，文明发言</li>
                <li>2. 禁止发布广告和垃圾信息</li>
                <li>3. 尊重他人隐私，不要人身攻击</li>
                <li>4. 请使用正确的版块发帖</li>
              </ul>
            </div>

            {/* Related Businesses */}
            <div className="bg-bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-3">🏪 相关商家</h3>
              <p className="text-xs text-text-muted">商家推荐将在这里显示</p>
            </div>
          </aside>
        </div>
      </div>

      {/* Floating New Post Button */}
      <Link
        href="/forum/new"
        className="fab fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow text-2xl z-50"
        style={{ backgroundColor: 'var(--color-accent-orange, #f97316)' }}
      >
        ✏️
      </Link>
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
