'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentSite } from '@/lib/sites';
import { pickBusinessDisplayName } from '@/lib/business-name';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface AskResult {
  answer: string;
  sources: {
    type: string;
    title: string;
    url: string;
    snippet?: string;
  }[];
  debugPrompt?: {
    keywords: string[];
    systemPrompt: string;
    userPrompt: string;
    model: string;
    totalResults: number;
    qualityLevel?: 'high' | 'medium' | 'low';
    strictEvidenceMode?: boolean;
    rankingConsistency?: number;
    rankingFallbackApplied?: boolean;
    contextCounts?: {
      businesses: number;
      guides: number;
      news: number;
      threads: number;
      voices: number;
      events: number;
    };
    relevanceCounts?: {
      businesses: { before: number; after: number };
      guides: { before: number; after: number };
      news: { before: number; after: number };
      threads: { before: number; after: number };
      voices: { before: number; after: number };
      events: { before: number; after: number };
    };
  };
}

// ─── AI-powered keyword extraction ──────────────────────────────────
// Uses Claude Haiku to understand user intent and extract search keywords.
// Handles any phrasing naturally — no manual stop words needed.
// Falls back to regex-based extraction if AI call fails.

async function extractKeywordsWithAI(query: string): Promise<string[]> {
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    const response = await withTimeout(anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: `You are a search keyword extractor for a Chinese community platform in NYC (Baam).
The platform has 6 content types: businesses, news articles, living guides, forum threads, local voices (influencer posts), and events.

Given a user's question, extract 1-5 core search keywords that would match across ALL content types.

Rules:
- Return ONLY the keywords, one per line, nothing else
- Remove filler words, questions, locations (法拉盛/纽约/曼哈顿 etc.)
- Keep specific nouns:
  · Business terms: food types (火锅, 饺子, 川菜), services (牙医, 律师, 搬家), specialties (针灸, 报税)
  · Article/guide topics: 移民, 租房, 报税, 驾照, 医保, 学区
  · Event terms: 春节, 演出, 讲座, 招聘会
  · Forum topics: 经验, 求助, 推荐
- Keep symptom/need terms: 膝盖痛, 发烧, 漏水, 脱发
- Shorten to category keywords when possible: "上海餐馆" → "上海菜", "办绿卡" → "绿卡"
- For English mixed queries, keep English terms too
- Maximum 5 keywords, prefer fewer and more precise`,
      messages: [{ role: 'user', content: query }],
    }), 12000);

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const keywords = text.split('\n').map(l => l.trim()).filter(l => l.length >= 2 && l.length <= 10);
    if (keywords.length > 0) return keywords.slice(0, 5);
  } catch {
    // AI extraction failed — fall through to regex fallback
  }
  return extractKeywordsFallback(query);
}

// Regex-based fallback (used if AI extraction fails)
function extractKeywordsFallback(query: string): string[] {
  const LOCATIONS = ['法拉盛', '皇后区', '曼哈顿', '布鲁克林', '纽约', '唐人街', 'Flushing', 'Queens'];
  const stopPhrases = [
    '请问一下', '请问', '帮我找', '帮我', '告诉我', '给我看', '给我', '帮忙', '麻烦',
    '哪些', '什么样', '什么', '怎么样', '怎么办', '怎么', '如何',
    '哪里有', '哪里', '哪儿', '哪个', '哪家', '谁知道',
    '哪有', '哪儿有', '有没有', '有什么', '是什么', '在哪里', '在哪',
    '找出来', '列出来', '列出', '列举', '找出', '找到',
    '搜一下', '查一下', '看一下', '看看', '查查', '搜搜',
    '推荐一下', '推荐', '介绍一下', '介绍', '求推荐', '求介绍', '说一下', '说说',
    '所有的', '所有', '全部', '一些', '几家', '几个', '多少',
    '好吃的', '好喝的', '好用的', '好的', '最好的', '最好',
    '排列', '按照', '排名', '排名榜', '评价', '评分', '分数',
    '比较好', '比较', '特别好', '特别', '非常', '真的', '一般', '不错', '靠谱', '正规',
    '我要吃', '我要喝', '我要买', '我要找', '我要去', '我要',
    '我想吃', '我想喝', '我想买', '我想找', '我想去', '我想',
    '想要', '需要', '想吃', '想喝', '想买', '想找', '想去',
    '要吃', '要喝', '要买', '要找', '要去', '去吃', '去喝', '去买', '去找', '去看',
    '可以', '应该', '一下', '知道', '听说', '据说', '好像',
    '本地', '附近', '周围', '旁边',
    '请客吃饭', '请客', '吃饭', '地方', '方面', '时候', '问题',
    '能不能', '可不可以', '是不是', '会不会',
    '怎么处理', '怎么弄', '怎么搞',
    '去哪里', '去哪儿', '去哪', '在哪里', '在哪儿',
    '哪里订', '哪里买', '哪里学', '哪里修', '哪里看', '哪里找',
    '找谁', '问谁', '哪里有卖',
  ];
  const stopCharSet = new Set([
    '我', '你', '他', '她', '它', '您', '咱',
    '的', '了', '吗', '呢', '吧', '啊', '呀', '哦', '嘛', '哈', '着', '过', '地', '得',
    '是', '在', '把', '被', '从', '向', '跟', '与', '或',
    '很', '太', '都', '也', '就', '才', '又', '再', '还', '更',
    '这', '那', '些', '所', '每', '各', '个',
    '请', '让', '给', '叫', '去', '来', '到', '用', '能', '会', '要', '想',
    '找', '看', '说', '做', '有', '好', '对',
  ]);

  let remaining = query.trim();
  for (const loc of LOCATIONS) {
    if (remaining.includes(loc)) remaining = remaining.replace(loc, ' ');
  }
  [...stopPhrases].sort((a, b) => b.length - a.length).forEach(w => {
    remaining = remaining.replace(new RegExp(w, 'g'), ' ');
  });
  let segments = remaining.split(/[\s,，、.。!！?？·；;：:""''「」【】（）()\-—]+/).filter(w => w.length >= 2);
  segments = segments.map(seg => {
    while (seg.length > 1 && stopCharSet.has(seg[0])) seg = seg.slice(1);
    while (seg.length > 1 && stopCharSet.has(seg[seg.length - 1])) seg = seg.slice(0, -1);
    return seg;
  }).filter(w => w.length >= 2);
  return [...new Set(segments)].filter(k => k.length >= 2).slice(0, 8);
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const CONTEXT_LIMITS = {
  businesses: 8,
  guides: 4,
  news: 3,
  threads: 3,
  voices: 3,
  events: 3,
} as const;

const SOURCE_LIMITS = {
  businesses: 12,
  guides: 4,
  news: 3,
  threads: 3,
  voices: 3,
  events: 3,
} as const;
const MAX_LISTED_BUSINESSES_WHEN_HUGE = 10;

const RELEVANCE_MIN = {
  businesses: 0.2,
  guides: 0.2,
  news: 0.2,
  threads: 0.2,
  voices: 0.15,
  events: 0.15,
} as const;

function isListAllBusinessQuery(query: string): boolean {
  return /(有多少|列出来|全部|所有|完整名单|全都)/.test(query);
}

function normalizeKeywords(keywords: string[]): string[] {
  return [...new Set(keywords.map((k) => k.trim().toLowerCase()).filter((k) => k.length >= 2))];
}

function expandBusinessKeywords(keywords: string[]): string[] {
  const expanded = new Set<string>();
  for (const kw of keywords) {
    const k = kw.trim();
    if (!k) continue;
    expanded.add(k);

    // Common compound intents: "中文牙医", "华人律师", etc.
    const commonTokens = ['牙医', '口腔', '诊所', '医生', '律师', '会计', '报税', '驾校', '搬家', '维修', '中医'];
    for (const token of commonTokens) {
      if (k.includes(token)) expanded.add(token);
    }

    // CJK compound fallback: add 2-char head/tail fragments.
    if (/[\u4e00-\u9fff]/.test(k) && k.length >= 4) {
      expanded.add(k.slice(0, 2));
      expanded.add(k.slice(-2));
    }
  }
  return [...expanded].filter((x) => x.length >= 2);
}

function isDentalIntent(query: string, keywords: string[]): boolean {
  if (/(牙医|口腔|dentist|dental|orthodont)/i.test(query)) return true;
  return keywords.some((k) => /(牙医|口腔|dent|tooth)/i.test(k));
}

function isRestaurantIntent(query: string, keywords: string[]): boolean {
  if (/(餐厅|餐馆|饭店|中餐|川菜|粤菜|火锅|烤肉|美食|restaurant|dining|hot ?pot)/i.test(query)) return true;
  return keywords.some((k) => /(餐|馆|中餐|川菜|粤菜|火锅|烤肉|restaurant|dining)/i.test(k));
}

type ServiceIntentProfile = {
  key: 'dental' | 'lawyer' | 'tax' | 'driving' | 'moving' | 'tcm';
  entityRegex: RegExp;
  fallbackOr: string;
  countOr?: string;
};

function detectServiceIntentProfile(query: string, keywords: string[]): ServiceIntentProfile | null {
  const merged = `${query} ${keywords.join(' ')}`;
  if (/(牙医|口腔|dentist|dental|orthodont)/i.test(merged)) {
    return {
      key: 'dental',
      entityRegex: /(牙医|口腔|齿科|\bdent(?:al|ist)?\b|tooth|orthodont)/i,
      fallbackOr: 'display_name_zh.ilike.%牙医%,display_name_zh.ilike.%口腔%,display_name.ilike.%dent%,short_desc_zh.ilike.%牙%,ai_summary_zh.ilike.%牙%',
    };
  }
  if (/(律师|律所|移民法|lawyer|attorney|law firm|immigration)/i.test(merged)) {
    return {
      key: 'lawyer',
      entityRegex: /(律师|律所|lawyer|attorney|law firm|immigration)/i,
      fallbackOr: 'display_name_zh.ilike.%律师%,display_name_zh.ilike.%律所%,display_name.ilike.%lawyer%,display_name.ilike.%attorney%,display_name.ilike.%law firm%,short_desc_zh.ilike.%律师%,short_desc_zh.ilike.%移民%',
      countOr: 'display_name_zh.ilike.%律师%,display_name_zh.ilike.%律所%,display_name.ilike.%lawyer%,display_name.ilike.%attorney%,display_name.ilike.%law firm%',
    };
  }
  if (/(会计|报税|税务|cpa|tax|accounting)/i.test(merged)) {
    return {
      key: 'tax',
      entityRegex: /(会计|报税|税务|cpa|tax|accounting|bookkeep)/i,
      fallbackOr: 'display_name_zh.ilike.%会计%,display_name_zh.ilike.%报税%,display_name_zh.ilike.%税务%,display_name.ilike.%cpa%,display_name.ilike.%tax%,display_name.ilike.%accounting%,short_desc_zh.ilike.%报税%,short_desc_zh.ilike.%会计%',
      countOr: 'display_name_zh.ilike.%会计%,display_name_zh.ilike.%报税%,display_name_zh.ilike.%税务%,display_name.ilike.%cpa%,display_name.ilike.%tax%,display_name.ilike.%accounting%',
    };
  }
  if (/(驾校|驾驶|学车|driving school)/i.test(merged)) {
    return {
      key: 'driving',
      entityRegex: /(驾校|驾驶|学车|driving school|road test)/i,
      fallbackOr: 'display_name_zh.ilike.%驾校%,display_name_zh.ilike.%学车%,display_name.ilike.%driving school%,short_desc_zh.ilike.%驾校%',
    };
  }
  if (/(搬家|搬运|搬家公司|moving)/i.test(merged)) {
    return {
      key: 'moving',
      entityRegex: /(搬家|搬运|moving|relocation)/i,
      fallbackOr: 'display_name_zh.ilike.%搬家%,display_name_zh.ilike.%搬运%,display_name.ilike.%moving%,short_desc_zh.ilike.%搬家%',
    };
  }
  if (/(中医|针灸|推拿|中药|tcm|acupuncture)/i.test(merged)) {
    return {
      key: 'tcm',
      entityRegex: /(中医|针灸|推拿|中药|tcm|acupuncture|herbal)/i,
      fallbackOr: 'display_name_zh.ilike.%中医%,display_name_zh.ilike.%针灸%,display_name.ilike.%acupuncture%,short_desc_zh.ilike.%中医%,short_desc_zh.ilike.%针灸%',
    };
  }
  return null;
}

function serviceGuideRegex(profile: ServiceIntentProfile): RegExp {
  switch (profile.key) {
    case 'dental':
      return /(牙医|口腔|齿科|dental|dentist)/i;
    case 'lawyer':
      return /(律师|律所|移民|lawyer|attorney|law firm)/i;
    case 'tax':
      return /(会计|报税|税务|cpa|tax|accounting)/i;
    case 'driving':
      return /(驾校|学车|路考|driving school)/i;
    case 'moving':
      return /(搬家|搬运|moving)/i;
    case 'tcm':
      return /(中医|针灸|推拿|中药|acupuncture)/i;
    default:
      return /.*/;
  }
}

function extractServiceConstraints(query: string): string[] {
  const constraints: string[] = [];
  if (/粤语|广东话/.test(query)) constraints.push('粤语');
  if (/中文|普通话|国语/.test(query)) constraints.push('中文');
  if (/儿科|儿童|小孩/.test(query)) constraints.push('儿科');
  if (/小企业|公司报税|企业报税|自雇/.test(query)) constraints.push('小企业');
  if (/电子报税|e-file/i.test(query)) constraints.push('电子报税');
  if (/价格透明|明码标价|咨询费|费用/.test(query)) constraints.push('价格透明');
  if (/周末|星期六|星期天/.test(query)) constraints.push('周末');
  if (/保险|医保/.test(query)) constraints.push('保险');
  if (/急诊|当天|马上|紧急|递解令/.test(query)) constraints.push('紧急');
  return constraints;
}

function detectLocationConstraintGap(query: string, evidenceText: string): boolean {
  const lowerEvidence = evidenceText.toLowerCase();
  const checks: Array<{ token: RegExp; aliases: string[] }> = [
    { token: /法拉盛/i, aliases: ['法拉盛', 'flushing'] },
    { token: /曼哈顿/i, aliases: ['曼哈顿', 'manhattan'] },
    { token: /布鲁克林/i, aliases: ['布鲁克林', 'brooklyn'] },
    { token: /皇后区/i, aliases: ['皇后区', 'queens'] },
  ];
  for (const c of checks) {
    if (c.token.test(query)) {
      const hit = c.aliases.some((a) => lowerEvidence.includes(a.toLowerCase()));
      if (!hit) return true;
    }
  }
  return false;
}

function hasExplicitLocationQuery(query: string): boolean {
  return /(法拉盛|flushing|曼哈顿|manhattan|布鲁克林|brooklyn|皇后区|queens|长岛|long island)/i.test(query);
}

function extractRequestedLocationFilter(query: string): { regex: RegExp; sqlIlike: string } | null {
  if (/法拉盛|flushing/i.test(query)) return { regex: /(法拉盛|flushing)/i, sqlIlike: '%Flushing%' };
  if (/曼哈顿|manhattan/i.test(query)) return { regex: /(曼哈顿|manhattan)/i, sqlIlike: '%Manhattan%' };
  if (/布鲁克林|brooklyn/i.test(query)) return { regex: /(布鲁克林|brooklyn)/i, sqlIlike: '%Brooklyn%' };
  if (/皇后区|queens/i.test(query)) return { regex: /(皇后区|queens)/i, sqlIlike: '%Queens%' };
  if (/长岛|long island/i.test(query)) return { regex: /(长岛|long island)/i, sqlIlike: '%Long Island%' };
  return null;
}

function buildRetrievalQuery(query: string, history: ChatMessage[]): string {
  const needsContextCarry = /(第一家|第二家|第三家|那家|这家|上面|刚才|前面)/.test(query)
    || /(地址|电话|联系方式|营业时间|怎么去)/.test(query);
  if (!needsContextCarry) return query;
  const lastUser = [...history].reverse().find((m) => m.role === 'user')?.content?.trim();
  if (!lastUser || lastUser === query) return query;
  if (lastUser.length > 120) return query;
  return `${lastUser}；${query}`;
}

function getRelevanceScore(text: string, keywords: string[]): number {
  if (!text || keywords.length === 0) return 0;
  const lower = text.toLowerCase();
  let matchedScore = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) {
      matchedScore += 1;
      continue;
    }
    // Handle compound CJK keywords like "中文牙医" by checking short fragments.
    if (kw.length >= 4) {
      const fragments = [kw.slice(0, 2), kw.slice(-2)];
      if (fragments.some((f) => lower.includes(f))) {
        matchedScore += 0.5;
      }
    }
  }
  return matchedScore / keywords.length;
}

