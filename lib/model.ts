import { createCerebras } from '@ai-sdk/cerebras';
import { createGoogle } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

/* --------------------------------------------------------------------------
   Which model answers
   --------------------------------------------------------------------------
   Two free providers, chosen by whichever key is present. This indirection
   earns its keep: Groq was the first choice here and closed new signups before
   we could get a key. Having a second provider behind the same interface means
   that is a paste job, not a rewrite — and if both close, adding a third is
   one more entry in PROVIDERS.

   Neither option costs anything or takes a card. They differ in how the free
   tier is metered:

     Cerebras  token budget  — roughly 1M tokens a day. At ~1,500 tokens a
                               question that is several hundred questions.
                               Open-source models (Llama). Preferred.
     Google    request count — Gemini Flash-Lite, capped per day rather than
                               per token. Not an open-source model, but the
                               most reliable free tier going.

   Model IDs move faster than anything else here, so both are overridable with
   AI_MODEL rather than being pinned in code.
   -------------------------------------------------------------------------- */

type Provider = {
  name: string;
  envKey: string;
  defaultModel: string;
  build: (apiKey: string, modelId: string) => LanguageModel;
};

/* Order matters: the first provider with a key wins. Google is first because
   it is the one verified to work on a free account. */
const PROVIDERS: Provider[] = [
  {
    /*
     * gemini-2.5-flash-lite still appears in the models list but is closed to
     * new API keys ("no longer available to new users"), which fails at the
     * first question rather than at startup. 3.5-flash-lite is the current
     * one that works; the gemini-flash-lite-latest alias 404s, so there is no
     * self-updating option to hide behind. Expect to bump this eventually —
     * AI_MODEL overrides it without a deploy.
     */
    name: 'google',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    defaultModel: 'gemini-3.5-flash-lite',
    build: (apiKey, modelId) => createGoogle({ apiKey })(modelId),
  },
  {
    /*
     * Second because a Cerebras account does not necessarily come with free
     * inference. Ours listed three models (zai-glm-4.7, gpt-oss-120b,
     * gemma-4-31b) and every one returned "Payment required" — the models
     * endpoint advertises the catalogue, not your entitlement. The published
     * 1M-tokens/day free tier evidently is not granted to every signup.
     *
     * Only reachable now by setting AI_PROVIDER=cerebras. Before you do, check
     * that a model actually answers rather than trusting the list:
     *   curl -H "Authorization: Bearer $CEREBRAS_API_KEY" \
     *     -H 'Content-Type: application/json' \
     *     -d '{"model":"gpt-oss-120b","max_tokens":5,
     *          "messages":[{"role":"user","content":"hi"}]}' \
     *     https://api.cerebras.ai/v1/chat/completions
     */
    name: 'cerebras',
    envKey: 'CEREBRAS_API_KEY',
    defaultModel: 'gpt-oss-120b',
    build: (apiKey, modelId) => createCerebras({ apiKey })(modelId),
  },
];

export type Resolved =
  | { ok: true; model: LanguageModel; provider: string; modelId: string }
  | { ok: false };

/**
 * First provider with a key wins, unless AI_PROVIDER names one explicitly.
 * Returns ok:false when nothing is configured so the route can say so plainly
 * rather than throwing on a visitor's question.
 */
export function resolveModel(): Resolved {
  const forced = process.env.AI_PROVIDER?.trim().toLowerCase();
  const candidates = forced
    ? PROVIDERS.filter((p) => p.name === forced)
    : PROVIDERS;

  for (const provider of candidates) {
    const apiKey = process.env[provider.envKey]?.trim();
    if (!apiKey) continue;

    const modelId = process.env.AI_MODEL?.trim() || provider.defaultModel;

    return {
      ok: true,
      model: provider.build(apiKey, modelId),
      provider: provider.name,
      modelId,
    };
  }

  return { ok: false };
}
