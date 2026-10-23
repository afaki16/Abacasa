<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: 'Ana Sayfa', to: '/' }, { text: 'Harcamalar' }]"
    />
  </div>

  <!-- Dönem seçici -->
  <PeriodSelector
    ref="periodSelectorRef"
    v-model="period"
    storage-key="abacasa.expenses.period"
    :payment-methods="paymentMethods"
  />

  <!-- Özet -->
  <v-row class="mb-2">
    <v-col cols="12" md="4">
      <v-card variant="tonal" color="primary">
        <v-card-text>
          <div class="text-caption">Dönem toplamı (yemek kartı hariç)</div>
          <div class="text-h5 font-weight-bold">{{ formatMoney(summary?.total ?? 0) }}</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" md="4">
      <v-card variant="tonal" color="success">
        <v-card-text>
          <div class="text-caption">Yemek kartı</div>
          <div class="text-h5 font-weight-bold">{{ formatMoney(summary?.mealCardTotal ?? 0) }}</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" md="4">
      <v-card variant="tonal" color="info">
        <v-card-text>
          <div class="text-caption">İşlem sayısı</div>
          <div class="text-h5 font-weight-bold">{{ summary?.count ?? 0 }}</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-row class="mb-4">
    <v-col cols="12" md="6">
      <v-card variant="outlined">
        <v-card-title class="text-subtitle-1">Kategoriye göre</v-card-title>
        <v-list density="compact">
          <v-list-item v-for="row in summary?.byCategory ?? []" :key="row.categoryId">
            <template #title>{{ row.categoryName }}</template>
            <template #append>{{ formatMoney(row.total) }}</template>
          </v-list-item>
          <v-list-item v-if="!summary?.byCategory?.length">
            <template #title><span class="text-medium-emphasis">Kayıt yok</span></template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>
    <v-col cols="12" md="6">
      <v-card variant="outlined">
        <v-card-title class="text-subtitle-1">Ödeme aracına göre</v-card-title>
        <v-list density="compact">
          <v-list-item v-for="row in summary?.byPaymentMethod ?? []" :key="row.paymentMethodId">
            <template #title>{{ row.paymentMethodName }}</template>
            <template #subtitle>{{ getTypeLabel(row.type) }}</template>
            <template #append>{{ formatMoney(row.total) }}</template>
          </v-list-item>
          <v-list-item v-if="!summary?.byPaymentMethod?.length">
            <template #title><span class="text-medium-emphasis">Kayıt yok</span></template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>
  </v-row>

  <!-- Filtreler -->
  <v-row class="mb-2" dense>
    <v-col cols="12" md="4">
      <v-select
        v-model="filterCategoryId"
        :items="categories"
        item-title="name"
        item-value="id"
        label="Kategori"
        variant="outlined"
        density="compact"
        hide-details
        clearable
      />
    </v-col>
    <v-col cols="12" md="4">
      <v-select
        v-model="filterPaymentMethodId"
        :items="paymentMethods"
        item-title="name"
        item-value="id"
        label="Ödeme aracı"
        variant="outlined"
        density="compact"
        hide-details
        clearable
      />
    </v-col>
    <v-col cols="12" md="4">
      <v-select
        v-model="filterOwnerPersonId"
        :items="people"
        item-title="name"
        item-value="id"
        label="Kişi"
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
    title="Harcamalar"
    toolbar-icon="mdi-cash-minus"
    search-placeholder="Açıklamada ara..."
    add-button-text="Yeni Harcama Ekle"
    :loading="isLoading"
    loading-text="Harcamalar yükleniyor..."
    empty-title="Harcama bulunamadı"
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
    <template #cell-date="{ value }">
      {{ formatDisplayDate(value) }}
    </template>

    <template #cell-ownerPersonName="{ value }">
      {{ value || "Hane" }}
    </template>

    <template #cell-amount="{ value }">
      <span class="font-weight-medium">{{ formatMoney(value) }}</span>
    </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? 'Harcamayı Düzenle' : 'Yeni Harcama Ekle'"
    :subtitle="isEditMode ? 'Harcama bilgilerini güncelleyin' : 'Yeni harcama bilgilerini girin'"
    icon="mdi-cash-minus"
    :default-width="600"
    :min-width="400"
  >
    <ExpenseForm
      :expense="selectedItem"
      :categories="categories"
      :payment-methods="paymentMethods"
      :people="people"
      :loading="isLoading"
      @submit="handleSubmit"
      @cancel="closeCreateDialog"
    />
  </ResizableDrawer>

  <!-- Confirm Delete Dialog -->
  <ConfirmDialog
    v-model="dialogs.delete"
    title="Harcamayı Sil"
    :message="`${formatDisplayDate(itemToDelete?.date)} tarihli ${formatMoney(itemToDelete?.amount)} tutarındaki harcamayı silmek istediğinizden emin misiniz?`"
    type="error"
    confirm-text="Sil"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="closeDeleteDialog"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import type { ExpenseSummary, PaymentMethod } from "~/types";
