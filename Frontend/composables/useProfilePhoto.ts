import { API_ENDPOINTS } from '~/utils/apiEndpoints'

/** Backend ile aynı sınırlar (SetUserPhotoCommand.MaxBytes); asıl kontrol backend'de. */
export const PROFILE_PHOTO_MAX_BYTES = 10 * 1024 * 1024
export const PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Profil fotoğrafı yükleme/kaldırma. userId verilmezse giriş yapan kullanıcının kendi
 * fotoğrafı (/api/auth/profile/photo), verilirse admin olarak başka kullanıcınınki.
 * Kendi fotoğrafı değişince auth store'daki kullanıcı da güncellenir (header avatarı).
 */
export const useProfilePhoto = () => {
  const { $api } = useNuxtApp()
  const authStore = useAuthStore()

  const endpoint = (userId?: number | string | null) =>
    userId == null ? API_ENDPOINTS.AUTH.PROFILE_PHOTO : API_ENDPOINTS.USERS.PHOTO(String(userId))

  const syncCurrentUser = (userId: number | string | null | undefined, url: string | null) => {
    const isSelf = userId == null || Number(userId) === Number(authStore.user?.id)
    if (isSelf && authStore.user) authStore.user.profileImageUrl = url
  }

  /** Yüklemeden önce hızlı kontrol; hata mesajı ya da null döner. */
  const validatePhoto = (file: File): string | null => {
    if (!PROFILE_PHOTO_TYPES.includes(file.type)) return 'Yalnızca JPEG, PNG veya WEBP görseller yüklenebilir.'
    if (file.size > PROFILE_PHOTO_MAX_BYTES) return `Dosya en fazla ${PROFILE_PHOTO_MAX_BYTES / (1024 * 1024)} MB olabilir.`
    return null
  }

  const uploadPhoto = async (file: File, userId?: number | string | null): Promise<string | null> => {
    const form = new FormData()
    form.append('file', file)
    // Varsayılan JSON başlığı FormData'yı JSON'a çevirir; multipart verince tarayıcı boundary'yi ekler
    const res = await ($api as any).post(endpoint(userId), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const url: string | null = res?.data?.data?.profileImageUrl ?? null
    syncCurrentUser(userId, url)
    return url
  }

  const removePhoto = async (userId?: number | string | null): Promise<null> => {
    await ($api as any).delete(endpoint(userId))
    syncCurrentUser(userId, null)
    return null
  }

  return { validatePhoto, uploadPhoto, removePhoto }
}
