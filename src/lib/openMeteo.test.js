import { describe, it, expect } from 'vitest';
import { assessSeverity, describeWeatherCode, THRESHOLDS } from './openMeteo.js';

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

describe('assessSeverity', () => {
  it('returns low for calm conditions', () => {
    const r = assessSeverity(makeForecast(2, 20, 10));
    expect(r.level).toBe('low');
    expect(r.triggers).toHaveLength(0);
  });

  it('flags IMD heavy rain above 64.5mm', () => {
    const r = assessSeverity(makeForecast(70, 80, 15));
    expect(r.level).toBe('moderate');
    expect(r.maxPrecip).toBe(70);
  });

  it('flags severe above extremely-heavy threshold', () => {
    const r = assessSeverity(makeForecast(THRESHOLDS.EXTREMELY_HEAVY_MM + 10, 95, 20));
    expect(r.level).toBe('severe');
  });

  it('flags storm risk from wind gusts', () => {
    const r = assessSeverity(makeForecast(5, 30, THRESHOLDS.STORM_GUST_KMH + 10));
    expect(r.triggers.some((t) => t.includes('storm'))).toBe(true);
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
