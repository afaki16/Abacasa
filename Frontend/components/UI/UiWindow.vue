<template>
  <div class="ui-window">
    <slot />
  </div>
</template>

<script setup lang="ts">
/** Sekme içerikleri (v-window karşılığı): modelValue ile eşleşen UiWindowItem görünür. */
const props = defineProps<{ modelValue?: string | number | null }>()
provide('ui-window-active', computed(() => props.modelValue))
</script>

<style scoped>
/* Vuetify v-window gibi: overflow hidden içerideki marjların dışarı taşmasını (collapse) önler */
.ui-window { position: relative; overflow: hidden; }
</style>
