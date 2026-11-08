// API barrel. Bu dosyayı import etmek refresh interceptor'ı kaydeder (yan etki) —
// uygulama kodu axios'a değil buraya bağlanmalı.

import './refreshInterceptor';

export { refreshOnce as refreshSession } from './refreshInterceptor';

export { apiClient, DEFAULT_TIMEOUT_MS } from './client';
export { AUTH_ENDPOINTS } from './endpoints';
export { ApiError, ErrorCode, isApiError, type ApiEnvelope } from './errors';
export { apiGet, apiPost, apiPut, apiSend } from './http';
export { DEFAULT_PAGE_SIZE, flattenPages, getNextPage, type PagedResult } from './paging';
export { queryClient, wireQueryClientToNative } from './queryClient';
