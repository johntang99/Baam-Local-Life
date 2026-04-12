import type { Metadata } from 'next';
import { HelperChat } from './chat';
import { PageContainer } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: '小邻 AI 助手 · Baam',
  description: '你的纽约华人社区 AI 助手。找商家、查攻略、问办事、看活动 — 一句话搞定。',
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function HelperPage({ searchParams }: Props) {
  const sp = await searchParams;
  const initialQuery = sp.q?.trim() || '';

  return (
    <main>
      <PageContainer className="max-w-4xl py-8">
        <Card className="text-center mb-8 p-6 sm:p-8 bg-gradient-to-br from-primary/5 to-blue-50 border-primary/20">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            🤖
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">小邻</h1>
          <p className="text-text-secondary text-sm max-w-2xl mx-auto">
            你的纽约华人社区 AI 助手。找商家、查攻略、问办事、看活动，像问一个在纽约生活多年的老朋友。
          </p>
        </Card>

        <HelperChat initialQuery={initialQuery} />
      </PageContainer>
    </main>
  );
}
