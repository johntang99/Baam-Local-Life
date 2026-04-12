'use server';

import { createHelper, createBaamFetcher, type HelperMessage, type HelperResult } from '@baam/helper-core-2';
import { createChineseLocaleKit } from '@baam/helper-zh';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentSite } from '@/lib/sites';

export async function askHelper(
  query: string,
  history: HelperMessage[] = [],
): Promise<{ error?: string; data?: HelperResult }> {
  if (!query?.trim() || query.trim().length < 2) {
    return { error: '请输入更具体一点的问题' };
  }

  try {
    const supabase = createAdminClient();
    const site = await getCurrentSite();

    const helper = createHelper({
      siteName: 'Baam',
      assistantName: '小邻',
      siteDescription: '纽约华人社区平台，包含商家、新闻、生活指南、论坛、发现、活动',
      contentTypes: [
        { key: 'businesses', label: '商家', pathPrefix: '/businesses/', isPrimary: true, relevanceMin: 0.2, maxContext: 8, maxSources: 12 },
        { key: 'guides', label: '指南', pathPrefix: '/guides/', relevanceMin: 0.2, maxContext: 4, maxSources: 4 },
        { key: 'news', label: '新闻', pathPrefix: '/news/', relevanceMin: 0.2, maxContext: 3, maxSources: 3 },
        { key: 'forum', label: '论坛', pathPrefix: '/forum/', relevanceMin: 0.2, maxContext: 3, maxSources: 3 },
        { key: 'discover', label: '发现', pathPrefix: '/discover/', relevanceMin: 0.15, maxContext: 3, maxSources: 3 },
        { key: 'events', label: '活动', pathPrefix: '/events/', relevanceMin: 0.15, maxContext: 3, maxSources: 3 },
      ],
      fetcher: createBaamFetcher(supabase),
      localeKit: createChineseLocaleKit() as any,
      siteContext: {
        siteId: site.id,
        regionIds: site.regionIds,
        siteScope: 'zh',
      },
      providers: {
        strategy: 'anthropic',
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        anthropicModel: process.env.HELPER_ANTHROPIC_MODEL || 'claude-haiku-4-5',
        openAiApiKey: process.env.OPENAI_API_KEY,
        openAiModel: process.env.HELPER_OPENAI_MODEL || 'gpt-5.4',
      },
      features: {
        webFallbackEnabled: true,
        telemetryEnabled: true,
        strictEvidenceMode: process.env.HELPER_STRICT_EVIDENCE_MODE === '1',
        answerMaxTokens: 2048,
      },
      supabaseAdmin: supabase,
    });

    const result = await helper.ask(query, history);
    return { data: result };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : '小邻暂时无法回答，请稍后再试',
    };
  }
}
