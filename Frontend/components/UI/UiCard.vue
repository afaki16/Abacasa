<template>
  <div
    class="ui-card"
    :class="{ 'ui-card--border': border }"
    :style="{ borderRadius: radius, boxShadow: shadow, height: cssSize(height) }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * Kart (v-card karşılığı). Projenin Vuetify ayarındaki gibi varsayılan elevation 2.
 * Alt parçalar global sınıflarla: .ui-card-title, .ui-card-text, .ui-card-actions
 */
const props = withDefaults(defineProps<{
  rounded?: string | boolean
  elevation?: number | string
  border?: boolean
  height?: number | string
}>(), { rounded: undefined, elevation: 2, border: false, height: undefined })

const RADII: Record<string, string> = { '0': '0', sm: '2px', lg: '8px', xl: '24px', true: '4px' }
const SHADOWS: Record<number, string> = {
  0: 'none',
  1: '0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12)',
  2: '0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12)',
  4: '0 2px 4px -1px rgba(0,0,0,.2), 0 4px 5px 0 rgba(0,0,0,.14), 0 1px 10px 0 rgba(0,0,0,.12)',
  8: '0 5px 5px -3px rgba(0,0,0,.2), 0 8px 10px 1px rgba(0,0,0,.14), 0 3px 14px 2px rgba(0,0,0,.12)',
}

const radius = computed(() => (props.rounded === undefined ? undefined : RADII[String(props.rounded)]))
const shadow = computed(() => SHADOWS[Number(props.elevation)] ?? SHADOWS[2])
const cssSize = (v?: number | string) => (v === undefined ? undefined : /^\d+$/.test(String(v)) ? `${v}px` : String(v))
</script>

<style scoped>
.ui-card {
  display: block;
  position: relative;
  overflow: hidden;
  overflow-wrap: break-word;
  border-radius: 4px;
  background: rgb(var(--color-surface));
  color: rgb(var(--color-on-surface));
}
.ui-card--border { border: 1px solid rgb(var(--color-on-surface) / 0.12); }
</style>
