<template>
  <UiForm ref="formRef" @submit="handleSubmit">
    <div class="ui-container">
      <div class="ui-row">
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

      <!-- İsteğe bağlı: emanetten dağıtım. Seçilince tür emanetin türüne ayarlanır ve kilitlenir -->
      <div class="ui-row" v-if="showFund !== false && (fundOptions.length || formData.fundId)">
        <div class="ui-col ui-col-12">
          <UiSelect
            v-model="formData.fundId"
            :items="fundOptions"
            item-title="title"
            item-value="value"
            :label="t('donations.form.fromFund')"
            :disabled="loading || !!presetFundId"
            prepend-inner-icon="mdi-safe"
            density="comfortable"
            hide-details="auto"
            clearable
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
            :disabled="loading || !!selectedFund"
            prepend-inner-icon="mdi-hand-heart"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiTextField
            v-model="formData.recipient"
            :label="t('budget.recipient')"
            :disabled="loading"
            prepend-inner-icon="mdi-account-heart"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, recipientRule, rules.maxLength(100)]"
            class="modern-input"
          />
        </div>
      </div>

      <div class="ui-row">
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiSelect
            v-model="formData.giverPersonId"
            :items="giverOptions"
            item-title="name"
            item-value="id"
            :label="t('budget.giver')"
            :disabled="loading"
            prepend-inner-icon="mdi-account"
            density="comfortable"
            hide-details="auto"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiSelect
            v-model="formData.paymentMethodId"
            :items="paymentMethodOptions"
            item-title="name"
            item-value="id"
            :label="t('budget.paymentMethod')"
            :disabled="loading"
            prepend-inner-icon="mdi-credit-card-outline"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
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
        {{ donation ? t('common.update') : t('common.save') }}
      </UiBtn>
    </div>
  </UiForm>
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
  /** Bağış hedefleri ve emanetler modülü kapalıysa false: "Emanetten" alanı görünmez */
  showFund?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CreateDonationRequest | UpdateDonationRequest]
  cancel: []
}>()

const { validationRules: rules } = useValidators()
const { kindOptions, getKindLabel } = useDonations()
const { formatMoney } = useMoney()
const { t } = useI18n()

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
      title: t('donations.form.fundOption', { from: f.fromPersonName, kind: getKindLabel(f.kind), amount: formatMoney(f.onHand) }),
    }))
)

const selectedFund = computed(() => (props.funds ?? []).find((f) => f.id === formData.fundId) ?? null)

// Emanet seçilince tür emanetin türüne ayarlanır
watch(selectedFund, (fund) => {
  if (fund) formData.kind = fund.kind
})

const isFormValid = computed(() => formRef.value?.isValid ?? false)

const amountRule = (v: number | null) => (v !== null && Number(v) > 0) || t('budget.amountPositive')
const recipientRule = (v: string) => !!v?.trim() || t('budget.recipientRequired')

// Sadece aktif ödeme araçları; düzenlemede mevcut araç pasif olsa da görünür
const paymentMethodOptions = computed(() =>
  props.paymentMethods.filter((pm) => pm.isActive || pm.id === props.donation?.paymentMethodId)
)

const giverOptions = computed(() => [
  { id: HOUSEHOLD, name: t('budget.household') },
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
    // Alan gizliyken (modül kapalı) düzenlenen kaydın mevcut emaneti değişmeden gönderilir
    fundId: (props.showFund === false ? props.donation?.fundId : formData.fundId) ?? undefined,
  }

  if (props.donation) {
    emit('submit', { ...submitData, id: props.donation.id } as UpdateDonationRequest)
  } else {
    emit('submit', submitData as CreateDonationRequest)
  }
}
</script>
