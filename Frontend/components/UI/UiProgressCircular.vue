<template>
  <span
    class="ui-progress-circular"
    role="progressbar"
    :aria-valuenow="indeterminate ? undefined : modelValue"
    :style="{ width: `${size}px`, height: `${size}px`, color: uiColor(color) }"
  >
    <svg :viewBox="`0 0 ${box} ${box}`" :class="{ 'ui-progress-circular__spin': indeterminate }">
      <circle class="ui-progress-circular__track" :cx="box / 2" :cy="box / 2" :r="radius" :stroke-width="width" fill="none" />
      <circle
        class="ui-progress-circular__bar"
        :class="{ 'ui-progress-circular__bar--indeterminate': indeterminate }"
        :cx="box / 2"
        :cy="box / 2"
        :r="radius"
        :stroke-width="width"
        fill="none"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="indeterminate ? undefined : circumference * (1 - Math.min(100, Math.max(0, modelValue)) / 100)"
      />
    </svg>
  </span>
</template>

<script setup lang="ts">
/** Dairesel ilerleme (v-progress-circular karşılığı). */
const props = withDefaults(defineProps<{
  indeterminate?: boolean
  modelValue?: number
  size?: number | string
  width?: number | string
  color?: string
}>(), { indeterminate: false, modelValue: 0, size: 32, width: 4, color: undefined })

const box = 48
const radius = computed(() => (box - Number(props.width) * (box / Number(props.size))) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
</script>

<style scoped>
.ui-progress-circular { display: inline-flex; vertical-align: middle; }
.ui-progress-circular svg { width: 100%; height: 100%; }
.ui-progress-circular__track { stroke: currentColor; opacity: 0.12; }
.ui-progress-circular__bar { stroke: currentColor; stroke-linecap: round; transform: rotate(-90deg); transform-origin: center; transition: stroke-dashoffset 0.3s; }
.ui-progress-circular__spin { animation: ui-pc-rotate 1.4s linear infinite; }
.ui-progress-circular__bar--indeterminate { animation: ui-pc-dash 1.4s ease-in-out infinite; stroke-dasharray: 80, 200; stroke-dashoffset: 0; }
@keyframes ui-pc-rotate { 100% { transform: rotate(360deg); } }
@keyframes ui-pc-dash {
  0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 100, 200; stroke-dashoffset: -15; }
  100% { stroke-dasharray: 100, 200; stroke-dashoffset: -125; }
}
</style>
