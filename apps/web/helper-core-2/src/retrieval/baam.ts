import type { HelperIntent, RetrievalPayload, SourceItem } from '../types';
import {
  businessMatchesCriminalLawBoundary,
  businessMatchesImmigrationLawBoundary,
  businessMatchesTrafficLawBoundary,
  isCriminalLawQuery,
  isImmigrationLawQuery,
  isTrafficLawQuery,
} from './rules/legal';
import {
  businessMatchesTcmBoundary,
  getMedicalSpecialtyTerms,
  isDentalQuery,
  isDermatologyQuery,
  isMedicalQuery,
  isOphthalmologyQuery,
  isPediatricQuery,
  isTcmRankingQuery,
  businessMatchesDentalBoundary,
  businessMatchesDermatologyBoundary,
  businessMatchesDermatologySupportive,
  businessMatchesOphthalmologyBoundary,
  businessMatchesOphthalmologySupportive,
  businessMatchesPediatricBoundary,
} from './rules/medical';
import {
  type CuisineAnchorProfile,
  businessMatchesAnchorTerms,
  businessMatchesCuisineBoundary,
  businessMatchesRestaurantBoundary,
  categoryMatchesCuisineProfile,
  cuisineBoundaryPenalty,
  getCuisineAnchorProfile,
  getQueryAnchorTerms,
  hasSushiSignals,
  isBudgetMealQuery,
  isExplicitHotpotIntent,
  isRelaxedRestaurantCandidate,
  isRestaurantQuery,
  isSushiIntent,
  sushiBoundaryPenalty,
} from './rules/food';
import {
  businessMatchesAcademicEducationHardBoundary,
  businessMatchesAcademicEducationBoundary,
  businessMatchesArtsEducationBoundary,
  businessMatchesEducationBoundary,
  businessMatchesInsuranceBoundary,
  businessMatchesRealEstateBoundary,
  isAcademicEducationQuery,
  isEducationAcademicHardQuery,
  isArtsEducationQuery,
  isEducationQuery,
  isInsuranceQuery,
  isRealEstateQuery,
} from './rules/service';
import {
  businessMatchesRetailBoundary,
  businessMatchesRetailSubtypeBoundary,
  isRetailQuery,
  isRetailStrictQuery,
} from './rules/retail';
import {
  businessMatchesHomeImprovementBoundary,
  businessMatchesHomeSubtypeBoundary,
  isHomeImprovementQuery,
  isHomeStrictQuery,
} from './rules/home';
import {
  businessMatchesAutoBoundary,
  businessMatchesAutoSubtypeBoundary,
  isAutoStrictQuery,
  isAutoServiceQuery,
} from './rules/auto';
import {
  businessMatchesTaxBoundary,
  businessMatchesTaxSubtypeBoundary,
  isTaxServiceQuery,
} from './rules/tax';
import {
  businessMatchesBeautyWellnessBoundary,
  businessMatchesBeautyWellnessSubtypeBoundary,
  isBeautyWellnessQuery,
  isBeautyWellnessStrictQuery,
} from './rules/wellness';
import {
  businessMatchesTravelAgencyBoundary,
  businessMatchesTravelAgencySubtypeBoundary,
  isTravelAgencyQuery,
  isTravelAgencyStrictQuery,
} from './rules/travel';
import {
  businessMatchesPrintDesignBoundary,
  businessMatchesPrintDesignSubtypeBoundary,
  isPrintDesignQuery,
  isPrintDesignStrictQuery,
} from './rules/print';

type AnyRow = Record<string, unknown>;

function uniqueByUrl(sources: SourceItem[]): SourceItem[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}

function toSnippet(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim().slice(0, 180);
  }
  return fallback;
}

const invalidNamePatterns = [/点击查看地图/i, /^查看地图$/i, /^地图$/i, /^google\s*map/i];

function normalizeName(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isInvalidBusinessName(name: string): boolean {
  if (!name) return true;
  return invalidNamePatterns.some((pattern) => pattern.test(name));
}

function getBusinessTitle(business: AnyRow): string {
  const zhName = normalizeName(business.display_name_zh);
  const enName = normalizeName(business.display_name);
  if (!isInvalidBusinessName(zhName)) return zhName;
  if (!isInvalidBusinessName(enName)) return enName;
  return '未命名商家';
}

function escapeLikeKeyword(keyword: string): string {
  return keyword.replace(/,/g, ' ').trim();
}

function buildOr(keywords: string[], columns: string[]): string {
  const conditions: string[] = [];
  for (const keyword of keywords) {
    const safeKeyword = escapeLikeKeyword(keyword);
    if (!safeKeyword) continue;
    for (const column of columns) {
      conditions.push(`${column}.ilike.%${safeKeyword}%`);
    }
  }
  return conditions.join(',');
}

const genericWords = new Set([
  '申请', '怎么', '如何', '哪里', '什么', '可以', '需要', '办理', '服务', '咨询', '推荐',
  '好的', '最好', '附近', '价格', '费用', '多少', '帮我', '一下', '纽约', '法拉盛',
  '家庭', '聚餐', '口碑', '评价', '筛选', '值得', '考虑', '餐厅', '饭店', '好吃',
]);

const locationHints = [
  { label: '法拉盛', patterns: ['法拉盛', 'flushing'] },
  { label: '曼哈顿', patterns: ['曼哈顿', 'manhattan'] },
  { label: '唐人街', patterns: ['唐人街', 'chinatown', 'mulberry'] },
  { label: '皇后区', patterns: ['皇后区', 'queens'] },
  { label: '布鲁克林', patterns: ['布鲁克林', 'brooklyn'] },
  { label: '东村', patterns: ['东村', 'east village', 'lower east side'] },
];

function buildBusinessOr(keywords: string[], columns: string[]): string {
  const specificKeywords = keywords.filter((keyword) => !genericWords.has(keyword) && keyword.length > 1);
  return buildOr(specificKeywords.length > 0 ? specificKeywords : keywords, columns);
}

function buildBusinessSnippet(business: AnyRow, reviews: string[] = []): string {
  const base = [
    business.avg_rating ? `评分 ${business.avg_rating}` : '',
    business.review_count ? `${business.review_count}条评价` : '',
    business.phone ? `电话 ${business.phone}` : '',
    business.address_full ? `地址 ${String(business.address_full).slice(0, 48)}` : '',
    Array.isArray(business.ai_tags) ? business.ai_tags.slice(0, 3).join(' / ') : '',
  ]
    .filter(Boolean)
    .join(' · ');

  if (reviews.length === 0) return base;
  return `${base}${base ? ' · ' : ''}评价摘录：${reviews.join('；')}`;
}

function hasStrongBusinessCoreData(business: AnyRow): boolean {
  const hasRating = Number(business.avg_rating || 0) > 0;
  const hasReviews = Number(business.review_count || 0) > 0;
  const hasPhone = String(business.phone || '').trim().length >= 8;
  const hasAddress = String(business.address_full || '').trim().length >= 6;
  const coreHits = [hasRating, hasReviews, hasPhone, hasAddress].filter(Boolean).length;
  return coreHits >= 3;
}

function getMatchedLocationLabels(query: string): string[] {
  const lower = query.toLowerCase();
  return locationHints
    .filter((item) => item.patterns.some((pattern) => lower.includes(pattern.toLowerCase())))
    .map((item) => item.label);
}

function businessMatchesLocation(business: AnyRow, labels: string[]): boolean {
  if (labels.length === 0) return false;
  const addressText = String(business.address_full || '').toLowerCase();
  const addressMatched = locationHints.some(
    (item) =>
      labels.includes(item.label) &&
      item.patterns.some((pattern) => addressText.includes(pattern.toLowerCase())),
  );
  if (addressMatched) return true;

  // Fallback only when address is missing/unusable.
  if (addressText.trim().length >= 6) return false;
  const fallbackHaystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
  ]
    .join(' ')
    .toLowerCase();
  return locationHints.some(
    (item) =>
      labels.includes(item.label) &&
      item.patterns.some((pattern) => fallbackHaystack.includes(pattern.toLowerCase())),
  );
}

function compareRecommendationQuality(a: AnyRow, b: AnyRow): number {
  // Use DB-computed total_score: 6×Rating + 3×log(Reviews+2)×2 + P_score
  return (Number(b.total_score) || 0) - (Number(a.total_score) || 0);
}

