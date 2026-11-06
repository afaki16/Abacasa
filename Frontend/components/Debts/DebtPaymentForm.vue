<template>
  <UiForm ref="formRef" @submit="handleSubmit">
    <div class="ui-row ui-row--dense">
      <div class="ui-col ui-col-12 ui-col-sm-6" :class="isForeign ? 'ui-col-md-3' : 'ui-col-md-4'">
        <UiTextField
          v-model="formData.date"
          :label="t('debts.columns.date')"
          type="date"
          :disabled="loading"
          density="compact"
          hide-details="auto"
          :rules="[rules.required]"
        />
      </div>
      <div class="ui-col ui-col-12 ui-col-sm-6" :class="isForeign ? 'ui-col-md-3' : 'ui-col-md-4'">
        <UiTextField
          v-model.number="formData.amount"
          :label="amountLabel"
          type="number"
          min="0"
          :step="isGold ? 1 : 0.01"
          :disabled="loading"
          density="compact"
          hide-details="auto"
          :rules="[rules.required, positiveRule, wholeRule]"
        />
      </div>
      <!-- Kur yalnızca yabancı birimde; güncel kurla dolu gelir, düzeltilebilir -->
      <div class="ui-col ui-col-12 ui-col-sm-6 ui-col-md-3" v-if="isForeign">
        <UiTextField
          v-model.number="formData.exchangeRate"
          :label="rateLabel"
          type="number"
          min="0"
          step="0.0001"
          :disabled="loading"
          density="compact"
          hide-details="auto"
          :rules="[rules.required, positiveRule]"
        />
      </div>
      <div class="ui-col ui-col-12 ui-col-sm-6" :class="isForeign ? 'ui-col-md-3' : 'ui-col-md-4'">
        <UiTextField
          v-model="formData.note"
          :label="t('debts.columns.note')"
          :disabled="loading"
          density="compact"
          hide-details="auto"
          :rules="[rules.maxLength(200)]"
        />
      </div>
    </div>

    <div class="flex items-center mt-3 gap-2">
      <i18n-t keypath="debts.payments.amountInTryLine" tag="span" scope="global" class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal">
        <template #amount><strong>{{ formatMoney(amountInTry) }}</strong></template>
      </i18n-t>
      <div class="flex-1" />
      <UiBtn v-if="payment" variant="text" :disabled="loading" @click="$emit('cancel')">{{ t('common.cancel') }}</UiBtn>
      <UiBtn color="primary" :loading="loading" :disabled="loading || !isFormValid" type="submit">
        {{ payment ? t('common.update') : t('debts.payments.add') }}
      </UiBtn>
    </div>
  </UiForm>
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

const { t } = useI18n()
const { validationRules: rules } = useValidators()
const { formatMoney } = useMoney()

const formRef = ref()
const formData = reactive({
  date: todayIso(),
  amount: null as number | null,
  exchangeRate: null as number | null,
  note: '',
})

// Yabancı birimde (döviz, çeyrek altın) ödeme kuru zorunlu; çeyrekte tutar adettir (tam sayı)
const isForeign = computed(() => props.currency !== Currency.TRY)
const isGold = computed(() => props.currency === Currency.QuarterGold)
const amountLabel = computed(() =>
  isGold.value ? t('debts.form.quantity') : props.currency === Currency.USD ? t('debts.payments.amountUsd') : props.currency === Currency.EUR ? t('debts.payments.amountEur') : t('debts.payments.amountTry')
)
const rateLabel = computed(() => (isGold.value ? t('exchangeRates.goldPrice') : t('debts.payments.rate')))
const wholeRule = (v: number | null) => !isGold.value || v === null || Number.isInteger(Number(v)) || t('debts.form.goldWhole')
const isFormValid = computed(() => formRef.value?.isValid ?? false)

const positiveRule = (v: number | null) => (v !== null && Number(v) > 0) || t('debts.payments.positive')

// Backend ile aynı: dövizde tutar × kur, 2 haneye yuvarlanır
const amountInTry = computed(() => {
  const amount = Number(formData.amount) || 0
  if (!isForeign.value) return amount
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
    exchangeRate: isForeign.value ? Number(formData.exchangeRate) : undefined,
    note: formData.note?.trim() || undefined,
  })
}

defineExpose({ reset })
</script>
