'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createDeal, updateDeal } from './actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const discountTypes = [
  { value: 'price', label: '💰 折扣价（原价→优惠价）' },
  { value: 'percent', label: '🏷️ 折扣百分比（X% OFF）' },
  { value: 'bogo', label: '🎁 买一送一' },
  { value: 'freebie', label: '🆓 免费赠品' },
  { value: 'other', label: '📋 其他（自定义描述）' },
];

const statuses = [
  { value: 'draft', label: '草稿' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
];

interface DealFormProps {
  deal?: AnyRow | null;
  businesses: AnyRow[];
  isNew: boolean;
  siteParams?: string;
}

export default function DealForm({ deal, businesses, isNew, siteParams = '' }: DealFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [titleZh, setTitleZh] = useState(deal?.title_zh || '');
  const [shortDescZh, setShortDescZh] = useState(deal?.short_desc_zh || '');
  const [longDescZh, setLongDescZh] = useState(deal?.long_desc_zh || '');
  const [discountType, setDiscountType] = useState(deal?.discount_type || 'price');
  const [originalPrice, setOriginalPrice] = useState(deal?.original_price?.toString() || '');
  const [discountPrice, setDiscountPrice] = useState(deal?.discount_price?.toString() || '');
  const [discountPercent, setDiscountPercent] = useState(deal?.discount_percent?.toString() || '');
  const [discountLabel, setDiscountLabel] = useState(deal?.discount_label || '');
  const [businessId, setBusinessId] = useState(deal?.business_id || '');
  const [coverPhoto, setCoverPhoto] = useState(deal?.cover_photo || '');
  const [externalUrl, setExternalUrl] = useState(deal?.external_url || '');
  const [startDate, setStartDate] = useState(deal?.start_date || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(deal?.end_date || '');
  const [status, setStatus] = useState(deal?.status || 'draft');
  const [isFeatured, setIsFeatured] = useState(deal?.is_featured || false);
  const [bizSearch, setBizSearch] = useState('');

  const siteQuery = siteParams ? `?${siteParams}` : '';

  const filteredBiz = businesses.filter((b) => {
    if (!bizSearch) return true;
    const name = (b.display_name_zh || b.display_name || '').toLowerCase();
    return name.includes(bizSearch.toLowerCase());
  }).slice(0, 20);

  const buildFormData = () => {
    const fd = new FormData();
    fd.set('title_zh', titleZh);
    fd.set('short_desc_zh', shortDescZh);
    fd.set('long_desc_zh', longDescZh);
    fd.set('discount_type', discountType);
    fd.set('original_price', originalPrice);
    fd.set('discount_price', discountPrice);
    fd.set('discount_percent', discountPercent);
    fd.set('discount_label', discountLabel);
    fd.set('business_id', businessId);
    fd.set('cover_photo', coverPhoto);
    fd.set('external_url', externalUrl);
    fd.set('start_date', startDate);
    fd.set('end_date', endDate);
    fd.set('status', status);
    fd.set('is_featured', isFeatured ? 'true' : 'false');
    return fd;
  };

  const handleSave = () => {
    startTransition(async () => {
      setError(null);
      const fd = buildFormData();
      if (isNew) {
        const result = await createDeal(fd);
        if (result.error) { setError(result.error); return; }
        router.push(`/admin/deals${siteQuery}`);
      } else {
        const result = await updateDeal(deal!.id, fd);
        if (result.error) { setError(result.error); return; }
        router.refresh();
      }
    });
  };

  const selectedBizName = businesses.find(b => b.id === businessId)?.display_name_zh || businesses.find(b => b.id === businessId)?.display_name || '';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{isNew ? '新建优惠' : '编辑优惠'}</h1>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/admin/deals${siteQuery}`)} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
            返回列表
          </button>
          <button onClick={handleSave} disabled={isPending} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50">
            {isPending ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
        {/* Left: Main content */}
        <div className="flex-1 space-y-5">
          {/* Title */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <label className="block text-sm font-medium mb-2">优惠标题 <span className="text-red-500">*</span></label>
            <input
              value={titleZh}
              onChange={(e) => setTitleZh(e.target.value)}
              placeholder="例：左宗棠鸡限时特惠 / 开业全场9折"
              className="w-full h-10 px-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Short desc */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <label className="block text-sm font-medium mb-2">简短描述（卡片展示）</label>
            <textarea
              value={shortDescZh}
              onChange={(e) => setShortDescZh(e.target.value)}
              placeholder="120字以内，用于首页卡片展示"
              rows={2}
              maxLength={150}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-text-muted mt-1 text-right">{shortDescZh.length}/150</p>
          </div>

          {/* Discount Type */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <label className="block text-sm font-medium mb-2">折扣类型 <span className="text-red-500">*</span></label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="w-full h-10 px-3 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {discountTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            {/* Conditional fields */}
            {discountType === 'price' && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1">原价 ($)</label>
                  <input type="number" step="0.01" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="40.00" className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">优惠价 ($)</label>
                  <input type="number" step="0.01" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} placeholder="25.00" className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
                </div>
              </div>
            )}
            {discountType === 'percent' && (
              <div className="mt-4">
                <label className="block text-xs text-text-muted mb-1">折扣百分比 (%)</label>
                <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="10" className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
              </div>
            )}
            {(discountType === 'bogo' || discountType === 'freebie' || discountType === 'other') && (
              <div className="mt-4">
                <label className="block text-xs text-text-muted mb-1">折扣说明</label>
                <input value={discountLabel} onChange={(e) => setDiscountLabel(e.target.value)} placeholder="买一送一 / 前100位送限定礼盒" className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
              </div>
            )}
          </div>

          {/* Long desc */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <label className="block text-sm font-medium mb-2">详细描述（详情页展示）</label>
            <textarea
              value={longDescZh}
              onChange={(e) => setLongDescZh(e.target.value)}
              placeholder="完整的优惠说明，支持Markdown格式"
              rows={6}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Right: Settings */}
        <div className="w-72 space-y-5 flex-shrink-0">
          {/* Status */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <label className="block text-sm font-medium mb-2">状态</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-10 px-3 border border-border rounded-lg text-sm bg-white">
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div>
                <label className="text-sm font-medium">首页精选</label>
                <p className="text-xs text-text-muted mt-0.5">精选优惠显示在首页</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFeatured(!isFeatured)}
                className={`relative w-11 h-6 rounded-full transition-colors ${isFeatured ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isFeatured ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>

          {/* Business */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <label className="block text-sm font-medium mb-2">关联商家</label>
            <input
              value={bizSearch}
              onChange={(e) => setBizSearch(e.target.value)}
              placeholder="搜索商家..."
              className="w-full h-9 px-3 border border-border rounded-lg text-sm mb-2"
            />
            {selectedBizName && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-primary/5 rounded-lg">
                <span className="text-sm flex-1 truncate">{selectedBizName}</span>
                <button onClick={() => setBusinessId('')} className="text-xs text-red-400 hover:text-red-600">移除</button>
              </div>
            )}
            <div className="max-h-32 overflow-y-auto border border-border rounded-lg">
              {filteredBiz.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { setBusinessId(b.id); setBizSearch(''); }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 truncate ${b.id === businessId ? 'bg-primary/5 font-medium' : ''}`}
                >
                  {b.display_name_zh || b.display_name}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <label className="block text-sm font-medium mb-2">有效期</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">开始日期</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">结束日期（留空=不限）</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
              </div>
            </div>
          </div>

          {/* Cover photo & external URL */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <label className="block text-sm font-medium mb-2">封面图片 URL</label>
            <input value={coverPhoto} onChange={(e) => setCoverPhoto(e.target.value)} placeholder="https://..." className="w-full h-9 px-3 border border-border rounded-lg text-sm mb-3" />
            {coverPhoto && <img src={coverPhoto} alt="preview" className="w-full h-24 object-cover rounded-lg mb-3" />}

            <label className="block text-sm font-medium mb-2">外部链接</label>
            <input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="商家优惠页面链接" className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
