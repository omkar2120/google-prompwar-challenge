import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './appStore.js';

/** Reset store + storage to a known baseline before each test. */
function resetStore() {
  localStorage.clear();
  useAppStore.setState({
    profile: null,
    language: 'en',
    theme: 'dark',
    alertHistory: [],
    planChecks: {},
    notificationsEnabled: false,
    alertsStatus: { lastCheckedAt: null, checking: false },
    user: null,
    activity: [],
  });
}

const get = () => useAppStore.getState();

describe('appStore: user', () => {
  beforeEach(resetStore);

  it('setUser persists the user to localStorage', () => {
    const user = { uid: 'u1', name: 'Asha', email: null, photoURL: null, provider: 'guest' };
    get().setUser(user);
    expect(get().user).toEqual(user);
    expect(JSON.parse(localStorage.getItem('monsoonmitra_user'))).toEqual(user);
  });

  it('setUser(null) clears the stored user', () => {
    get().setUser({ uid: 'u1', name: 'Asha', provider: 'guest' });
    get().setUser(null);
    expect(get().user).toBeNull();
    expect(localStorage.getItem('monsoonmitra_user')).toBeNull();
  });
});

describe('appStore: activity log', () => {
  beforeEach(resetStore);

  it('logActivity prepends and persists', () => {
    get().logActivity('plan', 'Generated plan');
    get().logActivity('travel', 'Travel advisory');
    const activity = get().activity;
    expect(activity[0].label).toBe('Travel advisory');
    expect(activity[1].label).toBe('Generated plan');
    expect(activity).toHaveLength(2);
  });

  it('caps the activity log at 60 entries', () => {
    for (let i = 0; i < 65; i++) get().logActivity('plan', `entry ${i}`);
    expect(get().activity).toHaveLength(60);
    // Newest first — the last logged entry is at the head.
    expect(get().activity[0].label).toBe('entry 64');
  });

  it('clearActivity empties the log', () => {
    get().logActivity('plan', 'x');
    get().clearActivity();
    expect(get().activity).toEqual([]);
  });
});

describe('appStore: profile', () => {
  beforeEach(resetStore);

  it('setProfile stamps updatedAt and syncs language', () => {
    get().setProfile({ homeType: 'apartment', language: 'hi' });
    expect(get().profile.homeType).toBe('apartment');
    expect(typeof get().profile.updatedAt).toBe('number');
    expect(get().language).toBe('hi');
  });

  it('clearProfile removes the profile', () => {
    get().setProfile({ homeType: 'pucca', language: 'en' });
    get().clearProfile();
    expect(get().profile).toBeNull();
  });
});

describe('appStore: theme & language', () => {
  beforeEach(resetStore);

  it('toggleTheme flips theme and reflects the dark class', () => {
    get().toggleTheme(); // dark -> light
    expect(get().theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    get().toggleTheme(); // light -> dark
    expect(get().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('setLanguage updates language', () => {
    get().setLanguage('ta');
    expect(get().language).toBe('ta');
  });
});

describe('appStore: alerts', () => {
  beforeEach(resetStore);

  it('addAlert prepends newest-first and persists', () => {
    get().addAlert({ id: '1', severity: 'moderate', message: 'a', firedAt: 1 });
    get().addAlert({ id: '2', severity: 'high', message: 'b', firedAt: 2 });
    expect(get().alertHistory[0].id).toBe('2');
    expect(JSON.parse(localStorage.getItem('monsoonmitra_alerts'))).toHaveLength(2);
  });

  it('caps alert history at 50 entries', () => {
    for (let i = 0; i < 55; i++) get().addAlert({ id: `${i}`, severity: 'moderate', message: 'm' });
    expect(get().alertHistory).toHaveLength(50);
  });

  it('clearAlerts empties history', () => {
    get().addAlert({ id: '1', severity: 'low', message: 'x' });
    get().clearAlerts();
    expect(get().alertHistory).toEqual([]);
  });

  it('setAlertsStatus merges partial status', () => {
    get().setAlertsStatus({ checking: true });
    expect(get().alertsStatus).toEqual({ lastCheckedAt: null, checking: true });
    get().setAlertsStatus({ lastCheckedAt: 123 });
    expect(get().alertsStatus).toEqual({ lastCheckedAt: 123, checking: true });
  });
});

describe('appStore: plan checks', () => {
  beforeEach(resetStore);

  it('setPlanCheck toggles an item and persists', () => {
    get().setPlanCheck('item-1', true);
    expect(get().planChecks['item-1']).toBe(true);
    get().setPlanCheck('item-1', false);
    expect(get().planChecks['item-1']).toBe(false);
  });

  it('resetPlanChecks clears all checks', () => {
    get().setPlanCheck('a', true);
    get().setPlanCheck('b', true);
    get().resetPlanChecks();
    expect(get().planChecks).toEqual({});
  });
});
