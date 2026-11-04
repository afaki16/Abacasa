<template>
  <UiForm ref="formRef" @submit="handleSubmit">
    <div class="ui-container">
      <div class="ui-row">
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiTextField
            v-model="formData.name"
            label="Ad"
            :disabled="loading"
            prepend-inner-icon="mdi-text"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, nameRule, rules.maxLength(100)]"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiSelect
            v-model="formData.kind"
            :items="kindOptions"
            item-title="title"
            item-value="value"
            label="Tür"
            :disabled="loading || isLocked"
            :hint="isLocked ? 'Ödemesi olan planda değiştirilemez' : ''"
            persistent-hint
            prepend-inner-icon="mdi-shape"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </div>
      </div>

      <div class="ui-row">
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiSelect
            v-model="formData.paymentMethodId"
            :items="paymentMethodOptions"
            item-title="name"
            item-value="id"
            label="Ödeme aracı"
            :disabled="loading"
            prepend-inner-icon="mdi-credit-card-outline"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiSelect
            v-model="formData.ownerPersonId"
            :items="ownerOptions"
            item-title="name"
            item-value="id"
            :label="isDonation ? 'Veren' : 'Kişi'"
            :disabled="loading"
            prepend-inner-icon="mdi-account"
            density="comfortable"
            hide-details="auto"
            class="modern-input"
          />
        </div>
      </div>

      <!-- Abonelik, fatura ve bağış: başlangıç ayı ve vade günü -->
      <div class="ui-row" v-if="!isInstallment">
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiTextField
            v-model="formData.startMonth"
            label="Başlangıç ayı"
            type="month"
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
            v-model.number="formData.dueDay"
            label="Vade günü"
            type="number"
            min="1"
            max="31"
            :disabled="loading"
            prepend-inner-icon="mdi-calendar-today"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, dueDayRule]"
            class="modern-input"
          />
        </div>
      </div>

      <!-- Abonelik, fatura ve taksit: kategori -->
      <div class="ui-row" v-if="!isDonation">
        <div class="ui-col ui-col-12">
          <UiSelect
            v-model="formData.categoryId"
            :items="categories"
            item-title="name"
            item-value="id"
            label="Kategori"
            :disabled="loading"
            prepend-inner-icon="mdi-shape-outline"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </div>
      </div>

      <!-- Bağış: kime ve bağış türü -->
      <div class="ui-row" v-if="isDonation">
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiTextField
            v-model="formData.recipient"
            label="Kime"
            :disabled="loading"
            prepend-inner-icon="mdi-account-heart"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, recipientRule, rules.maxLength(100)]"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiSelect
            v-model="formData.donationKind"
            :items="donationKindOptions"
            item-title="title"
            item-value="value"
            label="Bağış türü"
            :disabled="loading"
            prepend-inner-icon="mdi-hand-heart"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </div>
      </div>

      <!-- Taksit: toplam tutar, taksit sayısı, ilk taksit tarihi -->
      <div class="ui-row" v-if="isInstallment">
        <div class="ui-col ui-col-12 ui-col-sm-4">
          <UiTextField
            v-model.number="formData.totalAmount"
            label="Toplam tutar"
            type="number"
            min="0"
            step="0.01"
            :disabled="loading"
            prepend-inner-icon="mdi-currency-try"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, positiveRule]"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-4">
          <UiTextField
            v-model.number="formData.installmentCount"
            label="Taksit sayısı"
            type="number"
            min="2"
            max="120"
            :disabled="loading || isLocked"
            prepend-inner-icon="mdi-counter"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, installmentCountRule]"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-4">
          <UiTextField
            v-model="formData.firstDueDate"
            label="İlk taksit tarihi"
            type="date"
            :disabled="loading || isLocked"
            prepend-inner-icon="mdi-calendar"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </div>
      </div>

      <div class="ui-row">
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiTextField
            v-model.number="formData.expectedAmount"
            label="Beklenen tutar"
            type="number"
            min="0"
            step="0.01"
            :disabled="loading"
            prepend-inner-icon="mdi-currency-try"
            density="comfortable"
            hide-details="auto"
            :rules="[optionalPositiveRule]"
            class="modern-input"
            @update:model-value="expectedTouched = true"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-6 flex items-center" v-if="recurringPayment">
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
        {{ recurringPayment ? 'Güncelle' : 'Kaydet' }}
      </UiBtn>
    </div>
  </UiForm>
</template>

<script setup lang="ts">
import type {
  RecurringPayment,
  PaymentMethod,
  CreateRecurringPaymentRequest,
  UpdateRecurringPaymentRequest
} from '~/types'
import { RecurringPaymentKind, DonationKind } from '~/types'
import { ref, reactive, watch, computed } from 'vue'
import { todayIso } from '~/utils/period'

// Kişi seçiminde "Hane" seçeneğinin değeri; gönderirken ownerPersonId boş bırakılır
const HOUSEHOLD = 0

const props = defineProps<{
  recurringPayment?: RecurringPayment | null
  paymentMethods: PaymentMethod[]
  categories: { id: number; name: string }[]
  people: { id: number; name: string }[]
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CreateRecurringPaymentRequest | UpdateRecurringPaymentRequest]
  cancel: []
}>()

const { validationRules: rules } = useValidators()
const { kindOptions } = useRecurringPayments()
const { kindOptions: donationKindOptions } = useDonations()

