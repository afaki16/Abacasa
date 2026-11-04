<template>
  <UiForm ref="formRef" @submit="handleSubmit">
    <div class="ui-container">
      <div class="ui-row">
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiTextField
            v-model="formData.name"
            label="Ad"
            :disabled="loading"
            prepend-inner-icon="mdi-car"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, nameRule, rules.maxLength(100)]"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <!-- Plaka büyük harfle saklanır -->
          <UiTextField
            v-model="formData.plate"
            label="Plaka"
            :disabled="loading"
            prepend-inner-icon="mdi-card-text-outline"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, plateRule, rules.maxLength(20)]"
            class="modern-input"
            @blur="formData.plate = formData.plate.trim().toUpperCase()"
          />
        </div>
      </div>

      <div class="ui-row">
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiSelect
            v-model="formData.ownerPersonId"
            :items="ownerOptions"
            item-title="name"
            item-value="id"
            label="Sahip"
            :disabled="loading"
            prepend-inner-icon="mdi-account"
            density="comfortable"
            hide-details="auto"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiTextField
            v-model="formData.note"
            label="Not"
            :disabled="loading"
            prepend-inner-icon="mdi-text"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.maxLength(200)]"
            class="modern-input"
          />
        </div>
      </div>

      <!-- Aktif yalnızca düzenlemede; yeni araç aktif başlar -->
      <div class="ui-row" v-if="vehicle">
        <div class="ui-col ui-col-12">
          <UiSwitch v-model="formData.isActive" label="Aktif" color="primary" :disabled="loading" hide-details />
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
        {{ vehicle ? 'Güncelle' : 'Kaydet' }}
      </UiBtn>
    </div>
  </UiForm>
</template>

<script setup lang="ts">
import type { Vehicle, CreateVehicleRequest, UpdateVehicleRequest } from '~/types'
import { ref, reactive, watch, computed } from 'vue'

// Sahip seçiminde "Hane" seçeneğinin değeri; gönderirken ownerPersonId boş bırakılır
const HOUSEHOLD = 0

const props = defineProps<{
  vehicle?: Vehicle | null
  people: { id: number; name: string }[]
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CreateVehicleRequest | UpdateVehicleRequest]
  cancel: []
}>()

const { validationRules: rules } = useValidators()

const formRef = ref()
const formData = reactive({
  name: '',
  plate: '',
  ownerPersonId: HOUSEHOLD as number,
  note: '',
  isActive: true,
})

const isFormValid = computed(() => formRef.value?.isValid ?? false)

const nameRule = (v: string) => !!v?.trim() || 'Ad alanı zorunludur'
const plateRule = (v: string) => !!v?.trim() || 'Plaka alanı zorunludur'

const ownerOptions = computed(() => [
  { id: HOUSEHOLD, name: 'Hane' },
  ...props.people,
])

watch(
  () => props.vehicle,
  (newVal) => {
    Object.assign(formData, {
      name: newVal?.name || '',
      plate: newVal?.plate || '',
      ownerPersonId: newVal?.ownerPersonId ?? HOUSEHOLD,
      note: newVal?.note || '',
      isActive: newVal?.isActive ?? true,
    })
  },
  { immediate: true }
)

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  const submitData = {
    name: formData.name.trim(),
    plate: formData.plate.trim().toUpperCase(),
    ownerPersonId: formData.ownerPersonId === HOUSEHOLD ? undefined : formData.ownerPersonId,
    note: formData.note?.trim() || undefined,
  }

  if (props.vehicle) {
    emit('submit', { ...submitData, id: props.vehicle.id, isActive: formData.isActive } as UpdateVehicleRequest)
  } else {
    emit('submit', submitData as CreateVehicleRequest)
  }
}
</script>
