// Kullanıcı tercihleri: dil ve tema. Hesaptan bağımsızdır (çıkışta silinmez).
// SecureStore'da saklanır (uygulamanın tek kalıcı deposu); yazma hatası tercihi bellekte bırakır.

import { create } from 'zustand';

import { SECURE_KEYS, secureStorage } from '@/lib/storage/secureStorage';

export type AppLocale = 'tr' | 'en';
export type ThemeMode = 'system' | 'light' | 'dark';

export const SUPPORTED_LOCALES: readonly AppLocale[] = ['tr', 'en'];

/** Cihaz dili İngilizce ise en, aksi halde tr (uygulamanın asıl dili Türkçe). */
export function detectDeviceLocale(): AppLocale {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    return tag.toLowerCase().startsWith('en') ? 'en' : 'tr';
  } catch {
    return 'tr';
  }
}

interface PreferencesState {
  locale: AppLocale;
  themeMode: ThemeMode;
  /** Saklı tercihler okundu mu (kök layout splash'i buna kadar tutar). */
  isLoaded: boolean;
}

interface PreferencesActions {
  load: () => Promise<void>;
  setLocale: (locale: AppLocale) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const isLocale = (v: string | null): v is AppLocale => v === 'tr' || v === 'en';
const isThemeMode = (v: string | null): v is ThemeMode => v === 'system' || v === 'light' || v === 'dark';

export const usePreferencesStore = create<PreferencesState & PreferencesActions>()((set) => ({
  locale: detectDeviceLocale(),
  themeMode: 'system',
  isLoaded: false,

  load: async () => {
    try {
      const [locale, themeMode] = await Promise.all([
        secureStorage.get(SECURE_KEYS.PREF_LOCALE),
        secureStorage.get(SECURE_KEYS.PREF_THEME),
      ]);
      set({
        ...(isLocale(locale) ? { locale } : {}),
        ...(isThemeMode(themeMode) ? { themeMode } : {}),
      });
    } finally {
      set({ isLoaded: true });
    }
  },

  setLocale: async (locale) => {
    set({ locale });
    try {
      await secureStorage.set(SECURE_KEYS.PREF_LOCALE, locale);
    } catch {
      // Bellekteki tercih geçerli; bir sonraki açılışta cihaz diline düşer.
    }
  },

  setThemeMode: async (themeMode) => {
    set({ themeMode });
    try {
      await secureStorage.set(SECURE_KEYS.PREF_THEME, themeMode);
    } catch {
      // Bellekteki tercih geçerli.
    }
  },
}));
