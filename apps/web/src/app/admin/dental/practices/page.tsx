import { createAdminClient } from '@/lib/supabase/admin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export default async function DentalPracticesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const { data: site } = await supabase
    .from('sites')
    .select('id')
    .eq('slug', 'smileiq')
    .single();

  const siteId = site?.id;

  const { data: rawData } = await supabase
    .from('businesses')
    .select('*, dental_practice_profiles(*)')
    .eq('site_id', siteId!)
    .order('avg_rating', { ascending: false });

  const data = (rawData || []) as AnyRow[];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">牙科诊所管理</h1>
        <span className="text-sm text-gray-500">共 {data.length} 条记录</span>
      </div>
      <div className="bg-white border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">名称</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">中文名称</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">城市</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">评分</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">评价数</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">专长</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">语言</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">等级</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">接受新患者</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row) => {
              const profile = row.dental_practice_profiles?.[0] || row.dental_practice_profiles || {};
              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{row.display_name || row.name}</td>
                  <td className="px-4 py-3">{row.display_name_zh || row.name_zh || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{row.city || '—'}</td>
                  <td className="px-4 py-3">
                    {row.avg_rating ? (
                      <span className="text-yellow-600 font-medium">{Number(row.avg_rating).toFixed(1)}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.review_count || 0}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {profile.specialties?.length
                      ? profile.specialties.slice(0, 3).join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {profile.languages_spoken?.length
                      ? profile.languages_spoken.join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {profile.smileiq_tier ? (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {profile.smileiq_tier}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block w-2 h-2 rounded-full ${profile.is_accepting_new ? 'bg-green-500' : 'bg-gray-300'}`} />
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
