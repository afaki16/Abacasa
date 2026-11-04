<template>
  <UiCard rounded="xl" elevation="0" border class="delete-account-card">
    <div class="ui-card-title section-title !p-5 text-error">
      <UiAvatar color="error" variant="tonal" :size="32" rounded="lg" class="mr-3">
        <UiIcon icon="mdi-account-remove" :size="16" />
      </UiAvatar>
      Hesabı sil
    </div>
    <hr class="ui-divider" />

    <div class="ui-card-text !p-5">
      <p class="mb-4">
        Hesabınız silindiğinde kişisel bilgileriniz kalıcı olarak silinir ve bu işlem geri alınamaz. Girdiğiniz kayıtlar ait
        oldukları hanelerde kalır.
      </p>

      <UiBtn v-if="!opened" color="error" variant="outlined" @click="open">Hesabımı silmek istiyorum</UiBtn>

      <template v-else>
        <div v-if="loadingPreview" class="py-4 text-center">
          <UiProgressCircular indeterminate color="error" />
        </div>

        <template v-else-if="preview">
          <UiAlert v-if="preview.isLastSuperAdmin" type="error" variant="tonal" density="compact" class="mb-3">
            Sistemdeki son süper yöneticisiniz; hesabınız silinemez.
          </UiAlert>
          <UiAlert v-if="preview.blockedHouseholds.length" type="warning" variant="tonal" density="compact" class="mb-3">
            Şu hanelerde son yöneticisiniz; önce başka bir üyeyi yönetici yapın: {{ names(preview.blockedHouseholds) }}
          </UiAlert>
          <template v-if="preview.householdsToDelete.length">
            <UiAlert type="warning" variant="tonal" density="compact" class="mb-2">
              Şu haneler de bütün verileriyle silinecek: {{ names(preview.householdsToDelete) }}
            </UiAlert>
            <UiCheckbox
              v-model="confirmSoleHouseholds"
              label="Bu hanelerin de silinmesini onaylıyorum"
              color="error"
              density="compact"
              hide-details
              class="mb-3"
            />
          </template>

          <UiForm @submit="submit">
            <UiTextField
              v-model="password"
              label="Parola"
              type="password"
              density="comfortable"
              autocomplete="current-password"
              class="mb-3"
              :disabled="isBlocked || busy"
            />
            <UiAlert v-if="errors.length" type="error" variant="tonal" density="compact" class="mb-3">
              <div v-for="(e, i) in errors" :key="i">{{ e }}</div>
            </UiAlert>
            <UiBtn type="submit" color="error" block :loading="busy" :disabled="!canSubmit">
              Hesabımı kalıcı olarak sil
            </UiBtn>
          </UiForm>
        </template>
      </template>
    </div>
  </UiCard>
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
  border-color: rgb(var(--color-error)) !important;
}
</style>
