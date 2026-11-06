<template>
    <!-- Breadcrumb -->
    <div class="mb-6">
      <BreadCrumb :items="[
        { text: t('common.home'), to: '/' },
        { text: t('users.title') }
      ]" />
    </div>

  <PageHero
    icon="mdi-account-group-outline"
    :title="t('users.title')"
    :subtitle="t('users.subtitle')"
    :count="totalCount"
  />

  <BaseDataTable
    class="users-table"
    :hide-page-header="true"
      :items="items"
      :columns="tableColumns"
      :title="t('users.title')"
      toolbar-icon="mdi-account"
      :search-placeholder="t('users.searchPlaceholder')"
      :add-button-text="t('users.add')"
      :loading="isLoading"
      :loading-text="t('users.loading')"
      :empty-title="t('users.empty')"
      :show-add-button="true"
      :show-advanced-filters="true"
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
      @add="openCreateDialog"
      @view="openViewDialog"
      @edit="openEditDialog"
      @delete="openDeleteDialog"
      @search="handleSearch"
      @filter="handleFilter"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @refresh="refreshData"
    >
    <!-- For FullName -->
 <template #cell-fullName="{ item, value }">
  <div class="flex items-center gap-2">
    <UserAvatar
      :src="item.profileImageUrl"
      :initials="`${item.firstName?.charAt(0) ?? ''}${item.lastName?.charAt(0) ?? ''}`.toUpperCase()"
      :size="32"
    />
    <span class="font-medium">{{ value }}</span>
    <span v-if="item.username" class="opacity-75 text-xs">(@{{ item.username }})</span>
  </div>
</template>

<!-- For Status -->
  <template #cell-status="{ value }">
  <UiChip
    :color="getStatusBadge(value).color"
    size="small"
    variant="tonal"
  >
    {{ getStatusBadge(value).label }}
  </UiChip>
</template>

<!-- Haneler (yalnızca SuperAdmin, platform görünümü): kullanıcının canlı üyeliklerinin hane adları -->
  <template #cell-householdNames="{ value }">
    <div v-if="value?.length" class="household-pills">
      <span v-for="name in value" :key="name" class="household-pill">{{ name }}</span>
    </div>
    <span v-else class="text-on-surface-variant">—</span>
  </template>

  <!-- Henüz hiç giriş yapmamış kullanıcıya hesap davetini (şifre belirleme linki) yeniden gönder -->
  <template #row-actions="{ item }">
    <button
      v-if="canResendAccountInvitation(item)"
      class="action-button invite-button"
      :title="t('users.resendInvitation')"
      :disabled="resendingId === item.id"
      @click.stop="openResendDialog(item)"
    >
      <UiIcon :icon="resendingId === item.id ? 'mdi-loading' : 'mdi-email-arrow-right-outline'" :size="18" :class="{ 'animate-spin': resendingId === item.id }" />
    </button>
  </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? t('users.editTitle') : t('users.add')"
    :subtitle="isEditMode ? t('users.editSubtitle') : t('users.createSubtitle')"
    icon="mdi-account"
    :default-width="600"
    :min-width="400"
  >
    <UserForm
      :user="selectedItem"
      :roles="roles"
      :loading="isLoading"
      @submit="handleSubmit"
      @cancel="closeCreateDialog"
      @photo-changed="refreshData"
    />
  </ResizableDrawer>

  <!-- View Detail Drawer -->
  <ResizableDrawer
    v-model="dialogs.view"
    :title="t('users.detailTitle')"
    :subtitle="t('users.detailSubtitle')"
    icon="mdi-account-details-outline"
    :default-width="720"
    :min-width="520"
  >
    <UserDetail
      :user="selectedItem"
      @close="closeViewDialog"
      @edit="handleEditFromDetail"
    />
  </ResizableDrawer>

  <!-- Confirm Delete Dialog -->
  <ConfirmDialog
    v-model="dialogs.delete"
    :title="t('users.deleteTitle')"
    :message="t('users.deleteConfirm', { name: itemToDelete?.fullName || itemToDelete?.email })"
    type="error"
    :confirm-text="t('common.delete')"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="closeDeleteDialog"
  />

  <!-- Confirm Resend Account Invitation Dialog -->
  <ConfirmDialog
    v-model="resendDialog"
    :title="t('users.resendTitle')"
    :message="t('users.resendMessage', { email: itemToResend?.email })"
    type="info"
    :confirm-text="t('common.send')"
    :loading="!!resendingId"
    @confirm="confirmResend"
    @cancel="resendDialog = false"
  />

</template>

<script setup>
import { ref, onMounted } from 'vue'
import { UserStatus } from '~/types'
import { dateTimeFormat } from '~/utils/datesFormat.ts'
import BaseDataTable from '~/components/UI/BaseDataTable.vue'
import ResizableDrawer from '~/components/UI/ResizableDrawer.vue'
import UserForm from '~/components/Users/UserForm.vue'
import UserDetail from '~/components/Users/UserDetail.vue'
import ConfirmDialog from '~/components/UI/ConfirmDialog.vue'

//#region Page Metadata
definePageMeta({
  title: 'Kullanıcılar',
  requiresAuth: true,
  middleware: ['permission'],
  permissions: ['Users.Read']
})

const { t } = useI18n()

useHead({
  title: computed(() => t('users.title')),
})
//#endregion

//#region DataTable Columns
const authStore = useAuthStore()
const { selectedTenantId } = useTenantContext()

