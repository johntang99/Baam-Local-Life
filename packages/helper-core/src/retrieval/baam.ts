import type { HelperIntent, RetrievalPayload, SourceItem } from '../types';

type AnyRow = Record<string, unknown>;

function uniqueByUrl(sources: SourceItem[]): SourceItem[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}

function toSnippet(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim().slice(0, 180);
  }
  return fallback;
}

function escapeLikeKeyword(keyword: string): string {
  return keyword.replace(/,/g, ' ').trim();
}

function buildOr(keywords: string[], columns: string[]): string {
  const conditions: string[] = [];
  for (const keyword of keywords) {
    const safeKeyword = escapeLikeKeyword(keyword);
    if (!safeKeyword) continue;
    for (const column of columns) {
      conditions.push(`${column}.ilike.%${safeKeyword}%`);
    }
  }
  return conditions.join(',');
}

const genericWords = new Set([
  '申请', '怎么', '如何', '哪里', '什么', '可以', '需要', '办理', '服务', '咨询', '推荐',
  '好的', '最好', '附近', '价格', '费用', '多少', '帮我', '一下', '纽约', '法拉盛',
]);

function buildBusinessOr(keywords: string[], columns: string[]): string {
  const specificKeywords = keywords.filter((keyword) => !genericWords.has(keyword) && keyword.length > 1);
  return buildOr(specificKeywords.length > 0 ? specificKeywords : keywords, columns);
}

function buildBusinessSnippet(business: AnyRow, reviews: string[] = []): string {
  const base = [
    business.avg_rating ? `评分 ${business.avg_rating}` : '',
    business.review_count ? `${business.review_count}条评价` : '',
    business.phone ? `电话 ${business.phone}` : '',
    business.address_full ? `地址 ${String(business.address_full).slice(0, 48)}` : '',
    Array.isArray(business.ai_tags) ? business.ai_tags.slice(0, 3).join(' / ') : '',
  ]
    .filter(Boolean)
    .join(' · ');

  if (reviews.length === 0) return base;
  return `${base}${base ? ' · ' : ''}评价摘录：${reviews.join('；')}`;
}

