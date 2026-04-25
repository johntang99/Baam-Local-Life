'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { deleteDeal, approveDeal, rejectDeal, toggleDealFeatured } from './actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const statusBadge: Record<string, { cls: string; label: string }> = {
  pending: { cls: 'badge badge-yellow', label: '待审核' },
  approved: { cls: 'badge badge-green', label: '已通过' },
  rejected: { cls: 'badge badge-red', label: '已拒绝' },
  expired: { cls: 'badge badge-gray', label: '已过期' },
  draft: { cls: 'badge badge-gray', label: '草稿' },
};

const typeBadge: Record<string, string> = {
  price: '💰 折扣价',
  percent: '🏷️ 折扣%',
  bogo: '🎁 买一送一',
  freebie: '🆓 免费赠品',
  other: '📋 其他',
};

interface DealsTableProps {
  deals: AnyRow[];
  siteParams?: string;
}

export default function DealsTable({ deals, siteParams = '' }: DealsTableProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = (id: string) => {
    if (!confirm('确定删除此优惠？')) return;
    startTransition(async () => {
      await deleteDeal(id);
      router.refresh();
    });
  };

  const handleApprove = (id: string) => {
    startTransition(async () => {
      await approveDeal(id);
      router.refresh();
    });
  };

  const handleReject = (id: string) => {
    const note = prompt('拒绝原因（可选）：');
    startTransition(async () => {
      await rejectDeal(id, note || undefined);
      router.refresh();
    });
  };

  function formatDiscount(d: AnyRow): string {
    if (d.discount_type === 'price' && d.original_price && d.discount_price) {
      return `$${d.original_price} → $${d.discount_price}`;
    }
    if (d.discount_type === 'percent' && d.discount_percent) {
      return `${d.discount_percent}% OFF`;
    }
    return d.discount_label || '—';
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  }

  return (
    <div className="bg-bg-card border border-border r-xl overflow-hidden">
      <table className="data-table">
        <thead>
          <tr>
            <th>优惠标题</th>
            <th>商家</th>
            <th>折扣</th>
            <th>类型</th>
            <th>精选</th>
            <th>状态</th>
            <th>有效期</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((d) => {
            const sb = statusBadge[d.status] || statusBadge.draft;
            const bizName = d.businesses?.display_name_zh || d.businesses?.display_name || '—';
            return (
              <tr key={d.id} className={isPending ? 'opacity-50' : ''}>
                <td className="max-w-xs">
                  <p className="font-medium truncate">{d.title_zh || '无标题'}</p>
                  {d.short_desc_zh && <p className="text-xs text-text-muted truncate">{d.short_desc_zh}</p>}
                </td>
                <td className="text-sm text-text-muted">{bizName}</td>
                <td className="text-sm font-medium">{formatDiscount(d)}</td>
                <td><span className="text-xs text-text-muted">{typeBadge[d.discount_type] || d.discount_type}</span></td>
                <td>
                  <button
                    onClick={() => startTransition(() => toggleDealFeatured(d.id, !!d.is_featured).then(() => router.refresh()))}
                    className={`text-xs px-2 py-1 rounded-md cursor-pointer transition-colors ${
                      d.is_featured
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 font-medium'
                        : 'bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-600'
                    }`}
                  >
                    {d.is_featured ? '⭐ Yes' : 'No'}
                  </button>
                </td>
                <td><span className={`${sb.cls} text-xs`}>{sb.label}</span></td>
                <td className="text-xs text-text-muted">
                  {formatDate(d.start_date)} ~ {formatDate(d.end_date)}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/deals/${d.id}/edit${siteParams ? `?${siteParams}` : ''}`} className="text-xs text-primary hover:underline">
                      编辑
                    </Link>
                    {d.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(d.id)} className="text-xs text-green-600 hover:underline">通过</button>
                        <button onClick={() => handleReject(d.id)} className="text-xs text-red-500 hover:underline">拒绝</button>
                      </>
                    )}
                    <button onClick={() => handleDelete(d.id)} className="text-xs text-red-400 hover:underline">删除</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
