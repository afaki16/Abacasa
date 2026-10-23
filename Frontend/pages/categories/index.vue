<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: 'Ana Sayfa', to: '/' }, { text: 'Kategoriler' }]"
    />
  </div>

  <BaseDataTable
    :items="items"
    :columns="tableColumns"
    title="Kategoriler"
    toolbar-icon="mdi-shape"
    search-placeholder="Kategori ara..."
    add-button-text="Yeni Kategori Ekle"
    :loading="isLoading"
    loading-text="Kategoriler yükleniyor..."
    empty-title="Kategori bulunamadı"
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
      <v-chip
        color="primary"
        variant="tonal"
        size="default"
        prepend-icon="mdi-shape"
      >
        {{ value }}
      </v-chip>
    </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'"
    :subtitle="isEditMode ? 'Kategori bilgilerini güncelleyin' : 'Yeni kategori bilgilerini girin'"
    icon="mdi-shape"
    :default-width="600"
    :min-width="400"
  >
    <CategoryForm
      :category="selectedItem"
      :loading="isLoading"
      @submit="handleSubmit"
      @cancel="closeCreateDialog"
    />
  </ResizableDrawer>

  <!-- Confirm Delete Dialog -->
  <ConfirmDialog
    v-model="dialogs.delete"
    title="Kategoriyi Sil"
    :message="`'${itemToDelete?.name}' kategorisini silmek istediğinizden emin misiniz?`"
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
import CategoryForm from "~/components/Categories/CategoryForm.vue";
import ResizableDrawer from "~/components/UI/ResizableDrawer.vue";
import ConfirmDialog from "~/components/UI/ConfirmDialog.vue";

//#region Page Metadata
definePageMeta({
  title: "Kategoriler",
  requiresAuth: true,
  middleware: ["permission"],
  permissions: ["Categories.Read"],
});

useHead({
  title: "Kategoriler",
});
//#endregion

//#region DataTable Columns
const tableColumns = [
  {
    label: "Kategori Adı",
    key: "name",
    sortable: true,
    filterable: true,
    filterType: "text",
    width: "300px",
  },
];
//#endregion

//#region Composables
const { getCategories, createCategory, updateCategory, deleteCategory } = useCategories();

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
  loadItems: getCategories,
  createItem: createCategory,
  updateItem: updateCategory,
  deleteItem: deleteCategory,
  itemName: "kategori",
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
