<template>
  <div class="role-detail">
    <!-- Başlık -->
    <div class="role-header">
      <div class="role-header__icon">
        <UiIcon icon="mdi-shield-account-outline" :size="20" />
      </div>
      <div class="role-header__copy">
        <h2 class="role-title">{{ role?.name }}</h2>
        <div class="role-badges">
          <span :class="['badge', role?.isSystemRole ? 'badge--warn' : 'badge--success']">
            {{ role?.isSystemRole ? t('roles.system') : t('roles.custom') }}
          </span>
          <span v-if="showTenant" class="badge badge--tenant">
            <UiIcon icon="mdi-domain" :size="13" />
            {{ role?.tenantId == null ? t('roles.shared') : t('roles.detail.household', { id: role.tenantId }) }}
          </span>
        </div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <span class="info-label">{{ t('common.description') }}</span>
        <span class="info-value">{{ role?.description || '—' }}</span>
      </div>
      <div class="info-card">
        <span class="info-label">{{ t('roles.detail.created') }}</span>
        <span class="info-value">{{ role?.createdDate ? dateTimeFormatLong(role.createdDate) : '—' }}</span>
      </div>
    </div>

    <!-- Yetkiler -->
    <div class="section-head">
      <h3 class="section-title">
        <UiIcon icon="mdi-key-variant" :size="16" /> {{ t('roles.detail.permissions') }}
      </h3>
      <span class="badge badge--tenant">{{ t('roles.detail.permissionCount', { count: role?.permissions?.length || 0 }) }}</span>
    </div>

    <div v-if="groups.length" class="group-list">
      <div v-for="group in groups" :key="group.resource" class="group-card">
        <div class="group-title">{{ group.resource }} ({{ group.permissions.length }})</div>
        <div class="group-items">
          <span
            v-for="permission in group.permissions"
            :key="permission.id"
            class="badge badge--muted"
            :title="permission.description || undefined"
          >
            {{ permission.name }}
          </span>
        </div>
      </div>
    </div>
    <div v-else class="empty-block">
      <UiIcon icon="mdi-key-remove" :size="40" class="empty-icon" />
      <p>{{ t('roles.detail.noPermissions') }}</p>
    </div>

    <!-- Alt butonlar -->
    <div class="detail-actions">
      <UiBtn variant="outlined" class="btn-gradient-dark" @click="$emit('close')">{{ t('common.close') }}</UiBtn>
      <UiBtn
        v-if="canEdit"
        class="btn-gradient-primary"
        prepend-icon="mdi-pencil-outline"
        @click="$emit('edit', role)"
      >
        {{ t('common.edit') }}
      </UiBtn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Role, Permission } from '~/types'
import { dateTimeFormatLong } from '~/utils/datesFormat'

const props = defineProps<{
  role: Role | null
  canEdit?: boolean
  showTenant?: boolean
}>()

defineEmits<{
  close: []
  edit: [role: Role | null]
}>()

const { t } = useI18n()

// Same grouping as RoleForm (by resource), sorted for a stable read-only view
const groups = computed(() => {
  const map = new Map<string, Permission[]>()
  for (const p of props.role?.permissions ?? []) {
    if (!map.has(p.resource)) map.set(p.resource, [])
    map.get(p.resource)!.push(p)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([resource, permissions]) => ({
      resource,
      permissions: [...permissions].sort((a, b) => a.name.localeCompare(b.name))
    }))
})
</script>

<style scoped>
.role-detail {
  --rd-border: rgb(var(--color-outline-variant) / 0.6);
  --rd-surface: rgb(var(--color-surface-container-lowest));
  --rd-muted: rgb(var(--color-surface-container-low));
  --rd-text: rgb(var(--color-on-surface));
  --rd-text-muted: rgb(var(--color-on-surface-variant));
  --rd-accent: rgb(var(--color-primary));
  padding: 0 4px 8px;
}

.role-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.role-header__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--rd-accent) 10%, transparent);
  color: var(--rd-accent);
  border: 1px solid color-mix(in srgb, var(--rd-accent) 12%, transparent);
}

.role-header__copy { flex: 1; min-width: 0; }

.role-title {
  margin: 0 0 6px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--rd-text);
}

.role-badges { display: flex; flex-wrap: wrap; gap: 6px; }

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
.badge--warn { background: rgba(245, 158, 11, 0.14); color: #b45309; }
.badge--muted { background: var(--rd-muted); color: var(--rd-text-muted); }
.badge--tenant { background: color-mix(in srgb, var(--rd-accent) 10%, transparent); color: var(--rd-accent); }

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.info-card {
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--rd-border);
  background: var(--rd-muted);
}

.info-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--rd-text-muted);
  margin-bottom: 6px;
}

.info-value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--rd-text);
  white-space: pre-line;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--rd-text);
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.group-card {
  padding: 12px 16px;
  border: 1px solid var(--rd-border);
  border-radius: 12px;
  background: var(--rd-surface);
}

.group-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--rd-text);
  margin-bottom: 8px;
}

.group-items { display: flex; flex-wrap: wrap; gap: 6px; }

.empty-block {
  text-align: center;
  padding: 40px 16px;
  color: var(--rd-text-muted);
  font-size: 0.875rem;
}
.empty-icon { opacity: 0.4; margin-bottom: 8px; }

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid var(--rd-border);
}

@media (max-width: 640px) {
  .detail-actions { flex-direction: column; }
  .detail-actions .ui-btn { width: 100%; }
}
</style>

<style>
.dark .role-detail .badge--success { color: #4ade80; }
.dark .role-detail .badge--warn { color: #fbbf24; }
</style>
