<template>
  <UiDialog :model-value="modelValue" max-width="520" @update:model-value="$emit('update:modelValue', $event)">
    <UiCard>
      <div class="ui-card-title">
        <div class="flex items-center">
          <UiIcon icon="mdi-swap-horizontal" class="mr-2" />
          {{ t('exchangeRates.title') }}
          <div class="flex-1" />
          <UiBtn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
        </div>
      </div>

      <div class="ui-card-text">
        <!-- Aynı tarih için kayıt varsa backend onu günceller -->
        <UiForm ref="formRef" @submit="save">
          <div class="ui-row ui-row--dense">
            <div class="ui-col ui-col-12">
              <UiSelect
                v-model="formData.currency"
                :items="rateCurrencyOptions"
                item-title="title"
                item-value="value"
                :label="t('exchangeRates.currency')"
                density="compact"
                hide-details="auto"
                :disabled="isBusy"
              />
            </div>
            <div class="ui-col ui-col-12 ui-col-sm-5">
              <UiTextField
                v-model.number="formData.rate"
                :label="formData.currency === Currency.QuarterGold ? t('exchangeRates.goldPrice') : t('exchangeRates.rate')"
                type="number"
                min="0"
                step="0.0001"
                density="compact"
                hide-details="auto"
                :disabled="isBusy"
                :rules="[rules.required, positiveRule]"
              />
            </div>
            <div class="ui-col ui-col-12 ui-col-sm-5">
              <UiTextField
                v-model="formData.date"
                :label="t('exchangeRates.date')"
                type="date"
                density="compact"
                hide-details="auto"
                :disabled="isBusy"
                :rules="[rules.required]"
              />
            </div>
            <div class="ui-col ui-col-12 ui-col-sm-2 flex items-center">
              <UiBtn color="primary" type="submit" block :loading="isBusy" :disabled="isBusy || !isFormValid">{{ t('common.save') }}</UiBtn>
            </div>
          </div>
        </UiForm>

        <div class="text-[0.875rem] leading-[1.375rem] tracking-[0.0071428571em] font-medium mt-4 mb-1">{{ t('exchangeRates.recent') }}</div>
        <ul class="ui-list ui-list--compact">
          <li class="ui-list-item" v-for="r in rates" :key="r.id">
            <div class="ui-list-item__content">
              <div class="ui-list-title">{{ formatDisplayDate(r.date) }} · {{ currencyLabel(r.currency) }}</div>
            </div>
            <span class="ui-list-item__append"><span class="mr-2">{{ formatMoney(r.rate) }}</span>
              <UiBtn
                v-if="canDelete"
                icon="mdi-delete"
                size="x-small"
                variant="text"
                color="error"
                :disabled="isBusy"
                @click="rateToDelete = r"
              /></span>
          </li>
          <li class="ui-list-item" v-if="!rates.length">
            <div class="ui-list-item__content">
              <div class="ui-list-title"><span class="text-black/60 dark:text-white/70">{{ t('exchangeRates.empty') }}</span></div>
            </div>
          </li>
        </ul>
      </div>
    </UiCard>

    <ConfirmDialog
      :model-value="!!rateToDelete"
      :title="t('exchangeRates.deleteTitle')"
      :message="t('exchangeRates.deleteConfirm', { date: formatDisplayDate(rateToDelete?.date) })"
      type="error"
      :confirm-text="t('common.delete')"
      :loading="isBusy"
      @confirm="remove"
      @cancel="rateToDelete = null"
    />
  </UiDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { ExchangeRate } from '~/types'
import { Currency } from '~/types'
import ConfirmDialog from '~/components/UI/ConfirmDialog.vue'
import { formatDisplayDate, todayIso } from '~/utils/period'
import { useToastStore } from '~/stores/toast'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** Kur kaydedildi ya da silindi; özet ve tablo yenilenmeli */
  changed: []
}>()

const { t } = useI18n()
const { validationRules: rules } = useValidators()
const { formatMoney, currencyLabel } = useMoney()
const { hasPermission } = useAuth()
const { rateCurrencyOptions, getExchangeRates, saveExchangeRate, deleteExchangeRate } = useDebts()
const toastStore = useToastStore()

const formRef = ref()
const formData = reactive({ currency: Currency.USD as Currency, rate: null as number | null, date: todayIso() })
const rates = ref<ExchangeRate[]>([])
const rateToDelete = ref<ExchangeRate | null>(null)
const isBusy = ref(false)

const isFormValid = computed(() => formRef.value?.isValid ?? false)
const canDelete = computed(() => hasPermission('ExchangeRates.Delete'))
const positiveRule = (v: number | null) => (v !== null && Number(v) > 0) || t('exchangeRates.positive')

const load = async () => {
  // Bütün birimlerin elle girilen kurları (geçmiş listesinde birim sütunu)
  rates.value = (await getExchangeRates()) ?? []
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    Object.assign(formData, { currency: Currency.USD, rate: null, date: todayIso() })
    await load()
  },
  { immediate: true }
)

const save = async () => {
  if (isBusy.value) return
  const { valid } = await formRef.value?.validate()
  if (!valid) return
  isBusy.value = true
  try {
    await saveExchangeRate({ currency: formData.currency, rate: Number(formData.rate), date: formData.date })
    toastStore.add('success', t('exchangeRates.saved'))
    formData.rate = null
    await load()
    emit('changed')
  } catch {
    // Hata mesajı useApi tarafından gösterilir
  } finally {
    isBusy.value = false
  }
}

const remove = async () => {
  const rate = rateToDelete.value
  if (!rate || isBusy.value) return
  isBusy.value = true
  try {
    await deleteExchangeRate(rate.id)
    toastStore.add('success', t('exchangeRates.deleted'))
    rateToDelete.value = null
    await load()
    emit('changed')
  } catch {
    // Hata mesajı useApi tarafından gösterilir
  } finally {
    isBusy.value = false
  }
}
</script>
