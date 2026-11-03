<template>
  <span
    ref="anchor"
    class="ui-tooltip-anchor"
    :aria-describedby="open ? id : undefined"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
  >
    <slot />
  </span>
  <Teleport to="body">
    <Transition name="ui-tooltip">
      <div v-if="open" :id="id" role="tooltip" class="ui-tooltip" :style="style">{{ text }}</div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * İpucu (v-tooltip karşılığı). İçine konan öğenin üzerine gelince/odaklanınca gösterilir;
 * body'ye taşındığı için kart/drawer içinde kesilmez.
 */
const props = withDefaults(defineProps<{
  text: string
  location?: 'top' | 'bottom'
}>(), { location: 'top' })

const anchor = ref<HTMLElement | null>(null)
const open = ref(false)
const style = ref<Record<string, string>>({})
const id = `ui-tooltip-${Math.random().toString(36).slice(2, 9)}`

const show = () => {
  const r = anchor.value?.getBoundingClientRect()
  if (!r) return
  style.value = props.location === 'bottom'
    ? { left: `${r.left + r.width / 2}px`, top: `${r.bottom + 6}px`, transform: 'translateX(-50%)' }
    : { left: `${r.left + r.width / 2}px`, top: `${r.top - 6}px`, transform: 'translate(-50%, -100%)' }
  open.value = true
}
const hide = () => { open.value = false }
</script>

<style scoped>
.ui-tooltip-anchor { display: inline-flex; }
</style>

<style>
.ui-tooltip {
  position: fixed;
  z-index: 2700;
  max-width: 320px;
  padding: 5px 16px;
  border-radius: 4px;
  background: rgb(var(--color-surface-variant));
  color: rgb(var(--color-on-surface-variant));
  font-size: 0.875rem;
  line-height: 1.6;
  pointer-events: none;
}
.ui-tooltip-enter-active, .ui-tooltip-leave-active { transition: opacity 0.15s; }
.ui-tooltip-enter-from, .ui-tooltip-leave-to { opacity: 0; }
</style>
