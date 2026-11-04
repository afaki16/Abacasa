<template>
  <UiCard elevation="0" border class="mb-4">
    <div class="ui-card-text">
      <div class="ui-row ui-row--dense ui-row--align-center">
        <div class="ui-col ui-col-12 ui-col-md-auto">
          <UiBtnToggle
            v-model="mode"
            :items="[
              { title: 'Takvim ayı', value: 'calendar' },
              { title: 'Kart dönemi', value: 'statement', disabled: creditCards.length === 0 },
            ]"
            mandatory
            color="primary"
            density="comfortable"
            divided
          />
        </div>

        <div class="ui-col ui-col-12 ui-col-md-3" v-if="mode === 'statement'">
          <UiSelect
            v-model="selectedCardId"
            :items="creditCards"
            item-title="name"
            item-value="id"
            label="Kredi kartı"
            density="compact"
            hide-details
          />
        </div>

        <div class="ui-col ui-col-12 ui-col-md-auto flex items-center gap-2">
          <UiBtn icon="mdi-chevron-left" variant="text" @click="shiftPeriod(-1)" />
          <span class="text-[1rem] leading-[1.5] tracking-[0.03125em] font-medium">
            {{ formatDisplayDate(period.start) }} – {{ formatDisplayDate(period.end) }}
          </span>
          <UiBtn icon="mdi-chevron-right" variant="text" @click="shiftPeriod(1)" />
        </div>
      </div>
    </div>
  </UiCard>
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
