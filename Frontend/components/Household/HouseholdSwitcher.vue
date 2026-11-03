<template>
  <UiMenu :offset="8" location="bottom end" min-width="240">
    <template #activator="{ props: menuProps }">
      <button v-bind="menuProps" class="household-btn" type="button" :disabled="isBusy" aria-label="Hane seç">
        <UiIcon icon="mdi-home-outline" :size="20" />
        <span class="household-name">{{ activeTenant?.name ?? 'Hane yok' }}</span>
        <UiChip v-if="activeTenant" size="x-small" :color="activeTenant.role === 'Admin' ? 'primary' : undefined" variant="tonal">
          {{ getRoleLabel(activeTenant.role) }}
        </UiChip>
        <UiIcon icon="mdi-chevron-down" :size="16" class="household-chevron" />
      </button>
    </template>

    <div class="ui-list ui-list--compact household-list">
      <button
        v-for="m in memberships"
        :key="m.tenantId"
        type="button"
        role="menuitem"
        class="ui-list-item ui-list-item--link"
        :class="{ 'ui-list-item--active': m.tenantId === activeTenant?.id }"
        @click="select(m.tenantId)"
      >
        <span class="ui-list-item__content">
          <span class="ui-list-title household-list-title block">{{ m.name }}</span>
          <span class="ui-list-subtitle block">{{ getRoleLabel(m.role) }}</span>
        </span>
        <span v-if="m.tenantId === activeTenant?.id" class="ui-list-item__append">
          <UiIcon icon="mdi-check" :size="20" color="success" />
        </span>
      </button>

      <hr v-if="memberships.length" class="ui-divider my-1" />

      <button type="button" role="menuitem" class="ui-list-item ui-list-item--link" @click="createDialog = true">
        <span class="ui-list-item__prepend"><UiIcon icon="mdi-plus" :size="24" /></span>
        <span class="ui-list-item__content ui-list-title household-list-title">Yeni hane oluştur</span>
      </button>
    </div>
  </UiMenu>

  <CreateHouseholdDialog v-model="createDialog" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CreateHouseholdDialog from '~/components/Household/CreateHouseholdDialog.vue'
import { parseApiErrorMessages } from '~/utils/apiError'

const { activeTenant, memberships, getRoleLabel, switchHousehold } = useHousehold()
const toast = useToast()

const createDialog = ref(false)
const isBusy = ref(false)

// Aktif haneye tıklamak bir şey yapmaz; başarıda sayfa tamamen yenilenir
const select = async (tenantId: number) => {
  if (tenantId === activeTenant.value?.id || isBusy.value) return
  isBusy.value = true
  try {
    await switchHousehold(tenantId)
  } catch (error) {
    toast.error(parseApiErrorMessages(error, 'Haneye geçilemedi'))
    isBusy.value = false
  }
}
</script>

<style scoped>
.household-btn {
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

.household-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Dar ekranda ad kısaltılır */
.household-name {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .household-name {
    max-width: 90px;
  }
}

.household-chevron {
  opacity: 0.7;
}

.household-list {
  border-radius: 12px;
  padding: 6px;
}

.household-list-title {
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
