<template>
  <v-dialog :model-value="modelValue" max-width="860" @update:model-value="$emit('update:modelValue', $event)">
    <v-card v-if="fund">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-hand-heart</v-icon>
        Dağıtımlar · {{ fund.fromPersonName }} · {{ getKindLabel(fund.kind) }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
      </v-card-title>

      <v-card-text>
        <div class="d-flex align-center mb-2">
          <span class="text-body-2">
            Kalan {{ formatMoney(fund.remaining) }} · Elde {{ formatMoney(fund.onHand) }}
          </span>
          <v-spacer />
          <!-- Bağış formunu emanet seçili ve tür kilitli açar -->
          <v-btn
            v-if="canCreate"
            color="primary"
            size="small"
            prepend-icon="mdi-plus"
            :disabled="fund.onHand <= 0"
            @click="formOpen = true"
          >
            Dağıtım ekle
          </v-btn>
        </div>

        <v-table density="compact">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Kime</th>
              <th>Ödeme aracı</th>
              <th class="text-right">Tutar</th>
              <th>Not</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in distributions" :key="d.id">
              <td>{{ formatDisplayDate(d.date) }}</td>
              <td>{{ d.recipient }}</td>
              <td>{{ d.paymentMethodName }}</td>
              <td class="text-right">{{ formatMoney(d.amount) }}</td>
              <td>{{ d.note }}</td>
            </tr>
            <tr v-if="!distributions.length">
              <td colspan="5" class="text-medium-emphasis">Dağıtım yok</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <ResizableDrawer
      v-model="formOpen"
      title="Dağıtım Ekle"
      subtitle="Emanetten bağış"
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
  </v-dialog>
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
    toastStore.add('success', 'Dağıtım eklendi')
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
