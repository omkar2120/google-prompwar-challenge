// Single source of truth for every Groq API request in the app.
// Every AI-generated string in MonsoonMitra flows through here — there are no
// pre-written "AI" responses anywhere in the codebase.
//
// TODO: proxy through a serverless function in production to hide the API key.
// Calling Groq directly from the browser exposes VITE_GROQ_API_KEY in the
// client bundle. This is an accepted, explicit tradeoff for the hackathon demo
// (frontend-first). See `api/groq.js` for an optional serverless proxy that,
// when deployed, keeps the key server-side.

import { validateVoiceBlob } from './validation.js';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

/** Production models (2026). llama-3.1-8b-instant / llama-3.3-70b were deprecated. */
export const MODELS = {
  /** Flagship reasoning: plans, advisories, chatbot, recovery. */
  REASONING: 'openai/gpt-oss-120b',
  /** Fast/cheap: alert rewrites, short checklists, micro-copy, interpretations. */
  FAST: 'openai/gpt-oss-20b',
  /** Speech-to-text for voice input. */
  WHISPER: 'whisper-large-v3-turbo',
};

/** If a serverless proxy is deployed, set VITE_GROQ_PROXY_URL to use it instead. */
const PROXY_URL = import.meta.env.VITE_GROQ_PROXY_URL || '';

/**
 * @returns {boolean} Whether a Groq key (or proxy) is configured.
 */
export function isGroqConfigured() {
  return Boolean(PROXY_URL || import.meta.env.VITE_GROQ_API_KEY);
}

function assertConfigured() {
  if (!isGroqConfigured()) {
    throw new Error(
      'Groq API key is not set. Add VITE_GROQ_API_KEY to your .env file (see .env.example).'
    );
  }
}

function endpoint(pathname) {
  if (PROXY_URL) return `${PROXY_URL.replace(/\/$/, '')}${pathname}`;
  return `${GROQ_BASE_URL}${pathname}`;
}

function authHeaders(extra = {}) {
  // When proxying, the key lives server-side; no Authorization header client-side.
  if (PROXY_URL) return { ...extra };
  return {
    Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    ...extra,
  };
}

/**
 * Turn a non-OK Groq response into a single, meaningful Error. The upstream
 * body (truncated) is included so callers surface something actionable.
 * @param {Response} res
 * @param {string} label  Human label for the failing operation.
 * @returns {Promise<Error>}
 */
async function toGroqError(res, label) {
  const errText = await res.text().catch(() => '');
  return new Error(`${label} (${res.status}). ${errText.slice(0, 200) || res.statusText}`);
}

/**
 * POST to a Groq endpoint, throwing a meaningful error on a non-OK status.
 * @param {string} pathname
 * @param {RequestInit} init
 * @param {string} label
 * @returns {Promise<Response>}
 */
async function postGroq(pathname, init, label) {
  const res = await fetch(endpoint(pathname), { method: 'POST', ...init });
  if (!res.ok) throw await toGroqError(res, label);
  return res;
}

/**
 * Low-level chat completion call.
 * @param {Object} opts
 * @param {string} opts.model
 * @param {import('../types/index.js').ChatMessage[]} opts.messages
 * @param {number} [opts.temperature]
 * @param {boolean} [opts.json]     Request a strict JSON object response.
 * @param {number} [opts.maxTokens]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<string>} The assistant message content.
 */
export async function chatCompletion({
  model,
  messages,
  temperature = 0.4,
  json = false,
  maxTokens,
  signal,
}) {
  assertConfigured();
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('chatCompletion requires a non-empty messages array.');
  }

  /** @type {Record<string, unknown>} */
  const body = { model, messages, temperature };
  if (json) body.response_format = { type: 'json_object' };
  if (maxTokens) body.max_tokens = maxTokens;

  const res = await postGroq(
    '/chat/completions',
    {
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
      signal,
    },
    'Groq request failed'
  );

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Groq returned an unexpected response shape.');
  }
  return content;
}

/**
 * Chat completion that parses and returns a JSON object.
 * @template T
 * @param {Parameters<typeof chatCompletion>[0]} opts
 * @returns {Promise<T>}
 */
export async function chatCompletionJSON(opts) {
  const raw = await chatCompletion({ ...opts, json: true });
  return parseJSONResponse(raw);
}

/**
 * Robustly parse a model's JSON output, tolerating stray prose/markdown fences.
 * @param {string} raw
 * @returns {any}
 */
export function parseJSONResponse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    // Strip ```json ... ``` fences or grab the first {...} block.
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1] : raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
    return JSON.parse(candidate);
  }
}

/**
 * Transcribe recorded audio using Whisper.
 * @param {Blob} audioBlob
 * @param {Object} [opts]
 * @param {string} [opts.language]  ISO code hint (e.g. 'hi').
 * @returns {Promise<string>} Transcribed text.
 */
export async function transcribeAudio(audioBlob, { language } = {}) {
  assertConfigured();
  const check = validateVoiceBlob(audioBlob);
  if (!check.ok) throw new Error(check.error);

  const form = new FormData();
  form.append('file', audioBlob, 'audio.webm');
  form.append('model', MODELS.WHISPER);
  form.append('response_format', 'json');
  if (language) form.append('language', language);

  const res = await postGroq(
    '/audio/transcriptions',
    { headers: authHeaders(), body: form }, // browser sets multipart boundary
    'Transcription failed'
  );

  const data = await res.json();
  return (data?.text || '').trim();
}
