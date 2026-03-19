# Baam Local Portal — Phase 1 Implementation Plan

## Context
Baam is an AI-powered hyperlocal community platform with 6 modules (News, Guides, Forum, Businesses, Local Voices, AI Assistant). The `/document/` folder contains complete PRDs, master plan, and SQL schema. No code exists yet — greenfield project in `/Users/johntang/Desktop/clients/baam-local/`.

### User Requirements
1. **HTML prototypes first** — high-quality visual prototypes of all pages before coding
2. **Supabase Storage** for images (NOT Cloudflare R2)
3. **NY Chinese first** — Simplified Chinese (default) + Traditional Chinese toggle; English later
4. **Admin panel** — careful layout design, very convenient to use
5. **Codebase** in `baam-local/` folder

---

## Folder Structure

```
baam-local/
├── prototypes/                    # Phase A: HTML prototypes
│   ├── assets/
│   │   ├── css/tailwind-output.css
│   │   ├── css/prototype.css
│   │   ├── js/prototype.js
│   │   └── images/               # Placeholder images
│   ├── zh/                        # 25 Chinese public pages
│   │   ├── index.html            # Homepage
│   │   ├── search-results.html
│   │   ├── news-list.html
│   │   ├── news-detail.html
│   │   ├── guides-list.html
│   │   ├── guide-detail.html
│   │   ├── guide-category.html
│   │   ├── forum-home.html
│   │   ├── forum-board.html
│   │   ├── forum-thread.html
│   │   ├── forum-new-post.html
│   │   ├── business-list.html
│   │   ├── business-detail.html
│   │   ├── business-dashboard.html
│   │   ├── events-list.html
│   │   ├── event-detail.html
│   │   ├── voices-discover.html
│   │   ├── voices-profile.html
│   │   ├── voices-post-detail.html
│   │   ├── voices-new-post.html
│   │   ├── following-feed.html
│   │   ├── classifieds-list.html
│   │   ├── classifieds-detail.html
│   │   ├── user-profile.html
│   │   └── user-settings.html
│   └── admin/                     # 11 admin pages
│       ├── dashboard.html
│       ├── articles.html
│       ├── article-editor.html
│       ├── businesses.html
│       ├── business-editor.html
│       ├── forum-management.html
│       ├── voices-management.html
│       ├── leads.html
│       ├── users.html
│       ├── ai-jobs.html
│       └── settings.html
├── apps/
│   └── web/                       # Next.js 15 App Router
│       ├── src/
│       │   ├── app/
│       │   │   ├── [locale]/      # i18n route group
│       │   │   │   ├── (public)/  # All public pages
│       │   │   │   ├── (auth)/    # Protected pages (profile, settings)
│       │   │   │   └── (dashboard)/ # Business dashboard
│       │   │   ├── admin/         # Admin panel (no locale prefix)
│       │   │   └── api/           # API routes
│       │   ├── components/
│       │   │   ├── layout/        # navbar, footer, region-selector, language-toggle
│       │   │   ├── shared/        # business-card, lead-form, ai-summary, share, auth-modal
│       │   │   ├── news/ guides/ forum/ businesses/ voices/ events/
│       │   │   ├── admin/         # admin-layout, sidebar, data-table, stat-card
│       │   │   └── ui/            # shadcn/ui primitives
│       │   ├── lib/
│       │   │   ├── supabase/      # client.ts, server.ts, admin.ts, storage.ts
│       │   │   ├── ai/            # claude.ts, prompts.ts, jobs.ts
│       │   │   └── i18n/          # config.ts, server.ts, client.ts, chinese-converter.ts
│       │   ├── types/             # database.ts (generated), api.ts
│       │   └── hooks/             # use-auth, use-region, use-locale
│       ├── public/locales/
│       │   ├── zh-CN/             # Simplified Chinese translations (UI strings)
│       │   └── en/                # English (future)
│       ├── middleware.ts
│       ├── next.config.ts
│       └── tailwind.config.ts
├── supabase/
│   ├── migrations/001_initial_schema.sql
│   └── seed.sql
├── document/                      # Existing PRD docs (keep as-is)
├── turbo.json
├── package.json
├── .env.local.example
└── CLAUDE.md
```

