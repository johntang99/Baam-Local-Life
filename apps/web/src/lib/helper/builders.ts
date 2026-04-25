/**
 * Chinese Helper Answer Builders — one function per answer type.
 * Each builder returns { answer: string, sources: HelperSource[] }
 *
 * All layout structure is controlled by ./layout.ts
 */

import type { AllocationResult, HelperSource, ContentItem, EventItem } from './types';
import {
  section, divider, closingCta, joinSections,
  businessTable, comparisonTable, eventsTable,
  relatedContentSection,
  buildBusinessSources, buildRelatedSources,
} from './layout';
import { pickBusinessDisplayName } from '@/lib/business-name';
import type { BusinessResult } from './types';

interface BuildResult {
  answer: string;
  sources: HelperSource[];
}

function bizName(b: BusinessResult): string {
  return pickBusinessDisplayName(b as unknown as Record<string, unknown>, '商家');
}

function locationText(alloc: AllocationResult): string {
  if (!alloc.regionLabel) return '';
  return alloc.locationFallback ? `（${alloc.regionLabel}附近）` : `（${alloc.regionLabel}）`;
}

// ─── Type 1: Business Recommendation ────────────────────────

export function buildBusinessRecommendation(alloc: AllocationResult): BuildResult {
  const { businesses, matchedCategory, related } = alloc;
  const catLabel = matchedCategory || alloc.keywords.join(' ');
  const loc = locationText(alloc);
  const total = businesses.length;

  const topPick = businesses[0];
  const highestRated = [...businesses].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))[0];

  const answer = joinSections(
    `以下是${catLabel}${loc}的推荐 — 共找到 ${total} 个选项，按综合评分排序：`,
    businessTable(businesses, 10),
    [
      section('💡', '我的推荐'),
      topPick ? `- **最受欢迎：** ${bizName(topPick)} — ${topPick.avg_rating || ''}⭐，${topPick.review_count || 0} 条评价` : '',
      highestRated && highestRated.id !== topPick?.id ? `- **评分最高：** ${bizName(highestRated)} — ${highestRated.avg_rating}⭐` : '',
      businesses[1] ? `- **也很不错：** ${bizName(businesses[1])}` : '',
      businesses[2] && businesses[2].id !== highestRated?.id ? `- **值得一试：** ${bizName(businesses[2])}` : '',
    ],
    [
      section('📌', '小贴士'),
      alloc.locationFallback && alloc.regionLabel ? `- 📍 ${alloc.regionLabel}暂无${catLabel}结果，显示附近区域` : '',
      '- 📞 建议提前致电确认营业时间',
      '- 👆 点击商家名称查看详细信息和评价',
    ],
    relatedContentSection(related),
    divider(),
    closingCta('想要缩小范围？告诉我你的偏好 — 预算、位置或具体需求！'),
  );

  return {
    answer,
    sources: [...buildBusinessSources(businesses), ...buildRelatedSources(related)],
  };
}

// ─── Type 9: Business Lookup ────────────────────────────────

