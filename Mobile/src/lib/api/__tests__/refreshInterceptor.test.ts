// Refresh interceptor'ın sözleşmesi — bu iskeletin en kritik ve hataya en açık parçası.
// Ağ katmanı taklit edilir: apiClient için özel adapter, ham refresh çağrısı için axios.post.

import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import type { User } from '@/features/auth/types';
import { apiClient, apiGet, ApiError, ErrorCode } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const user: User = {
  id: 1,
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  email: 'test@example.com',
  status: 'Active',
  emailConfirmed: true,
  tenantId: 1,
  mustChangePassword: false,
  roles: [],
  permissions: [],
};

type Handler = (config: InternalAxiosRequestConfig) => { status: number; data: unknown };
let handler: Handler;
let seenAuthHeaders: (string | undefined)[] = [];
let seenClientHeaders: (string | undefined)[] = [];

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown): AxiosResponse {
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse;
  if (status >= 400) throw new AxiosError(`HTTP ${status}`, undefined, config, null, response);
  return response;
}

const refreshResponse = (accessToken: string, refreshToken: string) => ({
  data: { success: true, data: { accessToken, refreshToken, expiresAt: '', user } },
});

beforeAll(() => {
  apiClient.defaults.adapter = async (config) => {
    seenAuthHeaders.push(config.headers.Authorization as string | undefined);
    seenClientHeaders.push(config.headers['X-Client'] as string | undefined);
    const { status, data } = handler(config);
    return respond(config, status, data);
  };
});

beforeEach(async () => {
  seenAuthHeaders = [];
  seenClientHeaders = [];
  jest.restoreAllMocks();
  await useAuthStore.getState().setSession({ accessToken: 'expired', refreshToken: 'r1', expiresAt: '', user });
});

/** Süresi dolmuş token'a 401, yeni token'a 200 dönen sunucu. */
const tokenAwareServer: Handler = (config) =>
  config.headers.Authorization === 'Bearer fresh'
    ? { status: 200, data: { success: true, data: { url: config.url } } }
    : { status: 401, data: {} };

describe('refreshInterceptor', () => {
  it('eşzamanlı 401\'ler TEK refresh isteğini paylaşır ve hepsi yeni token\'la tekrarlanır', async () => {
    handler = tokenAwareServer;
    const post = jest.spyOn(axios, 'post').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(refreshResponse('fresh', 'r2')), 20)),
    );

    const results = await Promise.all([apiGet('/a'), apiGet('/b'), apiGet('/c')]);

    expect(post).toHaveBeenCalledTimes(1);
    // Backend iki token'ı da ister; mobil cookie'yi devre dışı bırakan başlığı gönderir.
    const [url, body, options] = post.mock.calls[0];
    expect(url).toContain('/api/Auth/refresh-token');
    expect(body).toEqual({ accessToken: 'expired', refreshToken: 'r1' });
    expect((options?.headers as Record<string, string>)['X-Client']).toBe('mobile');
    expect(results).toEqual([{ url: '/a' }, { url: '/b' }, { url: '/c' }]);
    // Rotation: iki token da güncellendi.
    expect(useAuthStore.getState().accessToken).toBe('fresh');
    expect(useAuthStore.getState().refreshToken).toBe('r2');
  });

  it('her istek X-Client: mobile başlığını taşır', async () => {
    handler = () => ({ status: 200, data: { success: true, data: 1 } });
    await apiGet('/x');
    expect(seenClientHeaders).toEqual(['mobile']);
    expect(seenAuthHeaders).toEqual(['Bearer expired']);
  });

  it('sunucu refresh\'i reddederse oturum kapanır ve sessionExpired benzeri 401 döner', async () => {
    handler = tokenAwareServer;
    jest.spyOn(axios, 'post').mockRejectedValue(
      new AxiosError('HTTP 401', undefined, undefined, null, { status: 401, data: {} } as AxiosResponse),
    );

    await expect(apiGet('/a')).rejects.toMatchObject({ status: 401, code: ErrorCode.Unauthorized });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('refresh sırasında ağ hatası oturumu SİLMEZ (çevrimdışı açılış)', async () => {
    handler = tokenAwareServer;
    jest.spyOn(axios, 'post').mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'));

    const error = await apiGet('/a').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isNetworkError).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().refreshToken).toBe('r1');
  });

  it('_skipAuth uçlarında 401 refresh tetiklemez; backend mesajı döner', async () => {
    handler = () => ({
      status: 401,
      data: { success: false, error: { status: 401, code: 1012, errors: { error: ['Email veya şifre hatalı'] } } },
    });
    const post = jest.spyOn(axios, 'post');

    await expect(apiGet('/api/Auth/login', undefined, { _skipAuth: true })).rejects.toMatchObject({
      status: 401,
      message: 'Email veya şifre hatalı',
    });
    expect(post).not.toHaveBeenCalled();
    expect(seenAuthHeaders).toEqual([undefined]);
  });

  it('403 + PasswordChangeRequired zorunlu şifre bayrağını açar', async () => {
    handler = () => ({ status: 403, data: { success: false, error: { status: 403, code: ErrorCode.PasswordChangeRequired } } });

    await expect(apiGet('/a')).rejects.toMatchObject({ status: 403, code: ErrorCode.PasswordChangeRequired });
    expect(useAuthStore.getState().user?.mustChangePassword).toBe(true);
  });

  it('2xx ama success=false olan Result zarfı da ApiError olur', async () => {
    handler = () => ({ status: 200, data: { success: false, error: { code: 1010, errors: { error: ['İşlem yapılamaz'] } } } });
    await expect(apiGet('/a')).rejects.toMatchObject({ message: 'İşlem yapılamaz', code: 1010 });
  });
});
