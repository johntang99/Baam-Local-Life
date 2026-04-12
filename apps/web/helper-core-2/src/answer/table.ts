/**
 * Recommendation table building and post-processing utilities.
 * Extracted from helper-core v1 index.ts.
 */

import type { SourceItem } from '../types';

type BusinessMetadata = {
  avgRating?: number | null;
  reviewCount?: number | null;
  totalScore?: number | null;
  phone?: string | null;
  address?: string | null;
  displayName?: string | null;
  displayNameZh?: string | null;
  briefDesc?: string | null;
  isFeatured?: boolean;
  locationMatched?: boolean;
};

export function readBusinessMetadata(source: SourceItem): BusinessMetadata {
  const metadata: Record<string, unknown> =
    source.metadata && typeof source.metadata === 'object' ? source.metadata : {};
  return {
    avgRating: typeof metadata.avgRating === 'number' ? metadata.avgRating : null,
    reviewCount: typeof metadata.reviewCount === 'number' ? metadata.reviewCount : null,
    totalScore: typeof metadata.totalScore === 'number' ? metadata.totalScore : null,
    phone: typeof metadata.phone === 'string' ? metadata.phone : null,
    address: typeof metadata.address === 'string' ? metadata.address : null,
    displayName: typeof metadata.displayName === 'string' ? metadata.displayName : null,
    displayNameZh: typeof metadata.displayNameZh === 'string' ? metadata.displayNameZh : null,
    briefDesc: typeof metadata.briefDesc === 'string' ? metadata.briefDesc : null,
    isFeatured: Boolean(metadata.isFeatured),
    locationMatched: Boolean(metadata.locationMatched),
  };
}

export function normalizeCell(value: string): string {
  return value.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
}

const invalidNamePatterns = [/点击查看地图/i, /^查看地图$/i, /^地图$/i, /^google\s*map/i];

function isInvalidName(name: string): boolean {
  if (!name) return true;
  const normalized = name.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, '').trim();
  if (!normalized) return true;
  return invalidNamePatterns.some((pattern) => pattern.test(normalized));
}

