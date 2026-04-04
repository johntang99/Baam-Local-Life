import { buildAnswerSystemPrompt, buildAnswerUserPrompt, buildIntentPrompt, buildKeywordPrompt, guessIntentHeuristically } from './prompts';
import { createProviderRouter } from './providers';
import { searchBaamContent } from './retrieval/baam';
import { searchWebFallback } from './retrieval/web';
import type {
  HelperMessage,
  HelperResult,
  HelperRunInput,
  IntentDecision,
  RetrievalPayload,
} from './types';

function fallbackKeywordExtraction(query: string): string[] {
  const stripped = query
    .replace(/[？?！!，,。.:：;；]/g, ' ')
    .replace(/(请问一下|请问|帮我|告诉我|推荐一下|推荐|怎么|如何|哪里|什么|有没有|可以|需要)/g, ' ')
    .trim();

  const chunks = stripped
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2 && item.length <= 12);

  return [...new Set(chunks)].slice(0, 5);
}

function buildHistoryAnswerPrompt(query: string, history: HelperMessage[]): string {
  const conversation = history
    .slice(-8)
    .map((message) => `${message.role === 'user' ? '用户' : '助手'}: ${message.content}`)
    .join('\n');

  return `根据下面的对话上下文，继续回答用户的新问题。

对话历史：
${conversation}

用户最新问题：
${query}

请直接给出自然、简洁、连续的中文回答。`;
}

function buildFallbackAnswer(params: {
  query: string;
  internal: RetrievalPayload;
  web: RetrievalPayload;
  usedWebFallback: boolean;
}): string {
  const topSources = [...params.internal.sources, ...params.web.sources].slice(0, 5);

  if (topSources.length === 0) {
    return `我暂时没有在站内和网页结果里找到足够可靠的信息来回答“${params.query}”。你可以换一种问法，或者告诉我更具体一点的需求，比如地区、服务类型、时间范围。`;
  }

  const intro = params.usedWebFallback
    ? '我先结合站内内容，也补充参考了网页信息。'
    : '我先根据站内已有内容整理了一下。';

  return `${intro}

我先帮你整理出和这个问题最相关的内容：
${topSources.map((source) => `- ${source.title}${source.snippet ? `：${source.snippet}` : ''}`).join('\n')}

如果你愿意，我可以继续帮你细化，比如：
- 只看商家推荐
- 只看最新信息
- 按预算、地区或人群再筛一轮`;
}

async function classifyIntent(
  router: ReturnType<typeof createProviderRouter>,
  query: string,
  history: HelperMessage[],
): Promise<IntentDecision> {
  try {
    const response = await router.complete<IntentDecision>('classify', {
      system: '你是一个严格输出 JSON 的中文路由器。只能返回 JSON。',
      prompt: buildIntentPrompt(query, history),
      json: true,
      maxTokens: 200,
    });
    return response.data;
  } catch {
    return guessIntentHeuristically(query, history);
  }
}

function selectVisibleSources(intent: IntentDecision['intent'], internal: RetrievalPayload, web: RetrievalPayload) {
  const internalByType = (type: string) => internal.sources.filter((source) => source.type === type);
  const webSources = web.sources;

  switch (intent) {
    case 'localRecommendation': {
      const businesses = internalByType('商家').slice(0, 6);
      return businesses;
    }
    case 'discoverMode':
      return [
        ...internalByType('笔记').slice(0, 4),
        ...internalByType('达人').slice(0, 3),
        ...internalByType('论坛').slice(0, 2),
      ];
    case 'freshInfo':
      return [
        ...internalByType('新闻').slice(0, 3),
        ...internalByType('指南').slice(0, 2),
        ...webSources.slice(0, 3),
      ];
    case 'guideMode':
      return [
        ...internalByType('指南').slice(0, 4),
        ...internalByType('论坛').slice(0, 2),
        ...internalByType('商家').slice(0, 3),
      ];
    default:
      return [...internal.sources.slice(0, 8), ...webSources.slice(0, 2)];
  }
}

async function extractKeywords(
  router: ReturnType<typeof createProviderRouter>,
  query: string,
): Promise<string[]> {
  try {
    const response = await router.complete<{ keywords: string[] }>('keywords', {
      system: '你是一个严格输出 JSON 的关键词提取器。只能返回 JSON。',
      prompt: buildKeywordPrompt(query),
      json: true,
      maxTokens: 180,
    });

    const keywords = Array.isArray(response.data.keywords)
      ? response.data.keywords.map((item) => String(item).trim()).filter(Boolean)
      : [];

    return keywords.length > 0 ? keywords.slice(0, 5) : fallbackKeywordExtraction(query);
  } catch {
    return fallbackKeywordExtraction(query);
  }
}

export async function runHelper2(input: HelperRunInput): Promise<HelperResult> {
  const query = input.query.trim();
  if (!query) {
    throw new Error('Empty query');
  }

  const history = input.history ?? [];
  const router = createProviderRouter(input.config);

  const decision = await classifyIntent(router, query, history);
  const keywords = decision.intent === 'followup' ? [] : await extractKeywords(router, query);

  let internal: RetrievalPayload = { sources: [], contextBlocks: [], counts: {} };
  let web: RetrievalPayload = { sources: [], contextBlocks: [], counts: { web: 0 } };

  if (decision.intent !== 'followup') {
    internal = await searchBaamContent({
      supabase: input.supabaseAdmin,
      query,
      keywords,
      intent: decision.intent,
    });
  }

  const shouldUseWeb =
    input.config.webFallbackEnabled !== false &&
    decision.intent !== 'followup' &&
    (
      decision.needsWeb ||
      (decision.intent === 'localRecommendation'
        ? internal.sources.filter((source) => source.type === '商家').length < 3
        : internal.sources.length < 4)
    );

  if (shouldUseWeb) {
    web = await searchWebFallback(query);
  }

  const usedWebFallback = web.sources.length > 0;

  const visibleSources = selectVisibleSources(decision.intent, internal, web);

  try {
    const providerResponse = await router.complete<string>('answer', {
      system: buildAnswerSystemPrompt(input.config.assistantNameZh, input.config.siteName),
      prompt:
        decision.intent === 'followup'
          ? buildHistoryAnswerPrompt(query, history)
          : buildAnswerUserPrompt({
              query,
              intent: decision.intent,
              history,
              internal,
              web,
              usedWebFallback,
            }),
      maxTokens: 1800,
    });

    return {
      answer: providerResponse.data,
      sources: visibleSources.slice(0, 10),
      intent: decision.intent,
      keywords,
      usedWebFallback,
      provider: `${providerResponse.provider}:${providerResponse.model}`,
    };
  } catch (error) {
    const fallback =
      error instanceof Error
        ? buildFallbackAnswer({ query, internal, web, usedWebFallback })
        : `我暂时没能完成回答，但已经找到了部分相关内容。`;

    return {
      answer: fallback,
      sources: visibleSources.slice(0, 10),
      intent: decision.intent,
      keywords,
      usedWebFallback,
      provider: 'fallback',
    };
  }
}

export type * from './types';
