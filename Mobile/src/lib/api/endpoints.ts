// Backend uç sabitleri. Yeni modül uçları kendi features/<modül>/api.ts dosyasında da
// tanımlanabilir; auth uçları interceptor tarafından da kullanıldığı için burada.

export const AUTH_ENDPOINTS = {
  LOGIN: '/api/Auth/login',
  REGISTER: '/api/Auth/register',
  RESEND_VERIFICATION: '/api/Auth/resend-verification',
  REFRESH_TOKEN: '/api/Auth/refresh-token',
  LOGOUT: '/api/Auth/logout',
  LOGOUT_ALL: '/api/Auth/logout-all',
  ME: '/api/Auth/me',
  PROFILE: '/api/Auth/profile',
  SESSIONS: '/api/Auth/sessions',
  REVOKE_SESSION: (sessionId: number) => `/api/Auth/sessions/${sessionId}/revoke`,
  CHANGE_PASSWORD: '/api/Auth/change-password',
  PASSWORD_CHANGE_CODE: '/api/Auth/password-change/code',
  PASSWORD_CHANGE_CONFIRM: '/api/Auth/password-change/confirm',
  FORGOT_PASSWORD_CODE: '/api/Auth/forgot-password/code',
  RESET_PASSWORD_CODE: '/api/Auth/reset-password/code',
  /** Aktif haneyi değiştirir; yeni token çifti döner (eski refresh token iptal). */
  SWITCH_HOUSEHOLD: '/api/Auth/switch-household',
  /** Güncel sürümleriyle yasal metin onayı; kalan bekleyen onaylar döner. */
  CONSENTS: '/api/Auth/consents',
} as const;