async function searchBusinesses(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  keywords: string[],
): Promise<SourceItem[]> {
  const businessFields =
    'id, slug, display_name, display_name_zh, short_desc_zh, ai_summary_zh, ai_tags, avg_rating, review_count, phone, address_full, is_featured';

  const results: AnyRow[] = [];
  const seenIds = new Set<string>();
  const categoryBizIds = new Set<string>();
  const MAX_TERMS_ONLY_SIZE = 50;

  const addResults = (data: AnyRow[] | null | undefined) => {
    for (const business of data || []) {
      const id = String(business.id || '');
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      results.push(business);
    }
  };

  const { data: allBizCats } = await supabase
    .from('categories')
    .select('id, name_zh, slug, parent_id, search_terms')
    .eq('type', 'business');

  const matchedCats: { cat: AnyRow; matchType: 'name' | 'terms' }[] = [];
  for (const cat of (allBizCats || []) as AnyRow[]) {
    const nameZh = String(cat.name_zh || '');
    const terms = Array.isArray(cat.search_terms) ? cat.search_terms.map(String) : [];

    for (const keyword of keywords) {
      if (keyword.length < 2) continue;
      const nameMatch = nameZh && (nameZh.includes(keyword) || keyword.includes(nameZh));
      const termsMatch = terms.some((term) => term.includes(keyword) || (term.length >= 3 && keyword.includes(term)));
      if (nameMatch || termsMatch) {
        matchedCats.push({ cat, matchType: nameMatch ? 'name' : 'terms' });
        break;
      }
    }
  }

  if (matchedCats.length > 0) {
    const catIdsByMatch = new Map<string, 'name' | 'terms'>();
    for (const { cat, matchType } of matchedCats) {
      catIdsByMatch.set(String(cat.id), matchType);
    }

    const parentMatches = matchedCats.filter((item) => !item.cat.parent_id);
    if (parentMatches.length > 0) {
      const { data: children } = await supabase
        .from('categories')
        .select('id, parent_id')
        .in('parent_id', parentMatches.map((item) => item.cat.id));

      for (const child of (children || []) as AnyRow[]) {
        const parentType = catIdsByMatch.get(String(child.parent_id));
        if (parentType) {
          catIdsByMatch.set(String(child.id), parentType);
        }
      }
    }

    const { data: allBizCatLinks } = await supabase
      .from('business_categories')
      .select('business_id, category_id')
      .in('category_id', [...catIdsByMatch.keys()]);

    const bizPerCat = new Map<string, string[]>();
    for (const link of (allBizCatLinks || []) as AnyRow[]) {
      const categoryId = String(link.category_id);
      const businessId = String(link.business_id);
      if (!bizPerCat.has(categoryId)) bizPerCat.set(categoryId, []);
      bizPerCat.get(categoryId)!.push(businessId);
    }

    const includedBizIds = new Set<string>();
    for (const [categoryId, matchType] of catIdsByMatch.entries()) {
      const businessList = bizPerCat.get(categoryId) || [];
      if (matchType === 'name' || businessList.length <= MAX_TERMS_ONLY_SIZE) {
        businessList.forEach((id) => {
          includedBizIds.add(id);
          categoryBizIds.add(id);
        });
      }
    }

    if (includedBizIds.size > 0) {
      const { data } = await supabase
        .from('businesses')
        .select(businessFields)
        .eq('is_active', true)
        .in('id', [...includedBizIds].slice(0, 100))
        .order('is_featured', { ascending: false })
        .order('avg_rating', { ascending: false })
        .limit(30);

      addResults(data as AnyRow[] | undefined);
    }
  }

  for (const keyword of keywords) {
    if (keyword.length < 2 || results.length >= 30) continue;
    const { data } = await supabase
      .from('businesses')
      .select(businessFields)
      .eq('is_active', true)
      .contains('ai_tags', [keyword])
      .order('avg_rating', { ascending: false })
      .limit(10);

    addResults(data as AnyRow[] | undefined);
  }

  {
    const { data } = await supabase
      .from('businesses')
      .select(businessFields)
      .eq('is_active', true)
      .or(buildBusinessOr(keywords, ['display_name', 'display_name_zh', 'short_desc_zh', 'ai_summary_zh']))
      .order('avg_rating', { ascending: false })
      .limit(12);

    addResults(data as AnyRow[] | undefined);
  }

  results.sort((a, b) => {
    const aText = [a.display_name_zh, a.display_name, a.short_desc_zh, a.ai_summary_zh].filter(Boolean).join(' ');
    const bText = [b.display_name_zh, b.display_name, b.short_desc_zh, b.ai_summary_zh].filter(Boolean).join(' ');
    const aHasKeyword = keywords.some((keyword) => aText.includes(keyword));
    const bHasKeyword = keywords.some((keyword) => bText.includes(keyword));
    const aInCategory = categoryBizIds.has(String(a.id));
    const bInCategory = categoryBizIds.has(String(b.id));
    const aTier = aHasKeyword ? 0 : aInCategory ? 1 : 2;
    const bTier = bHasKeyword ? 0 : bInCategory ? 1 : 2;

    if (aTier !== bTier) return aTier - bTier;
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return Number(b.avg_rating || 0) - Number(a.avg_rating || 0);
  });

  const finalBusinesses = results.slice(0, 12);
  const topBusinessIds = finalBusinesses.slice(0, 8).map((business) => String(business.id));
  let reviewsByBiz: Record<string, string[]> = {};

  if (topBusinessIds.length > 0) {
    const { data: reviewData } = await supabase
      .from('reviews')
      .select('business_id, rating, body, google_author_name')
      .eq('status', 'approved')
      .in('business_id', topBusinessIds)
      .order('rating', { ascending: false })
      .limit(24);

    for (const review of (reviewData || []) as AnyRow[]) {
      const businessId = String(review.business_id || '');
      if (!businessId) continue;
      if (!reviewsByBiz[businessId]) reviewsByBiz[businessId] = [];
      if (reviewsByBiz[businessId].length >= 2) continue;
      const body = String(review.body || '').trim();
      if (!body) continue;
      const author = String(review.google_author_name || '用户');
      const rating = review.rating ? `${review.rating}星` : '';
      reviewsByBiz[businessId].push(`“${body.slice(0, 36)}”(${author}${rating ? `, ${rating}` : ''})`);
    }
  }

  return finalBusinesses.map((business) => ({
    type: '商家',
    title: String(business.display_name_zh || business.display_name || '未命名商家'),
    url: `/businesses/${String(business.slug || '')}`,
    snippet: toSnippet(
      business.short_desc_zh || business.ai_summary_zh,
      buildBusinessSnippet(business, reviewsByBiz[String(business.id)] || []),
    ),
  }));
}

