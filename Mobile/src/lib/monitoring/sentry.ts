// Hata raporlama (Sentry). Tek erişim noktası — uygulamanın geri kalanı @sentry/react-native'i
// doğrudan import etmez. DSN yoksa (varsayılan) tamamen kapalıdır.
//
// Gizlilik: kişisel veri gönderilmez (sendDefaultPii: false); kullanıcı yalnızca sayısal id ile
// işaretlenir — e-posta/ad gönderilmez. İstek gövdeleri ve token'lar Sentry'ye girmez.

import * as Sentry from '@sentry/react-native';

import { ApiError } from '@/lib/api/errors';
import { env } from '@/lib/config/env';

export const isMonitoringEnabled = !!env.sentryDsn;

export function initMonitoring(): void {
  if (!isMonitoringEnabled) return;
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.appEnv,
    sendDefaultPii: false,
    // Performans izleme örneklemesi: production'da düşük tut (kota).
    tracesSampleRate: env.isProd ? 0.1 : 1.0,
    beforeSend(event, hint) {
      // Beklenen API hataları (4xx: doğrulama, yetki, bulunamadı) ve ağ kopmaları gürültüdür.
      const error = hint.originalException;
      if (error instanceof ApiError && (error.isNetworkError || error.status < 500)) return null;
      return event;
    },
  });
}

/** Oturum değişince çağrılır; null → anonim. */
export function setMonitoringUser(userId: number | null): void {
  if (!isMonitoringEnabled) return;
  Sentry.setUser(userId === null ? null : { id: String(userId) });
}

/** Kök bileşeni sarar: yakalanmamış render hataları ve native çökmeler raporlanır. */
export const wrapRoot = <P extends Record<string, unknown>>(component: React.ComponentType<P>) =>
  isMonitoringEnabled ? Sentry.wrap(component) : component;
