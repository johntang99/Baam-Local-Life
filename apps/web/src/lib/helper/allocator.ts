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
import * as OpenCC from 'opencc-js';

// Simplified → Traditional converter for business name matching
const s2tConverter = OpenCC.Converter({ from: 'cn', to: 'tw' });
import { findCategoryId, detectRegionLabel } from './data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;
type HelperMessage = { role: 'user' | 'assistant'; content: string };

// ─── Layer 1: Pattern Match (Chinese) ────────────────────────

function detectTypeByPattern(query: string, history: HelperMessage[]): AnswerType | null {
  const q = query.toLowerCase().trim();

  // Follow-up — short conversational replies when there's history
  if (history.length >= 2) {
    // Very short replies (< 6 chars) are almost always follow-ups
    if (q.length <= 5 && /^(是的|对|好的?|谢谢|更多|还有|嗯|行|可以|没了|ok|yes|no|more|sure|thanks)/.test(q)) return 'follow-up';
    // Short questions referencing prior context (< 25 chars)
    if (q.length < 25 && /^(哪个|那个|第一个|再推荐|还有.+吗|.+难吗|.+贵吗|.+多少|告诉我更多|other|which)/.test(q)) return 'follow-up';
  }

  // Comparison
  if (/和.+比|vs\.?|对比|比较|哪个好|哪家好/.test(q)) return 'comparison';
  if (/\bvs\.?\b|\bversus\b|\bcompare\b/.test(q)) return 'comparison';

  // Business lookup — specific business name queries
  if (/^(.+)(的|的|)(电话|地址|营业时间|评价|怎么样|好不好|在哪)/.test(q)) return 'business-lookup';

  // Life event — only when describing a major life transition, not just mentioning "新移民"
  if (/刚搬来|刚到|第一次来|新来的|刚来美国/.test(q)) return 'life-event';
  if (/新移民.*(第一|先做|落地|安家|来纽约)/.test(q)) return 'life-event';
  if (/刚生了|怀孕|准备退休|要开店|准备.*开店|想开店/.test(q)) return 'life-event';

  // Mixed — info + business
  if (/什么.+(应该|怎么办)|应该怎么办|怎么处理/.test(q)) return 'mixed';
  if (/多少钱.+推荐|推荐.+多少钱|费用.+推荐/.test(q)) return 'mixed';
  if (/费用.*(一般|大概|通常)|一般.*(多少钱|费用|收费)/.test(q)) return 'mixed';

  // Info lookup — factual questions about specific data
  if (/税率|邮编|人口|学区|天气|几点|几号|电话号码是/.test(q)) return 'info-lookup';
  if (/最低工资|最低时薪|票价|多少钱一|房产税|物业税/.test(q)) return 'info-lookup';
  if (/开门吗|营业吗|周末开|上班时间|工作时间|在哪里$|在哪$|地址在/.test(q)) return 'info-lookup';
  if (/是多少$|多少钱$/.test(q)) return 'info-lookup';

  // News/events
  if (/这周末|活动|最新消息|最近有什么|发生了什么|festival|weekend|event/.test(q)) return 'news-events';
  if (/招聘会|job\s*fair|演出|音乐会|美食节|文化节|讲座|展览/.test(q)) return 'news-events';
  if (/近期有什么|最近有啥|有什么.*活动/.test(q)) return 'news-events';

  // Community
  if (/大家觉得|有人试过|有没有人|听说过|评价怎么样|怎么看/.test(q)) return 'community';

  // Guide — expanded to catch guide intent anywhere in query
  if (/^怎么|^如何|步骤|流程|指南|攻略|需要什么|办理/.test(q)) return 'guide';
  if (/怎么(注册|申请|办理|报|考|选|分|坐|续|处理|准备)/.test(q)) return 'guide';
  if (/要(准备|注意|满足|带|提交)(什么|哪些|多少)/.test(q)) return 'guide';
  if (/(一般要准备多少|条件是什么|有什么条件|怎么[分弄搞]|怎么.*最划算)/.test(q)) return 'guide';
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
  // Extract business name — strip question patterns aggressively
  const cleaned = query
    .replace(/^(请问|你好|帮我|我想|推荐)/i, '')
    .replace(/(的|)(电话|地址|营业时间|评价|怎么样|好不好|在哪里?|在哪|怎么去)(多少|是多少|是什么)?.*$/i, '')
    .replace(/^(tell me about|info on|hours for|reviews for)\s+/i, '')
    .trim();
  if (cleaned.length < 2) return null;

  // Reject category words
  if (CATEGORY_WORDS_ZH.has(cleaned)) return null;

  // HP3: Generate Traditional Chinese variant for matching (美丽轩 → 美麗軒)
  const traditional = s2tConverter(cleaned);
  const hasTradVariant = traditional !== cleaned;

  // Try exact-ish match first (search both simplified and traditional)
  const orConditions = [`display_name.ilike.%${cleaned}%,display_name_zh.ilike.%${cleaned}%`];
  if (hasTradVariant) orConditions.push(`display_name_zh.ilike.%${traditional}%`);

  const { data } = await supabase.from('businesses')
    .select('id, slug, display_name, display_name_zh, short_desc_zh, short_desc_en, avg_rating, review_count, phone, website_url, address_full, total_score, ai_tags, latitude, longitude')
    .eq('is_active', true).eq('site_id', siteId)
    .or(orConditions.join(','))
    .order('total_score', { ascending: false, nullsFirst: false })
    .limit(1);

  if (!data || data.length === 0) {
    // Retry with shorter name (first 2-4 Chinese chars) for partial matching
    const shortName = cleaned.replace(/[a-zA-Z0-9\s]/g, '').slice(0, 4);
    if (shortName.length >= 2 && shortName !== cleaned) {
      const { data: retryData } = await supabase.from('businesses')
        .select('id, slug, display_name, display_name_zh, short_desc_zh, short_desc_en, avg_rating, review_count, phone, website_url, address_full, total_score, ai_tags, latitude, longitude')
        .eq('is_active', true).eq('site_id', siteId)
        .or(`display_name.ilike.%${shortName}%,display_name_zh.ilike.%${shortName}%`)
        .order('total_score', { ascending: false, nullsFirst: false })
        .limit(1);
      if (retryData && retryData.length > 0) {
        const b = retryData[0];
        return { id: b.id, slug: b.slug, display_name: b.display_name || '', display_name_zh: b.display_name_zh || '', short_desc_zh: b.short_desc_zh || '', short_desc_en: b.short_desc_en || '', avg_rating: b.avg_rating, review_count: b.review_count, phone: b.phone, website_url: b.website_url || null, address_full: b.address_full, total_score: b.total_score || 0, ai_tags: b.ai_tags || [], latitude: b.latitude, longitude: b.longitude };
      }
    }
    return null;
  }
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

// ─── Comparison Pair Finder ─────────────────────────────────

function extractComparisonNames(query: string): [string, string] | null {
  const q = query.trim();
  let match: RegExpMatchArray | null;

  // "A vs B" / "A VS B"
  match = q.match(/^(.+?)\s*(?:vs\.?|VS\.?|versus)\s*(.+)$/i);
  if (match) return [match[1].trim(), match[2].trim()];

  // "A和B比" / "A和B哪个好" / "A和B对比"
  match = q.match(/^(.+?)(?:和|与|跟)(.+?)(?:比|对比|哪个好|哪家好|比较|相比).*$/);
  if (match) return [match[1].trim(), match[2].trim()];

  // "比较A和B" / "对比A和B"
  match = q.match(/^(?:比较|对比|compare)\s*(.+?)(?:和|与|跟|and|,)\s*(.+)$/i);
  if (match) return [match[1].trim(), match[2].trim()];

  // "A还是B好" / "A或者B"
  match = q.match(/^(.+?)(?:还是|或者|或)\s*(.+?)(?:好|更好|哪个好)?$/);
  if (match && match[1].length >= 2 && match[2].length >= 2) return [match[1].trim(), match[2].trim()];

  return null;
}

async function findComparisonPair(
  supabase: AnyRow,
  siteId: string,
  query: string,
): Promise<[BusinessResult, BusinessResult] | null> {
  const names = extractComparisonNames(query);
  if (!names) return null;

  // Clean trailing question/category words from each name
  const cleanName = (n: string) => n
    .replace(/(哪个好|更好|好一些|怎么样|好不好|好喝|好吃|which is better|better)$/i, '')
    .replace(/(火锅店?|烤肉店?|餐厅|饭店|奶茶店?|律师楼?|会计|事务所|诊所|医院)$/i, '')
    .trim();

  const [nameA, nameB] = [cleanName(names[0]), cleanName(names[1])];
  if (nameA.length < 2 || nameB.length < 2) return null;

  // Find both businesses — try full name first, then shorter prefix
  const findOne = async (name: string): Promise<BusinessResult | null> => {
    const trad = s2tConverter(name);
    const orConds = [`display_name.ilike.%${name}%,display_name_zh.ilike.%${name}%`];
    if (trad !== name) orConds.push(`display_name_zh.ilike.%${trad}%`);

    const { data } = await supabase.from('businesses')
      .select('id, slug, display_name, display_name_zh, short_desc_zh, short_desc_en, avg_rating, review_count, phone, website_url, address_full, total_score, ai_tags, latitude, longitude')
      .eq('is_active', true).eq('site_id', siteId)
      .or(orConds.join(','))
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(1);
    if (!data || data.length === 0) {
      // Retry with shorter Chinese name (first 2-3 chars)
      const shortName = name.replace(/[a-zA-Z0-9\s]/g, '').slice(0, 3);
      if (shortName.length >= 2 && shortName !== name) {
        const { data: retry } = await supabase.from('businesses')
          .select('id, slug, display_name, display_name_zh, short_desc_zh, short_desc_en, avg_rating, review_count, phone, website_url, address_full, total_score, ai_tags, latitude, longitude')
          .eq('is_active', true).eq('site_id', siteId)
          .or(`display_name.ilike.%${shortName}%,display_name_zh.ilike.%${shortName}%`)
          .order('total_score', { ascending: false, nullsFirst: false })
          .limit(1);
        if (retry && retry.length > 0) {
          const b = retry[0];
          return { id: b.id, slug: b.slug, display_name: b.display_name || '', display_name_zh: b.display_name_zh || '', short_desc_zh: b.short_desc_zh || '', short_desc_en: b.short_desc_en || '', avg_rating: b.avg_rating, review_count: b.review_count, phone: b.phone, website_url: b.website_url || null, address_full: b.address_full, total_score: b.total_score || 0, ai_tags: b.ai_tags || [], latitude: b.latitude, longitude: b.longitude };
        }
      }
      return null;
    }
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
  };

  const [bizA, bizB] = await Promise.all([findOne(nameA), findOne(nameB)]);
  if (!bizA || !bizB) return null;
  return [bizA, bizB];
}

// ─── Main Allocator ──────────────────────────────────────────

export async function allocateAnswerType(
  query: string,
  history: HelperMessage[],
  supabase: AnyRow,
  siteId: string,
  anthropicApiKey: string,
): Promise<AllocationResult> {
  // Extract keywords (Chinese dictionary + English whitespace split)
  const cleaned = query.replace(/[?.!,'"，。！？；：""''、]/g, '');
  const spaceSplit = cleaned.split(/[\s\u3000]+/).filter(w => w.length >= 2 && !GENERIC_WORDS.has(w));

  // Chinese dictionary matching — extract known topic words from the query
  const ZH_TOPIC_WORDS = [
    '牙医','牙科','儿科','针灸','中医','家庭医生','眼科','体检','眼镜','配镜',
    '律师','移民','工卡','绿卡','签证','罚单','离婚','法律','入籍',
    '报税','会计','贷款','买房','信用','银行','保险','白卡',
    '驾照','驾校','路考','租房','学区','学校','地铁','搬家','DMV',
    '装修','水管','空调','蟑螂','开锁','害虫','修车','保养',
    '课后班','钢琴','幼儿园','英语','补习',
    '火锅','奶茶','韩餐','日料','早茶','烧腊','中餐','川菜','粤菜','上海菜',
    '美甲','理发','SPA','按摩','半永久','纹眉','美容',
  ];
  const dictMatched: string[] = [];
  const lower = cleaned.toLowerCase();
  for (const kw of ZH_TOPIC_WORDS.sort((a, b) => b.length - a.length)) {
    if (lower.includes(kw.toLowerCase())) dictMatched.push(kw);
  }
  const specificKws = [...new Set([...dictMatched, ...spaceSplit])].slice(0, 10);

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

  // Comparison — find both businesses
  if (type === 'comparison') {
    const pair = await findComparisonPair(supabase, siteId, query);
    if (pair) {
      return { ...emptyResult, type: 'comparison', comparisonPair: pair };
    }
    // If we can't find both businesses, fall back to AI engine
    return { ...emptyResult, type: 'follow-up' };
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
    // Mixed with no category: the info part is still valid — route to guide
    if (type === 'mixed') return { ...emptyResult, type: 'guide' };
    return { ...emptyResult, type: 'no-match' };
  }

  if (type === 'guide') return { ...emptyResult, type: 'guide' };
  if (type === 'info-lookup') return { ...emptyResult, type };
  if (type === 'follow-up') return { ...emptyResult, type };

  return { ...emptyResult, type };
}
