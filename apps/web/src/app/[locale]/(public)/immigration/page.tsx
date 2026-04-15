import { Link } from '@/lib/i18n/routing';
import { PageContainer } from '@/components/layout/page-shell';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '移民签证服务 | Immigration Services · Baam',
  description: '纽约华人移民签证实用工具 — AI签证资格评估、排期查询、移民政策中文解读。全部免费。',
  keywords: ['移民签证', '签证评估', '绿卡申请', 'immigration services', '移民律师', 'USCIS'],
};

export default function ImmigrationIndexPage() {
  return (
    <main>
      <PageContainer className="max-w-4xl py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-text-muted mb-6">
        <Link href="/services" className="hover:text-primary">实用工具</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">移民签证服务</span>
      </nav>

      {/* Hero */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🛂</div>
        <h1 className="text-2xl sm:text-3xl fw-bold text-text-primary mb-2">移民签证服务</h1>
        <p className="text-text-muted">纽约华人移民签证实用工具 — AI评估、排期查询、政策解读</p>
        <Badge variant="secondary" className="inline-flex items-center gap-2 px-4 py-1.5 mt-3 text-xs text-primary">
          全部免费 · 中文服务 · AI驱动
        </Badge>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-accent-yellow/20 border border-accent-yellow r-xl p-3 mb-8 text-xs text-accent-yellow flex items-start gap-2">
        <span className="flex-shrink-0">⚠️</span>
        <p>本页面所有工具仅提供一般性信息参考，不构成法律建议。请咨询持牌移民律师获取专业意见。</p>
      </div>

      {/* Featured: Visa Screener */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg fw-bold text-text-primary">核心工具</h2>
          <Badge className="text-xs text-text-inverse bg-primary">推荐</Badge>
        </div>
        <Link href="/immigration/visa-screener"
          className="block bg-gradient-to-br from-primary to-primary r-xl p-6 sm:p-8 text-text-inverse hover:elev-lg transition group">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-bg-card/20 r-xl flex items-center justify-center text-2xl flex-shrink-0">🤖</div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className="text-[10px] fw-bold bg-bg-card/20 text-text-inverse">AI驱动</Badge>
                <Badge className="text-[10px] fw-bold bg-bg-card/20 text-text-inverse">免费</Badge>
                <Badge className="text-[10px] fw-bold bg-bg-card/20 text-text-inverse">中文</Badge>
              </div>
              <h3 className="text-xl fw-bold mb-2">签证资格智能评估</h3>
              <p className="text-sm text-text-inverse/80 mb-4">回答6个简单问题，AI帮你分析可能适合的签证类别</p>
              <span className={cn(buttonVariants({ size: 'sm' }), 'inline-flex items-center gap-1 bg-bg-card text-primary hover:bg-bg-page')}>
                开始评估 →
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Coming Soon */}
      <div className="mb-8">
        <h2 className="text-lg fw-bold text-text-primary mb-4">更多工具</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: '🔍', title: 'USCIS案件状态查询', desc: '查询你的移民申请进度', badge: '即将上线' },
            { icon: '📊', title: '签证排期查询', desc: '查看EB/Family类绿卡排期', badge: '即将上线' },
            { icon: '⏱️', title: '处理时间查询', desc: '查看各类签证当前处理时间', badge: '即将上线' },
            { icon: '⚖️', title: '移民法庭日期', desc: '查看移民法庭开庭日期', badge: '即将上线' },
          ].map((tool) => (
            <Card key={tool.title} className="p-5 flex items-start gap-4 opacity-75">
              <div className="w-11 h-11 bg-bg-page r-lg flex items-center justify-center text-xl flex-shrink-0">{tool.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm fw-bold text-text-primary">{tool.title}</h3>
                  <Badge className="text-[10px] fw-medium text-accent-yellow bg-accent-yellow/20">{tool.badge}</Badge>
                </div>
                <p className="text-xs text-text-muted">{tool.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Visa Category Guide */}
      <div className="mb-8">
        <h2 className="text-lg fw-bold text-text-primary mb-4">美国签证和移民类别简介</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: '💼', title: '工作签证', items: ['H-1B 专业工作', 'L-1 跨国公司', 'O-1 杰出人才', 'E-2 投资者'] },
            { icon: '🟢', title: '绿卡/永久居留', items: ['EB-1/2/3 职业移民', '家庭移民 (F1-F4)', 'EB-5 投资移民'] },
            { icon: '🎓', title: '学生签证', items: ['F-1 学术学生', 'J-1 交流访问', 'OPT/CPT 实习'] },
            { icon: '👨‍👩‍👧‍👦', title: '家庭移民', items: ['直系亲属 (配偶/子女)', '优先类 (兄弟姐妹等)'] },
          ].map((cat) => (
          <Card key={cat.title} className="p-5">
              <h3 className="text-sm fw-bold text-text-primary mb-2 flex items-center gap-2">
                <span>{cat.icon}</span> {cat.title}
              </h3>
              <ul className="space-y-1">
                {cat.items.map((item) => (
                  <li key={item} className="text-xs text-text-secondary flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-border r-full flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
          </Card>
          ))}
        </div>
      </div>

      {/* AI + Lawyer CTA */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link href="/ask" className="block">
          <Card className="bg-gradient-to-br from-secondary-50 to-secondary-50 border-secondary-light r-xl p-5 hover:elev-md transition group">
          <div className="text-2xl mb-2">🤖</div>
          <h3 className="text-sm fw-bold text-text-primary group-hover:text-primary mb-1">有移民问题？问AI小邻</h3>
          <p className="text-xs text-text-muted">&ldquo;H1B转绿卡需要多久？&rdquo;</p>
          </Card>
        </Link>
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 r-xl p-5 text-text-inverse border-border">
          <div className="text-2xl mb-2">⚖️</div>
          <h3 className="text-sm fw-bold mb-1">需要专业移民律师帮助？</h3>
          <p className="text-xs text-text-inverse/70 mb-3">Baam合作的移民律师提供免费初次咨询</p>
          <Link href="/businesses" className={cn(buttonVariants({ size: 'sm' }), 'inline-flex text-xs fw-semibold text-primary bg-bg-card hover:bg-bg-page')}>
            找移民律师 →
          </Link>
        </Card>
      </div>

      {/* Email */}
      <Card className="p-6 text-center r-xl">
        <h3 className="text-base fw-bold text-text-primary mb-1">订阅移民政策中文快报</h3>
        <p className="text-xs text-text-muted mb-4">每月排期变化、政策更新、实用攻略</p>
        <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
          <input type="email" placeholder="输入你的邮箱" className="flex-1 h-10 px-4 border border-border r-xl text-sm focus:ring-2 focus:ring-primary outline-none" />
          <button className={cn(buttonVariants({ size: 'sm' }), 'h-10 px-5')}>订阅</button>
        </div>
      </Card>
      </PageContainer>
    </main>
  );
}
