import { Link } from '@/lib/i18n/routing';

export function EditorialFooter() {
  return (
    <footer style={{ background: 'var(--ed-paper)', padding: '60px 0 32px', borderTop: '1px solid var(--ed-line)' }}>
      <div style={{ maxWidth: 'var(--ed-container-max)', margin: '0 auto', padding: '0 32px' }}>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-12 mb-12" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-3.5">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 32, height: 32,
                  background: 'var(--ed-ink)', color: 'var(--ed-paper)',
                  borderRadius: 9,
                  fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic',
                  fontSize: 16, fontWeight: 500,
                }}
              >
                B
              </div>
              <div style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 18, fontWeight: 600 }}>
                Baam
                <span style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontWeight: 400, color: 'var(--ed-ink-muted)', fontSize: 14, marginLeft: 4 }}>
                  纽约
                </span>
              </div>
            </Link>
            <p style={{ fontSize: 13, color: 'var(--ed-ink-muted)', lineHeight: 1.7, maxWidth: 280 }}>
              AI 驱动的纽约华人本地生活与商家增长平台。新闻、资讯、论坛、商家、达人，一站式解决本地生活问题。
            </p>
          </div>

          {/* Quick Nav */}
          <div>
            <h4 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>快速导航</h4>
            <ul className="flex flex-col gap-2.5" style={{ listStyle: 'none' }}>
              {[
                { href: '/helper-2', label: 'AI 小帮手' },
                { href: '/news', label: '新闻资讯' },
                { href: '/guides', label: '生活指南' },
                { href: '/businesses', label: '商家目录' },
                { href: '/forum', label: '论坛' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-ed-accent" style={{ fontSize: 13, color: 'var(--ed-ink-muted)' }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Business Services */}
          <div>
            <h4 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>商家服务</h4>
            <ul className="flex flex-col gap-2.5" style={{ listStyle: 'none' }}>
              {[
                { href: '/businesses/register', label: '商家入驻' },
                { href: '/contact', label: '广告合作' },
                { href: '/contact', label: '达人申请' },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="transition-colors hover:text-ed-accent" style={{ fontSize: 13, color: 'var(--ed-ink-muted)' }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>关于 Baam</h4>
            <ul className="flex flex-col gap-2.5" style={{ listStyle: 'none' }}>
              {[
                { href: '/about', label: '关于我们' },
                { href: '/contact', label: '联系方式' },
                { href: '/terms', label: '服务条款' },
                { href: '/privacy', label: '隐私政策' },
                { href: '/community-guidelines', label: '社区规范' },
                { href: '/dmca', label: 'DMCA' },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="transition-colors hover:text-ed-accent" style={{ fontSize: 13, color: 'var(--ed-ink-muted)' }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="flex justify-between items-center flex-wrap gap-4"
          style={{ paddingTop: 24, borderTop: '1px solid var(--ed-line)', fontSize: 12, color: 'var(--ed-ink-muted)' }}
        >
          <div>
            © 2026 Baam ·{' '}
            <span style={{ fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic' }}>Made in NYC</span>
          </div>
          <div>微信公众号 · Facebook · Instagram · 小红书</div>
        </div>
      </div>
    </footer>
  );
}
