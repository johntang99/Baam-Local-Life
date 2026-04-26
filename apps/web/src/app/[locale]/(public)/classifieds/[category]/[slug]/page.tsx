import { createClient } from '@/lib/supabase/server';
import { getCurrentSite } from '@/lib/sites';
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';
import { PageContainer } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import { CommentForm } from '@/components/shared/social-actions';
import { ReportButton } from '@/components/shared/report-button';
import type { Metadata } from 'next';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const categoryNames: Record<string, string> = {
  housing: '房屋出租', jobs: '诚聘招工', secondhand: '二手商品', help: '寻求帮助',
};

interface Props {
  params: Promise<{ locale: string; category: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('classifieds').select('title').eq('slug', decodeURIComponent(rawSlug)).eq('status', 'active').single() as { data: { title: string } | null };
  if (!data) return { title: 'Not Found' };
  return { title: `${data.title} · 分类信息 · Baam` };
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

export default async function ClassifiedDetailPage({ params }: Props) {
  const { category, slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const supabase = await createClient();
  const site = await getCurrentSite();
  const currentUser = await getCurrentUser().catch(() => null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: item, error } = await (supabase as any)
    .from('classifieds')
    .select('*, profiles:author_id(display_name, username)')
    .eq('slug', slug)
    .eq('site_id', site.id)
    .single();

  if (error || !item) notFound();

  // Fetch replies
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawReplies } = await (supabase as any)
    .from('classified_replies')
    .select('*, profiles:author_id(display_name)')
    .eq('classified_id', item.id)
    .eq('status', 'published')
    .eq('is_private', false)
    .order('created_at', { ascending: true });

  const replies = (rawReplies || []) as AnyRow[];
  const authorName = item.profiles?.display_name || '匿名';
  const meta = item.metadata || {};
  const catName = categoryNames[category] || '分类信息';
  const isHelp = category === 'help';
  const coverPhoto = meta.cover_photo as string || '';
  const photos = (meta.photos as string[] || []);

  return (
    <main className="bg-bg-page min-h-screen">
      <PageContainer className="max-w-4xl py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-text-muted mb-4">
          <Link href="/classifieds" className="hover:text-primary">分类信息</Link>
          <span className="mx-2">›</span>
          <Link href={`/classifieds/${category}`} className="hover:text-primary">{catName}</Link>
          <span className="mx-2">›</span>
          <span className="text-text-secondary">{item.title}</span>
        </nav>

        <div className="lg:flex gap-8">
          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Cover Photo */}
            {coverPhoto && (
              <div className="r-xl overflow-hidden mb-6" style={{ aspectRatio: '16/9' }}>
                <img src={coverPhoto} alt={item.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Photo Gallery */}
            {photos.length > 0 && (
              <div className={`grid gap-2 mb-6 ${photos.length === 1 ? 'grid-cols-1' : photos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {photos.map((photo: string, i: number) => (
                  <div key={i} className="aspect-[4/3] r-lg overflow-hidden">
                    <img src={photo} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl fw-bold mb-3 leading-tight">{item.title}</h1>

            {/* Meta */}
            <div className="flex items-center gap-3 text-sm text-text-muted mb-6 pb-6 border-b border-border-light flex-wrap">
              <span>by {authorName}</span>
              <span>·</span>
              <span>{timeAgo(item.created_at)}</span>
              <span>·</span>
              <span>👀 {item.view_count || 0} 浏览</span>
              <span>·</span>
              <span>💬 {replies.length} 回复</span>
              {isHelp && (
                <a
                  href={`/zh/helper-2?q=${encodeURIComponent(item.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/5 border border-primary/15 r-full text-primary text-xs fw-medium hover:bg-primary/10 transition"
                >
                  🤖 问AI小帮手
                </a>
              )}
            </div>

            {/* Price */}
            {item.price_text && (
              <div className="mb-6 p-4 bg-accent-red-light r-lg">
                <span className="text-2xl fw-bold text-accent-red">{item.price_text}</span>
              </div>
            )}

            {/* Category-specific metadata */}
            {(meta.bedrooms || meta.salary_range || meta.condition) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {meta.bedrooms && <span className="px-3 py-1 bg-bg-card border border-border-light r-full text-xs">🛏️ {meta.bedrooms}室{meta.bathrooms ? `${meta.bathrooms}卫` : ''}</span>}
                {meta.neighborhood && <span className="px-3 py-1 bg-bg-card border border-border-light r-full text-xs">📍 {meta.neighborhood}</span>}
                {meta.salary_range && <span className="px-3 py-1 bg-bg-card border border-border-light r-full text-xs">💰 {meta.salary_range}</span>}
                {meta.job_type && <span className="px-3 py-1 bg-bg-card border border-border-light r-full text-xs">{meta.job_type === 'full_time' ? '全职' : meta.job_type === 'part_time' ? '兼职' : meta.job_type === 'remote' ? '远程' : meta.job_type}</span>}
                {meta.company && <span className="px-3 py-1 bg-bg-card border border-border-light r-full text-xs">🏢 {meta.company}</span>}
                {meta.condition && <span className="px-3 py-1 bg-bg-card border border-border-light r-full text-xs">{meta.condition === 'new' ? '全新' : meta.condition === 'like_new' ? '9成新' : meta.condition === 'good' ? '8成新' : meta.condition}</span>}
              </div>
            )}

            {/* Body */}
            {item.body && (
              <div className="mb-8 text-[15px] text-text-primary leading-[1.8] whitespace-pre-wrap break-words">
                {item.body}
              </div>
            )}

            {/* Replies */}
            <section className="mb-8">
              <h2 className="text-lg fw-bold mb-4">回复 ({replies.length})</h2>
              {replies.length > 0 && (
                <div className="space-y-4 mb-4">
                  {replies.map((reply) => {
                    const replyAuthor = reply.profiles?.display_name || '匿名';
                    return (
                      <Card key={reply.id} className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 r-full bg-primary/10 flex items-center justify-center text-xs flex-shrink-0">
                            {replyAuthor[0]}
                          </div>
                          <span className="text-sm fw-medium">{replyAuthor}</span>
                          <span className="text-xs text-text-muted">{timeAgo(reply.created_at)}</span>
                        </div>
                        <p className="text-sm text-text-primary pl-9 whitespace-pre-wrap">{reply.body}</p>
                      </Card>
                    );
                  })}
                </div>
              )}
              {/* Reply form - reuse CommentForm pattern */}
              {currentUser ? (
                <Card className="p-4">
                  <p className="text-sm text-text-muted mb-2">回复此信息</p>
                  <form>
                    <textarea placeholder="写下你的回复..." className="w-full h-20 px-3 py-2 border border-border r-lg text-sm resize-y focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                    <div className="flex justify-end mt-2">
                      <button className="px-4 py-2 bg-primary text-text-inverse text-sm fw-medium r-lg hover:bg-primary-dark transition">发送回复</button>
                    </div>
                  </form>
                </Card>
              ) : (
                <p className="text-sm text-text-muted text-center py-3">登录后即可回复</p>
              )}
            </section>
          </div>

          {/* Sidebar: Contact Info */}
          <aside className="lg:w-72 flex-shrink-0 mt-8 lg:mt-0">
            <Card className="p-5 sticky top-20">
              <h3 className="fw-bold text-base mb-3">联系方式</h3>
              {item.contact_name && <p className="text-sm mb-2">👤 {item.contact_name}</p>}
              {item.contact_phone && (
                <a href={`tel:${item.contact_phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline mb-2">
                  📞 {item.contact_phone}
                </a>
              )}
              {item.contact_wechat && <p className="text-sm mb-2">💬 微信：{item.contact_wechat}</p>}
              {item.contact_email && (
                <a href={`mailto:${item.contact_email}`} className="flex items-center gap-2 text-sm text-primary hover:underline mb-2">
                  ✉️ {item.contact_email}
                </a>
              )}
              {!item.contact_phone && !item.contact_wechat && !item.contact_email && (
                <p className="text-sm text-text-muted">请通过回复联系发布者</p>
              )}

              {item.expires_at && (
                <div className="mt-4 pt-4 border-t border-border-light">
                  <p className="text-xs text-text-muted">
                    有效期至：{new Date(item.expires_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              )}

              {/* Report */}
              {currentUser?.id !== item.author_id && (
                <div className="mt-4 pt-4 border-t border-border-light">
                  <ReportButton contentType="classified" contentId={item.id} variant="full" />
                </div>
              )}
            </Card>
          </aside>
        </div>
      </PageContainer>
    </main>
  );
}
