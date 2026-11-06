<template>
  <UiForm ref="formRef" @submit="handleSubmit">
    <div class="ui-container">
      <div class="ui-row">
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiTextField
            v-model.number="formData.year"
            :label="t('donationTargets.form.year')"
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
        <div class="ui-col ui-col-12 ui-col-sm-6">
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
            v-model="formData.kind"
            :items="kindOptions"
            item-title="title"
            item-value="value"
            :label="t('budget.kind')"
            :disabled="loading"
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
        {{ target ? t('common.update') : t('common.save') }}
      </UiBtn>
    </div>
  </UiForm>
</template>

<script setup lang="ts">
import type { DonationTarget, CreateDonationTargetRequest, UpdateDonationTargetRequest } from '~/types'
import { DonationKind } from '~/types'
import { ref, reactive, watch, computed } from 'vue'

// Kişi seçiminde "Hane" seçeneğinin değeri; gönderirken ownerPersonId boş bırakılır
const HOUSEHOLD = 0

const props = defineProps<{
  target?: DonationTarget | null
  /** Yeni hedefte varsayılan yıl: seçili yıl */
  year: number
  people: { id: number; name: string }[]
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CreateDonationTargetRequest | UpdateDonationTargetRequest]
  cancel: []
}>()

const { validationRules: rules } = useValidators()
const { kindOptions } = useDonations()
const { t } = useI18n()

const formRef = ref()
const formData = reactive({
  year: props.year,
  ownerPersonId: HOUSEHOLD as number,
  kind: DonationKind.Zakat as DonationKind,
  amount: null as number | null,
  note: '',
})

const isFormValid = computed(() => formRef.value?.isValid ?? false)

const amountRule = (v: number | null) => (v !== null && Number(v) > 0) || t('budget.amountPositive')
const yearRule = (v: number | null) => (v !== null && v >= 2000 && v <= 2100) || t('donationTargets.form.yearRange')

const ownerOptions = computed(() => [
  { id: HOUSEHOLD, name: t('budget.household') },
  ...props.people,
])

watch(
  () => [props.target, props.year],
  () => {
    Object.assign(formData, {
      year: props.target?.year ?? props.year,
      ownerPersonId: props.target?.ownerPersonId ?? HOUSEHOLD,
      kind: props.target?.kind ?? DonationKind.Zakat,
      amount: props.target?.amount ?? null,
      note: props.target?.note || '',
    })
  },
  { immediate: true }
)

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  const submitData = {
    year: Number(formData.year),
    ownerPersonId: formData.ownerPersonId === HOUSEHOLD ? undefined : formData.ownerPersonId,
    kind: formData.kind,
    amount: Number(formData.amount),
    note: formData.note?.trim() || undefined,
  }

  if (props.target) {
    emit('submit', { ...submitData, id: props.target.id } as UpdateDonationTargetRequest)
  } else {
    emit('submit', submitData as CreateDonationTargetRequest)
  }
}
</script>
