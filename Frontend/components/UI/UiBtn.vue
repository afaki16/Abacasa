<template>
  <button
    :type="type"
    class="ui-btn"
    :class="[
      `ui-btn--${variant}`,
      `ui-btn--size-${size}`,
      { 'ui-btn--block': block, 'ui-btn--icon': iconOnly, 'ui-btn--loading': loading, 'ui-btn--colored': !!color, 'ui-btn--disabled': disabled },
    ]"
    :style="[
      color ? { '--ui-btn-color': uiColor(color), '--ui-btn-on': lightColor ? 'rgba(0,0,0,.87)' : '#fff' } : {},
      elevation !== undefined ? { boxShadow: shadow } : {},
    ]"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <span class="ui-btn__content">
      <UiIcon v-if="prependIcon" :icon="prependIcon" :size="iconSize" class="ui-btn__prepend" />
      <UiIcon v-if="iconOnly && icon" :icon="icon" :size="iconSize" />
      <slot />
      <UiIcon v-if="appendIcon" :icon="appendIcon" :size="iconSize" class="ui-btn__append" />
    </span>
    <span v-if="loading" class="ui-btn__loader">
      <UiProgressCircular indeterminate :size="iconSize + 5" :width="2" />
    </span>
  </button>
</template>

<script setup lang="ts">
/**
 * Buton (v-btn karşılığı; Vuetify varsayılanlarımızdaki gibi variant="flat", büyük harf yok).
 * variant: flat | elevated | outlined | text | tonal | plain
 * size: x-small | small | default | large | x-large · icon: yalnızca ikonlu yuvarlak buton
 */
const props = withDefaults(defineProps<{
  variant?: 'flat' | 'elevated' | 'outlined' | 'text' | 'tonal' | 'plain'
  color?: string
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
  loading?: boolean
  disabled?: boolean
  prependIcon?: string
  appendIcon?: string
  icon?: string | boolean
  /** Gölge derinliği (Vuetify elevation: 0–24, sık kullanılanlar) */
  elevation?: number | string
}>(), {
  variant: 'flat', color: undefined, size: 'default', type: 'button',
  block: false, loading: false, disabled: false, prependIcon: undefined, appendIcon: undefined, icon: undefined, elevation: undefined,
})

// Açık renk zeminde (white, grey-lighten-*) koyu yazı — Vuetify'nın on-color davranışı
const lightColor = computed(() => /^(white|grey-lighten-[1-5])$/.test(props.color ?? ''))
const iconOnly = computed(() => !!props.icon)
const SHADOWS: Record<number, string> = {
  0: 'none',
  2: '0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12)',
  4: '0 2px 4px -1px rgba(0,0,0,.2), 0 4px 5px 0 rgba(0,0,0,.14), 0 1px 10px 0 rgba(0,0,0,.12)',
  8: '0 5px 5px -3px rgba(0,0,0,.2), 0 8px 10px 1px rgba(0,0,0,.14), 0 3px 14px 2px rgba(0,0,0,.12)',
}
const shadow = computed(() => SHADOWS[Number(props.elevation)] ?? SHADOWS[8])
const icon = computed(() => (typeof props.icon === 'string' ? props.icon : undefined))
const iconSize = computed(() => (iconOnly.value
  ? { 'x-small': 16, small: 20, default: 22, large: 26, 'x-large': 28 }
  : { 'x-small': 14, small: 16, default: 18, large: 20, 'x-large': 22 })[props.size])
</script>

<style scoped>
.ui-btn {
  --ui-btn-color: rgb(var(--color-on-surface));
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  max-width: 100%;
  font-weight: 500;
  letter-spacing: 0.0892em;
  line-height: 1;
  white-space: nowrap;
  border-radius: 4px;
  border: 0 solid transparent;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s, box-shadow 0.2s, opacity 0.2s, color 0.2s;
  outline: none;
}
.ui-btn:focus-visible { box-shadow: 0 0 0 3px rgb(var(--color-brand) / 0.3); }
.ui-btn:disabled { cursor: default; pointer-events: none; }

