import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

vi.mock('../lib/openMeteo.js', () => ({
  fetchForecast: vi.fn(),
  assessSeverity: vi.fn(),
}));
vi.mock('../lib/groqClient.js', () => ({
  chatCompletion: vi.fn(),
  isGroqConfigured: vi.fn(),
  MODELS: { FAST: 'fast-model' },
}));
vi.mock('../lib/prompts/index.js', () => ({
  buildAlertPrompt: vi.fn(() => 'system prompt'),
}));

import { fetchForecast, assessSeverity } from '../lib/openMeteo.js';
import { chatCompletion, isGroqConfigured } from '../lib/groqClient.js';
import { useAlertsEngine } from './useAlertsEngine.js';
import { useAppStore } from '../store/appStore.js';

const LOCATION = { latitude: 19, longitude: 72, name: 'Testville' };

function resetStore() {
  localStorage.clear();
  useAppStore.setState({
    alertHistory: [],
    notificationsEnabled: false,
    alertsStatus: { lastCheckedAt: null, checking: false },
  });
}

const MODERATE = {
  level: 'moderate',
  label: 'Heavy Rain (IMD)',
  triggers: ['Rain sum 70mm exceeds heavy threshold (64.5mm)'],
  maxPrecip: 70,
  maxProb: 80,
  maxGust: 10,
};

beforeEach(() => {
  resetStore();
  vi.clearAllMocks();
  fetchForecast.mockResolvedValue({ daily: {}, hourly: {} });
  assessSeverity.mockReturnValue(MODERATE);
  isGroqConfigured.mockReturnValue(false);
});

afterEach(() => vi.unstubAllGlobals());

describe('useAlertsEngine', () => {
  it('fires a deterministic alert when severity is non-low', async () => {
    renderHook(() => useAlertsEngine(LOCATION, 'en'));
    await waitFor(() => expect(useAppStore.getState().alertHistory).toHaveLength(1));
    const alert = useAppStore.getState().alertHistory[0];
    expect(alert.severity).toBe('moderate');
    expect(alert.message).toContain('Take precautions');
    expect(alert.message).toContain('Testville');
  });

  it('adopts AI phrasing when Groq returns a non-empty string', async () => {
    isGroqConfigured.mockReturnValue(true);
    chatCompletion.mockResolvedValue('Heavy rain closing in — move to higher ground now.');
    renderHook(() => useAlertsEngine(LOCATION, 'en'));
    await waitFor(() => expect(useAppStore.getState().alertHistory).toHaveLength(1));
    expect(useAppStore.getState().alertHistory[0].message).toBe(
      'Heavy rain closing in — move to higher ground now.'
    );
  });

  it('FALLS BACK to the deterministic message when AI returns an empty string', async () => {
    isGroqConfigured.mockReturnValue(true);
    chatCompletion.mockResolvedValue('   '); // whitespace-only == empty after trim
    renderHook(() => useAlertsEngine(LOCATION, 'en'));
    await waitFor(() => expect(useAppStore.getState().alertHistory).toHaveLength(1));
    const msg = useAppStore.getState().alertHistory[0].message;
    expect(msg).toContain('Take precautions');
    expect(msg).not.toBe('');
  });

  it('falls back to the deterministic message when the AI call throws', async () => {
    isGroqConfigured.mockReturnValue(true);
    chatCompletion.mockRejectedValue(new Error('groq down'));
    renderHook(() => useAlertsEngine(LOCATION, 'en'));
    await waitFor(() => expect(useAppStore.getState().alertHistory).toHaveLength(1));
    expect(useAppStore.getState().alertHistory[0].message).toContain('Take precautions');
  });

  it('does not fire for low severity', async () => {
    assessSeverity.mockReturnValue({ level: 'low', label: 'Normal conditions', triggers: [] });
    const { result } = renderHook(() => useAlertsEngine(LOCATION, 'en'));
    await act(async () => {
      await result.current.runCheck();
    });
    expect(useAppStore.getState().alertHistory).toHaveLength(0);
  });

  it('deduplicates repeated same-severity checks in one session', async () => {
    const { result } = renderHook(() => useAlertsEngine(LOCATION, 'en'));
    await waitFor(() => expect(useAppStore.getState().alertHistory).toHaveLength(1));
    await act(async () => {
      await result.current.runCheck();
    });
    expect(useAppStore.getState().alertHistory).toHaveLength(1);
  });

  it('swallows network failures without throwing or firing', async () => {
    fetchForecast.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useAlertsEngine(LOCATION, 'en'));
    await act(async () => {
      await result.current.runCheck();
    });
    expect(useAppStore.getState().alertHistory).toHaveLength(0);
  });
});
