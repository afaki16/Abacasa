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
            v-model="formData.fromPersonId"
            :items="people"
            item-title="name"
            item-value="id"
            label="Kimden"
            :disabled="loading"
            prepend-inner-icon="mdi-account-arrow-right"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </div>
      </div>

      <div class="ui-row">
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <!-- Dağıtımı olan emanetin türü değiştirilemez -->
          <UiSelect
            v-model="formData.kind"
            :items="kindOptions"
            item-title="title"
            item-value="value"
            label="Tür"
            :disabled="loading || (fund?.distributionCount ?? 0) > 0"
            :hint="(fund?.distributionCount ?? 0) > 0 ? 'Dağıtımı olan emanetin türü değiştirilemez' : ''"
            persistent-hint
            prepend-inner-icon="mdi-hand-heart"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiTextField
            v-model.number="formData.amount"
            label="Tutar"
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
      </div>

      <div class="ui-row">
        <div class="ui-col ui-col-12">
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
        {{ fund ? 'Güncelle' : 'Kaydet' }}
      </UiBtn>
    </div>
  </UiForm>
</template>

<script setup lang="ts">
import type { DonationFund, CreateDonationFundRequest, UpdateDonationFundRequest } from '~/types'
import { DonationKind } from '~/types'
import { ref, reactive, watch, computed } from 'vue'
import { todayIso } from '~/utils/period'

const props = defineProps<{
  fund?: DonationFund | null
  people: { id: number; name: string }[]
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CreateDonationFundRequest | UpdateDonationFundRequest]
  cancel: []
}>()

const { validationRules: rules } = useValidators()
const { kindOptions } = useDonations()

const formRef = ref()
const formData = reactive({
  date: todayIso(),
  fromPersonId: null as number | null,
  kind: DonationKind.Zakat as DonationKind,
  amount: null as number | null,
  note: '',
})

const isFormValid = computed(() => formRef.value?.isValid ?? false)

const amountRule = (v: number | null) => (v !== null && Number(v) > 0) || 'Tutar 0\'dan büyük olmalıdır'

watch(
  () => props.fund,
  (newVal) => {
    Object.assign(formData, {
      date: newVal?.date || todayIso(),
      fromPersonId: newVal?.fromPersonId ?? null,
      kind: newVal?.kind ?? DonationKind.Zakat,
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
    fromPersonId: formData.fromPersonId as number,
    kind: formData.kind,
    amount: Number(formData.amount),
    note: formData.note?.trim() || undefined,
  }

  if (props.fund) {
    emit('submit', { ...submitData, id: props.fund.id } as UpdateDonationFundRequest)
  } else {
    emit('submit', submitData as CreateDonationFundRequest)
  }
}
</script>
