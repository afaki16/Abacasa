<template>
  <div class="user-detail">
    <!-- Profil kartı -->
    <div class="profile-card">
      <div class="profile-cover" />
      <div class="profile-body">
        <UserAvatar
          :src="user?.profileImageUrl"
          :initials="initials"
          :size="72"
          class="profile-avatar"
        />
        <div class="profile-main">
          <h2 class="profile-name">{{ displayName }}</h2>
          <p class="profile-email">{{ user?.email || '—' }}</p>
          <div class="profile-badges">
            <span :class="['badge', statusBadge.cls]">{{ statusBadge.label }}</span>
            <span v-if="user?.emailConfirmed" class="badge badge--info">
              <UiIcon icon="mdi-email-check-outline" :size="14" /> {{ t('users.detail.emailVerified') }}
            </span>
            <!-- Üye olduğu haneler (listede yalnızca SuperAdmin platform görünümünde dolu) -->
            <span v-for="name in user?.householdNames || []" :key="name" class="badge badge--tenant">
              <UiIcon icon="mdi-home-outline" :size="14" /> {{ name }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sekmeler -->
    <div class="detail-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="detail-tab"
        :class="{ 'detail-tab--active': currentTab === tab.value }"
        @click="currentTab = tab.value"
      >
        <UiIcon :icon="tab.icon" :size="16" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Genel -->
    <div v-show="currentTab === 'general'" class="detail-panel">
      <div class="info-grid">
        <div class="info-card">
          <span class="info-label">{{ t('users.detail.phone') }}</span>
          <span class="info-value">{{ user?.phoneNumber || '—' }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">{{ t('users.detail.createdDate') }}</span>
          <span class="info-value">{{ formatDateTime(user?.createdDate) }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">{{ t('users.detail.lastLogin') }}</span>
          <span class="info-value">{{ formatDateTime(user?.lastLoginDate) }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">{{ t('users.detail.userId') }}</span>
          <span class="info-value mono">{{ user?.id || '—' }}</span>
        </div>
      </div>
    </div>

    <!-- Roller -->
    <div v-show="currentTab === 'roles'" class="detail-panel">
      <div v-if="user?.roles?.length" class="role-list">
        <div v-for="role in user.roles" :key="role.id" class="role-row">
          <div class="role-icon">
            <UiIcon icon="mdi-shield-account-outline" :size="20" />
          </div>
          <div class="role-copy">
            <div class="role-name">{{ role.name }}</div>
            <div v-if="role.description" class="role-desc">{{ role.description }}</div>
          </div>
          <span v-if="role.isSystemRole" class="badge badge--muted">{{ t('users.detail.systemRole') }}</span>
        </div>
      </div>
      <div v-else class="empty-block">
        <UiIcon icon="mdi-shield-off-outline" :size="40" class="empty-icon" />
        <p>{{ t('users.detail.noRoles') }}</p>
      </div>
    </div>

    <!-- Güvenlik -->
    <div v-show="currentTab === 'security'" class="detail-panel">
      <div class="security-grid">
        <div class="security-item">
          <div class="security-icon" :class="user?.emailConfirmed ? 'ok' : 'warn'">
            <UiIcon :icon="user?.emailConfirmed ? 'mdi-email-check' : 'mdi-email-alert'" :size="20" />
          </div>
          <div>
            <div class="security-title">{{ t('users.detail.emailVerification') }}</div>
            <div class="security-value">{{ user?.emailConfirmed ? t('users.detail.verified') : t('users.detail.pending') }}</div>
          </div>
        </div>
        <div class="security-item">
          <div class="security-icon" :class="user?.phoneConfirmed ? 'ok' : 'warn'">
            <UiIcon :icon="user?.phoneConfirmed ? 'mdi-phone-check' : 'mdi-phone-alert'" :size="20" />
          </div>
          <div>
            <div class="security-title">{{ t('users.detail.phoneVerification') }}</div>
            <div class="security-value">{{ user?.phoneConfirmed ? t('users.detail.verified') : t('users.detail.pending') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Alt butonlar -->
    <div class="detail-actions">
      <UiBtn variant="outlined" class="btn-gradient-dark" @click="$emit('close')">{{ t('common.close') }}</UiBtn>
      <UiBtn class="btn-gradient-primary" prepend-icon="mdi-pencil-outline" @click="$emit('edit', user!)">
        {{ t('common.edit') }}
      </UiBtn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { User } from '~/types'
import { UserStatus } from '~/types'
import { dateTimeFormatLong } from '~/utils/datesFormat'

const props = defineProps<{
  user?: User | null
}>()

defineEmits<{
  close: []
  edit: [user: User]
}>()

const { t } = useI18n()

const currentTab = ref('general')

const tabs = computed(() => [
  { value: 'general', label: t('users.detail.tabGeneral'), icon: 'mdi-information-outline' },
  { value: 'roles', label: t('users.detail.tabRoles'), icon: 'mdi-shield-account-outline' },
  { value: 'security', label: t('users.detail.tabSecurity'), icon: 'mdi-lock-outline' },
])

const displayName = computed(() => {
  if (!props.user) return '—'
  return props.user.fullName || `${props.user.firstName} ${props.user.lastName}`.trim()
})

const initials = computed(() => {
  const f = props.user?.firstName?.charAt(0) || ''
  const l = props.user?.lastName?.charAt(0) || ''
  return (f + l).toUpperCase() || '?'
})

const statusBadge = computed(() => {
  switch (props.user?.status) {
    case UserStatus.Active: return { label: t('users.status.active'), cls: 'badge--success' }
    case UserStatus.Banned: return { label: t('users.status.banned'), cls: 'badge--danger' }
    case UserStatus.PendingVerification: return { label: t('users.status.pendingVerification'), cls: 'badge--warn' }
    default: return { label: t('users.status.inactive'), cls: 'badge--muted' }
  }
})

const formatDateTime = (date?: string | null) => (date ? dateTimeFormatLong(date) : '—')
</script>

<style scoped>
.user-detail {
  --ud-border: rgb(var(--color-outline-variant) / 0.6);
  --ud-surface: rgb(var(--color-surface-container-lowest));
  --ud-muted: rgb(var(--color-surface-container-low));
  --ud-text: rgb(var(--color-on-surface));
  --ud-text-muted: rgb(var(--color-on-surface-variant));
  --ud-accent: rgb(var(--color-primary));
  padding: 0 4px 8px;
}

/* Profil kartı: üstte marka tonlu bant, avatar banda taşar */
.profile-card {
  border: 1px solid var(--ud-border);
  border-radius: 16px;
  overflow: hidden;
  background: var(--ud-surface);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  margin-bottom: 20px;
}

.profile-cover {
  height: 72px;
  background: color-mix(in srgb, var(--ud-accent) 8%, var(--ud-muted));
}

.profile-body {
  display: flex;
  gap: 16px;
  padding: 0 20px 20px;
  margin-top: -28px;
  align-items: flex-end;
}

.profile-avatar :deep(.user-avatar) {
  border: 3px solid var(--ud-surface) !important;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08) !important;
}

.profile-main {
  min-width: 0;
}

.profile-name {
  margin: 0 0 4px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ud-text);
}

.profile-email {
  margin: 0 0 10px;
  font-size: 0.875rem;
  color: var(--ud-text-muted);
}

.profile-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge--success { background: rgba(34, 197, 94, 0.12); color: #15803d; }
.badge--danger { background: rgba(239, 68, 68, 0.12); color: #b91c1c; }
.badge--warn { background: rgba(245, 158, 11, 0.14); color: #b45309; }
.badge--muted { background: var(--ud-muted); color: var(--ud-text-muted); }
.badge--info { background: rgba(59, 130, 246, 0.12); color: #1d4ed8; }
.badge--tenant { background: color-mix(in srgb, var(--ud-accent) 10%, transparent); color: var(--ud-accent); }

/* Sekmeler: küçük hap butonlar */
.detail-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.detail-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--ud-border);
  background: var(--ud-surface);
  color: var(--ud-text-muted);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.detail-tab:hover {
  border-color: color-mix(in srgb, var(--ud-accent) 25%, transparent);
  color: var(--ud-accent);
}

.detail-tab--active {
  background: color-mix(in srgb, var(--ud-accent) 8%, var(--ud-surface));
  border-color: color-mix(in srgb, var(--ud-accent) 22%, transparent);
  color: var(--ud-accent);
}

.detail-panel {
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.info-card {
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--ud-border);
  background: var(--ud-muted);
}

.info-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ud-text-muted);
  margin-bottom: 6px;
}

.info-value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--ud-text);
  word-break: break-word;
}

.mono { font-family: ui-monospace, monospace; font-size: 0.8125rem; }

.role-list { display: flex; flex-direction: column; gap: 10px; }

.role-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--ud-border);
  border-radius: 12px;
  background: var(--ud-surface);
}

.role-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--ud-accent) 10%, transparent);
  color: var(--ud-accent);
}

