<template>
  <UiForm ref="formRef" @submit="handleSubmit">
    <div class="ui-container">
      <div class="ui-row">
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiTextField
            v-model.number="formData.amount"
            :label="t('budget.amount')"
            type="number"
            min="0"
            step="0.01"
            :disabled="loading"
            prepend-inner-icon="mdi-currency-try"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, amountRule]"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiTextField
            v-model="formData.date"
            :label="t('budget.date')"
            type="date"
            :disabled="loading"
            prepend-inner-icon="mdi-calendar"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
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

      <!-- İstek sürerken kilitli; çift tıklama ikinci istek göndermez -->
      <UiBtn
        size="large"
        :loading="loading"
        :disabled="loading || !isFormValid"
        type="submit"
        class="btn-gradient-primary"
      >
        {{ t('recurringPayments.occurrences.pay') }}
      </UiBtn>
    </div>
  </UiForm>
</template>

<script setup lang="ts">
import type { RecurringPaymentOccurrence } from '~/types'
import { ref, reactive, watch, computed } from 'vue'
import { todayIso } from '~/utils/period'

const props = defineProps<{
  occurrence?: RecurringPaymentOccurrence | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: { amount: number; date: string }]
  cancel: []
}>()

const { t } = useI18n()
const { validationRules: rules } = useValidators()

const formRef = ref()
const formData = reactive({
  amount: null as number | null,
  date: todayIso(),
})

const isFormValid = computed(() => formRef.value?.isValid ?? false)

const amountRule = (v: number | null) => (v !== null && Number(v) > 0) || t('budget.amountPositive')

// Tutar vadenin tutarıyla (beklenen ya da tahmini) dolar; boşsa kullanıcı girer
watch(
  () => props.occurrence,
  (newVal) => {
    Object.assign(formData, {
      amount: newVal?.amount ?? null,
      date: todayIso(),
    })
  },
  { immediate: true }
)

const handleSubmit = async () => {
  if (props.loading) return
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  emit('submit', { amount: Number(formData.amount), date: formData.date })
}
</script>
