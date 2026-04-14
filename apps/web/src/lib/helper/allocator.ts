/**
 * Chinese Helper Answer Type Allocator — 3-layer hybrid allocation
 * Adapted from English Helper with Chinese-specific patterns
 *
 * Layer 1: Pattern match (Chinese + English patterns)
 * Layer 1.5: DB category check (search_terms matching)
 * Layer 2: AI classification
 * Layer 3: Data validation (business name lookup, category match)
 */

import type { AnswerType, AllocationResult, BusinessResult } from './types';
import { GENERIC_WORDS, REGION_MAP } from './types';
import { findCategoryId, detectRegionLabel } from './data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;
type HelperMessage = { role: 'user' | 'assistant'; content: string };

// ─── Layer 1: Pattern Match (Chinese) ────────────────────────

function detectTypeByPattern(query: string, history: HelperMessage[]): AnswerType | null {
  const q = query.toLowerCase().trim();

  // Follow-up
  if (history.length >= 2 && q.length < 20) {
    if (/^(是的|对|好|谢谢|更多|还有|哪个|那个|第一个|再推荐|other|more|yes|ok)/.test(q)) return 'follow-up';
  }

  // Comparison
  if (/和.+比|vs\.?|对比|比较|哪个好|哪家好/.test(q)) return 'comparison';
  if (/\bvs\.?\b|\bversus\b|\bcompare\b/.test(q)) return 'comparison';

  // Business lookup — specific business name queries
  if (/^(.+)(的|的|)(电话|地址|营业时间|评价|怎么样|好不好|在哪)/.test(q)) return 'business-lookup';

  // Life event
  if (/刚搬来|新移民|刚到|第一次来|新来的|刚来美国/.test(q)) return 'life-event';
  if (/刚生了|怀孕|准备退休|要开店/.test(q)) return 'life-event';

  // Mixed — info + business
  if (/什么.+(应该|怎么办)|应该怎么办|怎么处理/.test(q)) return 'mixed';
  if (/多少钱.+推荐|推荐.+多少钱|费用.+推荐/.test(q)) return 'mixed';

  // Info lookup
  if (/税率|邮编|人口|学区|天气|几点|几号|电话号码是/.test(q)) return 'info-lookup';

  // News/events
  if (/这周末|活动|最新消息|最近有什么|发生了什么|festival|weekend|event/.test(q)) return 'news-events';

  // Community
  if (/大家觉得|有人试过|有没有人|听说过|评价怎么样|怎么看/.test(q)) return 'community';

  // Guide
  if (/^怎么|^如何|步骤|流程|指南|攻略|需要什么|办理/.test(q)) return 'guide';
  if (/^how (do|can|to|should|much)\b|steps|process|guide/.test(q)) return 'guide';

  return null;
}

// ─── Layer 2: AI Classification ──────────────────────────────

async function classifyWithAI(query: string, anthropicApiKey: string): Promise<AnswerType> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicApiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        system: `你是一个纽约华人社区平台的查询分类器。用一个英文单词回答：
- business: 找商家、推荐服务
- guide: 操作步骤、办事指南
- info: 查询具体信息（地址、电话、税率）
- mixed: 既需要信息又需要商家推荐
- community: 想听社区意见、评价
- news: 最新消息、活动`,
        messages: [{ role: 'user', content: query }],
      }),
    });
    if (!response.ok) return 'business-recommendation';
    const data = await response.json();
    const word = data.content?.[0]?.text?.trim().toLowerCase() || '';
    const mapping: Record<string, AnswerType> = {
      'business': 'business-recommendation', 'guide': 'guide', 'info': 'info-lookup',
      'mixed': 'mixed', 'community': 'community', 'news': 'news-events',
    };
    return mapping[word] || 'business-recommendation';
  } catch {
    return 'business-recommendation';
  }
}

// ─── Layer 3: Business Name Lookup ───────────────────────────

const CATEGORY_WORDS_ZH = new Set([
  '餐厅', '饭店', '餐馆', '酒楼', '火锅', '烧烤', '奶茶', '咖啡',
  '律师', '医生', '牙医', '会计', '理发', '美甲', '按摩', '健身',
  '修车', '搬家', '装修', '水管工', '电工', '保姆', '月嫂',
  '超市', '药店', '银行', '保险', '地产', '学校', '补习',
]);

