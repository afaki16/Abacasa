<template>
  <div class="superadmin-settings">

    <!-- Başlık -->
    <div class="section-header mb-6">
      <div class="flex items-center gap-3">
        <UiAvatar color="deep-purple" variant="tonal" :size="44" rounded="lg">
          <UiIcon icon="mdi-shield-crown-outline" />
        </UiAvatar>
        <div>
          <h2 class="section-title">Sistem Ayarları</h2>
          <p class="section-desc">Tüm tenant'ları kapsayan global oturum ve kullanıcı yönetimi</p>
        </div>
      </div>
    </div>

    <!-- Stat Kartlar + Tenant Filtresi -->
    <div class="ui-row ui-row--dense mb-5">
      <div class="ui-col ui-col-12 ui-col-sm-6 ui-col-md-4">
        <UiCard class="stat-card" rounded="xl" elevation="0" border>
          <div class="ui-card-text flex items-center gap-4 !p-5">
            <UiAvatar color="deep-purple" variant="tonal" :size="52" rounded="lg">
              <UiIcon icon="mdi-account-group" :size="26" />
            </UiAvatar>
            <div>
              <div class="stat-value">
                <UiProgressCircular v-if="loadingCount" indeterminate :size="20" :width="2" />
                <template v-else>{{ activeUserCount }}</template>
              </div>
              <div class="stat-label">
                {{ selectedTenantId ? 'Tenant Aktif Kullanıcı' : 'Toplam Aktif Kullanıcı' }}
              </div>
            </div>
          </div>
        </UiCard>
      </div>

      <div class="ui-col ui-col-12 ui-col-sm-6 ui-col-md-4" v-if="tenants.length">
        <UiCard rounded="xl" elevation="0" border height="100%">
          <div class="ui-card-text flex items-center !p-4" style="height:100%">
            <UiSelect
              v-model="selectedTenantId"
              :items="tenantOptions"
              item-title="label"
              item-value="value"
              label="Tenant Filtresi"
              clearable
              hide-details
              density="comfortable"
              prepend-inner-icon="mdi-domain"
              @update:model-value="onTenantChange"
            />
          </div>
        </UiCard>
      </div>
    </div>

    <!-- Çevrimiçi Kullanıcılar -->
    <UiCard rounded="xl" elevation="0" border class="mb-5">
      <div class="ui-card-title !p-5">
        <div class="flex items-center flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <UiIcon icon="mdi-account-multiple-check-outline" color="deep-purple" />
          <span class="table-title">Şu An Çevrimiçi</span>
          <UiChip v-if="selectedTenantId" size="x-small" color="deep-purple" variant="tonal">
            {{ selectedTenantLabel }}
          </UiChip>
        </div>
        <div class="flex-1" />
        <UiBtn
          size="small"
          variant="text"
          prepend-icon="mdi-refresh"
          :loading="loadingActiveUsers"
          @click="loadActiveUsers"
        >
          Yenile
        </UiBtn>
        </div>
      </div>
      <hr class="ui-divider" />
      <div class="ui-card-text !p-0">
        <p class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal text-black/60 dark:text-white/70 px-5 pt-4 pb-2">
          En az bir geçerli oturumu olan kullanıcılar.
          {{ selectedTenantId ? 'Seçili tenant filtrelenmiş.' : 'Tüm tenant\'lar gösteriliyor.' }}
        </p>
        <UiProgressLinear v-if="loadingActiveUsers" indeterminate color="deep-purple" />
        <div v-if="!loadingActiveUsers && activeUsers.length" class="ui-table-wrap online-table"><table class="ui-table ui-table--comfortable">
          <thead>
            <tr>
              <th>Kullanıcı</th>
              <th>Tenant</th>
              <th>Oturum</th>
              <th>Son Aktivite</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in activeUsers" :key="row.userId + '-' + (row.tenantId ?? 'x')">
              <td>
                <div class="flex items-center gap-3 py-1">
                  <UiAvatar color="deep-purple" variant="tonal" :size="32" class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-bold">
                    {{ initials(row.fullName) }}
                  </UiAvatar>
                  <div>
                    <div class="font-medium">{{ row.fullName }}</div>
                    <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal text-black/60 dark:text-white/70">{{ row.email }}</div>
                  </div>
                </div>
              </td>
              <td>
                <UiChip size="small" variant="tonal" color="grey">
                  <UiIcon icon="mdi-domain" start :size="12" />
                  {{ row.tenantName || '—' }}
                </UiChip>
              </td>
              <td>
                <UiChip size="small" color="success" variant="tonal">
                  <UiIcon icon="mdi-circle" start :size="12" />
                  {{ row.activeSessionCount }} oturum
                </UiChip>
              </td>
              <td class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal text-black/60 dark:text-white/70">{{ formatActivity(row.lastActivityAt) }}</td>
            </tr>
          </tbody>
        </table></div>
        <div v-if="!loadingActiveUsers && activeUsers.length === 0" class="empty-table p-8 text-center">
          <UiIcon icon="mdi-account-off-outline" :size="40" color="grey-lighten-1" />
          <p class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal text-black/60 dark:text-white/70 mt-2">Şu anda çevrimiçi kullanıcı yok.</p>
        </div>
      </div>
    </UiCard>

    <!-- Uzaktan Kullanıcı Çıkışı -->
    <UiCard rounded="xl" elevation="0" border>
      <div class="ui-card-title !p-5">
        <div class="flex items-center gap-2">
        <UiIcon icon="mdi-account-off-outline" color="error" />
        <span class="table-title">Uzaktan Kullanıcı Çıkışı</span>
        </div>
      </div>
      <hr class="ui-divider" />
      <div class="ui-card-text !p-5">
        <p class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal text-black/60 dark:text-white/70 mb-4">
          Herhangi bir kullanıcıyı tüm cihazlarından çıkış yaptırabilirsiniz.
        </p>
        <div class="flex items-start gap-3 flex-wrap">
          <UiSelect autocomplete
            v-model="selectedUser"
            :items="users"
            item-title="fullName"
            item-value="id"
            :filter-keys="['fullName', 'email']"
            label="Kullanıcı seçin"
            placeholder="İsim veya e-posta ile ara..."
            :loading="loadingUsers"
            clearable
            hide-details
            density="comfortable"
            style="min-width: 280px; flex: 1"
          >
            <template #item="{ item }">
              <div class="flex items-center gap-4 min-w-0">
                <UiAvatar color="deep-purple" variant="tonal" :size="32" class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-bold shrink-0">
                  {{ initials(item.fullName) }}
                </UiAvatar>
                <div class="min-w-0">
                  <div class="ui-list-title">{{ item.fullName }}</div>
                  <div class="ui-list-subtitle">{{ item.email }}</div>
                </div>
              </div>
            </template>
          </UiSelect>
          <UiBtn
            color="error"
            variant="tonal"
            :disabled="!selectedUser"
            :loading="revoking"
            prepend-icon="mdi-logout"
            @click="revokeSessions"
          >
            Çıkış Yaptır
          </UiBtn>
        </div>
      </div>
    </UiCard>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { dateTimeFormat } from '~/utils/datesFormat'
