<template>
  <slot name="activator" :props="activatorProps" :is-active="isOpen" />
  <Teleport to="body">
    <Transition name="ui-menu">
      <div
        v-if="isOpen"
        ref="panel"
        class="ui-menu"
        :class="contentClass"
        role="menu"
        :style="panelStyle"
        tabindex="-1"
        @click="onContentClick"
      >
        <slot :close="() => close(true)" />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Açılır menü (v-menu karşılığı). Etkinleştirici `#activator="{ props }"` slotuyla verilir;
 * `v-bind="props"` tıklamayı ve aria özniteliklerini bağlar. İçerik body'ye taşınır
 * (kart/drawer içinde kesilmez), etkinleştiriciye göre konumlanır.
 * Esc, dışarı tıklama ve (closeOnContentClick ise) içerikte bir öğeye tıklama menüyü kapatır;
 * Esc ile kapanınca odak etkinleştiriciye döner.
 * İçerik için liste sınıfları: .ui-list > .ui-list-item (bkz. global-admin.css).
 */
const props = withDefaults(defineProps<{
  modelValue?: boolean
  /** Konum: "bottom start" | "bottom end" | "top start" | "top end" (Vuetify location) */
  location?: 'bottom start' | 'bottom end' | 'top start' | 'top end'
  /** Etkinleştiriciyle menü arasındaki boşluk (px) */
  offset?: number | string
  minWidth?: number | string
  maxHeight?: number | string
  closeOnContentClick?: boolean
  disabled?: boolean
  contentClass?: string
}>(), {
  modelValue: undefined, location: 'bottom start', offset: 8, minWidth: undefined, maxHeight: undefined,
  closeOnContentClick: true, disabled: false, contentClass: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const internalOpen = ref(false)
const isOpen = computed(() => props.modelValue ?? internalOpen.value)
const panel = ref<HTMLElement | null>(null)
const anchor = ref<HTMLElement | null>(null)
const position = ref<Record<string, string>>({})

const cssSize = (v?: number | string) => (v === undefined ? undefined : /^\d+$/.test(String(v)) ? `${v}px` : String(v))

const setOpen = (value: boolean) => {
  internalOpen.value = value
  emit('update:modelValue', value)
}

const place = () => {
  const r = anchor.value?.getBoundingClientRect()
  if (!r) return
  const gap = Number(props.offset) || 0
  const [vertical, horizontal] = props.location.split(' ')
  position.value = {
    ...(vertical === 'top' ? { bottom: `${window.innerHeight - r.top + gap}px` } : { top: `${r.bottom + gap}px` }),
    ...(horizontal === 'end' ? { right: `${window.innerWidth - r.right}px` } : { left: `${r.left}px` }),
  }
}

const panelStyle = computed(() => ({
  ...position.value,
  minWidth: cssSize(props.minWidth),
  maxHeight: cssSize(props.maxHeight),
}))

const open = async (el: HTMLElement | null) => {
  if (props.disabled) return
  anchor.value = el
  place()
  setOpen(true)
  await nextTick()
  panel.value?.focus()
}

const close = (restoreFocus = false) => {
  if (!isOpen.value) return
  setOpen(false)
  if (restoreFocus) anchor.value?.focus?.()
}

const activatorProps = computed(() => ({
  onClick: (e: MouseEvent) => (isOpen.value ? close() : open(e.currentTarget as HTMLElement)),
  'aria-haspopup': 'menu',
  'aria-expanded': isOpen.value ? 'true' : 'false',
}))

const onContentClick = (e: MouseEvent) => {
  if (!props.closeOnContentClick) return
  // Yalnızca tıklanabilir bir öğe (buton, link, menü öğesi) menüyü kapatır; boş alana tıklama kapatmaz
  const target = e.target as HTMLElement
  if (target.closest('button:not(:disabled), a, [role="menuitem"]:not([aria-disabled="true"])')) close()
}

const onDocumentPointer = (e: PointerEvent) => {
  const target = e.target as Node
  if (panel.value?.contains(target) || anchor.value?.contains(target)) return
  close()
}
const onViewportChange = () => place()
const onKeydown = (e: KeyboardEvent) => { if (e.key === 'Escape') close(true) }

watch(isOpen, (value) => {
  if (!import.meta.client) return
  if (value) {
    document.addEventListener('pointerdown', onDocumentPointer, true)
    document.addEventListener('keydown', onKeydown)
    window.addEventListener('resize', onViewportChange)
    window.addEventListener('scroll', onViewportChange, true)
  } else {
    removeListeners()
  }
})

const removeListeners = () => {
  document.removeEventListener('pointerdown', onDocumentPointer, true)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
}

onBeforeUnmount(removeListeners)

defineExpose({ close })
</script>

<style>
/* Menü body'ye taşındığı için scoped değil */
.ui-menu {
  position: fixed;
  z-index: 2500;
  overflow-y: auto;
  border-radius: 12px;
  background: rgb(var(--color-surface-container-lowest));
  color: rgb(var(--color-on-surface));
  border: 1px solid rgb(var(--color-outline-variant) / 0.6);
  box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);
  outline: none;
}
.ui-menu-enter-active, .ui-menu-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.ui-menu-enter-from, .ui-menu-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
