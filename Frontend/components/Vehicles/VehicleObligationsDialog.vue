<template>
  <v-dialog :model-value="modelValue" max-width="900" @update:model-value="$emit('update:modelValue', $event)">
    <v-card v-if="vehicle">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-file-certificate-outline</v-icon>
        İşlemler · {{ vehicle.name }} ({{ vehicle.plate }})
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
      </v-card-title>

      <v-card-text>
        <v-table density="compact" class="mb-4">
          <thead>
            <tr>
              <th>Tür</th>
              <th>Tarih</th>
              <th>Geçerlilik sonu</th>
              <th class="text-right">Tutar</th>
              <th class="text-center">Harcama</th>
              <th>Not</th>
              <th v-if="canUpdate" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in obligations" :key="o.id">
              <td>{{ getTypeLabel(o.type) }}</td>
              <td>{{ formatDisplayDate(o.date) }}</td>
              <td>{{ formatDisplayDate(o.validUntil) }}</td>
              <td class="text-right">{{ formatMoney(o.amount) }}</td>
              <td class="text-center">
                <v-icon v-if="o.hasExpense" size="small" color="success">mdi-check</v-icon>
              </td>
              <td>{{ o.note }}</td>
              <td v-if="canUpdate" class="text-right text-no-wrap">
                <v-btn icon="mdi-pencil" size="x-small" variant="text" :disabled="isBusy" @click="startEdit(o)" />
                <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" :disabled="isBusy" @click="toDelete = o" />
              </td>
            </tr>
            <tr v-if="!obligations.length">
              <td :colspan="canUpdate ? 7 : 6" class="text-medium-emphasis">İşlem yok</td>
            </tr>
          </tbody>
        </v-table>

        <!-- Ekleme ya da seçili işlemi düzenleme -->
        <template v-if="canUpdate">
          <div class="text-subtitle-2 mb-2">{{ editing ? 'İşlemi düzenle' : 'İşlem ekle' }}</div>
          <v-form ref="formRef" @submit.prevent="save">
            <v-row dense>
              <v-col cols="12" sm="4">
                <v-select
                  v-model="formData.type"
                  :items="typeOptions"
                  item-title="title"
                  item-value="value"
                  label="Tür"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  :disabled="isBusy"
                  @update:model-value="suggest"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="formData.date"
                  label="Tarih"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  :disabled="isBusy"
                  :rules="[rules.required]"
                  @update:model-value="suggest"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <!-- Türe göre önerilir, düzeltilebilir; elle değiştirilince öneri durur -->
                <v-text-field
                  v-model="formData.validUntil"
                  label="Geçerlilik sonu"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  :disabled="isBusy"
                  :rules="[rules.required, validUntilRule]"
                  @update:model-value="validUntilTouched = true"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="formData.amount"
                  label="Tutar"
                  type="number"
                  min="0"
                  step="0.01"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  :disabled="isBusy"
                  :rules="[amountRule]"
                />
              </v-col>
              <v-col cols="12" sm="8">
                <v-text-field
                  v-model="formData.note"
                  label="Not"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  :disabled="isBusy"
                  :rules="[rules.maxLength(200)]"
                />
              </v-col>
            </v-row>

            <!-- Bağlı harcaması olan işlemde kutu yerine not -->
            <div v-if="editing?.hasExpense" class="text-body-2 text-medium-emphasis mt-2">
              Bağlı harcama var; tarih ve tutar değişikliği harcamaya da yansır.
            </div>
            <template v-else>
              <v-checkbox
                v-model="formData.createExpense"
                label="Harcama olarak da kaydet"
                density="compact"
                hide-details
                :disabled="isBusy"
              />
              <v-row v-if="formData.createExpense" dense>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="formData.categoryId"
                    :items="categories"
                    item-title="name"
                    item-value="id"
                    label="Kategori"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    :disabled="isBusy"
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="formData.paymentMethodId"
                    :items="activePaymentMethods"
                    item-title="name"
                    item-value="id"
                    label="Ödeme aracı"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    :disabled="isBusy"
                    :rules="[rules.required]"
                  />
                </v-col>
              </v-row>
            </template>

            <div class="d-flex justify-end mt-3 ga-2">
              <v-btn v-if="editing" variant="text" :disabled="isBusy" @click="resetForm">İptal</v-btn>
              <v-btn color="primary" type="submit" :loading="isBusy" :disabled="isBusy || !isFormValid">
                {{ editing ? 'Güncelle' : 'Ekle' }}
              </v-btn>
            </div>
          </v-form>
        </template>
      </v-card-text>
    </v-card>

    <ConfirmDialog
      :model-value="!!toDelete"
      title="İşlemi Sil"
      :message="deleteMessage"
      type="error"
      confirm-text="Sil"
      :loading="isBusy"
      @confirm="remove"
      @cancel="toDelete = null"
    />
  </v-dialog>
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

const validUntilRule = (v: string) => (!!v && v > formData.date) || 'Geçerlilik sonu tarihten sonra olmalıdır'
// Tutar isteğe bağlı; harcama kaydedilecekse ya da bağlı harcama varsa zorunlu
const amountRule = (v: number | null | string) => {
  const empty = v === null || v === ''
  if (empty) return (formData.createExpense || editing.value?.hasExpense) ? 'Harcama için tutar zorunludur' : true
  return Number(v) > 0 || 'Tutar 0\'dan büyük olmalıdır'
}

const deleteMessage = computed(() => {
  if (!toDelete.value) return ''
  const base = `${getTypeLabel(toDelete.value.type)} (${formatDisplayDate(toDelete.value.date)}) işlemini silmek istediğinizden emin misiniz?`
  return toDelete.value.hasExpense ? `${base} Bağlı harcama da silinecek.` : base
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
      toastStore.add('success', 'İşlem güncellendi')
    } else {
      await createObligation(props.vehicle.id, data)
      toastStore.add('success', 'İşlem eklendi')
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
    toastStore.add('success', 'İşlem silindi')
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
