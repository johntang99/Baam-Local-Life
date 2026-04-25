import { Link } from '@/lib/i18n/routing';
import { SectionHeader } from './section-header';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface ClassifiedsSectionProps {
  housing: AnyRow[];
  jobs: AnyRow[];
  secondhand: AnyRow[];
  help: AnyRow[];
}

const categoryConfig = [
  { key: 'housing', emoji: '🏠', title: '房屋出租', urlKey: 'housing' },
  { key: 'jobs', emoji: '💼', title: '诚聘招工', urlKey: 'jobs' },
  { key: 'secondhand', emoji: '📦', title: '二手商品', urlKey: 'secondhand' },
  { key: 'help', emoji: '🙋', title: '寻求帮助', urlKey: 'help' },
];

const tagColors: Record<string, { bg: string; color: string }> = {
  housing: { bg: '#E0E8F0', color: '#2B5080' },
  jobs: { bg: 'var(--ed-tag-green-bg)', color: 'var(--ed-tag-green-text)' },
  secondhand: { bg: '#FBF0D4', color: '#8B6914' },
  help: { bg: 'var(--ed-tag-purple-bg)', color: 'var(--ed-tag-purple-text)' },
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const ms = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(ms / 3600000);
  if (hrs < 1) return '刚刚';
  if (hrs < 24) return `${hrs}小时前`;
  const days = Math.floor(ms / 86400000);
  if (days < 7) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function getSubTag(item: AnyRow, catKey: string): string {
  const meta = item.metadata || {};
  if (catKey === 'housing') {
    if (meta.bedrooms) return `${meta.bedrooms}室${meta.bathrooms || ''}${meta.bathrooms ? '卫' : ''}`;
    return item.sub_category || '';
  }
  if (catKey === 'jobs') return meta.job_type === 'full_time' ? '全职' : meta.job_type === 'part_time' ? '兼职' : meta.job_type === 'remote' ? '远程' : '';
  if (catKey === 'secondhand') {
    const cond = meta.condition;
    if (cond === 'new') return '全新';
    if (cond === 'like_new') return '9成新';
    if (cond === 'good') return '8成新';
    return '';
  }
  return '';
}

export function ClassifiedsSection({ housing, jobs, secondhand, help }: ClassifiedsSectionProps) {
  const allData: Record<string, AnyRow[]> = { housing, jobs, secondhand, help };
  const hasAny = housing.length > 0 || jobs.length > 0 || secondhand.length > 0 || help.length > 0;
  if (!hasAny) return null;

  return (
    <section style={{ padding: '88px 0', borderTop: '1px solid var(--ed-line)' }}>
      <div style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '0 32px' }}>
        <SectionHeader
          number="07"
          english="Classifieds"
          title="分类信息"
          titleEm="local listings"
          right={
            <div className="flex items-center gap-4">
              <Link
                href="/classifieds/new"
                className="inline-flex items-center gap-1.5 transition-all hover:-translate-y-px"
                style={{ padding: '10px 18px', background: 'var(--ed-accent)', color: 'var(--ed-paper)', borderRadius: 'var(--ed-radius-pill)', fontSize: 14, fontWeight: 500 }}
              >
                + 免费发布
              </Link>
              <Link
                href="/classifieds"
                className="inline-flex items-center gap-1.5 transition-all"
                style={{ fontSize: 14, color: 'var(--ed-ink-soft)' }}
              >
                查看全部
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </Link>
            </div>
          }
        />

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categoryConfig.map((cat) => {
            const items = allData[cat.key] || [];
            const tc = tagColors[cat.key];
            return (
              <div
                key={cat.key}
                style={{
                  background: 'var(--ed-surface-elev)',
                  border: '1px solid var(--ed-line)',
                  borderRadius: 'var(--ed-radius-lg)',
                  overflow: 'hidden',
                }}
              >
                {/* Card header */}
                <div
                  className="flex items-center justify-between"
                  style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--ed-line)' }}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 20 }}>{cat.emoji}</span>
                    <span style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 17, fontWeight: 600 }}>{cat.title}</span>
                    <span style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontSize: 12, color: 'var(--ed-ink-muted)' }}>
                      {items.length > 0 ? items[0]?.total_count || items.length : 0}
                    </span>
                  </div>
                  <Link
                    href={`/classifieds/${cat.urlKey}`}
                    className="transition-colors"
                    style={{ fontSize: 12.5, color: 'var(--ed-ink-muted)' }}
                  >
                    查看全部 →
                  </Link>
                </div>

                {/* Listings */}
                <div>
                  {items.length === 0 ? (
                    <div style={{ padding: '24px 22px', textAlign: 'center', color: 'var(--ed-ink-muted)', fontSize: 13 }}>
                      暂无信息
                    </div>
                  ) : (
                    items.slice(0, 4).map((item, i) => {
                      const hasThumb = (cat.key === 'housing' || cat.key === 'secondhand');
                      const subTag = getSubTag(item, cat.key);
                      const authorName = item.profiles?.display_name || '';
                      const meta = item.metadata || {};
                      const neighborhood = meta.neighborhood || '';

                      return (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 transition-colors"
                          style={{
                            padding: '14px 22px',
                            borderBottom: i < Math.min(items.length, 4) - 1 ? '1px dashed var(--ed-line)' : 'none',
                          }}
                        >
                          {/* Thumbnail or icon */}
                          {hasThumb ? (
                            <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--ed-paper-warm)' }}>
                              {(meta.cover_photo || (meta.photos as string[])?.[0]) ? (
                                <img src={meta.cover_photo || (meta.photos as string[])[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                  {cat.emoji}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--ed-paper-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                              {cat.emoji}
                            </div>
                          )}

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Link href={`/classifieds/${cat.urlKey}/${item.slug}`} style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                              {item.title}
                            </Link>
                            <div className="flex items-center gap-1.5 flex-wrap" style={{ fontSize: 11.5, color: 'var(--ed-ink-muted)', marginTop: 4 }}>
                              {subTag && (
                                <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10.5, fontWeight: 500, background: tc.bg, color: tc.color }}>
                                  {subTag}
                                </span>
                              )}
                              {neighborhood && <span>{neighborhood}</span>}
                              {neighborhood && <span>·</span>}
                              <span style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic' }}>
                                {timeAgo(item.created_at)}
                              </span>
                              {/* AI button for help category */}
                              {cat.key === 'help' && (
                                <a
                                  href={`/zh/helper-2?q=${encodeURIComponent(item.title)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 3,
                                    padding: '1px 8px', borderRadius: 'var(--ed-radius-pill)',
                                    background: 'linear-gradient(135deg, rgba(199,62,29,0.08), rgba(212,160,23,0.08))',
                                    border: '1px solid rgba(199,62,29,0.15)',
                                    fontSize: 10.5, fontWeight: 500, color: 'var(--ed-accent)',
                                    marginLeft: 2,
                                  }}
                                >
                                  <span style={{ width: 5, height: 5, background: '#25A06E', borderRadius: '50%' }} />
                                  问小帮手
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Price + replies */}
                          <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                            <span style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontSize: 15, fontWeight: 500, color: 'var(--ed-accent)', lineHeight: 1.2 }}>
                              {item.price_text || ''}
                            </span>
                            {(item.reply_count || 0) > 0 && (
                              <span style={{ fontSize: 10.5, color: 'var(--ed-ink-muted)' }}>
                                💬 {item.reply_count}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
