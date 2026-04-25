import { NewsletterForm } from '@/components/shared/newsletter-form';

export function NewsletterSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'var(--ed-ink)', padding: '80px 0' }}
    >
      {/* Radial accent gradients */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 40% 60% at 20% 50%, rgba(199, 62, 29, 0.15), transparent 60%), radial-gradient(ellipse 40% 60% at 80% 50%, rgba(212, 160, 23, 0.12), transparent 60%)',
      }} />

      <div className="relative" style={{ maxWidth: 560, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
        {/* Kicker */}
        <div
          className="flex items-center justify-center gap-3"
          style={{
            fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic',
            fontSize: 13, color: 'var(--ed-ink-muted)', marginBottom: 24,
          }}
        >
          <span>—</span>
          <span>Join the neighborhood</span>
          <span>—</span>
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: 'var(--ed-font-serif)',
          fontSize: 'clamp(26px, 3.2vw, 36px)',
          fontWeight: 700, lineHeight: 1.25,
          color: 'var(--ed-paper)', marginBottom: 16,
        }}>
          每周一次，<br />
          <span style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontWeight: 400, color: 'var(--ed-amber-soft)' }}>
            the good stuff
          </span>{' '}
          送到信箱
        </h2>

        {/* Subtitle */}
        <p style={{ fontSize: 14.5, color: 'rgba(251, 246, 236, 0.7)', lineHeight: 1.7, marginBottom: 32 }}>
          新开餐厅、本周活动、生活省钱攻略、邻居都在聊什么 —— 一封邮件，5 分钟读完。
        </p>

        {/* Email form */}
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="你的邮箱地址"
            className="flex-1 outline-none"
            style={{
              height: 48, padding: '0 20px',
              background: 'rgba(251, 246, 236, 0.08)',
              border: '1px solid rgba(251, 246, 236, 0.15)',
              borderRadius: 'var(--ed-radius-pill)', color: 'var(--ed-paper)',
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            className="flex-shrink-0 transition-all hover:-translate-y-px"
            style={{
              height: 48, padding: '0 28px',
              background: 'var(--ed-accent)', color: 'var(--ed-paper)',
              borderRadius: 'var(--ed-radius-pill)', fontSize: 14, fontWeight: 500,
              border: 'none', cursor: 'pointer',
            }}
          >
            订阅
          </button>
        </div>
      </div>
    </section>
  );
}