function resolveRequestedBusinessCountFromQuery(query: string): number | null {
  const topMatch = query.toLowerCase().match(/\btop\s*(\d{1,2})\b/);
  if (topMatch) {
    const value = Number(topMatch[1]);
    if (Number.isFinite(value) && value > 0) return Math.min(20, Math.max(1, value));
  }
  const frontMatch = query.match(/前\s*(\d{1,2})\s*(名|家|个|间|条)?/);
  if (frontMatch) {
    const value = Number(frontMatch[1]);
    if (Number.isFinite(value) && value > 0) return Math.min(20, Math.max(1, value));
  }
  const cnMatch = query.match(/(\d{1,2})\s*(家|个|间|条)/);
  if (cnMatch) {
    const value = Number(cnMatch[1]);
    if (Number.isFinite(value) && value > 0) return Math.min(20, Math.max(1, value));
  }
  return null;
}

async function searchBusinesses(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  keywords: string[],
  query: string,
  intent: HelperIntent,
  siteId?: string,
): Promise<SourceItem[]> {
  const businessFields =
    'id, slug, display_name, display_name_zh, short_desc_zh, ai_summary_zh, ai_tags, avg_rating, review_count, phone, address_full, is_featured, total_score';

  const results: AnyRow[] = [];
  const effectiveKeywords = keywords.filter((keyword) => !genericWords.has(keyword) && keyword.length > 1);
  const medicalSpecialtyTerms = getMedicalSpecialtyTerms(query);
  const relevanceKeywords = [
    ...new Set([
      ...(effectiveKeywords.length > 0 ? effectiveKeywords : keywords),
      ...medicalSpecialtyTerms,
    ]
      .map((item) => String(item || '').trim())
      .filter((item) => item.length >= 2)),
  ];
  const seenIds = new Set<string>();
  const categoryBizIds = new Set<string>();
  const cuisineAnchorBizIds = new Set<string>();
  const MAX_TERMS_ONLY_SIZE = 50;

  const addResults = (data: AnyRow[] | null | undefined) => {
    for (const business of data || []) {
      const id = String(business.id || '');
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      results.push(business);
    }
  };

  const { data: allBizCats } = await supabase
    .from('categories')
    .select('id, name_zh, slug, parent_id, search_terms')
    .eq('type', 'business')
    .eq('site_scope', 'zh');
  const cuisineAnchorProfile = intent === 'localRecommendation' ? getCuisineAnchorProfile(query) : null;

  const matchedCats: { cat: AnyRow; matchType: 'name' | 'terms' | 'anchor' }[] = [];
  for (const cat of (allBizCats || []) as AnyRow[]) {
    const nameZh = String(cat.name_zh || '');
    const terms = Array.isArray(cat.search_terms) ? cat.search_terms.map(String) : [];
    const anchorMatch = cuisineAnchorProfile ? categoryMatchesCuisineProfile(cat, cuisineAnchorProfile) : false;
    if (anchorMatch) {
      matchedCats.push({ cat, matchType: 'anchor' });
      continue;
    }

    for (const keyword of relevanceKeywords) {
      if (keyword.length < 2) continue;
      const nameMatch = nameZh && (nameZh.includes(keyword) || keyword.includes(nameZh));
      const termsMatch = terms.some((term) => term.includes(keyword) || (term.length >= 3 && keyword.includes(term)));
      if (nameMatch || termsMatch) {
        matchedCats.push({ cat, matchType: nameMatch ? 'name' : 'terms' });
        break;
      }
    }
  }

  if (matchedCats.length > 0) {
    const catIdsByMatch = new Map<string, 'name' | 'terms' | 'anchor'>();
    for (const { cat, matchType } of matchedCats) {
      catIdsByMatch.set(String(cat.id), matchType);
    }

    const parentMatches = matchedCats.filter((item) => !item.cat.parent_id);
    if (parentMatches.length > 0) {
      const { data: children } = await supabase
        .from('categories')
        .select('id, parent_id')
        .in('parent_id', parentMatches.map((item) => item.cat.id));

      for (const child of (children || []) as AnyRow[]) {
        const parentType = catIdsByMatch.get(String(child.parent_id));
        if (parentType) {
          catIdsByMatch.set(String(child.id), parentType);
        }
      }
    }

    const { data: allBizCatLinks } = await supabase
      .from('business_categories')
      .select('business_id, category_id')
      .in('category_id', [...catIdsByMatch.keys()]);

    const bizPerCat = new Map<string, string[]>();
    for (const link of (allBizCatLinks || []) as AnyRow[]) {
      const categoryId = String(link.category_id);
      const businessId = String(link.business_id);
      if (!bizPerCat.has(categoryId)) bizPerCat.set(categoryId, []);
      bizPerCat.get(categoryId)!.push(businessId);
    }

    const includedBizIds = new Set<string>();
    for (const [categoryId, matchType] of catIdsByMatch.entries()) {
      const businessList = bizPerCat.get(categoryId) || [];
      if (matchType === 'anchor' || matchType === 'name' || businessList.length <= MAX_TERMS_ONLY_SIZE) {
        businessList.forEach((id) => {
          includedBizIds.add(id);
          categoryBizIds.add(id);
          if (matchType === 'anchor') cuisineAnchorBizIds.add(id);
        });
      }
    }

    if (includedBizIds.size > 0) {
      let businessesQuery = supabase
        .from('businesses')
        .select(businessFields)
        .eq('is_active', true);

      if (siteId) businessesQuery = businessesQuery.eq('site_id', siteId);

      const { data } = await businessesQuery
        .in('id', [...includedBizIds].slice(0, 100))
        .order('total_score', { ascending: false, nullsFirst: false })
        .limit(30);

      addResults(data as AnyRow[] | undefined);
    }
  }

  for (const keyword of relevanceKeywords) {
    if (keyword.length < 2 || results.length >= 30) continue;
    let tagsQuery = supabase
      .from('businesses')
      .select(businessFields)
      .eq('is_active', true);
    if (siteId) tagsQuery = tagsQuery.eq('site_id', siteId);

    const { data } = await tagsQuery
      .contains('ai_tags', [keyword])
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(20);

    addResults(data as AnyRow[] | undefined);
  }

  {
    let textQuery = supabase
      .from('businesses')
      .select(businessFields)
      .eq('is_active', true);
    if (siteId) textQuery = textQuery.eq('site_id', siteId);

    const { data } = await textQuery
      .or(buildBusinessOr(relevanceKeywords, ['display_name', 'display_name_zh', 'short_desc_zh', 'ai_summary_zh']))
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(30);

    addResults(data as AnyRow[] | undefined);
  }

  if (intent === 'localRecommendation' && isMedicalQuery(query) && medicalSpecialtyTerms.length > 0) {
    let medicalTextQuery = supabase
      .from('businesses')
      .select(businessFields)
      .eq('is_active', true);
    if (siteId) medicalTextQuery = medicalTextQuery.eq('site_id', siteId);
    const { data } = await medicalTextQuery
      .or(buildBusinessOr(medicalSpecialtyTerms, ['display_name', 'display_name_zh', 'short_desc_zh', 'ai_summary_zh']))
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(60);
    addResults(data as AnyRow[] | undefined);
  }

  if (intent === 'localRecommendation' && isBudgetMealQuery(query) && results.length < 40) {
    let budgetExpansionQuery = supabase
      .from('businesses')
      .select(businessFields)
      .eq('is_active', true);
    if (siteId) budgetExpansionQuery = budgetExpansionQuery.eq('site_id', siteId);
    const { data } = await budgetExpansionQuery
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(80);
    addResults(data as AnyRow[] | undefined);
  }

  if (intent === 'localRecommendation' && isRealEstateQuery(query) && results.length < 40) {
    const realEstateTerms = [
      '房产', '地产', '中介', '置业', '租房', '买房', '卖房', '物业',
      'real estate', 'realtor', 'realty', 'property', 'property management', 'leasing', 'rental',
    ];
    let realEstateQuery = supabase
      .from('businesses')
      .select(businessFields)
      .eq('is_active', true);
    if (siteId) realEstateQuery = realEstateQuery.eq('site_id', siteId);
    const { data } = await realEstateQuery
      .or(buildBusinessOr(realEstateTerms, ['display_name', 'display_name_zh', 'short_desc_zh', 'ai_summary_zh']))
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(80);
    addResults(data as AnyRow[] | undefined);
  }

  if (intent === 'localRecommendation' && isInsuranceQuery(query) && results.length < 40) {
    const insuranceTerms = [
      '保险', '保险经纪', '保单', '车险', '房屋险', '理赔', '保费',
      'insurance', 'broker', 'policy', 'claim', 'auto insurance', 'home insurance',
    ];
    let insuranceQuery = supabase
      .from('businesses')
      .select(businessFields)
      .eq('is_active', true);
    if (siteId) insuranceQuery = insuranceQuery.eq('site_id', siteId);
    const { data } = await insuranceQuery
      .or(buildBusinessOr(insuranceTerms, ['display_name', 'display_name_zh', 'short_desc_zh', 'ai_summary_zh']))
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(80);
    addResults(data as AnyRow[] | undefined);
  }

  if (intent === 'localRecommendation' && isEducationQuery(query) && results.length < 40) {
    const educationTerms = isEducationAcademicHardQuery(query)
      ? [
        'sat', 'act', 'toefl', 'ielts', 'ap', 'ib', 'test prep',
        '补习', '课后班', '升学', '标化', 'k-12', '家教', '辅导', 'academy', 'tutor',
      ]
      : isArtsEducationQuery(query)
      ? [
        '舞蹈', '音乐', '美术', '绘画', '钢琴', '小提琴', '声乐', '芭蕾',
        'dance', 'music', 'art', 'piano', 'violin', 'ballet',
      ]
      : isAcademicEducationQuery(query)
        ? [
          '教育', '培训', '补习', '课后班', '升学', '留学', '家教',
          'academy', 'tutor', 'test prep', 'sat', 'act', 'toefl', 'ielts', 'ap', 'ib', 'k-12',
        ]
        : [
      '教育', '培训', '补习', '课后班', '升学', '留学', '家教', '托管',
      'academy', 'tutor', 'test prep', 'sat', 'act', 'toefl', 'ielts', 'after school', 'education',
      ];
    let educationQuery = supabase
      .from('businesses')
      .select(businessFields)
      .eq('is_active', true);
    if (siteId) educationQuery = educationQuery.eq('site_id', siteId);
    const { data } = await educationQuery
      .or(buildBusinessOr(educationTerms, ['display_name', 'display_name_zh', 'short_desc_zh', 'ai_summary_zh']))
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(80);
    addResults(data as AnyRow[] | undefined);
  }

  if (intent === 'localRecommendation' && isRetailQuery(query) && results.length < 40) {
    const retailTerms = [
      '购物', '零售', '商店', '店铺', '超市', '百货', '礼品', '美妆', '护肤', '服装',
      'retail', 'shop', 'store', 'mall', 'market', 'supermarket', 'grocery',
    ];
    let retailQuery = supabase
      .from('businesses')
      .select(businessFields)
      .eq('is_active', true);
    if (siteId) retailQuery = retailQuery.eq('site_id', siteId);
    const { data } = await retailQuery
      .or(buildBusinessOr(retailTerms, ['display_name', 'display_name_zh', 'short_desc_zh', 'ai_summary_zh']))
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(80);
    addResults(data as AnyRow[] | undefined);
  }

  if (intent === 'localRecommendation' && isHomeImprovementQuery(query) && results.length < 40) {
    const homeTerms = [
      '装修', '家居', '家具', '建材', '家装', '橱柜', '地板', '瓷砖', '卫浴', '灯具', '窗帘',
      'renovation', 'home improvement', 'furniture', 'interior', 'cabinet', 'flooring', 'tile',
    ];
    let homeQuery = supabase
      .from('businesses')
      .select(businessFields)
      .eq('is_active', true);
    if (siteId) homeQuery = homeQuery.eq('site_id', siteId);
    const { data } = await homeQuery
      .or(buildBusinessOr(homeTerms, ['display_name', 'display_name_zh', 'short_desc_zh', 'ai_summary_zh']))
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(80);
    addResults(data as AnyRow[] | undefined);
  }

  if (intent === 'localRecommendation' && isAutoServiceQuery(query) && results.length < 40) {
    const autoTerms = [
      '汽车', '修车', '维修', '保养', '车行', '轮胎', '机油', '刹车', '钣金', '喷漆', '洗车', '拖车', '年检',
      'auto', 'car repair', 'mechanic', 'body shop', 'tire', 'oil change', 'inspection',
    ];
    let autoQuery = supabase
      .from('businesses')
      .select(businessFields)
      .eq('is_active', true);
    if (siteId) autoQuery = autoQuery.eq('site_id', siteId);
    const { data } = await autoQuery
      .or(buildBusinessOr(autoTerms, ['display_name', 'display_name_zh', 'short_desc_zh', 'ai_summary_zh']))
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(80);
    addResults(data as AnyRow[] | undefined);
  }

  if (intent === 'localRecommendation' && isTaxServiceQuery(query) && results.length < 40) {
    const taxTerms = [
      '报税', '税务', '会计', '记账', '退税', '审计',
      'cpa', 'tax', 'accounting', 'bookkeeping', 'payroll', 'irs',
    ];
    let taxQuery = supabase
      .from('businesses')
      .select(businessFields)
      .eq('is_active', true);
    if (siteId) taxQuery = taxQuery.eq('site_id', siteId);
    const { data } = await taxQuery
      .or(buildBusinessOr(taxTerms, ['display_name', 'display_name_zh', 'short_desc_zh', 'ai_summary_zh']))
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(80);
    addResults(data as AnyRow[] | undefined);
  }

  if (intent === 'localRecommendation' && isBeautyWellnessQuery(query) && results.length < 40) {
    const beautyTerms = [
      '美容', '护肤', '皮肤管理', '面部护理', '养生', '按摩', '头疗', '足疗', '医美',
      'spa', 'wellness', 'facial', 'skincare', 'beauty', 'med spa', 'massage', 'head spa',
    ];
    let beautyQuery = supabase
      .from('businesses')
      .select(businessFields)
      .eq('is_active', true);
    if (siteId) beautyQuery = beautyQuery.eq('site_id', siteId);
    const { data } = await beautyQuery
      .or(buildBusinessOr(beautyTerms, ['display_name', 'display_name_zh', 'short_desc_zh', 'ai_summary_zh']))
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(80);
    addResults(data as AnyRow[] | undefined);
  }

  if (intent === 'localRecommendation' && isTravelAgencyQuery(query) && results.length < 40) {
    const travelTerms = [
      '旅行社', '旅游', '机票', '跟团', '自由行', '签证代办',
      'travel agency', 'tour', 'travel', 'flight booking', 'vacation package', 'ticketing',
    ];
    let travelQuery = supabase
      .from('businesses')
      .select(businessFields)
      .eq('is_active', true);
    if (siteId) travelQuery = travelQuery.eq('site_id', siteId);
    const { data } = await travelQuery
      .or(buildBusinessOr(travelTerms, ['display_name', 'display_name_zh', 'short_desc_zh', 'ai_summary_zh']))
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(80);
    addResults(data as AnyRow[] | undefined);
  }

  if (intent === 'localRecommendation' && isPrintDesignQuery(query) && results.length < 40) {
    const printTerms = [
      '印刷', '设计', '海报', '名片', '喷绘', '标牌', '招牌', '横幅',
      'printing', 'design', 'sign', 'banner', 'graphic', 'business card', 'logo',
    ];
    let printQuery = supabase
      .from('businesses')
      .select(businessFields)
      .eq('is_active', true);
    if (siteId) printQuery = printQuery.eq('site_id', siteId);
    const { data } = await printQuery
      .or(buildBusinessOr(printTerms, ['display_name', 'display_name_zh', 'short_desc_zh', 'ai_summary_zh']))
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(80);
    addResults(data as AnyRow[] | undefined);
  }

  const matchedLocationLabels = getMatchedLocationLabels(`${query} ${relevanceKeywords.join(' ')}`);

  const anchorTerms = getQueryAnchorTerms(query);
  const cuisineCategoryFilteredResults =
    intent === 'localRecommendation' && cuisineAnchorProfile
      ? results.filter((business) => {
          const businessId = String(business.id || '');
          if (!businessId || !cuisineAnchorBizIds.has(businessId)) return false;
          const strictSlugMode = (cuisineAnchorProfile.strictCategorySlugs || []).length > 0;
          if (!businessMatchesCuisineBoundary(business, cuisineAnchorProfile)) return false;
          if (!strictSlugMode) return true;
          return businessMatchesAnchorTerms(business, cuisineAnchorProfile.anchorTerms);
        })
      : [];
  const cuisineTextFilteredResults =
    intent === 'localRecommendation' && cuisineAnchorProfile
      ? results.filter(
          (business) =>
            businessMatchesAnchorTerms(business, cuisineAnchorProfile.anchorTerms) &&
            businessMatchesCuisineBoundary(business, cuisineAnchorProfile),
        )
      : [];
  const cuisineHardFilteredResults =
    cuisineCategoryFilteredResults.length > 0 ? cuisineCategoryFilteredResults : cuisineTextFilteredResults;
  const anchorFilteredResults =
    intent === 'localRecommendation' && anchorTerms.length > 0
      ? results.filter((business) => businessMatchesAnchorTerms(business, anchorTerms))
      : [];
  const scopedResults =
    intent === 'localRecommendation' && cuisineAnchorProfile
      ? cuisineHardFilteredResults
      : anchorFilteredResults.length > 0
        ? anchorFilteredResults
        : results;
  const locationScopedResults =
    intent === 'localRecommendation' && matchedLocationLabels.length > 0
      ? scopedResults.filter((business) => businessMatchesLocation(business, matchedLocationLabels))
      : [];
  const recommendationPool =
    intent === 'localRecommendation' && matchedLocationLabels.length > 0
      ? (locationScopedResults.length > 0 ? locationScopedResults : scopedResults)
      : scopedResults;

  const tcmQuery = isTcmRankingQuery(query);
  const tcmStrictResults = tcmQuery ? recommendationPool.filter((business) => businessMatchesTcmBoundary(business)) : [];
  const tcmExcludedOnlyResults = tcmQuery
    ? recommendationPool.filter((business) => {
        const text = [
          String(business.display_name || ''),
          String(business.display_name_zh || ''),
          String(business.short_desc_zh || ''),
          String(business.ai_summary_zh || ''),
        ].join(' ').toLowerCase();
        return !['教育', '学校', 'academy', 'prep', 'tutoring', 'tutor', 'sat', 'act', 'college', '培训', '辅导', '课程', '家教']
          .some((term) => text.includes(term));
      })
    : [];
  let finalRecommendationPool = tcmQuery
    ? (tcmStrictResults.length > 0 ? tcmStrictResults : tcmExcludedOnlyResults)
    : recommendationPool;

  if (isDentalQuery(query)) {
    const strictDentalPool = finalRecommendationPool.filter((business) => businessMatchesDentalBoundary(business));
    if (strictDentalPool.length >= 3) {
      finalRecommendationPool = strictDentalPool;
    } else {
      // Keep fallback narrow: remove obvious non-medical and legal noise for dental queries.
      const relaxedDentalPool = finalRecommendationPool.filter((business) => {
        const haystack = [
          String(business.display_name || ''),
          String(business.display_name_zh || ''),
          String(business.short_desc_zh || ''),
          String(business.ai_summary_zh || ''),
        ]
          .join(' ')
          .toLowerCase();
        return !/(律师|lawyer|attorney|中医|针灸|acupuncture|herbal)/i.test(haystack);
      });
      if (relaxedDentalPool.length > 0) finalRecommendationPool = relaxedDentalPool;
    }

    const qualityDentalPool = finalRecommendationPool.filter((business) => Number(business.avg_rating || 0) >= 4);
    if (qualityDentalPool.length >= 3) finalRecommendationPool = qualityDentalPool;
  }

  if (isPediatricQuery(query)) {
    const strictPediatricPool = finalRecommendationPool.filter((business) => businessMatchesPediatricBoundary(business));
    if (strictPediatricPool.length >= 2) {
      finalRecommendationPool = strictPediatricPool;
    } else {
      const relaxedPediatricPool = finalRecommendationPool.filter((business) => {
        const haystack = [
          String(business.display_name || ''),
          String(business.display_name_zh || ''),
          String(business.short_desc_zh || ''),
          String(business.ai_summary_zh || ''),
        ]
          .join(' ')
          .toLowerCase();
        return !/(律师|lawyer|attorney|针灸|acupuncture|test prep|academy|牙医|dentist)/i.test(haystack);
      });
      if (relaxedPediatricPool.length > 0) finalRecommendationPool = relaxedPediatricPool;
    }
  }

  if (isDermatologyQuery(query)) {
    const strictDermPool = finalRecommendationPool.filter((business) => businessMatchesDermatologyBoundary(business));
    if (strictDermPool.length >= 2) {
      finalRecommendationPool = strictDermPool;
    } else {
      const supportiveDermPool = finalRecommendationPool.filter((business) => businessMatchesDermatologySupportive(business));
      if (supportiveDermPool.length > 0) finalRecommendationPool = supportiveDermPool;
    }
  }

  if (isOphthalmologyQuery(query)) {
    const strictEyePool = finalRecommendationPool.filter((business) => businessMatchesOphthalmologyBoundary(business));
    if (strictEyePool.length >= 2) {
      finalRecommendationPool = strictEyePool;
    } else {
      const supportiveEyePool = finalRecommendationPool.filter((business) => businessMatchesOphthalmologySupportive(business));
      if (supportiveEyePool.length > 0) finalRecommendationPool = supportiveEyePool;
    }
  }

  if (isTrafficLawQuery(query)) {
    const strictTrafficPool = finalRecommendationPool.filter((business) => businessMatchesTrafficLawBoundary(business));
    if (strictTrafficPool.length >= 3) {
      finalRecommendationPool = strictTrafficPool;
    } else {
      const relaxedTrafficPool = finalRecommendationPool.filter((business) => {
        const text = [
          String(business.display_name || ''),
          String(business.display_name_zh || ''),
          String(business.short_desc_zh || ''),
          String(business.ai_summary_zh || ''),
        ]
          .join(' ')
          .toLowerCase();
        if (!/(律师|律所|律师楼|law firm|attorney|lawyer|法律)/i.test(text)) return false;
        if (/(移民|签证|绿卡|immigration|visa)/i.test(text)) return false;
        return /(车祸|交通事故|罚单|违章|traffic|ticket|accident|injury|dui|dwi)/i.test(text);
      });
      if (relaxedTrafficPool.length > 0) finalRecommendationPool = relaxedTrafficPool;
    }
  }

  if (isCriminalLawQuery(query)) {
    const strictCriminalPool = finalRecommendationPool.filter((business) => businessMatchesCriminalLawBoundary(business));
    if (strictCriminalPool.length >= 3) {
      finalRecommendationPool = strictCriminalPool;
    } else {
      const relaxedCriminalPool = finalRecommendationPool.filter((business) => {
        const text = [
          String(business.display_name || ''),
          String(business.display_name_zh || ''),
          String(business.short_desc_zh || ''),
          String(business.ai_summary_zh || ''),
        ]
          .join(' ')
          .toLowerCase();
        if (!/(律师|律所|律师楼|law firm|attorney|lawyer|法律)/i.test(text)) return false;
        if (/(移民|签证|绿卡|immigration|visa)/i.test(text)) return false;
        return /(刑事|刑辩|保释|拘留|逮捕|criminal|defense|dui|dwi)/i.test(text);
      });
      if (relaxedCriminalPool.length > 0) finalRecommendationPool = relaxedCriminalPool;
    }
  }

  if (isImmigrationLawQuery(query)) {
    const strictImmPool = finalRecommendationPool.filter((business) => businessMatchesImmigrationLawBoundary(business));
    if (strictImmPool.length >= 3) {
      finalRecommendationPool = strictImmPool;
    } else {
      const relaxedImmPool = finalRecommendationPool.filter((business) => {
        const text = [
          String(business.display_name || ''),
          String(business.display_name_zh || ''),
          String(business.short_desc_zh || ''),
          String(business.ai_summary_zh || ''),
        ]
          .join(' ')
          .toLowerCase();
        if (!/(律师|律所|律师楼|law firm|attorney|lawyer|法律)/i.test(text)) return false;
        if (/(车祸|交通事故|罚单|ticket|traffic|刑事|criminal|dui|dwi|离婚|family law|遗产|estate)/i.test(text)) return false;
        return true;
      });
      if (relaxedImmPool.length > 0) finalRecommendationPool = relaxedImmPool;
    }
  }

  if (isRealEstateQuery(query)) {
    const strictRealEstatePool = finalRecommendationPool.filter((business) => businessMatchesRealEstateBoundary(business));
    if (strictRealEstatePool.length >= 3) {
      finalRecommendationPool = strictRealEstatePool;
    } else {
      const relaxedRealEstatePool = finalRecommendationPool.filter((business) => {
        const text = [
          String(business.display_name || ''),
          String(business.display_name_zh || ''),
          String(business.short_desc_zh || ''),
          String(business.ai_summary_zh || ''),
        ].join(' ').toLowerCase();
        if (/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|school|academy|park|library)/i.test(text)) return false;
        return /(房产|地产|中介|real estate|realtor|realty|property|租房|买房|卖房|置业|物业|management|leasing|rental)/i.test(text);
      });
      if (relaxedRealEstatePool.length > 0) finalRecommendationPool = relaxedRealEstatePool;
    }
  }

  if (isInsuranceQuery(query)) {
    const strictInsurancePool = finalRecommendationPool.filter((business) => businessMatchesInsuranceBoundary(business));
    if (strictInsurancePool.length >= 3) {
      finalRecommendationPool = strictInsurancePool;
    } else {
      const relaxedInsurancePool = finalRecommendationPool.filter((business) => {
        const text = [
          String(business.display_name || ''),
          String(business.display_name_zh || ''),
          String(business.short_desc_zh || ''),
          String(business.ai_summary_zh || ''),
        ].join(' ').toLowerCase();
        if (/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|school|academy|park|library)/i.test(text)) return false;
        return /(保险|insurance|broker|policy|claim|理赔|保单|车险|房屋险|保费)/i.test(text);
      });
      if (relaxedInsurancePool.length > 0) finalRecommendationPool = relaxedInsurancePool;
    }
  }

  if (isEducationQuery(query)) {
    const strictEducationPool = isEducationAcademicHardQuery(query)
      ? finalRecommendationPool.filter((business) => businessMatchesAcademicEducationHardBoundary(business))
      : isArtsEducationQuery(query)
      ? finalRecommendationPool.filter((business) => businessMatchesArtsEducationBoundary(business))
      : isAcademicEducationQuery(query)
        ? finalRecommendationPool.filter((business) => businessMatchesAcademicEducationBoundary(business))
        : finalRecommendationPool.filter((business) => businessMatchesEducationBoundary(business));
    if (isEducationAcademicHardQuery(query)) {
      // Hard mode: never relax to non-academic candidates.
      finalRecommendationPool = strictEducationPool;
    } else if (strictEducationPool.length >= 3) {
      finalRecommendationPool = strictEducationPool;
    } else {
      const relaxedEducationPool = finalRecommendationPool.filter((business) => {
        const text = [
          String(business.display_name || ''),
          String(business.display_name_zh || ''),
          String(business.short_desc_zh || ''),
          String(business.ai_summary_zh || ''),
        ].join(' ').toLowerCase();
        if (/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|保险|insurance|broker|property management|real estate|wedding|dance studio)/i.test(text)) return false;
        return isArtsEducationQuery(query)
          ? /(舞蹈|音乐|美术|绘画|钢琴|小提琴|芭蕾|dance|music|art|piano|violin|ballet)/i.test(text)
          : /(教育|培训|补习|课后班|升学|留学|academy|tutor|test prep|sat|act|toefl|ielts|after school)/i.test(text);
      });
      if (relaxedEducationPool.length > 0) finalRecommendationPool = relaxedEducationPool;
    }

    const hardenedEducationPool = finalRecommendationPool.filter((business) => {
      const text = [
        String(business.display_name || ''),
        String(business.display_name_zh || ''),
        String(business.short_desc_zh || ''),
        String(business.ai_summary_zh || ''),
      ].join(' ').toLowerCase();
      const nonEducationNoise = /(奶茶|tea|boba|restaurant|cafe|自拍|self-portrait|studio|图书馆|library|公园|park|婚礼|wedding|摄影|驾校|driving school|road test|dmv|沙龙|salon|barber|hair|nail|武术|跆拳道|martial|taekwondo|chiropractic|wellness|clinic|medical|therapy|儿科|牙科|dentist|hospital)/i;
      if (nonEducationNoise.test(text)) return false;
      if (isArtsEducationQuery(query)) {
        const danceIntent = /(舞蹈|dance|芭蕾|ballet)/i.test(query);
        return danceIntent
          ? /(舞蹈|dance|芭蕾|ballet)/i.test(text)
          : /(舞蹈|音乐|美术|绘画|钢琴|小提琴|芭蕾|dance|music|art|piano|violin|ballet)/i.test(text);
      }
      if (isAcademicEducationQuery(query)) {
        if (isEducationAcademicHardQuery(query)) {
          return /(sat|act|toefl|ielts|ap|ib|test prep|补习|课后班|升学|标化|k-12|家教|辅导)/i.test(text);
        }
        return /(补习|课后班|升学|sat|act|toefl|ielts|test prep|academy|tutor|k-12|教育|培训)/i.test(text);
      }
      return /(教育|培训|补习|课后班|academy|tutor|test prep|sat|act|toefl|ielts|dance|music|art)/i.test(text);
    });
    if (hardenedEducationPool.length > 0) finalRecommendationPool = hardenedEducationPool;
  }

  if (isRetailQuery(query)) {
    const strictRetailPool = finalRecommendationPool.filter((business) =>
      businessMatchesRetailBoundary(business) && businessMatchesRetailSubtypeBoundary(business, query)
    );
    if (strictRetailPool.length >= 3 || isRetailStrictQuery(query)) {
      finalRecommendationPool = strictRetailPool;
    } else {
      const relaxedRetailPool = finalRecommendationPool.filter((business) => {
        const text = [
          String(business.display_name || ''),
          String(business.display_name_zh || ''),
          String(business.short_desc_zh || ''),
          String(business.ai_summary_zh || ''),
        ].join(' ').toLowerCase();
        if (/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|保险|insurance|broker|real estate|realtor|academy|test prep)/i.test(text)) return false;
        return /(购物|零售|商店|超市|retail|shop|store|mall|market|grocery|supermarket)/i.test(text);
      });
      if (relaxedRetailPool.length > 0) finalRecommendationPool = relaxedRetailPool;
    }
  }

  if (isHomeImprovementQuery(query)) {
    const strictHomePool = finalRecommendationPool.filter((business) =>
      businessMatchesHomeImprovementBoundary(business) && businessMatchesHomeSubtypeBoundary(business, query)
    );
    if (strictHomePool.length >= 3 || isHomeStrictQuery(query)) {
      finalRecommendationPool = strictHomePool;
    } else {
      const relaxedHomePool = finalRecommendationPool.filter((business) => {
        const text = [
          String(business.display_name || ''),
          String(business.display_name_zh || ''),
          String(business.short_desc_zh || ''),
          String(business.ai_summary_zh || ''),
        ].join(' ').toLowerCase();
        if (/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|保险|insurance|broker|real estate|realtor|academy|test prep|clinic|medical|noodle|food|anime|club|society|association)/i.test(text)) return false;
        return /(装修|家居|家具|建材|家装|renovation|home improvement|furniture|interior|cabinet|flooring|tile)/i.test(text);
      });
      if (relaxedHomePool.length > 0) finalRecommendationPool = relaxedHomePool;
    }
  }

  if (isAutoServiceQuery(query)) {
    const strictAutoPool = finalRecommendationPool.filter((business) =>
      businessMatchesAutoBoundary(business) && businessMatchesAutoSubtypeBoundary(business, query)
    );
    if (strictAutoPool.length >= 3 || isAutoStrictQuery(query)) {
      finalRecommendationPool = strictAutoPool;
    } else {
      const relaxedAutoPool = finalRecommendationPool.filter((business) => {
        const text = [
          String(business.display_name || ''),
          String(business.display_name_zh || ''),
          String(business.short_desc_zh || ''),
          String(business.ai_summary_zh || ''),
        ].join(' ').toLowerCase();
        if (/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|保险|insurance|broker|real estate|realtor|academy|test prep|clinic|medical)/i.test(text)) return false;
        const hasAutoQualifier = /(汽车|auto|car|车行|mechanic|body shop|轮胎|机油|刹车|钣金|喷漆|年检)/i.test(text);
        const hasService = /(修车|维修|保养|洗车|拖车|repair|service|oil change|inspection|collision|paint)/i.test(text);
        return hasAutoQualifier && hasService;
      });
      if (relaxedAutoPool.length > 0) finalRecommendationPool = relaxedAutoPool;
    }
  }

  if (isTaxServiceQuery(query)) {
    const strictTaxPool = finalRecommendationPool.filter((business) =>
      businessMatchesTaxBoundary(business) && businessMatchesTaxSubtypeBoundary(business, query)
    );
    if (strictTaxPool.length >= 3) {
      finalRecommendationPool = strictTaxPool;
    } else {
      const relaxedTaxPool = finalRecommendationPool.filter((business) => {
        const text = [
          String(business.display_name || ''),
          String(business.display_name_zh || ''),
          String(business.short_desc_zh || ''),
          String(business.ai_summary_zh || ''),
        ].join(' ').toLowerCase();
        if (/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|保险|insurance|broker|real estate|realtor|academy|test prep|clinic|medical)/i.test(text)) return false;
        return /(报税|税务|会计|记账|cpa|tax|accounting|bookkeeping|payroll|irs|refund)/i.test(text);
      });
      if (relaxedTaxPool.length > 0) finalRecommendationPool = relaxedTaxPool;
    }
  }

  if (isBeautyWellnessQuery(query)) {
    const strictBeautyPool = finalRecommendationPool.filter((business) =>
      businessMatchesBeautyWellnessBoundary(business) && businessMatchesBeautyWellnessSubtypeBoundary(business, query)
    );
    if (strictBeautyPool.length >= 3 || isBeautyWellnessStrictQuery(query)) {
      finalRecommendationPool = strictBeautyPool;
    } else {
      const relaxedBeautyPool = finalRecommendationPool.filter((business) => {
        const text = [
          String(business.display_name || ''),
          String(business.display_name_zh || ''),
          String(business.short_desc_zh || ''),
          String(business.ai_summary_zh || ''),
        ].join(' ').toLowerCase();
        if (/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|保险|insurance|broker|real estate|realtor|academy|test prep|tax|accounting|bookkeeping|auto repair|mechanic)/i.test(text)) return false;
        return /(美容|护肤|皮肤管理|面部护理|养生|按摩|头疗|足疗|医美|spa|wellness|facial|skincare|beauty|med spa|massage|head spa)/i.test(text);
      });
      if (relaxedBeautyPool.length > 0) finalRecommendationPool = relaxedBeautyPool;
    }
  }

  if (isTravelAgencyQuery(query)) {
    const strictTravelPool = finalRecommendationPool.filter((business) =>
      businessMatchesTravelAgencyBoundary(business) && businessMatchesTravelAgencySubtypeBoundary(business, query)
    );
    if (strictTravelPool.length >= 3 || isTravelAgencyStrictQuery(query)) {
      finalRecommendationPool = strictTravelPool;
    } else {
      const relaxedTravelPool = finalRecommendationPool.filter((business) => {
        const text = [
          String(business.display_name || ''),
          String(business.display_name_zh || ''),
          String(business.short_desc_zh || ''),
          String(business.ai_summary_zh || ''),
        ].join(' ').toLowerCase();
        if (/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|保险|insurance|broker|real estate|realtor|academy|test prep|tax|accounting|bookkeeping|auto repair|mechanic)/i.test(text)) return false;
        return /(旅行社|旅游|机票|跟团|自由行|签证代办|travel agency|tour|travel|flight booking|vacation package|ticketing)/i.test(text);
      });
      if (relaxedTravelPool.length > 0) finalRecommendationPool = relaxedTravelPool;
    }
  }

  if (isPrintDesignQuery(query)) {
    const strictPrintPool = finalRecommendationPool.filter((business) =>
      businessMatchesPrintDesignBoundary(business) && businessMatchesPrintDesignSubtypeBoundary(business, query)
    );
    if (strictPrintPool.length >= 3 || isPrintDesignStrictQuery(query)) {
      finalRecommendationPool = strictPrintPool;
    } else {
      const relaxedPrintPool = finalRecommendationPool.filter((business) => {
        const text = [
          String(business.display_name || ''),
          String(business.display_name_zh || ''),
          String(business.short_desc_zh || ''),
          String(business.ai_summary_zh || ''),
        ].join(' ').toLowerCase();
        if (/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|保险|insurance|broker|real estate|realtor|academy|test prep|tax|accounting|bookkeeping|auto repair|mechanic)/i.test(text)) return false;
        return /(印刷|设计|海报|名片|喷绘|标牌|招牌|横幅|printing|design|sign|banner|graphic|business card|logo)/i.test(text);
      });
      if (relaxedPrintPool.length > 0) finalRecommendationPool = relaxedPrintPool;
    }
  }

  if (isRestaurantQuery(query)) {
    const relaxedRestaurantPool = finalRecommendationPool.filter((business) => isRelaxedRestaurantCandidate(business, query));
    if (isBudgetMealQuery(query)) {
      if (relaxedRestaurantPool.length > 0) finalRecommendationPool = relaxedRestaurantPool;
    } else {
      const strictRestaurantPool = finalRecommendationPool.filter((business) => businessMatchesRestaurantBoundary(business));
      if (strictRestaurantPool.length >= 3) {
        finalRecommendationPool = strictRestaurantPool;
      } else if (relaxedRestaurantPool.length > 0) {
        finalRecommendationPool = relaxedRestaurantPool;
      }
    }
  }

  // Generic Sichuan requests should not be dominated by hotpot unless explicitly requested.
  if (cuisineAnchorProfile?.key === 'sichuan' && !isExplicitHotpotIntent(query)) {
    const noHotpotPool = finalRecommendationPool.filter((business) => {
      const text = [
        String(business.display_name || ''),
        String(business.display_name_zh || ''),
        String(business.short_desc_zh || ''),
        String(business.ai_summary_zh || ''),
      ].join(' ');
      return !/(火锅|hot\s*pot|hotpot|shabu|涮)/i.test(text);
    });
    if (noHotpotPool.length >= 3) finalRecommendationPool = noHotpotPool;
  }

  if (isSushiIntent(query)) {
    const strictSushiPool = finalRecommendationPool.filter((business) => hasSushiSignals(business));
    if (strictSushiPool.length >= 3) finalRecommendationPool = strictSushiPool;
  }

  // Restaurant fallback: if query is restaurant-like but candidates are too few,
  // backfill from broader in-area candidates while keeping non-restaurant noise out.
  if (isRestaurantQuery(query) && finalRecommendationPool.length > 0 && finalRecommendationPool.length < 5) {
    const fallbackPoolRaw =
      matchedLocationLabels.length > 0
        ? results.filter((business) => businessMatchesLocation(business, matchedLocationLabels))
        : results;
    const fallbackPool = fallbackPoolRaw.filter((business) => isRelaxedRestaurantCandidate(business, query));
    const seen = new Set(finalRecommendationPool.map((b) => String(b.id || '')));
    const additions = fallbackPool.filter((b) => {
      const id = String(b.id || '');
      return id && !seen.has(id);
    });
    if (additions.length > 0) {
      finalRecommendationPool = [...finalRecommendationPool, ...additions].slice(0, 10);
    }
  }

  // If user explicitly asks for N businesses, try to fill toward N using broader scoped pool.
  // Keep this only for recommendation intent and never exceed current retrieval boundary.
  const requestedCount = resolveRequestedBusinessCountFromQuery(query);
  const targetCount = Math.max(5, Math.min(10, requestedCount || 10));
  if (
    intent === 'localRecommendation' &&
    finalRecommendationPool.length > 0 &&
    finalRecommendationPool.length < targetCount &&
    (matchedLocationLabels.length > 0 ? locationScopedResults.length : scopedResults.length) > finalRecommendationPool.length
  ) {
    const rawExpansionPool = matchedLocationLabels.length > 0 ? locationScopedResults : scopedResults;
    const strictExpansionPool = isDermatologyQuery(query)
      ? rawExpansionPool.filter((business) => (
          businessMatchesDermatologyBoundary(business) || businessMatchesDermatologySupportive(business)
        ))
      : isTrafficLawQuery(query)
        ? rawExpansionPool.filter((business) => businessMatchesTrafficLawBoundary(business))
      : isCriminalLawQuery(query)
        ? rawExpansionPool.filter((business) => businessMatchesCriminalLawBoundary(business))
      : isImmigrationLawQuery(query)
        ? rawExpansionPool.filter((business) => businessMatchesImmigrationLawBoundary(business))
      : isRealEstateQuery(query)
        ? rawExpansionPool.filter((business) => businessMatchesRealEstateBoundary(business))
      : isInsuranceQuery(query)
        ? rawExpansionPool.filter((business) => businessMatchesInsuranceBoundary(business))
      : isEducationQuery(query)
        ? isEducationAcademicHardQuery(query)
          ? rawExpansionPool.filter((business) => businessMatchesAcademicEducationHardBoundary(business))
          : isArtsEducationQuery(query)
          ? rawExpansionPool.filter((business) => businessMatchesArtsEducationBoundary(business))
          : isAcademicEducationQuery(query)
            ? rawExpansionPool.filter((business) => businessMatchesAcademicEducationBoundary(business))
            : rawExpansionPool.filter((business) => businessMatchesEducationBoundary(business))
      : isRetailQuery(query)
        ? rawExpansionPool.filter((business) =>
          businessMatchesRetailBoundary(business) && businessMatchesRetailSubtypeBoundary(business, query)
        )
      : isHomeImprovementQuery(query)
        ? rawExpansionPool.filter((business) =>
          businessMatchesHomeImprovementBoundary(business) && businessMatchesHomeSubtypeBoundary(business, query)
        )
      : isAutoServiceQuery(query)
        ? rawExpansionPool.filter((business) =>
          businessMatchesAutoBoundary(business) && businessMatchesAutoSubtypeBoundary(business, query)
        )
      : isTaxServiceQuery(query)
        ? rawExpansionPool.filter((business) =>
          businessMatchesTaxBoundary(business) && businessMatchesTaxSubtypeBoundary(business, query)
        )
      : isBeautyWellnessQuery(query)
        ? rawExpansionPool.filter((business) =>
          businessMatchesBeautyWellnessBoundary(business) && businessMatchesBeautyWellnessSubtypeBoundary(business, query)
        )
      : isTravelAgencyQuery(query)
        ? rawExpansionPool.filter((business) =>
          businessMatchesTravelAgencyBoundary(business) && businessMatchesTravelAgencySubtypeBoundary(business, query)
        )
      : isPrintDesignQuery(query)
        ? rawExpansionPool.filter((business) =>
          businessMatchesPrintDesignBoundary(business) && businessMatchesPrintDesignSubtypeBoundary(business, query)
        )
      : isOphthalmologyQuery(query)
        ? rawExpansionPool.filter((business) => (
            businessMatchesOphthalmologyBoundary(business) || businessMatchesOphthalmologySupportive(business)
          ))
      : isPediatricQuery(query)
      ? rawExpansionPool.filter((business) => businessMatchesPediatricBoundary(business))
      : isDentalQuery(query)
      ? rawExpansionPool.filter((business) => businessMatchesDentalBoundary(business))
      : isSushiIntent(query)
      ? rawExpansionPool.filter((business) => hasSushiSignals(business))
      : isRestaurantQuery(query)
        ? rawExpansionPool.filter((business) => businessMatchesRestaurantBoundary(business))
        : rawExpansionPool;
    const relaxedExpansionPool =
      isDermatologyQuery(query) ||
      isOphthalmologyQuery(query) ||
      isPediatricQuery(query) ||
      isImmigrationLawQuery(query) ||
      isTrafficLawQuery(query) ||
      isCriminalLawQuery(query) ||
      isRealEstateQuery(query) ||
      isInsuranceQuery(query) ||
      isEducationQuery(query) ||
      isRetailQuery(query) ||
      isHomeImprovementQuery(query) ||
      isAutoServiceQuery(query) ||
      isTaxServiceQuery(query) ||
      isBeautyWellnessQuery(query) ||
      isTravelAgencyQuery(query) ||
      isPrintDesignQuery(query)
      ? strictExpansionPool
      : isDentalQuery(query)
      ? strictExpansionPool
      : isSushiIntent(query)
      ? strictExpansionPool
      : isRestaurantQuery(query)
        ? rawExpansionPool.filter((business) => isRelaxedRestaurantCandidate(business, query))
        : rawExpansionPool;
    const seen = new Set(finalRecommendationPool.map((b) => String(b.id || '')));
    const strictExpansion = strictExpansionPool.filter((b) => {
      const id = String(b.id || '');
      return id && !seen.has(id);
    });
    for (const item of strictExpansion) seen.add(String(item.id || ''));
    const relaxedExpansion = relaxedExpansionPool.filter((b) => {
      const id = String(b.id || '');
      return id && !seen.has(id);
    });
    finalRecommendationPool = [...finalRecommendationPool, ...strictExpansion, ...relaxedExpansion].slice(0, targetCount);
  }

  if (intent === 'localRecommendation' && isBudgetMealQuery(query) && finalRecommendationPool.length > 0 && finalRecommendationPool.length < targetCount) {
    const budgetFallbackPool = results.filter((business) => {
      if (matchedLocationLabels.length > 0 && !businessMatchesLocation(business, matchedLocationLabels)) return false;
      return isRelaxedRestaurantCandidate(business, query);
    });
    const seen = new Set(finalRecommendationPool.map((b) => String(b.id || '')));
    const additions = budgetFallbackPool.filter((business) => {
      const id = String(business.id || '');
      return id && !seen.has(id);
    });
    if (additions.length > 0) {
      finalRecommendationPool = [...finalRecommendationPool, ...additions].slice(0, targetCount);
    }
  }

  if (intent === 'localRecommendation' && isMedicalQuery(query) && finalRecommendationPool.length > 1) {
    const seenMedicalFacility = new Set<string>();
    finalRecommendationPool = finalRecommendationPool.filter((business) => {
      const phone = String(business.phone || '').replace(/[^0-9]/g, '');
      const address = String(business.address_full || '')
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '')
        .slice(0, 64);
      const key = `${phone}|${address}`;
      if (key === '|' || key.length < 6) return true;
      if (seenMedicalFacility.has(key)) return false;
      seenMedicalFacility.add(key);
      return true;
    });
  }

  finalRecommendationPool.sort((a, b) => {
    const aText = [a.display_name_zh, a.display_name, a.short_desc_zh, a.ai_summary_zh].filter(Boolean).join(' ');
    const bText = [b.display_name_zh, b.display_name, b.short_desc_zh, b.ai_summary_zh].filter(Boolean).join(' ');
    const aHasKeyword = relevanceKeywords.some((keyword) => aText.includes(keyword));
    const bHasKeyword = relevanceKeywords.some((keyword) => bText.includes(keyword));
    const aInCategory = categoryBizIds.has(String(a.id));
    const bInCategory = categoryBizIds.has(String(b.id));
    const aLocationMatch = businessMatchesLocation(a, matchedLocationLabels);
    const bLocationMatch = businessMatchesLocation(b, matchedLocationLabels);
    const aTier = aHasKeyword ? 0 : aInCategory ? 1 : 2;
    const bTier = bHasKeyword ? 0 : bInCategory ? 1 : 2;

    if (intent === 'localRecommendation') {
      const aCuisinePenalty = cuisineBoundaryPenalty(a, cuisineAnchorProfile);
      const bCuisinePenalty = cuisineBoundaryPenalty(b, cuisineAnchorProfile);
      if (aCuisinePenalty !== bCuisinePenalty) return aCuisinePenalty - bCuisinePenalty;
      const aSushiPenalty = sushiBoundaryPenalty(a, query);
      const bSushiPenalty = sushiBoundaryPenalty(b, query);
      if (aSushiPenalty !== bSushiPenalty) return aSushiPenalty - bSushiPenalty;
      // Final business ranking protocol: strict total_score DESC.
      // Relevance/location/cuisine are used in filtering stage above,
      // but recommendation order itself must follow DB fairness score.
      const qualityDiff = compareRecommendationQuality(a, b);
      if (qualityDiff !== 0) return qualityDiff;
      if (aLocationMatch !== bLocationMatch) return aLocationMatch ? -1 : 1;
    } else if (aTier !== bTier) {
      return aTier - bTier;
    }
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return (Number(b.total_score) || 0) - (Number(a.total_score) || 0);
  });

  // Keep recommendation order aligned with total_score protocol.
  // Do not reshuffle by data-completeness for recommendation intent.
  const rankedBusinesses = finalRecommendationPool;

  const finalBusinesses =
    intent === 'localRecommendation'
      ? rankedBusinesses.slice(0, 15)
      : rankedBusinesses.slice(0, 15);
  const topBusinessIds = finalBusinesses.slice(0, 8).map((business) => String(business.id));
  let reviewsByBiz: Record<string, string[]> = {};

  if (topBusinessIds.length > 0) {
    const { data: reviewData } = await supabase
      .from('reviews')
      .select('business_id, rating, body, google_author_name')
      .eq('status', 'approved')
      .in('business_id', topBusinessIds)
      .order('rating', { ascending: false })
      .limit(24);

    for (const review of (reviewData || []) as AnyRow[]) {
      const businessId = String(review.business_id || '');
      if (!businessId) continue;
      if (!reviewsByBiz[businessId]) reviewsByBiz[businessId] = [];
      if (reviewsByBiz[businessId].length >= 2) continue;
      const body = String(review.body || '').trim();
      if (!body) continue;
      const author = String(review.google_author_name || '用户');
      const rating = review.rating ? `${review.rating}星` : '';
      reviewsByBiz[businessId].push(`“${body.slice(0, 36)}”(${author}${rating ? `, ${rating}` : ''})`);
    }
  }

  return finalBusinesses.map((business) => ({
    type: '商家',
    title: getBusinessTitle(business),
    url: `/businesses/${String(business.slug || '')}`,
    snippet: toSnippet(
      business.short_desc_zh || business.ai_summary_zh,
      buildBusinessSnippet(business, reviewsByBiz[String(business.id)] || []),
    ),
    metadata: {
      totalScore: business.total_score || null,
      avgRating: business.avg_rating || null,
      reviewCount: business.review_count || null,
      phone: business.phone || null,
      address: business.address_full || null,
      displayName: business.display_name || null,
      displayNameZh: business.display_name_zh || null,
      briefDesc: business.short_desc_zh || business.ai_summary_zh || null,
      isFeatured: Boolean(business.is_featured),
      locationMatched: businessMatchesLocation(business, matchedLocationLabels),
      reviewSnippets: reviewsByBiz[String(business.id)] || [],
    },
  }));
}

