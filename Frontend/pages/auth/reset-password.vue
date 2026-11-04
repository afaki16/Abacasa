<template>
  <div class="auth-container" :style="{ background: 'var(--theme-gradient-sidebar)' }">
    <div class="auth-card">
      <UiIcon :icon="linkValid ? 'mdi-lock-reset' : 'mdi-link-variant-off'" :size="72" color="white" class="auth-icon" />

      <h1 class="title">{{ t(isInvitation ? 'auth.accountInvitationTitle' : 'auth.resetPasswordTitle') }}</h1>

      <template v-if="linkValid">
        <p class="subtitle">{{ t(isInvitation ? 'auth.accountInvitationSubtitle' : 'auth.resetPasswordSubtitle') }}</p>

        <UiForm ref="formRef" v-model="isValid" class="auth-form" @submit="onSubmit">
          <UiTextField
            v-model="newPassword"
            :label="t('auth.newPasswordLabel')"
            :type="showPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            bg-color="white"
            rounded="lg"
            autocomplete="new-password"
            :rules="[rules.password]"
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

          <UiAlert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
            {{ errorMessage }}
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
            {{ t(isInvitation ? 'auth.accountInvitationButton' : 'auth.resetPasswordButton') }}
          </UiBtn>
        </UiForm>
      </template>

      <p v-else class="subtitle">{{ t('auth.invalidResetLink') }}</p>

      <!-- Hesap daveti linki süresi dolmuşsa "yeni bağlantı iste" de çalışır ama kullanıcıya asıl yolu söyle -->
      <p v-if="isInvitation && (errorMessage || !linkValid)" class="subtitle !mt-4">{{ t('auth.accountInvitationExpiredHint') }}</p>

      <div class="actions">
        <UiBtn
          v-if="!linkValid || errorMessage"
          variant="text"
          color="white"
          class="link-btn"
          @click="goToForgotPassword"
        >
          {{ t('auth.requestNewLink') }}
        </UiBtn>
        <UiBtn variant="text" color="white" class="link-btn" @click="goToLogin">
          {{ t('auth.backToLogin') }}
        </UiBtn>
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
// Admin'in gönderdiği hesap daveti linki aynı endpoint'i kullanır; sadece metinler değişir (hane davetiyle ilgisi yok)
const isInvitation = ref(route.query.invite === '1')

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
    toast.success(t(isInvitation.value ? 'auth.accountInvitationSuccess' : 'auth.resetPasswordSuccess'))
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