async function findBusinessByName(
  supabase: AnyRow,
  siteId: string,
  query: string,
): Promise<BusinessResult | null> {
  // Extract business name — strip question patterns
  const cleaned = query
    .replace(/^(请问|你好|帮我|我想|推荐)/i, '')
    .replace(/(的电话|的地址|怎么样|好不好|在哪里?|营业时间|评价|怎么去).*$/i, '')
    .replace(/^(tell me about|info on|hours for|reviews for)\s+/i, '')
    .trim();
  if (cleaned.length < 2) return null;

  // Reject category words
  if (CATEGORY_WORDS_ZH.has(cleaned)) return null;

  const { data } = await supabase.from('businesses')
    .select('id, slug, display_name, display_name_zh, short_desc_zh, short_desc_en, avg_rating, review_count, phone, website_url, address_full, total_score, ai_tags, latitude, longitude')
    .eq('is_active', true).eq('site_id', siteId)
    .or(`display_name.ilike.%${cleaned}%,display_name_zh.ilike.%${cleaned}%`)
    .order('total_score', { ascending: false, nullsFirst: false })
    .limit(1);

  if (!data || data.length === 0) return null;
  const b = data[0];
  return {
    id: b.id, slug: b.slug,
    display_name: b.display_name || '', display_name_zh: b.display_name_zh || '',
    short_desc_zh: b.short_desc_zh || '', short_desc_en: b.short_desc_en || '',
    avg_rating: b.avg_rating, review_count: b.review_count,
    phone: b.phone, website_url: b.website_url || null,
    address_full: b.address_full, total_score: b.total_score || 0,
    ai_tags: b.ai_tags || [], latitude: b.latitude, longitude: b.longitude,
  };
}

// ─── Main Allocator ──────────────────────────────────────────

export async function allocateAnswerType(
  query: string,
  history: HelperMessage[],
  supabase: AnyRow,
  siteId: string,
  anthropicApiKey: string,
): Promise<AllocationResult> {
  // Extract keywords (Chinese + English)
  const specificKws = query
    .replace(/[?.!,'"，。！？；：""''、]/g, '')
    .split(/[\s\u3000]+/)
    .filter(w => w.length >= 2 && !GENERIC_WORDS.has(w));

  const regionLabel = detectRegionLabel(query);

  const emptyResult: AllocationResult = {
    type: 'no-match', keywords: specificKws, businesses: [],
    matchedCategory: null, locationFallback: false, regionLabel,
    related: { guides: [], forum: [], discover: [], news: [] },
    singleBusiness: null, comparisonPair: null,
  };

  // ─── Layer 1: Pattern match ───
  let type = detectTypeByPattern(query, history);

  // ─── Layer 1.5: DB category check ───
  if (!type && specificKws.length > 0) {
    const category = await findCategoryId(supabase, siteId, specificKws, query);
    if (category && category.score >= 5) {
      type = 'business-recommendation';
    }
  }

  // ─── Layer 2: AI classification ───
  if (!type) {
    type = await classifyWithAI(query, anthropicApiKey);
  }

  // ─── Layer 3: Data validation ───

  // Comparison
  if (type === 'comparison') {
    return { ...emptyResult, type: 'follow-up' }; // Delegate to AI engine for now
  }

  // Business lookup
  if (type === 'business-lookup' || type === 'business-recommendation' || type === 'info-lookup') {
    const biz = await findBusinessByName(supabase, siteId, query);
    if (biz) {
      return { ...emptyResult, type: 'business-lookup', singleBusiness: biz };
    }
    if (type === 'business-lookup') {
      return { ...emptyResult, type: 'info-lookup' };
    }
  }

  if (type === 'community') return { ...emptyResult, type: 'community' };
  if (type === 'news-events') return { ...emptyResult, type: 'news-events' };

  // Business recommendation — match category
  if (type === 'business-recommendation' || type === 'mixed') {
    const category = await findCategoryId(supabase, siteId, specificKws, query);
    if (category) {
      if (/怎么办|多少钱|费用|注意|需要/.test(query) && type !== 'mixed') type = 'mixed';
      return { ...emptyResult, type, matchedCategory: category.name };
    }
    return { ...emptyResult, type: 'no-match' };
  }

  if (type === 'guide') return { ...emptyResult, type: 'guide' };
  if (type === 'info-lookup') return { ...emptyResult, type };
  if (type === 'follow-up') return { ...emptyResult, type };

  return { ...emptyResult, type };
}
