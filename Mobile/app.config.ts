import type { ConfigContext, ExpoConfig } from 'expo/config';

// Dinamik Expo config. Ortam değişkenleri `extra` altına gömülür ve uygulamada
// YALNIZCA src/lib/config/env.ts üzerinden okunur.
//
// Güvenlik: iOS ATS / Android cleartext istisnası EKLENMEZ. Development build'ler
// localhost, 10.0.2.2 ve LAN IP'ye HTTP ile zaten ulaşabilir (RN debug manifest +
// ATS'nin IP adreslerine uygulanmaması). Staging/production her zaman HTTPS'tir.

const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 'development';
const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5166';
// Web uygulaması: yasal metinler (Kullanım koşulları, Aydınlatma metni) buradan açılır.
const webBaseUrl = process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:3010';

// Opsiyonel servisler — değer verilmezse kapalıdır, hesap bağlamadan build alınabilir.
// EAS Update (OTA): `eas init` sonrası proje ID'si (expo.dev → proje → ID).
const easProjectId = process.env.EAS_PROJECT_ID || '';
// Sentry: DSN public'tir (pakete gömülür). Auth token ASLA buraya girmez — yalnızca build ortamında
// SENTRY_AUTH_TOKEN olarak durur; yoksa kaynak harita yüklemesi atlanır.
const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

if (appEnv !== 'development' && !apiBaseUrl.startsWith('https://')) {
  // Build zamanında patlasın: HTTP'ye bakan bir mağaza build'i hiç üretilmesin.
  throw new Error(
    `[app.config] EXPO_PUBLIC_APP_ENV=${appEnv} iken EXPO_PUBLIC_API_URL HTTPS olmalı (şu an: ${apiBaseUrl}).`,
  );
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Abacasa',
  slug: 'abacasa',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  // OTA uyumluluğu: aynı `version`'daki build'ler aynı JS güncellemelerini alır. Native kod
  // değişince (yeni native paket, SDK yükseltmesi) `version`'ı artır.
  runtimeVersion: { policy: 'appVersion' },
  updates: easProjectId
    ? { url: `https://u.expo.dev/${easProjectId}`, checkAutomatically: 'ON_LOAD', fallbackToCacheTimeout: 0 }
    : { enabled: false },
  // Deep link şeması (abacasa://...).
  scheme: 'abacasa',
  userInterfaceStyle: 'light',
  ios: {
    icon: './assets/images/icon.png',
    supportsTablet: true,
    // Mağaza kimliği — yayından sonra DEĞİŞTİRİLEMEZ (factech.app alan adının tersi).
    bundleIdentifier: 'app.factech.abacasa',
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'app.factech.abacasa',
    adaptiveIcon: {
      backgroundColor: '#0A6CF5',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFFFFF',
        image: './assets/images/splash-icon.png',
        imageWidth: 220,
      },
    ],
    // configureAndroidBackup (varsayılan true): şifreli değerler Android yedeğine girmez.
    'expo-secure-store',
    // Windows'ta uzun C++ yolları için yeni CMake/ninja (LongPathsEnabled=1 gerekir).
    './plugins/withAndroidCmakeVersion',
    [
      '@sentry/react-native/expo',
      {
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        url: process.env.SENTRY_URL,
        // Token yoksa (yerel / hesapsız build) kaynak harita yüklemesi denenmez, build düşmez.
        disableAutoUpload: !process.env.SENTRY_AUTH_TOKEN,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    apiBaseUrl,
    webBaseUrl,
    appEnv,
    sentryDsn,
    ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
  },
});
