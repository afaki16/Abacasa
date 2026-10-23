<template>
  <v-dialog :model-value="modelValue" max-width="520" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-currency-usd</v-icon>
        Dolar kuru
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
      </v-card-title>

      <v-card-text>
        <!-- Aynı tarih için kayıt varsa backend onu günceller -->
        <v-form ref="formRef" @submit.prevent="save">
          <v-row dense>
            <v-col cols="12" sm="5">
              <v-text-field
                v-model.number="formData.rate"
                label="Kur (₺)"
                type="number"
                min="0"
                step="0.0001"
                variant="outlined"
                density="compact"
                hide-details="auto"
                :disabled="isBusy"
                :rules="[rules.required, positiveRule]"
              />
            </v-col>
            <v-col cols="12" sm="5">
              <v-text-field
                v-model="formData.date"
                label="Tarih"
                type="date"
                variant="outlined"
                density="compact"
                hide-details="auto"
                :disabled="isBusy"
                :rules="[rules.required]"
              />
            </v-col>
            <v-col cols="12" sm="2" class="d-flex align-center">
              <v-btn color="primary" type="submit" block :loading="isBusy" :disabled="isBusy || !isFormValid">Kaydet</v-btn>
            </v-col>
          </v-row>
        </v-form>

        <div class="text-subtitle-2 mt-4 mb-1">Son kayıtlar</div>
        <v-list density="compact">
          <v-list-item v-for="r in rates" :key="r.id">
            <template #title>{{ formatDisplayDate(r.date) }}</template>
            <template #append>
              <span class="mr-2">{{ formatMoney(r.rate) }}</span>
              <v-btn
                v-if="canDelete"
                icon="mdi-delete"
                size="x-small"
                variant="text"
                color="error"
                :disabled="isBusy"
                @click="rateToDelete = r"
              />
            </template>
          </v-list-item>
          <v-list-item v-if="!rates.length">
            <template #title><span class="text-medium-emphasis">Kur girilmemiş</span></template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <ConfirmDialog
      :model-value="!!rateToDelete"
      title="Kuru Sil"
      :message="`${formatDisplayDate(rateToDelete?.date)} tarihli kuru silmek istediğinizden emin misiniz?`"
      type="error"
      confirm-text="Sil"
      :loading="isBusy"
      @confirm="remove"
      @cancel="rateToDelete = null"
    />
  </v-dialog>
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

const { validationRules: rules } = useValidators()
const { formatMoney } = useMoney()
const { hasPermission } = useAuth()
const { getExchangeRates, saveExchangeRate, deleteExchangeRate } = useDebts()
const toastStore = useToastStore()

const formRef = ref()
const formData = reactive({ rate: null as number | null, date: todayIso() })
const rates = ref<ExchangeRate[]>([])
const rateToDelete = ref<ExchangeRate | null>(null)
const isBusy = ref(false)

const isFormValid = computed(() => formRef.value?.isValid ?? false)
const canDelete = computed(() => hasPermission('ExchangeRates.Delete'))
const positiveRule = (v: number | null) => (v !== null && Number(v) > 0) || 'Kur 0\'dan büyük olmalıdır'

const load = async () => {
  rates.value = (await getExchangeRates(Currency.USD)) ?? []
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    Object.assign(formData, { rate: null, date: todayIso() })
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
    await saveExchangeRate({ currency: Currency.USD, rate: Number(formData.rate), date: formData.date })
    toastStore.add('success', 'Kur kaydedildi')
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
    toastStore.add('success', 'Kur silindi')
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
