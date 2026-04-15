'use client';

import { useState } from 'react';
import { submitLead } from '@/app/[locale]/(public)/actions';

interface LeadFormProps {
  businessId?: string;
  sourceType?: string;
  sourceArticleId?: string;
  className?: string;
}

export function LeadForm({ businessId, sourceType = 'business_page', sourceArticleId, className = '' }: LeadFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (status === 'success') {
    return (
      <div className={`p-4 bg-green-50 border border-green-200 r-lg text-center ${className}`}>
        <p className="text-sm text-green-700 font-medium">{message}</p>
      </div>
    );
  }

  const handleSubmit = async (formData: FormData) => {
    setStatus('loading');
    if (businessId) formData.set('business_id', businessId);
    formData.set('source_type', sourceType);
    if (sourceArticleId) formData.set('source_article_id', sourceArticleId);

    const result = await submitLead(formData);

    if (result.error) {
      setStatus('error');
      setMessage(result.error);
    } else {
      setStatus('success');
      setMessage(result.message || '提交成功！');
    }
  };

  return (
    <form action={handleSubmit} className={`space-y-3 ${className}`}>
      {status === 'error' && (
        <p className="text-xs text-red-500">{message}</p>
      )}
      <div>
        <input
          type="text"
          name="name"
          placeholder="你的姓名"
          className="w-full h-9 px-3 border border-border r-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        />
      </div>
      <div>
        <input
          type="tel"
          name="phone"
          placeholder="手机号码"
          className="w-full h-9 px-3 border border-border r-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        />
      </div>
      <div>
        <input
          type="email"
          name="email"
          placeholder="邮箱（可选）"
          className="w-full h-9 px-3 border border-border r-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        />
      </div>
      <div>
        <textarea
          name="message"
          placeholder="简单描述你的需求..."
          rows={3}
          className="w-full px-3 py-2 border border-border r-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full btn btn-primary h-10 text-sm disabled:opacity-50"
      >
        {status === 'loading' ? '提交中...' : '免费咨询'}
      </button>
      <p className="text-xs text-text-muted text-center">提交后商家将尽快与您联系</p>
    </form>
  );
}
