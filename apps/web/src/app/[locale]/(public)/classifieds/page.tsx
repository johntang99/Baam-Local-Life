import { createClient } from '@/lib/supabase/server';
import { getCurrentSite } from '@/lib/sites';
import { Link } from '@/lib/i18n/routing';
import { EditorialPageHeader } from '@/components/editorial/page-header';
import { EditorialContainer } from '@/components/editorial/container';
import { EditorialCard } from '@/components/editorial/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '分类信息 · Baam',
  description: '纽约华人社区分类信息：房屋出租、诚聘招工、二手商品、寻求帮助',
};

const categories = [
  { key: 'housing', dbFilter: ['housing_rent', 'housing_buy'], emoji: '🏠', title: '房屋出租', desc: '法拉盛、Elmhurst、Bayside 等地区房源' },
  { key: 'jobs', dbFilter: ['jobs'], emoji: '💼', title: '诚聘招工', desc: '餐饮、零售、办公、技术等岗位' },
  { key: 'secondhand', dbFilter: ['secondhand'], emoji: '📦', title: '二手商品', desc: '电子产品、家具、母婴、服饰等' },
  { key: 'help', dbFilter: ['services', 'general'], emoji: '🙋', title: '寻求帮助', desc: '搬家、翻译、维修、家教等服务' },
];

export default async function ClassifiedsHubPage() {
  const supabase = await createClient();
  const site = await getCurrentSite();

  const counts: Record<string, number> = {};
  await Promise.all(
    categories.map(async (cat) => {
      const { count } = await supabase
        .from('classifieds')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', site.id)
        .in('category', cat.dbFilter)
        .eq('status', 'active');
      counts[cat.key] = count || 0;
    })
  );

  return (
    <main>
      <EditorialPageHeader
        breadcrumbs={[
          { label: '首页', href: '/' },
          { label: '分类信息' },
        ]}
        title="分类信息"
        titleEm="Classifieds"
        subtitle="纽约华人社区生活信息：房屋、招工、二手、求助"
        right={
          <Link href="/classifieds/new" style={{
            padding: '8px 20px', borderRadius: 'var(--ed-radius-md)',
            fontSize: 13.5, fontWeight: 500,
            background: 'var(--ed-ink)', color: 'var(--ed-paper)',
          }}>
            + 免费发布
          </Link>
        }
      />

      <EditorialContainer className="py-8 pb-16">
        <p style={{ fontSize: 13, color: 'var(--ed-ink-muted)', marginBottom: 24 }}>选择分类浏览信息</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {categories.map((cat) => (
            <Link key={cat.key} href={`/classifieds/${cat.key}`} className="block group">
              <EditorialCard className="p-6">
                <div className="flex items-start gap-4">
                  <span style={{ fontSize: 36 }}>{cat.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 18, fontWeight: 700 }}>{cat.title}</h2>
                      <span style={{ fontSize: 12, color: 'var(--ed-ink-muted)', background: 'var(--ed-surface)', padding: '2px 10px', borderRadius: 'var(--ed-radius-pill)' }}>
                        {counts[cat.key]} 条
                      </span>
                    </div>
                    <p style={{ fontSize: 13.5, color: 'var(--ed-ink-soft)' }}>{cat.desc}</p>
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
