<template>
  <!-- Kapatılamaz: onaylanana kadar uygulama kullanılamaz; yalnızca çıkış yapılabilir -->
  <UiDialog :model-value="open" persistent max-width="520">
    <UiCard>
      <div class="ui-card-title">Koşullar güncellendi</div>
      <div class="ui-card-text">
        <p class="mb-3">Devam etmek için güncellenen belgeleri okuyup onaylayın.</p>

        <UiCheckbox
          v-if="pending.includes('Terms')"
          v-model="acceptTerms"
          density="compact"
          hide-details
          :disabled="busy"
        >
          <template #label>
            <span>
              <a :href="LEGAL_ROUTES.terms" target="_blank" rel="noopener" @click.stop>Kullanım koşullarını</a>
              okudum ve kabul ediyorum.
            </span>
          </template>
        </UiCheckbox>
        <UiCheckbox
          v-if="pending.includes('PrivacyNotice')"
          v-model="acknowledgePrivacy"
          density="compact"
          hide-details
          :disabled="busy"
        >
          <template #label>
            <span>
              Kişisel verilerimin işlenmesine ilişkin
              <a :href="LEGAL_ROUTES.privacy" target="_blank" rel="noopener" @click.stop>Aydınlatma Metni'ni</a>
              okudum.
            </span>
          </template>
        </UiCheckbox>

        <UiAlert v-if="errors.length" type="error" variant="tonal" density="compact" class="mt-3">
          <div v-for="(e, i) in errors" :key="i">{{ e }}</div>
        </UiAlert>
      </div>
      <div class="ui-card-actions px-6 pb-4">
        <UiBtn variant="text" :disabled="busy" @click="logout">Çıkış yap</UiBtn>
        <div class="flex-1" />
        <UiBtn color="primary" variant="flat" :loading="busy" :disabled="!canContinue" @click="submit">Devam et</UiBtn>
      </div>
    </UiCard>
  </UiDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ConsentDocument } from '~/types'
import { LEGAL_ROUTES } from '~/utils/legal'
import { parseApiErrorMessages } from '~/utils/apiError'

const authStore = useAuthStore()
const auth = useAuth()
const { acceptConsents } = useLegal()

const pending = computed<ConsentDocument[]>(() => authStore.user?.pendingConsents ?? [])
const open = computed(() => authStore.isAuthenticated && pending.value.length > 0)

const acceptTerms = ref(false)
const acknowledgePrivacy = ref(false)
const busy = ref(false)
const errors = ref<string[]>([])

// Bekleyen her belgenin kutusu işaretlenmeden devam edilemez
const canContinue = computed(
  () =>
    (!pending.value.includes('Terms') || acceptTerms.value) &&
    (!pending.value.includes('PrivacyNotice') || acknowledgePrivacy.value)
)

watch(open, (isOpen) => {
  if (isOpen) {
    acceptTerms.value = false
    acknowledgePrivacy.value = false
    errors.value = []
  }
})

const submit = async () => {
  if (!canContinue.value) return
  busy.value = true
  errors.value = []
  try {
    await acceptConsents([...pending.value])
  } catch (error) {
    errors.value = parseApiErrorMessages(error, 'Onay kaydedilemedi')
  } finally {
    busy.value = false
  }
}

const logout = async () => {
  busy.value = true
  await auth.logout()
  busy.value = false
}
</script>
