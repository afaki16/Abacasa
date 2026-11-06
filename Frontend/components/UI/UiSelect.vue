<template>
  <div ref="root" class="ui-select" :class="$attrs.class" :style="$attrs.style as any">
    <UiTextField
      ref="fieldRef"
      :model-value="autocomplete && open ? search : selectedTitle"
      :label="label"
      :label-position="labelPosition"
      :required="required"
      :placeholder="placeholder"
      :prepend-inner-icon="prependInnerIcon"
      :density="density"
      :hide-details="hideDetails"
      :disabled="disabled"
      :readonly="!autocomplete"
      :rules="rules"
      :error-messages="errorMessages"
      :rounded="rounded"
      :bg-color="bgColor"
      :hint="hint"
      :persistent-hint="persistentHint"
      :clearable="clearable && hasSelection"
      class="ui-select__field"
      :class="{ 'ui-select__field--open': open, 'ui-select__field--readonly': !autocomplete }"
      role="combobox"
      :aria-expanded="open"
      :aria-controls="menuId"
      autocomplete="off"
      @update:model-value="onType"
      @click:clear="clear"
      @click="onFieldClick"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeydown"
    >
      <template #append-inner>
        <span class="ui-select__trail" @mousedown.prevent="toggle">
          <UiProgressCircular v-if="loading" indeterminate :size="18" :width="2" color="primary" />
          <UiIcon icon="mdi-menu-down" :size="24" class="ui-select__chevron" :class="{ 'ui-select__chevron--open': open }" />
        </span>
      </template>
    </UiTextField>

    <Teleport to="body">
      <div
        v-if="open"
        :id="menuId"
        ref="menu"
        class="ui-select__menu"
        role="listbox"
        :style="menuStyle"
        @mousedown.prevent
      >
        <button
          v-for="(entry, index) in filtered"
          :key="String(entry.value)"
          type="button"
          role="option"
          class="ui-select__option"
          :class="{ 'ui-select__option--selected': entry.value === modelValue, 'ui-select__option--active': index === activeIndex }"
          :aria-selected="entry.value === modelValue"
          @click="pick(entry)"
          @mousemove="activeIndex = index"
        >
          <slot name="item" :item="entry.raw" :selected="entry.value === modelValue">
            <span class="ui-select__option-title">{{ entry.title }}</span>
          </slot>
        </button>
        <div v-if="!filtered.length" class="ui-select__empty">{{ loading ? $t('ui.select.loading') : (noDataText ?? $t('ui.select.noData')) }}</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { UiRule } from '~/composables/useUiForm'

/**
 * Açılır liste (v-select / v-autocomplete karşılığı). Native <select> koyu temada OS'nin
 * menüsünü çizdiği için menü temaya uygun olarak kendimiz çiziliyor (body'ye taşınır,
 * drawer/tablo içinde kesilmez). Klavye: ↑ ↓ Enter Esc. autocomplete: yazarak süzme.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: any
  items?: any[]
  itemTitle?: string
  itemValue?: string
  label?: string
  labelPosition?: 'top' | 'floating'
  required?: boolean
  placeholder?: string
  prependInnerIcon?: string
  density?: 'default' | 'comfortable' | 'compact'
  hideDetails?: boolean | 'auto'
  disabled?: boolean
  clearable?: boolean
  loading?: boolean
  autocomplete?: boolean
  /** autocomplete'te aranan alanlar (varsayılan: itemTitle) */
  filterKeys?: string[]
  rules?: UiRule[]
  errorMessages?: string | string[]
  rounded?: boolean | string
  bgColor?: string
  hint?: string
  persistentHint?: boolean
  noDataText?: string
}>(), {
  modelValue: undefined, items: () => [], itemTitle: 'title', itemValue: 'value', label: undefined,
  labelPosition: 'top', required: false,
  placeholder: undefined, prependInnerIcon: undefined, density: 'comfortable', hideDetails: false, disabled: false,
  clearable: false, loading: false, autocomplete: false, filterKeys: undefined, rules: undefined,
  errorMessages: undefined, rounded: undefined, bgColor: undefined, hint: undefined, persistentHint: false,
  noDataText: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [value: any] }>()

interface Entry { value: any; title: string; raw: any }

const root = ref<HTMLElement | null>(null)
const fieldRef = ref<any>(null)
const menu = ref<HTMLElement | null>(null)
const open = ref(false)
const search = ref('')
const activeIndex = ref(-1)
const menuStyle = ref<Record<string, string>>({})
const menuId = `ui-select-menu-${Math.random().toString(36).slice(2, 9)}`

const read = (item: any, key: string) => (item !== null && typeof item === 'object' ? item[key] : item)
const entries = computed<Entry[]>(() => props.items.map(raw => ({ value: read(raw, props.itemValue), title: String(read(raw, props.itemTitle) ?? ''), raw })))
const selected = computed(() => entries.value.find(e => e.value === props.modelValue))
const selectedTitle = computed(() => selected.value?.title ?? '')
const hasSelection = computed(() => props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== '')

