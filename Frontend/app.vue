<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout :name="layoutName">
      <NuxtPage />
    </NuxtLayout>
    <AppToast />
  </div>
</template>

<script setup lang="ts">
import AppToast from '~/components/UI/AppToast.vue'

const config = useRuntimeConfig()
const route = useRoute()
const { locale } = useI18n()

// html lang: CSS uppercase Türkçede "i"yi "İ" yapsın, ekran okuyucu doğru dili okusun
useHead({ htmlAttrs: { lang: locale } })

const layoutName = computed(() => {
  if (route.meta.layout === false) return false
  if (typeof route.meta.layout === 'string') return route.meta.layout
  return (config.public.defaultLayout as string) || 'default'
})
</script>
