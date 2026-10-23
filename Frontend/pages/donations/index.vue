<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: 'Ana Sayfa', to: '/' }, { text: 'Bağışlar' }]"
    />
  </div>

  <!-- Dönem seçici -->
  <PeriodSelector
    ref="periodSelectorRef"
    v-model="period"
    storage-key="abacasa.donations.period"
    :payment-methods="paymentMethods"
  />

  <!-- Özet -->
  <v-row class="mb-2">
    <v-col cols="12" md="4">
      <v-card variant="tonal" color="primary">
        <v-card-text>
          <div class="text-caption">Dönem toplamı</div>
          <div class="text-h5 font-weight-bold">{{ formatMoney(summary?.total ?? 0) }}</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" md="4">
      <v-card variant="tonal" color="info">
        <v-card-text>
          <div class="text-caption">Kayıt sayısı</div>
          <div class="text-h5 font-weight-bold">{{ summary?.count ?? 0 }}</div>
        </v-card-text>
      </v-card>
    </v-col>
    <!-- Emanetten dağıtılanlar dönem toplamına girmez; ayrı gösterilir -->
    <v-col cols="12" md="4">
      <v-card variant="tonal" color="secondary">
        <v-card-text>
          <div class="text-caption">Emanetten dağıtılan</div>
          <div class="text-h5 font-weight-bold">{{ formatMoney(summary?.fundDistributedTotal ?? 0) }}</div>
          <div class="text-caption">{{ summary?.fundDistributedCount ?? 0 }} kayıt</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-row class="mb-4">
    <v-col cols="12" md="6">
      <v-card variant="outlined">
        <v-card-title class="text-subtitle-1">Türe göre</v-card-title>
        <v-list density="compact">
          <v-list-item v-for="row in summary?.byKind ?? []" :key="row.kind">
            <template #title>{{ getKindLabel(row.kind) }}</template>
            <template #subtitle>{{ row.count }} kayıt</template>
            <template #append>{{ formatMoney(row.total) }}</template>
          </v-list-item>
          <v-list-item v-if="!summary?.byKind?.length">
            <template #title><span class="text-medium-emphasis">Kayıt yok</span></template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>
    <v-col cols="12" md="6">
      <v-card variant="outlined">
        <v-card-title class="text-subtitle-1">Verene göre</v-card-title>
        <v-list density="compact">
          <v-list-item v-for="row in summary?.byGiver ?? []" :key="row.personId ?? 'household'">
            <template #title>{{ row.personName ?? "Hane" }}</template>
            <template #subtitle>{{ row.count }} kayıt</template>
            <template #append>{{ formatMoney(row.total) }}</template>
          </v-list-item>
          <v-list-item v-if="!summary?.byGiver?.length">
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
    title="Bağışlar"
    toolbar-icon="mdi-hand-heart"
    search-placeholder="Kime veya notta ara"
    add-button-text="Yeni Bağış Ekle"
    :loading="isLoading"
    loading-text="Bağışlar yükleniyor..."
    empty-title="Bağış bulunamadı"
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

    <template #cell-kind="{ value }">
      {{ getKindLabel(value) }}
    </template>

    <template #cell-recipient="{ item, value }">
      {{ value }}
      <v-chip v-if="item.fundId" size="x-small" variant="tonal" color="secondary" class="ml-1">
        Emanet: {{ fundFrom(item.fundLabel) }}
      </v-chip>
    </template>

    <template #cell-giverPersonName="{ value }">
      {{ value || "Hane" }}
    </template>

    <template #cell-amount="{ value }">
      <span class="font-weight-medium">{{ formatMoney(value) }}</span>
    </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? 'Bağışı Düzenle' : 'Yeni Bağış Ekle'"
    :subtitle="isEditMode ? 'Bağış bilgilerini güncelleyin' : 'Yeni bağış bilgilerini girin'"
    icon="mdi-hand-heart"
    :default-width="600"
    :min-width="400"
  >
    <DonationForm
      :donation="selectedItem"
      :payment-methods="paymentMethods"
      :people="people"
      :funds="funds"
      :loading="isLoading"
      @submit="handleSubmit"
      @cancel="closeCreateDialog"
    />
  </ResizableDrawer>

  <!-- Confirm Delete Dialog -->
  <ConfirmDialog
    v-model="dialogs.delete"
    title="Bağışı Sil"
    :message="`${formatDisplayDate(itemToDelete?.date)} tarihli ${formatMoney(itemToDelete?.amount)} tutarındaki bağışı silmek istediğinizden emin misiniz?`"
    type="error"
    confirm-text="Sil"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="closeDeleteDialog"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import type { DonationFund, DonationKind, DonationSummary, PaymentMethod } from "~/types";
