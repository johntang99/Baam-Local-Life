'use client';

import { useState } from 'react';
import { addRegionToSite, removeRegionFromSite, updateSite, deleteSite, updateSiteStatus, setPrimaryRegion } from './actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface SiteCardProps {
  site: AnyRow;
  siteRegions: AnyRow[];
  counts: { articles: number; businesses: number; threads: number };
  allRegions: AnyRow[];
}

export function SiteCard({ site, siteRegions, counts, allRegions }: SiteCardProps) {
  const [showAddRegion, setShowAddRegion] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState('');

  const currentRegionIds = new Set(siteRegions.map(r => r.id));
  const availableRegions = allRegions.filter(r => !currentRegionIds.has(r.id));

  const handleAddRegion = async (regionId: string) => {
    setLoading(regionId);
    await addRegionToSite(site.id, regionId);
    setLoading('');
    setShowAddRegion(false);
  };

  const handleRemoveRegion = async (regionId: string) => {
    if (!confirm('确定要从此站点移除该地区吗？')) return;
    setLoading(regionId);
    await removeRegionFromSite(site.id, regionId);
    setLoading('');
  };

  const handleSetPrimary = async (regionId: string) => {
    setLoading('primary-' + regionId);
    await setPrimaryRegion(site.id, regionId);
    setLoading('');
  };

  const handleDelete = async () => {
    if (!confirm(`确定要删除站点「${site.name}」吗？此操作不可撤销。`)) return;
    await deleteSite(site.id);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading('saving');
    const formData = new FormData(e.currentTarget);
    await updateSite(site.id, formData);
    setLoading('');
    setEditing(false);
  };

  const handleStatusToggle = async () => {
    const next = site.status === 'active' ? 'disabled' : site.status === 'disabled' ? 'planned' : 'active';
    await updateSiteStatus(site.id, next);
  };

  // Edit mode
  if (editing) {
    return (
      <div className="bg-white border-2 border-primary r-xl p-6">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-base">编辑站点</h3>
            <button type="button" onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-700">取消</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Slug</label>
              <input name="slug" defaultValue={site.slug} className="w-full h-9 px-3 border border-gray-300 r-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-gray-500">语言</label>
              <select name="locale" defaultValue={site.locale} className="w-full h-9 px-3 border border-gray-300 r-lg text-sm outline-none focus:ring-2 focus:ring-primary">
                <option value="zh">中文</option>
                <option value="en">English</option>
                <option value="bilingual">双语</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">名称 *</label>
              <input name="name" defaultValue={site.name} required className="w-full h-9 px-3 border border-gray-300 r-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-gray-500">中文名</label>
              <input name="name_zh" defaultValue={site.name_zh || ''} className="w-full h-9 px-3 border border-gray-300 r-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">域名</label>
            <input name="domain" defaultValue={site.domain || ''} className="w-full h-9 px-3 border border-gray-300 r-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-gray-500">说明</label>
            <textarea name="description" defaultValue={site.description || ''} rows={2} className="w-full px-3 py-2 border border-gray-300 r-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex justify-between pt-2">
            <button type="button" onClick={handleDelete} className="text-sm text-red-600 hover:text-red-700 hover:underline">删除站点</button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(false)} className="h-9 px-4 border border-gray-300 text-sm r-lg hover:bg-gray-50">取消</button>
              <button type="submit" disabled={loading === 'saving'} className="h-9 px-4 bg-primary text-white text-sm font-medium r-lg hover:bg-primary-dark disabled:opacity-50">
                {loading === 'saving' ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // View mode
  return (
    <div className={`bg-white border r-xl p-6 ${site.status === 'active' ? 'border-green-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base">{site.name}</h3>
            <span
              className={`text-xs px-2 py-0.5 r-full font-medium cursor-pointer ${
                site.status === 'active' ? 'bg-green-100 text-green-700' :
                site.status === 'planned' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-500'
              }`}
              onClick={handleStatusToggle}
              title="点击切换状态"
            >
              {site.status === 'active' ? '运行中' : site.status === 'planned' ? '计划中' : '已禁用'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{site.name_zh}</p>
        </div>
        <button onClick={() => setEditing(true)} className="text-sm text-primary hover:underline">编辑</button>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500">域名</span>
          <span className="font-mono text-gray-700">{site.domain || '—'}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500">语言</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            site.locale === 'zh' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
          }`}>{site.locale === 'zh' ? '中文' : 'English'}</span>
        </div>

        {/* Regions */}
        <div className="py-2 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500">覆盖地区</span>
            <button onClick={() => setShowAddRegion(!showAddRegion)} className="text-xs text-primary hover:underline">+ 添加地区</button>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {siteRegions.map(region => (
              <span key={region.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs group relative">
                {region.name_zh || region.name_en}
                {region.is_primary && <span className="text-primary text-[10px]">★</span>}
                <span className="hidden group-hover:flex items-center gap-0.5 ml-1">
                  {!region.is_primary && (
                    <button onClick={() => handleSetPrimary(region.id)} className="text-yellow-500 hover:text-yellow-600" title="设为主要地区">★</button>
                  )}
                  <button onClick={() => handleRemoveRegion(region.id)} className="text-gray-400 hover:text-red-500" title="移除">×</button>
                </span>
              </span>
            ))}
            {siteRegions.length === 0 && <span className="text-xs text-gray-400">暂无地区</span>}
          </div>

          {showAddRegion && (
            <div className="mt-3 p-3 bg-gray-50 r-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">选择要添加的地区：</p>
              {availableRegions.length === 0 ? (
                <p className="text-xs text-gray-400">所有地区已添加</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableRegions.map(region => (
                    <button key={region.id} onClick={() => handleAddRegion(region.id)} disabled={loading === region.id}
                      className="text-xs bg-white border border-gray-300 px-3 py-1.5 r-lg hover:bg-primary hover:text-white hover:border-primary transition disabled:opacity-50">
                      {loading === region.id ? '...' : `+ ${region.name_zh || region.name_en}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {site.description && (
          <div className="py-2">
            <span className="text-gray-500 text-xs">{site.description}</span>
          </div>
        )}
      </div>

      {site.status === 'active' && (
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center"><p className="text-lg font-bold">{counts.articles}</p><p className="text-xs text-gray-500">文章</p></div>
          <div className="text-center"><p className="text-lg font-bold">{counts.businesses}</p><p className="text-xs text-gray-500">商家</p></div>
          <div className="text-center"><p className="text-lg font-bold">{counts.threads}</p><p className="text-xs text-gray-500">帖子</p></div>
        </div>
      )}
    </div>
  );
}
