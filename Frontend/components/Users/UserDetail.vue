<template>
  <div class="user-detail-container">
    <!-- Header with Avatar -->
    <div class="detail-header">
      <UserAvatar
        :src="user?.profileImageUrl"
        :initials="getInitials(user?.firstName, user?.lastName)"
        :size="80"
        class="detail-avatar"
      />
      <div class="header-info">
        <h2 class="user-name">{{ user?.firstName }} {{ user?.lastName }}</h2>
        <div class="user-meta">
          <UiChip
            :color="user?.status === UserStatus.Active ? 'success' : 'error'"
            size="small"
            variant="tonal"
            prepend-icon="mdi-circle"
          >
            {{ user?.status === UserStatus.Active ? 'Aktif' : 'Pasif' }}
          </UiChip>
          <UiChip
            v-if="user?.emailConfirmed"
            color="info"
            size="small"
            variant="tonal"
            prepend-icon="mdi-email-check"
          >
            E-posta Doğrulandı
          </UiChip>
        </div>
      </div>
    </div>

    <hr class="ui-divider !my-6" />

    <!-- Tabs -->
    <div class="tabs-container">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-item', { active: currentTab === tab.value }]"
        @click="currentTab = tab.value"
      >
        <div class="tab-icon-wrapper">
          <UiIcon :icon="tab.icon" :size="22" />
        </div>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <UiWindow v-model="currentTab" class="mt-6">
      <!-- Tab 1: Genel Bilgiler -->
      <UiWindowItem value="general">
        <div class="info-section">
          <h3 class="section-title">
            <UiIcon icon="mdi-account-details" :size="20" class="mr-2" />
            Kişisel Bilgiler
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">
                <UiIcon icon="mdi-account" :size="18" color="primary" />
                Ad Soyad
              </div>
              <div class="info-value">{{ user?.firstName }} {{ user?.lastName }}</div>
            </div>

            <div class="info-item">
              <div class="info-label">
                <UiIcon icon="mdi-email" :size="18" color="primary" />
                E-posta
              </div>
              <div class="info-value">{{ user?.email || '-' }}</div>
            </div>

            <div class="info-item">
              <div class="info-label">
                <UiIcon icon="mdi-phone" :size="18" color="primary" />
                Telefon
              </div>
              <div class="info-value">{{ user?.phoneNumber || '-' }}</div>
            </div>
          </div>
        </div>

        <hr class="ui-divider !my-6" />

        <div class="info-section">
          <h3 class="section-title">
            <UiIcon icon="mdi-clock-outline" :size="20" class="mr-2" />
            Hesap Bilgileri
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">
                <UiIcon icon="mdi-calendar-plus" :size="18" color="primary" />
                Kayıt Tarihi
              </div>
              <div class="info-value">{{ formatDateTime(user?.createdDate) }}</div>
            </div>

            <div class="info-item">
              <div class="info-label">
                <UiIcon icon="mdi-login" :size="18" color="primary" />
                Son Giriş
              </div>
              <div class="info-value">{{ formatDateTime(user?.lastLoginDate) }}</div>
            </div>
          </div>
        </div>
      </UiWindowItem>

      <!-- Tab 2: Roller ve Yetkiler -->
      <UiWindowItem value="roles">
        <div class="info-section">
          <div class="section-header">
            <h3 class="section-title">
              <UiIcon icon="mdi-shield-account" :size="20" class="mr-2" />
              Atanmış Roller
            </h3>
            <UiChip size="small" color="primary" variant="tonal">
              {{ user?.roles?.length || 0 }} Rol
            </UiChip>
          </div>

          <div v-if="user?.roles && user.roles.length > 0" class="roles-list">
            <div v-for="role in user.roles" :key="role.id" class="role-card">
              <div class="role-card-header">
                <div class="role-card-icon">
                  <UiIcon icon="mdi-shield-star" :size="24" color="primary" />
                </div>
                <div class="role-card-info">
                  <h4 class="role-card-name">{{ role.name }}</h4>
                  <p v-if="role.description" class="role-card-description">
                    {{ role.description }}
                  </p>
                </div>
                <UiChip
                  v-if="role.isSystemRole"
                  size="small"
                  color="orange"
                  variant="tonal"
                >
                  Sistem Rolü
                </UiChip>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <UiIcon icon="mdi-shield-off" :size="64" color="grey-400" />
            <h3 class="empty-title">Rol Atanmamış</h3>
            <p class="empty-text">Bu kullanıcıya henüz rol atanmamış</p>
          </div>
        </div>
      </UiWindowItem>

      <!-- Tab 3: Güvenlik -->
      <UiWindowItem value="security">
        <div class="info-section">
          <h3 class="section-title">
            <UiIcon icon="mdi-security" :size="20" class="mr-2" />
            Güvenlik Bilgileri
          </h3>
          <div class="security-grid">
            <div class="security-card">
              <div class="security-icon" :class="user?.emailConfirmed ? 'success' : 'warning'">
                <UiIcon :icon="user?.emailConfirmed ? 'mdi-email-check' : 'mdi-email-alert'" :size="32" />
              </div>
              <div class="security-info">
                <h4 class="security-title">E-posta Doğrulama</h4>
                <p class="security-status">
                  {{ user?.emailConfirmed ? 'Doğrulanmış' : 'Doğrulanmamış' }}
                </p>
              </div>
            </div>

            <div class="security-card">
              <div class="security-icon" :class="user?.phoneConfirmed ? 'success' : 'warning'">
                <UiIcon :icon="user?.phoneConfirmed ? 'mdi-phone-check' : 'mdi-phone-alert'" :size="32" />
              </div>
              <div class="security-info">
                <h4 class="security-title">Telefon Doğrulama</h4>
                <p class="security-status">
                  {{ user?.phoneConfirmed ? 'Doğrulanmış' : 'Doğrulanmamış' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </UiWindowItem>
    </UiWindow>

    <!-- Footer Actions -->
    <div class="detail-footer">
      <UiBtn
        variant="outlined"
        size="large"
        @click="$emit('close')"
        class="btn-gradient-dark"
      >
        Kapat
      </UiBtn>
      <UiBtn
        size="large"
        @click="$emit('edit', user)"
        class="btn-gradient-primary"
        prepend-icon="mdi-pencil"
      >
        Düzenle
      </UiBtn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { User } from '~/types'
import { UserStatus } from '~/types'
import { dateTimeFormatLong } from '~/utils/datesFormat'

defineProps<{
  user?: User | null
}>()

defineEmits<{
  close: []
  edit: [user: User]
}>()

const currentTab = ref('general')

const tabs = [
  { value: 'general', label: 'Genel Bilgiler', icon: 'mdi-information' },
  { value: 'roles', label: 'Roller', icon: 'mdi-shield-account' },
  { value: 'security', label: 'Güvenlik', icon: 'mdi-security' }
]

const getInitials = (firstName?: string, lastName?: string) => {
  if (!firstName && !lastName) return '?'
  const first = firstName?.charAt(0) || ''
  const last = lastName?.charAt(0) || ''
  return (first + last).toUpperCase()
}

const formatDateTime = (date?: string | null) => {
  if (!date) return '-'
  return dateTimeFormatLong(date)
}
</script>

<style scoped>
.user-detail-container {
  padding: 24px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.detail-avatar {
  border: 3px solid rgb(var(--color-outline-variant));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.header-info {
  flex: 1;
}

.user-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgb(var(--color-on-surface));
  margin: 0 0 8px 0;
}

.user-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.info-section {
  margin-bottom: 24px;
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
  color: rgb(var(--color-on-surface));
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.info-item {
  padding: 14px 16px;
  background: rgb(var(--color-surface-variant));
  border-radius: 8px;
  border: 1px solid rgb(var(--color-outline-variant));
  transition: all 0.2s ease;
}

.info-item:hover {
  border-color: rgb(var(--color-outline));
  background: rgb(var(--color-surface));
}

.info-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: rgb(var(--color-on-surface-variant));
  margin-bottom: 6px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 0.9375rem;
  color: rgb(var(--color-on-surface));
  font-weight: 500;
}

/* Roles Section */
.roles-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-card {
  background: rgb(var(--color-surface));
  border: 1px solid rgb(var(--color-outline-variant));
  border-radius: 8px;
  padding: 14px 16px;
  transition: all 0.2s ease;
}

.role-card:hover {
  border-color: rgb(var(--color-outline));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.role-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-card-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--color-brand) / 0.1);
  border-radius: 8px;
  flex-shrink: 0;
}

.role-card-info {
  flex: 1;
  min-width: 0;
}

.role-card-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: rgb(var(--color-on-surface));
  margin: 0 0 4px 0;
}

