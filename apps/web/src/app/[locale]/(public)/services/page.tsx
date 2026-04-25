import { Link } from '@/lib/i18n/routing';
import { EditorialPageHeader } from '@/components/editorial/page-header';
import { EditorialContainer } from '@/components/editorial/container';
import { EditorialCard } from '@/components/editorial/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '实用工具 · Baam',
  description: '纽约华人常用查询工具 — 车辆违规查询、停车罚单查询等免费服务。',
};

const services = [
  {
    href: '/services/vehicle-violations',
    emoji: '🚗',
    title: '车辆违规查询',
    description: '查询纽约市停车罚单、交通摄像头违规记录和缴费状态',
    badge: '免费',
  },
  {
    href: '/services/restaurant-inspections',
    emoji: '🍽️',
    title: '餐厅卫生评分',
    description: '查看任何纽约市餐厅的卫生检查评分、违规记录和检查历史',
    badge: '免费',
  },
  {
    href: '/services/property-tax',
    emoji: '🏠',
    title: '房产税查询',
    description: '查看纽约州任何房产的评估值、房产税和交易历史，覆盖全州62个郡',
    badge: '免费',
  },
  {
    href: '/immigration/visa-screener',
    emoji: '🛡️',
    title: '签证资格AI评估',
    description: '回答几个简单问题，AI帮你分析可能适合的美国签证和移民类别',
    badge: 'AI',
  },
];

export default function ServicesIndexPage() {
  return (
    <main>
      <EditorialPageHeader
        breadcrumbs={[
          { label: '首页', href: '/' },
          { label: '实用工具' },
        ]}
        title="实用工具"
        titleEm="Services"
        subtitle="纽约华人常用查询工具，免费使用"
      />

      <EditorialContainer className="py-8 pb-16" narrow>
        <div className="grid sm:grid-cols-2 gap-5">
          {services.map((service) => (
            <Link key={service.href} href={service.href} className="group block">
              <EditorialCard className="p-6 h-full">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center flex-shrink-0" style={{
                    width: 56, height: 56, borderRadius: 'var(--ed-radius-lg)',
                    background: 'rgba(199,62,29,0.06)', fontSize: 28,
                  }}>
                    {service.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 16, fontWeight: 700 }}>{service.title}</h2>
                      {service.badge && (
                        <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 'var(--ed-radius-pill)', background: 'var(--ed-tag-green-bg)', color: 'var(--ed-tag-green-text)', fontWeight: 600 }}>
                          {service.badge}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13.5, color: 'var(--ed-ink-soft)', lineHeight: 1.6 }}>{service.description}</p>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ed-ink-muted)', flexShrink: 0, marginTop: 4 }}><path d="M9 5l7 7-7 7" /></svg>
                </div>
              </EditorialCard>
            </Link>
          ))}
        </div>
      </EditorialContainer>
    </main>
  );
}
