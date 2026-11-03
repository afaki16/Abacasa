/**
 * Global auth middleware.
 *
 * Çalışma akışı:
 *  1) ssr: false olduğu için sadece client-side çalışır
 *  2) İlk yüklemede authStore.initializeAuth() refresh-token cookie ile
 *     yeni access token almayı dener. Başarılıysa user authenticated olur.
 *  3) Public route'lar için authenticated kullanıcılar dashboard'a yönlendirilir
 *  4) Protected route'larda authenticated olmayan kullanıcılar login'e yönlendirilir
 */
import { FORCE_CHANGE_PASSWORD_PATH, markSessionExpired } from '~/utils/authRoutes'

export default defineNuxtRouteMiddleware(async (to) => {
  // ssr: false olduğu için import.meta.server zaten çalışmaz, ama defensive olsun
  if (import.meta.server) return

  const authStore = useAuthStore()

  // İlk yüklemede / sayfa refresh sonrası silent refresh dene
  // (sadece henüz initialize olmamışsa)
  if (!authStore.isAuthenticated) {
    await authStore.initializeAuth()
  }

  // verify-email, reset-password, accept-invite ve confirm-email-change her zaman erişilebilir (email link
  // tıklamasıyla gelinir; oturum açık ya da kapalı çalışır). Zorunlu şifre kilidinden önce döner: e-posta onayı
  // anonim bir uçtur ve kilitli bir oturumda da tamamlanabilmelidir.
  if (to.path === '/auth/verify-email' || to.path === '/auth/reset-password' || to.path === '/auth/accept-invite'
    || to.path === '/auth/confirm-email-change') return

  // Yasal metinler herkese açık (oturum açık ya da kapalı)
  if (to.path.startsWith('/legal/')) return

  const publicRoutes = ['/auth/register', '/auth/check-email', '/auth/forgot-password', '/']

  if (publicRoutes.includes(to.path)) {
    // Authenticated kullanıcı login sayfasına gelirse dashboard'a at
    if (authStore.isAuthenticated && to.path.startsWith('/auth/')) {
      return navigateTo('/dashboard')
    }
    return
  }

  // Korumalı route — authenticate olmamışsa login'e
  if (!authStore.isAuthenticated) {
    return navigateTo('/')
  }

  // Token expired ise silent refresh dene
  if (authStore.isTokenExpired) {
    const refreshed = await authStore.silentRefresh()
    if (!refreshed) {
      authStore.clearAuth()
      markSessionExpired()
      return navigateTo('/')
    }
  }

  // Zorunlu şifre değişimi: bayrak kapanana kadar sadece şifre değiştirme sayfası açılır.
  // Backend de aynı kuralı uygular (PasswordChangeRequiredMiddleware). Kilit sayfası layout'suz olduğundan
  // onay penceresi (ConsentGate) orada açılmaz; bekleyen onaylar şifre değişiminden sonra istenir.
  const mustChangePassword = !!authStore.user?.mustChangePassword
  if (mustChangePassword && to.path !== FORCE_CHANGE_PASSWORD_PATH) {
    return navigateTo(FORCE_CHANGE_PASSWORD_PATH)
  }
  if (!mustChangePassword && to.path === FORCE_CHANGE_PASSWORD_PATH) {
    return navigateTo('/dashboard')
  }
})
