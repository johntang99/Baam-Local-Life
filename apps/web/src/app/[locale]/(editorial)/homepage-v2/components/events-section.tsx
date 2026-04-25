import { Link } from '@/lib/i18n/routing';
import { SectionHeader } from './section-header';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface EventsSectionProps {
  events: AnyRow[];
}

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function EventsSection({ events }: EventsSectionProps) {
  if (events.length === 0) return null;

  return (
    <section
      style={{
        padding: '88px 0',
        background: 'var(--ed-paper-warm)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle radial gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 50% 60% at 80% 30%, rgba(212, 160, 23, 0.08), transparent 60%)',
      }} />

      <div style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '0 32px', position: 'relative' }}>
        <SectionHeader
          number="04"
          english="Happenings"
          title="周末活动精选"
          titleEm="this weekend"
          right={
            <Link href="/events" className="inline-flex items-center gap-1.5 transition-all" style={{ fontSize: 14, color: 'var(--ed-ink-soft)' }}>
              查看全部活动
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </Link>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {events.map((event) => {
            const startDate = event.start_at ? new Date(event.start_at) : null;
            const day = startDate?.getDate() || '?';
            const month = startDate ? months[startDate.getMonth()] : '';
            const weekday = startDate ? weekdays[startDate.getDay()] : '';
            const time = startDate?.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: true }) || '';

            return (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="block transition-all hover:-translate-y-1"
                style={{
                  background: 'var(--ed-surface-elev)',
                  border: '1px solid var(--ed-line)',
                  borderRadius: 'var(--ed-radius-lg)',
                  overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                {/* Date block */}
                <div className="flex items-center gap-4" style={{ padding: '20px 20px 0' }}>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{
                      fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic',
                      fontSize: 36, fontWeight: 500, lineHeight: 1, color: 'var(--ed-accent)',
                    }}>
                      {day}
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px dashed var(--ed-line)', paddingLeft: 14 }}>
                    <div style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontSize: 12, fontWeight: 500, color: 'var(--ed-accent)', letterSpacing: '0.05em' }}>
                      {month}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ed-ink-muted)' }}>{weekday}</div>
                    <div style={{ fontSize: 12, color: 'var(--ed-ink-muted)' }}>{time}</div>
                  </div>
                </div>

                {/* Event body */}
                <div style={{ padding: '16px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{
                    fontFamily: 'var(--ed-font-serif)', fontSize: 15, fontWeight: 600,
                    lineHeight: 1.4, marginBottom: 6,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {event.title_zh || event.title}
                  </h3>
                  <p style={{ fontSize: 12.5, color: 'var(--ed-ink-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                    {event.venue_name}{event.venue_name ? ' · ' : ''}{event.is_free ? '免费入场' : event.ticket_price || ''}
                  </p>
                  <div className="flex items-center justify-between mt-auto" style={{ borderTop: '1px dashed var(--ed-line)', paddingTop: 12 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 'var(--ed-radius-pill)',
                      fontSize: 11.5, fontWeight: 500,
                      background: event.is_free ? 'var(--ed-tag-green-bg)' : 'var(--ed-paper-warm)',
                      color: event.is_free ? 'var(--ed-tag-green-text)' : 'var(--ed-ink-soft)',
                    }}>
                      {event.is_free ? '免费' : event.ticket_price || '付费'}
                    </span>
                    <span style={{ fontSize: 12.5, color: 'var(--ed-accent)', fontWeight: 500 }}>
                      我要参加 →
                    </span>
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
