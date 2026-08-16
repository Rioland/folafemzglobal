import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { systemPrompt } from '@/lib/assistant';

/* --------------------------------------------------------------------------
   Ask-me AI endpoint
   --------------------------------------------------------------------------
   Streams an answer from Claude, grounded in data/content.json via
   lib/assistant.ts. Node runtime: the SDK wants a Node stream, and this route
   holds a connection open for the length of the answer.

   Cost note: every message here is a paid API call, and the endpoint is public.
   The guards below (turn cap, length cap, per-IP throttle) exist for the bill,
   not for correctness — see the comment on `throttle`.
   -------------------------------------------------------------------------- */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_MESSAGE_CHARS = 1000;
const MAX_TURNS = 20;

type Turn = { role: 'user' | 'assistant'; content: string };

/**
 * Per-instance sliding window.
 *
 * This is deliberately modest: on Vercel each lambda instance has its own
 * memory, so a visitor spread across instances gets more than WINDOW_MAX. It
 * raises the cost of casual abuse without pretending to be a real rate limiter.
 * If this endpoint ever gets found by a bot, move this to Upstash or Vercel KV.
 */
const WINDOW_MS = 60_000;
const WINDOW_MAX = 12;
const hits = new Map<string, number[]>();

function throttled(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= WINDOW_MAX) {
    hits.set(ip, recent);
    return true;
  }

  recent.push(now);
  hits.set(ip, recent);

  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 500) {
    for (const [key, stamps] of hits) {
      if (stamps.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }

  return false;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

/** Keep only well-formed turns, trimmed and capped, ending on the visitor. */
function clean(raw: unknown): Turn[] {
  if (!Array.isArray(raw)) return [];

  const turns = raw
    .filter((m): m is Turn =>
      !!m && typeof m === 'object'
      && (m.role === 'user' || m.role === 'assistant')
      && typeof m.content === 'string'
      && m.content.trim() !== '')
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_MESSAGE_CHARS) }))
    .slice(-MAX_TURNS);

  // The API requires the first turn to be the user's.
  while (turns.length && turns[0].role !== 'user') turns.shift();

  return turns;
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('[ask] ANTHROPIC_API_KEY is not set');
    return NextResponse.json(
      { error: 'The assistant is not configured yet. Please use WhatsApp.' },
      { status: 503 }
    );
  }

  if (throttled(clientIp(request))) {
    return NextResponse.json(
      { error: 'That is a lot of questions at once. Give it a minute, or message us on WhatsApp.' },
      { status: 429 }
    );
  }

  let body: { messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const messages = clean(body.messages);

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Ask a question first.' }, { status: 422 });
  }

  const client = new Anthropic({ apiKey });

  try {
    const stream = client.beta.messages.stream({
      model: 'claude-opus-5',
      max_tokens: 4096,
      // Low effort suits a short factual Q&A and keeps replies quick. Thinking
      // stays on: disabling it on this model can leak <thinking> tags into the
      // visible answer, which a customer would see.
      output_config: { effort: 'low' },
      // The knowledge base is identical on every request, so it caches and only
      // the conversation after it is billed at full rate.
      system: [
        {
          type: 'text',
          text: systemPrompt(),
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
      // If the safety classifiers ever decline a message, answer on Opus 4.8
      // rather than showing the visitor a dead end.
      betas: ['server-side-fallback-2026-06-01'],
      fallbacks: [{ model: 'claude-opus-4-8' }],
    });

    const encoder = new TextEncoder();

    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta'
              && event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }

          const final = await stream.finalMessage();

          if (final.stop_reason === 'refusal') {
            console.warn('[ask] refused:', final.stop_details ?? '');
            controller.enqueue(encoder.encode(
              '\n\nSorry — I cannot help with that one. Please message us on WhatsApp.'
            ));
          }
        } catch (error) {
          console.error('[ask] stream failed:', error);
          controller.enqueue(encoder.encode(
            '\n\nSomething went wrong mid-answer. Please try WhatsApp.'
          ));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      console.error('[ask] rate limited by the API');
      return NextResponse.json(
        { error: 'We are getting a lot of questions right now. Please try WhatsApp.' },
        { status: 429 }
      );
    }

    if (error instanceof Anthropic.APIError) {
      console.error(`[ask] API error ${error.status}:`, error.message);
    } else {
      console.error('[ask] failed:', error);
    }

    return NextResponse.json(
      { error: 'The assistant is unavailable. Please message us on WhatsApp.' },
      { status: 502 }
    );
  }
}
