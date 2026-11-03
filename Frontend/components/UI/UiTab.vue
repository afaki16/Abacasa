<template>
  <button
    type="button"
    role="tab"
    class="ui-tab"
    :class="{ 'ui-tab--active': isActive }"
    :aria-selected="isActive"
    :tabindex="isActive ? 0 : -1"
    @click="tabs?.select(value)"
  >
    <UiIcon v-if="prependIcon" :icon="prependIcon" :size="18" class="ui-tab__icon" />
    <slot />
    <span class="ui-tab__slider" />
  </button>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'

/** Tek sekme başlığı (v-tab karşılığı); UiTabs içinde kullanılır. */
const props = defineProps<{ value: string | number; prependIcon?: string }>()
const tabs = inject<{ active: ComputedRef<string | number | null | undefined>; select: (v: string | number) => void } | null>('ui-tabs', null)
const isActive = computed(() => tabs?.active.value === props.value)
</script>

<style scoped>
.ui-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 90px;
  max-width: 360px;
  height: 48px;
  padding: 0 16px;
  border: 0;
  background: transparent;
  color: rgb(var(--color-on-surface) / 0.7);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.0892em;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s;
}
.ui-tab:hover { background: rgb(var(--color-on-surface) / 0.04); }
.ui-tab--active { color: var(--ui-tabs-color); }
.ui-tab__icon { margin-left: -2px; }
.ui-tab__slider {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: currentColor;
  opacity: 0;
  transition: opacity 0.2s;
}
.ui-tab--active .ui-tab__slider { opacity: 1; }
</style>
