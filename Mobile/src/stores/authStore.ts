// Zustand auth store — oturumun tek doğruluk kaynağı.
//
// Saklama stratejisi (hepsi SecureStore):
//   - accessToken, refreshToken
//   - StoredUser (roller/yetkiler HARİÇ)
// Bellekte: tam User (roller + yetkiler). Açılışta /me ile tazelenir (useSessionValidation).
//
// persist middleware kullanılmıyor: SecureStore asenkron ve yazma hatasını bilmemiz gerekiyor.

import { create } from 'zustand';

import type { LoginResponse, StoredUser, User } from '@/features/auth/types';
import { SECURE_KEYS, secureStorage } from '@/lib/storage/secureStorage';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /** Açılışta storage okunuyor — bitene kadar splash açık kalır. */
  isRehydrating: boolean;
  /** user bu açılışta sunucudan (login/refresh/me) geldi mi? false ise roller/yetkiler boş. */
  isUserVerified: boolean;
}

interface AuthActions {
  /** Login veya refresh sonrası: token'lar + kullanıcı. Storage yazılamazsa FIRLATIR, state değişmez. */
  setSession: (session: LoginResponse) => Promise<void>;
  /** Refresh rotation: setSession ile aynı, ayrı isim okunabilirlik için. */
  updateSession: (session: LoginResponse) => Promise<void>;
  /** /me sonrası. */
  setUser: (user: User) => Promise<void>;
  /** 403 + PasswordChangeRequired: guard zorunlu şifre ekranına yönlendirir. */
  markPasswordChangeRequired: () => void;
  /** Çıkış / refresh reddi. Storage silinemese bile state sıfırlanır. */
  clearAuth: () => Promise<void>;
  rehydrate: () => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isRehydrating: true,
  isUserVerified: false,
};

function toStoredUser(user: User): StoredUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber ?? null,
    profileImageUrl: user.profileImageUrl ?? null,
    tenantId: user.tenantId ?? null,
    mustChangePassword: !!user.mustChangePassword,
    // Hane adı çevrimdışı açılışta da görünsün; yetkiler gibi hassas değil.
    activeTenant: user.activeTenant ?? null,
  };
}

function fromStoredUser(stored: StoredUser): User {
  return {
    ...stored,
    status: 'Active',
    emailConfirmed: true,
    roles: [],
    permissions: [],
  };
}

export const useAuthStore = create<AuthState & AuthActions>()((set, get) => ({
  ...initialState,

  setSession: async ({ accessToken, refreshToken, user }) => {
    await Promise.all([
      secureStorage.set(SECURE_KEYS.ACCESS_TOKEN, accessToken),
      secureStorage.set(SECURE_KEYS.REFRESH_TOKEN, refreshToken),
      secureStorage.setJSON(SECURE_KEYS.USER, toStoredUser(user)),
    ]);
    set({ user, accessToken, refreshToken, isAuthenticated: true, isUserVerified: true });
  },

  updateSession: (session) => get().setSession(session),

  setUser: async (user) => {
    set({ user, isUserVerified: true });
    try {
      await secureStorage.setJSON(SECURE_KEYS.USER, toStoredUser(user));
    } catch {
      // Bellekteki değer doğru; bir sonraki yazımda düzelir.
    }
  },

  markPasswordChangeRequired: () => {
    const user = get().user;
    if (user && !user.mustChangePassword) set({ user: { ...user, mustChangePassword: true } });
  },

  clearAuth: async () => {
    try {
      await Promise.allSettled([
        secureStorage.delete(SECURE_KEYS.ACCESS_TOKEN),
        secureStorage.delete(SECURE_KEYS.REFRESH_TOKEN),
        secureStorage.delete(SECURE_KEYS.USER),
      ]);
    } finally {
      set({ ...initialState, isRehydrating: false });
    }
  },

  rehydrate: async () => {
    try {
      const [accessToken, refreshToken, storedUser] = await Promise.all([
        secureStorage.get(SECURE_KEYS.ACCESS_TOKEN),
        secureStorage.get(SECURE_KEYS.REFRESH_TOKEN),
        secureStorage.getJSON<StoredUser>(SECURE_KEYS.USER),
      ]);
      if (accessToken && refreshToken && storedUser) {
        // Geçerlilik burada DOĞRULANMAZ: useSessionValidation arka planda /me çağırır;
        // token geçersizse refresh interceptor oturumu kapatır.
        set({
          user: fromStoredUser(storedUser),
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isUserVerified: false,
        });
      }
    } finally {
      set({ isRehydrating: false });
    }
  },
}));

/** Guard ve ekranlar için türetilmiş seçiciler. */
export const selectMustChangePassword = (s: AuthState) => !!s.user?.mustChangePassword;

/** Yasal metin onayı bekleniyor mu? Bilgi /me ile gelir; saklı oturumla açılışta /me gelene kadar false. */
export const selectNeedsConsent = (s: AuthState) => (s.user?.pendingConsents?.length ?? 0) > 0;
