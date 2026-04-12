type AnyRow = Record<string, unknown>;

export function isImmigrationLawQuery(query: string): boolean {
  const hasLaw = /(律师|律所|律师楼|law firm|attorney|lawyer|法律)/i.test(query);
  const hasImmigration = /(移民|签证|绿卡|入籍|庇护|亲属移民|职业移民|h1b|h-1b|i-130|i-485|immigration|visa|citizenship|asylum)/i
    .test(query);
  return hasLaw && hasImmigration;
}

export function isTrafficLawQuery(query: string): boolean {
  const hasLaw = /(律师|律所|律师楼|law firm|attorney|lawyer|法律)/i.test(query);
  const hasTraffic = /(车祸|交通事故|罚单|违章|dui|dwi|ticket|traffic|accident|injury|人身伤害)/i.test(query);
  return hasLaw && hasTraffic;
}

export function isCriminalLawQuery(query: string): boolean {
  const hasLaw = /(律师|律所|律师楼|law firm|attorney|lawyer|法律)/i.test(query);
  const hasCriminal = /(刑事|刑辩|保释|拘留|逮捕|criminal|defense|dui|dwi)/i.test(query);
  return hasLaw && hasCriminal;
}

export function businessMatchesImmigrationLawBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '移民', '签证', '绿卡', '入籍', '庇护', '亲属移民', '职业移民',
    'immigration', 'visa', 'citizenship', 'asylum', 'h1b', 'h-1b', 'i-130', 'i-485',
  ];
  const excludedTerms = [
    '车祸', '交通事故', '罚单', 'ticket', 'traffic',
    '刑事', 'criminal', 'dui', 'dwi',
    '离婚', 'family law', '婚姻', '遗产', 'estate',
    '地产', 'real estate', '保险', 'insurance',
    '中医', '针灸', 'dentist', 'dental',
  ];
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
    Array.isArray(business.ai_tags) ? business.ai_tags.join(' ') : '',
  ]
    .join(' ')
    .toLowerCase();
  if (excludedTerms.some((term) => haystack.includes(term))) return false;
  return requiredTerms.some((term) => haystack.includes(term));
}

export function businessMatchesTrafficLawBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '车祸', '交通事故', '罚单', '违章', '人身伤害',
    'traffic', 'ticket', 'accident', 'injury', 'dui', 'dwi', 'personal injury',
  ];
  const excludedTerms = [
    '移民', '签证', '绿卡', 'immigration', 'visa',
    '离婚', 'family law', '婚姻',
    '中医', '针灸', 'dentist', 'dental',
  ];
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
    Array.isArray(business.ai_tags) ? business.ai_tags.join(' ') : '',
  ]
    .join(' ')
    .toLowerCase();
  if (excludedTerms.some((term) => haystack.includes(term))) return false;
  return requiredTerms.some((term) => haystack.includes(term));
}

export function businessMatchesCriminalLawBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '刑事', '刑辩', '保释', '拘留', '逮捕',
    'criminal', 'defense', 'dui', 'dwi',
  ];
  const excludedTerms = [
    '移民', '签证', '绿卡', 'immigration', 'visa',
    '离婚', 'family law', '婚姻',
    '中医', '针灸', 'dentist', 'dental',
  ];
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
    Array.isArray(business.ai_tags) ? business.ai_tags.join(' ') : '',
  ]
    .join(' ')
    .toLowerCase();
  if (excludedTerms.some((term) => haystack.includes(term))) return false;
  return requiredTerms.some((term) => haystack.includes(term));
}

