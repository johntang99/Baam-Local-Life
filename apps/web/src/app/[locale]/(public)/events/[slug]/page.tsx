import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';
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
    .from('events')
    .select('title, description, cover_image_url')
    .eq('slug', slug)
    .single();

  const event = data as AnyRow | null;
  if (!event) return { title: 'Not Found' };

  return {
    title: `${event.title} · Baam`,
    description: event.description?.slice(0, 160) || '',
    openGraph: {
      title: event.title || '',
      description: event.description?.slice(0, 160) || '',
      images: event.cover_image_url ? [event.cover_image_url] : [],
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch event
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  const event = data as AnyRow | null;
  if (error || !event) notFound();

  const startDate = event.start_at ? new Date(event.start_at) : null;
  const endDate = event.end_at ? new Date(event.end_at) : null;
  const isFree = event.is_free || event.price === 0;

  const dateStr = startDate
    ? startDate.toLocaleDateString('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
      })
    : '';
  const timeStr = startDate
    ? startDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : '';
  const endTimeStr = endDate
    ? endDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : '';

  // Fetch related events
  const { data: rawRelated } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .neq('id', event.id)
    .order('start_at', { ascending: true })
    .limit(3);

  const relatedEvents = (rawRelated || []) as AnyRow[];

  return (
    <main>
      {/* Cover gradient */}
      <div className="h-48 bg-gradient-to-br from-primary/30 to-primary/5" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-text-muted mb-4">
          <Link href="/" className="hover:text-primary">首页</Link>
          <span className="mx-2">›</span>
          <Link href="/events" className="hover:text-primary">活动</Link>
          <span className="mx-2">›</span>
          <span className="text-text-secondary">{event.title}</span>
        </nav>

        <div className="lg:flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <header className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={`badge ${isFree ? 'badge-green' : 'badge-purple'} text-xs`}>
                  {isFree ? '免费' : '付费'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-4">{event.title}</h1>

              {/* Event Meta */}
              <div className="space-y-2 text-sm text-text-secondary">
                {dateStr && (
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">日期</span>
                    <span>{dateStr}</span>
                  </div>
                )}
                {timeStr && (
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">时间</span>
                    <span>{timeStr}{endTimeStr ? ` - ${endTimeStr}` : ''}</span>
                  </div>
                )}
                {event.venue && (
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">地点</span>
                    <span>{event.venue}</span>
                  </div>
                )}
                {event.address && (
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">地址</span>
                    <span>{event.address}</span>
                  </div>
                )}
                {event.organizer && (
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">主办方</span>
                    <span>{event.organizer}</span>
                  </div>
                )}
              </div>
            </header>

            {/* Description */}
            {event.description && (
              <div className="prose prose-sm max-w-none mb-8 [&_p]:text-text-primary [&_p]:leading-relaxed [&_p]:mb-4">
                <p>{event.description}</p>
              </div>
            )}

            {/* Map Placeholder */}
            <div className="bg-border-light rounded-xl h-48 flex items-center justify-center text-text-muted text-sm mb-8">
              地图加载中...
            </div>

            {/* Share */}
            <div className="flex items-center gap-3 py-4 border-t border-border">
              <span className="text-sm text-text-secondary">分享：</span>
              <button className="btn btn-outline h-8 px-3 text-xs">微信</button>
              <button className="btn btn-outline h-8 px-3 text-xs">Facebook</button>
              <button className="btn btn-outline h-8 px-3 text-xs">复制链接</button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6 mt-8 lg:mt-0">
            {/* RSVP card placeholder */}
            <div className="bg-bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-3">参加活动</h3>
              <p className="text-xs text-text-secondary mb-3">
                {isFree ? '免费活动，欢迎参加' : `票价：$${event.price || '--'}`}
              </p>
              <button className="btn btn-primary w-full h-9 text-sm">报名参加</button>
            </div>
          </aside>
        </div>

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-bold mb-4">更多活动</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {relatedEvents.map((evt) => {
                const evtDate = evt.start_at ? new Date(evt.start_at) : null;
                const evtMonth = evtDate
                  ? evtDate.toLocaleDateString('zh-CN', { month: 'short' })
                  : '';
                const evtDay = evtDate ? evtDate.getDate() : '';
                const evtFree = evt.is_free || evt.price === 0;

                return (
                  <Link key={evt.id} href={`/events/${evt.slug}`} className="card block overflow-hidden">
                    <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 relative">
                      <div className="absolute top-2 left-2 bg-white rounded-lg shadow-sm px-2 py-1 text-center">
                        <p className="text-xs text-text-muted leading-tight">{evtMonth}</p>
                        <p className="text-base font-bold leading-tight">{evtDay}</p>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className={`badge ${evtFree ? 'badge-green' : 'badge-purple'} text-xs`}>
                          {evtFree ? '免费' : '付费'}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2">{evt.title}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