export function buildBusinessLookup(alloc: AllocationResult, query: string): BuildResult {
  const biz = alloc.singleBusiness;
  if (!biz) return { answer: '抱歉，没有找到该商家。', sources: [] };

  const name = bizName(biz);
  const desc = biz.short_desc_zh || biz.short_desc_en || '';
  const q = query.toLowerCase();
  const asksHours = /营业|开门|关门|几点|时间|sunday|saturday|open|hours/.test(q);
  const asksPhone = /电话|联系|打电话|phone|call|contact/.test(q);
  const asksReviews = /评价|评分|好不好|怎么样|review|rating/.test(q);

  const header = [
    `## ${name}`,
    '',
    biz.avg_rating ? `⭐ **${biz.avg_rating}/5**，${biz.review_count || 0} 条评价` : '',
    '',
    desc || '',
  ];

  const details = [
    section('📍', '详细信息'),
    biz.address_full ? `- **地址：** [${biz.address_full}](https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.address_full)})` : '',
    biz.phone ? `- **电话：** [${biz.phone}](tel:${biz.phone.replace(/\D/g, '').replace(/^(\d{10})$/, '+1$1')})` : '',
    biz.website_url ? `- **网站：** [${biz.website_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')}](${biz.website_url})` : '',
  ];

  const contextual: string[] = [];
  if (asksHours) {
    contextual.push(section('🕐', '营业时间'));
    contextual.push(`目前没有精确的营业时间数据 — 建议直接致电 **${biz.phone || '商家'}** 或查看 Google 地图获取最新营业时间。`);
  }
  if (asksPhone && biz.phone) {
    contextual.push(section('📞', '联系方式'));
    contextual.push(`您可以拨打 **[${biz.phone}](tel:${biz.phone.replace(/\D/g, '').replace(/^(\d{10})$/, '+1$1')})** 联系他们。`);
  }
  if (asksReviews) {
    contextual.push(section('⭐', '用户评价'));
    if (biz.avg_rating && biz.avg_rating >= 4.5) {
      contextual.push(`**${biz.avg_rating}/5** 的评分，${biz.review_count} 条评价 — 是该区域评价最高的商家之一！`);
    } else if (biz.avg_rating) {
      contextual.push(`**${biz.avg_rating}/5** 的评分，${biz.review_count} 条评价 — 口碑稳定，值得信赖。`);
    }
  }

  const answer = joinSections(
    header,
    details,
    contextual.length > 0 ? contextual : null,
    `👆 [在 Baam 上查看完整资料](/zh/businesses/${biz.slug})`,
    divider(),
    closingCta('需要了解更多？可以问我关于**类似商家**、**路线指引**或**附近其他选择**！'),
  );

  return { answer, sources: buildBusinessSources([biz]) };
}

// ─── Type 2: Guide / How-To ────────────────────────────────

export function buildGuideAnswer(_alloc: AllocationResult, aiAnswer: string): BuildResult {
  const answer = joinSections(
    aiAnswer,
    divider(),
    closingCta('需要更多细节？继续问我就好！'),
  );
  return { answer, sources: [] };
}

// ─── Type 3: Info Lookup ────────────────────────────────────

export function buildInfoLookup(_alloc: AllocationResult, aiAnswer: string): BuildResult {
  const answer = joinSections(
    aiAnswer,
    divider(),
    closingCta('还想了解什么？继续问我！'),
  );
  return { answer, sources: [] };
}

// ─── Type 4: Mixed (Info + Business) ────────────────────────

export function buildMixedAnswer(alloc: AllocationResult, aiAnswer: string): BuildResult {
  const { businesses, matchedCategory } = alloc;
  const loc = locationText(alloc);

  let bizSection: string | null = null;
  if (businesses.length > 0 && !aiAnswer.includes('| # |') && !aiAnswer.includes('| 名称 |')) {
    const categoryLabel = matchedCategory || alloc.keywords.join(' ');
    bizSection = joinSections(
      section('🏪', `${categoryLabel}推荐${loc}`),
      businessTable(businesses, 5),
    );
  }

  const answer = joinSections(
    aiAnswer,
    bizSection,
    divider(),
    closingCta('想深入了解信息还是商家推荐？告诉我！'),
  );

  return { answer, sources: buildBusinessSources(businesses.slice(0, 5)) };
}

// ─── Type 5: Community / Discover ───────────────────────────

