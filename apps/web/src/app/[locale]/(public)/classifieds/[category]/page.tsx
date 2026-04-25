import { createClient } from '@/lib/supabase/server';
import { getCurrentSite } from '@/lib/sites';
import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';
import { EditorialPageHeader } from '@/components/editorial/page-header';
import { EditorialContainer } from '@/components/editorial/container';
import type { Metadata } from 'next';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const categoryMap: Record<string, { dbFilter: string[]; emoji: string; title: string }> = {
  housing: { dbFilter: ['housing_rent', 'housing_buy'], emoji: '🏠', title: '房屋出租' },
  jobs: { dbFilter: ['jobs'], emoji: '💼', title: '诚聘招工' },
  secondhand: { dbFilter: ['secondhand'], emoji: '📦', title: '二手商品' },
  help: { dbFilter: ['services', 'general'], emoji: '🙋', title: '寻求帮助' },
};

interface Props {
  params: Promise<{ locale: string; category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = categoryMap[category];
  if (!cat) return { title: 'Not Found' };
  return { title: `${cat.title} · 分类信息 · Baam` };
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const ms = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(ms / 3600000);
  if (hrs < 1) return '刚刚';
  if (hrs < 24) return `${hrs}小时前`;
  const days = Math.floor(ms / 86400000);
  return days < 7 ? `${days}天前` : new Date(dateStr).toLocaleDateString('zh-CN');
}

export default async function ClassifiedCategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = categoryMap[category];
  if (!cat) notFound();

  const supabase = await createClient();
  const site = await getCurrentSite();

  const { data: rawListings } = await supabase
    .from('classifieds')
    .select('*, profiles:author_id(display_name)')
    .eq('site_id', site.id)
    .in('category', cat.dbFilter)
    .eq('status', 'active')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  const listings = (rawListings || []) as AnyRow[];
  const isHelp = category === 'help';

  return (
    <main>
      <EditorialPageHeader
        breadcrumbs={[
          { label: '首页', href: '/' },
          { label: '分类信息', href: '/classifieds' },
          { label: cat.title },
        ]}
        title={`${cat.emoji} ${cat.title}`}
        subtitle={`${listings.length} 条信息`}
        right={
          <Link href="/classifieds/new" style={{
            padding: '8px 20px', borderRadius: 'var(--ed-radius-md)',
            fontSize: 13.5, fontWeight: 500,
            background: 'var(--ed-ink)', color: 'var(--ed-paper)',
          }}>
            + 发布信息
          </Link>
        }
      />

      <EditorialContainer className="py-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <Link href="/classifieds" style={{ fontSize: 13, color: 'var(--ed-ink-muted)' }}>← 返回分类</Link>
        </div>

        {listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>{cat.emoji}</p>
            <p style={{ color: 'var(--ed-ink-soft)', fontSize: 15 }}>暂无{cat.title}信息</p>
            <Link href="/classifieds/new" style={{
              display: 'inline-block', marginTop: 16,
              padding: '8px 20px', borderRadius: 'var(--ed-radius-md)',
              fontSize: 14, fontWeight: 500,
              background: 'var(--ed-ink)', color: 'var(--ed-paper)',
            }}>
              发布第一条信息
            </Link>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--ed-line)', borderRadius: 'var(--ed-radius-lg)', overflow: 'hidden' }}>
            {listings.map((item, i) => {
              const authorName = item.profiles?.display_name || '匿名';
              const meta = item.metadata || {};
              return (
                <Link
                  key={item.id}
                  href={`/classifieds/${category}/${item.slug}`}
                  className="flex items-start gap-4 transition-colors hover:bg-[var(--ed-surface)]"
                  style={{ padding: '16px 20px', borderTop: i > 0 ? '1px solid var(--ed-line)' : 'none' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.is_featured && <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 'var(--ed-radius-pill)', background: 'rgba(212,160,23,0.12)', color: 'var(--ed-amber)', fontWeight: 500 }}>精选</span>}
                      <h3 style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h3>
                    </div>
                    {item.body && (
                      <p style={{ fontSize: 13, color: 'var(--ed-ink-soft)', lineHeight: 1.6, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.body}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: 12, color: 'var(--ed-ink-muted)' }}>
                      {meta.neighborhood && <span>{meta.neighborhood}</span>}
                      {meta.job_type && <span>{meta.job_type === 'full_time' ? '全职' : meta.job_type === 'part_time' ? '兼职' : meta.job_type === 'remote' ? '远程' : meta.job_type}</span>}
                      {meta.condition && <span>{meta.condition === 'new' ? '全新' : meta.condition === 'like_new' ? '9成新' : meta.condition === 'good' ? '8成新' : meta.condition}</span>}
                      <span>·</span>
                      <span>by {authorName}</span>
                      <span>·</span>
                      <span>{timeAgo(item.created_at)}</span>
                      {(item.reply_count || 0) > 0 && <span>· 💬 {item.reply_count}</span>}
                      {isHelp && (
                        <a
                          href={`/zh/helper-2?q=${encodeURIComponent(item.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ padding: '2px 8px', borderRadius: 'var(--ed-radius-pill)', fontSize: 10.5, fontWeight: 500, background: 'rgba(199,62,29,0.06)', color: 'var(--ed-accent)', border: '1px solid rgba(199,62,29,0.12)', marginLeft: 4 }}
                        >
                          问小帮手
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {item.price_text && (
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ed-accent)' }}>{item.price_text}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </EditorialContainer>
    </main>
  );
}
