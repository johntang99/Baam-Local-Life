/**
 * Chinese Helper data fetching — category matching, businesses, related content
 * Adapted from English Helper with Chinese-specific logic
 */

import type { BusinessResult, RelatedContent, HelperSource, ContentItem } from './types';
import { REGION_MAP, REGION_ADDRESS_KEYWORDS } from './types';

// Broad regions that should include multiple sub-regions
const BROAD_REGION_EXPANSION: Record<string, string[]> = {
  'avenue-u-brooklyn-ny': ['avenue-u-brooklyn-ny', 'sunset-park-ny', 'bensonhurst-ny'], // 布鲁克林 = all Brooklyn neighborhoods
  'queens-ny': ['queens-ny', 'flushing-ny', 'elmhurst-ny', 'corona-ny', 'forest-hills-ny', 'long-island-city-ny', 'murray-hill-queens-ny'], // 皇后区 = all Queens neighborhoods
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

// ─── Region Detection ────────────────────────────────────────

export function detectRegionSlug(query: string): string | null {
  const lower = query.toLowerCase();
  for (const [keyword, slug] of Object.entries(REGION_MAP)) {
    if (lower.includes(keyword)) return slug;
  }
  return null;
}

export function detectRegionLabel(query: string): string | null {
  const lower = query.toLowerCase();
  for (const keyword of Object.keys(REGION_MAP)) {
    if (lower.includes(keyword)) return keyword;
  }
  return null;
}

// ─── Matching Utilities ──────────────────────────────────────

const _wordMatch = (text: string, kw: string) => {
  // For Chinese, substring match is appropriate (no word boundaries)
  // For English keywords, use word boundary
  const isChinese = /[\u4e00-\u9fff]/.test(kw);
  if (isChinese) return text.includes(kw);
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return kw.length <= 4
    ? new RegExp(`\\b${escaped}\\b`, 'i').test(text)
    : new RegExp(`\\b${escaped}`, 'i').test(text);
};

const _stem = (w: string) => {
  // Only stem English words
  if (/[\u4e00-\u9fff]/.test(w)) return w;
  const s = w.toLowerCase();
  for (const sfx of ['ation','tion','sion','ment','ness','ible','able','ence','ance','ing','ous','ive','ity','ful','ist','ize','ise','ory','ery','ary','ant','ent','age','ed','er','or','ly','al','es','s']) {
    if (s.length > sfx.length + 3 && s.endsWith(sfx)) return s.slice(0, -sfx.length);
  }
  return s;
};

const _stemMatch = (a: string, b: string) => {
  const sa = _stem(a), sb = _stem(b);
  return sa.length >= 4 && sb.length >= 4 && sa === sb;
};

// ─── Category Matching ───────────────────────────────────────

// Subcuisine keywords: when user asks for a specific cuisine within a broad category,
// these keywords filter businesses by name/description/tags after category fetch
const SUBCUISINE_FILTERS: Record<string, { keywords: string[]; label: string }> = {
  '粤菜': { keywords: ['粤', '广东', 'cantonese', '烧腊', '煲仔', '白切鸡', '叉烧', 'dim sum', '港式', '茶餐厅', '点心', '烧鸭', '烧鹅', '老火汤'], label: '粤菜' },
  '广东菜': { keywords: ['粤', '广东', 'cantonese', '烧腊', '煲仔', '白切鸡', '叉烧', 'dim sum', '港式', '茶餐厅', '点心', '烧鸭', '烧鹅', '老火汤'], label: '粤菜' },
  '川菜': { keywords: ['川', '四川', 'sichuan', 'szechuan', '麻辣', '重庆', '火锅', '水煮', '回锅', '宫保', '担担'], label: '川菜' },
  '四川菜': { keywords: ['川', '四川', 'sichuan', 'szechuan', '麻辣', '重庆', '水煮', '回锅', '宫保', '担担'], label: '川菜' },
  '湘菜': { keywords: ['湘', '湖南', 'hunan', '剁椒', '小炒肉', '臭豆腐'], label: '湘菜' },
  '东北菜': { keywords: ['东北', '锅包肉', '地三鲜', '杀猪菜', '小鸡炖蘑菇', '饺子', 'manchurian', 'dongbei'], label: '东北菜' },
  '上海菜': { keywords: ['上海', '本帮', 'shanghai', '小笼', '生煎', '红烧肉', '蟹粉'], label: '上海菜' },
  '北京菜': { keywords: ['北京', 'beijing', 'peking', '烤鸭', '涮羊肉', '炸酱面', '京酱'], label: '北京菜' },
  '江浙菜': { keywords: ['江浙', '淮扬', '杭州', '宁波', '绍兴', 'zhejiang', 'jiangsu'], label: '江浙菜' },
  '福建菜': { keywords: ['福建', '闽', 'fujian', 'fuzhou', '福州'], label: '福建菜' },
  '云南菜': { keywords: ['云南', 'yunnan', '过桥米线', '汽锅鸡'], label: '云南菜' },
  '客家菜': { keywords: ['客家', 'hakka'], label: '客家菜' },
  '新疆菜': { keywords: ['新疆', 'xinjiang', 'uyghur', '大盘鸡', '烤羊', '拉条子', '抓饭'], label: '新疆菜' },
  '台湾菜': { keywords: ['台湾', 'taiwan', '卤肉饭', '牛肉面', '珍珠', '盐酥鸡'], label: '台湾菜' },
};

export interface CategoryMatch {
  id: string;
  name: string;
  score: number;
  ambiguous?: boolean;
  alternatives?: { id: string; name: string; slug: string }[];
  /** Subcuisine filter keywords — when set, businesses should be filtered by name/desc matching these */
  subcuisineKeywords?: string[];
  subcuisineLabel?: string;
}

export async function findCategoryId(
  supabase: AnyRow,
  siteId: string,
  keywords: string[],
  fullQuery: string,
): Promise<CategoryMatch | null> {
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name_zh, name_en, slug, search_terms')
    .eq('type', 'business')
    .eq('site_scope', 'zh');

  if (!categories || categories.length === 0) return null;

  const queryLower = fullQuery.toLowerCase();
  const fullText = [...keywords, ...queryLower.split(/\s+/)].join(' ');

  // Food context detection (Chinese + English)
  const isFoodContext = /餐|饭|吃|食|菜|面|粉|火锅|烧烤|奶茶|咖啡|酒|甜|pizza|sushi|steak|ramen|restaurant|food/i.test(fullText);

  const scored: { id: string; name: string; slug: string; score: number }[] = [];

  for (const cat of categories as AnyRow[]) {
    const nameZh = (cat.name_zh || '').toLowerCase();
    const nameEn = (cat.name_en || '').toLowerCase();
    const slug = (cat.slug || '').toLowerCase();
    const terms = (cat.search_terms || []).map((t: string) => t.toLowerCase());
    let score = 0;

    // Phrase match — multi-word terms in query
    for (const term of terms) {
      if (term.length >= 2 && queryLower.includes(term)) {
        score += term.length >= 4 ? 25 : 15; // longer phrases score higher
      }
    }

    // Individual keyword matching
    for (let ki = 0; ki < keywords.length; ki++) {
      const kw = keywords[ki].toLowerCase();
      const bonus = ki === 0 ? 3 : 0;

      // Name match (Chinese)
      if (nameZh === kw) score += 20 + bonus;
      else if (nameZh.includes(kw) || kw.includes(nameZh)) score += 10 + bonus;

      // Name match (English)
      if (nameEn === kw) score += 20 + bonus;
      else if (_wordMatch(nameEn, kw)) score += 10 + bonus;

      // Slug match
      if (_wordMatch(slug, kw)) score += 8;

      // Search term match
      if (terms.some((t: string) => t === kw || _stemMatch(t, kw))) score += 5 + bonus;
      else if (terms.some((t: string) => t.includes(kw) || kw.includes(t))) score += 2;
    }

    // Food context boost
    if (isFoodContext && slug.startsWith('food-')) score += 15;
    if (isFoodContext && !slug.startsWith('food-')) score -= 10;

    if (score > 0) scored.push({ id: cat.id, name: cat.name_zh || cat.name_en || slug, slug, score });
  }

  if (scored.length === 0) return null;
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];

  // Check for subcuisine filter (e.g. 粤菜, 川菜 within 中餐)
  const queryLowerFull = fullQuery.toLowerCase();
  for (const [trigger, filter] of Object.entries(SUBCUISINE_FILTERS)) {
    if (queryLowerFull.includes(trigger) || keywords.some(k => k.toLowerCase() === trigger)) {
      return { id: best.id, name: best.name, score: best.score, subcuisineKeywords: filter.keywords, subcuisineLabel: filter.label };
    }
  }

  return { id: best.id, name: best.name, score: best.score };
}

