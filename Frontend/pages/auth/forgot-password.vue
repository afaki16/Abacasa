<template>
  <div class="auth-container" :style="{ background: 'var(--theme-gradient-sidebar)' }">
    <div class="auth-card">
      <v-icon size="72" color="white" class="auth-icon">mdi-lock-question</v-icon>

      <h1 class="title">{{ t('auth.forgotPassword') }}</h1>

      <template v-if="!submitted">
        <p class="subtitle">{{ t('auth.forgotPasswordSubtitle') }}</p>

        <v-form ref="formRef" v-model="isValid" class="auth-form" @submit.prevent="onSubmit">
          <v-text-field
            v-model="email"
            :label="t('auth.email')"
            :placeholder="t('auth.emailPlaceholder')"
            type="email"
            prepend-inner-icon="mdi-email"
            variant="outlined"
            bg-color="white"
            rounded="lg"
            autocomplete="email"
            :rules="[rules.required, rules.email]"
            :disabled="loading"
          />

          <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4 text-left">
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
            <v-icon start>mdi-email-fast-outline</v-icon>
            {{ t('auth.sendResetLink') }}
          </v-btn>
        </v-form>
      </template>

      <p v-else class="subtitle">{{ t('auth.resetLinkSent') }}</p>

      <div class="actions">
        <v-btn variant="text" color="white" class="link-btn" @click="goToLogin">
          {{ t('auth.backToLogin') }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: 'guest'
})

const { t } = useI18n()
const router = useRouter()
const auth = useAuth()
const { validationRules: rules } = useValidators()

const email = ref('')
const isValid = ref(false)
const loading = ref(false)
const submitted = ref(false)
const errorMessage = ref('')

const goToLogin = () => router.push('/')

const onSubmit = async () => {
  if (!isValid.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    await auth.forgotPassword(email.value.trim())
    submitted.value = true
  } catch (error: any) {
    if (error?.response?.status === 429) {
      errorMessage.value = t('auth.tooManyRequests')
    } else {
      // Yanıttan bağımsız aynı mesaj: e-postanın kayıtlı olup olmadığı belli olmasın.
      submitted.value = true
    }
  } finally {
    loading.value = false
  }
}

useHead({
  title: t('auth.pageTitleForgotPassword')
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
