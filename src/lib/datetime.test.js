import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatTimeAgo, formatTimeAgoShort } from './datetime.js';

const NOW = 1_700_000_000_000;
const MIN = 60_000;

afterEach(() => vi.useRealTimers());

function freezeNow() {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
}

describe('formatTimeAgo', () => {
  it('returns "just now" for a few seconds ago', () => {
    freezeNow();
    expect(formatTimeAgo(NOW - 10 * 1000)).toBe('just now');
  });
  it('returns minutes for under an hour', () => {
    freezeNow();
    expect(formatTimeAgo(NOW - 5 * MIN)).toBe('5m ago');
  });
  it('returns hours for under a day', () => {
    freezeNow();
    expect(formatTimeAgo(NOW - 3 * 60 * MIN)).toBe('3h ago');
  });
  it('returns days beyond 24 hours', () => {
    freezeNow();
    expect(formatTimeAgo(NOW - 48 * 60 * MIN)).toBe('2d ago');
  });
});

describe('formatTimeAgoShort', () => {
  it('never shows 0m (floors at 1m)', () => {
    freezeNow();
    expect(formatTimeAgoShort(NOW - 10 * 1000)).toBe('1m');
  });
  it('returns compact minutes/hours/days without the "ago" suffix', () => {
    freezeNow();
    expect(formatTimeAgoShort(NOW - 20 * MIN)).toBe('20m');
    expect(formatTimeAgoShort(NOW - 5 * 60 * MIN)).toBe('5h');
    expect(formatTimeAgoShort(NOW - 72 * 60 * MIN)).toBe('3d');
  });
});
