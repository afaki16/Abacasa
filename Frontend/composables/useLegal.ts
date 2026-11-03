import { API_ENDPOINTS } from '~/utils/apiEndpoints'
import type { ConsentDocument, LegalVersions } from '~/types'
import { useAuthStore } from '~/stores/auth'

export const useLegal = () => {
  const authStore = useAuthStore()

  // Anonim; hata durumunda null (sayfa sürümsüz gösterilir)
  const getVersions = async (): Promise<LegalVersions | null> => {
    try {
      const { $api } = useNuxtApp()
      const response = await $api.get(API_ENDPOINTS.LEGAL.VERSIONS)
      return response.data.data
    } catch {
      return null
    }
  }

  // Güncel sürümlerle onay; kalan bekleyen onaylar kullanıcı nesnesine yazılır. Hatalar çağırana bırakılır
  const acceptConsents = async (documentTypes: ConsentDocument[]) => {
    const { $api } = useNuxtApp()
    const response = await $api.post(API_ENDPOINTS.AUTH.CONSENTS, { documentTypes })
    const pending: ConsentDocument[] = response.data.data?.pendingConsents ?? []
    if (authStore.user) authStore.user.pendingConsents = pending
    return pending
  }

  return { getVersions, acceptConsents }
}
