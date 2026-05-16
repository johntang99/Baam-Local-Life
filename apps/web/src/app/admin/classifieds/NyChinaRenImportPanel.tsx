'use client';

import { useState, useTransition } from 'react';
import { runNychinarenImport, type NychinarenImportTarget } from './actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const targets: Array<{ key: NychinarenImportTarget; label: string; hint: string }> = [
  { key: 'housing_rent', label: '抓取租房', hint: '论坛 f_5' },
  { key: 'jobs', label: '抓取招聘', hint: '论坛 f_29' },
  { key: 'secondhand', label: '抓取二手', hint: '论坛 f_3' },
  { key: 'all', label: '一键抓取全部', hint: '租房+招聘+二手' },
];

export default function NyChinaRenImportPanel() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string>('仅抓取最新新帖；历史已抓取内容会自动跳过，并自动整理为统一结构。');
  const [results, setResults] = useState<AnyRow[]>([]);

  const handleRun = (target: NychinarenImportTarget) => {
    setStatus('抓取中，请稍候...');
    setResults([]);
    startTransition(async () => {
      const res = await runNychinarenImport(target);
      setStatus(res.message);
      setResults(res.results || []);
    });
  };

  return (
    <div className="mb-6 rounded-xl border border-border bg-bg-card p-4">
      <div className="flex flex-col gap-1 mb-3">
        <h2 className="text-sm font-semibold">NYChinaRen 自动抓取</h2>
        <p className="text-xs text-text-muted">
          只抓取新内容，不重复导入上次已抓取的帖子（按 source_post_id 去重）。
        </p>
        <p className="text-xs text-text-muted">
          导入后自动转换为统一格式（职位/房源/商品信息卡片 + 补充说明）。
        </p>
        <p className="text-xs text-text-muted">
          首次抓取最多 100 条，后续每次最多抓取 50 条最新内容。
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {targets.map((target) => (
          <button
            key={target.key}
            type="button"
            disabled={isPending}
            onClick={() => handleRun(target.key)}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
            title={target.hint}
          >
            {target.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-text-muted">{status}</p>

      {results.length > 0 && (
        <div className="mt-3 space-y-1">
          {results.map((r) => (
            <p key={r.target} className="text-xs text-text-muted">
              {r.label}: 新增 {r.inserted}，已存在跳过 {r.skippedExisting}，过滤 {r.skippedFiltered}，失败 {r.failed}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
