<template>
  <div :style="`width: ${width}px`">
    <UiTextField
      v-bind="computedAttrs"
      :type="(type === 'password' && (isPasswordVisible || showPassword)) ? 'text' : type"
      :label="label"
      :counter="counter ? maxLength : counter"
      :clearable="clearable"
      :readonly="readonly"
      :disabled="disabled"
      :active="true"
      :hint="type == 'password' && hint == null ? passwordHint : hint"
      :persistent-hint="persistentHint"
      rounded="true"
      v-model="model"
      :rules="computedRules"
      :required="required"
      :placeholder="placeholder"
      hide-spin-buttons
      :onkeydown="handleKeyDown"
      :step="step"
      :prepend-inner-icon="prependInnerIcon"
      :append-inner-icon="appendInnerIcon"
      class="base-text-box"
      @click:prepend-inner="emit('click:prepend-inner')"
      @click:append-inner="emit('click:append-inner')"
    >
      <template #message="{ message }">
        <div v-if="type != 'password'" class="flex items-center">
          <UiIcon icon="mdi-information-outline" :size="16" class="opacity-50 mr-1" />
          <span>{{ message }}</span>
        </div>
        <div v-else v-for="(msg, index) in messageArray(message)" :key="index">
          <div class="flex items-center">
            <UiIcon icon="mdi-information-outline" :size="16" class="opacity-50 mr-1" />
            <span :class="{ 'base-text-box__step--valid': checkIfStepValid(msg) }">
              {{ msg }}
            </span>
          </div>
        </div>
      </template>
      <template v-if="type == 'password' && !appendInnerIcon" #append-inner>
        <button
          type="button"
          tabindex="-1"
          class="password-eye"
          :aria-label="(isPasswordVisible || showPassword) ? $t('ui.textBox.hidePassword') : $t('ui.textBox.showPassword')"
          @click.prevent="togglePssword"
        >
          <UiIcon :icon="(isPasswordVisible || showPassword) ? 'mdi-eye-outline' : 'mdi-eye-off-outline'" :size="16" />
        </button>
      </template>
      <template v-if="appendImg" #append-inner>
        <Transition name="fade" mode="out-in">
          <img :key="appendImg" :src="appendImg" :class="appendClass" alt="" />
        </Transition>
      </template>
      <template v-if="prependImg" #prepend-inner>
        <Transition name="fade" mode="out-in">
          <img :key="prependImg" :src="prependImg" :class="prependClass" alt="" />
        </Transition>
      </template>
    </UiTextField>
  </div>
</template>
<script setup lang="ts">
const { t } = useI18n()

const props = defineProps({
  modelValue: { required: true },
  label: { type: String, default: '' },
  rules: { default: [] },
  maxLength: { type: [String, Number] },
  minLength: { type: [String, Number] },
  isLengthMustMatch: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  readonly: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  hint: { type: [String], default: null },
  required: { type: Boolean, default: false },
  persistentHint: { default: false },
  counter: { default: true },
  width: { type: [Number, String], default: null },
  type: { type: String, default: 'text' },
  max: { type: [Number, String] },
  min: { type: [Number, String] },
  requireUppercase: { type: Boolean, default: false },
  requireSpecialCharacter: { type: Boolean, default: false },
  requireLowercase: { type: Boolean, default: false },
  requireNumber: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  appendImg: { type: String, default: null },
  appendClass: { type: String, default: null },
  prependImg: { type: String, default: null },
  prependClass: { type: String, default: null },
  step: { type: [String, Number] },
  prependInnerIcon: { type: String, default: null },
  appendInnerIcon: { type: String, default: null },
  showPassword: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'click:prepend-inner', 'click:append-inner'])

const model = ref()
const isPasswordVisible = ref(false)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordSteps = ref({
  uppercaseValid: false,
  lowercaseValid: false,
  specialCharacterValid: false,
  numberValid: false,
  minLengthValid: false,
  maxLengthValid: false,
})
const passwordHint = ref('')


watch(() => props.modelValue, (newVal) => {
  model.value = newVal
  validatePassword(newVal)
}, { immediate: true })

