<template>
  <UiDialog :model-value="modelValue" max-width="440" persistent @update:model-value="$emit('update:modelValue', $event)">
    <UiCard>
      <div class="ui-card-title">
        <div class="flex items-center">
          <UiIcon icon="mdi-home-plus" class="mr-2" />
          Yeni hane oluştur
          <div class="flex-1" />
          <UiBtn icon="mdi-close" variant="text" size="small" :disabled="isBusy" @click="close" />
        </div>
      </div>

      <div class="ui-card-text">
        <UiForm ref="formRef" @submit="save">
          <UiTextField
            v-model="name"
            label="Hane adı"
            density="compact"
            hide-details="auto"
            counter="100"
            autofocus
            :disabled="isBusy"
            :rules="[requiredRule, maxRule]"
          />

          <!-- Sunucu hataları (ör. 10 hane sınırı) pencerede kalır -->
          <UiAlert v-if="errors.length" type="error" variant="tonal" density="compact" class="mt-3">
            <div v-for="(e, i) in errors" :key="i">{{ e }}</div>
          </UiAlert>

          <div class="flex justify-end gap-2 mt-4">
            <UiBtn variant="text" :disabled="isBusy" @click="close">İptal</UiBtn>
            <UiBtn color="primary" type="submit" :loading="isBusy" :disabled="isBusy">Oluştur</UiBtn>
          </div>
        </UiForm>
      </div>
    </UiCard>
  </UiDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { parseApiErrorMessages } from '~/utils/apiError'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { createHousehold } = useHousehold()

const formRef = ref()
const name = ref('')
const errors = ref<string[]>([])
const isBusy = ref(false)

const requiredRule = (v: string) => !!v?.trim() || 'Hane adı zorunludur'
const maxRule = (v: string) => (v ?? '').trim().length <= 100 || 'Hane adı en fazla 100 karakter olabilir'

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      name.value = ''
      errors.value = []
    }
  }
)

const close = () => emit('update:modelValue', false)

// Başarıda yeni haneye geçilir ve sayfa tamamen yenilenir; pencere açık kalır
const save = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  isBusy.value = true
  errors.value = []
  try {
    await createHousehold(name.value.trim())
  } catch (error) {
    errors.value = parseApiErrorMessages(error, 'Hane oluşturulamadı')
    isBusy.value = false
  }
}
</script>