import BaseDataTable from "~/components/UI/BaseDataTable.vue";
import DonationForm from "~/components/Donations/DonationForm.vue";
import ResizableDrawer from "~/components/UI/ResizableDrawer.vue";
import ConfirmDialog from "~/components/UI/ConfirmDialog.vue";
import PeriodSelector from "~/components/Budget/PeriodSelector.vue";
import { formatDisplayDate, monthRange, todayIso, type Period } from "~/utils/period";

//#region Page Metadata
definePageMeta({
  title: "Bağışlar",
  requiresAuth: true,
  middleware: ["permission"],
  permissions: ["Donations.Read"],
});

useHead({
  title: "Bağışlar",
});
//#endregion

//#region DataTable Columns
const tableColumns = [
  { label: "Tarih", key: "date", sortable: false, width: "120px" },
  { label: "Kime", key: "recipient", sortable: false, width: "200px" },
  { label: "Tür", key: "kind", sortable: false, width: "120px" },
  { label: "Veren", key: "giverPersonName", sortable: false, width: "140px" },
  { label: "Ödeme aracı", key: "paymentMethodName", sortable: false, width: "160px" },
  { label: "Tutar", key: "amount", sortable: false, width: "140px" },
  { label: "Not", key: "note", sortable: false, width: "220px" },
];
//#endregion

//#region Composables
const { formatMoney } = useMoney();
const { getPaymentMethods } = usePaymentMethods();
const { getPeople } = usePeople();
const { hasPermission } = useAuth();
const { getFunds } = useDonationFunds();
const {
  getKindLabel,
  kindOptions,
  getDonations,
  getDonationSummary,
  createDonation,
  updateDonation,
  deleteDonation,
} = useDonations();
//#endregion

//#region Tanım listeleri (form ve dönem seçici için)
const paymentMethods = ref<PaymentMethod[]>([]);
const people = ref<{ id: number; name: string }[]>([]);
const funds = ref<DonationFund[]>([]);

// Formdaki "Emanetten" seçenekleri için; elde tutarları her kayıttan sonra değişir
const loadFunds = async () => {
  if (!hasPermission("DonationFunds.Read")) return;
  try {
    funds.value = (await getFunds(1, 1000, ""))?.data?.items || [];
  } catch {
    funds.value = [];
  }
};

// fundLabel "Kimden · Tür"; listede yalnızca kimden gösterilir
const fundFrom = (label?: string | null) => (label ?? "").split(" · ")[0];

const loadDefinitions = async () => {
  const [paymentMethodRes, peopleRes] = await Promise.all([
    getPaymentMethods(1, 1000, ""),
    getPeople(1, 1000, ""),
  ]);
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
const filterKind = ref<DonationKind | null>(null);
const summary = ref<DonationSummary | null>(null);

const currentFilters = () => ({
  startDate: period.value.start,
  endDate: period.value.end,
  kind: filterKind.value ?? undefined,
});

const loadSummary = async (searchTerm = "") => {
  try {
    summary.value = await getDonationSummary(searchTerm, currentFilters());
  } catch {
    summary.value = null;
  }
};

// Liste her yüklendiğinde (ekle/düzenle/sil/sayfa/arama) özet de aynı filtrelerle yenilenir
const loadDonations = async (page = 1, pageSize = 10, searchTerm = "") => {
  const [response] = await Promise.all([
    getDonations(page, pageSize, searchTerm, currentFilters()),
    loadSummary(searchTerm),
    loadFunds(),
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
  loadItems: loadDonations,
  createItem: createDonation,
  updateItem: updateDonation,
  deleteItem: deleteDonation,
  itemName: "bağış",
  serverSidePagination: true,
  initialPageSize: 10,
});

let ready = false;
watch([period, filterKind], () => {
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
