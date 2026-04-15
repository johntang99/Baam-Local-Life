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
    <main>
      {/* Header — full width, same as English */}
      <div className="text-center pt-8 pb-4 px-4">
        <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary r-xl flex items-center justify-center text-2xl mx-auto mb-3">
          🧭
        </div>
        <h1 className="text-2xl sm:text-3xl fw-bold mb-1">小帮手</h1>
        <p className="text-text-secondary text-sm">
          你的本地生活 AI 助手 — 找商家、查信息、问办事，什么都能聊
        </p>
      </div>

      {/* Chat — full width container, chat component handles its own widths */}
      <div className="px-4 pb-8">
        <Helper2Chat initialQuery={initialQuery} />
      </div>
    </main>
  );
}
