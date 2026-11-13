<template>
  <UiForm ref="formRef" @submit="handleSubmit">
    <div class="ui-container">
      <div class="ui-row">
        <div class="ui-col ui-col-12">
          <UiSelect
            v-model="formData.ownerPersonId"
            :items="ownerOptions"
            item-title="name"
            item-value="id"
            :label="t('budget.person')"
            :disabled="loading"
            prepend-inner-icon="mdi-account"
            density="comfortable"
            hide-details="auto"
            class="modern-input"
          />
        </div>
      </div>

      <div class="ui-row">
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiSelect
            v-model="formData.startMonth"
            :items="monthOptions"
            item-title="title"
            item-value="value"
            :label="t('budgets.form.startMonth')"
            :disabled="loading"
            prepend-inner-icon="mdi-calendar-month"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiTextField
            v-model.number="formData.startYear"
            :label="t('budgets.form.startYear')"
            type="number"
            min="2000"
            max="2100"
            :disabled="loading"
            prepend-inner-icon="mdi-calendar"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, yearRule]"
            class="modern-input"
          />
        </div>
      </div>

      <div class="ui-row">
        <div class="ui-col ui-col-12">
          <UiTextField
            v-model.number="formData.amount"
            :label="t('budgets.form.amount')"
            type="number"
            min="0"
            step="0.01"
            :disabled="loading"
            prepend-inner-icon="mdi-currency-try"
            density="comfortable"
            hide-details="auto"
            :hint="t('budgets.form.amountHint')"
            persistent-hint
            :rules="[rules.required, amountRule]"
            class="modern-input"
          />
        </div>
      </div>

      <!-- Yıllık tablodan öneri (yalnızca hane bütçesinde) -->
      <div v-if="formData.ownerPersonId === HOUSEHOLD && suggestion?.income != null" class="ui-row">
        <div class="ui-col ui-col-12">
          <UiAlert type="info" variant="tonal" density="compact">
            <div>
              {{ t(suggestion.incomeIsAverage ? 'budgets.suggestion.incomeAverage' : 'budgets.suggestion.income', { amount: formatMoney(suggestion.income) }) }}
            </div>
            <div>{{ t('budgets.suggestion.fixed', { amount: formatMoney(suggestion.fixedPayments) }) }}</div>
            <div>{{ t('budgets.suggestion.variable', { amount: formatMoney(suggestion.variableRoom ?? 0) }) }}</div>
            <UiBtn size="small" variant="text" color="primary" class="mt-1 !px-0" :disabled="loading" @click="formData.amount = suggestion.income">
              {{ t('budgets.suggestion.use', { amount: formatMoney(suggestion.income) }) }}
            </UiBtn>
          </UiAlert>
        </div>
      </div>

      <div class="ui-row">
        <div class="ui-col ui-col-12">
          <UiTextField
            v-model="formData.note"
            :label="t('budget.note')"
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
        {{ t('common.cancel') }}
      </UiBtn>

      <UiBtn
        size="large"
        :loading="loading"
        :disabled="loading || !isFormValid"
        type="submit"
        class="btn-gradient-primary"
      >
        {{ budget ? t('common.update') : t('common.save') }}
      </UiBtn>
    </div>
  </UiForm>
</template>

<script setup lang="ts">
import type { Budget, BudgetReport, CreateBudgetRequest, UpdateBudgetRequest } from '~/types'
import { ref, reactive, watch, computed } from 'vue'

// Kişi seçiminde "Hane" seçeneğinin değeri; gönderirken ownerPersonId boş bırakılır
const HOUSEHOLD = 0

const props = defineProps<{
  budget?: Budget | null
  /** Yeni kayıtta varsayılan başlangıç: seçili ay */
  year: number
  month: number
  people: { id: number; name: string }[]
  suggestion?: BudgetReport['suggestion'] | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CreateBudgetRequest | UpdateBudgetRequest]
  cancel: []
}>()

const { validationRules: rules } = useValidators()
const { formatMoney } = useMoney()
const { t, locale } = useI18n()

const formRef = ref()
const formData = reactive({
  ownerPersonId: HOUSEHOLD as number,
  startYear: props.year,
  startMonth: props.month,
  amount: null as number | null,
  note: '',
})

const isFormValid = computed(() => formRef.value?.isValid ?? false)

// 0 geçerli: o aydan itibaren bütçe yok
const amountRule = (v: number | null) => (v !== null && Number(v) >= 0) || t('budgets.form.amountMin')
const yearRule = (v: number | null) => (v !== null && v >= 2000 && v <= 2100) || t('budgets.form.yearRange')

const ownerOptions = computed(() => [
  { id: HOUSEHOLD, name: t('budget.household') },
  ...props.people,
])

const monthOptions = computed(() => {
  const fmt = new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'tr-TR', { month: 'long', timeZone: 'UTC' })
  return Array.from({ length: 12 }, (_, i) => ({ value: i + 1, title: fmt.format(new Date(Date.UTC(2000, i, 1))) }))
})

watch(
  () => [props.budget, props.year, props.month],
  () => {
    Object.assign(formData, {
      ownerPersonId: props.budget?.ownerPersonId ?? HOUSEHOLD,
      startYear: props.budget?.startYear ?? props.year,
      startMonth: props.budget?.startMonth ?? props.month,
      amount: props.budget?.amount ?? null,
      note: props.budget?.note || '',
    })
  },
  { immediate: true }
)

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  const submitData = {
    ownerPersonId: formData.ownerPersonId === HOUSEHOLD ? undefined : formData.ownerPersonId,
    startYear: Number(formData.startYear),
    startMonth: Number(formData.startMonth),
    amount: Number(formData.amount),
    note: formData.note?.trim() || undefined,
  }

  if (props.budget) {
    emit('submit', { ...submitData, id: props.budget.id } as UpdateBudgetRequest)
  } else {
    emit('submit', submitData as CreateBudgetRequest)
  }
}
</script>
