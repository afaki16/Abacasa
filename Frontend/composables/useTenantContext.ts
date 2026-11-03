import { computed } from 'vue'
import { useTenants } from './useTenants'

export interface TenantOption {
  id: number
  name: string
}

/**
 * SuperAdmin'in üst bardaki hane seçimi. Cookie'de tutulur; axios her isteğe
 * X-Tenant-Id olarak ekler, backend yalnızca SuperAdmin için dikkate alır.
 * Seçim yalnızca sistem listelerini (kullanıcılar, Ayarlar'daki oturum sorguları) süzer;
 * hane bütçe verisine erişim vermez (o veri her zaman token'daki aktif haneye göredir).
 * null = platform görünümü (tüm haneler).
 */
export const SUPERADMIN_TENANT_COOKIE = 'superadmin_tenant_id'

export const superAdminTenantCookieOptions = {
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30,
}

export const useTenantContext = () => {
  const cookie = useCookie<number | null>(SUPERADMIN_TENANT_COOKIE, superAdminTenantCookieOptions)

  const tenantsCache = useState<TenantOption[]>('superadmin_tenants_cache', () => [])

  // Yazan her yol refreshCookie çağırır: aynı cookie'nin başka useCookie
  // referansları (layout, middleware, axios) yazmayı ancak böyle görür.
  const write = (id: number | null) => {
    cookie.value = id
    refreshCookie(SUPERADMIN_TENANT_COOKIE)
  }

  const selectedTenantId = computed<number | null>({
    get: () => cookie.value,
    set: write,
  })

  const setSelected = (id: number | null) => write(id)
  const clearSelected = () => write(null)

  const loadTenants = async () => {
    const { getTenants } = useTenants()
    try {
      const res: any = await getTenants(1, 1000, '')
      const items = res?.data ?? []
      const list = Array.isArray(items) ? items : (items?.items ?? [])
      tenantsCache.value = list.map((t: any) => ({ id: t.id, name: t.name }))
    } catch {
      tenantsCache.value = []
    }
    return tenantsCache.value
  }

  const selectedTenantName = computed(() =>
    tenantsCache.value.find(t => t.id === selectedTenantId.value)?.name ?? null,
  )

  return {
    selectedTenantId,
    selectedTenantName,
    tenants: tenantsCache,
    setSelected,
    clearSelected,
    loadTenants,
  }
}
