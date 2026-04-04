'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { askHelper2 } from './actions';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: {
    type: string;
    title: string;
    url: string;
    snippet?: string;
    isExternal?: boolean;
  }[];
  usedWebFallback?: boolean;
}

const SUGGESTED_QUESTIONS = [
  '帮我推荐法拉盛适合家庭聚餐的火锅店',
  '最近纽约 DMV 有什么变化？',
  '新移民来纽约第一个月先做什么？',
  '最近法拉盛有没有适合孩子的周末活动？',
  '如果站内没有，你也可以帮我查网页最新信息吗？',
];

interface Helper2ChatProps {
  initialQuery?: string;
}

export function Helper2Chat({ initialQuery }: Helper2ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [autoAsked, setAutoAsked] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuery && !autoAsked) {
      setAutoAsked(true);
      void handleAsk(initialQuery);
    }
  }, [initialQuery, autoAsked]);

  async function handleAsk(rawQuery: string) {
    const query = rawQuery.trim();
    if (!query || loading) return;

    const nextHistory = messages.map((message) => ({
      role: message.role,
      content: message.content,
    })) as { role: 'user' | 'assistant'; content: string }[];

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    const result = await askHelper2(query, nextHistory);

    if (result.error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.error || '小帮手-2 暂时无法回答',
        },
      ]);
    } else if (result.data) {
      const data = result.data;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
          usedWebFallback: data.usedWebFallback,
        },
      ]);
    }

    setLoading(false);
    inputRef.current?.focus();
  }

  return (
    <div>
      <div className="space-y-4 mb-6 min-h-[220px]">
        {messages.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-text-muted text-sm mb-6">
              这是一个新的中文聊天式本地助手。它会优先结合 Baam 站内内容回答，必要时再补充网页信息。
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void handleAsk(question)}
                  disabled={loading}
                  className="text-xs bg-border-light text-text-secondary px-3 py-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] ${
                message.role === 'user'
                  ? 'bg-primary text-white rounded-2xl rounded-br-md px-4 py-3'
                  : 'bg-bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">🧭</span>
                  <span className="text-xs font-medium text-primary">小帮手-2</span>
                  {message.usedWebFallback && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">网页补充</span>
                  )}
                </div>
              )}

              <div className="text-sm leading-relaxed prose prose-sm max-w-none [&_h2]:text-base [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-1 [&_p]:mb-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              </div>

              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-text-muted mb-2">相关来源</p>
                  <div className="space-y-2">
                    {message.sources.slice(0, 8).map((source, sourceIndex) => {
                      const href = source.isExternal ? source.url : `/zh${source.url}`;
                      return (
                        <a
                          key={`${source.title}-${sourceIndex}`}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg border border-border px-3 py-2 hover:bg-bg-page transition"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-border-light text-text-secondary">{source.type}</span>
                            <span className="text-xs font-medium text-text-primary line-clamp-1">{source.title}</span>
                          </div>
                          {source.snippet && (
                            <p className="text-xs text-text-secondary line-clamp-2">{source.snippet}</p>
                          )}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">🧭</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-text-muted">小帮手-2 正在整理答案...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleAsk(input);
        }}
        className="sticky bottom-4"
      >
        <div className="flex gap-2 bg-bg-card border border-border rounded-xl p-2 shadow-lg">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={loading}
            placeholder="和小帮手-2 聊聊本地生活、推荐、办事、最新信息..."
            className="flex-1 h-10 px-3 text-sm outline-none bg-transparent"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-10 px-5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors flex-shrink-0"
          >
            发送
          </button>
        </div>
      </form>
    </div>
  );
}