async function searchArticles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  keywords: string[],
  verticals: string[],
  typeLabel: '新闻' | '指南',
  siteId?: string,
): Promise<SourceItem[]> {
  let query = supabase
    .from('articles')
    .select('slug, title_zh, title_en, ai_summary_zh, summary_zh, body_zh, content_vertical')
    .eq('editorial_status', 'published')
    .in('content_vertical', verticals);
  if (siteId) query = query.eq('site_id', siteId);

  const { data } = await query
    .or(buildOr(keywords, ['title_zh', 'title_en', 'ai_summary_zh', 'summary_zh', 'body_zh']))
    .limit(10);

  return ((data || []) as AnyRow[]).map((article) => ({
    type: typeLabel,
    title: String(article.title_zh || article.title_en || '未命名内容'),
    url: typeLabel === '新闻' ? `/news/${String(article.slug || '')}` : `/guides/${String(article.slug || '')}`,
    snippet: toSnippet(article.ai_summary_zh || article.summary_zh || article.body_zh),
  }));
}

async function searchForum(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  keywords: string[],
  siteId?: string,
): Promise<SourceItem[]> {
  let query = supabase
    .from('forum_threads')
    .select('slug, title, body, ai_summary_zh, categories:board_id(slug)')
    .eq('status', 'published');
  if (siteId) query = query.eq('site_id', siteId);

  const { data } = await query
    .or(buildOr(keywords, ['title', 'body', 'ai_summary_zh']))
    .limit(8);

  return ((data || []) as AnyRow[]).map((thread) => {
    const boardSlug =
      typeof thread.categories === 'object' && thread.categories && 'slug' in thread.categories
        ? String((thread.categories as AnyRow).slug || 'general')
        : 'general';

    return {
      type: '论坛',
      title: String(thread.title || '论坛帖子'),
      url: `/forum/${boardSlug}/${String(thread.slug || '')}`,
      snippet: toSnippet(thread.ai_summary_zh || thread.body),
    };
  });
}

