<template>
  <v-menu offset="8" location="bottom end">
    <template #activator="{ props: menuProps }">
      <button v-bind="menuProps" class="household-btn" type="button" :disabled="isBusy" aria-label="Hane seç">
        <v-icon size="small">mdi-home-outline</v-icon>
        <span class="household-name">{{ activeTenant?.name ?? 'Hane yok' }}</span>
        <v-chip v-if="activeTenant" size="x-small" :color="activeTenant.role === 'Admin' ? 'primary' : undefined" variant="tonal">
          {{ getRoleLabel(activeTenant.role) }}
        </v-chip>
        <v-icon size="x-small" class="household-chevron">mdi-chevron-down</v-icon>
      </button>
    </template>

    <v-list density="compact" class="household-list" min-width="240">
      <v-list-item
        v-for="m in memberships"
        :key="m.tenantId"
        :active="m.tenantId === activeTenant?.id"
        @click="select(m.tenantId)"
      >
        <v-list-item-title class="household-list-title">{{ m.name }}</v-list-item-title>
        <v-list-item-subtitle>{{ getRoleLabel(m.role) }}</v-list-item-subtitle>
        <template #append>
          <v-icon v-if="m.tenantId === activeTenant?.id" size="small" color="success">mdi-check</v-icon>
        </template>
      </v-list-item>

      <v-divider v-if="memberships.length" class="my-1" />

      <v-list-item prepend-icon="mdi-plus" @click="createDialog = true">
        <v-list-item-title class="household-list-title">Yeni hane oluştur</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>

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