import BaseDataTable from "~/components/UI/BaseDataTable.vue";
import ExpenseForm from "~/components/Expenses/ExpenseForm.vue";
import ResizableDrawer from "~/components/UI/ResizableDrawer.vue";
import ConfirmDialog from "~/components/UI/ConfirmDialog.vue";
import PeriodSelector from "~/components/Budget/PeriodSelector.vue";
import { formatDisplayDate, monthRange, todayIso, type Period } from "~/utils/period";

//#region Page Metadata
definePageMeta({
  title: "Harcamalar",
  requiresAuth: true,
  middleware: ["permission"],
  permissions: ["Expenses.Read"],
});

useHead({
  title: "Harcamalar",
});
//#endregion

//#region DataTable Columns
const tableColumns = [
  { label: "Tarih", key: "date", sortable: false, width: "120px" },
  { label: "Açıklama", key: "description", sortable: false, width: "250px" },
  { label: "Kategori", key: "categoryName", sortable: false, width: "160px" },
  { label: "Ödeme aracı", key: "paymentMethodName", sortable: false, width: "160px" },
  { label: "Kişi", key: "ownerPersonName", sortable: false, width: "140px" },
  { label: "Tutar", key: "amount", sortable: false, width: "140px" },
];
//#endregion

//#region Composables
const { formatMoney } = useMoney();
const { getTypeLabel, getPaymentMethods } = usePaymentMethods();
const { getCategories } = useCategories();
const { getPeople } = usePeople();
const { getExpenses, getExpenseSummary, createExpense, updateExpense, deleteExpense } = useExpenses();
//#endregion

//#region Tanım listeleri (form ve filtreler için)
const categories = ref<{ id: number; name: string }[]>([]);
const paymentMethods = ref<PaymentMethod[]>([]);
const people = ref<{ id: number; name: string }[]>([]);

const loadDefinitions = async () => {
  const [categoryRes, paymentMethodRes, peopleRes] = await Promise.all([
    getCategories(1, 1000, ""),
    getPaymentMethods(1, 1000, ""),
    getPeople(1, 1000, ""),
  ]);
  categories.value = categoryRes?.data?.items || [];
  paymentMethods.value = paymentMethodRes?.data?.items || [];
  people.value = peopleRes?.data?.items || [];
};
//#endregion

//#region Dönem seçici
const periodSelectorRef = ref<InstanceType<typeof PeriodSelector> | null>(null);
const [todayYear, todayMonth] = todayIso().split("-").map(Number);
const period = ref<Period>(monthRange(todayYear, todayMonth));
//#endregion

//#region Filtreler, liste ve özet
const filterCategoryId = ref<number | null>(null);
const filterPaymentMethodId = ref<number | null>(null);
const filterOwnerPersonId = ref<number | null>(null);
const summary = ref<ExpenseSummary | null>(null);

const currentFilters = () => ({
  startDate: period.value.start,
  endDate: period.value.end,
  categoryId: filterCategoryId.value ?? undefined,
  paymentMethodId: filterPaymentMethodId.value ?? undefined,
  ownerPersonId: filterOwnerPersonId.value ?? undefined,
});

const loadSummary = async (searchTerm = "") => {
  try {
    summary.value = await getExpenseSummary(searchTerm, currentFilters());
  } catch {
    summary.value = null;
  }
};

// Liste her yüklendiğinde (ekle/düzenle/sil/sayfa/arama) özet de aynı filtrelerle yenilenir
const loadExpenses = async (page = 1, pageSize = 10, searchTerm = "") => {
  const [response] = await Promise.all([
    getExpenses(page, pageSize, searchTerm, currentFilters()),
    loadSummary(searchTerm),
  ]);
  return response;
};

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
  loadItems: loadExpenses,
  createItem: createExpense,
  updateItem: updateExpense,
  deleteItem: deleteExpense,
  itemName: "harcama",
  serverSidePagination: true,
  initialPageSize: 10,
});

let ready = false;
watch([period, filterCategoryId, filterPaymentMethodId, filterOwnerPersonId], () => {
  if (ready) loadItemsData(1, pageSize.value, searchTerm.value);
});
//#endregion

//#region Lifecycle
onMounted(async () => {
  await loadDefinitions();

  // Son seçimi geri yükle; kart artık yoksa takvim ayına dön
  await periodSelectorRef.value?.restore();

  // İlk yükleme; watcher'lar bu sırada tetiklenirse ikinci kez yüklemesin
  await loadItemsData(1, pageSize.value, "");
  ready = true;
});
//#endregion
</script>
