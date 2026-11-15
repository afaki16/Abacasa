<template>
  <UiForm ref="formRef" @submit="handleSubmit">
    <div class="ui-container">
      <div class="ui-row">
        <div class="ui-col ui-col-12">
          <UiTextField
            v-model="formData.name"
            :label="t('categories.columns.name')"
            :placeholder="t('categories.namePlaceholder')"
            :disabled="loading"
            prepend-inner-icon="mdi-shape"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, rules.maxLength(100)]"
            class="modern-input"
          />
        </div>
        <div class="ui-col ui-col-12">
          <div class="text-[0.875rem] font-medium mb-2">{{ t('categories.icon') }}</div>
          <div class="flex flex-wrap gap-2" role="radiogroup" :aria-label="t('categories.icon')">
            <button
              v-for="key in iconOptions"
              :key="key ?? 'auto'"
              type="button"
              role="radio"
              :aria-checked="formData.icon === key"
              :title="key ? key : t('categories.iconAuto')"
              :disabled="loading"
              class="w-10 h-10 rounded-lg border flex items-center justify-center transition-colors"
              :class="formData.icon === key
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-black/10 dark:border-white/15 text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'"
              @click="formData.icon = key"
            >
              <UiIcon v-if="key" :icon="CATEGORY_ICON_MDI[key]" :size="22" />
              <span v-else class="text-[0.7rem] font-semibold">{{ t('categories.iconAutoShort') }}</span>
            </button>
          </div>
          <div class="text-[0.75rem] text-black/60 dark:text-white/60 mt-1">{{ t('categories.iconHint') }}</div>
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
        {{ t('common.cancel') }}
      </UiBtn>

      <UiBtn
        size="large"
        :loading="loading"
        :disabled="loading || !isFormValid"
        type="submit"
        class="btn-gradient-primary"
      >
        {{ category ? t('common.update') : t('common.save') }}
      </UiBtn>
    </div>
  </UiForm>
</template>

<script setup lang="ts">
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '~/types'
import { ref, reactive, watch, computed } from 'vue'
import { CATEGORY_ICON_KEYS, CATEGORY_ICON_MDI } from '~/utils/categoryIcons'

const props = defineProps<{
  category?: Category | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CreateCategoryRequest | UpdateCategoryRequest]
  cancel: []
}>()

const { t } = useI18n()
const { validationRules: rules } = useValidators()

const formRef = ref()
const formData = reactive<{ name: string; icon: string | null }>({
  name: '',
  icon: null,
})

// İlk seçenek "otomatik" (ikon addan tahmin edilir)
const iconOptions: (string | null)[] = [null, ...CATEGORY_ICON_KEYS]

const isFormValid = computed(() => formRef.value?.isValid ?? false)

watch(
  () => props.category,
  (newVal) => {
    Object.assign(formData, {
      name: newVal?.name || '',
      icon: newVal?.icon ?? null,
    })
  },
  { immediate: true }
)

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  const submitData = {
    name: formData.name.trim(),
    icon: formData.icon,
  }

  if (props.category) {
    emit('submit', { ...submitData, id: props.category.id } as UpdateCategoryRequest)
  } else {
    emit('submit', submitData as CreateCategoryRequest)
  }
}
</script>
