/**
 * Chinese Helper Answer Builders — one function per answer type
 * Generates Chinese markdown answers with business tables, tips, etc.
 */

import type { AllocationResult, BusinessResult, HelperSource } from './types';
import { buildBusinessSources } from './data';
import { pickBusinessDisplayName } from '@/lib/business-name';

function bizName(b: BusinessResult): string {
  return pickBusinessDisplayName(b as unknown as Record<string, unknown>, '商家');
}

function relatedContentSection(related: AllocationResult['related']): string {
  const blocks: string[] = [];
  const fmt = (title: string, url: string, snippet?: string) =>
    snippet ? `- **[${title}](${url})**  \n  *${snippet}*` : `- **[${title}](${url})**`;

  if (related.guides.length > 0) {
    blocks.push('', '### 📘 相关指南', '');
    for (const g of related.guides) blocks.push(fmt(g.title, `/zh/guides/${g.slug}`, g.snippet));
  }
  if (related.news.length > 0) {
    blocks.push('', '### 📰 相关新闻', '');
    for (const n of related.news) blocks.push(fmt(n.title, `/zh/news/${n.slug}`, n.snippet));
  }
  if (related.forum.length > 0) {
    blocks.push('', '### 💬 社区讨论', '');
    for (const t of related.forum) blocks.push(fmt(t.title, `/zh/forum/${t.boardSlug || 'general'}/${t.slug}`, t.snippet));
  }
  if (related.discover.length > 0) {
    blocks.push('', '### 📝 社区分享', '');
    for (const d of related.discover) blocks.push(fmt(d.title, `/zh/discover/${d.slug}`, d.snippet));
  }
  return blocks.join('\n');
}

function buildRelatedSources(related: AllocationResult['related']): HelperSource[] {
  const sources: HelperSource[] = [];
  for (const g of related.guides) sources.push({ type: '指南', title: g.title, url: `/guides/${g.slug}`, snippet: g.snippet });
  for (const n of related.news) sources.push({ type: '新闻', title: n.title, url: `/news/${n.slug}`, snippet: n.snippet });
  for (const t of related.forum) sources.push({ type: '论坛', title: t.title, url: `/forum/${t.boardSlug || 'general'}/${t.slug}`, snippet: t.snippet });
  for (const d of related.discover) sources.push({ type: '发现', title: d.title, url: `/discover/${d.slug}`, snippet: d.snippet });
  return sources;
}

function locationText(alloc: AllocationResult): string {
  if (!alloc.regionLabel) return '';
  return alloc.locationFallback ? `（${alloc.regionLabel}附近）` : `（${alloc.regionLabel}）`;
}

// ─── Type 1: Business Recommendation ────────────────────────

export function buildBusinessRecommendation(alloc: AllocationResult): { answer: string; sources: HelperSource[] } {
  const { businesses, matchedCategory } = alloc;
  const catLabel = matchedCategory || alloc.keywords.join(' ');
  const loc = locationText(alloc);
  const total = businesses.length;

  // Build table
  const tableHeader = '| # | 名称 | 评分 | 电话 | 地址 |\n|---|---|---|---|---|';
  const tableRows = businesses.slice(0, 10).map((b, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1);
    const name = `[${bizName(b)}](/zh/businesses/${b.slug})`;
    const rating = `${b.avg_rating || '—'}⭐ (${b.review_count || 0})`;
    const phone = b.phone ? `[${b.phone}](tel:${b.phone.replace(/\D/g, '').replace(/^(\d{10})$/, '+1$1')})` : '—';
    const addr = b.address_full ? `[${b.address_full.split(',').slice(0, 2).join(',')}](https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address_full)})` : '—';
    return `| ${medal} | ${name} | ${rating} | ${phone} | ${addr} |`;
  }).join('\n');

  const topPick = businesses[0];
  const highestRated = [...businesses].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))[0];

  const answer = [
    `以下是${catLabel}${loc}的推荐 — 共找到 ${total} 个选项，按综合评分排序：`,
    '',
    tableHeader,
    tableRows,
    '',
    '### 💡 我的推荐',
    '',
    topPick ? `- **最受欢迎：** ${bizName(topPick)} — ${topPick.avg_rating || ''}⭐，${topPick.review_count || 0} 条评价` : '',
    highestRated && highestRated.id !== topPick?.id ? `- **评分最高：** ${bizName(highestRated)} — ${highestRated.avg_rating}⭐` : '',
    businesses[1] ? `- **也很不错：** ${bizName(businesses[1])}` : '',
    businesses[2] && businesses[2].id !== highestRated?.id ? `- **值得一试：** ${bizName(businesses[2])}` : '',
    '',
    '### 📌 小贴士',
    '',
    alloc.locationFallback && alloc.regionLabel ? `- 📍 ${alloc.regionLabel}暂无${catLabel}结果，显示附近区域` : '',
    '- 📞 建议提前致电确认营业时间',
    '- 👆 点击商家名称查看详细信息和评价',
    alloc.related ? relatedContentSection(alloc.related) : '',
    '',
    '---',
    '',
    '想要缩小范围？告诉我你的偏好 — 预算、位置或具体需求！',
  ].filter(Boolean).join('\n');

  return {
    answer,
    sources: [...buildBusinessSources(businesses), ...(alloc.related ? buildRelatedSources(alloc.related) : [])],
  };
}

// ─── Type 9: Business Lookup ────────────────────────────────

export function buildBusinessLookup(alloc: AllocationResult, query: string): { answer: string; sources: HelperSource[] } {
  const biz = alloc.singleBusiness;
  if (!biz) return { answer: '抱歉，没有找到该商家。', sources: [] };

  const name = bizName(biz);
  const desc = biz.short_desc_zh || biz.short_desc_en || '';

  const answer = [
    `## ${name}`,
    biz.avg_rating ? `⭐ ${biz.avg_rating}/5，${biz.review_count || 0} 条评价` : '',
    desc ? `\n${desc}` : '',
    '',
    '### 📍 详细信息',
    '',
    biz.address_full ? `- **地址：** [${biz.address_full}](https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.address_full)})` : '',
    biz.phone ? `- **电话：** [${biz.phone}](tel:${biz.phone.replace(/\D/g, '').replace(/^(\d{10})$/, '+1$1')})` : '',
    biz.website_url ? `- **网站：** [${biz.website_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')}](${biz.website_url})` : '',
    '',
    `👉 [在 Baam 上查看完整资料](/zh/businesses/${biz.slug})`,
    '',
    '---',
    '',
    `需要了解更多？可以问我关于**类似商家**、**路线指引**或**附近其他选择**！`,
  ].filter(Boolean).join('\n');

  return {
    answer,
    sources: buildBusinessSources([biz]),
  };
}

// ─── Type 8: No Match ───────────────────────────────────────

export function buildNoMatch(query: string, keywords: string[]): { answer: string; sources: HelperSource[] } {
  const answer = [
    `抱歉，我暂时没有找到关于"${keywords.join(' ')}"的具体结果。`,
    '',
    '### 💡 我可以帮你：',
    '',
    '- 🏪 **找商家** — 餐厅、医生、律师、修车等',
    '- 📋 **办事指南** — 驾照、报税、移民等流程',
    '- 💬 **社区讨论** — 看看其他人怎么说',
    '- 📰 **最新消息** — 本地新闻和活动',
    '',
    '---',
    '',
    '换个方式问问？或者直接告诉我你需要什么帮助！',
  ].join('\n');

  return { answer, sources: [] };
}
