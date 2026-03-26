# Baam Local Portal — Progress Report

> **Date:** 2026-03-26 (updated, end of day)
> **Scope:** NY Chinese Site (Phase 1 MVP)
> **Branch:** main (uncommitted Tier 1 + Tier 2 + AI Content Generation)

---

## Executive Summary

**Overall Phase 1 Completion: ~75%** (up from ~55% at start of day)

| Area | Status | Completion | Change |
|------|--------|------------|--------|
| Foundation & Infrastructure | ✅ Done | 100% | — |
| Admin Panel | ✅ Done | 95% | +10% (AI generation, preview) |
| Public Pages — Content Browsing | ✅ Done | 85% | +10% |
| Public Pages — Interactive Features | 🟡 Partial | 40% | +35% |
| AI Features | 🟡 Substantial | 60% | +50% |
| User System (Auth/Profile/Dashboard) | 🟡 Partial | 25% | +20% |

### What Changed (2026-03-26 Tier 1 Sprint)

| Item | Before | After | Tested |
|------|--------|-------|--------|
| Auth (login/register/Google OAuth) | Basic modal | + Forgot password, success messages, Chinese errors, `getCurrentUser()` helper | ✅ |
| Pagination | None (hard LIMIT) | All 6 list pages paginated with `?page=N` | ✅ |
| Filter tabs | UI-only buttons | Functional `<Link>` on news/businesses/events/forum/voices | ✅ |
| Search | 2-field ilike only | All 6 modules queried in parallel, tab filtering with counts | ✅ |
| Newsletter subscription | Form UI only | Server action → `newsletter_subscribers` table, 3 locations | ✅ |
| Forum post submission | Form HTML only | Full server action with auth, slug gen, redirect | ✅ |
| Forum reply submission | Static textarea | `ForumReplyForm` client component with server action | ✅ |

### What Changed (2026-03-26 Tier 2 Sprint)

| Item | Before | After | Tested |
|------|--------|-------|--------|
| AI summaries (admin) | Placeholder text only | Real Claude API call → generates zh + en summaries + tags | ✅ |
| AI FAQ generation (admin) | Disabled button | Generates 5 Q&A pairs from article content via Claude Sonnet | ✅ |
| Voices new post `/voices/new-post` | Missing page | Full publishing page with 5 post types, auth gate | ✅ |
| Like/Follow/Comment | UI-only buttons | Server actions + reusable client components | ✅ |
| Lead capture form | Static HTML form | Server action → `leads` table, wired into business detail | ✅ |

### What Changed (2026-03-26 AI Content Generation)

| Item | Before | After | Tested |
|------|--------|-------|--------|
| AI article generation | Not available | Full "from scratch" + "rewrite" pipeline via Claude Opus | ✅ |
| One-click output | N/A | Title (zh+en), body (zh+en), summary, tags, FAQ, SEO — all auto-filled | ✅ |
| Native Chinese writing | N/A | Custom system prompt enforcing native Chinese style (no 翻译腔) | ✅ |
| Show Prompt modal | N/A | "查看Prompt" link in header → modal with full prompt, model, tokens, copy | ✅ |
| Article preview modal | N/A | "预览" button → rendered Markdown with summary, FAQ, zh/en toggle | ✅ |
| AI model for articles | N/A | Claude Opus 4.6 (best writing quality) | ✅ |

### Bugs Found & Fixed

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Business cards empty names | Dynamic Tailwind classes purged | Static classes + `display_name` fallback |
| AI summary `.catch()` error | Supabase query doesn't return standard Promise | `try/catch` block |
| FAQ JSON parse error | Claude wraps JSON in markdown fences | Strip fences + fallback regex extraction |
| FAQ prefill error | Sonnet doesn't support assistant message prefill | Removed prefill, use robust regex parser |
| AI article JSON parse fail | 8KB JSON response with nested arrays/markdown | Switched to delimiter-based parsing (`===SECTION===`) |
| "# 摘要" in summary text | Claude adds markdown headers to summaries | `cleanSummary()` strips header prefixes |

---

## 1. Foundation & Infrastructure (100% ✅)

| Item | Status |
|------|--------|
| Turborepo monorepo (`apps/web/`, `packages/`) | ✅ |
| Next.js 15 App Router + TypeScript + Tailwind v4 | ✅ |
| Supabase clients (server + client + admin) | ✅ |
| i18n with `[locale]` route segment (next-intl) | ✅ |
| Claude AI wrapper (`lib/ai/claude.ts`) | ✅ |
| NavBar + Footer components | ✅ |
| Region persistence (localStorage + cookie) | ✅ |
| Database schema (36 tables, SQL in document/) | ✅ |
| Seed data (users, forum, voices, reviews) | ✅ |
| `robots.ts` + `sitemap.ts` | ✅ |
| **Server-side auth helper** (`lib/auth.ts`) | ✅ NEW |

