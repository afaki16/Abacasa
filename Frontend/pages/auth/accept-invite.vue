<template>
  <div class="invite-container" :style="{ background: 'var(--theme-gradient-sidebar)' }">
    <div class="invite-card">
      <div v-if="state === 'loading'" class="state-block">
        <v-progress-circular indeterminate color="white" size="56" width="4" />
        <h2 class="title">Davet yükleniyor...</h2>
      </div>

      <!-- Bulunamadı / kabul edilmiş / iptal / süresi dolmuş -->
      <div v-else-if="state === 'unavailable'" class="state-block">
        <v-icon size="72" color="error">mdi-email-remove-outline</v-icon>
        <h2 class="title">{{ unavailableTitle }}</h2>
        <p class="subtitle">{{ unavailableText }}</p>
        <v-btn color="white" variant="outlined" size="large" class="action-btn" @click="goToLogin">
          Giriş sayfasına dön
        </v-btn>
      </div>

      <template v-else-if="invite">
        <div class="state-block">
          <v-icon size="72" color="white">mdi-home-heart</v-icon>
          <h2 class="title">{{ invite.householdName }}</h2>
          <p class="subtitle">
            {{ invite.inviterName }} sizi bu haneye <strong>{{ roleLabel }}</strong> olarak davet etti.
          </p>

          <v-alert v-if="actionError" type="error" variant="tonal" density="compact" class="w-100 text-left">
            {{ actionError }}
          </v-alert>

          <!-- Oturum açık, e-posta eşleşiyor -->
          <v-btn
            v-if="isLoggedIn && emailMatches"
            color="white"
            variant="outlined"
            size="large"
            class="action-btn"
            :loading="busy"
            @click="accept"
          >
            Daveti kabul et
          </v-btn>

          <!-- Oturum açık, başka hesap -->
          <template v-else-if="isLoggedIn">
            <p class="subtitle">Bu davet {{ invite.email }} adresine gönderildi. O hesapla giriş yapın.</p>
            <v-btn color="white" variant="outlined" size="large" class="action-btn" :loading="busy" @click="logout">
              Çıkış yap
            </v-btn>
          </template>

          <!-- Oturum kapalı -->
          <div v-else class="actions-row">
            <v-btn v-if="invite.userExists" color="white" variant="outlined" size="large" class="action-btn" @click="goToLoginWithRedirect">
              Giriş yap
            </v-btn>
            <v-btn v-else color="white" variant="outlined" size="large" class="action-btn" @click="goToRegister">
              Kayıt ol
            </v-btn>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InvitationInfo } from '~/types'
import { parseApiErrorMessages } from '~/utils/apiError'
import { clearInviteToken, getStoredInviteToken, storeInviteToken } from '~/composables/useHousehold'

// Herkese açık: oturum açık ya da kapalı gelinebilir (auth.global'de ayrıca serbest)
definePageMeta({
  layout: false
})

useHead({ title: 'Haneye davet - Abacasa' })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const auth = useAuth()
const { getInvitation, acceptInvitation, getRoleLabel } = useHousehold()

const state = ref<'loading' | 'unavailable' | 'pending'>('loading')
const invite = ref<InvitationInfo | null>(null)
const unavailableReason = ref<'notFound' | 'Accepted' | 'Revoked' | 'Expired'>('notFound')
const busy = ref(false)
const actionError = ref('')
let token: string | null = null

const isLoggedIn = computed(() => authStore.isAuthenticated)
const emailMatches = computed(
  () => !!invite.value && (authStore.user?.email ?? '').toLowerCase() === invite.value.email.toLowerCase()
)
const roleLabel = computed(() => getRoleLabel(invite.value?.role))

const unavailableTitle = computed(() => {
  switch (unavailableReason.value) {
    case 'Accepted': return 'Davet zaten kabul edilmiş'
    case 'Revoked': return 'Davet iptal edilmiş'
    case 'Expired': return 'Davetin süresi dolmuş'
    default: return 'Davet bulunamadı'
  }
})
const unavailableText = computed(() =>
  unavailableReason.value === 'Accepted'
    ? 'Bu davet daha önce kullanıldı.'
    : 'Yeni bir davet için hane yöneticisine başvurun.'
)

const goToLogin = () => router.push('/')
const goToLoginWithRedirect = () =>
  router.push({ path: '/', query: { redirect: '/auth/accept-invite', email: invite.value?.email } })
// Davet modu: kayıt sayfası token'ı sekme oturumundan okur
const goToRegister = () => router.push('/auth/register')

// Kabul → hane değiştirme → /dashboard'a tam yenileme (token useHousehold'da silinir)
const accept = async () => {
  if (!token) return
  busy.value = true
  actionError.value = ''
  try {
    await acceptInvitation(token)
  } catch (error) {
    actionError.value = parseApiErrorMessages(error, 'Davet kabul edilemedi').join(' ')
    busy.value = false
  }
}

const logout = async () => {
  busy.value = true
  // Token sekme oturumunda kalır; doğru hesapla girişten sonra bu sayfaya dönülür
  const email = invite.value?.email
  await auth.logout()
  await router.push({ path: '/', query: { redirect: '/auth/accept-invite', email } })
}

onMounted(async () => {
  // Token URL'den okunur, sekme oturumuna yazılır ve URL'den silinir (girişten dönüşte oradan okunur)
  const fromUrl = route.query.token as string | undefined
  if (fromUrl) {
    storeInviteToken(fromUrl)
    await router.replace({ path: route.path, query: {} })
  }
  token = getStoredInviteToken()

  if (!token) {
    state.value = 'unavailable'
    return
  }

  try {
    const info = await getInvitation(token)
    if (info.status !== 'Pending') {
      unavailableReason.value = info.status
      clearInviteToken()
      state.value = 'unavailable'
      return
    }
    invite.value = info
    state.value = 'pending'
  } catch {
    unavailableReason.value = 'notFound'
    clearInviteToken()
    state.value = 'unavailable'
  }
})
</script>

<style scoped>
.invite-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.invite-card {
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

.actions-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
}

.action-btn {
  border-radius: 12px !important;
  font-weight: 600 !important;
  text-transform: none !important;
}
</style>
