<template>
  <div
    class="ui-tabs"
    :class="{ 'ui-tabs--grow': grow }"
    role="tablist"
    :style="{ '--ui-tabs-color': uiColor(color) ?? 'currentColor', background: uiColor(bgColor) }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
/** Sekme başlıkları (v-tabs karşılığı). İçerik için UiWindow + UiWindowItem kullanılır. */
const props = withDefaults(defineProps<{
  modelValue?: string | number | null
  color?: string
  bgColor?: string
  grow?: boolean
}>(), { modelValue: undefined, color: undefined, bgColor: undefined, grow: false })

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

provide('ui-tabs', {
  active: computed(() => props.modelValue),
  select: (value: string | number) => emit('update:modelValue', value),
})
</script>

<style scoped>
/* Vuetify ölçüsü: sekmeler 48px, kap 56px (altta 8px boşluk) */
.ui-tabs { display: flex; align-items: flex-start; height: 56px; overflow-x: auto; }
.ui-tabs--grow > :deep(.ui-tab) { flex: 1 0 auto; }
</style>
