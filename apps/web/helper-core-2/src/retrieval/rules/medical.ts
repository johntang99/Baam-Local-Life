type AnyRow = Record<string, unknown>;

export function isTcmRankingQuery(query: string): boolean {
  return /(中医|针灸|推拿|中药|国医|tcm|acupunct|herbal|oriental medicine)/i.test(query);
}

export function isDentalQuery(query: string): boolean {
  return /(牙医|牙科|口腔|正畸|洗牙|补牙|根管|拔牙|种牙|dentist|dental|orthodont|teeth|tooth)/i.test(query);
}

export function isPediatricQuery(query: string): boolean {
  return /(儿科|小儿科|儿童医生|儿医|pediatric|pediatrics|kids doctor|children['s ]?medical)/i.test(query);
}

export function isDermatologyQuery(query: string): boolean {
  return /(皮肤科|皮肤医生|皮肤专科|dermatolog|skin doctor|eczema|acne|psoriasis)/i.test(query);
}

export function isOphthalmologyQuery(query: string): boolean {
  return /(眼科|眼科医生|眼医|眼睛|ophthalmolog|optometr|retina|glaucoma|cataract)/i.test(query);
}

export function isMedicalQuery(query: string): boolean {
  return /(牙医|牙科|口腔|中医|针灸|推拿|诊所|医生|medical|clinic|doctor|dentist|dental|acupuncture|tcm|health)/i
    .test(query);
}

export function getMedicalSpecialtyTerms(query: string): string[] {
  if (isDentalQuery(query)) {
    return ['牙医', '牙科', '口腔', 'dentist', 'dental', 'dds', 'dmd', 'orthodont'];
  }
  if (isPediatricQuery(query)) {
    return ['儿科', '小儿科', '儿童医生', 'pediatric', 'pediatrics', 'children', 'kids'];
  }
  if (isDermatologyQuery(query)) {
    return ['皮肤科', '皮肤医生', '湿疹', '痤疮', 'dermatology', 'dermatologist', 'skin'];
  }
  if (isOphthalmologyQuery(query)) {
    return ['眼科', '眼科医生', '白内障', '青光眼', 'ophthalmology', 'ophthalmologist', 'retina'];
  }
  if (isTcmRankingQuery(query)) {
    return ['中医', '针灸', '推拿', '中药', 'tcm', 'acupuncture', 'herbal'];
  }
  return [];
}


export function businessMatchesDentalBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '牙医', '牙科', '口腔', '正畸', '种牙', '洗牙', '补牙', '根管', '牙齿',
    'dentist', 'dental', 'orthodont', 'orthodontic', 'teeth', 'tooth', 'oral',
    'periodont', 'endodont', 'dds', 'dmd',
  ];
  const excludedTerms = [
    '中医', '针灸', '草药', 'acupuncture', 'herbal',
    '律师', 'lawyer', 'attorney', 'law firm',
    '地产', 'real estate', '保险', 'insurance',
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
  if (requiredTerms.some((term) => haystack.includes(term))) return true;
  return /\bdds\b|\bdmd\b/i.test(haystack);
}

export function businessMatchesPediatricBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '儿科', '小儿科', '儿童', '儿医', '儿童医疗',
    'pediatric', 'pediatrics', 'children', 'kids',
  ];
  const excludedTerms = [
    '中医', '针灸', 'acupuncture', 'herbal',
    '牙医', '牙科', 'dentist', 'dental',
    '律师', 'lawyer', 'attorney',
    '培训', '辅导', 'test prep', 'academy',
    'photo', 'photography', 'portrait', 'studio',
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

export function businessMatchesDermatologyBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '皮肤科', '皮肤医生', '皮肤专科', '湿疹', '痤疮', '牛皮癣',
    'dermatolog', 'skin', 'eczema', 'acne', 'psoriasis',
  ];
  const excludedTerms = [
    '中医', '针灸', 'acupuncture', 'herbal',
    '牙医', '牙科', 'dentist', 'dental',
    '律师', 'lawyer', 'attorney',
    '培训', '辅导', 'test prep', 'academy',
    'beauty', 'skincare', 'spa', 'salon', 'nail', '抗衰', '医美',
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
  const hasRequired = requiredTerms.some((term) => haystack.includes(term));
  const hasMedicalTitle = /\bmd\b|\bdo\b|\bfaad\b|doctor|dr\./i.test(haystack);
  return hasRequired && hasMedicalTitle;
}

export function businessMatchesDermatologySupportive(business: AnyRow): boolean {
  const includeTerms = [
    '皮肤科', '皮肤医生', '皮肤专科', '湿疹', '痤疮', '牛皮癣',
    'dermatolog', 'skin', 'eczema', 'acne', 'psoriasis', 'laser',
  ];
  const hardExcluded = [
    '中医', '针灸', 'acupuncture', 'herbal',
    '牙医', '牙科', 'dentist', 'dental',
    '律师', 'lawyer', 'attorney',
    '培训', '辅导', 'test prep', 'academy',
    'nail',
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
  if (hardExcluded.some((term) => haystack.includes(term))) return false;
  return includeTerms.some((term) => haystack.includes(term));
}

export function businessMatchesOphthalmologyBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '眼科', '眼医', '白内障', '青光眼', '视网膜', '近视矫正',
    'ophthalmolog', 'retina', 'glaucoma', 'cataract', 'md', 'do',
  ];
  const excludedTerms = [
    '中医', '针灸', 'acupuncture', 'herbal',
    '牙医', '牙科', 'dentist', 'dental',
    '律师', 'lawyer', 'attorney',
    '培训', '辅导', 'test prep', 'academy',
    'eyewear', 'glasses', 'optical shop', '眼镜店',
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
  const hasRequired = requiredTerms.some((term) => haystack.includes(term));
  const hasMedicalTitle = /\bmd\b|\bdo\b|doctor|dr\./i.test(haystack);
  return hasRequired && hasMedicalTitle;
}

export function businessMatchesOphthalmologySupportive(business: AnyRow): boolean {
  const supportiveTerms = [
    'optometr', 'vision', 'eyecare', '配镜', '验光', '眼镜',
    'contact lens', 'glasses', 'optical',
  ];
  const excludedTerms = [
    '中医', '针灸', 'acupuncture', 'herbal',
    '牙医', '牙科', 'dentist', 'dental',
    '律师', 'lawyer', 'attorney',
    '培训', '辅导', 'test prep', 'academy',
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
  return supportiveTerms.some((term) => haystack.includes(term));
}

export function businessMatchesTcmBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '中医', '针灸', '推拿', '中药', '国医', '草药',
    'tcm', 'acupunct', 'herbal', 'oriental medicine',
  ];
  const excludedTerms = [
    '教育', '学校', 'academy', 'prep', 'tutoring', 'tutor',
    'sat', 'act', 'college', '培训', '辅导', '课程', '家教',
  ];
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

