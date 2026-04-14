'use server';

import { runHelper2, type HelperMessage } from '@baam/helper-core-2';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentSite } from '@/lib/sites';
import { allocateAnswerType } from '@/lib/helper/allocator';
import { findCategoryId, fetchCategoryBusinesses, fetchRelatedContent, detectRegionSlug, buildBusinessSources } from '@/lib/helper/data';
import { buildBusinessRecommendation, buildBusinessLookup, buildNoMatch } from '@/lib/helper/builders';
import { pickBusinessDisplayName } from '@/lib/business-name';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface Helper2ActionResult {
  answer: string;
  sources: {
    type: string;
    title: string;
    url: string;
    snippet?: string;
    isExternal?: boolean;
  }[];
  intent: string;
  keywords: string[];
  usedWebFallback: boolean;
  provider: string;
  quickReplies?: string[];
  mapBusinesses?: AnyRow[];
}

function toMapBusinesses(businesses: AnyRow[]) {
  const mapped = businesses.filter(b => b.latitude && b.longitude).map(b => ({
    id: b.id, slug: b.slug,
    display_name: pickBusinessDisplayName(b, '商家'),
    short_desc_zh: b.short_desc_zh || '', short_desc_en: b.short_desc_en || '',
    avg_rating: b.avg_rating, review_count: b.review_count,
    phone: b.phone, website_url: b.website_url || null,
    address_full: b.address_full, latitude: Number(b.latitude),
    longitude: Number(b.longitude), ai_tags: b.ai_tags || [],
    total_score: b.total_score || 0, is_featured: !!b.is_featured,
  }));
  return mapped.length > 0 ? mapped : undefined;
}

function getQuickReplies(type: string, keywords: string[], extra?: { category?: string; topBizNames?: string[] }): string[] {
  const kw = keywords[0] || '';
  const cat = extra?.category || kw;
  const top = extra?.topBizNames;
  switch (type) {
    case 'business-recommendation':
      return [
        top?.[0] ? `告诉我更多关于${top[0]}` : '',
        top?.[0] && top?.[1] ? `${top[0]} vs ${top[1]}` : '',
        cat ? `${cat}周末营业的有哪些` : '',
      ].filter(Boolean).slice(0, 3);
    case 'business-lookup':
      return ['附近类似的商家', '查看评价', '其他选择'].slice(0, 3);
    case 'no-match':
      return ['浏览所有商家', '最近有什么活动', '问问社区'].slice(0, 3);
    default:
      return [];
  }
}