async function searchArticles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  keywords: string[],
  verticals: string[],
  typeLabel: '新闻' | '指南',
): Promise<SourceItem[]> {
  const { data } = await supabase
    .from('articles')
    .select('slug, title_zh, title_en, ai_summary_zh, summary_zh, body_zh, content_vertical')
    .eq('editorial_status', 'published')
    .in('content_vertical', verticals)
    .or(buildOr(keywords, ['title_zh', 'title_en', 'ai_summary_zh', 'summary_zh', 'body_zh']))
    .limit(10);

  return ((data || []) as AnyRow[]).map((article) => ({
    type: typeLabel,
    title: String(article.title_zh || article.title_en || '未命名内容'),
    url: typeLabel === '新闻' ? `/news/${String(article.slug || '')}` : `/guides/${String(article.slug || '')}`,
    snippet: toSnippet(article.ai_summary_zh || article.summary_zh || article.body_zh),
  }));
}

async function searchForum(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  keywords: string[],
): Promise<SourceItem[]> {
  const { data } = await supabase
    .from('forum_threads')
    .select('slug, title, body, ai_summary_zh, categories:board_id(slug)')
    .eq('status', 'published')
    .or(buildOr(keywords, ['title', 'body', 'ai_summary_zh']))
    .limit(8);

  return ((data || []) as AnyRow[]).map((thread) => {
    const boardSlug =
      typeof thread.categories === 'object' && thread.categories && 'slug' in thread.categories
        ? String((thread.categories as AnyRow).slug || 'general')
        : 'general';

    return {
      type: '论坛',
      title: String(thread.title || '论坛帖子'),
      url: `/forum/${boardSlug}/${String(thread.slug || '')}`,
      snippet: toSnippet(thread.ai_summary_zh || thread.body),
    };
  });
}

async function searchDiscover(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  keywords: string[],
): Promise<SourceItem[]> {
  const [posts, profiles] = await Promise.all([
    supabase
      .from('voice_posts')
      .select('slug, title, excerpt, ai_summary_zh')
      .eq('status', 'published')
      .or(buildOr(keywords, ['title', 'content', 'excerpt', 'ai_summary_zh']))
      .limit(6),
    supabase
      .from('profiles')
      .select('username, display_name, headline')
      .neq('profile_type', 'user')
      .or(buildOr(keywords, ['display_name', 'headline', 'username']))
      .limit(4),
  ]);

  return uniqueByUrl([
    ...((posts.data || []) as AnyRow[]).map((post) => ({
      type: '笔记',
      title: String(post.title || '社区笔记'),
      url: `/discover/${String(post.slug || '')}`,
      snippet: toSnippet(post.ai_summary_zh || post.excerpt),
    })),
    ...((profiles.data || []) as AnyRow[]).map((profile) => ({
      type: '达人',
      title: String(profile.display_name || profile.username || '本地达人'),
      url: `/discover/voices/${String(profile.username || '')}`,
      snippet: toSnippet(profile.headline),
    })),
  ]);
}

