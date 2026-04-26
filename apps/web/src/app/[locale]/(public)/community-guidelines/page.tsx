import { EditorialContainer } from '@/components/editorial/container';
import { EditorialPageHeader } from '@/components/editorial/page-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '社区规范 · Baam',
  description: 'Baam社区内容发布规范与行为准则',
};

export default function CommunityGuidelinesPage() {
  return (
    <main>
      <EditorialPageHeader
        breadcrumbs={[{ label: '首页', href: '/' }, { label: '社区规范' }]}
        title="社区规范"
        titleEm="Community Guidelines"
        subtitle="最后更新：2026年4月25日"
      />
      <EditorialContainer className="py-10 pb-20">
        <article className="prose-legal" style={{ maxWidth: 780, margin: '0 auto', fontSize: 14.5, lineHeight: 1.85, color: 'var(--ed-ink-soft)' }}>

          <div style={{ padding: '20px 24px', background: 'var(--ed-surface)', border: '1px solid var(--ed-line)', borderRadius: 'var(--ed-radius-lg)', marginBottom: 36 }}>
            <p style={{ margin: 0 }}>
              Baam 的"逛逛晒晒"（Discover）和"分类信息"（Classifieds）版块是由用户创建和分享内容的社区空间。Discover 用于分享生活发现和社区动态；分类信息用于发布房屋出租、招聘、二手交易、求助等实用信息。所有内容均由用户自行发布，Baam 仅提供平台托管服务。我们希望每位用户都能在这里获得积极、安全的体验。请在使用这些功能时遵守以下规范。
            </p>
          </div>

          <Section title="我们鼓励的内容" emoji="✅">
            <ul>
              <li>分享真实的本地生活经验和发现</li>
              <li>有价值的社区信息和互助内容</li>
              <li>对商家、餐厅、服务的真实评价和推荐</li>
              <li>实用的生活攻略和经验分享</li>
              <li>社区活动信息和志愿服务</li>
              <li>友善、尊重的交流和讨论</li>
            </ul>
          </Section>

          <Section title="禁止的内容" emoji="🚫">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ed-ink)', marginBottom: 6, marginTop: 8 }}>仇恨与骚扰</h3>
            <ul>
              <li>基于种族、民族、宗教、性别、性取向、残疾等的歧视或仇恨言论</li>
              <li>对个人的骚扰、威胁、恐吓或人身攻击</li>
              <li>人肉搜索（公开他人私人信息）</li>
            </ul>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ed-ink)', marginBottom: 6, marginTop: 8 }}>违法内容</h3>
            <ul>
              <li>推广或宣传违法活动</li>
              <li>销售违禁品或非法服务</li>
              <li>未经授权使用他人知识产权的内容</li>
              <li>涉及未成年人的不当内容</li>
            </ul>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ed-ink)', marginBottom: 6, marginTop: 8 }}>虚假与误导</h3>
            <ul>
              <li>刻意传播虚假信息或谣言</li>
              <li>虚假的商家评价（刷好评或恶意差评）</li>
              <li>冒充他人身份发布内容</li>
              <li>欺诈性质的分类信息</li>
            </ul>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ed-ink)', marginBottom: 6, marginTop: 8 }}>垃圾信息</h3>
            <ul>
              <li>重复发布相同或高度相似的内容</li>
              <li>未标注的商业推广内容</li>
              <li>大量发布与社区无关的链接或广告</li>
              <li>使用自动化工具批量发帖</li>
            </ul>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ed-ink)', marginBottom: 6, marginTop: 8 }}>不适当内容</h3>
            <ul>
              <li>色情或露骨的性内容</li>
              <li>过度暴力或血腥的图片/视频</li>
              <li>宣传自我伤害或自杀的内容</li>
            </ul>
          </Section>

          <Section title="分类信息特别规定" emoji="📋">
            <ul>
              <li>房屋信息必须真实，不得虚构价格或地址</li>
              <li>招聘信息必须合法，不得有歧视性条件</li>
              <li>二手交易物品必须如实描述品相</li>
              <li>联系方式必须为发布者本人或其授权代理</li>
              <li>同一信息不得重复发布，已过期信息请及时删除</li>
            </ul>
          </Section>

          <Section title="举报机制" emoji="🛡️">
            <p>如果您发现违反社区规范的内容：</p>
            <ul>
              <li>点击内容旁的"举报"按钮，选择违规类型</li>
              <li>或发送邮件至 report@baam.app，附上内容链接和违规说明</li>
            </ul>
            <p>我们承诺在收到举报后 <strong>48 小时内</strong> 进行审核处理。举报者的身份将严格保密。</p>
          </Section>

          <Section title="违规处理" emoji="⚖️">
            <p>根据违规严重程度，我们可能采取以下措施：</p>
            <ul>
              <li><strong>警告：</strong>首次轻微违规，我们会发送提醒</li>
              <li><strong>内容删除：</strong>删除违规内容并通知发布者</li>
              <li><strong>临时禁言：</strong>限制发布权限 7-30 天</li>
              <li><strong>永久封禁：</strong>严重或屡次违规的账户将被永久停用</li>
            </ul>
            <p>用户有权对处理结果提出申诉，请联系 appeals@baam.app。</p>
          </Section>

          <Section title="版权与知识产权" emoji="©️">
            <p>发布内容时请确保：</p>
            <ul>
              <li>您是内容的原创作者，或已获得合法授权</li>
              <li>引用他人内容时注明来源</li>
              <li>不要上传未经授权的受版权保护的图片、视频或文字</li>
            </ul>
            <p>版权侵权投诉请参阅我们的 <a href="/zh/dmca" style={{ color: 'var(--ed-accent)' }}>DMCA 政策</a>。</p>
          </Section>

          <Section title="联系我们" emoji="📧">
            <p>如对社区规范有任何疑问，请联系：</p>
            <p>
              Email: community@baam.app
            </p>
          </Section>
        </article>
      </EditorialContainer>
    </main>
  );
}

function Section({ title, emoji, children }: { title: string; emoji?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ed-ink)', marginBottom: 12 }}>
        {emoji && <span style={{ marginRight: 8 }}>{emoji}</span>}
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
