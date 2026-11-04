<template>
  <UiForm ref="formRef" @submit="handleSubmit">
    <div class="ui-container">
      <div class="ui-row">
        <div class="ui-col ui-col-12">
          <UiTextField
            v-model="formData.name"
            label="Ad"
            :disabled="loading"
            prepend-inner-icon="mdi-format-title"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, nameRule, rules.maxLength(100)]"
            class="modern-input"
          />
        </div>
      </div>

      <div class="ui-row">
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <!-- Tutarı olan kalemin yönü değiştirilemez -->
          <UiSelect
            v-model="formData.direction"
            :items="directionOptions"
            item-title="title"
            item-value="value"
            label="Yön"
            :disabled="loading || !!item?.hasAmounts"
            :hint="item?.hasAmounts ? 'Tutarı olan kalemin yönü değiştirilemez' : ''"
            persistent-hint
            prepend-inner-icon="mdi-swap-vertical"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required]"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12 ui-col-sm-6">
          <UiSelect
            v-model="formData.ownerPersonId"
            :items="ownerOptions"
            item-title="name"
            item-value="id"
            label="Kişi"
            :disabled="loading"
            prepend-inner-icon="mdi-account"
            density="comfortable"
            hide-details="auto"
            class="modern-input"
          />
        </div>
      </div>

      <!-- Aktif yalnızca düzenlemede; yeni kalem aktif başlar -->
      <div class="ui-row" v-if="item">
        <div class="ui-col ui-col-12">
          <UiSwitch
            v-model="formData.isActive"
            label="Aktif"
            color="primary"
            :disabled="loading"
            hide-details
          />
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
        {{ item ? 'Güncelle' : 'Kaydet' }}
      </UiBtn>
    </div>
  </UiForm>
</template>

<script setup lang="ts">
import type { LedgerItem, CreateLedgerItemRequest, UpdateLedgerItemRequest } from '~/types'
import { LedgerDirection } from '~/types'
import { ref, reactive, watch, computed } from 'vue'

// Kişi seçiminde "Hane" seçeneğinin değeri; gönderirken ownerPersonId boş bırakılır
const HOUSEHOLD = 0

const props = defineProps<{
  item?: LedgerItem | null
  people: { id: number; name: string }[]
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CreateLedgerItemRequest | UpdateLedgerItemRequest]
  cancel: []
}>()

const { validationRules: rules } = useValidators()
const { directionOptions } = useLedger()

const formRef = ref()
const formData = reactive({
  name: '',
  direction: LedgerDirection.Income as LedgerDirection,
  ownerPersonId: HOUSEHOLD as number,
  isActive: true,
})

const isFormValid = computed(() => formRef.value?.isValid ?? false)

const nameRule = (v: string) => !!v?.trim() || 'Ad alanı zorunludur'

const ownerOptions = computed(() => [
  { id: HOUSEHOLD, name: 'Hane' },
  ...props.people,
])

watch(
  () => props.item,
  (newVal) => {
    Object.assign(formData, {
      name: newVal?.name || '',
      direction: newVal?.direction ?? LedgerDirection.Income,
      ownerPersonId: newVal?.ownerPersonId ?? HOUSEHOLD,
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
    direction: formData.direction,
    ownerPersonId: formData.ownerPersonId === HOUSEHOLD ? undefined : formData.ownerPersonId,
  }

  if (props.item) {
    emit('submit', { ...submitData, id: props.item.id, isActive: formData.isActive } as UpdateLedgerItemRequest)
  } else {
    emit('submit', submitData as CreateLedgerItemRequest)
  }
}
</script>
