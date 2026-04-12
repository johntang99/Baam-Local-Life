import type { RetrievalPayload, SourceItem } from '../types';
import type { TypedAllocation, TypedAnswerType } from './allocator';
import {
  buildStrictRecommendationTable,
  countMarkdownTableRows,
} from '../answer/table';

export type TypedRouterMode = 'off' | 'shadow' | 'on';

export interface TypedBuildResult {
  answer: string;
  sources: SourceItem[];
}

interface BuildTypedResultParams {
  mode: TypedRouterMode;
  allocation: TypedAllocation;
  query: string;
  internal: RetrievalPayload;
  preferredBusinessSources?: SourceItem[];
}

export function parseTypedRouterMode(raw: string | undefined): TypedRouterMode {
  const value = (raw || '').trim().toLowerCase();
  if (value === 'on') return 'on';
  if (value === 'shadow') return 'shadow';
  return 'off';
}

function resolveRequestedCount(query: string): number {
  const top = query.toLowerCase().match(/\btop\s*(\d{1,2})\b/);
  if (top) return Math.max(1, Math.min(20, Number(top[1]) || 10));
  const front = query.match(/前\s*(\d{1,2})\s*(名|家|个|间|条)?/);
  if (front) return Math.max(1, Math.min(20, Number(front[1]) || 10));
  const cn = query.match(/(\d{1,2})\s*(家|个|间|条)/);
  if (cn) return Math.max(1, Math.min(20, Number(cn[1]) || 10));
  return 10;
}

function pickBusinessSources(internal: RetrievalPayload, preferredBusinessSources?: SourceItem[]): SourceItem[] {
  if (preferredBusinessSources && preferredBusinessSources.length > 0) {
    return preferredBusinessSources.slice(0, 30);
  }
  return (internal.businessCandidates || internal.sources.filter((s) => s.type === '商家')).slice(0, 30);
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]+/g, ' ').trim();
}

function extractLookupTarget(query: string): string {
  return query
    .replace(/(电话|地址|营业时间|联系方式|电话多少|在哪里|hours?|phone|address|contact|open|close|营业|时间)/ig, ' ')
    .replace(/(帮我|请问|告诉我|一下|这家|那家|店|商家)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findBestBusinessMatch(candidates: SourceItem[], rawTarget: string): SourceItem | null {
  const target = normalizeText(rawTarget);
  if (!target) return null;

  const targetTokens = target.split(/\s+/).filter((t) => t.length >= 2);
  if (targetTokens.length === 0) return null;

  let best: SourceItem | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const hay = normalizeText(`${candidate.title || ''} ${candidate.snippet || ''}`);
    if (!hay) continue;
    let score = 0;
    for (const token of targetTokens) {
      if (hay.includes(token)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return bestScore > 0 ? best : null;
}

function buildTypedBusinessLookup(
  query: string,
  internal: RetrievalPayload,
  preferredBusinessSources?: SourceItem[],
): TypedBuildResult | null {
  const candidates = pickBusinessSources(internal, preferredBusinessSources);
  if (candidates.length === 0) return null;

  const target = extractLookupTarget(query);
  const best = findBestBusinessMatch(candidates, target);
  if (!best) return null;

  const askPhone = /(电话|联系方式|phone|call)/i.test(query);
  const askAddress = /(地址|在哪里|address|location)/i.test(query);
  const askHours = /(营业时间|几点|hours|open|close)/i.test(query);
  const detailParts: string[] = [];

  if (best.snippet) detailParts.push(best.snippet);
  if (askPhone) detailParts.push('如需电话，请点击下方来源卡片查看详情或进入商家页。');
  if (askAddress) detailParts.push('如需地址，请点击来源中的地图/商家链接查看最新地址。');
  if (askHours) detailParts.push('营业时间建议以门店电话确认为准，避免临时变更。');

  return {
    answer: [
      `我帮你定位到这家商家：**${best.title}**`,
      '',
      ...detailParts.map((line) => `- ${line}`),
    ].join('\n'),
    sources: [best],
  };
}

function extractComparisonPair(query: string): [string, string] | null {
  const cleaned = query.replace(/[？?！!。]/g, '').trim();

  let match = cleaned.match(/^(.+?)\s+(?:vs\.?|versus)\s+(.+)$/i);
  if (match) return [match[1].trim(), match[2].trim()];

  match = cleaned.match(/比较\s*(.+?)\s*(?:和|与)\s*(.+)/);
  if (match) return [match[1].trim(), match[2].trim()];

  match = cleaned.match(/^(.+?)\s*(?:和|与)\s*(.+?)\s*(哪个好|哪家更好|对比|比较)$/);
  if (match) return [match[1].trim(), match[2].trim()];

  return null;
}

function buildTypedComparison(
  query: string,
  internal: RetrievalPayload,
  preferredBusinessSources?: SourceItem[],
): TypedBuildResult | null {
  const candidates = pickBusinessSources(internal, preferredBusinessSources);
  if (candidates.length < 2) return null;

  const pair = extractComparisonPair(query);
  if (!pair) return null;

  const a = findBestBusinessMatch(candidates, pair[0]);
  const b = findBestBusinessMatch(candidates, pair[1]);
  if (!a || !b || a.title === b.title) return null;

  const answer = [
    `我先按当前可用信息帮你快速对比：**${a.title}** vs **${b.title}**`,
    '',
    `### 1) ${a.title}`,
    `- ${a.snippet || '当前结果里暂无更多摘要信息'}`,
    '',
    `### 2) ${b.title}`,
    `- ${b.snippet || '当前结果里暂无更多摘要信息'}`,
    '',
    '如果你告诉我你更看重「价格 / 评分 / 距离 / 服务速度」，我可以继续给你明确结论。',
  ].join('\n');

  return {
    answer,
    sources: [a, b],
  };
}

function buildTypedRecommendation(
  query: string,
  internal: RetrievalPayload,
  preferredBusinessSources?: SourceItem[],
): TypedBuildResult | null {
  const candidates = pickBusinessSources(internal, preferredBusinessSources);
  if (candidates.length === 0) return null;

  const requested = resolveRequestedCount(query);
  const strictTable = buildStrictRecommendationTable(candidates.slice(0, requested), query, 'zh');
  const rowCount = countMarkdownTableRows(strictTable);
  if (rowCount <= 0) return null;

  const answer = [
    `我为你整理了 ${rowCount} 家相关商家，按综合评分排序如下：`,
    '',
    strictTable,
    '',
    '如果你愿意，我可以继续按“预算 / 距离 / 是否周末营业”再帮你二次筛选。',
  ].join('\n');

  return {
    answer,
    sources: candidates.slice(0, 10),
  };
}

export function tryBuildTypedResult(params: BuildTypedResultParams): TypedBuildResult | null {
  if (params.mode !== 'on') return null;

  if (params.allocation.type === 'business-recommendation') {
    return buildTypedRecommendation(params.query, params.internal, params.preferredBusinessSources);
  }
  if (params.allocation.type === 'business-lookup') {
    return buildTypedBusinessLookup(params.query, params.internal, params.preferredBusinessSources);
  }
  if (params.allocation.type === 'comparison') {
    return buildTypedComparison(params.query, params.internal, params.preferredBusinessSources);
  }

  return null;
}