async function searchDiscover(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  keywords: string[],
  siteId?: string,
): Promise<SourceItem[]> {
  const buildVoiceQuery = () => {
    let query = supabase
      .from('voice_posts')
      .select('slug, title, excerpt, ai_summary_zh')
      .eq('status', 'published');
    if (siteId) query = query.eq('site_id', siteId);
    return query;
  };

  const buildProfileQuery = () => {
    let query = supabase
      .from('profiles')
      .select('username, display_name, headline')
      .neq('profile_type', 'user');
    if (siteId) query = query.eq('site_id', siteId);
    return query;
  };

  const [posts, profiles] = await Promise.all([
    buildVoiceQuery()
      .or(buildOr(keywords, ['title', 'content', 'excerpt', 'ai_summary_zh']))
      .limit(6),
    buildProfileQuery()
      .or(buildOr(keywords, ['display_name', 'headline', 'username']))
      .limit(4),
  ]);

  return uniqueByUrl([
    ...((posts.data || []) as AnyRow[]).map((post) => ({
      type: '笔记',
      title: String(post.title || '社区笔记'),
      url: `/discover/${String(post.slug || '')}`,
      snippet: toSnippet(post.ai_summary_zh || post.excerpt),
    })),
    ...((profiles.data || []) as AnyRow[]).map((profile) => ({
      type: '达人',
      title: String(profile.display_name || profile.username || '本地达人'),
      url: `/discover/voices/${String(profile.username || '')}`,
      snippet: toSnippet(profile.headline),
    })),
  ]);
}