---

## 2. Admin Panel (85% ✅)

### Full CRUD (Complete)

| Module | List | Create | Edit | Delete | Notes |
|--------|------|--------|------|--------|-------|
| Articles | ✅ | ✅ | ✅ | ✅ | Bulk publish/archive, status workflow, filters |
| Businesses | ✅ | ✅ | ✅ | ✅ | Claim approve/reject, featured toggle, image upload |
| Events | ✅ | ✅ | ✅ | ✅ | Full form with datetime, pricing |
| Sites | ✅ | ✅ | ✅ | ✅ | Site + region CRUD, primary region |
| Settings (Categories) | ✅ | ✅ | ✅ | ✅ | Interactive category tree editor |

### Moderation / Management (Partial)

| Module | List | Approve | Status | Delete | Notes |
|--------|------|---------|--------|--------|-------|
| Forum | ✅ | ✅ | ✅ | ✅ | Pin, lock, feature. No thread create/edit |
| Voices | ✅ | ✅ | ✅ | — | Approve/reject/verify. No create/edit |
| Leads | ✅ | — | ✅ | ✅ | Status workflow, no CSV export |

### View Only

| Module | Notes |
|--------|-------|
| Dashboard | Stats cards + recent articles + leads. Real queries |
| Users | Basic table, no edit/delete/role management |
| Sponsors | Read-only list of sponsor slots |
| AI Jobs | Monitoring: status counts, token usage, cost |

---

## 3. Public Pages — Content Browsing (85% ✅)

### Pages with Real Supabase Data Fetching

| Page | Route | Data | Pagination | Filters | Status |
|------|-------|------|------------|---------|--------|
| **Homepage** | `/[locale]/` | ✅ All 7 sections | N/A | N/A | ✅ |
| **News List** | `/[locale]/news` | ✅ | ✅ `?page=N` | ✅ `?type=alert\|brief\|...` | ✅ |
| **News Detail** | `/[locale]/news/[slug]` | ✅ SSR | N/A | N/A | ✅ |
| **Guides List** | `/[locale]/guides` | ✅ | — (50 limit) | ✅ Category links | ✅ |
| **Guide Detail** | `/[locale]/guides/[slug]` | ✅ SSR | N/A | N/A | ✅ |
| **Forum Home** | `/[locale]/forum` | ✅ | N/A | N/A | ✅ |
| **Forum Board** | `/[locale]/forum/[board]` | ✅ | ✅ `?page=N` | ✅ `?sort=newest\|hot` | ✅ |
| **Forum Thread** | `/[locale]/forum/[board]/[thread]` | ✅ | N/A | N/A | ✅ |
| **Businesses List** | `/[locale]/businesses` | ✅ | ✅ `?page=N` | ✅ `?cat=X&sort=Y` | ✅ |
| **Business Detail** | `/[locale]/businesses/[slug]` | ✅ SSR | N/A | N/A | ✅ |
| **Events List** | `/[locale]/events` | ✅ | ✅ `?page=N` | ✅ `?period=week&price=free` | ✅ |
| **Event Detail** | `/[locale]/events/[slug]` | ✅ | N/A | N/A | ✅ |
| **Voices Discover** | `/[locale]/voices` | ✅ | ✅ `?page=N` | ✅ `?tag=expert\|food\|...` | ✅ |
| **Voice Profile** | `/[locale]/voices/[username]` | ✅ | N/A | N/A | ✅ |
| **Voice Post** | `/[locale]/voices/.../posts/[slug]` | ✅ | N/A | N/A | ✅ |
| **Search** | `/[locale]/search` | ✅ 6 modules | N/A | ✅ `?tab=biz\|news\|...` | ✅ |

### Pages NOT Implemented (Required by Phase 1)

| Page | PRD Priority | Prototype | Status |
|------|-------------|-----------|--------|
| **Guide Category** `/guides/[category]` | P1 | `guide-category.html` | ❌ Missing |
| **Business Dashboard** `/dashboard/business` | P0 | `business-dashboard.html` | ❌ Missing |
| **Business Registration/Claim Flow** | P0 | — | ❌ Missing |
| **Voices New Post** `/voices/new-post` | P0 | `voices-new-post.html` | ❌ Missing |
| **Following Feed** `/following` | P1 | `following-feed.html` | ❌ Missing |
| **Classifieds List** `/classifieds` | P1 | `classifieds-list.html` | ❌ Missing |
| **Classifieds Detail** `/classifieds/[slug]` | P1 | `classifieds-detail.html` | ❌ Missing |
| **User Profile** `/profile/[username]` | P1 | `user-profile.html` | ❌ Missing |
| **User Settings** `/settings` | P1 | `user-settings.html` | ❌ Missing |

