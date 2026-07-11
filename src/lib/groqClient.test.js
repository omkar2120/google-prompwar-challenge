import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseJSONResponse,
  isGroqConfigured,
  chatCompletion,
  chatCompletionJSON,
  transcribeAudio,
  MODELS,
} from './groqClient.js';

const MESSAGES = [{ role: 'user', content: 'hi' }];

function mockFetchOnce({ ok = true, status = 200, json, text, statusText = '' } = {}) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText,
    json: () => Promise.resolve(json),
    text: () => Promise.resolve(text ?? ''),
  });
}

describe('parseJSONResponse', () => {
  it('parses clean JSON', () => {
    expect(parseJSONResponse('{"a":1}')).toEqual({ a: 1 });
  });
  it('parses JSON wrapped in markdown fences', () => {
    expect(parseJSONResponse('```json\n{"risk_level":"high"}\n```')).toEqual({ risk_level: 'high' });
  });
  it('extracts JSON from surrounding prose', () => {
    const raw = 'Here is your plan: {"immediate_actions":[]} Hope this helps!';
    expect(parseJSONResponse(raw)).toEqual({ immediate_actions: [] });
  });
  it('throws on completely non-JSON text', () => {
    expect(() => parseJSONResponse('no json here at all')).toThrow();
  });
});

describe('isGroqConfigured', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('is false when no key/proxy is set', () => {
    vi.stubEnv('VITE_GROQ_API_KEY', '');
    expect(isGroqConfigured()).toBe(false);
  });
  it('is true when an API key is present', () => {
    vi.stubEnv('VITE_GROQ_API_KEY', 'gsk_test');
    expect(isGroqConfigured()).toBe(true);
  });
});

describe('chatCompletion', () => {
  beforeEach(() => vi.stubEnv('VITE_GROQ_API_KEY', 'gsk_test'));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('throws a clear error when unconfigured', async () => {
    vi.stubEnv('VITE_GROQ_API_KEY', '');
    await expect(chatCompletion({ model: MODELS.FAST, messages: MESSAGES })).rejects.toThrow(
      /Groq API key is not set/
    );
  });

  it('rejects an empty messages array', async () => {
    await expect(chatCompletion({ model: MODELS.FAST, messages: [] })).rejects.toThrow(
      /non-empty messages array/
    );
  });

  it('returns the assistant message content on success', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchOnce({ json: { choices: [{ message: { content: 'Stay safe.' } }] } })
    );
    const out = await chatCompletion({ model: MODELS.FAST, messages: MESSAGES });
    expect(out).toBe('Stay safe.');
  });

  it('returns an EMPTY string when the model returns empty content', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({ json: { choices: [{ message: { content: '' } }] } }));
    const out = await chatCompletion({ model: MODELS.FAST, messages: MESSAGES });
    expect(out).toBe('');
  });

  it('throws a meaningful error on a non-OK HTTP status (with body)', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({ ok: false, status: 401, text: 'invalid api key' }));
    await expect(chatCompletion({ model: MODELS.FAST, messages: MESSAGES })).rejects.toThrow(
      /Groq request failed \(401\).*invalid api key/
    );
  });

  it('throws when the response shape is unexpected (missing choices)', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({ json: {} }));
    await expect(chatCompletion({ model: MODELS.FAST, messages: MESSAGES })).rejects.toThrow(
      /unexpected response shape/
    );
  });
});

describe('chatCompletionJSON', () => {
  beforeEach(() => vi.stubEnv('VITE_GROQ_API_KEY', 'gsk_test'));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('parses a JSON object response', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchOnce({ json: { choices: [{ message: { content: '{"recommendation":"go"}' } }] } })
    );
    const out = await chatCompletionJSON({ model: MODELS.REASONING, messages: MESSAGES });
    expect(out).toEqual({ recommendation: 'go' });
  });

  it('throws when the JSON payload is malformed', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchOnce({ json: { choices: [{ message: { content: 'totally not json' } }] } })
    );
    await expect(
      chatCompletionJSON({ model: MODELS.REASONING, messages: MESSAGES })
    ).rejects.toThrow();
  });
});

describe('transcribeAudio', () => {
  beforeEach(() => vi.stubEnv('VITE_GROQ_API_KEY', 'gsk_test'));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('rejects an empty recording before any network call', async () => {
    const spy = vi.fn();
    vi.stubGlobal('fetch', spy);
    await expect(transcribeAudio(new Blob([]))).rejects.toThrow(/No audio was recorded/);
    expect(spy).not.toHaveBeenCalled();
  });

  it('returns trimmed transcribed text on success', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({ json: { text: '  hello there  ' } }));
    const out = await transcribeAudio(new Blob(['abc']));
    expect(out).toBe('hello there');
  });

  it('throws a meaningful error on a non-OK status', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({ ok: false, status: 500, text: 'server error' }));
    await expect(transcribeAudio(new Blob(['abc']))).rejects.toThrow(/Transcription failed \(500\)/);
  });
});
