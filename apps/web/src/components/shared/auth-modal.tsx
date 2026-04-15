'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  if (!isOpen) return null;

  const resetForm = () => { setError(''); setSuccess(''); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message === 'Invalid login credentials' ? '邮箱或密码错误' : error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onClose();
    router.refresh();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    // If email confirmation is required, user won't have a session yet
    if (data.user && !data.session) {
      setSuccess('注册成功！请查看邮箱确认链接后即可登录。');
      return;
    }

    // Auto-confirmed (dev mode or email not required)
    onClose();
    router.refresh();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/zh/settings`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess('密码重置邮件已发送，请查看邮箱。');
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const inputClass = 'w-full h-11 px-4 border border-gray-300 r-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={onClose}>
      <div className="bg-white r-xl p-8 max-w-md w-[90%] shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {tab === 'login' ? '登录 Baam' : tab === 'register' ? '注册 Baam' : '重置密码'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* Tabs (hide on forgot password) */}
        {tab !== 'forgot' && (
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`flex-1 text-center pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'login' ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
              onClick={() => { setTab('login'); resetForm(); }}
            >
              登录
            </button>
            <button
              className={`flex-1 text-center pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'register' ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
              onClick={() => { setTab('register'); resetForm(); }}
            >
              注册
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm r-lg">{error}</div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm r-lg">{success}</div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required className={inputClass} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">密码</label>
                <button type="button" onClick={() => { setTab('forgot'); resetForm(); }} className="text-xs text-primary hover:underline">忘记密码？</button>
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="输入密码" required className={inputClass} />
            </div>
            <button type="submit" disabled={loading} className="w-full h-11 bg-primary text-white font-medium r-lg hover:bg-primary-dark transition disabled:opacity-50">
              {loading ? '登录中...' : '登录'}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">或者</span></div>
            </div>

            <button
              type="button" onClick={handleGoogleLogin}
              className="w-full h-11 border border-gray-300 r-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              使用 Google 登录
            </button>
          </form>
        ) : tab === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="你的显示名称" required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="至少6个字符" required minLength={6} className={inputClass} />
            </div>
            <button type="submit" disabled={loading} className="w-full h-11 bg-primary text-white font-medium r-lg hover:bg-primary-dark transition disabled:opacity-50">
              {loading ? '注册中...' : '创建账号'}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">或者</span></div>
            </div>

            <button
              type="button" onClick={handleGoogleLogin}
              className="w-full h-11 border border-gray-300 r-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              使用 Google 注册
            </button>

            <p className="text-xs text-gray-400 text-center">注册即表示你同意 <a href="#" className="text-primary">使用条款</a> 和 <a href="#" className="text-primary">隐私政策</a></p>
          </form>
        ) : (
          /* Forgot Password */
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-sm text-gray-600 mb-2">输入你注册时使用的邮箱，我们将发送密码重置链接。</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required className={inputClass} />
            </div>
            <button type="submit" disabled={loading} className="w-full h-11 bg-primary text-white font-medium r-lg hover:bg-primary-dark transition disabled:opacity-50">
              {loading ? '发送中...' : '发送重置链接'}
            </button>
            <button type="button" onClick={() => { setTab('login'); resetForm(); }} className="w-full text-sm text-primary hover:underline">
              返回登录
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
