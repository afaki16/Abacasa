<template>
  <div class="admin-settings">
    <!-- İstatistik -->
    <div class="stat-row">
      <div class="stat-tile">
        <div class="stat-tile__icon"><UiIcon icon="mdi-account-group-outline" :size="20" /></div>
        <div>
          <div class="stat-tile__val">
            <UiProgressCircular v-if="loadingCount" indeterminate :size="18" :width="2" />
            <template v-else>{{ activeUserCount }}</template>
          </div>
          <div class="stat-tile__lbl">Aktif kullanıcı</div>
        </div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile__icon"><UiIcon icon="mdi-account-multiple-check-outline" :size="20" /></div>
        <div>
          <div class="stat-tile__val">{{ loadingActiveUsers ? '—' : activeUsers.length }}</div>
          <div class="stat-tile__lbl">Şu an çevrimiçi</div>
        </div>
      </div>
    </div>

    <!-- Çevrimiçi Kullanıcılar -->
    <div class="panel-card">
      <div class="panel-card__header">
        <div class="panel-card__icon"><UiIcon icon="mdi-account-multiple-check-outline" :size="16" /></div>
        <span>Şu An Çevrimiçi</span>
        <div class="panel-card__actions">
          <UiBtn
            size="small"
            variant="text"
            color="primary"
            prepend-icon="mdi-refresh"
            :loading="loadingActiveUsers"
            @click="loadActiveUsers"
          >
            Yenile
          </UiBtn>
        </div>
      </div>
      <div class="panel-card__divider" />
      <p class="panel-card__hint px-5 pt-4">
        En az bir geçerli oturumu olan kullanıcılar — yalnızca kendi tenant'ınız.
      </p>
      <UiProgressLinear v-if="loadingActiveUsers" indeterminate color="primary" />
      <div v-if="!loadingActiveUsers && activeUsers.length" class="ui-table-wrap online-table">
        <table v-stack-table class="ui-table ui-table--comfortable soft-table">
          <thead>
            <tr>
              <th>Kullanıcı</th>
              <th>Oturum</th>
              <th>Son Aktivite</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in activeUsers" :key="row.userId">
              <td>
                <div class="user-cell">
                  <UiAvatar color="primary" variant="tonal" :size="32" class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal font-bold">
                    {{ initials(row.fullName) }}
                  </UiAvatar>
                  <div class="min-w-0">
                    <div class="user-cell__name">{{ row.fullName }}</div>
                    <div class="user-cell__mail">{{ row.email }}</div>
                  </div>
                </div>
              </td>
              <td><span class="status-pill">{{ row.activeSessionCount }} oturum</span></td>
              <td class="muted-cell">{{ formatActivity(row.lastActivityAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!loadingActiveUsers && activeUsers.length === 0" class="empty-table">
        <UiIcon icon="mdi-account-off-outline" :size="32" />
        <p>Şu anda çevrimiçi kullanıcı yok.</p>
      </div>
    </div>

    <!-- Uzaktan Kullanıcı Çıkışı -->
    <div class="panel-card">
      <div class="panel-card__header">
        <div class="panel-card__icon panel-card__icon--danger"><UiIcon icon="mdi-account-off-outline" :size="16" /></div>
        <span>Uzaktan Kullanıcı Çıkışı</span>
      </div>
      <div class="panel-card__divider" />
      <div class="panel-card__body">
        <p class="panel-card__hint">Seçtiğiniz kullanıcının tüm cihazlarındaki oturumları sonlandırılır.</p>
        <div class="revoke-row">
          <UiSelect autocomplete
            v-model="selectedUser"
            :items="users"
            item-title="fullName"
            item-value="id"
            :filter-keys="['fullName', 'email']"
            label="Kullanıcı seçin"
            placeholder="İsim veya e-posta ile ara..."
            prepend-inner-icon="mdi-account-search-outline"
            :loading="loadingUsers"
            clearable
            hide-details
            density="comfortable"
            class="revoke-select"
          >
            <template #item="{ item }">
              <div class="flex items-center gap-4 min-w-0">
                <UiAvatar color="primary" variant="tonal" :size="32" class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal font-bold flex-shrink-0">
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
            :disabled="!selectedUser"
            :loading="revoking"
            prepend-icon="mdi-logout"
            class="revoke-btn"
            @click="revokeSessions"
          >
            Çıkış Yaptır
          </UiBtn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dateTimeFormat } from '~/utils/datesFormat'
import type { ActiveUserSnapshot } from '~/composables/useSettings'

const { getActiveUserCount, getActiveUsersSnapshot, getRevokableUsers, revokeUserSessions } = useSettings()

const activeUserCount = ref<number>(0)
const loadingCount = ref(false)
const users = ref<Array<{ id: number; fullName: string; email: string }>>([])
const loadingUsers = ref(false)
const selectedUser = ref<number | null>(null)
const revoking = ref(false)
const activeUsers = ref<ActiveUserSnapshot[]>([])
const loadingActiveUsers = ref(false)

const initials = (name: string) =>
  name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '?'

const formatActivity = (iso: string | null) => iso ? dateTimeFormat(iso) : '—'

const loadActiveUsers = async () => {
  loadingActiveUsers.value = true
  try { activeUsers.value = await getActiveUsersSnapshot() }
  catch { activeUsers.value = [] }
  finally { loadingActiveUsers.value = false }
}

const loadActiveCount = async () => {
  loadingCount.value = true
  try { activeUserCount.value = await getActiveUserCount() }
  catch { activeUserCount.value = 0 }
  finally { loadingCount.value = false }
}

const loadUsers = async () => {
  loadingUsers.value = true
  try { users.value = await getRevokableUsers() }
  catch { users.value = [] }
  finally { loadingUsers.value = false }
}

const revokeSessions = async () => {
  if (!selectedUser.value) return
  revoking.value = true
  try {
    await revokeUserSessions(selectedUser.value, 'Admin tarafından çıkış yaptırıldı')
    selectedUser.value = null
    await Promise.all([loadActiveCount(), loadUsers(), loadActiveUsers()])
  } finally {
    revoking.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadActiveCount(), loadUsers(), loadActiveUsers()])
})
</script>

<style scoped>
.user-cell { display: flex; align-items: center; gap: 12px; padding: 4px 0; }
.user-cell__name { font-weight: 600; font-size: 0.875rem; color: rgb(var(--color-on-surface)); }
.user-cell__mail { font-size: 0.75rem; color: rgb(var(--color-on-surface-variant)); }
.muted-cell { font-size: 0.8125rem; color: rgb(var(--color-on-surface-variant)); }
.min-w-0 { min-width: 0; }

.empty-table {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 120px;
  padding: 24px;
  font-size: 0.85rem;
  color: rgb(var(--color-on-surface-variant));
}
.empty-table p { margin: 0; }

/* Seçici + buton aynı satırda, buton alanın alt çizgisine hizalı */
.revoke-row { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
.revoke-select { flex: 1; min-width: 260px; }
.revoke-btn { height: 42px !important; border-radius: 10px !important; padding: 0 18px !important; }
</style>
