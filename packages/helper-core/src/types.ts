export type HelperRole = 'user' | 'assistant';

export type HelperIntent =
  | 'followup'
  | 'localRecommendation'
  | 'localLookup'
  | 'guideMode'
  | 'discoverMode'
  | 'freshInfo'
  | 'broadWeb';

export type ProviderTask = 'classify' | 'keywords' | 'answer';

export type ProviderKind = 'openai' | 'anthropic';

export interface HelperMessage {
  role: HelperRole;
  content: string;
}

export interface SourceItem {
  type: string;
  title: string;
  url: string;
  snippet?: string;
  isExternal?: boolean;
}

export interface IntentDecision {
  intent: HelperIntent;
  needsWeb: boolean;
  reason?: string;
}

export interface RetrievalPayload {
  sources: SourceItem[];
  contextBlocks: string[];
  counts: Record<string, number>;
}

export interface HelperResult {
  answer: string;
  sources: SourceItem[];
  intent: HelperIntent;
  keywords: string[];
  usedWebFallback: boolean;
  provider: string;
}

export interface ProviderRequest {
  task: ProviderTask;
  system: string;
  prompt: string;
  maxTokens?: number;
  json?: boolean;
}

export interface ProviderResponse<T = string> {
  data: T;
  model: string;
  provider: ProviderKind;
}

export interface ProviderClient {
  kind: ProviderKind;
  isAvailable(): boolean;
  complete<T = string>(request: ProviderRequest): Promise<ProviderResponse<T>>;
}

export interface HelperRuntimeConfig {
  siteName: string;
  assistantName: string;
  assistantNameZh: string;
  locale: 'zh' | 'en';
  providerStrategy: 'hybrid' | 'openai' | 'anthropic';
  openAiApiKey?: string;
  openAiModel?: string;
  anthropicApiKey?: string;
  anthropicModel?: string;
  webFallbackEnabled?: boolean;
}

export interface HelperRunInput {
  query: string;
  history?: HelperMessage[];
  // Kept generic so app integrations can pass their own client shape.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any;
  config: HelperRuntimeConfig;
}
