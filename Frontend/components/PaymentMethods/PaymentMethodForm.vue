<template>
  <UiForm ref="formRef" @submit="handleSubmit">
    <div class="ui-container">
      <div class="ui-row">
        <div class="ui-col ui-col-12">
          <UiTextField
            v-model="formData.name"
            label="Ad"
            :disabled="loading"
            prepend-inner-icon="mdi-credit-card-outline"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, rules.maxLength(100)]"
            class="modern-input"
          />
        </div>
      </div>

      <div class="ui-row">
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiSelect
            v-model="formData.type"
            :items="typeOptions"
            item-title="title"
            item-value="value"
            label="Tür"
            :disabled="loading"
            prepend-inner-icon="mdi-shape-outline"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiTextField
            v-model="formData.bank"
            label="Banka"
            :disabled="loading"
            prepend-inner-icon="mdi-bank"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.maxLength(100)]"
            class="modern-input"
          />
        </div>
      </div>

      <div class="ui-row">
        <div class="ui-col ui-col-12" :class="isCreditCard ? 'ui-col-sm-6' : 'ui-col-sm-12'">
          <UiSelect
            v-model="formData.ownerPersonId"
            :items="ownerOptions"
            item-title="name"
            item-value="id"
            label="Sahibi"
            :disabled="loading"
            prepend-inner-icon="mdi-account"
            density="comfortable"
            hide-details="auto"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-6" v-if="isCreditCard">
          <UiTextField
            v-model.number="formData.statementDay"
            label="Kesim günü"
            type="number"
            min="1"
            max="31"
            :disabled="loading"
            prepend-inner-icon="mdi-calendar"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, statementDayRule]"
            class="modern-input"
          />
        </div>
      </div>

      <div class="ui-row">
        <div class="ui-col ui-col-12">
          <UiSwitch
            v-model="formData.isActive"
            label="Aktif"
            color="primary"
            :disabled="loading"
            hide-details
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
        {{ paymentMethod ? 'Güncelle' : 'Kaydet' }}
      </UiBtn>
    </div>
  </UiForm>
</template>

<script setup lang="ts">
import type { PaymentMethod, CreatePaymentMethodRequest, UpdatePaymentMethodRequest } from '~/types'
import { PaymentMethodType } from '~/types'
import { ref, reactive, watch, computed } from 'vue'

// Sahibi seçiminde "Hane" seçeneğinin değeri; gönderirken ownerPersonId boş bırakılır
const HOUSEHOLD = 0

const props = defineProps<{
  paymentMethod?: PaymentMethod | null
  people: { id: number; name: string }[]
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CreatePaymentMethodRequest | UpdatePaymentMethodRequest]
  cancel: []
}>()

const { validationRules: rules } = useValidators()
const { typeOptions } = usePaymentMethods()

const formRef = ref()
const formData = reactive({
  name: '',
  type: PaymentMethodType.Cash as PaymentMethodType,
  bank: '',
  ownerPersonId: HOUSEHOLD as number,
  statementDay: null as number | null,
  isActive: true,
})

const isFormValid = computed(() => formRef.value?.isValid ?? false)
const isCreditCard = computed(() => formData.type === PaymentMethodType.CreditCard)

const ownerOptions = computed(() => [
  { id: HOUSEHOLD, name: 'Hane' },
  ...props.people,
])

const statementDayRule = (v: number | null) =>
  (v !== null && Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 31) || '1 ile 31 arasında olmalıdır'

// Kesim günü sadece kredi kartında; tür değişince temizlenir
watch(isCreditCard, (value) => {
  if (!value) formData.statementDay = null
})

watch(
  () => props.paymentMethod,
  (newVal) => {
    Object.assign(formData, {
      name: newVal?.name || '',
      type: newVal?.type ?? PaymentMethodType.Cash,
      bank: newVal?.bank || '',
      ownerPersonId: newVal?.ownerPersonId ?? HOUSEHOLD,
      statementDay: newVal?.statementDay ?? null,
      isActive: newVal?.isActive ?? true,
    })
  },
  { immediate: true }
)

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  const submitData = {
    name: formData.name.trim(),
    type: formData.type,
    bank: formData.bank?.trim() || undefined,
    ownerPersonId: formData.ownerPersonId === HOUSEHOLD ? undefined : formData.ownerPersonId,
    statementDay: isCreditCard.value ? Number(formData.statementDay) : undefined,
    isActive: formData.isActive,
  }

  if (props.paymentMethod) {
    emit('submit', { ...submitData, id: props.paymentMethod.id } as UpdatePaymentMethodRequest)
  } else {
    emit('submit', submitData as CreatePaymentMethodRequest)
  }
}
</script>
