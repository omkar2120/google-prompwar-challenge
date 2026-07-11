import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  assessSeverity,
  classifyRain,
  extractDayZeroMetrics,
  describeWeatherCode,
  fetchForecast,
  geocodeCity,
  reverseGeocode,
  getCurrentPosition,
  THRESHOLDS,
} from './openMeteo.js';

function makeForecast(precipSum, prob, gust) {
  return {
    daily: {
      time: ['2026-07-11'],
      precipitation_sum: [precipSum],
      precipitation_probability_max: [prob],
      windspeed_10m_max: [30],
    },
    hourly: {
      windgusts_10m: Array.from({ length: 24 }, () => gust),
    },
  };
}

describe('classifyRain (IMD thresholds)', () => {
  it('returns low below the heavy threshold', () => {
    expect(classifyRain(10).level).toBe('low');
  });

  it('does NOT trigger exactly at the heavy threshold (uses strict >)', () => {
    expect(classifyRain(THRESHOLDS.HEAVY_RAIN_MM).level).toBe('low');
  });

  it('flags moderate just above the heavy threshold', () => {
    const r = classifyRain(THRESHOLDS.HEAVY_RAIN_MM + 0.1);
    expect(r.level).toBe('moderate');
    expect(r.trigger).toContain('heavy threshold');
  });

  it('flags high above the very-heavy threshold', () => {
    expect(classifyRain(THRESHOLDS.VERY_HEAVY_MM + 1).level).toBe('high');
  });

  it('flags severe above the extremely-heavy threshold', () => {
    expect(classifyRain(THRESHOLDS.EXTREMELY_HEAVY_MM + 1).level).toBe('severe');
  });
});

describe('extractDayZeroMetrics', () => {
  it('reads day-0 metrics from a full forecast', () => {
    const m = extractDayZeroMetrics(makeForecast(70, 80, 45));
    expect(m).toEqual({ maxPrecip: 70, maxProb: 80, maxGust: 45 });
  });

  it('defaults to zeroes for empty/malformed forecast', () => {
    expect(extractDayZeroMetrics({})).toEqual({ maxPrecip: 0, maxProb: 0, maxGust: 0 });
    expect(extractDayZeroMetrics(null)).toEqual({ maxPrecip: 0, maxProb: 0, maxGust: 0 });
    expect(extractDayZeroMetrics({ daily: {}, hourly: {} }).maxGust).toBe(0);
  });
});

describe('assessSeverity', () => {
  it('returns low for calm conditions with no triggers', () => {
    const r = assessSeverity(makeForecast(2, 20, 10));
    expect(r.level).toBe('low');
    expect(r.triggers).toHaveLength(0);
    expect(r.label).toBe('Normal conditions');
  });

  it('flags IMD heavy rain above 64.5mm', () => {
    const r = assessSeverity(makeForecast(70, 80, 15));
    expect(r.level).toBe('moderate');
    expect(r.maxPrecip).toBe(70);
  });

  it('flags severe above the extremely-heavy threshold', () => {
    const r = assessSeverity(makeForecast(THRESHOLDS.EXTREMELY_HEAVY_MM + 10, 95, 20));
    expect(r.level).toBe('severe');
  });

  it('escalates a calm day to a Rain Watch on high probability alone', () => {
    const r = assessSeverity(makeForecast(5, THRESHOLDS.PROBABILITY_WATCH + 5, 10));
    expect(r.level).toBe('moderate');
    expect(r.label).toBe('Rain Watch');
  });

  it('does not downgrade heavy rain to a watch', () => {
    const r = assessSeverity(makeForecast(120, 90, 10));
    expect(r.level).toBe('high');
    expect(r.label).toContain('Very Heavy');
  });

  it('flags storm risk from wind gusts and escalates a calm day', () => {
    const r = assessSeverity(makeForecast(5, 30, THRESHOLDS.STORM_GUST_KMH + 10));
    expect(r.triggers.some((t) => t.includes('storm'))).toBe(true);
    expect(r.level).toBe('moderate');
    expect(r.label).toBe('Storm Risk');
  });

  it('handles an empty forecast object gracefully', () => {
    const r = assessSeverity({});
    expect(r.level).toBe('low');
    expect(r.maxGust).toBe(0);
  });
});

describe('describeWeatherCode', () => {
  it('maps known codes', () => {
    expect(describeWeatherCode(0).label).toBe('Clear sky');
    expect(describeWeatherCode(95).emoji).toBeTruthy();
  });
  it('handles unknown codes gracefully', () => {
    expect(describeWeatherCode(999).label).toBe('Unknown');
  });
});

describe('fetchForecast', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns normalized forecast data on success', async () => {
    const payload = {
      current: { temperature_2m: 28 },
      hourly: { precipitation: [1] },
      daily: { precipitation_sum: [12] },
      timezone: 'Asia/Kolkata',
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(payload) }));
    const out = await fetchForecast(19.07, 72.87);
    expect(out.current.temperature_2m).toBe(28);
    expect(out.timezone).toBe('Asia/Kolkata');
    expect(typeof out.fetchedAt).toBe('number');
  });

  it('throws a meaningful error on a non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(fetchForecast(1, 2)).rejects.toThrow(/Weather service error \(503\)/);
  });

  it('propagates a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(fetchForecast(1, 2)).rejects.toThrow('offline');
  });
});

describe('geocodeCity', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns [] for empty/short input without calling the network', async () => {
    const spy = vi.fn();
    vi.stubGlobal('fetch', spy);
    expect(await geocodeCity('')).toEqual([]);
    expect(await geocodeCity('a')).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('maps API results to GeoLocation shape', async () => {
    const payload = {
      results: [
        { latitude: 19, longitude: 72, name: 'Mumbai', admin1: 'MH', country: 'India' },
      ],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(payload) }));
    const out = await geocodeCity('Mumbai');
    expect(out).toEqual([
      { latitude: 19, longitude: 72, name: 'Mumbai', admin1: 'MH', country: 'India' },
    ]);
  });

  it('returns [] when the API omits results (empty data)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }));
    expect(await geocodeCity('Nowhere')).toEqual([]);
  });

  it('throws a meaningful error on a non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    await expect(geocodeCity('Mumbai')).rejects.toThrow(/Location search error \(429\)/);
  });
});

describe('reverseGeocode', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('resolves a place name and caches repeat lookups', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ address: { city: 'Pune', state: 'MH', country: 'India' } }),
    });
    vi.stubGlobal('fetch', fetchSpy);
    const a = await reverseGeocode(18.52, 73.85);
    expect(a.name).toBe('Pune');
    // Second identical call should hit the in-memory cache (no extra fetch).
    const b = await reverseGeocode(18.52, 73.85);
    expect(b.name).toBe('Pune');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('throws on a non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(reverseGeocode(1.111, 2.222)).rejects.toThrow(/Reverse geocoding error/);
  });
});

describe('getCurrentPosition', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it('rejects when geolocation is unsupported', async () => {
    vi.stubGlobal('navigator', {});
    await expect(getCurrentPosition()).rejects.toThrow(/not supported/);
  });

  it('resolves coordinates from the geolocation API', async () => {
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (ok) => ok({ coords: { latitude: 10, longitude: 20 } }),
      },
    });
    await expect(getCurrentPosition()).resolves.toEqual({ latitude: 10, longitude: 20 });
  });

  it('rejects with the geolocation error message', async () => {
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (_ok, err) => err({ message: 'denied' }),
      },
    });
    await expect(getCurrentPosition()).rejects.toThrow('denied');
  });
});
