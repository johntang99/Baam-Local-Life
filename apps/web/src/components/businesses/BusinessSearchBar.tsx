'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BusinessSearchBarProps {
  businessCount?: number;
}

export function BusinessSearchBar({ businessCount }: BusinessSearchBarProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('biz-search-q');
    if (saved) setQuery(saved);
  }, []);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (value: string) => {
    setQuery(value);
    sessionStorage.setItem('biz-search-q', value);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/zh/helper-2?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{
        background: 'var(--ed-surface-elev)',
        border: '2px solid var(--ed-accent)',
        borderRadius: 'var(--ed-radius-xl)',
        boxShadow: '0 8px 40px rgba(199,62,29,0.12), 0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'visible',
        position: 'relative',
      }}>
        {/* Accent bar at top */}
        <div style={{ position: 'absolute', top: -1, left: 24, right: 24, height: 3, background: 'linear-gradient(90deg, transparent, var(--ed-amber), var(--ed-accent), var(--ed-amber), transparent)', borderRadius: '0 0 4px 4px', opacity: 0.6 }} />

        {/* Row 1: Text input */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-1.5">
          <div style={{ width: 28, height: 28, borderRadius: 'var(--ed-radius-md)', background: 'var(--ed-paper-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
            💬
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="和小帮手聊聊本地生活、推荐、办事..."
            style={{ flex: 1, fontSize: 14, outline: 'none', background: 'transparent', color: 'var(--ed-ink)', border: 'none' }}
          />
        </div>

        {/* Row 2: Controls */}
        <div className="flex items-center justify-between px-2.5 pb-2.5 pt-0.5">
          <div className="flex items-center gap-1.5">
            <div
              style={{
                width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--ed-radius-md)',
                border: '1.5px solid var(--ed-line-strong)',
                color: 'var(--ed-ink-muted)',
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="submit"
              disabled={!query.trim()}
              className="transition-all disabled:opacity-40"
              style={{
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--ed-radius-md)',
                background: query.trim() ? 'var(--ed-ink)' : 'var(--ed-paper-warm)',
                color: query.trim() ? 'var(--ed-paper)' : 'var(--ed-ink-muted)',
                boxShadow: query.trim() ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}
              title="搜索"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