function titleFromSlug(url: string): string {
  const parts = url.split('/').filter(Boolean);
  const slug = parts[parts.length - 1] || '';
  if (!slug) return 'Unnamed';
  return slug.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function resolveBusinessTitle(candidate: SourceItem, meta: BusinessMetadata): string {
  const candidateTitle = normalizeCell(candidate.title || '');
  if (!isInvalidName(candidateTitle)) return candidateTitle;
  const zh = normalizeCell(meta.displayNameZh || '');
  if (!isInvalidName(zh)) return zh;
  const en = normalizeCell(meta.displayName || '');
  if (!isInvalidName(en)) return en;
  return titleFromSlug(candidate.url);
}

export interface TableConfig {
  /** Table headers. Default: Chinese headers */
  headers: string[];
  /** Locale path prefix, e.g., '/zh' or '/en' */
  localePathPrefix: string;
  /** Business path prefix, e.g., '/businesses/' */
  businessPathPrefix: string;
  /** Placeholder for missing data */
  placeholder: string;
}

const defaultTableConfig: TableConfig = {
  headers: ['排名', '店名', '评分/评价', '电话', '地址', '推荐理由'],
  localePathPrefix: '/zh',
  businessPathPrefix: '/businesses/',
  placeholder: '待确认',
};

function buildReasonFromMetadata(meta: BusinessMetadata, locale: 'zh' | 'en'): string {
  const briefDesc = normalizeCell(meta.briefDesc || '').replace(/[。！!？?]+$/g, '');
  if (briefDesc) {
    return briefDesc.length > 28 ? `${briefDesc.slice(0, 28)}...` : briefDesc;
  }
  const reasons: string[] = [];
  if (locale === 'zh') {
    if (typeof meta.avgRating === 'number' && meta.avgRating >= 4.7) reasons.push('评分高');
    if (typeof meta.reviewCount === 'number' && meta.reviewCount >= 1000) reasons.push('评价基数大');
    if (meta.locationMatched) reasons.push('区域匹配');
    if (meta.isFeatured) reasons.push('平台精选');
    return reasons.length > 0 ? reasons.join('，') : '信息完整，建议先电话确认';
  }
  if (typeof meta.avgRating === 'number' && meta.avgRating >= 4.7) reasons.push('highly rated');
  if (typeof meta.reviewCount === 'number' && meta.reviewCount >= 1000) reasons.push('popular');
  if (meta.locationMatched) reasons.push('nearby');
  if (meta.isFeatured) reasons.push('featured');
  return reasons.length > 0 ? reasons.join(', ') : 'verified listing';
}

/**
 * Resolve how many businesses the user requested (e.g., "top 5", "3家").
 */
export function resolveRequestedBusinessCount(query: string): number {
  const topMatch = query.toLowerCase().match(/\btop\s*(\d{1,2})\b/);
  if (topMatch) {
    const value = Number(topMatch[1]);
    if (Number.isFinite(value) && value > 0) return Math.min(20, Math.max(1, value));
  }
  const frontMatch = query.match(/前\s*(\d{1,2})\s*(名|家|个|间|条)?/);
  if (frontMatch) {
    const value = Number(frontMatch[1]);
    if (Number.isFinite(value) && value > 0) return Math.min(20, Math.max(1, value));
  }
  const cnMatch = query.match(/(\d{1,2})\s*(家|个|间|条)/);
  if (cnMatch) {
    const value = Number(cnMatch[1]);
    if (Number.isFinite(value) && value > 0) return Math.min(20, Math.max(1, value));
  }
  return 15;
}

/**
 * Build a strict recommendation table from business candidates.
 */
export function buildStrictRecommendationTable(
  candidates: SourceItem[],
  query: string,
  locale: 'zh' | 'en' = 'zh',
  config?: Partial<TableConfig>,
): string {
  if (candidates.length === 0) return '';
  const sortedCandidates = [...candidates].sort((a, b) => {
    const aMeta = readBusinessMetadata(a);
    const bMeta = readBusinessMetadata(b);
    const scoreDiff = (Number(bMeta.totalScore) || 0) - (Number(aMeta.totalScore) || 0);
    if (scoreDiff !== 0) return scoreDiff;
    const ratingDiff = (Number(bMeta.avgRating) || 0) - (Number(aMeta.avgRating) || 0);
    if (ratingDiff !== 0) return ratingDiff;
    return (Number(bMeta.reviewCount) || 0) - (Number(aMeta.reviewCount) || 0);
  });
  const cfg = { ...defaultTableConfig, ...config };
  if (locale === 'en') {
    cfg.headers = config?.headers ?? ['Rank', 'Name', 'Rating/Reviews', 'Phone', 'Address', 'Why'];
    cfg.localePathPrefix = config?.localePathPrefix ?? '/en';
    cfg.placeholder = config?.placeholder ?? 'TBD';
  }

  const requestedCount = resolveRequestedBusinessCount(query);
  const rowCount = Math.min(requestedCount, sortedCandidates.length);

  const header = [
    `| ${cfg.headers.join(' | ')} |`,
    `| ${cfg.headers.map(() => '---').join(' | ')} |`,
  ];

  const rows = sortedCandidates.slice(0, rowCount).map((candidate, index) => {
    const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : String(index + 1);
    const meta = readBusinessMetadata(candidate);
    const rating = typeof meta.avgRating === 'number' ? String(meta.avgRating) : cfg.placeholder;
    const reviewCount = typeof meta.reviewCount === 'number' ? String(meta.reviewCount) : cfg.placeholder;
    const ratingWithReviews = locale === 'zh'
      ? `${rating}<br>${reviewCount}条评价`
      : `${rating}<br>${reviewCount} reviews`;
    const phone = meta.phone ? normalizeCell(meta.phone) : cfg.placeholder;
    const address = meta.address ? normalizeCell(meta.address) : cfg.placeholder;
    const reason = buildReasonFromMetadata(meta, locale);
    const resolvedTitle = resolveBusinessTitle(candidate, meta);
    const safeTitle = resolvedTitle.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    const href = candidate.url.startsWith('/')
      ? `${cfg.localePathPrefix}${candidate.url}`
      : `${cfg.localePathPrefix}${cfg.businessPathPrefix}${candidate.url}`;
    const linkedTitle = `[${safeTitle}](${href})`;
    return `| ${rank} | ${linkedTitle} | ${ratingWithReviews} | ${phone} | ${address} | ${reason} |`;
  });

  return [...header, ...rows].join('\n');
}

/**
 * Count markdown table data rows (excludes header and divider).
 */
export function countMarkdownTableRows(table: string): number {
  const lines = table.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 3) return 0;
  return Math.max(0, lines.length - 2);
}

