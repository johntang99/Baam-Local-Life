type AnyRow = Record<string, unknown>;

export type CuisineAnchorProfile = {
  key: string;
  queryTriggers: string[];
  categorySignals: string[];
  anchorTerms: string[];
  strictCategorySlugs?: string[];
  blockedCategorySlugs?: string[];
  requiredBusinessTerms?: string[];
  excludedBusinessTerms?: string[];
};

const queryIntentAnchors: Array<{ trigger: string[]; terms: string[] }> = [
  { trigger: ['火锅', 'hotpot', 'hot pot', '涮锅', '麻辣锅'], terms: ['火锅', 'hotpot', 'hot pot', '涮锅', '麻辣锅'] },
  { trigger: ['烧烤', '烤肉', 'bbq'], terms: ['烧烤', '烤肉', 'bbq', 'barbecue'] },
  { trigger: ['奶茶', '茶饮', 'bubble tea', 'boba'], terms: ['奶茶', '茶饮', 'boba', 'bubble tea'] },
  { trigger: ['川菜', '四川菜', 'sichuan'], terms: ['川菜', '四川', '四川菜', 'sichuan', '麻辣', '辣子'] },
  { trigger: ['湘菜', 'hunan'], terms: ['湘菜', 'hunan', '剁椒'] },
  { trigger: ['粤菜', '广东菜', 'cantonese'], terms: ['粤菜', '广东菜', 'cantonese', '烧腊', '点心'] },
  { trigger: ['东北菜', 'dongbei'], terms: ['东北菜', 'dongbei', '锅包肉', '地三鲜'] },
  { trigger: ['上海菜', '本帮菜', 'shanghai'], terms: ['上海菜', '本帮菜', 'shanghai', '小笼包', '生煎'] },
  { trigger: ['日料', '寿司', 'sushi', 'japanese'], terms: ['日料', '寿司', '刺身', 'sushi', 'japanese'] },
  { trigger: ['韩餐', '韩国菜', 'korean'], terms: ['韩餐', '韩国菜', 'korean', '韩式', '泡菜'] },
  { trigger: ['律师', 'lawyer', 'attorney'], terms: ['律师', 'lawyer', 'attorney', 'law firm'] },
  { trigger: ['驾校', '学车', 'driving school'], terms: ['驾校', '学车', 'driving school'] },
];

