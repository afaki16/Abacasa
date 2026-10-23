<template>
  <v-card rounded="xl" elevation="0" border class="delete-account-card">
    <v-card-title class="section-title pa-5 text-error">
      <v-avatar color="error" variant="tonal" size="32" rounded="lg" class="mr-3">
        <v-icon size="16">mdi-account-remove</v-icon>
      </v-avatar>
      Hesabı sil
    </v-card-title>
    <v-divider />

    <v-card-text class="pa-5">
      <p class="mb-4">
        Hesabınız silindiğinde kişisel bilgileriniz kalıcı olarak silinir ve bu işlem geri alınamaz. Girdiğiniz kayıtlar ait
        oldukları hanelerde kalır.
      </p>

      <v-btn v-if="!opened" color="error" variant="outlined" @click="open">Hesabımı silmek istiyorum</v-btn>

      <template v-else>
        <div v-if="loadingPreview" class="py-4 text-center">
          <v-progress-circular indeterminate color="error" />
        </div>

        <template v-else-if="preview">
          <v-alert v-if="preview.isLastSuperAdmin" type="error" variant="tonal" density="compact" class="mb-3">
            Sistemdeki son süper yöneticisiniz; hesabınız silinemez.
          </v-alert>
          <v-alert v-if="preview.blockedHouseholds.length" type="warning" variant="tonal" density="compact" class="mb-3">
            Şu hanelerde son yöneticisiniz; önce başka bir üyeyi yönetici yapın: {{ names(preview.blockedHouseholds) }}
          </v-alert>
          <template v-if="preview.householdsToDelete.length">
            <v-alert type="warning" variant="tonal" density="compact" class="mb-2">
              Şu haneler de bütün verileriyle silinecek: {{ names(preview.householdsToDelete) }}
            </v-alert>
            <v-checkbox
              v-model="confirmSoleHouseholds"
              label="Bu hanelerin de silinmesini onaylıyorum"
              color="error"
              density="compact"
              hide-details
              class="mb-3"
            />
          </template>

          <v-form @submit.prevent="submit">
            <v-text-field
              v-model="password"
              label="Parola"
              type="password"
              variant="outlined"
              density="comfortable"
              autocomplete="current-password"
              class="mb-3"
              :disabled="isBlocked || busy"
            />
            <v-alert v-if="errors.length" type="error" variant="tonal" density="compact" class="mb-3">
              <div v-for="(e, i) in errors" :key="i">{{ e }}</div>
            </v-alert>
            <v-btn type="submit" color="error" block :loading="busy" :disabled="!canSubmit">
              Hesabımı kalıcı olarak sil
            </v-btn>
          </v-form>
        </template>
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AccountDeletionPreview, HouseholdRef } from '~/types'
import { parseApiErrorMessages } from '~/utils/apiError'

const { getAccountDeletionPreview, deleteAccount } = useAuth()

const opened = ref(false)
const loadingPreview = ref(false)
const preview = ref<AccountDeletionPreview | null>(null)
const confirmSoleHouseholds = ref(false)
const password = ref('')
const busy = ref(false)
const errors = ref<string[]>([])

const names = (list: HouseholdRef[]) => list.map((h) => h.name).join(', ')

// Son yönetici olunan hane ya da son SuperAdmin: silme düğmesi pasif
const isBlocked = computed(() => !!preview.value && (preview.value.isLastSuperAdmin || preview.value.blockedHouseholds.length > 0))
const canSubmit = computed(
  () =>
    !!preview.value &&
    !isBlocked.value &&
    !!password.value &&
    (preview.value.householdsToDelete.length === 0 || confirmSoleHouseholds.value)
)

// Bölüm açılınca önizleme alınır
const open = async () => {
  opened.value = true
  loadingPreview.value = true
  try {
    preview.value = await getAccountDeletionPreview()
  } catch {
    opened.value = false
  } finally {
    loadingPreview.value = false
  }
}

// Başarıda oturum kapanır ve giriş sayfasında "Hesabınız silindi." gösterilir
const submit = async () => {
  if (!canSubmit.value || !preview.value) return
  busy.value = true
  errors.value = []
  try {
    await deleteAccount(password.value, preview.value.householdsToDelete.length > 0 && confirmSoleHouseholds.value)
  } catch (error) {
    errors.value = parseApiErrorMessages(error, 'Hesap silinemedi')
    busy.value = false
  }
}
</script>

<style scoped>
.delete-account-card {
  border-color: rgb(var(--v-theme-error)) !important;
}
</style>
