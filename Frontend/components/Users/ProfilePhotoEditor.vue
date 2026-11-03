<template>
  <div class="photo-editor" :style="{ width: `${size}px`, height: `${size}px` }">
    <UserAvatar :src="url" :initials="initials" :size="size" class="photo-editor__avatar" />

    <div v-if="busy" class="photo-editor__overlay">
      <Icon name="mdi:loading" class="w-6 h-6 animate-spin" />
    </div>

    <button
      type="button"
      class="photo-editor__btn photo-editor__btn--upload"
      :disabled="busy"
      :title="url ? 'Fotoğrafı değiştir' : 'Fotoğraf yükle'"
      @click="fileInput?.click()"
    >
      <Icon name="mdi:camera" class="w-4 h-4" />
    </button>
    <button
      v-if="url"
      type="button"
      class="photo-editor__btn photo-editor__btn--remove"
      :disabled="busy"
      title="Fotoğrafı kaldır"
      @click="remove"
    >
      <Icon name="mdi:delete-outline" class="w-4 h-4" />
    </button>

    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="onFileSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { parseApiErrorMessages } from '~/utils/apiError'

/**
 * Avatar + yükle/kaldır butonları. userId verilmezse kendi fotoğrafı,
 * verilirse (admin) o kullanıcınınki. Değişiklik hemen kaydedilir, "changed" ile bildirilir.
 */
const props = withDefaults(defineProps<{
  url?: string | null
  initials?: string
  userId?: number | string | null
  size?: number
}>(), { url: null, initials: '', userId: null, size: 96 })

const emit = defineEmits<{ changed: [url: string | null] }>()

const { validatePhoto, uploadPhoto, removePhoto } = useProfilePhoto()
const toast = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const busy = ref(false)

const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // aynı dosya tekrar seçilebilsin
  if (!file) return

  const error = validatePhoto(file)
  if (error) {
    toast.error(error)
    return
  }

  busy.value = true
  try {
    const url = await uploadPhoto(file, props.userId)
    emit('changed', url)
    toast.success('Profil fotoğrafı güncellendi.')
  } catch (err) {
    toast.error(parseApiErrorMessages(err)[0] || 'Fotoğraf yüklenemedi.')
  } finally {
    busy.value = false
  }
}

const remove = async () => {
  busy.value = true
  try {
    await removePhoto(props.userId)
    emit('changed', null)
    toast.success('Profil fotoğrafı kaldırıldı.')
  } catch (err) {
    toast.error(parseApiErrorMessages(err)[0] || 'Fotoğraf kaldırılamadı.')
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.photo-editor {
  position: relative;
  flex-shrink: 0;
}
.photo-editor__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
}
.photo-editor__btn {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  border: 2px solid #fff;
  color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease;
}
.photo-editor__btn:hover:not(:disabled) {
  transform: scale(1.08);
}
.photo-editor__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.photo-editor__btn--upload {
  right: -2px;
  bottom: -2px;
  background: rgb(var(--color-primary));
}
.photo-editor__btn--remove {
  left: -2px;
  bottom: -2px;
  background: rgb(var(--color-error));
}
</style>
