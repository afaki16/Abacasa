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

      <!-- İsteğe bağlı: emanetten dağıtım. Seçilince tür emanetin türüne ayarlanır ve kilitlenir -->
      <v-row v-if="fundOptions.length || formData.fundId">
        <v-col cols="12">
          <v-select
            v-model="formData.fundId"
            :items="fundOptions"
            item-title="title"
            item-value="value"
            label="Emanetten"
            variant="outlined"
            :disabled="loading || !!presetFundId"
            prepend-inner-icon="mdi-safe"
            density="comfortable"
            hide-details="auto"
            clearable
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
            :disabled="loading || !!selectedFund"
            prepend-inner-icon="mdi-hand-heart"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="formData.recipient"
            label="Kime"
            variant="outlined"
            :disabled="loading"
            prepend-inner-icon="mdi-account-heart"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, recipientRule, rules.maxLength(100)]"
            class="modern-input"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" sm="6">
          <v-select
            v-model="formData.giverPersonId"
            :items="giverOptions"
            item-title="name"
            item-value="id"
            label="Veren"
            variant="outlined"
            :disabled="loading"
            prepend-inner-icon="mdi-account"
            density="comfortable"
            hide-details="auto"
            class="modern-input"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="formData.paymentMethodId"
            :items="paymentMethodOptions"
            item-title="name"
            item-value="id"
            label="Ödeme aracı"
            variant="outlined"
            :disabled="loading"
            prepend-inner-icon="mdi-credit-card-outline"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
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
        {{ donation ? 'Güncelle' : 'Kaydet' }}
      </v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import type { Donation, DonationFund, PaymentMethod, CreateDonationRequest, UpdateDonationRequest } from '~/types'
import { DonationKind } from '~/types'
import { ref, reactive, watch, computed } from 'vue'
import { todayIso } from '~/utils/period'

// Veren seçiminde "Hane" seçeneğinin değeri; gönderirken giverPersonId boş bırakılır
const HOUSEHOLD = 0

const props = defineProps<{
  donation?: Donation | null
  paymentMethods: PaymentMethod[]
  people: { id: number; name: string }[]
  /** Hanenin emanetleri; elde > 0 olan açık emanetler (ve düzenlemede mevcut emanet) listelenir */
  funds?: DonationFund[]
  /** Emanetler sayfasındaki "Dağıtım ekle": emanet seçili gelir, değiştirilemez */
  presetFundId?: number | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CreateDonationRequest | UpdateDonationRequest]
  cancel: []
}>()

const { validationRules: rules } = useValidators()
const { kindOptions, getKindLabel } = useDonations()
const { formatMoney } = useMoney()

const formRef = ref()
const formData = reactive({
  date: todayIso(),
  amount: null as number | null,
  kind: DonationKind.Donation as DonationKind,
  recipient: '',
  giverPersonId: HOUSEHOLD as number,
  paymentMethodId: null as number | null,
  note: '',
  fundId: null as number | null,
})

// Elde > 0 olan açık emanetler; düzenlemede ve "Dağıtım ekle"de mevcut emanet listede kalır
const fundOptions = computed(() =>
  (props.funds ?? [])
    .filter((f) => (!f.isClosed && f.onHand > 0) || f.id === props.donation?.fundId || f.id === props.presetFundId)
    .map((f) => ({
      value: f.id,
      title: `${f.fromPersonName} · ${getKindLabel(f.kind)} · elde ${formatMoney(f.onHand)}`,
    }))
)

const selectedFund = computed(() => (props.funds ?? []).find((f) => f.id === formData.fundId) ?? null)

// Emanet seçilince tür emanetin türüne ayarlanır
watch(selectedFund, (fund) => {
  if (fund) formData.kind = fund.kind
})

const isFormValid = computed(() => formRef.value?.isValid ?? false)

const amountRule = (v: number | null) => (v !== null && Number(v) > 0) || 'Tutar 0\'dan büyük olmalıdır'
const recipientRule = (v: string) => !!v?.trim() || 'Kime alanı zorunludur'

// Sadece aktif ödeme araçları; düzenlemede mevcut araç pasif olsa da görünür
const paymentMethodOptions = computed(() =>
  props.paymentMethods.filter((pm) => pm.isActive || pm.id === props.donation?.paymentMethodId)
)

const giverOptions = computed(() => [
  { id: HOUSEHOLD, name: 'Hane' },
  ...props.people,
])

watch(
  () => props.donation,
  (newVal) => {
    Object.assign(formData, {
      date: newVal?.date || todayIso(),
      amount: newVal?.amount ?? null,
      kind: newVal?.kind ?? DonationKind.Donation,
      recipient: newVal?.recipient || '',
      giverPersonId: newVal?.giverPersonId ?? HOUSEHOLD,
      paymentMethodId: newVal?.paymentMethodId ?? null,
      note: newVal?.note || '',
      fundId: newVal?.fundId ?? props.presetFundId ?? null,
    })
  },
  { immediate: true }
)

watch(
  () => props.presetFundId,
  (fundId) => {
    if (!props.donation) formData.fundId = fundId ?? null
  }
)

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  const submitData = {
    date: formData.date,
    amount: Number(formData.amount),
    kind: formData.kind,
    recipient: formData.recipient.trim(),
    giverPersonId: formData.giverPersonId === HOUSEHOLD ? undefined : formData.giverPersonId,
    paymentMethodId: formData.paymentMethodId as number,
    note: formData.note?.trim() || undefined,
    fundId: formData.fundId ?? undefined,
  }

  if (props.donation) {
    emit('submit', { ...submitData, id: props.donation.id } as UpdateDonationRequest)
  } else {
    emit('submit', submitData as CreateDonationRequest)
  }
}
</script>