/**
 * Harmonize the "N 家" / "Top N" count in answer text to match actual table count.
 */
export function harmonizeRecommendationCount(answer: string, finalCount: number): string {
  if (!answer || finalCount <= 0) return answer;
  const replaced = answer
    .replace(/(筛出[^。\n]*?)(\d+)\s*家/g, (_, prefix) => `${prefix}${finalCount} 家`)
    .replace(/(推荐[^。\n]*?)(\d+)\s*家/g, (_, prefix) => `${prefix}${finalCount} 家`)
    .replace(/(给你[^。\n]*?)(\d+)\s*家/g, (_, prefix) => `${prefix}${finalCount} 家`)
    .replace(/(排名前\s*)(\d+)(\s*(家|名|个|位|条)?)/g, (_, prefix, __, suffix) => `${prefix}${finalCount}${suffix || ''}`)
    .replace(/(前\s*)(\d+)(\s*(家|名|个|位|条)?)/g, (_, prefix, __, suffix) => `${prefix}${finalCount}${suffix || ''}`);
  return replaced.replace(/\bTop\s*\d+\b/gi, `Top ${finalCount}`);
}

/**
 * Replace existing markdown table in answer with a strict one, or append after first paragraph.
 */
export function injectStrictRecommendationTable(answer: string, strictTable: string): string {
  if (!strictTable) return answer;
  const tableRegex = /\|[^\n]*\|\n\|(?:\s*:?-+:?\s*\|)+\n(?:\|[^\n]*\|\n?)*/m;
  if (tableRegex.test(answer)) {
    return answer.replace(tableRegex, strictTable);
  }
  const sections = answer.split('\n\n');
  if (sections.length <= 1) {
    return `${answer}\n\n${strictTable}`;
  }
  return `${sections[0]}\n\n${strictTable}\n\n${sections.slice(1).join('\n\n')}`;
}

type ParsedRecommendationRow = {
  name: string;
  rating: string;
  reviews: string;
  reason: string;
};

function parseRatingValue(value: string): number {
  const m = String(value || '').match(/(\d+(?:\.\d+)?)/);
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function parseReviewCount(value: string): number {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  const n = Number(digits || 0);
  return Number.isFinite(n) ? n : 0;
}

function pickBudgetRow(rows: ParsedRecommendationRow[]): ParsedRecommendationRow {
  if (rows.length === 0) throw new Error('rows required');
  const qualityRows = rows.filter((row) => parseRatingValue(row.rating) >= 4);
  if (qualityRows.length === 0) return rows[rows.length - 1] || rows[0];
  let best = qualityRows[0];
  let bestReviews = parseReviewCount(best.reviews);
  for (const row of qualityRows.slice(1)) {
    const reviews = parseReviewCount(row.reviews);
    if (reviews < bestReviews) {
      best = row;
      bestReviews = reviews;
    }
  }
  return best;
}

function extractPipeCells(row: string): string[] {
  const inner = row.trim().replace(/^\|/, '').replace(/\|$/, '');
  return inner.split('|').map((cell) => cell.trim());
}

function stripMarkdownLink(text: string): string {
  const m = text.match(/\[(.*?)\]\((.*?)\)/);
  return m ? m[1].trim() : text.trim();
}

function parseRowsFromStrictTable(table: string): ParsedRecommendationRow[] {
  const lines = table
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && !/^\|\s*-+/.test(line));
  if (lines.length <= 1) return [];
  const dataLines = lines.slice(1);
  const rows: ParsedRecommendationRow[] = [];
  for (const line of dataLines) {
    const cells = extractPipeCells(line);
    if (cells.length < 6) continue;
    const name = stripMarkdownLink(cells[1]);
    const ratingAndReviews = cells[2] || '';
    const [ratingPart, reviewsPart] = ratingAndReviews.split(/<br\s*\/?>/i).map((x) => (x || '').trim());
    const reason = cells[cells.length - 1] || '';
    rows.push({
      name,
      rating: ratingPart || '待确认',
      reviews: reviewsPart || '评价待确认',
      reason: reason || '口碑稳定',
    });
  }
  return rows;
}