export function buildCommunityAnswer(
  alloc: AllocationResult,
  forum: ContentItem[],
  discover: ContentItem[],
): BuildResult {
  const topic = alloc.keywords.join(' ') || '这个话题';

  if (forum.length === 0 && discover.length === 0) {
    const answer = joinSections(
      `暂时没有找到关于"${topic}"的社区讨论。`,
      [
        section('💡', '成为第一个分享的人'),
        '- 💬 [在论坛发起讨论](/zh/forum) — 邻居们会很快回复',
        '- 📝 [在发现频道分享经验](/zh/discover) — 帮助社区里的其他人',
      ],
      divider(),
      closingCta('要我帮你找**相关商家**或**生活指南**吗？'),
    );
    return { answer, sources: [] };
  }

  const forumBlock = forum.length > 0 ? [
    section('💬', '社区讨论'),
    ...forum.slice(0, 5).flatMap(t => {
      const replies = t.replyCount ? ` · ${t.replyCount} 条回复` : '';
      const lines = [`- [${t.title}](/zh/forum/${t.boardSlug || 'general'}/${t.slug})${replies}`];
      if (t.snippet) lines.push(`  > ${t.snippet.slice(0, 120)}...`);
      return lines;
    }),
  ] : null;

  const discoverBlock = discover.length > 0 ? [
    section('📝', '社区分享'),
    ...discover.slice(0, 5).flatMap(d => {
      const likes = d.likeCount ? ` · ❤️ ${d.likeCount}` : '';
      const lines = [`- [${d.title}](/zh/discover/${d.slug})${likes}`];
      if (d.snippet) lines.push(`  > ${d.snippet.slice(0, 120)}...`);
      return lines;
    }),
  ] : null;

  const answer = joinSections(
    `以下是社区里关于**${topic}**的讨论和分享：`,
    forumBlock,
    discoverBlock,
    [
      section('💡', '加入讨论'),
      '- 💬 [在论坛发表你的看法](/zh/forum)',
      '- 📝 [在发现频道写一篇分享](/zh/discover)',
    ],
    divider(),
    closingCta('要我帮你找**相关商家**或**生活指南**吗？'),
  );

  const sources: HelperSource[] = [
    ...forum.slice(0, 5).map(t => ({ type: '论坛', title: t.title, url: `/forum/${t.boardSlug || 'general'}/${t.slug}`, snippet: t.snippet })),
    ...discover.slice(0, 5).map(d => ({ type: '发现', title: d.title, url: `/discover/${d.slug}`, snippet: d.snippet })),
  ];

  return { answer, sources };
}

// ─── Type 6: News & Events ─────────────────────────────────

export function buildNewsEventsAnswer(
  alloc: AllocationResult,
  news: ContentItem[],
  events: EventItem[],
): BuildResult {
  const topic = alloc.keywords.join(' ') || '本地动态';

  if (news.length === 0 && events.length === 0) {
    const answer = joinSections(
      `暂时没有找到关于"${topic}"的新闻或活动。`,
      [
        section('🧭', '试试这些'),
        '- 📰 [浏览全部新闻](/zh/news)',
        '- 🎉 [查看近期活动](/zh/events)',
      ],
      divider(),
      closingCta('还想了解什么？可以换个方式问我！'),
    );
    return { answer, sources: [] };
  }

  const newsBlock = news.length > 0 ? [
    section('📰', '最新新闻'),
    ...news.slice(0, 5).flatMap(n => {
      const lines = [`- [${n.title}](/zh/news/${n.slug})`];
      if (n.snippet) lines.push(`  > ${n.snippet.slice(0, 140)}`);
      return lines;
    }),
  ] : null;

  const eventsBlock = events.length > 0 ? joinSections(
    section('🎉', '近期活动'),
    eventsTable(events, 6),
  ) : null;

  const answer = joinSections(
    `以下是关于**${topic}**的最新动态：`,
    newsBlock,
    eventsBlock,
    divider(),
    closingCta('想了解更多细节？告诉我你感兴趣的！'),
  );

  const sources: HelperSource[] = [
    ...news.slice(0, 5).map(n => ({ type: '新闻' as const, title: n.title, url: `/news/${n.slug}`, snippet: n.snippet })),
    ...events.slice(0, 6).map(e => ({ type: '活动' as const, title: e.title, url: `/events/${e.slug}` })),
  ];

  return { answer, sources };
}

// ─── Type 10: Comparison ────────────────────────────────────

