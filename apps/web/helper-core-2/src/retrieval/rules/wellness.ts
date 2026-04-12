type AnyRow = Record<string, unknown>;

export function isBeautyWellnessQuery(query: string): boolean {
  return /(美容|护肤|皮肤管理|面部护理|养生|按摩|spa|wellness|facial|skincare|beauty|med spa|body contouring|head spa)/i
    .test(query);
}

export function isFacialBeautyQuery(query: string): boolean {
  return /(面部|护肤|皮肤管理|facial|skincare|beauty|med spa|医美|body contouring|laser hair)/i.test(query);
}

export function isMassageWellnessQuery(query: string): boolean {
  return /(按摩|推拿|养生|头疗|足疗|massage|wellness|spa|head spa|foot massage|bodywork)/i.test(query);
}

export function isBeautyWellnessStrictQuery(query: string): boolean {
  return isFacialBeautyQuery(query) || isMassageWellnessQuery(query);
}

export function businessMatchesBeautyWellnessBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '美容', '护肤', '皮肤管理', '面部护理', '养生', '按摩', '头疗', '足疗', '医美',
    'spa', 'wellness', 'facial', 'skincare', 'beauty', 'med spa', 'body contouring', 'massage', 'head spa',
  ];
  const excludedTerms = [
    '律师', 'lawyer', 'attorney',
    '牙医', 'dentist', 'dental',
    '报税', 'tax', 'cpa', 'accounting', 'bookkeeping',
    '保险', 'insurance', 'broker',
    '地产', 'real estate', 'realtor',
    '餐厅', 'restaurant', 'hotpot', '火锅', 'noodle',
    '教育', 'academy', 'test prep', 'tutor',
    '修车', 'auto repair', 'mechanic', 'body shop',
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

export function businessMatchesBeautyWellnessSubtypeBoundary(business: AnyRow, query: string): boolean {
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
    Array.isArray(business.ai_tags) ? business.ai_tags.join(' ') : '',
  ].join(' ').toLowerCase();

  const globalNoise = /(lawyer|attorney|dentist|dental|tax|cpa|insurance|broker|restaurant|hotpot|academy|test prep|auto repair|mechanic)/i;
  if (globalNoise.test(haystack)) return false;

  if (isFacialBeautyQuery(query)) {
    const facialSignal = /(面部|护肤|皮肤管理|facial|skincare|beauty|med spa|body contouring|laser hair)/i.test(haystack);
    const facialNoise = /(barber|理发|hair salon|纹身|tattoo)/i.test(haystack);
    return facialSignal && !facialNoise;
  }

  if (isMassageWellnessQuery(query)) {
    const massageSignal = /(按摩|推拿|养生|头疗|足疗|massage|wellness|spa|head spa|foot massage|bodywork)/i.test(haystack);
    const massageNoise = /(insurance|broker|policy|tax|accounting|bookkeeping)/i.test(haystack);
    return massageSignal && !massageNoise;
  }

  return businessMatchesBeautyWellnessBoundary(business);
}
