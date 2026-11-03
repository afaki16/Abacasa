<template>
  <form novalidate @submit="onSubmit">
    <slot />
  </form>
</template>

<script setup lang="ts">
import { UI_FORM_KEY, type UiFormField } from '~/composables/useUiForm'

/**
 * Form (v-form karşılığı).
 * - v-model: alanların kuralları geçiyorsa true, geçmiyorsa false (hatalar gösterilmeden de güncellenir;
 *   bu yüzden "geçerli değilken buton pasif" kullanımı Vuetify'daki gibi çalışır)
 * - validate(): tüm hataları gösterir, { valid, errors } döner
 * - reset(): değerleri temizler, resetValidation(): yalnızca hataları gizler
 * - submit: varsayılan gönderim engellenir, önce validate() çalışır, sonra "submit" yayılır
 */
const props = defineProps<{ modelValue?: boolean | null; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [valid: boolean]; submit: [event: Event] }>()

const fields = shallowReactive(new Map<number, UiFormField>())

provide(UI_FORM_KEY, {
  register: (field: UiFormField) => { fields.set(field.id, field) },
  unregister: (id: number) => { fields.delete(id) },
  disabled: computed(() => !!props.disabled),
})

const isValid = computed(() => [...fields.values()].every(f => f.isValid.value))
watch(isValid, v => emit('update:modelValue', v), { immediate: true })

const validate = async () => {
  const errors: { id: number; errorMessages: string[] }[] = []
  for (const f of fields.values()) {
    const messages = f.validate()
    if (messages.length) errors.push({ id: f.id, errorMessages: messages })
  }
  return { valid: errors.length === 0, errors }
}
const reset = () => { for (const f of fields.values()) f.reset() }
const resetValidation = () => { for (const f of fields.values()) f.resetValidation() }

const onSubmit = async (event: Event) => {
  event.preventDefault()
  await validate()
  emit('submit', event)
}

defineExpose({ validate, reset, resetValidation, isValid })
</script>
