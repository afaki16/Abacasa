<template>
  <div class="auth-container" :style="{ background: 'var(--theme-gradient-sidebar)' }">
    <div class="auth-card">
      <v-icon size="72" color="white" class="auth-icon">
        {{ linkValid ? 'mdi-lock-reset' : 'mdi-link-variant-off' }}
      </v-icon>

      <h1 class="title">{{ t('auth.resetPasswordTitle') }}</h1>

      <template v-if="linkValid">
        <p class="subtitle">{{ t('auth.resetPasswordSubtitle') }}</p>

        <v-form ref="formRef" v-model="isValid" class="auth-form" @submit.prevent="onSubmit">
          <v-text-field
            v-model="newPassword"
            :label="t('auth.newPasswordLabel')"
            :type="showPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            variant="outlined"
            bg-color="white"
            rounded="lg"
            autocomplete="new-password"
            :rules="[rules.password]"
            :disabled="loading"
            class="mb-2"
            @click:append-inner="showPassword = !showPassword"
          />

          <v-text-field
            v-model="confirmPassword"
            :label="t('auth.confirmNewPasswordLabel')"
            :type="showPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-check"
            variant="outlined"
            bg-color="white"
            rounded="lg"
            autocomplete="new-password"
            :rules="[rules.required, rules.confirmPassword(newPassword)]"
            :disabled="loading"
          />

          <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
            {{ errorMessage }}
          </v-alert>

          <v-btn
            type="submit"
            color="white"
            variant="outlined"
            size="large"
            class="action-btn"
            :loading="loading"
            :disabled="!isValid"
            block
          >
            <v-icon start>mdi-content-save-outline</v-icon>
            {{ t('auth.resetPasswordButton') }}
          </v-btn>
        </v-form>
      </template>

      <p v-else class="subtitle">{{ t('auth.invalidResetLink') }}</p>

      <div class="actions">
        <v-btn
          v-if="!linkValid || errorMessage"
          variant="text"
          color="white"
          class="link-btn"
          @click="goToForgotPassword"
        >
          {{ t('auth.requestNewLink') }}
        </v-btn>
        <v-btn variant="text" color="white" class="link-btn" @click="goToLogin">
          {{ t('auth.backToLogin') }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { parseApiErrorMessages } from '~/utils/apiError'

definePageMeta({
  layout: false
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuth()
const authStore = useAuthStore()
const toast = useToast()
const { validationRules: rules } = useValidators()

// Token ve email sadece bellekte tutulur; query hemen URL'den (ve tarayıcı geçmişinden) silinir.
const token = ref((route.query.token as string) || '')
const email = ref((route.query.email as string) || '')
const linkValid = computed(() => !!token.value && !!email.value)

const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const isValid = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const goToLogin = () => router.push('/')
const goToForgotPassword = () => router.push('/auth/forgot-password')

onMounted(() => {
  if (Object.keys(route.query).length > 0) {
    router.replace({ path: route.path, query: {} })
  }
})

const onSubmit = async () => {
  if (!isValid.value || !linkValid.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    await auth.resetPassword(email.value, token.value, newPassword.value)
    authStore.clearAuth()
    toast.success(t('auth.resetPasswordSuccess'))
    await router.replace('/')
  } catch (error: any) {
    if (error?.response?.status === 429) {
      errorMessage.value = t('auth.tooManyRequests')
    } else {
      const messages = parseApiErrorMessages(error, t('auth.resetPasswordFailed'))
      errorMessage.value = messages[0] || t('auth.resetPasswordFailed')
    }
  } finally {
    loading.value = false
  }
}

useHead({
  title: t('auth.pageTitleResetPassword')
})
</script>

<style scoped>
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
</style>