---

## 4. Interactive Features (30% 🟡)

| Feature | PRD Priority | Current State |
|---------|-------------|---------------|
| Auth Modal (Login/Register) | P0 | ✅ Full: login, register, forgot password, success messages |
| Google OAuth | P0 | ✅ Implemented (Supabase OAuth flow + callback route) |
| Forum post submission | P0 | ✅ Server action with auth check, slug gen, board redirect |
| Forum reply submission | P0 | ✅ Server action with auth check, auto-refresh |
| Newsletter email subscription | P0 | ✅ Server action → `newsletter_subscribers`, on 3 pages |
| Search tab filtering | P0 | ✅ All 6 module tabs with counts, functional links |
| Pagination (all list pages) | P0 | ✅ 5 list pages with `?page=N` + count queries |
| Voices post publishing | P0 | ❌ Page missing |
| Business registration/claim | P0 | ❌ Missing |
| Business dashboard (merchant self-service) | P0 | ❌ Missing |
| Like / Save / Share actions | P0 | ❌ UI buttons only |
| Follow/Unfollow users | P0 | ❌ UI button only |
| Comment submission (voices posts) | P0 | ❌ Form only, no backend |
| Lead capture form submission | P0 | ❌ Form only, no backend |
| RSVP to events | P1 | ❌ Button only |

---

## 5. AI Features (60% 🟡)

| AI Feature | PRD Priority | Current State |
|------------|-------------|---------------|
| **AI Article Generation** | P0 | ✅ Full pipeline: topic → complete article (zh+en body, summary, FAQ, tags, SEO) via Claude Opus |
| **AI Article Rewrite** | P0 | ✅ Paste source content → rewritten bilingual article |
| **News/Guide 3-sentence summary** | P0 | ✅ Claude Haiku generates zh + en summaries, admin button with loading UX |
| **AI FAQ generation** | P0 | ✅ 5 Q&A pairs via Claude Sonnet, saved to DB |
| **AI auto-tagging** | P0 | ✅ Generated alongside summaries, saved to `ai_tags` |
| **Article preview** | — | ✅ Markdown preview modal with zh/en toggle |
| **Show AI Prompt** | — | ✅ Modal showing exact prompt sent to AI, with copy button |
| Forum speed-read summary | P0 | ⚠️ UI card shows if data exists, no batch generation yet |
| Cross-language summary | P0 | ⚠️ `translateContent()` function exists but not wired to UI |
| Business AI bio generation | P0 | ❌ Not implemented |
| Spam detection | P0 | ⚠️ ai_spam_score field exists, no actual scoring |
| Merchant auto-injection in forum | P0 | ⚠️ Placeholder in thread detail, no logic |
| Search AI summary | P0 | ❌ "Coming soon" placeholder |
| Floating AI Assistant widget | P1 | ❌ Not implemented |

---

## 6. Prototype vs Implementation Comparison

### Prototypes with Matching Implementation ✅

| Prototype | Implementation | Status |
|-----------|---------------|--------|
| `zh/index.html` | `[locale]/(public)/page.tsx` | ✅ + newsletter form |
| `zh/news-list.html` | `[locale]/(public)/news/page.tsx` | ✅ + pagination + filters |
| `zh/news-detail.html` | `[locale]/(public)/news/[slug]/page.tsx` | ✅ |
| `zh/guides-list.html` | `[locale]/(public)/guides/page.tsx` | ✅ + category links |
| `zh/guide-detail.html` | `[locale]/(public)/guides/[slug]/page.tsx` | ✅ |
| `zh/forum-home.html` | `[locale]/(public)/forum/page.tsx` | ✅ |
| `zh/forum-board.html` | `[locale]/(public)/forum/[board]/page.tsx` | ✅ + pagination + sort |
| `zh/forum-thread.html` | `[locale]/(public)/forum/[board]/[thread]/page.tsx` | ✅ + reply form |
| `zh/forum-new-post.html` | `[locale]/(public)/forum/new/page.tsx` | ✅ NOW FUNCTIONAL |
| `zh/business-list.html` | `[locale]/(public)/businesses/page.tsx` | ✅ + pagination + filters |
| `zh/business-detail.html` | `[locale]/(public)/businesses/[slug]/page.tsx` | ✅ |
| `zh/events-list.html` | `[locale]/(public)/events/page.tsx` | ✅ + pagination + filters |
| `zh/event-detail.html` | `[locale]/(public)/events/[slug]/page.tsx` | ✅ |
| `zh/voices-discover.html` | `[locale]/(public)/voices/page.tsx` | ✅ + pagination + tags |
| `zh/voices-profile.html` | `[locale]/(public)/voices/[username]/page.tsx` | ✅ |
| `zh/voices-post-detail.html` | `[locale]/(public)/voices/.../posts/[slug]/page.tsx` | ✅ |
| `zh/search-results.html` | `[locale]/(public)/search/page.tsx` | ✅ FULL 6-MODULE SEARCH |
| `admin/dashboard.html` | `admin/page.tsx` | ✅ |
| `admin/articles.html` | `admin/articles/` | ✅ Full CRUD |
| `admin/businesses.html` | `admin/businesses/` | ✅ Full CRUD |
| `admin/forum-management.html` | `admin/forum/` | ✅ |
| `admin/voices-management.html` | `admin/voices/` | ✅ |
| `admin/leads.html` | `admin/leads/` | ✅ |
| `admin/users.html` | `admin/users/` | ⚠️ View only |
| `admin/ai-jobs.html` | `admin/ai-jobs/` | ✅ |
| `admin/settings.html` | `admin/settings/` | ✅ |

