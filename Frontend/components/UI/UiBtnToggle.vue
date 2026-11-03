<template>
  <div
    class="ui-btn-toggle"
    :class="[`ui-btn-toggle--${density}`, { 'ui-btn-toggle--divided': divided }]"
    :style="{ '--ui-toggle-color': uiColor(color) ?? 'rgb(var(--color-on-surface))' }"
    role="group"
  >
    <button
      v-for="item in items"
      :key="String(item.value)"
      type="button"
      class="ui-btn-toggle__btn"
      :class="{ 'ui-btn-toggle__btn--active': item.value === modelValue }"
      :aria-pressed="item.value === modelValue"
      :disabled="disabled || item.disabled"
      @click="select(item.value)"
    >
      <UiIcon v-if="item.icon" :icon="item.icon" :size="18" class="ui-btn-toggle__icon" />
      {{ item.title }}
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * Seçenek düğmeleri (v-btn-toggle karşılığı; Vuetify'daki variant="outlined" görünüm).
 * Seçenekler `items` ile verilir: { title, value, icon?, disabled? }.
 * mandatory: seçili düğmeye yeniden tıklamak seçimi kaldırmaz.
 */
export interface UiBtnToggleItem {
  title: string
  value: any
  icon?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue?: any
  items: UiBtnToggleItem[]
  mandatory?: boolean
  color?: string
  density?: 'default' | 'comfortable' | 'compact'
  divided?: boolean
  disabled?: boolean
}>(), { modelValue: undefined, mandatory: false, color: undefined, density: 'default', divided: false, disabled: false })

const emit = defineEmits<{ 'update:modelValue': [value: any] }>()

const select = (value: any) => {
  if (value === props.modelValue) {
    if (!props.mandatory) emit('update:modelValue', null)
    return
  }
  emit('update:modelValue', value)
}
</script>

<style scoped>
.ui-btn-toggle {
  display: inline-flex;
  max-width: 100%;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid rgb(var(--color-on-surface) / 0.38);
}
.ui-btn-toggle__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 48px;
  padding: 0 16px;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.0892em;
  white-space: nowrap;
  color: rgb(var(--color-on-surface));
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}
.ui-btn-toggle--comfortable .ui-btn-toggle__btn { height: 40px; }
.ui-btn-toggle--compact .ui-btn-toggle__btn { height: 32px; }
.ui-btn-toggle--divided .ui-btn-toggle__btn + .ui-btn-toggle__btn { border-left: 1px solid rgb(var(--color-on-surface) / 0.38); }
.ui-btn-toggle__btn:hover { background: rgb(var(--color-on-surface) / 0.04); }
.ui-btn-toggle__btn:focus-visible { outline: 2px solid var(--ui-toggle-color); outline-offset: -2px; }
.ui-btn-toggle__btn--active {
  color: var(--ui-toggle-color);
  background: color-mix(in srgb, var(--ui-toggle-color) 12%, transparent);
}
.ui-btn-toggle__btn--active:hover { background: color-mix(in srgb, var(--ui-toggle-color) 16%, transparent); }
.ui-btn-toggle__btn:disabled { opacity: 0.38; cursor: default; pointer-events: none; }
</style>
