<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: t('common.home'), to: '/' }, { text: t('vehicles.title') }]"
    />
  </div>

  <PageHero
    icon="mdi-car-outline"
    :title="t('vehicles.title')"
    :subtitle="t('vehicles.subtitle')"
  />

  <!-- Yaklaşan ve geciken -->
  <UiCard elevation="0" border class="mb-4">
    <div class="ui-card-title !text-[1rem] !leading-[1.75rem] !tracking-[0.009375em] !font-normal">{{ t('vehicles.upcoming.title') }}</div>
    <div class="overflow-x-auto"><table v-stack-table class="ui-table ui-table--compact">
      <thead>
        <tr>
          <th>{{ t('vehicles.upcoming.vehicle') }}</th>
          <th>{{ t('vehicles.upcoming.type') }}</th>
          <th>{{ t('vehicles.upcoming.validUntil') }}</th>
          <th>{{ t('vehicles.upcoming.status') }}</th>
          <th class="!text-right">{{ t('vehicles.upcoming.lastAmount') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in reminders" :key="`${r.vehicleId}-${r.type}`">
          <td>{{ r.vehicleName }} <span class="text-black/60 dark:text-white/70">· {{ r.plate }}</span></td>
          <td>{{ getTypeLabel(r.type) }}</td>
          <td>{{ formatDisplayDate(r.validUntil) }}</td>
          <td>
            <UiChip v-if="r.isOverdue" size="small" color="error" variant="tonal">{{ t('vehicles.upcoming.overdue', { days: -r.daysLeft }, -r.daysLeft) }}</UiChip>
            <span v-else>{{ r.daysLeft === 0 ? t('vehicles.upcoming.today') : t('vehicles.upcoming.daysLeft', { days: r.daysLeft }, r.daysLeft) }}</span>
          </td>
          <td class="!text-right">{{ formatMoney(r.lastAmount) }}</td>
        </tr>
        <tr v-if="!reminders.length">
          <td colspan="5" class="text-black/60 dark:text-white/70">{{ t('vehicles.upcoming.empty') }}</td>
        </tr>
      </tbody>
    </table></div>
  </UiCard>

  <BaseDataTable
    :hide-page-header="true"
    :items="items"
    :columns="tableColumns"
    :title="t('vehicles.title')"
    toolbar-icon="mdi-car"
    :search-placeholder="t('vehicles.searchPlaceholder')"
    :add-button-text="t('vehicles.add')"
    :loading="isLoading"
    :loading-text="t('vehicles.loading')"
    :empty-title="t('vehicles.empty')"
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
    <template #cell-ownerName="{ value }">
      {{ value || t("vehicles.household") }}
    </template>

    <!-- Dört tür için güncel kaydın geçerlilik sonu; renk bugüne göre -->
    <template v-for="type in OBLIGATION_TYPES" :key="type" #[`cell-type${type}`]="{ item }">
      <UiChip size="small" variant="tonal" :color="badge(item, type).color">{{ badge(item, type).text }}</UiChip>
    </template>

    <template #cell-isActive="{ value }">
      <UiChip size="small" :color="value ? 'success' : 'grey'" variant="tonal">{{ value ? t("common.active") : t("common.inactive") }}</UiChip>
    </template>

    <template #actions="{ item }">
      <div class="flex items-center gap-1">
        <UiBtn size="small" variant="tonal" color="primary" @click="openObligations(item)">{{ t('vehicles.obligations.button') }}</UiBtn>
        <UiBtn v-if="canUpdate" icon="mdi-pencil" size="small" variant="text" :title="t('common.edit')" @click="openEditDialog(item)" />
        <UiBtn v-if="canDelete" icon="mdi-delete" size="small" variant="text" color="error" :title="t('common.delete')" @click="openDeleteDialog(item)" />
      </div>
    </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? t('vehicles.editTitle') : t('vehicles.createTitle')"
    :subtitle="isEditMode ? t('vehicles.editSubtitle') : t('vehicles.createSubtitle')"
    icon="mdi-car"
    :default-width="600"
    :min-width="400"
  >
    <VehicleForm
      :vehicle="selectedItem"
      :people="people"
      :loading="isLoading"
      @submit="handleSubmit"
      @cancel="closeCreateDialog"
    />
  </ResizableDrawer>

  <!-- İşlemler -->
  <VehicleObligationsDialog
    v-model="obligationsDialog"
    :vehicle="activeVehicle"
    :categories="categories"
    :payment-methods="paymentMethods"
    @changed="refreshAll"
  />

  <!-- Confirm Delete Dialog -->
  <ConfirmDialog
    v-model="dialogs.delete"
    :title="t('vehicles.deleteTitle')"
    :message="t('vehicles.deleteConfirm', { name: itemToDelete?.name ?? '', plate: itemToDelete?.plate ?? '' })"
    type="error"
    :confirm-text="t('common.delete')"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="closeDeleteDialog"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { PaymentMethod, Vehicle, VehicleReminder } from "~/types";
import { VehicleObligationType } from "~/types";
import BaseDataTable from "~/components/UI/BaseDataTable.vue";
import ResizableDrawer from "~/components/UI/ResizableDrawer.vue";
import ConfirmDialog from "~/components/UI/ConfirmDialog.vue";
import VehicleForm from "~/components/Vehicles/VehicleForm.vue";
import VehicleObligationsDialog from "~/components/Vehicles/VehicleObligationsDialog.vue";
import { formatDisplayDate, todayIso } from "~/utils/period";

//#region Page Metadata
definePageMeta({
  title: "Araçlar",
  requiresAuth: true,
  middleware: ["permission"],
  permissions: ["Vehicles.Read"],
});

const { t } = useI18n();

useHead({
  title: computed(() => t("vehicles.title")),
});
//#endregion

const OBLIGATION_TYPES = [
  VehicleObligationType.TrafficInsurance,
  VehicleObligationType.Kasko,
  VehicleObligationType.Inspection,
  VehicleObligationType.Mtv,
];

//#region Composables
const { formatMoney } = useMoney();
const { hasPermission } = useAuth();
const { getPeople } = usePeople();
const { getCategories } = useCategories();
const { getPaymentMethods } = usePaymentMethods();
const { getTypeLabel, getVehicles, getUpcoming, createVehicle, updateVehicle, deleteVehicle } = useVehicles();
//#endregion

const canUpdate = computed(() => hasPermission("Vehicles.Update"));
const canDelete = computed(() => hasPermission("Vehicles.Delete"));

//#region DataTable Columns
const tableColumns = computed(() => [
  { label: t("vehicles.columns.name"), key: "name", sortable: false, width: "160px" },
  { label: t("vehicles.columns.plate"), key: "plate", sortable: false, width: "120px" },
  { label: t("vehicles.columns.owner"), key: "ownerName", sortable: false, width: "120px" },
  ...OBLIGATION_TYPES.map((type) => ({ label: getTypeLabel(type), key: `type${type}`, sortable: false, width: "130px" })),
  { label: t("common.active"), key: "isActive", sortable: false, width: "90px" },
]);
//#endregion

//#region Rozetler (bugüne göre frontend'de)
const today = todayIso();
const in30Days = (() => {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 30);
  return d.toISOString().slice(0, 10);
})();

const badge = (vehicle: Vehicle, type: VehicleObligationType) => {
  const current = vehicle.current?.find((c) => c.type === type);
  if (!current) return { color: "grey", text: "—" };
  const color = current.validUntil < today ? "error" : current.validUntil <= in30Days ? "warning" : "success";
  return { color, text: formatDisplayDate(current.validUntil) };
};
//#endregion

//#region Tanımlar ve hatırlatmalar
const people = ref<{ id: number; name: string }[]>([]);
const categories = ref<{ id: number; name: string }[]>([]);
const paymentMethods = ref<PaymentMethod[]>([]);
const reminders = ref<VehicleReminder[]>([]);

const loadReminders = async () => {
  try {
    reminders.value = (await getUpcoming(today)) ?? [];
  } catch {
    reminders.value = [];
  }
};

// Liste her yüklendiğinde (ekle/düzenle/sil/sayfa/arama) yaklaşan listesi de yenilenir
const loadVehicles = async (page = 1, pageSize = 10, searchTerm = "") => {
  const [response] = await Promise.all([getVehicles(page, pageSize, searchTerm), loadReminders()]);
  return response;
};
//#endregion

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
  loadItems: loadVehicles,
  createItem: createVehicle,
  updateItem: updateVehicle,
  deleteItem: deleteVehicle,
  itemName: () => t("vehicles.itemName"),
  serverSidePagination: true,
  initialPageSize: 10,
});

const refreshAll = () => loadItemsData(currentPage.value, pageSize.value, searchTerm.value);

//#region İşlemler penceresi
const obligationsDialog = ref(false);
const activeVehicle = ref<Vehicle | null>(null);

const openObligations = (vehicle: Vehicle) => {
  activeVehicle.value = vehicle;
  obligationsDialog.value = true;
};
//#endregion

//#region Lifecycle
onMounted(async () => {
  const [peopleRes, categoryRes, paymentMethodRes] = await Promise.all([
    getPeople(1, 1000, ""),
    getCategories(1, 1000, ""),
    getPaymentMethods(1, 1000, ""),
  ]);
  people.value = peopleRes?.data?.items || [];
  categories.value = categoryRes?.data?.items || [];
  paymentMethods.value = paymentMethodRes?.data?.items || [];
  await loadItemsData(1, pageSize.value, "");
});
//#endregion
</script>
