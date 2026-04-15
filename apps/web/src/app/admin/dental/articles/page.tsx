import { createAdminClient } from '@/lib/supabase/admin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const verticalLabels: Record<string, string> = {
  dental_article: '牙科文章',
  dental_prevention: '预防保健',
  dental_faq: '常见问题',
};

export default async function DentalArticlesPage() {
  const supabase = createAdminClient();

  const { data: rawData } = await supabase
    .from('articles')
    .select('*')
    .in('content_vertical', ['dental_article', 'dental_prevention', 'dental_faq'])
    .order('published_at', { ascending: false });

  const data = (rawData || []) as AnyRow[];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">牙科文章管理</h1>
        <span className="text-sm text-gray-500">共 {data.length} 条记录</span>
      </div>
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">标题</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">内容类型</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">浏览量</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">状态</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">发布时间</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium max-w-md truncate">{row.title_zh || row.title_en || '无标题'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {verticalLabels[row.content_vertical] || row.content_vertical}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{row.view_count || 0}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    row.editorial_status === 'published' ? 'bg-green-100 text-green-700' :
                    row.editorial_status === 'draft' ? 'bg-gray-100 text-gray-600' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {row.editorial_status === 'published' ? '已发布' :
                     row.editorial_status === 'draft' ? '草稿' :
                     row.editorial_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {row.published_at ? new Date(row.published_at).toLocaleDateString('zh-CN') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
