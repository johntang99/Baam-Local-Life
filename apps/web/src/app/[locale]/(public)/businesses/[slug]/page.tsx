import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('businesses')
    .select('name_zh, name, description_zh, logo_url, cover_image_url')
    .eq('slug', slug)
    .single();

  const biz = data as AnyRow | null;
  if (!biz) return { title: 'Not Found' };

  const name = biz.name_zh || biz.name || '';
  const desc = biz.description_zh || '';

  return {
    title: `${name} · Baam`,
    description: desc.slice(0, 160),
    openGraph: {
      title: `${name} · Baam`,
      description: desc.slice(0, 160),
      images: biz.cover_image_url
        ? [biz.cover_image_url]
        : biz.logo_url
          ? [biz.logo_url]
          : [],
    },
  };
}

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '\u2605'.repeat(full) + (half ? '\u2606' : '') + '\u2606'.repeat(empty);
}

export default async function BusinessDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch business
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  const biz = data as AnyRow | null;
  if (error || !biz) notFound();

  const name = biz.name_zh || biz.name;
  const body = biz.body_zh || biz.description_zh || biz.body_en || '';
  const aiTags = (biz.ai_tags || []) as string[];
  const faq = biz.ai_faq as Array<{ q: string; a: string }> | null;
  const catName = biz.category_name || biz.category || '';

  // Fetch reviews for this business
  const { data: rawReviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('business_id', biz.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const reviews = (rawReviews || []) as AnyRow[];

  // Fetch related guides (by category match or guide_business_links)
  const { data: rawGuides } = await supabase
    .from('articles')
    .select('*')
    .in('content_vertical', ['guide_howto', 'guide_checklist', 'guide_bestof', 'guide_comparison'])
    .eq('editorial_status', 'published')
    .limit(3);

  const relatedGuides = (rawGuides || []) as AnyRow[];

  return (
    <main>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <nav className="flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-primary">首页</Link>
          <span>/</span>
          <Link href="/businesses" className="hover:text-primary">商家</Link>
          {catName && (
            <>
              <span>/</span>
              <span className="hover:text-primary">{catName}</span>
            </>
          )}
          <span>/</span>
          <span className="text-text-secondary">{name}</span>
        </nav>
      </div>

      {/* Hero / Cover Image */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="relative rounded-xl overflow-hidden">
          <div className="h-48 sm:h-64 lg:h-80 bg-gradient-to-br from-blue-200 via-blue-100 to-teal-100 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-blue-300">
                <svg className="w-16 h-16 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm opacity-40">商家图片</p>
              </div>
            </div>
          </div>
          {/* Logo overlay */}
          <div className="absolute -bottom-10 left-6 w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-4 border-white bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg flex items-center justify-center">
            <span className="text-3xl sm:text-4xl text-white font-bold">
              {(name || '').charAt(0)}
            </span>
          </div>
        </div>
      </section>

      {/* Business Header */}
      <section className="max-w-7xl mx-auto px-4 pt-14 sm:pt-16 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            {/* Name + Verified */}
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold">{name}</h1>
              {biz.is_verified && (
                <svg className="w-6 h-6 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            {/* Core info row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
              {catName && <span className="badge badge-blue">{catName}</span>}
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">{renderStars(biz.avg_rating || 0)}</span>
                <span className="font-semibold">{biz.avg_rating?.toFixed(1) || '—'}</span>
                <span className="text-text-muted">({biz.review_count || 0}评价)</span>
              </div>
              {biz.region && (
                <>
                  <span className="text-text-muted">·</span>
                  <span className="text-text-secondary">{biz.region}</span>
                </>
              )}
              {biz.is_open !== undefined && (
                biz.is_open ? (
                  <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    现在营业
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs font-medium">
                    已关门
                  </span>
                )
              )}
            </div>
            {/* AI Recommendation Tags */}
            {aiTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {aiTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Buttons */}
      <section className="max-w-7xl mx-auto px-4 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button className="flex items-center justify-center gap-2 h-11 bg-primary text-text-inverse text-sm font-medium rounded-lg hover:opacity-90 transition">
            <span>📞</span> 电话联系
          </button>
          <button className="flex items-center justify-center gap-2 h-11 bg-bg-card border border-border text-sm font-medium rounded-lg hover:bg-border-light transition">
            <span>📍</span> 获取地址
          </button>
          <button className="flex items-center justify-center gap-2 h-11 bg-bg-card border border-border text-sm font-medium rounded-lg hover:bg-border-light transition">
            <span>📅</span> 预约咨询
          </button>
        </div>
      </section>

      {/* Main Content + Sidebar */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="lg:flex lg:gap-8">

          {/* Main Content Column */}
          <div className="flex-1 min-w-0">

            {/* ===== Overview Section ===== */}
            <h2 className="text-lg font-bold mb-4 mt-6 flex items-center gap-2" id="overview">
              概述
            </h2>

            {/* AI Description */}
            {body && (
              <div className="ai-summary-card mb-6">
                <h3 className="font-semibold text-sm mb-2">关于{name}</h3>
                <div className="text-sm leading-relaxed prose prose-sm max-w-none [&_p]:mb-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_a]:text-primary [&_a]:underline">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Services Placeholder */}
            <div className="card p-5 mb-6">
              <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                服务项目
              </h3>
              <p className="text-sm text-text-muted">商家服务信息即将更新</p>
            </div>

            {/* Business Hours Placeholder */}
            <div className="card p-5 mb-6">
              <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                营业时间
              </h3>
              {biz.business_hours ? (
                <pre className="text-sm text-text-secondary whitespace-pre-wrap">
                  {typeof biz.business_hours === 'string'
                    ? biz.business_hours
                    : JSON.stringify(biz.business_hours, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-text-muted">营业时间信息即将更新</p>
              )}
            </div>

            {/* ===== Reviews Section ===== */}
            <h2 className="text-lg font-bold mb-4 mt-8 flex items-center gap-2" id="reviews">
              评价 ({biz.review_count || reviews.length})
            </h2>

            {/* AI Sentiment Summary */}
            {biz.ai_review_summary && (
              <div className="ai-summary-card mb-6">
                <h3 className="font-semibold text-sm mb-2">AI评价摘要</h3>
                <p className="text-sm text-text-secondary">{biz.ai_review_summary}</p>
              </div>
            )}

            {/* Rating Distribution */}
            <div className="card p-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="text-center sm:text-left flex-shrink-0">
                  <div className="text-5xl font-bold">{biz.avg_rating?.toFixed(1) || '—'}</div>
                  <div className="text-yellow-500 text-lg mt-1">{renderStars(biz.avg_rating || 0)}</div>
                  <div className="text-sm text-text-muted mt-1">{biz.review_count || 0} 条评价</div>
                </div>
              </div>
            </div>

            {/* Individual Review Cards */}
            {reviews.length > 0 ? (
              <div className="space-y-4 mb-6">
                {reviews.map((review) => (
                  <div key={review.id} className="card p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                        {(review.author_name || '匿').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{review.author_name || '匿名用户'}</span>
                          <span className="text-xs text-text-muted">
                            {review.created_at
                              ? new Date(review.created_at).toLocaleDateString('zh-CN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })
                              : ''}
                          </span>
                        </div>
                        <div className="text-yellow-500 text-xs mt-0.5">
                          {renderStars(review.rating || 0)}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {review.body_zh || review.body || review.content || ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center mb-6">
                <p className="text-text-muted text-sm">暂无评价</p>
              </div>
            )}

            {/* ===== FAQ Section ===== */}
            {faq && faq.length > 0 && (
              <>
                <h2 className="text-lg font-bold mb-4 mt-8 flex items-center gap-2" id="faq">
                  常见问题
                </h2>

                <div className="ai-summary-card mb-4">
                  <h3 className="font-semibold text-sm mb-1">AI 智能问答</h3>
                  <p className="text-xs text-text-muted">以下常见问题由 AI 根据商家信息和用户评价自动生成</p>
                </div>

                <div className="space-y-3 mb-6">
                  {faq.map((item, idx) => (
                    <details key={idx} className="card overflow-hidden group">
                      <summary className="flex items-center justify-between p-5 text-left cursor-pointer hover:bg-border-light/50 transition list-none [&::-webkit-details-marker]:hidden">
                        <span className="font-medium text-sm pr-4">{item.q}</span>
                        <svg className="w-5 h-5 text-text-muted flex-shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-5 pb-5">
                        <p className="text-sm text-text-secondary leading-relaxed">{item.a}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </>
            )}

            {/* ===== Contact Section ===== */}
            <h2 className="text-lg font-bold mb-4 mt-8 flex items-center gap-2" id="contact">
              联系方式
            </h2>

            {/* Map Placeholder */}
            <div className="bg-border-light rounded-xl h-64 mb-6 flex items-center justify-center relative overflow-hidden">
              <div className="relative text-center">
                <svg className="w-12 h-12 text-text-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-text-muted">地图加载中...</p>
                {biz.address && (
                  <p className="text-xs text-text-muted mt-1">{biz.address}</p>
                )}
              </div>
            </div>

            {/* Contact Details */}
            <div className="card p-5 mb-6">
              <h3 className="font-semibold text-base mb-4">联系信息</h3>
              <div className="space-y-4">
                {biz.address && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-text-muted mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium">地址</p>
                      <p className="text-sm text-text-secondary">{biz.address}</p>
                    </div>
                  </div>
                )}
                {biz.phone && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-text-muted mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium">电话</p>
                      <p className="text-sm text-text-secondary">{biz.phone}</p>
                    </div>
                  </div>
                )}
                {biz.website && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-text-muted mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium">网站</p>
                      <a
                        href={biz.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {biz.website}
                      </a>
                    </div>
                  </div>
                )}
                {biz.wechat_id && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-text-muted mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium">微信</p>
                      <p className="text-sm text-text-secondary">{biz.wechat_id}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Related Guides */}
            {relatedGuides.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-bold mb-4">📚 相关生活指南</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {relatedGuides.map((guide) => (
                    <Link key={guide.id} href={`/guides/${guide.slug}`} className="card p-4 block">
                      <h3 className="font-medium text-sm line-clamp-2">{guide.title_zh}</h3>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 flex-shrink-0 space-y-6 mt-6 lg:mt-0">

            {/* Lead Capture Form */}
            <div className="lead-capture" id="lead-form">
              <h3 className="font-bold text-base mb-1">咨询这家商家</h3>
              <p className="text-xs text-text-muted mb-4">填写信息，商家将尽快与您联系</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">您的姓名 *</label>
                  <input
                    type="text"
                    placeholder="请输入姓名"
                    className="w-full h-10 px-3 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-bg-card"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">联系电话 *</label>
                  <input
                    type="tel"
                    placeholder="(xxx) xxx-xxxx"
                    className="w-full h-10 px-3 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-bg-card"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">咨询内容</label>
                  <textarea
                    rows={3}
                    placeholder="请简要描述您的需求..."
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-bg-card resize-none"
                  />
                </div>
                <button className="btn btn-primary w-full h-11 text-sm">提交咨询</button>
                <p className="text-xs text-text-muted text-center">
                  提交即表示同意 <Link href="/privacy" className="text-primary">隐私政策</Link> · 通常1个工作日内回复
                </p>
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-3">📬 订阅本地周报</h3>
              <p className="text-xs text-text-secondary mb-3">每周精选本地新闻、指南、活动</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="输入邮箱"
                  className="flex-1 h-9 px-3 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
                <button className="btn btn-primary h-9 px-4 text-sm">订阅</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
