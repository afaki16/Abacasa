<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <v-container>
      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="formData.name"
            label="Ad"
            variant="outlined"
            :disabled="loading"
            prepend-inner-icon="mdi-car"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, nameRule, rules.maxLength(100)]"
            class="modern-input"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <!-- Plaka büyük harfle saklanır -->
          <v-text-field
            v-model="formData.plate"
            label="Plaka"
            variant="outlined"
            :disabled="loading"
            prepend-inner-icon="mdi-card-text-outline"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, plateRule, rules.maxLength(20)]"
            class="modern-input"
            @blur="formData.plate = formData.plate.trim().toUpperCase()"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" sm="6">
          <v-select
            v-model="formData.ownerPersonId"
            :items="ownerOptions"
            item-title="name"
            item-value="id"
            label="Sahip"
            variant="outlined"
            :disabled="loading"
            prepend-inner-icon="mdi-account"
            density="comfortable"
            hide-details="auto"
            class="modern-input"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="formData.note"
            label="Not"
            variant="outlined"
            :disabled="loading"
            prepend-inner-icon="mdi-text"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.maxLength(200)]"
            class="modern-input"
          />
        </v-col>
      </v-row>

      <!-- Aktif yalnızca düzenlemede; yeni araç aktif başlar -->
      <v-row v-if="vehicle">
        <v-col cols="12">
          <v-switch v-model="formData.isActive" label="Aktif" color="primary" :disabled="loading" hide-details inset />
        </v-col>
      </v-row>
    </v-container>

    <div class="form-actions">
      <v-btn
        variant="outlined"
        size="large"
        @click="$emit('cancel')"
        :disabled="loading"
        class="btn-gradient-dark"
      >
        İptal
      </v-btn>

      <v-btn
        size="large"
        :loading="loading"
        :disabled="loading || !isFormValid"
        type="submit"
        class="btn-gradient-primary"
      >
        {{ vehicle ? 'Güncelle' : 'Kaydet' }}
      </v-btn>
    </div>
  </v-form>
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