// Bu ay, 'YYYY-MM' (ay seçici biçimi)
const currentMonth = () => todayIso().slice(0, 7)

const formRef = ref()
const formData = reactive({
  name: '',
  kind: RecurringPaymentKind.Subscription as RecurringPaymentKind,
  paymentMethodId: null as number | null,
  ownerPersonId: HOUSEHOLD as number,
  startMonth: currentMonth(),
  dueDay: null as number | null,
  categoryId: null as number | null,
  recipient: '',
  donationKind: DonationKind.Donation as DonationKind,
  totalAmount: null as number | null,
  installmentCount: null as number | null,
  firstDueDate: '',
  expectedAmount: null as number | null,
  isActive: true,
})

// Kullanıcı beklenen tutarı elle değiştirdiyse taksit hesabı üzerine yazmaz
const expectedTouched = ref(false)

const isFormValid = computed(() => formRef.value?.isValid ?? false)
const isDonation = computed(() => formData.kind === RecurringPaymentKind.Donation)
const isInstallment = computed(() => formData.kind === RecurringPaymentKind.Installment)

// Ödemesi olan planda tür, taksit sayısı ve ilk taksit tarihi değiştirilemez
const isLocked = computed(() => !!props.recurringPayment?.hasPayments)

const nameRule = (v: string) => !!v?.trim() || 'Ad alanı zorunludur'
const recipientRule = (v: string) => !!v?.trim() || 'Kime alanı zorunludur'
const positiveRule = (v: number | null) => (v !== null && Number(v) > 0) || 'Tutar 0\'dan büyük olmalıdır'
const optionalPositiveRule = (v: number | null | string) =>
  v === null || v === '' || Number(v) > 0 || 'Tutar 0\'dan büyük olmalıdır'
const dueDayRule = (v: number | null) => (v !== null && v >= 1 && v <= 31) || 'Vade günü 1 ile 31 arasında olmalıdır'
const installmentCountRule = (v: number | null) =>
  (v !== null && v >= 2 && v <= 120) || 'Taksit sayısı 2 ile 120 arasında olmalıdır'

// Sadece aktif ödeme araçları; düzenlemede mevcut araç pasif olsa da görünür
const paymentMethodOptions = computed(() =>
  props.paymentMethods.filter((pm) => pm.isActive || pm.id === props.recurringPayment?.paymentMethodId)
)

const ownerOptions = computed(() => [
  { id: HOUSEHOLD, name: 'Hane' },
  ...props.people,
])

// Taksitte beklenen tutar toplam / sayı ile dolar (2 hane); elle düzeltilebilir
watch(
  () => [formData.totalAmount, formData.installmentCount, formData.kind],
  () => {
    if (!isInstallment.value || expectedTouched.value) return
    const total = Number(formData.totalAmount)
    const count = Number(formData.installmentCount)
    if (total > 0 && count > 0) {
      formData.expectedAmount = Math.round((total / count + Number.EPSILON) * 100) / 100
    }
  }
)

watch(
  () => props.recurringPayment,
  (newVal) => {
    expectedTouched.value = !!newVal
    Object.assign(formData, {
      name: newVal?.name || '',
      kind: newVal?.kind ?? RecurringPaymentKind.Subscription,
      paymentMethodId: newVal?.paymentMethodId ?? null,
      ownerPersonId: newVal?.ownerPersonId ?? HOUSEHOLD,
      startMonth: newVal?.startMonth ? newVal.startMonth.slice(0, 7) : currentMonth(),
      dueDay: newVal?.dueDay ?? null,
      categoryId: newVal?.categoryId ?? null,
      recipient: newVal?.recipient || '',
      donationKind: newVal?.donationKind ?? DonationKind.Donation,
      totalAmount: newVal?.totalAmount ?? null,
      installmentCount: newVal?.installmentCount ?? null,
      firstDueDate: newVal?.firstDueDate || '',
      expectedAmount: newVal?.expectedAmount ?? null,
      isActive: newVal?.isActive ?? true,
    })
  },
  { immediate: true }
)

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  const expected = formData.expectedAmount === null || (formData.expectedAmount as unknown) === ''
    ? null
    : Number(formData.expectedAmount)

  // Türe ait olmayan alanlar boş gönderilir (backend boş olmasını şart koşar)
  const submitData: CreateRecurringPaymentRequest = {
    name: formData.name.trim(),
    kind: formData.kind,
    expectedAmount: expected,
    paymentMethodId: formData.paymentMethodId as number,
    ownerPersonId: formData.ownerPersonId === HOUSEHOLD ? null : formData.ownerPersonId,
    dueDay: isInstallment.value ? null : Number(formData.dueDay),
    startMonth: isInstallment.value ? null : `${formData.startMonth}-01`,
    categoryId: isDonation.value ? null : formData.categoryId,
    recipient: isDonation.value ? formData.recipient.trim() : null,
    donationKind: isDonation.value ? formData.donationKind : null,
    totalAmount: isInstallment.value ? Number(formData.totalAmount) : null,
    installmentCount: isInstallment.value ? Number(formData.installmentCount) : null,
    firstDueDate: isInstallment.value ? formData.firstDueDate : null,
  }

  if (props.recurringPayment) {
    emit('submit', { ...submitData, id: props.recurringPayment.id, isActive: formData.isActive } as UpdateRecurringPaymentRequest)
  } else {
    emit('submit', submitData)
  }
}
</script>
