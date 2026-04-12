type AnyRow = Record<string, unknown>;

export function isTaxServiceQuery(query: string): boolean {
  return /(报税|税务|会计|记账|cpa|tax|accounting|bookkeeping|payroll|irs|退税)/i.test(query);
}

export function isCpaQuery(query: string): boolean {
  return /(cpa|注册会计师|会计师|certified public accountant)/i.test(query);
}

export function isBookkeepingQuery(query: string): boolean {
  return /(记账|bookkeeping|簿记|对账|财务代管|payroll|工资单)/i.test(query);
}

export function businessMatchesTaxBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '报税', '税务', '会计', '记账', '退税', '审计',
    'cpa', 'tax', 'accounting', 'bookkeeping', 'payroll', 'irs',
  ];
  const excludedTerms = [
    '律师', 'lawyer', 'attorney',
    '牙医', 'dentist', 'dental',
    '中医', 'clinic', 'medical',
    '餐厅', 'restaurant', 'hotpot',
    '保险', 'insurance', 'broker',
    '房产', 'real estate', 'realtor',
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
  return requiredTerms.some((term) => haystack.includes(term));
}

export function businessMatchesTaxSubtypeBoundary(business: AnyRow, query: string): boolean {
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
    Array.isArray(business.ai_tags) ? business.ai_tags.join(' ') : '',
  ].join(' ').toLowerCase();

  const globalNoise = /(insurance|broker|lawyer|attorney|dentist|restaurant|driving school|medical)/i;
  if (globalNoise.test(haystack)) return false;

  if (isCpaQuery(query)) {
    return /(cpa|certified public accountant|会计师|注册会计师|tax accountant|accounting firm)/i.test(haystack);
  }
  if (isBookkeepingQuery(query)) {
    return /(记账|bookkeeping|簿记|对账|payroll|工资单)/i.test(haystack);
  }
  return businessMatchesTaxBoundary(business);
}

