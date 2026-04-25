'use server';

import { runHelper2, type HelperMessage } from '@baam/helper-core-2';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentSite } from '@/lib/sites';
import { allocateAnswerType } from '@/lib/helper/allocator';
import { findCategoryId, fetchCategoryBusinesses, fetchRelatedContent, fetchCommunityContent, fetchNewsAndEvents, detectRegionSlug, buildBusinessSources } from '@/lib/helper/data';
import {
  buildBusinessRecommendation, buildBusinessLookup, buildNoMatch,
  buildGuideAnswer, buildInfoLookup, buildMixedAnswer,
  buildCommunityAnswer, buildNewsEventsAnswer, buildComparisonAnswer,
} from '@/lib/helper/builders';
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

// ─── HP4: Response Cache (LRU, in-memory) ───────────────────
const CACHE_MAX = 100;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const responseCache = new Map<string, { data: Helper2ActionResult; ts: number }>();

function getCachedResponse(query: string): Helper2ActionResult | null {
  const key = query.trim().toLowerCase();
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    responseCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedResponse(query: string, data: Helper2ActionResult) {
  // Only cache template responses (DB-driven, deterministic)
  if (data.provider !== 'template') return;
  const key = query.trim().toLowerCase();
  // Evict oldest if at capacity
  if (responseCache.size >= CACHE_MAX) {
    const oldest = responseCache.keys().next().value;
    if (oldest) responseCache.delete(oldest);
  }
  responseCache.set(key, { data, ts: Date.now() });
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

function getQuickReplies(
  type: string,
  keywords: string[],
  extra?: { bizName?: string; pairNames?: [string, string]; category?: string; topBizNames?: string[] },
): string[] {
  const kw = keywords[0] || '';
  const cat = extra?.category || kw;
  const top = extra?.topBizNames;

  switch (type) {
    case 'business-recommendation':
      return [
        top?.[0] ? `告诉我更多关于${top[0]}` : '',
        top?.[0] && top?.[1] ? `${top[0]} vs ${top[1]}` : '',
        cat ? `${cat}周末营业的有哪些` : '',
      ].filter(s => s.length > 3).slice(0, 3);
    case 'business-lookup':
      return extra?.bizName
        ? [`附近类似${extra.bizName}的商家`, `${extra.bizName}的评价`, '其他选择']
        : ['附近类似的商家', '查看评价', '其他选择'];
    case 'community':
      return [`${kw}相关商家`, `${kw}生活指南`, `最新${kw}消息`].filter(s => s.trim().length > 3);
    case 'news-events':
      return ['更多近期活动', '免费活动', '亲子活动'];
    case 'comparison':
      return extra?.pairNames
        ? [`告诉我更多关于${extra.pairNames[0]}`, `告诉我更多关于${extra.pairNames[1]}`, '其他选择']
        : [];
    case 'guide':
      return [`${kw}相关服务`, `大家怎么看${kw}`, '相关活动'].filter(s => s.trim().length > 3);
    case 'info-lookup':
      return ['相关服务推荐', '大家怎么看', '相关指南'];
    case 'mixed':
      return [
        top?.[0] ? `告诉我更多关于${top[0]}` : `更多${kw}选择`,
        `大家怎么看${kw}`,
      ].filter(s => s.length > 3);
    case 'no-match':
      return ['浏览所有商家', '最近有什么活动', '问问社区'];
    default:
      return [];
  }
}

// ─── Known keywords for query enrichment ───
const KNOWN_KEYWORDS = [
  '法拉盛','布鲁克林','华埠','曼哈顿','日落公园','艾姆赫斯特','皇后区','长岛市','纽约',
  '牙医','牙科','儿科','针灸','中医','家庭医生','眼科','体检','发烧','医保','看病','就医',
  '律师','移民','工卡','绿卡','签证','罚单','离婚','法律','入籍','公民',
  '报税','会计','税务','贷款','买房','信用','银行','保险','白卡',
  '驾照','驾校','路考','租房','学区','学校','地铁','新移民','搬家','DMV',
  '装修','水管','空调','蟑螂','开锁','害虫','垃圾','垃圾分类','修车','保养','眼镜',
  '课后班','钢琴','幼儿园','英语','补习',
  '火锅','奶茶','韩餐','日料','早茶','烧腊','中餐','川菜','粤菜','上海菜',
  '美甲','理发','SPA','按摩','半永久','纹眉','美容',
];

function extractQueryKeywords(q: string): string[] {
  const found: string[] = [];
  const lower = q.toLowerCase();
  for (const kw of KNOWN_KEYWORDS.sort((a, b) => b.length - a.length)) {
    if (lower.includes(kw.toLowerCase())) found.push(kw);
  }
  return found;
}

// ─── Content Safety Filter ──────────────────────────────────
function checkContentSafety(query: string): string | null {
  const q = query.toLowerCase();

  // Violence / weapons / threats
  if (/杀人|杀死|杀掉|砍人|捅人|炸弹|炸掉|爆炸|枪支|买枪|制造武器|投毒|纵火|自杀方法|怎么死/.test(q)) {
    return 'unsafe_violence';
  }

  // Sexual harassment / explicit content
  if (/色情|约炮|嫖|卖淫|性服务|裸照|偷拍|强奸|猥亵|性骚扰|找小姐|特殊服务/.test(q)) {
    return 'unsafe_sexual';
  }

  // Illegal drugs
  if (/买毒品|卖毒品|大麻.*(哪里|怎么|哪有)|哪里.*大麻|卖大麻|冰毒|可卡因|制毒|贩毒/.test(q)) {
    return 'unsafe_drugs';
  }

  // Fraud / illegal activities
  if (/假证|假绿卡|假护照|洗钱|逃税方法|黑工.*怎么找|偷渡|非法入境方法/.test(q)) {
    return 'unsafe_illegal';
  }

  // Hate speech / discrimination
  if (/歧视|仇恨|种族.*劣等|灭绝.*族/.test(q)) {
    return 'unsafe_hate';
  }

  return null; // safe
}

const SAFETY_RESPONSE: Helper2ActionResult = {
  answer: [
    '⚠️ 抱歉，我无法回答这类问题。',
    '',
    '作为纽约华人社区的 AI 助手，我专注于帮助大家解决**本地生活**中的实际问题：',
    '',
    '- 🏪 **找商家** — 餐厅、医生、律师等',
    '- 📋 **办事指南** — 驾照、报税、移民等',
    '- 💬 **社区交流** — 本地经验分享',
    '- 📰 **本地资讯** — 新闻和活动',
    '',
    '如果你遇到紧急危险，请拨打 **911**。',
    '如需心理支持，可拨打 **988** 自杀与危机生命线（有中文服务）。',
    '',
    '---',
    '',
    '换个问题试试？我很乐意帮你解决本地生活中的任何问题！',
  ].join('\n'),
  sources: [],
  intent: 'safety',
  keywords: [],
  usedWebFallback: false,
  provider: 'safety-filter',
  quickReplies: ['推荐好吃的餐厅', '怎么考驾照', '附近有什么活动'],
};

export async function askHelper2(
  query: string,
  history: HelperMessage[] = [],
): Promise<{ error?: string; data?: Helper2ActionResult }> {
  const minLen = history.length > 0 ? 1 : 2;
  if (!query?.trim() || query.trim().length < minLen) {
    return { error: '请输入更具体一点的问题' };
  }

  // ─── Safety check — block dangerous/inappropriate content ───
  const safetyFlag = checkContentSafety(query);
  if (safetyFlag) {
    console.log(`[Helper-2 SAFETY] Blocked: ${safetyFlag} | query="${query.slice(0, 50)}"`);
    return { data: SAFETY_RESPONSE };
  }

  // ─── HP4: Cache check — return cached response for identical queries (no history) ───
  if (history.length === 0) {
    const cached = getCachedResponse(query);
    if (cached) {
      console.log(`[Helper-2 CACHE] Hit: "${query.slice(0, 40)}"`);
      return { data: cached };
    }
  }

  const startTime = Date.now();

  try {
    const supabase = createAdminClient() as AnyRow;
    const site = await getCurrentSite();
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';

    // ─── Step 1: Allocate answer type ───
    const alloc = await allocateAnswerType(query, history, supabase, site.id, anthropicApiKey);

    const logResult = (r: { data: Helper2ActionResult }) => {
      const ms = Date.now() - startTime;
      console.log(`[Helper-2] ${JSON.stringify({ query: query.slice(0, 60), type: alloc.type, ms, intent: r.data.intent, provider: r.data.provider })}`);
      // HP4: Cache template responses for identical future queries
      if (history.length === 0) setCachedResponse(query, r.data);
      return r;
    };

    // ─── Helper: create AI engine instance ───
    // Full engine (for follow-up, life-event — needs content retrieval + web fallback)
    const runAI = (opts?: { personalityOverride?: string }) => runHelper2({
      query, history, supabaseAdmin: supabase,
      config: {
        siteName: 'Baam', siteId: site.id,
        assistantName: 'Helper-2', assistantNameZh: '小帮手-2', locale: 'zh',
        providerStrategy: 'anthropic',
        anthropicApiKey, anthropicModel: process.env.HELPER2_ANTHROPIC_MODEL || 'claude-haiku-4-5',
        openAiApiKey: process.env.OPENAI_API_KEY, openAiModel: process.env.HELPER2_OPENAI_MODEL || 'gpt-5.4',
        webFallbackEnabled: true,
        ...(opts?.personalityOverride ? { personalityOverride: opts.personalityOverride } : {}),
      },
    });

    // Fast direct Claude call — bypasses full engine pipeline for guide/info/mixed
    // runHelper2 does: follow-up detection → intent → keywords → retrieval → web search → answer = 15-25s
    // runFastAI does: single Claude call with focused prompt = 2-5s
    const runFastAI = async (systemPrompt: string, maxTokens = 2048): Promise<Helper2ActionResult> => {
      // GPT-4.1-mini: best balance of speed + quality for Chinese answers
      // Benchmarks: life-event 11.8s/2848c, guide 10.3s/1960c, info 4.0s/853c
      // vs nano: 3.4s slower but 35% more content with better structure
      const openAiKey = process.env.OPENAI_API_KEY || '';
      const model = process.env.HELPER2_FAST_MODEL || 'gpt-4.1-mini';
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
        { role: 'user' as const, content: query },
      ];
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openAiKey}` },
        body: JSON.stringify({ model, max_tokens: maxTokens, messages }),
      });
      if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || '';
      return { answer, sources: [], intent: 'directAI', keywords: alloc.keywords, usedWebFallback: false, provider: `openai:${model}` };
    };

    // ─── Step 2: Route to the appropriate builder ───

    // Types 7, 11 (follow-up, life-event)
    if (alloc.type === 'follow-up' || alloc.type === 'life-event') {
      let result: Helper2ActionResult;

      if (alloc.type === 'life-event') {
        // Life-event: use fast direct Claude call (saves 10-15s vs full engine)
        result = await runFastAI(
          `你是"小帮手-2"，Baam 的纽约华人社区 AI 助手。用简体中文回答。用户正在经历一个重大生活变化。请给出一个全面的指南式回答，像一个热心邻居一样，按时间线帮用户规划。覆盖：证件办理、住房、医疗、教育、交通、财务等方面。用表格、清单、时间线格式组织内容，具体到去哪里办、费用多少、需要什么材料。最后加"还有什么想了解的？继续问我！"`
        );
      } else {
        // Follow-up: needs conversation history context from the full engine
        result = await runAI() as Helper2ActionResult;
      }
      // Enrich with related content
      const queryWords = extractQueryKeywords(query);
      const relatedKws = [...new Set([...alloc.keywords.filter(k => k.length >= 2), ...queryWords])].slice(0, 10);
      const related = await fetchRelatedContent(supabase, site.id, relatedKws);
      const relatedSources: Helper2ActionResult['sources'] = [];
      for (const g of related.guides) relatedSources.push({ type: '指南', title: g.title, url: `/guides/${g.slug}`, snippet: g.snippet });
      for (const n of related.news) relatedSources.push({ type: '新闻', title: n.title, url: `/news/${n.slug}`, snippet: n.snippet });
      for (const t of related.forum) relatedSources.push({ type: '论坛', title: t.title, url: `/forum/${t.boardSlug || 'general'}/${t.slug}`, snippet: t.snippet });
      for (const d of related.discover) relatedSources.push({ type: '发现', title: d.title, url: `/discover/${d.slug}`, snippet: d.snippet });
      if (relatedSources.length > 0) {
        result.sources = [...relatedSources, ...(result.sources || [])];
      }
      // Add CTA wrapper if AI answer doesn't already end with one
      if (result.answer && !result.answer.trim().endsWith('！') && !result.answer.includes('继续问我')) {
        result.answer = result.answer.trim() + '\n\n---\n\n还有什么想了解的？继续问我！';
      }
      // Add default quick replies if the AI engine didn't provide any
      if (!result.quickReplies || result.quickReplies.length === 0) {
        const kw = alloc.keywords[0] || '';
        result.quickReplies = [
          kw ? `${kw}相关商家` : '相关商家推荐',
          kw ? `${kw}生活指南` : '生活指南',
          '问问社区',
        ].filter(s => s.length > 2);
      }
      return logResult({ data: result });
    }

    // ─── Type 9: Business Lookup (template) ───
    if (alloc.type === 'business-lookup') {
      const { answer, sources } = buildBusinessLookup(alloc, query);
      const singleBiz = alloc.singleBusiness;
      return logResult({
        data: {
          answer, sources, intent: 'localLookup', keywords: alloc.keywords,
          usedWebFallback: false, provider: 'template',
          quickReplies: getQuickReplies('business-lookup', alloc.keywords, { bizName: singleBiz ? pickBusinessDisplayName(singleBiz as unknown as Record<string, unknown>, '') : undefined }),
          mapBusinesses: singleBiz ? toMapBusinesses([singleBiz]) : undefined,
        },
      });
    }

    // ─── Type 5: Community (template from DB, AI fallback if empty) ───
    if (alloc.type === 'community') {
      const queryKws = extractQueryKeywords(query);
      const communityKws = [...new Set([...alloc.keywords.filter(k => k.length >= 2 && k.length <= 20), ...queryKws])];
      const { forum, discover } = await fetchCommunityContent(supabase, site.id, communityKws);

      if (forum.length > 0 || discover.length > 0) {
        // Has community content — use template builder
        const { answer, sources } = buildCommunityAnswer(alloc, forum, discover);
        return logResult({
          data: {
            answer, sources, intent: 'community', keywords: alloc.keywords,
            usedWebFallback: false, provider: 'template',
            quickReplies: getQuickReplies('community', alloc.keywords),
          },
        });
      }

      // No community content found — fall through to fast AI for a helpful response
      const aiResult = await runFastAI(
        `你是"小帮手-2"，Baam 的纽约华人社区 AI 助手。用简体中文回答。用户想了解社区里大家的看法和经验。请根据你的知识给出有帮助的回答，分享纽约本地的实用信息和建议。不要说"没有找到社区讨论"。最后邀请用户在我们的论坛(/zh/forum)分享他们的看法。`
      );
      // Enrich with any available sources
      const related = await fetchRelatedContent(supabase, site.id, communityKws);
      const relatedSources: Helper2ActionResult['sources'] = [];
      for (const g of related.guides) relatedSources.push({ type: '指南', title: g.title, url: `/guides/${g.slug}`, snippet: g.snippet });
      for (const n of related.news) relatedSources.push({ type: '新闻', title: n.title, url: `/news/${n.slug}`, snippet: n.snippet });
      for (const t of related.forum) relatedSources.push({ type: '论坛', title: t.title, url: `/forum/${t.boardSlug || 'general'}/${t.slug}`, snippet: t.snippet });
      for (const d of related.discover) relatedSources.push({ type: '发现', title: d.title, url: `/discover/${d.slug}`, snippet: d.snippet });
      aiResult.sources = [...relatedSources, ...(aiResult.sources || [])];
      if (!aiResult.quickReplies || aiResult.quickReplies.length === 0) {
        aiResult.quickReplies = getQuickReplies('community', alloc.keywords);
      }
      if (!aiResult.answer.includes('继续问我')) {
        aiResult.answer = aiResult.answer.trim() + '\n\n---\n\n想了解更多？继续问我！';
      }
      return logResult({ data: aiResult });
    }

    // ─── Type 6: News & Events (template from DB, AI fallback if empty) ───
    if (alloc.type === 'news-events') {
      const newsKws = [...new Set([...alloc.keywords.filter(k => k.length >= 2 && k.length <= 20), ...extractQueryKeywords(query)])];
      const { news, events } = await fetchNewsAndEvents(supabase, site.id, newsKws);

      if (news.length > 0 || events.length > 0) {
        const { answer, sources } = buildNewsEventsAnswer(alloc, news, events);
        return logResult({
          data: {
            answer, sources, intent: 'newsEvents', keywords: alloc.keywords,
            usedWebFallback: false, provider: 'template',
            quickReplies: getQuickReplies('news-events', alloc.keywords),
          },
        });
      }

      // No news/events found — fall through to fast AI
      const aiResult = await runFastAI(
        `你是"小帮手-2"，Baam 的纽约华人社区 AI 助手。用简体中文回答。用户在问最近的新闻或活动。请根据你的知识分享纽约本地最近的动态和活动信息。不要说"没有找到新闻"。推荐用户查看我们的新闻页面(/zh/news)和活动页面(/zh/events)获取最新信息。`
      );
      const related = await fetchRelatedContent(supabase, site.id, newsKws);
      const relatedSources: Helper2ActionResult['sources'] = [];
      for (const g of related.guides) relatedSources.push({ type: '指南', title: g.title, url: `/guides/${g.slug}`, snippet: g.snippet });
      for (const n of related.news) relatedSources.push({ type: '新闻', title: n.title, url: `/news/${n.slug}`, snippet: n.snippet });
      for (const t of related.forum) relatedSources.push({ type: '论坛', title: t.title, url: `/forum/${t.boardSlug || 'general'}/${t.slug}`, snippet: t.snippet });
      for (const d of related.discover) relatedSources.push({ type: '发现', title: d.title, url: `/discover/${d.slug}`, snippet: d.snippet });
      aiResult.sources = [...relatedSources, ...(aiResult.sources || [])];
      if (!aiResult.quickReplies || aiResult.quickReplies.length === 0) {
        aiResult.quickReplies = getQuickReplies('news-events', alloc.keywords);
      }
      if (!aiResult.answer.includes('继续问我')) {
        aiResult.answer = aiResult.answer.trim() + '\n\n---\n\n想了解更多？继续问我！';
      }
      return logResult({ data: aiResult });
    }

    // ─── Type 10: Comparison (template from DB) ───
    if (alloc.type === 'comparison') {
      const { answer, sources } = buildComparisonAnswer(alloc);
      const pairNames = alloc.comparisonPair
        ? [pickBusinessDisplayName(alloc.comparisonPair[0] as unknown as Record<string, unknown>, ''), pickBusinessDisplayName(alloc.comparisonPair[1] as unknown as Record<string, unknown>, '')] as [string, string]
        : undefined;
      const compMapBiz = alloc.comparisonPair ? toMapBusinesses([alloc.comparisonPair[0], alloc.comparisonPair[1]]) : undefined;
      return logResult({
        data: {
          answer, sources, intent: 'comparison', keywords: alloc.keywords,
          usedWebFallback: false, provider: 'template',
          quickReplies: getQuickReplies('comparison', alloc.keywords, { pairNames }),
          mapBusinesses: compMapBiz,
        },
      });
    }

    // ─── Type 1: Business Recommendation (template from DB) ───
    if (alloc.type === 'business-recommendation') {
      const category = await findCategoryId(supabase, site.id, alloc.keywords, query);
      if (!category) {
        const { answer, sources } = buildNoMatch(query, alloc.keywords);
        return logResult({ data: { answer, sources, intent: 'localRecommendation', keywords: alloc.keywords, usedWebFallback: false, provider: 'template', quickReplies: getQuickReplies('no-match', alloc.keywords) } });
      }

      const regionSlug = detectRegionSlug(query);
      const { businesses, locationFallback } = await fetchCategoryBusinesses(supabase, site.id, category.id, regionSlug, category.subcuisineKeywords);
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

    // ─── Types 2, 3, 4: Guide, Info, Mixed (AI + template wrapper) ───
    if (alloc.type === 'guide' || alloc.type === 'info-lookup' || alloc.type === 'mixed') {
      // Use fast direct Claude call (2-5s) instead of full engine pipeline (15-25s)
      const systemPrompt = `你是"小帮手-2"，Baam 的纽约华人社区 AI 助手。用简体中文回答。请直接从你的知识回答问题 — 不要说"没有找到"或"没有相关数据"或"站内没有"。清晰、有帮助、有结构地回答问题（用标题、列表、表格）。如果可以将答案本地化到纽约，请这样做。${alloc.type === 'mixed' ? '当问题同时涉及信息和服务时，先提供信息，再推荐相关本地商家。' : ''}${alloc.type === 'info-lookup' ? '直接给出答案数据，不要啰嗦。' : ''}`;

      const aiResult = await runFastAI(systemPrompt);
      const aiAnswer = aiResult.answer;

      // Fetch related content — use dictionary-matched keywords for better Chinese matching
      const guideQueryKws = extractQueryKeywords(query);
      const guideRelatedKws = [...new Set([...guideQueryKws, ...alloc.keywords.filter(k => k.length >= 2)])].slice(0, 10);
      const related = await fetchRelatedContent(supabase, site.id, guideRelatedKws);
      let businesses: import('@/lib/helper/types').BusinessResult[] = [];

      if (alloc.type === 'mixed') {
        const category = await findCategoryId(supabase, site.id, alloc.keywords, query);
        if (category) {
          const regionSlug = detectRegionSlug(query);
          const fetched = await fetchCategoryBusinesses(supabase, site.id, category.id, regionSlug, category.subcuisineKeywords);
          businesses = fetched.businesses;
        }
      }

      const enrichedAlloc = { ...alloc, businesses, related };

      let built;
      if (alloc.type === 'guide') {
        built = buildGuideAnswer(enrichedAlloc, aiAnswer);
        // Filter out business sources from guide answers
        const businessTypes = new Set(['Business', '商家']);
        built.sources = aiResult.sources.filter(s => !businessTypes.has(s.type));
      } else if (alloc.type === 'mixed') {
        // Clean AI answer: remove "no results" apologies
        let cleanedAnswer = aiAnswer
          .replace(/^.*?(?:没有找到|暂时没有|无法找到|没有相关|抱歉.*?没有).*?\n+/i, '')
          .trim();
        if (!cleanedAnswer || cleanedAnswer.length < 50) cleanedAnswer = aiAnswer;

        built = buildMixedAnswer(enrichedAlloc, cleanedAnswer);

        // Combine: business sources from builder + non-business AI sources
        const businessTypes = new Set(['Business', '商家']);
        const aiNonBizSources = aiResult.sources.filter(s => !businessTypes.has(s.type));
        built.sources = [...built.sources, ...aiNonBizSources];
      } else {
        // Type 3: Info Lookup
        let cleanedAnswer = aiAnswer
          .replace(/^.*?(?:没有找到|暂时没有|无法找到|没有相关|抱歉.*?没有).*?\n+/i, '')
          .trim();
        if (!cleanedAnswer || cleanedAnswer.length < 50) cleanedAnswer = aiAnswer;

        built = buildInfoLookup(enrichedAlloc, cleanedAnswer);
        const businessTypes = new Set(['Business', '商家']);
        built.sources = aiResult.sources.filter(s => !businessTypes.has(s.type));
      }

      // Add related content sources
      const relatedSources: Helper2ActionResult['sources'] = [];
      for (const g of related.guides) relatedSources.push({ type: '指南', title: g.title, url: `/guides/${g.slug}`, snippet: g.snippet });
      for (const n of related.news) relatedSources.push({ type: '新闻', title: n.title, url: `/news/${n.slug}`, snippet: n.snippet });
      for (const t of related.forum) relatedSources.push({ type: '论坛', title: t.title, url: `/forum/${t.boardSlug || 'general'}/${t.slug}`, snippet: t.snippet });
      for (const d of related.discover) relatedSources.push({ type: '发现', title: d.title, url: `/discover/${d.slug}`, snippet: d.snippet });

      return logResult({
        data: {
          answer: built.answer,
          sources: [...relatedSources, ...built.sources],
          intent: aiResult.intent,
          keywords: alloc.keywords,
          usedWebFallback: aiResult.usedWebFallback,
          provider: aiResult.provider,
          quickReplies: getQuickReplies(alloc.type, alloc.keywords, {
            topBizNames: businesses.slice(0, 2).map(b => pickBusinessDisplayName(b as unknown as Record<string, unknown>, '')),
          }),
          mapBusinesses: businesses.length > 0 ? toMapBusinesses(businesses) : undefined,
        },
      });
    }

    // ─── Type 8: No Match ───
    const { answer, sources } = buildNoMatch(query, alloc.keywords);
    return logResult({
      data: {
        answer, sources, intent: 'localLookup', keywords: alloc.keywords,
        usedWebFallback: false, provider: 'template',
        quickReplies: getQuickReplies('no-match', alloc.keywords),
      },
    });

  } catch (error) {
    return {
      error: error instanceof Error ? error.message : '小帮手-2 暂时无法回答，请稍后再试',
    };
  }
}

// ─── Preview: instant related content while AI generates ────
export async function previewHelper2(query: string): Promise<{
  sources: Helper2ActionResult['sources'];
  type: string;
}> {
  try {
    const supabase = createAdminClient() as AnyRow;
    const site = await getCurrentSite();
    const queryKws = extractQueryKeywords(query);
    if (queryKws.length === 0) return { sources: [], type: 'unknown' };
    const related = await fetchRelatedContent(supabase, site.id, queryKws);
    const sources: Helper2ActionResult['sources'] = [];
    for (const g of related.guides) sources.push({ type: '指南', title: g.title, url: `/guides/${g.slug}`, snippet: g.snippet });
    for (const n of related.news) sources.push({ type: '新闻', title: n.title, url: `/news/${n.slug}`, snippet: n.snippet });
    for (const t of related.forum) sources.push({ type: '论坛', title: t.title, url: `/forum/${t.boardSlug || 'general'}/${t.slug}`, snippet: t.snippet });
    for (const d of related.discover) sources.push({ type: '发现', title: d.title, url: `/discover/${d.slug}`, snippet: d.snippet });
    return { sources, type: 'preview' };
  } catch {
    return { sources: [], type: 'error' };
  }
}

// ─── HP1: Feedback Persistence ──────────────────────────────
export async function submitHelper2Feedback(
  query: string,
  rating: 1 | -1,
  meta?: { answerType?: string; keywords?: string[]; provider?: string },
): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient() as AnyRow;
    const site = await getCurrentSite();
    const { error } = await supabase.from('helper_feedback').insert({
      site_id: site.id,
      query: query.slice(0, 500),
      answer_type: meta?.answerType || null,
      rating,
      keywords: meta?.keywords?.slice(0, 10) || [],
      provider: meta?.provider || null,
    });
    if (error) {
      console.warn(`[Helper-2 Feedback] DB error: ${error.message} — table may need to be created. Run: supabase/migrations/20260424_helper_feedback.sql`);
      return { error: error.message };
    }
    console.log(`[Helper-2 Feedback] Saved: rating=${rating} query="${query.slice(0, 40)}"`);
    return {};
  } catch (err) {
    console.warn('[Helper-2 Feedback] Failed:', err);
    return { error: 'Failed to submit feedback' };
  }
}

// ─── HP2: Rate Limiting ─────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 15; // requests
const RATE_LIMIT_WINDOW = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true; // allowed
  }
  if (entry.count >= RATE_LIMIT_MAX) return false; // blocked
  entry.count++;
  return true; // allowed
}

// Clean up stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
  }, 300_000);
}

export { checkRateLimit };
