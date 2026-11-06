<template>
  <UiDialog :model-value="modelValue" max-width="860" @update:model-value="$emit('update:modelValue', $event)">
    <UiCard v-if="debt">
      <div class="ui-card-title">
        <div class="flex items-center">
          <UiIcon icon="mdi-cash-check" class="mr-2" />
          {{ t('debts.payments.title', { creditor: debt.creditorName }) }}
          <div class="flex-1" />
          <UiBtn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
        </div>
      </div>

      <div class="ui-card-text">
        <!-- Borcun tutarı, ödenen ve kalan -->
        <div class="ui-row ui-row--dense !mb-2">
          <div class="ui-col ui-col-4">
            <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ t('debts.columns.amount') }}</div>
            <div class="text-[1rem] leading-[1.75rem] tracking-[0.009375em] font-bold">{{ money(debt.amount) }}</div>
          </div>
          <div class="ui-col ui-col-4">
            <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ t('debts.columns.paid') }}</div>
            <div class="text-[1rem] leading-[1.75rem] tracking-[0.009375em] font-bold">{{ money(debt.paidAmount) }}</div>
          </div>
          <div class="ui-col ui-col-4">
            <div class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal">{{ t('debts.columns.remaining') }}</div>
            <div class="text-[1rem] leading-[1.75rem] tracking-[0.009375em] font-bold">
              {{ money(debt.remaining) }}
              <span v-if="isForeign && debt.remainingInTry !== null" class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal text-black/60 dark:text-white/70">
                ≈ {{ formatMoney(debt.remainingInTry) }}
              </span>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto mb-4"><table v-stack-table class="ui-table ui-table--compact">
          <thead>
            <tr>
              <th>{{ t('debts.columns.date') }}</th>
              <th class="!text-right">{{ t('debts.columns.amount') }}</th>
              <th class="!text-right">{{ t('debts.payments.rate') }}</th>
              <th class="!text-right">{{ t('debts.payments.amountInTry') }}</th>
              <th>{{ t('debts.columns.note') }}</th>
              <th v-if="canUpdate || canDelete" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in payments" :key="p.id">
              <td>{{ formatDisplayDate(p.date) }}</td>
              <td class="!text-right">{{ money(p.amount) }}</td>
              <td class="!text-right">{{ p.exchangeRate ?? '—' }}</td>
              <td class="!text-right">{{ formatMoney(p.amountInTry) }}</td>
              <td>{{ p.note }}</td>
              <td v-if="canUpdate || canDelete" class="!text-right whitespace-nowrap">
                <UiBtn v-if="canUpdate" icon="mdi-pencil" size="x-small" variant="text" :disabled="isBusy" @click="editing = p" />
                <UiBtn v-if="canDelete" icon="mdi-delete" size="x-small" variant="text" color="error" :disabled="isBusy" @click="paymentToDelete = p" />
              </td>
            </tr>
            <tr v-if="!payments.length">
              <td :colspan="canUpdate || canDelete ? 6 : 5" class="text-black/60 dark:text-white/70">{{ t('debts.payments.empty') }}</td>
            </tr>
          </tbody>
        </table></div>

        <!-- Ekleme ya da seçili ödemeyi düzenleme -->
        <template v-if="editing ? canUpdate : canCreate && debt.remaining > 0">
          <div class="text-[0.875rem] leading-[1.375rem] tracking-[0.0071428571em] font-medium mb-2">{{ editing ? t('debts.payments.editHeading') : t('debts.payments.add') }}</div>
          <DebtPaymentForm
            :currency="debt.currency"
            :remaining="debt.remaining"
            :current-rate="currentRate"
            :payment="editing"
            :loading="isBusy"
            @submit="savePayment"
            @cancel="editing = null"
          />
        </template>
      </div>
    </UiCard>

    <ConfirmDialog
      :model-value="!!paymentToDelete"
      :title="t('debts.payments.deleteTitle')"
      :message="t('debts.payments.deleteConfirm', { date: formatDisplayDate(paymentToDelete?.date), amount: money(paymentToDelete?.amount ?? 0) })"
      type="error"
      :confirm-text="t('common.delete')"
      :loading="isBusy"
      @confirm="removePayment"
      @cancel="paymentToDelete = null"
    />
  </UiDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Debt, DebtPayment, SaveDebtPaymentRequest, CurrentRate } from '~/types'
