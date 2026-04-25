import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSiteContext } from '@/lib/admin-context';
import DealsTable from './DealsTable';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DealsListPage({ searchParams }: Props) {
  const params = await searchParams;
  const ctx = await getAdminSiteContext(params);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const statusFilter = typeof params.status === 'string' ? params.status : 'all';

  let query = supabase
    .from('deals')
    .select('*, businesses(display_name_zh, display_name, slug)')
    .eq('site_id', ctx.siteId)
    .order('created_at', { ascending: false });

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: rawDeals } = await query.limit(100);
  const deals = (rawDeals || []) as AnyRow[];

  const baseParams = new URLSearchParams();
  if (params.region) baseParams.set('region', String(params.region));
  if (params.locale) baseParams.set('locale', String(params.locale));

  const statusTabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待审核' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已拒绝' },
    { key: 'draft', label: '草稿' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">优惠管理</h1>
          <p className="text-sm text-text-muted">管理商家提交的优惠折扣信息</p>
        </div>
        <Link
          href={`/admin/deals/new${baseParams.toString() ? `?${baseParams.toString()}` : ''}`}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition"
        >
          + 新建优惠
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6">
        {statusTabs.map((tab) => {
          const tabParams = new URLSearchParams(baseParams);
          if (tab.key !== 'all') tabParams.set('status', tab.key);
          return (
            <Link
              key={tab.key}
              href={`/admin/deals?${tabParams.toString()}`}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                statusFilter === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {deals.length === 0 ? (
        <div className="py-12 text-center bg-bg-card border border-border rounded-xl">
          <p className="text-4xl mb-4">🏷️</p>
          <p className="text-text-muted">暂无优惠信息</p>
          <p className="text-sm text-text-muted mt-1">点击「新建优惠」添加商家折扣</p>
        </div>
      ) : (
        <DealsTable deals={deals} siteParams={baseParams.toString()} />
      )}
    </div>
  );
}
