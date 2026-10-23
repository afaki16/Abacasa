<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <v-container>
      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model.number="formData.year"
            label="Yıl"
            type="number"
            min="2000"
            max="2100"
            variant="outlined"
            :disabled="loading"
            prepend-inner-icon="mdi-calendar"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, yearRule]"
            class="modern-input"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="formData.ownerPersonId"
            :items="ownerOptions"
            item-title="name"
            item-value="id"
            label="Kişi"
            variant="outlined"
            :disabled="loading"
            prepend-inner-icon="mdi-account"
            density="comfortable"
            hide-details="auto"
            class="modern-input"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" sm="6">
          <v-select
            v-model="formData.kind"
            :items="kindOptions"
            item-title="title"
            item-value="value"
            label="Tür"
            variant="outlined"
            :disabled="loading"
            prepend-inner-icon="mdi-hand-heart"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </v-col>
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
      </v-row>

      <v-row>
        <v-col cols="12">
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
        {{ target ? 'Güncelle' : 'Kaydet' }}
      </v-btn>
    </div>
  </v-form>
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

const formRef = ref()
const formData = reactive({
  year: props.year,
  ownerPersonId: HOUSEHOLD as number,
  kind: DonationKind.Zakat as DonationKind,
  amount: null as number | null,
  note: '',
})

const isFormValid = computed(() => formRef.value?.isValid ?? false)

const amountRule = (v: number | null) => (v !== null && Number(v) > 0) || 'Tutar 0\'dan büyük olmalıdır'
const yearRule = (v: number | null) => (v !== null && v >= 2000 && v <= 2100) || 'Yıl 2000 ile 2100 arasında olmalıdır'

const ownerOptions = computed(() => [
  { id: HOUSEHOLD, name: 'Hane' },
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
