'use client';

import { useState } from 'react';

const REPORT_REASONS = [
  { value: 'spam', label: '垃圾信息 / Spam' },
  { value: 'false', label: '虚假内容 / Misleading' },
  { value: 'harassment', label: '骚扰或仇恨 / Harassment' },
  { value: 'copyright', label: '侵犯版权 / Copyright' },
  { value: 'fraud', label: '欺诈 / Fraud' },
  { value: 'other', label: '其他 / Other' },
];

interface ReportButtonProps {
  contentType: 'post' | 'classified' | 'comment';
  contentId: string;
  variant?: 'icon' | 'text' | 'full';
  className?: string;
}

export function ReportButton({ contentType, contentId, variant = 'text', className = '' }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // For now, log to console. In production, this would call a server action
    // to insert into a `content_reports` table.
    console.log('Report submitted:', { contentType, contentId, reason, detail });
    setSubmitted(true);
    setTimeout(() => { setOpen(false); setSubmitted(false); setReason(''); setDetail(''); }, 2000);
  };

  const label = contentType === 'classified' ? '举报此信息' : '举报此内容';

  if (submitted) {
    return (
      <span className={`text-xs text-green-600 ${className}`}>
        感谢举报，我们将在48小时内处理
      </span>
    );
  }

  if (open) {
    return (
      <div className={`p-3 border border-red-100 bg-red-50/50 r-lg space-y-2 ${className}`} style={{ maxWidth: 320 }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-red-600">{label}</span>
          <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">取消</button>
        </div>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full text-xs border border-gray-200 r-md px-2 py-1.5 bg-white focus:ring-1 focus:ring-red-300 outline-none"
        >
          <option value="">选择举报原因...</option>
          {REPORT_REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="补充说明（可选）"
          className="w-full text-xs border border-gray-200 r-md px-2 py-1.5 bg-white resize-none focus:ring-1 focus:ring-red-300 outline-none"
          rows={2}
        />
        <button
          onClick={handleSubmit}
          disabled={!reason}
          className="w-full text-xs font-medium py-1.5 r-md bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          提交举报
        </button>
        <p className="text-[10px] text-gray-400 leading-snug">
          举报者身份将严格保密。详见
          <a href="/zh/community-guidelines" className="text-red-400 hover:underline ml-0.5">社区规范</a>
        </p>
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] text-gray-400 hover:text-red-500 hover:bg-red-50 r-md transition-colors ${className}`}
        title={label}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
        </svg>
      </button>
    );
  }

  if (variant === 'full') {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 bg-gray-50 r-lg hover:bg-red-50 hover:text-red-500 transition ${className}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
        </svg>
        举报
      </button>
    );
  }

  // variant === 'text'
  return (
    <button
      onClick={() => setOpen(true)}
      className={`text-xs text-gray-400 hover:text-red-500 transition ${className}`}
    >
      举报
    </button>
  );
}