function filterByRelevance<T>(
  rows: T[],
  keywords: string[],
  toText: (row: T) => string,
  minScore: number,
  options?: { keepTopOneFallback?: boolean; minFallbackScore?: number }
): T[] {
  if (rows.length === 0 || keywords.length === 0) return rows;
  const scored = rows.map((row) => ({ row, score: getRelevanceScore(toText(row), keywords) }));
  const filtered = scored.filter((x) => x.score >= minScore).map((x) => x.row);
  // Optional fallback: keep top 1 only if caller explicitly enables it.
  if (filtered.length === 0 && options?.keepTopOneFallback) {
    const minFallbackScore = options.minFallbackScore ?? minScore;
    const top = scored.sort((a, b) => b.score - a.score)[0];
    if (top && top.score >= minFallbackScore) return [top.row];
  }
  if (filtered.length === 0) return [];
  return filtered;
}

function evaluateQualityLevel(input: {
  hasLocalEvidence: boolean;
  totalResults: number;
  rankingConsistency: number;
  businesses: number;
  guides: number;
  news: number;
  threads: number;
  voices: number;
  events: number;
}): 'high' | 'medium' | 'low' {
  if (!input.hasLocalEvidence) return 'low';

  const nonBusinessSignals = input.guides + input.news + input.threads + input.voices + input.events;
  const strongCoverage = input.totalResults >= 6 && (input.businesses >= 3 || nonBusinessSignals >= 4);
  const weakCoverage = input.totalResults <= 2 || (input.businesses === 0 && nonBusinessSignals <= 1);

  if (weakCoverage) return 'low';
  if (input.rankingConsistency < 0.75) return 'medium';
  return strongCoverage ? 'high' : 'medium';
}

function rankBusinesses(
  businesses: AnyRow[],
  keywords: string[],
  categoryBizIds: Set<string>
): AnyRow[] {
  const genericWords = new Set(['餐厅', '饭店', '美食', '餐馆', '好吃', '推荐', '最好', '哪家', '附近', '商家', '店', '服务']);
  const hasSpecificKeywords = keywords.some((kw: string) =>
    kw.length >= 2 && !genericWords.has(kw)
  );

  const sorted = [...businesses].sort((a, b) => {
    if (hasSpecificKeywords) {
      // Narrow query: preserve intent relevance, then score
      const aText = [a.display_name_zh, a.display_name, a.short_desc_zh].filter(Boolean).join(' ');
      const bText = [b.display_name_zh, b.display_name, b.short_desc_zh].filter(Boolean).join(' ');
      const aHasKeyword = keywords.some((kw: string) => aText.includes(kw));
      const bHasKeyword = keywords.some((kw: string) => bText.includes(kw));
      const aInCategory = categoryBizIds.has(a.id);
      const bInCategory = categoryBizIds.has(b.id);
      const aTier = aHasKeyword ? 0 : aInCategory ? 1 : 2;
      const bTier = bHasKeyword ? 0 : bInCategory ? 1 : 2;
      if (aTier !== bTier) return aTier - bTier;
    }

    // Keep lightweight editorial boost, then total_score as primary fairness signal
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return (b.total_score || 0) - (a.total_score || 0);
  });

  return sorted;
}

function calculateRankingConsistency(
  ranked: AnyRow[],
  baselineByScore: AnyRow[],
  topN = 10
): number {
  const rankedTop = ranked.slice(0, topN).map((b) => b.id);
  const baselinePos = new Map<string, number>();
  baselineByScore.slice(0, topN).forEach((b, idx) => baselinePos.set(b.id, idx));
  const comparable = rankedTop.filter((id) => baselinePos.has(id));

  if (comparable.length < 2) return 1;
  let inversions = 0;
  const maxPairs = (comparable.length * (comparable.length - 1)) / 2;

  for (let i = 0; i < comparable.length; i++) {
    for (let j = i + 1; j < comparable.length; j++) {
      const pi = baselinePos.get(comparable[i])!;
      const pj = baselinePos.get(comparable[j])!;
      if (pi > pj) inversions++;
    }
  }
  return Number((1 - inversions / maxPairs).toFixed(3));
}

