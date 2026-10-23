/**
 * ?redirect= değeri yalnızca uygulama içi bir yolsa kabul edilir.
 * "/x" biçiminde olmalı; "//host", "/\host", şema ("https:") ya da kontrol karakteri içeren değerler reddedilir
 * (dış adrese yönlendirme yapılmaz). Geçersizse null.
 */
export function safeRedirect(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null
  if (/[\u0000-\u001f\\]/.test(value) || value.includes('://')) return null
  return value
}
