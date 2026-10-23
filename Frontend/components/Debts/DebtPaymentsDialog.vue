<template>
  <v-dialog :model-value="modelValue" max-width="860" @update:model-value="$emit('update:modelValue', $event)">
    <v-card v-if="debt">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-cash-check</v-icon>
        Ödemeler · {{ debt.creditorName }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
      </v-card-title>

      <v-card-text>
        <!-- Borcun tutarı, ödenen ve kalan -->
        <v-row dense class="mb-2">
          <v-col cols="4">
            <div class="text-caption">Tutar</div>
            <div class="text-subtitle-1 font-weight-bold">{{ money(debt.amount) }}</div>
          </v-col>
          <v-col cols="4">
            <div class="text-caption">Ödenen</div>
            <div class="text-subtitle-1 font-weight-bold">{{ money(debt.paidAmount) }}</div>
          </v-col>
          <v-col cols="4">
            <div class="text-caption">Kalan</div>
            <div class="text-subtitle-1 font-weight-bold">
              {{ money(debt.remaining) }}
              <span v-if="isUsd && debt.remainingInTry !== null" class="text-body-2 text-medium-emphasis">
                ≈ {{ formatMoney(debt.remainingInTry) }}
              </span>
            </div>
          </v-col>
        </v-row>

        <v-table density="compact" class="mb-4">
          <thead>
            <tr>
              <th>Tarih</th>
              <th class="text-right">Tutar</th>
              <th class="text-right">Kur</th>
              <th class="text-right">TL karşılığı</th>
              <th>Not</th>
              <th v-if="canUpdate" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in payments" :key="p.id">
              <td>{{ formatDisplayDate(p.date) }}</td>
              <td class="text-right">{{ money(p.amount) }}</td>
              <td class="text-right">{{ p.exchangeRate ?? '—' }}</td>
              <td class="text-right">{{ formatMoney(p.amountInTry) }}</td>
              <td>{{ p.note }}</td>
              <td v-if="canUpdate" class="text-right text-no-wrap">
                <v-btn icon="mdi-pencil" size="x-small" variant="text" :disabled="isBusy" @click="editing = p" />
                <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" :disabled="isBusy" @click="paymentToDelete = p" />
              </td>
            </tr>
            <tr v-if="!payments.length">
              <td :colspan="canUpdate ? 6 : 5" class="text-medium-emphasis">Ödeme yok</td>
            </tr>
          </tbody>
        </v-table>

        <!-- Ekleme ya da seçili ödemeyi düzenleme -->
        <template v-if="canUpdate && (editing || debt.remaining > 0)">
          <div class="text-subtitle-2 mb-2">{{ editing ? 'Ödemeyi düzenle' : 'Ödeme ekle' }}</div>
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
      </v-card-text>
    </v-card>

    <ConfirmDialog
      :model-value="!!paymentToDelete"
      title="Ödemeyi Sil"
      :message="`${formatDisplayDate(paymentToDelete?.date)} tarihli ${money(paymentToDelete?.amount ?? 0)} tutarındaki ödemeyi silmek istediğinizden emin misiniz?`"
      type="error"
      confirm-text="Sil"
      :loading="isBusy"
      @confirm="removePayment"
      @cancel="paymentToDelete = null"
    />
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Debt, DebtPayment, SaveDebtPaymentRequest } from '~/types'
import { Currency } from '~/types'
import DebtPaymentForm from '~/components/Debts/DebtPaymentForm.vue'
import ConfirmDialog from '~/components/UI/ConfirmDialog.vue'
import { formatDisplayDate } from '~/utils/period'
import { useToastStore } from '~/stores/toast'

const props = defineProps<{
  modelValue: boolean
  debtId: number | null
  currentRate?: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** Ödeme eklendi, düzenlendi ya da silindi; tablo ve özet yenilenmeli */
  changed: []
}>()

const { formatMoney } = useMoney()
const { hasPermission } = useAuth()
const { currencyCode, getDebtById, getDebtPayments, createDebtPayment, updateDebtPayment, deleteDebtPayment } = useDebts()
const toastStore = useToastStore()

const debt = ref<Debt | null>(null)
const payments = ref<DebtPayment[]>([])
const editing = ref<DebtPayment | null>(null)
const paymentToDelete = ref<DebtPayment | null>(null)
const isBusy = ref(false)

// Ödeme ekleme, düzenleme ve silme Debts.Update ister
const canUpdate = computed(() => hasPermission('Debts.Update'))
const isUsd = computed(() => debt.value?.currency === Currency.USD)
const money = (amount: number) => formatMoney(amount, currencyCode(debt.value?.currency ?? Currency.TRY))

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
      toastStore.add('success', 'Ödeme güncellendi')
    } else {
      await createDebtPayment(debt.value.id, data)
      toastStore.add('success', 'Ödeme eklendi')
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
    toastStore.add('success', 'Ödeme silindi')
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