async function searchEvents(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  keywords: string[],
): Promise<SourceItem[]> {
  const { data } = await supabase
    .from('events')
    .select('slug, title_zh, title_en, summary_zh, venue_name')
    .eq('status', 'published')
    .or(buildOr(keywords, ['title_zh', 'title_en', 'summary_zh', 'venue_name']))
    .limit(6);

  return ((data || []) as AnyRow[]).map((event) => ({
    type: '活动',
    title: String(event.title_zh || event.title_en || '本地活动'),
    url: `/events/${String(event.slug || '')}`,
    snippet: toSnippet(event.summary_zh || event.venue_name),
  }));
}

export async function searchBaamContent(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  query: string;
  keywords: string[];
  intent: HelperIntent;
}): Promise<RetrievalPayload> {
  const contentKeywords = [...new Set([params.query, ...params.keywords].map((item) => item.trim()).filter(Boolean))].slice(0, 6);
  const businessKeywords = [...new Set(params.keywords.map((item) => item.trim()).filter(Boolean))];

  const [businesses, news, guides, forum, discover, events] = await Promise.all([
    searchBusinesses(params.supabase, businessKeywords.length > 0 ? businessKeywords : contentKeywords),
    searchArticles(params.supabase, contentKeywords, ['news_alert', 'news_brief', 'news_explainer', 'news_roundup', 'news_community'], '新闻'),
    searchArticles(params.supabase, contentKeywords, ['guide_howto', 'guide_checklist', 'guide_bestof', 'guide_comparison', 'guide_neighborhood', 'guide_seasonal', 'guide_resource', 'guide_scenario'], '指南'),
    searchForum(params.supabase, contentKeywords),
    searchDiscover(params.supabase, contentKeywords),
    searchEvents(params.supabase, contentKeywords),
  ]);

  const businessTable =
    businesses.length > 0
      ? [
          '| 店名 | 评分 | 评价数 | 电话 | 地址 |',
          '| --- | --- | --- | --- | --- |',
          ...businesses.slice(0, 8).map((item) => {
            const parts = (item.snippet || '').split(' · ');
            const rating = parts.find((part) => part.startsWith('评分')) || '';
            const reviewCount = parts.find((part) => part.includes('条评价')) || '';
            const phone = parts.find((part) => part.startsWith('电话')) || '';
            const address = parts.find((part) => part.startsWith('地址')) || '';
            return `| ${item.title} | ${rating.replace('评分 ', '')} | ${reviewCount.replace('条评价', '')} | ${phone.replace('电话 ', '')} | ${address.replace('地址 ', '')} |`;
          }),
        ].join('\n')
      : '';

  const contextBlocks = [
    businesses.length > 0
      ? `商家结果（按相关度和评分排序）：\n${businesses.map((item, index) => `${index + 1}. ${item.title} | ${item.snippet || ''} | ${item.url}`).join('\n')}${params.intent === 'localRecommendation' && businessTable ? `\n\n推荐表格候选：\n${businessTable}` : ''}`
      : '',
    guides.length > 0
      ? `指南结果：\n${guides.map((item) => `- ${item.title} | ${item.snippet || ''} | ${item.url}`).join('\n')}`
      : '',
    news.length > 0
      ? `新闻结果：\n${news.map((item) => `- ${item.title} | ${item.snippet || ''} | ${item.url}`).join('\n')}`
      : '',
    forum.length > 0
      ? `论坛结果：\n${forum.map((item) => `- ${item.title} | ${item.snippet || ''} | ${item.url}`).join('\n')}`
      : '',
    discover.length > 0
      ? `发现结果：\n${discover.map((item) => `- ${item.title} | ${item.snippet || ''} | ${item.url}`).join('\n')}`
      : '',
    events.length > 0
      ? `活动结果：\n${events.map((item) => `- ${item.title} | ${item.snippet || ''} | ${item.url}`).join('\n')}`
      : '',
  ].filter(Boolean);

  const sources = uniqueByUrl([
    ...businesses,
    ...guides,
    ...news,
    ...discover,
    ...forum,
    ...events,
  ]);

  return {
    sources,
    contextBlocks,
    counts: {
      businesses: businesses.length,
      news: news.length,
      guides: guides.length,
      forum: forum.length,
      discover: discover.length,
      events: events.length,
    },
  };
}
