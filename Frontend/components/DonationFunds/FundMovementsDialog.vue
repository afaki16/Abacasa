<template>
  <UiDialog :model-value="modelValue" max-width="760" @update:model-value="$emit('update:modelValue', $event)">
    <UiCard v-if="fund">
      <div class="ui-card-title">
        <div class="flex items-center">
          <UiIcon icon="mdi-swap-horizontal" class="mr-2" />
          Hareketler · {{ fund.fromPersonName }}
          <div class="flex-1" />
          <UiBtn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
        </div>
      </div>

      <div class="ui-card-text">
        <div class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal mb-2">
          Kullanımda {{ formatMoney(fund.inUse) }} · Elde {{ formatMoney(fund.onHand) }}
        </div>

        <div class="overflow-x-auto mb-4"><table class="ui-table ui-table--compact">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Tür</th>
              <th class="text-right">Tutar</th>
              <th>Not</th>
              <th v-if="canUpdate" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in movements" :key="m.id">
              <td>{{ formatDisplayDate(m.date) }}</td>
              <td>{{ getMovementTypeLabel(m.type) }}</td>
              <td class="text-right">{{ formatMoney(m.amount) }}</td>
              <td>{{ m.note }}</td>
              <td v-if="canUpdate" class="text-right whitespace-nowrap">
                <UiBtn icon="mdi-pencil" size="x-small" variant="text" :disabled="isBusy" @click="startEdit(m)" />
                <UiBtn icon="mdi-delete" size="x-small" variant="text" color="error" :disabled="isBusy" @click="toDelete = m" />
              </td>
            </tr>
            <tr v-if="!movements.length">
              <td :colspan="canUpdate ? 5 : 4" class="text-black/60 dark:text-white/70">Hareket yok</td>
            </tr>
          </tbody>
        </table></div>

        <!-- Ekleme ya da seçili hareketi düzenleme; tarih varsayılanı bugün -->
        <template v-if="canUpdate">
          <div class="text-[0.875rem] leading-[1.375rem] tracking-[0.0071428571em] font-medium mb-2">{{ editing ? 'Hareketi düzenle' : 'Hareket ekle' }}</div>
          <UiForm ref="formRef" @submit="save">
            <div class="ui-row ui-row--dense">
              <div class="ui-col ui-col-12 ui-col-sm-3">
                <UiSelect
                  v-model="formData.type"
                  :items="movementTypeOptions"
                  item-title="title"
                  item-value="value"
                  label="Tür"
                  density="compact"
                  hide-details="auto"
                  :disabled="isBusy"
                />
              </div>
              <div class="ui-col ui-col-12 ui-col-sm-3">
                <UiTextField
                  v-model="formData.date"
                  label="Tarih"
                  type="date"
                  density="compact"
                  hide-details="auto"
                  :disabled="isBusy"
                  :rules="[rules.required]"
                />
              </div>
              <div class="ui-col ui-col-12 ui-col-sm-3">
                <UiTextField
                  v-model.number="formData.amount"
                  label="Tutar"
                  type="number"
                  min="0"
                  step="0.01"
                  density="compact"
                  hide-details="auto"
                  :disabled="isBusy"
                  :rules="[rules.required, amountRule]"
                />
              </div>
              <div class="ui-col ui-col-12 ui-col-sm-3">
                <UiTextField
                  v-model="formData.note"
                  label="Not"
                  density="compact"
                  hide-details="auto"
                  :disabled="isBusy"
                  :rules="[rules.maxLength(200)]"
                />
              </div>
            </div>
            <div class="flex justify-end mt-3 gap-2">
              <UiBtn v-if="editing" variant="text" :disabled="isBusy" @click="resetForm">İptal</UiBtn>
              <UiBtn color="primary" type="submit" :loading="isBusy" :disabled="isBusy || !isFormValid">
                {{ editing ? 'Güncelle' : 'Ekle' }}
              </UiBtn>
            </div>
          </UiForm>
        </template>
      </div>
    </UiCard>

    <ConfirmDialog
      :model-value="!!toDelete"
      title="Hareketi Sil"
      :message="`${formatDisplayDate(toDelete?.date)} tarihli ${formatMoney(toDelete?.amount ?? 0)} tutarındaki hareketi silmek istediğinizden emin misiniz?`"
      type="error"
      confirm-text="Sil"
      :loading="isBusy"
      @confirm="remove"
      @cancel="toDelete = null"
    />
  </UiDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { DonationFund, FundMovement } from '~/types'
