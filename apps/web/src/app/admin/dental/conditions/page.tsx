import { createAdminClient } from '@/lib/supabase/admin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export default async function DentalConditionsPage() {
  const supabase = createAdminClient();

  const { data: rawData } = await supabase
    .from('dental_conditions')
    .select('*')
    .order('priority', { ascending: true })
    .order('urgency_level', { ascending: false });

  const data = (rawData || []) as AnyRow[];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">牙科病症管理</h1>
        <span className="text-sm text-gray-500">共 {data.length} 条记录</span>
      </div>
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">英文名称</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">中文名称</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">分类</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">紧急程度</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">优先级</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">已发布</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.slug}</td>
                <td className="px-4 py-3">{row.title_en}</td>
                <td className="px-4 py-3">{row.title_zh}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">{row.category}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    row.urgency_level >= 4 ? 'bg-red-100 text-red-700' :
                    row.urgency_level >= 3 ? 'bg-orange-100 text-orange-700' :
                    row.urgency_level >= 2 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {row.urgency_level}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{row.priority}</td>
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
