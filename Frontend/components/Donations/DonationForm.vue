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
          <!-- Emanetten dağıtım yalnızca TL -->
          <UiSelect
            v-model="formData.currency"
            :items="currencyOptions"
            item-title="title"
            item-value="value"
            :label="t('donations.form.currency')"
            :disabled="loading || !!formData.fundId"
            prepend-inner-icon="mdi-cash-multiple"
            density="comfortable"
            hide-details="auto"
            class="modern-input"
          />
        </div>
      </div>

      <div class="ui-row">
        <div class="ui-col ui-col-12 ui-col-sm-6" v-if="!isForeign">
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
        <template v-else>
          <div class="ui-col ui-col-12 ui-col-sm-6">
            <UiTextField
              v-model.number="formData.foreignAmount"
              :label="isGold ? t('donations.form.quantity') : t('donations.form.foreignAmount', { currency: currencyLabel(formData.currency) })"
              type="number"
              min="0"
              :step="isGold ? 1 : 0.01"
              :disabled="loading"
              prepend-inner-icon="mdi-cash"
              density="comfortable"
              hide-details="auto"
              :rules="[rules.required, amountRule, wholeRule]"
              class="modern-input"
            />
          </div>
          <div class="ui-col ui-col-12 ui-col-sm-6">
            <!-- Bağış günündeki kur önerilir (elle değiştirilebilir) -->
            <UiTextField
              v-model.number="formData.exchangeRate"
              :label="isGold ? t('exchangeRates.goldPrice') : t('exchangeRates.rate')"
              type="number"
              min="0"
              step="0.0001"
              :disabled="loading"
              prepend-inner-icon="mdi-swap-horizontal"
              density="comfortable"
              hide-details="auto"
              :rules="[rules.required, amountRule]"
              :hint="rateHint"
              :persistent-hint="!!rateHint"
              class="modern-input"
            />
          </div>
          <div class="ui-col ui-col-12 text-[0.875rem] text-black/70 dark:text-white/70">
            {{ t('donations.form.amountInTry', { amount: formatMoney(amountInTry) }) }}
          </div>
        </template>
      </div>

      <!-- İsteğe bağlı: emanetten dağıtım. Seçilince tür emanetin türüne ayarlanır ve kilitlenir -->
      <div class="ui-row" v-if="showFund !== false && !isForeign && (fundOptions.length || formData.fundId)">
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
import type { CurrentRate, Donation, DonationFund, PaymentMethod, CreateDonationRequest, UpdateDonationRequest } from '~/types'
import { Currency, DonationKind } from '~/types'
import { ref, reactive, watch, computed } from 'vue'
import { formatDisplayDate, todayIso } from '~/utils/period'

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
const { formatMoney, currencyLabel } = useMoney()
const { currencyOptions, getRatesAsOf } = useDebts()
const { hasPermission } = useAuth()
const { t } = useI18n()

const formRef = ref()
const formData = reactive({
  date: todayIso(),
  amount: null as number | null,
  currency: Currency.TRY as Currency,
  foreignAmount: null as number | null,
  exchangeRate: null as number | null,
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

// Döviz: TL karşılığı backend ile aynı hesaplanır (tutar × kur, 2 haneye yuvarlanır)
const isForeign = computed(() => formData.currency !== Currency.TRY)
const isGold = computed(() => formData.currency === Currency.QuarterGold)
const wholeRule = (v: number | null) => !isGold.value || v === null || Number.isInteger(Number(v)) || t('debts.form.goldWhole')
const amountInTry = computed(() =>
  Math.round((Number(formData.foreignAmount) || 0) * (Number(formData.exchangeRate) || 0) * 100) / 100
)

// Bağış günündeki kur önerisi: tarih ya da birim değişince getirilir; kullanıcı kuru değiştirdiyse dokunulmaz
const suggestedRate = ref<CurrentRate | null>(null)
const rateHint = computed(() =>
  suggestedRate.value
    ? t('debts.payments.rateOnDate', {
        date: formatDisplayDate(suggestedRate.value.date),
        source: suggestedRate.value.source === 'TCMB' ? 'TCMB' : t('debts.payments.rateManual'),
      })
    : ''
)
let rateRequest = 0
let autoRate: number | null = null
watch(
  () => [formData.date, formData.currency] as const,
  async ([date, currency], old) => {
    suggestedRate.value = null
    const request = ++rateRequest
    // Düzenleme açılışında kayıtlı kur korunur; yalnızca tarih/birim değişince öneri gelir
    if (!old || currency === Currency.TRY || !date || !hasPermission('ExchangeRates.Read')) return
    const before = formData.exchangeRate
    const rate = (await getRatesAsOf(date)).find((r) => r.currency === currency) ?? null
    if (request !== rateRequest || !rate) return
    if (formData.exchangeRate !== before && formData.exchangeRate !== autoRate) return
    formData.exchangeRate = rate.rate
    autoRate = rate.rate
    suggestedRate.value = rate
  }
)

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
      currency: newVal?.currency ?? Currency.TRY,
      foreignAmount: newVal?.foreignAmount ?? null,
      exchangeRate: newVal?.exchangeRate ?? null,
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
    amount: isForeign.value ? amountInTry.value : Number(formData.amount),
    currency: formData.currency,
    foreignAmount: isForeign.value ? Number(formData.foreignAmount) : undefined,
    exchangeRate: isForeign.value ? Number(formData.exchangeRate) : undefined,
    kind: formData.kind,
    recipient: formData.recipient.trim(),
    giverPersonId: formData.giverPersonId === HOUSEHOLD ? undefined : formData.giverPersonId,
    paymentMethodId: formData.paymentMethodId as number,
    note: formData.note?.trim() || undefined,
    // Alan gizliyken (modül kapalı) düzenlenen kaydın mevcut emaneti değişmeden gönderilir
    fundId: isForeign.value ? undefined : (props.showFund === false ? props.donation?.fundId : formData.fundId) ?? undefined,
  }

  if (props.donation) {
    emit('submit', { ...submitData, id: props.donation.id } as UpdateDonationRequest)
  } else {
    emit('submit', submitData as CreateDonationRequest)
  }
}
</script>
