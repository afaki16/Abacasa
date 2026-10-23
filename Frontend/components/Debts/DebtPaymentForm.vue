<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <v-row dense>
      <v-col cols="12" sm="6" :md="isUsd ? 3 : 4">
        <v-text-field
          v-model="formData.date"
          label="Tarih"
          type="date"
          variant="outlined"
          :disabled="loading"
          density="compact"
          hide-details="auto"
          :rules="[rules.required]"
        />
      </v-col>
      <v-col cols="12" sm="6" :md="isUsd ? 3 : 4">
        <v-text-field
          v-model.number="formData.amount"
          :label="isUsd ? 'Tutar ($)' : 'Tutar (₺)'"
          type="number"
          min="0"
          step="0.01"
          variant="outlined"
          :disabled="loading"
          density="compact"
          hide-details="auto"
          :rules="[rules.required, positiveRule]"
        />
      </v-col>
      <!-- Kur yalnızca dövizde; güncel kurla dolu gelir, düzeltilebilir -->
      <v-col v-if="isUsd" cols="12" sm="6" md="3">
        <v-text-field
          v-model.number="formData.exchangeRate"
          label="Kur"
          type="number"
          min="0"
          step="0.0001"
          variant="outlined"
          :disabled="loading"
          density="compact"
          hide-details="auto"
          :rules="[rules.required, positiveRule]"
        />
      </v-col>
      <v-col cols="12" sm="6" :md="isUsd ? 3 : 4">
        <v-text-field
          v-model="formData.note"
          label="Not"
          variant="outlined"
          :disabled="loading"
          density="compact"
          hide-details="auto"
          :rules="[rules.maxLength(200)]"
        />
      </v-col>
    </v-row>

    <div class="d-flex align-center mt-3 ga-2">
      <span class="text-body-2">
        TL karşılığı: <strong>{{ formatMoney(amountInTry) }}</strong>
      </span>
      <v-spacer />
      <v-btn v-if="payment" variant="text" :disabled="loading" @click="$emit('cancel')">İptal</v-btn>
      <v-btn color="primary" :loading="loading" :disabled="loading || !isFormValid" type="submit">
        {{ payment ? 'Güncelle' : 'Ödeme ekle' }}
      </v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import type { DebtPayment, SaveDebtPaymentRequest } from '~/types'
import { Currency } from '~/types'
import { ref, reactive, watch, computed } from 'vue'
import { todayIso } from '~/utils/period'

const props = defineProps<{
  currency: Currency
  /** Yeni ödemede varsayılan tutar: kalan */
  remaining: number
  /** Yeni ödemede varsayılan kur: güncel kur */
  currentRate?: number | null
  /** Doluysa düzenleme */
  payment?: DebtPayment | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: SaveDebtPaymentRequest]
  cancel: []
}>()

const { validationRules: rules } = useValidators()
const { formatMoney } = useMoney()

const formRef = ref()
const formData = reactive({
  date: todayIso(),
  amount: null as number | null,
  exchangeRate: null as number | null,
  note: '',
})

const isUsd = computed(() => props.currency === Currency.USD)
const isFormValid = computed(() => formRef.value?.isValid ?? false)

const positiveRule = (v: number | null) => (v !== null && Number(v) > 0) || '0\'dan büyük olmalıdır'

// Backend ile aynı: dövizde tutar × kur, 2 haneye yuvarlanır
const amountInTry = computed(() => {
  const amount = Number(formData.amount) || 0
  if (!isUsd.value) return amount
  return Math.round(amount * (Number(formData.exchangeRate) || 0) * 100) / 100
})

const reset = () => {
  Object.assign(formData, {
    date: props.payment?.date || todayIso(),
    amount: props.payment?.amount ?? (props.remaining > 0 ? props.remaining : null),
    exchangeRate: props.payment ? props.payment.exchangeRate ?? null : props.currentRate ?? null,
    note: props.payment?.note || '',
  })
}

watch(() => [props.payment, props.remaining, props.currentRate, props.currency], reset, { immediate: true })

const handleSubmit = async () => {
  if (props.loading) return
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  emit('submit', {
    date: formData.date,
    amount: Number(formData.amount),
    exchangeRate: isUsd.value ? Number(formData.exchangeRate) : undefined,
    note: formData.note?.trim() || undefined,
  })
}

defineExpose({ reset })
</script>