watch(model, (newVal) => {
  emit('update:modelValue', newVal)
})

watch(
  passwordSteps.value,
  (newVal) => {
    const hint = []

    if (props.minLength) {
      if (newVal.minLengthValid) {
        hint.push(t('ui.textBox.minChars', { n: props.minLength }, Number(props.minLength)) + ' ✓')
      } else {
        hint.push(t('ui.textBox.minChars', { n: props.minLength }, Number(props.minLength)) + ' ✕')
      }
    }

    if (props.maxLength) {
      if (newVal.maxLengthValid) {
        hint.push(t('ui.textBox.maxChars', { n: props.maxLength }, Number(props.maxLength)) + ' ✓')
      } else {
        hint.push(t('ui.textBox.maxChars', { n: props.maxLength }, Number(props.maxLength)) + ' ✕')
      }
    }

    if (props.requireUppercase) {
      if (newVal.uppercaseValid) {
        hint.push(t('ui.textBox.uppercase') + ' ✓')
      } else {
        hint.push(t('ui.textBox.uppercase') + ' ✕')
      }
    }

    if (props.requireLowercase) {
      if (newVal.lowercaseValid) {
        hint.push(t('ui.textBox.lowercase') + ' ✓')
      } else {
        hint.push(t('ui.textBox.lowercase') + ' ✕')
      }
    }

    if (props.requireNumber) {
      if (newVal.numberValid) {
        hint.push(t('ui.textBox.number') + ' ✓')
      } else {
        hint.push(t('ui.textBox.number') + ' ✕')
      }
    }

    if (props.requireSpecialCharacter) {
      if (newVal.specialCharacterValid) {
        hint.push(t('ui.textBox.special') + ' ✓')
      } else {
        hint.push(t('ui.textBox.special') + ' ✕')
      }
    }

    const hintText = `${hint.join('<br>')}`
    passwordHint.value = hintText
  },
  { immediate: true }
)

const computedAttrs = computed(() => {
  const attrs: Record<string, any> = {}

  switch (props.type) {
    case 'number':
      if (props.max) {
        attrs.max = props.max
      }
      if (props.min) {
        attrs.min = props.min
      }
      break
    case 'password':
      break
    default: // default is 'text'
      if (props.isLengthMustMatch) {
        if (props.maxLength) {
          attrs.maxLength = props.maxLength
        }
        if (props.minLength) {
          attrs.minLength = props.minLength
        }
      }
      break
  }

  return attrs
})

function validateRequired(value: any) {
  if (value) return true
  return t('ui.textBox.required')
}

const handleKeyDown = (event) => {
  if (props.type === 'number' && event.keyCode === 69) {
    event.preventDefault()
  }
}

function validateMaxLength(value: any) {
  if (props.isLengthMustMatch) {
    if (value?.length == props.maxLength) return true
    return t('ui.textBox.exactLength', { label: props.label, n: props.maxLength }, Number(props.maxLength))
  } else {
    if (value?.length <= props.maxLength!) return true
    return t('ui.textBox.maxLength', { label: props.label, n: props.maxLength }, Number(props.maxLength))
  }
}

function validateMinLength(value: any) {
  if (value?.length >= props.minLength!) return true
  return t('ui.textBox.minLength', { label: props.label, n: props.minLength }, Number(props.minLength))
}

function validateMaxNumber(value: any) {
  if (Number(value) <= Number(props.max)) return true
  return t('ui.textBox.maxNumber', { label: props.label, n: props.max })
}

function validateMinNumber(value: any) {
  if (Number(value) >= Number(props.min)) return true
  return t('ui.textBox.minNumber', { label: props.label, n: props.min })
}

function validateEmail(value: any) {
  return !value || emailRegex.test(value) || t('ui.textBox.email')
}

