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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

function parseStructuredSections(text: string): { sections: Record<string, string>; remainder: string } {
  if (!text) return { sections: {}, remainder: '' };
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const sections: Record<string, string> = {};
  const remainderLines: string[] = [];
  let currentKey = '';

  for (const line of lines) {
    const m = line.match(/^【([^】]+)】\s*(.*)$/);
    if (m) {
      currentKey = m[1].trim();
      const initial = m[2]?.trim() || '';
      if (!sections[currentKey]) sections[currentKey] = '';
      if (initial) sections[currentKey] = initial;
      continue;
    }
    if (currentKey) {
      sections[currentKey] = sections[currentKey] ? `${sections[currentKey]}\n${line}` : line;
    } else {
      remainderLines.push(line);
    }
  }

  return {
    sections,
    remainder: remainderLines.join('\n').trim(),
  };
}

function toDisplayText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

const DEFAULT_IMPORT_CONTACT_NAME = 'Guest Sam';
const DEFAULT_IMPORT_CONTACT_EMAIL = 'guest-sam1@gmail.com';

function normalizeContactName(name: string): string {
  const value = name.trim();
  if (!value) return '';
  return value.toLowerCase() === DEFAULT_IMPORT_CONTACT_NAME.toLowerCase() ? '' : value;
}

function normalizeContactEmail(email: string): string {
  const value = email.trim();
  if (!value) return '';
  return value.toLowerCase() === DEFAULT_IMPORT_CONTACT_EMAIL.toLowerCase() ? '' : value;
}

function buildContactLine(name: string, phone: string, email: string): string {
  const parts = [normalizeContactName(name), phone.trim(), normalizeContactEmail(email)].filter(Boolean);
  return parts.join(' / ') || '未提供';
}

function extractFirstEmail(text: string): string {
  if (!text) return '';
  const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return m?.[0]?.trim() || '';
}

function sanitizeStructuredBodyContactLine(body: string, contactLine: string): string {
  if (!body) return '';
  const parsed = parseStructuredSections(body);
  const keys = Object.keys(parsed.sections);
  if (!keys.length || !parsed.sections['联系方式']) return body;

  const lines: string[] = [];
  for (const key of keys) {
    const value = key === '联系方式' ? contactLine : parsed.sections[key];
    lines.push(`【${key}】${value}`);
  }
  if (parsed.remainder) lines.push(parsed.remainder);
  return lines.join('\n');
}