import { FundMovementType } from '~/types'
import ConfirmDialog from '~/components/UI/ConfirmDialog.vue'
import { formatDisplayDate, todayIso } from '~/utils/period'
import { useToastStore } from '~/stores/toast'

const props = defineProps<{
  modelValue: boolean
  fund: DonationFund | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** Hareket eklendi, düzenlendi ya da silindi; tablo ve kartlar yenilenmeli */
  changed: []
}>()

const { validationRules: rules } = useValidators()
const { formatMoney } = useMoney()
const { hasPermission } = useAuth()
const { movementTypeOptions, getMovementTypeLabel, getMovements, createMovement, updateMovement, deleteMovement } = useDonationFunds()
const toastStore = useToastStore()

const movements = ref<FundMovement[]>([])
const editing = ref<FundMovement | null>(null)
const toDelete = ref<FundMovement | null>(null)
const isBusy = ref(false)
const formRef = ref()
const formData = reactive({
  type: FundMovementType.Use as FundMovementType,
  date: todayIso(),
  amount: null as number | null,
  note: '',
})

// Hareket ekleme, düzenleme ve silme DonationFunds.Update ister
const canUpdate = computed(() => hasPermission('DonationFunds.Update'))
const isFormValid = computed(() => formRef.value?.isValid ?? false)
const amountRule = (v: number | null) => (v !== null && Number(v) > 0) || 'Tutar 0\'dan büyük olmalıdır'

const resetForm = () => {
  editing.value = null
  Object.assign(formData, { type: FundMovementType.Use, date: todayIso(), amount: null, note: '' })
}

const startEdit = (m: FundMovement) => {
  editing.value = m
  Object.assign(formData, { type: m.type, date: m.date, amount: m.amount, note: m.note || '' })
}

const load = async () => {
  if (!props.fund) return
  movements.value = (await getMovements(props.fund.id)) ?? []
}

watch(
  () => [props.modelValue, props.fund?.id],
  async () => {
    resetForm()
    toDelete.value = null
    if (props.modelValue) await load()
  },
  { immediate: true }
)

const save = async () => {
  if (!props.fund || isBusy.value) return
  const { valid } = await formRef.value?.validate()
  if (!valid) return
  isBusy.value = true
  try {
    const data = {
      type: formData.type,
      date: formData.date,
      amount: Number(formData.amount),
      note: formData.note?.trim() || undefined,
    }
    if (editing.value) {
      await updateMovement(props.fund.id, editing.value.id, data)
      toastStore.add('success', 'Hareket güncellendi')
    } else {
      await createMovement(props.fund.id, data)
      toastStore.add('success', 'Hareket eklendi')
    }
    resetForm()
    await load()
    emit('changed')
  } catch {
    // Hata mesajı useApi tarafından gösterilir
  } finally {
    isBusy.value = false
  }
}

const remove = async () => {
  const m = toDelete.value
  if (!props.fund || !m || isBusy.value) return
  isBusy.value = true
  try {
    await deleteMovement(props.fund.id, m.id)
    toastStore.add('success', 'Hareket silindi')
    toDelete.value = null
    if (editing.value?.id === m.id) resetForm()
    await load()
    emit('changed')
  } catch {
    // Hata mesajı useApi tarafından gösterilir
  } finally {
    isBusy.value = false
  }
}
</script>
