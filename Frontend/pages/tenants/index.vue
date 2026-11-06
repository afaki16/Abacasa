<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: t('common.home'), to: '/' }, { text: t('households.title') }]"
    />
  </div>

  <PageHero
    icon="mdi-domain"
    :title="t('households.title')"
    :subtitle="t('households.subtitle')"
    :count="items.length"
  />

  <BaseDataTable
    :hide-page-header="true"
    :items="items"
    :columns="tableColumns"
    :title="t('households.title')"
    toolbar-icon="mdi-domain"
    :search-placeholder="t('households.searchPlaceholder')"
    :add-button-text="t('households.add')"
    :loading="isLoading"
    :loading-text="t('households.loading')"
    :empty-title="t('households.empty')"
    :show-add-button="true"
    :show-advanced-filters="false"
    :show-actions="true"
    :show-view-button="false"
    :show-edit-button="true"
    :show-delete-button="true"
    :show-pagination="true"
    :items-per-page="pageSize"
    @add="openCreateDialog"
    @edit="openEditDialog"
    @delete="openDeleteDialog"
    @search="handleSearch"
    @refresh="refreshData"
  >
    <template #cell-name="{ value }">
      <span class="name-cell">
        <UiIcon icon="mdi-domain" :size="20" class="name-cell__icon" />
        <span>{{ value }}</span>
      </span>
    </template>

    <template #cell-isActive="{ value }">
      <UiChip :color="value ? 'success' : 'error'" size="small" variant="tonal">
        {{ value ? t('common.active') : t('common.inactive') }}
      </UiChip>
    </template>

    <template #cell-userCount="{ value }">
      <UiChip size="small" variant="tonal" color="info">
        {{ t('households.userCount', { count: value ?? 0 }, value ?? 0) }}
      </UiChip>
    </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? t('households.editTitle') : t('households.add')"
    :subtitle="isEditMode ? t('households.editSubtitle') : t('households.createSubtitle')"
    icon="mdi-domain"
    :default-width="600"
    :min-width="400"
  >
    <TenantForm
      :tenant="selectedItem"
      :loading="isLoading"
      @submit="handleSubmit"
      @cancel="closeCreateDialog"
    />
  </ResizableDrawer>

  <!-- Confirm Delete Dialog -->
  <ConfirmDialog
    v-model="dialogs.delete"
    :title="t('households.deleteTitle')"
    :message="t('households.deleteConfirm', { name: itemToDelete?.name })"
    type="error"
    :confirm-text="t('common.delete')"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="closeDeleteDialog"
  />
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import BaseDataTable from "~/components/UI/BaseDataTable.vue";
import TenantForm from "~/components/Tenants/TenantForm.vue";
import ResizableDrawer from "~/components/UI/ResizableDrawer.vue";
import ConfirmDialog from "~/components/UI/ConfirmDialog.vue";

//#region Page Metadata
definePageMeta({
  title: "Haneler",
  requiresAuth: true,
  middleware: ["permission"],
  roles: ["SuperAdmin"],
});

const { t } = useI18n();

useHead({
  title: computed(() => t("households.title")),
});
//#endregion

//#region DataTable Columns
const tableColumns = computed(() => [
  {
    label: t("households.columns.name"),
    key: "name",
    sortable: true,
    filterable: true,
    filterType: "text",
    width: "250px",
  },
  {
    label: t("households.columns.domain"),
    key: "domain",
    sortable: true,
    filterable: true,
    filterType: "text",
    width: "200px",
  },
  {
    label: t("households.columns.contactEmail"),
    key: "contactEmail",
    sortable: true,
    filterable: true,
    filterType: "text",
    width: "250px",
  },
  {
    label: t("households.columns.userCount"),
    key: "userCount",
    sortable: true,
    width: "120px",
  },
  {
    label: t("households.columns.status"),
    key: "isActive",
    sortable: true,
    filterable: true,
    filterType: "select",
    width: "100px",
  },
]);
//#endregion

//#region Composables
const { getTenants, createTenant, updateTenant, deleteTenant } = useTenants();

const {
  items,
  isLoading,
  isDeleting,
  dialogs,
  selectedItem,
  itemToDelete,
  isEditMode,
  pageSize,
  openCreateDialog,
  openEditDialog,
  openDeleteDialog,
  closeCreateDialog,
  closeDeleteDialog,
  handleSubmit,
  confirmDelete,
  handleSearch,
  refreshData,
  loadItemsData,
} = useCrudOperations({
  loadItems: getTenants,
  createItem: createTenant,
  updateItem: updateTenant,
  deleteItem: deleteTenant,
  itemName: () => t("households.itemName"),
  serverSidePagination: false,
  initialPageSize: 10,
});
//#endregion

//#region Lifecycle
onMounted(async () => {
  await loadItemsData();
});
//#endregion
</script>

<style scoped>
/* Ad hücresi: ikon + düz metin (Dernify) */
.name-cell { display: inline-flex; align-items: center; gap: 8px; font-weight: 500; }
.name-cell__icon { color: rgb(var(--color-on-surface-variant)); flex-shrink: 0; }
</style>
