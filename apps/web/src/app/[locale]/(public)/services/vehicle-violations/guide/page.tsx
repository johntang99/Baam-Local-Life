import { Link } from '@/lib/i18n/routing';
import { PageContainer } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import { ServiceFAQ } from '@/components/services/service-faq';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '如何查看纽约州完整驾驶违规记录 | NYS Driving Record Guide · Baam',
  description: '中文图文教程：如何在NYS DMV官网查看你的完整驾驶记录，包括警察开具的交通违规罚单、扣分、暂停/吊销记录。',
  keywords: ['纽约驾驶记录查询', 'NYS DMV abstract', '交通违规记录', '驾照扣分查询', 'MyDMV', '罚单查询'],
};

const FAQ_ITEMS = [
  {
    question: '驾驶记录（Abstract）上显示哪些信息？',
    answer: '标准驾驶记录包括：驾照类别和状态、所有交通违规定罪（保留3年+当年）、酒驾记录（DWI保留15年、DWAI保留10年）、暂停/吊销记录（保留4年）、事故记录、累计扣分等。这比我们的免费罚单查询工具覆盖范围更广，包括警察现场开具的所有移动违规罚单。',
  },
  {
    question: '查询费用是多少？',
    answer: '网上查询$7，DMV办公室现场查询$10。网上查询后，记录在MyDMV账户中保留5天，可随时查看和下载。',
  },
  {
    question: '我需要什么才能在网上查询？',
    answer: '你需要一个NY.gov ID账户（免费注册）。注册需要：驾照上的Client ID号码或Document Number、出生日期、DMV存档的地址信息（州和邮编）、社会安全号码后4位。首次注册还需要设置双因素认证。',
  },
  {
    question: '免费罚单查询工具和付费驾驶记录有什么区别？',
    answer: '我们的免费工具只能查询NYC停车罚单和摄像头罚单（闯红灯摄像头、超速摄像头）。付费的DMV驾驶记录（Abstract）包含所有类型的违规：警察现场开具的罚单（闯红灯、闯停车标志、超速等移动违规）、扣分情况、驾照暂停/吊销记录等。如果你想查看完整记录，需要通过DMV官网付费查询。',
  },
];