const cuisineAnchorProfiles: CuisineAnchorProfile[] = [
  {
    key: 'hotpot',
    queryTriggers: ['火锅', 'hotpot', 'hot pot', '涮锅', '麻辣锅'],
    categorySignals: ['火锅', 'hotpot', 'hot pot', '涮锅', '麻辣锅', '串串香'],
    anchorTerms: ['火锅', 'hotpot', 'hot pot', '涮锅', '麻辣锅', '串串', '牛油锅'],
    strictCategorySlugs: ['food-hotpot'],
    blockedCategorySlugs: ['food-dining', 'food-grocery', 'food-bakery'],
    requiredBusinessTerms: ['火锅', 'hotpot', 'hot pot', '涮', '锅底', '串串', '麻辣锅', 'shabu'],
  },
  {
    key: 'bbq',
    queryTriggers: ['烧烤', '烤肉', 'bbq', 'barbecue'],
    categorySignals: ['烧烤', '烤肉', 'bbq', 'barbecue', '串烧'],
    anchorTerms: ['烧烤', '烤肉', 'bbq', 'barbecue', '烤串', '串烧'],
    blockedCategorySlugs: ['food-dining', 'food-grocery', 'food-bakery'],
    requiredBusinessTerms: ['烧烤', '烤肉', 'bbq', 'barbecue', 'k-bbq', '炭火', '烤串', '串烧', 'grill'],
  },
  {
    key: 'japanese',
    queryTriggers: ['日料', '寿司', 'sushi', 'japanese'],
    categorySignals: ['日料', '日本料理', '寿司', 'sushi', 'japanese', '居酒屋', '拉面'],
    anchorTerms: ['日料', '日本料理', '寿司', '刺身', 'sushi', 'japanese', '居酒屋', '拉面'],
    strictCategorySlugs: ['food-japanese'],
    blockedCategorySlugs: ['food-dining', 'food-grocery', 'food-bakery'],
  },
  {
    key: 'korean',
    queryTriggers: ['韩餐', '韩国菜', 'korean'],
    categorySignals: ['韩餐', '韩国菜', 'korean', '韩式', '泡菜', '部队锅'],
    anchorTerms: ['韩餐', '韩国菜', 'korean', '韩式', '泡菜', '部队锅', '石锅拌饭'],
    strictCategorySlugs: ['food-korean'],
    blockedCategorySlugs: ['food-dining', 'food-grocery', 'food-bakery'],
  },
  {
    key: 'sichuan',
    queryTriggers: ['川菜', '四川菜', 'sichuan'],
    categorySignals: ['川菜', '四川', 'sichuan', '麻辣'],
    anchorTerms: ['川菜', '四川', '四川菜', 'sichuan', '麻辣', '辣子'],
    blockedCategorySlugs: ['food-dining', 'food-grocery', 'food-bakery'],
    requiredBusinessTerms: ['川菜', '四川', 'sichuan', '麻辣', '辣子', '酸菜鱼', '水煮', '回锅', '宫保'],
    excludedBusinessTerms: ['火锅', 'hotpot', 'hot pot', 'shabu', '涮', 'bbq', '烧烤', '烤肉', 'k-bbq'],
  },
  {
    key: 'hunan',
    queryTriggers: ['湘菜', 'hunan'],
    categorySignals: ['湘菜', 'hunan', '剁椒'],
    anchorTerms: ['湘菜', 'hunan', '剁椒'],
    blockedCategorySlugs: ['food-dining', 'food-grocery', 'food-bakery'],
    requiredBusinessTerms: ['湘菜', 'hunan', '剁椒', '小炒', '农家菜'],
    excludedBusinessTerms: ['火锅', 'hotpot', '涮', 'bbq', '烧烤', '烤肉', 'k-bbq'],
  },
  {
    key: 'cantonese',
    queryTriggers: ['粤菜', '广东菜', 'cantonese'],
    categorySignals: ['粤菜', '广东菜', 'cantonese', '点心', '烧腊'],
    anchorTerms: ['粤菜', '广东菜', 'cantonese', '烧腊', '点心'],
    strictCategorySlugs: ['food-dim-sum'],
    blockedCategorySlugs: ['food-dining', 'food-grocery', 'food-bakery'],
    requiredBusinessTerms: ['粤菜', '广东菜', 'cantonese', '点心', '烧腊', '肠粉', '云吞', '煲仔'],
    excludedBusinessTerms: ['火锅', 'hotpot', '川菜', '湘菜', '东北菜', '上海菜', 'mall', 'food court', '商城'],
  },
  {
    key: 'dongbei',
    queryTriggers: ['东北菜', 'dongbei'],
    categorySignals: ['东北菜', 'dongbei'],
    anchorTerms: ['东北菜', 'dongbei', '锅包肉', '地三鲜'],
    blockedCategorySlugs: ['food-dining', 'food-grocery', 'food-bakery'],
    requiredBusinessTerms: ['东北菜', 'dongbei', '锅包肉', '地三鲜', '铁锅炖'],
    excludedBusinessTerms: ['火锅', 'hotpot', '涮', 'bbq', '烧烤', '烤肉', 'k-bbq'],
  },
  {
    key: 'shanghai',
    queryTriggers: ['上海菜', '本帮菜', 'shanghai'],
    categorySignals: ['上海菜', '本帮菜', 'shanghai'],
    anchorTerms: ['上海菜', '本帮菜', 'shanghai', '小笼包', '生煎'],
    blockedCategorySlugs: ['food-dining', 'food-grocery', 'food-bakery'],
    requiredBusinessTerms: ['上海菜', '本帮', 'shanghai', '小笼', '生煎', '蟹粉'],
    excludedBusinessTerms: ['火锅', 'hotpot', '涮', 'bbq', '烧烤', '烤肉', 'k-bbq'],
  },
];

export function getCuisineAnchorProfile(query: string): CuisineAnchorProfile | null {
  const lower = query.toLowerCase();
  return cuisineAnchorProfiles.find((profile) =>
    profile.queryTriggers.some((item) => lower.includes(item.toLowerCase())),
  ) || null;
}

export function categoryMatchesCuisineProfile(category: AnyRow, profile: CuisineAnchorProfile): boolean {
  const nameZh = String(category.name_zh || '').toLowerCase();
  const slug = String(category.slug || '').toLowerCase();
  const terms = Array.isArray(category.search_terms)
    ? category.search_terms.map((item) => String(item).toLowerCase()).filter((item) => item.length >= 2)
    : [];
  const blockedSlugs = new Set((profile.blockedCategorySlugs || []).map((item) => item.toLowerCase()));
  const strictSlugs = new Set((profile.strictCategorySlugs || []).map((item) => item.toLowerCase()));

  if (blockedSlugs.has(slug)) return false;
  if (strictSlugs.size > 0) {
    return strictSlugs.has(slug);
  }

  return profile.categorySignals.some((signal) => {
    const lowerSignal = signal.toLowerCase();
    return (
      nameZh.includes(lowerSignal) ||
      slug.includes(lowerSignal) ||
      terms.some((term) => term.includes(lowerSignal))
    );
  });
}

export function getQueryAnchorTerms(query: string): string[] {
  const lower = query.toLowerCase();
  const terms = new Set<string>();
  for (const anchor of queryIntentAnchors) {
    if (anchor.trigger.some((item) => lower.includes(item.toLowerCase()))) {
      anchor.terms.forEach((item) => terms.add(item.toLowerCase()));
    }
  }
  return [...terms];
}

