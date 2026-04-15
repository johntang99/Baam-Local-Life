import { createAdminClient } from '@/lib/supabase/admin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export default async function DentalAISessionsPage() {
  const supabase = createAdminClient();

  const { data: rawData } = await supabase
    .from('dental_ai_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  const data = (rawData || []) as AnyRow[];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">AI 问诊记录</h1>
        <span className="text-sm text-gray-500">共 {data.length} 条记录</span>
      </div>
      <div className="bg-white border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">会话 ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">消息数</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">紧急程度</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">检测病症</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">推荐专科</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">语言</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">创建时间</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row) => {
              const isUrgent = row.urgency_level >= 3;
              return (
                <tr
                  key={row.id}
                  className={isUrgent ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {row.session_id ? String(row.session_id).slice(0, 12) + '...' : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.message_count || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.urgency_level >= 4 ? 'bg-red-200 text-red-800' :
                      row.urgency_level >= 3 ? 'bg-orange-100 text-orange-700' :
                      row.urgency_level >= 2 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {row.urgency_level ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">
                    {Array.isArray(row.detected_conditions)
                      ? row.detected_conditions.join(', ')
                      : row.detected_conditions || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.recommended_specialty || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {row.user_language || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
