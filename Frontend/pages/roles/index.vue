<template>
  <!-- Breadcrumb -->
    <div class="mb-6">
      <BreadCrumb :items="[
        { text: 'Ana Sayfa', to: '/' },
        { text: 'Roller' }
      ]" />
    </div>

     <!-- DataTable -->
     <BaseDataTable
      :items="items"
      :columns="tableColumns"
      title="Roller"
      toolbar-icon="mdi-shield-account"
      search-placeholder="Rol ara..."
      add-button-text="Yeni Rol Ekle"
      :loading="isLoading"
      loading-text="Roller yükleniyor..."
      empty-title="Roller bulunamadı"
      :show-add-button="true"
      :show-advanced-filters="false"
      :show-actions="true"
      :show-view-button="true"
      :show-edit-button="true"
      :show-delete-button="true"
      :show-pagination="true"
      :items-per-page="pageSize"
      :server-side-pagination="true"
      :server-total-count="totalCount"
      :server-current-page="currentPage"
      use-view-modal
      :can-edit-item="canModifyRole"
      :can-delete-item="canModifyRole"
      @add="openCreateDialog"
      @view="openViewDialog"
      @edit="openEditDialog"
      @delete="openDeleteDialog"
      @search="handleSearch"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @refresh="refreshData"
    >
       <!-- For RoleName -->
    <template #cell-name="{ value }">
  <v-chip
    color="primary"
    variant="tonal"
    size="default"
    prepend-icon="mdi-shield-account"
  >
    {{ value }}
  </v-chip>
</template>

    <!-- For isSystemRole -->
  <template #cell-isSystemRole="{ value }">
  <v-chip
    :color="value == true ? 'warning' : 'success '"
    size="small"
    variant="tonal"
  >
    {{ value == true ? 'Sistem' : 'Özel' }}
  </v-chip>
</template>

    <!-- For tenantId (SuperAdmin only) -->
  <template #cell-tenantId="{ value }">
    {{ value == null ? 'Ortak' : value }}
  </template>

     </BaseDataTable>

    <!-- Create/Edit Role Drawer -->
    <ResizableDrawer
      v-model="dialogs.create"
      :title="isEditMode ? 'Rolü Düzenle' : 'Yeni Rol Ekle'"
      :subtitle="isEditMode ? 'Rol bilgilerini ve yetkilerini düzenleyin' : 'Yeni rol ve yetkilerini tanımlayın'"
      icon="mdi-shield-account"
      :default-width="600"
      :min-width="400"
    >
      <RoleForm
        :role="selectedItem"
        :permissions="formPermissions"
        :loading="isLoading"
        @submit="handleSubmit"
        @cancel="closeCreateDialog"
      />
    </ResizableDrawer>

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      v-model="dialogs.delete"
      title="Rolü Sil"
      :message="`'${itemToDelete?.name}' rolünü silmek istediğinizden emin misiniz?`"
      type="error"
      confirm-text="Sil"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="closeDeleteDialog"
    />
  
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import RoleForm from '~/components/Roles/RoleForm.vue'
import BaseDataTable from '~/components/UI/BaseDataTable.vue'
import ResizableDrawer from '~/components/UI/ResizableDrawer.vue'
import ConfirmDialog from '~/components/UI/ConfirmDialog.vue'

//#region Page Metadata
definePageMeta({
  title: 'Roller',
  requiresAuth: true,
  permissions: ['roles.read']
})

useHead({
  title: 'Roller',
})
//#endregion

//#region DataTable Columns
const authStore = useAuthStore()
const isSuperAdmin = computed(() => authStore.hasRole('SuperAdmin'))

const tableColumns = computed(() => {
  const base = [
  {
    label: 'Rol Adı',
    key: 'name',
    sortable: true,
    filterable: true,
    filterType: 'text',
    width: '300px',
  },
  {
    label: 'Rol Tipi',
    key: 'isSystemRole',
    sortable: true,
    filterable: false,
    filterType: 'select',
    width: '300px'
  },
  {
    label: 'Rol Açıklaması',
    key: 'description',
    sortable: true,
    filterable: false,
    width: '300px'
  }
  ]
  if (isSuperAdmin.value) {
    base.splice(2, 0, {
      label: 'Tenant',
      key: 'tenantId',
      sortable: true,
      filterable: false,
      width: '150px'
    })
  }
  return base
})
//#endregion

//#region Composables
const { getRoles, createRole, updateRole, deleteRole } = useRoles()
const { getPermissions } = usePermissions()

// SSR: İlk sayfa verisi sunucuda yüklenir
const { data: rolesData } = await useAsyncData(
  'roles-initial',
  () => getRoles(1, 10, ''),
  { server: true }
)

const {
  items,
  isLoading,
  isDeleting,
  dialogs,
  selectedItem,
  itemToDelete,
  isEditMode,
  currentPage,
  pageSize,
  totalCount,
  openCreateDialog,
  openViewDialog,
  openEditDialog,
  openDeleteDialog,
  closeCreateDialog,
  closeDeleteDialog,
  handleSubmit,
  confirmDelete,
  handleSearch,
  handlePageChange,
  handlePageSizeChange,
  refreshData,
  loadItemsData
} = useCrudOperations({
  loadItems: getRoles,
  createItem: createRole,
  updateItem: updateRole,
  deleteItem: deleteRole,
  itemName: 'rol',
  serverSidePagination: true,
  initialPageSize: 10,
  initialData: rolesData
})

//#endregion

//#region Additional Data
const permissions = ref([])

const loadPermissions = async () => {
  try {
    const response = await getPermissions()
    permissions.value = response || []
  } catch (error) {
    console.error('Error loading permissions:', error)
    permissions.value = []
  }
}

// Same name mapping as authStore.setUser
const permissionName = (p) => p?.fullPermission ?? p?.name

// Non-SuperAdmin can only grant permissions they have; their own list comes with the user
// (GET /api/permissions needs Permissions.Read, which a role manager may not have).
// The user's list can repeat a permission shared by several roles, so dedupe by id.
const formPermissions = computed(() =>
  isSuperAdmin.value
    ? permissions.value
    : [...new Map((authStore.user?.permissions ?? []).map(p => [String(p.id), p])).values()]
)

// Mirrors backend rules: system and common roles are SuperAdmin-only,
// and a role with permissions beyond the caller's cannot be modified
const canModifyRole = (role) => {
  if (role.isSystemRole) return false
  if (isSuperAdmin.value) return true
  if (role.tenantId == null) return false
  return (role.permissions || []).every(p => authStore.permissions.includes(permissionName(p)))
}
//#endregion

//#region Lifecycle
onMounted(async () => {
  if (isSuperAdmin.value) {
    await loadPermissions()
  }
  if (!rolesData.value) {
    await loadItemsData(1, 10, '')
  }
})
//#endregion
</script>