const filtered = computed(() => {
  if (!props.autocomplete || !search.value.trim()) return entries.value
  const q = search.value.trim().toLocaleLowerCase('tr')
  const keys = props.filterKeys ?? [props.itemTitle]
  return entries.value.filter(e => keys.some(k => String(read(e.raw, k) ?? '').toLocaleLowerCase('tr').includes(q)))
})

const placeMenu = () => {
  const rect = root.value?.querySelector('.ui-field__control')?.getBoundingClientRect()
  if (!rect) return
  const spaceBelow = window.innerHeight - rect.bottom
  const above = spaceBelow < 220 && rect.top > spaceBelow
  menuStyle.value = {
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    ...(above ? { bottom: `${window.innerHeight - rect.top + 4}px` } : { top: `${rect.bottom + 4}px` }),
    maxHeight: `${Math.max(160, Math.min(320, (above ? rect.top : spaceBelow) - 16))}px`,
  }
}

const openMenu = (keepSearch = false) => {
  if (props.disabled || open.value) return
  if (!keepSearch) search.value = ''
  activeIndex.value = Math.max(0, filtered.value.findIndex(e => e.value === props.modelValue))
  placeMenu()
  open.value = true
  nextTick(scrollActiveIntoView)
}
const closeMenu = () => { open.value = false; search.value = '' }
const toggle = () => (open.value ? closeMenu() : (fieldRef.value?.focus(), openMenu()))

const pick = (entry: Entry) => {
  emit('update:modelValue', entry.value)
  closeMenu()
}
const clear = () => { emit('update:modelValue', null); search.value = '' }

const onType = (text: string | null) => {
  if (!props.autocomplete) return
  search.value = text ?? ''
  activeIndex.value = 0
  if (!open.value) openMenu(true)
}
const onFocus = () => { if (props.autocomplete) openMenu() }
// Aramalı alanda tıklama yalnızca açar (odaklanınca zaten açılmıştır); düz seçimde aç/kapa
const onFieldClick = () => (props.autocomplete ? openMenu() : toggle())
const onBlur = () => closeMenu()

const scrollActiveIntoView = () => {
  menu.value?.querySelectorAll('.ui-select__option')[activeIndex.value]?.scrollIntoView({ block: 'nearest' })
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    if (!open.value) return openMenu()
    const n = filtered.value.length
    if (!n) return
    activeIndex.value = (activeIndex.value + (e.key === 'ArrowDown' ? 1 : -1) + n) % n
    nextTick(scrollActiveIntoView)
  } else if (e.key === 'Enter' || (e.key === ' ' && !props.autocomplete)) {
    e.preventDefault()
    if (!open.value) return openMenu()
    const entry = filtered.value[activeIndex.value]
    if (entry) pick(entry)
  } else if (e.key === 'Escape' && open.value) {
    e.stopPropagation()
    closeMenu()
  } else if (e.key === 'Tab') {
    closeMenu()
  }
}

// Sayfa kayarsa/boyut değişirse menü yerini korusun
const reposition = () => open.value && placeMenu()
onMounted(() => {
  window.addEventListener('scroll', reposition, true)
  window.addEventListener('resize', reposition)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', reposition, true)
  window.removeEventListener('resize', reposition)
})

defineExpose({ focus: () => fieldRef.value?.focus(), validate: () => fieldRef.value?.validate(), reset: () => fieldRef.value?.reset() })
</script>

<style scoped>
.ui-select { position: relative; }
.ui-select__field--readonly :deep(.ui-field__control),
.ui-select__field--readonly :deep(.ui-field__input) { cursor: pointer; }
.ui-select__field--readonly :deep(.ui-field__input) { caret-color: transparent; }
.ui-select__trail { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; color: rgb(var(--color-on-surface-variant)); }
.ui-select__chevron { transition: transform 0.2s; }
.ui-select__chevron--open { transform: rotate(180deg); }
</style>

<style>
/* Menü body'ye taşındığı için scoped değil */
.ui-select__menu {
  position: fixed;
  z-index: 2600;
  overflow-y: auto;
  padding: 6px 0;
  border-radius: 6px;
  background: rgb(var(--color-surface-container-lowest));
  color: rgb(var(--color-on-surface));
  border: 1px solid rgb(var(--color-outline-variant) / 0.6);
  box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);
}
.ui-select__option {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 48px;
  padding: 6px 16px;
  text-align: left;
  font-size: 1rem;
  background: none;
  border: 0;
  color: inherit;
  cursor: pointer;
}
.ui-select__option--active { background: rgb(var(--color-on-surface) / 0.04); }
.ui-select__option--selected { background: rgb(var(--color-on-surface) / 0.12); }
.ui-select__option-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-select__empty { padding: 12px 16px; font-size: 0.9rem; color: rgb(var(--color-on-surface-variant)); }
</style>
