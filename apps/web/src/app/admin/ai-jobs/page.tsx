import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSiteContext } from '@/lib/admin-context';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const statusBadge: Record<string, string> = {
  pending: 'badge-yellow',
  processing: 'badge-blue',
  completed: 'badge-green',
  failed: 'badge-red',
};

function formatCost(cost: number | null): string {
  if (cost == null) return '—';
  return `$${cost.toFixed(4)}`;
}

function parseAiIntent(intent: string | null | undefined): { quality?: 'high' | 'medium' | 'low'; strict?: boolean } {
  const text = intent || '';
  const qualityMatch = text.match(/quality=(high|medium|low)/);
  const strictMatch = text.match(/strict=(0|1)/);
  return {
    quality: (qualityMatch?.[1] as 'high' | 'medium' | 'low' | undefined) || undefined,
    strict: strictMatch ? strictMatch[1] === '1' : undefined,
  };
}

export default async function AdminAiJobsPage({ searchParams }: Props) {
  const params = await searchParams;
  const ctx = await getAdminSiteContext(params);
  const supabase = createAdminClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    { count: pendingCount },
    { count: processingCount },
    { count: completedTodayCount },
    { count: failedCount },
  ] = await Promise.all([
    supabase.from('ai_jobs').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('ai_jobs').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
    supabase
      .from('ai_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', todayStart.toISOString()),
    supabase.from('ai_jobs').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
  ]);

  const { data: rawJobs } = await supabase
    .from('ai_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  const jobs = (rawJobs || []) as AnyRow[];

  let searchLogsQuery = (supabase as any)
    .from('search_logs')
    .select('created_at, ai_intent, response_time_ms, result_count, region_id')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(2000);
  if (ctx.regionIds.length > 0) {
    searchLogsQuery = searchLogsQuery.or(`region_id.is.null,region_id.in.(${ctx.regionIds.join(',')})`);
  }
  const { data: rawSearchLogs } = await searchLogsQuery;
  const searchLogs = (rawSearchLogs || []) as AnyRow[];

  const helperLogs = searchLogs.filter((l) => {
    const intent = String(l.ai_intent || '');
    return intent.includes('quality=') || intent.startsWith('rag|') || intent.startsWith('followup|');
  });

  const qualityDist = { high: 0, medium: 0, low: 0 };
  let strictOnCount = 0;
  let responseSum = 0;
  let responseCount = 0;
  let totalResultCount = 0;

  const byDay = new Map<string, { total: number; high: number; medium: number; low: number }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(sevenDaysAgo.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, { total: 0, high: 0, medium: 0, low: 0 });
  }

  for (const row of helperLogs) {
    const parsed = parseAiIntent(row.ai_intent);
    if (parsed.quality) qualityDist[parsed.quality]++;
    if (parsed.strict) strictOnCount++;
    if (typeof row.response_time_ms === 'number') {
      responseSum += row.response_time_ms;
      responseCount++;
    }
    if (typeof row.result_count === 'number') totalResultCount += row.result_count;

    const dayKey = row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : '';
    const bucket = byDay.get(dayKey);
    if (bucket) {
      bucket.total += 1;
      if (parsed.quality) bucket[parsed.quality] += 1;
    }
  }

  const helperTotal = helperLogs.length;
  const strictRate = helperTotal > 0 ? (strictOnCount / helperTotal) * 100 : 0;
  const avgResponseMs = responseCount > 0 ? Math.round(responseSum / responseCount) : 0;
  const avgResults = helperTotal > 0 ? (totalResultCount / helperTotal).toFixed(1) : '0.0';
  const dayRows = [...byDay.entries()].map(([date, stats]) => ({ date, ...stats }));

  const stats = [
    { label: '待处理', value: pendingCount || 0, color: 'text-accent-yellow' },
    { label: '处理中', value: processingCount || 0, color: 'text-accent-blue' },
    { label: '今日完成', value: completedTodayCount || 0, color: 'text-accent-green' },
    { label: '失败', value: failedCount || 0, color: 'text-accent-red' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-bg-card border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-bold">AI任务监控</h1>
          <p className="text-sm text-text-muted">Admin / AI Jobs</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Helper quality panel */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Helper 质量看板（近7天）</h2>
              <p className="text-xs text-text-muted mt-0.5">基于 `search_logs` 中带 quality 标记的请求（站点：{ctx.siteName}）</p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-text-muted">请求量</p>
              <p className="text-xl font-bold">{helperTotal}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-text-muted">平均响应</p>
              <p className="text-xl font-bold">{avgResponseMs}ms</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-text-muted">平均结果数</p>
              <p className="text-xl font-bold">{avgResults}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-text-muted">严格模式占比</p>
              <p className="text-xl font-bold">{strictRate.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-text-muted">质量分布</p>
              <p className="text-sm font-medium">
                <span className="text-green-600">H {qualityDist.high}</span>{' '}
                <span className="text-amber-600">M {qualityDist.medium}</span>{' '}
                <span className="text-red-600">L {qualityDist.low}</span>
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>总请求</th>
                  <th>High</th>
                  <th>Medium</th>
                  <th>Low</th>
                </tr>
              </thead>
              <tbody>
                {dayRows.map((d) => (
                  <tr key={d.date}>
                    <td className="text-text-secondary">{d.date}</td>
                    <td>{d.total}</td>
                    <td className="text-green-600">{d.high}</td>
                    <td className="text-amber-600">{d.medium}</td>
                    <td className="text-red-600">{d.low}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="card p-4">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>任务类型</th>
                  <th>实体类型</th>
                  <th>状态</th>
                  <th>模型</th>
                  <th>输入tokens</th>
                  <th>输出tokens</th>
                  <th>费用</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-text-muted py-8">暂无任务</td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="font-medium">{job.job_type || '—'}</td>
                      <td className="text-text-secondary">{job.entity_type || '—'}</td>
                      <td>
                        <span className={`badge ${statusBadge[job.status] || 'badge-gray'}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="text-text-secondary text-sm">{job.model_name || '—'}</td>
                      <td>{job.input_tokens ?? '—'}</td>
                      <td>{job.output_tokens ?? '—'}</td>
                      <td className="text-text-secondary">{formatCost(job.cost_usd)}</td>
                      <td className="text-text-muted text-sm">
                        {job.created_at ? new Date(job.created_at).toLocaleDateString('zh-CN') : '—'}
                      </td>
                      <td>
                        {job.status === 'failed' ? (
                          <Link href={`/admin/ai-jobs/${job.id}/retry`} className="text-sm text-accent-red hover:underline">
                            重试
                          </Link>
                        ) : (
                          <Link href={`/admin/ai-jobs/${job.id}`} className="text-sm text-primary hover:underline">
                            查看
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
