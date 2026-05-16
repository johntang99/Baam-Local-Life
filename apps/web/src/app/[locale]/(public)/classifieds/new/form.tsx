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

    const phone = String(formData.get('contact_phone') || '').trim();
    const email = String(formData.get('contact_email') || '').trim();
    if (!phone && !email) {
      setLoading(false);
      setError('请至少填写电话或邮箱中的一种联系方式');
      return;
    }

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

        {/* Price (non-jobs only) */}
        {!isJobs && (
          <div>
            <label className="block text-sm fw-medium mb-1">价格</label>
            <input
              name="price_text"
              placeholder="$1,800/月 或 面议"
              className="w-full h-10 px-3 border border-border r-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
        )}

        {/* Category-specific */}
        {isHousing && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm fw-medium mb-1">卧室数</label>
              <input name="bedrooms" type="number" placeholder="2" className="w-full h-9 px-3 border border-border r-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm fw-medium mb-1">地区</label>
              <input name="neighborhood" placeholder="Flushing" className="w-full h-9 px-3 border border-border r-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm fw-medium mb-1">月租（数字）</label>
              <input name="rent_amount" type="number" min={0} placeholder="1800" className="w-full h-9 px-3 border border-border r-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm fw-medium mb-1">入住时间</label>
              <input name="move_in_date" type="date" className="w-full h-9 px-3 border border-border r-lg text-sm" />
            </div>
          </div>
        )}
        {isJobs && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm fw-medium mb-1">公司</label>
                <input name="company" placeholder="公司名（可选）" className="w-full h-9 px-3 border border-border r-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm fw-medium mb-1">地点</label>
                <input name="job_location" placeholder="Flushing / Brooklyn" className="w-full h-9 px-3 border border-border r-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm fw-medium mb-1">工作类型</label>
                <select name="job_type" className="w-full h-9 px-3 border border-border r-lg text-sm bg-white">
                  <option value="full_time">全职</option>
                  <option value="part_time">兼职</option>
                  <option value="remote">远程</option>
                </select>
              </div>
              <div>
                <label className="block text-sm fw-medium mb-1">时间</label>
                <input name="work_hours" placeholder="周一至周五 9:00-17:30" className="w-full h-9 px-3 border border-border r-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm fw-medium mb-1">薪资</label>
              <input name="salary_range" placeholder="$18-25/时" className="w-full h-9 px-3 border border-border r-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm fw-medium mb-1">要求</label>
              <textarea
                name="job_requirements"
                rows={3}
                placeholder={'例：\n- 需合法工作身份\n- 中英文沟通\n- 有相关经验优先'}
                className="w-full px-3 py-2 border border-border r-lg text-sm resize-y"
              />
            </div>
          </div>
        )}
        {isSecondhand && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm fw-medium mb-1">成色</label>
              <select name="condition" className="w-full h-9 px-3 border border-border r-lg text-sm bg-white">
                <option value="new">全新</option>
                <option value="like_new">9成新</option>
                <option value="good">8成新</option>
                <option value="used">一般</option>
              </select>
            </div>
            <div>
              <label className="block text-sm fw-medium mb-1">品牌</label>
              <input name="brand" placeholder="Apple / IKEA / 其他" className="w-full h-9 px-3 border border-border r-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm fw-medium mb-1">原价（可选）</label>
              <input name="original_price" type="number" min={0} placeholder="2000" className="w-full h-9 px-3 border border-border r-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm fw-medium mb-1">交易地点</label>
              <input name="meetup_location" placeholder="Flushing / 自取" className="w-full h-9 px-3 border border-border r-lg text-sm" />
            </div>
          </div>
        )}

        {/* Body */}
        <div>
          <label className="block text-sm fw-medium mb-1">{isJobs ? '补充说明（可选）' : '详细描述'}</label>
          <textarea
            name="body"
            rows={5}
            placeholder={isJobs ? '如：工作环境、福利、到岗时间等补充信息...' : '详细描述你要发布的信息...'}
            className="w-full px-3 py-2 border border-border r-lg text-sm resize-y focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm fw-medium mb-2">联系方式</label>
          <div className="grid grid-cols-2 gap-3">
            <input name="contact_name" placeholder="联系人" className="w-full h-9 px-3 border border-border r-lg text-sm" />
            <input name="contact_phone" placeholder="电话" className="w-full h-9 px-3 border border-border r-lg text-sm" />
            <input name="contact_email" type="email" placeholder="邮箱" className="w-full h-9 px-3 border border-border r-lg text-sm" />
          </div>
          <p className="mt-1 text-xs text-text-muted">请至少填写电话或邮箱</p>
        </div>

        <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary text-text-inverse fw-medium r-lg hover:bg-primary-dark transition disabled:opacity-50">
          {loading ? '发布中...' : '发布信息'}
        </button>
      </form>
    </Card>
  );
}