async function searchEvents(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  keywords: string[],
  siteId?: string,
): Promise<SourceItem[]> {
  let query = supabase
    .from('events')
    .select('slug, title_zh, title_en, summary_zh, venue_name')
    .eq('status', 'published');
  if (siteId) query = query.eq('site_id', siteId);

  const { data } = await query
    .or(buildOr(keywords, ['title_zh', 'title_en', 'summary_zh', 'venue_name']))
    .limit(6);

  return ((data || []) as AnyRow[]).map((event) => ({
    type: '活动',
    title: String(event.title_zh || event.title_en || '本地活动'),
    url: `/events/${String(event.slug || '')}`,
    snippet: toSnippet(event.summary_zh || event.venue_name),
  }));
}

export async function searchBaamContent(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  query: string;
  keywords: string[];
  intent: HelperIntent;
  siteId?: string;
}): Promise<RetrievalPayload> {
  const contentKeywords = [...new Set([params.query, ...params.keywords].map((item) => item.trim()).filter(Boolean))].slice(0, 6);
  const businessKeywords = [...new Set(params.keywords.map((item) => item.trim()).filter(Boolean))];
  const cuisineHardFilterApplied = params.intent === 'localRecommendation' && Boolean(getCuisineAnchorProfile(params.query));

  const [businesses, news, guides, forum, discover, events] = await Promise.all([
    searchBusinesses(
      params.supabase,
      businessKeywords.length > 0 ? businessKeywords : contentKeywords,
      params.query,
      params.intent,
      params.siteId,
    ),
    searchArticles(params.supabase, contentKeywords, ['news_alert', 'news_brief', 'news_explainer', 'news_roundup', 'news_community'], '新闻', params.siteId),
    searchArticles(params.supabase, contentKeywords, ['guide_howto', 'guide_checklist', 'guide_bestof', 'guide_comparison', 'guide_neighborhood', 'guide_seasonal', 'guide_resource', 'guide_scenario'], '指南', params.siteId),
    searchForum(params.supabase, contentKeywords, params.siteId),
    searchDiscover(params.supabase, contentKeywords, params.siteId),
    searchEvents(params.supabase, contentKeywords, params.siteId),
  ]);

  const businessTable =
    businesses.length > 0
      ? [
          '| 店名 | 评分 | 评价数 | 电话 | 地址 |',
          '| --- | --- | --- | --- | --- |',
          ...businesses.slice(0, 8).map((item) => {
            const rating = item.metadata?.avgRating ? String(item.metadata.avgRating) : '';
            const reviewCount = item.metadata?.reviewCount ? String(item.metadata.reviewCount) : '';
            const phone = item.metadata?.phone ? String(item.metadata.phone) : '';
            const address = item.metadata?.address ? String(item.metadata.address) : '';
            return `| ${item.title} | ${rating} | ${reviewCount} | ${phone} | ${address} |`;
          }),
        ].join('\n')
      : '';

  const businessDetailContext =
    businesses.length > 0
      ? `商家候选详情：\n${businesses
          .slice(0, 8)
          .map((item, index) => {
            const reasons = [
              item.metadata?.locationMatched ? '和用户提到的区域更匹配' : '',
              item.metadata?.isFeatured ? '平台精选' : '',
              item.metadata?.avgRating ? `评分${item.metadata.avgRating}` : '',
              item.metadata?.reviewCount ? `${item.metadata.reviewCount}条评价` : '',
            ]
              .filter(Boolean)
              .join('，');
            const reviewSnippets = Array.isArray(item.metadata?.reviewSnippets)
              ? (item.metadata?.reviewSnippets as string[]).join('；')
              : '';
            return `${index + 1}. ${item.title}
- 电话：${item.metadata?.phone || '暂无'}
- 地址：${item.metadata?.address || '暂无'}
- 推荐信号：${reasons || '暂无'}
- 简介：${item.snippet || '暂无'}
${reviewSnippets ? `- 用户评价：${reviewSnippets}` : ''}`;
          })
          .join('\n')}`
      : '';

  const fullContextBlocks = [
    businesses.length > 0
      ? `商家结果（按相关度和评分排序）：\n${businesses.map((item, index) => `${index + 1}. ${item.title} | ${item.snippet || ''} | ${item.url}`).join('\n')}${params.intent === 'localRecommendation' && businessTable ? `\n\n推荐表格候选：\n${businessTable}` : ''}${params.intent === 'localRecommendation' && businessDetailContext ? `\n\n${businessDetailContext}` : ''}`
      : '',
    guides.length > 0
      ? `指南结果：\n${guides.map((item) => `- ${item.title} | ${item.snippet || ''} | ${item.url}`).join('\n')}`
      : '',
    news.length > 0
      ? `新闻结果：\n${news.map((item) => `- ${item.title} | ${item.snippet || ''} | ${item.url}`).join('\n')}`
      : '',
    forum.length > 0
      ? `论坛结果：\n${forum.map((item) => `- ${item.title} | ${item.snippet || ''} | ${item.url}`).join('\n')}`
      : '',
    discover.length > 0
      ? `发现结果：\n${discover.map((item) => `- ${item.title} | ${item.snippet || ''} | ${item.url}`).join('\n')}`
      : '',
    events.length > 0
      ? `活动结果：\n${events.map((item) => `- ${item.title} | ${item.snippet || ''} | ${item.url}`).join('\n')}`
      : '',
  ].filter(Boolean);

  const contextBlocks =
    params.intent === 'localRecommendation'
      ? fullContextBlocks.filter((block) => block.startsWith('商家结果'))
      : fullContextBlocks;

  const sources = uniqueByUrl([
    ...businesses,
    ...guides,
    ...news,
    ...discover,
    ...forum,
    ...events,
  ]);

  return {
    sources,
    contextBlocks,
    businessCandidates: businesses.slice(0, 15),
    counts: {
      businesses: businesses.length,
      news: news.length,
      guides: guides.length,
      forum: forum.length,
      discover: discover.length,
      events: events.length,
      cuisineHardFilterApplied: cuisineHardFilterApplied ? 1 : 0,
    },
  };
}
