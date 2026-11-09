import type { Session } from '@/features/auth/types';

import { buildSessionOverview, cleanSessionText, relativeTime, sessionDeviceIcon } from '../sessionsView';

const NOW = Date.parse('2026-11-08T12:00:00Z');

const session = (overrides: Partial<Session>): Session => ({
  id: 1,
  createdDate: '2026-11-01T10:00:00Z',
  expiryDate: '2026-12-01T10:00:00Z',
  isActive: true,
  ipAddress: '10.0.0.1',
  deviceId: 'Unknown',
  deviceName: 'Unknown',
  deviceType: 'Unknown',
  location: 'Unknown',
  ...overrides,
});

describe('cleanSessionText', () => {
  it('"Unknown", boş ve null → null', () => {
    expect(cleanSessionText('Unknown')).toBeNull();
    expect(cleanSessionText('  ')).toBeNull();
    expect(cleanSessionText(null)).toBeNull();
    expect(cleanSessionText(' İstanbul ')).toBe('İstanbul');
  });
});

describe('sessionDeviceIcon', () => {
  it('tür ve addan ikon', () => {
    expect(sessionDeviceIcon('Desktop', 'Web · Chrome')).toBe('laptop');
    expect(sessionDeviceIcon('Mobile', 'iPad Pro')).toBe('tablet-android');
    expect(sessionDeviceIcon('Mobile', 'iPhone 15')).toBe('smartphone');
    expect(sessionDeviceIcon('Unknown', 'Unknown')).toBe('devices');
  });
});

describe('buildSessionOverview', () => {
  const sessions = [
    session({ id: 1, createdDate: '2026-11-07T10:00:00Z', deviceId: 'other', deviceName: 'Web · Chrome', deviceType: 'Desktop' }),
    session({ id: 2, createdDate: '2026-11-01T10:00:00Z', deviceId: 'me', deviceName: 'iPhone 15', location: 'İstanbul' }),
    session({ id: 3, isActive: false, createdDate: '2026-10-01T10:00:00Z', expiryDate: '2026-10-31T10:00:00Z' }),
    session({ id: 4, isActive: false, createdDate: '2026-10-20T10:00:00Z', expiryDate: '2026-11-20T10:00:00Z' }),
  ];

  it('bu cihaz önce, sonra yeniden eskiye; geçmişte süresi dolan / kapatılan ayrılır', () => {
    const { active, history } = buildSessionOverview(sessions, 'me', NOW);
    expect(active.map((s) => s.id)).toEqual([2, 1]);
    expect(active[0]).toMatchObject({ isThisDevice: true, place: 'İstanbul', name: 'iPhone 15' });
    expect(active[1]).toMatchObject({ isThisDevice: false, place: '10.0.0.1', icon: 'laptop' });
    expect(history.map((s) => [s.id, s.status])).toEqual([
      [4, 'revoked'],
      [3, 'expired'],
    ]);
  });

  it('geçmiş sınırlıdır; cihaz kimliği yoksa "bu cihaz" yok', () => {
    const { active, history } = buildSessionOverview(sessions, null, NOW, 1);
    expect(active.some((s) => s.isThisDevice)).toBe(false);
    expect(history).toHaveLength(1);
  });
});

describe('relativeTime', () => {
  it('birimler', () => {
    expect(relativeTime('2026-11-08T11:59:30Z', NOW)).toEqual({ unit: 'justNow' });
    expect(relativeTime('2026-11-08T11:55:00Z', NOW)).toEqual({ unit: 'minutes', count: 5 });
    expect(relativeTime('2026-11-08T10:00:00Z', NOW)).toEqual({ unit: 'hours', count: 2 });
    expect(relativeTime('2026-11-05T12:00:00Z', NOW)).toEqual({ unit: 'days', count: 3 });
    expect(relativeTime('2026-09-01T12:00:00Z', NOW)).toEqual({ unit: 'date', iso: '2026-09-01T12:00:00Z' });
  });
});
