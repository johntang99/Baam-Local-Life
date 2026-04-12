type AnyRow = Record<string, unknown>;

export function isAutoServiceQuery(query: string): boolean {
  return /(汽车|修车|维修|保养|车行|轮胎|机油|刹车|钣金|喷漆|洗车|拖车|驾照|年检|smog|auto|car repair|mechanic|body shop|tire|oil change|inspection)/i
    .test(query);
}

export function isAutoRepairQuery(query: string): boolean {
  return /(修车|维修|保养|机油|刹车|发动机|变速箱|car repair|mechanic|oil change|brake)/i.test(query);
}

export function isAutoBodyQuery(query: string): boolean {
  return /(钣金|喷漆|碰撞|事故维修|body shop|collision|paint)/i.test(query);
}

export function isAutoInspectionQuery(query: string): boolean {
  return /(年检|尾气|smog|inspection|state inspection)/i.test(query);
}

export function isAutoStrictQuery(query: string): boolean {
  return isAutoInspectionQuery(query) || isAutoBodyQuery(query);
}

export function businessMatchesAutoBoundary(business: AnyRow): boolean {
  const autoQualifierTerms = [
    '汽车', '车行', '轮胎', '机油', '刹车', '钣金', '喷漆', '年检',
    'auto', 'car', 'mechanic', 'body shop', 'tire', 'oil',
  ];
  const serviceTerms = [
    '修车', '维修', '保养', '洗车', '拖车', '年检',
    'repair', 'service', 'oil change', 'inspection', 'collision', 'paint',
  ];
  const excludedTerms = [
    '律师', 'lawyer', 'attorney',
    '牙医', 'dentist', 'dental',
    '中医', 'acupuncture', 'clinic', 'medical',
    '保险', 'insurance', 'broker',
    '地产', 'real estate', 'realtor',
    '餐厅', 'restaurant', 'hotpot',
    '补习', '教育', 'academy', 'test prep',
  ];
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
    Array.isArray(business.ai_tags) ? business.ai_tags.join(' ') : '',
  ].join(' ').toLowerCase();
  if (excludedTerms.some((term) => haystack.includes(term))) return false;
  const hasAutoQualifier = autoQualifierTerms.some((term) => haystack.includes(term));
  const hasService = serviceTerms.some((term) => haystack.includes(term));
  return hasAutoQualifier && hasService;
}

export function businessMatchesAutoSubtypeBoundary(business: AnyRow, query: string): boolean {
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
    Array.isArray(business.ai_tags) ? business.ai_tags.join(' ') : '',
  ].join(' ').toLowerCase();

  const globalNoise = /(car rental|租车|parking|停车场|驾驶学校|driving school|dmv service|车险|insurance)/i;
  if (globalNoise.test(haystack)) return false;

  if (isAutoRepairQuery(query)) {
    return /(修车|维修|保养|机油|刹车|发动机|变速箱|car repair|mechanic|oil change|brake)/i.test(haystack)
      && /(汽车|auto|car|车行|mechanic)/i.test(haystack);
  }
  if (isAutoBodyQuery(query)) {
    return /(钣金|喷漆|碰撞|事故维修|body shop|collision|paint)/i.test(haystack);
  }
  if (isAutoInspectionQuery(query)) {
    return /(年检|尾气|smog|inspection|state inspection)/i.test(haystack);
  }
  return businessMatchesAutoBoundary(business);
}

