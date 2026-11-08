// Kalıcı cihaz kimliği. Backend refresh token'ları cihaza bağlar; "Oturumlarım" ve
// "bu cihazdan çıkış" (logout-device) bu kimlikle çalışır.

import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';

import { SECURE_KEYS, secureStorage } from '@/lib/storage/secureStorage';

let cached: string | null = null;

export async function getOrCreateDeviceId(): Promise<string> {
  if (cached) return cached;
  const existing = await secureStorage.get(SECURE_KEYS.DEVICE_ID);
  if (existing) {
    cached = existing;
    return existing;
  }
  const fresh = Crypto.randomUUID();
  try {
    await secureStorage.set(SECURE_KEYS.DEVICE_ID, fresh);
  } catch {
    // Yazılamazsa bu oturum için bellekteki değerle devam et.
  }
  cached = fresh;
  return fresh;
}

export function getDeviceName(): string {
  return (
    Device.deviceName ||
    [Device.manufacturer, Device.modelName].filter(Boolean).join(' ') ||
    'Mobil cihaz'
  );
}
