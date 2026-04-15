import { createAdminClient } from '@/lib/supabase/admin';

export default async function DentalDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  // Get smileiq site_id
  const { data: site } = await supabase
    .from('sites')
    .select('id')
    .eq('slug', 'smileiq')
    .single();

  const siteId = site?.id;

  const [
    { count: conditionsCount },
    { count: treatmentsCount },
    { count: businessesCount },
    { count: productsCount },
    { count: sessionsCount },
    { count: leadsCount },
    { count: reviewsCount },
    { count: voicePostsCount },
  ] = await Promise.all([
    supabase.from('dental_conditions').select('*', { count: 'exact', head: true }),
    supabase.from('dental_treatments').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true })
      .eq('site_id', siteId!),
    supabase.from('oral_products').select('*', { count: 'exact', head: true }),
    supabase.from('dental_ai_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .eq('site_id', siteId!),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('voice_posts').select('*', { count: 'exact', head: true })
      .in('post_type', ['dental_tip', 'dental_review', 'dental_experience', 'dental_question']),
  ]);

  const stats = [
    { label: '牙科病症', value: conditionsCount || 0, icon: '🦷' },
    { label: '治疗方案', value: treatmentsCount || 0, icon: '💊' },
    { label: '诊所/商家', value: businessesCount || 0, icon: '🏥' },
    { label: '口腔产品', value: productsCount || 0, icon: '🪥' },
    { label: 'AI 问诊', value: sessionsCount || 0, icon: '🤖' },
    { label: '线索', value: leadsCount || 0, icon: '📥' },
    { label: '评价', value: reviewsCount || 0, icon: '⭐' },
    { label: '达人内容', value: voicePostsCount || 0, icon: '🎙️' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">SmileIQ 牙科管理</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
