type AnyRow = Record<string, unknown>;

export function isRealEstateQuery(query: string): boolean {
  return /(房产|地产|中介|realtor|real estate|租房|买房|卖房|置业|学区房|property management|物业)/i.test(query);
}

export function isInsuranceQuery(query: string): boolean {
  return /(保险|保险经纪|insurance|broker|保单|车险|房屋险|理赔|保费)/i.test(query);
}

export function isEducationQuery(query: string): boolean {
  return /(教育|培训|补习|课后班|academy|tutor|test prep|sat|act|托福|雅思|升学|留学)/i.test(query);
}

export function isAcademicEducationQuery(query: string): boolean {
  return /(k-?12|课后班|补习|升学|标化|sat|act|托福|雅思|toefl|ielts|ap|ib|数学|英文|英语|科学|writing)/i.test(query);
}

export function isEducationAcademicHardQuery(query: string): boolean {
  return /(sat|act|toefl|ielts|托福|雅思|标化|k-?12|课后班|补习|升学|test prep|tutor)/i.test(query);
}

export function isArtsEducationQuery(query: string): boolean {
  return /(舞蹈|音乐|美术|绘画|钢琴|小提琴|声乐|芭蕾|艺术|dance|music|art|piano|violin|ballet)/i.test(query);
}

export function businessMatchesRealEstateBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '房产', '地产', '中介', '置业', '买房', '卖房', '租房', '物业',
    'real estate', 'realtor', 'realty', 'property', 'property management', 'leasing', 'rental', 'listing',
  ];
  const excludedTerms = [
    '律师', 'lawyer', 'attorney',
    '牙医', 'dentist', 'dental',
    '中医', '针灸', 'acupuncture',
    '餐厅', 'restaurant', 'hotpot', '火锅',
    'school', 'academy', 'test prep', 'park', 'library',
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

export function businessMatchesInsuranceBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '保险', '保险经纪', '保单', '车险', '房屋险', '理赔', '保费',
    'insurance', 'broker', 'policy', 'claim', 'auto insurance', 'home insurance',
  ];
  const excludedTerms = [
    '律师', 'lawyer', 'attorney',
    '牙医', 'dentist', 'dental',
    '中医', '针灸', 'acupuncture',
    '餐厅', 'restaurant', 'hotpot', '火锅',
    'school', 'academy', 'test prep', 'park', 'library',
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

export function businessMatchesEducationBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '教育', '培训', '补习', '课后班', '升学', '留学', '家教', '托管',
    'academy', 'tutor', 'test prep', 'sat', 'act', 'toefl', 'ielts', 'after school', 'education',
  ];
  const excludedTerms = [
    '律师', 'lawyer', 'attorney',
    '牙医', 'dentist', 'dental',
    '中医', '针灸', 'acupuncture',
    '餐厅', 'restaurant', 'hotpot', '火锅',
    '保险', 'insurance', 'broker',
    '物业', 'property management', 'real estate', 'realtor',
    'park', 'library', 'wedding', 'dance studio',
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

export function businessMatchesAcademicEducationBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '补习', '课后班', '升学', '标化', 'sat', 'act', 'toefl', 'ielts', 'ap', 'ib',
    'academy', 'tutor', 'test prep', 'k-12', 'education',
  ];
  const excludedTerms = [
    '舞蹈', 'dance', '音乐', 'music', '美术', 'art', '钢琴', 'piano', '小提琴', 'violin', '芭蕾', 'ballet',
    '奶茶', 'tea', 'boba', 'restaurant', 'cafe', '自拍', 'self-portrait', 'studio',
    '图书馆', 'library', '公园', 'park', '婚礼', 'wedding', '摄影',
    '驾校', 'driving school', 'driving', 'road test', 'dmv',
    '沙龙', 'salon', 'barber', 'hair', 'nail',
    '武术', '跆拳道', 'martial', 'taekwondo',
    '律师', 'lawyer', '牙医', 'dentist', '餐厅', 'restaurant',
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

export function businessMatchesAcademicEducationHardBoundary(business: AnyRow): boolean {
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
    Array.isArray(business.ai_tags) ? business.ai_tags.join(' ') : '',
  ].join(' ').toLowerCase();

  const noiseTerms = [
    '律师', 'lawyer', 'attorney', '牙医', 'dentist', 'dental',
    '餐厅', 'restaurant', 'hotpot', '火锅', '保险', 'insurance', 'broker',
    '舞蹈', 'dance', '音乐', 'music', '美术', 'art', '钢琴', 'piano',
    '驾校', 'driving school', 'driving', 'road test', 'dmv',
    '武术', '跆拳道', 'martial', 'taekwondo',
    '奶茶', 'tea', 'boba', 'cafe', '自拍', 'self-portrait', 'studio',
    '沙龙', 'salon', 'barber', 'hair', 'nail',
    '图书馆', 'library', '公园', 'park',
  ];
  if (noiseTerms.some((term) => haystack.includes(term))) return false;

  const strongAcademicTerms = [
    'sat', 'act', 'toefl', 'ielts', 'ap', 'ib', 'test prep',
    '补习', '课后班', '升学', '标化', 'k-12', '家教', '辅导',
  ];
  const hasStrongAcademic = strongAcademicTerms.some((term) => haystack.includes(term));
  if (hasStrongAcademic) return true;

  const weakAcademicTerms = ['academy', 'tutor', 'education', '培训', '教育'];
  return weakAcademicTerms.some((term) => haystack.includes(term)) && /(sat|act|toefl|ielts|补习|课后班|升学|标化)/.test(haystack);
}

export function businessMatchesArtsEducationBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '舞蹈', '音乐', '美术', '绘画', '钢琴', '小提琴', '芭蕾',
    'dance', 'music', 'art', 'piano', 'violin', 'ballet',
  ];
  const excludedTerms = [
    '律师', 'lawyer', '牙医', 'dentist', '餐厅', 'restaurant', '保险', 'insurance',
    'sat', 'act', 'toefl', 'ielts', 'test prep',
    '奶茶', 'tea', 'boba', 'cafe', '自拍', 'self-portrait', 'studio',
    '驾校', 'driving school', 'driving', 'road test', 'dmv',
    '沙龙', 'salon', 'barber', 'hair', 'nail',
    '武术', '跆拳道', 'martial', 'taekwondo',
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

