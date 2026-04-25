import { NextRequest } from 'next/server';
import { askHelper2 } from '@/app/[locale]/(public)/helper-2/actions';
import { checkRateLimit } from '@/app/[locale]/(public)/helper-2/actions';

/**
 * HP5: Streaming Helper-2 API
 *
 * Uses Server-Sent Events (SSE) to stream responses:
 * 1. Event "status" — immediate acknowledgment with loading state
 * 2. Event "answer" — full answer text (for template) or streamed chunks (for AI)
 * 3. Event "done" — sources, quickReplies, mapBusinesses metadata
 *
 * For now, uses the existing askHelper2() and splits the result into SSE events.
 * Future: integrate Anthropic streaming API for true token-by-token streaming.
 */

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  // Rate limiting
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: '请求太频繁，请稍后再试' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { query, history } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Send immediate status
        send('status', { message: '正在分析你的问题...' });

        // Get the full result
        const result = await askHelper2(query, history || []);

        if (result.error) {
          send('error', { message: result.error });
          controller.close();
          return;
        }

        const data = result.data!;

        // Send answer in chunks for streaming feel
        // Template answers: send in ~3 chunks for fast but visible streaming
        // AI answers: send in more chunks for natural typing feel
        const answer = data.answer;
        const isTemplate = data.provider === 'template' || data.provider === 'safety-filter';
        const chunkSize = isTemplate ? Math.ceil(answer.length / 3) : Math.ceil(answer.length / 8);

        for (let i = 0; i < answer.length; i += chunkSize) {
          const chunk = answer.slice(i, i + chunkSize);
          send('chunk', { text: chunk, index: i });
          // Small delay between chunks for streaming feel (skip for template — already fast)
          if (!isTemplate && i + chunkSize < answer.length) {
            await new Promise(r => setTimeout(r, 50));
          }
        }

        // Send final metadata
        send('done', {
          sources: data.sources,
          quickReplies: data.quickReplies,
          mapBusinesses: data.mapBusinesses,
          intent: data.intent,
          keywords: data.keywords,
          provider: data.provider,
          usedWebFallback: data.usedWebFallback,
        });
      } catch (err) {
        send('error', { message: err instanceof Error ? err.message : '小帮手-2 暂时无法回答' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
