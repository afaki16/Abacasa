<template>
  <div class="legal-page">
    <article class="legal-article">
      <NuxtLink to="/" class="legal-back">← Abacasa</NuxtLink>
      <h1 class="legal-title">{{ title }}</h1>
      <p class="legal-meta">Sürüm {{ version ?? '…' }} · Yürürlük: {{ legal.effectiveDate }}</p>
      <slot />
      <nav class="legal-links">
        <NuxtLink :to="LEGAL_ROUTES.privacy">Aydınlatma metni</NuxtLink>
        <span>·</span>
        <NuxtLink :to="LEGAL_ROUTES.terms">Kullanım koşulları</NuxtLink>
      </nav>
    </article>
  </div>
</template>

<script setup lang="ts">
import { legal, LEGAL_ROUTES } from '~/utils/legal'

defineProps<{ title: string; version: string | null }>()
</script>

<style scoped>
/* Uzun metin rahat okunsun: en fazla 720px, belirgin başlık ve maddeler */
.legal-page {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));
  padding: 40px 16px 64px;
}

.legal-article {
  max-width: 720px;
  margin: 0 auto;
  line-height: 1.7;
  font-size: 1rem;
}

.legal-back {
  display: inline-block;
  margin-bottom: 24px;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  font-weight: 600;
}

.legal-title {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.3;
  margin: 0 0 4px;
}

.legal-meta {
  opacity: 0.7;
  margin: 0 0 32px;
}

.legal-article :deep(h2) {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 32px 0 8px;
}

.legal-article :deep(p) {
  margin: 0 0 12px;
}

.legal-article :deep(ul) {
  margin: 0 0 12px;
  padding-left: 24px;
}

.legal-article :deep(li) {
  margin-bottom: 6px;
}

.legal-links {
  display: flex;
  gap: 8px;
  margin-top: 48px;
  opacity: 0.8;
}

.legal-links a {
  color: rgb(var(--v-theme-primary));
}
</style>
