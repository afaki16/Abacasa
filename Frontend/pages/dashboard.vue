<template>
  <!-- Dashboard.Read yoksa API çağrılmaz; kısa hoş geldin mesajı -->
  <v-card v-if="!canRead" variant="outlined" class="pa-6">
    <div class="text-h6">{{ greeting }}</div>
    <div class="text-body-2 text-medium-emphasis mt-1">Abacasa'ya hoş geldiniz.</div>
  </v-card>

  <template v-else>
    <!-- Dönem seçici -->
    <PeriodSelector
      ref="periodSelectorRef"
      v-model="period"
      storage-key="abacasa.dashboard.period"
      :payment-methods="paymentMethods"
    />

    <!-- Kartlar -->
    <v-row class="mb-2">
      <v-col cols="12" sm="6" md="3">
        <v-card variant="tonal" color="primary" class="fill-height">
          <v-card-text>
            <div class="text-caption">Dönem toplamı (yemek kartı hariç)</div>
            <div class="text-h5 font-weight-bold">{{ formatMoney(data?.outflowTotal ?? 0) }}</div>
            <div class="text-caption">
              Harcama {{ formatMoney(data?.spent.expenses ?? 0) }} · Bağış {{ formatMoney(data?.spent.donations ?? 0) }} ·
              Bekleyen {{ formatMoney(data?.pending.total ?? 0) }}
            </div>
            <div v-if="(data?.pending.unknownCount ?? 0) > 0" class="text-caption">
              {{ data?.pending.unknownCount }} kalemin tutarı belli değil
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card variant="tonal" color="info" class="fill-height">
          <v-card-text>
            <div class="text-caption">Sabit ödemeler</div>
            <div class="text-h5 font-weight-bold">{{ formatMoney(data?.recurring.total ?? 0) }}</div>
            <div class="text-caption">
              Ödenen {{ formatMoney(data?.recurring.paidTotal ?? 0) }} · Bekleyen {{ formatMoney(data?.recurring.pendingTotal ?? 0) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <!-- Borçlar sayfasındaki kartla aynı kurallar -->
        <v-card variant="tonal" color="warning" class="fill-height">
          <v-card-text>
            <div class="text-caption">Açık borç (TL karşılığı)</div>
            <div class="text-h5 font-weight-bold">
              {{ usdRateMissing ? "—" : formatMoney(data?.debts.openTotalInTry ?? 0) }}
            </div>
            <div class="text-caption">
              {{ formatMoney(data?.debts.openTry ?? 0) }} · {{ formatMoney(data?.debts.openUsd ?? 0, "USD") }}
              <template v-if="data?.debts.usdRate"> · Kur {{ formatDisplayDate(data.debts.usdRate.date) }}</template>
            </div>
            <div v-if="usdRateMissing" class="text-caption">Kur girilmemiş</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card variant="tonal" color="secondary" class="fill-height">
          <v-card-text>
            <div class="text-caption">Yemek kartı</div>
            <div class="text-h5 font-weight-bold">{{ formatMoney(data?.mealCard.total ?? 0) }}</div>
            <div class="text-caption">
              Harcanan {{ formatMoney(data?.mealCard.spent ?? 0) }} · Bekleyen {{ formatMoney(data?.mealCard.pending ?? 0) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Ödeme aracına ve kişiye göre -->
    <v-row class="mb-2">
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="fill-height">
          <v-card-title class="text-subtitle-1">Ödeme aracına göre</v-card-title>
          <v-table density="compact">
            <thead>
              <tr>
                <th>Ad</th>
                <th>Tür</th>
                <th class="text-right">Gerçekleşen</th>
                <th class="text-right">Bekleyen</th>
                <th class="text-right">Toplam</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in data?.byPaymentMethod ?? []" :key="row.id">
                <td>{{ row.name }}</td>
                <td>{{ getTypeLabel(row.type) }}</td>
                <td class="text-right">{{ formatMoney(row.spent) }}</td>
                <td class="text-right">{{ formatMoney(row.pending) }}</td>
                <td class="text-right font-weight-medium">{{ formatMoney(row.total) }}</td>
              </tr>
              <tr v-if="!data?.byPaymentMethod?.length">
                <td colspan="5" class="text-medium-emphasis">Kayıt yok</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="fill-height">
          <v-card-title class="text-subtitle-1">Kişiye göre</v-card-title>
          <v-table density="compact">
            <thead>
              <tr>
                <th>Ad</th>
                <th class="text-right">Gerçekleşen</th>
                <th class="text-right">Bekleyen</th>
                <th class="text-right">Toplam</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in data?.byPerson ?? []" :key="row.personId ?? 'household'">
                <td>{{ row.name ?? "Hane" }}</td>
                <td class="text-right">{{ formatMoney(row.spent) }}</td>
                <td class="text-right">{{ formatMoney(row.pending) }}</td>
                <td class="text-right font-weight-medium">{{ formatMoney(row.total) }}</td>
              </tr>
              <tr v-if="!data?.byPerson?.length">
                <td colspan="4" class="text-medium-emphasis">Kayıt yok</td>
              </tr>
            </tbody>
            <tfoot v-if="data?.byPerson?.length">
              <tr class="font-weight-bold">
                <td>Toplam</td>
                <td class="text-right">{{ formatMoney(personTotals.spent) }}</td>
                <td class="text-right">{{ formatMoney(personTotals.pending) }}</td>
                <td class="text-right">{{ formatMoney(personTotals.total) }}</td>
              </tr>
            </tfoot>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Yaklaşan ödemeler -->
    <v-card variant="outlined">
      <v-card-title class="d-flex align-center text-subtitle-1">
        Yaklaşan ödemeler
        <v-spacer />
        <NuxtLink to="/recurring-payments" class="text-body-2 text-primary">Sabit ödemeler'e git</NuxtLink>
      </v-card-title>
      <v-table density="compact">
        <thead>
          <tr>
            <th>Vade</th>
            <th>Ad</th>
            <th>Tür</th>
            <th>Ödeme aracı</th>
            <th class="text-right">Tutar</th>
            <th>Durum</th>
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
              <NuxtLink v-if="item.source === 'vehicle'" to="/vehicles" class="text-primary">{{ item.name }}</NuxtLink>
              <template v-else>{{ item.name }}</template>
            </td>
            <td>
              {{ item.source === 'vehicle' && item.obligationType ? getObligationTypeLabel(item.obligationType) : item.kind ? getKindLabel(item.kind) : '' }}
            </td>
            <td>{{ item.source === 'vehicle' ? '—' : item.paymentMethodName }}</td>
            <td class="text-right">
              {{ formatMoney(item.amount) }}
              <v-chip v-if="item.isEstimated" size="x-small" variant="tonal" class="ml-1">tahmini</v-chip>
            </td>
            <td>
              <v-chip v-if="item.isOverdue" size="small" color="error" variant="tonal">Gecikti</v-chip>
              <span v-else>{{ dueLabel(item.dueDate) }}</span>
            </td>
          </tr>
          <tr v-if="!data?.upcoming?.length">
            <td colspan="6" class="text-medium-emphasis">Yaklaşan ödeme yok</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </template>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { Dashboard, PaymentMethod } from "~/types";
import PeriodSelector from "~/components/Budget/PeriodSelector.vue";
import { formatDisplayDate, monthRange, todayIso, type Period } from "~/utils/period";
import { useAuthStore } from "~/stores/auth";

// Permission middleware yok: izni olmayan kullanıcı hoş geldin mesajını görür
definePageMeta({
  title: "Özet",
  requiresAuth: true,
});

useHead({
  title: "Özet",
});

//#region Composables
const authStore = useAuthStore();
const { hasPermission } = useAuth();
const { formatMoney } = useMoney();
const { getTypeLabel, getPaymentMethods } = usePaymentMethods();
const { getKindLabel } = useRecurringPayments();
const { getTypeLabel: getObligationTypeLabel } = useVehicles();
const { getDashboard } = useDashboard();
//#endregion

const canRead = computed(() => hasPermission("Dashboard.Read"));
const greeting = computed(() => (authStore.userFullName ? `Merhaba, ${authStore.userFullName}` : "Merhaba"));

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

// Borçlar sayfasındaki kural: TL karşılığı yalnızca açık dolar varken kur yoksa hesaplanamaz
const usdRateMissing = computed(() => !!data.value && data.value.debts.openUsd > 0 && !data.value.debts.usdRate);

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
  return days === 0 ? "Bugün" : `${days} gün kaldı`;
};

//#region Lifecycle
onMounted(async () => {
  if (!canRead.value) return;

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