function sanitizeBusinesses(rows: AnyRow[]): AnyRow[] {
  return rows
    .filter((b) => b && b.id && b.slug)
    .map((b) => ({
      id: b.id,
      slug: b.slug,
      display_name: b.display_name || null,
      display_name_zh: b.display_name_zh || null,
      short_desc_zh: b.short_desc_zh || null,
      ai_tags: Array.isArray(b.ai_tags) ? b.ai_tags : [],
      avg_rating: b.avg_rating ?? null,
      review_count: b.review_count ?? 0,
      phone: b.phone || null,
      address_full: b.address_full || null,
      website_url: b.website_url || null,
      total_score: b.total_score ?? 0,
      is_featured: Boolean(b.is_featured),
    }));
}

function sanitizeGuides(rows: AnyRow[]): AnyRow[] {
  return rows
    .filter((g) => g && g.slug && g.title_zh)
    .map((g) => ({
      slug: g.slug,
      title_zh: g.title_zh,
      ai_summary_zh: g.ai_summary_zh || '',
      body_zh: typeof g.body_zh === 'string' ? g.body_zh : '',
      quote_zh: ((g.ai_summary_zh || g.body_zh || '') as string)
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
        .replace(/\[[^\]]+\]\(([^)]+)\)/g, '$1')
        .replace(/[#>*`_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120),
    }));
}

function sanitizeNews(rows: AnyRow[]): AnyRow[] {
  return rows
    .filter((n) => n && n.slug && n.title_zh)
    .map((n) => ({
      slug: n.slug,
      title_zh: n.title_zh,
      ai_summary_zh: n.ai_summary_zh || '',
      published_at: n.published_at || null,
    }));
}

function sanitizeThreads(rows: AnyRow[]): AnyRow[] {
  return rows
    .filter((t) => t && t.slug && t.title)
    .map((t) => ({
      slug: t.slug,
      title: t.title,
      ai_summary_zh: t.ai_summary_zh || '',
      reply_count: t.reply_count ?? 0,
      categories: t.categories || null,
    }));
}

function sanitizeVoices(rows: AnyRow[]): AnyRow[] {
  return rows
    .filter((v) => v && v.slug)
    .map((v) => ({
      slug: v.slug,
      title: v.title || null,
      excerpt: v.excerpt || null,
      content: v.content || null,
      topic_tags: Array.isArray(v.topic_tags) ? v.topic_tags : [],
      location_text: v.location_text || '',
      like_count: v.like_count ?? 0,
      profiles: v.profiles || null,
    }));
}

function sanitizeEvents(rows: AnyRow[]): AnyRow[] {
  return rows
    .filter((e) => e && e.slug && (e.title_zh || e.title_en))
    .map((e) => ({
      slug: e.slug,
      title_zh: e.title_zh || null,
      title_en: e.title_en || null,
      summary_zh: e.summary_zh || '',
      venue_name: e.venue_name || '',
      start_at: e.start_at || null,
      is_free: Boolean(e.is_free),
    }));
}

function dedupeAndCapSources(
  sources: AskResult['sources'],
  maxTotal = 20
): AskResult['sources'] {
  const seen = new Set<string>();
  const deduped: AskResult['sources'] = [];
  for (const s of sources) {
    const key = `${s.type}|${s.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(s);
    if (deduped.length >= maxTotal) break;
  }
  return deduped;
}

function rankSourcesByQueryRelevance(
  sources: AskResult['sources'],
  query: string,
  keywords: string[]
): AskResult['sources'] {
  const sourceKeywords = expandBusinessKeywords([...keywords, ...normalizeKeywords([query])]);
  const isRestaurantIntent = /(餐厅|中餐|川菜|火锅|烤肉|饭店|美食)/.test(query);
  const scored = sources.map((s, idx) => {
    const text = `${s.title || ''} ${s.snippet || ''}`.toLowerCase();
    let score = 0;
    for (const kw of sourceKeywords) {
      if (!kw) continue;
      if (text.includes(kw.toLowerCase())) score += 1;
    }
    if (isRestaurantIntent && s.type === '商家') score += 1.5;
    return { s, score, idx };
  });
  return scored
    .sort((a, b) => (b.score - a.score) || (a.idx - b.idx))
    .map((x) => x.s);
}

function envFlagOn(value: string | undefined): boolean {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timeout:${ms}`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function buildFallbackAnswer(input: {
  query: string;
  hasLocalEvidence: boolean;
  businesses: AnyRow[];
  guides?: AnyRow[];
  maxBusinesses?: number;
  matchedCount?: number;
}): string {
  const maxBusinesses = input.maxBusinesses || 5;
  const top = input.businesses.slice(0, maxBusinesses);
  if (!input.hasLocalEvidence || top.length === 0) {
    return `⚠️ 我在当前本地数据库里未检索到足够本地数据来直接匹配你的需求。\n\n你可以补充这三个条件，我马上给你更准结果：\n1. 具体区域（如：法拉盛 Main St 附近）\n2. 细分需求（如：中文前台、周末门诊、是否接受保险）\n3. 预算范围或时间要求`;
  }
  const totalText = input.matchedCount ? `（共检索到${input.matchedCount}家）` : '';
  const rows = top.map((b) => {
    const rating = b.avg_rating ? `${Number(b.avg_rating).toFixed(1)}⭐` : '—';
    return `| ${pickBusinessDisplayName(b, '商家').replace(/\|/g, '\\|')} | ${rating} | ${b.phone || '—'} | ${b.address_full || '—'} |`;
  }).join('\n');
  const guideLines = (input.guides || []).slice(0, 2).map((g) => `- 《${g.title_zh}》：${(g.quote_zh || g.ai_summary_zh || '').slice(0, 70)}...`);
  return `当然可以，我先帮你整理一版${totalText}：\n\n| 商家名称 | 评分 | 电话 | 地址 |\n|---|---|---|---|\n${rows}\n\n💡 小建议：先电话确认排队和停车，周末高峰尽量提前订位。${guideLines.length > 0 ? `\n\n📚 相关指南：\n${guideLines.join('\n')}` : ''}`;
}

function normalizeTabularRestaurantOutput(answer: string): string {
  if (!answer.includes('\t')) return answer;
  const lines = answer.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/餐厅名称\t评分\t电话\t地址/.test(line)) {
      out.push('| 餐厅名称 | 评分 | 电话 | 地址 | 特色 |');
      out.push('|---|---|---|---|---|');
      i += 1;
      while (i < lines.length && lines[i].includes('\t')) {
        const cols = lines[i].split('\t').map((c) => c.trim());
        while (cols.length < 5) cols.push('—');
        out.push(`| ${cols[0] || '—'} | ${cols[1] || '—'} | ${cols[2] || '—'} | ${cols[3] || '—'} | ${cols[4] || '—'} |`);
        i += 1;
      }
      continue;
    }
    out.push(line);
    i += 1;
  }
  return out.join('\n');
}

function enforceOrdinalFollowupMention(query: string, answer: string): string {
  const ordinals = ['第一家', '第二家', '第三家'];
  for (const ordinal of ordinals) {
    if (query.includes(ordinal) && !answer.includes(ordinal)) {
      return `你问的是${ordinal}：\n\n${answer}`;
    }
  }
  return answer;
}

function countTabularBusinessRows(answer: string): number {
  const lines = answer.split('\n');
  let rows = 0;
  for (const line of lines) {
    if ((line.match(/\t/g) || []).length >= 3) rows += 1;
  }
  return rows;
}

