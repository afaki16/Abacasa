<template>
  <div class="ui-switch" :class="[`ui-switch--${density}`, { 'ui-switch--on': on, 'ui-switch--disabled': isDisabled }]">
    <label class="ui-switch__row">
      <span class="ui-switch__control" :style="{ '--ui-switch-color': uiColor(color) ?? 'rgb(var(--color-brand))' }">
        <input
          type="checkbox"
          role="switch"
          :checked="on"
          :disabled="isDisabled"
          :aria-checked="on"
          @change="onChange"
        />
        <span class="ui-switch__track" />
        <span class="ui-switch__thumb" />
      </span>
      <span v-if="label || $slots.label" class="ui-switch__label"><slot name="label">{{ label }}</slot></span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { UI_FORM_KEY } from '~/composables/useUiForm'

/** Anahtar (v-switch karşılığı). true-value / false-value desteklenir. */
const props = withDefaults(defineProps<{
  modelValue?: any
  label?: string
  color?: string
  disabled?: boolean
  density?: 'default' | 'comfortable' | 'compact'
  hideDetails?: boolean
  trueValue?: any
  falseValue?: any
}>(), {
  modelValue: undefined, label: undefined, color: undefined, disabled: false, density: 'default',
  hideDetails: false, trueValue: true, falseValue: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: any] }>()
const form = inject(UI_FORM_KEY, null)
const isDisabled = computed(() => props.disabled || !!form?.disabled.value)
const on = computed(() => props.modelValue === props.trueValue)
const onChange = (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).checked ? props.trueValue : props.falseValue)
</script>

<style scoped>
/* Blok düzeyinde (inline olursa satır boşluğu ekler) */
.ui-switch { display: flex; flex-direction: column; }
.ui-switch__row { display: inline-flex; align-items: center; gap: 10px; min-height: 40px; cursor: pointer; }
.ui-switch--comfortable .ui-switch__row { min-height: 36px; }
.ui-switch--compact .ui-switch__row { min-height: 32px; }
/* Dernify görünümü: 40×24 dolu iz, 16px beyaz düğme; açıkken marka rengi */
.ui-switch__control { position: relative; display: inline-flex; width: 40px; height: 24px; flex-shrink: 0; }
.ui-switch__control input { position: absolute; inset: 0; margin: 0; opacity: 0; cursor: pointer; z-index: 1; }
.ui-switch__track {
  width: 40px;
  height: 24px;
  border-radius: 9999px;
  background: rgb(var(--color-outline-variant));
  transition: background-color 0.2s;
}
.ui-switch__thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.ui-switch--on .ui-switch__track { background: var(--ui-switch-color); }
.ui-switch--on .ui-switch__thumb { transform: translateX(16px); }
.ui-switch__control input:focus-visible ~ .ui-switch__track { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ui-switch-color) 25%, transparent); }
.ui-switch__label { font-size: 0.875rem; color: rgb(var(--color-on-surface)); }
.ui-switch--disabled { opacity: 0.5; pointer-events: none; }
</style>
