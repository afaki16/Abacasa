<template>
  <span
    class="ui-chip"
    :class="[`ui-chip--${variant}`, `ui-chip--size-${size}`, { 'ui-chip--colored': !!color }]"
    :style="{ '--ui-chip-color': uiColor(color) ?? 'rgb(var(--color-on-surface))', borderRadius: radius }"
  >
    <UiIcon v-if="prependIcon" :icon="prependIcon" size="1.2857em" class="ui-chip__prepend" />
    <slot>{{ text }}</slot>
    <UiIcon v-if="appendIcon" :icon="appendIcon" size="1.2857em" class="ui-chip__append" />
  </span>
</template>

<script setup lang="ts">
/** Etiket (v-chip karşılığı). variant: tonal (varsayılan) | flat | outlined */
const props = withDefaults(defineProps<{
  color?: string
  variant?: 'tonal' | 'flat' | 'outlined' | 'text'
  size?: 'x-small' | 'small' | 'default' | 'large'
  prependIcon?: string
  appendIcon?: string
  text?: string
  rounded?: string | boolean
}>(), { color: undefined, variant: 'tonal', size: 'default', prependIcon: undefined, appendIcon: undefined, text: undefined, rounded: undefined })

const radius = computed(() => {
  if (props.rounded === undefined || props.rounded === true || props.rounded === 'pill') return undefined
  return ({ '0': '0', sm: '2px', lg: '8px', xl: '24px' } as Record<string, string>)[String(props.rounded)] ?? undefined
})
</script>

<style scoped>
.ui-chip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  border-radius: 9999px;
  white-space: nowrap;
  vertical-align: middle;
  font-weight: 400;
  line-height: 1;
}
/* Vuetify ölçüleri: ikon 1.2857em, ikon boşlukları yükseklik / 5.2 */
.ui-chip--size-x-small { --ui-chip-h: 20px; height: 20px; padding: 0 8px; font-size: 0.625rem; }
.ui-chip--size-small { --ui-chip-h: 26px; height: 26px; padding: 0 10px; font-size: 0.75rem; }
.ui-chip--size-default { --ui-chip-h: 32px; height: 32px; padding: 0 12px; font-size: 0.875rem; }
.ui-chip--size-large { --ui-chip-h: 38px; height: 38px; padding: 0 14px; font-size: 1rem; }
.ui-chip--tonal { color: var(--ui-chip-color); background: color-mix(in srgb, var(--ui-chip-color) 12%, transparent); }
.ui-chip--flat { color: #fff; background: var(--ui-chip-color); }
.ui-chip--outlined { color: var(--ui-chip-color); border: 1px solid currentColor; }
.ui-chip--text { color: var(--ui-chip-color); }
.ui-chip__prepend { margin-left: calc(var(--ui-chip-h) / -5.2); margin-right: calc(var(--ui-chip-h) / 5.2); }
.ui-chip__append { margin-left: calc(var(--ui-chip-h) / 5.2); margin-right: calc(var(--ui-chip-h) / -5.2); }
</style>
