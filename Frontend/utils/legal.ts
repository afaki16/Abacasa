/**
 * Yasal metinlerdeki yer tutucular (tek yer). Yayından önce gerçek bilgilerle doldurulmalı.
 * Metinler: pages/legal/privacy.vue ve pages/legal/terms.vue; sürümler GET /api/legal/versions'tan gelir.
 */
export const legal = {
  controllerName: 'Alperen Fakı',
  address: 'Ulutek Teknopark',
  contactEmail: 'info@factech.app',
  emailProvider: 'Google',
  effectiveDate: '01.01.2027'
} as const

export const LEGAL_ROUTES = {
  privacy: '/legal/privacy',
  terms: '/legal/terms'
} as const
