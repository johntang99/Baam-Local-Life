import { Link } from '@/lib/i18n/routing';
import { AiChatbox } from './ai-chatbox';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface HeroSectionProps {
  featuredStory?: AnyRow | null;
}

// Badge styles by story type
const badgeStyles: Record<string, { bg: string; color: string; border: string; label: string }> = {
  news_alert: { bg: '#1F1B16', color: '#FBF6EC', border: 'transparent', label: '快报' },
  news_community: { bg: 'var(--ed-tag-green-bg)', color: 'var(--ed-tag-green-text)', border: 'rgba(43, 94, 43, 0.15)', label: '社区' },
  opening: { bg: '#FDEBE7', color: '#C73E1D', border: 'rgba(199, 62, 29, 0.15)', label: '🏮 新店开业' },
  deal: { bg: '#FBF0D4', color: '#8B6914', border: 'rgba(212, 160, 23, 0.2)', label: '💰 特惠活动' },
  event: { bg: 'var(--ed-tag-green-bg)', color: 'var(--ed-tag-green-text)', border: 'rgba(43, 94, 43, 0.15)', label: '🎪 活动推荐' },
};

function getDateLine(): string {
  const now = new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${weekdays[now.getDay()]} · ${now.getMonth() + 1} 月 ${now.getDate()} 日 · 今日精选`;
}

export function HeroSection({ featuredStory }: HeroSectionProps) {
  const story = featuredStory;
  const badge = badgeStyles[story?.content_vertical || 'opening'] || badgeStyles.opening;
  const title = story?.title_zh || story?.title || '法拉盛「麦香坊」今日开业';
  const subtitle = story?.ai_summary_zh || story?.summary_zh || '';
  const isGuide = story?.content_vertical?.startsWith('guide_');
  const storyHref = story?.slug ? (isGuide ? `/guides/${story.slug}` : `/news/${story.slug}`) : '/news';

  return (
    <section
      className="relative overflow-hidden"
      style={{ padding: '64px 0 72px' }}
    >
      {/* Subtle gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 40% 60% at 85% 20%, rgba(212, 160, 23, 0.10), transparent 60%), radial-gradient(ellipse 40% 50% at 15% 90%, rgba(199, 62, 29, 0.08), transparent 60%)',
        }}
      />

      <div
        className="relative grid items-center grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-10 lg:gap-16"
        style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '0 20px' }}
      >
        {/* ═══ LEFT: Featured Story ═══ */}
        <div>
          {/* Date kicker */}
          <div
            className="inline-flex items-center gap-2.5 mb-7"
            style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontSize: 14, color: 'var(--ed-ink-muted)', letterSpacing: '0.02em' }}
          >
            <span style={{ width: 36, height: 1, background: 'var(--ed-ink-muted)', display: 'inline-block' }} />
            <span>{getDateLine()}</span>
          </div>

          {/* Story badge */}
          <div
            className="inline-flex items-center gap-2 mb-5"
            style={{
              padding: '7px 14px 7px 12px', borderRadius: 'var(--ed-radius-pill)',
              fontSize: 12.5, fontWeight: 500, letterSpacing: '0.02em',
              background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
            }}
          >
            <span style={{ width: 6, height: 6, background: 'currentColor', borderRadius: '50%', animation: 'softpulse 2.5s ease-in-out infinite' }} />
            <span>{badge.label}</span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--ed-font-serif)', fontSize: 'clamp(30px, 3.8vw, 48px)',
            fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 22,
          }}>
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p style={{ fontSize: 16.5, color: 'var(--ed-ink-soft)', maxWidth: 460, lineHeight: 1.7, marginBottom: 32 }}>
              {subtitle}
            </p>
          )}

          {/* Meta info */}
          {story?.source_name && (
            <div className="flex items-center gap-2.5 flex-wrap mb-8" style={{ fontSize: 13, color: 'var(--ed-ink-soft)' }}>
              <span className="inline-flex items-center gap-1.5">📍 {story.source_name}</span>
            </div>
          )}

          {/* CTAs */}
          <div className="flex items-center gap-3.5 flex-wrap">
            <Link
              href={storyHref}
              className="inline-flex items-center gap-2 transition-all hover:-translate-y-px"
              style={{ padding: '14px 26px', background: 'var(--ed-ink)', color: 'var(--ed-paper)', borderRadius: 'var(--ed-radius-pill)', fontSize: 15, fontWeight: 500 }}
            >
              查看详情
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <Link
              href="/helper-2"
              className="inline-flex items-center gap-1.5 transition-colors"
              style={{ padding: '14px 22px', color: 'var(--ed-ink-soft)', fontSize: 15 }}
            >
              问 AI 小帮手
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </Link>
          </div>
        </div>

        {/* ═══ RIGHT: AI Chatbox Card ═══ */}
        <AiChatbox />
      </div>
    </section>
  );
}