import { Currency } from '~/types'
import DebtPaymentForm from '~/components/Debts/DebtPaymentForm.vue'
import ConfirmDialog from '~/components/UI/ConfirmDialog.vue'
import { formatDisplayDate } from '~/utils/period'
import { useToastStore } from '~/stores/toast'

const props = defineProps<{
  modelValue: boolean
  debtId: number | null
  /** Güncel kurlar (özetten); yeni ödemede borcun biriminin kuru varsayılan olur */
  rates?: CurrentRate[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** Ödeme eklendi, düzenlendi ya da silindi; tablo ve özet yenilenmeli */
  changed: []
}>()

const { t } = useI18n()
const { formatMoney, formatAmount } = useMoney()
const { hasPermission } = useAuth()
const { getDebtById, getDebtPayments, createDebtPayment, updateDebtPayment, deleteDebtPayment } = useDebts()
const toastStore = useToastStore()

const debt = ref<Debt | null>(null)
const payments = ref<DebtPayment[]>([])
const editing = ref<DebtPayment | null>(null)
const paymentToDelete = ref<DebtPayment | null>(null)
const isBusy = ref(false)

// Ödeme ekleme, düzenleme ve silme DebtPayments izinlerine bağlı (pencereyi açmak Debts.Read)
const canCreate = computed(() => hasPermission('DebtPayments.Create'))
const canUpdate = computed(() => hasPermission('DebtPayments.Update'))
const canDelete = computed(() => hasPermission('DebtPayments.Delete'))
const isForeign = computed(() => !!debt.value && debt.value.currency !== Currency.TRY)
const money = (amount: number) => formatAmount(amount, debt.value?.currency ?? Currency.TRY)
const currentRate = computed(() => props.rates?.find((r) => r.currency === debt.value?.currency)?.rate ?? null)

const load = async () => {
  if (!props.debtId) return
  const [debtRes, paymentsRes] = await Promise.all([getDebtById(String(props.debtId)), getDebtPayments(props.debtId)])
  debt.value = debtRes
  payments.value = paymentsRes ?? []
}

watch(
  () => [props.modelValue, props.debtId],
  async () => {
    editing.value = null
    paymentToDelete.value = null
    if (props.modelValue) await load()
  },
  { immediate: true }
)

const savePayment = async (data: SaveDebtPaymentRequest) => {
  if (!debt.value || isBusy.value) return
  isBusy.value = true
  try {
    if (editing.value) {
      await updateDebtPayment(debt.value.id, editing.value.id, data)
      toastStore.add('success', t('debts.payments.updated'))
    } else {
      await createDebtPayment(debt.value.id, data)
      toastStore.add('success', t('debts.payments.created'))
    }
    editing.value = null
    await load()
    emit('changed')
  } catch {
    // Hata mesajı useApi tarafından gösterilir
  } finally {
    isBusy.value = false
  }
}

const removePayment = async () => {
  const payment = paymentToDelete.value
  if (!debt.value || !payment || isBusy.value) return
  isBusy.value = true
  try {
    await deleteDebtPayment(debt.value.id, payment.id)
    toastStore.add('success', t('debts.payments.deleted'))
    paymentToDelete.value = null
    if (editing.value?.id === payment.id) editing.value = null
    await load()
    emit('changed')
  } catch {
    // Hata mesajı useApi tarafından gösterilir
  } finally {
    isBusy.value = false
  }
}
</script>
