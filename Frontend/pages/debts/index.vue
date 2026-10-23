<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: 'Ana Sayfa', to: '/' }, { text: 'Borçlar' }]"
    />
  </div>

  <!-- Özet -->
  <v-row class="mb-2">
    <v-col cols="12" sm="6" md="3">
      <v-card variant="tonal" color="primary" class="fill-height">
        <v-card-text>
          <div class="text-caption">Açık borç (TL karşılığı)</div>
          <div class="text-h5 font-weight-bold">{{ usdRateMissing ? "—" : formatMoney(summary?.openTotalInTry ?? 0) }}</div>
          <!-- Yalnızca açık dolar borcu varken kur girilmemişse TL karşılığı hesaplanamaz -->
          <div v-if="usdRateMissing" class="text-caption">Kur girilmemiş</div>
          <div v-else class="text-caption">{{ summary?.openCount ?? 0 }} açık borç</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" sm="6" md="3">
      <v-card variant="tonal" color="info" class="fill-height">
        <v-card-text>
          <div class="text-caption">TL borç</div>
          <div class="text-h5 font-weight-bold">{{ formatMoney(summary?.openTry ?? 0) }}</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" sm="6" md="3">
      <v-card variant="tonal" color="info" class="fill-height">
        <v-card-text>
          <div class="text-caption">Dolar borç</div>
          <div class="text-h5 font-weight-bold">{{ formatMoney(summary?.openUsd ?? 0, "USD") }}</div>
          <div class="text-caption">≈ {{ usdRateMissing ? "—" : formatMoney(summary?.openUsdInTry ?? 0) }}</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" sm="6" md="3">
      <v-card variant="tonal" color="secondary" class="fill-height">
        <v-card-text>
          <div class="d-flex align-center">
            <div class="text-caption">Güncel kur</div>
            <v-spacer />
            <v-btn
              v-if="canEditRate"
              size="x-small"
              variant="tonal"
              @click="rateDialog = true"
            >
              Güncelle
            </v-btn>
          </div>
          <div class="text-h5 font-weight-bold">
            {{ summary?.usdRate ? formatMoney(summary.usdRate.rate) : "—" }}
          </div>
          <div class="text-caption">
            {{ summary?.usdRate ? formatDisplayDate(summary.usdRate.date) : "Kur girilmemiş" }}
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- Alacaklıya göre -->
  <v-row class="mb-4">
    <v-col cols="12">
      <v-card variant="outlined">
        <v-card-title class="text-subtitle-1">Alacaklıya göre</v-card-title>
        <v-table density="compact">
          <thead>
            <tr>
              <th>Alacaklı</th>
              <th class="text-right">TL açık</th>
              <th class="text-right">USD açık</th>
              <th class="text-right">Toplam TL</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in summary?.byCreditor ?? []" :key="row.personId">
              <td>{{ row.name }}</td>
              <td class="text-right">{{ formatMoney(row.openTry) }}</td>
              <td class="text-right">{{ formatMoney(row.openUsd, "USD") }}</td>
              <td class="text-right font-weight-medium">{{ formatMoney(row.totalInTry) }}</td>
            </tr>
            <tr v-if="!summary?.byCreditor?.length">
              <td colspan="4" class="text-medium-emphasis">Açık borç yok</td>
            </tr>
          </tbody>
        </v-table>
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
    <v-col cols="12" md="4">
      <v-select
        v-model="filterCreditor"
        :items="people"
        item-title="name"
        item-value="id"
        label="Alacaklı"
        variant="outlined"
        density="compact"
        hide-details
        clearable
      />
    </v-col>
    <v-col cols="12" md="4">
      <v-select
        v-model="filterCurrency"
        :items="currencyOptions"
        item-title="title"
        item-value="value"
        label="Para birimi"
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
    title="Borçlar"
    toolbar-icon="mdi-hand-coin"
    search-placeholder="Notta ara"
    add-button-text="Yeni Borç Ekle"
    :loading="isLoading"
    loading-text="Borçlar yükleniyor..."
    empty-title="Borç bulunamadı"
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

    <template #cell-debtorName="{ value }">
      {{ value || "Hane" }}
    </template>

    <template #cell-amount="{ item }">
      <span class="font-weight-medium">{{ money(item.amount, item) }}</span>
    </template>

    <template #cell-paidAmount="{ item }">
      {{ money(item.paidAmount, item) }}
    </template>

    <template #cell-remaining="{ item }">
      <span class="font-weight-medium">{{ money(item.remaining, item) }}</span>
      <span v-if="item.currency === Currency.USD && item.remainingInTry !== null" class="text-medium-emphasis">
        ≈ {{ formatMoney(item.remainingInTry) }}
      </span>
    </template>

    <template #cell-status="{ item }">
      <v-chip v-if="item.isClosed" size="small" color="success" variant="tonal">Kapandı</v-chip>
      <v-chip v-else size="small" color="warning" variant="tonal">Açık</v-chip>
    </template>

    <template #actions="{ item }">
      <div class="d-flex align-center ga-1">
        <v-btn size="small" variant="tonal" color="primary" @click="openPayments(item)">
          Ödemeler ({{ item.paymentCount }})
        </v-btn>
        <v-btn
          v-if="canUpdate"
          icon="mdi-pencil"
          size="small"
          variant="text"
          title="Düzenle"
          @click="openEditDialog(item)"
        />
        <v-btn
          v-if="canDelete"
          icon="mdi-delete"
          size="small"
          variant="text"
          color="error"
          title="Sil"
          @click="openDeleteDialog(item)"
        />
      </div>
    </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? 'Borcu Düzenle' : 'Yeni Borç Ekle'"
    :subtitle="isEditMode ? 'Borç bilgilerini güncelleyin' : 'Yeni borç bilgilerini girin'"
    icon="mdi-hand-coin"
    :default-width="600"
    :min-width="400"
  >
    <DebtForm
      :debt="selectedItem"
      :people="people"
      :loading="isLoading"
      @submit="handleSubmit"
      @cancel="closeCreateDialog"
    />
  </ResizableDrawer>

  <!-- Ödemeler -->
  <DebtPaymentsDialog
    v-model="paymentsDialog"
    :debt-id="paymentsDebtId"
    :current-rate="summary?.usdRate?.rate ?? null"
    @changed="refreshAll"
  />

  <!-- Kur -->
  <ExchangeRateDialog v-model="rateDialog" @changed="refreshAll" />

  <!-- Confirm Delete Dialog -->
  <ConfirmDialog
    v-model="dialogs.delete"
    title="Borcu Sil"
    :message="`${itemToDelete?.creditorName ?? ''} alacaklı ${itemToDelete ? money(itemToDelete.amount, itemToDelete) : ''} tutarındaki borcu silmek istediğinizden emin misiniz?`"
    type="error"
    confirm-text="Sil"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="closeDeleteDialog"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { Debt, DebtSummary } from "~/types";
