import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Force the local-only (no-Firebase) code path.
vi.mock('../lib/firebase.js', () => ({ isFirebaseConfigured: false, db: null }));

import { useCommunityReports } from './useCommunityReports.js';
import { INPUT_LIMITS } from '../lib/validation.js';

beforeEach(() => localStorage.clear());

describe('useCommunityReports (local-only mode)', () => {
  it('reports isShared=false and starts empty', () => {
    const { result } = renderHook(() => useCommunityReports());
    expect(result.current.isShared).toBe(false);
    expect(result.current.reports).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('addReport stores a report locally with an id and timestamp', async () => {
    const { result } = renderHook(() => useCommunityReports());
    await act(async () => {
      await result.current.addReport({ type: 'waterlogging', note: 'Knee-deep water', lat: 1, lng: 2 });
    });
    await waitFor(() => expect(result.current.reports).toHaveLength(1));
    const r = result.current.reports[0];
    expect(r.type).toBe('waterlogging');
    expect(r.note).toBe('Knee-deep water');
    expect(r.id).toBeTruthy();
    expect(typeof r.createdAt).toBe('number');
    // Persisted to localStorage
    expect(JSON.parse(localStorage.getItem('monsoonmitra_reports_local'))).toHaveLength(1);
  });

  it('caps an over-long report note at the note limit', async () => {
    const { result } = renderHook(() => useCommunityReports());
    await act(async () => {
      await result.current.addReport({
        type: 'other',
        note: 'x'.repeat(INPUT_LIMITS.REPORT_NOTE + 100),
        lat: 0,
        lng: 0,
      });
    });
    await waitFor(() => expect(result.current.reports).toHaveLength(1));
    expect(result.current.reports[0].note).toHaveLength(INPUT_LIMITS.REPORT_NOTE);
  });
});
