<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: t('common.home'), to: '/' }, { text: t('people.title') }]"
    />
  </div>

  <PageHero
    icon="mdi-account-heart-outline"
    :title="t('people.title')"
    :subtitle="t('people.subtitle')"
    :count="items.length"
  />

  <BaseDataTable
    :hide-page-header="true"
    :items="items"
    :columns="tableColumns"
    :title="t('people.title')"
    toolbar-icon="mdi-account-heart"
    :search-placeholder="t('people.searchPlaceholder')"
    :add-button-text="t('people.add')"
    :loading="isLoading"
    :loading-text="t('people.loading')"
    :empty-title="t('people.empty')"
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
        prepend-icon="mdi-account"
      >
        {{ value }}
      </UiChip>
    </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? t('people.editTitle') : t('people.add')"
    :subtitle="isEditMode ? t('people.editSubtitle') : t('people.createSubtitle')"
    icon="mdi-account-heart"
    :default-width="600"
    :min-width="400"
  >
    <PersonForm
      :person="selectedItem"
      :loading="isLoading"
      @submit="handleSubmit"
      @cancel="closeCreateDialog"
    />
  </ResizableDrawer>

  <!-- Confirm Delete Dialog -->
  <ConfirmDialog
    v-model="dialogs.delete"
    :title="t('people.deleteTitle')"
    :message="t('people.deleteConfirm', { name: itemToDelete?.name })"
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
import PersonForm from "~/components/People/PersonForm.vue";
import ResizableDrawer from "~/components/UI/ResizableDrawer.vue";
import ConfirmDialog from "~/components/UI/ConfirmDialog.vue";

//#region Page Metadata
definePageMeta({
  title: "Kişiler",
  requiresAuth: true,
  middleware: ["permission"],
  permissions: ["People.Read"],
});

const { t } = useI18n();

useHead({
  title: computed(() => t("people.title")),
});
//#endregion

//#region DataTable Columns
const tableColumns = computed(() => [
  {
    label: t("people.columns.name"),
    key: "name",
    sortable: true,
    filterable: true,
    filterType: "text",
    width: "300px",
  },
  {
    label: t("people.columns.relation"),
    key: "relation",
    sortable: true,
    filterable: true,
    filterType: "text",
    width: "200px",
  },
]);
//#endregion

//#region Composables
const { getPeople, createPerson, updatePerson, deletePerson } = usePeople();

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
  loadItems: getPeople,
  createItem: createPerson,
  updateItem: updatePerson,
  deleteItem: deletePerson,
  itemName: () => t("people.itemName"),
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
