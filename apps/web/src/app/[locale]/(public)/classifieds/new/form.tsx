'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPublicClassified } from '../actions';
import { Card } from '@/components/ui/card';

const categories = [
  { value: 'housing_rent', label: '🏠 房屋出租' },
  { value: 'jobs', label: '💼 诚聘招工' },
  { value: 'secondhand', label: '📦 二手商品' },
  { value: 'services', label: '🙋 寻求帮助' },
];

export function ClassifiedNewForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('housing_rent');

  const handleSubmit = async (formData: FormData) => {
    setError('');
    setLoading(true);
    formData.set('category', category);

    const result = await createPublicClassified(formData);
    setLoading(false);

    if (result.error) {
      if (result.error === 'UNAUTHORIZED') setError('请先登录');
      else setError(result.error);
      return;
    }

    if (result.redirect) {
      router.push(`/zh${result.redirect}`);
    } else {
      router.push('/zh/classifieds');
    }
  };

  const isHousing = category === 'housing_rent';
  const isJobs = category === 'jobs';
  const isSecondhand = category === 'secondhand';

  return (
    <Card className="p-6">
      <form action={handleSubmit} className="space-y-5">
        {error && <div className="p-3 bg-accent-red-light border border-accent-red text-accent-red text-sm r-lg">{error}</div>}

        {/* Category */}
        <div>
          <label className="block text-sm fw-medium mb-1">分类 <span className="text-accent-red">*</span></label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`p-3 text-sm text-left r-lg border transition ${category === c.value ? 'border-primary bg-primary-50 fw-medium' : 'border-border hover:border-primary-200'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm fw-medium mb-1">标题 <span className="text-accent-red">*</span></label>
          <input name="title" required maxLength={120} placeholder="简洁描述，如：法拉盛一室一厅出租" className="w-full h-10 px-3 border border-border r-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm fw-medium mb-1">价格</label>
          <input name="price_text" placeholder="$1,800/月 或 面议" className="w-full h-10 px-3 border border-border r-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
        </div>

        {/* Category-specific */}
        {isHousing && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">卧室数</label>
              <input name="bedrooms" type="number" placeholder="2" className="w-full h-9 px-3 border border-border r-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">地区</label>
              <input name="neighborhood" placeholder="Flushing" className="w-full h-9 px-3 border border-border r-lg text-sm" />
            </div>
          </div>
        )}
        {isJobs && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">薪资</label>
              <input name="salary_range" placeholder="$18-25/时" className="w-full h-9 px-3 border border-border r-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">工作类型</label>
              <select name="job_type" className="w-full h-9 px-3 border border-border r-lg text-sm bg-white">
                <option value="full_time">全职</option>
                <option value="part_time">兼职</option>
                <option value="remote">远程</option>
              </select>
            </div>
          </div>
        )}
        {isSecondhand && (
          <div>
            <label className="block text-xs text-text-muted mb-1">成色</label>
            <select name="condition" className="w-full h-9 px-3 border border-border r-lg text-sm bg-white">
              <option value="new">全新</option>
              <option value="like_new">9成新</option>
              <option value="good">8成新</option>
              <option value="used">一般</option>
            </select>
          </div>
        )}

        {/* Body */}
        <div>
          <label className="block text-sm fw-medium mb-1">详细描述</label>
          <textarea name="body" rows={5} placeholder="详细描述你要发布的信息..." className="w-full px-3 py-2 border border-border r-lg text-sm resize-y focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm fw-medium mb-2">联系方式</label>
          <div className="grid grid-cols-2 gap-3">
            <input name="contact_name" placeholder="联系人" className="w-full h-9 px-3 border border-border r-lg text-sm" />
            <input name="contact_phone" placeholder="电话" className="w-full h-9 px-3 border border-border r-lg text-sm" />
            <input name="contact_wechat" placeholder="微信号" className="w-full h-9 px-3 border border-border r-lg text-sm" />
          </div>
        </div>

        <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary text-text-inverse fw-medium r-lg hover:bg-primary-dark transition disabled:opacity-50">
          {loading ? '发布中...' : '发布信息'}
        </button>
      </form>
    </Card>
  );
}
