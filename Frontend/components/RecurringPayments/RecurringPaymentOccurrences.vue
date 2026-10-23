<template>
  <!-- Dönem seçici -->
  <PeriodSelector
    ref="periodSelectorRef"
    v-model="period"
    storage-key="abacasa.recurring.period"
    :payment-methods="paymentMethods"
  />

  <!-- Özet -->
  <v-row class="mb-2">
    <v-col cols="12" md="4">
      <v-card variant="tonal" color="success">
        <v-card-text>
          <div class="text-caption">Ödenen</div>
          <div class="text-h5 font-weight-bold">{{ formatMoney(occurrences?.paidTotal ?? 0) }}</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" md="4">
      <v-card variant="tonal" color="warning">
        <v-card-text>
          <div class="text-caption">Bekleyen</div>
          <div class="text-h5 font-weight-bold">{{ formatMoney(occurrences?.pendingTotal ?? 0) }}</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" md="4">
      <v-card variant="tonal" color="primary">
        <v-card-text>
          <div class="text-caption">Toplam</div>
          <div class="text-h5 font-weight-bold">{{ formatMoney(occurrences?.total ?? 0) }}</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-alert
    v-if="(occurrences?.unknownCount ?? 0) > 0"
    type="info"
    variant="tonal"
    density="compact"
    class="mb-4"
  >
    {{ occurrences?.unknownCount }} kalemin tutarı belli değil
  </v-alert>

  <v-row class="mb-4">
    <v-col cols="12">
      <v-card variant="outlined">
        <v-card-title class="text-subtitle-1">Ödeme aracına göre</v-card-title>
        <v-list density="compact">
          <v-list-item v-for="row in occurrences?.byPaymentMethod ?? []" :key="row.id">
            <template #title>{{ row.name }}</template>
            <template #subtitle>
              Ödenen {{ formatMoney(row.paidTotal) }} · Bekleyen {{ formatMoney(row.pendingTotal) }}
            </template>
            <template #append>{{ formatMoney(row.total) }}</template>
          </v-list-item>
          <v-list-item v-if="!occurrences?.byPaymentMethod?.length">
            <template #title><span class="text-medium-emphasis">Kayıt yok</span></template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>
  </v-row>

  <BaseDataTable
    :items="tableItems"
    :columns="tableColumns"
    title="Vadeler"
    toolbar-icon="mdi-calendar-clock"
    search-placeholder="Vadelerde ara..."
    :loading="isLoading"
    loading-text="Vadeler yükleniyor..."
    empty-title="Bu dönemde vade yok"
    :show-add-button="false"
    :show-advanced-filters="false"
    :show-actions="true"
    :show-pagination="true"
    :items-per-page="25"
    @refresh="loadOccurrences"
  >
    <template #cell-dueDate="{ value }">
      {{ formatDisplayDate(value) }}
    </template>

    <template #cell-name="{ item }">
      {{ item.installmentNo ? `${item.name} · ${item.installmentNo}/${item.installmentCount}` : item.name }}
    </template>

    <template #cell-kind="{ value }">
      {{ getKindLabel(value) }}
    </template>

    <template #cell-amount="{ item }">
      <span v-if="item.amount === null || item.amount === undefined">—</span>
      <span v-else class="font-weight-medium">
        {{ formatMoney(item.amount) }}
        <v-chip v-if="item.isEstimated" size="x-small" variant="tonal" class="ml-1">tahmini</v-chip>
      </span>
    </template>

    <template #cell-status="{ item }">
      <v-chip v-if="item.isPaid" size="small" color="success" variant="tonal">
        Ödendi · {{ formatDisplayDate(item.paidDate) }}
      </v-chip>
      <v-chip v-else size="small" color="warning" variant="tonal">Bekliyor</v-chip>
    </template>

    <template #actions="{ item }">
      <v-btn
        v-if="!item.isPaid && canPay"
        size="small"
        color="primary"
        variant="tonal"
        @click="openPayDialog(item)"
      >
        Öde
      </v-btn>
      <v-btn
        v-else-if="item.isPaid && canUndo(item)"
        size="small"
        color="error"
        variant="text"
        @click="openUndoDialog(item)"
      >
        Geri al
      </v-btn>
    </template>
  </BaseDataTable>

  <!-- Öde -->
  <ResizableDrawer
    v-model="payDialog"
    title="Öde"
    :subtitle="payTarget ? `${payTarget.name} · ${formatDisplayDate(payTarget.dueDate)}` : ''"
    icon="mdi-cash-check"
    :default-width="500"
    :min-width="400"
  >
    <RecurringPaymentPayForm
      :occurrence="payTarget"
      :loading="isPaying"
      @submit="confirmPay"
      @cancel="payDialog = false"
    />
  </ResizableDrawer>

  <!-- Geri al -->
  <ConfirmDialog
    v-model="undoDialog"
    title="Ödemeyi geri al"
    :message="`Oluşturulan ${undoTarget?.donationId ? 'bağış' : 'harcama'} kaydı silinecek.`"
    type="error"
    confirm-text="Geri al"
    :loading="isUndoing"
    @confirm="confirmUndo"
    @cancel="undoDialog = false"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { PaymentMethod, RecurringPaymentOccurrence, RecurringPaymentOccurrences } from "~/types";
