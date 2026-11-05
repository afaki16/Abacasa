<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: 'Ana Sayfa', to: '/' }, { text: 'Borçlar' }]"
    />
  </div>

  <PageHero
    icon="mdi-hand-coin-outline"
    title="Borçlar"
    subtitle="Alınan borçları ve geri ödemelerini izleyin; borç hareketleri dönem harcamasına girmez."
  />

  <!-- Özet -->
  <div class="ui-row !mb-2">
    <div class="ui-col ui-col-12 ui-col-sm-6 ui-col-md-3">
      <UiCard class="h-full !bg-[rgb(var(--color-brand)/0.12)] !text-[rgb(var(--color-brand))]">
        <div class="ui-card-text">
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">Açık borç (TL karşılığı)</div>
          <div class="text-[1.5rem] leading-[2rem] tracking-normal font-bold">{{ formatMoney(summary?.openTotalInTry) }}</div>
          <!-- Açığı olan bir birimin kuru yoksa TL karşılığı hesaplanamaz -->
          <div v-if="missingRateLabels.length" class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">
            {{ missingRateLabels.join(", ") }} kuru girilmemiş
          </div>
          <div v-else class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ summary?.openCount ?? 0 }} açık borç</div>
        </div>
      </UiCard>
    </div>
    <div class="ui-col ui-col-12 ui-col-sm-6 ui-col-md-3">
      <UiCard class="h-full !bg-[#3b82f6]/[0.12] !text-[#3b82f6]">
        <div class="ui-card-text">
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">TL borç</div>
          <div class="text-[1.5rem] leading-[2rem] tracking-normal font-bold">{{ formatMoney(summary?.openTry ?? 0) }}</div>
        </div>
      </UiCard>
    </div>
    <!-- Açığı olan her yabancı birim için bir kart -->
    <div class="ui-col ui-col-12 ui-col-sm-6 ui-col-md-3" v-for="f in summary?.foreign ?? []" :key="f.currency">
      <UiCard class="h-full !bg-[#3b82f6]/[0.12] !text-[#3b82f6]">
        <div class="ui-card-text">
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ foreignCardTitle(f.currency) }}</div>
          <div class="text-[1.5rem] leading-[2rem] tracking-normal font-bold">{{ formatAmount(f.open, f.currency) }}</div>
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">≈ {{ formatMoney(f.openInTry) }}</div>
        </div>
      </UiCard>
    </div>
    <div class="ui-col ui-col-12 ui-col-sm-6 ui-col-md-3">
      <UiCard class="h-full !bg-secondary/[0.12] !text-secondary">
        <div class="ui-card-text">
          <div class="flex items-center">
            <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">Kurlar</div>
            <div class="flex-1" />
            <UiBtn
              v-if="canEditRate"
              size="x-small"
              variant="tonal"
              @click="rateDialog = true"
            >
              Güncelle
            </UiBtn>
          </div>
          <div v-for="r in summary?.rates ?? []" :key="r.currency" class="flex items-center gap-2 mt-1 text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal">
            <span class="font-medium">{{ currencyLabel(r.currency) }}</span>
            <span>{{ formatMoney(r.rate) }}</span>
            <span class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal text-black/60 dark:text-white/70">{{ formatDisplayDate(r.date) }}</span>
            <UiChip size="x-small" :color="r.source === 'TCMB' ? 'primary' : undefined" variant="tonal">{{ r.source }}</UiChip>
          </div>
          <div v-if="!summary?.rates?.length" class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal mt-1">Kur yok</div>
        </div>
      </UiCard>
    </div>
  </div>

  <!-- Alacaklıya göre -->
  <div class="ui-row !mb-4">
    <div class="ui-col ui-col-12">
      <UiCard elevation="0" border>
        <div class="ui-card-title !text-[1rem] !leading-[1.75rem] !tracking-[0.009375em] !font-normal">Alacaklıya göre</div>
        <div class="overflow-x-auto"><table v-stack-table class="ui-table ui-table--compact">
          <thead>
            <tr>
              <th>Alacaklı</th>
              <th class="!text-right">Açık</th>
              <th class="!text-right">Toplam TL</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in summary?.byCreditor ?? []" :key="row.personId">
              <td>{{ row.name }}</td>
              <!-- TL ve yabancı birimler tek satırda -->
              <td class="!text-right">{{ formatOpenLine(row.openTry, row.foreign) }}</td>
              <td class="!text-right font-medium">{{ formatMoney(row.totalInTry) }}</td>
            </tr>
            <tr v-if="!summary?.byCreditor?.length">
              <td colspan="3" class="text-black/60 dark:text-white/70">Açık borç yok</td>
            </tr>
          </tbody>
        </table></div>
      </UiCard>
    </div>
  </div>

  <!-- Filtreler -->
  <div class="ui-row ui-row--dense !mb-2">
    <div class="ui-col ui-col-12 ui-col-sm-4 ui-col-md-4">
      <UiSelect
        v-model="filterStatus"
        :items="statusOptions"
        item-title="title"
        item-value="value"
        label="Durum"
        density="compact"
        hide-details
      />
    </div>
    <div class="ui-col ui-col-12 ui-col-sm-4 ui-col-md-4">
      <UiSelect
        v-model="filterCreditor"
        :items="people"
        item-title="name"
        item-value="id"
        label="Alacaklı"
        density="compact"
        hide-details
        clearable
      />
    </div>
    <div class="ui-col ui-col-12 ui-col-sm-4 ui-col-md-4">
      <UiSelect
        v-model="filterCurrency"
        :items="currencyOptions"
        item-title="title"
        item-value="value"
        label="Para birimi"
        density="compact"
        hide-details
        clearable
      />
    </div>
  </div>

  <BaseDataTable
    class="debts-table"
    :hide-page-header="true"
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
      <span class="font-medium">{{ money(item.amount, item) }}</span>
    </template>

    <template #cell-paidAmount="{ item }">
      {{ money(item.paidAmount, item) }}
    </template>

    <!-- Döviz/çeyrek borçta TL karşılığı alt satırda: tablo 1366px ekrana sığsın -->
    <template #cell-remaining="{ item }">
      <div class="leading-tight">
        <div class="font-medium">{{ money(item.remaining, item) }}</div>
        <div v-if="item.currency !== Currency.TRY && item.remainingInTry !== null" class="text-xs text-black/60 dark:text-white/70">
          ≈ {{ formatMoney(item.remainingInTry) }}
        </div>
      </div>
    </template>

    <template #cell-status="{ item }">
      <UiChip v-if="item.isClosed" size="small" color="success" variant="tonal">Kapandı</UiChip>
      <UiChip v-else size="small" color="warning" variant="tonal">Açık</UiChip>
    </template>

    <template #actions="{ item }">
      <div class="flex items-center gap-1">
        <!-- Kısa düğme (ikon + ödeme sayısı): 9 sütunlu tablo 1366px ekrana sığsın -->
        <UiBtn
          size="small"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-cash-multiple"
          title="Ödemeler"
          :aria-label="`Ödemeler (${item.paymentCount})`"
          @click="openPayments(item)"
        >
          {{ item.paymentCount }}
        </UiBtn>
        <UiBtn
          v-if="canUpdate"
          icon="mdi-pencil"
          size="small"
          variant="text"
          title="Düzenle"
          @click="openEditDialog(item)"
        />
        <UiBtn
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
    :rates="summary?.rates ?? []"
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
  { label: "Kalan", key: "remaining", sortable: false, width: "140px" },
  { label: "Durum", key: "status", sortable: false, width: "100px" },
  { label: "Not", key: "note", sortable: false, width: "180px", cellClass: "whitespace-normal" },
];
//#endregion

