import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/routing';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return {
    title: `商家入驻 · ${t('businesses')} · Baam`,
    description: '免费入驻 Baam，创建商家主页，AI 自动优化，精准触达本地华人客户',
  };
}

export default async function BusinessClaimPage() {
  await getTranslations();

  return (
    <main>
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-text-muted mb-6">
          <Link href="/" className="hover:text-primary">首页</Link>
          <span className="mx-2">›</span>
          <Link href="/businesses" className="hover:text-primary">商家</Link>
          <span className="mx-2">›</span>
          <span className="text-text-secondary">商家入驻</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">商家入驻</h1>
          <p className="text-text-secondary text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            加入 Baam 平台，让更多本地华人客户发现您的商家。我们提供免费的商家主页、AI 智能优化和精准的本地曝光。
          </p>
        </div>

        {/* Benefits */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <div className="card p-5 text-center">
            <div className="text-3xl mb-3">🆓</div>
            <h3 className="font-semibold text-sm mb-1">免费入驻</h3>
            <p className="text-xs text-text-muted">创建商家主页完全免费，无隐藏费用</p>
          </div>
          <div className="card p-5 text-center">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-sm mb-1">AI 智能优化</h3>
            <p className="text-xs text-text-muted">AI 自动生成商家描述、FAQ、推荐标签</p>
          </div>
          <div className="card p-5 text-center">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold text-sm mb-1">精准触达</h3>
            <p className="text-xs text-text-muted">本地华人用户精准匹配，获取优质客户线索</p>
          </div>
        </div>

        {/* Claim Form */}
        <div className="card p-6 sm:p-8">
          <h2 className="text-lg font-bold mb-6">提交入驻申请</h2>
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">商家名称 *</label>
              <input
                type="text"
                placeholder="请输入商家名称"
                className="w-full h-11 px-4 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-bg-card"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">商家类别 *</label>
              <select
                className="w-full h-11 px-4 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-bg-card cursor-pointer"
                required
              >
                <option value="">请选择类别</option>
                <option value="food">餐饮美食</option>
                <option value="medical">医疗健康</option>
                <option value="legal">法律移民</option>
                <option value="realestate">地产保险</option>
                <option value="education">教育培训</option>
                <option value="renovation">装修家居</option>
                <option value="auto">汽车服务</option>
                <option value="tax">财税服务</option>
                <option value="beauty">美容保健</option>
                <option value="other">其他服务</option>
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">联系电话 *</label>
                <input
                  type="tel"
                  placeholder="(xxx) xxx-xxxx"
                  className="w-full h-11 px-4 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-bg-card"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">电子邮箱 *</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full h-11 px-4 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-bg-card"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">商家地址</label>
              <input
                type="text"
                placeholder="例：136-20 Roosevelt Ave, Flushing, NY 11354"
                className="w-full h-11 px-4 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-bg-card"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">补充说明</label>
              <textarea
                rows={3}
                placeholder="请简要介绍您的商家服务（可选）"
                className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-bg-card resize-none"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full h-12 text-base font-semibold"
            >
              提交申请
            </button>

            <p className="text-xs text-text-muted text-center">
              提交即表示您同意 Baam 的{' '}
              <Link href="/terms" className="text-primary hover:underline">使用条款</Link>
              {' '}和{' '}
              <Link href="/privacy" className="text-primary hover:underline">隐私政策</Link>
              。我们将在 1-3 个工作日内审核您的申请。
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
