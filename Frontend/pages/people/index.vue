<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: 'Ana Sayfa', to: '/' }, { text: 'Kişiler' }]"
    />
  </div>

  <BaseDataTable
    :items="items"
    :columns="tableColumns"
    title="Kişiler"
    toolbar-icon="mdi-account-heart"
    search-placeholder="Kişi ara..."
    add-button-text="Yeni Kişi Ekle"
    :loading="isLoading"
    loading-text="Kişiler yükleniyor..."
    empty-title="Kişi bulunamadı"
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
        prepend-icon="mdi-account"
      >
        {{ value }}
      </v-chip>
    </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? 'Kişiyi Düzenle' : 'Yeni Kişi Ekle'"
    :subtitle="isEditMode ? 'Kişi bilgilerini güncelleyin' : 'Yeni kişi bilgilerini girin'"
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
    title="Kişiyi Sil"
    :message="`'${itemToDelete?.name}' kişisini silmek istediğinizden emin misiniz?`"
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

useHead({
  title: "Kişiler",
});
//#endregion

//#region DataTable Columns
const tableColumns = [
  {
    label: "Ad",
    key: "name",
    sortable: true,
    filterable: true,
    filterType: "text",
    width: "300px",
  },
  {
    label: "Yakınlık",
    key: "relation",
    sortable: true,
    filterable: true,
    filterType: "text",
    width: "200px",
  },
];
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
  itemName: "kişi",
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
