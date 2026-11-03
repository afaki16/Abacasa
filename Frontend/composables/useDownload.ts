// Dosya indirme (Excel dışa aktarım): blob olarak alınır, dosya adı Content-Disposition başlığından okunur.
// Hatalar çağırana bırakılır.
export const useDownload = () => {
  const fileNameFrom = (disposition: string | undefined, fallback: string) => {
    if (!disposition) return fallback
    const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)
    if (encoded) return decodeURIComponent(encoded[1].trim())
    const plain = disposition.match(/filename="?([^";]+)"?/i)
    return plain ? plain[1].trim() : fallback
  }

  const download = async (url: string, fallbackName: string) => {
    const { $api } = useNuxtApp()
    const response = await $api.get(url, { responseType: 'blob' })
    const name = fileNameFrom(response.headers['content-disposition'], fallbackName)

    const objectUrl = window.URL.createObjectURL(response.data as Blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = name
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(objectUrl)
  }

  return { download }
}
