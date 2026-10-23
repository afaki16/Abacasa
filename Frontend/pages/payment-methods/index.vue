<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: 'Ana Sayfa', to: '/' }, { text: 'Ödeme araçları' }]"
    />
  </div>

  <BaseDataTable
    :items="items"
    :columns="tableColumns"
    title="Ödeme araçları"
    toolbar-icon="mdi-credit-card-multiple"
    search-placeholder="Ödeme aracı ara..."
    add-button-text="Yeni Ödeme Aracı Ekle"
    :loading="isLoading"
    loading-text="Ödeme araçları yükleniyor..."
    empty-title="Ödeme aracı bulunamadı"
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
        prepend-icon="mdi-credit-card-outline"
      >
        {{ value }}
      </v-chip>
    </template>

    <template #cell-type="{ value }">
      {{ getTypeLabel(value) }}
    </template>

    <template #cell-ownerPersonName="{ value }">
      {{ value || "Hane" }}
    </template>

    <template #cell-isActive="{ value }">
      <v-chip :color="value ? 'success' : 'error'" size="small" variant="tonal">
        {{ value ? "Aktif" : "Pasif" }}
      </v-chip>
    </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? 'Ödeme Aracını Düzenle' : 'Yeni Ödeme Aracı Ekle'"
    :subtitle="isEditMode ? 'Ödeme aracı bilgilerini güncelleyin' : 'Yeni ödeme aracı bilgilerini girin'"
    icon="mdi-credit-card-multiple"
    :default-width="600"
    :min-width="400"
  >
    <PaymentMethodForm
      :payment-method="selectedItem"
      :people="people"
      :loading="isLoading"
      @submit="handleSubmit"
      @cancel="closeCreateDialog"
    />
  </ResizableDrawer>

  <!-- Confirm Delete Dialog -->
  <ConfirmDialog
    v-model="dialogs.delete"
    title="Ödeme Aracını Sil"
    :message="`'${itemToDelete?.name}' ödeme aracını silmek istediğinizden emin misiniz?`"
    type="error"
    confirm-text="Sil"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="closeDeleteDialog"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import BaseDataTable from "~/components/UI/BaseDataTable.vue";
import PaymentMethodForm from "~/components/PaymentMethods/PaymentMethodForm.vue";
import ResizableDrawer from "~/components/UI/ResizableDrawer.vue";
import ConfirmDialog from "~/components/UI/ConfirmDialog.vue";

//#region Page Metadata
definePageMeta({
  title: "Ödeme araçları",
  requiresAuth: true,
  middleware: ["permission"],
  permissions: ["PaymentMethods.Read"],
});

useHead({
  title: "Ödeme araçları",
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
    width: "250px",
  },
  {
    label: "Tür",
    key: "type",
    sortable: true,
    width: "150px",
  },
  {
    label: "Banka",
    key: "bank",
    sortable: true,
    filterable: true,
    filterType: "text",
    width: "180px",
  },
  {
    label: "Sahibi",
    key: "ownerPersonName",
    sortable: true,
    width: "180px",
  },
  {
    label: "Kesim günü",
    key: "statementDay",
    sortable: true,
    width: "120px",
  },
  {
    label: "Aktif",
    key: "isActive",
    sortable: true,
    width: "100px",
  },
];
//#endregion

//#region Composables
const {
  getTypeLabel,
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} = usePaymentMethods();

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
  loadItems: getPaymentMethods,
  createItem: createPaymentMethod,
  updateItem: updatePaymentMethod,
  deleteItem: deletePaymentMethod,
  itemName: "ödeme aracı",
  serverSidePagination: false,
  initialPageSize: 10,
});
//#endregion

//#region Additional Data (Sahibi seçimi için kişiler)
const { getPeople } = usePeople();
const people = ref<{ id: number; name: string }[]>([]);

const loadPeople = async () => {
  const res = await getPeople(1, 1000, "");
  people.value = res?.data?.items || [];
};
//#endregion

//#region Lifecycle
onMounted(async () => {
  await Promise.all([loadItemsData(), loadPeople()]);
});
//#endregion
</script>
