/**
 * Yasal metinlerdeki yer tutucular (tek yer). Yayından önce gerçek bilgilerle doldurulmalı.
 * Metinler: pages/legal/privacy.vue ve pages/legal/terms.vue; sürümler GET /api/legal/versions'tan gelir.
 */
export const legal = {
  controllerName: '[Veri sorumlusunun adı / unvanı]',
  address: '[Adres]',
  contactEmail: '[İletişim e-postası]',
  emailProvider: '[E-posta hizmet sağlayıcısı]',
  effectiveDate: '[Yürürlük tarihi]'
} as const

export const LEGAL_ROUTES = {
  privacy: '/legal/privacy',
  terms: '/legal/terms'
} as const
