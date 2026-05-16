import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSiteContext } from '@/lib/admin-context';
import ClassifiedsTable from './ClassifiedsTable';
import Dadi360ImportPanel from './Dadi360ImportPanel';
import NyChinaRenImportPanel from './NyChinaRenImportPanel';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ClassifiedsListPage({ searchParams }: Props) {
  const params = await searchParams;
  const ctx = await getAdminSiteContext(params);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const categoryFilter = typeof params.category === 'string' ? params.category : 'all';
  const statusFilter = typeof params.status === 'string' ? params.status : 'all';

  let query = supabase
    .from('classifieds')
    .select('*, profiles:author_id(display_name)')
    .eq('site_id', ctx.siteId)
    .order('created_at', { ascending: false });

  if (categoryFilter !== 'all') query = query.eq('category', categoryFilter);
  if (statusFilter !== 'all') query = query.eq('status', statusFilter);

  const { data } = await query.limit(100);
  const classifieds = (data || []) as AnyRow[];

  const countByCategory = async (category: string) => {
    let countQuery = supabase
      .from('classifieds')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', ctx.siteId)
      .eq('category', category);
    if (statusFilter !== 'all') countQuery = countQuery.eq('status', statusFilter);
    const { count } = await countQuery;
    return count || 0;
  };

  const [rentCount, jobsCount, secondhandCount] = await Promise.all([
    countByCategory('housing_rent'),
    countByCategory('jobs'),
    countByCategory('secondhand'),
  ]);

  const baseParams = new URLSearchParams();
  if (params.region) baseParams.set('region', String(params.region));
  if (params.locale) baseParams.set('locale', String(params.locale));

  const categoryTabs = [
    { key: 'all', label: '全部' },
    { key: 'housing_rent', label: '🏠 房屋出租' },
    { key: 'jobs', label: '💼 招工' },
    { key: 'secondhand', label: '📦 二手' },
    { key: 'services', label: '🙋 帮助' },
  ];

  const statusTabs = [
    { key: 'all', label: '全部状态' },
    { key: 'active', label: '活跃' },
    { key: 'expired', label: '已过期' },
    { key: 'removed', label: '已下架' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">分类信息管理</h1>
          <p className="text-sm text-text-muted">管理用户发布的房屋、招工、二手、求助信息</p>
        </div>
        <Link
          href={`/admin/classifieds/new${baseParams.toString() ? `?${baseParams.toString()}` : ''}`}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition"
        >
          + 新建信息
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg border border-border bg-bg-card px-3 py-2">
          <p className="text-xs text-text-muted">租房数量</p>
          <p className="text-lg font-semibold">{rentCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-bg-card px-3 py-2">
          <p className="text-xs text-text-muted">招聘数量</p>
          <p className="text-lg font-semibold">{jobsCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-bg-card px-3 py-2">
          <p className="text-xs text-text-muted">二手数量</p>
          <p className="text-lg font-semibold">{secondhandCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Dadi360ImportPanel />
        <NyChinaRenImportPanel />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-4">
        {categoryTabs.map((tab) => {
          const p = new URLSearchParams(baseParams);
          if (tab.key !== 'all') p.set('category', tab.key);
          if (statusFilter !== 'all') p.set('status', statusFilter);
          return (
            <Link key={tab.key} href={`/admin/classifieds?${p.toString()}`}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${categoryFilter === tab.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6">
        {statusTabs.map((tab) => {
          const p = new URLSearchParams(baseParams);
          if (categoryFilter !== 'all') p.set('category', categoryFilter);
          if (tab.key !== 'all') p.set('status', tab.key);
          return (
            <Link key={tab.key} href={`/admin/classifieds?${p.toString()}`}
              className={`px-3 py-1.5 text-xs rounded-lg transition ${statusFilter === tab.key ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
              {tab.label}
            </Link>
          );
        })}
      </div>

      {classifieds.length === 0 ? (
        <div className="py-12 text-center bg-bg-card border border-border rounded-xl">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-text-muted">暂无分类信息</p>
        </div>
      ) : (
        <ClassifiedsTable classifieds={classifieds} siteParams={baseParams.toString()} />
      )}
    </div>
  );
}