export async function askHelper2(
  query: string,
  history: HelperMessage[] = [],
): Promise<{ error?: string; data?: Helper2ActionResult }> {
  if (!query?.trim() || query.trim().length < 2) {
    return { error: '请输入更具体一点的问题' };
  }

  const startTime = Date.now();

  try {
    const supabase = createAdminClient() as AnyRow;
    const site = await getCurrentSite();
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';

    // ─── Allocate answer type ───
    const alloc = await allocateAnswerType(query, history, supabase, site.id, anthropicApiKey);

    const logResult = (r: { data: Helper2ActionResult }) => {
      const ms = Date.now() - startTime;
      console.log(`[Helper-2] ${JSON.stringify({ query: query.slice(0, 60), type: alloc.type, ms, intent: r.data.intent, provider: r.data.provider })}`);
      return r;
    };

    // ─── Helper: extract Chinese keywords by dictionary matching ───
    const KNOWN_KEYWORDS = [
      // Locations
      '法拉盛','布鲁克林','华埠','曼哈顿','日落公园','艾姆赫斯特','皇后区','长岛市','纽约',
      // Medical
      '牙医','牙科','儿科','针灸','中医','家庭医生','眼科','体检','发烧','医保','看病','就医',
      // Legal
      '律师','移民','工卡','绿卡','签证','罚单','离婚','法律',
      // Finance
      '报税','会计','税务','贷款','买房','信用','银行','保险','白卡',
      // Life
      '驾照','驾校','路考','租房','学区','学校','地铁','新移民','搬家',
      // Home
      '装修','水管','空调','蟑螂','开锁','害虫','垃圾','垃圾分类',
      // Education
      '课后班','钢琴','幼儿园','英语','补习',
      // Food
      '火锅','奶茶','韩餐','日料','早茶','烧腊','中餐','川菜','粤菜','上海菜',
      // Beauty
      '美甲','理发','SPA','按摩','半永久','纹眉','美容',
    ];

    const extractQueryKeywords = (q: string): string[] => {
      const found: string[] = [];
      const lower = q.toLowerCase();
      // Match known keywords (longest first to avoid partial matches)
      for (const kw of KNOWN_KEYWORDS.sort((a, b) => b.length - a.length)) {
        if (lower.includes(kw.toLowerCase())) found.push(kw);
      }
      return found;
    };

    // ─── Helper: enrich AI result with related content ───
    const enrichAiResult = async (result: Helper2ActionResult, kws: string[]) => {
      const queryWords = extractQueryKeywords(query);
      const relatedKws = [...new Set([
        ...kws.filter(k => k.length >= 2),
        ...queryWords,
      ])].slice(0, 10);
      const related = await fetchRelatedContent(supabase, site.id, relatedKws);
      // Build related sources
      const relatedSources: typeof result.sources = [];
      for (const g of related.guides) relatedSources.push({ type: '指南', title: g.title, url: `/guides/${g.slug}`, snippet: g.snippet });
      for (const n of related.news) relatedSources.push({ type: '新闻', title: n.title, url: `/news/${n.slug}`, snippet: n.snippet });
      for (const t of related.forum) relatedSources.push({ type: '论坛', title: t.title, url: `/forum/${t.boardSlug || 'general'}/${t.slug}`, snippet: t.snippet });
      for (const d of related.discover) relatedSources.push({ type: '发现', title: d.title, url: `/discover/${d.slug}`, snippet: d.snippet });
      if (relatedSources.length > 0) {
        // Put related articles BEFORE business sources so they appear first
        result.sources = [...relatedSources, ...(result.sources || [])];
      }
      console.log(`[Helper-2 enrich] query="${query.slice(0, 30)}" existingSources=${(result.sources?.length || 0) - relatedSources.length} added=${relatedSources.length} types=${relatedSources.map(s => s.type).join(',')}`);
      return result;
    };

    // ─── Types 7, 11 (follow-up, life-event): Delegate to AI engine ───
    if (alloc.type === 'follow-up' || alloc.type === 'life-event' || alloc.type === 'comparison') {
      const result = await runHelper2({
        query, history, supabaseAdmin: supabase,
        config: {
          siteName: 'Baam', siteId: site.id,
          assistantName: 'Helper-2', assistantNameZh: '小帮手-2', locale: 'zh',
          providerStrategy: 'anthropic',
          anthropicApiKey, anthropicModel: process.env.HELPER2_ANTHROPIC_MODEL || 'claude-haiku-4-5',
          openAiApiKey: process.env.OPENAI_API_KEY, openAiModel: process.env.HELPER2_OPENAI_MODEL || 'gpt-5.4',
          webFallbackEnabled: true,
        },
      });
      return logResult({ data: await enrichAiResult(result, alloc.keywords) });
    }

    // ─── Type 9: Business Lookup ───
    if (alloc.type === 'business-lookup') {
      const { answer, sources } = buildBusinessLookup(alloc, query);
      const mapBiz = alloc.singleBusiness ? toMapBusinesses([alloc.singleBusiness]) : undefined;
      return logResult({
        data: {
          answer, sources, intent: 'localLookup', keywords: alloc.keywords,
          usedWebFallback: false, provider: 'template',
          quickReplies: getQuickReplies('business-lookup', alloc.keywords),
          mapBusinesses: mapBiz,
        },
      });
    }

    // ─── Type 5: Community ───
    if (alloc.type === 'community') {
      const result = await runHelper2({
        query, history, supabaseAdmin: supabase,
        config: {
          siteName: 'Baam', siteId: site.id,
          assistantName: 'Helper-2', assistantNameZh: '小帮手-2', locale: 'zh',
          providerStrategy: 'anthropic',
          anthropicApiKey, anthropicModel: process.env.HELPER2_ANTHROPIC_MODEL || 'claude-haiku-4-5',
          openAiApiKey: process.env.OPENAI_API_KEY, openAiModel: process.env.HELPER2_OPENAI_MODEL || 'gpt-5.4',
          webFallbackEnabled: true,
        },
      });
      return logResult({ data: await enrichAiResult(result, alloc.keywords) });
    }

    // ─── Type 6: News/Events ───
    if (alloc.type === 'news-events') {
      const result = await runHelper2({
        query, history, supabaseAdmin: supabase,
        config: {
          siteName: 'Baam', siteId: site.id,
          assistantName: 'Helper-2', assistantNameZh: '小帮手-2', locale: 'zh',
          providerStrategy: 'anthropic',
          anthropicApiKey, anthropicModel: process.env.HELPER2_ANTHROPIC_MODEL || 'claude-haiku-4-5',
          openAiApiKey: process.env.OPENAI_API_KEY, openAiModel: process.env.HELPER2_OPENAI_MODEL || 'gpt-5.4',
          webFallbackEnabled: true,
        },
      });
      return logResult({ data: await enrichAiResult(result, alloc.keywords) });
    }

    // ─── Type 1: Business Recommendation ───
    if (alloc.type === 'business-recommendation') {
      const category = await findCategoryId(supabase, site.id, alloc.keywords, query);
      if (!category) {
        const { answer, sources } = buildNoMatch(query, alloc.keywords);
        return logResult({ data: { answer, sources, intent: 'localRecommendation', keywords: alloc.keywords, usedWebFallback: false, provider: 'template', quickReplies: getQuickReplies('no-match', alloc.keywords) } });
      }

      const regionSlug = detectRegionSlug(query);
      const { businesses, locationFallback } = await fetchCategoryBusinesses(supabase, site.id, category.id, regionSlug, category.subcuisineKeywords);
      // Build broader keyword list for related content matching
      const queryWords = extractQueryKeywords(query);
      const relatedKws = [...new Set([
        ...category.name.split(/[\s&·]+/).filter(w => w.length >= 2),
        ...alloc.keywords.filter(kw => kw.length >= 2),
        ...(category.subcuisineLabel ? [category.subcuisineLabel] : []),
        ...queryWords,
      ])].slice(0, 8);
      const related = await fetchRelatedContent(supabase, site.id, relatedKws);

      if (businesses.length === 0) {
        const { answer, sources } = buildNoMatch(query, alloc.keywords);
        return logResult({ data: { answer, sources, intent: 'localRecommendation', keywords: alloc.keywords, usedWebFallback: false, provider: 'template', quickReplies: getQuickReplies('no-match', alloc.keywords) } });
      }

      const enrichedAlloc = { ...alloc, businesses, matchedCategory: category.subcuisineLabel || category.name, locationFallback, related };
      const { answer, sources } = buildBusinessRecommendation(enrichedAlloc);

      return logResult({
        data: {
          answer, sources, intent: 'localRecommendation', keywords: alloc.keywords,
          usedWebFallback: false, provider: 'template',
          quickReplies: getQuickReplies('business-recommendation', alloc.keywords, {
            category: category.name,
            topBizNames: businesses.slice(0, 2).map(b => pickBusinessDisplayName(b as unknown as Record<string, unknown>, '')),
          }),
          mapBusinesses: toMapBusinesses(businesses),
        },
      });
    }

    // ─── Types 2, 3, 4 (guide, info, mixed): Delegate to AI engine ───
    if (alloc.type === 'guide' || alloc.type === 'info-lookup' || alloc.type === 'mixed') {
      const result = await runHelper2({
        query, history, supabaseAdmin: supabase,
        config: {
          siteName: 'Baam', siteId: site.id,
          assistantName: 'Helper-2', assistantNameZh: '小帮手-2', locale: 'zh',
          providerStrategy: 'anthropic',
          anthropicApiKey, anthropicModel: process.env.HELPER2_ANTHROPIC_MODEL || 'claude-haiku-4-5',
          openAiApiKey: process.env.OPENAI_API_KEY, openAiModel: process.env.HELPER2_OPENAI_MODEL || 'gpt-5.4',
          webFallbackEnabled: true,
        },
      });

      // Enrich with related content
      const enriched = await enrichAiResult(result, alloc.keywords);

      // For mixed type: also find businesses and add mapBusinesses
      if (alloc.type === 'mixed') {
        const category = await findCategoryId(supabase, site.id, alloc.keywords, query);
        if (category) {
          const regionSlug = detectRegionSlug(query);
          const { businesses } = await fetchCategoryBusinesses(supabase, site.id, category.id, regionSlug, category.subcuisineKeywords);
          if (businesses.length > 0) {
            return logResult({ data: { ...enriched, mapBusinesses: toMapBusinesses(businesses) } });
          }
        }
      }
      return logResult({ data: enriched });
    }

    // ─── Type 8: No Match ───
    const { answer, sources } = buildNoMatch(query, alloc.keywords);
    return logResult({
      data: { answer, sources, intent: 'localLookup', keywords: alloc.keywords, usedWebFallback: false, provider: 'template', quickReplies: getQuickReplies('no-match', alloc.keywords) },
    });

  } catch (error) {
    return {
      error: error instanceof Error ? error.message : '小帮手-2 暂时无法回答，请稍后再试',
    };
  }
}