export default function DrivingRecordGuidePage() {
  return (
    <main>
      <PageContainer className="max-w-3xl py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-text-muted mb-6">
        <Link href="/" className="hover:text-primary">首页</Link>
        <span className="mx-2">/</span>
        <Link href="/services" className="hover:text-primary">实用工具</Link>
        <span className="mx-2">/</span>
        <Link href="/services/vehicle-violations" className="hover:text-primary">车辆违规查询</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">完整驾驶记录查询指南</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl fw-bold text-text-primary mb-2">如何查看纽约州完整驾驶违规记录</h1>
        <p className="text-text-muted">NYS DMV Driving Record (Abstract) 查询中文指南</p>
      </div>

      {/* Why You Need This */}
      <Card className="bg-accent-yellow/20 border-accent-yellow p-5 mb-8">
        <h2 className="text-sm fw-bold text-amber-900 mb-2 flex items-center gap-2">
          <span>⚠️</span> 为什么需要查看完整驾驶记录？
        </h2>
        <p className="text-sm text-accent-yellow leading-relaxed">
          我们的<Link href="/services/vehicle-violations" className="text-primary fw-medium underline">免费罚单查询工具</Link>只能查到NYC停车罚单和摄像头罚单。
          如果你收到的是<strong>警察现场开具的交通罚单</strong>（如闯红灯、闯停车标志、超速、不让行人等），
          这些属于<strong>移动违规（Moving Violations）</strong>，不在NYC Open Data中，需要通过NYS DMV查看。
        </p>
      </Card>

      {/* Coverage Comparison */}
      <Card className="r-xl p-6 mb-8">
        <h2 className="text-lg fw-bold text-text-primary mb-4">两种查询方式对比</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-bg-page">
                <th className="text-left px-3 py-2 border border-border fw-semibold">查询内容</th>
                <th className="text-center px-3 py-2 border border-border fw-semibold">Baam免费工具</th>
                <th className="text-center px-3 py-2 border border-border fw-semibold">DMV驾驶记录($7)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="px-3 py-2 border border-border">停车罚单（咪表、消防栓等）</td><td className="px-3 py-2 border border-border text-center text-accent-green fw-bold">✓</td><td className="px-3 py-2 border border-border text-center text-text-muted">✕</td></tr>
              <tr><td className="px-3 py-2 border border-border">摄像头罚单（闯红灯、超速摄像头）</td><td className="px-3 py-2 border border-border text-center text-accent-green fw-bold">✓</td><td className="px-3 py-2 border border-border text-center text-accent-green fw-bold">✓</td></tr>
              <tr><td className="px-3 py-2 border border-border fw-medium">警察开具的移动违规罚单</td><td className="px-3 py-2 border border-border text-center text-accent-red fw-bold">✕</td><td className="px-3 py-2 border border-border text-center text-accent-green fw-bold">✓</td></tr>
              <tr><td className="px-3 py-2 border border-border fw-medium">驾照扣分情况</td><td className="px-3 py-2 border border-border text-center text-accent-red fw-bold">✕</td><td className="px-3 py-2 border border-border text-center text-accent-green fw-bold">✓</td></tr>
              <tr><td className="px-3 py-2 border border-border fw-medium">驾照暂停/吊销记录</td><td className="px-3 py-2 border border-border text-center text-accent-red fw-bold">✕</td><td className="px-3 py-2 border border-border text-center text-accent-green fw-bold">✓</td></tr>
              <tr><td className="px-3 py-2 border border-border">酒驾/醉驾记录</td><td className="px-3 py-2 border border-border text-center text-accent-red fw-bold">✕</td><td className="px-3 py-2 border border-border text-center text-accent-green fw-bold">✓</td></tr>
              <tr><td className="px-3 py-2 border border-border">事故记录</td><td className="px-3 py-2 border border-border text-center text-accent-red fw-bold">✕</td><td className="px-3 py-2 border border-border text-center text-accent-green fw-bold">✓</td></tr>
              <tr className="bg-bg-page"><td className="px-3 py-2 border border-border fw-bold">费用</td><td className="px-3 py-2 border border-border text-center fw-bold text-accent-green">免费</td><td className="px-3 py-2 border border-border text-center fw-bold">$7（网上）/ $10（现场）</td></tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Step by Step Guide */}
      <Card className="r-xl p-6 mb-8">
        <h2 className="text-lg fw-bold text-text-primary mb-6">网上查询步骤（$7，最方便）</h2>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-primary text-text-inverse r-full flex items-center justify-center text-sm fw-bold flex-shrink-0">1</div>
            <div className="flex-1">
              <h3 className="text-sm fw-bold text-text-primary mb-1">注册 NY.gov ID 账户（如果还没有）</h3>
              <p className="text-sm text-text-secondary mb-2">
                访问 <a href="https://my.ny.gov/" target="_blank" rel="noopener noreferrer" className="text-primary underline">my.ny.gov</a> 点击 &ldquo;Create Account&rdquo;
              </p>
              <div className="bg-bg-page r-lg p-3 text-xs text-text-secondary">
                <p className="fw-medium mb-1">注册需要准备：</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li><strong>Client ID</strong> 或 <strong>Document Number</strong>（在驾照正面或背面）</li>
                  <li>出生日期</li>
                  <li>DMV存档的地址（州和邮编）</li>
                  <li>社会安全号码（SSN）后4位</li>
                </ul>
                <p className="mt-2 text-amber-600">💡 提示：Client ID是驾照正面的一组数字。如果找不到，带驾照去任何DMV办公室即可查询。</p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-primary text-text-inverse r-full flex items-center justify-center text-sm fw-bold flex-shrink-0">2</div>
            <div className="flex-1">
              <h3 className="text-sm fw-bold text-text-primary mb-1">登录 MyDMV</h3>
              <p className="text-sm text-text-secondary">
                访问 <a href="https://my.dmv.ny.gov/" target="_blank" rel="noopener noreferrer" className="text-primary underline">my.dmv.ny.gov</a>，用你的 NY.gov ID 登录
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-primary text-text-inverse r-full flex items-center justify-center text-sm fw-bold flex-shrink-0">3</div>
            <div className="flex-1">
              <h3 className="text-sm fw-bold text-text-primary mb-1">选择 &ldquo;Get My Driving Record&rdquo;</h3>
              <p className="text-sm text-text-secondary">
                在MyDMV仪表板中，找到 &ldquo;My Records&rdquo; 或 &ldquo;Get My Driving Record&rdquo; 选项
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-primary text-text-inverse r-full flex items-center justify-center text-sm fw-bold flex-shrink-0">4</div>
            <div className="flex-1">
              <h3 className="text-sm fw-bold text-text-primary mb-1">选择记录类型并付款</h3>
              <p className="text-sm text-text-secondary mb-2">
                选择 <strong>&ldquo;Standard Driving Abstract&rdquo;</strong>（标准驾驶记录），费用 $7，支持信用卡/借记卡
              </p>
              <div className="bg-secondary-50 r-lg p-3 text-xs text-secondary-dark">
                <p className="fw-medium mb-1">三种记录类型：</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li><strong>Standard（标准）$7</strong> — 最近3年+当年的违规，推荐大多数人选择</li>
                  <li><strong>Lifetime（终身）$7</strong> — 所有历史违规记录</li>
                  <li><strong>CDL（商用驾照）$7</strong> — 商用驾照持有者专用</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-primary text-text-inverse r-full flex items-center justify-center text-sm fw-bold flex-shrink-0">5</div>
            <div className="flex-1">
              <h3 className="text-sm fw-bold text-text-primary mb-1">查看和下载记录</h3>
              <p className="text-sm text-text-secondary">
                付款后立即可以查看记录。记录在MyDMV中保留<strong>5天</strong>，建议立即下载PDF保存。
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Understanding Your Record */}
      <Card className="r-xl p-6 mb-8">
        <h2 className="text-lg fw-bold text-text-primary mb-4">如何看懂驾驶记录</h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm fw-bold text-text-primary mb-1">扣分系统（Point System）</h3>
            <p className="text-sm text-text-secondary mb-2">纽约州的交通违规扣分制度：18个月内累计11分将被暂停驾照。</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-bg-page">
                    <th className="text-left px-2 py-1.5 border border-border">违规类型</th>
                    <th className="text-left px-2 py-1.5 border border-border">英文</th>
                    <th className="text-center px-2 py-1.5 border border-border">扣分</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="px-2 py-1.5 border border-border">超速1-10 mph</td><td className="px-2 py-1.5 border border-border">Speeding 1-10 mph over</td><td className="px-2 py-1.5 border border-border text-center fw-bold">3分</td></tr>
                  <tr><td className="px-2 py-1.5 border border-border">超速11-20 mph</td><td className="px-2 py-1.5 border border-border">Speeding 11-20 mph over</td><td className="px-2 py-1.5 border border-border text-center fw-bold">4分</td></tr>
                  <tr><td className="px-2 py-1.5 border border-border">超速21-30 mph</td><td className="px-2 py-1.5 border border-border">Speeding 21-30 mph over</td><td className="px-2 py-1.5 border border-border text-center fw-bold">6分</td></tr>
                  <tr><td className="px-2 py-1.5 border border-border">超速31-40 mph</td><td className="px-2 py-1.5 border border-border">Speeding 31-40 mph over</td><td className="px-2 py-1.5 border border-border text-center fw-bold">8分</td></tr>
                  <tr><td className="px-2 py-1.5 border border-border">超速40+ mph</td><td className="px-2 py-1.5 border border-border">Speeding 41+ mph over</td><td className="px-2 py-1.5 border border-border text-center fw-bold">11分</td></tr>
                  <tr><td className="px-2 py-1.5 border border-border">闯红灯</td><td className="px-2 py-1.5 border border-border">Failure to stop for red light</td><td className="px-2 py-1.5 border border-border text-center fw-bold">3分</td></tr>
                  <tr><td className="px-2 py-1.5 border border-border">闯停车标志</td><td className="px-2 py-1.5 border border-border">Failure to stop for stop sign</td><td className="px-2 py-1.5 border border-border text-center fw-bold">3分</td></tr>
                  <tr><td className="px-2 py-1.5 border border-border">不当变道</td><td className="px-2 py-1.5 border border-border">Improper lane change</td><td className="px-2 py-1.5 border border-border text-center fw-bold">3分</td></tr>
                  <tr><td className="px-2 py-1.5 border border-border">尾随过近</td><td className="px-2 py-1.5 border border-border">Following too closely</td><td className="px-2 py-1.5 border border-border text-center fw-bold">4分</td></tr>
                  <tr><td className="px-2 py-1.5 border border-border">使用手机（手持）</td><td className="px-2 py-1.5 border border-border">Cell phone use</td><td className="px-2 py-1.5 border border-border text-center fw-bold">5分</td></tr>
                  <tr><td className="px-2 py-1.5 border border-border">鲁莽驾驶</td><td className="px-2 py-1.5 border border-border">Reckless driving</td><td className="px-2 py-1.5 border border-border text-center fw-bold">5分</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-sm fw-bold text-text-primary mb-1">记录保留时间</h3>
            <ul className="text-sm text-text-secondary list-disc list-inside space-y-0.5">
              <li>普通交通违规：当年 + 3年</li>
              <li>酒后驾车（DWAI）：10年</li>
              <li>醉酒驾驶（DWI）：15年</li>
              <li>驾照暂停/吊销：结束后4年</li>
              <li>拒绝酒精测试：结束后5年</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* In-Person Alternative */}
      <div className="bg-bg-card border border-border r-xl p-6 mb-8">
        <h2 className="text-lg fw-bold text-text-primary mb-3">不方便上网？去DMV现场查询</h2>
        <p className="text-sm text-text-secondary mb-3">
          你也可以到任何NYS DMV办公室现场查询，费用$10。
        </p>
        <div className="bg-bg-page r-lg p-3 text-xs text-text-secondary">
          <p className="fw-medium mb-1">现场查询需要带：</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>填好的 <strong>MV-15C表格</strong>（可在DMV官网下载打印）</li>
            <li>身份证明（驾照、政府发的Photo ID、或6分ID文件）</li>
            <li>$10费用（现金、信用卡、支票均可）</li>
          </ul>
        </div>
        <a href="https://dmv.ny.gov/offices" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary fw-medium mt-3 hover:underline">
          查找附近的DMV办公室 →
        </a>
      </div>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-primary to-primary-dark r-xl p-6 text-center text-text-inverse mb-8 border-primary/40">
        <h3 className="text-lg fw-bold mb-2">有交通罚单需要帮助？</h3>
        <p className="text-sm text-text-inverse/80 mb-4">交通违规可能影响驾照扣分和保险费率。咨询专业律师了解申诉选项。</p>
        <Link href="/businesses" className="inline-flex px-6 py-2.5 bg-bg-card text-primary fw-bold r-xl hover:bg-bg-page transition">
          找交通律师
        </Link>
      </Card>

      {/* Quick Links */}
      <Card className="r-xl p-6 mb-8">
        <h2 className="text-sm fw-bold text-text-primary mb-3">官方链接</h2>
        <div className="space-y-2">
          <a href="https://my.dmv.ny.gov/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
            <span>🔗</span> MyDMV 网上查询入口（需登录）
          </a>
          <a href="https://dmv.ny.gov/records/get-my-own-driving-record-abstract" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
            <span>🔗</span> DMV 驾驶记录查询说明（英文）
          </a>
          <a href="https://dmv.ny.gov/tickets/traffic-violations-bureau" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
            <span>🔗</span> NYC交通违规局(TVB)（缴纳/申诉移动违规罚单）
          </a>
          <a href="https://dmv.ny.gov/tickets/plead-or-pay-tvb-tickets" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
            <span>🔗</span> 缴纳或申诉TVB罚单
          </a>
        </div>
      </Card>

      {/* FAQ */}
      <ServiceFAQ items={FAQ_ITEMS} />

      {/* Related */}
      <section className="mb-8">
        <h2 className="text-base fw-bold text-text-primary mb-3">相关工具</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href="/services/vehicle-violations" className="bg-bg-card border border-border r-xl p-4 hover:border-primary/30 hover:elev-sm transition group">
            <h3 className="text-sm fw-bold text-text-primary group-hover:text-primary mb-1">🚗 免费停车罚单查询</h3>
            <p className="text-xs text-text-muted">查询NYC停车和摄像头罚单（免费）</p>
          </Link>
          <Link href="/ask" className="bg-bg-card border border-border r-xl p-4 hover:border-primary/30 hover:elev-sm transition group">
            <h3 className="text-sm fw-bold text-text-primary group-hover:text-primary mb-1">🤖 问AI小邻</h3>
            <p className="text-xs text-text-muted">&ldquo;收到交通罚单怎么申诉？&rdquo;</p>
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="text-xs text-text-muted leading-relaxed border-t border-border-light pt-6">
        <p>本指南仅供参考。NYS DMV可能随时更新流程和费用。如有疑问请直接联系DMV客服热线：(518) 486-9786。</p>
      </div>
      </PageContainer>
    </main>
  );
}
