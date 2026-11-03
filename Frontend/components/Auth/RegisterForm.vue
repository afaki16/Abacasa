<template>
  <UiForm ref="form" v-model="isValid" @submit="$emit('submit', formData)" :class="formClass">
      <div class="input-group">
        <BaseTextBox
          v-model="formData.firstName"
          :label="t('auth.firstNameLabel')"
          prepend-inner-icon="mdi-account"
          :rules="[rules.required, rules.minLength(2)]"
          type="text"
          required
          min-length="2"
          :disabled="loading"
          :class="inputClass"
        />
      </div>
      <div class="input-group">
        <BaseTextBox
          v-model="formData.lastName"
          :label="t('auth.lastNameLabel')"
          :rules="[rules.required, rules.minLength(2)]"
          type="text"
          required
          min-length="2"
          :disabled="loading"
          :class="inputClass"
        />
      </div>

    <div class="input-group">
      <BaseTextBox
        v-model="formData.email"
        :label="t('auth.email')"
        type="email"
        prepend-inner-icon="mdi-email"
        :rules="[rules.required, rules.email]"
        required
        :disabled="loading || !!inviteEmail"
        :class="inputClass"
        @focusout="checkAvailability('email')"
      />
      <p v-if="takenMessage.email" class="availability-error">{{ takenMessage.email }}</p>
    </div>
    <!-- Davet modunda hane açılmaz; alan gizlenir -->
    <div v-if="!inviteEmail" class="input-group">
      <BaseTextBox
        v-model="formData.householdName"
        label="Hane adı"
        placeholder="Örn. Fakı Hanesi"
        type="text"
        prepend-inner-icon="mdi-home"
        :rules="[rules.required, householdNameMax]"
        required
        :disabled="loading"
        :class="inputClass"
      />
    </div>

    <div class="input-group">
      <BaseTextBox
        v-model="formData.phoneNumber"
        :label="t('auth.phoneLabel')"
        type="tel"
        prepend-inner-icon="mdi-phone"
        :rules="[rules.phone]"
        :disabled="loading"
        hint="0555 111 22 33"
        :class="inputClass"
        @focusout="checkAvailability('phoneNumber')"
      />
      <p v-if="takenMessage.phoneNumber" class="availability-error">{{ takenMessage.phoneNumber }}</p>
    </div>

    <div class="input-group">
        <BaseTextBox
          v-model="formData.password"
          :label="t('auth.password')"
          type="password"
          prepend-inner-icon="mdi-lock"
          :rules="[rules.password]"
          required
          min-length="8"
          require-uppercase
          require-lowercase
          require-number
          require-special-character
          :disabled="loading"
          :class="inputClass"
        />
    </div>

    <div class="input-group">
      <BaseTextBox
        v-model="formData.confirmPassword"
        :label="t('auth.confirmPasswordLabel')"
        type="password"
        prepend-inner-icon="mdi-lock-check"
        :rules="[rules.required, rules.confirmPassword(formData.password)]"
        required
        :disabled="loading"
        :class="inputClass"
      />
    </div>

    <!-- Password strength indicator -->
    <div class="password-strength mb-4">
      <div class="strength-header">
        <span class="strength-label">{{ t('auth.passwordStrength') }}:</span>
        <span class="strength-text" :class="passwordStrengthColor">
          {{ passwordStrengthText }}
        </span>
      </div>
      <UiProgressLinear
        :model-value="passwordStrength"
        :color="passwordStrengthColor"
        :height="4"
        rounded
        class="strength-bar"
      />
    </div>

    <slot name="terms" />

    <UiBtn
      type="submit"
      :color="submitButtonColor"
      size="large"
      block
      :loading="loading"
      :disabled="!isValid"
      :class="submitButtonClass"
      :elevation="8"
    >
      <slot name="submit-text">{{ t('auth.createAccountTitle') }}</slot>
    </UiBtn>
  </UiForm>
</template>

<script setup lang="ts">
import type { RegisterRequest } from '~/types'
import BaseTextBox from '~/components/UI/BaseTextBox.vue'

// Props & Emits
const props = defineProps<{
  loading?: boolean
  config?: any
  formClass?: string
  inputClass?: string
  submitButtonColor?: string
  submitButtonClass?: string
  /** Davet modu: e-posta bu adrese kilitlenir, hane adı alanı gizlenir */
  inviteEmail?: string | null
}>()

const emit = defineEmits<{
  submit: [data: RegisterRequest]
}>()

// Composables
const { t } = useI18n()
const { validationRules: rules } = useValidators()

// Reactive data
const form = ref()
const isValid = ref(false)

const formData = reactive<RegisterRequest>({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phoneNumber: '',
  householdName: ''
})

const householdNameMax = (v: string) => (v ?? '').trim().length <= 100 || 'Hane adı en fazla 100 karakter olabilir'

