<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: 'Ana Sayfa', to: '/' }, { text: 'Emanetler' }]"
    />
  </div>

  <!-- Özet: açık emanetlerin toplamı -->
  <v-row class="mb-2">
    <v-col cols="12" md="4">
      <v-card variant="tonal" color="primary">
        <v-card-text>
          <div class="text-caption">Dağıtılacak kalan</div>
          <div class="text-h5 font-weight-bold">{{ formatMoney(openTotals.remaining) }}</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" md="4">
      <v-card variant="tonal" color="warning">
        <v-card-text>
          <div class="text-caption">Kullanımda</div>
          <div class="text-h5 font-weight-bold">{{ formatMoney(openTotals.inUse) }}</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" md="4">
      <v-card variant="tonal" color="success">
        <v-card-text>
          <div class="text-caption">Elde</div>
          <div class="text-h5 font-weight-bold">{{ formatMoney(openTotals.onHand) }}</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- Filtreler -->
  <v-row class="mb-2" dense>
    <v-col cols="12" md="4">
      <v-select
        v-model="filterStatus"
        :items="statusOptions"
        item-title="title"
        item-value="value"
        label="Durum"
        variant="outlined"
        density="compact"
        hide-details
      />
    </v-col>
  </v-row>

  <BaseDataTable
    :items="items"
    :columns="tableColumns"
    title="Emanetler"
    toolbar-icon="mdi-safe"
    search-placeholder="Kimden ya da notta ara"
    add-button-text="Yeni Emanet Ekle"
    :loading="isLoading"
    loading-text="Emanetler yükleniyor..."
    empty-title="Emanet bulunamadı"
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

    <template #cell-amount="{ value }">
      <span class="font-weight-medium">{{ formatMoney(value) }}</span>
    </template>

    <template #cell-distributed="{ value }">{{ formatMoney(value) }}</template>
    <template #cell-inUse="{ value }">{{ formatMoney(value) }}</template>
    <template #cell-remaining="{ value }">
      <span class="font-weight-medium">{{ formatMoney(value) }}</span>
    </template>
    <template #cell-onHand="{ value }">{{ formatMoney(value) }}</template>

    <template #cell-status="{ item }">
      <v-chip v-if="item.isClosed" size="small" color="success" variant="tonal">Bitti</v-chip>
      <v-chip v-else size="small" color="warning" variant="tonal">Açık</v-chip>
    </template>

    <template #actions="{ item }">
      <div class="d-flex align-center ga-1">
        <v-btn size="small" variant="tonal" color="primary" @click="openDistributions(item)">
          Dağıtımlar ({{ item.distributionCount }})
        </v-btn>
        <v-btn size="small" variant="tonal" @click="openMovements(item)">
          Hareketler ({{ item.movementCount }})
        </v-btn>
        <v-btn v-if="canUpdate" icon="mdi-pencil" size="small" variant="text" title="Düzenle" @click="openEditDialog(item)" />
        <v-btn v-if="canDelete" icon="mdi-delete" size="small" variant="text" color="error" title="Sil" @click="openDeleteDialog(item)" />
      </div>
    </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? 'Emaneti Düzenle' : 'Yeni Emanet Ekle'"
    :subtitle="isEditMode ? 'Emanet bilgilerini güncelleyin' : 'Dağıtılsın diye verilen para'"
    icon="mdi-safe"
    :default-width="600"
    :min-width="400"
  >
    <DonationFundForm
      :fund="selectedItem"
      :people="people"
      :loading="isLoading"
      @submit="handleSubmit"
      @cancel="closeCreateDialog"
    />
  </ResizableDrawer>

  <!-- Dağıtımlar ve hareketler -->
  <FundDistributionsDialog
    v-model="distributionsDialog"
    :fund="activeFund"
    :funds="allFunds"
    :payment-methods="paymentMethods"
    :people="people"
    @changed="refreshAll"
  />
  <FundMovementsDialog v-model="movementsDialog" :fund="activeFund" @changed="refreshAll" />

  <!-- Confirm Delete Dialog -->
  <ConfirmDialog
    v-model="dialogs.delete"
    title="Emaneti Sil"
    :message="`${itemToDelete?.fromPersonName ?? ''} emanetini (${formatMoney(itemToDelete?.amount ?? 0)}) silmek istediğinizden emin misiniz?`"
    type="error"
    confirm-text="Sil"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="closeDeleteDialog"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { DonationFund, PaymentMethod } from "~/types";
import BaseDataTable from "~/components/UI/BaseDataTable.vue";
import ResizableDrawer from "~/components/UI/ResizableDrawer.vue";
import ConfirmDialog from "~/components/UI/ConfirmDialog.vue";
import DonationFundForm from "~/components/DonationFunds/DonationFundForm.vue";
import FundDistributionsDialog from "~/components/DonationFunds/FundDistributionsDialog.vue";
import FundMovementsDialog from "~/components/DonationFunds/FundMovementsDialog.vue";
import { formatDisplayDate } from "~/utils/period";

