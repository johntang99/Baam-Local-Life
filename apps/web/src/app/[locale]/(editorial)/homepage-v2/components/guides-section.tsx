import { Link } from '@/lib/i18n/routing';
import { SectionHeader } from './section-header';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface GuidesSectionProps {
  guides: AnyRow[];
}

const labelColors = [
  { accent: '#8B6914' },
  { accent: 'var(--ed-tag-green-text)' },
  { accent: 'var(--ed-tag-purple-text)' },
  { accent: '#2B5080' },
];

// Keyword-based fallback images for guides
const guideTopicImages: Record<string, string> = {
  '驾照': 'https://images.unsplash.com/photo-1449965408869-ebd3fee7710d?w=600&h=340&fit=crop&q=80',
  '路考': 'https://images.unsplash.com/photo-1449965408869-ebd3fee7710d?w=600&h=340&fit=crop&q=80',
  '新移民': 'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=600&h=340&fit=crop&q=80',
  '医生': 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=600&h=340&fit=crop&q=80',
  '报税': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=340&fit=crop&q=80',
  'SPA': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=340&fit=crop&q=80',
  '按摩': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=340&fit=crop&q=80',
  '租房': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=340&fit=crop&q=80',
  '保险': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=340&fit=crop&q=80',
  '美甲': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=340&fit=crop&q=80',
  '装修': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=340&fit=crop&q=80',
  '英语': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=340&fit=crop&q=80',
  '牙': 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&h=340&fit=crop&q=80',
  '教育': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=340&fit=crop&q=80',
  '活动': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=340&fit=crop&q=80',
};

const defaultGuideImages = [
  'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&h=340&fit=crop&q=80',
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=340&fit=crop&q=80',
  'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&h=340&fit=crop&q=80',
  'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=600&h=340&fit=crop&q=80',
];

function getGuideImage(guide: AnyRow, index: number): string {
  if (guide.cover_image_url) return guide.cover_image_url;
  const title = guide.title_zh || guide.title || '';
  for (const [keyword, url] of Object.entries(guideTopicImages)) {
    if (title.includes(keyword)) return url;
  }
  return defaultGuideImages[index % defaultGuideImages.length];
}

export function GuidesSection({ guides }: GuidesSectionProps) {
  if (guides.length === 0) return null;

  return (
    <section style={{ padding: '88px 0' }}>
      <div style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '0 32px' }}>
        <SectionHeader
          number="03"
          english="Guides"
          title="热门生活指南"
          titleEm="the essentials"
          right={
            <div style={{ fontSize: 14, color: 'var(--ed-ink-muted)', maxWidth: 300, textAlign: 'right', lineHeight: 1.65 }}>
              新移民、老纽约都在看的实用攻略。<br />从办证到租房，一步不落。
            </div>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {guides.map((guide, i) => {
            const color = labelColors[i % labelColors.length];
            const label = guide.content_vertical?.replace('guide_', '').toUpperCase() || 'GUIDE';
            const body = guide.body_zh || guide.body_en || '';
            const imgUrl = getGuideImage(guide, i);

            return (
              <Link
                key={guide.id}
                href={`/guides/${guide.slug}`}
                className="block transition-all hover:-translate-y-1 group"
                style={{
                  background: 'var(--ed-surface-elev)',
                  border: '1px solid var(--ed-line)',
                  borderRadius: 'var(--ed-radius-lg)',
                  overflow: 'hidden',
                }}
              >
                {/* Photo header 16:9 */}
                <div className="relative" style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                  <img
                    src={imgUrl}
                    alt={guide.title_zh || ''}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <span
                    className="absolute"
                    style={{
                      top: 12, left: 12,
                      padding: '3px 10px', borderRadius: 'var(--ed-radius-pill)',
                      fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em',
                      color: 'var(--ed-paper)',
                      background: 'rgba(0,0,0,0.55)',
                      backdropFilter: 'blur(4px)',
                      zIndex: 2,
                    }}
                  >
                    {label}
                  </span>
                </div>

                {/* Body */}
                <div style={{ padding: '18px 18px 20px' }}>
                  <h3 style={{
                    fontFamily: 'var(--ed-font-serif)', fontSize: 15, fontWeight: 600,
                    lineHeight: 1.45, marginBottom: 12,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {guide.title_zh || guide.title}
                  </h3>
                  <div
                    className="flex items-center gap-1.5"
                    style={{ fontSize: 12, color: 'var(--ed-ink-muted)', borderTop: '1px dashed var(--ed-line)', paddingTop: 10 }}
                  >
                    <span style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic' }}>by Baam</span>
                    <span>·</span>
                    <span>{Math.ceil((body.length || 500) / 400)} 分钟阅读</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
