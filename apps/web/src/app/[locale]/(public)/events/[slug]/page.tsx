import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';
import { EditorialContainer } from '@/components/editorial/container';
import { EditorialCard } from '@/components/editorial/card';
import type { Metadata } from 'next';
import { getCurrentSite } from '@/lib/sites';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const site = await getCurrentSite();
  const { data } = await supabase
    .from('events')
    .select('title, description, cover_image_url')
    .eq('slug', slug).eq('site_id', site.id).single();

  const event = data as AnyRow | null;
  if (!event) return { title: 'Not Found' };
  const title = event.title_zh || event.title_en || event.title || '';
  const desc = event.description_zh || event.description_en || event.description || '';
  return {
    title: `${title} · Baam`,
    description: desc.slice(0, 160),
    openGraph: { title, description: desc.slice(0, 160), images: event.cover_image_url ? [event.cover_image_url] : [] },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const site = await getCurrentSite();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug).eq('status', 'published').eq('site_id', site.id).single();

  const event = data as AnyRow | null;
  if (error || !event) notFound();

  const startDate = event.start_at ? new Date(event.start_at) : null;
  const endDate = event.end_at ? new Date(event.end_at) : null;
  const isFree = event.is_free || event.price === 0;
  const title = event.title_zh || event.title_en || event.title;

  const dateStr = startDate ? startDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) : '';
  const timeStr = startDate ? startDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';
  const endTimeStr = endDate ? endDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';

  const { data: rawRelated } = await supabase
    .from('events').select('*').eq('status', 'published').eq('site_id', site.id)
    .neq('id', event.id).order('start_at', { ascending: true }).limit(3);
  const relatedEvents = (rawRelated || []) as AnyRow[];

  return (
    <main>
      {/* Cover */}
      <div style={{ height: 'clamp(160px, 25vw, 240px)', background: 'var(--ed-paper-warm)', position: 'relative' }}>
        {startDate && (
          <div className="absolute" style={{
            bottom: -24, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--ed-surface-elev)', borderRadius: 'var(--ed-radius-lg)',
            padding: '12px 20px', textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1px solid var(--ed-line)',
          }}>
            <p style={{ fontSize: 12, color: 'var(--ed-ink-muted)', fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic' }}>
              {startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
            </p>
            <p style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--ed-font-serif-italic)', lineHeight: 1.1 }}>
              {startDate.getDate()}
            </p>
          </div>
        )}
      </div>

      <EditorialContainer className="pt-12 pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 flex-wrap mb-4" style={{ fontSize: 13, color: 'var(--ed-ink-muted)' }}>
          <Link href="/" className="hover:text-[var(--ed-accent)] transition-colors">首页</Link>
          <span style={{ color: 'var(--ed-line-strong)' }}>›</span>
          <Link href="/events" className="hover:text-[var(--ed-accent)] transition-colors">活动</Link>
          <span style={{ color: 'var(--ed-line-strong)' }}>›</span>
          <span style={{ color: 'var(--ed-ink-soft)' }}>{title}</span>
        </nav>

        <div className="lg:flex gap-10">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <header style={{ marginBottom: 32 }}>
              <span style={{
                display: 'inline-block', padding: '4px 14px', borderRadius: 'var(--ed-radius-pill)',
                fontSize: 12, fontWeight: 500, marginBottom: 14,
                background: isFree ? 'var(--ed-tag-green-bg)' : 'var(--ed-tag-purple-bg)',
                color: isFree ? 'var(--ed-tag-green-text)' : 'var(--ed-tag-purple-text)',
              }}>
                {isFree ? '免费' : '付费'}
              </span>
              <h1 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, lineHeight: 1.3, marginBottom: 20 }}>
                {title}
              </h1>

              {/* Event meta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
                {dateStr && (
                  <div className="flex items-center gap-3">
                    <span style={{ color: 'var(--ed-ink-muted)', width: 40 }}>日期</span>
                    <span style={{ color: 'var(--ed-ink-soft)' }}>{dateStr}</span>
                  </div>
                )}
                {timeStr && (
                  <div className="flex items-center gap-3">
                    <span style={{ color: 'var(--ed-ink-muted)', width: 40 }}>时间</span>
                    <span style={{ color: 'var(--ed-ink-soft)' }}>{timeStr}{endTimeStr ? ` - ${endTimeStr}` : ''}</span>
                  </div>
                )}
                {(event.venue_name || event.venue) && (
                  <div className="flex items-center gap-3">
                    <span style={{ color: 'var(--ed-ink-muted)', width: 40 }}>地点</span>
                    <span style={{ color: 'var(--ed-ink-soft)' }}>{event.venue_name || event.venue}</span>
                  </div>
                )}
                {event.address && (
                  <div className="flex items-center gap-3">
                    <span style={{ color: 'var(--ed-ink-muted)', width: 40 }}>地址</span>
                    <span style={{ color: 'var(--ed-ink-soft)' }}>{event.address}</span>
                  </div>
                )}
                {event.organizer && (
                  <div className="flex items-center gap-3">
                    <span style={{ color: 'var(--ed-ink-muted)', width: 40 }}>主办</span>
                    <span style={{ color: 'var(--ed-ink-soft)' }}>{event.organizer}</span>
                  </div>
                )}
              </div>
            </header>

            {/* Description */}
            {(event.description_zh || event.description_en || event.description) && (
              <div style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--ed-ink-soft)', marginBottom: 32 }}>
                <p>{event.description_zh || event.description_en || event.description}</p>
              </div>
            )}

            {/* Share */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '16px 0', borderTop: '1px solid var(--ed-line)',
            }}>
              <span style={{ fontSize: 13, color: 'var(--ed-ink-muted)' }}>分享：</span>
              {['微信', 'Facebook', '复制链接'].map(label => (
                <button key={label} style={{ padding: '5px 12px', fontSize: 12, border: '1px solid var(--ed-line)', borderRadius: 'var(--ed-radius-pill)', background: 'transparent', color: 'var(--ed-ink-soft)', cursor: 'pointer' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block flex-shrink-0" style={{ width: 280 }}>
            <div className="sticky" style={{ top: 100 }}>
              <EditorialCard className="p-5">
                <h3 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>参加活动</h3>
                <p style={{ fontSize: 13, color: 'var(--ed-ink-soft)', marginBottom: 16 }}>
                  {isFree ? '免费活动，欢迎参加' : `票价：$${event.price || '--'}`}
                </p>
                <button style={{
                  width: '100%', padding: '10px 0', borderRadius: 'var(--ed-radius-md)',
                  fontSize: 14, fontWeight: 500, background: 'var(--ed-ink)', color: 'var(--ed-paper)',
                  border: 'none', cursor: 'pointer',
                }}>
                  报名参加
                </button>
              </EditorialCard>
            </div>
          </aside>
        </div>

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <section style={{ marginTop: 48 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
              <div style={{ width: 3, height: 18, background: 'var(--ed-accent)', borderRadius: 2 }} />
              <h2 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 18, fontWeight: 700 }}>更多活动</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {relatedEvents.map((evt) => {
                const evtDate = evt.start_at ? new Date(evt.start_at) : null;
                const evtMonth = evtDate ? evtDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '';
                const evtDay = evtDate ? evtDate.getDate() : '';
                const evtFree = evt.is_free || evt.price === 0;
                return (
                  <Link key={evt.id} href={`/events/${evt.slug}`} className="block group">
                    <EditorialCard className="overflow-hidden h-full">
                      <div className="relative" style={{ height: 96, background: 'var(--ed-paper-warm)' }}>
                        <div className="absolute" style={{ top: 8, left: 8, background: 'var(--ed-surface-elev)', borderRadius: 'var(--ed-radius-md)', padding: '4px 8px', textAlign: 'center', border: '1px solid var(--ed-line)' }}>
                          <p style={{ fontSize: 9, color: 'var(--ed-ink-muted)', fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic' }}>{evtMonth}</p>
                          <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--ed-font-serif-italic)', lineHeight: 1.1 }}>{evtDay}</p>
                        </div>
                        <span className="absolute" style={{ top: 8, right: 8, padding: '2px 8px', borderRadius: 'var(--ed-radius-pill)', fontSize: 10.5, fontWeight: 500, background: evtFree ? 'var(--ed-tag-green-bg)' : 'var(--ed-tag-purple-bg)', color: evtFree ? 'var(--ed-tag-green-text)' : 'var(--ed-tag-purple-text)' }}>
                          {evtFree ? '免费' : '付费'}
                        </span>
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <h3 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 13.5, fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {evt.title_zh || evt.title_en || evt.title}
                        </h3>
                      </div>
                    </EditorialCard>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </EditorialContainer>
    </main>
  );
}