function replaceProtectedEmailPlaceholder(text: string, email: string): string {
  if (!text) return '';
  if (!email) return text;
  return text.replace(/\[email(?:\s|&nbsp;|&#160;|\u00a0)*protected\]/gi, email);
}

function getReliablePriceText(priceText: string | null | undefined): string | null {
  if (!priceText) return null;
  const value = String(priceText).trim();
  if (!value) return null;

  // Hide phone-like or plain long numbers often extracted by mistake.
  if (/^\d{5,}$/.test(value.replace(/[,\s]/g, ''))) return null;
  if (/1?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(value)) return null;

  const hasClearPriceMarker = /[$¥￥]|元|美元|美金|面议|免费|\/月|月租|每月|\/天|每天|\/周|每周/i.test(value);
  if (!hasClearPriceMarker) return null;

  return value;
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
  const isHousing = category === 'housing';
  const isJobs = category === 'jobs';
  const isSecondhand = category === 'secondhand';
  const coverPhoto = meta.cover_photo as string || '';
  const photos = (meta.photos as string[] || []);
  const reliablePriceText = getReliablePriceText(item.price_text);
  const parsedBody = parseStructuredSections(item.body || '');
  const section = parsedBody.sections;
  const fallbackEmailFromContent = extractFirstEmail(toDisplayText(item.body));
  const contactEmail = normalizeContactEmail(toDisplayText(item.contact_email)) || normalizeContactEmail(fallbackEmailFromContent);
  const contactLine = buildContactLine(
    toDisplayText(item.contact_name),
    toDisplayText(item.contact_phone),
    contactEmail,
  );
  const detailBody = replaceProtectedEmailPlaceholder(
    sanitizeStructuredBodyContactLine(toDisplayText(item.body), contactLine),
    contactEmail,
  );
  const contactName = normalizeContactName(toDisplayText(item.contact_name));

  const jobSalary = toDisplayText(meta.salary_range) || toDisplayText(section['薪资']) || reliablePriceText || '';
  const jobCompany = toDisplayText(meta.company) || toDisplayText(section['公司']) || '';
  const jobLocation = toDisplayText(meta.job_location) || toDisplayText(section['地点']) || toDisplayText(meta.neighborhood) || '';
  const jobSchedule = [
    toDisplayText(meta.job_type) === 'full_time'
      ? '全职'
      : toDisplayText(meta.job_type) === 'part_time'
        ? '兼职'
        : toDisplayText(meta.job_type) === 'remote'
          ? '远程'
          : toDisplayText(meta.job_type),
    toDisplayText(meta.work_hours),
  ].filter(Boolean).join(' / ') || toDisplayText(section['时间']);
  const jobRequirements = toDisplayText(meta.job_requirements) || toDisplayText(section['要求']);

  const housingRooms = [
    meta.bedrooms ? `${meta.bedrooms}室` : '',
    meta.bathrooms ? `${meta.bathrooms}卫` : '',
  ].filter(Boolean).join(' ') || '';
  const housingRent = reliablePriceText || (meta.rent_amount ? `$${meta.rent_amount}/月` : '');
  const housingNeighborhood = toDisplayText(meta.neighborhood);
  const housingMoveInDate = toDisplayText(meta.move_in_date);

  const secondhandConditionRaw = toDisplayText(meta.condition);
  const secondhandCondition =
    secondhandConditionRaw === 'new'
      ? '全新'
      : secondhandConditionRaw === 'like_new'
        ? '9成新'
        : secondhandConditionRaw === 'good'
          ? '8成新'
          : secondhandConditionRaw;
  const secondhandBrand = toDisplayText(meta.brand);
  const secondhandMeetup = toDisplayText(meta.meetup_location);
  const secondhandOriginalPrice = meta.original_price ? `$${meta.original_price}` : '';
  const supplementText = replaceProtectedEmailPlaceholder(toDisplayText(section['补充说明']), contactEmail);

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
              <span>{formatDate(item.created_at)}</span>
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
            {reliablePriceText && !isJobs && (
              <div className="mb-6 p-4 bg-accent-red-light r-lg">
                <span className="text-2xl fw-bold text-accent-red">{reliablePriceText}</span>
              </div>
            )}

            {/* Category-specific structured info */}
            {isJobs && (
              <Card className="mb-6 p-4">
                <h3 className="text-sm fw-bold mb-3">岗位信息</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-text-muted">职位</span><p className="fw-medium">{item.title}</p></div>
                  <div><span className="text-text-muted">薪资</span><p className="fw-medium">{jobSalary || '未提供'}</p></div>
                  <div><span className="text-text-muted">公司</span><p className="fw-medium">{jobCompany || '未提供'}</p></div>
                  <div><span className="text-text-muted">地点</span><p className="fw-medium">{jobLocation || '未提供'}</p></div>
                  <div className="sm:col-span-2"><span className="text-text-muted">时间</span><p className="fw-medium">{jobSchedule || '未提供'}</p></div>
                </div>
                {jobRequirements && (
                  <div className="mt-4 pt-4 border-t border-border-light">
                    <p className="text-text-muted text-sm mb-1">要求</p>
                    <p className="text-sm whitespace-pre-wrap">{jobRequirements}</p>
                  </div>
                )}
                {supplementText && (
                  <div className="mt-4 pt-4 border-t border-border-light">
                    <p className="text-text-muted text-sm mb-1">补充说明</p>
                    <p className="text-sm whitespace-pre-wrap">{supplementText}</p>
                  </div>
                )}
              </Card>
            )}

            {isHousing && (
              <Card className="mb-6 p-4">
                <h3 className="text-sm fw-bold mb-3">房源信息</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-text-muted">户型</span><p className="fw-medium">{housingRooms || '未提供'}</p></div>
                  <div><span className="text-text-muted">租金</span><p className="fw-medium">{housingRent || '未提供'}</p></div>
                  <div><span className="text-text-muted">地区</span><p className="fw-medium">{housingNeighborhood || '未提供'}</p></div>
                  <div><span className="text-text-muted">入住时间</span><p className="fw-medium">{housingMoveInDate || '未提供'}</p></div>
                </div>
              </Card>
            )}

            {isSecondhand && (
              <Card className="mb-6 p-4">
                <h3 className="text-sm fw-bold mb-3">商品信息</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-text-muted">成色</span><p className="fw-medium">{secondhandCondition || '未提供'}</p></div>
                  <div><span className="text-text-muted">售价</span><p className="fw-medium">{reliablePriceText || '未提供'}</p></div>
                  <div><span className="text-text-muted">品牌</span><p className="fw-medium">{secondhandBrand || '未提供'}</p></div>
                  <div><span className="text-text-muted">原价</span><p className="fw-medium">{secondhandOriginalPrice || '未提供'}</p></div>
                  <div className="col-span-2"><span className="text-text-muted">交易地点</span><p className="fw-medium">{secondhandMeetup || '未提供'}</p></div>
                </div>
              </Card>
            )}

            {/* Body */}
            {detailBody && !isJobs && (
              <div className="mb-8 text-[15px] text-text-primary leading-[1.8] whitespace-pre-wrap break-words">
                {detailBody}
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
                          <span className="text-xs text-text-muted">{formatDate(reply.created_at)}</span>
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
              {contactName && <p className="text-sm mb-2">👤 {contactName}</p>}
              {item.contact_phone && (
                <a href={`tel:${item.contact_phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline mb-2">
                  📞 {item.contact_phone}
                </a>
              )}
              {item.contact_wechat && <p className="text-sm mb-2">💬 微信：{item.contact_wechat}</p>}
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 text-sm text-primary hover:underline mb-2">
                  ✉️ {contactEmail}
                </a>
              )}
              {!item.contact_phone && !item.contact_wechat && !contactEmail && (
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
