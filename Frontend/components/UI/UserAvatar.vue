<template>
  <div
    class="user-avatar"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.38)}px` }"
  >
    <img v-if="resolvedSrc && !failed" :src="resolvedSrc" alt="" class="user-avatar__img" @error="failed = true" />
    <span v-else>{{ initials || '?' }}</span>
  </div>
</template>

<script setup lang="ts">
/** Profil fotoğrafı varsa onu, yoksa (ya da yüklenemezse) baş harfleri gösterir. */
const props = withDefaults(defineProps<{
  src?: string | null
  initials?: string
  size?: number
}>(), { src: null, initials: '', size: 40 })

const failed = ref(false)
const resolvedSrc = computed(() => resolveFileUrl(props.src))
watch(() => props.src, () => { failed.value = false })
</script>

<style scoped>
.user-avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 9999px;
  background: rgb(var(--color-primary) / 0.15);
  color: rgb(var(--color-primary));
  font-weight: 700;
  line-height: 1;
}
.user-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
