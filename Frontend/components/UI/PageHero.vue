<template>
  <div class="page-hero">
    <div class="page-hero__icon">
      <UiIcon :icon="icon" :size="22" />
    </div>
    <div class="page-hero__text">
      <h1 class="page-hero__title">{{ title }}</h1>
      <p v-if="subtitle" class="page-hero__sub">{{ subtitle }}</p>
    </div>
    <div v-if="count !== undefined && count !== null" class="page-hero__count">
      <div class="page-hero__count-val">{{ count }}</div>
      <div class="page-hero__count-lbl">{{ countLabel }}</div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * Liste sayfalarının üst kartı (Dernify'daki admin-page-hero): ikon, başlık, kısa açıklama
 * ve sağda toplam kayıt sayısı. Altındaki BaseDataTable'a :hide-page-header="true" verilir.
 */
withDefaults(defineProps<{
  icon: string
  title: string
  subtitle?: string
  count?: number | null
  countLabel?: string
}>(), { subtitle: '', count: undefined, countLabel: 'Toplam kayıt' })
</script>

<style scoped>
.page-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  margin-bottom: 14px;
  border: 1px solid rgb(var(--color-outline-variant) / 0.6);
  border-radius: 14px;
  background: linear-gradient(135deg, rgb(var(--color-surface-container-low)) 0%, rgb(var(--color-surface-container)) 100%);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.03);
}

.page-hero__icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgb(var(--color-primary) / 0.14);
  color: rgb(var(--color-primary));
  border: 1px solid rgb(var(--color-primary) / 0.16);
}

.page-hero__text {
  flex: 1;
  min-width: 0;
}

.page-hero__title {
  margin: 0 0 2px;
  font-size: 1.2rem;
  font-weight: 700;
  color: rgb(var(--color-on-surface));
}

.page-hero__sub {
  margin: 0;
  font-size: 0.8125rem;
  color: rgb(var(--color-on-surface-variant));
}

.page-hero__count {
  text-align: right;
}

.page-hero__count-val {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: rgb(var(--color-on-surface));
}

.page-hero__count-lbl {
  font-size: 0.75rem;
  color: rgb(var(--color-on-surface-variant));
}

@media (max-width: 640px) {
  .page-hero__count { display: none; }
}
</style>
