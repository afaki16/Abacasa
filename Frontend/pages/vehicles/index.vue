<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: 'Ana Sayfa', to: '/' }, { text: 'Araçlar' }]"
    />
  </div>

  <!-- Yaklaşan ve geciken -->
  <v-card variant="outlined" class="mb-4">
    <v-card-title class="text-subtitle-1">Yaklaşan ve geciken</v-card-title>
    <v-table density="compact">
      <thead>
        <tr>
          <th>Araç</th>
          <th>Tür</th>
          <th>Geçerlilik sonu</th>
          <th>Durum</th>
          <th class="text-right">Son tutar</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in reminders" :key="`${r.vehicleId}-${r.type}`">
          <td>{{ r.vehicleName }} <span class="text-medium-emphasis">· {{ r.plate }}</span></td>
          <td>{{ getTypeLabel(r.type) }}</td>
          <td>{{ formatDisplayDate(r.validUntil) }}</td>
          <td>
            <v-chip v-if="r.isOverdue" size="small" color="error" variant="tonal">Gecikti · {{ -r.daysLeft }} gün</v-chip>
            <span v-else>{{ r.daysLeft === 0 ? "Bugün" : `${r.daysLeft} gün kaldı` }}</span>
          </td>
          <td class="text-right">{{ formatMoney(r.lastAmount) }}</td>
        </tr>
        <tr v-if="!reminders.length">
          <td colspan="5" class="text-medium-emphasis">Yaklaşan tarih yok</td>
        </tr>
      </tbody>
    </v-table>
  </v-card>

  <BaseDataTable
    :items="items"
    :columns="tableColumns"
    title="Araçlar"
    toolbar-icon="mdi-car"
    search-placeholder="Ad ya da plakada ara"
    add-button-text="Araç ekle"
    :loading="isLoading"
    loading-text="Araçlar yükleniyor..."
    empty-title="Araç bulunamadı"
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
      {{ value || "Hane" }}
    </template>

    <!-- Dört tür için güncel kaydın geçerlilik sonu; renk bugüne göre -->
    <template v-for="type in OBLIGATION_TYPES" :key="type" #[`cell-type${type}`]="{ item }">
      <v-chip size="small" variant="tonal" :color="badge(item, type).color">{{ badge(item, type).text }}</v-chip>
    </template>

    <template #cell-isActive="{ value }">
      <v-chip size="small" :color="value ? 'success' : 'grey'" variant="tonal">{{ value ? "Aktif" : "Pasif" }}</v-chip>
    </template>

    <template #actions="{ item }">
      <div class="d-flex align-center ga-1">
        <v-btn size="small" variant="tonal" color="primary" @click="openObligations(item)">İşlemler</v-btn>
        <v-btn v-if="canUpdate" icon="mdi-pencil" size="small" variant="text" title="Düzenle" @click="openEditDialog(item)" />
        <v-btn v-if="canDelete" icon="mdi-delete" size="small" variant="text" color="error" title="Sil" @click="openDeleteDialog(item)" />
      </div>
    </template>
  </BaseDataTable>

  <!-- Create/Edit Drawer -->
  <ResizableDrawer
    v-model="dialogs.create"
    :title="isEditMode ? 'Aracı Düzenle' : 'Araç Ekle'"
    :subtitle="isEditMode ? 'Araç bilgilerini güncelleyin' : 'Yeni araç bilgilerini girin'"
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
    title="Aracı Sil"
    :message="`${itemToDelete?.name ?? ''} (${itemToDelete?.plate ?? ''}) aracını silmek istediğinizden emin misiniz?`"
    type="error"
    confirm-text="Sil"
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

useHead({
  title: "Araçlar",
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
const tableColumns = [
  { label: "Ad", key: "name", sortable: false, width: "160px" },
  { label: "Plaka", key: "plate", sortable: false, width: "120px" },
  { label: "Sahip", key: "ownerName", sortable: false, width: "120px" },
  ...OBLIGATION_TYPES.map((type) => ({ label: getTypeLabel(type), key: `type${type}`, sortable: false, width: "130px" })),
  { label: "Aktif", key: "isActive", sortable: false, width: "90px" },
];
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
  itemName: "araç",
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
