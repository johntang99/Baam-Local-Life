/**
 * Chinese Helper Layout System — centralized control for all answer type layouts.
 *
 * All visual structure (section spacing, table format, footer style)
 * is controlled here. Builders import these helpers instead of
 * hardcoding markdown structure.
 */

import type { BusinessResult, ContentItem, EventItem, RelatedContent, HelperSource } from './types';
import { pickBusinessDisplayName } from '@/lib/business-name';

// ─── Section Spacing ──────────────────────────────────────────

/** Start a new section with a heading */
export function section(icon: string, title: string): string {
  return `### ${icon} ${title}`;
}

/** Horizontal rule separator */
export function divider(): string {
  return '---';
}

/** Closing CTA line */
export function closingCta(text: string): string {
  return text;
}

/** Join sections with proper spacing */
export function joinSections(...blocks: (string | string[] | null | undefined | false)[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    if (!block) continue;
    const text = Array.isArray(block) ? block.filter(Boolean).join('\n') : block;
    if (!text.trim()) continue;
    if (parts.length > 0) parts.push('');
    parts.push(text);
  }
  return parts.join('\n');
}

// ─── Business Table ───────────────────────────────────────────

function bizName(b: BusinessResult): string {
  return pickBusinessDisplayName(b as unknown as Record<string, unknown>, '商家');
}

/** Shorten address to street + city */
export function shortAddress(addr: string | null): string {
  if (!addr) return '';
  const parts = addr.split(',').map(p => p.trim());
  return parts.slice(0, 2).join(', ') || parts[0] || '';
}

/** Build a ranked business table (used by Type 1, 4) */
export function businessTable(businesses: BusinessResult[], maxRows = 10): string {
  const header = '| # | 名称 | 评分 | 电话 | 地址 |\n|---|---|---|---|---|';
  const rows = businesses.slice(0, maxRows).map((b, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1);
    const name = `[${bizName(b)}](/zh/businesses/${b.slug})`;
    const rating = b.avg_rating ? `${b.avg_rating}⭐ (${b.review_count || 0})` : '—';
    const phone = b.phone || '—';
    const addr = shortAddress(b.address_full) || '—';
    return `| ${medal} | ${name} | ${rating} | ${phone} | ${addr} |`;
  });
  return header + '\n' + rows.join('\n');
}

/** Build a comparison table (used by Type 10) */
export function comparisonTable(a: BusinessResult, b: BusinessResult): string {
  const lines: string[] = [];
  lines.push(`| | ${bizName(a)} | ${bizName(b)} |`);
  lines.push('| --- | --- | --- |');
  const aRating = a.avg_rating ? `${a.avg_rating}⭐ (${a.review_count || 0})` : '—';
  const bRating = b.avg_rating ? `${b.avg_rating}⭐ (${b.review_count || 0})` : '—';
  lines.push(`| ⭐ 评分 | ${aRating} | ${bRating} |`);
  lines.push(`| 📞 电话 | ${a.phone || '—'} | ${b.phone || '—'} |`);
  lines.push(`| 📍 地址 | ${shortAddress(a.address_full) || '—'} | ${shortAddress(b.address_full) || '—'} |`);
  return lines.join('\n');
}

/** Build an events table (used by Type 6) */
export function eventsTable(events: EventItem[], maxRows = 6): string {
  const lines: string[] = [];
  lines.push('| 日期 | 活动 | 地点 | 免费? |');
  lines.push('| --- | --- | --- | --- |');
  for (const e of events.slice(0, maxRows)) {
    const date = new Date(e.startAt);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    const freeLabel = e.isFree ? '✅ 免费' : (e.ticketPrice || '💲 收费');
    lines.push(`| ${dateStr} | [${e.title}](/zh/events/${e.slug}) | ${e.venueName} | ${freeLabel} |`);
  }
  return lines.join('\n');
}

// ─── Related Content Section ──────────────────────────────────

export function relatedContentSection(related: RelatedContent): string {
  const blocks: string[] = [];
  const fmt = (title: string, url: string, snippet?: string) =>
    snippet ? `- **[${title}](${url})**  \n  *${snippet}*` : `- **[${title}](${url})**`;

  if (related.guides.length > 0) {
    blocks.push('', section('📘', '相关指南'), '');
    for (const g of related.guides) blocks.push(fmt(g.title, `/zh/guides/${g.slug}`, g.snippet));
  }
  if (related.news.length > 0) {
    blocks.push('', section('📰', '相关新闻'), '');
    for (const n of related.news) blocks.push(fmt(n.title, `/zh/news/${n.slug}`, n.snippet));
  }
  if (related.forum.length > 0) {
    blocks.push('', section('💬', '社区讨论'), '');
    for (const t of related.forum) blocks.push(fmt(t.title, `/zh/forum/${t.boardSlug || 'general'}/${t.slug}`, t.snippet));
  }
  if (related.discover.length > 0) {
    blocks.push('', section('📝', '社区分享'), '');
    for (const d of related.discover) blocks.push(fmt(d.title, `/zh/discover/${d.slug}`, d.snippet));
  }
  return blocks.join('\n');
}

// ─── Sources Builders ─────────────────────────────────────────

export function buildBusinessSources(businesses: BusinessResult[]): HelperSource[] {
  return businesses.map(b => ({
    type: '商家',
    title: bizName(b),
    url: `/businesses/${b.slug}`,
    snippet: b.short_desc_zh || b.short_desc_en || [
      b.avg_rating ? `评分 ${b.avg_rating}` : '',
      b.review_count ? `${b.review_count} 条评价` : '',
      b.phone || '',
    ].filter(Boolean).join(' · '),
  }));
}

export function buildRelatedSources(related: RelatedContent): HelperSource[] {
  const sources: HelperSource[] = [];
  for (const g of related.guides) sources.push({ type: '指南', title: g.title, url: `/guides/${g.slug}`, snippet: g.snippet });
  for (const n of related.news) sources.push({ type: '新闻', title: n.title, url: `/news/${n.slug}`, snippet: n.snippet });
  for (const t of related.forum) sources.push({ type: '论坛', title: t.title, url: `/forum/${t.boardSlug || 'general'}/${t.slug}`, snippet: t.snippet });
  for (const d of related.discover) sources.push({ type: '发现', title: d.title, url: `/discover/${d.slug}`, snippet: d.snippet });
  return sources;
}
