<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <v-container>
      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="formData.date"
            label="Tarih"
            type="date"
            variant="outlined"
            :disabled="loading"
            prepend-inner-icon="mdi-calendar"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="formData.creditorPersonId"
            :items="people"
            item-title="name"
            item-value="id"
            label="Alacaklı"
            variant="outlined"
            :disabled="loading"
            prepend-inner-icon="mdi-account-arrow-left"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" sm="6">
          <v-select
            v-model="formData.debtorPersonId"
            :items="debtorOptions"
            item-title="name"
            item-value="id"
            label="Borçlu"
            variant="outlined"
            :disabled="loading"
            prepend-inner-icon="mdi-account"
            density="comfortable"
            hide-details="auto"
            class="modern-input"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <!-- Ödemesi olan borcun para birimi değiştirilemez -->
          <v-select
            v-model="formData.currency"
            :items="currencyOptions"
            item-title="title"
            item-value="value"
            label="Para birimi"
            variant="outlined"
            :disabled="loading || !!debt?.hasPayments"
            :hint="debt?.hasPayments ? 'Ödemesi olan borcun para birimi değiştirilemez' : ''"
            persistent-hint
            prepend-inner-icon="mdi-cash"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model.number="formData.amount"
            label="Tutar"
            type="number"
            min="0"
            step="0.01"
            variant="outlined"
            :disabled="loading"
            :prepend-inner-icon="formData.currency === Currency.USD ? 'mdi-currency-usd' : 'mdi-currency-try'"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, amountRule]"
            class="modern-input"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="formData.note"
            label="Not"
            variant="outlined"
            :disabled="loading"
            prepend-inner-icon="mdi-text"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.maxLength(200)]"
            class="modern-input"
          />
        </v-col>
      </v-row>
    </v-container>

    <div class="form-actions">
      <v-btn
        variant="outlined"
        size="large"
        @click="$emit('cancel')"
        :disabled="loading"
        class="btn-gradient-dark"
      >
        İptal
      </v-btn>

      <v-btn
        size="large"
        :loading="loading"
        :disabled="loading || !isFormValid"
        type="submit"
        class="btn-gradient-primary"
      >
        {{ debt ? 'Güncelle' : 'Kaydet' }}
      </v-btn>
    </div>
  </v-form>
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