.ui-btn__content { display: inline-flex; align-items: center; }
.ui-btn__prepend { margin-left: calc(var(--ui-btn-h) / -12); margin-right: calc(var(--ui-btn-h) / 4.5); }
.ui-btn__append { margin-left: calc(var(--ui-btn-h) / 4.5); margin-right: calc(var(--ui-btn-h) / -12); }
.ui-btn--loading .ui-btn__content { opacity: 0; }
.ui-btn__loader { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }

/* Sizes (Vuetify ölçüleri) */
.ui-btn--size-x-small { --ui-btn-h: 20px; height: 20px; min-width: 36px; padding: 0 8px; font-size: 0.625rem; }
.ui-btn--size-small { --ui-btn-h: 28px; height: 28px; min-width: 50px; padding: 0 12px; font-size: 0.75rem; }
.ui-btn--size-default { --ui-btn-h: 36px; height: 36px; min-width: 64px; padding: 0 16px; font-size: 0.875rem; }
.ui-btn--size-large { --ui-btn-h: 44px; height: 44px; min-width: 78px; padding: 0 20px; font-size: 1rem; }
.ui-btn--size-x-large { --ui-btn-h: 52px; height: 52px; min-width: 92px; padding: 0 24px; font-size: 1.125rem; }
.ui-btn--block { display: flex; width: 100%; }
/* İkon butonu Vuetify'daki gibi buton yüksekliği + 12px kare */
.ui-btn--icon { padding: 0; min-width: 0; border-radius: 50%; }
.ui-btn--icon.ui-btn--size-x-small { width: 32px; height: 32px; }
.ui-btn--icon.ui-btn--size-small { width: 40px; height: 40px; }
.ui-btn--icon.ui-btn--size-default { width: 48px; height: 48px; }
.ui-btn--icon.ui-btn--size-large { width: 56px; height: 56px; }
.ui-btn--icon.ui-btn--size-x-large { width: 64px; height: 64px; }

/* Variants */
.ui-btn--flat, .ui-btn--elevated {
  background: rgb(var(--color-surface-container-low));
  color: rgb(var(--color-on-surface));
}
.ui-btn--flat.ui-btn--colored, .ui-btn--elevated.ui-btn--colored {
  background: var(--ui-btn-color);
  color: var(--ui-btn-on, #fff);
}
.ui-btn--elevated { box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12); }
.ui-btn--outlined { background: transparent; color: var(--ui-btn-color); border: 1px solid currentColor; }
.ui-btn--text, .ui-btn--plain { background: transparent; color: var(--ui-btn-color); }
.ui-btn--tonal { color: var(--ui-btn-color); background: color-mix(in srgb, var(--ui-btn-color) 12%, transparent); }
.ui-btn--plain { opacity: 0.62; }
.ui-btn--plain:hover { opacity: 1; }

/* Hover / active overlay (Vuetify'daki gibi currentColor'ın hafif tonu) */
.ui-btn--outlined:hover, .ui-btn--text:hover, .ui-btn--tonal:hover {
  background-image: linear-gradient(color-mix(in srgb, currentColor 6%, transparent), color-mix(in srgb, currentColor 6%, transparent));
}
.ui-btn--flat:hover, .ui-btn--elevated:hover { filter: brightness(0.96); }
.ui-btn:active { filter: brightness(0.92); }

/* Pasif renkli buton rengini korur, üstüne açık bir örtü gelir (Vuetify görünümü) */
.ui-btn--disabled.ui-btn--flat, .ui-btn--disabled.ui-btn--elevated {
  box-shadow: none;
  background-image: linear-gradient(rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.45));
}
.ui-btn--disabled.ui-btn--flat:not(.ui-btn--colored), .ui-btn--disabled.ui-btn--elevated:not(.ui-btn--colored) {
  background: rgb(var(--color-surface));
  background-image: linear-gradient(rgb(var(--color-on-surface) / 0.08), rgb(var(--color-on-surface) / 0.08));
  color: rgb(var(--color-on-surface) / 0.26);
}
.ui-btn--disabled.ui-btn--outlined, .ui-btn--disabled.ui-btn--text,
.ui-btn--disabled.ui-btn--tonal, .ui-btn--disabled.ui-btn--plain { opacity: 0.38; }
</style>
