<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: 'Ana Sayfa', to: '/' }, { text: 'Bağışlar' }]"
    />
  </div>

  <PageHero
    icon="mdi-hand-heart-outline"
    title="Bağışlar"
    subtitle="Dönemdeki bağışlarınızı kaydedin ve izleyin."
  />

  <!-- Dönem seçici -->
  <PeriodSelector
    ref="periodSelectorRef"
    v-model="period"
    storage-key="abacasa.donations.period"
    :payment-methods="paymentMethods"
  />

  <!-- Özet -->
  <div class="ui-row !mb-2">
    <div class="ui-col ui-col-12 ui-col-md-4">
      <UiCard class="!bg-[rgb(var(--color-brand)/0.12)] !text-[rgb(var(--color-brand))]">
        <div class="ui-card-text">
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">Dönem toplamı</div>
          <div class="text-[1.5rem] leading-[2rem] tracking-normal font-bold">{{ formatMoney(summary?.total ?? 0) }}</div>
        </div>
      </UiCard>
    </div>
    <div class="ui-col ui-col-12 ui-col-md-4">
      <UiCard class="!bg-[#3b82f6]/[0.12] !text-[#3b82f6]">
        <div class="ui-card-text">
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">Kayıt sayısı</div>
          <div class="text-[1.5rem] leading-[2rem] tracking-normal font-bold">{{ summary?.count ?? 0 }}</div>
        </div>
      </UiCard>
    </div>
    <!-- Emanetten dağıtılanlar dönem toplamına girmez; ayrı gösterilir. Modül kapalıysa kart hiç görünmez -->
    <div class="ui-col ui-col-12 ui-col-md-4" v-if="donationExtras">
      <UiCard class="!bg-secondary/[0.12] !text-secondary">
        <div class="ui-card-text">
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">Emanetten dağıtılan</div>
          <div class="text-[1.5rem] leading-[2rem] tracking-normal font-bold">{{ formatMoney(summary?.fundDistributedTotal ?? 0) }}</div>
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ summary?.fundDistributedCount ?? 0 }} kayıt</div>
        </div>
      </UiCard>
    </div>
  </div>

  <div class="ui-row !mb-4">
    <div class="ui-col ui-col-12 ui-col-md-6">
      <UiCard elevation="0" border>
        <div class="ui-card-title !text-[1rem] !leading-[1.75rem] !tracking-[0.009375em] !font-normal">Türe göre</div>
        <ul class="ui-list ui-list--compact">
          <li class="ui-list-item" v-for="row in summary?.byKind ?? []" :key="row.kind">
            <div class="ui-list-item__content">
              <div class="ui-list-title">{{ getKindLabel(row.kind) }}</div>
              <div class="ui-list-subtitle">{{ row.count }} kayıt</div>
            </div>
            <span class="ui-list-item__append">{{ formatMoney(row.total) }}</span>
          </li>
          <li class="ui-list-item" v-if="!summary?.byKind?.length">
            <div class="ui-list-item__content">
              <div class="ui-list-title"><span class="text-black/60 dark:text-white/70">Kayıt yok</span></div>
            </div>
          </li>
        </ul>
      </UiCard>
    </div>
    <div class="ui-col ui-col-12 ui-col-md-6">
      <UiCard elevation="0" border>
        <div class="ui-card-title !text-[1rem] !leading-[1.75rem] !tracking-[0.009375em] !font-normal">Verene göre</div>
        <ul class="ui-list ui-list--compact">
          <li class="ui-list-item" v-for="row in summary?.byGiver ?? []" :key="row.personId ?? 'household'">
            <div class="ui-list-item__content">
              <div class="ui-list-title">{{ row.personName ?? "Hane" }}</div>
              <div class="ui-list-subtitle">{{ row.count }} kayıt</div>
            </div>
            <span class="ui-list-item__append">{{ formatMoney(row.total) }}</span>
          </li>
          <li class="ui-list-item" v-if="!summary?.byGiver?.length">
            <div class="ui-list-item__content">
              <div class="ui-list-title"><span class="text-black/60 dark:text-white/70">Kayıt yok</span></div>
            </div>
          </li>
        </ul>
      </UiCard>
    </div>
  </div>

  <!-- Filtreler -->
  <div class="ui-row ui-row--dense !mb-2">
    <div class="ui-col ui-col-12 ui-col-md-4">
      <UiSelect
        v-model="filterKind"
        :items="kindOptions"
        item-title="title"
        item-value="value"
        label="Tür"
        density="compact"
        hide-details
        clearable
      />
    </div>
  </div>

  <BaseDataTable
    :hide-page-header="true"
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
      <UiChip v-if="item.fundId" size="x-small" variant="tonal" color="secondary" class="ml-1">
        Emanet: {{ fundFrom(item.fundLabel) }}
      </UiChip>
    </template>

    <template #cell-giverPersonName="{ value }">
      {{ value || "Hane" }}
    </template>

    <template #cell-amount="{ value }">
      <span class="font-medium">{{ formatMoney(value) }}</span>
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
      :show-fund="donationExtras"
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
const authStore = useAuthStore();
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
// Bağış hedefleri ve emanetler modülü (kapalıysa emanet alanı ve kartı yok)
const donationExtras = computed(() => authStore.hasModule("donationExtras"));

const loadFunds = async () => {
  if (!donationExtras.value || !hasPermission("DonationFunds.Read")) return;
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
