'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { deleteClassified, toggleClassifiedFeatured, setClassifiedStatus } from './actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const categoryLabels: Record<string, { emoji: string; label: string }> = {
  housing_rent: { emoji: '🏠', label: '房屋出租' },
  housing_buy: { emoji: '🏡', label: '房屋买卖' },
  jobs: { emoji: '💼', label: '诚聘招工' },
  secondhand: { emoji: '📦', label: '二手商品' },
  services: { emoji: '🙋', label: '寻求帮助' },
  general: { emoji: '📋', label: '其他' },
};

const statusBadge: Record<string, { cls: string; label: string }> = {
  active: { cls: 'badge badge-green', label: '活跃' },
  expired: { cls: 'badge badge-gray', label: '已过期' },
  removed: { cls: 'badge badge-red', label: '已下架' },
};

interface Props {
  classifieds: AnyRow[];
  siteParams?: string;
}

export default function ClassifiedsTable({ classifieds, siteParams = '' }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = (id: string) => {
    if (!confirm('确定删除？')) return;
    startTransition(async () => { await deleteClassified(id); router.refresh(); });
  };

  function timeAgo(dateStr: string | null): string {
    if (!dateStr) return '—';
    const ms = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(ms / 3600000);
    if (hrs < 1) return '刚刚';
    if (hrs < 24) return `${hrs}小时前`;
    const days = Math.floor(ms / 86400000);
    if (days < 7) return `${days}天前`;
    return new Date(dateStr).toLocaleDateString('zh-CN');
  }

  return (
    <div className="bg-bg-card border border-border r-xl overflow-hidden">
      <table className="data-table">
        <thead>
          <tr>
            <th>标题</th>
            <th>分类</th>
            <th>价格</th>
            <th>精选</th>
            <th>状态</th>
            <th>回复</th>
            <th>发布时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {classifieds.map((c) => {
            const cat = categoryLabels[c.category] || categoryLabels.general;
            const sb = statusBadge[c.status] || statusBadge.active;
            const authorName = c.profiles?.display_name || '—';
            return (
              <tr key={c.id} className={isPending ? 'opacity-50' : ''}>
                <td className="max-w-xs">
                  <p className="font-medium truncate">{c.title}</p>
                  <p className="text-xs text-text-muted truncate">by {authorName}</p>
                </td>
                <td><span className="text-xs">{cat.emoji} {cat.label}</span></td>
                <td className="text-sm">{c.price_text || '—'}</td>
                <td>
                  <button
                    onClick={() => startTransition(() => toggleClassifiedFeatured(c.id, !!c.is_featured).then(() => router.refresh()))}
                    className={`text-xs px-2 py-1 rounded-md cursor-pointer transition-colors ${
                      c.is_featured ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 font-medium' : 'bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-600'
                    }`}
                  >
                    {c.is_featured ? '⭐ Yes' : 'No'}
                  </button>
                </td>
                <td><span className={`${sb.cls} text-xs`}>{sb.label}</span></td>
                <td className="text-sm text-text-muted">{c.reply_count || 0}</td>
                <td className="text-xs text-text-muted">{timeAgo(c.created_at)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/classifieds/${c.id}/edit${siteParams ? `?${siteParams}` : ''}`} className="text-xs text-primary hover:underline">编辑</Link>
                    {c.status === 'active' && (
                      <button onClick={() => startTransition(() => setClassifiedStatus(c.id, 'removed').then(() => router.refresh()))} className="text-xs text-red-500 hover:underline">下架</button>
                    )}
                    {c.status === 'removed' && (
                      <button onClick={() => startTransition(() => setClassifiedStatus(c.id, 'active').then(() => router.refresh()))} className="text-xs text-green-600 hover:underline">恢复</button>
                    )}
                    <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:underline">删除</button>
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
