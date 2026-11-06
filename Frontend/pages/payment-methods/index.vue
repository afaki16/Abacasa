<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: t('common.home'), to: '/' }, { text: t('paymentMethods.title') }]"
    />
  </div>

  <PageHero
    icon="mdi-credit-card-multiple-outline"
    :title="t('paymentMethods.title')"
    :subtitle="t('paymentMethods.subtitle')"
    :count="items.length"
  />

  <BaseDataTable
    :hide-page-header="true"
    :items="items"
    :columns="tableColumns"
    :title="t('paymentMethods.title')"
    toolbar-icon="mdi-credit-card-multiple"
    :search-placeholder="t('paymentMethods.searchPlaceholder')"
    :add-button-text="t('paymentMethods.add')"
    :loading="isLoading"
    :loading-text="t('paymentMethods.loading')"
    :empty-title="t('paymentMethods.empty')"
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
      <UiChip
        color="primary"
        variant="tonal"
        size="default"
        prepend-icon="mdi-credit-card-outline"
      >
        {{ value }}
      </UiChip>
    </template>

    <template #cell-type="{ value }">
      {{ getTypeLabel(value) }}
    </template>

    <template #cell-ownerPersonName="{ value }">
      {{ value || t("paymentMethods.household") }}
    </template>

    <template #cell-isActive="{ value }">
      <UiChip :color="value ? 'success' : 'error'" size="small" variant="tonal">
        {{ value ? t("common.active") : t("common.inactive") }}
      </UiChip>
    </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? t('paymentMethods.editTitle') : t('paymentMethods.add')"
    :subtitle="isEditMode ? t('paymentMethods.editSubtitle') : t('paymentMethods.createSubtitle')"
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
    :title="t('paymentMethods.deleteTitle')"
    :message="t('paymentMethods.deleteConfirm', { name: itemToDelete?.name })"
    type="error"
    :confirm-text="t('common.delete')"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="closeDeleteDialog"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
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

const { t } = useI18n();

useHead({
  title: computed(() => t("paymentMethods.title")),
});
//#endregion

//#region DataTable Columns
const tableColumns = computed(() => [
  {
    label: t("paymentMethods.columns.name"),
    key: "name",
    sortable: true,
    filterable: true,
    filterType: "text",
    width: "250px",
  },
  {
    label: t("paymentMethods.columns.type"),
    key: "type",
    sortable: true,
    width: "150px",
  },
  {
    label: t("paymentMethods.columns.bank"),
    key: "bank",
    sortable: true,
    filterable: true,
    filterType: "text",
    width: "180px",
  },
  {
    label: t("paymentMethods.columns.owner"),
    key: "ownerPersonName",
    sortable: true,
    width: "180px",
  },
  {
    label: t("paymentMethods.columns.statementDay"),
    key: "statementDay",
    sortable: true,
    width: "120px",
  },
  {
    label: t("common.active"),
    key: "isActive",
    sortable: true,
    width: "100px",
  },
]);
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
  itemName: () => t("paymentMethods.itemName"),
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