// Davet modunda e-posta davetteki adrestir
watch(
  () => props.inviteEmail,
  (email) => {
    if (email) formData.email = email
  },
  { immediate: true }
)

// Alan terk edilince e-posta/telefonun daha önce kayıtlı olup olmadığı kontrol edilir.
// Yalnızca bilgilendirme: rate limit'e takılınca veya hata olursa sessizce geçilir,
// kayıt gönderildiğinde backend aynı kontrolü yine yapar.
type AvailabilityField = 'email' | 'phoneNumber'
const { checkRegisterAvailability } = useAuth()
const takenMessage = reactive<Record<AvailabilityField, string>>({ email: '', phoneNumber: '' })
const lastChecked: Record<AvailabilityField, string> = { email: '', phoneNumber: '' }

const checkAvailability = async (field: AvailabilityField) => {
  // Davet modunda e-posta davetteki adrese kilitli; kontrol gereksiz
  if (field === 'email' && props.inviteEmail) return
  const value = (formData[field] ?? '').trim()
  const formatRule = field === 'email' ? rules.email : rules.phone
  if (!value || formatRule(value) !== true || value === lastChecked[field]) return

  lastChecked[field] = value
  try {
    const result = await checkRegisterAvailability({ [field]: value })
    // Kullanıcı istek sürerken değeri değiştirdiyse eski cevabı gösterme
    if ((formData[field] ?? '').trim() !== value) return
    const availability = result?.data?.[field]
    takenMessage[field] = availability && !availability.isAvailable ? (availability.reason ?? '') : ''
  } catch {
    lastChecked[field] = ''
  }
}

// Değer değişince eski "kayıtlı" uyarısını kaldır
watch(() => formData.email, (value) => {
  if ((value ?? '').trim() !== lastChecked.email) takenMessage.email = ''
})
watch(() => formData.phoneNumber, (value) => {
  if ((value ?? '').trim() !== lastChecked.phoneNumber) takenMessage.phoneNumber = ''
})

// Password strength computation
const passwordStrength = computed(() => {
  const password = formData.password
  if (!password) return 0
  
  let strength = 0
  
  // Length check
  if (password.length >= 8) strength += 25
  
  // Character variety checks
  if (/[a-z]/.test(password)) strength += 25
  if (/[A-Z]/.test(password)) strength += 25
  if (/\d/.test(password)) strength += 15
  if (/[^A-Za-z0-9]/.test(password)) strength += 10
  
  return Math.min(strength, 100)
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength < 25) return t('auth.strengthWeak')
  if (strength < 50) return t('auth.strengthFair')
  if (strength < 75) return t('auth.strengthGood')
  return t('auth.strengthStrong')
})

const passwordStrengthColor = computed(() => {
  const strength = passwordStrength.value
  if (strength < 25) return 'error'
  if (strength < 50) return 'warning'
  if (strength < 75) return 'info'
  return 'success'
})

// Methods
const validateForm = () => {
  return form.value?.validate()
}

const reset = () => {
  form.value?.reset()
  Object.assign(formData, {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    householdName: ''
  })
}


// Expose methods
defineExpose({
  validateForm,
  reset,
  formData
})
</script>

<style scoped>
.input-row {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.input-row .input-group {
  flex: 1;
}

.input-group {
  margin-bottom: 20px;
}

.availability-error {
  margin: 4px 0 0 12px;
  font-size: 0.8rem;
  color: #fecaca;
}

/* Koyu arka plan üzerinde yarı saydam alanlar */
.input-group :deep(.ui-field) {
  --ui-on: 255 255 255;
  --ui-field-bg: rgba(255, 255, 255, 0.1);
  --ui-field-border: rgba(255, 255, 255, 0.2);
  --ui-field-border-hover: rgba(255, 255, 255, 0.45);
  --ui-field-accent: #fff;
  --ui-field-radius: 12px;
}

.input-group :deep(.ui-field__input) {
  color: white;
}

.input-group :deep(.ui-field__label) {
  color: rgba(255, 255, 255, 0.8);
  opacity: 1;
}

.input-group :deep(.ui-field--error .ui-field__label) {
  color: rgb(var(--color-error));
}

/* Temizle ikonu kendi göster/gizle davranışını korur */
.input-group :deep(.ui-field__icon:not(.ui-field__clear)) {
  color: rgba(255, 255, 255, 0.8);
  opacity: 1;
}

.password-strength {
  text-align: left;
}

.strength-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.strength-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
}

.strength-text {
  font-size: 0.875rem;
  font-weight: 600;
}

.strength-bar {
  border-radius: 2px;
}

/* Responsive design */
@media (max-width: 768px) {
  .input-row {
    flex-direction: column;
    gap: 0;
  }
}
</style> 