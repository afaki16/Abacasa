<template>
  <div class="auth-container" :style="{ background: 'var(--theme-gradient-sidebar)' }">
    <div class="auth-card">
      <UiIcon icon="mdi-lock-reset" :size="72" color="white" class="auth-icon" />

      <h1 class="title">{{ t('auth.forceChangePasswordTitle') }}</h1>
      <p class="subtitle">{{ t('auth.forceChangePasswordSubtitle') }}</p>

      <UiForm ref="formRef" v-model="isValid" class="auth-form" @submit="onSubmit">
        <UiTextField
          v-model="currentPassword"
          :label="t('auth.currentPasswordLabel')"
          :type="showPassword ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock-outline"
          bg-color="white"
          rounded="lg"
          autocomplete="current-password"
          autofocus
          :rules="[rules.required]"
          :disabled="loading"
          class="mb-2"
        />

        <UiTextField
          v-model="newPassword"
          :label="t('auth.newPasswordLabel')"
          :type="showPassword ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          bg-color="white"
          rounded="lg"
          autocomplete="new-password"
          :rules="[rules.password, differsFromCurrent]"
          :disabled="loading"
          class="mb-2"
          @click:append-inner="showPassword = !showPassword"
        />

        <UiTextField
          v-model="confirmPassword"
          :label="t('auth.confirmNewPasswordLabel')"
          :type="showPassword ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock-check"
          bg-color="white"
          rounded="lg"
          autocomplete="new-password"
          :rules="[rules.required, rules.confirmPassword(newPassword)]"
          :disabled="loading"
        />

        <UiAlert v-if="errorMessages.length" type="error" variant="tonal" density="compact" class="mb-4">
          <div v-for="(e, i) in errorMessages" :key="i">{{ e }}</div>
        </UiAlert>

        <UiBtn
          type="submit"
          color="white"
          variant="outlined"
          size="large"
          class="action-btn"
          prepend-icon="mdi-content-save-outline"
          :loading="loading"
          :disabled="!isValid"
          block
        >
          {{ t('auth.resetPasswordButton') }}
        </UiBtn>
      </UiForm>

      <div class="actions">
        <UiBtn variant="text" color="white" class="link-btn" prepend-icon="mdi-logout" :disabled="loading" @click="onLogout">
          {{ t('auth.logout') }}
        </UiBtn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { parseApiErrorMessages } from '~/utils/apiError'

// Layout'suz: kilitliyken menü, hane seçici ve onay penceresi (ConsentGate) gösterilmez
definePageMeta({
  layout: false
})

const { t } = useI18n()
const auth = useAuth()
const { validationRules: rules } = useValidators()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const isValid = ref(false)
const loading = ref(false)
const errorMessages = ref<string[]>([])

const differsFromCurrent = (value: string) =>
  value !== currentPassword.value || t('auth.newPasswordMustDiffer')

const onSubmit = async () => {
  if (!isValid.value || loading.value) return
  loading.value = true
  errorMessages.value = []
  try {
    await auth.completeForcedPasswordChange(currentPassword.value, newPassword.value)
  } catch (error) {
    errorMessages.value = parseApiErrorMessages(error, t('auth.resetPasswordFailed'))
  } finally {
    loading.value = false
  }
}

const onLogout = async () => {
  loading.value = true
  await auth.logout()
  loading.value = false
}

useHead({
  title: t('auth.pageTitleForceChangePassword')
})
</script>

<style scoped>
/* reset-password.vue ile aynı görünüm */
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 480px;
  padding: 48px 40px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  color: white;
  text-align: center;
  box-shadow: 0 25px 45px rgba(0, 0, 0, 0.25);
}

.auth-icon {
  margin-bottom: 16px;
}

.title {
  font-size: 1.85rem;
  font-weight: 700;
  margin: 0 0 12px;
}

.subtitle {
  color: rgba(255, 255, 255, 0.85);
  font-size: 1.05rem;
  margin: 0 0 24px;
}

.auth-form {
  text-align: left;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  margin-top: 16px;
}

.action-btn {
  border-radius: 12px !important;
  font-weight: 600 !important;
  text-transform: none !important;
}

.link-btn {
  text-transform: none !important;
  font-weight: 500 !important;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 32px 20px;
  }
}
</style>