// ─── Fetch Category Businesses ───────────────────────────────

export async function fetchCategoryBusinesses(
  supabase: AnyRow,
  siteId: string,
  categoryId: string,
  regionSlug: string | null,
  subcuisineKeywords?: string[],
): Promise<{ businesses: BusinessResult[]; locationFallback: boolean }> {
  const bizFields = 'id, slug, display_name, display_name_zh, short_desc_zh, short_desc_en, ai_tags, avg_rating, review_count, phone, website_url, address_full, total_score, is_featured, latitude, longitude';

  // Include child categories
  const { data: childCats } = await supabase
    .from('categories')
    .select('id, slug')
    .eq('parent_id', categoryId);

  let catIds: string[];
  if (childCats && childCats.length > 0) {
    const { data: parentCat } = await supabase.from('categories').select('slug').eq('id', categoryId).single();
    const isFoodParent = parentCat?.slug === 'food-dining';
    const NON_RESTAURANT = new Set(['food-grocery', 'food-liquor-store', 'food-coffee', 'food-catering', 'food-food-truck', 'food-butcher-market']);
    const filtered = isFoodParent
      ? childCats.filter((c: { slug: string }) => !NON_RESTAURANT.has(c.slug))
      : childCats;
    catIds = [categoryId, ...filtered.map((c: { id: string }) => c.id)];
  } else {
    catIds = [categoryId];
  }

  const { data: bizLinks } = await supabase
    .from('business_categories')
    .select('business_id')
    .in('category_id', catIds)
    .limit(5000);

  let bizIds = [...new Set((bizLinks || []).map((l: { business_id: string }) => l.business_id))];
  if (bizIds.length === 0) return { businesses: [], locationFallback: false };

  let locationFallback = false;

  // Fetch all category businesses first, then filter by location
  const CHUNK = 200;
  const allBiz: AnyRow[] = [];
  for (let i = 0; i < Math.min(bizIds.length, 1000); i += CHUNK) {
    const { data } = await supabase.from('businesses')
      .select(bizFields)
      .eq('is_active', true).eq('site_id', siteId)
      .in('id', bizIds.slice(i, i + CHUNK));
    if (data) allBiz.push(...data);
  }

  // Region filter — address-first approach (address is always accurate)
  let validBiz = allBiz;
  if (regionSlug) {
    const addrKeywords = REGION_ADDRESS_KEYWORDS[regionSlug];

    // Step 1: Filter by address text (primary — always reliable)
    const addrMatched = addrKeywords?.length
      ? allBiz.filter(b => {
          const addr = (b.address_full || '').toLowerCase();
          return addr && addrKeywords.some(kw => addr.includes(kw));
        })
      : [];

    // Step 2: Also include businesses matched by business_locations (supplement)
    const regionSlugs = BROAD_REGION_EXPANSION[regionSlug] || [regionSlug];
    const { data: regions } = await supabase.from('regions').select('id').in('slug', regionSlugs);
    let regionMatched: AnyRow[] = [];
    if (regions && regions.length > 0) {
      const regionIds = regions.map((r: AnyRow) => r.id);
      const { data: regionLocs } = await supabase.from('business_locations')
        .select('business_id').in('region_id', regionIds).limit(5000);
      const regionBizIds = new Set((regionLocs || []).map((l: AnyRow) => l.business_id));
      regionMatched = allBiz.filter(b => regionBizIds.has(b.id));
    }

    // Step 3: Union both sets (address matches + region table matches), deduplicate
    const seenIds = new Set<string>();
    const combined: AnyRow[] = [];
    for (const b of [...addrMatched, ...regionMatched]) {
      if (!seenIds.has(b.id)) {
        // Final validation: if we have address keywords, reject businesses whose address
        // clearly belongs to a different area (e.g. Brooklyn biz in Flushing results)
        if (addrKeywords?.length) {
          const addr = (b.address_full || '').toLowerCase();
          if (addr && !addrKeywords.some(kw => addr.includes(kw))) continue;
        }
        seenIds.add(b.id);
        combined.push(b);
      }
    }

    if (combined.length > 0) {
      validBiz = combined;
    } else {
      locationFallback = true;
    }
  }

  // Subcuisine filter: narrow results within a broad category (e.g. 粤菜 within 中餐)
  if (subcuisineKeywords && subcuisineKeywords.length > 0) {
    const filtered = validBiz.filter(b => {
      const text = [b.display_name, b.display_name_zh, b.short_desc_zh, b.short_desc_en, ...(b.ai_tags || [])].join(' ').toLowerCase();
      return subcuisineKeywords.some(kw => text.includes(kw));
    });
    // Only apply if we get enough results; otherwise fall back to full category
    if (filtered.length >= 3) validBiz = filtered;
  }

  const results = validBiz
    .sort((a, b) => (Number(b.total_score) || 0) - (Number(a.total_score) || 0))
    .slice(0, 15);

  return {
    locationFallback,
    businesses: results.map((b) => ({
      id: b.id,
      slug: b.slug,
      display_name: b.display_name || '',
      display_name_zh: b.display_name_zh || '',
      short_desc_zh: b.short_desc_zh || '',
      short_desc_en: b.short_desc_en || '',
      avg_rating: b.avg_rating,
      review_count: b.review_count,
      phone: b.phone,
      website_url: b.website_url || null,
      address_full: b.address_full,
      total_score: b.total_score || 0,
      ai_tags: b.ai_tags || [],
      latitude: b.latitude,
      longitude: b.longitude,
    })),
  };
}

