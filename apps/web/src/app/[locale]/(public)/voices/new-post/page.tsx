import { getCurrentUser } from '@/lib/auth';
import { Link } from '@/lib/i18n/routing';
import { VoicePostForm } from './form';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '发布内容 · Baam 达人',
    description: '发布你的本地见解、推荐、经验分享',
  };
}

export default async function VoicesNewPostPage() {
  const user = await getCurrentUser();

  return (
    <main>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <nav className="text-sm text-text-muted mb-4">
          <Link href="/" className="hover:text-primary">首页</Link>
          <span className="mx-2">&rsaquo;</span>
          <Link href="/voices" className="hover:text-primary">达人</Link>
          <span className="mx-2">&rsaquo;</span>
          <span className="text-text-secondary">发布内容</span>
        </nav>

        <h1 className="text-2xl font-bold mb-6">发布内容</h1>

        <VoicePostForm isLoggedIn={!!user} />
      </div>
    </main>
  );
}
