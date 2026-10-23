<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <v-container>
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
            prepend-inner-icon="mdi-currency-try"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, amountRule]"
            class="modern-input"
          />
        </v-col>
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

      <!-- İstek sürerken kilitli; çift tıklama ikinci istek göndermez -->
      <v-btn
        size="large"
        :loading="loading"
        :disabled="loading || !isFormValid"
        type="submit"
        class="btn-gradient-primary"
      >
        Öde
      </v-btn>
    </div>
  </v-form>
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

const { validationRules: rules } = useValidators()

const formRef = ref()
const formData = reactive({
  amount: null as number | null,
  date: todayIso(),
})

const isFormValid = computed(() => formRef.value?.isValid ?? false)

const amountRule = (v: number | null) => (v !== null && Number(v) > 0) || 'Tutar 0\'dan büyük olmalıdır'

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
