type AnyRow = Record<string, unknown>;

export function isTravelAgencyQuery(query: string): boolean {
  return /(旅行社|旅游|机票|跟团|自由行|签证代办|travel agency|tour|travel|flight booking|vacation package)/i
    .test(query);
}

export function isTicketTourTravelQuery(query: string): boolean {
  return /(机票|跟团|自由行|tour|travel package|flight booking|vacation)/i.test(query);
}

export function isVisaTravelQuery(query: string): boolean {
  return /(签证|签证代办|visa)/i.test(query);
}

export function isTravelAgencyStrictQuery(query: string): boolean {
  return isTicketTourTravelQuery(query) || isVisaTravelQuery(query);
}

export function businessMatchesTravelAgencyBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '旅行社', '旅游', '机票', '跟团', '自由行', '签证代办',
    'travel agency', 'tour', 'travel', 'flight booking', 'vacation package', 'ticketing',
  ];
  const excludedTerms = [
    '律师', 'lawyer', 'attorney', 'law firm',
    '牙医', 'dentist', 'dental',
    '报税', 'tax', 'cpa', 'accounting', 'bookkeeping',
    '保险', 'insurance', 'broker',
    '地产', 'real estate', 'realtor',
    '餐厅', 'restaurant', 'hotpot', '火锅',
    '教育', 'academy', 'test prep', 'tutor',
    '修车', 'auto repair', 'mechanic',
  ];
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
    Array.isArray(business.ai_tags) ? business.ai_tags.join(' ') : '',
  ].join(' ').toLowerCase();

  if (excludedTerms.some((term) => haystack.includes(term))) return false;
  return requiredTerms.some((term) => haystack.includes(term));
}

export function businessMatchesTravelAgencySubtypeBoundary(business: AnyRow, query: string): boolean {
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
    Array.isArray(business.ai_tags) ? business.ai_tags.join(' ') : '',
  ].join(' ').toLowerCase();

  const globalNoise = /(lawyer|attorney|law firm|dentist|dental|tax|cpa|insurance|broker|restaurant|hotpot|academy|test prep|auto repair|mechanic)/i;
  if (globalNoise.test(haystack)) return false;

  if (isTicketTourTravelQuery(query)) {
    const travelSignal = /(机票|跟团|自由行|tour|travel|travel package|flight booking|vacation|ticketing)/i.test(haystack);
    return travelSignal;
  }
  if (isVisaTravelQuery(query)) {
    const visaSignal = /(签证|visa|travel)/i.test(haystack);
    const immigrationLawNoise = /(immigration law|attorney|law firm|律师楼|移民律师)/i.test(haystack);
    return visaSignal && !immigrationLawNoise;
  }
  return businessMatchesTravelAgencyBoundary(business);
}
