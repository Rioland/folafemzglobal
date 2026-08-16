'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { OPENING_LINE, SUGGESTIONS } from '@/lib/assistant';
import { settings } from '@/lib/content';
import { whatsappDirect } from '@/lib/enquiry';

/* --------------------------------------------------------------------------
   Ask me AI
   --------------------------------------------------------------------------
   A chat panel over /api/ask. The answer streams in, so the visitor sees text
   moving within a second rather than waiting on a complete reply.

   The assistant answers questions; it does not take bookings. Every dead end —
   an error, a refusal, a question it cannot answer — points at WhatsApp, which
   is where an actual human picks up.
   -------------------------------------------------------------------------- */

type Turn = { role: 'user' | 'assistant'; content: string };

export default function AskAi() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Escape closes the panel; cancel whatever is still streaming on the way out.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Abort any in-flight answer when the component goes away.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Keep the newest text in view as it streams.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [turns, busy]);

  const ask = useCallback(async (question: string) => {
    const text = question.trim();
    if (!text || busy) return;

    const next: Turn[] = [...turns, { role: 'user', content: text }];
    setTurns(next);
    setDraft('');
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/ask/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setTurns([...next, {
          role: 'assistant',
          content: data.error ?? 'The assistant is unavailable. Please message us on WhatsApp.',
        }]);
        return;
      }

      // Open an empty assistant turn and fill it as chunks land.
      setTurns([...next, { role: 'assistant', content: '' }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        answer += decoder.decode(value, { stream: true });
        setTurns([...next, { role: 'assistant', content: answer }]);
      }

      // A stream can end with nothing in it. The usual cause is the free tier's
      // quota running out, which the provider reports after the response has
      // already started — too late for a status code. Say something useful
      // rather than leaving an empty bubble on screen.
      if (!answer.trim()) {
        setTurns([...next, {
          role: 'assistant',
          content:
            'I could not get to that one — the assistant is busy right now. '
            + 'Message us on WhatsApp and the desk will pick it up straight away.',
        }]);
      }
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return;
      setTurns([...next, {
        role: 'assistant',
        content: 'No connection. Please message us on WhatsApp instead.',
      }]);
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [busy, turns]);

  return (
    <>
      <button
        className={`askLauncher${open ? ' is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="askPanel"
      >
        <span aria-hidden="true">✦</span>
        <span>{open ? 'Close' : 'Ask me AI'}</span>
      </button>

      <div
        className="askPanel"
        id="askPanel"
        data-open={open}
        aria-hidden={!open}
        role="dialog"
        aria-label="Ask the dispatch assistant"
      >
        <div className="askPanel__head">
          <div>
            <strong>Ask {settings.siteName.split(' ')[0]}</strong>
            <span>Answers about vehicles, rates and coverage</span>
          </div>
          <button className="askPanel__close" onClick={() => setOpen(false)} aria-label="Close">
            ×
          </button>
        </div>

        <div className="askPanel__log" ref={listRef} aria-live="polite">
          <div className="askMsg askMsg--bot">{OPENING_LINE}</div>

          {turns.map((t, i) => (
            <div
              key={i}
              className={`askMsg askMsg--${t.role === 'user' ? 'you' : 'bot'}`}
            >
              {t.content || (busy && i === turns.length - 1 ? <Dots /> : null)}
            </div>
          ))}

          {turns.length === 0 && (
            <div className="askSuggest">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)}>{s}</button>
              ))}
            </div>
          )}
        </div>

        <form
          className="askPanel__form"
          onSubmit={(e) => { e.preventDefault(); ask(draft); }}
        >
          <input
            ref={inputRef}
            className="input"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about a vehicle or a rate…"
            maxLength={600}
            disabled={busy}
            aria-label="Your question"
          />
          <button className="btn btn--amber" type="submit" disabled={busy || !draft.trim()}>
            {busy ? '…' : 'Ask'}
          </button>
        </form>

        <p className="askPanel__note">
          Answers come from our published rates and can be wrong — the desk confirms
          everything.{' '}
          <a href={whatsappDirect()} target="_blank" rel="noopener">Talk to a person</a>.
        </p>
      </div>
    </>
  );
}

/** Three dots while the first token is still on its way. */
function Dots() {
  return (
    <span className="askDots" aria-label="Thinking">
      <i /><i /><i />
    </span>
  );
}