---

## Implementation Phases

### Phase A: HTML Prototypes (Step 1-2)

**Step 1: Setup prototype infrastructure**
- Create `prototypes/` folder with Tailwind CSS CDN, shared CSS variables (color palette, spacing, typography), and `prototype.js` for interactive states (tabs, modals, dropdowns)
- Define design tokens: primary color, accent, background, card styles, badge styles
- Create placeholder images (avatars, covers, food photos, business logos)

**Step 2: Build all 36 prototype pages**

Build order (by commercial value and dependency):

| # | Page | Why First |
|---|------|-----------|
| 1 | `zh/index.html` | Sets visual language, nav, all module entry points |
| 2 | `zh/guide-detail.html` | Highest ROI — Lead Capture, business cards, FAQ, checklist |
| 3 | `zh/business-detail.html` | Core conversion — Lead form, reviews, AI FAQ, contact CTA |
| 4 | `zh/news-detail.html` | Article layout, AI summary card, cross-module links pattern |
| 5 | `zh/forum-thread.html` | AI speed-read, cross-language, merchant injection pattern |
| 6 | `zh/voices-profile.html` | Identity section, tabs, follow, linked business card |
| 7 | `zh/business-list.html` | Filter bar, card grid, featured vs standard |
| 8 | `zh/news-list.html` | Alert banner, daily brief, filters |
| 9 | `zh/guides-list.html` | Category tabs, featured section |
| 10 | `zh/forum-home.html` | Board grid, hot threads |
| 11 | `zh/voices-discover.html` | Featured carousel, person cards |
| 12 | `zh/search-results.html` | AI summary, multi-tab results |
| 13-25 | Remaining public pages | Forum new post, events, classifieds, user pages, etc. |
| 26 | `admin/dashboard.html` | Admin visual language — sidebar, stats, activity feed |
| 27-36 | Remaining admin pages | Article editor, business editor, forum mod, leads, users, etc. |

**Prototype requirements:**
- All content in **Simplified Chinese** with real category names from SQL seed data
- Mobile-first (375px) + desktop (1280px) using Tailwind responsive classes
- Include: hover states, loading skeletons, empty states, modal overlays
- Admin pages use distinct layout: fixed 240px sidebar + header + content area

---

### Phase B: Project Foundation (Step 3-8)

**Step 3: Initialize project**
- Init Turborepo monorepo in `baam-local/`
- Create Next.js 15 app in `apps/web/` (App Router, TypeScript, Tailwind, src dir)
- Install dependencies:
  - `@supabase/supabase-js`, `@supabase/ssr`
  - `next-intl` (i18n for App Router)
  - `@anthropic-ai/sdk` (Claude API)
  - `shadcn/ui` components (Button, Dialog, Tabs, Card, Input, Table, etc.)
  - `react-markdown`, `remark-gfm`
  - `lucide-react` (icons)
  - `opencc-js` (Simplified ↔ Traditional Chinese conversion)
- Init git repo, `.gitignore`, `CLAUDE.md`

**Step 4: Supabase setup**
- Create Supabase project
- Run SQL schema from `document/Baam_Supabase_Schema.sql` (all 17 sections)
- Verify: 36 tables, 4 views, 8 functions, 12 triggers, RLS policies
- Enable Auth providers: Email + Google OAuth
- Create Storage buckets: `avatars`, `covers`, `articles`, `businesses`, `forum`, `voices`, `events`, `classifieds` (all public read, authenticated write with user-scoped paths)
- Generate TypeScript types: `supabase gen types typescript`

**Step 5: i18n architecture**
- Configure `next-intl` with `[locale]` route segment
- Locales: `zh` (maps to zh-CN, default), `en` (future)
- Translation files: `public/locales/zh-CN/*.json` — all UI strings in Simplified Chinese
- **Traditional Chinese is NOT a separate translation** — use `opencc-js` for runtime conversion
- `chinese-converter.ts`: React context `<ChineseScriptProvider>` with toggle state
- User toggles Simplified/Traditional → all rendered text passes through converter (client-side only, SSR stays Simplified for SEO)
- Middleware: detect browser language → redirect to `/zh/` or `/en/` prefix → store in cookie

