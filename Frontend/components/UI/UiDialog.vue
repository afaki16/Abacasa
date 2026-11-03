<template>
  <Teleport to="body">
    <Transition name="ui-dialog">
      <div
        v-if="modelValue"
        class="ui-dialog"
        :class="contentClass"
        role="dialog"
        aria-modal="true"
        @keydown.esc="onEsc"
      >
        <div class="ui-dialog__scrim" @click="onOutside" />
        <div
          ref="panel"
          class="ui-dialog__panel"
          :class="{ 'ui-dialog__panel--shake': shaking }"
          :style="{ maxWidth: cssSize(maxWidth), width: cssSize(width) ?? 'calc(100% - 48px)' }"
          tabindex="-1"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Modal pencere (v-dialog karşılığı). v-model ile açılır; Esc ve dışarı tıklama kapatır
 * (persistent ise kapatmaz, Vuetify'daki gibi hafifçe sallanır). Açıkken sayfa kaydırılmaz,
 * odak pencereye taşınır ve kapanınca önceki öğeye döner.
 */
const props = withDefaults(defineProps<{
  modelValue?: boolean
  maxWidth?: number | string
  width?: number | string
  persistent?: boolean
  contentClass?: string
}>(), { modelValue: false, maxWidth: undefined, width: undefined, persistent: false, contentClass: undefined })

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const panel = ref<HTMLElement | null>(null)
const shaking = ref(false)
let previousFocus: HTMLElement | null = null

const cssSize = (v?: number | string) => (v === undefined ? undefined : /^\d+$/.test(String(v)) ? `${v}px` : String(v))

const close = () => emit('update:modelValue', false)
const reject = () => {
  shaking.value = true
  setTimeout(() => { shaking.value = false }, 150)
}
const onOutside = () => (props.persistent ? reject() : close())
const onEsc = () => (props.persistent ? reject() : close())

watch(() => props.modelValue, async (open) => {
  if (!import.meta.client) return
  if (open) {
    previousFocus = document.activeElement as HTMLElement | null
    document.documentElement.classList.add('ui-dialog-open')
    await nextTick()
    const autofocus = panel.value?.querySelector<HTMLElement>('[autofocus]')
    ;(autofocus ?? panel.value)?.focus()
  } else {
    document.documentElement.classList.remove('ui-dialog-open')
    previousFocus?.focus?.()
  }
}, { immediate: true })

onBeforeUnmount(() => document.documentElement.classList.remove('ui-dialog-open'))
</script>

<style scoped>
.ui-dialog {
  position: fixed;
  inset: 0;
  z-index: 2400;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ui-dialog__scrim { position: absolute; inset: 0; background: rgba(33, 33, 33, 0.46); }
.ui-dialog__panel {
  position: relative;
  max-height: calc(100% - 48px);
  overflow-y: auto;
  outline: none;
}
.ui-dialog__panel--shake { animation: ui-dialog-shake 0.15s ease-in-out; }
@keyframes ui-dialog-shake { 50% { transform: scale(1.03); } }

.ui-dialog-enter-active, .ui-dialog-leave-active { transition: opacity 0.2s ease; }
.ui-dialog-enter-active .ui-dialog__panel, .ui-dialog-leave-active .ui-dialog__panel { transition: transform 0.2s ease; }
.ui-dialog-enter-from, .ui-dialog-leave-to { opacity: 0; }
.ui-dialog-enter-from .ui-dialog__panel, .ui-dialog-leave-to .ui-dialog__panel { transform: scale(0.95); }
</style>

<style>
/* Açık pencere varken sayfa kaydırılmasın */
html.ui-dialog-open { overflow: hidden; }
</style>
