import { createAdminClient } from '@/lib/supabase/admin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export default async function DentalProductsPage() {
  const supabase = createAdminClient();

  const { data: rawData } = await supabase
    .from('oral_products')
    .select('*')
    .order('editorial_rating', { ascending: false });

  const data = (rawData || []) as AnyRow[];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">口腔产品管理</h1>
        <span className="text-sm text-gray-500">共 {data.length} 条记录</span>
      </div>
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">产品名称</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">品牌</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">分类</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">价格</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">编辑评分</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">评价数</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">编辑推荐</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">已发布</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3 text-gray-600">{row.brand || '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">{row.category}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{row.price_usd != null ? `$${row.price_usd}` : '—'}</td>
                <td className="px-4 py-3">
                  {row.editorial_rating != null ? (
                    <span className="text-yellow-600 font-medium">{Number(row.editorial_rating).toFixed(1)}</span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">{row.review_count || 0}</td>
                <td className="px-4 py-3">
                  {row.editors_pick ? (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">推荐</span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block w-2 h-2 rounded-full ${row.is_published ? 'bg-green-500' : 'bg-gray-300'}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
