<template>
  <!-- Filtreler -->
  <v-row class="mb-2" dense>
    <v-col cols="12" md="4">
      <v-select
        v-model="filterKind"
        :items="kindOptions"
        item-title="title"
        item-value="value"
        label="Tür"
        variant="outlined"
        density="compact"
        hide-details
        clearable
      />
    </v-col>
  </v-row>

  <BaseDataTable
    :items="items"
    :columns="tableColumns"
    title="Planlar"
    toolbar-icon="mdi-calendar-sync"
    search-placeholder="Ad veya kimde ara..."
    add-button-text="Yeni Plan Ekle"
    :loading="isLoading"
    loading-text="Planlar yükleniyor..."
    empty-title="Plan bulunamadı"
    :show-add-button="true"
    :show-advanced-filters="false"
    :show-actions="true"
    :show-view-button="false"
    :show-edit-button="true"
    :show-delete-button="true"
    :show-pagination="true"
    :items-per-page="pageSize"
    :server-side-pagination="true"
    :server-total-count="totalCount"
    :server-current-page="currentPage"
    @add="openCreateDialog"
    @edit="openEditDialog"
    @delete="openDeleteDialog"
    @search="handleSearch"
    @page-change="handlePageChange"
    @page-size-change="handlePageSizeChange"
    @refresh="refreshData"
  >
    <template #cell-kind="{ value }">
      {{ getKindLabel(value) }}
    </template>

    <template #cell-expectedAmount="{ value }">
      <span v-if="value === null || value === undefined">—</span>
      <span v-else class="font-weight-medium">{{ formatMoney(value) }}</span>
    </template>

    <template #cell-categoryOrRecipient="{ item }">
      {{ item.kind === RecurringPaymentKind.Donation ? item.recipient : item.categoryName }}
    </template>

    <template #cell-ownerPersonName="{ value }">
      {{ value || "Hane" }}
    </template>

    <template #cell-isActive="{ value }">
      <v-chip :color="value ? 'success' : 'default'" size="small" variant="tonal">
        {{ value ? "Aktif" : "Pasif" }}
      </v-chip>
    </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? 'Planı Düzenle' : 'Yeni Plan Ekle'"
    :subtitle="isEditMode ? 'Plan bilgilerini güncelleyin' : 'Yeni sabit ödeme planı bilgilerini girin'"
    icon="mdi-calendar-sync"
    :default-width="650"
    :min-width="400"
  >
    <RecurringPaymentForm
      :recurring-payment="selectedItem"
      :payment-methods="paymentMethods"
      :categories="categories"
      :people="people"
      :loading="isLoading"
      @submit="handleSubmit"
      @cancel="closeCreateDialog"
    />
  </ResizableDrawer>

  <!-- Confirm Delete Dialog -->
  <ConfirmDialog
    v-model="dialogs.delete"
    title="Planı Sil"
    :message="`${itemToDelete?.name} planını silmek istediğinizden emin misiniz?`"
    type="error"
    confirm-text="Sil"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="closeDeleteDialog"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import type { PaymentMethod } from "~/types";
import { RecurringPaymentKind } from "~/types";
import BaseDataTable from "~/components/UI/BaseDataTable.vue";
import ResizableDrawer from "~/components/UI/ResizableDrawer.vue";
import ConfirmDialog from "~/components/UI/ConfirmDialog.vue";
import RecurringPaymentForm from "~/components/RecurringPayments/RecurringPaymentForm.vue";

//#region DataTable Columns
const tableColumns = [
  { label: "Ad", key: "name", sortable: false, width: "200px" },
  { label: "Tür", key: "kind", sortable: false, width: "110px" },
  { label: "Beklenen tutar", key: "expectedAmount", sortable: false, width: "140px" },
  { label: "Vade günü", key: "dueDay", sortable: false, width: "100px" },
  { label: "Ödeme aracı", key: "paymentMethodName", sortable: false, width: "150px" },
  { label: "Kategori / Kime", key: "categoryOrRecipient", sortable: false, width: "160px" },
  { label: "Kişi", key: "ownerPersonName", sortable: false, width: "130px" },
  { label: "Aktif", key: "isActive", sortable: false, width: "90px" },
];
//#endregion

//#region Composables
const { formatMoney } = useMoney();
const { getPaymentMethods } = usePaymentMethods();
const { getCategories } = useCategories();
const { getPeople } = usePeople();
const {
  getKindLabel,
  kindOptions,
  getRecurringPayments,
  createRecurringPayment,
  updateRecurringPayment,
  deleteRecurringPayment,
} = useRecurringPayments();
//#endregion

//#region Tanım listeleri (form için)
const paymentMethods = ref<PaymentMethod[]>([]);
const categories = ref<{ id: number; name: string }[]>([]);
const people = ref<{ id: number; name: string }[]>([]);

const loadDefinitions = async () => {
  const [paymentMethodRes, categoryRes, peopleRes] = await Promise.all([
    getPaymentMethods(1, 1000, ""),
    getCategories(1, 1000, ""),
    getPeople(1, 1000, ""),
  ]);
  paymentMethods.value = paymentMethodRes?.data?.items || [];
  categories.value = categoryRes?.data?.items || [];
  people.value = peopleRes?.data?.items || [];
};
//#endregion

//#region Filtreler ve liste
const filterKind = ref<RecurringPaymentKind | null>(null);

const loadPlans = (page = 1, pageSize = 10, searchTerm = "") =>
  getRecurringPayments(page, pageSize, searchTerm, { kind: filterKind.value ?? undefined });

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
  searchTerm,
  openCreateDialog,
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
  loadItemsData,
} = useCrudOperations({
  loadItems: loadPlans,
  createItem: createRecurringPayment,
  updateItem: updateRecurringPayment,
  deleteItem: deleteRecurringPayment,
  itemName: "plan",
  serverSidePagination: true,
  initialPageSize: 10,
});

watch(filterKind, () => loadItemsData(1, pageSize.value, searchTerm.value));
//#endregion

//#region Lifecycle
onMounted(async () => {
  await loadDefinitions();
  await loadItemsData(1, pageSize.value, "");
});
//#endregion
</script>
