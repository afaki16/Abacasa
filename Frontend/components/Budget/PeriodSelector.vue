<template>
  <v-card class="mb-4" variant="outlined">
    <v-card-text>
      <v-row align="center" dense>
        <v-col cols="12" md="auto">
          <v-btn-toggle
            v-model="mode"
            mandatory
            color="primary"
            density="comfortable"
            variant="outlined"
            divided
          >
            <v-btn value="calendar">Takvim ayı</v-btn>
            <v-btn value="statement" :disabled="creditCards.length === 0">Kart dönemi</v-btn>
          </v-btn-toggle>
        </v-col>

        <v-col v-if="mode === 'statement'" cols="12" md="3">
          <v-select
            v-model="selectedCardId"
            :items="creditCards"
            item-title="name"
            item-value="id"
            label="Kredi kartı"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>

        <v-col cols="12" md="auto" class="d-flex align-center ga-2">
          <v-btn icon="mdi-chevron-left" variant="text" @click="shiftPeriod(-1)" />
          <span class="text-body-1 font-weight-medium">
            {{ formatDisplayDate(period.start) }} – {{ formatDisplayDate(period.end) }}
          </span>
          <v-btn icon="mdi-chevron-right" variant="text" @click="shiftPeriod(1)" />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import type { PaymentMethod } from "~/types";
import { PaymentMethodType } from "~/types";
import {
  addMonths,
  currentStatementPeriod,
  formatDisplayDate,
  monthRange,
  statementPeriod,
  todayIso,
  type Period,
} from "~/utils/period";

// Takvim ayı / kart dönemi seçici. Seçilen mod ve kart storageKey altında hatırlanır.
const props = defineProps<{
  storageKey: string;
  paymentMethods: PaymentMethod[];
}>();

const period = defineModel<Period>({ required: true });

const creditCards = computed(() =>
  props.paymentMethods.filter(
    (pm) => pm.type === PaymentMethodType.CreditCard && pm.isActive && pm.statementDay
  )
);

type PeriodMode = "calendar" | "statement";

const mode = ref<PeriodMode>("calendar");
const selectedCardId = ref<number | null>(null);
const today = todayIso();
const [todayYear, todayMonth] = today.split("-").map(Number);

const selectedCard = computed(() => creditCards.value.find((c) => c.id === selectedCardId.value));

const readStoredSelection = (): { mode?: PeriodMode; cardId?: number } => {
  try {
    const raw = localStorage.getItem(props.storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const storeSelection = () => {
  try {
    localStorage.setItem(props.storageKey, JSON.stringify({ mode: mode.value, cardId: selectedCardId.value }));
  } catch {
    // Depolama kullanılamıyorsa seçim hatırlanmaz
  }
};

// Bugünü içeren dönem (moda göre)
const resetToCurrentPeriod = () => {
  if (mode.value === "statement" && selectedCard.value?.statementDay) {
    period.value = currentStatementPeriod(today, selectedCard.value.statementDay);
  } else {
    period.value = monthRange(todayYear, todayMonth);
  }
};

const shiftPeriod = (direction: number) => {
  const next = addMonths(period.value.year, period.value.month, direction);
  period.value =
    mode.value === "statement" && selectedCard.value?.statementDay
      ? statementPeriod(next.year, next.month, selectedCard.value.statementDay)
      : monthRange(next.year, next.month);
};

watch(mode, (value) => {
  if (value === "statement" && !selectedCard.value) {
    selectedCardId.value = creditCards.value[0]?.id ?? null;
  }
  resetToCurrentPeriod();
  storeSelection();
});

watch(selectedCardId, () => {
  if (mode.value === "statement") resetToCurrentPeriod();
  storeSelection();
});

// Son seçimi geri yükle; kart artık yoksa takvim ayına dön.
// Sayfa ödeme araçlarını yükledikten sonra çağırır; nextTick yeni prop değerinin gelmesini bekler.
const restore = async () => {
  await nextTick();
  const stored = readStoredSelection();
  if (stored.mode === "statement" && creditCards.value.some((c) => c.id === stored.cardId)) {
    selectedCardId.value = stored.cardId ?? null;
    mode.value = "statement";
  }
  resetToCurrentPeriod();
};

defineExpose({ restore });
</script>
