<template>
  <!-- Filtreler -->
  <div class="ui-row ui-row--dense !mb-2">
    <div class="ui-col ui-col-12 ui-col-sm-6 ui-col-md-4">
      <UiSelect
        v-model="filterKind"
        :items="kindOptions"
        item-title="title"
        item-value="value"
        :label="t('budget.kind')"
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
    :title="t('recurringPayments.plans.title')"
    toolbar-icon="mdi-calendar-sync"
    :search-placeholder="t('recurringPayments.plans.searchPlaceholder')"
    :add-button-text="t('recurringPayments.plans.add')"
    :loading="isLoading"
    :loading-text="t('recurringPayments.plans.loading')"
    :empty-title="t('recurringPayments.plans.empty')"
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
      <span v-else class="font-medium">{{ formatMoney(value) }}</span>
    </template>

    <template #cell-categoryOrRecipient="{ item }">
      {{ item.kind === RecurringPaymentKind.Donation ? item.recipient : item.categoryName }}
    </template>

    <template #cell-ownerPersonName="{ value }">
      {{ value || t('budget.household') }}
    </template>

    <template #cell-isActive="{ value }">
      <UiChip :color="value ? 'success' : undefined" size="small" variant="tonal">
        {{ value ? t('common.active') : t('common.inactive') }}
      </UiChip>
    </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? t('recurringPayments.plans.editTitle') : t('recurringPayments.plans.createTitle')"
    :subtitle="isEditMode ? t('recurringPayments.plans.editSubtitle') : t('recurringPayments.plans.createSubtitle')"
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
    :title="t('recurringPayments.plans.deleteTitle')"
    :message="t('recurringPayments.plans.deleteMessage', { name: itemToDelete?.name })"
    type="error"
    :confirm-text="t('common.delete')"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="closeDeleteDialog"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { PaymentMethod } from "~/types";
import { RecurringPaymentKind } from "~/types";
import BaseDataTable from "~/components/UI/BaseDataTable.vue";
import ResizableDrawer from "~/components/UI/ResizableDrawer.vue";
import ConfirmDialog from "~/components/UI/ConfirmDialog.vue";
import RecurringPaymentForm from "~/components/RecurringPayments/RecurringPaymentForm.vue";

const { t } = useI18n();

//#region DataTable Columns
const tableColumns = computed(() => [
  { label: t("budget.name"), key: "name", sortable: false, width: "200px" },
  { label: t("budget.kind"), key: "kind", sortable: false, width: "110px" },
  { label: t("recurringPayments.form.expectedAmount"), key: "expectedAmount", sortable: false, width: "140px" },
  { label: t("recurringPayments.form.dueDay"), key: "dueDay", sortable: false, width: "100px" },
  { label: t("budget.paymentMethod"), key: "paymentMethodName", sortable: false, width: "150px" },
  { label: t("recurringPayments.plans.categoryOrRecipient"), key: "categoryOrRecipient", sortable: false, width: "160px" },
  { label: t("budget.person"), key: "ownerPersonName", sortable: false, width: "130px" },
  { label: t("common.active"), key: "isActive", sortable: false, width: "90px" },
]);
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
  itemName: () => t("recurringPayments.plans.itemName"),
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
