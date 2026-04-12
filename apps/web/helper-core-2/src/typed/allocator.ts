import type { HelperMessage } from '../types';

export type TypedAnswerType =
  | 'business-recommendation'
  | 'business-lookup'
  | 'comparison'
  | 'guide'
  | 'info-lookup'
  | 'mixed'
  | 'community'
  | 'news-events'
  | 'follow-up'
  | 'no-match'
  | 'fallback';

export interface TypedAllocation {
  type: TypedAnswerType;
  reason: string;
}

export function allocateTypedAnswer(query: string, history: HelperMessage[]): TypedAllocation {
  const q = query.trim();
  const ql = q.toLowerCase();

  if (history.length >= 2 && q.length <= 25 && /^(嗯|好|可以|继续|再来|更多|第二家|第一家|第三家|ok|yes|more)/i.test(q)) {
    return { type: 'follow-up', reason: 'short follow-up continuation' };
  }

  if (/\bvs\.?\b|\bversus\b|对比|比较|哪个好|哪家更好/.test(ql)) {
    return { type: 'comparison', reason: 'comparison pattern detected' };
  }

  if (/(电话|地址|营业时间|联系方式|电话多少|在哪里|hours|phone|address)/i.test(q) && !/(推荐|排行|top|前\d+)/i.test(q)) {
    return { type: 'business-lookup', reason: 'single business lookup style query' };
  }

  if (/(推荐|排行|排名|top|哪家|有多少|全部列出来|名单)/i.test(q)) {
    return { type: 'business-recommendation', reason: 'recommendation pattern detected' };
  }

  if (/(怎么办|流程|步骤|如何|怎么|guide|how to)/i.test(q)) {
    return { type: 'guide', reason: 'guide pattern detected' };
  }

  if (/(活动|新闻|最近|本周|this weekend|latest|news|event)/i.test(q)) {
    return { type: 'news-events', reason: 'news/events pattern detected' };
  }

  return { type: 'fallback', reason: 'no strong typed signal' };
}

export function mapLegacyIntentToTyped(intent: string): TypedAnswerType {
  if (intent === 'followup') return 'follow-up';
  if (intent === 'localRecommendation') return 'business-recommendation';
  if (intent === 'guideMode') return 'guide';
  if (intent === 'localLookup') return 'info-lookup';
  if (intent === 'discoverMode') return 'community';
  if (intent === 'freshInfo') return 'news-events';
  return 'fallback';
}
