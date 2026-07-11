import { describe, it, expect } from 'vitest';
import {
  INPUT_LIMITS,
  sanitizeText,
  capText,
  validateChatMessage,
  validateCitySearch,
  validateReportNote,
  validateVoiceBlob,
} from './validation.js';

describe('sanitizeText', () => {
  it('trims whitespace', () => {
    expect(sanitizeText('  hi  ')).toBe('hi');
  });
  it('strips control characters but keeps newlines/tabs', () => {
    expect(sanitizeText('a\u0000b\u0007c')).toBe('abc');
    expect(sanitizeText('line1\nline2')).toBe('line1\nline2');
  });
  it('returns empty string for non-string input', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(42)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });
});

describe('capText', () => {
  it('truncates to the max length', () => {
    expect(capText('abcdef', 3)).toBe('abc');
  });
  it('leaves shorter strings unchanged', () => {
    expect(capText('ab', 5)).toBe('ab');
  });
});

describe('validateChatMessage', () => {
  it('rejects empty/whitespace input', () => {
    expect(validateChatMessage('   ').ok).toBe(false);
    expect(validateChatMessage('').ok).toBe(false);
  });
  it('accepts and trims a normal message', () => {
    const r = validateChatMessage('  What should I do?  ');
    expect(r).toEqual({ ok: true, value: 'What should I do?', error: null });
  });
  it('caps an over-long message at the limit', () => {
    const long = 'a'.repeat(INPUT_LIMITS.CHAT_MESSAGE + 500);
    const r = validateChatMessage(long);
    expect(r.ok).toBe(true);
    expect(r.value).toHaveLength(INPUT_LIMITS.CHAT_MESSAGE);
  });
});

describe('validateCitySearch', () => {
  it('rejects strings shorter than 2 chars', () => {
    expect(validateCitySearch('a').ok).toBe(false);
    expect(validateCitySearch('').ok).toBe(false);
  });
  it('accepts and caps valid input', () => {
    expect(validateCitySearch('Mumbai').ok).toBe(true);
    const long = 'x'.repeat(INPUT_LIMITS.CITY_SEARCH + 20);
    expect(validateCitySearch(long).value).toHaveLength(INPUT_LIMITS.CITY_SEARCH);
  });
});

describe('validateReportNote', () => {
  it('always ok but caps at the note limit', () => {
    const long = 'n'.repeat(INPUT_LIMITS.REPORT_NOTE + 50);
    const r = validateReportNote(long);
    expect(r.ok).toBe(true);
    expect(r.value).toHaveLength(INPUT_LIMITS.REPORT_NOTE);
  });
  it('handles empty note', () => {
    expect(validateReportNote('').value).toBe('');
  });
});

describe('validateVoiceBlob', () => {
  it('rejects a missing or empty blob', () => {
    expect(validateVoiceBlob(null).ok).toBe(false);
    expect(validateVoiceBlob({ size: 0 }).ok).toBe(false);
  });
  it('rejects an oversized blob', () => {
    expect(validateVoiceBlob({ size: INPUT_LIMITS.VOICE_BLOB_BYTES + 1 }).ok).toBe(false);
  });
  it('accepts a reasonable blob', () => {
    expect(validateVoiceBlob({ size: 1024 }).ok).toBe(true);
  });
});
