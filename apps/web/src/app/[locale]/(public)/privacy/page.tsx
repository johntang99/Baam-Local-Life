import { EditorialContainer } from '@/components/editorial/container';
import { EditorialPageHeader } from '@/components/editorial/page-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '隐私政策 · Baam',
  description: 'Baam平台隐私政策与数据保护说明',
};

export default function PrivacyPage() {
  return (
    <main>
      <EditorialPageHeader
        breadcrumbs={[{ label: '首页', href: '/' }, { label: '隐私政策' }]}
        title="隐私政策"
        titleEm="Privacy Policy"
        subtitle="最后更新：2026年4月25日"
      />
      <EditorialContainer className="py-10 pb-20">
        <article className="prose-legal" style={{ maxWidth: 780, margin: '0 auto', fontSize: 14.5, lineHeight: 1.85, color: 'var(--ed-ink-soft)' }}>

          <Section title="1. 概述">
            <p>Baam Inc.（以下简称"我们"）非常重视您的隐私。本隐私政策说明我们如何收集、使用、存储和保护您的个人信息。</p>
          </Section>

          <Section title="2. 我们收集的信息">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ed-ink)', marginBottom: 6, marginTop: 8 }}>2.1 您主动提供的信息</h3>
            <ul>
              <li>注册信息：邮箱地址、用户名、显示名称</li>
              <li>个人资料：头像、简介、联系方式（可选）</li>
              <li>用户发布的内容：帖子、评论、图片、视频</li>
              <li>分类信息中的联系方式（电话、微信、邮箱）</li>
              <li>商家认领请求中的商业信息</li>
            </ul>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ed-ink)', marginBottom: 6, marginTop: 8 }}>2.2 自动收集的信息</h3>
            <ul>
              <li>设备信息：浏览器类型、操作系统、设备标识</li>
              <li>使用数据：页面浏览、点击行为、搜索查询</li>
              <li>位置信息：基于 IP 的大致位置（非精确定位）</li>
              <li>Cookie 和类似技术（详见第 5 节）</li>
            </ul>
          </Section>

          <Section title="3. 信息使用目的">
            <p>我们使用收集的信息用于：</p>
            <ul>
              <li>提供和改进平台服务</li>
              <li>个性化您的使用体验（如推荐本地商家和内容）</li>
              <li>AI 助手的查询处理（查询内容可能被用于改进 AI 回答质量）</li>
              <li>发送服务通知和更新</li>
              <li>防止欺诈、垃圾信息和滥用行为</li>
              <li>遵守法律要求</li>
            </ul>
          </Section>

          <Section title="4. 信息共享">
            <p>我们不会出售您的个人信息。我们仅在以下情况下共享信息：</p>
            <ul>
              <li><strong>服务提供商：</strong>我们使用 Supabase（数据库/认证）、OpenAI/Anthropic（AI 服务）、Vercel（托管）等第三方服务。这些服务商仅在为我们提供服务所需的范围内处理数据。</li>
              <li><strong>公开内容：</strong>您在 Discover、论坛等公开区域发布的内容对所有用户可见。</li>
              <li><strong>法律要求：</strong>在法律要求或法律程序需要的情况下。</li>
              <li><strong>业务转让：</strong>在合并、收购或资产出售的情况下。</li>
            </ul>
          </Section>

          <Section title="5. Cookie 与追踪技术">
            <p>我们使用以下技术：</p>
            <ul>
              <li><strong>必要 Cookie：</strong>用于认证、会话管理和语言偏好</li>
              <li><strong>分析 Cookie：</strong>帮助我们了解用户如何使用平台（如页面浏览量、功能使用率）</li>
              <li><strong>本地存储：</strong>保存用户偏好设置（如繁简体选择）</li>
            </ul>
            <p>您可以通过浏览器设置管理 Cookie 偏好。禁用 Cookie 可能影响部分功能。</p>
          </Section>

          <Section title="6. 数据安全">
            <p>我们采取合理的技术和管理措施保护您的信息：</p>
            <ul>
              <li>数据传输使用 HTTPS 加密</li>
              <li>数据库使用行级安全策略 (RLS)</li>
              <li>密码使用单向哈希加密存储</li>
              <li>定期审查访问权限和安全实践</li>
            </ul>
            <p>尽管我们努力保护数据安全，但无法保证绝对安全。如发现安全漏洞，请联系 security@baam.app。</p>
          </Section>

          <Section title="7. 数据保留">
            <ul>
              <li>账户信息在您的账户活跃期间保留</li>
              <li>删除账户后，我们将在 30 天内删除个人数据（法律要求保留的除外）</li>
              <li>匿名化的统计数据可能被无限期保留</li>
              <li>AI 助手的查询记录在 90 天后自动清除</li>
            </ul>
          </Section>

          <Section title="8. 您的权利">
            <p>您有权：</p>
            <ul>
              <li><strong>访问：</strong>请求获取我们持有的您的个人信息副本</li>
              <li><strong>更正：</strong>更新或修正不准确的个人信息</li>
              <li><strong>删除：</strong>请求删除您的个人信息和账户</li>
              <li><strong>导出：</strong>请求以机器可读格式导出您的数据</li>
              <li><strong>撤回同意：</strong>在依赖同意处理数据的情况下，您可以随时撤回</li>
            </ul>
            <p>行使上述权利，请联系 privacy@baam.app。我们将在 30 天内响应您的请求。</p>
          </Section>

          <Section title="9. 儿童隐私">
            <p>本平台不面向 13 岁以下儿童。我们不会故意收集 13 岁以下儿童的个人信息。如果您发现我们可能收集了儿童信息，请立即联系我们。</p>
          </Section>

          <Section title="10. 加州居民权利 (CCPA)">
            <p>如果您是加州居民，您有额外的权利：</p>
            <ul>
              <li>知情权：了解我们收集和使用您个人信息的类别和目的</li>
              <li>删除权：请求删除您的个人信息</li>
              <li>不被歧视的权利：行使隐私权利不会导致服务质量下降</li>
            </ul>
            <p>我们不出售个人信息，因此不需要提供"不要出售我的信息"选项。</p>
          </Section>

          <Section title="11. 政策变更">
            <p>我们可能会更新本隐私政策。重大变更将通过平台通知或邮件告知。继续使用平台即表示接受更新后的政策。</p>
          </Section>

          <Section title="12. 联系我们">
            <p>如对本隐私政策有任何疑问，请联系：</p>
            <p>
              Baam Inc.<br />
              Email: privacy@baam.app<br />
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
