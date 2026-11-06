<template>
  <div class="verify-container" :style="{ background: 'var(--theme-gradient-sidebar)' }">
    <div class="verify-card">
      <div v-if="state === 'loading'" class="state-block">
        <UiProgressCircular indeterminate color="white" :size="56" :width="4" />
        <h2 class="title">{{ $t('auth.emailChange.inProgress') }}</h2>
        <p class="subtitle">{{ $t('auth.pleaseWait') }}</p>
      </div>

      <div v-else-if="state === 'success'" class="state-block">
        <UiIcon icon="mdi-check-circle-outline" :size="72" color="success" />
        <h2 class="title">{{ $t('auth.emailChange.done') }}</h2>
        <i18n-t keypath="auth.emailChange.doneText" tag="p" class="subtitle" scope="global">
          <template #email><strong>{{ email }}</strong></template>
        </i18n-t>
        <UiBtn
          color="white"
          variant="outlined"
          size="large"
          class="action-btn"
          @click="goToLogin"
        >
          {{ $t('auth.goToLogin') }}
        </UiBtn>
      </div>

      <div v-else class="state-block">
        <UiIcon icon="mdi-alert-circle-outline" :size="72" color="error" />
        <h2 class="title">{{ $t('auth.linkInvalid') }}</h2>
        <p class="subtitle">{{ errorMessage }}</p>
        <p class="subtitle">{{ $t('auth.emailChange.notChanged') }}</p>
        <UiBtn
          color="white"
          variant="text"
          size="large"
          class="action-btn"
          @click="goToLogin"
        >
          {{ $t('auth.loginPage') }}
        </UiBtn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { parseApiErrorMessages } from '~/utils/apiError'

// Layout'suz: menü, hane seçici ve onay penceresi (ConsentGate) gösterilmez; zorunlu şifre kilidinden
// bağımsız olarak açılır (auth.global middleware'i bu sayfayı kilit kontrolünden önce serbest bırakır)
definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const authStore = useAuthStore()
const { t } = useI18n()

const state = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref(t('auth.emailChange.linkExpired'))

// Token yalnızca bellekte tutulur; query hemen URL'den (ve tarayıcı geçmişinden) silinir.
const email = ref((route.query.email as string) || '')
const token = ref((route.query.token as string) || '')

const goToLogin = () => router.push('/')

onMounted(async () => {
  if (Object.keys(route.query).length > 0) {
    router.replace({ path: route.path, query: {} })
  }

  if (!email.value || !token.value) {
    state.value = 'error'
    errorMessage.value = t('auth.linkMalformed')
    return
  }

  try {
    await auth.confirmEmailChange(email.value, token.value)
    // Backend bu kullanıcının tüm oturumlarını kapattı; bu tarayıcıda açık oturum varsa temizle
    authStore.clearAuth()
    state.value = 'success'
  } catch (error) {
    state.value = 'error'
    const messages = parseApiErrorMessages(error)
    errorMessage.value = messages[0] || errorMessage.value
  }
})

useHead({
  title: computed(() => t('auth.pageTitleEmailChange'))
})
</script>

<style scoped>
.verify-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.verify-card {
  width: 100%;
  max-width: 460px;
  padding: 48px 40px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  color: white;
  text-align: center;
  box-shadow: 0 25px 45px rgba(0, 0, 0, 0.25);
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 8px 0 0;
}

.subtitle {
  color: rgba(255, 255, 255, 0.78);
  font-size: 1rem;
  margin: 0;
}

.action-btn {
  border-radius: 12px !important;
  font-weight: 600 !important;
  text-transform: none !important;
}
</style>
