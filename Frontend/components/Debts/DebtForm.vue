<template>
  <UiForm ref="formRef" @submit="handleSubmit">
    <div class="ui-container">
      <div class="ui-row">
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiTextField
            v-model="formData.date"
            label="Tarih"
            type="date"
            :disabled="loading"
            prepend-inner-icon="mdi-calendar"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiSelect
            v-model="formData.creditorPersonId"
            :items="people"
            item-title="name"
            item-value="id"
            label="Alacaklı"
            :disabled="loading"
            prepend-inner-icon="mdi-account-arrow-left"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </div>
      </div>

      <div class="ui-row">
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiSelect
            v-model="formData.debtorPersonId"
            :items="debtorOptions"
            item-title="name"
            item-value="id"
            label="Borçlu"
            :disabled="loading"
            prepend-inner-icon="mdi-account"
            density="comfortable"
            hide-details="auto"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <!-- Ödemesi olan borcun para birimi değiştirilemez -->
          <UiSelect
            v-model="formData.currency"
            :items="currencyOptions"
            item-title="title"
            item-value="value"
            label="Para birimi"
            :disabled="loading || !!debt?.hasPayments"
            :hint="debt?.hasPayments ? 'Ödemesi olan borcun para birimi değiştirilemez' : ''"
            persistent-hint
            prepend-inner-icon="mdi-cash"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </div>
      </div>

      <div class="ui-row">
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiTextField
            v-model.number="formData.amount"
            :label="isGold ? 'Adet' : 'Tutar'"
            type="number"
            min="0"
            :step="isGold ? 1 : 0.01"
            :disabled="loading"
            :prepend-inner-icon="amountIcon"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, amountRule, wholeRule]"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiTextField
            v-model="formData.note"
            label="Not"
            :disabled="loading"
            prepend-inner-icon="mdi-text"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.maxLength(200)]"
            class="modern-input"
          />
        </div>
      </div>
    </div>

    <div class="form-actions">
      <UiBtn
        variant="outlined"
        size="large"
        @click="$emit('cancel')"
        :disabled="loading"
        class="btn-gradient-dark"
      >
        İptal
      </UiBtn>

      <UiBtn
        size="large"
        :loading="loading"
        :disabled="loading || !isFormValid"
        type="submit"
        class="btn-gradient-primary"
      >
        {{ debt ? 'Güncelle' : 'Kaydet' }}
      </UiBtn>
    </div>
  </UiForm>
</template>

<script setup lang="ts">
import type { Debt, CreateDebtRequest, UpdateDebtRequest } from '~/types'
import { Currency } from '~/types'
import { ref, reactive, watch, computed } from 'vue'
import { todayIso } from '~/utils/period'

// Borçlu seçiminde "Hane" seçeneğinin değeri; gönderirken debtorPersonId boş bırakılır
const HOUSEHOLD = 0

const props = defineProps<{
  debt?: Debt | null
  people: { id: number; name: string }[]
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CreateDebtRequest | UpdateDebtRequest]
  cancel: []
}>()

const { validationRules: rules } = useValidators()
const { currencyOptions } = useDebts()

const formRef = ref()
const formData = reactive({
  date: todayIso(),
  creditorPersonId: null as number | null,
  debtorPersonId: HOUSEHOLD as number,
  currency: Currency.TRY as Currency,
  amount: null as number | null,
  note: '',
})

const isFormValid = computed(() => formRef.value?.isValid ?? false)

const amountRule = (v: number | null) => (v !== null && Number(v) > 0) || 'Tutar 0\'dan büyük olmalıdır'

// Çeyrek altın adettir: etiket "Adet", yalnızca tam sayı
const isGold = computed(() => formData.currency === Currency.QuarterGold)
const wholeRule = (v: number | null) => !isGold.value || v === null || Number.isInteger(Number(v)) || 'Çeyrek altın tam sayı olmalı.'
const amountIcon = computed(() =>
  ({
    [Currency.TRY]: 'mdi-currency-try',
    [Currency.USD]: 'mdi-currency-usd',
    [Currency.EUR]: 'mdi-currency-eur',
    [Currency.QuarterGold]: 'mdi-gold',
  })[formData.currency]
)

const debtorOptions = computed(() => [
  { id: HOUSEHOLD, name: 'Hane' },
  ...props.people,
])

watch(
  () => props.debt,
  (newVal) => {
    Object.assign(formData, {
      date: newVal?.date || todayIso(),
      creditorPersonId: newVal?.creditorPersonId ?? null,
      debtorPersonId: newVal?.debtorPersonId ?? HOUSEHOLD,
      currency: newVal?.currency ?? Currency.TRY,
      amount: newVal?.amount ?? null,
      note: newVal?.note || '',
    })
  },
  { immediate: true }
)

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  const submitData = {
    date: formData.date,
    creditorPersonId: formData.creditorPersonId as number,
    debtorPersonId: formData.debtorPersonId === HOUSEHOLD ? undefined : formData.debtorPersonId,
    currency: formData.currency,
    amount: Number(formData.amount),
    note: formData.note?.trim() || undefined,
  }

  if (props.debt) {
    emit('submit', { ...submitData, id: props.debt.id } as UpdateDebtRequest)
  } else {
    emit('submit', submitData as CreateDebtRequest)
  }
}
</script>
