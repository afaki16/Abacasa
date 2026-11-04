<template>
  <div ref="rootRef" class="lang-switcher" @keydown.esc="isOpen = false">
    <button
      class="lang-switcher-btn"
      type="button"
      :aria-label="t('common.changeLanguage')"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <span :class="`fi fi-${currentFlag}`" class="lang-flag"></span>
      <span class="lang-code">{{ locale.toUpperCase() }}</span>
      <Icon
        name="mdi:chevron-down"
        class="lang-chevron"
        :class="{ 'lang-chevron--open': isOpen }"
      />
    </button>

    <Transition name="lang-menu">
      <ul
        v-if="isOpen"
        class="lang-list bg-surface-container-lowest text-on-surface border border-solid border-black/[0.12] dark:border-white/[0.12]"
        role="listbox"
      >
        <li
          v-for="loc in availableLocales"
          :key="loc.code"
          role="option"
          :aria-selected="loc.code === locale"
          class="lang-list-item hover:bg-surface-container"
          :class="{ 'bg-surface-container-low': loc.code === locale }"
          tabindex="0"
          @click="switchLocale(loc.code)"
          @keydown.enter.prevent="switchLocale(loc.code)"
        >
          <span :class="`fi fi-${getFlagCode(loc.code)}`" class="lang-flag-list"></span>
          <span class="lang-list-title">{{ loc.name }}</span>
          <Icon
            v-if="loc.code === locale"
            name="mdi:check"
            class="lang-check"
          />
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

const { locale, locales, setLocale, t } = useI18n()

const rootRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)

onClickOutside(rootRef, () => {
  isOpen.value = false
})

const availableLocales = computed(() => {
  return (locales.value as Array<{ code: string; name: string }>)
})

const getFlagCode = (code: string) => {
  if (code === 'en') return 'gb'
  return code
}

const currentFlag = computed(() => getFlagCode(locale.value))

const switchLocale = async (code: string) => {
  isOpen.value = false
  await setLocale(code as any)
}
</script>

<style scoped>
.lang-switcher {
  position: relative;
  display: inline-block;
}

.lang-switcher-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lang-switcher-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.lang-flag {
  width: 20px;
  height: 15px;
  border-radius: 2px;
  display: inline-block;
}

.lang-flag-list {
  width: 24px;
  height: 18px;
  border-radius: 2px;
  display: inline-block;
  flex-shrink: 0;
}

.lang-code {
  letter-spacing: 0.5px;
}

.lang-chevron {
  width: 14px;
  height: 14px;
  opacity: 0.7;
  transition: transform 0.2s ease;
}

.lang-chevron--open {
  transform: rotate(180deg);
}

.lang-list {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 1000;
  min-width: 160px;
  margin: 0;
  padding: 6px;
  list-style: none;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
}

.lang-list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.lang-list-item:focus-visible {
  outline: 2px solid rgb(var(--color-primary));
  outline-offset: -2px;
}

.lang-list-title {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
}

.lang-check {
  width: 18px;
  height: 18px;
  color: #22c55e;
}

.lang-menu-enter-active,
.lang-menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.lang-menu-enter-from,
.lang-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
