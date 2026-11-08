// expo-secure-store sarmalayıcısı (iOS Keychain / Android Keystore). Token ve hassas
// veri için TEK erişim noktası — başka hiçbir yer expo-secure-store'u import etmemeli.
//
// - Yazma/silme hatası FIRLATIR: çağıran (authStore) yazılamayan oturumu state'e
//   koymamalı, yoksa yeniden başlatınca kaybolan "hayalet oturum" oluşur.
// - Okuma hatası null döner: bozuk kayıt açılışı çökertmesin.

import * as SecureStore from 'expo-secure-store';

export const SECURE_KEYS = {
  ACCESS_TOKEN: 'auth.accessToken',
  REFRESH_TOKEN: 'auth.refreshToken',
  USER: 'auth.user',
  DEVICE_ID: 'device.id',
  /** Kullanıcı tercihleri (hassas değil; cihazdaki tek kalıcı depo olduğu için burada). */
  PREF_LOCALE: 'pref.locale',
  PREF_THEME: 'pref.themeMode',
} as const;

export type SecureKey = (typeof SECURE_KEYS)[keyof typeof SECURE_KEYS];

// THIS_DEVICE_ONLY: değer iCloud/cihaz yedeğiyle başka cihaza taşınmaz.
// WHEN_UNLOCKED: cihaz kilitliyken okunamaz (arka plan görevi gerekirse gözden geçir).
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

async function get(key: SecureKey): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key, OPTIONS);
  } catch (error) {
    if (__DEV__) console.warn(`[secureStorage] get("${key}") başarısız`, error);
    return null;
  }
}

function set(key: SecureKey, value: string): Promise<void> {
  return SecureStore.setItemAsync(key, value, OPTIONS);
}

function remove(key: SecureKey): Promise<void> {
  return SecureStore.deleteItemAsync(key, OPTIONS);
}

async function getJSON<T>(key: SecureKey): Promise<T | null> {
  const raw = await get(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setJSON(key: SecureKey, value: unknown): Promise<void> {
  return set(key, JSON.stringify(value));
}

export const secureStorage = { get, set, delete: remove, getJSON, setJSON };