.role-card-description {
  font-size: 0.8125rem;
  color: rgb(var(--color-on-surface-variant));
  margin: 0;
  line-height: 1.4;
}

/* Security Section */
.security-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.security-card {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  background: rgb(var(--color-surface));
  border: 1px solid rgb(var(--color-outline-variant));
  border-radius: 8px;
  transition: all 0.2s ease;
}

.security-card:hover {
  border-color: rgb(var(--color-outline));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.security-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
}

.security-icon.success {
  background: #ecfdf5;
  color: #10b981;
}

.security-icon.warning {
  background: #fff7ed;
  color: #f59e0b;
}

.security-icon.default {
  background: rgb(var(--color-surface-variant));
  color: rgb(var(--color-on-surface-variant));
}

.security-info {
  flex: 1;
}

.security-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(var(--color-on-surface));
  margin: 0 0 4px 0;
}

.security-status {
  font-size: 0.8125rem;
  color: rgb(var(--color-on-surface-variant));
  margin: 0;
  font-weight: 500;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--color-on-surface-variant));
  margin-top: 12px;
}

.empty-text {
  font-size: 0.875rem;
  color: rgb(var(--color-on-surface-variant));
  margin-top: 6px;
  opacity: 0.7;
}

/* Footer */
.detail-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgb(var(--color-outline-variant));
}

@media (max-width: 768px) {
  .user-detail-container {
    padding: 16px;
  }

  .detail-header {
    flex-direction: column;
    text-align: center;
  }

  .user-name {
    font-size: 1.25rem;
  }

  .info-grid,
  .security-grid {
    grid-template-columns: 1fr;
  }

  .detail-footer {
    flex-direction: column;
  }

  .detail-footer .ui-btn {
    width: 100%;
  }
}
</style>
