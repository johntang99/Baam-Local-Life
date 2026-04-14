'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useAdminSite } from './AdminSiteContext';

const LOCALES = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
];

const pageTitles: Record<string, string> = {
  '/admin/articles/new': '新建文章',
  '/admin/articles': '内容管理',
  '/admin/businesses/new': '新建商家',
  '/admin/businesses': '商家管理',
  '/admin/forum': '论坛管理',
  '/admin/voices': '达人管理',
  '/admin/events/new': '新建活动',
  '/admin/events': '活动管理',
  '/admin/leads': '线索管理',
  '/admin/sites': '站点管理',
  '/admin/users': '用户管理',
  '/admin/ai-jobs': 'AI任务',
  '/admin/sponsors': '广告管理',
  '/admin/settings': '系统设置',
  '/admin': 'Dashboard',
};

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentSite, sites, setSite, setLocale, loading } = useAdminSite();

  function pushAdminContext(nextSiteSlug: string, nextLocale: string) {
    const p = new URLSearchParams(searchParams?.toString() || '');
    p.set('region', nextSiteSlug);
    p.set('locale', nextLocale);
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
    router.refresh();
  }

  useEffect(() => {
    if (loading) return;
    const qRegion = searchParams?.get('region') || '';
    const qLocale = searchParams?.get('locale') || '';
    if (qRegion === currentSite.slug && qLocale === currentSite.locale) return;
    pushAdminContext(currentSite.slug, currentSite.locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, currentSite.slug, currentSite.locale]);

  // Find best matching page title (longest prefix match)
  const pageTitle = Object.entries(pageTitles)
    .filter(([path]) => pathname.startsWith(path))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] || 'Admin';

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-xs text-gray-400">Admin / {pageTitle}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Site selector — from context, persists in localStorage */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 hidden sm:inline">站点</label>
            <select
              value={currentSite.slug}
              onChange={(e) => {
                const nextSlug = e.target.value;
                const nextSite = sites.find((s) => s.slug === nextSlug);
                const nextLocale = nextSite?.locale || currentSite.locale || 'zh';
                setSite(nextSlug);
                pushAdminContext(nextSlug, nextLocale);
              }}
              disabled={loading}
              className="h-9 px-3 pr-8 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none cursor-pointer"
            >
              {sites.map(site => (
                <option key={site.slug} value={site.slug}>{site.name}</option>
              ))}
            </select>
          </div>

          {/* Locale selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 hidden sm:inline">语言</label>
            <select
              value={currentSite.locale}
              onChange={(e) => {
                const nextLocale = e.target.value;
                setLocale(nextLocale);
                pushAdminContext(currentSite.slug, nextLocale);
              }}
              className="h-9 px-3 pr-8 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none cursor-pointer"
            >
              {LOCALES.map(loc => (
                <option key={loc.value} value={loc.value}>{loc.label}</option>
              ))}
            </select>
          </div>

          {/* Notification bell */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Visit site link */}
          <a href={`/${currentSite.locale}`} target="_blank" className="hidden sm:flex items-center gap-1 text-xs text-gray-500 hover:text-primary px-2 py-1 rounded hover:bg-gray-100">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            查看网站
          </a>
        </div>
      </div>
    </div>
  );
}
