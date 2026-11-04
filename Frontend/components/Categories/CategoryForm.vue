<template>
  <UiForm ref="formRef" @submit="handleSubmit">
    <div class="ui-container">
      <div class="ui-row">
        <div class="ui-col ui-col-12">
          <UiTextField
            v-model="formData.name"
            label="Kategori Adı"
            :disabled="loading"
            prepend-inner-icon="mdi-shape"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, rules.maxLength(100)]"
            class="modern-input"
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
        {{ category ? 'Güncelle' : 'Kaydet' }}
      </UiBtn>
    </div>
  </UiForm>
</template>

<script setup lang="ts">
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '~/types'
import { ref, reactive, watch, computed } from 'vue'

const props = defineProps<{
  category?: Category | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CreateCategoryRequest | UpdateCategoryRequest]
  cancel: []
}>()

const { validationRules: rules } = useValidators()

const formRef = ref()
const formData = reactive<CreateCategoryRequest>({
  name: '',
})

const isFormValid = computed(() => formRef.value?.isValid ?? false)

watch(
  () => props.category,
  (newVal) => {
    Object.assign(formData, {
      name: newVal?.name || '',
    })
  },
  { immediate: true }
)

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  const submitData = {
    name: formData.name.trim(),
  }

  if (props.category) {
    emit('submit', { ...submitData, id: props.category.id } as UpdateCategoryRequest)
  } else {
    emit('submit', submitData as CreateCategoryRequest)
  }
}
</script>
