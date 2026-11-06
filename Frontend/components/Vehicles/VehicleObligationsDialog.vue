<template>
  <UiDialog :model-value="modelValue" max-width="900" @update:model-value="$emit('update:modelValue', $event)">
    <UiCard v-if="vehicle">
      <div class="ui-card-title">
        <div class="flex items-center">
          <UiIcon icon="mdi-file-certificate-outline" class="mr-2" />
          {{ t('vehicles.obligations.title', { name: vehicle.name, plate: vehicle.plate }) }}
          <div class="flex-1" />
          <UiBtn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
        </div>
      </div>

      <div class="ui-card-text">
        <div class="overflow-x-auto mb-4"><table v-stack-table class="ui-table ui-table--compact">
          <thead>
            <tr>
              <th>{{ t('vehicles.obligations.type') }}</th>
              <th>{{ t('vehicles.obligations.date') }}</th>
              <th>{{ t('vehicles.obligations.validUntil') }}</th>
              <th class="!text-right">{{ t('vehicles.obligations.amount') }}</th>
              <th class="!text-center">{{ t('vehicles.obligations.expense') }}</th>
              <th>{{ t('vehicles.obligations.note') }}</th>
              <th v-if="canUpdate" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in obligations" :key="o.id">
              <td>{{ getTypeLabel(o.type) }}</td>
              <td>{{ formatDisplayDate(o.date) }}</td>
              <td>{{ formatDisplayDate(o.validUntil) }}</td>
              <td class="!text-right">{{ formatMoney(o.amount) }}</td>
              <td class="!text-center">
                <UiIcon v-if="o.hasExpense" icon="mdi-check" size="1.25em" color="success" />
              </td>
              <td>{{ o.note }}</td>
              <td v-if="canUpdate" class="!text-right whitespace-nowrap">
                <UiBtn icon="mdi-pencil" size="x-small" variant="text" :disabled="isBusy" @click="startEdit(o)" />
                <UiBtn icon="mdi-delete" size="x-small" variant="text" color="error" :disabled="isBusy" @click="toDelete = o" />
              </td>
            </tr>
            <tr v-if="!obligations.length">
              <td :colspan="canUpdate ? 7 : 6" class="text-black/60 dark:text-white/70">{{ t('vehicles.obligations.empty') }}</td>
            </tr>
          </tbody>
        </table></div>

        <!-- Ekleme ya da seçili işlemi düzenleme -->
        <template v-if="canUpdate">
          <div class="text-[0.875rem] leading-[1.375rem] tracking-[0.0071428571em] font-medium mb-2">{{ editing ? t('vehicles.obligations.editHeading') : t('vehicles.obligations.addHeading') }}</div>
          <UiForm ref="formRef" @submit="save">
            <div class="ui-row ui-row--dense">
              <div class="ui-col ui-col-12 ui-col-sm-4">
                <UiSelect
                  v-model="formData.type"
                  :items="typeOptions"
                  item-title="title"
                  item-value="value"
                  :label="t('vehicles.obligations.type')"
                  density="compact"
                  hide-details="auto"
                  :disabled="isBusy"
                  @update:model-value="suggest"
                />
              </div>
              <div class="ui-col ui-col-12 ui-col-sm-4">
                <UiTextField
                  v-model="formData.date"
                  :label="t('vehicles.obligations.date')"
                  type="date"
                  density="compact"
                  hide-details="auto"
                  :disabled="isBusy"
                  :rules="[rules.required]"
                  @update:model-value="suggest"
                />
              </div>
              <div class="ui-col ui-col-12 ui-col-sm-4">
                <!-- Türe göre önerilir, düzeltilebilir; elle değiştirilince öneri durur -->
                <UiTextField
                  v-model="formData.validUntil"
                  :label="t('vehicles.obligations.validUntil')"
                  type="date"
                  density="compact"
                  hide-details="auto"
                  :disabled="isBusy"
                  :rules="[rules.required, validUntilRule]"
                  @update:model-value="validUntilTouched = true"
                />
              </div>
              <div class="ui-col ui-col-12 ui-col-sm-4">
                <UiTextField
                  v-model.number="formData.amount"
                  :label="t('vehicles.obligations.amount')"
                  type="number"
                  min="0"
                  step="0.01"
                  density="compact"
                  hide-details="auto"
                  :disabled="isBusy"
                  :rules="[amountRule]"
                />
              </div>
              <div class="ui-col ui-col-12 ui-col-sm-8">
                <UiTextField
                  v-model="formData.note"
                  :label="t('vehicles.obligations.note')"
                  density="compact"
                  hide-details="auto"
                  :disabled="isBusy"
                  :rules="[rules.maxLength(200)]"
                />
              </div>
            </div>

            <!-- Bağlı harcaması olan işlemde kutu yerine not -->
            <div v-if="editing?.hasExpense" class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal text-black/60 dark:text-white/70 mt-2">
              {{ t('vehicles.obligations.linkedExpenseNote') }}
            </div>
            <template v-else>
              <UiCheckbox
                v-model="formData.createExpense"
                :label="t('vehicles.obligations.createExpense')"
                density="compact"
                hide-details
                :disabled="isBusy"
              />
              <div class="ui-row ui-row--dense" v-if="formData.createExpense">
                <div class="ui-col ui-col-12 ui-col-sm-6">
                  <UiSelect
                    v-model="formData.categoryId"
                    :items="categories"
                    item-title="name"
                    item-value="id"
                    :label="t('vehicles.obligations.category')"
                    density="compact"
                    hide-details="auto"
                    :disabled="isBusy"
                    :rules="[rules.required]"
                  />
                </div>
                <div class="ui-col ui-col-12 ui-col-sm-6">
                  <UiSelect
                    v-model="formData.paymentMethodId"
                    :items="activePaymentMethods"
                    item-title="name"
                    item-value="id"
                    :label="t('vehicles.obligations.paymentMethod')"
                    density="compact"
                    hide-details="auto"
                    :disabled="isBusy"
                    :rules="[rules.required]"
                  />
                </div>
              </div>
            </template>

            <div class="flex justify-end mt-3 gap-2">
              <UiBtn v-if="editing" variant="text" :disabled="isBusy" @click="resetForm">{{ t('common.cancel') }}</UiBtn>
              <UiBtn color="primary" type="submit" :loading="isBusy" :disabled="isBusy || !isFormValid">
                {{ editing ? t('common.update') : t('vehicles.obligations.add') }}
              </UiBtn>
            </div>
          </UiForm>
        </template>
      </div>
    </UiCard>

    <ConfirmDialog
      :model-value="!!toDelete"
      :title="t('vehicles.obligations.deleteTitle')"
      :message="deleteMessage"
      type="error"
      :confirm-text="t('common.delete')"
      :loading="isBusy"
      @confirm="remove"
      @cancel="toDelete = null"
    />
  </UiDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { PaymentMethod, Vehicle, VehicleObligation } from '~/types'