export function businessMatchesAnchorTerms(business: AnyRow, terms: string[]): boolean {
  if (terms.length === 0) return false;
  const aiTags = Array.isArray(business.ai_tags) ? business.ai_tags.map((item) => String(item).toLowerCase()) : [];
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
    aiTags.join(' '),
  ]
    .join(' ')
    .toLowerCase();
  return terms.some((term) => haystack.includes(term));
}

export function businessMatchesCuisineBoundary(business: AnyRow, profile: CuisineAnchorProfile): boolean {
  const requiredTerms = (profile.requiredBusinessTerms || []).map((item) => item.toLowerCase());
  const excludedTerms = (profile.excludedBusinessTerms || []).map((item) => item.toLowerCase());
  if (requiredTerms.length === 0) return true;
  const aiTags = Array.isArray(business.ai_tags) ? business.ai_tags.map((item) => String(item).toLowerCase()) : [];
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
    aiTags.join(' '),
  ]
    .join(' ')
    .toLowerCase();
  if (excludedTerms.some((term) => haystack.includes(term))) return false;
  return requiredTerms.some((term) => haystack.includes(term));
}

export function cuisineBoundaryPenalty(business: AnyRow, profile: CuisineAnchorProfile | null): number {
  if (!profile) return 0;
  if (businessMatchesCuisineBoundary(business, profile)) return 0;
  if (businessMatchesAnchorTerms(business, profile.anchorTerms)) return 0;
  return 1;
}

export function isRestaurantQuery(query: string): boolean {
  return /(餐厅|饭店|聚餐|吃|晚餐|午餐|宵夜|火锅|烧烤|川菜|粤菜|湘菜|东北菜|日料|寿司|韩餐|restaurant|dining|food)/i
    .test(query);
}

export function isMealRestaurantQuery(query: string): boolean {
  return /(午餐|晚餐|聚餐|正餐|lunch|dinner|family)/i.test(query);
}

export function isExplicitHotpotIntent(query: string): boolean {
  return /(火锅|hot\s*pot|hotpot|shabu|涮|串串|麻辣烫)/i.test(query);
}

export function isSushiIntent(query: string): boolean {
  return /(寿司|sushi)/i.test(query);
}

export function isBudgetMealQuery(query: string): boolean {
  const hasBudgetSignal = /(人均|预算|\$\s*\d+|\d+\s*美元|以内|以下|under\s*\$?\d+|less than)/i.test(query);
  const hasMealSignal = /(午餐|晚餐|餐厅|饭店|吃|lunch|dinner|restaurant|food|dining)/i.test(query);
  return hasBudgetSignal && hasMealSignal;
}

export function businessMatchesRestaurantBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '餐厅', '饭店', '火锅', '烧烤', '川菜', '粤菜', '湘菜', '东北菜', '日料', '寿司', '韩餐',
    'restaurant', 'dining', 'hotpot', 'bbq', 'sushi', 'korean', 'cuisine',
  ];
  const excludedTerms = [
    '冰淇淋', '甜品', 'dessert', 'ice cream', 'mall', '购物中心', 'school', 'academy', 'tutoring', '培训',
  ];
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
    String(business.address_full || ''),
  ]
    .join(' ')
    .toLowerCase();
  if (excludedTerms.some((term) => haystack.includes(term))) return false;
  return requiredTerms.some((term) => haystack.includes(term));
}

export function isObviousNonRestaurant(business: AnyRow): boolean {
  const excludedTerms = [
    '学校', 'academy', 'prep', 'tutoring', '培训', '辅导', '课程',
    '诊所', '中医', 'acupuncture', 'clinic', 'hospital',
    '银行', 'bank', '保险', 'insurance', '地产', 'real estate',
  ];
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
  ]
    .join(' ')
    .toLowerCase();
  return excludedTerms.some((term) => haystack.includes(term));
}

export function isDessertOrMallVenue(business: AnyRow): boolean {
  const terms = ['甜品', '冰淇淋', 'dessert', 'ice cream', 'mall', '购物中心'];
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
  ]
    .join(' ')
    .toLowerCase();
  return terms.some((term) => haystack.includes(term));
}

export function isRelaxedRestaurantCandidate(business: AnyRow, query: string): boolean {
  if (isObviousNonRestaurant(business)) return false;
  if (isMealRestaurantQuery(query) && isDessertOrMallVenue(business)) return false;
  return true;
}

export function sushiBoundaryPenalty(business: AnyRow, query: string): number {
  if (!isSushiIntent(query)) return 0;
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
  ]
    .join(' ')
    .toLowerCase();
  return /(寿司|sushi|刺身|omakase)/i.test(haystack) ? 0 : 1;
}

export function hasSushiSignals(business: AnyRow): boolean {
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
  ]
    .join(' ')
    .toLowerCase();
  return /(寿司|sushi|刺身|omakase)/i.test(haystack);
}
