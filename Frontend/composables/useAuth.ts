import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  LoginResponse,
  User,
  Session,
  AccountDeletionPreview,
} from "~/types";
import { API_ENDPOINTS } from "~/utils/apiEndpoints";
import { safeRedirect } from "~/utils/safeRedirect";
import { FORCE_CHANGE_PASSWORD_PATH, clearSessionExpired } from "~/utils/authRoutes";
import { useAuthStore } from "~/stores/auth";
import { useApi } from "./useApi";
import { useToast } from "./useToast";

/**
 * Login response normalizer.
 * Backend tek formatta dönmeli; bu fonksiyon defensive katmandır.
 * Geçici — backend response shape'i tek formata sabitlendiğinde basitleştirilecek.
 */
function extractLoginData(response: any): LoginResponse | null {
  if (!response) return null;

  // Backend BaseController formatı: { success: true, data: {...} }
  if (response.success && response.data?.accessToken) return response.data;

  // Result<T> formatı: { isSuccess: true, value: {...} }
  if (response.isSuccess && response.value?.accessToken) return response.value;

  // Düz format (eski clientlar)
  if (response.accessToken) return response;

  return null;
}

export const useAuth = () => {
  const api = useApi();
  const authStore = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const { $i18n } = useNuxtApp();

  /**
   * Device ID — cihazı tanımak için (refresh token rotation kontrolünde
   * backend tarafından kullanılır). Hassas değil; XSS endişesi yok.
   * Cookie'de tutulur (clearAuth'da temizlenir).
   */
  const generateDeviceId = (): string => {
    if (!import.meta.client) {
      return `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }

    const deviceIdCookie = useCookie("device_id", {
      maxAge: 60 * 60 * 24 * 30, // 30 gün
      secure: true,
      sameSite: "strict",
    });

    if (!deviceIdCookie.value) {
      deviceIdCookie.value = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }
    return deviceIdCookie.value;
  };

  const getDeviceName = (): string => {
    if (!import.meta.client) return "Unknown Device";

    const ua = navigator.userAgent;
    if (ua.includes("Windows")) return "Windows Device";
    if (ua.includes("Mac")) return "Mac Device";
    if (ua.includes("Linux")) return "Linux Device";
    if (ua.includes("Android")) return "Android Device";
    if (ua.includes("iOS") || /iPhone|iPad|iPod/.test(ua)) return "iOS Device";
    return "Unknown Device";
  };

  // redirectTo: yalnızca uygulama içi yol (safeRedirect ile süzülmüş); yoksa /dashboard
  const login = async (credentials: LoginRequest, redirectTo?: string | null) => {
    try {
      authStore.setLoading(true);

      const requestData = {
        ...credentials,
        deviceId: credentials.deviceId || generateDeviceId(),
        deviceName: credentials.deviceName || getDeviceName(),
      };

      const response = await api.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        requestData,
        { silent: true },
      );

      const loginData = extractLoginData(response);

      if (!loginData?.accessToken) {
        throw new Error("Invalid login response format");
      }

      const deviceId = credentials.deviceId || generateDeviceId();
      await authStore.setAuth(loginData, deviceId);

      // Zorunlu şifre değişimi bekleyen kullanıcı yalnızca kilit sayfasına gider (redirect yok sayılır)
      await router.push(
        loginData.user?.mustChangePassword
          ? FORCE_CHANGE_PASSWORD_PATH
          : (safeRedirect(redirectTo) ?? "/dashboard"),
      );
      return loginData;
    } catch (error) {
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      authStore.setLoading(true);
      const response = await api.post<User>(
        API_ENDPOINTS.AUTH.REGISTER,
        userData,
      );

      if (response.success) {
        await router.push(
          `/auth/check-email?email=${encodeURIComponent(userData.email)}`,
        );
        return response.data;
      }
    } catch (error) {
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  };

  /** Kayıt formu için: e-posta/telefon daha önce kayıtlı mı? (toast göstermez) */
  const checkRegisterAvailability = async (fields: { email?: string; phoneNumber?: string }) => {
    return await api.post<{
      email?: { isAvailable: boolean; reason?: string };
      phoneNumber?: { isAvailable: boolean; reason?: string };
    }>(API_ENDPOINTS.AUTH.CHECK_AVAILABILITY, fields, { silent: true });
  };

  const verifyEmail = async (email: string, token: string) => {
    return await api.post(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      { email, token },
      { silent: true },
    );
  };

  const resendVerification = async (email: string, tenantId: number = 0) => {
    return await api.post(
      API_ENDPOINTS.AUTH.RESEND_VERIFICATION,
      { email, tenantId },
      { silent: true },
    );
  };

  // tenantId gönderilmez: backend alanı int, gönderilmezse 0 kabul ediliyor.
  const forgotPassword = async (email: string) => {
    const payload: ForgotPasswordRequest = { email };
    return await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, payload, {
      silent: true,
    });
  };

  const resetPassword = async (
    email: string,
    token: string,
    newPassword: string,
  ) => {
    const payload: ResetPasswordRequest = { email, token, newPassword };
    return await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload, {
      silent: true,
    });
  };

  const logout = async () => {
    try {
      // Refresh token HttpOnly cookie'de — backend okuyup revoke eder
      await api.post(API_ENDPOINTS.AUTH.LOGOUT, {});
    } catch {
      // Logout her zaman client tarafında temizlik yapılmalı
    } finally {
      // Kullanıcı kasten çıktı; logout isteği 401 alıp işaret koyduysa bile "süre doldu" gösterilmesin
      clearSessionExpired();
      authStore.clearAuth();
      await router.push("/");
    }
  };

  /**
   * Manuel refresh — çoğu zaman gerek yok (axios interceptor otomatik yapıyor).
   * Sadece özel durumlar için (örn: kullanıcı "session'ı yenile" butonuna basarsa).
   */
  const refreshToken = async () => {
    const success = await authStore.silentRefresh();
    if (!success) {
      throw new Error("Token refresh failed");
    }
  };

  const getCurrentUser = async () => {
    try {
      const response = await api.get<User>(API_ENDPOINTS.AUTH.ME);
      if (response.success && response.data) {
        authStore.setUser(response.data);
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  };

  // Büyük/küçük harfe duyarsız; kural store'da
  const hasPermission = (permission: string): boolean => {
    return authStore.hasPermission(permission);
  };

  const hasRole = (role: string): boolean => {
    return authStore.roles.includes(role);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every((p) => hasPermission(p));
  };

  const hasSystemRole = (): boolean => {
    return authStore.user?.roles?.some((r) => r.isSystemRole) ?? false;
  };

  const getUserSessions = async (): Promise<Session[]> => {
    try {
      const response = await api.get<Session[]>(API_ENDPOINTS.AUTH.SESSIONS);
      const list =
        (response as any)?.data ?? (response as any)?.value ?? response ?? [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  };

  const logoutDevice = async (deviceId: string): Promise<void> => {
    await api.post(API_ENDPOINTS.AUTH.LOGOUT_DEVICE(deviceId), {});
  };

  const revokeSessionById = async (sessionId: number): Promise<void> => {
    await api.post(API_ENDPOINTS.AUTH.REVOKE_SESSION_BY_ID(sessionId), {});
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<void> => {
    await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
    toast.success($i18n.t("auth.passwordChangedRelogin"));
    // Backend revoked every session, including this one
    authStore.clearAuth();
    await router.push("/");
  };

  /**
   * Zorunlu şifre değişimi (MustChangePassword). Normal changePassword'dan farkı:
   * kullanıcı oturumdan atılmaz. Backend tüm oturumları kapatır (diğer cihazlar dahil),
   * ardından yeni şifreyle bu cihaz için otomatik olarak yeniden giriş yapılır.
   * Kanıt mevcut şifre ya da (geçici şifresini unutan kullanıcı için) e-postaya gelen 6 haneli koddur.
   */
  const completeForcedPasswordChange = async (
    proof: { currentPassword: string } | { code: string },
    newPassword: string,
  ): Promise<void> => {
    const user = authStore.user;
    if (!user) throw new Error("Not authenticated");

    if ("code" in proof) {
      await api.post(
        API_ENDPOINTS.AUTH.PASSWORD_CHANGE_CONFIRM,
        { code: proof.code, newPassword },
        { silent: true },
      );
    } else {
      await api.post(
        API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        { currentPassword: proof.currentPassword, newPassword },
        { silent: true },
      );
    }

    // Backend oturum iptalini (LastSessionsRevokedAt) milisaniye hassasiyetiyle,
    // JWT "iat" değerini ise saniye hassasiyetiyle tutar. Aynı saniye içinde alınan yeni
    // token iptal edilmiş sayılır; bu yüzden bir sonraki saniyeye geçilmesi beklenir.
    await new Promise((resolve) => setTimeout(resolve, 1100));

    authStore.clearAuth();
    try {
      // Kimlik global; login hane seçmez (son aktif hane backend'de seçilir)
      await login({ email: user.email, password: newPassword });
      toast.success($i18n.t("auth.passwordChanged"));
    } catch {
      toast.success($i18n.t("auth.passwordChangedLogin"));
      await router.push("/");
    }
  };

  // Hesap silme önizlemesi: son yönetici olunan haneler, birlikte silinecek haneler, son SuperAdmin
  const getAccountDeletionPreview = async (): Promise<AccountDeletionPreview> => {
    const response = await api.get<AccountDeletionPreview>(API_ENDPOINTS.AUTH.ACCOUNT_DELETION_PREVIEW);
    return response.data as AccountDeletionPreview;
  };

  // Hesap silinir (anonimleşir); oturum yerelde de temizlenir ve giriş sayfasında mesaj gösterilir.
  // Hatalar çağırana bırakılır (bölümde gösterilir)
  const deleteAccount = async (password: string, deleteSoleHouseholds: boolean): Promise<void> => {
    const { $api } = useNuxtApp();
    await $api.delete(API_ENDPOINTS.AUTH.ACCOUNT, { data: { password, deleteSoleHouseholds } });
    authStore.clearAuth();
    await router.push({ path: "/", query: { accountDeleted: "1" } });
  };

  const logoutAllDevices = async (): Promise<void> => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT_ALL, {});
    } finally {
      clearSessionExpired();
      authStore.clearAuth();
      await router.push("/");
    }
  };

  /** Mevcut şifresini hatırlamayan (giriş yapmış) kullanıcıya 6 haneli kod gönderir. */
  const sendPasswordChangeCode = async () => {
    await api.post(API_ENDPOINTS.AUTH.PASSWORD_CHANGE_CODE, {}, { silent: true });
  };

  /** Kodla şifre değiştirir. Backend tüm oturumları kapattığı için changePassword gibi login'e döner. */
  const changePasswordWithCode = async (code: string, newPassword: string): Promise<void> => {
    await api.post(API_ENDPOINTS.AUTH.PASSWORD_CHANGE_CONFIRM, { code, newPassword });
    toast.success($i18n.t("auth.passwordChangedRelogin"));
    authStore.clearAuth();
    await router.push("/");
  };

  /** Kendi ad/soyad/telefonunu günceller; ardından store'daki kullanıcı tazelenir. */
  const updateProfile = async (data: { firstName: string; lastName: string; phoneNumber?: string }) => {
    await api.put(API_ENDPOINTS.AUTH.PROFILE, data, { silent: true });
    await authStore.fetchUserFromApi(false);
  };

  /** Yeni adrese onay linki gönderir; e-posta link tıklanana kadar değişmez. */
  const requestEmailChange = async (newEmail: string, currentPassword: string) => {
    await api.put(API_ENDPOINTS.AUTH.PROFILE_EMAIL, { newEmail, currentPassword }, { silent: true });
  };

  /** Onay linkindeki token'la e-postayı değiştirir. Backend tüm oturumları kapatır. */
  const confirmEmailChange = async (email: string, token: string) => {
    await api.post(API_ENDPOINTS.AUTH.CONFIRM_EMAIL_CHANGE, { email, token }, { silent: true });
  };

  return {
    login,
    checkRegisterAvailability,
    sendPasswordChangeCode,
    changePasswordWithCode,
    updateProfile,
    requestEmailChange,
    confirmEmailChange,
    register,
    logout,
    refreshToken,
    getCurrentUser,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    hasSystemRole,
    getUserSessions,
    logoutDevice,
    logoutAllDevices,
    revokeSessionById,
    changePassword,
    completeForcedPasswordChange,
    getAccountDeletionPreview,
    deleteAccount,
  };
};