import type { ActiveUserSnapshot } from '~/composables/useSettings'

const { getActiveUserCount, getActiveUsersSnapshot, getRevokableUsers, revokeUserSessions } = useSettings()
const { getTenants } = useTenants()

const activeUserCount = ref<number>(0)
const loadingCount = ref(false)
const tenants = ref<Array<{ id: number; name: string }>>([])
const selectedTenantId = ref<number | null>(null)
const users = ref<Array<{ id: number; fullName: string; email: string }>>([])
const loadingUsers = ref(false)
const selectedUser = ref<number | null>(null)
const revoking = ref(false)
const activeUsers = ref<ActiveUserSnapshot[]>([])
const loadingActiveUsers = ref(false)

const initials = (name: string) =>
  name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '?'

const formatActivity = (iso: string | null) => iso ? dateTimeFormat(iso) : '—'

const tenantOptions = computed(() => [
  { label: 'Tüm tenant\'lar', value: null },
  ...tenants.value.map(t => ({ label: t.name, value: t.id }))
])

const selectedTenantLabel = computed(() =>
  tenants.value.find(t => t.id === selectedTenantId.value)?.name ?? ''
)

const onTenantChange = () => {
  Promise.all([loadActiveCount(), loadUsers(), loadActiveUsers()])
}

const loadActiveCount = async () => {
  loadingCount.value = true
  try { activeUserCount.value = await getActiveUserCount(selectedTenantId.value ?? undefined) }
  catch { activeUserCount.value = 0 }
  finally { loadingCount.value = false }
}

const loadTenants = async () => {
  try {
    const res = await getTenants(1, 100, '')
    const items = res?.data ?? []
    const list = Array.isArray(items) ? items : (items?.items ?? [])
    tenants.value = list.map((t: any) => ({ id: t.id, name: t.name }))
  } catch {
    tenants.value = []
  }
}

const loadUsers = async () => {
  loadingUsers.value = true
  try { users.value = await getRevokableUsers(selectedTenantId.value ?? undefined) }
  catch { users.value = [] }
  finally { loadingUsers.value = false }
}

const loadActiveUsers = async () => {
  loadingActiveUsers.value = true
  try { activeUsers.value = await getActiveUsersSnapshot(selectedTenantId.value ?? undefined) }
  catch { activeUsers.value = [] }
  finally { loadingActiveUsers.value = false }
}

const revokeSessions = async () => {
  if (!selectedUser.value) return
  revoking.value = true
  try {
    await revokeUserSessions(selectedUser.value, 'SuperAdmin tarafından çıkış yaptırıldı')
    selectedUser.value = null
    await Promise.all([loadActiveCount(), loadUsers(), loadActiveUsers()])
  } finally {
    revoking.value = false
  }
}

onMounted(async () => {
  await loadTenants()
  await Promise.all([loadActiveCount(), loadUsers(), loadActiveUsers()])
})
</script>

<style scoped>
.superadmin-settings {
  max-width: 960px;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: rgb(var(--color-on-surface));
  margin: 0;
}

.section-desc {
  font-size: 0.85rem;
  color: rgb(var(--color-on-surface-variant));
  margin: 0;
}

.stat-card {
  transition: box-shadow 0.2s;
}
.stat-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: rgb(var(--color-on-surface));
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8rem;
  color: rgb(var(--color-on-surface-variant));
  margin-top: 2px;
}

.table-title {
  font-size: 0.95rem;
  font-weight: 600;
}

.online-table :deep(th) {
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgb(var(--color-on-surface-variant)) !important;
  background: rgb(var(--color-surface-variant));
}

.online-table :deep(tr:hover td) {
  background: rgba(103, 58, 183, 0.08);
}

.empty-table {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
