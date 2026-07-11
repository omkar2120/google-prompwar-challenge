// Centralized input validation & sanitization for every place user-controlled
// text or binary flows into an external API (Groq, Open-Meteo, Firestore).
// Keeping these caps in one module means the limits are consistent, testable,
// and can't silently drift between call sites.

/** Hard caps for user-controlled inputs. */
export const INPUT_LIMITS = {
  /** Max characters for a single chatbot message sent to Groq. */
  CHAT_MESSAGE: 2000,
  /** Max characters for a city / place search string. */
  CITY_SEARCH: 80,
  /** Max characters for a community hazard-report note. */
  REPORT_NOTE: 140,
  /** Max size (bytes) for a recorded voice blob sent to Whisper (~10MB). */
  VOICE_BLOB_BYTES: 10 * 1024 * 1024,
};

/**
 * Trim a string and collapse control characters that could corrupt prompts,
 * JSON payloads, or PDF/WhatsApp exports. Non-strings become an empty string.
 * @param {unknown} value
 * @returns {string}
 */
export function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  // Strip ASCII control chars except newline (\n) and tab (\t).
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

/**
 * Sanitize and enforce a maximum length (truncating rather than throwing so the
 * UX degrades gracefully for over-long input).
 * @param {unknown} value
 * @param {number} max
 * @returns {string}
 */
export function capText(value, max) {
  const clean = sanitizeText(value);
  return clean.length > max ? clean.slice(0, max) : clean;
}

/**
 * Validate & normalize a chatbot message before sending to Groq.
 * @param {unknown} value
 * @returns {{ ok: boolean, value: string, error: string|null }}
 */
export function validateChatMessage(value) {
  const clean = sanitizeText(value);
  if (!clean) return { ok: false, value: '', error: 'Message is empty.' };
  return { ok: true, value: capText(clean, INPUT_LIMITS.CHAT_MESSAGE), error: null };
}

/**
 * Validate & normalize a city search string.
 * @param {unknown} value
 * @returns {{ ok: boolean, value: string, error: string|null }}
 */
export function validateCitySearch(value) {
  const clean = sanitizeText(value);
  if (clean.length < 2) {
    return { ok: false, value: clean, error: 'Enter at least 2 characters.' };
  }
  return { ok: true, value: capText(clean, INPUT_LIMITS.CITY_SEARCH), error: null };
}

/**
 * Validate & normalize a community hazard-report note (optional field).
 * @param {unknown} value
 * @returns {{ ok: boolean, value: string, error: string|null }}
 */
export function validateReportNote(value) {
  return { ok: true, value: capText(value, INPUT_LIMITS.REPORT_NOTE), error: null };
}

/**
 * Validate a recorded voice blob before uploading to Whisper.
 * @param {Blob|null|undefined} blob
 * @returns {{ ok: boolean, error: string|null }}
 */
export function validateVoiceBlob(blob) {
  if (!blob || typeof blob.size !== 'number' || blob.size === 0) {
    return { ok: false, error: 'No audio was recorded. Please try again.' };
  }
  if (blob.size > INPUT_LIMITS.VOICE_BLOB_BYTES) {
    return { ok: false, error: 'Recording is too long. Please keep it under a minute.' };
  }
  return { ok: true, error: null };
}
