import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { Link } from '@/lib/i18n/routing';
import { ForumNewPostForm } from './form';
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
  const user = await getCurrentUser();

  // Fetch all forum boards for the selector
  const { data: rawBoards } = await supabase
    .from('categories')
    .select('id, slug, name_zh, name, emoji')
    .eq('type', 'forum')
    .order('sort_order', { ascending: true });

  const boards = (rawBoards || []) as AnyRow[];

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

        <h1 className="text-2xl font-bold mb-6">发布新帖</h1>

        <ForumNewPostForm boards={boards} isLoggedIn={!!user} />
      </div>
    </main>
  );
}
