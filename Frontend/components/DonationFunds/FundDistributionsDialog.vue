<template>
  <UiDialog :model-value="modelValue" max-width="860" @update:model-value="$emit('update:modelValue', $event)">
    <UiCard v-if="fund">
      <div class="ui-card-title">
        <div class="flex items-center">
          <UiIcon icon="mdi-hand-heart" class="mr-2" />
          {{ t('donationFunds.distributions.title') }} · {{ fund.fromPersonName }} · {{ getKindLabel(fund.kind) }}
          <div class="flex-1" />
          <UiBtn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
        </div>
      </div>

      <div class="ui-card-text">
        <div class="flex items-center mb-2">
          <span class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal">
            {{ t('donationFunds.distributions.summary', { remaining: formatMoney(fund.remaining), onHand: formatMoney(fund.onHand) }) }}
          </span>
          <div class="flex-1" />
          <!-- Bağış formunu emanet seçili ve tür kilitli açar -->
          <UiBtn
            v-if="canCreate"
            color="primary"
            size="small"
            prepend-icon="mdi-plus"
            :disabled="fund.onHand <= 0"
            @click="formOpen = true"
          >
            {{ t('donationFunds.distributions.add') }}
          </UiBtn>
        </div>

        <div class="overflow-x-auto"><table v-stack-table class="ui-table ui-table--compact">
          <thead>
            <tr>
              <th>{{ t('budget.date') }}</th>
              <th>{{ t('budget.recipient') }}</th>
              <th>{{ t('budget.paymentMethod') }}</th>
              <th class="!text-right">{{ t('budget.amount') }}</th>
              <th>{{ t('budget.note') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in distributions" :key="d.id">
              <td>{{ formatDisplayDate(d.date) }}</td>
              <td>{{ d.recipient }}</td>
              <td>{{ d.paymentMethodName }}</td>
              <td class="!text-right">{{ formatMoney(d.amount) }}</td>
              <td>{{ d.note }}</td>
            </tr>
            <tr v-if="!distributions.length">
              <td colspan="5" class="text-black/60 dark:text-white/70">{{ t('donationFunds.distributions.none') }}</td>
            </tr>
          </tbody>
        </table></div>
      </div>
    </UiCard>

    <ResizableDrawer
      v-model="formOpen"
      :title="t('donationFunds.distributions.drawerTitle')"
      :subtitle="t('donationFunds.distributions.drawerSubtitle')"
      icon="mdi-hand-heart"
      :default-width="600"
      :min-width="400"
    >
      <DonationForm
        :payment-methods="paymentMethods"
        :people="people"
        :funds="funds"
        :preset-fund-id="fund?.id ?? null"
        :loading="isSaving"
        @submit="saveDistribution"
        @cancel="formOpen = false"
      />
    </ResizableDrawer>
  </UiDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CreateDonationRequest, Donation, DonationFund, PaymentMethod } from '~/types'
import DonationForm from '~/components/Donations/DonationForm.vue'
import ResizableDrawer from '~/components/UI/ResizableDrawer.vue'
import { formatDisplayDate } from '~/utils/period'
import { useToastStore } from '~/stores/toast'

const props = defineProps<{
  modelValue: boolean
  fund: DonationFund | null
  funds: DonationFund[]
  paymentMethods: PaymentMethod[]
  people: { id: number; name: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** Dağıtım eklendi; tablo ve kartlar yenilenmeli */
  changed: []
}>()

const { t } = useI18n()
const { formatMoney } = useMoney()
const { hasPermission } = useAuth()
const { getKindLabel, getDonations, createDonation } = useDonations()
const toastStore = useToastStore()

const distributions = ref<Donation[]>([])
const formOpen = ref(false)
const isSaving = ref(false)

const canCreate = computed(() => hasPermission('Donations.Create'))

const load = async () => {
  if (!props.fund) return
  const res = await getDonations(1, 100, '', { fundId: props.fund.id })
  distributions.value = res?.data?.items || []
}

watch(
  () => [props.modelValue, props.fund?.id],
  async () => {
    formOpen.value = false
    if (props.modelValue) await load()
  },
  { immediate: true }
)

const saveDistribution = async (data: CreateDonationRequest) => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    await createDonation(data)
    toastStore.add('success', t('donationFunds.distributions.added'))
    formOpen.value = false
    await load()
    emit('changed')
  } catch {
    // Hata mesajı useApi tarafından gösterilir
  } finally {
    isSaving.value = false
  }
}
</script>