function buildDeterministicRecommendationBlock(rows: ParsedRecommendationRow[], locale: 'zh' | 'en'): string {
  if (rows.length === 0) return '';
  if (locale === 'en') {
    const top = rows[0];
    const safe = rows[1] || rows[0];
    const budget = pickBudgetRow(rows);
    return [
      '🎯 My Picks',
      `- Top pick: ${top.name} (${top.rating}, ${top.reviews}) — ${top.reason}`,
      `- Safe choice: ${safe.name} (${safe.rating}, ${safe.reviews}) — ${safe.reason}`,
      `- Value choice: ${budget.name} (${budget.rating}, ${budget.reviews}) — ${budget.reason}`,
    ].join('\n');
  }
  const top = rows[0];
  const safe = rows[1] || rows[0];
  const budget = pickBudgetRow(rows);
  return [
    '🎯 我的推荐',
    `- 最推荐：${top.name}（${top.rating}分，${top.reviews}）— ${top.reason}`,
    `- 稳妥之选：${safe.name}（${safe.rating}分，${safe.reviews}）— ${safe.reason}`,
    `- 预算友好：${budget.name}（${budget.rating}分，${budget.reviews}）— ${budget.reason}`,
  ].join('\n');
}

export function injectDeterministicRecommendationBlock(
  answer: string,
  strictTable: string,
  locale: 'zh' | 'en' = 'zh',
): string {
  if (!answer || !strictTable) return answer;
  const rows = parseRowsFromStrictTable(strictTable);
  if (rows.length === 0) return answer;
  const block = buildDeterministicRecommendationBlock(rows, locale);
  if (!block) return answer;

  // Remove model-generated "my recommendation" block to avoid drift.
  let cleaned = answer;
  const headingRegex = /(?:🎯|✨|🌟|✅)?\s*(?:我的推荐|我的建议|My Picks|Recommendations)/g;
  const boundaryRegex = /\n(?:💡|📌|🧭|✅|🚀|结论置信度|Confidence|相关来源|Sources)/g;
  // Remove all model recommendation blocks defensively.
  while (true) {
    const headingMatch = headingRegex.exec(cleaned);
    headingRegex.lastIndex = 0;
    if (!headingMatch) break;
    let start = headingMatch.index;
    const prefix = cleaned.slice(Math.max(0, start - 6), start);
    if (prefix.includes('\n---\n')) {
      start = cleaned.lastIndexOf('\n---\n', start);
    }
    boundaryRegex.lastIndex = start + 1;
    const boundaryMatch = boundaryRegex.exec(cleaned);
    const end = boundaryMatch ? boundaryMatch.index : cleaned.length;
    cleaned = `${cleaned.slice(0, start)}\n${cleaned.slice(end)}`;
  }

  // Insert deterministic block after the first markdown table.
  const tableRegex = /\|[^\n]*\|\n\|(?:\s*:?-+:?\s*\|)+\n(?:\|[^\n]*\|\n?)*/m;
  if (tableRegex.test(cleaned)) {
    cleaned = cleaned.replace(tableRegex, (tablePart) => `${tablePart}\n\n${block}`);
  } else {
    cleaned = `${cleaned}\n\n${block}`;
  }
  return cleaned
    .replace(/^\s*[🔥✨🌟🎯✅📌🧭🚀💡🏆][\s\*:_-]*$/gm, '')
    .replace(/^\s*[^\p{L}\p{N}\u4e00-\u9fff]*\*{2,}\s*$/gmu, '')
    .replace(/^\s*[^\p{L}\p{N}\u4e00-\u9fff]{1,4}\s*$/gmu, '')
    .replace(/^\s*#{1,6}\s*[^\p{L}\p{N}\u4e00-\u9fff]+$/gmu, '')
    .replace(/^\s*[\u2600-\u27BF\uFE0F]+(?:\s*[\u2600-\u27BF\uFE0F]+)*\s*$/gmu, '')
    .replace(/^\s*[\u{1F300}-\u{1FAFF}\uFE0F]+(?:\s*[\u{1F300}-\u{1FAFF}\uFE0F]+)*\s*$/gmu, '')
    .replace(/---\s*\n/g, '\n')
    .replace(/^\s*---\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