//#region Composables
const { formatMoney, formatAmount, currencyLabel, formatOpenLine } = useMoney();
const { hasPermission } = useAuth();
const { getPeople } = usePeople();
const { currencyOptions, getDebts, getDebtSummary, createDebt, updateDebt, deleteDebt } = useDebts();
//#endregion

const canUpdate = computed(() => hasPermission("Debts.Update"));
const canDelete = computed(() => hasPermission("Debts.Delete"));
const canEditRate = computed(() => hasPermission("ExchangeRates.Create"));

// Açığı olup kuru olmayan birimler (TL karşılığı hesaplanamaz)
const missingRateLabels = computed(() =>
  (summary.value?.foreign ?? []).filter((f) => f.openInTry === null).map((f) => currencyLabel(f.currency))
);

const foreignCardTitle = (currency: Currency) =>
  currency === Currency.QuarterGold ? "Altın borç" : `${currencyLabel(currency)} borç`;

// Tutar borcun kendi biriminde gösterilir (çeyrek altın adet)
const money = (amount: number, debt: Debt) => formatAmount(amount, debt.currency);

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

<style scoped>
/* 9 sütun 1366px ekrana sığsın diye masaüstünde hücre yan boşlukları daraltıldı (telefonda kart görünümü) */
@media (min-width: 641px) {
  .debts-table :deep(th),
  .debts-table :deep(td) {
    padding-left: 14px;
    padding-right: 14px;
  }
}
</style>
