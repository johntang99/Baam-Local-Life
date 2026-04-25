// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface TickerBarProps {
  items: AnyRow[];
}

function formatTickerTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getDateLabel(): string {
  const now = new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${weekdays[now.getDay()]} · ${now.getMonth() + 1} 月 ${now.getDate()} 日`;
}

export function TickerBar({ items }: TickerBarProps) {
  if (items.length === 0) return null;

  const tickerItems = items.map((a) => ({
    time: formatTickerTime(a.published_at),
    text: a.title_zh || a.title || '',
  }));

  // Duplicate for seamless loop
  const allItems = [...tickerItems, ...tickerItems];

  return (
    <div style={{ background: 'var(--ed-ink)', color: 'var(--ed-paper)', overflow: 'hidden' }}>
      <div
        className="flex items-center gap-4"
        style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '12px 32px', fontSize: 13 }}
      >
        {/* Live badge */}
        <span
          className="flex-shrink-0"
          style={{
            padding: '3px 10px', background: 'var(--ed-accent)', borderRadius: 'var(--ed-radius-pill)',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
            fontFamily: 'var(--ed-font-serif-italic)',
          }}
        >
          Live
        </span>

        {/* Scrolling items */}
        <div
          className="flex-1 overflow-hidden relative"
          style={{ maskImage: 'linear-gradient(90deg, transparent, black 5%, black 95%, transparent)' }}
        >
          <div
            className="flex gap-12 whitespace-nowrap"
            style={{ width: 'max-content', animation: 'ticker 40s linear infinite' }}
          >
            {allItems.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-2" style={{ color: 'rgba(251, 246, 236, 0.85)' }}>
                <span style={{ color: 'var(--ed-amber-soft)', fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic' }}>
                  {item.time}
                </span>
                {item.text}
              </span>
            ))}
          </div>
        </div>

        {/* Date */}
        <span
          className="flex-shrink-0"
          style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', color: 'var(--ed-ink-muted)', fontSize: 12.5 }}
        >
          {getDateLabel()}
        </span>
      </div>

      {/* Ticker animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes softpulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes chatGlow {
          0%, 100% { opacity: 0.65; }
          50% { opacity: 1; }
        }
      `}} />
    </div>
  );
}
