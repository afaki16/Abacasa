// Tip-güvenli ortam erişimi. Uygulamanın TEK env okuma noktası — başka hiçbir yer
// Constants.expoConfig.extra'ya veya process.env'e doğrudan dokunmamalı.
// Değerler app.config.ts → extra üzerinden gelir.

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export type AppEnv = 'development' | 'staging' | 'production';

interface Env {
  apiBaseUrl: string;
  /** Web uygulaması (yasal metin sayfaları burada açılır). */
  webBaseUrl: string;
  appEnv: AppEnv;
  /** Boşsa Sentry kapalı. */
  sentryDsn: string;
  isDev: boolean;
  isProd: boolean;
}

/** Metro'nun çalıştığı makinenin LAN IP'si (fiziksel cihazdan backend'e ulaşmak için). */
function getDevServerHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

function replaceLocalhost(url: string, host: string): string {
  return url.replace('localhost', host).replace('127.0.0.1', host);
}

function resolveApiBaseUrl(configured: string, appEnv: AppEnv): string {
  const isLocal = configured.includes('localhost') || configured.includes('127.0.0.1');
  if (!isLocal || appEnv !== 'development') return configured;

  // Android emulator host makinenin localhost'una 10.0.2.2 ile ulaşır.
  if (Platform.OS === 'android' && !Device.isDevice) {
    return replaceLocalhost(configured, '10.0.2.2');
  }

  // Fiziksel cihaz: Metro'nun LAN IP'si (aynı Wi-Fi gerekir).
  const devHost = Device.isDevice ? getDevServerHost() : null;
  if (devHost) return replaceLocalhost(configured, devHost);

  // iOS simulator: localhost zaten çalışır.
  return configured;
}

const extra = Constants.expoConfig?.extra ?? {};
const rawEnv = extra.appEnv as string | undefined;
const appEnv: AppEnv = rawEnv === 'staging' || rawEnv === 'production' ? rawEnv : 'development';

export const env: Env = {
  apiBaseUrl: resolveApiBaseUrl((extra.apiBaseUrl as string | undefined) ?? 'http://localhost:5166', appEnv),
  webBaseUrl: resolveApiBaseUrl((extra.webBaseUrl as string | undefined) ?? 'http://localhost:3010', appEnv),
  appEnv,
  sentryDsn: (extra.sentryDsn as string | undefined) ?? '',
  isDev: appEnv === 'development',
  isProd: appEnv === 'production',
};

if (__DEV__) {
  console.log(`[env] apiBaseUrl=${env.apiBaseUrl} appEnv=${env.appEnv}`);
}
