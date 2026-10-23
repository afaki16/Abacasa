import { safeRedirect } from '~/utils/safeRedirect'

/**
 * Guest middleware — sadece login olmamış kullanıcılar erişebilir.
 * Login/register sayfalarında kullanılır.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  // Henüz initialize olmamışsa silent refresh dene
  if (!authStore.isAuthenticated) {
    await authStore.initializeAuth()
  }

  // Oturum açıksa ?redirect= (yalnızca uygulama içi yol) ya da dashboard
  if (authStore.isAuthenticated) {
    return navigateTo(safeRedirect(to.query.redirect) ?? '/dashboard')
  }
})
