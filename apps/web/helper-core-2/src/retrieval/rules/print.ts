type AnyRow = Record<string, unknown>;

export function isPrintDesignQuery(query: string): boolean {
  return /(印刷|设计|海报|名片|喷绘|标牌|招牌|横幅|printing|design|sign|banner|graphic|business card|logo)/i
    .test(query);
}

export function isBrandingPrintQuery(query: string): boolean {
  return /(名片|logo|品牌设计|branding|business card|logo design|graphic design)/i.test(query);
}

export function isSignagePrintQuery(query: string): boolean {
  return /(招牌|横幅|标牌|喷绘|sign|banner|store sign|vinyl)/i.test(query);
}

export function isPrintDesignStrictQuery(query: string): boolean {
  return isBrandingPrintQuery(query) || isSignagePrintQuery(query);
}

export function businessMatchesPrintDesignBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '印刷', '设计', '海报', '名片', '喷绘', '标牌', '招牌', '横幅',
    'printing', 'design', 'sign', 'banner', 'graphic', 'business card', 'logo',
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

export function businessMatchesPrintDesignSubtypeBoundary(business: AnyRow, query: string): boolean {
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
    Array.isArray(business.ai_tags) ? business.ai_tags.join(' ') : '',
  ].join(' ').toLowerCase();

  const globalNoise = /(lawyer|attorney|law firm|dentist|dental|tax|cpa|insurance|broker|restaurant|hotpot|academy|test prep|auto repair|mechanic)/i;
  if (globalNoise.test(haystack)) return false;

  if (isBrandingPrintQuery(query)) {
    return /(名片|logo|品牌设计|branding|business card|logo design|graphic design|印刷设计)/i.test(haystack);
  }
  if (isSignagePrintQuery(query)) {
    const signageSignal = /(招牌|横幅|标牌|喷绘|sign|banner|store sign|vinyl|printing)/i.test(haystack);
    const signageNoise = /(shopping mall|商场|the shops at|ups store|mailbox|shipping)/i.test(haystack);
    return signageSignal && !signageNoise;
  }
  return businessMatchesPrintDesignBoundary(business);
}
