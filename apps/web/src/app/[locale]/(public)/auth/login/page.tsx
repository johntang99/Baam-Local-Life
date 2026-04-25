'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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
    router.push('/');
    router.refresh();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName || email.split('@')[0] } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSuccess('注册成功！请检查邮箱确认链接。');
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/`,
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess('重置链接已发送到邮箱');
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '48px 16px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--ed-ink)', color: 'var(--ed-paper)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--ed-font-serif-italic)', fontStyle: 'italic', fontSize: 18, fontWeight: 500,
          }}>B</div>
          <span style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 20, fontWeight: 600 }}>Baam</span>
        </Link>
        <h1 style={{ fontFamily: 'var(--ed-font-serif)', fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
          {tab === 'login' ? '登录' : tab === 'register' ? '注册' : '重置密码'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ed-ink-muted)' }}>
          {tab === 'login' ? '登录你的 Baam 账号' : tab === 'register' ? '创建新账号' : '输入邮箱接收重置链接'}
        </p>
      </div>

      {/* Tabs */}
      {tab !== 'forgot' && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--ed-surface)', borderRadius: 'var(--ed-radius-md)', padding: 4 }}>
          {(['login', 'register'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); resetForm(); }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 'var(--ed-radius-md)',
                fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer',
                background: tab === t ? 'var(--ed-surface-elev)' : 'transparent',
                color: tab === t ? 'var(--ed-ink)' : 'var(--ed-ink-muted)',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t === 'login' ? '登录' : '注册'}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 'var(--ed-radius-md)', background: 'rgba(199,62,29,0.08)', color: 'var(--ed-accent)', fontSize: 13 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 'var(--ed-radius-md)', background: 'var(--ed-tag-green-bg)', color: 'var(--ed-tag-green-text)', fontSize: 13 }}>
          {success}
        </div>
      )}

      {/* Login Form */}
      {tab === 'login' && (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ed-ink-soft)' }}>邮箱</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 'var(--ed-radius-md)', border: '1px solid var(--ed-line-strong)', fontSize: 14, background: 'var(--ed-surface-elev)', color: 'var(--ed-ink)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ed-ink-soft)' }}>密码</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', height: 42, padding: '0 42px 0 14px', borderRadius: 'var(--ed-radius-md)', border: '1px solid var(--ed-line-strong)', fontSize: 14, background: 'var(--ed-surface-elev)', color: 'var(--ed-ink)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--ed-ink-muted)', display: 'flex' }}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit" disabled={loading}
            style={{ height: 44, borderRadius: 'var(--ed-radius-md)', border: 'none', background: 'var(--ed-ink)', color: 'var(--ed-paper)', fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1, marginTop: 4 }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
          <button
            type="button"
            onClick={() => { setTab('forgot'); resetForm(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ed-accent)', padding: 0, textAlign: 'center' }}
          >
            忘记密码？
          </button>
        </form>
      )}

      {/* Register Form */}
      {tab === 'register' && (
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ed-ink-soft)' }}>显示名称</label>
            <input
              type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              placeholder="你的昵称"
              style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 'var(--ed-radius-md)', border: '1px solid var(--ed-line-strong)', fontSize: 14, background: 'var(--ed-surface-elev)', color: 'var(--ed-ink)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ed-ink-soft)' }}>邮箱</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 'var(--ed-radius-md)', border: '1px solid var(--ed-line-strong)', fontSize: 14, background: 'var(--ed-surface-elev)', color: 'var(--ed-ink)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ed-ink-soft)' }}>密码</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="至少6位"
                style={{ width: '100%', height: 42, padding: '0 42px 0 14px', borderRadius: 'var(--ed-radius-md)', border: '1px solid var(--ed-line-strong)', fontSize: 14, background: 'var(--ed-surface-elev)', color: 'var(--ed-ink)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--ed-ink-muted)', display: 'flex' }}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit" disabled={loading}
            style={{ height: 44, borderRadius: 'var(--ed-radius-md)', border: 'none', background: 'var(--ed-ink)', color: 'var(--ed-paper)', fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1, marginTop: 4 }}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
      )}

      {/* Forgot Password Form */}
      {tab === 'forgot' && (
        <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ed-ink-soft)' }}>邮箱</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 'var(--ed-radius-md)', border: '1px solid var(--ed-line-strong)', fontSize: 14, background: 'var(--ed-surface-elev)', color: 'var(--ed-ink)' }}
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{ height: 44, borderRadius: 'var(--ed-radius-md)', border: 'none', background: 'var(--ed-ink)', color: 'var(--ed-paper)', fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1, marginTop: 4 }}
          >
            {loading ? '发送中...' : '发送重置链接'}
          </button>
          <button
            type="button"
            onClick={() => { setTab('login'); resetForm(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ed-accent)', padding: 0, textAlign: 'center' }}
          >
            返回登录
          </button>
        </form>
      )}
    </div>
  );
}