// ─── Related Content Keyword Expansion ──────────────────────
// Narrow keywords often miss articles — expand to broader related terms
const RELATED_KEYWORD_EXPANSION: Record<string, string[]> = {
  // Medical
  '牙医': ['就医', '医保', '看病', '医生'],
  '牙科': ['就医', '医保', '看病', '医生'],
  '儿科': ['就医', '医保', '儿童', '孩子', '发烧'],
  '针灸': ['中医', '针灸', '理疗'],
  '家庭医生': ['家庭医生', '就医', '医保'],
  '眼科': ['就医', '医保', '配眼镜'],
  '体检': ['就医', '医保', '医生'],
  // Legal/Immigration
  '律师': ['法律', '移民', '办理'],
  '移民': ['移民', '签证', '绿卡', '身份'],
  '工卡': ['移民', '签证', '身份', '办理'],
  '罚单': ['交通', '罚款', '驾照'],
  '离婚': ['法律', '家庭', '律师'],
  // Finance
  '报税': ['报税', '税务', '退税', 'W-2'],
  '会计': ['报税', '税务', '财务'],
  '贷款': ['买房', '贷款', '银行', '信用'],
  '信用': ['银行', '信用卡', '新移民'],
  // Life guides
  '驾照': ['驾照', 'DMV', '路考', '驾校'],
  '租房': ['租房', '房东', '合同', '押金'],
  '买房': ['买房', '贷款', '过户', '房产'],
  '学区': ['学校', '教育', '入学', '孩子'],
  '白卡': ['医保', '保险', '福利', '申请'],
  '地铁': ['地铁', '交通', '通勤', 'MetroCard', 'OMNY', '公交'],
  '垃圾': ['垃圾', '垃圾分类', '回收', '分类'],
  '垃圾分类': ['垃圾', '垃圾分类', '回收', '分类'],
  '新移民': ['新移民', '安家', '办理', '落地'],
  // Home services
  '搬家': ['搬家', '搬运', '安家'],
  '装修': ['装修', '翻新', '改建'],
  '水管': ['维修', '修理', '管道'],
  '空调': ['暖通', '维修', '安装'],
  '蟑螂': ['害虫', '灭虫', '清洁'],
  '开锁': ['锁匠', '修锁', '换锁'],
  '保险': ['保险', '医保', '白卡'],
  // Education
  '幼儿园': ['托育', '幼儿', '学区', '教育'],
  '学校': ['学区', '教育', '入学'],
  '课后班': ['补习', '教育', '课后', '课外'],
  '钢琴': ['音乐', '学琴', '培训'],
  '英语': ['语言', '英语', 'ESL', '培训'],
  // Food
  '火锅': ['餐厅', '美食', '聚餐', '法拉盛'],
  '中餐': ['餐厅', '美食', '吃饭'],
  '奶茶': ['饮品', '奶茶', '茶饮'],
  '韩餐': ['餐厅', '美食', '韩国'],
  '早茶': ['点心', '餐厅', '美食'],
  // Beauty
  '美甲': ['美容', '美甲', 'SPA'],
  '理发': ['理发', '美发', '造型'],
  'SPA': ['按摩', '放松', '美容'],
  '半永久': ['半永久', '纹眉', '美容', '医美', '美甲'],
};