### Prototypes WITHOUT Implementation ❌

| Prototype | Missing Route | PRD Priority |
|-----------|---------------|-------------|
| `zh/business-dashboard.html` | `/dashboard/business` | **P0** |
| `zh/voices-new-post.html` | `/voices/new-post` | **P0** |
| `zh/guide-category.html` | `/guides/[category]` | P1 |
| `zh/following-feed.html` | `/following` | P1 |
| `zh/classifieds-list.html` | `/classifieds` | P1 |
| `zh/classifieds-detail.html` | `/classifieds/[slug]` | P1 |
| `zh/user-profile.html` | `/profile/[username]` | P1 |
| `zh/user-settings.html` | `/settings` | P1 |

---

## 7. Recommended Next Steps (Tier 2)

### For Credibility — needed before wider launch

1. **AI summaries** — Wire Claude API for news/guide summaries (cards show empty otherwise)
2. **Voices new post** — Creator publishing page
3. **Like/Follow/Comment backends** — Social features are visible but broken
4. **Lead capture form backend** — Businesses module monetization hook

### Can Wait — add within 1-2 weeks of launch

5. Business dashboard + registration/claim (onboard manually via admin first)
6. Guide category page
7. Classifieds
8. User profile + settings
9. Following feed

---

## 8. New Files Created (Tier 1 Sprint)

```
apps/web/src/lib/auth.ts                                    # getCurrentUser() + requireAuth()
apps/web/src/components/shared/pagination.tsx                # Reusable pagination component
apps/web/src/components/shared/newsletter-form.tsx           # Newsletter subscribe form
apps/web/src/components/shared/forum-reply-form.tsx          # Forum reply form
apps/web/src/app/[locale]/(public)/actions.ts                # Server actions: newsletter, forum post/reply
apps/web/src/app/[locale]/(public)/forum/new/form.tsx        # Forum new post client form
```

## 9. Files Modified (Tier 1 Sprint)

```
apps/web/src/components/shared/auth-modal.tsx                # + forgot password, success messages
apps/web/src/app/[locale]/(public)/page.tsx                  # + NewsletterForm
apps/web/src/app/[locale]/(public)/news/page.tsx             # + pagination + filter tabs + newsletter
apps/web/src/app/[locale]/(public)/businesses/page.tsx       # + pagination + category/sort filters + BusinessCard fix
apps/web/src/app/[locale]/(public)/events/page.tsx           # + pagination + period/price filters
apps/web/src/app/[locale]/(public)/forum/[board]/page.tsx    # + pagination + sort filters
apps/web/src/app/[locale]/(public)/forum/new/page.tsx        # Rewritten with auth check + form component
apps/web/src/app/[locale]/(public)/forum/[board]/[thread]/page.tsx  # + ForumReplyForm + auth
apps/web/src/app/[locale]/(public)/voices/page.tsx           # + pagination + tag filters
apps/web/src/app/[locale]/(public)/guides/page.tsx           # + category links + NewsletterForm
apps/web/src/app/[locale]/(public)/search/page.tsx           # Full rewrite: 6-module search + tabs
```

---

## Appendix: Test Results (2026-03-26)

| Page | URL Tested | Result |
|------|-----------|--------|
| Homepage | `/zh` | ✅ All sections render, newsletter form present |
| News list | `/zh/news` | ✅ Articles load, filter tabs work as links |
| News filter | `/zh/news?type=alert` | ✅ Shows only alert articles |
| Search | `/zh/search?q=医生` | ✅ Returns 2 guides, tabs show counts |
| Businesses | `/zh/businesses` | ✅ Names render, category filters work |
| Events | `/zh/events?period=week` | ✅ Shows filtered (empty for past seed data) |
| Forum new post | `/zh/forum/new` | ✅ Shows "请先登录" when not authenticated |
| TypeScript build | `tsc --noEmit` | ✅ Zero errors |
| Next.js build | `npm run build` | ✅ All pages compile |
