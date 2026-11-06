<template>
  <!-- Profil sayfasındaki panel kartı (global-admin.css .panel-card), tehlike tonunda -->
  <div class="panel-card delete-account-card">
    <div class="panel-card__header">
      <div class="panel-card__icon panel-card__icon--danger"><UiIcon icon="mdi-account-remove" :size="16" /></div>
      <span class="text-error">{{ $t('account.delete.title') }}</span>
    </div>
    <div class="panel-card__divider" />

    <div class="panel-card__body">
      <p class="panel-card__hint">
        {{ $t('account.delete.hint') }}
      </p>

      <UiBtn v-if="!opened" color="error" variant="outlined" @click="open">{{ $t('account.delete.start') }}</UiBtn>

      <template v-else>
        <div v-if="loadingPreview" class="py-4 text-center">
          <UiProgressCircular indeterminate color="error" />
        </div>

        <template v-else-if="preview">
          <UiAlert v-if="preview.isLastSuperAdmin" type="error" variant="tonal" density="compact" class="mb-3">
            {{ $t('account.delete.lastSuperAdmin') }}
          </UiAlert>
          <UiAlert v-if="preview.blockedHouseholds.length" type="warning" variant="tonal" density="compact" class="mb-3">
            {{ $t('account.delete.blockedHouseholds', { names: names(preview.blockedHouseholds) }) }}
          </UiAlert>
          <template v-if="preview.householdsToDelete.length">
            <UiAlert type="warning" variant="tonal" density="compact" class="mb-2">
              {{ $t('account.delete.householdsToDelete', { names: names(preview.householdsToDelete) }) }}
            </UiAlert>
            <UiCheckbox
              v-model="confirmSoleHouseholds"
              :label="$t('account.delete.confirmHouseholds')"
              color="error"
              density="compact"
              hide-details
              class="mb-3"
            />
          </template>

          <UiForm @submit="submit">
            <UiTextField
              v-model="password"
              :label="$t('account.delete.password')"
              placeholder="••••••••"
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
              {{ $t('account.delete.submit') }}
            </UiBtn>
          </UiForm>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AccountDeletionPreview, HouseholdRef } from '~/types'
import { parseApiErrorMessages } from '~/utils/apiError'

const { t } = useI18n()
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
    errors.value = parseApiErrorMessages(error, t('account.delete.failed'))
    busy.value = false
  }
}
</script>

<style scoped>
.delete-account-card {
  border-color: rgb(var(--color-error) / 0.5);
}
</style>
