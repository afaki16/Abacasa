<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: 'Ana Sayfa', to: '/' }, { text: 'Haneler' }]"
    />
  </div>

  <PageHero
    icon="mdi-domain"
    title="Haneler"
    subtitle="Sistemdeki haneleri oluşturun, düzenleyin ve yönetin."
    :count="items.length"
  />

  <BaseDataTable
    :hide-page-header="true"
    :items="items"
    :columns="tableColumns"
    title="Haneler"
    toolbar-icon="mdi-domain"
    search-placeholder="Hane ara..."
    add-button-text="Yeni Hane Ekle"
    :loading="isLoading"
    loading-text="Haneler yükleniyor..."
    empty-title="Hane bulunamadı"
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
        {{ value ? "Aktif" : "Pasif" }}
      </UiChip>
    </template>

    <template #cell-userCount="{ value }">
      <UiChip size="small" variant="tonal" color="info">
        {{ value ?? 0 }} kullanıcı
      </UiChip>
    </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? 'Haneyi Düzenle' : 'Yeni Hane Ekle'"
    :subtitle="isEditMode ? 'Hane bilgilerini güncelleyin' : 'Sisteme yeni hane bilgilerini girin'"
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
    title="Haneyi Sil"
    :message="`'${itemToDelete?.name}' hanesini silmek istediğinizden emin misiniz?`"
    type="error"
    confirm-text="Sil"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="closeDeleteDialog"
  />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
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

useHead({
  title: "Haneler",
});
//#endregion

//#region DataTable Columns
const tableColumns = [
  {
    label: "Hane Adı",
    key: "name",
    sortable: true,
    filterable: true,
    filterType: "text",
    width: "250px",
  },
  {
    label: "Domain",
    key: "domain",
    sortable: true,
    filterable: true,
    filterType: "text",
    width: "200px",
  },
  {
    label: "İletişim E-postası",
    key: "contactEmail",
    sortable: true,
    filterable: true,
    filterType: "text",
    width: "250px",
  },
  {
    label: "Kullanıcı Sayısı",
    key: "userCount",
    sortable: true,
    width: "120px",
  },
  {
    label: "Durum",
    key: "isActive",
    sortable: true,
    filterable: true,
    filterType: "select",
    width: "100px",
  },
];
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
  itemName: "tenant",
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