import { Currency } from "~/types";
import BaseDataTable from "~/components/UI/BaseDataTable.vue";
import ResizableDrawer from "~/components/UI/ResizableDrawer.vue";
import ConfirmDialog from "~/components/UI/ConfirmDialog.vue";
import DebtForm from "~/components/Debts/DebtForm.vue";
import DebtPaymentsDialog from "~/components/Debts/DebtPaymentsDialog.vue";
import ExchangeRateDialog from "~/components/Debts/ExchangeRateDialog.vue";
import { formatDisplayDate } from "~/utils/period";

//#region Page Metadata
definePageMeta({
  title: "Borçlar",
  requiresAuth: true,
  middleware: ["permission"],
  permissions: ["Debts.Read"],
});

useHead({
  title: "Borçlar",
});
//#endregion

//#region DataTable Columns
const tableColumns = [
  { label: "Tarih", key: "date", sortable: false, width: "110px" },
  { label: "Alacaklı", key: "creditorName", sortable: false, width: "140px" },
  { label: "Borçlu", key: "debtorName", sortable: false, width: "120px" },
  { label: "Tutar", key: "amount", sortable: false, width: "140px" },
  { label: "Ödenen", key: "paidAmount", sortable: false, width: "140px" },
  { label: "Kalan", key: "remaining", sortable: false, width: "220px" },
  { label: "Durum", key: "status", sortable: false, width: "100px" },
  { label: "Not", key: "note", sortable: false, width: "180px" },
];
//#endregion