import { VehicleObligationType } from '~/types'
import ConfirmDialog from '~/components/UI/ConfirmDialog.vue'
import { formatDisplayDate, todayIso } from '~/utils/period'
import { useToastStore } from '~/stores/toast'

const props = defineProps<{
  modelValue: boolean
  vehicle: Vehicle | null
  categories: { id: number; name: string }[]
  paymentMethods: PaymentMethod[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** İşlem eklendi, düzenlendi ya da silindi; tablo ve yaklaşan listesi yenilenmeli */
  changed: []
}>()

const { t } = useI18n()
const { validationRules: rules } = useValidators()
const { formatMoney } = useMoney()
const { hasPermission } = useAuth()
const { typeOptions, getTypeLabel, suggestValidUntil, getObligations, createObligation, updateObligation, deleteObligation } = useVehicles()
const toastStore = useToastStore()

const obligations = ref<VehicleObligation[]>([])
const editing = ref<VehicleObligation | null>(null)
const toDelete = ref<VehicleObligation | null>(null)
const isBusy = ref(false)
const formRef = ref()
const formData = reactive({
  type: VehicleObligationType.TrafficInsurance as VehicleObligationType,
  date: todayIso(),
  validUntil: '',
  amount: null as number | null,
  note: '',
  createExpense: false,
  categoryId: null as number | null,
  paymentMethodId: null as number | null,
})

// İşlem ekleme, düzenleme ve silme Vehicles.Update ister
const canUpdate = computed(() => hasPermission('Vehicles.Update'))
const isFormValid = computed(() => formRef.value?.isValid ?? false)
const activePaymentMethods = computed(() => props.paymentMethods.filter((pm) => pm.isActive))

const validUntilRule = (v: string) => (!!v && v > formData.date) || t('vehicles.obligations.validUntilRule')
// Tutar isteğe bağlı; harcama kaydedilecekse ya da bağlı harcama varsa zorunlu
const amountRule = (v: number | null | string) => {
  const empty = v === null || v === ''
  if (empty) return (formData.createExpense || editing.value?.hasExpense) ? t('vehicles.obligations.amountRequired') : true
  return Number(v) > 0 || t('vehicles.obligations.amountPositive')
}

const deleteMessage = computed(() => {
  if (!toDelete.value) return ''
  const base = t('vehicles.obligations.deleteConfirm', { type: getTypeLabel(toDelete.value.type), date: formatDisplayDate(toDelete.value.date) })
  return toDelete.value.hasExpense ? `${base} ${t('vehicles.obligations.deleteLinkedExpense')}` : base
})

// Kullanıcı geçerlilik sonuna elle dokunduysa form kapanana (sıfırlanana) kadar öneri uygulanmaz.
// @update:model-value yalnızca kullanıcı girişinde tetiklenir; koddan yapılan atamalar bayrağı değiştirmez.
const validUntilTouched = ref(false)

// Türe ve tarihe göre geçerlilik sonu önerilir; tür ya da tarih alanındaki kullanıcı değişikliğinde çağrılır
const suggest = () => {
  if (validUntilTouched.value) return
  formData.validUntil = suggestValidUntil(formData.type, formData.date)
}

const resetForm = () => {
  editing.value = null
  validUntilTouched.value = false
  Object.assign(formData, {
    type: VehicleObligationType.TrafficInsurance,
    date: todayIso(),
    amount: null,
    note: '',
    createExpense: false,
    categoryId: null,
    paymentMethodId: null,
  })
  suggest()
}

// Düzenleme kayıtlı değerlerle açılır; öneri burada çağrılmaz, yalnızca kullanıcı tür ya da tarihi değiştirirse devreye girer
const startEdit = (o: VehicleObligation) => {
  editing.value = o
  validUntilTouched.value = false
  Object.assign(formData, {
    type: o.type,
    date: o.date,
    validUntil: o.validUntil,
    amount: o.amount ?? null,
    note: o.note || '',
    createExpense: false,
    categoryId: null,
    paymentMethodId: null,
  })
}

const load = async () => {
  if (!props.vehicle) return
  obligations.value = (await getObligations(props.vehicle.id)) ?? []
}

watch(
  () => [props.modelValue, props.vehicle?.id],
  async () => {
    resetForm()
    toDelete.value = null
    if (props.modelValue) await load()
  },
  { immediate: true }
)

const save = async () => {
  if (!props.vehicle || isBusy.value) return
  const { valid } = await formRef.value?.validate()
  if (!valid) return
  isBusy.value = true
  try {
    const amount = formData.amount === null || (formData.amount as unknown) === '' ? undefined : Number(formData.amount)
    const data = {
      type: formData.type,
      date: formData.date,
      validUntil: formData.validUntil,
      amount,
      note: formData.note?.trim() || undefined,
      createExpense: !editing.value?.hasExpense && formData.createExpense,
      categoryId: formData.createExpense ? formData.categoryId ?? undefined : undefined,
      paymentMethodId: formData.createExpense ? formData.paymentMethodId ?? undefined : undefined,
    }
    if (editing.value) {
      await updateObligation(props.vehicle.id, editing.value.id, data)
      toastStore.add('success', t('vehicles.obligations.updated'))
    } else {
      await createObligation(props.vehicle.id, data)
      toastStore.add('success', t('vehicles.obligations.created'))
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
  const o = toDelete.value
  if (!props.vehicle || !o || isBusy.value) return
  isBusy.value = true
  try {
    await deleteObligation(props.vehicle.id, o.id)
    toastStore.add('success', t('vehicles.obligations.deleted'))
    toDelete.value = null
    if (editing.value?.id === o.id) resetForm()
    await load()
    emit('changed')
  } catch {
    // Hata mesajı useApi tarafından gösterilir
  } finally {
    isBusy.value = false
  }
}
</script>
