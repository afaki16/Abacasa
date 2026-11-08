// Auth uçları. Anonim uçlar `_skipAuth` ile çağrılır: Authorization eklenmez ve
// 401 refresh akışına girmez (orada 401 "bilgiler hatalı" demektir).

import { apiGet, apiPost, apiSend, AUTH_ENDPOINTS } from '@/lib/api';

import { getDeviceName, getOrCreateDeviceId } from './deviceId';
import type { ConsentDocument, LoginResponse, RegisterRequest, Session, UpdateProfileRequest, User } from './types';

const anonymous = { _skipAuth: true } as const;

/**
 * Giriş öncesi e-posta ile çalışan uçların istek gövdesinde tenantId alanı var (Kickstart sözleşmesi).
 * Abacasa'da e-posta tekildir ve hane girişte seçilmez; 0 = "e-postaya bak".
 */
const ANY_TENANT = 0;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  async login({ email, password }: LoginInput): Promise<LoginResponse> {
    const deviceId = await getOrCreateDeviceId();
    return apiPost<LoginResponse>(
      AUTH_ENDPOINTS.LOGIN,
      {
        email: normalizeEmail(email),
        password,
        // Mobilde oturum uzun ömürlü (RefreshTokenExpiryInDaysRememberMe).
        rememberMe: true,
        deviceId,
        deviceName: getDeviceName(),
      },
      anonymous,
    );
  },

  /** Hesap e-posta doğrulanana kadar giriş yapamaz; doğrulama linki e-postayla gelir (web sayfası açar). */
  register(request: RegisterRequest): Promise<User> {
    return apiPost<User>(AUTH_ENDPOINTS.REGISTER, { ...request, email: normalizeEmail(request.email) }, anonymous);
  },

  resendVerification(email: string): Promise<string | undefined> {
    return apiSend(
      'post',
      AUTH_ENDPOINTS.RESEND_VERIFICATION,
      { email: normalizeEmail(email), tenantId: ANY_TENANT },
      anonymous,
    );
  },

  /** Hesap yoksa da başarı döner (hesap varlığı sızmaz). Kod 60 sn'de bir gönderilebilir. */
  sendPasswordResetCode(email: string): Promise<string | undefined> {
    return apiSend(
      'post',
      AUTH_ENDPOINTS.FORGOT_PASSWORD_CODE,
      { email: normalizeEmail(email), tenantId: ANY_TENANT },
      anonymous,
    );
  },

  resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<string | undefined> {
    return apiSend(
      'post',
      AUTH_ENDPOINTS.RESET_PASSWORD_CODE,
      { email: normalizeEmail(email), tenantId: ANY_TENANT, code, newPassword },
      anonymous,
    );
  },

  me(): Promise<User> {
    return apiGet<User>(AUTH_ENDPOINTS.ME);
  },

  updateProfile(request: UpdateProfileRequest): Promise<string | undefined> {
    return apiSend('put', AUTH_ENDPOINTS.PROFILE, request);
  },

  /** Aktif haneyi değiştirir. Yeni token çifti ve o hanedeki yetkilerle kullanıcı döner. */
  switchHousehold(tenantId: number, refreshToken: string): Promise<LoginResponse> {
    return apiPost<LoginResponse>(AUTH_ENDPOINTS.SWITCH_HOUSEHOLD, { tenantId, refreshToken });
  },

  /** Yasal metinleri güncel sürümleriyle onaylar; kalan bekleyen onayları döner. */
  async acceptConsents(documentTypes: ConsentDocument[]): Promise<ConsentDocument[]> {
    const result = await apiPost<{ pendingConsents: ConsentDocument[] }>(AUTH_ENDPOINTS.CONSENTS, { documentTypes });
    return result.pendingConsents ?? [];
  },

  /** Sunucu tarafında refresh token'ı iptal eder. */
  logout(refreshToken: string): Promise<string | undefined> {
    return apiSend('post', AUTH_ENDPOINTS.LOGOUT, { refreshToken, reason: 'User logout (mobile)' });
  },

  /** Bu cihaz dahil TÜM oturumları kapatır. */
  logoutAll(): Promise<string | undefined> {
    return apiSend('post', AUTH_ENDPOINTS.LOGOUT_ALL);
  },

  sessions(): Promise<Session[]> {
    return apiGet<Session[]>(AUTH_ENDPOINTS.SESSIONS);
  },

  revokeSession(sessionId: number): Promise<string | undefined> {
    return apiSend('post', AUTH_ENDPOINTS.REVOKE_SESSION(sessionId));
  },

  /** Başarıda backend TÜM oturumları kapatır (bu cihaz dahil). */
  changePassword(currentPassword: string, newPassword: string): Promise<string | undefined> {
    return apiSend('post', AUTH_ENDPOINTS.CHANGE_PASSWORD, { currentPassword, newPassword });
  },

  /** Mevcut şifreyi hatırlamayan girişli kullanıcıya e-postayla 6 haneli kod. */
  sendPasswordChangeCode(): Promise<string | undefined> {
    return apiSend('post', AUTH_ENDPOINTS.PASSWORD_CHANGE_CODE);
  },

  /** Başarıda backend TÜM oturumları kapatır (bu cihaz dahil). */
  changePasswordWithCode(code: string, newPassword: string): Promise<string | undefined> {
    return apiSend('post', AUTH_ENDPOINTS.PASSWORD_CHANGE_CONFIRM, { code, newPassword });
  },
};
