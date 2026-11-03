/**
 * MustChangePassword bayrağı açık kullanıcıların kilitlendiği sayfa.
 * Middleware, login ve axios interceptor aynı yolu kullanır.
 */
export const FORCE_CHANGE_PASSWORD_PATH = "/auth/force-change-password"

/**
 * "Oturum süreniz doldu" uyarısının sebebi URL yerine sessionStorage'da tutulur:
 * login sayfası bir kez okuyup siler, böylece F5'te uyarı tekrar çıkmaz ve
 * `?expired` sorgu parametresi gibi paylaşılabilir/yer imine eklenebilir bir URL oluşmaz.
 */
const LOGOUT_REASON_KEY = "auth_logout_reason"

export function markSessionExpired(): void {
  if (!import.meta.client) return
  try {
    sessionStorage.setItem(LOGOUT_REASON_KEY, "expired")
  } catch {
    // Storage erişilemezse uyarı gösterilmez; oturum akışı etkilenmez
  }
}

/** Kullanıcı kendisi çıkış yaptığında kalmış olabilecek eski sebebi temizler. */
export function clearSessionExpired(): void {
  if (!import.meta.client) return
  try {
    sessionStorage.removeItem(LOGOUT_REASON_KEY)
  } catch {
    // yok say
  }
}

/** Sebep "expired" ise true döner ve işareti siler (tek seferlik). */
export function consumeSessionExpired(): boolean {
  if (!import.meta.client) return false
  try {
    const expired = sessionStorage.getItem(LOGOUT_REASON_KEY) === "expired"
    sessionStorage.removeItem(LOGOUT_REASON_KEY)
    return expired
  } catch {
    return false
  }
}
