/**
 * Backend'in döndürdüğü dosya adresini tarayıcıda kullanılabilir hale getirir.
 * Storage:Provider=Local göreli yol döner ("/uploads/..."): dev'de Vite proxy'si üzerinden
 * aynı origin'den gelir, prod'da API origin'ine eklenir. S3 adresleri zaten tam adrestir.
 */
export const resolveFileUrl = (url?: string | null): string | null => {
  if (!url) return null
  if (!url.startsWith('/') || import.meta.dev) return url
  const apiBase = String(useRuntimeConfig().public.apiBase || '').replace(/\/$/, '')
  return `${apiBase}${url}`
}
