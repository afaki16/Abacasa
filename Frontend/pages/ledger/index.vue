<template>
  <!-- Breadcrumb -->
  <div class="mb-6">
    <BreadCrumb
      :items="[{ text: 'Ana Sayfa', to: '/' }, { text: 'Yıllık tablo' }]"
    />
  </div>

  <!-- Yıl seçici (hafızaya alınmaz) ve kalem ekleme -->
  <div class="d-flex align-center mb-4 ga-2">
    <v-btn icon="mdi-chevron-left" variant="text" :disabled="isLoading" @click="year--" />
    <div class="text-h6">{{ year }}</div>
    <v-btn icon="mdi-chevron-right" variant="text" :disabled="isLoading" @click="year++" />
    <v-spacer />
    <v-btn v-if="canCreate" color="primary" prepend-icon="mdi-plus" @click="openCreate">Kalem ekle</v-btn>
  </div>

  <v-card variant="outlined">
    <v-progress-linear v-if="isLoading" indeterminate color="primary" />
    <LedgerTable :data="data" @edit="openEdit" @delete="openDelete" @save-cell="saveCell" />
  </v-card>

  <!-- Kalem formu -->
  <ResizableDrawer
    v-model="formDialog"
    :title="editingItem ? 'Kalemi Düzenle' : 'Kalem Ekle'"
    :subtitle="editingItem ? 'Kalem bilgilerini güncelleyin' : 'Yeni gelir ya da gider kalemi'"
    icon="mdi-table-large"
    :default-width="520"
    :min-width="400"
  >
    <LedgerItemForm
      :item="editingItem"
      :people="people"
      :loading="isSaving"
      @submit="submitItem"
      @cancel="formDialog = false"
    />
  </ResizableDrawer>

  <!-- Silme onayı -->
  <ConfirmDialog
    :model-value="!!rowToDelete"
    title="Kalemi Sil"
    :message="`'${rowToDelete?.name ?? ''}' kalemini silmek istediğinizden emin misiniz?`"
    type="error"
    confirm-text="Sil"
    :loading="isSaving"
    @confirm="confirmDelete"
    @cancel="rowToDelete = null"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { LedgerItem, LedgerRow, LedgerYear, CreateLedgerItemRequest, UpdateLedgerItemRequest } from "~/types";
import LedgerTable from "~/components/Ledger/LedgerTable.vue";
import LedgerItemForm from "~/components/Ledger/LedgerItemForm.vue";
import ResizableDrawer from "~/components/UI/ResizableDrawer.vue";
import ConfirmDialog from "~/components/UI/ConfirmDialog.vue";
import { todayIso } from "~/utils/period";
import { useToastStore } from "~/stores/toast";

//#region Page Metadata
definePageMeta({
  title: "Yıllık tablo",
  requiresAuth: true,
  middleware: ["permission"],
  permissions: ["Ledger.Read"],
});

useHead({
  title: "Yıllık tablo",
});
//#endregion

//#region Composables
const { hasPermission } = useAuth();
const { getPeople } = usePeople();
const { getLedgerYear, getLedgerItemById, createLedgerItem, updateLedgerItem, deleteLedgerItem, setMonthlyAmount } = useLedger();
const toastStore = useToastStore();
//#endregion

const canCreate = computed(() => hasPermission("Ledger.Create"));

//#region Rapor
const year = ref(Number(todayIso().slice(0, 4)));
const data = ref<LedgerYear | null>(null);
const isLoading = ref(false);

const load = async () => {
  isLoading.value = true;
  try {
    data.value = await getLedgerYear(year.value);
  } catch {
    data.value = null;
  } finally {
    isLoading.value = false;
  }
};

watch(year, load);
//#endregion

//#region Hücre
// Kayıttan sonra rapor yeniden alınır (toplamlar ve ortalamalar sunucuda hesaplanır)
const saveCell = async (row: LedgerRow, month: number, amount: number | null) => {
  if (row.id === null) return;
  try {
    await setMonthlyAmount(row.id, year.value, month, amount);
  } catch {
    // Hata mesajı useApi tarafından gösterilir
  }
  await load();
};
//#endregion

//#region Kalem formu ve silme
const people = ref<{ id: number; name: string }[]>([]);
const formDialog = ref(false);
const editingItem = ref<LedgerItem | null>(null);
const rowToDelete = ref<LedgerRow | null>(null);
const isSaving = ref(false);

const openCreate = () => {
  editingItem.value = null;
  formDialog.value = true;
};

// hasAmounts ve isActive için kalem sunucudan alınır
const openEdit = async (row: LedgerRow) => {
  if (row.id === null) return;
  try {
    editingItem.value = await getLedgerItemById(row.id);
    formDialog.value = true;
  } catch {
    // Hata mesajı useApi tarafından gösterilir
  }
};

const openDelete = (row: LedgerRow) => {
  rowToDelete.value = row;
};

const submitItem = async (payload: CreateLedgerItemRequest | UpdateLedgerItemRequest) => {
  if (isSaving.value) return;
  isSaving.value = true;
  try {
    if (editingItem.value) {
      await updateLedgerItem(editingItem.value.id, payload as UpdateLedgerItemRequest);
      toastStore.add("success", "Kalem güncellendi");
    } else {
      await createLedgerItem(payload as CreateLedgerItemRequest);
      toastStore.add("success", "Kalem eklendi");
    }
    formDialog.value = false;
    await load();
  } catch {
    // Hata mesajı useApi tarafından gösterilir
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = async () => {
  if (!rowToDelete.value?.id || isSaving.value) return;
  isSaving.value = true;
  try {
    await deleteLedgerItem(rowToDelete.value.id);
    toastStore.add("success", "Kalem silindi");
    rowToDelete.value = null;
    await load();
  } catch {
    // Hata mesajı useApi tarafından gösterilir
  } finally {
    isSaving.value = false;
  }
};
//#endregion

//#region Lifecycle
onMounted(async () => {
  const peopleRes = await getPeople(1, 1000, "");
  people.value = peopleRes?.data?.items || [];
  await load();
});
//#endregion
</script>
