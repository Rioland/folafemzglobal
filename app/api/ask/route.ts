import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';
import { systemPrompt } from '@/lib/assistant';

/* --------------------------------------------------------------------------
   Ask-me AI endpoint
   --------------------------------------------------------------------------
   Groq's free tier, through the Vercel AI SDK. Free means free — no card on
   file — so this costs the business nothing to run. The trade is quota: the
   free tier is metered per minute and per day, and when it runs out the
   assistant goes quiet rather than billing anyone.

   Everything below that looks like penny-pinching is protecting that quota:
   the short history window, the small output cap, the per-IP throttle. The
   knowledge base itself is only ~1,300 tokens, so the history is what grows.

   The SDK is provider-agnostic on purpose. Swapping Groq for OpenRouter,
   Gemini or anything else later is a change to these three lines, not a
   rewrite — see the model note in .env.example.
   -------------------------------------------------------------------------- */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Free-tier default. Override with GROQ_MODEL if limits or quality bite. */
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const MAX_MESSAGE_CHARS = 600;

/**
 * Only the last few turns are sent. Every turn is re-sent on every request, so
 * a long conversation costs quota quadratically — this caps that. Eight is
 * enough for the follow-up questions people actually ask ("what about the
 * bus?"), and the system prompt carries all the facts anyway.
 */
const MAX_TURNS = 8;

type Turn = { role: 'user' | 'assistant'; content: string };

/* Per-instance sliding window. On serverless each instance has its own memory,
   so this is a speed bump, not a real rate limiter — but a speed bump is what
   stands between a bored bot and the day's free quota. */
const WINDOW_MS = 60_000;
const WINDOW_MAX = 8;
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

/** Keep only well-formed turns, trimmed and capped, starting on the visitor. */
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

  while (turns.length && turns[0].role !== 'user') turns.shift();

  return turns;
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error('[ask] GROQ_API_KEY is not set');
    return NextResponse.json(
      { error: 'The assistant is not switched on yet. Please message us on WhatsApp.' },
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

  const groq = createGroq({ apiKey });

  const result = streamText({
    model: groq(process.env.GROQ_MODEL || DEFAULT_MODEL),
    system: systemPrompt(),
    messages,
    // Short answers keep the widget readable and the daily quota alive.
    maxOutputTokens: 400,
    // Low but not zero: factual about rates, still reads like a person.
    temperature: 0.3,
    /*
     * Errors arrive here rather than as a thrown exception, because the
     * response has already started streaming by the time most of them happen
     * (a 429 for exhausted quota being the one to expect). The stream then
     * ends early and the visitor sees no text — which is exactly what the
     * client treats as "empty answer" and answers with the WhatsApp fallback.
     */
    onError({ error }) {
      console.error('[ask] generation failed:', error);
    },
  });

  return result.toTextStreamResponse({
    headers: { 'Cache-Control': 'no-store' },
  });
}