//#region Page Metadata
definePageMeta({
  title: "Emanetler",
  requiresAuth: true,
  middleware: ["permission"],
  permissions: ["DonationFunds.Read"],
});

useHead({
  title: "Emanetler",
});
//#endregion

//#region DataTable Columns
const tableColumns = [
  { label: "Tarih", key: "date", sortable: false, width: "110px" },
  { label: "Kimden", key: "fromPersonName", sortable: false, width: "140px" },
  { label: "Tür", key: "kind", sortable: false, width: "90px" },
  { label: "Tutar", key: "amount", sortable: false, width: "130px" },
  { label: "Dağıtılan", key: "distributed", sortable: false, width: "130px" },
  { label: "Kullanımda", key: "inUse", sortable: false, width: "130px" },
  { label: "Kalan", key: "remaining", sortable: false, width: "130px" },
  { label: "Elde", key: "onHand", sortable: false, width: "130px" },
  { label: "Durum", key: "status", sortable: false, width: "90px" },
  { label: "Not", key: "note", sortable: false, width: "160px" },
];
//#endregion

//#region Composables
const { formatMoney } = useMoney();
const { hasPermission } = useAuth();
const { getPeople } = usePeople();
const { getPaymentMethods } = usePaymentMethods();
const { getKindLabel } = useDonations();
const { getFunds, createFund, updateFund, deleteFund } = useDonationFunds();
//#endregion

const canUpdate = computed(() => hasPermission("DonationFunds.Update"));
const canDelete = computed(() => hasPermission("DonationFunds.Delete"));

//#region Tanımlar ve tüm emanetler (kartlar, pencereler ve bağış formu için)
const people = ref<{ id: number; name: string }[]>([]);
const paymentMethods = ref<PaymentMethod[]>([]);
const allFunds = ref<DonationFund[]>([]);

const loadAllFunds = async () => {
  try {
    allFunds.value = (await getFunds(1, 1000, ""))?.data?.items || [];
  } catch {
    allFunds.value = [];
  }
};

// Kartlar açık emanetlerin toplamıdır
const openTotals = computed(() => {
  const open = allFunds.value.filter((f) => !f.isClosed);
  return {
    remaining: open.reduce((s, f) => s + f.remaining, 0),
    inUse: open.reduce((s, f) => s + f.inUse, 0),
    onHand: open.reduce((s, f) => s + f.onHand, 0),
  };
});
//#endregion

//#region Filtreler ve liste
const statusOptions = [
  { value: "open", title: "Açık" },
  { value: "closed", title: "Biten" },
  { value: "all", title: "Tümü" },
];
const filterStatus = ref<"open" | "closed" | "all">("open");

const currentFilters = () => ({
  isClosed: filterStatus.value === "all" ? undefined : filterStatus.value === "closed",
});

// Liste her yüklendiğinde (ekle/düzenle/sil/sayfa/arama) kartlar da yenilenir
const loadFunds = async (page = 1, pageSize = 10, searchTerm = "") => {
  const [response] = await Promise.all([getFunds(page, pageSize, searchTerm, currentFilters()), loadAllFunds()]);
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
  loadItems: loadFunds,
  createItem: createFund,
  updateItem: updateFund,
  deleteItem: deleteFund,
  itemName: "emanet",
  serverSidePagination: true,
  initialPageSize: 10,
});

let ready = false;
watch(filterStatus, () => {
  if (ready) loadItemsData(1, pageSize.value, searchTerm.value);
});

const refreshAll = () => loadItemsData(currentPage.value, pageSize.value, searchTerm.value);
//#endregion

//#region Dağıtımlar ve hareketler pencereleri
const distributionsDialog = ref(false);
const movementsDialog = ref(false);
const activeFundId = ref<number | null>(null);

// Her yenilemeden sonra güncel tutarlarla (emanet biten filtresine geçse de)
const activeFund = computed(() => allFunds.value.find((f) => f.id === activeFundId.value) ?? null);

const openDistributions = (fund: DonationFund) => {
  activeFundId.value = fund.id;
  distributionsDialog.value = true;
};

const openMovements = (fund: DonationFund) => {
  activeFundId.value = fund.id;
  movementsDialog.value = true;
};
//#endregion

//#region Lifecycle
onMounted(async () => {
  const [peopleRes, paymentMethodRes] = await Promise.all([getPeople(1, 1000, ""), getPaymentMethods(1, 1000, "")]);
  people.value = peopleRes?.data?.items || [];
  paymentMethods.value = paymentMethodRes?.data?.items || [];
  await loadItemsData(1, pageSize.value, "");
  ready = true;
});
//#endregion
</script>
