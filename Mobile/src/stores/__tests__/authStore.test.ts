import type { LoginResponse, User } from '@/features/auth/types';
import { SECURE_KEYS } from '@/lib/storage/secureStorage';

import { useAuthStore } from '../authStore';

const secureStore = jest.requireMock('expo-secure-store');

const user: User = {
  id: 7,
  firstName: 'Ada',
  lastName: 'Yılmaz',
  fullName: 'Ada Yılmaz',
  email: 'ada@example.com',
  phoneNumber: '+905551234567',
  status: 'Active',
  emailConfirmed: true,
  profileImageUrl: null,
  tenantId: 1,
  mustChangePassword: false,
  roles: [{ id: 2, name: 'Admin', isSystemRole: true }],
  permissions: [{ id: 1, name: 'Users.Read' }],
};
const session: LoginResponse = { accessToken: 'a1', refreshToken: 'r1', expiresAt: '', user };

beforeEach(async () => {
  await useAuthStore.getState().clearAuth();
});

describe('authStore', () => {
  it('setSession token\'ları ve kullanıcıyı saklar; roller/yetkiler cihaza YAZILMAZ', async () => {
    await useAuthStore.getState().setSession(session);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isUserVerified).toBe(true);
    expect(secureStore.__store.get(SECURE_KEYS.ACCESS_TOKEN)).toBe('a1');
    expect(secureStore.__store.get(SECURE_KEYS.REFRESH_TOKEN)).toBe('r1');

    const stored = JSON.parse(secureStore.__store.get(SECURE_KEYS.USER));
    expect(stored.email).toBe('ada@example.com');
    expect(stored.roles).toBeUndefined();
    expect(stored.permissions).toBeUndefined();
  });

  it('yazma hatasında state değişmez (hayalet oturum yok)', async () => {
    secureStore.__failNextSet();
    await expect(useAuthStore.getState().setSession(session)).rejects.toThrow('keystore unavailable');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('rehydrate saklı oturumu yükler ama doğrulanmamış işaretler (yetkiler /me ile gelir)', async () => {
    await useAuthStore.getState().setSession(session);
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isRehydrating: true });

    await useAuthStore.getState().rehydrate();

    const state = useAuthStore.getState();
    expect(state.isRehydrating).toBe(false);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isUserVerified).toBe(false);
    expect(state.user?.email).toBe('ada@example.com');
    expect(state.user?.permissions).toEqual([]);
  });

  it('rehydrate eksik veride girişsiz kalır', async () => {
    secureStore.__store.set(SECURE_KEYS.ACCESS_TOKEN, 'a1'); // refresh ve kullanıcı yok
    await useAuthStore.getState().rehydrate();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('clearAuth her şeyi siler', async () => {
    await useAuthStore.getState().setSession(session);
    await useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(secureStore.__store.size).toBe(0);
  });

  it('markPasswordChangeRequired bayrağı açar', async () => {
    await useAuthStore.getState().setSession(session);
    useAuthStore.getState().markPasswordChangeRequired();
    expect(useAuthStore.getState().user?.mustChangePassword).toBe(true);
  });
});
