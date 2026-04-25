'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const trendingQuestions = [
  '这两天天气凉了，我们要注意什么？',
  '最新移民政策有什么变化？工卡到期怎么办？',
  '法拉盛哪家火锅最值得去？',
  '牙齿有问题，法拉盛哪家中文牙医好？',
];

export function AiChatbox() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const handleSend = useCallback(() => {
    const q = input.trim();
    if (!q) return;
    router.push(`/zh/helper-2?q=${encodeURIComponent(q)}`);
  }, [input, router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleQuestionClick = useCallback((q: string) => {
    router.push(`/zh/helper-2?q=${encodeURIComponent(q)}`);
  }, [router]);

  const hasInput = input.trim().length > 0;

  return (
    <div
      className="relative"
      style={{
        background: 'var(--ed-surface-elev)',
        border: '1px solid var(--ed-line)',
        borderRadius: 24,
        padding: 24,
        boxShadow: '0 20px 60px -30px rgba(31, 27, 22, 0.25), 0 4px 12px -4px rgba(31, 27, 22, 0.06)',
      }}
    >
      {/* Gradient border glow */}
      <div
        className="absolute -inset-px pointer-events-none"
        style={{
          borderRadius: 25,
          background: 'linear-gradient(135deg, rgba(199, 62, 29, 0.3), transparent 40%, rgba(212, 160, 23, 0.3))',
          zIndex: -1,
          opacity: 0.6,
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2.5 pb-4 mb-1.5"
        style={{ borderBottom: '1px solid var(--ed-line)', fontSize: 13, color: 'var(--ed-ink-soft)' }}
      >
        <span style={{ width: 8, height: 8, background: '#25A06E', borderRadius: '50%', boxShadow: '0 0 0 3px rgba(37, 160, 110, 0.15)', animation: 'softpulse 2.5s ease-in-out infinite' }} />
        <span style={{ fontWeight: 500, color: 'var(--ed-ink)' }}>
          AI 小帮手
          <span style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontWeight: 400, color: 'var(--ed-accent)', marginLeft: 6 }}>
            今日热问
          </span>
        </span>
        <span
          className="ml-auto flex items-center gap-1.5"
          style={{ fontSize: 11.5, color: 'var(--ed-ink-muted)', fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic' }}
        >
          <span style={{ width: 4, height: 4, background: 'var(--ed-amber)', borderRadius: '50%' }} />
          每日 08:00 更新
        </span>
      </div>

      {/* Trending Questions */}
      <div className="flex flex-col">
        {trendingQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleQuestionClick(q)}
            className="grid items-center text-left transition-all"
            style={{
              gridTemplateColumns: '32px 1fr auto',
              gap: 14,
              padding: '14px 4px',
              borderBottom: i < trendingQuestions.length - 1 ? '1px dashed var(--ed-line)' : 'none',
              cursor: 'pointer',
            }}
          >
            {/* Rank number */}
            <span
              style={{
                fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic',
                fontSize: 22, fontWeight: 500, lineHeight: 1,
                color: i < 3 ? 'var(--ed-accent)' : 'var(--ed-ink-muted)',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* Question text */}
            <span style={{
              fontFamily: 'var(--ed-font-serif)', fontSize: 14.5, fontWeight: 500,
              color: 'var(--ed-ink)', lineHeight: 1.45,
            }}>
              {q}
            </span>

            {/* Arrow */}
            <svg
              className="transition-transform flex-shrink-0"
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="var(--ed-ink-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <div className="mt-3.5">
        <div className="relative">
          {/* Glow effect */}
          <div
            className="absolute -inset-1.5 pointer-events-none"
            style={{
              borderRadius: 22, filter: 'blur(10px)', zIndex: 0, opacity: 0.7,
              background: 'radial-gradient(ellipse 60% 80% at 30% 50%, rgba(199, 62, 29, 0.18), transparent 70%), radial-gradient(ellipse 60% 80% at 70% 50%, rgba(212, 160, 23, 0.18), transparent 70%)',
              animation: 'chatGlow 5s ease-in-out infinite',
            }}
          />
          <div
            className="relative z-10"
            style={{
              background: 'var(--ed-surface-elev)',
              border: '1.5px solid rgba(199, 62, 29, 0.22)',
              borderRadius: 18,
              padding: '14px 16px 10px',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={'和小帮手聊聊本地生活、推荐、办事...\n比如：周末哪里带娃去玩？'}
              rows={2}
              style={{
                width: '100%', border: 'none', outline: 'none', background: 'transparent',
                fontFamily: 'inherit', fontSize: 14.5, color: 'var(--ed-ink)',
                lineHeight: 1.65, resize: 'none', minHeight: 52, maxHeight: 160, marginBottom: 8, display: 'block',
              }}
            />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center justify-center transition-all"
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: '1.5px solid rgba(199, 62, 29, 0.35)', color: 'var(--ed-accent)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center justify-center transition-all"
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: '1.5px solid var(--ed-line-strong)', color: 'var(--ed-ink-muted)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" /></svg>
                </button>
                <button
                  onClick={handleSend}
                  disabled={!hasInput}
                  className="flex items-center justify-center transition-all"
                  style={{
                    width: 34, height: 34, borderRadius: '50%', border: 'none',
                    background: hasInput ? 'var(--ed-ink)' : 'var(--ed-paper-warm)',
                    color: hasInput ? 'var(--ed-paper)' : 'var(--ed-ink-muted)',
                    cursor: hasInput ? 'pointer' : 'default',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="flex items-center justify-center gap-2 mt-2.5"
          style={{ fontSize: 11.5, color: 'var(--ed-ink-muted)', fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic' }}
        >
          <kbd style={{ padding: '1px 6px', border: '1px solid var(--ed-line-strong)', borderRadius: 4, fontSize: 10.5, fontStyle: 'normal', color: 'var(--ed-ink-soft)', background: 'var(--ed-paper)' }}>↵</kbd>
          发送 ·
          <kbd style={{ padding: '1px 6px', border: '1px solid var(--ed-line-strong)', borderRadius: 4, fontSize: 10.5, fontStyle: 'normal', color: 'var(--ed-ink-soft)', background: 'var(--ed-paper)' }}>⇧</kbd>+
          <kbd style={{ padding: '1px 6px', border: '1px solid var(--ed-line-strong)', borderRadius: 4, fontSize: 10.5, fontStyle: 'normal', color: 'var(--ed-ink-soft)', background: 'var(--ed-paper)' }}>↵</kbd>
          换行 · 中英文均可
        </div>
      </div>
    </div>
  );
}
