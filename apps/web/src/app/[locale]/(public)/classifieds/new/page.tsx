import { getCurrentUser } from '@/lib/auth';
import { Link } from '@/lib/i18n/routing';
import { PageContainer } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import { ClassifiedNewForm } from './form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '发布信息 · 分类信息 · Baam',
};

export default async function NewClassifiedPage() {
  const user = await getCurrentUser().catch(() => null);

  return (
    <main className="bg-bg-page min-h-screen">
      <PageContainer className="max-w-3xl py-6">
        <nav className="text-sm text-text-muted mb-4">
          <Link href="/classifieds" className="hover:text-primary">分类信息</Link>
          <span className="mx-2">›</span>
          <span className="text-text-secondary">发布信息</span>
        </nav>

        <h1 className="text-2xl fw-bold mb-6">发布信息</h1>

        {user ? (
          <ClassifiedNewForm />
        ) : (
          <Card className="p-8 text-center">
            <p className="text-4xl mb-4">🔒</p>
            <p className="text-text-secondary mb-2">请先登录后再发布</p>
            <p className="text-sm text-text-muted">点击右上角「登录/注册」按钮</p>
          </Card>
        )}
      </PageContainer>
    </main>
  );
}
