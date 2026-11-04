<template>
  <!-- Dönem seçici -->
  <PeriodSelector
    ref="periodSelectorRef"
    v-model="period"
    storage-key="abacasa.recurring.period"
    :payment-methods="paymentMethods"
  />

  <!-- Özet -->
  <div class="ui-row mb-2">
    <div class="ui-col ui-col-12 ui-col-md-4">
      <UiCard class="!bg-[rgb(var(--color-brand)/0.12)] !text-[rgb(var(--color-brand))]">
        <div class="ui-card-text">
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">Ödenen</div>
          <div class="text-[1.5rem] leading-[2rem] tracking-normal font-bold">{{ formatMoney(occurrences?.paidTotal ?? 0) }}</div>
        </div>
      </UiCard>
    </div>
    <div class="ui-col ui-col-12 ui-col-md-4">
      <UiCard class="!bg-[#fea619]/[0.12] !text-[#fea619]">
        <div class="ui-card-text">
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">Bekleyen</div>
          <div class="text-[1.5rem] leading-[2rem] tracking-normal font-bold">{{ formatMoney(occurrences?.pendingTotal ?? 0) }}</div>
        </div>
      </UiCard>
    </div>
    <div class="ui-col ui-col-12 ui-col-md-4">
      <UiCard class="!bg-[rgb(var(--color-brand)/0.12)] !text-[rgb(var(--color-brand))]">
        <div class="ui-card-text">
          <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">Toplam</div>
          <div class="text-[1.5rem] leading-[2rem] tracking-normal font-bold">{{ formatMoney(occurrences?.total ?? 0) }}</div>
        </div>
      </UiCard>
    </div>
  </div>

  <UiAlert
    v-if="(occurrences?.unknownCount ?? 0) > 0"
    type="info"
    variant="tonal"
    density="compact"
    class="mb-4"
  >
    {{ occurrences?.unknownCount }} kalemin tutarı belli değil
  </UiAlert>

  <div class="ui-row mb-4">
    <div class="ui-col ui-col-12">
      <UiCard elevation="0" border>
        <div class="ui-card-title !text-[1rem] !leading-[1.75rem] !tracking-[0.009375em] !font-normal">Ödeme aracına göre</div>
        <ul class="ui-list ui-list--compact">
          <li class="ui-list-item" v-for="row in occurrences?.byPaymentMethod ?? []" :key="row.id">
            <div class="ui-list-item__content">
              <div class="ui-list-title">{{ row.name }}</div>
              <div class="ui-list-subtitle">Ödenen {{ formatMoney(row.paidTotal) }} · Bekleyen {{ formatMoney(row.pendingTotal) }}</div>
            </div>
            <span class="ui-list-item__append">{{ formatMoney(row.total) }}</span>
          </li>
          <li class="ui-list-item" v-if="!occurrences?.byPaymentMethod?.length">
            <div class="ui-list-item__content">
              <div class="ui-list-title"><span class="text-black/60 dark:text-white/70">Kayıt yok</span></div>
            </div>
          </li>
        </ul>
      </UiCard>
    </div>
  </div>

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
      <span v-else class="font-medium">
        {{ formatMoney(item.amount) }}
        <UiChip v-if="item.isEstimated" size="x-small" variant="tonal" class="ml-1">tahmini</UiChip>
      </span>
    </template>

    <template #cell-status="{ item }">
      <UiChip v-if="item.isPaid" size="small" color="success" variant="tonal">
        Ödendi · {{ formatDisplayDate(item.paidDate) }}
      </UiChip>
      <UiChip v-else size="small" color="warning" variant="tonal">Bekliyor</UiChip>
    </template>

    <template #actions="{ item }">
      <UiBtn
        v-if="!item.isPaid && canPay"
        size="small"
        color="primary"
        variant="tonal"
        @click="openPayDialog(item)"
      >
        Öde
      </UiBtn>
      <UiBtn
        v-else-if="item.isPaid && canUndo(item)"
        size="small"
        color="error"
        variant="text"
        @click="openUndoDialog(item)"
      >
        Geri al
      </UiBtn>
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
