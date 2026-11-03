<template>
  <div class="ui-check" :class="[`ui-check--${density}`, { 'ui-check--disabled': isDisabled, 'ui-check--error': field.hasError.value }]">
    <label class="ui-check__row">
      <span class="ui-check__box" :style="{ '--ui-check-color': uiColor(color) ?? 'rgb(var(--color-brand))' }">
        <input
          type="checkbox"
          :checked="checked"
          :indeterminate="indeterminate"
          :disabled="isDisabled"
          @change="onChange"
          @click="emit('click', $event)"
        />
        <UiIcon :icon="iconName" :size="24" class="ui-check__icon" :class="{ 'ui-check__icon--on': checked || indeterminate }" />
      </span>
      <span v-if="label || $slots.label" class="ui-check__label"><slot name="label">{{ label }}</slot></span>
    </label>
    <div v-if="hideDetails !== true && field.shownMessages.value.length" class="ui-check__details">{{ field.shownMessages.value[0] }}</div>
  </div>
</template>

<script setup lang="ts">
import { useUiField, type UiRule } from '~/composables/useUiForm'

/**
 * Onay kutusu (v-checkbox karşılığı). Tek değer (boolean) ya da dizi modu:
 * modelValue dizi ise `value` dizide var mı diye bakılır ve eklenip çıkarılır.
 */
const props = withDefaults(defineProps<{
  modelValue?: any
  value?: any
  label?: string
  color?: string
  density?: 'default' | 'comfortable' | 'compact'
  disabled?: boolean
  indeterminate?: boolean
  /** true: mesaj gösterilmez · 'auto': yalnızca hata varsa (varsayılan davranışla aynı) */
  hideDetails?: boolean | 'auto'
  rules?: UiRule[]
  trueValue?: any
  falseValue?: any
}>(), {
  modelValue: undefined, value: undefined, label: undefined, color: undefined, density: 'default', disabled: false,
  indeterminate: false, hideDetails: false, rules: undefined, trueValue: true, falseValue: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: any]; click: [event: MouseEvent] }>()

const isArrayMode = computed(() => Array.isArray(props.modelValue))
const checked = computed(() => (isArrayMode.value ? props.modelValue.includes(props.value) : props.modelValue === props.trueValue))
const iconName = computed(() => (props.indeterminate ? 'mdi-minus-box' : checked.value ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'))

const field = useUiField({
  value: computed(() => props.modelValue),
  rules: () => props.rules,
  onReset: () => emit('update:modelValue', isArrayMode.value ? [] : props.falseValue),
})
const isDisabled = computed(() => props.disabled || field.formDisabled.value)

const onChange = (e: Event) => {
  const on = (e.target as HTMLInputElement).checked
  field.touched.value = true
  if (isArrayMode.value) {
    const next = props.modelValue.filter((v: any) => v !== props.value)
    emit('update:modelValue', on ? [...next, props.value] : next)
  } else {
    emit('update:modelValue', on ? props.trueValue : props.falseValue)
  }
}
</script>

<style scoped>
/* Vuetify v-input gibi blok düzeyinde */
.ui-check { display: flex; flex-direction: column; }
.ui-check__row { display: inline-flex; align-items: center; cursor: pointer; min-height: 56px; }
.ui-check--comfortable .ui-check__row { min-height: 48px; }
.ui-check--compact .ui-check__row { min-height: 40px; }
.ui-check__box {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  flex-shrink: 0;
}
.ui-check--compact .ui-check__box { width: 28px; height: 28px; }
.ui-check__box:hover { background: color-mix(in srgb, var(--ui-check-color) 8%, transparent); }
.ui-check__box input { position: absolute; inset: 0; margin: 0; opacity: 0; cursor: pointer; }
.ui-check__box input:focus-visible + .ui-check__icon { outline: 2px solid var(--ui-check-color); outline-offset: 2px; border-radius: 2px; }
.ui-check__icon { color: currentColor; opacity: 0.6; pointer-events: none; }
.ui-check__icon--on { color: var(--ui-check-color); opacity: 1; }
.ui-check__label { display: inline-block; line-height: 1.25; letter-spacing: 0.009375em; }
.ui-check--disabled { opacity: 0.5; pointer-events: none; }
.ui-check--error .ui-check__icon { color: rgb(var(--color-error)); }
.ui-check__details { padding: 0 16px; font-size: 0.75rem; color: rgb(var(--color-error)); }
</style>