const statusFilterOptions = computed(() => [
  { value: UserStatus.Active, title: t('users.status.active') },
  { value: UserStatus.Inactive, title: t('users.status.inactive') },
  { value: UserStatus.Banned, title: t('users.status.banned') },
  { value: UserStatus.PendingVerification, title: t('users.status.pendingVerification') }
])

const statusBadge = {
  [UserStatus.Active]: { color: 'success', labelKey: 'users.status.active' },
  [UserStatus.Inactive]: { color: 'grey', labelKey: 'users.status.inactive' },
  [UserStatus.Banned]: { color: 'error', labelKey: 'users.status.banned' },
  [UserStatus.PendingVerification]: { color: 'warning', labelKey: 'users.status.pendingVerification' }
}
const getStatusBadge = (status) => {
  const badge = statusBadge[status] ?? { color: 'grey', labelKey: 'users.status.unknown' }
  return { color: badge.color, label: t(badge.labelKey) }
}

const tableColumns = computed(() => {
  const base = [
    {
      label: t('users.columns.fullName'),
      key: 'fullName',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '300px'
    },
    {
      label: t('users.columns.email'),
      key: 'email',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '300px'
    },
    {
      label: t('users.columns.status'),
      key: 'status',
      sortable: true,
      filterable: true,
      filterType: 'select',
      // Filtre backend'de uygulanır (?status=); seçenekler sabit, sayfadaki değerlerden türetilmez
      filterOptions: statusFilterOptions.value,
      width: '300px'
    },
    {
      label: t('users.columns.lastLogin'),
      key: 'lastLoginDate',
      sortable: true,
      filterable: false,
      width: '300px',
      formatter: dateTimeFormat
    }
  ]
  // Platform görünümünde SuperAdmin kullanıcının üye olduğu haneleri görür; üst bardan bir hane
  // seçiliyse liste zaten o hanenin üyeleri olduğundan sütun gizlenir.
  if (authStore.hasRole('SuperAdmin') && !selectedTenantId.value) {
    base.splice(2, 0, {
      label: t('users.columns.households'),
      key: 'householdNames',
      sortable: false,
      filterable: false,
      width: '220px'
    })
  }
  return base
})
//#endregion

//#region Composables
const { getUsers, createUser, updateUser, deleteUser, resendAccountInvitation } = useUsers()
const { getRoles } = useRoles()

// SSR: İlk sayfa verisi sunucuda yüklenir
const { data: usersData } = await useAsyncData(
  'users-initial',
  () => getUsers(1, 10, ''),
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
  closeViewDialog,
  closeDeleteDialog,
  handleSubmit,
  confirmDelete,
  handleSearch,
  handleFilter,
  handlePageChange,
  handlePageSizeChange,
  refreshData,
  loadItemsData
} = useCrudOperations({
  loadItems: getUsers,
  createItem: createUser,
  updateItem: updateUser,
  deleteItem: deleteUser,
  itemName: () => t('users.itemName'),
  serverSidePagination: true,
  initialPageSize: 10,
  initialData: usersData
})

//#endregion

//#region Additional Data
const roles = ref([])

const loadRoles = async () => {
  try {
    const response = await getRoles(1, 1000, '')
    roles.value = response?.data?.items || []
  } catch (error) {
    console.error('Error loading roles:', error)
    roles.value = []
  }
}

const handleEditFromDetail = (user) => {
  closeViewDialog()
  openEditDialog(user)
}

// Backend ile aynı kural: hiç giriş yapmamış ve e-postasını doğrulamamış kullanıcı; düğme users.update iznine bağlı
const canResendAccountInvitation = (user) =>
  authStore.hasPermission('Users.Update') && !user.lastLoginDate && !user.emailConfirmed

const toast = useToast()
const resendDialog = ref(false)
const itemToResend = ref(null)
const resendingId = ref(null)

const openResendDialog = (user) => {
  itemToResend.value = user
  resendDialog.value = true
}

const confirmResend = async () => {
  if (!itemToResend.value) return
  resendingId.value = itemToResend.value.id
  try {
    await resendAccountInvitation(String(itemToResend.value.id))
    toast.success(t('users.invitationSent'))
    resendDialog.value = false
  } catch (error) {
    toast.showApiError(error, t('users.invitationFailed'))
  } finally {
    resendingId.value = null
  }
}
//#endregion

//#region Lifecycle
onMounted(async () => {
  await loadRoles()
  // SSR verisi yoksa (client-side navigation) ilk yükleme
  if (!usersData.value) {
    await loadItemsData(1, 10, '')
  }
})
//#endregion
</script>

<style scoped>
/* SuperAdmin platform görünümünde Haneler sütunuyla 6 sütun 1366px ekrana sığsın diye hücre yan boşlukları daraltıldı */
@media (min-width: 641px) {
  .users-table :deep(th),
  .users-table :deep(td) {
    padding-left: 16px;
    padding-right: 16px;
  }
}

.household-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.household-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 500;
  background: rgb(var(--color-primary) / 0.08);
  color: rgb(var(--color-primary));
}

/* Slot içeriği bu sayfanın scope'unda render edilir; BaseDataTable'ın buton stilleri uygulanmaz */
.invite-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  color: rgb(var(--color-primary));
  transition: all 0.2s ease;
}
.invite-button:hover:not(:disabled) {
  background: rgb(var(--color-primary) / 0.06);
  transform: translateY(-1px);
}
.invite-button:disabled {
  opacity: 0.6;
  cursor: wait;
}
</style>
