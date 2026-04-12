'use server';

import type { HelperMessage, HelperResult } from '@baam/helper-core-2';

export async function askHelper(
  query: string,
  _history: HelperMessage[] = [],
): Promise<{ error?: string; data?: HelperResult }> {
  if (!query?.trim() || query.trim().length < 2) {
    return { error: '请输入更具体一点的问题' };
  }
  return { error: '旧版 AI 助手已下线，请使用 Helper-2。' };
}
