<template>
  <!-- Hanesiz kullanıcı: API çağrılmaz, hane oluşturma kartı -->
  <template v-if="!hasHousehold">
    <UiCard elevation="0" border class="p-6">
      <div class="text-[1.25rem] leading-[2rem] tracking-[0.0125em] font-medium">{{ t('dashboard.noHousehold.title') }}</div>
      <div class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal text-black/60 dark:text-white/70 mt-1">
        {{ t('dashboard.noHousehold.description') }}
      </div>
      <UiBtn color="primary" prepend-icon="mdi-home-plus" class="mt-4" @click="createDialog = true">{{ t('dashboard.noHousehold.create') }}</UiBtn>
    </UiCard>
    <CreateHouseholdDialog v-model="createDialog" />
  </template>

  <!-- Dashboard.Read yoksa API çağrılmaz; kısa hoş geldin mesajı -->
  <UiCard elevation="0" border v-else-if="!canRead" class="p-6">
    <div class="text-[1.25rem] leading-[2rem] tracking-[0.0125em] font-medium">{{ greeting }}</div>
    <div class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal text-black/60 dark:text-white/70 mt-1">{{ t('dashboard.welcomeApp') }}</div>
  </UiCard>

  <template v-else>
    <!-- Dönem seçici -->
    <PeriodSelector
      ref="periodSelectorRef"
      v-model="period"
      storage-key="abacasa.dashboard.period"
      :payment-methods="paymentMethods"
    />

    <!-- Kartlar -->
    <div class="ui-row ui-row--stats !mb-2">
      <div class="ui-col ui-col-12 ui-col-sm-6 ui-col-md-3">
        <UiCard class="h-full !bg-[rgb(var(--color-brand)/0.12)] !text-[rgb(var(--color-brand))]">
          <div class="ui-card-text">
            <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ t('dashboard.cards.periodTotal') }}</div>
            <div class="text-[1.5rem] leading-[2rem] tracking-normal font-bold">{{ formatMoney(data?.outflowTotal ?? 0) }}</div>
            <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">
              {{ t('dashboard.cards.periodBreakdown', { expenses: formatMoney(data?.spent.expenses ?? 0), donations: formatMoney(data?.spent.donations ?? 0), pending: formatMoney(data?.pending.total ?? 0) }) }}
            </div>
            <div v-if="(data?.pending.unknownCount ?? 0) > 0" class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">
              {{ t('dashboard.cards.unknownAmounts', { count: data?.pending.unknownCount }, data?.pending.unknownCount ?? 0) }}
            </div>
          </div>
        </UiCard>
      </div>
      <div class="ui-col ui-col-12 ui-col-sm-6 ui-col-md-3">
        <UiCard class="h-full !bg-[#0d9488]/[0.12] !text-[#0d9488]">
          <div class="ui-card-text">
            <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ t('dashboard.cards.recurring') }}</div>
            <div class="text-[1.5rem] leading-[2rem] tracking-normal font-bold">{{ formatMoney(data?.recurring.total ?? 0) }}</div>
            <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">
              {{ t('dashboard.cards.recurringBreakdown', { paid: formatMoney(data?.recurring.paidTotal ?? 0), pending: formatMoney(data?.recurring.pendingTotal ?? 0) }) }}
            </div>
          </div>
        </UiCard>
      </div>
      <div class="ui-col ui-col-12 ui-col-sm-6 ui-col-md-3">
        <!-- Borçlar sayfasındaki kartla aynı kurallar -->
        <UiCard class="h-full !bg-[#fea619]/[0.12] !text-[#fea619]">
          <div class="ui-card-text">
            <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ t('dashboard.cards.openDebt') }}</div>
            <div class="text-[1.5rem] leading-[2rem] tracking-normal font-bold">
              {{ formatMoney(data?.debts.openTotalInTry) }}
            </div>
            <!-- TL ve yabancı birimler tek satırda -->
            <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">
              {{ formatOpenLine(data?.debts.openTry ?? 0, data?.debts.foreign ?? []) }}
            </div>
            <div v-if="missingRateLabels.length" class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ t('dashboard.cards.missingRate', { currencies: missingRateLabels.join(", ") }) }}</div>
          </div>
        </UiCard>
      </div>
      <div class="ui-col ui-col-12 ui-col-sm-6 ui-col-md-3">
        <UiCard class="h-full !bg-secondary/[0.12] !text-secondary">
          <div class="ui-card-text">
            <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ t('dashboard.cards.mealCard') }}</div>
            <div class="text-[1.5rem] leading-[2rem] tracking-normal font-bold">{{ formatMoney(data?.mealCard.total ?? 0) }}</div>
            <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">
              {{ t('dashboard.cards.mealCardBreakdown', { spent: formatMoney(data?.mealCard.spent ?? 0), pending: formatMoney(data?.mealCard.pending ?? 0) }) }}
            </div>
          </div>
        </UiCard>
      </div>
    </div>

    <!-- Ödeme aracına ve kişiye göre -->
    <div class="ui-row !mb-2">
      <div class="ui-col ui-col-12 ui-col-md-6">
        <UiCard elevation="0" border class="h-full">
          <div class="ui-card-title !text-[1rem] !leading-[1.75rem] !tracking-[0.009375em] !font-normal">{{ t('dashboard.byPaymentMethod') }}</div>
          <div class="overflow-x-auto"><table v-stack-table class="ui-table ui-table--compact">
            <thead>
              <tr>
                <th>{{ t('dashboard.columns.name') }}</th>
                <th>{{ t('dashboard.columns.type') }}</th>
                <th class="!text-right">{{ t('dashboard.columns.spent') }}</th>
                <th class="!text-right">{{ t('dashboard.columns.pending') }}</th>
                <th class="!text-right">{{ t('dashboard.columns.total') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in data?.byPaymentMethod ?? []" :key="row.id">
                <td>{{ row.name }}</td>
                <td>{{ getTypeLabel(row.type) }}</td>
                <td class="!text-right">{{ formatMoney(row.spent) }}</td>
                <td class="!text-right">{{ formatMoney(row.pending) }}</td>
                <td class="!text-right font-medium">{{ formatMoney(row.total) }}</td>
              </tr>
              <tr v-if="!data?.byPaymentMethod?.length">
                <td colspan="5" class="text-black/60 dark:text-white/70">{{ t('dashboard.noRecords') }}</td>
              </tr>
            </tbody>
          </table></div>
        </UiCard>
      </div>
      <div class="ui-col ui-col-12 ui-col-md-6">
        <UiCard elevation="0" border class="h-full">
          <div class="ui-card-title !text-[1rem] !leading-[1.75rem] !tracking-[0.009375em] !font-normal">{{ t('dashboard.byPerson') }}</div>
          <div class="overflow-x-auto"><table v-stack-table class="ui-table ui-table--compact">
            <thead>
              <tr>
                <th>{{ t('dashboard.columns.name') }}</th>
                <th class="!text-right">{{ t('dashboard.columns.spent') }}</th>
                <th class="!text-right">{{ t('dashboard.columns.pending') }}</th>
                <th class="!text-right">{{ t('dashboard.columns.total') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in data?.byPerson ?? []" :key="row.personId ?? 'household'">
                <td>{{ row.name ?? t("dashboard.household") }}</td>
                <td class="!text-right">{{ formatMoney(row.spent) }}</td>
                <td class="!text-right">{{ formatMoney(row.pending) }}</td>
                <td class="!text-right font-medium">{{ formatMoney(row.total) }}</td>
              </tr>
              <tr v-if="!data?.byPerson?.length">
                <td colspan="4" class="text-black/60 dark:text-white/70">{{ t('dashboard.noRecords') }}</td>
              </tr>
            </tbody>
            <tfoot v-if="data?.byPerson?.length">
              <tr class="font-bold">
                <td>{{ t('dashboard.columns.total') }}</td>
                <td class="!text-right">{{ formatMoney(personTotals.spent) }}</td>
                <td class="!text-right">{{ formatMoney(personTotals.pending) }}</td>
                <td class="!text-right">{{ formatMoney(personTotals.total) }}</td>
              </tr>
            </tfoot>
          </table></div>
        </UiCard>
      </div>
    </div>

    <!-- Yaklaşan ödemeler -->
    <UiCard elevation="0" border>
      <div class="ui-card-title !text-[1rem] !leading-[1.75rem] !tracking-[0.009375em] !font-normal">
        <div class="flex items-center">
          {{ t('dashboard.upcoming.title') }}
          <div class="flex-1" />
          <NuxtLink to="/recurring-payments" class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal text-[rgb(var(--color-brand))]">{{ t('dashboard.upcoming.goToRecurring') }}</NuxtLink>
        </div>
      </div>
      <div class="overflow-x-auto"><table v-stack-table class="ui-table ui-table--compact">
        <thead>
          <tr>
            <th>{{ t('dashboard.upcoming.dueDate') }}</th>
            <th>{{ t('dashboard.columns.name') }}</th>
            <th>{{ t('dashboard.columns.type') }}</th>
            <th>{{ t('dashboard.upcoming.paymentMethod') }}</th>
            <th class="!text-right">{{ t('dashboard.upcoming.amount') }}</th>
            <th>{{ t('dashboard.upcoming.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in data?.upcoming ?? []"
            :key="`${item.source}-${item.recurringPaymentId ?? item.vehicleId}-${item.obligationType ?? ''}-${item.dueDate}`"
          >
            <td>{{ formatDisplayDate(item.dueDate) }}</td>
            <!-- Araç satırı Araçlar sayfasına bağlanır -->
            <td>
              <NuxtLink v-if="item.source === 'vehicle'" to="/vehicles" class="text-[rgb(var(--color-brand))]">{{ item.name }}</NuxtLink>
              <template v-else>{{ item.name }}</template>
            </td>
            <td>
              {{ item.source === 'vehicle' && item.obligationType ? getObligationTypeLabel(item.obligationType) : item.kind ? getKindLabel(item.kind) : '' }}
            </td>
            <td>{{ item.source === 'vehicle' ? '—' : item.paymentMethodName }}</td>
            <td class="!text-right">
              {{ formatMoney(item.amount) }}
              <UiChip v-if="item.isEstimated" size="x-small" variant="tonal" class="ml-1">{{ t('dashboard.upcoming.estimated') }}</UiChip>
            </td>
            <td>
              <UiChip v-if="item.isOverdue" size="small" color="error" variant="tonal">{{ t('dashboard.upcoming.overdue') }}</UiChip>
              <span v-else>{{ dueLabel(item.dueDate) }}</span>
            </td>
          </tr>
          <tr v-if="!data?.upcoming?.length">
            <td colspan="6" class="text-black/60 dark:text-white/70">{{ t('dashboard.upcoming.empty') }}</td>
          </tr>
        </tbody>
      </table></div>
    </UiCard>
  </template>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { Dashboard, PaymentMethod } from "~/types";
import PeriodSelector from "~/components/Budget/PeriodSelector.vue";
import CreateHouseholdDialog from "~/components/Household/CreateHouseholdDialog.vue";
import { formatDisplayDate, monthRange, todayIso, type Period } from "~/utils/period";
import { useAuthStore } from "~/stores/auth";

// Permission middleware yok: izni olmayan kullanıcı hoş geldin mesajını görür
definePageMeta({
  title: "Özet",
  requiresAuth: true,
});

const { t } = useI18n();

useHead({
  title: computed(() => t("dashboard.title")),
});

//#region Composables
const authStore = useAuthStore();
const { hasPermission } = useAuth();
const { formatMoney, currencyLabel, formatOpenLine } = useMoney();
const { getTypeLabel, getPaymentMethods } = usePaymentMethods();
const { getKindLabel } = useRecurringPayments();
const { getTypeLabel: getObligationTypeLabel } = useVehicles();
const { getDashboard } = useDashboard();
//#endregion

const hasHousehold = computed(() => !!authStore.user?.activeTenant);
const createDialog = ref(false);
const canRead = computed(() => hasPermission("Dashboard.Read"));
const greeting = computed(() => (authStore.userFullName ? t("dashboard.helloName", { name: authStore.userFullName }) : t("dashboard.hello")));

//#region Dönem ve veri
const paymentMethods = ref<PaymentMethod[]>([]);
const periodSelectorRef = ref<InstanceType<typeof PeriodSelector> | null>(null);
const today = todayIso();
const [todayYear, todayMonth] = today.split("-").map(Number);
const period = ref<Period>(monthRange(todayYear, todayMonth));
const data = ref<Dashboard | null>(null);

const load = async () => {
  try {
    data.value = await getDashboard(period.value.start, period.value.end, today);
  } catch {
    data.value = null;
  }
};

let ready = false;
watch(period, () => {
  if (ready) load();
});
//#endregion

// Açığı olup kuru olmayan birimler (Borçlar sayfasındaki kural)
const missingRateLabels = computed(() =>
  (data.value?.debts.foreign ?? []).filter((f) => f.openInTry === null).map((f) => currencyLabel(f.currency))
);

const personTotals = computed(() => {
  const rows = data.value?.byPerson ?? [];
  return {
    spent: rows.reduce((sum, r) => sum + r.spent, 0),
    pending: rows.reduce((sum, r) => sum + r.pending, 0),
    total: rows.reduce((sum, r) => sum + r.total, 0),
  };
});

// Vadeye kalan gün; tarihler 'YYYY-MM-DD', saat dilimi etkisi olmasın diye UTC'de karşılaştırılır
const dueLabel = (dueDate: string) => {
  const days = Math.round((Date.parse(`${dueDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
  return days === 0 ? t("dashboard.upcoming.today") : t("dashboard.upcoming.daysLeft", { days }, days);
};

//#region Lifecycle
onMounted(async () => {
  if (!hasHousehold.value || !canRead.value) return;

  // Kart dönemi seçimi için ödeme araçları; izin yoksa yalnızca takvim ayı
  if (hasPermission("PaymentMethods.Read")) {
    const paymentMethodRes = await getPaymentMethods(1, 1000, "");
    paymentMethods.value = paymentMethodRes?.data?.items || [];
  }

  // Son seçimi geri yükle; kart artık yoksa takvim ayına dön
  await periodSelectorRef.value?.restore();

  // İlk yükleme; watcher bu sırada tetiklenirse ikinci kez yüklemesin
  await load();
  ready = true;
});
//#endregion
</script>