export function buildComparisonAnswer(alloc: AllocationResult): BuildResult {
  const pair = alloc.comparisonPair;
  if (!pair) {
    return { answer: '抱歉，没有找到这两家商家来对比。请试试更具体的名称。', sources: [] };
  }

  const [a, b] = pair;
  const nameA = bizName(a);
  const nameB = bizName(b);

  // Quick verdict
  const aRat = a.avg_rating || 0;
  const bRat = b.avg_rating || 0;
  const aRev = a.review_count || 0;
  const bRev = b.review_count || 0;
  const aScore = aRat * Math.log2(aRev + 1);
  const bScore = bRat * Math.log2(bRev + 1);

  const verdictLines: string[] = [];
  if (Math.abs(aScore - bScore) < 0.5) {
    verdictLines.push('两家都是不错的选择！综合评价非常接近。');
    if (aRat > bRat) verdictLines.push(`- **${nameA}** 评分略高（${aRat} vs ${bRat}）`);
    else if (bRat > aRat) verdictLines.push(`- **${nameB}** 评分略高（${bRat} vs ${aRat}）`);
    if (aRev > bRev * 1.3) verdictLines.push(`- **${nameA}** 评价数更多（${aRev} vs ${bRev}）— 更受欢迎`);
    else if (bRev > aRev * 1.3) verdictLines.push(`- **${nameB}** 评价数更多（${bRev} vs ${aRev}）— 更受欢迎`);
  } else {
    const winner = aScore > bScore ? a : b;
    const loser = aScore > bScore ? b : a;
    const wName = bizName(winner);
    const lName = bizName(loser);
    const wRat = aScore > bScore ? aRat : bRat;
    const lRat = aScore > bScore ? bRat : aRat;
    const wRev = aScore > bScore ? aRev : bRev;
    const lRev = aScore > bScore ? bRev : aRev;

    verdictLines.push(`**${wName}** 总体更胜一筹。`);
    if (wRat > lRat && wRev > lRev) {
      verdictLines.push(`- 评分更高（${wRat} vs ${lRat}）且评价更多（${wRev} vs ${lRev}）— 明显优势`);
    } else if (wRat > lRat) {
      verdictLines.push(`- 评分更高（${wRat} vs ${lRat}），不过 ${lName} 的评价数更多（${lRev} vs ${wRev}）`);
    } else if (wRev > lRev) {
      verdictLines.push(`- 评价数更多（${wRev} vs ${lRev}），不过 ${lName} 评分略高（${lRat} vs ${wRat}）`);
    }
    verdictLines.push(`- **${lName}** 也是不错的选择 — ${lRat}⭐，${lRev} 条评价`);
  }

  const descBlock = (a.short_desc_zh || b.short_desc_zh) ? [
    section('📋', '简介'),
    a.short_desc_zh ? `- **${nameA}：** ${a.short_desc_zh}` : '',
    b.short_desc_zh ? `- **${nameB}：** ${b.short_desc_zh}` : '',
  ] : null;

  const answer = joinSections(
    `## ${nameA} vs ${nameB}`,
    comparisonTable(a, b),
    descBlock,
    [
      section('💡', '快速对比'),
      ...verdictLines,
    ],
    `👆 查看完整资料：[${nameA}](/zh/businesses/${a.slug}) · [${nameB}](/zh/businesses/${b.slug})`,
    divider(),
    closingCta('想对比菜单、价格或位置便利性？告诉我！'),
  );

  return { answer, sources: buildBusinessSources([a, b]) };
}

// ─── Type 8: No Match ───────────────────────────────────────

export function buildNoMatch(query: string, keywords: string[]): BuildResult {
  const answer = joinSections(
    `抱歉，我暂时没有找到关于"${keywords.join(' ')}"的具体结果。`,
    [
      section('💡', '我可以帮你'),
      '- 🏪 **找商家** — 餐厅、医生、律师、修车等',
      '- 📋 **办事指南** — 驾照、报税、移民等流程',
      '- 💬 **社区讨论** — 看看其他人怎么说',
      '- 📰 **最新消息** — 本地新闻和活动',
    ],
    divider(),
    closingCta('换个方式问问？或者直接告诉我你需要什么帮助！'),
  );

  return { answer, sources: [] };
}