import BaseDataTable from "~/components/UI/BaseDataTable.vue";
import ResizableDrawer from "~/components/UI/ResizableDrawer.vue";
import ConfirmDialog from "~/components/UI/ConfirmDialog.vue";
import PeriodSelector from "~/components/Budget/PeriodSelector.vue";
import RecurringPaymentPayForm from "~/components/RecurringPayments/RecurringPaymentPayForm.vue";
import { formatDisplayDate, monthRange, todayIso, type Period } from "~/utils/period";
import { useToastStore } from "~/stores/toast";

//#region DataTable Columns
const tableColumns = [
  { label: "Vade", key: "dueDate", sortable: false, width: "120px" },
  { label: "Ad", key: "name", sortable: false, width: "220px" },
  { label: "Tür", key: "kind", sortable: false, width: "120px" },
  { label: "Ödeme aracı", key: "paymentMethodName", sortable: false, width: "160px" },
  { label: "Tutar", key: "amount", sortable: false, width: "160px" },
  { label: "Durum", key: "status", sortable: false, width: "180px" },
];
//#endregion

//#region Composables
const { formatMoney } = useMoney();
const { hasPermission } = useAuth();
const { getPaymentMethods } = usePaymentMethods();
const { getKindLabel, getOccurrences, payRecurringPayment } = useRecurringPayments();
const { deleteExpense } = useExpenses();
const { deleteDonation } = useDonations();
const toastStore = useToastStore();
//#endregion

//#region Dönem ve vadeler
const paymentMethods = ref<PaymentMethod[]>([]);
const periodSelectorRef = ref<InstanceType<typeof PeriodSelector> | null>(null);
const [todayYear, todayMonth] = todayIso().split("-").map(Number);
const period = ref<Period>(monthRange(todayYear, todayMonth));

const occurrences = ref<RecurringPaymentOccurrences | null>(null);
const isLoading = ref(false);

// Tablo satırlarına benzersiz id (plan + ay)
const tableItems = computed(() =>
  (occurrences.value?.items ?? []).map((o) => ({ ...o, id: `${o.recurringPaymentId}-${o.month}` }))
);

const loadOccurrences = async () => {
  isLoading.value = true;
  try {
    occurrences.value = await getOccurrences(period.value.start, period.value.end);
  } catch {
    occurrences.value = null;
  } finally {
    isLoading.value = false;
  }
};

let ready = false;
watch(period, () => {
  if (ready) loadOccurrences();
});
//#endregion

//#region Öde
const canPay = computed(() => hasPermission("RecurringPaymentPayments.Create"));
const payDialog = ref(false);
const payTarget = ref<RecurringPaymentOccurrence | null>(null);
const isPaying = ref(false);

const openPayDialog = (item: RecurringPaymentOccurrence) => {
  payTarget.value = item;
  payDialog.value = true;
};

const confirmPay = async (data: { amount: number; date: string }) => {
  if (!payTarget.value || isPaying.value) return;
  isPaying.value = true;
  try {
    await payRecurringPayment(payTarget.value.recurringPaymentId, {
      month: payTarget.value.month,
      amount: data.amount,
      date: data.date,
    });
    toastStore.add("success", "Ödeme kaydedildi");
    payDialog.value = false;
    await loadOccurrences();
  } catch {
    // Hata mesajı useApi tarafından gösterilir
  } finally {
    isPaying.value = false;
  }
};
//#endregion

//#region Geri al
const undoDialog = ref(false);
const undoTarget = ref<RecurringPaymentOccurrence | null>(null);
const isUndoing = ref(false);

// Geri alma bağlı kaydı siler; ilgili silme izni gerekir
const canUndo = (item: RecurringPaymentOccurrence) =>
  item.donationId ? hasPermission("Donations.Delete") : hasPermission("Expenses.Delete");

const openUndoDialog = (item: RecurringPaymentOccurrence) => {
  undoTarget.value = item;
  undoDialog.value = true;
};

const confirmUndo = async () => {
  if (!undoTarget.value || isUndoing.value) return;
  isUndoing.value = true;
  try {
    if (undoTarget.value.donationId) await deleteDonation(String(undoTarget.value.donationId));
    else if (undoTarget.value.expenseId) await deleteExpense(String(undoTarget.value.expenseId));
    toastStore.add("success", "Ödeme geri alındı");
    undoDialog.value = false;
    await loadOccurrences();
  } catch {
    // Hata mesajı useApi tarafından gösterilir
  } finally {
    isUndoing.value = false;
  }
};
//#endregion

//#region Lifecycle
onMounted(async () => {
  const paymentMethodRes = await getPaymentMethods(1, 1000, "");
  paymentMethods.value = paymentMethodRes?.data?.items || [];

  // Son seçimi geri yükle; kart artık yoksa takvim ayına dön
  await periodSelectorRef.value?.restore();

  // İlk yükleme; watcher bu sırada tetiklenirse ikinci kez yüklemesin
  await loadOccurrences();
  ready = true;
});
//#endregion
</script>
