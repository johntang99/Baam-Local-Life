import { Link } from '@/lib/i18n/routing';
import { SectionHeader } from './section-header';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface ForumSectionProps {
  threads: AnyRow[];
  boards: Record<string, AnyRow>;
}

const tagColors = [
  { bg: '#FDEBE7', color: 'var(--ed-accent)' },
  { bg: '#FBF0D4', color: '#8B6914' },
  { bg: 'var(--ed-tag-green-bg)', color: 'var(--ed-tag-green-text)' },
  { bg: 'var(--ed-tag-purple-bg)', color: 'var(--ed-tag-purple-text)' },
  { bg: '#E0E8F0', color: '#2B5080' },
];

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(ms / 3600000);
  if (hrs < 24) return `${hrs} 小时前`;
  const days = Math.floor(ms / 86400000);
  if (days < 7) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export function ForumSection({ threads, boards }: ForumSectionProps) {
  if (threads.length === 0) return null;

  return (
    <section
      style={{
        padding: '88px 0',
        background: 'var(--ed-surface)',
        borderTop: '1px solid var(--ed-line)',
      }}
    >
      <div style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '0 32px' }}>
        <SectionHeader
          number="07"
          english="Forum"
          title="论坛热帖"
          titleEm="what people are saying"
          right={
            <Link href="/forum" className="inline-flex items-center gap-1.5 transition-all" style={{ fontSize: 14, color: 'var(--ed-ink-soft)' }}>
              进入论坛
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </Link>
          }
        />

        <div style={{ background: 'var(--ed-surface-elev)', border: '1px solid var(--ed-line)', borderRadius: 'var(--ed-radius-lg)', overflow: 'hidden' }}>
          {threads.map((thread, i) => {
            const board = boards[thread.board_id];
            const boardSlug = board?.slug || '';
            const boardName = board?.name_zh || '';
            const tagColor = tagColors[i % tagColors.length];
            const isHot = (thread.reply_count || 0) >= 10;
            const authorName = thread.profiles?.display_name || '匿名';

            return (
              <Link
                key={thread.id}
                href={`/forum/${boardSlug}/${thread.slug}`}
                className="grid items-center transition-all"
                style={{
                  gridTemplateColumns: '40px 72px 1fr 60px 24px',
                  gap: 16, padding: '18px 24px',
                  borderBottom: i < threads.length - 1 ? '1px dashed var(--ed-line)' : 'none',
                }}
              >
                {/* Index */}
                <span style={{
                  fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic',
                  fontSize: 20, fontWeight: 500, lineHeight: 1,
                  color: isHot ? 'var(--ed-accent)' : 'var(--ed-ink-muted)',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Board tag */}
                <span style={{
                  padding: '4px 10px', borderRadius: 'var(--ed-radius-pill)',
                  fontSize: 11.5, fontWeight: 500, textAlign: 'center',
                  background: tagColor.bg, color: tagColor.color,
                  whiteSpace: 'nowrap',
                }}>
                  {boardName || '论坛'}
                </span>

                {/* Title + meta */}
                <div className="min-w-0">
                  <div style={{
                    fontFamily: 'var(--ed-font-serif)', fontSize: 14.5, fontWeight: 500,
                    lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {thread.title}
                  </div>
                  <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'var(--ed-ink-muted)', marginTop: 3 }}>
                    <span style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic' }}>by {authorName}</span>
                    <span>·</span>
                    <span>{timeAgo(thread.last_replied_at || thread.created_at)}</span>
                  </div>
                </div>

                {/* Reply count */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontSize: 18, fontWeight: 500, color: 'var(--ed-ink)', lineHeight: 1 }}>
                    {thread.reply_count || 0}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ed-ink-muted)', fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic' }}>
                    replies
                  </div>
                </div>

                {/* Arrow */}
                <svg className="flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ed-ink-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
