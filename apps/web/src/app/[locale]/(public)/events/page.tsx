import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/routing';
import type { Metadata } from 'next';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return {
    title: `${t('events')} · Baam`,
    description: '纽约本地活动、社区聚会、讲座工作坊',
  };
}

const dateTabs = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'all', label: '全部' },
];

export default async function EventsListPage() {
  const supabase = await createClient();
  const t = await getTranslations();

  // Fetch published events, soonest first
  const { data: rawEvents, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('start_at', { ascending: true })
    .limit(20);

  const events = (rawEvents || []) as AnyRow[];

  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">本地活动</h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {dateTabs.map((tab, i) => (
              <button
                key={tab.key}
                className={`px-4 py-2 text-sm font-medium rounded-full ${
                  i === 2
                    ? 'bg-primary text-text-inverse'
                    : 'bg-border-light text-text-secondary hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Free/Paid toggle placeholder */}
          <div className="flex gap-1 ml-auto">
            <button className="px-3 py-1.5 text-xs font-medium rounded-full bg-border-light text-text-secondary hover:bg-gray-200">
              免费
            </button>
            <button className="px-3 py-1.5 text-xs font-medium rounded-full bg-border-light text-text-secondary hover:bg-gray-200">
              付费
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {error ? (
          <p className="text-text-secondary py-8 text-center">加载活动时出错，请稍后重试。</p>
        ) : events.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-text-secondary">暂无活动内容</p>
            <p className="text-text-muted text-sm mt-1">活动将在这里显示</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => {
              const startDate = event.start_at ? new Date(event.start_at) : null;
              const month = startDate
                ? startDate.toLocaleDateString('zh-CN', { month: 'short' })
                : '';
              const day = startDate ? startDate.getDate() : '';
              const timeStr = startDate
                ? startDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                : '';
              const isFree = event.is_free || event.price === 0;

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="card block overflow-hidden"
                >
                  {/* Cover gradient */}
                  <div className="h-32 bg-gradient-to-br from-primary/30 to-primary/5 relative">
                    {/* Date badge */}
                    <div className="absolute top-3 left-3 bg-white rounded-lg shadow-sm px-2 py-1 text-center">
                      <p className="text-xs text-text-muted leading-tight">{month}</p>
                      <p className="text-lg font-bold leading-tight">{day}</p>
                    </div>
                    {/* Free/Paid tag */}
                    <div className="absolute top-3 right-3">
                      <span className={`badge ${isFree ? 'badge-green' : 'badge-purple'} text-xs`}>
                        {isFree ? '免费' : '付费'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                      {event.title}
                    </h3>
                    <div className="space-y-1 text-xs text-text-muted">
                      {timeStr && <p>{timeStr}</p>}
                      {event.venue && <p>{event.venue}</p>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
