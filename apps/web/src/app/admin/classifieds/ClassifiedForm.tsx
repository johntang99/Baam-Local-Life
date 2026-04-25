'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createClassified, updateClassified } from './actions';
import { ImagePickerModal } from '@/components/admin/ImagePickerModal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

const categories = [
  { value: 'housing_rent', label: '🏠 房屋出租' },
  { value: 'housing_buy', label: '🏡 房屋买卖' },
  { value: 'jobs', label: '💼 诚聘招工' },
  { value: 'secondhand', label: '📦 二手商品' },
  { value: 'services', label: '🙋 寻求帮助' },
  { value: 'general', label: '📋 其他' },
];

const statuses = [
  { value: 'active', label: '活跃' },
  { value: 'expired', label: '已过期' },
  { value: 'removed', label: '已下架' },
];

interface Props {
  classified?: AnyRow | null;
  isNew: boolean;
  siteParams?: string;
  defaultAuthorId?: string;
}

export default function ClassifiedForm({ classified, isNew, siteParams = '', defaultAuthorId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const siteQuery = siteParams ? `?${siteParams}` : '';

  const meta = classified?.metadata || {};
  const [title, setTitle] = useState(classified?.title || '');
  const [body, setBody] = useState(classified?.body || '');
  const [category, setCategory] = useState(classified?.category || 'housing_rent');
  const [priceText, setPriceText] = useState(classified?.price_text || '');
  const [contactName, setContactName] = useState(classified?.contact_name || '');
  const [contactPhone, setContactPhone] = useState(classified?.contact_phone || '');
  const [contactEmail, setContactEmail] = useState(classified?.contact_email || '');
  const [contactWechat, setContactWechat] = useState(classified?.contact_wechat || '');
  const [status, setStatus] = useState(classified?.status || 'active');
  const [isFeatured, setIsFeatured] = useState(classified?.is_featured || false);

  // Category-specific
  const [bedrooms, setBedrooms] = useState(meta.bedrooms?.toString() || '');
  const [bathrooms, setBathrooms] = useState(meta.bathrooms?.toString() || '');
  const [rentAmount, setRentAmount] = useState(meta.rent_amount?.toString() || '');
  const [neighborhood, setNeighborhood] = useState(meta.neighborhood || '');
  const [salaryRange, setSalaryRange] = useState(meta.salary_range || '');
  const [jobType, setJobType] = useState(meta.job_type || '');
  const [company, setCompany] = useState(meta.company || '');
  const [condition, setCondition] = useState(meta.condition || '');
  const [originalPrice, setOriginalPrice] = useState(meta.original_price?.toString() || '');
  const [coverPhoto, setCoverPhoto] = useState(meta.cover_photo || '');
  const [photos, setPhotos] = useState<string[]>(meta.photos || []);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);

  const isHousing = category === 'housing_rent' || category === 'housing_buy';
  const isJobs = category === 'jobs';
  const isSecondhand = category === 'secondhand';

  const buildFormData = () => {
    const fd = new FormData();
    fd.set('title', title);
    fd.set('body', body);
    fd.set('category', category);
    fd.set('price_text', priceText);
    fd.set('contact_name', contactName);
    fd.set('contact_phone', contactPhone);
    fd.set('contact_email', contactEmail);
    fd.set('contact_wechat', contactWechat);
    fd.set('status', status);
    fd.set('is_featured', isFeatured ? 'true' : 'false');
    fd.set('cover_photo', coverPhoto);
    fd.set('photos', JSON.stringify(photos));
    if (defaultAuthorId) fd.set('author_id', defaultAuthorId);
    // Category-specific
    if (isHousing) {
      fd.set('bedrooms', bedrooms);
      fd.set('bathrooms', bathrooms);
      fd.set('rent_amount', rentAmount);
      fd.set('neighborhood', neighborhood);
    }
    if (isJobs) {
      fd.set('salary_range', salaryRange);
      fd.set('job_type', jobType);
      fd.set('company', company);
    }
    if (isSecondhand) {
      fd.set('condition', condition);
      fd.set('original_price', originalPrice);
    }
    return fd;
  };

  const handleSave = () => {
    startTransition(async () => {
      setError(null);
      const fd = buildFormData();
      if (isNew) {
        const result = await createClassified(fd);
        if (result.error) { setError(result.error); return; }
        router.push(`/admin/classifieds${siteQuery}`);
      } else {
        const result = await updateClassified(classified!.id, fd);
        if (result.error) { setError(result.error); return; }
        router.refresh();
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{isNew ? '新建分类信息' : '编辑分类信息'}</h1>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/admin/classifieds${siteQuery}`)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition">返回列表</button>
          <button onClick={handleSave} disabled={isPending} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50">
            {isPending ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
        {/* Left: Content */}
        <div className="flex-1 space-y-5">
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <label className="block text-sm font-medium mb-2">标题 <span className="text-red-500">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：法拉盛一室一厅出租" className="w-full h-10 px-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-5">
            <label className="block text-sm font-medium mb-2">详细描述</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="详细描述信息，支持换行" rows={6} className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 mb-4" />

            {/* Photos in content area */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">图片（最多9张）</label>
                <button
                  type="button"
                  onClick={() => setPhotoPickerOpen(true)}
                  className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  + 添加图片
                </button>
              </div>
              {photos.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotos(photos.filter((_, j) => j !== idx))}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted">暂无图片，点击上方按钮添加</p>
              )}
              <input
                type="text"
                placeholder="或直接粘贴图片 URL，按回车添加"
                className="w-full h-8 px-3 mt-2 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const url = (e.target as HTMLInputElement).value.trim();
                    if (url && photos.length < 9) {
                      setPhotos([...photos, url]);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            </div>

            <ImagePickerModal
              open={photoPickerOpen}
              folder="classifieds/photos"
              onClose={() => setPhotoPickerOpen(false)}
              onSelect={(url) => { if (photos.length < 9) setPhotos([...photos, url]); setPhotoPickerOpen(false); }}
            />
          </div>

          {/* Category-specific fields */}
          {isHousing && (
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <label className="block text-sm font-medium mb-3">房屋信息</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1">卧室数</label>
                  <input value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} type="number" placeholder="2" className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">卫生间数</label>
                  <input value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} type="number" placeholder="1" className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">月租金 ($)</label>
                  <input value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} type="number" placeholder="1800" className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">地区</label>
                  <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Flushing" className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
                </div>
              </div>
            </div>
          )}

          {isJobs && (
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <label className="block text-sm font-medium mb-3">招工信息</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1">薪资范围</label>
                  <input value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} placeholder="$18-25/时" className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">工作类型</label>
                  <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="w-full h-9 px-3 border border-border rounded-lg text-sm bg-white">
                    <option value="">请选择</option>
                    <option value="full_time">全职</option>
                    <option value="part_time">兼职</option>
                    <option value="remote">远程</option>
                    <option value="contract">合同</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-text-muted mb-1">公司/商家名称</label>
                  <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="公司名称" className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
                </div>
              </div>
            </div>
          )}

          {isSecondhand && (
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <label className="block text-sm font-medium mb-3">商品信息</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1">成色</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full h-9 px-3 border border-border rounded-lg text-sm bg-white">
                    <option value="">请选择</option>
                    <option value="new">全新</option>
                    <option value="like_new">9成新</option>
                    <option value="good">8成新</option>
                    <option value="fair">7成新</option>
                    <option value="used">一般</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">原价 ($)</label>
                  <input value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} type="number" placeholder="500" className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Settings */}
        <div className="w-72 space-y-5 flex-shrink-0">
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <label className="block text-sm font-medium mb-2">分类 <span className="text-red-500">*</span></label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-10 px-3 border border-border rounded-lg text-sm bg-white mb-4">
              {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            <label className="block text-sm font-medium mb-2">状态</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-10 px-3 border border-border rounded-lg text-sm bg-white">
              {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div>
                <label className="text-sm font-medium">首页精选</label>
                <p className="text-xs text-text-muted mt-0.5">显示在首页分类信息</p>
              </div>
              <button type="button" onClick={() => setIsFeatured(!isFeatured)} className={`relative w-11 h-6 rounded-full transition-colors ${isFeatured ? 'bg-primary' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isFeatured ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-5">
            <label className="block text-sm font-medium mb-2">价格</label>
            <input value={priceText} onChange={(e) => setPriceText(e.target.value)} placeholder="$1,800/月 或 面议" className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
          </div>

          {/* Cover Photo */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">封面图片</label>
              <button type="button" onClick={() => setCoverPickerOpen(true)} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                选择图片
              </button>
            </div>
            {coverPhoto ? (
              <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                <img src={coverPhoto} alt="cover" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setCoverPhoto('')} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
              </div>
            ) : (
              <div className="aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center text-text-muted text-xs mb-2">
                点击「选择图片」或粘贴URL
              </div>
            )}
            <input
              value={coverPhoto}
              onChange={(e) => setCoverPhoto(e.target.value)}
              placeholder="或直接粘贴图片 URL"
              className="w-full h-8 px-3 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <ImagePickerModal
              open={coverPickerOpen}
              folder="classifieds/covers"
              onClose={() => setCoverPickerOpen(false)}
              onSelect={(url) => { setCoverPhoto(url); setCoverPickerOpen(false); }}
            />
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-5">
            <label className="block text-sm font-medium mb-3">联系方式</label>
            <div className="space-y-3">
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="联系人" className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="电话" className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
              <input value={contactWechat} onChange={(e) => setContactWechat(e.target.value)} placeholder="微信号" className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
              <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="邮箱" className="w-full h-9 px-3 border border-border rounded-lg text-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
