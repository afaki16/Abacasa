<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="formData.name"
            label="Ad"
            variant="outlined"
            :disabled="loading"
            prepend-inner-icon="mdi-account"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, rules.maxLength(100)]"
            class="modern-input"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="formData.relation"
            label="Yakınlık"
            variant="outlined"
            :disabled="loading"
            prepend-inner-icon="mdi-account-heart"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.maxLength(50)]"
            class="modern-input"
          />
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
        {{ person ? 'Güncelle' : 'Kaydet' }}
      </v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import type { Person, CreatePersonRequest, UpdatePersonRequest } from '~/types'
import { ref, reactive, watch, computed } from 'vue'

const props = defineProps<{
  person?: Person | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CreatePersonRequest | UpdatePersonRequest]
  cancel: []
}>()

const { validationRules: rules } = useValidators()

const formRef = ref()
const formData = reactive<CreatePersonRequest>({
  name: '',
  relation: '',
})

const isFormValid = computed(() => formRef.value?.isValid ?? false)

watch(
  () => props.person,
  (newVal) => {
    Object.assign(formData, {
      name: newVal?.name || '',
      relation: newVal?.relation || '',
    })
  },
  { immediate: true }
)

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  const submitData = {
    name: formData.name.trim(),
    relation: formData.relation?.trim() || undefined,
  }

  if (props.person) {
    emit('submit', { ...submitData, id: props.person.id } as UpdatePersonRequest)
  } else {
    emit('submit', submitData as CreatePersonRequest)
  }
}
</script>
