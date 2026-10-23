// API Endpoints configuration for Swagger API
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    ME: '/api/auth/me',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email',
    RESEND_VERIFICATION: '/api/auth/resend-verification',
    SESSIONS: '/api/auth/sessions',
    LOGOUT_ALL: '/api/auth/logout-all',
    LOGOUT_DEVICE: (deviceId: string) => `/api/auth/logout-device/${deviceId}`,
    REVOKE_SESSION_BY_ID: (sessionId: number) => `/api/auth/sessions/${sessionId}/revoke`,
    CHANGE_PASSWORD: '/api/auth/change-password'
  },

  // User management endpoints
  USERS: {
    LIST: '/api/users',
    CREATE: '/api/users',
    GET_BY_ID: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
    CHANGE_PASSWORD: (id: string) => `/api/users/${id}/change-password`,
    UPDATE_PROFILE: '/api/users/profile',
    UPLOAD_AVATAR: '/api/users/avatar'
  },

  // Tenant management endpoints
  TENANTS: {
    LIST: '/api/tenants',
    CREATE: '/api/tenants',
    GET_BY_ID: (id: string) => `/api/tenants/${id}`,
    UPDATE: (id: string) => `/api/tenants/${id}`,
    DELETE: (id: string) => `/api/tenants/${id}`,
  },

  // Category management endpoints
  CATEGORIES: {
    LIST: '/api/categories',
    CREATE: '/api/categories',
    GET_BY_ID: (id: string) => `/api/categories/${id}`,
    UPDATE: (id: string) => `/api/categories/${id}`,
    DELETE: (id: string) => `/api/categories/${id}`,
  },

  // Person management endpoints
  PEOPLE: {
    LIST: '/api/people',
    CREATE: '/api/people',
    GET_BY_ID: (id: string) => `/api/people/${id}`,
    UPDATE: (id: string) => `/api/people/${id}`,
    DELETE: (id: string) => `/api/people/${id}`,
  },

  // Payment method management endpoints (controller adı küçük harf: /api/paymentmethods)
  PAYMENT_METHODS: {
    LIST: '/api/paymentmethods',
    CREATE: '/api/paymentmethods',
    GET_BY_ID: (id: string) => `/api/paymentmethods/${id}`,
    UPDATE: (id: string) => `/api/paymentmethods/${id}`,
    DELETE: (id: string) => `/api/paymentmethods/${id}`,
  },

  // Expense management endpoints
  EXPENSES: {
    LIST: '/api/expenses',
    SUMMARY: '/api/expenses/summary',
    CREATE: '/api/expenses',
    GET_BY_ID: (id: string) => `/api/expenses/${id}`,
    UPDATE: (id: string) => `/api/expenses/${id}`,
    DELETE: (id: string) => `/api/expenses/${id}`,
  },

  // Donation management endpoints
  DONATIONS: {
    LIST: '/api/donations',
    SUMMARY: '/api/donations/summary',
    CREATE: '/api/donations',
    GET_BY_ID: (id: string) => `/api/donations/${id}`,
    UPDATE: (id: string) => `/api/donations/${id}`,
    DELETE: (id: string) => `/api/donations/${id}`,
  },

  // Recurring payment endpoints (controller adı küçük harf: /api/recurringpayments)
  RECURRING_PAYMENTS: {
    LIST: '/api/recurringpayments',
    OCCURRENCES: '/api/recurringpayments/occurrences',
    CREATE: '/api/recurringpayments',
    GET_BY_ID: (id: string) => `/api/recurringpayments/${id}`,
    UPDATE: (id: string) => `/api/recurringpayments/${id}`,
    DELETE: (id: string) => `/api/recurringpayments/${id}`,
    PAY: (id: string) => `/api/recurringpayments/${id}/pay`,
  },

  // Debt endpoints
  DEBTS: {
    LIST: '/api/debts',
    SUMMARY: '/api/debts/summary',
    CREATE: '/api/debts',
    GET_BY_ID: (id: string) => `/api/debts/${id}`,
    UPDATE: (id: string) => `/api/debts/${id}`,
    DELETE: (id: string) => `/api/debts/${id}`,
    PAYMENTS: (id: string) => `/api/debts/${id}/payments`,
    PAYMENT: (id: string, paymentId: string) => `/api/debts/${id}/payments/${paymentId}`,
  },

  // Donation target endpoints
  DONATION_TARGETS: {
    LIST: '/api/donationtargets',
    REPORT: (year: number) => `/api/donationtargets/year/${year}`,
    CREATE: '/api/donationtargets',
    UPDATE: (id: string) => `/api/donationtargets/${id}`,
    DELETE: (id: string) => `/api/donationtargets/${id}`,
  },

  // Donation fund (emanet) endpoints
  DONATION_FUNDS: {
    LIST: '/api/donationfunds',
    CREATE: '/api/donationfunds',
    GET_BY_ID: (id: string) => `/api/donationfunds/${id}`,
    UPDATE: (id: string) => `/api/donationfunds/${id}`,
    DELETE: (id: string) => `/api/donationfunds/${id}`,
    MOVEMENTS: (id: string) => `/api/donationfunds/${id}/movements`,
    MOVEMENT: (id: string, movementId: string) => `/api/donationfunds/${id}/movements/${movementId}`,
  },

  // Vehicle endpoints
  VEHICLES: {
    LIST: '/api/vehicles',
    UPCOMING: '/api/vehicles/upcoming',
    CREATE: '/api/vehicles',
    UPDATE: (id: string) => `/api/vehicles/${id}`,
    DELETE: (id: string) => `/api/vehicles/${id}`,
    OBLIGATIONS: (id: string) => `/api/vehicles/${id}/obligations`,
    OBLIGATION: (id: string, obligationId: string) => `/api/vehicles/${id}/obligations/${obligationId}`,
  },

  // Ledger (yıllık tablo) endpoints
  LEDGER: {
    ITEMS: '/api/ledger/items',
    ITEM: (id: string) => `/api/ledger/items/${id}`,
    AMOUNT: (id: string, year: number, month: number) => `/api/ledger/items/${id}/amounts/${year}/${month}`,
    YEAR: (year: number) => `/api/ledger/year/${year}`,
  },

  // Exchange rate endpoints
  EXCHANGE_RATES: {
    LIST: '/api/exchangerates',
    SAVE: '/api/exchangerates',
    DELETE: (id: string) => `/api/exchangerates/${id}`,
  },

  // Role management endpoints
  ROLES: {
    LIST: '/api/roles',
    CREATE: '/api/roles',
    GET_BY_ID: (id: string) => `/api/roles/${id}`,
    UPDATE: (id: string) => `/api/roles/${id}`,
    DELETE: (id: string) => `/api/roles/${id}`,
    ASSIGN_PERMISSIONS: (id: string) => `/api/roles/${id}/permissions`
  },

  // Permission management endpoints
  PERMISSIONS: {
    LIST: '/api/permissions',
    GET_BY_ID: (id: string) => `/api/permissions/${id}`,
    CREATE: '/api/permissions',
    UPDATE: (id: string) => `/api/permissions/${id}`,
    DELETE: (id: string) => `/api/permissions/${id}`
  },

  // Admin endpoints (Admin/SuperAdmin only)
  ADMIN: {
    ACTIVE_USERS_COUNT: '/api/admin/active-users-count',
    ACTIVE_USERS: '/api/admin/active-users',
    REVOKABLE_USERS: '/api/admin/revokable-users',
    REVOKE_USER_SESSIONS: (userId: number) => `/api/admin/users/${userId}/revoke-sessions`
  },

  // Dashboard endpoints
  DASHBOARD: {
    // Özet
    GET: '/api/dashboard',
    STATS: '/api/dashboard/stats',
    RECENT_ACTIVITIES: '/api/dashboard/recent-activities',
    USER_GROWTH: '/api/dashboard/user-growth'
  },

  // File upload endpoints
  FILES: {
    UPLOAD: '/api/files/upload',
    DELETE: (id: string) => `/api/files/${id}`
  }
}

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  const config = useRuntimeConfig()
  return `${config.public.apiBase}${endpoint}`
}

// Helper function to get paginated endpoint
export const getPaginatedEndpoint = (baseEndpoint: string, page: number = 1, pageSize: number = 10, search?: string): string => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString()
  })
  
  if (search) {
    params.append('searchTerm', search)
  }
  
  return `${baseEndpoint}?${params.toString()}`
} 