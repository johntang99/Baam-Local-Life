import { AskChat } from './chat';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '小邻 AI 助手 · Baam',
  description: '问我任何本地生活问题 — 找医生、租房、报税、美食、活动，AI 帮你快速找到答案',
};

export default function AskPage() {
  return (
    <main>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-orange-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            🤖
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">小邻 AI 助手</h1>
          <p className="text-text-secondary text-sm">
            问我任何纽约本地生活问题 — 找医生、租房、报税、美食、活动
          </p>
        </div>

        {/* Chat Interface */}
        <AskChat />

        {/* Suggested Questions */}
        <div className="mt-8 text-center">
          <p className="text-xs text-text-muted mb-3">试试问这些问题：</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              '法拉盛有哪些中文家庭医生？',
              '新移民第一个月要做什么？',
              '报税季有什么需要注意的？',
              '周末带孩子去哪玩？',
              '法拉盛有什么好吃的川菜？',
              '怎么申请驾照？',
            ].map((q) => (
              <button
                key={q}
                className="text-xs bg-border-light text-text-secondary px-3 py-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition cursor-pointer"
                data-question={q}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
