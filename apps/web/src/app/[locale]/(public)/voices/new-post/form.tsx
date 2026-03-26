'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createVoicePost } from '@/app/[locale]/(public)/actions';

const postTypes = [
  { key: 'short_post', label: '短帖', desc: '分享一段想法、经验或推荐' },
  { key: 'blog', label: '长文', desc: '深度内容、攻略、评测' },
  { key: 'recommendation', label: '推荐', desc: '推荐商家、餐厅、服务' },
  { key: 'question', label: '提问', desc: '向社区寻求建议' },
  { key: 'opinion', label: '观点', desc: '对本地话题发表看法' },
];

interface VoicePostFormProps {
  isLoggedIn: boolean;
}

export function VoicePostForm({ isLoggedIn }: VoicePostFormProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState('short_post');
  const router = useRouter();

  if (!isLoggedIn) {
    return (
      <div className="card p-8 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-text-secondary mb-2">请先登录后再发布内容</p>
        <p className="text-sm text-text-muted">点击右上角「登录/注册」按钮</p>
      </div>
    );
  }

  const handleSubmit = async (formData: FormData) => {
    setError('');
    setLoading(true);
    formData.set('post_type', postType);

    const result = await createVoicePost(formData);

    if (result.error) {
      if (result.error === 'UNAUTHORIZED') {
        setError('请先登录');
      } else {
        setError(result.error);
      }
      setLoading(false);
      return;
    }

    if (result.redirect) {
      router.push(`/zh${result.redirect}`);
    } else {
      router.push('/zh/voices');
    }
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      {/* Post Type Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">内容类型</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {postTypes.map((type) => (
            <button
              key={type.key}
              type="button"
              onClick={() => setPostType(type.key)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                postType === type.key
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-gray-300'
              }`}
            >
              <span className="text-sm font-medium block">{type.label}</span>
              <span className="text-xs text-text-muted">{type.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Title (optional for short posts) */}
      <div>
        <label htmlFor="voice-title" className="block text-sm font-medium mb-1">
          标题 {postType !== 'short_post' && <span className="text-accent-red">*</span>}
        </label>
        <input
          id="voice-title"
          name="title"
          type="text"
          placeholder={postType === 'short_post' ? '可选标题' : '输入标题'}
          required={postType !== 'short_post'}
          maxLength={120}
          className="w-full h-10 px-3 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        />
      </div>

      {/* Content */}
      <div>
        <label htmlFor="voice-content" className="block text-sm font-medium mb-1">
          内容 <span className="text-accent-red">*</span>
        </label>
        <textarea
          id="voice-content"
          name="content"
          placeholder={'写下你想分享的内容...\n\n支持 Markdown 格式'}
          required
          className="w-full h-48 px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-y"
        />
        <p className="text-xs text-text-muted mt-1">支持 Markdown 格式</p>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="voice-tags" className="block text-sm font-medium mb-1">标签</label>
        <input
          id="voice-tags"
          name="tags"
          type="text"
          placeholder="用逗号分隔（如：美食, 法拉盛, 推荐）"
          className="w-full h-10 px-3 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        />
        <p className="text-xs text-text-muted mt-1">最多 5 个标签</p>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn btn-primary px-6 disabled:opacity-50">
          {loading ? '发布中...' : '发布'}
        </button>
      </div>
    </form>
  );
}