// ─── Fetch Related Content ───────────────────────────────────

export async function fetchRelatedContent(
  supabase: AnyRow,
  siteId: string,
  keywords: string[],
): Promise<RelatedContent> {
  // Expand keywords for broader matching
  const expanded = new Set(keywords.filter(kw => kw.length >= 2));
  for (const kw of keywords) {
    const extra = RELATED_KEYWORD_EXPANSION[kw];
    if (extra) extra.forEach(e => expanded.add(e));
  }
  const meaningfulKws = [...expanded];
  if (meaningfulKws.length === 0) return { guides: [], news: [], forum: [], discover: [] };

  const buildOr = (cols: string[]) => {
    const conds: string[] = [];
    for (const kw of meaningfulKws) {
      for (const col of cols) conds.push(`${col}.ilike.%${kw.replace(/,/g, ' ')}%`);
    }
    return conds.join(',');
  };

  const [guidesRes, newsRes, forumRes, discoverRes] = await Promise.all([
    supabase.from('articles').select('slug, title_zh, summary_zh')
      .eq('site_id', siteId).eq('editorial_status', 'published')
      .in('content_vertical', ['guide_howto', 'guide_checklist', 'guide_bestof', 'guide_comparison'])
      .or(buildOr(['title_zh', 'summary_zh', 'body_zh'])).limit(3),
    supabase.from('articles').select('slug, title_zh, summary_zh')
      .eq('site_id', siteId).eq('editorial_status', 'published')
      .in('content_vertical', ['news_alert', 'news_brief', 'news_explainer', 'news_roundup'])
      .or(buildOr(['title_zh', 'summary_zh', 'body_zh'])).order('published_at', { ascending: false }).limit(2),
    supabase.from('forum_threads').select('slug, title, body, categories:board_id(slug)')
      .eq('site_id', siteId).eq('status', 'published')
      .or(buildOr(['title', 'body'])).order('reply_count', { ascending: false }).limit(2),
    supabase.from('voice_posts').select('slug, title, excerpt')
      .eq('site_id', siteId).eq('status', 'published')
      .or(buildOr(['title', 'content', 'excerpt'])).order('like_count', { ascending: false }).limit(2),
  ]);

  const clean = (s: string) => String(s || '').replace(/^#\s*/gm, '').replace(/\*\*/g, '').trim().slice(0, 120);

  return {
    guides: ((guidesRes.data || []) as AnyRow[]).map(g => ({ title: g.title_zh || '', slug: g.slug || '', snippet: clean(g.summary_zh) })).filter(g => g.title),
    news: ((newsRes.data || []) as AnyRow[]).map(n => ({ title: n.title_zh || '', slug: n.slug || '', snippet: clean(n.summary_zh) })).filter(n => n.title),
    forum: ((forumRes.data || []) as AnyRow[]).map(t => ({
      title: t.title || '', slug: t.slug || '',
      boardSlug: typeof t.categories === 'object' && t.categories?.slug ? t.categories.slug : 'general',
      snippet: clean(t.body),
    })).filter(t => t.title),
    discover: ((discoverRes.data || []) as AnyRow[]).map(d => ({ title: d.title || '', slug: d.slug || '', snippet: clean(d.excerpt) })).filter(d => d.title),
  };
}

// ─── Build Business Sources ──────────────────────────────────

export function buildBusinessSources(businesses: BusinessResult[]): HelperSource[] {
  return businesses.map(b => ({
    type: '商家',
    title: b.display_name_zh || b.display_name || '商家',
    url: `/businesses/${b.slug}`,
    snippet: b.short_desc_zh || b.short_desc_en || [
      b.avg_rating ? `评分 ${b.avg_rating}` : '',
      b.review_count ? `${b.review_count} 条评价` : '',
      b.phone || '',
    ].filter(Boolean).join(' · '),
  }));
}
