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
        <UiBtn
          variant="plain"
          :icon="(isPasswordVisible || showPassword) ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
          @click.prevent="togglePssword"
        />
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
        hint.push(`En az ${props.minLength} karakter ✓`)
      } else {
        hint.push(`En az ${props.minLength} karakter ✕`)
      }
    }

    if (props.maxLength) {
      if (newVal.maxLengthValid) {
        hint.push(`En fazla ${props.maxLength} karakter ✓`)
      } else {
        hint.push(`En fazla ${props.maxLength} karakter ✕`)
      }
    }

    if (props.requireUppercase) {
      if (newVal.uppercaseValid) {
        hint.push('En az bir büyük harf ✓')
      } else {
        hint.push('En az bir büyük harf ✕')
      }
    }

    if (props.requireLowercase) {
      if (newVal.lowercaseValid) {
        hint.push('En az bir küçük harf ✓')
      } else {
        hint.push('En az bir küçük harf ✕')
      }
    }

    if (props.requireNumber) {
      if (newVal.numberValid) {
        hint.push('En az bir rakam ✓')
      } else {
        hint.push('En az bir rakam ✕')
      }
    }

    if (props.requireSpecialCharacter) {
      if (newVal.specialCharacterValid) {
        hint.push('En az bir özel karakter ✓')
      } else {
        hint.push('En az bir özel karakter ✕')
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
  return 'Girilmesi zorunludur.'
}

const handleKeyDown = (event) => {
  if (props.type === 'number' && event.keyCode === 69) {
    event.preventDefault()
  }
}

function validateMaxLength(value: any) {
  if (props.isLengthMustMatch) {
    if (value?.length == props.maxLength) return true
    return `${props.label} ${props.maxLength} karakter olmalıdır.`
  } else {
    if (value?.length <= props.maxLength!) return true
    return `${props.label} en fazla ${props.maxLength} karakter olabilir.`
  }
}

function validateMinLength(value: any) {
  if (value?.length >= props.minLength!) return true
  return `${props.label} en az ${props.minLength} karakter olmalıdır.`
}

function validateMaxNumber(value: any) {
  if (Number(value) <= Number(props.max)) return true
  return `${props.label} en fazla ${props.max} olabilir.`
}

function validateMinNumber(value: any) {
  if (Number(value) >= Number(props.min)) return true
  return `${props.label} en az ${props.min} olabilir.`
}

function validateEmail(value: any) {
  return !value || emailRegex.test(value) || 'Geçerli bir e-posta giriniz.'
}

function validatePassword(value: any) {
  const messages = []

  if (props.minLength) {
    if (value?.length >= props.minLength && value) {
      messages.push(`En az ${props.minLength} karakter ✓`)
      passwordSteps.value.minLengthValid = true
    } else {
      messages.push(`En az ${props.minLength} karakter ✕`)
      passwordSteps.value.minLengthValid = false
    }
  }

  if (props.maxLength) {
    if (value?.length <= props.maxLength && value) {
      messages.push(`En fazla ${props.maxLength} karakter ✓`)
      passwordSteps.value.maxLengthValid = true
    } else {
      messages.push(`En fazla ${props.maxLength} karakter ✕`)
      passwordSteps.value.maxLengthValid = false
    }
  }

  if (props.requireUppercase) {
    const regex = /(?=.*[A-Z])/
    if (regex.test(value) && value) {
      messages.push('En az bir büyük harf ✓')
      passwordSteps.value.uppercaseValid = true
    } else {
      messages.push('En az bir büyük harf ✕')
      passwordSteps.value.uppercaseValid = false
    }
  }

  if (props.requireLowercase) {
    const regex = /^(?=.*[a-z]).+$/
    if (regex.test(value) && value) {
      messages.push('En az bir küçük harf ✓')
      passwordSteps.value.lowercaseValid = true
    } else {
      messages.push('En az bir küçük harf ✕')
      passwordSteps.value.lowercaseValid = false
    }
  }

  if (props.requireNumber) {
    const regex = /(?=.*\d)/
    if (regex.test(value) && value) {
      messages.push('En az bir rakam ✓')
      passwordSteps.value.numberValid = true
    } else {
      messages.push('En az bir rakam ✕')
      passwordSteps.value.numberValid = false
    }
  }

  if (props.requireSpecialCharacter) {
    const regex = /(?=.*[!@#$%^&*,.])/
    if (regex.test(value) && value) {
      messages.push('En az bir özel karakter ✓')
      passwordSteps.value.specialCharacterValid = true
    } else {
      messages.push('En az bir özel karakter ✕')
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
</style>