function validatePassword(value: any) {
  const messages = []

  if (props.minLength) {
    if (value?.length >= props.minLength && value) {
      messages.push(t('ui.textBox.minChars', { n: props.minLength }, Number(props.minLength)) + ' ✓')
      passwordSteps.value.minLengthValid = true
    } else {
      messages.push(t('ui.textBox.minChars', { n: props.minLength }, Number(props.minLength)) + ' ✕')
      passwordSteps.value.minLengthValid = false
    }
  }

  if (props.maxLength) {
    if (value?.length <= props.maxLength && value) {
      messages.push(t('ui.textBox.maxChars', { n: props.maxLength }, Number(props.maxLength)) + ' ✓')
      passwordSteps.value.maxLengthValid = true
    } else {
      messages.push(t('ui.textBox.maxChars', { n: props.maxLength }, Number(props.maxLength)) + ' ✕')
      passwordSteps.value.maxLengthValid = false
    }
  }

  if (props.requireUppercase) {
    const regex = /(?=.*[A-Z])/
    if (regex.test(value) && value) {
      messages.push(t('ui.textBox.uppercase') + ' ✓')
      passwordSteps.value.uppercaseValid = true
    } else {
      messages.push(t('ui.textBox.uppercase') + ' ✕')
      passwordSteps.value.uppercaseValid = false
    }
  }

  if (props.requireLowercase) {
    const regex = /^(?=.*[a-z]).+$/
    if (regex.test(value) && value) {
      messages.push(t('ui.textBox.lowercase') + ' ✓')
      passwordSteps.value.lowercaseValid = true
    } else {
      messages.push(t('ui.textBox.lowercase') + ' ✕')
      passwordSteps.value.lowercaseValid = false
    }
  }

  if (props.requireNumber) {
    const regex = /(?=.*\d)/
    if (regex.test(value) && value) {
      messages.push(t('ui.textBox.number') + ' ✓')
      passwordSteps.value.numberValid = true
    } else {
      messages.push(t('ui.textBox.number') + ' ✕')
      passwordSteps.value.numberValid = false
    }
  }

  if (props.requireSpecialCharacter) {
    const regex = /(?=.*[!@#$%^&*,.])/
    if (regex.test(value) && value) {
      messages.push(t('ui.textBox.special') + ' ✓')
      passwordSteps.value.specialCharacterValid = true
    } else {
      messages.push(t('ui.textBox.special') + ' ✕')
      passwordSteps.value.specialCharacterValid = false
    }
  }

  return (
    messages.every((msg) => msg.endsWith('✓')) || `${messages.join('<br>')}`
  )
}

const computedRules = computed<Function[]>(() => {
  const rules: Function[] = [...props.rules]

  if (props.required) {
    rules.push(validateRequired)
  }

  if (props.type == 'text') {
    if (props.maxLength) {
      rules.push(validateMaxLength)
    }

    if (props.minLength) {
      rules.push(validateMinLength)
    }
  }

  if (props.type == 'number') {
    if (props.max) {
      rules.push(validateMaxNumber)
    }
    if (props.min) {
      rules.push(validateMinNumber)
    }
  }

  if (props.type === 'email') {
    rules.push(validateEmail)
  }

  if (props.type === 'password') {
    rules.push(validatePassword)
  }

  return rules
})


function togglePssword() {
  isPasswordVisible.value = !isPasswordVisible.value
}

function messageArray(message: string) {
  if (typeof message === 'string' && message.includes('<br>')) {
    return message.split('<br>')
  }
  return [message]
}

function checkIfStepValid(step: string) {
  if (step.includes('✓')) {
    return true
  }

  return false
}
</script>
<style scoped>
/* Mesaj alanı alana yakın, şifre adımları her zaman görünür (eski Vuetify ayarları) */
.base-text-box :deep(.ui-field__details) {
  padding: 0;
  min-height: 2px;
  transform: translateY(4px);
}
.base-text-box :deep(.ui-field__input) { font-size: 14px; }
.base-text-box :deep(.ui-field__label) { font-weight: 500; }
.base-text-box__step--valid { color: rgb(var(--color-primary)); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
/* Şifre göster/gizle: alan yüksekliğini büyütmeyen küçük ikon butonu */
.password-eye {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
}
.password-eye:hover { opacity: 1; }
</style>
