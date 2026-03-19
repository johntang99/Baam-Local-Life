import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/routing';
import type { Metadata } from 'next';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '发布新帖 · 社区论坛 · Baam',
    description: '在 Baam 社区论坛发布新帖子',
  };
}

export default async function ForumNewPostPage() {
  const supabase = await createClient();

  // Fetch all forum boards for the selector
  const { data: rawBoards } = await supabase
    .from('categories')
    .select('id, slug, name_zh, name, emoji')
    .eq('type', 'forum')
    .order('sort_order', { ascending: true });

  const boards = (rawBoards || []) as AnyRow[];

  // TODO: Add auth check — redirect unauthenticated users to login

  return (
    <main>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-text-muted mb-4">
          <Link href="/" className="hover:text-primary">首页</Link>
          <span className="mx-2">&rsaquo;</span>
          <Link href="/forum" className="hover:text-primary">论坛</Link>
          <span className="mx-2">&rsaquo;</span>
          <span className="text-text-secondary">发布新帖</span>
        </nav>

        {/* Page Header */}
        <h1 className="text-2xl font-bold mb-6">发布新帖</h1>

        {/* New Post Form */}
        <div className="card p-6 space-y-5">
          {/* Board Selector */}
          <div>
            <label htmlFor="board-select" className="block text-sm font-medium mb-1">
              选择版块 <span className="text-accent-red">*</span>
            </label>
            <select
              id="board-select"
              className="w-full h-10 px-3 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-bg-card"
            >
              <option value="">请选择版块</option>
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.emoji || '📋'} {b.name_zh || b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title Input */}
          <div>
            <label htmlFor="post-title" className="block text-sm font-medium mb-1">
              标题 <span className="text-accent-red">*</span>
            </label>
            <input
              id="post-title"
              type="text"
              placeholder="请输入帖子标题"
              maxLength={120}
              className="w-full h-10 px-3 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          {/* Rich Text Area */}
          <div>
            <label htmlFor="post-body" className="block text-sm font-medium mb-1">
              内容 <span className="text-accent-red">*</span>
            </label>
            <textarea
              id="post-body"
              placeholder="写下你想分享的内容...&#10;&#10;支持 Markdown 格式：**加粗** *斜体* [链接](url) - 列表"
              className="w-full h-48 px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-y"
            />
            <p className="text-xs text-text-muted mt-1">支持 Markdown 格式</p>
          </div>

          {/* Tag Input */}
          <div>
            <label htmlFor="post-tags" className="block text-sm font-medium mb-1">
              标签
            </label>
            <input
              id="post-tags"
              type="text"
              placeholder="输入标签，用逗号分隔（如：租房, 法拉盛, 求推荐）"
              className="w-full h-10 px-3 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
            <p className="text-xs text-text-muted mt-1">最多 5 个标签</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button className="btn btn-primary px-6">发布帖子</button>
            <button className="btn px-6 border border-border text-text-secondary hover:bg-border-light">
              保存草稿
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
