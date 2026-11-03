<template>
  <div
    class="ui-progress-linear"
    role="progressbar"
    :aria-valuenow="indeterminate ? undefined : modelValue"
    :style="{ height: `${height}px`, color: uiColor(color) ?? 'rgb(var(--color-brand))', borderRadius: rounded ? '9999px' : undefined }"
  >
    <div class="ui-progress-linear__track" />
    <div v-if="indeterminate" class="ui-progress-linear__bar ui-progress-linear__bar--indeterminate" />
    <div v-else class="ui-progress-linear__bar" :style="{ width: `${Math.min(100, Math.max(0, modelValue))}%` }" />
  </div>
</template>

<script setup lang="ts">
/** Yatay ilerleme çubuğu (v-progress-linear karşılığı). */
withDefaults(defineProps<{
  indeterminate?: boolean
  modelValue?: number
  height?: number | string
  color?: string
  rounded?: boolean
}>(), { indeterminate: false, modelValue: 0, height: 4, color: undefined, rounded: false })
</script>

<style scoped>
.ui-progress-linear { position: relative; width: 100%; overflow: hidden; }
.ui-progress-linear__track { position: absolute; inset: 0; background: currentColor; opacity: 0.12; }
.ui-progress-linear__bar { position: absolute; top: 0; bottom: 0; left: 0; background: currentColor; transition: width 0.3s; border-radius: inherit; }
.ui-progress-linear__bar--indeterminate { width: 40%; animation: ui-pl-slide 1.6s ease-in-out infinite; }
@keyframes ui-pl-slide {
  0% { left: -40%; }
  100% { left: 100%; }
}
</style>
