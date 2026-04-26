import { EditorialContainer } from '@/components/editorial/container';
import { EditorialPageHeader } from '@/components/editorial/page-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DMCA 政策 · Baam',
  description: 'Baam平台DMCA版权侵权通知与处理流程',
};

export default function DMCAPage() {
  return (
    <main>
      <EditorialPageHeader
        breadcrumbs={[{ label: '首页', href: '/' }, { label: 'DMCA 政策' }]}
        title="DMCA 政策"
        titleEm="DMCA Policy"
        subtitle="最后更新：2026年4月25日"
      />
      <EditorialContainer className="py-10 pb-20">
        <article className="prose-legal" style={{ maxWidth: 780, margin: '0 auto', fontSize: 14.5, lineHeight: 1.85, color: 'var(--ed-ink-soft)' }}>

          <Section title="概述">
            <p>Baam Inc. 尊重知识产权，并遵守《数字千年版权法》（Digital Millennium Copyright Act, DMCA）。如果您认为本平台上的内容侵犯了您的版权，请按照以下流程提交侵权通知。</p>
          </Section>

          <Section title="提交版权侵权通知">
            <p>根据 DMCA 第 512(c) 条，版权侵权通知必须包含以下信息：</p>
            <ol>
              <li>您的完整法定姓名和联系方式（地址、电话、邮箱）</li>
              <li>对被侵权的受版权保护作品的描述</li>
              <li>涉嫌侵权内容在本平台上的具体位置（URL 链接）</li>
              <li>一份声明，表明您有合理理由相信该内容的使用未经版权所有者或其代理人授权</li>
              <li>一份在伪证处罚下的声明，表明通知中的信息准确无误，且您有权代表版权所有者行事</li>
              <li>版权所有者或其授权代表的签名（电子签名即可）</li>
            </ol>
          </Section>

          <Section title="发送通知">
            <p>请将完整的 DMCA 通知发送至我们的指定代理人：</p>
            <div style={{ padding: '16px 20px', background: 'var(--ed-surface)', border: '1px solid var(--ed-line)', borderRadius: 'var(--ed-radius-md)', marginTop: 8 }}>
              <p style={{ margin: 0 }}>
                <strong>DMCA Designated Agent</strong><br />
                Baam Inc.<br />
                Email: dmca@baam.app<br />
                地址: New York, NY, United States
              </p>
            </div>
          </Section>

          <Section title="处理流程">
            <p>收到有效的 DMCA 通知后，我们将：</p>
            <ol>
              <li>在合理时间内（通常 1-3 个工作日）审核通知</li>
              <li>删除或禁止访问涉嫌侵权的内容</li>
              <li>通知内容发布者其内容已被删除及原因</li>
              <li>记录侵权通知以供法律需要</li>
            </ol>
          </Section>

          <Section title="反通知 (Counter-Notification)">
            <p>如果您认为您的内容被错误删除，您可以提交反通知。反通知必须包含：</p>
            <ol>
              <li>您的完整法定姓名和联系方式</li>
              <li>被删除内容的描述及其原始位置</li>
              <li>一份在伪证处罚下的声明，表明您有合理理由相信该内容是因错误或错误识别而被删除的</li>
              <li>同意接受您所在司法管辖区联邦地区法院管辖的声明</li>
              <li>您的签名（电子签名即可）</li>
            </ol>
            <p>收到有效的反通知后，我们将在 10-14 个工作日内恢复被删除的内容，除非版权所有者在此期间向法院提起诉讼。</p>
          </Section>

          <Section title="重复侵权者政策">
            <p>Baam 实施重复侵权者政策：</p>
            <ul>
              <li>首次侵权：删除侵权内容，向用户发出警告</li>
              <li>第二次侵权：删除内容，暂停发布权限 30 天</li>
              <li>第三次侵权：永久终止用户账户</li>
            </ul>
          </Section>

          <Section title="善意声明">
            <p>请注意，根据 DMCA 第 512(f) 条，故意提交虚假的侵权通知可能导致法律责任，包括损害赔偿和律师费。请确保您的通知真实、准确。</p>
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
        .prose-legal ul, .prose-legal ol { padding-left: 20px; margin: 8px 0; }
        .prose-legal li { margin-bottom: 6px; }
        .prose-legal ul li { list-style-type: disc; }
        .prose-legal ol li { list-style-type: decimal; }
        .prose-legal p { margin: 0; }
      `}</style>
    </section>
  );
}
