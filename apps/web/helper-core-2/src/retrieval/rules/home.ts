type AnyRow = Record<string, unknown>;

export function isHomeImprovementQuery(query: string): boolean {
  return /(装修|家居|家具|建材|家装|橱柜|地板|瓷砖|卫浴|灯具|窗帘|renovation|home improvement|furniture|interior|cabinet|flooring|tile)/i
    .test(query);
}

export function isFurnitureHomeQuery(query: string): boolean {
  return /(家具|沙发|床|餐桌|衣柜|furniture|sofa|bed|dining table|wardrobe)/i.test(query);
}

export function isRenovationContractorQuery(query: string): boolean {
  return /(装修|家装|翻新|施工|承包|contractor|renovation|remodel|interior)/i.test(query);
}

export function isHomeStrictQuery(query: string): boolean {
  return isFurnitureHomeQuery(query) || /(家居店|装修家居店|家具店|home store|furniture store)/i.test(query);
}

export function businessMatchesHomeImprovementBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '装修', '家居', '家具', '建材', '家装', '橱柜', '地板', '瓷砖', '卫浴', '灯具', '窗帘',
    'renovation', 'home improvement', 'furniture', 'interior', 'cabinet', 'flooring', 'tile',
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
  return requiredTerms.some((term) => haystack.includes(term));
}

export function businessMatchesHomeSubtypeBoundary(business: AnyRow, query: string): boolean {
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
    Array.isArray(business.ai_tags) ? business.ai_tags.join(' ') : '',
  ].join(' ').toLowerCase();

  if (isFurnitureHomeQuery(query)) {
    return /(家具|沙发|床|餐桌|衣柜|furniture|sofa|bed|dining table|wardrobe|mattress)/i.test(haystack)
      && !/(repair|维修|二手回收|pawn|noodle|restaurant|food|anime|club|society|association)/i.test(haystack);
  }
  if (isRenovationContractorQuery(query)) {
    return /(装修|家装|翻新|施工|承包|contractor|renovation|remodel|interior|cabinet|flooring|tile)/i.test(haystack)
      && !/(furniture rental|event|wedding)/i.test(haystack);
  }
  return businessMatchesHomeImprovementBoundary(business);
}

