<template>
  <Transition name="ui-window-item">
    <div v-if="booted" v-show="isActive" class="ui-window-item">
      <slot />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'

/**
 * UiWindow içindeki tek sekme içeriği (v-window-item karşılığı). Vuetify gibi tembel:
 * sekme ilk açılana kadar render edilmez (içindeki alanlar form doğrulamasına girmez),
 * açıldıktan sonra DOM'da kalır (girilen değerler korunur).
 */
const props = defineProps<{ value: string | number }>()
const active = inject<ComputedRef<string | number | null | undefined> | null>('ui-window-active', null)
const isActive = computed(() => active?.value === props.value)
const booted = ref(isActive.value)
watch(isActive, (v) => { if (v) booted.value = true })
</script>

<style scoped>
.ui-window-item-enter-active { transition: opacity 0.2s ease; }
.ui-window-item-leave-active { display: none; }
.ui-window-item-enter-from { opacity: 0; }
</style>