**Step 6: Auth system**
- Supabase Auth with `@supabase/ssr` (cookie-based sessions)
- Middleware refreshes session on every request
- Auth modal component (overlay, not separate page): Email/Password + Google OAuth + WeChat placeholder
- `useAuth` hook for client components
- Protected route patterns for dashboard, settings, posting

**Step 7: Core layout & navigation**
- Root layout with providers: next-intl, Supabase auth, Chinese script toggle, toast, region context
- NavBar: Logo, main nav (新闻 | 资讯 | 商家 | 活动 | 论坛 | 达人), search, language toggle, region selector, auth
- Footer: quick links, newsletter subscribe, social media
- Mobile: hamburger menu, responsive nav

**Step 8: Claude AI integration layer**
- `lib/ai/claude.ts` wrapper with core functions:
  - `generateSummary(text, lang)` — 3-sentence AI summary
  - `translateContent(text, from, to)` — zh↔en translation
  - `generateTags(text)` — extract 3-5 topic tags
  - `generateFAQ(context)` — FAQ pairs from business/article content
  - `classifyIntent(text)` — forum post intent classification
  - `matchBusinesses(query, businesses)` — semantic matching
  - `generateSearchSummary(query, results)` — search overview
- Retry logic, token tracking, model selection (Haiku for batch, Sonnet for complex)
- `lib/supabase/storage.ts`: `uploadImage()`, `getPublicUrl()`, `deleteImage()`

---

### Phase C: Core Modules (Step 9-18)

**Step 9: News list page** `/[locale]/news` (SSR)
- Alert banner (red/orange for unexpired alerts)
- Daily Brief card
- Filter bar: content type, region, language
- News cards: AI summary, source badge, time, region tag
- Infinite scroll (20/page, SSR first page)
- Sidebar: newsletter subscribe, hot news

**Step 10: News detail page** `/[locale]/news/[slug]` (SSR)
- Title, metadata, AI 3-sentence summary card, key facts (alerts/explainers)
- Markdown body, source attribution
- Cross-module: related guides, forum threads, businesses, Voices
- Share buttons, language toggle, OG meta, NewsArticle structured data

**Step 11: Guides list page** `/[locale]/guides` (SSR)
- Category tabs (horizontal scroll, from SQL seed)
- Featured guide hero, per-category sections, guide cards
- Sidebar: hot searches, featured businesses

**Step 12: Guide detail page** `/[locale]/guides/[category]/[slug]` (SSR)
- Breadcrumb, title, metadata, AI summary, sticky TOC sidebar
- Markdown body (checklist checkboxes, numbered steps, comparison tables)
- FAQ accordion (from `ai_faq` JSONB)
- **Business recommendation section** with Lead Capture form → `leads` table
- Cross-module links, review timestamp

**Step 13: Business list + detail + dashboard**
- List: multi-filter (category, region, features), featured cards, AI recommendation tags
- Detail: hero carousel, CTA buttons, tabs (overview, reviews, FAQ, contact), Lead Capture sidebar
- Dashboard: sidebar nav, stats overview, info editor, AI tools (description + FAQ generator), lead management

**Step 14: Forum (home + board + thread + new post)**
- Home: board grid, hot threads (from `v_hot_threads` view), floating new-post button
- Board: sort controls, thread rows with AI speed-read icon, pinned threads
- Thread: AI summary card, cross-language button, merchant injection, reply list, reply form
- New post: board selector, title input with AI suggestions, Markdown editor, AI tags

**Step 15: Local Voices (discover + profile + post + publish)**
- Discover: featured Voices, search/filter, person cards with Follow buttons
- Profile: identity section, tab navigation, linked business card
- Post detail: author card, markdown body, like/comment/bookmark, more from author
- Publish: content type selector, editor, tags, region, publish/preview/draft

**Step 16: Search page** `/[locale]/search`
- Search input, region filter
- AI summary card (streaming from Claude)
- Multi-tab results: All | Businesses | News | Guides | Forum | Voices | Events
- No-results state with AI suggestions

