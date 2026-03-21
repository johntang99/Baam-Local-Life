# Admin Site Selection — Architecture Guide

## Overview

The admin panel supports multiple sites (e.g., "New York Chinese", "Middletown OC English"). When an admin selects a site, ALL site-scoped pages (articles, businesses, forum, etc.) filter data by that site's regions. The selection must persist across navigation, including when visiting system pages that don't use region filtering.

## 3-Layer Persistence

```
┌─────────────────────────────────────────────────────┐
│  User selects site in header dropdown               │
│                                                     │
│  ┌──────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ localStorage │  │  Cookie  │  │  URL params   │  │
│  │  (client)    │  │ (server) │  │  (fallback)   │  │
│  └──────┬───────┘  └────┬─────┘  └──────┬────────┘  │
│         │               │               │           │
│  Client Components  Server Components  Direct links │
│  (React context)    (SSR queries)      (bookmarks)  │
└─────────────────────────────────────────────────────┘
```

### Layer 1: localStorage (Client-Side)

**Purpose:** Instant, reliable persistence for all client components.

**Key:** `baam-admin-site`
**Value:** `{"siteSlug":"ny-zh","locale":"zh"}`

**When written:**
- User selects a site from the header dropdown
- User changes the locale dropdown
- On initial load (restores previous selection)

**When read:**
- On page load by `AdminSiteProvider` context
- By any client component via `useAdminSite()` hook

**Files:**
- `src/lib/admin-site-store.ts` — `getStoredSite()`, `setStoredSite()`
- `src/components/admin/AdminSiteContext.tsx` — React context provider

**Usage in client components:**
```tsx
import { useAdminSite } from '@/components/admin/AdminSiteContext';

function MyComponent() {
  const { currentSite, sites, setSite, setLocale } = useAdminSite();
  // currentSite.slug, currentSite.name, currentSite.locale
  // setSite('oc-en') — switches site
  // setLocale('en') — changes language
}
```

### Layer 2: Cookie (Server-Side)

**Purpose:** Server Components need the selected site for SSR data queries (filtering articles, businesses by region).

**Cookie name:** `baam-admin-site`
**Cookie value:** `{"siteSlug":"ny-zh","locale":"zh"}`
**Path:** `/admin` (only sent for admin routes)
**Max-Age:** 1 year

**When written:**
- Same moments as localStorage — the `setCookie()` function is called alongside `setStoredSite()` every time the site changes.

**When read:**
- By `getAdminSiteContext()` in `src/lib/admin-context.ts`
- Any Server Component that needs to filter data by the current site

**Files:**
- `src/components/admin/AdminSiteContext.tsx` — `setCookie()` function
- `src/lib/admin-context.ts` — `getAdminSiteContext()` reads cookie via `next/headers`

**Usage in server components:**
```tsx
import { getAdminSiteContext } from '@/lib/admin-context';

export default async function AdminPage({ searchParams }) {
  const ctx = await getAdminSiteContext(await searchParams);
  // ctx.siteSlug, ctx.siteName, ctx.locale, ctx.regionIds

  // Filter data by region
  const { data } = await supabase
    .from('articles')
    .select('*')
    .in('region_id', ctx.regionIds);
}
```

### Layer 3: URL Params (Backward Compatibility)

**Purpose:** Direct links and bookmarks can specify a site. Also provides a fallback if localStorage/cookie are unavailable.

**Params:** `?region=ny-zh&locale=zh`

**Priority:** URL params take precedence over cookie when present.

**When used:**
- Shared links: `http://localhost:5001/admin/articles?region=ny-zh&locale=zh`
- Bookmarks from before the localStorage migration
- External systems linking to specific admin pages

**Resolution order in `getAdminSiteContext()`:**
1. Check `searchParams.region` → if present, use it
2. Check cookie `baam-admin-site` → if present, use it
3. Fall back to default site (is_default=true in DB)

## Data Flow

### When user selects "New York Chinese":

```
1. Header dropdown onChange fires
2. AdminSiteContext.setSite('ny-zh') called
3. React state updates → all client components re-render
4. localStorage set: {"siteSlug":"ny-zh","locale":"zh"}
5. Cookie set: baam-admin-site={"siteSlug":"ny-zh","locale":"zh"}
6. Next page navigation → server reads cookie → filters by NY regions
```

### When user navigates to system page (e.g., /admin/users):

```
1. Sidebar link clicked → /admin/users (no URL params needed)
2. AdminSiteContext still has "ny-zh" in state (from localStorage)
3. Header dropdown still shows "New York Chinese"
4. If page queries data: server reads cookie → still "ny-zh"
5. User clicks back to /admin/articles → still "ny-zh" → shows NY articles
```

### When user refreshes the page:

```
1. Browser loads /admin/articles
2. AdminSiteProvider mounts → reads localStorage → "ny-zh"
3. Sets cookie (in case it expired)
4. Header shows "New York Chinese"
5. Server component reads cookie → filters by NY regions
```

## Database: Sites & Regions

Sites and their region coverage are stored in two tables:

```sql
-- Sites table
sites (id, slug, name, name_zh, locale, domain, status, is_default)

-- Site-Region mapping (many-to-many)
site_regions (site_id, region_id, is_primary)
```

`getAdminSiteContext()` resolves the site slug to a list of `regionIds` (UUIDs) by joining `site_regions`. These IDs are used to filter all site-scoped data:

```sql
-- Example: NY Chinese site covers these regions
site_regions: ny-zh → [flushing-ny, queens-ny, new-york-city, new-york-state]

-- Query filters
WHERE region_id IN (regionIds)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/admin-site-store.ts` | localStorage get/set functions |
| `src/components/admin/AdminSiteContext.tsx` | React context + cookie sync |
| `src/components/admin/admin-header.tsx` | Site/locale dropdown UI |
| `src/lib/admin-context.ts` | Server-side context (reads cookie + URL params) |
| `src/app/admin/layout.tsx` | Wraps admin with `AdminSiteProvider` |

## Adding a New Site

1. Go to Admin → 站点管理 → "+ 添加站点"
2. Fill in: slug, name, locale, domain
3. Add regions to the site (click "+ 添加地区" on the site card)
4. The new site appears in the header dropdown immediately
5. Selecting it filters all site-scoped data by its regions
