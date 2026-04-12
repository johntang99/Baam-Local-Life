type AnyRow = Record<string, unknown>;

export function isRetailQuery(query: string): boolean {
  return /(购物|零售|商店|店铺|超市|买东西|伴手礼|礼品|美妆|护肤|服装|电器|数码|retail|shop|store|mall|grocery|supermarket)/i
    .test(query);
}

export function isGroceryRetailQuery(query: string): boolean {
  return /(超市|杂货|买菜|食品店|grocery|supermarket|market)/i.test(query);
}

export function isBeautyRetailQuery(query: string): boolean {
  return /(美妆|护肤|化妆品|香水|beauty|cosmetic|skincare|makeup)/i.test(query);
}

export function isElectronicsRetailQuery(query: string): boolean {
  return /(电器|数码|手机|电脑|相机|electronics|digital|laptop|iphone|android)/i.test(query);
}

export function isJewelryRetailQuery(query: string): boolean {
  return /(珠宝|首饰|金店|银饰|钟表|手表|钻戒|戒指|jewelry|jeweller|watch|timepiece|diamond|ring)/i.test(query);
}

export function isRetailStrictQuery(query: string): boolean {
  return isGroceryRetailQuery(query) || isBeautyRetailQuery(query) || isElectronicsRetailQuery(query) || isJewelryRetailQuery(query);
}

export function businessMatchesRetailBoundary(business: AnyRow): boolean {
  const requiredTerms = [
    '购物', '零售', '商店', '店铺', '超市', '百货', '礼品', '美妆', '护肤', '服装',
    '珠宝', '首饰', '钟表', '手表',
    'retail', 'shop', 'store', 'mall', 'market', 'supermarket', 'grocery', 'jewelry', 'jeweller', 'watch',
  ];
  const excludedTerms = [
    '律师', 'lawyer', 'attorney',
    '牙医', 'dentist', 'dental',
    '中医', 'acupuncture', 'clinic', 'medical',
    '保险', 'insurance', 'broker',
    '地产', 'real estate', 'realtor',
    '餐厅', 'restaurant', 'hotpot', '火锅',
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

export function businessMatchesRetailSubtypeBoundary(business: AnyRow, query: string): boolean {
  const haystack = [
    String(business.display_name || ''),
    String(business.display_name_zh || ''),
    String(business.short_desc_zh || ''),
    String(business.ai_summary_zh || ''),
    Array.isArray(business.ai_tags) ? business.ai_tags.join(' ') : '',
  ].join(' ').toLowerCase();

  // Global retail noise that frequently contaminates strict queries.
  const globalNoise = /(律师|lawyer|attorney|牙医|dentist|dental|clinic|medical|保险|insurance|broker|补习|academy|test prep|餐厅|restaurant|hotpot)/i;
  if (globalNoise.test(haystack)) return false;

  if (isGroceryRetailQuery(query)) {
    const grocerySignal = /(超市|杂货|食品|生鲜|粮油|grocery|supermarket|fresh market|produce market)/i.test(haystack);
    const groceryNoise = /(ups|shipping|mailbox|快递|商场|shopping mall|购物中心|department store|百货商场|outlet|plaza)/i;
    return grocerySignal && !groceryNoise.test(haystack);
  }
  if (isBeautyRetailQuery(query)) {
    const beautySignal = /(美妆|护肤|化妆品|香水|beauty|cosmetic|skincare|makeup)/i.test(haystack);
    const beautyNoise = /(hair salon|barber|nail|美发|理发|纹身|spa)/i;
    return beautySignal && !beautyNoise.test(haystack);
  }
  if (isElectronicsRetailQuery(query)) {
    const electronicsSignal = /(电器|数码|手机|电脑|相机|electronics|digital|laptop|iphone|android|tablet|printer)/i.test(haystack);
    const electronicsNoise = /(repair|维修|screen fix|配件摊|二手回收|pawn)/i;
    return electronicsSignal && !electronicsNoise.test(haystack);
  }
  if (isJewelryRetailQuery(query)) {
    const jewelrySignal = /(珠宝|首饰|金店|银饰|钟表|手表|钻戒|戒指|jewelry|jeweller|watch|timepiece|diamond|ring)/i.test(haystack);
    const jewelryNoise = /(watch repair|phone repair|electronics repair|电工|electric|contractor|law firm|attorney|dentist)/i;
    return jewelrySignal && !jewelryNoise.test(haystack);
  }
  return businessMatchesRetailBoundary(business);
}

