<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: t('common.home'), to: '/' }, { text: t('categories.title') }]"
    />
  </div>

  <PageHero
    icon="mdi-shape-outline"
    :title="t('categories.title')"
    :subtitle="t('categories.subtitle')"
    :count="items.length"
  />

  <BaseDataTable
    :hide-page-header="true"
    :items="items"
    :columns="tableColumns"
    :title="t('categories.title')"
    toolbar-icon="mdi-shape"
    :search-placeholder="t('categories.searchPlaceholder')"
    :add-button-text="t('categories.add')"
    :loading="isLoading"
    :loading-text="t('categories.loading')"
    :empty-title="t('categories.empty')"
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
      <UiChip
        color="primary"
        variant="tonal"
        size="default"
        prepend-icon="mdi-shape"
      >
        {{ value }}
      </UiChip>
    </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? t('categories.editTitle') : t('categories.add')"
    :subtitle="isEditMode ? t('categories.editSubtitle') : t('categories.createSubtitle')"
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
    :title="t('categories.deleteTitle')"
    :message="t('categories.deleteConfirm', { name: itemToDelete?.name })"
    type="error"
    :confirm-text="t('common.delete')"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="closeDeleteDialog"
  />
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue";
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

const { t } = useI18n();

useHead({
  title: computed(() => t("categories.title")),
});
//#endregion

//#region DataTable Columns
const tableColumns = computed(() => [
  {
    label: t("categories.columns.name"),
    key: "name",
    sortable: true,
    filterable: true,
    filterType: "text",
    width: "300px",
  },
]);
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
  itemName: () => t("categories.itemName"),
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
