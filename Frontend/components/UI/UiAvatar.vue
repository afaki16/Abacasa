<template>
  <div
    class="ui-avatar"
    :class="[`ui-avatar--${variant}`, { 'ui-avatar--colored': !!color }]"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${Math.round(Number(size) * 0.5)}px`,
      borderRadius: radius,
      '--ui-avatar-color': uiColor(color) ?? 'rgb(var(--color-on-surface))',
    }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
/** Avatar kabı (v-avatar karşılığı). İçine ikon, baş harf veya resim konur. */
const props = withDefaults(defineProps<{
  size?: number | string
  color?: string
  variant?: 'flat' | 'tonal' | 'outlined' | 'text'
  rounded?: string | boolean
}>(), { size: 40, color: undefined, variant: 'flat', rounded: undefined })

const radius = computed(() => {
  if (props.rounded === undefined || props.rounded === true) return undefined
  return ({ '0': '0', sm: '2px', lg: '8px', xl: '24px' } as Record<string, string>)[String(props.rounded)]
})
</script>

<style scoped>
.ui-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  overflow: hidden;
  border-radius: 50%;
  line-height: normal;
  vertical-align: middle;
}
.ui-avatar--flat.ui-avatar--colored { background: var(--ui-avatar-color); color: #fff; }
.ui-avatar--tonal { color: var(--ui-avatar-color); background: color-mix(in srgb, var(--ui-avatar-color) 12%, transparent); }
.ui-avatar--outlined { color: var(--ui-avatar-color); border: 1px solid currentColor; }
.ui-avatar--text { color: var(--ui-avatar-color); }
.ui-avatar :deep(img) { width: 100%; height: 100%; object-fit: cover; }
</style>
