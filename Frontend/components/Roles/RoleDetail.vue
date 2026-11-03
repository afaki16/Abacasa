<template>
  <div class="role-detail-container">
    <!-- Header -->
    <div class="detail-header">
      <div class="detail-icon">
        <v-icon size="32" color="primary">mdi-shield-account</v-icon>
      </div>
      <div class="header-info">
        <h2 class="role-name">{{ role?.name }}</h2>
        <div class="role-meta">
          <v-chip :color="role?.isSystemRole ? 'warning' : 'success'" size="small" variant="tonal">
            {{ role?.isSystemRole ? 'Sistem' : 'Özel' }}
          </v-chip>
          <v-chip v-if="showTenant" size="small" variant="tonal" color="info" prepend-icon="mdi-domain">
            {{ role?.tenantId == null ? 'Ortak' : `Tenant ${role.tenantId}` }}
          </v-chip>
        </div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">
          <v-icon size="18" color="primary">mdi-text</v-icon>
          Açıklama
        </div>
        <div class="info-value">{{ role?.description || '-' }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">
          <v-icon size="18" color="primary">mdi-calendar</v-icon>
          Oluşturulma
        </div>
        <div class="info-value">{{ role?.createdDate ? dateTimeFormatLong(role.createdDate) : '-' }}</div>
      </div>
    </div>

    <v-divider class="my-6" />

    <!-- Permissions -->
    <div class="section-header">
      <h3 class="section-title">
        <v-icon size="20" class="mr-2">mdi-key-variant</v-icon>
        Yetkiler
      </h3>
      <v-chip size="small" color="primary" variant="tonal">
        {{ role?.permissions?.length || 0 }} yetki
      </v-chip>
    </div>

    <div v-if="groups.length" class="permission-groups">
      <div v-for="group in groups" :key="group.resource" class="permission-group">
        <div class="group-title">{{ group.resource }} ({{ group.permissions.length }})</div>
        <div class="group-items">
          <v-chip
            v-for="permission in group.permissions"
            :key="permission.id"
            size="small"
            variant="tonal"
            :title="permission.description || undefined"
          >
            {{ permission.name }}
          </v-chip>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <v-icon size="48" color="grey-400">mdi-key-remove</v-icon>
      <p class="empty-text">Bu role atanmış yetki yok</p>
    </div>

    <div class="detail-footer">
      <v-btn variant="outlined" size="large" class="btn-gradient-dark" @click="$emit('close')">
        Kapat
      </v-btn>
      <v-btn
        v-if="canEdit"
        size="large"
        class="btn-gradient-primary"
        prepend-icon="mdi-pencil"
        @click="$emit('edit', role)"
      >
        Düzenle
      </v-btn>
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

// RoleForm ile aynı gruplama (kaynağa göre), salt okunur görünüm için sıralı
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
.role-detail-container {
  padding: 24px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.detail-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 12px;
  flex-shrink: 0;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.role-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 8px 0;
}

.role-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.info-item {
  padding: 14px 16px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 8px;
  border: 1px solid rgb(var(--v-theme-outline-variant));
}

.info-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 6px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 0.9375rem;
  color: rgb(var(--v-theme-on-surface));
  font-weight: 500;
  white-space: pre-line;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
  display: flex;
  align-items: center;
}

.permission-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.permission-group {
  padding: 12px 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: 8px;
}

.group-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 8px;
}

.group-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.empty-state {
  text-align: center;
  padding: 32px 24px;
}

.empty-text {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 8px;
}

.detail-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgb(var(--v-theme-outline-variant));
}

@media (max-width: 768px) {
  .role-detail-container {
    padding: 16px;
  }

  .detail-footer {
    flex-direction: column;
  }

  .detail-footer .v-btn {
    width: 100%;
  }
}
</style>
