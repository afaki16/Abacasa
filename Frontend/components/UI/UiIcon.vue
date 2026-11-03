<template>
  <Icon
    :name="iconName"
    class="ui-icon"
    :class="{ 'ui-icon--start': start, 'ui-icon--end': end }"
    :style="{ fontSize: sizeCss, width: '1em', height: '1em', color: uiColor(color) }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
/**
 * MDI ikonu (v-icon karşılığı). icon="mdi-account" veya "mdi:account" kabul eder.
 * size piksel (sayı) ya da CSS değeri (varsayılan Vuetify gibi 1.5em: çevredeki yazıya göre); color tema adı (primary, error…) veya CSS rengi.
 */
const props = withDefaults(defineProps<{
  icon: string
  size?: number | string
  color?: string
  /** Metnin önünde/arkasında boşluklu ikon (Vuetify v-icon start / end) */
  start?: boolean
  end?: boolean
}>(), { size: '1.5em', color: undefined, start: false, end: false })

const iconName = computed(() => props.icon.replace(/^mdi-/, 'mdi:'))
const sizeCss = computed(() => (typeof props.size === 'number' || /^\d+$/.test(String(props.size)) ? `${props.size}px` : String(props.size)))
</script>

<style scoped>
.ui-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