**Step 17: Homepage** `/[locale]` (ISR, revalidate: 300s)
- Hero AI search box + hot search tags
- Alert banner, today's news (3), hot guides (4), local voices (4), weekend events (3-4), recommended businesses (4-6), forum hot threads (5)
- Newsletter subscribe, footer

**Step 18: Remaining pages**
- Events list + detail (basic)
- Classifieds list + detail (P1)
- User profile + settings (P1)
- Following feed (P1)
- AI assistant floating widget (P1)

---

### Phase D: Admin Panel (Step 19-21)

**Step 19: Admin layout & dashboard**
- Layout: fixed 240px sidebar (collapsible on mobile) + header bar + content area
- Sidebar sections: Dashboard, Content (Articles), Businesses, Forum, Voices, Events, Leads, Users, AI Jobs, Sponsors, Settings
- Dashboard: stat cards (users, articles, businesses, threads, leads, AI jobs), recent activity feed, quick actions

**Step 20: Content & business management**
- Articles: DataTable (TanStack Table) with filters (status, vertical, region), inline status toggle, full editor (rich text, AI summary generation, bilingual fields, SEO)
- Businesses: DataTable, claim approval queue, business editor, AI profile generation
- Forum: moderation queue (flagged, high spam), pin/unpin/lock, reply moderation
- Voices: application review, profile type management, featured selection

**Step 21: Operations management**
- Leads: all leads with AI intent summary, status pipeline, assignment, export
- Users: list with role management, ban/suspend
- AI Jobs: queue status, cost dashboard, retry failed, model breakdown
- Sponsors: slot inventory, bookings, revenue
- Settings: regions, categories, site config, newsletter

---

### Phase E: Polish & Launch (Step 22-24)

**Step 22: SEO**
- Dynamic sitemap.xml, robots.txt
- Per-page OG meta, structured data (NewsArticle, LocalBusiness, FAQPage, Event)
- Canonical URLs with locale prefix

**Step 23: Performance & testing**
- Next.js Image with Supabase Storage remote patterns
- ISR homepage, SSR detail pages
- Core Web Vitals: LCP < 2.5s, CLS < 0.1
- Mobile responsive testing (375/768/1280px)
- Security: RLS, rate limiting, input sanitization

**Step 24: Data seeding & launch**
- Seed: 30 Flushing businesses + 20 Middletown businesses
- Seed: 10 forum threads per board
- Publish 3-5 initial guides, initial news from RSS
- Invite 10-20 founding Voices
- Internal beta (10 testers) → fix bugs → production deploy on Vercel

---

## Key Architecture Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| i18n | `next-intl` + `[locale]` route | Best App Router support; Traditional Chinese via `opencc-js` runtime conversion (no duplicate files) |
| Image storage | Supabase Storage buckets | User requirement; simpler than R2, integrated auth |
| Admin | Same Next.js app at `/admin/*` | No locale prefix; separate layout; shared Supabase client |
| UI components | shadcn/ui + Tailwind | Customizable, no runtime CSS-in-JS, matches Tailwind stack |
| Monorepo | Turborepo | Future-proof for OC English site as separate app |
| Chinese script | `opencc-js` client-side toggle | SSR always Simplified (SEO), user toggles Traditional on client |

## Critical Files Reference
- `document/Baam_Supabase_Schema.sql` — 36 tables, all enums, RLS, triggers
- `document/01_phase1_mvp_prd.md` — all 27 page specs with component details
- `document/00_master_plan.md` — tech stack, content strategy, cross-module linking
- `document/README.md` — architecture overview, two-product strategy

## Verification
1. Open `prototypes/zh/index.html` in browser — all 25 public + 11 admin pages render correctly at 375px and 1280px
2. `npm run dev` in `apps/web/` — homepage loads at `localhost:3000/zh`
3. Supabase dashboard shows all 36 tables with seed data
4. Create article in admin → AI summary auto-generates → appears on /news
5. Submit Lead Capture form on guide detail → appears in business dashboard leads
6. Toggle Simplified/Traditional → all UI text converts correctly
