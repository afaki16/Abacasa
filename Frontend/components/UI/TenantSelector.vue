<template>
  <UiMenu v-if="isSuperAdmin" :offset="8" location="bottom start" min-width="260">
    <template #activator="{ props: menuProps }">
      <button v-bind="menuProps" class="tenant-btn" type="button" :aria-label="$t('sidebar.tenantSelector.placeholder')">
        <UiIcon icon="mdi-domain" :size="20" />
        <span class="tenant-name">
          {{ selectedTenantId == null ? $t('sidebar.tenantSelector.platform') : (selectedTenantName ?? `#${selectedTenantId}`) }}
        </span>
        <UiIcon icon="mdi-chevron-down" :size="16" class="tenant-chevron" />
      </button>
    </template>

    <div class="ui-list ui-list--compact tenant-list">
      <!-- Platform seçeneği (hane seçimini temizler) -->
      <button
        type="button"
        role="menuitem"
        class="ui-list-item ui-list-item--link"
        :class="{ 'ui-list-item--active': selectedTenantId == null }"
        @click="handleClear"
      >
        <span class="ui-list-item__prepend"><UiIcon icon="mdi-shield-crown-outline" :size="24" /></span>
        <span class="ui-list-item__content ui-list-title tenant-list-title">{{ $t('sidebar.tenantSelector.platform') }}</span>
        <span v-if="selectedTenantId == null" class="ui-list-item__append"><UiIcon icon="mdi-check" :size="20" color="success" /></span>
      </button>

      <hr class="ui-divider !my-1" />

      <div class="tenant-scroll">
        <div v-if="loading" class="ui-list-item ui-list-item--disabled">
          <span class="ui-list-item__content ui-list-title tenant-list-title">{{ $t('sidebar.tenantSelector.loading') }}</span>
        </div>
        <div v-else-if="!tenants.length" class="ui-list-item ui-list-item--disabled">
          <span class="ui-list-item__content ui-list-title tenant-list-title">{{ $t('sidebar.tenantSelector.empty') }}</span>
        </div>
        <template v-else>
          <button
            v-for="t in tenants"
            :key="t.id"
            type="button"
            role="menuitem"
            class="ui-list-item ui-list-item--link"
            :class="{ 'ui-list-item--active': selectedTenantId === t.id }"
            @click="handleSelect(t.id)"
          >
            <span class="ui-list-item__content ui-list-title tenant-list-title">{{ t.name }}</span>
            <span v-if="selectedTenantId === t.id" class="ui-list-item__append"><UiIcon icon="mdi-check" :size="20" color="success" /></span>
          </button>
        </template>
      </div>
    </div>
  </UiMenu>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import { useTenantContext } from '~/composables/useTenantContext'

const authStore = useAuthStore()
const { roles } = storeToRefs(authStore)
const isSuperAdmin = computed(() => roles.value.includes('SuperAdmin'))

const { selectedTenantId, selectedTenantName, tenants, setSelected, clearSelected, loadTenants } = useTenantContext()
const loading = ref(false)

onMounted(async () => {
  if (!isSuperAdmin.value || tenants.value.length > 0) return
  loading.value = true
  try { await loadTenants() } finally { loading.value = false }
})

// Seçim URL'ye de yazılır (?tenantId=); sayfa yenilendiğinde / link paylaşıldığında bağlam korunur.
// Parametre temizlenmezse middleware seçimi URL'den geri yüklerdi; "Platform"a dönüşte parametre de silinir.
const reloadWithTenantParam = (id: number | null) => {
  if (!import.meta.client) return
  const url = new URL(window.location.href)
  if (id) url.searchParams.set('tenantId', String(id))
  else url.searchParams.delete('tenantId')
  window.location.href = url.toString()
}

const handleSelect = (id: number) => {
  if (id === selectedTenantId.value) return
  setSelected(id)
  reloadWithTenantParam(id)
}

const handleClear = () => {
  if (selectedTenantId.value == null) return
  clearSelected()
  reloadWithTenantParam(null)
}
</script>

<style scoped>
.tenant-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 0;
}

.tenant-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.tenant-name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .tenant-name {
    max-width: 90px;
  }
}

.tenant-chevron {
  opacity: 0.7;
}

.tenant-list {
  border-radius: 12px;
  padding: 6px;
}

.tenant-scroll {
  max-height: 340px;
  overflow-y: auto;
}

.tenant-list-title {
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
