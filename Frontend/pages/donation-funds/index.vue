<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: t('common.home'), to: '/' }, { text: t('donationFunds.title') }]"
    />
  </div>

  <PageHero
    icon="mdi-safe"
    :title="t('donationFunds.title')"
    :subtitle="t('donationFunds.subtitle')"
  />

  <!-- Özet: açık emanetlerin toplamı -->
  <div class="ui-row ui-row--stats !mb-2">
    <div class="ui-col ui-col-12 ui-col-sm-4 ui-col-md-4">
      <UiCard class="!bg-[rgb(var(--color-brand)/0.12)] !text-[rgb(var(--color-brand))]">
        <div class="ui-card-text">
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ t('donationFunds.remainingToDistribute') }}</div>
          <div class="text-[1.5rem] leading-[2rem] tracking-normal font-bold">{{ formatMoney(openTotals.remaining) }}</div>
        </div>
      </UiCard>
    </div>
    <div class="ui-col ui-col-12 ui-col-sm-4 ui-col-md-4">
      <UiCard class="!bg-[#fea619]/[0.12] !text-[#fea619]">
        <div class="ui-card-text">
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ t('donationFunds.inUse') }}</div>
          <div class="text-[1.5rem] leading-[2rem] tracking-normal font-bold">{{ formatMoney(openTotals.inUse) }}</div>
        </div>
      </UiCard>
    </div>
    <div class="ui-col ui-col-12 ui-col-sm-4 ui-col-md-4">
      <UiCard class="!bg-[rgb(var(--color-brand)/0.12)] !text-[rgb(var(--color-brand))]">
        <div class="ui-card-text">
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ t('donationFunds.onHand') }}</div>
          <div class="text-[1.5rem] leading-[2rem] tracking-normal font-bold">{{ formatMoney(openTotals.onHand) }}</div>
        </div>
      </UiCard>
    </div>
  </div>

  <!-- Filtreler -->
  <div class="ui-row ui-row--dense !mb-2">
    <div class="ui-col ui-col-12 ui-col-sm-6 ui-col-md-4">
      <UiSelect
        v-model="filterStatus"
        :items="statusOptions"
        item-title="title"
        item-value="value"
        :label="t('budget.status')"
        density="compact"
        hide-details
      />
    </div>
  </div>

  <BaseDataTable
    :hide-page-header="true"
    :items="items"
    :columns="tableColumns"
    :title="t('donationFunds.title')"
    toolbar-icon="mdi-safe"
    :search-placeholder="t('donationFunds.searchPlaceholder')"
    :add-button-text="t('donationFunds.add')"
    :loading="isLoading"
    :loading-text="t('donationFunds.loading')"
    :empty-title="t('donationFunds.empty')"
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
      <span class="font-medium">{{ formatMoney(value) }}</span>
    </template>

    <template #cell-distributed="{ value }">{{ formatMoney(value) }}</template>
    <template #cell-inUse="{ value }">{{ formatMoney(value) }}</template>
    <template #cell-remaining="{ value }">
      <span class="font-medium">{{ formatMoney(value) }}</span>
    </template>
    <template #cell-onHand="{ value }">{{ formatMoney(value) }}</template>

    <template #cell-status="{ item }">
      <UiChip v-if="item.isClosed" size="small" color="success" variant="tonal">{{ t('donationFunds.closed') }}</UiChip>
      <UiChip v-else size="small" color="warning" variant="tonal">{{ t('donationFunds.open') }}</UiChip>
    </template>

    <template #actions="{ item }">
      <div class="flex items-center gap-1">
        <UiBtn size="small" variant="tonal" color="primary" @click="openDistributions(item)">
          {{ t('donationFunds.distributionsButton', { count: item.distributionCount }) }}
        </UiBtn>
        <UiBtn size="small" variant="tonal" @click="openMovements(item)">
          {{ t('donationFunds.movementsButton', { count: item.movementCount }) }}
        </UiBtn>
        <UiBtn v-if="canUpdate" icon="mdi-pencil" size="small" variant="text" :title="t('common.edit')" @click="openEditDialog(item)" />
        <UiBtn v-if="canDelete" icon="mdi-delete" size="small" variant="text" color="error" :title="t('common.delete')" @click="openDeleteDialog(item)" />
      </div>
    </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? t('donationFunds.editTitle') : t('donationFunds.createTitle')"
    :subtitle="isEditMode ? t('donationFunds.editSubtitle') : t('donationFunds.createSubtitle')"
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
    :title="t('donationFunds.deleteTitle')"
    :message="t('donationFunds.deleteMessage', { from: itemToDelete?.fromPersonName ?? '', amount: formatMoney(itemToDelete?.amount ?? 0) })"
    type="error"
    :confirm-text="t('common.delete')"
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
  // Bağış hedefleri ve emanetler modülü kapalıysa /dashboard'a
  module: "donationExtras",
});

const { t } = useI18n();

useHead({
  title: computed(() => t("donationFunds.title")),
});
//#endregion

//#region DataTable Columns
const tableColumns = computed(() => [
  { label: t("budget.date"), key: "date", sortable: false, width: "110px" },
  { label: t("donationFunds.from"), key: "fromPersonName", sortable: false, width: "140px" },
  { label: t("budget.kind"), key: "kind", sortable: false, width: "90px" },
  { label: t("budget.amount"), key: "amount", sortable: false, width: "130px" },
  { label: t("donationFunds.distributed"), key: "distributed", sortable: false, width: "130px" },
  { label: t("donationFunds.inUse"), key: "inUse", sortable: false, width: "130px" },
  { label: t("donationFunds.remaining"), key: "remaining", sortable: false, width: "130px" },
  { label: t("donationFunds.onHand"), key: "onHand", sortable: false, width: "130px" },
  { label: t("budget.status"), key: "status", sortable: false, width: "90px" },
  { label: t("budget.note"), key: "note", sortable: false, width: "160px" },
]);
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
const statusOptions = computed(() => [
  { value: "open", title: t("donationFunds.statusOptions.open") },
  { value: "closed", title: t("donationFunds.statusOptions.closed") },
  { value: "all", title: t("dataTable.all") },
]);
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
  itemName: () => t("donationFunds.itemName"),
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
