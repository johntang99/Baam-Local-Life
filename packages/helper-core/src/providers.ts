import type {
  HelperRuntimeConfig,
  ProviderClient,
  ProviderRequest,
  ProviderResponse,
  ProviderTask,
} from './types';

function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function parseJson<T>(text: string): T {
  const clean = stripCodeFences(text);
  try {
    return JSON.parse(clean) as T;
  } catch {
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(clean.slice(firstBrace, lastBrace + 1)) as T;
    }
    const firstBracket = clean.indexOf('[');
    const lastBracket = clean.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      return JSON.parse(clean.slice(firstBracket, lastBracket + 1)) as T;
    }
    throw new Error('Failed to parse provider JSON response');
  }
}

class OpenAIProvider implements ProviderClient {
  kind = 'openai' as const;

  constructor(
    private readonly apiKey?: string,
    private readonly model: string = 'gpt-5.4',
  ) {}

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async complete<T = string>(request: ProviderRequest): Promise<ProviderResponse<T>> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        max_tokens: request.maxTokens ?? 1400,
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';

    return {
      data: (request.json ? parseJson<T>(text) : (text as T)),
      model: this.model,
      provider: this.kind,
    };
  }
}

class AnthropicProvider implements ProviderClient {
  kind = 'anthropic' as const;

  constructor(
    private readonly apiKey?: string,
    private readonly model: string = 'claude-sonnet-4-6',
  ) {}

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async complete<T = string>(request: ProviderRequest): Promise<ProviderResponse<T>> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key is not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: request.maxTokens ?? 1400,
        system: request.system,
        messages: [{ role: 'user', content: request.prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.status}`);
    }

    const data = await response.json();
    const text =
      data.content?.find((item: { type: string }) => item.type === 'text')?.text?.trim() || '';

    return {
      data: (request.json ? parseJson<T>(text) : (text as T)),
      model: this.model,
      provider: this.kind,
    };
  }
}

export interface ProviderRouter {
  complete<T = string>(task: ProviderTask, request: Omit<ProviderRequest, 'task'>): Promise<ProviderResponse<T>>;
}

export function createProviderRouter(config: HelperRuntimeConfig): ProviderRouter {
  const openai = new OpenAIProvider(config.openAiApiKey, config.openAiModel);
  const anthropic = new AnthropicProvider(config.anthropicApiKey, config.anthropicModel);

  const getTaskOrder = (task: ProviderTask): ProviderClient[] => {
    if (config.providerStrategy === 'openai') {
      return [openai, anthropic];
    }
    if (config.providerStrategy === 'anthropic') {
      return [anthropic, openai];
    }

    // Hybrid default:
    // - classification / extraction favor Anthropic
    // - answer synthesis favors OpenAI when available
    if (task === 'answer') {
      return [openai, anthropic];
    }
    return [anthropic, openai];
  };

  return {
    async complete<T>(task: ProviderTask, request: Omit<ProviderRequest, 'task'>) {
      const ordered = getTaskOrder(task).filter((provider) => provider.isAvailable());
      if (ordered.length === 0) {
        throw new Error('No AI provider is configured for Helper-2');
      }

      let lastError: Error | undefined;
      for (const provider of ordered) {
        try {
          return await provider.complete<T>({ ...request, task });
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown provider error');
        }
      }

      throw lastError ?? new Error('All AI providers failed');
    },
  };
}
