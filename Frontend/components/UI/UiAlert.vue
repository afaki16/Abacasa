<template>
  <div
    class="ui-alert"
    :class="[`ui-alert--${variant}`, `ui-alert--${density}`]"
    :style="{ '--ui-alert-color': uiColor(color ?? type) }"
    role="alert"
  >
    <UiIcon v-if="iconName" :icon="iconName" :size="density === 'compact' ? 22 : 28" class="ui-alert__icon" />
    <div class="ui-alert__content">
      <div v-if="title" class="ui-alert__title">{{ title }}</div>
      <slot>{{ text }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Uyarı kutusu (v-alert karşılığı). type: success | info | warning | error */
const props = withDefaults(defineProps<{
  type?: 'success' | 'info' | 'warning' | 'error'
  variant?: 'tonal' | 'flat' | 'outlined'
  density?: 'default' | 'comfortable' | 'compact'
  color?: string
  title?: string
  text?: string
  icon?: string | false
}>(), { type: 'info', variant: 'flat', density: 'default', color: undefined, title: undefined, text: undefined, icon: undefined })

const DEFAULT_ICONS = { success: 'mdi-check-circle', info: 'mdi-information', warning: 'mdi-alert', error: 'mdi-close-circle' }
const iconName = computed(() => (props.icon === false ? null : props.icon ?? DEFAULT_ICONS[props.type]))
</script>

<style scoped>
.ui-alert {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border-radius: 4px;
  font-size: 1rem;
  line-height: 1.5;
}
.ui-alert--comfortable { padding: 12px 16px; }
.ui-alert--compact { padding: 8px 16px; gap: 12px; }
.ui-alert--flat { background: var(--ui-alert-color); color: #fff; }
.ui-alert--tonal { color: var(--ui-alert-color); background: color-mix(in srgb, var(--ui-alert-color) 12%, transparent); }
.ui-alert--outlined { color: var(--ui-alert-color); border: 1px solid currentColor; }
.ui-alert__icon { margin-top: 1px; }
.ui-alert--compact .ui-alert__icon { margin-top: 0; }
.ui-alert__content { flex: 1 1 auto; min-width: 0; align-self: center; }
.ui-alert__title { font-size: 1.25rem; font-weight: 500; line-height: 1.75rem; }
</style>
