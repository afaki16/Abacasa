import { SUPERADMIN_TENANT_COOKIE, superAdminTenantCookieOptions } from '~/composables/useTenantContext'

/**
 * SuperAdmin hane seçimini URL ile senkron tutar (SADECE SuperAdmin).
 *
 * - URL'de ?tenantId=N varsa cookie oraya çekilir → paylaşılan link, yer imi
 *   veya elle yazılan adres hangi hanenin bağlamında olduğunu belirler.
 * - URL'de yoksa ama üst bardan seçim (cookie) varsa parametre adrese eklenir →
 *   sayfa yenilense de, link kopyalansa da bağlam kaybolmaz.
 *
 * SuperAdmin olmayanlarda middleware hiçbir şey yapmaz; X-Tenant-Id de backend tarafından yok sayılır.
 * Seçim yalnızca sistem listelerini süzer; hane bütçe verisi her zaman token'daki aktif haneye göredir.
 * Dosya adı "superadmin-..." olduğu için auth.global.ts'den sonra çalışır (auth hazır).
 */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  if (!authStore.isAuthenticated || !authStore.hasRole('SuperAdmin')) return

  const cookie = useCookie<number | null>(SUPERADMIN_TENANT_COOKIE, superAdminTenantCookieOptions)

  const raw = Array.isArray(to.query.tenantId) ? to.query.tenantId[0] : to.query.tenantId
  const fromUrl = Number(raw)
  const hasUrlTenant = Number.isFinite(fromUrl) && fromUrl > 0

  if (hasUrlTenant) {
    // URL kaynak kabul edilir; seçici ile çelişiyorsa URL kazanır.
    if (cookie.value !== fromUrl) {
      cookie.value = fromUrl
      // Aynı cookie'yi okuyan diğer useCookie referansları (üst bar seçici, axios) yazmayı otomatik görmez.
      refreshCookie(SUPERADMIN_TENANT_COOKIE)
    }
    return
  }

  if (cookie.value) {
    return navigateTo(
      { path: to.path, query: { ...to.query, tenantId: String(cookie.value) } },
      { replace: true },
    )
  }
})
