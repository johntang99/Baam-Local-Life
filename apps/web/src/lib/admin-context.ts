/**
 * Admin site context — resolves site/region/locale from URL params + database
 *
 * Sites are stored in the `sites` table with many-to-many region mapping
 * via `site_regions`. Admins can add/remove regions through the admin panel
 * as coverage areas expand.
 *
 * Example: "NY Chinese" starts with Flushing, Queens, NYC
 * Later adds: Brooklyn, Manhattan, Bronx, etc.
 */

import { createAdminClient } from '@/lib/supabase/admin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export interface AdminSiteContext {
  siteId: string;
  siteSlug: string;
  siteName: string;
  locale: string;
  regionIds: string[];  // UUID array for DB queries
}

export interface SiteOption {
  id: string;
  slug: string;
  name: string;
  name_zh: string | null;
  locale: string;
  status: string;
}

/**
 * Fetch all available sites from DB (for header dropdown)
 */
export async function getAvailableSites(): Promise<SiteOption[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('sites')
    .select('id, slug, name, name_zh, locale, status')
    .order('sort_order', { ascending: true });
  return (data || []) as SiteOption[];
}

/**
 * Resolve full site context from URL search params.
 * Queries the database to get the site's region IDs.
 */
export async function getAdminSiteContext(
  searchParams: Record<string, string | string[] | undefined>
): Promise<AdminSiteContext> {
  const siteSlug = typeof searchParams.region === 'string' ? searchParams.region : '';
  const localeParam = typeof searchParams.locale === 'string' ? searchParams.locale : '';

  const supabase = createAdminClient();

  // Find the site (by slug or default)
  let site: AnyRow | null = null;
  if (siteSlug) {
    const { data } = await supabase.from('sites').select('*').eq('slug', siteSlug).single();
    site = data as AnyRow | null;
  }
  if (!site) {
    const { data } = await supabase.from('sites').select('*').eq('is_default', true).single();
    site = data as AnyRow | null;
  }
  if (!site) {
    const { data } = await supabase.from('sites').select('*').order('created_at').limit(1).single();
    site = data as AnyRow | null;
  }

  if (!site) {
    // Fallback if no sites table exists yet
    return {
      siteId: '',
      siteSlug: 'ny-zh',
      siteName: 'New York Chinese',
      locale: localeParam || 'zh',
      regionIds: [],
    };
  }

  // Get all region IDs for this site
  const { data: siteRegions } = await supabase
    .from('site_regions')
    .select('region_id')
    .eq('site_id', site.id);
  const regionIds = (siteRegions || []).map((sr: AnyRow) => sr.region_id);

  return {
    siteId: site.id,
    siteSlug: site.slug,
    siteName: site.name,
    locale: localeParam || site.locale || 'zh',
    regionIds,
  };
}
