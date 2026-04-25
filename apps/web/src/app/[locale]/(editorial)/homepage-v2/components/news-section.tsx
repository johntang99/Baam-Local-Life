import { Link } from '@/lib/i18n/routing';
import { SectionHeader } from './section-header';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface NewsSectionProps {
  news: AnyRow[];
}

const tagStyles: Record<string, { bg: string; color: string; label: string }> = {
  news_alert: { bg: 'var(--ed-accent)', color: 'var(--ed-paper)', label: '快讯' },
  news_brief: { bg: 'var(--ed-ink)', color: 'var(--ed-paper)', label: '政策解读' },
  news_explainer: { bg: 'var(--ed-tag-purple-bg)', color: 'var(--ed-tag-purple-text)', label: '深度' },
  news_roundup: { bg: 'var(--ed-amber)', color: 'var(--ed-ink)', label: '活动' },
  news_community: { bg: 'var(--ed-tag-green-bg)', color: 'var(--ed-tag-green-text)', label: '社区' },
};

// Fallback images when cover_image_url is null — topic-relevant Unsplash photos
// Uses a stable sig param per slug so the same article always gets the same image
function getFallbackImage(slug: string, index: number): string {
  const topics = [
    'new+york+city+street',
    'flushing+queens+food',
    'new+york+skyline',
    'chinatown+new+york',
    'brooklyn+bridge',
    'central+park+spring',
    'subway+train',
    'new+york+restaurant',
  ];
  const topic = topics[index % topics.length];
  return `https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&h=400&fit=crop&q=80&sig=${slug}`;
}

// Keyword-based image selection — picks a relevant Unsplash photo based on title
const topicImages: Record<string, string> = {
  '美甲': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop&q=80',
  '英语': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop&q=80',
  '开锁': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop&q=80',
  '蟑螂': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop&q=80',
  '装修': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop&q=80',
  '报税': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop&q=80',
  'SPA': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop&q=80',
  '按摩': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop&q=80',
  '牙': 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&h=400&fit=crop&q=80',
  '保险': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop&q=80',
  '移民': 'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=600&h=400&fit=crop&q=80',
  '租房': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop&q=80',
  '餐': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop&q=80',
  '美食': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop&q=80',
  '驾照': 'https://images.unsplash.com/photo-1449965408869-ebd3fee7710d?w=600&h=400&fit=crop&q=80',
  '活动': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop&q=80',
  '地铁': 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&h=400&fit=crop&q=80',
};

function getArticleImage(article: AnyRow, index: number): string {
  if (article.cover_image_url) return article.cover_image_url;
  const title = article.title_zh || article.title || '';
  for (const [keyword, url] of Object.entries(topicImages)) {
    if (title.includes(keyword)) return url;
  }
  return getFallbackImage(article.slug || '', index);
}

function formatNewsDate(dateStr: string | null): string {
  if (!dateStr) {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + ' · ' + now.getFullYear();
  }
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + ' · ' + d.getFullYear();
}

export function NewsSection({ news }: NewsSectionProps) {
  if (news.length === 0) return null;

  const feature = news[0];
  const smalls = news.slice(1, 5);

  return (
    <section
      className="py-12 sm:py-[88px]"
      style={{
        background: 'var(--ed-surface)',
        borderTop: '1px solid var(--ed-line)',
        borderBottom: '1px solid var(--ed-line)',
      }}
    >
      <div className="sm:!px-8" style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '0 16px' }}>
        <SectionHeader
          number="02"
          english="Newsroom"
          title="今日要闻"
          titleEm="today in NYC"
          right={
            <Link href="/news" className="inline-flex items-center gap-1.5 transition-all" style={{ fontSize: 14, color: 'var(--ed-ink-soft)' }}>
              所有新闻
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </Link>
          }
        />

        {/* Grid: 1.4fr 1fr 1fr, feature spans 2 rows */}
        <div
          className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr] sm:[grid-auto-rows:1fr]"
        >
          {/* Feature card */}
          <Link
            href={`/news/${feature.slug}`}
            className="block transition-all hover:-translate-y-0.5 sm:row-span-2"
            style={{
              background: 'var(--ed-surface-elev)',
              border: '1px solid var(--ed-line)',
              borderRadius: 'var(--ed-radius-lg)',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Image */}
            <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <img src={getArticleImage(feature, 0)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <span
                className="absolute"
                style={{
                  bottom: 12, left: 12,
                  padding: '4px 12px', borderRadius: 'var(--ed-radius-pill)',
                  fontSize: 11.5, fontWeight: 500, zIndex: 2,
                  ...(tagStyles[feature.content_vertical] || tagStyles.news_brief),
                  background: (tagStyles[feature.content_vertical] || tagStyles.news_brief).bg,
                  color: (tagStyles[feature.content_vertical] || tagStyles.news_brief).color,
                }}
              >
                {(tagStyles[feature.content_vertical] || tagStyles.news_brief).label}
              </span>
            </div>
            {/* Body */}
            <div style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 12, color: 'var(--ed-ink-muted)', fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', marginBottom: 10 }}>
                {formatNewsDate(feature.published_at)}
              </div>
              <h3 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 20, fontWeight: 600, lineHeight: 1.35, marginBottom: 10 }}>
                {feature.title_zh || feature.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--ed-ink-soft)', lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {feature.ai_summary_zh || feature.summary_zh || ''}
              </p>
            </div>
          </Link>

          {/* Small cards */}
          {smalls.map((article, i) => {
            const tag = tagStyles[article.content_vertical] || tagStyles.news_community;
            return (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="block transition-all hover:-translate-y-0.5"
                style={{
                  background: 'var(--ed-surface-elev)',
                  border: '1px solid var(--ed-line)',
                  borderRadius: 'var(--ed-radius-lg)',
                  overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                <div className="relative" style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                  <img src={getArticleImage(article, i + 1)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  <span
                    className="absolute"
                    style={{ bottom: 8, left: 10, padding: '3px 10px', borderRadius: 'var(--ed-radius-pill)', fontSize: 11, fontWeight: 500, zIndex: 2, background: tag.bg, color: tag.color }}
                  >
                    {tag.label}
                  </span>
                </div>
                <div style={{ padding: '14px 16px', flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--ed-ink-muted)', fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', marginBottom: 6 }}>
                    {formatNewsDate(article.published_at)}
                  </div>
                  <h3 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 14.5, fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {article.title_zh || article.title}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