.role-copy { flex: 1; min-width: 0; }
.role-name { font-weight: 600; color: var(--ud-text); }
.role-desc { font-size: 0.8125rem; color: var(--ud-text-muted); margin-top: 2px; }

.security-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.security-item {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--ud-border);
  border-radius: 12px;
  background: var(--ud-surface);
}

.security-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.security-icon.ok { background: rgba(16, 185, 129, 0.12); color: #059669; }
.security-icon.warn { background: rgba(245, 158, 11, 0.14); color: #d97706; }

.security-title { font-size: 0.8125rem; font-weight: 600; color: var(--ud-text); }
.security-value { font-size: 0.8125rem; color: var(--ud-text-muted); margin-top: 2px; }

.empty-block {
  text-align: center;
  padding: 40px 16px;
  color: var(--ud-text-muted);
  font-size: 0.875rem;
}
.empty-icon { opacity: 0.4; margin-bottom: 8px; }

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid var(--ud-border);
}

@media (max-width: 640px) {
  .profile-body { flex-direction: column; align-items: flex-start; }
  .detail-actions { flex-direction: column; }
  .detail-actions .ui-btn { width: 100%; }
}
</style>

<style>
/* Koyu tema: açık zemin için seçilen koyu rozet yazıları koyu zeminde okunmuyor */
.dark .user-detail .badge--success { color: #4ade80; }
.dark .user-detail .badge--danger { color: #f87171; }
.dark .user-detail .badge--warn { color: #fbbf24; }
.dark .user-detail .badge--info { color: #93c5fd; }
</style>
