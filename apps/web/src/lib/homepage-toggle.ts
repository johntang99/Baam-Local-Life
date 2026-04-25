/**
 * Homepage version toggle.
 *
 * Priority order:
 * 1. NEXT_PUBLIC_HOMEPAGE_VERSION env var ('v1' | 'v2')
 * 2. site_settings table key 'homepage_version'
 * 3. Default: 'v1'
 *
 * Usage in original page.tsx:
 *   const version = await getHomepageVersion();
 *   if (version === 'v2') redirect('/homepage-v2');
 */

import { getPublicSiteSetting } from '@/lib/site-settings-public';

export type HomepageVersion = 'v1' | 'v2';

export async function getHomepageVersion(): Promise<HomepageVersion> {
  // 1. Check env var (fastest, no DB call)
  const envVersion = process.env.NEXT_PUBLIC_HOMEPAGE_VERSION;
  if (envVersion === 'v2') return 'v2';
  if (envVersion === 'v1') return 'v1';

  // 2. Check site_settings DB
  try {
    const setting = await getPublicSiteSetting('homepage_version');
    if (setting && String(setting) === 'v2') return 'v2';
  } catch {
    // DB unavailable — fall through to default
  }

  return 'v1';
}
