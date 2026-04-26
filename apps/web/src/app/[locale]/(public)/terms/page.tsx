import { EditorialContainer } from '@/components/editorial/container';
import { EditorialPageHeader } from '@/components/editorial/page-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '服务条款 · Baam',
  description: 'Baam平台服务条款与用户协议',
};

export default function TermsPage() {
  return (
    <main>
      <EditorialPageHeader
        breadcrumbs={[{ label: '首页', href: '/' }, { label: '服务条款' }]}
        title="服务条款"
        titleEm="Terms of Service"
        subtitle="最后更新：2026年4月25日"
      />
      <EditorialContainer className="py-10 pb-20">
        <article className="prose-legal" style={{ maxWidth: 780, margin: '0 auto', fontSize: 14.5, lineHeight: 1.85, color: 'var(--ed-ink-soft)' }}>

          <Section title="1. 接受条款">
            <p>欢迎使用 Baam（以下简称"本平台"）。本平台由 Baam Inc. 运营。访问或使用本平台即表示您同意受本服务条款（以下简称"条款"）的约束。如果您不同意这些条款，请勿使用本平台。</p>
            <p>We may update these Terms from time to time. Continued use of the platform after changes constitutes acceptance of the revised Terms.</p>
          </Section>

          <Section title="2. 服务说明">
            <p>Baam 是一个面向华人社区的本地生活信息平台，提供以下服务：</p>
            <ul>
              <li>新闻资讯与生活指南内容</li>
              <li>商家目录与搜索服务</li>
              <li>社区发现（"逛逛晒晒"）用户生成内容平台</li>
              <li>分类信息（房屋、招聘、二手等）</li>
              <li>AI 智能助手服务</li>
              <li>社区活动与优惠信息</li>
            </ul>
          </Section>

          <Section title="3. 用户账户">
            <p>部分功能需要注册账户。您需要：</p>
            <ul>
              <li>提供准确、完整的注册信息</li>
              <li>妥善保管账户密码，对账户下的所有活动负责</li>
              <li>发现账户被盗用时立即通知我们</li>
              <li>年满 13 周岁方可创建账户</li>
            </ul>
          </Section>

          <Section title="4. 用户生成内容 (UGC)">
            <p>本平台的"逛逛晒晒"（Discover）、分类信息（Classifieds，包括房屋出租、招聘、二手交易、求助等）、论坛等板块允许用户发布内容。这些板块中的内容由用户自行创建和发布，Baam 仅提供平台托管服务。关于用户生成内容：</p>
            <ul>
              <li><strong>所有权：</strong>您保留您发布内容的所有权。但您授予 Baam 一项非独占、免版税、全球性的许可，允许我们在平台上展示、分发、推广您的内容。</li>
              <li><strong>责任：</strong>您对自己发布的所有内容承担全部法律责任。Baam 作为平台不对用户发布的内容负责。</li>
              <li><strong>内容审核：</strong>Baam 保留审核、编辑或删除任何违反本条款或社区规范内容的权利，但无义务预先审查所有内容。</li>
              <li><strong>许可终止：</strong>当您删除内容时，上述许可将在合理时间内终止，但已被分享或缓存的副本可能仍会存在。</li>
            </ul>
          </Section>

          <Section title="5. 禁止行为">
            <p>使用本平台时，您不得：</p>
            <ul>
              <li>发布违法、诽谤、骚扰、威胁、歧视或仇恨性内容</li>
              <li>发布侵犯他人知识产权的内容</li>
              <li>发布虚假或误导性信息</li>
              <li>冒充他人身份或虚假代表</li>
              <li>发布垃圾信息或未经授权的商业广告</li>
              <li>收集其他用户的个人信息</li>
              <li>干扰平台的正常运行或安全性</li>
              <li>利用自动化工具批量抓取内容</li>
            </ul>
          </Section>

          <Section title="6. 知识产权">
            <p>本平台的原创内容（包括但不限于编辑文章、设计、代码、商标）归 Baam Inc. 所有，受版权法和知识产权法保护。</p>
            <p>如果您认为平台上的内容侵犯了您的版权，请参阅我们的 <a href="/zh/dmca" style={{ color: 'var(--ed-accent)' }}>DMCA 政策</a> 提交版权侵权通知。</p>
          </Section>

          <Section title="7. 免责声明">
            <ul>
              <li>本平台"按原样"提供，不做任何明示或暗示的保证。</li>
              <li>AI 助手提供的信息仅供参考，不构成专业建议（法律、医疗、税务等）。</li>
              <li>我们不保证商家信息的准确性或时效性。</li>
              <li>用户间的交易（如分类信息中的租房、招聘、二手买卖）由用户自行负责，Baam 不参与任何交易环节，不对交易结果承担责任。</li>
            </ul>
          </Section>

          <Section title="8. 责任限制">
            <p>在法律允许的最大范围内，Baam Inc. 及其董事、员工不对因使用本平台而产生的任何间接、偶然、特殊或惩罚性损害承担责任。</p>
          </Section>

          <Section title="9. 账户终止">
            <p>我们保留因违反本条款而暂停或终止用户账户的权利。被终止的用户可以联系我们申诉。</p>
          </Section>

          <Section title="10. 适用法律">
            <p>本条款受美国纽约州法律管辖。任何因本条款引起的争议应提交至纽约州有管辖权的法院解决。</p>
          </Section>

          <Section title="11. 联系我们">
            <p>如对本条款有任何疑问，请联系：</p>
            <p>
              Baam Inc.<br />
              Email: legal@baam.app<br />
              地址: New York, NY
            </p>
          </Section>
        </article>
      </EditorialContainer>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ed-ink)', marginBottom: 12 }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
      <style>{`
        .prose-legal ul { padding-left: 20px; margin: 8px 0; }
        .prose-legal li { margin-bottom: 6px; list-style-type: disc; }
        .prose-legal p { margin: 0; }
      `}</style>
    </section>
  );
}