function stripAllBusinessTables(answer: string): string {
  const lines = answer.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const isHeader = /名称\t|评分\t|电话\t|地址\t/.test(line) || (line.includes('\t') && /名称|评分|电话|地址|TOTAL_SCORE/i.test(line));
    if (isHeader) {
      i += 1;
      while (i < lines.length && lines[i].includes('\t')) i += 1;
      continue;
    }
    if (line.includes('\t')) {
      i += 1;
      continue;
    }
    out.push(line);
    i += 1;
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function buildRankedBusinessMainList(businesses: AnyRow[], total: number, max = 10): string {
  const safeCell = (v: string) => v.replace(/\|/g, '\\|').replace(/\n/g, ' ').trim();
  const rows = businesses.slice(0, max);
  const out: string[] = [];
  const totalText = `${total}家`;
  out.push(`📍 我帮你先整理了 ${rows.length} 家口碑不错的（共检索到${totalText}）：`);
  out.push('');
  out.push('| 商家名称 | 评分 | 电话 | 地址 |');
  out.push('|---|---|---|---|');
  for (const b of rows) {
    const name = safeCell(pickBusinessDisplayName(b, '商家'));
    const rating = b.avg_rating ? `${Number(b.avg_rating).toFixed(1)}⭐` : '—';
    out.push(`| ${name} | ${rating} | ${safeCell(b.phone || '—')} | ${safeCell(b.address_full || '—')} |`);
  }
  out.push('');
  out.push('如果你愿意，我可以继续按“口味偏好、预算、是否适合聚餐”再帮你细分推荐。');
  return out.join('\n');
}

function buildDeterministicLocationBusinessAnswer(input: {
  query: string;
  businesses: AnyRow[];
  matchedCount: number;
  guides: AnyRow[];
}): string {
  const rows = input.businesses.slice(0, Math.min(10, Math.max(5, input.businesses.length)));
  const list = buildRankedBusinessMainList(rows, input.matchedCount, rows.length);
  const tips: string[] = [];
  tips.push('💡 我的建议：优先先打电话确认排队、停车和当日营业时间。');
  if (/川菜|四川|sichuan/i.test(input.query)) {
    tips.push('🌶️ 川菜建议：可先从中辣开始，重麻重辣建议提前和店家沟通。');
  }
  if (/法拉盛|flushing/i.test(input.query)) {
    tips.push('🅿️ 法拉盛用餐：周末高峰建议提前到店或预订。');
  }
  const guideLines = input.guides
    .slice(0, 3)
    .map((g) => {
      const quote = (g.quote_zh || g.ai_summary_zh || '').slice(0, 70);
      return `- 《${g.title_zh}》：${quote}${quote.length >= 70 ? '...' : ''}`;
    });
  return [
    '当然可以，给你认真挑了一版：',
    '',
    list,
    '',
    ...tips.map((x) => `- ${x}`),
    guideLines.length > 0 ? '📚 相关指南（你可能会用到）：\n' + guideLines.join('\n') : '',
  ].filter(Boolean).join('\n');
}

function isObviousNonBusinessVenue(row: AnyRow): boolean {
  const text = `${row.display_name_zh || ''} ${row.display_name || ''} ${row.short_desc_zh || ''}`.toLowerCase();
  return /(temple|church|school|university|library|park|society|museum|consulate|embassy|hospital system|协会|公园|图书馆|学校|大学|寺|教会)/.test(text);
}

function dedupeBusinesses(rows: AnyRow[]): AnyRow[] {
  const seen = new Set<string>();
  const out: AnyRow[] = [];
  for (const r of rows) {
    if (!r?.id || seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}

function applyCuisineHardFilter(rows: AnyRow[], query: string, keywords: string[]): AnyRow[] {
  const merged = `${query} ${keywords.join(' ')}`;
  if (/(川菜|四川|sichuan)/i.test(merged)) {
    const positive = /(川菜|四川|sichuan|麻辣|火锅|冒菜|烤鱼|酸菜鱼)/i;
    const negative = /(小笼包|点心|粤菜|寿司|日料|韩餐|泰餐|pizza|burger|diner|cafe|dessert|shabu|ramen|udon|soba|japanese)/i;
    const filtered = rows.filter((b) => {
      const t = `${b.display_name_zh || ''} ${b.display_name || ''} ${b.short_desc_zh || ''} ${(b.ai_tags || []).join(' ')}`;
      return positive.test(t) && !negative.test(t);
    });
    if (filtered.length > 0) return filtered;
  }
  if (/(粤菜|广东菜|cantonese)/i.test(merged)) {
    const positive = /(粤菜|广东|cantonese|烧腊|点心)/i;
    const filtered = rows.filter((b) => positive.test(`${b.display_name_zh || ''} ${b.display_name || ''} ${b.short_desc_zh || ''} ${(b.ai_tags || []).join(' ')}`));
    if (filtered.length > 0) return filtered;
  }
  return rows;
}

function filterGuidesByIntent(rows: AnyRow[], query: string, keywords: string[]): AnyRow[] {
  if (rows.length === 0) return rows;
  const merged = `${query} ${keywords.join(' ')}`;
  if (/(川菜|四川|火锅|餐厅|餐馆|美食|吃|聚餐|sichuan|restaurant|hot ?pot)/i.test(merged)) {
    const positive = /(餐厅|餐馆|点餐|订位|排队|口味|聚餐|夜宵|川菜|火锅|菜单|堂食|外卖|sichuan|restaurant|hot ?pot|food|dining)/i;
    const negative = /(超市|采购|购物|租房|房东|押金|中医|针灸|推拿|报税|移民|律师|驾校|搬家|school|housing|tax|lawyer|insurance)/i;
    const filtered = rows.filter((g) => {
      const titleSummary = `${g.title_zh || ''} ${g.ai_summary_zh || ''}`;
      const body = `${g.body_zh || ''}`;
      const titleHit = /(餐厅|餐馆|聚餐|订位|点餐|口味|川菜|火锅|夜宵|restaurant|dining|hot ?pot)/i.test(titleSummary);
      const textHit = positive.test(titleSummary) || positive.test(body);
      return (titleHit || textHit) && !negative.test(titleSummary) && !negative.test(body);
    });
    return filtered;
  }
  return rows;
}

async function logSearchTelemetry(
  supabase: AnyRow,
  payload: {
    query: string;
    queryLanguage: 'zh' | 'en';
    regionId?: string | null;
    resultCount: number;
    resultTypes: string[];
    aiIntent: string;
    responseTimeMs: number;
  }
) {
  try {
    await supabase.from('search_logs').insert({
      query: payload.query,
      query_language: payload.queryLanguage,
      region_id: payload.regionId || null,
      result_count: payload.resultCount,
      result_types: payload.resultTypes,
      ai_intent: payload.aiIntent,
      response_time_ms: payload.responseTimeMs,
    });
  } catch (err) {
    // Best-effort telemetry only. Must not break user response.
    console.warn('[askXiaoLin] telemetry insert failed', err);
  }
}

export async function askXiaoLin(
  query: string,
  history: ChatMessage[] = [],
): Promise<{ error?: string; data?: AskResult }> {
  const startedAt = Date.now();
  if (!query?.trim() || query.length < 2) {
    return { error: '请输入你的问题' };
  }
  const strictEvidenceMode = envFlagOn(process.env.HELPER_STRICT_EVIDENCE_MODE);

  // ─── AI-powered follow-up detection ─────────────────────────────
  // Ask AI: is this a continuation of the conversation, or a brand new topic?
  // If follow-up → skip RAG search, just continue the chat (fast, cheap)
  // If new topic → do full keyword extraction + RAG search
  if (history.length >= 2) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

      // Quick classification: FOLLOWUP / SEARCH / NEW
      const lastAssistant = [...history].reverse().find(m => m.role === 'assistant')?.content.slice(0, 300) || '';
      const classifyResponse = await withTimeout(anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        system: `Classify the user message into exactly one category. Reply with one word only:

FOLLOWUP — casual reply that can be answered from conversation context alone (e.g. "需要", "好的", "谢谢", "哪家最便宜")
SEARCH — references something from the conversation BUT needs fresh data like address, phone, hours, reviews, prices (e.g. "帮我查一下地址", "第三家电话多少", "营业时间是什么")
NEW — completely new topic unrelated to the conversation (e.g. "帮我找牙医", "火锅推荐")

Reply with exactly one word: FOLLOWUP or SEARCH or NEW`,
        messages: [{
          role: 'user',
          content: `Previous assistant reply (excerpt): "${lastAssistant}"\n\nNew user message: "${query}"`,
        }],
      }), 10000);
      const classification = classifyResponse.content[0].type === 'text' ? classifyResponse.content[0].text.trim() : '';

      const forceSearchByPattern = /(地址|电话|联系方式|营业时间|几点|价格|多少钱|评价|reviews?|website|官网|怎么去|导航)/i.test(query);
      if (classification === 'FOLLOWUP' && !forceSearchByPattern) {
        // Continue conversation without RAG search
        const systemPrompt = `你是"小邻"，Baam纽约华人社区的AI助手。你用亲切的中文回答问题，像一个在纽约生活多年的华人邻居。
语气像朋友聊天，简洁明了。用简体中文回答。基于之前对话的上下文继续回答用户的问题。

回答要求：
- 优先给可执行信息（电话、地址、预约、步骤）
- 当用户表示“需要/继续/再给我”时，至少给3条具体下一步
- 若涉及列表，优先使用 markdown 表格`;

        const aiMessages: { role: 'user' | 'assistant'; content: string }[] = [];
        for (const msg of history.slice(-8)) {
          aiMessages.push({ role: msg.role, content: msg.content });
        }
        aiMessages.push({ role: 'user', content: query });

        const response = await withTimeout(anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          system: systemPrompt,
          messages: aiMessages,
        }), 15000);

        const answer = response.content[0].type === 'text' ? response.content[0].text : '';
        const telemetryClient = createAdminClient() as any;
        await logSearchTelemetry(telemetryClient, {
          query,
          queryLanguage: 'zh',
          regionId: null,
          resultCount: 0,
          resultTypes: [],
          aiIntent: `followup|quality=medium|strict=${strictEvidenceMode ? 1 : 0}`,
          responseTimeMs: Date.now() - startedAt,
        });
        return { data: { answer, sources: [], debugPrompt: {
          keywords: ['(follow-up)'],
          systemPrompt: '(conversation continuation — no RAG search)',
          userPrompt: query,
          model: 'claude-haiku-4-5-20251001',
          totalResults: 0,
          qualityLevel: 'medium',
          strictEvidenceMode,
        } } };
      }
      // else: classification === 'NEW' → fall through to full RAG search
    } catch {
      // Classification failed → fall through to full search
    }
  }

  // ─── Full RAG search (new topic) ──────────────────────────────
  const supabase = createAdminClient();
  const site = await getCurrentSite();
  const retrievalQuery = buildRetrievalQuery(query, history);
  const keywords = await extractKeywordsWithAI(retrievalQuery);
  const listAllIntent = isListAllBusinessQuery(retrievalQuery);

  // Common/generic Chinese words that match too broadly for business search
  const genericWords = new Set(['申请', '怎么', '如何', '哪里', '什么', '可以', '需要', '办理', '服务', '咨询', '推荐', '好的', '最好', '附近', '价格', '费用', '多少']);

  // Build OR conditions for each keyword across multiple columns
  // For content search (articles, guides, forum) — use all keywords with OR
  function buildOr(columns: string[]): string {
    const conditions: string[] = [];
    for (const kw of keywords) {
      const pattern = `%${kw}%`;
      for (const col of columns) {
        conditions.push(`${col}.ilike.${pattern}`);
      }
    }
    return conditions.join(',');
  }

  // Build OR conditions but skip generic words — for business search only
  function buildBusinessOr(columns: string[]): string {
    const specificKeywords = expandBusinessKeywords(keywords).filter((kw: string) => !genericWords.has(kw) && kw.length > 1);
    if (specificKeywords.length === 0) {
      // All keywords are generic — use the original keywords but require longer match
      return buildOr(columns);
    }
    const conditions: string[] = [];
    for (const kw of specificKeywords) {
      const pattern = `%${kw}%`;
      for (const col of columns) {
        conditions.push(`${col}.ilike.${pattern}`);
      }
    }
    return conditions.join(',');
  }

  // ─── RAG: Search all 6 content sources in parallel ──────────────

  // ─── Smart business search: 3 parallel strategies ─────────────
  async function searchBusinesses(): Promise<AnyRow[]> {
    const results: AnyRow[] = [];
    const seenIds = new Set<string>();
    const categoryBizIds = new Set<string>(); // Track businesses from directly matched categories
    const bizFields = 'id, slug, display_name, display_name_zh, short_desc_zh, ai_tags, avg_rating, review_count, phone, is_featured, address_full, website_url, total_score';

    const addResults = (data: AnyRow[] | null) => {
      for (const b of (data || [])) {
        if (!seenIds.has(b.id)) { seenIds.add(b.id); results.push(b); }
      }
    };

    // Strategy 1: Match keywords against category search_terms + name → find businesses by category
    // Fetch all business categories once, then do bidirectional substring matching in JS
    const { data: allBizCats } = await (supabase as any)
      .from('categories')
      .select('id, name_zh, slug, parent_id, search_terms')
      .eq('type', 'business')
      .eq('site_scope', 'zh');

    // Match categories, tracking HOW they matched:
    // - 'name': keyword matches category name (e.g. "火锅" → "火锅烧烤") — core match
    // - 'terms': keyword only found in search_terms (e.g. "饺子" → food-chinese) — peripheral match
    const matchedCats: { cat: AnyRow; matchType: 'name' | 'terms' }[] = [];
    for (const cat of (allBizCats || [])) {
      const nameZh = cat.name_zh || '';
      const terms: string[] = cat.search_terms || [];
      for (const kw of keywords) {
        if (kw.length < 2) continue;
        const nameMatch = nameZh && (nameZh.includes(kw) || kw.includes(nameZh));
        // For search_terms matching:
        // - t.includes(kw): search_term contains keyword (e.g. "韩国烤肉" contains "烤肉") ✓ always ok
        // - kw.includes(t): keyword contains search_term — require t ≥ 3 chars to avoid
        //   generic short words like "修剪","服务","维护" matching unrelated categories
        const termsMatch = terms.some((t: string) =>
          t.includes(kw) || (t.length >= 3 && kw.includes(t))
        );
        if (nameMatch || termsMatch) {
          matchedCats.push({ cat, matchType: nameMatch ? 'name' : 'terms' });
          break;
        }
      }
    }

    if (matchedCats.length > 0) {
      // Decide which categories to fully expand (list ALL businesses):
      // - Name match → always expand (it IS the right category)
      //   e.g. "火锅" → food-hotpot (火锅烧烤) → all 23 hotpot places ✓
      //   e.g. "中餐" → food-chinese (中餐) → all 27 Chinese restaurants ✓
      // - Terms-only match + small category (≤ 10 businesses) → expand
      //   e.g. "饺子" → food-noodles (面馆, 2 biz) → all 2 noodle shops ✓
      // - Terms-only match + large category (> 10 businesses) → skip
      //   e.g. "饺子" → food-chinese (中餐, 27 biz) → too broad, rely on text search ✗
      const MAX_TERMS_ONLY_SIZE = 50;

      // Get all category IDs including parent→children expansion
      const catIdsByMatch = new Map<string, 'name' | 'terms'>();
      for (const { cat, matchType } of matchedCats) {
        catIdsByMatch.set(cat.id, matchType);
      }
      // Expand parent categories to include children (inherit parent's match type)
      const parentMatches = matchedCats.filter(m => !m.cat.parent_id);
      if (parentMatches.length > 0) {
        const { data: children } = await (supabase as any).from('categories').select('id, parent_id').in('parent_id', parentMatches.map(m => m.cat.id));
        for (const child of (children || []) as AnyRow[]) {
          const parentType = catIdsByMatch.get(child.parent_id);
          if (parentType) catIdsByMatch.set(child.id, parentType);
        }
      }

      // Count businesses per category
      const { data: allBizCatLinks } = await (supabase as any)
        .from('business_categories')
        .select('business_id, category_id')
        .in('category_id', [...catIdsByMatch.keys()])
        .limit(10000);

      const bizPerCat = new Map<string, string[]>();
      for (const link of (allBizCatLinks || []) as AnyRow[]) {
        if (!bizPerCat.has(link.category_id)) bizPerCat.set(link.category_id, []);
        bizPerCat.get(link.category_id)!.push(link.business_id);
      }

      // Include businesses from qualifying categories
      const includedBizIds = new Set<string>();
      for (const [catId, matchType] of catIdsByMatch) {
        const bizList = bizPerCat.get(catId) || [];
        if (matchType === 'name' || bizList.length <= MAX_TERMS_ONLY_SIZE) {
          bizList.forEach(id => includedBizIds.add(id));
        }
        // else: terms-only + large category → skip (text search handles it)
      }

      categoryBizIds.forEach(id => includedBizIds.add(id)); // keep any previously added
      includedBizIds.forEach(id => categoryBizIds.add(id));

      if (includedBizIds.size > 0) {
        const { data } = await (supabase as any)
          .from('businesses').select(bizFields)
          .eq('is_active', true).eq('site_id', site.id).in('id', [...includedBizIds].slice(0, 100))
          .order('total_score', { ascending: false, nullsFirst: false }).limit(30);
        addResults(data);
      }
    }

    // Strategy 2: Search ai_tags array
    for (const kw of keywords) {
      if (kw.length < 2 || results.length >= 30) continue;
      const { data } = await (supabase as any)
        .from('businesses').select(bizFields)
        .eq('is_active', true)
        .eq('site_id', site.id)
        .contains('ai_tags', [kw])
        .order('total_score', { ascending: false, nullsFirst: false }).limit(10);
      addResults(data);
    }

    // Strategy 3: Text search on name/description (always runs as supplement)
    // Catches businesses mentioning specific items like "刀削面" in their description
    {
      const { data } = await (supabase as any)
        .from('businesses').select(bizFields)
        .eq('is_active', true)
        .eq('site_id', site.id)
        .or(buildBusinessOr(['display_name', 'display_name_zh', 'short_desc_zh', 'ai_summary_zh']))
        .order('total_score', { ascending: false, nullsFirst: false }).limit(10);
      addResults(data);
    }

    const ranked = rankBusinesses(results, keywords, categoryBizIds);
    return ranked.slice(0, 30);
  }

  const [bizData, newsResult, guideResult, forumResult, voiceResult, eventResult] = await Promise.all([
    searchBusinesses(),

    // News
    (supabase as any)
      .from('articles')
      .select('slug, title_zh, ai_summary_zh, content_vertical, published_at')
      .eq('site_id', site.id)
      .eq('editorial_status', 'published')
      .in('content_vertical', ['news_alert', 'news_brief', 'news_explainer', 'news_roundup', 'news_community'])
      .or(buildOr(['title_zh', 'ai_summary_zh']))
      .order('published_at', { ascending: false })
      .limit(3),

    // Guides
    (supabase as any)
      .from('articles')
      .select('slug, title_zh, ai_summary_zh, body_zh, content_vertical')
      .eq('site_id', site.id)
      .eq('editorial_status', 'published')
      .in('content_vertical', ['guide_howto', 'guide_checklist', 'guide_bestof', 'guide_comparison', 'guide_neighborhood', 'guide_seasonal', 'guide_resource', 'guide_scenario'])
      .or(buildOr(['title_zh', 'ai_summary_zh', 'body_zh']))
      .limit(5),

    // Forum threads
    (supabase as any)
      .from('forum_threads')
      .select('slug, title, ai_summary_zh, reply_count, board_id, categories:board_id(slug)')
      .eq('site_id', site.id)
      .eq('status', 'published')
      .or(buildOr(['title', 'body', 'ai_summary_zh']))
      .order('reply_count', { ascending: false })
      .limit(3),

    // Voice posts / Discover posts
    (supabase as any)
      .from('voice_posts')
      .select('id, slug, title, excerpt, content, cover_images, cover_image_url, topic_tags, location_text, like_count, author_id, profiles:author_id(display_name)')
      .eq('site_id', site.id)
      .eq('status', 'published')
      .or(buildOr(['title', 'content']))
      .order('like_count', { ascending: false })
      .limit(5),

    // Events
    (supabase as any)
      .from('events')
      .select('slug, title_zh, title_en, summary_zh, venue_name, start_at, is_free')
      .eq('site_id', site.id)
      .eq('status', 'published')
      .or(buildOr(['title_zh', 'title_en', 'summary_zh', 'venue_name']))
      .order('start_at', { ascending: true })
      .limit(3),
  ]);

  const rawBusinesses = sanitizeBusinesses(bizData as AnyRow[]);
  const rawNews = sanitizeNews((newsResult.data || []) as AnyRow[]);
  const rawGuides = sanitizeGuides((guideResult.data || []) as AnyRow[]);
  const rawThreads = sanitizeThreads((forumResult.data || []) as AnyRow[]);
  const rawVoices = sanitizeVoices((voiceResult.data || []) as AnyRow[]);
  const rawEvents = sanitizeEvents((eventResult.data || []) as AnyRow[]);

  const normalizedKeywords = normalizeKeywords(keywords);
  const serviceIntentProfile = detectServiceIntentProfile(query, normalizedKeywords);
  const dentalIntent = serviceIntentProfile?.key === 'dental';
  const restaurantIntent = isRestaurantIntent(query, normalizedKeywords);
  const hasLocationQuery = hasExplicitLocationQuery(query);
  const requestedLocationFilter = extractRequestedLocationFilter(query);
  const businessIntent = restaurantIntent || Boolean(serviceIntentProfile) || /(推荐|商家|店|机构|哪家|有什么)/.test(query);
  let businesses = filterByRelevance(
    rawBusinesses,
    normalizedKeywords,
    (b) => `${b.display_name_zh || ''} ${b.display_name || ''} ${b.short_desc_zh || ''} ${(b.ai_tags || []).join(' ')}`,
    dentalIntent ? 0.35 : (listAllIntent ? 0.12 : RELEVANCE_MIN.businesses),
    listAllIntent ? { keepTopOneFallback: true, minFallbackScore: 0.08 } : undefined
  );

  if (serviceIntentProfile) {
    businesses = businesses.filter((b) => {
      const text = `${b.display_name_zh || ''} ${b.display_name || ''} ${b.short_desc_zh || ''} ${(b.ai_tags || []).join(' ')}`;
      return serviceIntentProfile.entityRegex.test(text);
    });
  }

  if (serviceIntentProfile && businesses.length < 3) {
    const { data: serviceFallback } = await (supabase as any)
      .from('businesses')
      .select('id, slug, display_name, display_name_zh, short_desc_zh, ai_tags, avg_rating, review_count, phone, is_featured, address_full, website_url, total_score')
      .eq('is_active', true)
      .eq('site_id', site.id)
      .or(serviceIntentProfile.fallbackOr)
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(15);
    const fallbackRows = sanitizeBusinesses((serviceFallback || []) as AnyRow[]).filter((b) => {
      const text = `${b.display_name_zh || ''} ${b.display_name || ''} ${b.short_desc_zh || ''} ${(b.ai_tags || []).join(' ')}`;
      return serviceIntentProfile.entityRegex.test(text);
    });
    const seen = new Set(businesses.map((b) => b.id));
    for (const b of fallbackRows) {
      if (!seen.has(b.id)) {
        businesses.push(b);
        seen.add(b.id);
      }
      if (businesses.length >= 10) break;
    }
  }
  if (restaurantIntent && businesses.length < 3) {
    const restaurantOr = [
      'display_name_zh.ilike.%餐厅%',
      'display_name_zh.ilike.%餐馆%',
      'display_name_zh.ilike.%饭店%',
      'display_name_zh.ilike.%中餐%',
      'display_name_zh.ilike.%川菜%',
      'display_name_zh.ilike.%粤菜%',
      'display_name_zh.ilike.%火锅%',
      'display_name.ilike.%restaurant%',
      'display_name.ilike.%hot pot%',
      'short_desc_zh.ilike.%中餐%',
      'short_desc_zh.ilike.%川菜%',
      'short_desc_zh.ilike.%粤菜%',
      'short_desc_zh.ilike.%火锅%',
    ].join(',');
    const { data: restaurantFallback } = await (supabase as any)
      .from('businesses')
      .select('id, slug, display_name, display_name_zh, short_desc_zh, ai_tags, avg_rating, review_count, phone, is_featured, address_full, website_url, total_score')
      .eq('is_active', true)
      .eq('site_id', site.id)
      .or(restaurantOr)
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(30);
    let fallbackRows = sanitizeBusinesses((restaurantFallback || []) as AnyRow[]);
    if (/法拉盛/i.test(query)) {
      fallbackRows = fallbackRows.sort((a, b) => {
        const aIn = /flushing|法拉盛/i.test(a.address_full || '') ? 1 : 0;
        const bIn = /flushing|法拉盛/i.test(b.address_full || '') ? 1 : 0;
        return bIn - aIn;
      });
    }
    const seen = new Set(businesses.map((b) => b.id));
    for (const b of fallbackRows) {
      if (!seen.has(b.id)) {
        businesses.push(b);
        seen.add(b.id);
      }
      if (businesses.length >= 12) break;
    }
  }
  if (restaurantIntent) {
    const restaurantTerms = /(餐厅|餐馆|饭店|中餐|川菜|粤菜|火锅|烤肉|小吃|面馆|restaurant|hot ?pot|bbq|sichuan|chinese)/i;
    const filtered = businesses.filter((b) => {
      const text = `${b.display_name_zh || ''} ${b.display_name || ''} ${b.short_desc_zh || ''} ${(b.ai_tags || []).join(' ')}`;
      return restaurantTerms.test(text);
    });
    if (filtered.length >= 3) businesses = filtered;
    if (/法拉盛|flushing/i.test(query)) {
      const locationOnly = businesses.filter((b) => (requestedLocationFilter?.regex || /法拉盛|flushing/i).test(`${b.address_full || ''} ${b.display_name_zh || ''} ${b.display_name || ''}`));
      if (locationOnly.length >= 1) businesses = locationOnly;
    }
    const cuisineMap: Array<{ token: RegExp; matcher: RegExp }> = [
      { token: /川菜|四川|sichuan/i, matcher: /川菜|四川|sichuan|麻辣|水煮|酸菜鱼/i },
      { token: /粤菜|广东菜|cantonese/i, matcher: /粤菜|广东|cantonese|点心|烧腊/i },
      { token: /火锅|hot ?pot/i, matcher: /火锅|hot ?pot|涮|锅底/i },
    ];
    const mergedQ = `${query} ${normalizedKeywords.join(' ')}`;
    for (const c of cuisineMap) {
      if (c.token.test(mergedQ)) {
        const cuisineOnly = businesses.filter((b) => c.matcher.test(`${b.display_name_zh || ''} ${b.display_name || ''} ${b.short_desc_zh || ''} ${(b.ai_tags || []).join(' ')}`));
        if (cuisineOnly.length >= 5) businesses = cuisineOnly;
        break;
      }
    }
    businesses = applyCuisineHardFilter(businesses, query, normalizedKeywords);
    businesses = businesses.filter((b) => !isObviousNonBusinessVenue(b));
  }

  let matchedBusinessCount = businesses.length;
  try {
    const baseCountQuery = (supabase as any)
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('site_id', site.id);
    const { count } = serviceIntentProfile
      ? await baseCountQuery.or(serviceIntentProfile.countOr || serviceIntentProfile.fallbackOr)
      : await baseCountQuery.or(buildBusinessOr(['display_name', 'display_name_zh', 'short_desc_zh', 'ai_summary_zh']));
    if (typeof count === 'number' && Number.isFinite(count)) matchedBusinessCount = count;
  } catch {
    // Best effort only; fallback to retrieved size.
  }
  const hugeBusinessSet = matchedBusinessCount > 100;
  const locationBusinessLargeSet = businessIntent && hasLocationQuery && matchedBusinessCount > 10;
  let listingBusinesses = [...businesses];
  const desiredListCount = locationBusinessLargeSet ? 10 : MAX_LISTED_BUSINESSES_WHEN_HUGE;
  if (locationBusinessLargeSet) {
    const byScore = [...businesses].sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    listingBusinesses = byScore;
    if (listingBusinesses.length < desiredListCount) {
      let pool = [...rawBusinesses];
      if (serviceIntentProfile) {
        pool = pool.filter((b) => serviceIntentProfile.entityRegex.test(`${b.display_name_zh || ''} ${b.display_name || ''} ${b.short_desc_zh || ''} ${(b.ai_tags || []).join(' ')}`));
      } else if (restaurantIntent) {
        pool = pool.filter((b) => /(餐厅|餐馆|饭店|中餐|川菜|粤菜|火锅|烤肉|sichuan|restaurant|hot ?pot)/i.test(`${b.display_name_zh || ''} ${b.display_name || ''} ${b.short_desc_zh || ''} ${(b.ai_tags || []).join(' ')}`));
        pool = applyCuisineHardFilter(pool, query, normalizedKeywords);
      }
      if (requestedLocationFilter) {
        pool = pool.filter((b) => requestedLocationFilter.regex.test(`${b.address_full || ''} ${b.display_name_zh || ''} ${b.display_name || ''}`));
      }
      pool = pool.filter((b) => !isObviousNonBusinessVenue(b));
      if (pool.length < desiredListCount && requestedLocationFilter) {
        const { data: locationFallback } = await (supabase as any)
          .from('businesses')
          .select('id, slug, display_name, display_name_zh, short_desc_zh, ai_tags, avg_rating, review_count, phone, is_featured, address_full, website_url, total_score')
          .eq('is_active', true)
          .eq('site_id', site.id)
          .ilike('address_full', requestedLocationFilter.sqlIlike)
          .order('total_score', { ascending: false, nullsFirst: false })
          .limit(120);
        let locationRows = sanitizeBusinesses((locationFallback || []) as AnyRow[]);
        if (serviceIntentProfile) {
          locationRows = locationRows.filter((b) => serviceIntentProfile.entityRegex.test(`${b.display_name_zh || ''} ${b.display_name || ''} ${b.short_desc_zh || ''} ${(b.ai_tags || []).join(' ')}`));
        } else if (restaurantIntent) {
          locationRows = locationRows.filter((b) => /(餐厅|餐馆|饭店|中餐|川菜|粤菜|火锅|烤肉|sichuan|restaurant|hot ?pot)/i.test(`${b.display_name_zh || ''} ${b.display_name || ''} ${b.short_desc_zh || ''} ${(b.ai_tags || []).join(' ')}`));
          locationRows = applyCuisineHardFilter(locationRows, query, normalizedKeywords);
        }
        locationRows = locationRows.filter((b) => !isObviousNonBusinessVenue(b));
        pool = dedupeBusinesses([...pool, ...locationRows]);
      }
      listingBusinesses = dedupeBusinesses([...listingBusinesses, ...pool]).sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    }
    if (listingBusinesses.length > desiredListCount) listingBusinesses = listingBusinesses.slice(0, desiredListCount);
    businesses = listingBusinesses;
  }
  let guides = filterByRelevance(
    rawGuides,
    normalizedKeywords,
    (g) => `${g.title_zh || ''} ${g.ai_summary_zh || ''}`,
    RELEVANCE_MIN.guides
  );
  guides = filterGuidesByIntent(guides, query, normalizedKeywords);
  if (restaurantIntent && guides.length === 0) {
    const guideFallbackOr = [
      'title_zh.ilike.%餐厅%',
      'title_zh.ilike.%聚餐%',
      'title_zh.ilike.%订位%',
      'title_zh.ilike.%点餐%',
      'title_zh.ilike.%火锅%',
      'ai_summary_zh.ilike.%餐厅%',
      'ai_summary_zh.ilike.%聚餐%',
      'ai_summary_zh.ilike.%订位%',
      'ai_summary_zh.ilike.%点餐%',
      'body_zh.ilike.%餐厅%',
      'body_zh.ilike.%聚餐%',
      'body_zh.ilike.%订位%',
      'body_zh.ilike.%点餐%',
    ].join(',');
    const { data: guideFallback } = await (supabase as any)
      .from('articles')
      .select('slug, title_zh, ai_summary_zh, body_zh, content_vertical')
      .eq('site_id', site.id)
      .eq('editorial_status', 'published')
      .in('content_vertical', ['guide_howto', 'guide_checklist', 'guide_bestof', 'guide_comparison', 'guide_neighborhood', 'guide_seasonal', 'guide_resource', 'guide_scenario'])
      .or(guideFallbackOr)
      .limit(6);
    const fallbackGuides = filterGuidesByIntent(sanitizeGuides((guideFallback || []) as AnyRow[]), query, normalizedKeywords);
    if (fallbackGuides.length > 0) guides = fallbackGuides;
  }
  if (serviceIntentProfile) {
    const rgx = serviceGuideRegex(serviceIntentProfile);
    guides = guides.filter((g) => rgx.test(`${g.title_zh || ''} ${g.ai_summary_zh || ''} ${g.body_zh || ''}`));
  }
  const news = filterByRelevance(
    rawNews,
    normalizedKeywords,
    (n) => `${n.title_zh || ''} ${n.ai_summary_zh || ''}`,
    RELEVANCE_MIN.news
  );
  const threads = filterByRelevance(
    rawThreads,
    normalizedKeywords,
    (t) => `${t.title || ''} ${t.ai_summary_zh || ''}`,
    RELEVANCE_MIN.threads
  );
  const voices = filterByRelevance(
    rawVoices,
    normalizedKeywords,
    (v) => `${v.title || ''} ${v.excerpt || ''} ${v.content || ''} ${(v.topic_tags || []).join(' ')}`,
    RELEVANCE_MIN.voices
  );
  const events = filterByRelevance(
    rawEvents,
    normalizedKeywords,
    (e) => `${e.title_zh || ''} ${e.title_en || ''} ${e.summary_zh || ''} ${e.venue_name || ''}`,
    RELEVANCE_MIN.events
  );

  const scoreBaseline = [...businesses].sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
  let rankingConsistency = calculateRankingConsistency(businesses, scoreBaseline, 10);
  let rankingFallbackApplied = false;
  if (rankingConsistency < 0.65 && businesses.length >= 5) {
    // Guardrail: if ranking deviates too much from fairness baseline, fallback to total_score
    businesses = scoreBaseline;
    rankingConsistency = 1;
    rankingFallbackApplied = true;
  }
  if (hugeBusinessSet) {
    // For huge result sets, always preserve fairness by strict total_score ordering.
    businesses = [...businesses].sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
  }
  if (locationBusinessLargeSet) {
    // Hard rule: business + location with many results should always rank by total_score.
    businesses = [...businesses].sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
  }

  // ─── Fetch Google reviews for top businesses ────────────────────

  let reviewsByBiz: Record<string, AnyRow[]> = {};
  if (businesses.length > 0) {
    const topBizIds = businesses.slice(0, 10).map(b => b.id);
    const { data: reviewData } = await (supabase as any)
      .from('reviews')
      .select('business_id, rating, body, google_author_name, language')
      .in('business_id', topBizIds)
      .eq('status', 'approved')
      .order('rating', { ascending: false })
      .limit(30);

    for (const r of (reviewData || []) as AnyRow[]) {
      if (!reviewsByBiz[r.business_id]) reviewsByBiz[r.business_id] = [];
      if (reviewsByBiz[r.business_id].length < 3) reviewsByBiz[r.business_id].push(r);
    }
  }

  // ─── Build context for AI ───────────────────────────────────────

  const contextParts: string[] = [];
  const shouldListAllBusinesses = listAllIntent;
  const businessesForContext = locationBusinessLargeSet
    ? listingBusinesses.slice(0, Math.min(desiredListCount, Math.max(5, listingBusinesses.length)))
    : hugeBusinessSet
    ? businesses.slice(0, MAX_LISTED_BUSINESSES_WHEN_HUGE)
    : (shouldListAllBusinesses ? businesses : businesses.slice(0, CONTEXT_LIMITS.businesses));
  const guidesForContext = guides.slice(0, CONTEXT_LIMITS.guides);
  const newsForContext = news.slice(0, CONTEXT_LIMITS.news);
  const threadsForContext = threads.slice(0, CONTEXT_LIMITS.threads);
  const voicesForContext = voices.slice(0, CONTEXT_LIMITS.voices);
  const eventsForContext = events.slice(0, CONTEXT_LIMITS.events);

  if (businessesForContext.length > 0) {
    const tags = (b: AnyRow) => (b.ai_tags || []).filter((t: string) => t !== 'GBP已认领').slice(0, 4).join('、');
    contextParts.push(`【商家信息】共找到${matchedBusinessCount}家相关商家（已注入${businessesForContext.length}家到回答上下文）${(hugeBusinessSet || locationBusinessLargeSet) ? '，按 total_score 展示前10家' : ''}：\n` + businessesForContext.map((b, i) => {
      const displayName = pickBusinessDisplayName(b, '商家');
      let line = `${i + 1}. ${displayName}｜综合分${Number(b.total_score || 0).toFixed(1)}${b.avg_rating ? `｜评分${b.avg_rating}分(${b.review_count || 0}条评价)` : ''} ${b.phone ? `｜电话${b.phone}` : ''} ${b.address_full ? `｜地址：${b.address_full}` : ''} ${tags(b) ? `｜特色：${tags(b)}` : ''} ${b.short_desc_zh ? `｜简介：${b.short_desc_zh.slice(0, 60)}` : ''}`;
      // Add review snippets if available
      const reviews = reviewsByBiz[b.id];
      if (reviews && reviews.length > 0) {
        const snippets = reviews.map(r => `"${(r.body || '').slice(0, 50)}"(${r.google_author_name || '用户'},${r.rating}星)`).join(' ');
        line += ` 用户评价：${snippets}`;
      }
      return line;
    }).join('\n'));
  }

  if (guidesForContext.length > 0) {
    contextParts.push('【生活指南】\n' + guidesForContext.map(g =>
      `- 《${g.title_zh}》要点：${g.quote_zh || g.ai_summary_zh || ''}`
    ).join('\n'));
  }

  if (newsForContext.length > 0) {
    contextParts.push('【本地新闻】\n' + newsForContext.map(n =>
      `- ${n.title_zh}：${n.ai_summary_zh || ''}`
    ).join('\n'));
  }

  if (threadsForContext.length > 0) {
    contextParts.push('【论坛讨论】\n' + threadsForContext.map(t =>
      `- ${t.title}（${t.reply_count || 0}回复）：${t.ai_summary_zh || ''}`
    ).join('\n'));
  }

  if (eventsForContext.length > 0) {
    contextParts.push('【本地活动】\n' + eventsForContext.map(e => {
      const date = e.start_at ? new Date(e.start_at).toLocaleDateString('zh-CN') : '';
      return `- ${e.title_zh || e.title_en}：${date} ${e.venue_name || ''} ${e.is_free ? '免费' : ''}`;
    }).join('\n'));
  }

  if (voicesForContext.length > 0) {
    contextParts.push('【社区笔记/达人分享】\n' + voicesForContext.map((v, i) => {
      const author = v.profiles?.display_name || '匿名';
      const tags = (v.topic_tags || []).join('、');
      const loc = v.location_text || '';
      const likes = v.like_count || 0;
      const body = (v.content || v.excerpt || '').slice(0, 150);
      return `${i + 1}. ${v.title || '(无标题)'}（${author}${loc ? ' · ' + loc : ''}${likes ? ` · ${likes}赞` : ''}）${tags ? `\n   标签：${tags}` : ''}\n   ${body}`;
    }).join('\n'));
  }

  const totalResults = businesses.length + news.length + guides.length + threads.length + voices.length + events.length;
  const serviceIntent = Boolean(serviceIntentProfile);
  const hasLocalEvidence = totalResults > 0 && (!serviceIntent || businesses.length > 0);
  const constraints = extractServiceConstraints(query);
  const urgentLegalIntent = (serviceIntentProfile?.key === 'lawyer') && /(紧急|递解令|驱逐|deport)/i.test(query);
  const businessEvidenceText = businessesForContext
    .map((b) => `${b.display_name_zh || ''} ${b.display_name || ''} ${b.short_desc_zh || ''} ${(b.ai_tags || []).join(' ')}`)
    .join(' ');
  const locationGap = detectLocationConstraintGap(query, businessEvidenceText);
  const unmetConstraints = constraints.filter((c) => !businessEvidenceText.includes(c));
  const shouldForceBoundaryNotice = (serviceIntent && unmetConstraints.length > 0) || locationGap;
  const qualityLevel = evaluateQualityLevel({
    hasLocalEvidence,
    totalResults,
    rankingConsistency,
    businesses: businessesForContext.length,
    guides: guidesForContext.length,
    news: newsForContext.length,
    threads: threadsForContext.length,
    voices: voicesForContext.length,
    events: eventsForContext.length,
  });

  // ─── Generate AI response ───────────────────────────────────────

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    const systemPrompt = `你是"小邻"，Baam纽约华人社区的AI助手。你用亲切的中文回答问题，像一个在纽约生活多年的华人邻居。

【你的角色】
- 熟悉纽约（特别是法拉盛）的华人社区
- 了解本地商家、医疗、法律、教育、美食等资源
- 回答要具体、实用、有温度
- 如果找到相关信息，引用来源
- 如果没有找到相关信息，坦诚说明并给出一般性建议

【回答格式】
- 用简体中文回答
- 多用emoji图标（📍地址、📞电话、⭐评分、🌐网站、🏷️特色等）
- 商家推荐用**markdown表格**展示（列：餐厅名称、评分、电话、地址、特色），确保表格完整
- 实用建议用**带emoji的项目符号**列出（💡、🅿️、🕐、📌、🎉等）
- 用带emoji的小标题分段（如"🍜 推荐餐厅"、"💡 实用建议"、"📰 相关资讯"）
- 语气像朋友聊天，不要太正式
- 当搜索结果中有相关商家时，尽量在回答中推荐和列出它们
- 当用户问"有多少"或"列出来"时，必须列出搜索结果中的所有商家，不要省略
- 如果搜索到的商家与问题高度相关（如问驾照推荐驾校、问律师推荐律师），主动推荐前3-5家评分最高的商家
- 回答要完整：既回答用户的问题，也推荐相关的本地资源和商家

【结构化输出要求】
- 先给一句结论，再给列表/表格，再给下一步建议
- 若有商家结果，至少展示3条（不足3条就展示全部）
- 若没有相关商家，明确写“当前平台未检索到直接匹配商家”，不要混入无关行业

【证据与准确性约束】
- 优先使用提供的检索证据，不要编造具体事实
- 未在证据中出现的电话、地址、营业时间、价格，不可虚构
- 如果证据不足，明确写出“未检索到足够本地数据”，并给出下一步建议`;

    const userPrompt = hasLocalEvidence
      ? `用户问：${query}\n\n以下是从我们社区平台搜索到的相关信息（质量等级：${qualityLevel}）：\n\n${contextParts.join('\n\n')}\n\n请严格基于以上证据回答；若证据不足，请明确说明边界，不要编造具体商家事实。${strictEvidenceMode ? '\n当前为强证据模式：未在证据中出现的具体事实一律不写。' : ''}${shouldListAllBusinesses ? '\n这是“全部列出”请求：请先写“共找到X家”，然后完整列出，不要省略。' : ''}${hugeBusinessSet ? '\n这是大结果集（>100）：只展示前10家，必须按 total_score 从高到低排序，并明确“其余可继续展开”。' : ''}${locationBusinessLargeSet ? '\n这是“地点+商家”查询且命中超过10家：必须在同一个主列表中按 total_score 从高到低列出5-10家（优先10家），不要只给2-3家。先写“共找到X家，先列前10家”。' : ''}${guidesForContext.length > 0 ? '\n若问题与指南主题相关，请至少引用1-2条《指南标题》中的具体要点，再给商家建议。' : ''}${urgentLegalIntent ? '\n这是紧急法律场景：必须给出至少3条立即可执行动作（先打哪个电话、准备哪些材料、今天内要完成什么）。' : ''}${shouldForceBoundaryNotice ? `\n用户含有附加约束（${unmetConstraints.join('、')}），但证据未充分覆盖：必须明确声明“未检索到足够本地数据来确认这些约束”。` : ''}`
      : `用户问：${query}\n\n当前平台没有检索到直接匹配的本地证据。\n请先明确声明“未检索到足够本地数据”，然后仅提供通用、非编造的建议，并引导用户补充更具体条件（地区、品类、预算、时间）。`;

    const effectiveSystemPrompt = qualityLevel === 'low'
      ? `${systemPrompt}\n\n【低证据模式】\n- 回答时先给“证据不足声明”\n- 不给具体商家结论，只给检索建议和补充提问\n- 结尾必须提供3个可执行下一步（例如补充地区、预算、时间）${strictEvidenceMode ? '\n- 强证据模式开启：禁止输出任何无证据支撑的细节。' : ''}`
      : strictEvidenceMode
        ? `${systemPrompt}\n\n【强证据模式】\n- 仅可引用已提供证据中的事实\n- 若证据不充分，明确写“未检索到足够本地数据”并提出补充问题`
        : systemPrompt;

    // Build message history for conversation continuity
    // Include last few turns so the AI can understand follow-ups like "需要" or "再推荐几个"
    const aiMessages: { role: 'user' | 'assistant'; content: string }[] = [];
    const recentHistory = history.slice(-6); // last 3 turns (6 messages)
    for (const msg of recentHistory) {
      aiMessages.push({ role: msg.role, content: msg.content });
    }
    aiMessages.push({ role: 'user', content: userPrompt });

    const response = await withTimeout(anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: effectiveSystemPrompt,
      messages: aiMessages,
    }), 18000);

    const rawAnswer = response.content[0].type === 'text' ? response.content[0].text : '';
    const normalizedAnswer = normalizeTabularRestaurantOutput(rawAnswer);
    const ordinalAlignedAnswer = enforceOrdinalFollowupMention(query, normalizedAnswer);
    let hugeSetEnforcedAnswer = ordinalAlignedAnswer;
    if (locationBusinessLargeSet) {
      hugeSetEnforcedAnswer = buildDeterministicLocationBusinessAnswer({
        query,
        businesses: listingBusinesses,
        matchedCount: matchedBusinessCount,
        guides: guidesForContext,
      });
    } else if (countTabularBusinessRows(hugeSetEnforcedAnswer) >= 2) {
      hugeSetEnforcedAnswer = stripAllBusinessTables(hugeSetEnforcedAnswer);
    }
    const needsBoundaryPrefix = (qualityLevel === 'low' || shouldForceBoundaryNotice)
      && !/(未检索到|没有检索到|暂无足够本地数据|证据不足)/.test(hugeSetEnforcedAnswer);
    const answer = needsBoundaryPrefix
      ? `⚠️ 我在当前本地数据库里未检索到足够本地数据来直接匹配你的需求。\n\n${hugeSetEnforcedAnswer}`
      : hugeSetEnforcedAnswer;

    // Build sources list
    const sources: AskResult['sources'] = [];

    const businessesForSources = (locationBusinessLargeSet ? listingBusinesses : businesses).slice(0, (hugeBusinessSet || locationBusinessLargeSet) ? MAX_LISTED_BUSINESSES_WHEN_HUGE : SOURCE_LIMITS.businesses);
    const guidesForSources = guides.slice(0, SOURCE_LIMITS.guides);
    const newsForSources = news.slice(0, SOURCE_LIMITS.news);
    const threadsForSources = threads.slice(0, SOURCE_LIMITS.threads);
    const eventsForSources = events.slice(0, SOURCE_LIMITS.events);
    const voicesForSources = voices.slice(0, SOURCE_LIMITS.voices);

    businessesForSources.forEach(b => sources.push({
      type: '商家',
      title: pickBusinessDisplayName(b, '商家'),
      url: `/businesses/${b.slug}`,
      snippet: b.short_desc_zh,
    }));

    guidesForSources.forEach(g => sources.push({
      type: '指南',
      title: g.title_zh,
      url: `/guides/${g.slug}`,
      snippet: g.ai_summary_zh?.slice(0, 80),
    }));

    newsForSources.forEach(n => sources.push({
      type: '新闻',
      title: n.title_zh,
      url: `/news/${n.slug}`,
    }));

    threadsForSources.forEach(t => sources.push({
      type: '论坛',
      title: t.title,
      url: `/forum/${t.categories?.slug || 'general'}/${t.slug}`,
    }));

    eventsForSources.forEach(e => sources.push({
      type: '活动',
      title: e.title_zh || e.title_en,
      url: `/events/${e.slug}`,
    }));

    voicesForSources.forEach(v => sources.push({
      type: '笔记',
      title: v.title || (v.content || '').slice(0, 30),
      url: `/discover/${v.slug}`,
      snippet: (v.content || v.excerpt || '').slice(0, 80),
    }));

    // Reorder sources: show diverse types first (max 3 per type, interleaved)
    const typeGroups: Record<string, typeof sources> = {};
    for (const s of sources) {
      (typeGroups[s.type] ||= []).push(s);
    }
    const diverseSources: typeof sources = [];
    let hasMore = true;
    for (let i = 0; hasMore; i++) {
      hasMore = false;
      for (const type of Object.keys(typeGroups)) {
        if (i < typeGroups[type].length) {
          diverseSources.push(typeGroups[type][i]);
          hasMore = true;
        }
      }
    }

    let finalSources = dedupeAndCapSources(diverseSources, 20);
    finalSources = rankSourcesByQueryRelevance(finalSources, query, normalizedKeywords);
    if (businessesForSources.length > 0 && !finalSources.some((s) => s.type === '商家')) {
      finalSources = [{
        type: '商家',
        title: pickBusinessDisplayName(businessesForSources[0], '商家'),
        url: `/businesses/${businessesForSources[0].slug}`,
        snippet: businessesForSources[0].short_desc_zh || undefined,
      }, ...finalSources].slice(0, 20);
    }

    const resultTypes: string[] = [];
    if (businesses.length > 0) resultTypes.push('businesses');
    if (guides.length > 0) resultTypes.push('guides');
    if (news.length > 0) resultTypes.push('news');
    if (threads.length > 0) resultTypes.push('forum_threads');
    if (voices.length > 0) resultTypes.push('voice_posts');
    if (events.length > 0) resultTypes.push('events');
    await logSearchTelemetry(supabase as any, {
      query,
      queryLanguage: 'zh',
      regionId: site.regionIds?.[0] || null,
      resultCount: totalResults,
      resultTypes,
      aiIntent: `rag|quality=${qualityLevel}|strict=${strictEvidenceMode ? 1 : 0}|rank=${rankingConsistency}`,
      responseTimeMs: Date.now() - startedAt,
    });

    return { data: { answer, sources: finalSources, debugPrompt: {
      keywords,
      systemPrompt: effectiveSystemPrompt,
      userPrompt,
      model: 'claude-haiku-4-5-20251001',
      totalResults,
      qualityLevel,
      strictEvidenceMode,
      rankingConsistency,
      rankingFallbackApplied,
      contextCounts: {
        businesses: businessesForContext.length,
        guides: guidesForContext.length,
        news: newsForContext.length,
        threads: threadsForContext.length,
        voices: voicesForContext.length,
        events: eventsForContext.length,
      },
      relevanceCounts: {
        businesses: { before: rawBusinesses.length, after: businesses.length },
        guides: { before: rawGuides.length, after: guides.length },
        news: { before: rawNews.length, after: news.length },
        threads: { before: rawThreads.length, after: threads.length },
        voices: { before: rawVoices.length, after: voices.length },
        events: { before: rawEvents.length, after: events.length },
      },
    } } };
  } catch (err) {
    const fallbackMax = locationBusinessLargeSet ? Math.min(10, Math.max(5, listingBusinesses.length)) : 5;
    const fallbackList = locationBusinessLargeSet ? listingBusinesses : businesses;
    const answer = buildFallbackAnswer({
      query,
      hasLocalEvidence,
      businesses: fallbackList,
      guides: guidesForContext,
      maxBusinesses: fallbackMax,
      matchedCount: matchedBusinessCount,
    });
    const sources: AskResult['sources'] = fallbackList.slice(0, fallbackMax).map((b) => ({
      type: '商家',
      title: pickBusinessDisplayName(b, '商家'),
      url: `/businesses/${b.slug}`,
      snippet: b.short_desc_zh || undefined,
    }));
    return { data: { answer, sources, debugPrompt: {
      keywords,
      systemPrompt: '(fallback)',
      userPrompt: query,
      model: 'fallback-local',
      totalResults,
      qualityLevel,
      strictEvidenceMode,
      rankingConsistency,
      rankingFallbackApplied,
      contextCounts: {
        businesses: businessesForContext.length,
        guides: guidesForContext.length,
        news: newsForContext.length,
        threads: threadsForContext.length,
        voices: voicesForContext.length,
        events: eventsForContext.length,
      },
      relevanceCounts: {
        businesses: { before: rawBusinesses.length, after: businesses.length },
        guides: { before: rawGuides.length, after: guides.length },
        news: { before: rawNews.length, after: news.length },
        threads: { before: rawThreads.length, after: threads.length },
        voices: { before: rawVoices.length, after: voices.length },
        events: { before: rawEvents.length, after: events.length },
      },
    } } };
  }
}