//#region Composables
const { formatMoney } = useMoney();
const { hasPermission } = useAuth();
const { getPeople } = usePeople();
const { currencyOptions, currencyCode, getDebts, getDebtSummary, createDebt, updateDebt, deleteDebt } = useDebts();
//#endregion

const canUpdate = computed(() => hasPermission("Debts.Update"));
const canDelete = computed(() => hasPermission("Debts.Delete"));
const canEditRate = computed(() => hasPermission("ExchangeRates.Create"));
const usdRateMissing = computed(() => !!summary.value && summary.value.openUsd > 0 && !summary.value.usdRate);

// Tutar borcun kendi para biriminde gösterilir
const money = (amount: number, debt: Debt) => formatMoney(amount, currencyCode(debt.currency));

//#region Kişiler (form ve filtre için)
const people = ref<{ id: number; name: string }[]>([]);

const loadPeople = async () => {
  const peopleRes = await getPeople(1, 1000, "");
  people.value = peopleRes?.data?.items || [];
};
//#endregion

//#region Filtreler, liste ve özet
const statusOptions = [
  { value: "open", title: "Açık" },
  { value: "closed", title: "Kapanan" },
  { value: "all", title: "Tümü" },
];
const filterStatus = ref<"open" | "closed" | "all">("open");
const filterCreditor = ref<number | null>(null);
const filterCurrency = ref<Currency | null>(null);
const summary = ref<DebtSummary | null>(null);

const currentFilters = () => ({
  isClosed: filterStatus.value === "all" ? undefined : filterStatus.value === "closed",
  creditorPersonId: filterCreditor.value ?? undefined,
  currency: filterCurrency.value ?? undefined,
});

// Özet hanenin tüm borçlarını kapsar; filtrelerden bağımsızdır
const loadSummary = async () => {
  try {
    summary.value = await getDebtSummary();
  } catch {
    summary.value = null;
  }
};

// Liste her yüklendiğinde (ekle/düzenle/sil/sayfa/arama) özet de yenilenir
const loadDebts = async (page = 1, pageSize = 10, searchTerm = "") => {
  const [response] = await Promise.all([
    getDebts(page, pageSize, searchTerm, currentFilters()),
    loadSummary(),
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
  loadItems: loadDebts,
  createItem: createDebt,
  updateItem: updateDebt,
  deleteItem: deleteDebt,
  itemName: "borç",
  serverSidePagination: true,
  initialPageSize: 10,
});

let ready = false;
watch([filterStatus, filterCreditor, filterCurrency], () => {
  if (ready) loadItemsData(1, pageSize.value, searchTerm.value);
});

// Ödeme ya da kur değişince tablo ve özet aynı sayfada yenilenir
const refreshAll = () => loadItemsData(currentPage.value, pageSize.value, searchTerm.value);
//#endregion

//#region Ödemeler ve kur pencereleri
const paymentsDialog = ref(false);
const paymentsDebtId = ref<number | null>(null);
const rateDialog = ref(false);

const openPayments = (debt: Debt) => {
  paymentsDebtId.value = debt.id;
  paymentsDialog.value = true;
};
//#endregion

//#region Lifecycle
onMounted(async () => {
  await loadPeople();
  await loadItemsData(1, pageSize.value, "");
  ready = true;
});
//#endregion
</script>
