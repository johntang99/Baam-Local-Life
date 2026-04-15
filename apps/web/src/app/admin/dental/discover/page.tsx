import { createAdminClient } from '@/lib/supabase/admin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const postTypeLabels: Record<string, string> = {
  dental_tip: '牙科贴士',
  dental_review: '牙科评测',
  dental_experience: '就诊经历',
  dental_question: '牙科问答',
};

const dentalPostTypes = Object.keys(postTypeLabels);

export default async function DentalDiscoverPage() {
  const supabase = createAdminClient();

  const { data: rawData } = await supabase
    .from('voice_posts')
    .select('*')
    .in('post_type', dentalPostTypes)
    .order('published_at', { ascending: false });

  const data = (rawData || []) as AnyRow[];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">牙科达人内容</h1>
        <span className="text-sm text-gray-500">共 {data.length} 条记录</span>
      </div>
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">标题</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">类型</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">点赞</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">浏览</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">发布时间</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium max-w-md truncate">{row.title || '无标题'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    {postTypeLabels[row.post_type] || row.post_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{row.like_count || 0}</td>
                <td className="px-4 py-3 text-gray-600">{row.view_count || 0}</td>
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
