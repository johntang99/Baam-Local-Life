import type { Metadata } from 'next';
import { Helper2Chat } from './chat';

export const metadata: Metadata = {
  title: '小帮手 · Baam',
  description: '中文聊天式本地智能助手。结合 Baam 站内内容与网页补充，回答本地生活、商家推荐、办事和最新信息问题。',
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function Helper2Page({ searchParams }: Props) {
  const sp = await searchParams;
  const initialQuery = sp.q?.trim() || '';

  return (
    <main className="flex flex-col" style={{ height: 'calc(100dvh - 60px)' }}>
      {/* Chat — fills remaining height */}
      <div className="flex-1 min-h-0">
        <Helper2Chat initialQuery={initialQuery} />
      </div>
    </main>
  );
}
